// Sprite cache. Every unit is one sprite drawn front-down in a 220x220 box centred on (100,100),
// then rotated whole in-game. SVG art is rasterised once per pixel size; rats and slimes are drawn
// procedurally in the same space so they match the outline/gradient rendering.
import { INK } from './util.js';
import { DEFS } from './units.js';
import { loadArt } from './parts.js';
import { recolorCanvas } from './recolor.js';

// (the skeleton kind is drawn from parts now, in the Rattler's art: units.js)
const SVG_KINDS = { archer: 'art/archer.svg', knight: 'art/knight.svg', rogue: 'art/rogue.svg', boss: 'art/boss.svg' };

// Radius of the collision head inside each sprite's 220-unit box. Used to size sprites to unit radius.
export const HEAD_R = { archer: 56, knight: 58, rogue: 52, skeleton: 60, boss: 62, rat: 50, slime: 54 };

const svgText = {};
const cache = new Map();

export async function loadSprites() {
  await Promise.all(Object.entries(SVG_KINDS).map(async ([k, url]) => {
    try { svgText[k] = await (await fetch(url)).text(); } catch (e) { svgText[k] = null; }
  }));
  // kinds drawn from SVG parts (parts.js)
  await Promise.all([...new Set(Object.values(DEFS).map((d) => d.art).filter(Boolean))].map(loadArt));
  loadProps(); // props draw procedurally until their art arrives
}

function makeCanvas(px) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  return c;
}

