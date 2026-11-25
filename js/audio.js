// Sound: effects and music, all made with WebAudio at run time (no sound files, nothing to download).
//
// - Effects are short recipes (oscillators, filtered noise, FM bells) rendered once into buffers when the sound is
//   unlocked (an OfflineAudioContext), then played as cheap buffer voices with a little pitch and volume variation.
// - Music is a small generative engine: one track per place (the camp; the Crypt, Sewers and Warren; a boss track in
//   the dungeon's key), a calm layer always on and a fight layer that rises when enemies are awake. Places cross-fade.
// - What happened comes from js/sfx.js (cue() one-liners plus a per-frame watcher of the run); this file decides what
//   each cue sounds like and how often it may play (a cap per sound and per group per second, and a voice limit).
// - iOS: nothing plays until the first tap (unlockAudio on pointerdown). Settings (master, effects, music, mute) are
//   kept in localStorage under 'delve-audio'; the camp's settings sheet shows them (soundSettingsHtml).
//
// Main loop: audioFrame({ state, run, speed, quiet, project }) once per animation frame.
import { listen, drain, watchRun, cue } from './sfx.js';
import { DEFS } from './units.js';

// ---------------------------------------------------------------- settings
const KEY = 'delve-audio';
export const settings = { master: 0.8, sfx: 0.8, music: 0.5, mute: false };
try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (const k in settings) if (typeof s[k] === typeof settings[k]) settings[k] = s[k]; } catch (e) { /* no storage */ }
function keep() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* no storage */ } }

// ---------------------------------------------------------------- building blocks (any BaseAudioContext)
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const noiseBufs = new WeakMap();
function noiseBuf(c, color = 'white') {
  let m = noiseBufs.get(c); if (!m) noiseBufs.set(c, (m = {}));
  if (m[color]) return m[color];
  const n = Math.floor(c.sampleRate * 2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 2 - 1;
    if (color === 'brown') { last = (last + 0.02 * x) / 1.02; d[i] = last * 3.5; }
    else if (color === 'pink') { b0 = 0.99765 * b0 + x * 0.099046; b1 = 0.963 * b1 + x * 0.2965164; b2 = 0.57 * b2 + x * 1.0526913; d[i] = (b0 + b1 + b2 + x * 0.1848) * 0.2; }
    else d[i] = x;
  }
  return (m[color] = b);
}
// a percussive envelope: up to v in a, down to nothing by dur; with rel, an attack-hold-release instead
function env(p, t, a, v, dur, rel) {
  p.setValueAtTime(0, t); p.linearRampToValueAtTime(v, t + a);
  if (rel) { p.setValueAtTime(v, t + Math.max(a, dur)); p.linearRampToValueAtTime(0, t + Math.max(a, dur) + rel); }
  else p.exponentialRampToValueAtTime(0.0005, t + Math.max(a + 0.005, dur));
}
const end = (p) => p.dur + (p.rel || 0) + 0.05;
// a tone: { type, f, f2 (glide to, over g), dur, a, v, rel, vib (Hz deep), vibF, det (cents), lp, lp2, q, steps }
function T(c, o, t, p) {
  const n = c.createOscillator(); n.type = p.type || 'sine'; if (p.det) n.detune.value = p.det;
  n.frequency.setValueAtTime(p.f, t);
  if (p.f2 && p.f2 !== p.f) n.frequency.exponentialRampToValueAtTime(p.f2, t + (p.g || p.dur));
  if (p.steps) for (const [dt, f] of p.steps) n.frequency.setValueAtTime(f, t + dt);
  if (p.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = p.vibF || 5; lg.gain.value = p.vib; l.connect(lg).connect(n.frequency); l.start(t); l.stop(t + end(p)); }
  const e = c.createGain(); env(e.gain, t, p.a ?? 0.004, p.v ?? 0.5, p.dur, p.rel);
  let last = n;
  if (p.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = p.q ?? 0.7; f.frequency.setValueAtTime(p.lp, t); if (p.lp2) f.frequency.exponentialRampToValueAtTime(p.lp2, t + (p.lpg || p.dur)); n.connect(f); last = f; }
  last.connect(e).connect(o);
  n.start(t); n.stop(t + end(p));
}
// filtered noise: { dur, a, v, ft (filter type), f, f2, g, q, color, rel }
function N(c, o, t, p) {
  const s = c.createBufferSource(); s.buffer = noiseBuf(c, p.color); s.loop = true;
  const f = c.createBiquadFilter(); f.type = p.ft || 'bandpass'; f.Q.value = p.q ?? 1;
  f.frequency.setValueAtTime(p.f || 1000, t); if (p.f2 && p.f2 !== p.f) f.frequency.exponentialRampToValueAtTime(p.f2, t + (p.g || p.dur));
  const e = c.createGain(); env(e.gain, t, p.a ?? 0.003, p.v ?? 0.5, p.dur, p.rel);
  s.connect(f).connect(e).connect(o); s.start(t, Math.random() * 1.5); s.stop(t + end(p));
}
// an FM bell: { f, ratio, index, dur, v, a }
function B(c, o, t, p) {
  const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), e = c.createGain();
  car.frequency.value = p.f; mod.frequency.value = p.f * (p.ratio || 3.5);
  const ix = p.f * (p.index ?? 2); mg.gain.setValueAtTime(ix, t); mg.gain.exponentialRampToValueAtTime(ix * 0.04 + 0.01, t + p.dur);
  mod.connect(mg).connect(car.frequency);
  env(e.gain, t, p.a ?? 0.002, p.v ?? 0.3, p.dur);
  car.connect(e).connect(o); car.start(t); mod.start(t); car.stop(t + p.dur + 0.05); mod.stop(t + p.dur + 0.05);
}
// a few quick clicks, scattered: wood, bone, ice crackle
function clicks(c, o, t, n, span, f0, f1, v, q = 6, rnd = Math.random) {
  for (let i = 0; i < n; i++) { const dt = rnd() * span, f = f0 + rnd() * (f1 - f0); N(c, o, t + dt, { f, q, dur: 0.025, v: v * (0.6 + rnd() * 0.4) }); }
}
const thump = (c, o, t, f, f2, dur, v) => T(c, o, t, { f, f2, dur, v, a: 0.002 });
const pluck = (c, o, t, f, dur, v, bright = 2400) => { T(c, o, t, { type: 'triangle', f, dur, v, lp: bright, lp2: bright * 0.4 }); T(c, o, t, { f: f * 2, dur: dur * 0.3, v: v * 0.25 }); };
const whoosh = (c, o, t, f, f2, dur, v, q = 1.3) => N(c, o, t, { f, f2, q, dur, a: dur * 0.45, v });
const brass = (c, o, t, f, dur, v, lp = 1800) => { for (const det of [-6, 6]) T(c, o, t, { type: 'sawtooth', f, det, dur, a: 0.03, v, rel: 0.25, lp: 300, lp2: lp, lpg: 0.08, q: 1 }); };

