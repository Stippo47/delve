// Sprite cache. Every unit is one sprite drawn front-down in a 220x220 box centred on (100,100),
// then rotated whole in-game. SVG art is rasterised once per pixel size; rats and slimes are drawn
// procedurally in the same space so they match the outline/gradient rendering.
import { INK, OUTLINE, OUTLINES, OLCOL, OLKEY, inkFor, inkRGB } from './util.js'; // (round 19, lane looks19: the outline's own colour)
import { DEFS } from './units.js';
import { loadArt, growInk, growOwn, domOf } from './parts.js';
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
  // the pages' pictures of every kind, outlined (uiArt), before the first page shows them
  await Promise.all([...new Set(Object.values(DEFS).flatMap((d) => [d.portrait, d.art]).filter(Boolean))].map(prepareUiArt));
}

// ---- the pages' pictures (round 19, lane outline19). The art files carry no outline now (tools/outline19/strip-outlines.mjs
// took their #outline filters out: the game draws its own, parts.js); a picture shown in a page as an <img> (portraits,
// faces, the tree's) gets one here instead: the file with an outline filter put back round its #sprite, as a blob URL.
// Its width is the old filter's, about 6 units of the 220 box, so every portrait of one size wears the same line.
// uiArt(url): that URL once ready (prepareUiArt, at load for every kind), the plain file until then.
// (three dilations, a wide, a tall and a square one, make a rounded grow: the old filter's)
const UI_FILTER = `<filter id="ui-outline" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="6 2.5" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="2.5 6" result="b"/><feMorphology in="SourceAlpha" operator="dilate" radius="4.6" result="c"/><feMerge result="d"><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="c"/></feMerge><feFlood flood-color="${INK}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const uiUrls = new Map(), uiAsked = new Map();
const fileOf = (url) => String(url).split('#')[0].split('?')[0];
export function prepareUiArt(url) {
  const f = fileOf(url); if (!f.endsWith('.svg')) return Promise.resolve();
  if (!uiAsked.has(f)) uiAsked.set(f, fetch(f).then((r) => r.text()).then((t) => {
    if (!/id="sprite"/.test(t)) return; // (a file with no #sprite is shown as it is)
    const o = t.replace(/<g([^>]*)\sid="sprite"([^>]*)>/, (m, x, y) => `<g${x} id="sprite"${y.replace(/\sfilter="[^"]*"/, '')} filter="url(#ui-outline)">`)
      .replace(/<defs>/, '<defs>' + UI_FILTER);
    const t2 = /<defs>/.test(t) ? o : o.replace(/(<svg[^>]*>)/, `$1<defs>${UI_FILTER}</defs>`);
    uiUrls.set(f, URL.createObjectURL(new Blob([t2], { type: 'image/svg+xml' })));
  }).catch(() => {}));
  return uiAsked.get(f);
}
export function uiArt(url) {
  if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const u = uiUrls.get(fileOf(url)); if (u) return u;
  prepareUiArt(url); return url;
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
  if (lw > 0) for (const p of [earL, earR, body]) { g.fillStyle = g.strokeStyle = inkFor(p === body ? '#86705F' : '#D9A39A'); g.lineWidth = lw; g.fill(p); g.stroke(p); } // (round 19, lane looks19: inkFor)
  g.fillStyle = grad(g, 60, 100, '#E9B7AE', '#C98E86'); g.fill(earL); g.fill(earR);
  g.fillStyle = grad(g, 44, 176, '#9C8676', '#6F5A4D'); g.fill(body);
  g.save(); g.clip(body); g.fillStyle = 'rgba(43,34,48,0.18)'; g.fillRect(100, 0, 120, 220); g.restore();
  g.fillStyle = '#E2A1A5'; g.beginPath(); g.arc(100, 170, 7, 0, Math.PI * 2); g.fill();
}

