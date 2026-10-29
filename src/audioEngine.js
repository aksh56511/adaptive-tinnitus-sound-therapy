// Audio graph, fully independent from React.
//
// pure   : osc ------------------------------> gain \
// white  : noise[0] -------------------------> gain  |
// pink   : noise[1] -------------------------> gain  +-> intensity -> master -> mute
// narrow : noise[0] -> bandpass -------------> gain  |     -> play -> limiter -> analyser -> out
// notched: noise[1] -> notch -> notch -------> gain /
const TC = 0.03; // smoothing time constant (s), prevents clicks
const BAND_Q = 10;
const NOTCH_Q = 1.4; // ~1 octave wide, two stages for depth
const TARGET_RMS = 0.35;

// Digital step -> linear gain. 0 is silent; 60 is full scale; ~0.5 dB per step.
// This is a relative control value, not a calibrated SPL.
export const intensityToGain = (i) => (i <= 0 ? 0 : Math.pow(10, ((i - 60) * 0.5) / 20));

export class AudioEngine {
  constructor() {
    this.params = { stimulus: 'pure', frequency: 1000, intensity: 0, volume: 0.6, muted: false };
    this.ctx = null; this.g = null; this.initPromise = null;
    this.playing = false; this.suspendTimer = null;
  }
  get analyser() { return this.g ? this.g.analyser : null; }

  init() {
    if (!this.initPromise) {
      this.initPromise = this._build().catch((e) => { this.initPromise = null; throw e; });
    }
    return this.initPromise;
  }

  async _build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx || !window.AudioWorkletNode) throw new Error('This browser does not support the Web Audio features this app needs.');
    const ctx = new Ctx({ latencyHint: 'playback' });
    try {
      await ctx.audioWorklet.addModule(`${import.meta.env.BASE_URL}audio-worklet.js`);
    } catch (e) { ctx.close(); throw new Error('Could not load the audio processor.'); }

    const noise = new AudioWorkletNode(ctx, 'noise-generator', { numberOfInputs: 0, numberOfOutputs: 2, outputChannelCount: [1, 1] });
    const osc = new OscillatorNode(ctx, { type: 'sine', frequency: this.params.frequency });
    const mk = () => new GainNode(ctx, { gain: 0 });
    const branch = { pure: mk(), white: mk(), pink: mk(), narrow: mk(), notched: mk() };
    const bp = new BiquadFilterNode(ctx, { type: 'bandpass', Q: BAND_Q, frequency: this.params.frequency });
    const notches = [0, 1].map(() => new BiquadFilterNode(ctx, { type: 'notch', Q: NOTCH_Q, frequency: this.params.frequency }));

    osc.connect(branch.pure);
    noise.connect(branch.white, 0);
    noise.connect(branch.pink, 1);
    noise.connect(bp, 0); bp.connect(branch.narrow);
    noise.connect(notches[0], 1); notches[0].connect(notches[1]); notches[1].connect(branch.notched);

    const intensity = mk(), master = mk(), mute = new GainNode(ctx, { gain: 1 }), play = mk();
    const limiter = new DynamicsCompressorNode(ctx, { threshold: -3, knee: 0, ratio: 20, attack: 0.003, release: 0.1 });
    const analyser = new AnalyserNode(ctx, { fftSize: 2048, smoothingTimeConstant: 0.8, minDecibels: -90, maxDecibels: -20 });

    Object.values(branch).forEach((n) => n.connect(intensity));
    intensity.connect(master); master.connect(mute); mute.connect(play);
    play.connect(limiter); limiter.connect(analyser); analyser.connect(ctx.destination);
    osc.start();

    this.ctx = ctx;
    this.g = { noise, osc, branch, bp, notches, intensity, master, mute, play, analyser };
    this._apply();
  }

  _branchLevel(id, f) {
    switch (id) {
      case 'pure': return 0.5;
      case 'white': return 0.6;
      case 'narrow': { // keep loudness comparable across centre frequencies
        const bw = f / BAND_Q, nyq = this.ctx.sampleRate / 2;
        return TARGET_RMS / (0.577 * Math.sqrt(Math.PI / 2 * bw / nyq));
      }
      default: return 2;
    }
  }

  update(p) { this.params = { ...this.params, ...p }; this._apply(); }

  _apply() {
    if (!this.g) return;
    const { ctx, g } = this, t = ctx.currentTime;
    const { stimulus, frequency, intensity, volume, muted } = this.params;
    for (const [id, node] of Object.entries(g.branch)) {
      node.gain.setTargetAtTime(id === stimulus ? this._branchLevel(id, frequency) : 0, t, TC);
    }
    g.osc.frequency.setTargetAtTime(frequency, t, TC);
    g.bp.frequency.setTargetAtTime(frequency, t, TC);
    g.notches.forEach((n) => n.frequency.setTargetAtTime(frequency, t, TC));
    g.intensity.gain.setTargetAtTime(intensityToGain(intensity), t, TC);
    g.master.gain.setTargetAtTime(volume * volume, t, TC);
    g.mute.gain.setTargetAtTime(muted ? 0 : 1, t, TC);
  }

  async start() {
    await this.init();
    clearTimeout(this.suspendTimer);
    await this.ctx.resume();
    this._apply();
    this.g.play.gain.setTargetAtTime(1, this.ctx.currentTime, TC);
    this.playing = true;
  }

  stop() {
    if (!this.g) return;
    this.playing = false;
    this.g.play.gain.setTargetAtTime(0, this.ctx.currentTime, TC);
    clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => { if (!this.playing) this.ctx.suspend().catch(() => {}); }, 300);
  }

  dispose() {
    clearTimeout(this.suspendTimer);
    if (this.ctx) this.ctx.close().catch(() => {});
    this.ctx = null; this.g = null; this.initPromise = null; this.playing = false;
  }
}