// ---------------------------------------------------------------- the effects
// name: [length s, recipe(c, out, t, rnd, variant), { lvl (peak it's normalised to), cap (per s), prio 1..3, group,
//         pv (pitch jitter), vars (variants rendered), duck (music dips under it), pos (placed in the room) }]
const NOTE = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, G5: 79, A5: 81, C6: 84, E6: 88, G6: 91 };
const nf = (n) => mtof(NOTE[n]);
const HIT = { cap: 6, group: 'hit', prio: 1, vars: 3, pos: 1 };
export const SOUNDS = {
  // impacts, by what's being hit and how hard
  hit_flesh_l: [0.16, (c, o, t) => { N(c, o, t, { f: 1100, f2: 300, q: 1.2, dur: 0.09, v: 0.5 }); thump(c, o, t, 170, 70, 0.12, 0.7); N(c, o, t, { ft: 'lowpass', f: 600, dur: 0.05, v: 0.4 }); }, { ...HIT, lvl: 0.42 }],
  hit_flesh_h: [0.32, (c, o, t) => { thump(c, o, t, 120, 42, 0.28, 0.9); N(c, o, t, { ft: 'lowpass', f: 1400, f2: 180, dur: 0.24, v: 0.7 }); N(c, o, t, { f: 2600, q: 0.8, dur: 0.05, v: 0.35 }); }, { ...HIT, lvl: 0.62, prio: 2 }],
  hit_bone_l: [0.14, (c, o, t, r) => { clicks(c, o, t, 3, 0.04, 900, 2200, 0.6, 7, r); T(c, o, t, { type: 'triangle', f: 700 + r() * 300, f2: 500, dur: 0.06, v: 0.35 }); thump(c, o, t, 200, 100, 0.07, 0.4); }, { ...HIT, lvl: 0.4 }],
  hit_bone_h: [0.3, (c, o, t, r) => { clicks(c, o, t, 7, 0.12, 700, 2400, 0.7, 7, r); T(c, o, t, { type: 'triangle', f: 520, f2: 330, dur: 0.1, v: 0.4 }); thump(c, o, t, 130, 50, 0.22, 0.8); N(c, o, t, { ft: 'lowpass', f: 1600, f2: 300, dur: 0.15, v: 0.4 }); }, { ...HIT, lvl: 0.6, prio: 2 }],
  hit_slime_l: [0.2, (c, o, t) => { N(c, o, t, { ft: 'lowpass', f: 900, f2: 220, q: 7, dur: 0.16, v: 0.6 }); T(c, o, t, { f: 320, f2: 120, dur: 0.13, v: 0.35, vib: 30, vibF: 30 }); }, { ...HIT, lvl: 0.4 }],
  hit_slime_h: [0.34, (c, o, t) => { N(c, o, t, { ft: 'lowpass', f: 1200, f2: 160, q: 8, dur: 0.3, v: 0.7 }); T(c, o, t, { f: 260, f2: 70, dur: 0.28, v: 0.5, vib: 40, vibF: 24 }); }, { ...HIT, lvl: 0.58, prio: 2 }],
  hit_ghost_l: [0.25, (c, o, t) => { N(c, o, t, { f: 1600, f2: 600, q: 2, dur: 0.2, a: 0.01, v: 0.5 }); T(c, o, t, { f: 640, f2: 300, dur: 0.2, v: 0.12, vib: 20, vibF: 9 }); }, { ...HIT, lvl: 0.36 }],
  hit_ghost_h: [0.4, (c, o, t) => { N(c, o, t, { f: 1800, f2: 400, q: 2, dur: 0.35, a: 0.01, v: 0.6 }); T(c, o, t, { f: 520, f2: 200, dur: 0.35, v: 0.15, vib: 30, vibF: 7 }); }, { ...HIT, lvl: 0.5, prio: 2 }],
  hit_armor_l: [0.22, (c, o, t, r) => { B(c, o, t, { f: 480 + r() * 120, ratio: 2.76, index: 2.5, dur: 0.18, v: 0.3 }); thump(c, o, t, 160, 80, 0.1, 0.5); N(c, o, t, { f: 3000, q: 2, dur: 0.03, v: 0.3 }); }, { ...HIT, lvl: 0.4 }],
  hit_armor_h: [0.4, (c, o, t, r) => { B(c, o, t, { f: 300 + r() * 80, ratio: 2.76, index: 3.5, dur: 0.35, v: 0.35 }); thump(c, o, t, 110, 45, 0.25, 0.8); N(c, o, t, { ft: 'lowpass', f: 1500, f2: 200, dur: 0.2, v: 0.5 }); }, { ...HIT, lvl: 0.6, prio: 2 }],
  crit: [0.4, (c, o, t) => { T(c, o, t, { f: 2500, f2: 2350, dur: 0.32, v: 0.22 }); T(c, o, t, { type: 'triangle', f: 1870, dur: 0.18, v: 0.15 }); N(c, o, t, { ft: 'highpass', f: 4500, dur: 0.06, v: 0.35 }); whoosh(c, o, t, 1200, 4000, 0.12, 0.3); }, { lvl: 0.42, cap: 4, prio: 2, pos: 1 }],
  block: [0.4, (c, o, t, r) => { B(c, o, t, { f: 650 + r() * 150, ratio: 3.1, index: 4, dur: 0.35, v: 0.45 }); N(c, o, t, { f: 3200, q: 3, dur: 0.05, v: 0.4 }); thump(c, o, t, 180, 90, 0.08, 0.4); }, { lvl: 0.4, cap: 4, prio: 2, vars: 2, pos: 1 }],
  shatter: [0.6, (c, o, t, r) => { N(c, o, t, { ft: 'highpass', f: 2200, dur: 0.35, v: 0.7 }); for (let i = 0; i < 12; i++) T(c, o, t + r() * 0.25, { f: 2400 + r() * 4000, dur: 0.08 + r() * 0.2, v: 0.08 }); thump(c, o, t, 160, 70, 0.15, 0.5); }, { lvl: 0.62, cap: 3, prio: 2, vars: 2, pos: 1 }],
  // swings and shots
  swing: [0.22, (c, o, t) => whoosh(c, o, t, 420, 1500, 0.18, 0.5), { lvl: 0.22, cap: 4, group: 'swing', prio: 1, vars: 2, pv: 0.12, pos: 1 }],
  swing_big: [0.32, (c, o, t) => whoosh(c, o, t, 240, 900, 0.28, 0.6, 1), { lvl: 0.32, cap: 4, group: 'swing', prio: 1, vars: 2, pos: 1 }],
  thrust: [0.14, (c, o, t) => whoosh(c, o, t, 900, 2600, 0.11, 0.45, 1.6), { lvl: 0.2, cap: 6, group: 'swing', prio: 1, vars: 2, pv: 0.12, pos: 1 }],
  whoosh: [0.2, (c, o, t) => whoosh(c, o, t, 600, 2200, 0.16, 0.5), { lvl: 0.22, cap: 4, prio: 1, pos: 1 }],
  windup: [0.8, (c, o, t) => { N(c, o, t, { ft: 'lowpass', f: 200, f2: 900, dur: 0.75, a: 0.65, v: 0.5, color: 'pink' }); T(c, o, t, { type: 'sawtooth', f: 60, f2: 90, dur: 0.75, a: 0.6, v: 0.15, lp: 300 }); }, { lvl: 0.4, cap: 2, prio: 2, pos: 1 }],
  bow: [0.36, (c, o, t) => { N(c, o, t, { f: 1300, q: 9, dur: 0.07, a: 0.05, v: 0.15 }); T(c, o, t + 0.07, { type: 'triangle', f: 200, f2: 188, dur: 0.24, v: 0.4 }); T(c, o, t + 0.07, { f: 400, f2: 380, dur: 0.12, v: 0.15 }); N(c, o, t + 0.07, { ft: 'highpass', f: 3000, dur: 0.02, v: 0.35 }); whoosh(c, o, t + 0.08, 1500, 3500, 0.12, 0.2); }, { lvl: 0.3, cap: 6, group: 'shot', prio: 1, vars: 2, pv: 0.07, pos: 1 }],
  throw: [0.18, (c, o, t) => whoosh(c, o, t, 1100, 2800, 0.13, 0.5, 1.6), { lvl: 0.2, cap: 5, group: 'shot', prio: 1, vars: 2, pv: 0.12, pos: 1 }],
  zap: [0.24, (c, o, t) => { T(c, o, t, { type: 'sawtooth', f: 1500, f2: 260, dur: 0.18, v: 0.2, lp: 3200 }); T(c, o, t, { f: 950, f2: 220, dur: 0.2, v: 0.3 }); N(c, o, t, { ft: 'highpass', f: 2600, dur: 0.05, v: 0.15 }); }, { lvl: 0.26, cap: 5, group: 'shot', prio: 1, vars: 1, pv: 0.1, pos: 1 }],
  bolt_fire: [0.26, (c, o, t, r) => { N(c, o, t, { f: 600, f2: 1900, q: 0.9, dur: 0.16, a: 0.04, v: 0.5 }); thump(c, o, t, 140, 80, 0.08, 0.3); clicks(c, o, t + 0.03, 2, 0.15, 2500, 5000, 0.25, 5, r); }, { lvl: 0.24, cap: 5, group: 'shot', prio: 1, vars: 2, pv: 0.1, pos: 1 }],
  bolt_frost: [0.26, (c, o, t) => { T(c, o, t, { f: 2900, f2: 2200, dur: 0.18, v: 0.14 }); T(c, o, t, { f: 1950, f2: 1500, dur: 0.14, v: 0.1 }); N(c, o, t, { ft: 'highpass', f: 5500, dur: 0.12, a: 0.01, v: 0.25 }); }, { lvl: 0.26, cap: 5, group: 'shot', prio: 1, pv: 0.08, pos: 1 }],
  orb: [0.3, (c, o, t) => { T(c, o, t, { f: 1250, f2: 940, dur: 0.24, v: 0.2 }); T(c, o, t, { f: 1880, f2: 1400, dur: 0.14, v: 0.07 }); N(c, o, t, { ft: 'highpass', f: 5000, dur: 0.15, a: 0.03, v: 0.06 }); }, { lvl: 0.22, cap: 5, group: 'shot', prio: 1, pv: 0.08, pos: 1 }],
  thorn: [0.12, (c, o, t) => { T(c, o, t, { type: 'triangle', f: 320, f2: 280, dur: 0.08, v: 0.4 }); N(c, o, t, { f: 2000, q: 3, dur: 0.04, v: 0.3 }); whoosh(c, o, t, 1300, 2600, 0.08, 0.2); }, { lvl: 0.22, cap: 6, group: 'shot', prio: 1, vars: 2, pv: 0.12, pos: 1 }],
  note: [0.5, (c, o, t, r, k) => { const f = mtof([72, 74, 76, 79, 81][k]); pluck(c, o, t, f, 0.45, 0.4, 3500); T(c, o, t, { f: f * 3, dur: 0.15, v: 0.03 }); }, { lvl: 0.24, cap: 5, group: 'shot', prio: 1, vars: 5, pv: 0, pos: 1 }],
  water: [0.18, (c, o, t) => { T(c, o, t, { f: 280, f2: 760, dur: 0.1, v: 0.4 }); N(c, o, t, { ft: 'lowpass', f: 1200, dur: 0.1, v: 0.2 }); }, { lvl: 0.25, cap: 5, group: 'shot', prio: 1, pv: 0.12, pos: 1 }],
  glass: [0.45, (c, o, t, r) => { N(c, o, t, { ft: 'highpass', f: 3200, dur: 0.18, v: 0.5 }); for (let i = 0; i < 7; i++) T(c, o, t + r() * 0.12, { f: 3000 + r() * 3000, dur: 0.06 + r() * 0.1, v: 0.07 }); for (let i = 0; i < 4; i++) T(c, o, t + 0.1 + r() * 0.3, { f: 300 + r() * 300, f2: 700, dur: 0.05, v: 0.12 }); }, { lvl: 0.3, cap: 3, prio: 1, vars: 2, pos: 1 }],
  splash: [0.35, (c, o, t, r) => { N(c, o, t, { f: 1300, f2: 450, q: 0.9, dur: 0.28, a: 0.01, v: 0.5 }); T(c, o, t + 0.04, { f: 1200 + r() * 400, f2: 600, dur: 0.06, v: 0.12 }); T(c, o, t + 0.12, { f: 900 + r() * 400, f2: 500, dur: 0.06, v: 0.1 }); }, { lvl: 0.3, cap: 4, prio: 1, vars: 2, pos: 1 }],
  // elements
  fire_cast: [0.6, (c, o, t, r) => { N(c, o, t, { ft: 'lowpass', f: 300, f2: 2200, g: 0.12, dur: 0.5, a: 0.07, v: 0.7 }); thump(c, o, t, 90, 50, 0.3, 0.4); clicks(c, o, t + 0.05, 6, 0.45, 2500, 5000, 0.35, 5, r); }, { lvl: 0.42, cap: 4, group: 'spell', prio: 2, vars: 2, pos: 1 }],
  fire_small: [0.35, (c, o, t, r) => { N(c, o, t, { f: 700, f2: 2100, q: 0.8, dur: 0.25, a: 0.05, v: 0.45 }); clicks(c, o, t + 0.04, 3, 0.25, 2500, 5000, 0.3, 5, r); }, { lvl: 0.26, cap: 4, prio: 1, vars: 2, pos: 1 }],
  frost_cast: [0.45, (c, o, t) => { for (const [f, d] of [[2600, 0.3], [3300, 0.25], [1950, 0.38], [4100, 0.18]]) T(c, o, t + Math.random() * 0.04, { f, dur: d, v: 0.12 }); N(c, o, t, { ft: 'highpass', f: 5200, dur: 0.28, a: 0.02, v: 0.25 }); }, { lvl: 0.36, cap: 4, group: 'spell', prio: 2, vars: 2, pos: 1 }],
  lightning: [0.35, (c, o, t, r) => { const st = []; for (let i = 0; i < 14; i++) st.push([i * 0.018, 200 + r() * 1800]); T(c, o, t, { type: 'sawtooth', f: 600, dur: 0.26, v: 0.3, steps: st, lp: 4000 }); for (let i = 0; i < 4; i++) N(c, o, t + r() * 0.2, { ft: 'highpass', f: 2000, dur: 0.05, v: 0.5 }); }, { lvl: 0.4, cap: 4, group: 'spell', prio: 2, vars: 2, pos: 1 }],
  thunder: [1.3, (c, o, t) => { N(c, o, t, { ft: 'highpass', f: 1500, dur: 0.09, v: 0.8 }); N(c, o, t + 0.02, { ft: 'lowpass', f: 260, f2: 90, dur: 1.2, a: 0.03, v: 0.9, color: 'brown' }); thump(c, o, t, 70, 38, 0.5, 0.5); }, { lvl: 0.6, cap: 3, group: 'spell', prio: 2, vars: 2, pos: 1 }],
  holy: [0.9, (c, o, t) => { for (const [f, d] of [[880, 4], [1108.7, -3], [1318.5, 5], [1760, 0]]) T(c, o, t, { f, det: d, dur: 0.75, a: 0.06, v: f > 1500 ? 0.05 : 0.11 }); N(c, o, t, { ft: 'highpass', f: 6000, dur: 0.5, a: 0.1, v: 0.05 }); }, { lvl: 0.3, cap: 3, group: 'spell', prio: 2, pos: 1 }],
  heal: [0.6, (c, o, t) => { T(c, o, t, { f: 660, f2: 990, dur: 0.5, a: 0.08, v: 0.15 }); T(c, o, t + 0.1, { type: 'triangle', f: 1320, dur: 0.4, a: 0.05, v: 0.06 }); }, { lvl: 0.2, cap: 2, group: 'spell', prio: 1, pos: 1 }],
  gas: [0.7, (c, o, t, r) => { N(c, o, t, { ft: 'lowpass', f: 700, dur: 0.6, a: 0.15, v: 0.3, color: 'pink' }); for (let i = 0; i < 7; i++) { const f = 280 + r() * 400; T(c, o, t + r() * 0.55, { f, f2: f * 1.7, dur: 0.06, v: 0.2 }); } }, { lvl: 0.3, cap: 3, group: 'spell', prio: 2, vars: 2, pos: 1 }],
  bubbles: [0.4, (c, o, t, r) => { for (let i = 0; i < 4; i++) { const f = 300 + r() * 400; T(c, o, t + r() * 0.3, { f, f2: f * 1.8, dur: 0.06, v: 0.2 }); } }, { lvl: 0.22, cap: 4, group: 'status', prio: 1, vars: 2, pos: 1 }],
  drain: [0.6, (c, o, t) => { T(c, o, t, { f: 320, f2: 120, dur: 0.5, a: 0.05, v: 0.3, vib: 18, vibF: 8 }); T(c, o, t, { type: 'sawtooth', f: 160, f2: 75, dur: 0.5, a: 0.05, v: 0.12, lp: 600 }); }, { lvl: 0.28, cap: 3, group: 'spell', prio: 1, pos: 1 }],
  vines: [0.5, (c, o, t, r) => { T(c, o, t, { type: 'sawtooth', f: 95, f2: 70, dur: 0.4, v: 0.25, lp: 700, q: 5 }); for (let i = 0; i < 5; i++) N(c, o, t + r() * 0.35, { f: 2500 + r() * 1500, q: 1.5, dur: 0.06, v: 0.25 }); }, { lvl: 0.28, cap: 3, group: 'spell', prio: 1, vars: 2, pos: 1 }],
  chord: [0.8, (c, o, t) => { [60, 64, 67, 72].forEach((m, i) => pluck(c, o, t + i * 0.035, mtof(m), 0.7, 0.3, 3000)); }, { lvl: 0.32, cap: 2, group: 'spell', prio: 2, pos: 1 }],
  shockwave: [0.6, (c, o, t) => { thump(c, o, t, 75, 38, 0.5, 0.8); N(c, o, t, { ft: 'lowpass', f: 500, f2: 120, dur: 0.5, v: 0.6, color: 'pink' }); whoosh(c, o, t, 300, 900, 0.3, 0.3); }, { lvl: 0.5, cap: 3, group: 'spell', prio: 2, pos: 1 }],
  pulse: [0.25, (c, o, t) => N(c, o, t, { f: 650, q: 1, dur: 0.2, a: 0.04, v: 0.4 }), { lvl: 0.16, cap: 3, prio: 1, pos: 1 }],
  boom: [1.0, (c, o, t) => { thump(c, o, t, 95, 34, 0.6, 0.9); N(c, o, t, { ft: 'lowpass', f: 1600, f2: 140, dur: 0.85, v: 0.9, color: 'pink' }); N(c, o, t, { f: 3000, dur: 0.05, v: 0.35 }); }, { lvl: 0.75, cap: 3, group: 'boom', prio: 2, vars: 2, pos: 1 }],
  boom_fire: [1.1, (c, o, t, r) => { thump(c, o, t, 90, 34, 0.6, 0.9); N(c, o, t, { ft: 'lowpass', f: 1800, f2: 160, dur: 0.85, v: 0.9, color: 'pink' }); clicks(c, o, t + 0.1, 10, 0.9, 2200, 5000, 0.3, 5, r); }, { lvl: 0.75, cap: 3, group: 'boom', prio: 2, vars: 2, pos: 1 }],
  ability: [0.4, (c, o, t) => { N(c, o, t, { f: 320, f2: 2000, q: 2, dur: 0.32, a: 0.24, v: 0.35 }); T(c, o, t, { f: 440, f2: 880, dur: 0.3, a: 0.2, v: 0.08 }); }, { lvl: 0.22, cap: 3, prio: 2, pos: 1 }],
  charge: [0.6, (c, o, t) => { N(c, o, t, { ft: 'lowpass', f: 200, f2: 700, dur: 0.55, a: 0.1, v: 0.6, color: 'brown' }); whoosh(c, o, t, 300, 1200, 0.5, 0.35); }, { lvl: 0.36, cap: 2, prio: 2, pos: 1 }],
  stab: [0.3, (c, o, t) => { whoosh(c, o, t, 1500, 3500, 0.08, 0.5, 2); T(c, o, t + 0.06, { f: 2300, f2: 2100, dur: 0.22, v: 0.18 }); N(c, o, t + 0.06, { ft: 'lowpass', f: 900, dur: 0.06, v: 0.5 }); }, { lvl: 0.35, cap: 3, prio: 2, pos: 1 }],
  steam: [0.45, (c, o, t) => N(c, o, t, { ft: 'highpass', f: 3500, f2: 6000, dur: 0.4, a: 0.05, v: 0.4 }), { lvl: 0.2, cap: 3, group: 'status', prio: 1, pos: 1 }],
  // statuses landing
  ignite: [0.4, (c, o, t, r) => { N(c, o, t, { ft: 'lowpass', f: 500, f2: 2400, g: 0.1, dur: 0.3, a: 0.04, v: 0.55 }); clicks(c, o, t + 0.05, 3, 0.3, 2500, 5000, 0.3, 5, r); }, { lvl: 0.26, cap: 4, group: 'status', prio: 1, vars: 2, pos: 1 }],
  chill: [0.4, (c, o, t) => { N(c, o, t, { ft: 'highpass', f: 6000, dur: 0.3, a: 0.04, v: 0.3 }); T(c, o, t, { f: 3100, f2: 2500, dur: 0.3, v: 0.07 }); }, { lvl: 0.22, cap: 4, group: 'status', prio: 1, pos: 1 }],
  buzz: [0.3, (c, o, t, r) => { T(c, o, t, { type: 'sawtooth', f: 120, dur: 0.22, v: 0.3, lp: 2200, q: 3 }); for (let i = 0; i < 3; i++) N(c, o, t + r() * 0.2, { ft: 'highpass', f: 2500, dur: 0.03, v: 0.4 }); }, { lvl: 0.26, cap: 4, group: 'status', prio: 1, vars: 2, pos: 1 }],
  bonk: [0.2, (c, o, t) => { T(c, o, t, { f: 240, f2: 150, dur: 0.13, v: 0.6 }); N(c, o, t, { ft: 'lowpass', f: 900, dur: 0.05, v: 0.35 }); }, { lvl: 0.3, cap: 4, group: 'status', prio: 1, pos: 1 }],
  freeze: [0.6, (c, o, t, r) => { clicks(c, o, t, 9, 0.35, 2500, 6500, 0.6, 7, r); T(c, o, t, { f: 1250, f2: 600, dur: 0.5, v: 0.12 }); T(c, o, t + 0.3, { f: 2637, dur: 0.3, v: 0.08 }); }, { lvl: 0.34, cap: 3, group: 'status', prio: 2, vars: 2, pos: 1 }],
  ko: [0.8, (c, o, t) => { T(c, o, t, { f: 230, f2: 140, dur: 0.15, v: 0.6 }); T(c, o, t + 0.1, { f: 900, f2: 520, dur: 0.6, v: 0.1, vib: 50, vibF: 7 }); T(c, o, t + 0.25, { f: 2600, f2: 3200, dur: 0.05, v: 0.05 }); T(c, o, t + 0.38, { f: 2700, f2: 3300, dur: 0.05, v: 0.05 }); }, { lvl: 0.32, cap: 2, group: 'status', prio: 2, pos: 1 }],
  slip: [0.5, (c, o, t) => { T(c, o, t, { f: 500, dur: 0.4, v: 0.12, steps: [[0.1, 1500], [0.2, 700], [0.3, 380]] }); N(c, o, t, { f: 1200, f2: 400, dur: 0.3, v: 0.3 }); }, { lvl: 0.26, cap: 2, group: 'status', prio: 1, pos: 1 }],
  sleep: [0.7, (c, o, t) => { T(c, o, t, { f: 700, f2: 350, dur: 0.6, a: 0.05, v: 0.12 }); T(c, o, t, { f: 1050, f2: 520, dur: 0.6, a: 0.05, v: 0.05 }); }, { lvl: 0.2, cap: 3, group: 'status', prio: 1, pos: 1 }],
  rot: [0.5, (c, o, t, r) => { N(c, o, t, { ft: 'lowpass', f: 900, f2: 200, q: 6, dur: 0.35, v: 0.6 }); for (let i = 0; i < 4; i++) { const f = 200 + r() * 200; T(c, o, t + r() * 0.3, { f, f2: f * 1.6, dur: 0.07, v: 0.2 }); } }, { lvl: 0.36, cap: 3, group: 'status', prio: 2, vars: 2, pos: 1 }],
  // deaths
  death_flesh: [0.45, (c, o, t) => { thump(c, o, t + 0.05, 120, 48, 0.25, 0.7); N(c, o, t + 0.05, { ft: 'lowpass', f: 600, dur: 0.2, v: 0.5 }); T(c, o, t, { type: 'sawtooth', f: 190, f2: 110, dur: 0.2, v: 0.25, lp: 700, q: 3 }); }, { lvl: 0.42, cap: 5, group: 'death', prio: 2, vars: 2, pos: 1 }],
  death_goblin: [0.45, (c, o, t) => { T(c, o, t, { type: 'sawtooth', f: 330, f2: 170, dur: 0.22, v: 0.25, lp: 1200, q: 4 }); thump(c, o, t + 0.12, 140, 55, 0.25, 0.8); N(c, o, t + 0.12, { ft: 'lowpass', f: 700, dur: 0.2, v: 0.5 }); }, { lvl: 0.44, cap: 5, group: 'death', prio: 2, vars: 2, pos: 1 }],
  death_big: [0.7, (c, o, t) => { T(c, o, t, { type: 'sawtooth', f: 130, f2: 70, dur: 0.4, v: 0.3, lp: 600, q: 3 }); thump(c, o, t + 0.2, 90, 35, 0.45, 0.9); N(c, o, t + 0.2, { ft: 'lowpass', f: 500, f2: 120, dur: 0.4, v: 0.7, color: 'pink' }); }, { lvl: 0.58, cap: 3, group: 'death', prio: 2, pos: 1 }],
  death_bone: [0.6, (c, o, t, r) => { for (let i = 0; i < 8; i++) { const dt = Math.pow(r(), 1.4) * 0.5; T(c, o, t + dt, { type: 'triangle', f: 600 + r() * 1100, dur: 0.05, v: 0.3 }); N(c, o, t + dt, { f: 1500 + r() * 1500, q: 6, dur: 0.03, v: 0.4 }); } thump(c, o, t + 0.02, 160, 70, 0.12, 0.4); }, { lvl: 0.42, cap: 5, group: 'death', prio: 2, vars: 3, pos: 1 }],
  death_slime: [0.45, (c, o, t) => { N(c, o, t, { ft: 'lowpass', f: 1300, f2: 140, q: 5, dur: 0.38, v: 0.8 }); T(c, o, t, { f: 240, f2: 55, dur: 0.32, v: 0.5 }); }, { lvl: 0.44, cap: 5, group: 'death', prio: 2, vars: 2, pos: 1 }],
  death_rat: [0.3, (c, o, t) => { T(c, o, t, { f: 2600, dur: 0.13, v: 0.15, steps: [[0.04, 3300], [0.08, 2100]] }); thump(c, o, t + 0.05, 200, 90, 0.1, 0.4); }, { lvl: 0.3, cap: 5, group: 'death', prio: 2, vars: 1, pv: 0.1, pos: 1 }],
  death_ghost: [1.0, (c, o, t) => { T(c, o, t, { f: 900, f2: 280, dur: 0.9, a: 0.04, v: 0.14, vib: 25, vibF: 6 }); N(c, o, t, { f: 1600, f2: 300, q: 2, dur: 0.9, a: 0.05, v: 0.35 }); }, { lvl: 0.36, cap: 3, group: 'death', prio: 2, pos: 1 }],
  death_scale: [0.5, (c, o, t) => { N(c, o, t, { ft: 'highpass', f: 3200, dur: 0.35, a: 0.02, v: 0.3 }); thump(c, o, t + 0.1, 130, 50, 0.25, 0.8); N(c, o, t + 0.1, { ft: 'lowpass', f: 600, dur: 0.2, v: 0.5 }); }, { lvl: 0.42, cap: 5, group: 'death', prio: 2, pos: 1 }],
  death_boss: [3.0, (c, o, t) => { T(c, o, t, { type: 'sawtooth', f: 110, f2: 40, dur: 1.6, a: 0.05, v: 0.3, lp: 700, lp2: 150, vib: 6, vibF: 5 }); thump(c, o, t, 70, 30, 1.0, 1); N(c, o, t, { ft: 'lowpass', f: 1500, f2: 60, dur: 2.8, a: 0.01, v: 0.8, color: 'brown' }); N(c, o, t, { ft: 'highpass', f: 3000, dur: 1.6, a: 0.01, v: 0.15 }); }, { lvl: 0.85, cap: 1, prio: 3, duck: 1 }],
  // heroes
  down: [1.0, (c, o, t) => { thump(c, o, t, 130, 50, 0.3, 0.8); N(c, o, t, { ft: 'lowpass', f: 600, dur: 0.25, v: 0.5 }); T(c, o, t + 0.15, { type: 'triangle', f: nf('E4'), dur: 0.35, v: 0.2 }); T(c, o, t + 0.45, { type: 'triangle', f: nf('C4'), dur: 0.5, v: 0.2 }); }, { lvl: 0.5, cap: 2, prio: 3, pos: 1 }],
  revive: [0.9, (c, o, t) => { ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => { T(c, o, t + i * 0.08, { type: 'triangle', f: nf(n), dur: 0.35, v: 0.16 }); B(c, o, t + i * 0.08, { f: nf(n) * 2, ratio: 3.5, index: 0.6, dur: 0.4, v: 0.04 }); }); N(c, o, t, { ft: 'highpass', f: 6000, dur: 0.6, a: 0.2, v: 0.08 }); }, { lvl: 0.4, cap: 2, prio: 3, pv: 0 }],
  levelup: [1.0, (c, o, t) => { ['G5', 'C6', 'E6', 'G6'].forEach((n, i) => { T(c, o, t + i * 0.07, { type: 'square', f: nf(n), dur: 0.18, v: 0.05, lp: 4000 }); B(c, o, t + i * 0.07, { f: nf(n), ratio: 2, index: 0.8, dur: 0.6, v: 0.12 }); }); N(c, o, t + 0.25, { ft: 'highpass', f: 7000, dur: 0.5, a: 0.05, v: 0.1 }); }, { lvl: 0.42, cap: 2, prio: 3, pv: 0 }],
  drink: [0.85, (c, o, t) => { for (const dt of [0, 0.14, 0.28]) { T(c, o, t + dt, { f: 330, f2: 520, dur: 0.08, v: 0.35 }); N(c, o, t + dt, { ft: 'lowpass', f: 700, dur: 0.06, v: 0.2 }); } T(c, o, t + 0.45, { f: 1320, f2: 1760, dur: 0.35, a: 0.03, v: 0.1 }); }, { lvl: 0.3, cap: 2, prio: 2, pos: 1 }],
  // loot and the room
  coin: [0.32, (c, o, t) => { T(c, o, t, { type: 'square', f: 988, dur: 0.06, v: 0.12, lp: 5000 }); T(c, o, t + 0.06, { type: 'square', f: 1319, dur: 0.24, v: 0.12, lp: 5000 }); T(c, o, t + 0.06, { f: 2638, dur: 0.15, v: 0.04 }); }, { lvl: 0.2, cap: 10, prio: 1, pv: 0 }],
  gem: [0.7, (c, o, t) => { B(c, o, t, { f: 1760, ratio: 2.5, index: 1, dur: 0.6, v: 0.2 }); B(c, o, t + 0.08, { f: 2637, ratio: 2.5, index: 1, dur: 0.5, v: 0.12 }); }, { lvl: 0.3, cap: 2, prio: 2, pv: 0 }],
  key: [0.5, (c, o, t, r) => { for (let i = 0; i < 4; i++) B(c, o, t + i * 0.05 + r() * 0.02, { f: 2000 + r() * 1500, ratio: 2.7, index: 1.2, dur: 0.2, v: 0.12 }); }, { lvl: 0.25, cap: 2, prio: 2 }],
  chest: [1.4, (c, o, t, r) => { N(c, o, t, { f: 3000, q: 3, dur: 0.02, v: 0.5 }); T(c, o, t + 0.05, { type: 'sawtooth', f: 85, f2: 150, dur: 0.38, a: 0.05, v: 0.2, lp: 1000, q: 6 }); N(c, o, t + 0.05, { f: 600, q: 3, dur: 0.35, a: 0.05, v: 0.15 }); thump(c, o, t + 0.42, 140, 70, 0.15, 0.5); for (let i = 0; i < 7; i++) { const dt = 0.5 + i * 0.07 + r() * 0.04; T(c, o, dt + t, { type: 'square', f: 988 * (1 + r() * 0.3), dur: 0.05, v: 0.06, lp: 5000 }); T(c, o, dt + t + 0.05, { type: 'square', f: 1319 * (1 + r() * 0.3), dur: 0.16, v: 0.06, lp: 5000 }); } }, { lvl: 0.42, cap: 2, prio: 3, pos: 1 }],
  pedestal: [0.8, (c, o, t) => { ['E5', 'G5', 'C6'].forEach((n, i) => B(c, o, t + i * 0.09, { f: nf(n), ratio: 3.5, index: 0.8, dur: 0.6, v: 0.15 })); }, { lvl: 0.32, cap: 2, prio: 2, pv: 0 }],
  fountain: [1.4, (c, o, t, r) => { N(c, o, t, { f: 1500, q: 0.5, dur: 1.0, a: 0.1, v: 0.3 }); for (let i = 0; i < 8; i++) { const f = 500 + r() * 700; T(c, o, t + r() * 0.9, { f, f2: f * 1.6, dur: 0.06, v: 0.1 }); } ['C5', 'G5', 'E6'].forEach((n, i) => B(c, o, t + 0.2 + i * 0.12, { f: nf(n), ratio: 3.5, index: 0.5, dur: 0.9, v: 0.1 })); }, { lvl: 0.38, cap: 1, prio: 3 }],
  door: [1.3, (c, o, t) => { N(c, o, t, { ft: 'lowpass', f: 320, dur: 1.0, a: 0.25, v: 0.8, color: 'brown', rel: 0.1 }); T(c, o, t, { type: 'sawtooth', f: 48, f2: 52, dur: 1.0, a: 0.2, v: 0.12, lp: 200 }); thump(c, o, t + 1.05, 110, 50, 0.2, 0.6); }, { lvl: 0.42, cap: 1, prio: 3, pos: 1 }],
  leave: [0.9, (c, o, t) => whoosh(c, o, t, 260, 900, 0.8, 0.5, 1), { lvl: 0.18, cap: 1, prio: 2 }],
  rift: [1.4, (c, o, t, r) => { N(c, o, t, { ft: 'lowpass', f: 180, f2: 420, dur: 1.1, a: 0.5, v: 0.9, color: 'brown', rel: 0.2 }); T(c, o, t, { type: 'sawtooth', f: 42, f2: 55, dur: 1.1, a: 0.6, v: 0.12, lp: 160 }); clicks(c, o, t + 0.3, 8, 0.9, 300, 1200, 0.5, 4, r); }, { lvl: 0.45, cap: 1, prio: 3, pv: 0.04 }],
  room: [0.4, (c, o, t) => { thump(c, o, t, 95, 48, 0.3, 0.6); N(c, o, t, { ft: 'lowpass', f: 450, dur: 0.22, v: 0.4 }); }, { lvl: 0.3, cap: 1, prio: 2 }],
  // the camp
  tap: [0.06, (c, o, t) => { T(c, o, t, { f: 1700, f2: 1150, dur: 0.035, v: 0.4 }); N(c, o, t, { ft: 'highpass', f: 4500, dur: 0.012, v: 0.25 }); }, { lvl: 0.2, cap: 12, prio: 3, pv: 0.04 }],
  deny: [0.25, (c, o, t) => { for (const dt of [0, 0.1]) T(c, o, t + dt, { type: 'square', f: 175, dur: 0.07, v: 0.2, lp: 1200 }); }, { lvl: 0.22, cap: 4, prio: 3, pv: 0 }],
  buy: [0.6, (c, o, t) => { N(c, o, t, { ft: 'highpass', f: 5000, dur: 0.06, v: 0.4 }); B(c, o, t + 0.02, { f: nf('C6'), ratio: 2, index: 1, dur: 0.35, v: 0.15 }); B(c, o, t + 0.1, { f: nf('G6'), ratio: 2, index: 1, dur: 0.45, v: 0.15 }); T(c, o, t, { type: 'square', f: 988, dur: 0.05, v: 0.06, lp: 5000 }); T(c, o, t + 0.05, { type: 'square', f: 1319, dur: 0.2, v: 0.06, lp: 5000 }); }, { lvl: 0.32, cap: 4, prio: 3, pv: 0 }],
  // stingers (the music dips under them)
  clear: [1.2, (c, o, t) => { ['G4', 'C5', 'E5'].forEach((n, i) => { pluck(c, o, t + i * 0.11, nf(n), 0.8, 0.25, 3000); B(c, o, t + i * 0.11, { f: nf(n) * 2, ratio: 3.5, index: 0.6, dur: 0.9, v: 0.06 }); }); }, { lvl: 0.36, cap: 1, prio: 3, pv: 0, duck: 1 }],
  horn: [1.6, (c, o, t) => { brass(c, o, t, 110, 0.5, 0.18, 900); brass(c, o, t + 0.55, 147, 0.6, 0.18, 1100); thump(c, o, t, 90, 40, 0.5, 0.6); }, { lvl: 0.45, cap: 1, prio: 3, pv: 0, duck: 1 }],
  floor: [1.8, (c, o, t) => { [['C4', 0, 0.12], ['E4', 0.15, 0.12], ['G4', 0.3, 0.12], ['C5', 0.45, 0.9]].forEach(([n, dt, d]) => brass(c, o, t + dt, nf(n), d, 0.12, 2400)); thump(c, o, t + 0.45, 100, 45, 0.6, 0.6); B(c, o, t + 0.45, { f: nf('C6'), ratio: 3.5, index: 0.5, dur: 1.2, v: 0.05 }); }, { lvl: 0.5, cap: 1, prio: 3, pv: 0, duck: 1 }],
  won: [3.6, (c, o, t) => { [['G4', 0, 0.14], ['C5', 0.16, 0.14], ['E5', 0.32, 0.14], ['G5', 0.48, 0.3], ['E5', 0.82, 0.12], ['G5', 0.96, 1.6]].forEach(([n, dt, d]) => brass(c, o, t + dt, nf(n), d, 0.1, 2800)); for (const n of ['C4', 'G4', 'C5', 'E5']) T(c, o, t + 0.96, { type: 'triangle', f: nf(n), dur: 1.8, a: 0.05, v: 0.08, rel: 0.6 }); thump(c, o, t + 0.96, 100, 45, 0.8, 0.6); N(c, o, t + 0.96, { ft: 'highpass', f: 6000, dur: 1.5, a: 0.02, v: 0.08 }); }, { lvl: 0.55, cap: 1, prio: 3, pv: 0, duck: 1 }],
  lost: [3.5, (c, o, t) => { [['A4', 0, 0.5], ['G4', 0.55, 0.5], ['F4', 1.1, 0.5], ['E4', 1.65, 1.2]].forEach(([n, dt, d]) => T(c, o, t + dt, { type: 'triangle', f: nf(n), dur: d, a: 0.04, v: 0.16, rel: 0.4, vib: 3, vibF: 5 })); T(c, o, t, { type: 'sawtooth', f: mtof(45), dur: 2.6, a: 0.4, v: 0.06, rel: 0.5, lp: 400 }); thump(c, o, t + 1.65, 80, 38, 0.8, 0.5); }, { lvl: 0.45, cap: 1, prio: 3, pv: 0, duck: 1 }],
  retreated: [1.6, (c, o, t) => { brass(c, o, t, nf('G4'), 0.3, 0.1, 1400); brass(c, o, t + 0.35, nf('D4'), 0.7, 0.1, 1200); }, { lvl: 0.36, cap: 1, prio: 3, pv: 0, duck: 1 }],
  // bosses
  tell: [1.0, (c, o, t) => { T(c, o, t, { type: 'sawtooth', f: 110, f2: 220, dur: 0.95, a: 0.85, v: 0.12, lp: 400, lp2: 1800 }); N(c, o, t, { f: 400, f2: 2200, q: 3, dur: 0.95, a: 0.85, v: 0.3 }); }, { lvl: 0.32, cap: 3, group: 'tell', prio: 2, pv: 0.03, pos: 1 }],
  tell_soul: [1.0, (c, o, t) => { for (const d of [-12, 0, 9]) T(c, o, t, { type: 'sawtooth', f: 110, f2: 330, det: d * 10, dur: 0.95, a: 0.85, v: 0.08, lp: 500, lp2: 2500 }); N(c, o, t, { ft: 'highpass', f: 2000, f2: 6000, dur: 0.95, a: 0.85, v: 0.2 }); }, { lvl: 0.36, cap: 2, group: 'tell', prio: 3, pos: 1 }],
  strike: [0.6, (c, o, t, r) => { thump(c, o, t, 75, 34, 0.5, 0.9); N(c, o, t, { ft: 'lowpass', f: 2000, f2: 200, dur: 0.4, v: 0.7 }); clicks(c, o, t, 5, 0.15, 800, 2400, 0.5, 6, r); }, { lvl: 0.6, cap: 4, group: 'boom', prio: 2, vars: 2, pos: 1 }],
  strike_soul: [0.9, (c, o, t) => { N(c, o, t, { f: 900, f2: 180, q: 1, dur: 0.75, v: 0.8 }); for (const f of [110, 116.5, 165]) T(c, o, t, { type: 'sawtooth', f, f2: f * 0.7, dur: 0.7, v: 0.12, lp: 1200, lp2: 200 }); thump(c, o, t, 70, 32, 0.5, 0.7); }, { lvl: 0.7, cap: 2, group: 'boom', prio: 3, pos: 1 }],
  boss_wake: [2.4, (c, o, t) => { for (const f of [55, 82.4, 110]) brass(c, o, t, f, 1.6, 0.12, 1300); thump(c, o, t, 70, 32, 0.9, 0.9); N(c, o, t, { ft: 'lowpass', f: 400, f2: 80, dur: 2.0, a: 0.05, v: 0.6, color: 'brown' }); }, { lvl: 0.7, cap: 1, prio: 3, pv: 0, duck: 1 }],
  boss_phase: [2.2, (c, o, t) => { T(c, o, t, { type: 'sawtooth', f: 95, f2: 60, dur: 1.2, a: 0.08, v: 0.35, lp: 900, q: 3, vib: 8, vibF: 11 }); T(c, o, t, { type: 'sawtooth', f: 142, f2: 88, dur: 1.1, a: 0.08, v: 0.2, lp: 1300, q: 3, vib: 10, vibF: 13 }); thump(c, o, t, 65, 30, 0.9, 0.9); N(c, o, t + 0.05, { ft: 'highpass', f: 3200, dur: 1.8, a: 0.01, v: 0.25 }); N(c, o, t, { ft: 'lowpass', f: 300, dur: 1.5, a: 0.05, v: 0.6, color: 'brown' }); }, { lvl: 0.75, cap: 1, prio: 3, pv: 0, duck: 1 }],
};
const META = (n) => SOUNDS[n][2];

