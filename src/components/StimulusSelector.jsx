import { STIMULI } from '../constants.js';

export default function StimulusSelector({ value, onChange }) {
  return (
    <fieldset className="field">
      <legend>Stimulus</legend>
      <div className="cards" role="radiogroup" aria-label="Stimulus">
        {STIMULI.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={s.id === value}
            className={s.id === value ? 'card on' : 'card'} onClick={() => onChange(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
