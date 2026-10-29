// Continuous white + pink noise generator. Output 0 = white, output 1 = pink.
class NoiseGenerator extends AudioWorkletProcessor {
  constructor() {
    super();
    this.b0 = this.b1 = this.b2 = this.b3 = this.b4 = this.b5 = this.b6 = 0;
    this.xPrev = 0; this.yPrev = 0; // DC blocker state
  }
  process(inputs, outputs) {
    const white = outputs[0][0];
    const pink = outputs[1][0];
    for (let i = 0; i < white.length; i++) {
      const w = Math.random() * 2 - 1;
      // Paul Kellet's refined pink filter (-3 dB/octave)
      this.b0 = 0.99886 * this.b0 + w * 0.0555179;
      this.b1 = 0.99332 * this.b1 + w * 0.0750759;
      this.b2 = 0.969 * this.b2 + w * 0.153852;
      this.b3 = 0.8665 * this.b3 + w * 0.3104856;
      this.b4 = 0.55 * this.b4 + w * 0.5329522;
      this.b5 = -0.7616 * this.b5 - w * 0.016898;
      const p = (this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + w * 0.5362) * 0.11;
      this.b6 = w * 0.115926;
      // One-pole DC blocker
      const y = p - this.xPrev + 0.995 * this.yPrev;
      this.xPrev = p; this.yPrev = y;
      white[i] = w;
      pink[i] = y;
    }
    return true;
  }
}
registerProcessor('noise-generator', NoiseGenerator);