// ---------------------------------------------------------------- what each cue sounds like
const R = (a, b) => a + Math.random() * (b - a);
function material(u) {
  if (!u) return 'flesh';
  if (u.team === 'hero' && !u.summon) return u.def.heroRole === 'tank' || u.kind === 'knight' ? 'armor' : 'flesh';
  const k = u.kind;
  if (/slime/i.test(k)) return 'slime';
  if (/ghost|banshee|wraith|spirit/i.test(k) || u.ethereal) return 'ghost';
  if (/rattler|skeleton|gaper|brute|bone|grave|^boss$/i.test(k) || u.def.undead) return 'bone';
  return 'flesh';
}
function deathOf(kind) {
  const d = DEFS[kind] || {};
  if (d.boss) return 'death_boss';
  if (/slime/i.test(kind)) return 'death_slime';
  if (/ghost|banshee|wraith/i.test(kind)) return 'death_ghost';
  if (/rattler|skeleton|gaper|brute|bone|grave/i.test(kind) || d.undead) return 'death_bone';
  if (/^rat$/i.test(kind)) return 'death_rat';
  if (/lizard|dragon|spider/i.test(kind)) return 'death_scale';
  if (/troll|ogre/i.test(kind)) return 'death_big';
  if (/goblin|orc|warboss|imp/i.test(kind)) return 'death_goblin';
  return 'death_flesh';
}
const SHOT = { arrow: 'bow', fireArrow: 'bow', bolt: 'zap', fireball: 'fire_cast', shard: 'frost_cast', dagger: 'throw', vial: 'throw', thorn: 'thorn',
  note: 'note', bone: 'throw', water: 'water', orb: 'orb', holy: 'orb', light: 'orb' };
