export const SESSION_MS = 30 * 60 * 1000;
export const FREQUENCIES = [1000, 2000, 3000, 4000];
export const INTENSITIES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
export const STIMULI = [
  { id: 'pure', name: 'Pure Tone', usesFrequency: true,
    info: 'A steady sine wave at the selected frequency. Use it to match the pitch of the tinnitus.' },
  { id: 'white', name: 'White Noise', usesFrequency: false,
    info: 'Random noise with equal energy at every frequency. It sounds bright and hissy and masks a wide range of pitches. The frequency setting is kept for reference only.' },
  { id: 'pink', name: 'Pink Noise', usesFrequency: false,
    info: 'Noise with equal energy per octave. It sounds softer and deeper than white noise. The frequency setting is kept for reference only.' },
  { id: 'narrow', name: 'Narrow-Band Noise', usesFrequency: true,
    info: 'Noise squeezed into a narrow band around the selected frequency. It masks that pitch region without the sharpness of a pure tone.' },
  { id: 'notched', name: 'Notched Pink Noise', usesFrequency: true,
    info: 'Pink noise with a gap cut out at the selected frequency. It is used in research on notched-sound approaches.' },
];
