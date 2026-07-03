// audio.js — tiny synthesized retro SFX via WebAudio. No external audio files.

let actx = null;
function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function tone({ freq = 440, duration = 0.1, type = 'square', gain = 0.15, slideTo = null, delay = 0 }) {
  const ac = ctx();
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise({ duration = 0.2, gain = 0.2, delay = 0 }) {
  const ac = ctx();
  const t0 = ac.currentTime + delay;
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(g).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  blip: () => tone({ freq: 660, duration: 0.05, type: 'square', gain: 0.1 }),
  point: () => tone({ freq: 880, duration: 0.09, type: 'square', gain: 0.12, slideTo: 1400 }),
  hit: () => noise({ duration: 0.12, gain: 0.18 }),
  explosion: () => noise({ duration: 0.35, gain: 0.25 }),
  jump: () => tone({ freq: 300, duration: 0.12, type: 'triangle', gain: 0.15, slideTo: 600 }),
  laser: () => tone({ freq: 900, duration: 0.08, type: 'sawtooth', gain: 0.08, slideTo: 200 }),
  gameOver: () => {
    tone({ freq: 300, duration: 0.18, type: 'square', gain: 0.15 });
    tone({ freq: 220, duration: 0.18, type: 'square', gain: 0.15, delay: 0.15 });
    tone({ freq: 140, duration: 0.3, type: 'square', gain: 0.15, delay: 0.3 });
  },
  clear: () => {
    [660, 880, 1100, 1320].forEach((f, i) => tone({ freq: f, duration: 0.09, type: 'square', gain: 0.12, delay: i * 0.06 }));
  },
};
