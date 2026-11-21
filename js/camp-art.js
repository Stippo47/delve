// Pictures for the camp (UI v3): the night sky and fire behind the party, and a doorway for each dungeon.
// Plain SVG strings, flat shapes with soft gradients, no outlines (the UI's look, not the game sprites').
import { themeColors } from './ui-kit.js';

// The home screen's picture: sky, hills, trees, the fire's glow on the ground. The fire itself is DOM (it flickers).
export function nightSky() {
  const stars = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 83.7) % 390, y = (i * 37.3 + (i % 5) * 11) % 120, r = 0.6 + (i % 4) * 0.35;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fff" opacity="${(0.25 + (i % 3) * 0.2).toFixed(2)}"/>`;
  }).join('');
  const pines = (y0, n, h, col, seed) => Array.from({ length: n }, (_, i) => {
    const x = (i + 0.5) * 390 / n + ((i * seed) % 13) - 6, hh = h * (0.75 + ((i * 7 + seed) % 5) * 0.08);
    return `<path d="M${x} ${y0 - hh}L${x + hh * 0.32} ${y0}H${x - hh * 0.32}z" fill="${col}"/>`;
  }).join('');
  return `<svg class="sky" viewBox="0 0 390 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121733"/><stop offset=".7" stop-color="#1B2148"/><stop offset="1" stop-color="#0E1120"/></linearGradient>
      <radialGradient id="glowg" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="#FF9A3D" stop-opacity=".45"/><stop offset=".45" stop-color="#FF7A2F" stop-opacity=".12"/><stop offset="1" stop-color="#FF7A2F" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="390" height="240" fill="url(#skyg)"/>${stars}
    <circle cx="318" cy="44" r="17" fill="#F4ECD4"/><circle cx="326" cy="38" r="15" fill="#1A2044" opacity=".92"/>
    <path d="M0 150L48 112 92 136 150 92 206 134 262 100 318 130 390 104V240H0z" fill="#1A2046"/>
    <path d="M0 172L60 150 120 166 190 142 250 160 320 146 390 160V240H0z" fill="#151A38"/>
    ${pines(196, 17, 46, '#10142C', 5)}
    <rect y="190" width="390" height="50" fill="#0E1120"/>
    <ellipse cx="195" cy="240" rx="230" ry="90" fill="url(#glowg)"/>
  </svg>`;
}

// The fire: logs and three flame tongues; CSS flickers them.
export const fire = `<div class="fire" aria-hidden="true"><svg viewBox="0 0 60 60">
  <ellipse cx="30" cy="52" rx="22" ry="5" fill="#000" opacity=".35"/>
  <rect x="9" y="44" width="42" height="8" rx="4" fill="#6B4129" transform="rotate(-14 30 48)"/>
  <rect x="9" y="44" width="42" height="8" rx="4" fill="#80502F" transform="rotate(14 30 48)"/>
  <g class="fl f1"><path d="M30 6c4 9 13 15 13 26a13 13 0 0 1-26 0c0-6 4-10 6-12 0 4 2 6 4 6 0-7-2-12 3-20z" fill="#FF7A2F"/></g>
  <g class="fl f2"><path d="M30 18c3 6 8 9 8 16a8 8 0 0 1-16 0c0-4 3-7 4-8 1 3 2 4 3 4 0-4-1-7 1-12z" fill="#FFB347"/></g>
  <g class="fl f3"><path d="M30 30c2 3 4 5 4 8a4 4 0 0 1-8 0c0-3 2-5 4-8z" fill="#FFE59A"/></g>
</svg></div>`;

// A dungeon's doorway: its wall stone round an arch, its light inside, and a motif of the place.
const MOTIF = {
  wildwood: (a) => `<path d="M60 46l14 22h-8l12 18H42l12-18h-8z" fill="${a}" opacity=".9"/><path d="M57 86h6v8h-6z" fill="${a}"/>`, // round 9: a pine
  warren: (a) => `<path d="M38 92l6-12 6 12zM54 92l6-14 6 14zM70 92l6-12 6 12z" fill="${a}" opacity=".9"/>`,
  sewers: (a) => `<path d="M30 70h60" stroke="${a}" stroke-width="6" opacity=".55"/><circle cx="48" cy="80" r="3" fill="${a}"/><circle cx="70" cy="86" r="2.4" fill="${a}"/><path d="M32 96q14-6 28 0t28 0" stroke="${a}" stroke-width="3" fill="none"/>`,
  crypt: (a) => `<path d="M60 52v40M48 64h24" stroke="${a}" stroke-width="6" stroke-linecap="round"/>`,
  frost: (a) => `<path d="M34 46l5 18 5-18zM52 46l4 26 4-26zM68 46l5 16 5-16zM82 46l3 10 3-10z" fill="${a}"/>`,
  ember: (a) => `<path d="M60 52c6 10 14 14 14 26a14 14 0 0 1-28 0c0-6 4-10 6-12 0 4 2 6 4 6 0-8-2-12 4-20z" fill="${a}"/>`,
  dunes: (a) => `<path d="M34 92l26-40 26 40z" fill="${a}" opacity=".9"/><path d="M30 96q30-8 60 0" stroke="${a}" stroke-width="3" fill="none"/>`, // round 10: a pyramid
  foundry: (a) => `<circle cx="60" cy="72" r="16" fill="none" stroke="${a}" stroke-width="7" stroke-dasharray="6 4"/><circle cx="60" cy="72" r="5" fill="${a}"/>`, // a gear
  spire: (a) => `<path d="M60 44l10 18v30H50V62z" fill="${a}" opacity=".9"/><circle cx="60" cy="70" r="4" fill="#fff" opacity=".8"/>`,
};
export function doorway(t, id) {
  const c = themeColors(t), m = MOTIF[id] || MOTIF.crypt;
  return `<svg class="doorway" viewBox="0 0 120 120" aria-hidden="true"><defs>
      <radialGradient id="dl-${id}" cx="50%" cy="80%" r="70%"><stop offset="0" stop-color="${c.accent}" stop-opacity=".95"/><stop offset=".55" stop-color="${c.accent}" stop-opacity=".25"/><stop offset="1" stop-color="${c.rock}" stop-opacity="1"/></radialGradient></defs>
    <rect x="6" y="14" width="108" height="100" rx="16" fill="${c.wall}"/>
    <path d="M6 44h108M6 74h108M40 14v30M80 14v30M24 44v30M60 44v0M96 44v30M40 74v40M80 74v40" stroke="${c.wall2}" stroke-width="3" opacity=".7"/>
    <path d="M26 114V58a34 34 0 0 1 68 0v56z" fill="${c.rock}"/>
    <path d="M30 114V58a30 30 0 0 1 60 0v56z" fill="url(#dl-${id})"/>
    ${m(c.rock)}
  </svg>`;
}