const BOLT = { pyromancer: 'bolt_fire', frost: 'bolt_frost', storm: 'zap', cleric: 'orb' };
const ZONE = { fire: 'fire_cast', poison: 'gas', ice: 'frost_cast', storm: 'lightning', holy: 'holy', sanctuary: 'holy', heal: 'heal', vines: 'vines', drain: 'drain' };
const STATUS = { burn: 'ignite', chill: 'chill', poison: 'bubbles', wet: 'splash', shock: 'buzz', stagger: 'bonk', root: 'vines', sleep: 'sleep' };
const WORD = { dodge: 'whoosh', CHARGE: 'charge', BACKSTAB: 'stab', thaw: 'steam', hiss: 'steam', 'NOT YET': 'revive', REAPED: 'drain' };
const at = (o) => o ? { x: o.x ?? o.x1, y: o.y ?? o.y1 } : {};

// Turn one cue into the sounds to play: [[name, { x, y, vol, rate, delay }], ...]
export function soundsFor(ev) {
  const { name, a, b, c } = ev;
  switch (name) {
    case 'hit': {
      const u = a, o = c || {}; if (!u) return [];
      if (o.blocked) return [['block', { ...at(u), vol: o.heavy ? 1 : 0.8 }]];
      const heavy = o.heavy || o.crit || o.amt >= 14;
      const out = [[`hit_${material(u)}_${heavy ? 'h' : 'l'}`, { ...at(u), vol: heavy ? 1 : 0.55 + Math.min(0.45, (o.amt || 4) / 14 * 0.45), rate: Math.max(0.75, Math.min(1.25, 30 / (u.r || 30))) }]];
      if (o.crit) out.push(['crit', at(u)]);
      return out;
    }
    case 'shot': {
      const p = a, ene = p.team === 'enemy';
      let s = SHOT[p.kind] || 'throw';
      if (p.kind === 'bolt') s = BOLT[p.owner && p.owner.kind] || (/^#FF[89A]/i.test(p.color || '') ? 'bolt_fire' : /^#[89A][0-9A-F]D/i.test(p.color || '') ? 'bolt_frost' : 'zap');   // the casters' bolts
      const out = [[s, { ...at(p), vol: ene ? 0.75 : 1, rate: ene ? 0.92 : 1 }]];
      if (p.kind === 'fireArrow') out.push(['fire_small', { ...at(p), vol: 0.6 }]);
      return out;
    }
    case 'land': return a.kind === 'vial' ? [['glass', at(a)]] : a.kind === 'water' ? [['splash', { ...at(a), vol: 0.7 }]] : [];
    case 'fx': {
      const f = a;
      if (f.type === 'zone') return ZONE[f.kind] ? [[ZONE[f.kind], at(f)]] : [];
      if (f.type === 'beam') return [[f.kind === 'lightning' ? 'lightning' : f.kind === 'drain' ? 'drain' : 'heal', { ...at(f), vol: 0.8 }]];
      if (f.type === 'wall') return [[f.kind === 'ice' ? 'freeze' : 'fire_cast', { ...at(f), rate: 0.8 }]];
      if (f.type === 'wave') return [[f.kind === 'note' ? 'chord' : 'shockwave', at(f)]];
      if (f.type === 'pillar') return [[f.kind === 'lightning' ? 'thunder' : f.kind === 'drain' ? 'drain' : 'holy', at(f)]];
      if (f.type === 'ring') return [['pulse', { ...at(f), vol: 0.6 }]];
      if (f.type === 'rift') return [['rift', {}]];   // the next wave climbing out of the floor
      return [];
    }
    case 'tele': {
      const t = a;
      if (t.type === 'blast') return [[/^#FF[7-B]/i.test(t.color || '') ? 'boom_fire' : 'boom', { ...at(t), vol: Math.min(1, 0.5 + (t.r || 60) / 160) }]];
      if (t.type === 'swing') return [[t.r > 95 ? 'swing_big' : 'swing', at(t)]];
      if (t.type === 'ring') return [['windup', at(t)]];
      return [];
    }
    case 'death': return [[deathOf(a.kind), at(a)]];
    case 'word': return WORD[a.s] ? [[WORD[a.s], at(a)]] : [];
    case 'tell': {
      const z = a, soul = z.kind === 'soul', len = 1.0;
      return [[soul ? 'tell_soul' : 'tell', { ...at(z), delay: Math.max(0, (z.t || 0) - len), vol: z.t < 0.6 ? 0.6 : 1 }]];
    }
    case 'strike': return [[a.kind === 'soul' ? 'strike_soul' : 'strike', at(a)]];
    case 'status': return STATUS[b] ? [[STATUS[b], { ...at(a), vol: b === 'wet' ? 0.6 : 1 }]] : [];
    case 'rot': case 'freeze': case 'ko': case 'slip': case 'shatter': case 'down': case 'revive': case 'drink': return [[name, at(a)]];
    case 'levelup': return [['levelup', {}]];
    case 'ability': return [['ability', { ...at(a), vol: 0.7 }]];
    case 'coin': return Array.from({ length: Math.min(3, a || 1) }, (_, i) => ['coin', { delay: i * 0.05, coin: true }]);
    case 'chest': return [['chest', { x: a, y: b }]];
    case 'door': return [['door', a != null ? { x: a, y: b } : {}]];
    case 'key': case 'gem': case 'pedestal': case 'fountain': case 'leave': case 'room': case 'clear': case 'floor': case 'won': case 'lost': case 'retreated':
    case 'tap': case 'deny': case 'buy': return [[name, {}]];
    case 'wave': return [['horn', {}]];
    case 'bossWake': return [['boss_wake', {}]];
    case 'bossPhase': return [['boss_phase', {}]];
  }
  return [];
}

// ---------------------------------------------------------------- how often things may play
// Pure bookkeeping (no WebAudio), so the Node test tool can run it too.
export const GROUP_CAP = { hit: 12, swing: 6, shot: 9, spell: 6, status: 7, death: 7, boom: 5, tell: 4 };
export const MAX_VOICES = 18;
export class Gate {
  constructor() { this.times = {}; this.voices = []; }
  // may `name` start at time t? (also counts it if so). speed: the game's speed (fast-forward plays only what matters)
  allow(name, t, speed = 1) {
    const m = META(name); if (!m) return false;
    if (speed >= 4 && (m.prio || 1) < 2) return false;
    const recent = (k) => { const l = this.times[k] || (this.times[k] = []); while (l.length && l[0] <= t - 1) l.shift(); return l; };
    const own = recent(name), cap = m.cap || 8;
    if (own.length >= cap) return false;
    if (own.length && t - own[own.length - 1] < 0.5 / cap) return false;  // spread out, not in clumps
    const g = m.group && recent('#' + m.group);
    if (g && g.length >= GROUP_CAP[m.group]) return false;
    // voices: drop the quietest-mattering one if full, or this one
    this.voices = this.voices.filter((v) => v.end > t);
    if (this.voices.length >= MAX_VOICES) {
      let worst = null; for (const v of this.voices) if (!worst || v.prio < worst.prio || (v.prio === worst.prio && v.start < worst.start)) worst = v;
      if ((worst.prio || 1) > (m.prio || 1)) return false;
      this.voices.splice(this.voices.indexOf(worst), 1); if (worst.stop) worst.stop(t);
    }
    own.push(t); if (g) g.push(t);
    return true;
  }
  voice(v) { this.voices.push(v); }
}

// ---------------------------------------------------------------- music
const SC = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10] };
const PENTA = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };
const deg = (root, sc, d) => root + 12 * Math.floor(d / sc.length) + sc[((d % sc.length) + sc.length) % sc.length];
const pent = (root, kind, d) => root + 12 * Math.floor(d / 5) + PENTA[kind][((d % 5) + 5) % 5];
const ROOTS = { crypt: 45, sewers: 40, warren: 43 };   // A, E, G: each place in its own key; the boss track takes the dungeon's

