# Adaptive Tinnitus Sound Therapy

React + Web Audio API (AudioWorklet) sound therapy app. No backend, no external APIs.

## Run
```
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview   # production build
```
Requires Node 18+ and a current Chrome, Edge, Firefox or Safari (AudioWorklet support).
AudioWorklet needs a secure context: localhost or HTTPS.

## Structure
- `public/audio-worklet.js` white and pink noise generator (runs on the audio thread)
- `src/audioEngine.js` audio graph, filters, smoothing, gain mapping (no React)
- `src/App.jsx` single reducer holding all settings and session state
- `src/components/` AudioControls, StimulusSelector, IntensityControl, SessionTimer, AudioVisualizer
- `src/constants.js` stimuli, frequencies, 30-minute duration

## Tuning
Per-stimulus loudness matching lives in `_branchLevel` and the intensity curve (0.5 dB per step) in `intensityToGain`, both in `audioEngine.js`. Intensity is a relative digital value, not calibrated SPL.