function whiteCopy(src) {
  const c = makeCanvas(src.width);
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function greyCopy(src) {
  const c = makeCanvas(src.width);
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(120,112,125,0.72)';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function rasterSvg(text, px) {
  return new Promise((resolve) => {
    const sized = text.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1')
      .replace('<svg', `<svg width="${px}" height="${px}"`);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
    img.onload = () => { const c = makeCanvas(px); c.getContext('2d').drawImage(img, 0, 0, px, px); URL.revokeObjectURL(url); resolve(c); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// ---- procedural enemies, drawn in the 220-unit box (origin at -10,-10) ----
function grad(g, y0, y1, a, b) { const l = g.createLinearGradient(0, y0, 0, y1); l.addColorStop(0, a); l.addColorStop(1, b); return l; }

function drawRat(g, lw) {
  const body = new Path2D('M100 44 C134 44 150 72 150 100 C150 124 134 142 116 150 L100 176 L84 150 C66 142 50 124 50 100 C50 72 66 44 100 44 Z');
  const earL = new Path2D('M62 70 C44 58 36 78 46 92 C54 92 62 84 66 76 Z');
  const earR = new Path2D('M138 70 C156 58 164 78 154 92 C146 92 138 84 134 76 Z');
  const tail = new Path2D('M100 50 C98 30 112 18 126 14 C136 12 140 4 136 -2');
  g.lineJoin = 'round'; g.lineCap = 'round';
  // the tail is drawn by the renderer as its own springy part
  for (const p of [earL, earR, body]) { g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = lw; g.fill(p); g.stroke(p); }
  g.fillStyle = grad(g, 60, 100, '#E9B7AE', '#C98E86'); g.fill(earL); g.fill(earR);
  g.fillStyle = grad(g, 44, 176, '#9C8676', '#6F5A4D'); g.fill(body);
  g.save(); g.clip(body); g.fillStyle = 'rgba(43,34,48,0.18)'; g.fillRect(100, 0, 120, 220); g.restore();
  g.fillStyle = '#E2A1A5'; g.beginPath(); g.arc(100, 170, 7, 0, Math.PI * 2); g.fill();
}

function drawSlime(g, tint, lw) {
  const body = new Path2D('M100 42 C140 42 156 72 156 104 C156 138 134 158 100 160 C66 158 44 138 44 104 C44 72 60 42 100 42 Z');
  const drip = new Path2D('M86 152 C90 170 96 180 100 184 C104 180 110 170 114 152 Z');
  for (const p of [drip, body]) { g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = 'round'; g.fill(p); g.stroke(p); }
  g.fillStyle = grad(g, 42, 184, tint[0], tint[1]); g.fill(body); g.fill(drip);
  g.save(); g.clip(body);
  g.fillStyle = 'rgba(20,70,60,0.22)'; g.beginPath(); g.arc(108, 112, 30, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(78, 72, 14, 9, -0.5, 0, Math.PI * 2); g.fill();
  g.restore();
}

function proceduralCanvas(kind, px) {
  const c = makeCanvas(px);
  const g = c.getContext('2d');
  const s = px / 220;
  g.setTransform(s, 0, 0, s, 10 * s, 10 * s);
  // a variant (recolor.js) draws its base kind, then its colours are turned
  const d = DEFS[kind], base = (d && d.spriteOf) || kind;
  // Outline widths chosen so the outline shows the same thickness in the world as the SVG heroes' (see OUTLINE in render.js).
  // Round 9: "The base slime is blue".
  if (base === 'rat') drawRat(g, 16);
  else if (base === 'slime') drawSlime(g, ['#8EC2F2', '#3F7AC4'], 12);
  else if (base === 'slimeSmall') drawSlime(g, ['#B4D6F6', '#5C92D2'], 18);
  if (d && d.recolor && base !== kind) { g.setTransform(1, 0, 0, 1, 0, 0); recolorCanvas(c, d.recolor); }
  return c;
}

// Returns {img, flash, grey} canvases for a kind at a pixel size (bucketed to 8px to bound the cache).
export function getSprite(kind, px) {
  const size = Math.max(16, Math.min(512, Math.round(px / 8) * 8));
  const key = kind + ':' + size;
  let e = cache.get(key);
  if (e) return e.ready ? e : null;
  e = { ready: false };
  cache.set(key, e);
  const done = (cv) => { if (!cv) return; e.img = cv; e.flash = whiteCopy(cv); e.grey = greyCopy(cv); e.ready = true; };
  if (SVG_KINDS[kind] && svgText[kind]) rasterSvg(svgText[kind], size).then(done);
  else done(proceduralCanvas(kind, size));
  return e.ready ? e : null;
}

// A copy of a sprite washed with a colour (chilled blue, poisoned green), made once per sprite and colour.
export function tinted(e, color) {
  e.tints = e.tints || {};
  if (!e.tints[color]) {
    const c = makeCanvas(e.img.width); const g = c.getContext('2d');
    g.drawImage(e.img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    e.tints[color] = c;
  }
  return e.tints[color];
}

export const headR = (kind) => HEAD_R[kind] || (DEFS[kind] && DEFS[kind].headR) || HEAD_R[kind.replace('Small', '')] || 54;


// ---- props (art/props/*.svg), drawn whole with their own outline filter. A file's #spill / #glow (light with no
// outline) comes as a separate image so the game can pulse it.
const PROPS = ['chest-closed', 'chest-locked', 'chest-open', 'door-open', 'door-shut', 'door-open-boss', 'door-open-choice',
  'door-open-elite', 'door-open-fight', 'door-open-fountain', 'door-open-hazard', 'door-open-treasure', 'fountain', 'fountain-used',
  'hazard-oil', 'obstacle-crates', 'obstacle-pillar', 'obstacle-rock', 'pedestal', 'trap-spikes-down', 'trap-spikes-up',
  'crate', 'barrel', 'brazier', 'rock-1', 'rock-2', 'rock-3', 'rock-4'];
const propText = {};
const propCache = new Map();
export async function loadProps() {
  await Promise.all(PROPS.map(async (n) => {
    try {
      const t = await (await fetch(`art/props/${n}.svg`)).text();
      const doc = new DOMParser().parseFromString(t, 'image/svg+xml'), ser = new XMLSerializer();
      const extra = doc.querySelector('#spill, #glow');
      if (!extra) { propText[n] = { main: t }; return; }
      const a = doc.documentElement.cloneNode(true); a.querySelector('#' + extra.id).remove();
      const b = doc.documentElement.cloneNode(true); const sp = b.querySelector('#sprite'); if (sp) sp.remove();
      const over = !!(doc.querySelector('#sprite') && (extra.compareDocumentPosition(doc.querySelector('#sprite')) & 2)); // the light goes over the prop
      propText[n] = { main: ser.serializeToString(a), extra: ser.serializeToString(b), over };
    } catch { propText[n] = null; }
  }));
}
// { img, extra } canvases for a prop at about px pixels across its box, or null while it renders.
export function getProp(name, px) {
  const src = propText[name]; if (!src) return null;
  const size = Math.max(16, Math.min(1024, Math.ceil(px / 16) * 16));
  const key = name + ':' + size;
  let e = propCache.get(key);
  if (!e) {
    e = { ready: false }; propCache.set(key, e);
    Promise.all([rasterSvg(src.main, size), src.extra ? rasterSvg(src.extra, size) : null]).then(([m, x]) => { if (m) { e.img = m; e.extra = x; e.over = src.over; e.ready = true; } });
  }
  if (e.ready) { e.used = 1; return e; }
  for (const [k, o] of propCache) if (o.ready && k.startsWith(name + ':')) return o; // another size stands in meanwhile
  return null;
}