// One place's music: a calm layer and a fight layer, each a step function called every 16th note.
const TRACKS = {
  camp: { bpm: 64, sc: 'major', root: 50, chords: [0, 5, 3, 4], bars: 2, bed: 'fire',
    calm(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4];
      if (q === 0 && bar % this.bars === 0) {
        for (const d of [0, 2, 4]) for (const det of [-5, 5]) T(m.c, m.calm, t, { type: 'triangle', f: mtof(deg(this.root, SC.major, ch + d)), det, dur: s * 16 * this.bars, a: 1.5, v: 0.025, rel: 2.5, lp: 900 });
        T(m.c, m.calm, t, { f: mtof(deg(this.root - 12, SC.major, ch)), dur: s * 16 * this.bars * 0.9, a: 0.08, v: 0.075, rel: 0.8 });
      }
      if (q % 2 === 0 && Math.random() < 0.6) { const arp = [0, 2, 4, 7, 4, 2, 4, 9]; pluck(m.c, m.calm, t, mtof(deg(this.root + 12, SC.major, ch + arp[(q / 2) % 8])), s * 6, 0.06); }
      if (q === 0 && Math.random() < 0.3) { let d = Math.floor(R(0, 6)); const n = 2 + Math.floor(R(0, 3)); for (let k = 0; k < n; k++) { d += Math.random() < 0.5 ? 1 : -1; flute(m.c, m.calm, t + k * s * 4, mtof(pent(this.root + 24, 'major', d)), s * 3.5, 0.04); } }
      if (Math.random() < 0.22) N(m.c, m.calm, t + R(0, s), { f: R(1800, 5000), q: 3, dur: 0.015, v: R(0.03, 0.09) });  // the fire crackling
    } },
  crypt: { bpm: 56, sc: 'minor', chords: [0, 5, 3, 4], bars: 2, bed: 'wind',
    calm(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4], r = m.root;
      if (q === 0 && bar % this.bars === 0) {
        for (const d of [0, 2, 4]) choir(m.c, m.calm, t, mtof(deg(r + 12, SC.minor, ch + d)), s * 16 * this.bars, 0.022);
        if (bar % 4 === 0) T(m.c, m.calm, t, { f: mtof(r - 12), dur: s * 64, a: 2, v: 0.09, rel: 2 });
      }
      if (q % 4 === 0 && Math.random() < 0.13) B(m.c, m.calm, t, { f: mtof(pent(r + 24, 'minor', Math.floor(R(0, 8)))), ratio: 3.5, index: 1.4, dur: 3, v: 0.035 });
    },
    fight(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4], r = m.root;
      const acc = [1, 0, 0.5, 0, 0.8, 0, 0.5, 0, 1, 0, 0.5, 0, 0.8, 0, 0.6, 0.4][q];
      if (acc) T(m.c, m.fight, t, { type: 'sawtooth', f: mtof(deg(r, SC.minor, ch) + (q === 8 ? 12 : 0)), dur: s * 1.6, v: 0.04 * acc + 0.01, lp: 750, q: 2 });
      if (q === 0 || q === 8 || (q === 14 && bar % 2)) drum(m.c, m.fight, t, 105, 0.3);
    } },
  sewers: { bpm: 72, sc: 'dorian', chords: [0, 3, 0, 6], bars: 2, bed: 'water', echo: true,
    calm(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4], r = m.root;
      if (q === 0 && bar % this.bars === 0) for (const d of [0, 4]) { T(m.c, m.calm, t, { f: mtof(deg(r, SC.dorian, ch + d)), dur: s * 32, a: 2.5, v: 0.06, rel: 2.5 }); T(m.c, m.calm, t, { type: 'triangle', f: mtof(deg(r + 12, SC.dorian, ch + d)), dur: s * 32, a: 2.5, v: 0.02, rel: 2.5, lp: 500 }); }
      const p = q % 2 === 0 ? 0.42 : 0.1;
      if (Math.random() < p) { const f = mtof(deg(r + 24, SC.dorian, ch + [0, 2, 4, 6, 7][Math.floor(R(0, 5))])); T(m.c, m.echo, t, { f, dur: s * 4, v: 0.05 }); T(m.c, m.echo, t, { f: f * 4, dur: 0.06, v: 0.012 }); }
      if (Math.random() < 0.05) { const f = R(1200, 2300); T(m.c, m.echo, t + R(0, s), { f, f2: f * 0.5, dur: 0.07, v: 0.04 }); }  // a drip
    },
    fight(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4], r = m.root;
      if ([1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0][q]) { const f = mtof(deg(r - 12, SC.dorian, ch) + (q === 11 ? 7 : q === 13 ? 12 : 0)); T(m.c, m.fight, t, { type: 'triangle', f, dur: s * 1.5, v: 0.12, lp: 500 }); T(m.c, m.fight, t, { f, dur: s * 1.5, v: 0.08 }); }
      N(m.c, m.fight, t, { ft: 'highpass', f: 7000, dur: 0.03, v: q % 4 === 2 ? 0.05 : 0.02 });
      if (q === 0 || q === 6 || q === 10) drum(m.c, m.fight, t, 90, 0.2);
    } },
  warren: { bpm: 90, sc: 'dorian', chords: [0, 0, 6, 3], bars: 2, bed: null,
    calm(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, r = m.root;
      if (q === 0 && bar % 4 === 0) for (const [f, v] of [[mtof(r), 0.022], [mtof(r + 7), 0.016]]) { T(m.c, m.calm, t, { type: 'sawtooth', f, dur: s * 64, a: 1, v, rel: 1.5, lp: 380 }); T(m.c, m.calm, t, { f: f / 2, dur: s * 64, a: 1, v: v * 3, rel: 1.5 }); }
      if ([1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0][q] && Math.random() < 0.7) wood(m.c, m.calm, t, q % 8 === 0 ? 700 : 1100, 0.05);
      if (q === 0 && bar % 2 === 0 && Math.random() < 0.6) { let d = Math.floor(R(2, 7)); for (let k = 0; k < 4 + Math.floor(R(0, 3)); k++) { d += [-1, 1, 1, -2, 2][Math.floor(R(0, 5))]; flute(m.c, m.calm, t + k * s * 2 + (k > 2 ? s * 2 : 0), mtof(pent(r + 24, 'minor', d)), s * 1.8, 0.045); } }
      if (q === 0 || q === 8) pluck(m.c, m.calm, t, mtof(deg(r - 12, SC.dorian, this.chords[Math.floor(bar / 2) % 4])), s * 6, 0.09, 700);
    },
    fight(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4], r = m.root;
      if (q === 0 || q === 6 || q === 8 || q === 11) drum(m.c, m.fight, t, 150, 0.22, 0.25);
      if (q === 4 || q === 12 || (q === 15 && bar % 2)) N(m.c, m.fight, t, { f: 2400, q: 2, dur: 0.06, v: 0.1 });
      if (q % 2 === 0) { const d = [0, 0, 3, 0, 4, 3, 0, -1][q / 2]; T(m.c, m.fight, t, { type: 'sawtooth', f: mtof(deg(r - 12, SC.dorian, ch + d)), dur: s * 1.7, v: 0.045, lp: 650, q: 3 }); }
    } },
  boss: { bpm: 100, sc: 'phrygian', chords: [0, 1, 0, 6], bars: 2, bed: null,
    calm(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4], r = m.root;
      if (q === 0 && bar % this.bars === 0) for (const d of [0, 2, 4]) choir(m.c, m.calm, t, mtof(deg(r + 12, SC.phrygian, ch + d)), s * 32, 0.02);
    },
    fight(m, i, t, s) {
      const bar = Math.floor(i / 16), q = i % 16, ch = this.chords[Math.floor(bar / this.bars) % 4], r = m.root, L = m.level || 1;
      const base = deg(r, SC.phrygian, ch), ost = [0, 12, 0, 1, 0, 12, 0, 7, 0, 12, 0, 1, 0, 7, 1, 12];
      T(m.c, m.fight, t, { type: 'sawtooth', f: mtof(base + ost[q]), dur: s * 1.3, v: q % 4 === 0 ? 0.05 : 0.032, lp: L >= 3 ? 1700 : 950, q: 2 });
      if (L >= 3 && q % 2 === 1) T(m.c, m.fight, t, { type: 'square', f: mtof(base + 24 + ost[q]), dur: s * 0.9, v: 0.012, lp: 2400 });
      if (q === 0 || q === 6 || q === 8 || (q === 13 && bar % 2)) drum(m.c, m.fight, t, 80, 0.4, 0.4);
      if (q === 0 || (L >= 2 && q === 8)) for (const d of [0, 2, 4]) brass(m.c, m.fight, t, mtof(deg(r + 12, SC.phrygian, ch + d)), s * 3, 0.018, 1600);
      if (L >= 2 && q % 2 === 0) N(m.c, m.fight, t, { ft: 'highpass', f: 7000, dur: 0.03, v: q % 4 === 2 ? 0.04 : 0.02 });
      if (L >= 3 && (q === 4 || q === 12)) N(m.c, m.fight, t, { f: 1800, q: 0.8, dur: 0.16, v: 0.13 });
    } },
};
function flute(c, o, t, f, dur, v) { T(c, o, t, { f, dur, a: 0.07, v, rel: 0.18, vib: f * 0.006, vibF: 5 }); T(c, o, t, { type: 'triangle', f: f * 2, dur, a: 0.07, v: v * 0.12, rel: 0.18 }); N(c, o, t, { f: f * 2, q: 4, dur: dur * 0.6, a: 0.03, v: v * 0.5 }); }
function choir(c, o, t, f, dur, v) { for (const det of [-9, 0, 8]) T(c, o, t, { type: 'sawtooth', f, det, dur, a: 2.2, v, rel: 2.8, lp: 650, q: 1.5, vib: f * 0.005, vibF: 4.5 + det * 0.05 }); }
function drum(c, o, t, f, v, nv = 0.12) { T(c, o, t, { f, f2: f * 0.45, dur: 0.38, v }); N(c, o, t, { ft: 'lowpass', f: 500, dur: 0.12, v: nv }); }
function wood(c, o, t, f, v) { T(c, o, t, { type: 'triangle', f, dur: 0.05, v }); N(c, o, t, { f: f * 2, q: 5, dur: 0.03, v: v * 1.4 }); }

