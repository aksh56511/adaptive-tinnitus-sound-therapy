export default function IntensityControl({ value, onChange }) {
  const clamp = (v) => Math.min(60, Math.max(0, v));
  return (
    <div className="field">
      <label htmlFor="int">Intensity <output>{value}</output></label>
      <div className="row">
        <button type="button" className="step" aria-label="Decrease intensity" disabled={value <= 0} onClick={() => onChange(clamp(value - 5))}>−</button>
        <input id="int" type="range" min="0" max="60" step="5" value={value}
          style={{ '--pct': `${(value / 60) * 100}%` }} onChange={(e) => onChange(clamp(Math.round(Number(e.target.value) / 5) * 5))} />
        <button type="button" className="step" aria-label="Increase intensity" disabled={value >= 60} onClick={() => onChange(clamp(value + 5))}>+</button>
      </div>
      <p className="hint">{value === 0 ? 'Silent' : 'Digital setting, 0 to 60 in steps of 5'}</p>
    </div>
  );
}
