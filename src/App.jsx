import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AudioEngine } from './audioEngine.js';
import { FREQUENCIES, INTENSITIES, STIMULI } from './constants.js';
import AudioControls from './components/AudioControls.jsx';
import StimulusSelector from './components/StimulusSelector.jsx';
import IntensityControl from './components/IntensityControl.jsx';
import SessionTimer from './components/SessionTimer.jsx';
import AudioVisualizer from './components/AudioVisualizer.jsx';

const KEY = 'ats-settings-v2';
const DEFAULTS = { stimulus: 'pure', frequency: 1000, intensity: 40, volume: 0.8, muted: false };

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      stimulus: STIMULI.some((x) => x.id === s.stimulus) ? s.stimulus : DEFAULTS.stimulus,
      frequency: FREQUENCIES.includes(s.frequency) ? s.frequency : DEFAULTS.frequency,
      intensity: INTENSITIES.includes(s.intensity) ? s.intensity : DEFAULTS.intensity,
      volume: typeof s.volume === 'number' ? Math.min(1, Math.max(0, s.volume)) : DEFAULTS.volume,
      muted: !!s.muted,
    };
  } catch { return { ...DEFAULTS }; }
}

// Single authoritative state. status: ready | playing | stopped | complete
function reducer(state, a) {
  switch (a.type) {
    case 'set': return { ...state, ...a.patch };
    case 'play': return { ...state, status: 'playing', startedAt: a.at };
    case 'stop': return { ...state, status: 'stopped', startedAt: null };
    case 'complete': return { ...state, status: 'complete', startedAt: null };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, () => ({ ...loadSettings(), status: 'ready', startedAt: null }));
  const [error, setError] = useState(null);
  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = new AudioEngine();
  const engine = engineRef.current;
  const playing = state.status === 'playing';

  // Push settings to the engine and persist them
  useEffect(() => {
    const { stimulus, frequency, intensity, volume, muted } = state;
    engine.update({ stimulus, frequency, intensity, volume, muted });
    try { localStorage.setItem(KEY, JSON.stringify({ stimulus, frequency, intensity, volume, muted })); } catch { /* storage unavailable */ }
  }, [engine, state.stimulus, state.frequency, state.intensity, state.volume, state.muted]);

  useEffect(() => () => engine.dispose(), [engine]);
  useEffect(() => {
    const stop = () => engine.stop();
    window.addEventListener('pagehide', stop);
    return () => window.removeEventListener('pagehide', stop);
  }, [engine]);

  const set = useCallback((patch) => dispatch({ type: 'set', patch }), []);

  const start = useCallback(async () => {
    setError(null);
    try {
      await engine.start();
      dispatch({ type: 'play', at: performance.now() });
    } catch (e) {
      setError(e.message || 'Audio could not start. Check that your browser allows sound, then try again.');
    }
  }, [engine]);

  const stop = useCallback(() => { engine.stop(); dispatch({ type: 'stop' }); }, [engine]);
  const complete = useCallback(() => { engine.stop(); dispatch({ type: 'complete' }); }, [engine]);

  const stim = STIMULI.find((s) => s.id === state.stimulus);
  const statusLabel = { ready: 'Ready', playing: 'Playing', stopped: 'Stopped', complete: 'Complete' }[state.status];

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Adaptive Tinnitus Sound Therapy</h1>
          <p>Personalized sound stimulus controls for tinnitus management research</p>
        </div>
        <span className={`status status-${state.status}`} role="status">{statusLabel}</span>
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      <main className="layout">
        <section className="panel controls" aria-label="Sound therapy controls">
          <h2>Sound therapy</h2>
          <AudioControls
            status={state.status} onStart={start} onStop={stop}
            frequency={state.frequency} onFrequency={(frequency) => set({ frequency })}
            usesFrequency={stim.usesFrequency}
            volume={state.volume} onVolume={(volume) => set({ volume })}
            muted={state.muted} onMute={() => set({ muted: !state.muted })}
          />
          <StimulusSelector value={state.stimulus} onChange={(stimulus) => set({ stimulus })} />
          <IntensityControl value={state.intensity} onChange={(intensity) => set({ intensity })} />
        </section>

        <div className="side">
          <section className="panel" aria-label="Audio visualization">
            <h2>Live spectrum</h2>
            <AudioVisualizer engine={engine} frequency={state.frequency} active={playing && !state.muted && state.intensity > 0} />
            <dl className="readout">
              <div><dt>Stimulus</dt><dd>{stim.name}</dd></div>
              <div><dt>Frequency</dt><dd>{state.frequency} Hz{stim.usesFrequency ? '' : ' (reference)'}</dd></div>
              <div><dt>Intensity</dt><dd>{state.intensity} / 60</dd></div>
              <div><dt>Output</dt><dd>{state.muted ? 'Muted' : state.intensity === 0 ? 'Silent' : 'On'}</dd></div>
            </dl>
          </section>
          <section className="panel" aria-label="Session">
            <h2>Session</h2>
            <SessionTimer status={state.status} startedAt={state.startedAt} onComplete={complete} />
          </section>
        </div>
      </main>

      <section className="panel info" aria-label="About the stimuli">
        <h2>About the stimuli</h2>
        <div className="info-grid">
          {STIMULI.map((s) => (<div key={s.id}><h3>{s.name}</h3><p>{s.info}</p></div>))}
        </div>
        <p className="note">Intensity is a digital control value from 0 to 60. It is not a calibrated sound pressure level, and actual loudness depends on your device and headphones. Start low. This is a research tool and not a medical device.</p>
      </section>
    </div>
  );
}