class Music {
  constructor(c, out) {
    this.c = c; this.out = out; this.tracks = []; this.place = null; this.level = 1;
    // one shared reverb
    this.verb = c.createConvolver(); this.verb.buffer = impulse(c, 2.8); this.verb.connect(out);
  }
  setPlace(place, root, when, fade = 2.5) {
    const key = place && place + ':' + root;
    if (key === this.place) return; this.place = key;
    for (const tr of this.tracks) if (!tr.leaving) this.retire(tr, when, fade);
    if (place) this.tracks.push(this.makeTrack(place, root, when, fade));
  }
  setFight(x, when) {
    for (const tr of this.tracks) if (!tr.leaving && tr.fightOn !== x) {
      tr.fightOn = x; if (!x) tr.fightTail = when + 5;   // the fight layer fades out over a few seconds, still playing
      tr.fight.gain.setTargetAtTime(x ? 1 : 0, when, x ? 0.6 : 1.6); tr.calm.gain.setTargetAtTime(x ? 0.85 : 1, when, 1);
    }
  }
  setLevel(L) { this.level = L; for (const tr of this.tracks) tr.level = L; }
  makeTrack(place, root, when, fade) {
    const c = this.c, def = TRACKS[place];
    const tr = { def, place, c, root: root ?? def.root ?? 45, i: 0, next: when + 0.05, level: this.level, fightOn: place === 'boss' };
    tr.gain = c.createGain(); tr.gain.gain.setValueAtTime(0.0001, when); tr.gain.gain.exponentialRampToValueAtTime(1, when + fade); tr.gain.connect(this.out);
    const send = c.createGain(); send.gain.value = 0.55; tr.gain.connect(send).connect(this.verb);
    tr.calm = c.createGain(); tr.calm.connect(tr.gain);
    tr.fight = c.createGain(); tr.fight.gain.value = tr.fightOn ? 1 : 0; tr.fight.connect(tr.gain);
    if (def.echo) {  // a dripping echo for the sewers
      tr.echo = c.createGain(); const d = c.createDelay(1); d.delayTime.value = 60 / def.bpm * 0.75; const fb = c.createGain(); fb.gain.value = 0.38; const lp = c.createBiquadFilter(); lp.frequency.value = 2200;
      tr.echo.connect(tr.calm); tr.echo.connect(d); d.connect(lp).connect(fb).connect(d); fb.connect(tr.calm);
    } else tr.echo = tr.calm;
    // a bed of noise that runs the whole time: fire, wind, flowing water
    if (def.bed) {
      const s = c.createBufferSource(); s.buffer = noiseBuf(c, def.bed === 'wind' ? 'pink' : 'brown'); s.loop = true;
      const f = c.createBiquadFilter(), g = c.createGain();
      if (def.bed === 'fire') { f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = 0.035; }
      if (def.bed === 'wind') { f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 1.2; g.gain.value = 0.018; tr.windF = f.frequency; }
      if (def.bed === 'water') { f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = 0.06; tr.waterG = g.gain; }
      s.connect(f).connect(g).connect(tr.calm); s.start(when); tr.bed = s;
    }
    return tr;
  }
  retire(tr, when, fade) {
    tr.leaving = when + fade + 0.5;
    hold(tr.gain.gain, when); tr.gain.gain.setTargetAtTime(0.0001, when, fade / 4);
    if (tr.bed) tr.bed.stop(when + fade + 0.5);
  }
  // schedule notes up to time `until`
  schedule(until) {
    for (const tr of this.tracks) {
      const s = 60 / tr.def.bpm / 4;
      while (tr.next < until && (!tr.leaving || tr.next < tr.leaving)) {
        const m = { c: this.c, calm: tr.calm, fight: tr.fight, echo: tr.echo, root: tr.root, level: tr.level };
        tr.def.calm.call(tr.def, m, tr.i, tr.next, s);
        if (tr.def.fight && (tr.fightOn || tr.next < (tr.fightTail || 0))) tr.def.fight.call(tr.def, m, tr.i, tr.next, s);
        if (tr.i % 16 === 0) {   // the bed drifts a little every bar
          if (tr.windF) tr.windF.setTargetAtTime(R(300, 750), tr.next, 1.5);
          if (tr.waterG) tr.waterG.setTargetAtTime(R(0.035, 0.075), tr.next, 1.2);
        }
        tr.i++; tr.next += s;
      }
    }
    const now = this.c.currentTime;
    this.tracks = this.tracks.filter((tr) => { if (tr.leaving && tr.leaving < now) { tr.gain.disconnect(); return false; } return true; });
  }
}
// stop an automation where it is (not where it started)
function hold(p, t) { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); } }
function impulse(c, secs) {
  const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2) * (i < 200 ? i / 200 : 1); }
  return b;
}