function drawSlime(g, tint, lw) {
  const body = new Path2D('M100 42 C140 42 156 72 156 104 C156 138 134 158 100 160 C66 158 44 138 44 104 C44 72 60 42 100 42 Z');
  const drip = new Path2D('M86 152 C90 170 96 180 100 184 C104 180 110 170 114 152 Z');
  if (lw > 0) for (const p of [drip, body]) { g.fillStyle = g.strokeStyle = inkFor(tint[1]); g.lineWidth = lw; g.lineJoin = 'round'; g.fill(p); g.stroke(p); } // (round 19, lane looks19: inkFor)
  g.fillStyle = grad(g, 42, 184, tint[0], tint[1]); g.fill(body); g.fill(drip);
  g.save(); g.clip(body);
  g.fillStyle = 'rgba(20,70,60,0.22)'; g.beginPath(); g.arc(108, 112, 30, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(78, 72, 14, 9, -0.5, 0, Math.PI * 2); g.fill();
  g.restore();
}

function proceduralCanvas(kind, px, lw0) {
  const c = makeCanvas(px);
  const g = c.getContext('2d');
  const s = px / 220;
  g.setTransform(s, 0, 0, s, 10 * s, 10 * s);
  // a variant (recolor.js) draws its base kind, then its colours are turned
  const d = DEFS[kind], base = (d && d.spriteOf) || kind;
  // The ink is stroked twice the outline wide (half of it outside): lw0, from the size it's drawn at (round 19, lane
  // outline19: OUTLINE whatever the size, a mouse's too), else the widths once chosen to match the heroes'.
  // Round 9: "The base slime is blue".
  // (round 19, lane toggles19: lw0 < 0, outlines off: no ink)
  if (base === 'rat') drawRat(g, lw0 < 0 ? 0 : lw0 || 16);
  else if (base === 'slime') drawSlime(g, ['#8EC2F2', '#3F7AC4'], lw0 < 0 ? 0 : lw0 || 12);
  else if (base === 'slimeSmall') drawSlime(g, ['#B4D6F6', '#5C92D2'], lw0 < 0 ? 0 : lw0 || 18);
  if (d && d.recolor && base !== kind) { g.setTransform(1, 0, 0, 1, 0, 0); recolorCanvas(c, d.recolor); }
  return c;
}

// Returns {img, flash, grey} canvases for a kind at a pixel size (bucketed to 8px to bound the cache). sizeU: how big
// it is drawn (room units per 220 box), so a procedural one's ink comes out OUTLINE wide (round 19, lane outline19).
export function getSprite(kind, px, sizeU) {
  const size = Math.max(16, Math.min(512, Math.round(px / 8) * 8));
  const lw = !OUTLINES ? -1 : sizeU > 0 ? Math.round(OUTLINE * 2 * 220 / sizeU * 4) / 4 : 0; // (-1: outlines off, lane toggles19)
  const key = kind + ':' + size + ':' + lw + OLKEY; // (round 19, lane looks19: OLKEY, its outline's colour)
  let e = cache.get(key);
  if (e) return e.ready ? e : null;
  e = { ready: false };
  cache.set(key, e);
  const done = (cv) => { if (!cv) return; e.img = cv; e.flash = whiteCopy(cv); e.grey = greyCopy(cv); e.ready = true; };
  if (SVG_KINDS[kind] && svgText[kind]) rasterSvg(svgText[kind], size).then(done);
  else done(proceduralCanvas(kind, size, lw));
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


// ---- props (art/props/*.svg). A file's #spill / #glow (light with no outline) comes as a separate image so the game
// can pulse it. Round 19 (lane outline19): the outline is the renderer's, OUTLINE room units whatever the prop's size
// (it was each file's #outline filter, 6 units of its box: thicker on a big rock, thinner on a small one). The loader
// takes out any outline filter a file still has; getProp grows the silhouette by the outline in pixels the caller gives.
// A file whose #sprite children are marked data-ink="own" (rock-3's three rocks) is outlined a child at a time, in order,
// so each piece keeps its own line where it lies over the one before. NO_INK: ground things, never outlined (the FX rule).
const PROPS = ['chest-closed', 'chest-locked', 'chest-open', 'door-open', 'door-shut', 'door-open-boss', 'door-open-choice',
  'door-open-elite', 'door-open-fight', 'door-open-fountain', 'door-open-hazard', 'door-open-treasure', 'fountain', 'fountain-used',
  'hazard-oil', 'obstacle-crates', 'obstacle-pillar', 'obstacle-rock', 'pedestal', 'trap-spikes-down', 'trap-spikes-up',
  'crate', 'barrel', 'brazier', 'rock-1', 'rock-2', 'rock-3', 'rock-4', 'troll-boulder', 'yeti-snowball'];
const NO_INK = new Set(['hazard-oil']);
const propText = {};
const propCache = new Map();
const unOutline = (root) => { for (const el of root.querySelectorAll('[filter]')) if (/#outline\b/.test(el.getAttribute('filter'))) { if (el.getAttribute('id') !== 'sprite') el.setAttribute('data-ink', 'own'); el.removeAttribute('filter'); } };
export async function loadProps() {
  await Promise.all(PROPS.map(async (n) => {
    try {
      const t = await (await fetch(`art/props/${n}.svg`)).text();
      const doc = new DOMParser().parseFromString(t, 'image/svg+xml'), ser = new XMLSerializer();
      unOutline(doc.documentElement);
      const extra = doc.querySelector('#spill, #glow'), spr = doc.querySelector('#sprite');
      const over = !!(extra && spr && (extra.compareDocumentPosition(spr) & 2)); // the light goes over the prop
      const a = doc.documentElement.cloneNode(true); if (extra) a.querySelector('#' + extra.id).remove();
      // its layers, in order: what lies outside #sprite (a #light on the floor) is never outlined; #sprite is outlined
      // whole, or a child at a time where its children are marked data-ink="own" (rock-3)
      const marks = [], sp = a.querySelector('#sprite'), kids = sp ? [...sp.children] : [];
      const own = kids.some((k) => k.getAttribute('data-ink') === 'own');
      for (const el of [...a.children]) {
        if (el.tagName === 'defs' || el.tagName === 'title') continue;
        if (el === sp && own) for (const k of kids) marks.push([k, k.getAttribute('data-ink') === 'own']);
        else marks.push([el, el === sp]);
      }
      marks.forEach(([el], i) => el.setAttribute('data-l', String(i)));
      const layers = []; // consecutive layers of one kind go together
      marks.forEach(([, ink], i) => { const last = layers[layers.length - 1]; if (last && !ink && !last.ink) last.ids.push(i); else layers.push({ ink, ids: [i] }); });
      for (const L of layers) { const r = a.cloneNode(true); for (const el of [...r.querySelectorAll('[data-l]')]) if (!L.ids.includes(+el.getAttribute('data-l'))) el.remove(); L.text = ser.serializeToString(r); }
      let x = null;
      if (extra) { const b = doc.documentElement.cloneNode(true); const s2 = b.querySelector('#sprite'); if (s2) s2.remove(); x = ser.serializeToString(b); }
      propText[n] = { layers, extra: x, over, ink: !NO_INK.has(n) };
    } catch { propText[n] = null; }
  }));
}
// The prop's picture with the outline grown round it: a canvas pad pixels bigger on every side than the box's px.
// layers: [{ c (the layer at px), ink }] in order; an inked layer's silhouette (its see-through shading left out: alpha
// under a half counts as nothing) is grown by line pixels in ink under it.
function inkProp(layers, px, line) {
  const pad = Math.ceil(line) + 2, c = makeCanvas(px + pad * 2), g = c.getContext('2d');
  for (const L of layers) {
    if (L.ink && line > 0) {
      const p = makeCanvas(px + pad * 2), pg = p.getContext('2d'); pg.drawImage(L.c, pad, pad);
      try { const d = pg.getImageData(0, 0, p.width, p.height), q = d.data; for (let i = 3; i < q.length; i += 4) q[i] = Math.max(0, Math.min(255, (q[i] - 110) * 3)); pg.putImageData(d, 0, 0); } catch {}
      g.drawImage(!OLCOL.own ? growInk(p, line, INK) : OLCOL.how === 'pixel' ? growOwn(p, line) : growInk(p, line, ownDom(p)), 0, 0); // (round 19, lane looks19: Own colour)
    }
    g.drawImage(L.c, pad, pad);
  }
  return { c, pad };
}
// (round 19, lane looks19) a picture's commonest colour, shaded for its outline (the 'part' / 'figure' ways of Own colour)
function ownDom(c) { try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height), m = domOf(d.data, c.width); return m ? inkRGB(m[0], m[1], m[2]) : INK; } catch { return INK; } }
// { img, extra, pad } canvases for a prop at about px pixels across its box, its outline linePx pixels (OUTLINE in the
// caller's pixels; the default: 6 units of the box, the old filter's), or null while it renders. img is pad pixels
// bigger on every side than the box (extra is the box).
export function getProp(name, px, linePx) {
  const src = propText[name]; if (!src) return null;
  const size = Math.max(16, Math.min(1024, Math.ceil(px / 16) * 16));
  const line = src.ink && OUTLINES ? Math.round((linePx > 0 ? linePx * size / px : size * 6 / 220) * 4) / 4 : 0;
  const key = name + ':' + OLKEY + ':' + size + ':' + line; // (round 19, lane looks19: OLKEY)
  let e = propCache.get(key);
  if (!e) {
    e = { ready: false }; propCache.set(key, e);
    Promise.all([Promise.all(src.layers.map((L) => rasterSvg(L.text, size))), src.extra ? rasterSvg(src.extra, size) : null]).then(([ms, x]) => {
      if (ms.some((m) => !m)) return;
      const k = inkProp(ms.map((m, i) => ({ c: m, ink: src.layers[i].ink })), size, line); e.img = k.c; e.pad = k.pad; e.size = size; e.extra = x; e.over = src.over; e.ready = true;
    });
  }
  if (e.ready) { e.used = 1; return e; }
  for (const [k, o] of propCache) if (o.ready && k.startsWith(name + ':') && (k.endsWith(':0') === !line)) return o; // another size stands in meanwhile (one with or without an outline as asked: lane toggles19)
  return null;
}
