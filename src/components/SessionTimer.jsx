import { useEffect, useState } from 'react';
import { SESSION_MS } from '../constants.js';

const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function SessionTimer({ status, startedAt, onComplete }) {
  const [remaining, setRemaining] = useState(SESSION_MS);

  useEffect(() => {
    if (status !== 'playing') return undefined;
    // Elapsed time comes from the clock, so render frequency never affects accuracy.
    const tick = () => {
      const left = SESSION_MS - (performance.now() - startedAt);
      if (left <= 0) { setRemaining(0); onComplete(); } else setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [status, startedAt, onComplete]);

  useEffect(() => {
    if (status === 'ready') setRemaining(SESSION_MS);
    if (status === 'complete') setRemaining(0);
  }, [status]);

  const shown = status === 'stopped' ? SESSION_MS : remaining;
  const pct = ((SESSION_MS - shown) / SESSION_MS) * 100;

  return (
    <div>
      <div className="clock" aria-live="off">{fmt(shown)}</div>
      <div className="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(pct)}>
        <span style={{ width: `${pct}%` }} />
      </div>
      {status === 'complete'
        ? <p className="done" role="alert">Session Complete. Start a new session when you are ready.</p>
        : <p className="hint">30-minute session. Changing settings does not restart the timer.</p>}
    </div>
  );
}