// ---------------------------------------------------------------- the engine (one per AudioContext; the tools make an offline one)
const RENDER_RATE = 24000;   // effects keep nothing above 12 kHz; a quarter less memory than 32 kHz
export class Engine {
  constructor(c) {
    this.c = c; this.gate = new Gate(); this.buffers = {}; this.coinT = -9; this.coinN = 0; this.fightHold = 0; this.lastPlace = null;
    this.master = c.createGain();
    const lim = c.createDynamicsCompressor(); lim.threshold.value = -8; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
    this.master.connect(lim).connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    this.duck = c.createGain(); this.duck.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.connect(this.duck);
    this.music = new Music(c, this.musicBus);
    this.speed = 1; this.quiet = false;
    this.apply();
    this.ready = this.prerender();
  }
  apply(when = this.c.currentTime) {
    const s = settings, k = (v) => v * v;
    this.master.gain.setTargetAtTime(s.mute ? 0 : k(s.master) * 3, when, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.quiet ? 0 : k(s.sfx) * (this.speed >= 4 ? 0.5 : this.speed >= 2 ? 0.8 : 1), when, 0.05);
    this.musicBus.gain.setTargetAtTime(k(s.music) * 1.3, when, 0.1);
  }
  // render every effect once (each variant), normalised to its level
  // Each effect gets its own small offline render (a long shared one makes every filter run for the whole length),
  // the common ones first, a few at a time, so a fight can start making sounds before the rarer ones are ready.
  async prerender() {
    const first = /^(hit_|swing|thrust|bow|coin|tap|death_|crit|block|zap|bolt_)/;
    const list = [];
    for (const n of Object.keys(SOUNDS)) for (let v = 0; v < (SOUNDS[n][2].vars || 1); v++) list.push({ n, v });
    list.sort((a, b) => (first.test(b.n) ? 1 : 0) - (first.test(a.n) ? 1 : 0));
    const one = async (it) => {
      const [d, make, m] = SOUNDS[it.n], len = Math.ceil(d * RENDER_RATE);
      const off = new OfflineAudioContext(1, len, RENDER_RATE);
      make(off, off.destination, 0.002, rng(it.n.length * 97 + it.v * 7919), it.v);
      const r = await off.startRendering(), x = r.getChannelData(0);
      const b = this.c.createBuffer(1, len, RENDER_RATE), out = b.getChannelData(0);
      let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(x[i]));
      const g = peak > 0 ? (m.lvl || 0.4) / peak : 0;
      for (let i = 0; i < len; i++) out[i] = x[i] * g;
      for (let i = 0; i < Math.min(len, 64); i++) out[len - 1 - i] *= i / 64;   // no click at the end
      (this.buffers[it.n] || (this.buffers[it.n] = [])).push(b);
    };
    for (let i = 0; i < list.length; i += 6) await Promise.all(list.slice(i, i + 6).map(one));
    this.loaded = true;
  }
  // play one effect now (or at `when`): o = { x, y, vol, rate, delay }
  play(name, o = {}, when = this.c.currentTime, project) {
    const bufs = this.buffers[name]; if (!bufs) return false;
    const m = META(name), t = when + (o.delay || 0);
    if (!this.gate.allow(name, t, this.speed)) return false;
    const src = this.c.createBufferSource(); src.buffer = bufs[Math.floor(Math.random() * bufs.length)];
    let rate = (o.rate || 1) * (1 + R(-1, 1) * (m.pv ?? 0.05));
    if (o.coin) { this.coinN = t - this.coinT < 0.6 ? Math.min(9, this.coinN + 1) : 0; this.coinT = t; rate = Math.pow(2, this.coinN / 12); }
    src.playbackRate.value = rate;
    const g = this.c.createGain(); g.gain.value = (o.vol ?? 1) * (1 + R(-0.12, 0.12));
    let out = g;
    if (m.pos && o.x != null && project) {
      const p = project(o.x, o.y);
      if (p) { g.gain.value *= p.gain; if (this.c.createStereoPanner) { const pn = this.c.createStereoPanner(); pn.pan.value = p.pan; g.connect(pn); out = pn; } }
    }
    src.connect(g); out.connect(this.sfxBus);
    src.start(t);
    const dur = src.buffer.duration / rate;
    this.gate.voice({ prio: m.prio || 1, start: t, end: t + dur, stop: (at) => { try { g.gain.setTargetAtTime(0, at, 0.015); src.stop(at + 0.08); } catch (e) { /* already stopped */ } } });
    if (m.duck) { const d = this.duck.gain; hold(d, t); d.setTargetAtTime(0.45, t, 0.08); d.setTargetAtTime(1, t + Math.min(2.5, dur * 0.8), 0.6); }
    return true;
  }
  // once a frame: listen to the game, steer the music. info = { state, run, speed, quiet, project }; dt in seconds
  frame(info, when = this.c.currentTime, dt = 1 / 60) {
    if (info.speed !== this.speed || !!info.quiet !== this.quiet) { this.speed = info.speed || 1; this.quiet = !!info.quiet; this.apply(when); }
    watchRun(info.state === 'run' ? info.run : null);
    const evs = drain();
    if (!this.quiet) {   // play() skips any effect not rendered yet
      const perFrame = {};
      for (const ev of evs) for (const [name, o] of soundsFor(ev)) {
        perFrame[name] = (perFrame[name] || 0) + 1;
        if (perFrame[name] > 2) continue;              // the same sound three times in one frame: one is enough
        this.play(name, o, when, info.project);
      }
    }
    // music: the place, and whether there's a fight on
    let place = 'camp', root = null;
    const run = info.run, w = run && run.world;
    if (info.state === 'run' && w) {
      const th = run.theme in ROOTS ? run.theme : 'crypt';
      place = th; root = ROOTS[th];
      const boss = w.units.find((u) => u.def.boss && !u.dead && u.aggro);
      if (boss) { place = 'boss'; this.music.setLevel(Math.max(1, (boss.k && boss.k.phase) || (boss.hp < boss.maxHp * 0.5 ? 2 : 1))); }
      const foes = w.units.some((u) => u.team === 'enemy' && !u.dead && !u.downed && u.aggro);
      this.fightHold = foes ? 4 : Math.max(0, this.fightHold - dt);
      if (run.phase === 'won' || run.phase === 'lost' || run.phase === 'retreated') place = null;
    }
    // after a run: let the last stinger ring, then the camp's music comes back
    if (info.state === 'result') { this.resultT = (this.resultT || 0) + dt; if (this.resultT < 3) place = null; } else this.resultT = 0;
    this.music.setPlace(place, root, when, place === 'boss' ? 1.2 : 2.5);
    this.lastPlace = place;
    this.music.setFight(place === 'boss' || this.fightHold > 0, when);
    this.music.schedule(when + 0.35);
  }
}
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- in the page
let eng = null, timer = null, lastFrameT = 0;
const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);

