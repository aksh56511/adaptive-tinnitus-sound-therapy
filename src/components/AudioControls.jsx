import { FREQUENCIES } from '../constants.js';

export default function AudioControls({ status, onStart, onStop, frequency, onFrequency, usesFrequency, volume, onVolume, muted, onMute }) {
  const playing = status === 'playing';
  return (
    <div className="stack">
      <button type="button" className={`play ${playing ? 'is-playing' : ''}`} onClick={playing ? onStop : onStart}>
        {playing ? 'Stop session' : status === 'complete' ? 'Start new session' : 'Start session'}
      </button>

      <fieldset className="field">
        <legend>Frequency</legend>
        <div className="segments" role="radiogroup" aria-label="Frequency">
          {FREQUENCIES.map((f) => (
            <button key={f} type="button" role="radio" aria-checked={f === frequency}
              className={f === frequency ? 'seg on' : 'seg'} onClick={() => onFrequency(f)}>
              {f} Hz
            </button>
          ))}
        </div>
        {!usesFrequency && <p className="hint">This stimulus covers the whole spectrum. The frequency is shown for reference only.</p>}
      </fieldset>

      <div className="field">
        <label htmlFor="vol">Master volume <output>{Math.round(volume * 100)}%</output></label>
        <div className="row">
          <input id="vol" type="range" min="0" max="1" step="0.01" value={volume}
            style={{ '--pct': `${volume * 100}%` }} onChange={(e) => onVolume(Number(e.target.value))} />
          <button type="button" className={`mute ${muted ? 'on' : ''}`} aria-pressed={muted} onClick={onMute}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      </div>
    </div>
  );
}
