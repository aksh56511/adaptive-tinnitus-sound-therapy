import { useEffect, useRef } from 'react';

const MIN = 100, MAX = 12000, BARS = 72;
const LABELS = [[100, '100'], [1000, '1k'], [2000, '2k'], [4000, '4k'], [10000, '10k']];
const xAt = (f, w) => (Math.log(f / MIN) / Math.log(MAX / MIN)) * w;

export default function AudioVisualizer({ engine, frequency, active }) {
  const ref = useRef(null);
  const live = useRef({ frequency, active });
  live.current = { frequency, active };

  useEffect(() => {
    const c = ref.current, x = c.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent').trim(), ink = css.getPropertyValue('--muted').trim(), mark = css.getPropertyValue('--warn').trim();
    let raf, data = null;
    const resize = () => {
      const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      c.width = r.width * d; c.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(c);

    const draw = () => {
      const W = c.clientWidth, H = c.clientHeight - 20;
      x.clearRect(0, 0, W, H + 20);
      const an = engine.analyser;
      let hz = 1;
      if (an) {
        if (!data || data.length !== an.frequencyBinCount) data = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(data); hz = an.context.sampleRate / an.fftSize;
      }
      const bw = W / BARS;
      x.fillStyle = accent;
      for (let i = 0; i < BARS; i++) {
        const f0 = MIN * Math.pow(MAX / MIN, i / BARS), f1 = MIN * Math.pow(MAX / MIN, (i + 1) / BARS);
        let v = 0;
        if (an) {
          const a = Math.floor(f0 / hz), b = Math.max(a, Math.ceil(f1 / hz));
          for (let k = a; k <= b && k < data.length; k++) v = Math.max(v, data[k]);
        }
        const h = Math.max(2, (v / 255) * H);
        x.globalAlpha = 0.85;
        x.fillRect(i * bw + 1, H - h, bw - 2, h);
      }
      x.globalAlpha = 1;
      const mx = xAt(live.current.frequency, W);
      x.strokeStyle = mark; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(mx, 0); x.lineTo(mx, H); x.stroke(); x.setLineDash([]);
      x.fillStyle = ink; x.font = '11px system-ui, sans-serif'; x.textAlign = 'center';
      LABELS.forEach(([f, t]) => x.fillText(t, Math.min(W - 10, Math.max(10, xAt(f, W))), H + 14));
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [engine]);

  return <canvas ref={ref} className="viz" role="img" aria-label={active ? 'Live frequency spectrum of the sound being played' : 'Frequency spectrum, currently silent'} />;
}