// Make the sound engine on the first tap (iOS only allows it there) and wake it again after the app was away.
export function unlockAudio() {
  if (!AC) return;
  if (!eng) {
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* older iOS */ }
    const c = new AC({ latencyHint: 'interactive' });
    eng = new Engine(c);
    const b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);  // the iOS unlock
    timer = setInterval(() => { if (eng && eng.c.state === 'running') eng.music.schedule(eng.c.currentTime + 0.5); }, 200);
  }
  if (eng.c.state !== 'running') eng.c.resume().catch(() => {});
}

export function initAudio() {
  if (typeof document === 'undefined') return;
  listen(true);
  const wake = () => unlockAudio();
  for (const ev of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(ev, wake, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!eng) return; if (document.hidden) eng.c.suspend().catch(() => {}); else eng.c.resume().catch(() => {}); });
  // a soft click for every button
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('button, [data-act], .lookbtn')) cue('tap'); }, true);
  // the settings controls (soundSettingsHtml), wherever they're shown
  document.addEventListener('input', (e) => {
    const k = e.target.dataset && e.target.dataset.snd; if (!k || !(k in settings) || k === 'mute') return;
    settings[k] = Math.max(0, Math.min(1, +e.target.value / 100)); keep(); if (eng) eng.apply();
  });
  document.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.snd === 'sfx') cue('coin'); });
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('[data-snd="mute"]'); if (!el) return;
    settings.mute = !settings.mute; keep(); el.classList.toggle('on', !settings.mute); if (eng) eng.apply();
    for (const r of document.querySelectorAll('.snd-row')) r.classList.toggle('off', settings.mute);
  });
  const st = document.createElement('style');
  st.textContent = '.snd-row{display:flex;align-items:center;gap:12px;margin:8px 4px}.snd-row span{width:64px}.snd-row input{flex:1;accent-color:#F2B53A;height:28px}.snd-row.off{opacity:.45}';
  document.head.appendChild(st);
}

// The sound part of the settings sheet (camp.js puts it in).
export function soundSettingsHtml() {
  const row = (k, label) => `<label class="snd-row ${settings.mute ? 'off' : ''}"><span>${label}</span><input type="range" min="0" max="100" step="1" value="${Math.round(settings[k] * 100)}" data-snd="${k}"></label>`;
  return `<h3 class="set-h">Sound</h3>
    <button class="merc-toggle ${settings.mute ? '' : 'on'}" data-snd="mute"><span class="merc-text"><b>Sound on</b><span class="muted">Effects and music. Your phone's silent switch mutes it too.</span></span><span class="switch"><i></i></span></button>
    ${row('master', 'Volume')}${row('sfx', 'Effects')}${row('music', 'Music')}`;
}

// Once per animation frame from main.js. project(x, y) -> { pan, gain } places a sound in the room.
export function audioFrame(info) {
  if (!eng) { drain(); watchRun(info.state === 'run' ? info.run : null); return; }
  if (eng.c.state !== 'running') { drain(); return; }
  const now = eng.c.currentTime, dt = Math.min(0.25, now - lastFrameT || 1 / 60); lastFrameT = now;
  eng.frame(info, now, dt);
}
export const audioEngine = () => eng;
