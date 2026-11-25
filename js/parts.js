// Sprites built from parts. Every kind with `art` (an SVG laid out in parts: #back, #body, #arm-l, #arm-r, #front
// inside #sprite, arms with a data-pivot) is split into one image per part, so the game can swing the arms. The
// outline goes on afterwards over the whole figure: each part also has an "ink" copy, its silhouette grown by the
// outline radius; all the inks are drawn first, then the parts in file order on top. The union of grown silhouettes
// is the grown union, so the outline hugs the combined figure with no lines between parts, like the SVG filter did.
// Round 19 (lane outline19, "check that outline thickness is consistent everywhere"): the ink is grown by OUTLINE room
// units whatever the figure's size: getRig(url, px, sizeU) is told how big the figure is drawn (room units per 220 box)
// and grows its inks by OUTLINE * 220 / sizeU SVG units (it was 6 SVG units for all, so a big troll's outline was 1.6x
// a hero's and a bee's half; the gaper's data-line made up for it by hand). The art files carry no outline of their own.
//
// Coordinates: everything here is in SVG units, the sprite's own frame (220 box, centre 100,100, front = +y).
import { INK, OUTLINE, clamp, wrapAngle } from './util.js';
import { parseVariantUrl, recolorSvgText } from './recolor.js';

const LINE = 6;            // outline radius in SVG units when the caller doesn't say how big it draws the figure (about OUTLINE at hero size)
const B0 = -24, BOX = 248; // the raster box: the 220 box plus room for the outline
const arts = new Map();    // url -> { text, layers, string } once loaded, or a promise while loading

// ---------------------------------------------------------------- loading and splitting
export function loadArt(url) {
  if (arts.has(url)) return arts.get(url).promise;
  const e = { promise: null, rig: null, sets: new Map() };
  arts.set(url, e);
  // a variant (recolor.js): the base file, its colours turned before it is split into parts
  const { file, spec } = parseVariantUrl(url);
  e.promise = fetch(file).then((r) => r.text()).then((text) => { e.rig = splitSvg(recolorSvgText(text, spec)); }).catch(() => { e.rig = null; e.failed = true; });
  return e.promise;
}

function splitSvg(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const sprite = doc.getElementById('sprite');
  if (!sprite) return null;
  const kids = [...sprite.children];
  const ser = new XMLSerializer();
  const layers = [];
  let string = null;
  kids.forEach((el, i) => {
    const id = el.getAttribute('id') || 'layer' + i;
    const pv = (el.getAttribute('data-pivot') || '').trim().split(/[\s,]+/).map(Number);
    const pivot = pv.length === 2 && pv.every(Number.isFinite) ? pv : [100, 100];
    // the archer's bow string is drawn live, so its middle can follow the drawing hand
    const root = doc.documentElement.cloneNode(true);
    const sp = root.querySelector('#sprite');
    sp.removeAttribute('filter');
    [...sp.children].forEach((c, j) => { if (j !== i) c.remove(); });
    const st = sp.querySelector('[id="string"]');
    if (st && st.tagName === 'path') {
      const n = (st.getAttribute('d') || '').match(/-?\d*\.?\d+/g);
      if (n && n.length >= 6) {
        string = { layer: id, pts: [[+n[0], +n[1]], [+n[2], +n[3]], [+n[4], +n[5]]], color: st.getAttribute('stroke') || '#FFF8E8', w: +(st.getAttribute('stroke-width') || 2.5) };
        st.remove();
      }
    }
    root.setAttribute('viewBox', `${B0} ${B0} ${BOX} ${BOX}`);
    root.removeAttribute('width'); root.removeAttribute('height');
    const L = { id, pivot, moves: /^(arm-|back|front|top)/.test(id) && el.hasAttribute('data-pivot'), text: ser.serializeToString(root) };
    layers.push(L);
    // round 19 (lane rogue19, Disarmed): an arm that holds a weapon also gets a bare copy, the hand alone (drawn in its
    // place while its owner is disarmed: pose[arm].bare)
    if (/^arm-[lr]$/.test(id)) { const gear = bareArm(doc, root.cloneNode(true), id, false), bare = gear && bareArm(doc, root, id, true);
      if (bare) layers.push({ id: id + '~bare', bareOf: id, pivot, moves: L.moves, text: ser.serializeToString(bare) }, { id: id + '~gear', gearOf: id, pivot, moves: false, text: ser.serializeToString(gear) }); }
  });
  // (art round 11's data-line, a thinner line asked for by an art drawn big, is gone: round 19, lane outline19, every
  // outline is OUTLINE room units from the size it's drawn at: lineFor)
  const line = LINE;
  // round 19 (lane sys19; the designer on Warhelm: "Left should be behind, free hands don't get to float"): an arm part
  // that is only a fist (three shapes or fewer: the fist, its shadow) drawn over the body in the file is a free hand;
  // poseFor puts it under the body while the other hand holds the weapon (pose.under; paintRig)
  const bodyAt = kids.findIndex((el) => el.getAttribute('id') === 'body'), free = new Set();
  kids.forEach((el, i) => { const id = el.getAttribute('id') || ''; if (bodyAt >= 0 && i > bodyAt && /^arm-[lr]$/.test(id) && el.querySelectorAll('path,rect,circle,ellipse,polygon,line,use').length <= 3) free.add(id); });
  return { layers, string, line, free, has: Object.fromEntries(layers.map((l) => [l.id, true])) };
}

// Round 19 (lane rogue19): Disarmed hides the weapon. An arm part is a hand and whatever it holds; which shapes are the
// hand is read off the art: a shape whose own fill (the first solid one it is painted with: a shading laid over it or a
// shadow under it doesn't count) is a hand's (the heroes' gHand / gUnder, a skeleton's bone, skin, a fist or a palm), or
// is a fill the other arm is painted with when that arm holds nothing metal or wooden (an enemy's free hand: its skin).
// Everything else in the arm is the weapon. The bare copy is the arm with the weapon's shapes taken out (null when the
// arm holds nothing).
const HAND_FILL = /hand|under|fist|palm|bone|skin|flesh|paw/i, GEAR_FILL = /steel|iron|blade|wood|rust|metal|brass|gold|wrap|grip|haft/i;
const LEAF = new Set(['path', 'use', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line']);
const leavesOf = (el) => [...el.querySelectorAll('*')].filter((n) => LEAF.has(n.tagName) && !n.closest('defs,clipPath,mask,linearGradient,radialGradient'));
const shapeKey = (n) => n.tagName === 'use' ? 'u:' + (n.getAttribute('href') || n.getAttribute('xlink:href')) : n.tagName + ':' + (n.getAttribute('d') || [n.getAttribute('x'), n.getAttribute('y'), n.getAttribute('width'), n.getAttribute('cx'), n.getAttribute('cy'), n.getAttribute('r'), n.getAttribute('points')].join(','));
const solidFill = (n) => { const f = n.getAttribute('fill'), o = +(n.getAttribute('opacity') ?? 1); return f && f !== 'none' && o >= 0.99 && !n.closest('[clip-path]') && !/^#2B2230$/i.test(f) ? f : null; };
function bareArm(doc, root, id, keepHand = true) { // (keepHand false: the weapon alone, for the look of it flying out of the hand)
  const arm = root.querySelector('[id="' + id + '"]'), other = doc.getElementById(id === 'arm-r' ? 'arm-l' : 'arm-r');
  if (!arm) return null;
  const own = new Map(); // the shape -> its own fill
  for (const n of leavesOf(arm)) { const k = shapeKey(n), f = solidFill(n); if (f && !own.has(k)) own.set(k, f); }
  const otherFills = new Set(); let otherArmed = false;
  if (other) for (const n of leavesOf(other)) { const f = solidFill(n); if (f) { otherFills.add(f); if (GEAR_FILL.test(f)) otherArmed = true; } }
  const ownHands = !!doc.getElementById('gHand'); // (the heroes' art names its hands: go by the names alone)
  const body = doc.getElementById('body'), bodyFills = new Set(); if (body) for (const n of leavesOf(body)) { const f = solidFill(n); if (f) bodyFills.add(f); }
  // an enemy's hand, first try: a fill the other hand has and the body shows too (skin: its ears, its neck); then the
  // other hand's alone (when it holds nothing metal or wooden); then the body's alone (the other hand is gloved)
  const tries = ownHands ? [() => false] : [(f) => otherFills.has(f) && bodyFills.has(f), (f) => !otherArmed && otherFills.has(f), (f) => bodyFills.has(f)];
  let isHand = null;
  for (const t of tries) { const h = (f) => !!f && (HAND_FILL.test(f) || (!GEAR_FILL.test(f) && t(f))); isHand = h; if ([...own.values()].some(h)) break; }
  let gone = 0, kept = 0;
  for (const n of leavesOf(arm)) { const f = own.get(shapeKey(n)) || solidFill(n); if (isHand(f) === keepHand) kept++; else { n.remove(); gone++; } }
  if (!gone || !kept) return null; // nothing held (or no hand found: leave the arm as it is)
  // groups left empty (a clip round a shape that went) go too
  for (let pass = 0; pass < 4; pass++) for (const g of [...arm.querySelectorAll('g')]) if (!leavesOf(g).length) g.remove();
  return root;
}

function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }

function raster(text, px) {
  return new Promise((resolve) => {
    const sized = text.replace('<svg', `<svg width="${px}" height="${px}"`);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
    img.onload = () => { const c = canvas(px, px); c.getContext('2d').drawImage(img, 0, 0, px, px); URL.revokeObjectURL(url); resolve(c); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// One raster set: every layer at one pixel size, cropped, with its ink copy.
async function buildSet(rig, px, line) {
  const k = px / BOX; // pixels per SVG unit
  const cvs = await Promise.all(rig.layers.map((l) => raster(l.text, px)));
  if (cvs.some((c) => !c)) return null;
  let data = null;
  try { data = cvs.map((c) => c.getContext('2d').getImageData(0, 0, px, px)); } catch { data = null; }
  if (data) moveLooseShadows(rig, data);
  const out = [];
  rig.layers.forEach((l, i) => {
    let x0 = 0, y0 = 0, x1 = px, y1 = px;
    if (data) {
      const d = data[i].data; x0 = px; y0 = px; x1 = 0; y1 = 0;
      for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) if (d[(y * px + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < x0) return; // an empty layer
      cvs[i].getContext('2d').putImageData(data[i], 0, 0);
      const m = Math.ceil(line * k) + 2;
      x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(px, x1 + m + 1); y1 = Math.min(px, y1 + m + 1);
    }
    const w = x1 - x0, h = y1 - y0;
    const img = canvas(w, h); img.getContext('2d').drawImage(cvs[i], -x0, -y0);
    out.push({ id: l.id, bareOf: l.bareOf, gearOf: l.gearOf, pivot: l.pivot, moves: l.moves, img, ink: grow(img, line * k, INK), x: B0 + x0 / k, y: B0 + y0 / k, w: w / k, h: h / k, tints: {} });
  });
  for (const L of out) if (L.bareOf) { const A = out.find((x) => x.id === L.bareOf); if (A) A.hasBare = true; } // (round 19: Disarmed)
  return { px, k, line, layers: out, string: rig.string, used: 0 };
}

// The silhouette grown by r pixels, filled with one colour: stamps of the alpha round two circles.
export function growInk(src, r, color) { return grow(src, r, color); }
function grow(src, r, color) {
  const c = canvas(src.width, src.height), g = c.getContext('2d');
  const ring = (rr, n, ph) => { for (let i = 0; i < n; i++) { const a = (i + ph) / n * Math.PI * 2; g.drawImage(src, Math.cos(a) * rr, Math.sin(a) * rr); } };
  g.drawImage(src, 0, 0); ring(r, 24, 0); ring(r * 0.55, 12, 0.5);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}

// A fixed layer (the body) can hold shadows it casts on a moving part under it (the shoulders' shadow on a sword
// where it comes out from under them). Those must move with the part, so they are handed down to it.
function moveLooseShadows(rig, data) {
  const n = data[0].data.length;
  rig.layers.forEach((l, i) => {
    if (l.moves || l.gearOf) return; // (round 19: a weapon alone, ~gear, is only drawn flying: it neither gives nor takes)
    const below = []; for (let j = i - 1; j >= 0; j--) if (rig.layers[j].moves && !rig.layers[j].gearOf) below.push(data[j].data);
    // (round 19: an arm and its bare copy are one part drawn two ways: a shadow handed to one goes to both)
    const twinOf = new Map(); rig.layers.forEach((a, ai) => { if (a.bareOf) { const bi = rig.layers.findIndex((b) => b.id === a.bareOf); if (bi >= 0) { twinOf.set(data[ai].data, data[bi].data); twinOf.set(data[bi].data, data[ai].data); } } });
    if (!below.length) return;
    const s = data[i].data;
    for (let p = 0; p < n; p += 4) {
      const a = s[p + 3];
      if (a < 6 || a > 215 || s[p] + s[p + 1] + s[p + 2] > 330) continue; // only see-through dark pixels
      const t = below.find((d) => d[p + 3] > 0);
      if (!t) continue;
      const f = a / 255;
      for (let c = 0; c < 3; c++) t[p + c] = Math.round(s[p + c] * f + t[p + c] * (1 - f));
      const tw = twinOf.get(t); if (tw && tw[p + 3] > 0) for (let c = 0; c < 3; c++) tw[p + c] = Math.round(s[p + c] * f + tw[p + c] * (1 - f));
      s[p + 3] = 0;
    }
  });
}

// sizes step by about 12%, so a pinch zoom re-renders a few times, not at every pixel
const bucket = (px) => clamp(Math.round(32 * Math.pow(2, Math.ceil(Math.log2(Math.max(px, 32) / 32) * 6) / 6)), 32, 640);

// The outline's radius in SVG units for a figure drawn sizeU room units per 220 box: OUTLINE on screen whatever its size
// (to a tenth of a unit, so a size is a handful of sets, not one per pixel). The raster box has room for 24 units of it.
export function lineFor(sizeU) { return sizeU > 0 ? clamp(Math.round(OUTLINE * 220 / sizeU * 10) / 10, 1, 20) : LINE; }
// The raster set for an art file at about px pixels per 220 units, its outline grown for a figure drawn sizeU room units
// per 220 box (round 19, lane outline19: render.js passes it, times an elite's bigness), or the nearest one ready while
// it renders.
export function getRig(url, px220, sizeU) {
  const e = arts.get(url);
  if (!e) { loadArt(url); return null; }
  if (!e.rig) return null;
  const px = bucket(px220 * BOX / 220), line = lineFor(sizeU), key = px + '|' + line;
  let s = e.sets.get(key);
  if (!s) {
    s = { pending: true, px, line }; e.sets.set(key, s);
    // (0.11.1: a new set counts as just used. It used to arrive with used = 0, so once an art had three sizes ready any
    // fourth was thrown out the moment it was made and built again on the next frame, for ever: the camp crawled after
    // zooming to the fire or a hero, and a battle after pinching in.)
    buildSet(e.rig, px, line).then((r) => { if (r) { Object.assign(s, r); s.used = performance.now(); s.pending = false; s.ready = true; } else e.sets.delete(key); prune(e); });
  }
  s.used = performance.now();
  if (s.ready) return s;
  let best = null; // a ready set of another size stands in (one with the same outline first)
  const off = (o) => Math.abs(o.px - px) + (o.line === line ? 0 : 1e4);
  for (const o of e.sets.values()) if (o.ready && (!best || off(o) < off(best))) best = o;
  return best;
}
function prune(e) {
  const ready = [...e.sets.entries()].filter(([, s]) => s.ready).sort((a, b) => b[1].used - a[1].used);
  for (const [key] of ready.slice(4)) e.sets.delete(key); // (four: an art drawn at two sizes, an elite's among them)
}
export const artReady = (url) => { const e = arts.get(url); return !!(e && e.rig); };
export const armedArt = (url) => rigHas(url, 'arm-r~bare') || rigHas(url, 'arm-l~bare'); // (round 19: its art holds a weapon)
export const rigHas = (url, id) => { const e = arts.get(url); return !!(e && e.rig && e.rig.has[id]); };
const rigFree = (url, id) => { const e = arts.get(url); return !!(e && e.rig && e.rig.free && e.rig.free.has(id)); };

// ---------------------------------------------------------------- drawing
function colored(L, key, make) { return L.tints[key] || (L.tints[key] = make()); }
function washed(L, color, a) {
  return colored(L, 'w' + color + a, () => {
    const c = canvas(L.img.width, L.img.height), g = c.getContext('2d');
    g.drawImage(L.img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  });
}
// Our summons (round 8): their own colours turned towards a cool blue-grey, so a raised skeleton or a called wolf reads
// as ours without a coloured outline. Done once per layer and size (pixels), kept with the layer's other tints.
const SHIFT_H = 215 / 360, SHIFT_MIX = 0.65;
function shifted(L) {
  return colored(L, 'shift', () => {
    const c = canvas(L.img.width, L.img.height), g = c.getContext('2d');
    g.drawImage(L.img, 0, 0);
    let d; try { d = g.getImageData(0, 0, c.width, c.height); } catch { return L.img; }
    const a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue;
      const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2;
      let h = 0, sat = 0;
      if (mx !== mn) { const dd = mx - mn; sat = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
        h = mx === r ? (gg - b) / dd + (gg < b ? 6 : 0) : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h /= 6; }
      let dh = SHIFT_H - h; if (dh > 0.5) dh -= 1; if (dh < -0.5) dh += 1;
      h = (h + dh * SHIFT_MIX + 1) % 1; sat = sat * 0.55 + 0.06 * Math.min(1, l * 4);
      const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p2 = 2 * l - q;
      const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p2 + (q - p2) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p2 + (q - p2) * (2 / 3 - t) * 6 : p2; };
      a[i] = f(h + 1 / 3) * 255; a[i + 1] = f(h) * 255; a[i + 2] = f(h - 1 / 3) * 255;
    }
    g.putImageData(d, 0, 0);
    return c;
  });
}
// A border round the figure's ink outline (round 9: protection, Guard's gold): the ink silhouette grown once more,
// on a canvas with room round it, filled with the colour. { c, pad (pixels) }.
function bordered(L, k, color, line) {
  return colored(L, 'b' + color, () => {
    const pad = Math.ceil(line * k * 0.9) + 2, src = canvas(L.ink.width + pad * 2, L.ink.height + pad * 2);
    src.getContext('2d').drawImage(L.ink, pad, pad);
    return { c: grow(src, line * k * 0.85, color), pad };
  });
}
function filled(L, color) {
  return colored(L, 'f' + color, () => {
    const c = canvas(L.ink.width, L.ink.height), g = c.getContext('2d');
    g.drawImage(L.ink, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  });
}

const swayOf = (pose, L) => (pose && pose.sway && (L.id === 'front' || L.id.startsWith('top')) ? pose.sway : null); // art round 11: the cobra
function place(g, L, p) {
  if (!p || (!p.r && !p.dx && !p.dy && !p.sx)) return;
  g.translate(L.pivot[0] + (p.dx || 0), L.pivot[1] + (p.dy || 0)); g.rotate(p.r || 0); if (p.sx) g.scale(p.sx, 1); g.translate(-L.pivot[0], -L.pivot[1]); // (round 15, lane E: sx, a part squeezed across: the wind-up drone's key turning)
}
function xf(L, p, x, y) {
  if (!p) return [x, y];
  const c = Math.cos(p.r || 0), s = Math.sin(p.r || 0), dx = x - L.pivot[0], dy = y - L.pivot[1];
  return [L.pivot[0] + (p.dx || 0) + dx * c - dy * s, L.pivot[1] + (p.dy || 0) + dx * s + dy * c];
}
// The bow string: its ends ride on the bow's part, its middle on the drawing hand's.
function stringPts(set, pose) {
  const st = set.string, bow = set.layers.find((l) => l.id === st.layer), hand = set.layers.find((l) => l.id === 'arm-r');
  if (!bow) return null;
  const pb = pose[bow.id], a = xf(bow, pb, ...st.pts[0]), c = xf(bow, pb, ...st.pts[2]);
  // round 9: the string is straight at rest (it used to bow forward to the hand's resting point); drawing, the
  // middle comes back with the drawing hand
  const pull = hand && pose['arm-r'] ? Math.min(0, pose['arm-r'].dy || 0) : 0;
  const b = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 + pull];
  return [a, b, c];
}
// Where an arrow sits on the bow string (the string's middle), in SVG units, or null for a figure with no string.
export function bowNock(set, pose) { if (!set.string) return null; const p = stringPts(set, pose); return p && p[1]; }
function strokeString(g, pts, color, w) {
  g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color; g.lineWidth = w; g.stroke();
}

// Paint a figure into g, whose transform maps SVG units. mode: 'normal' | 'flash' (all white) | 'grey' (downed) |
// 'sil' (the parts' own silhouette, for washing with a colour afterwards). ink: the outline's colour, INK when not
// given. shift: our summons' cool hue (round 8; they wore a purple outline in round 7).
// a part that's away (the Falconer's falcon in flight); round 19 (lane rogue19): an arm's bare copy is drawn only while
// its arm is bare (pose[arm].bare: its owner disarmed), and the arm itself not then
const hidden = (pose, L) => { if (L.gearOf) return true; const p = pose && pose[L.bareOf || L.id]; return L.bareOf ? !(p && p.bare) || !!p.hide : !!(p && (p.hide || (p.bare && L.hasBare))); };
const pOf = (pose, L) => pose[L.bareOf || L.id];
export function paintRig(g, set, pose, mode = 'normal', ink = null, shift = false, border = null) {
  const Ls = overLast(underFirst(set.layers, pose && pose.under), pose && pose.over), str = set.string ? stringPts(set, pose) : null, strLayer = set.string && set.string.layer;
  if (border && mode === 'normal') {
    const ga = g.globalAlpha; g.globalAlpha = ga * (border.a ?? 1);
    for (const L of Ls) { if (hidden(pose, L)) continue; const b = bordered(L, set.k, border.color, set.line || LINE), p = b.pad / set.k;
      g.save(); place(g, L, pOf(pose, L)); place(g, L, swayOf(pose, L)); g.drawImage(b.c, L.x - p, L.y - p, L.w + p * 2, L.h + p * 2); g.restore(); }
    g.globalAlpha = ga;
  }
  if (mode !== 'sil') {
    for (const L of Ls) {
      if (hidden(pose, L)) continue;
      g.save(); place(g, L, pOf(pose, L)); place(g, L, swayOf(pose, L));
      g.drawImage(mode === 'flash' ? filled(L, '#FFFFFF') : ink ? filled(L, ink) : L.ink, L.x, L.y, L.w, L.h);
      g.restore();
    }
    if (str) strokeString(g, str, mode === 'flash' ? '#FFFFFF' : ink || INK, set.string.w + (set.line || LINE) * 2);
    if (mode === 'flash' || mode === 'ink') return; // (round 13, lane E: 'ink', the outline alone: a chain's links are inked together, then filled)
  }
  for (const L of Ls) {
    if (hidden(pose, L)) continue;
    if (str && L.id === strLayer) strokeString(g, str, mode === 'grey' ? '#9A929C' : set.string.color, set.string.w);
    g.save(); place(g, L, pOf(pose, L)); place(g, L, swayOf(pose, L));
    g.drawImage(mode === 'grey' ? washed(L, 'rgb(120,112,125)', 0.72) : shift ? shifted(L) : L.img, L.x, L.y, L.w, L.h);
    g.restore();
  }
}

// round 19 (lane melee19): a part raised over the body (pose.over: Bearskin's club over his head) is drawn last
function overLast(Ls, ids) { if (!ids) return Ls; const set = new Set([].concat(ids)), out = Ls.filter((l) => !set.has(l.id)); return out.concat(Ls.filter((l) => set.has(l.id))); }
// round 19 (lane sys19): a free hand (pose.under) is drawn just before the body, so it sits at the body's side, behind it
function underFirst(Ls, id) {
  if (!id) return Ls; const i = Ls.findIndex((l) => l.id === id), b = Ls.findIndex((l) => l.id === 'body');
  if (i < 0 || b < 0 || i < b) return Ls;
  const out = Ls.slice(); const [L] = out.splice(i, 1); out.splice(b, 0, L); return out;
}

// A scratch canvas for figures that must be composed first (see-through, or washed with a colour).
const SCR0 = -60, SCR = 320;
let scratch = null;
export function composeRig(set, pose, mode, wash, ink = null, shift = false, border = null) {
  const px = Math.ceil(SCR * set.k);
  if (!scratch || scratch.width < px) scratch = canvas(px, px);
  const g = scratch.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.clearRect(0, 0, px, px);
  g.setTransform(set.k, 0, 0, set.k, -SCR0 * set.k, -SCR0 * set.k);
  paintRig(g, set, pose, mode, ink, shift, border);
  if (wash) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = wash; g.fillRect(0, 0, px, px); g.globalCompositeOperation = 'source-over'; }
  return { c: scratch, sx: px, x: SCR0, s: SCR };
}
// Draw a composed scratch into ctx (whose transform maps SVG units).
export function drawComposed(ctx, k) { ctx.drawImage(k.c, 0, 0, k.sx, k.sx, k.x, k.x, k.s, k.s); }

// Draw the figure into ctx (transform in SVG units). o: { mode, alpha, washes: [[color, a], ...], ink (outline colour),
// shift (our summons' cool hue) }
export function drawRig(ctx, set, pose, o = {}) {
  const alpha = o.alpha ?? 1;
  if (alpha >= 0.999) paintRig(ctx, set, pose, o.mode || 'normal', o.ink, o.shift, o.border);
  else { const k = composeRig(set, pose, o.mode || 'normal', null, o.ink, o.shift, o.border); const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; drawComposed(ctx, k); ctx.globalAlpha = a; }
  if (o.washes) for (const [col, a] of o.washes) {
    if (a <= 0.01) continue;
    const k = composeRig(set, pose, 'sil', col); const ga = ctx.globalAlpha; ctx.globalAlpha = ga * a * alpha; drawComposed(ctx, k); ctx.globalAlpha = ga;
  }
}

// ---------------------------------------------------------------- poses
// A pose: { 'arm-r': { r, dx, dy }, 'arm-l': {...}, back: {...}, glow: { x, y, r, color, a } }. Arm rotation is
// about the part's pivot; +r turns a forward-pointing weapon in arm-r inward, across the front of the body.
const sm = (k) => k * k * (3 - 2 * k);
const easeOut = (k) => 1 - (1 - k) * (1 - k) * (1 - k);
const mix = (a, b, k) => a + (b - a) * k;
function mixP(a, b, k) { return { r: mix(a.r || 0, b.r || 0, k), dx: mix(a.dx || 0, b.dx || 0, k), dy: mix(a.dy || 0, b.dy || 0, k) }; }
const scaleP = (p, s) => ({ r: (p.r || 0) * s, dx: (p.dx || 0) * s, dy: (p.dy || 0) * s });
const addP = (a, b) => ({ r: (a.r || 0) + (b.r || 0), dx: (a.dx || 0) + (b.dx || 0), dy: (a.dy || 0) + (b.dy || 0) });
const mirror = (p) => ({ r: -(p.r || 0), dx: -(p.dx || 0), dy: p.dy || 0 });
const ZERO = { r: 0, dx: 0, dy: 0 };
const FREE_BACK = { dy: -18, dx: 3 }; // round 19 (lane sys19): where a free hand rests, from where the art put it (back towards the shoulder, a little out)

// Per-kind touches. hand: which arm attacks. off: what the other arm does ('shield' pushes forward, else counters).
// dual: both arms hold weapons and take turns. glow: the casting light.
export const STYLE = {
  archer: { bow: true },
  twinfang: { dual: true },
  paladin: { off: 'shield' }, tower: { off: 'shield' },
  pyromancer: { glow: '#FF9A3D' }, frost: { glow: '#9FE3FF' }, storm: { glow: '#FFE66B' }, necromancer: { glow: '#B48CFF' },
  bard: { glow: '#FFD45A' }, druid: { glow: '#9BE36B' }, cleric: { glow: '#FFF1B0' }, plague: { glow: '#A9D44A' },
};
// Strike shapes per attack kind: W = wound back, S = struck through, both for the attacking arm (arm-r frame).
const MOVES = {
  swing: { W: { r: -0.95, dy: -6 }, S: { r: 0.6, dy: 10 }, strike: 0.075, hold: 0.05 },
  thrust: { W: { r: -0.12, dy: -12 }, S: { r: 0.14, dy: 26 }, strike: 0.06, hold: 0.05 },
  throw: { W: { r: -0.75, dy: -16 }, S: { r: 0.5, dy: 18 }, strike: 0.07, hold: 0.04 },
  cast: { W: { r: -0.3, dy: -10 }, S: { r: 0.38, dy: 22 }, strike: 0.08, hold: 0.1 },
  draw: { W: { dy: -26 }, S: { dy: 6 }, strike: 0.04, hold: 0.02 },
  shoot: { W: { dy: 4 }, S: { dy: -12, r: -0.05 }, strike: 0.03, hold: 0.06 },   // a gun: held still, then the kick back
  punch: { W: { dy: -10, r: -0.1 }, S: { dy: 30, r: 0.1 }, strike: 0.05, hold: 0.04 }, // fists: a straight jab
  slam: { W: { r: -0.95, dy: -30 }, S: { r: 0.7, dy: 34 }, strike: 0.07, hold: 0.1 }, // round 19 (melee19): a warhammer raised back, then driven down in front (style.slamPose)
};

// How far into its swing a unit is "readying" before the blow lands (the sim attacks at once, so the wind-up is shown
// in the moment before the cooldown runs out, while the target is in reach).
function readyTarget(u) {
  const t = u.target, d = u.def;
  if (!t || t.dead || t.downed || u.act || u.downed) return 0;
  const gap = Math.hypot(t.x - u.x, t.y - u.y) - u.r - t.r;
  const ranged = (d.role === 'ranged' || d.role === 'caster' || d.keep) && (d.range || 0) > 80;
  if (ranged) return gap + t.r + u.r <= d.range + 10 ? clamp(1 - u.atkT / 0.55, 0, 1) : 0;
  if (d.windup) return 0; // its wind-up plays inside the anim (the sim's windup)
  return gap <= (d.range || 20) + 34 ? clamp(1 - u.atkT / 0.2, 0, 1) : 0;
}

// Round 19 (lane melee19): where a part turns (its data-pivot), and the striking hand's wound-back and struck-through
// poses for a unit's plain blow, as poseFor plays them, in that part's own terms (fxkit draws a blow's slash along the
// path its weapon really takes between the two: style.tip)
const slamMove = (sty) => ({ ...MOVES.slam, W: sty.slamW || MOVES.slam.W, S: sty.slamS || MOVES.slam.S }); // (style.slamS: where that hammer's head comes down)
export function partPivot(url, id) { const e = arts.get(url); const L = e && e.rig && e.rig.layers.find((l) => l.id === id); return L ? L.pivot : null; }
export function blowPoses(u) {
  const d = u.def, sty = STYLE[u.kind] || d.style || {}, url = d.art, base = d.attackAnim || 'swing';
  const mv = (sty.slamPose && base === 'swing' ? slamMove(sty) : MOVES[base]) || MOVES.swing;
  const amp = base === 'swing' ? clamp((d.arc || 1.9) / 1.9, 0.85, 1.35) * (sty.swingAmp || 1) : 1;
  let W = scaleP(mv.W, amp), S = scaleP(mv.S, amp);
  if (sty.backhand && base === 'swing') { W = { ...W, r: -W.r }; S = { ...S, r: -S.r }; }
  if ((sty.straight || sty.stab) && base === 'thrust') { const k = sty.stab || 1; W = { r: 0, dx: 0, dy: W.dy * k }; S = { r: 0, dx: 0, dy: S.dy * k }; }
  const hand = sty.hand && rigHas(url, sty.hand) ? sty.hand : rigHas(url, 'arm-r') ? 'arm-r' : 'arm-l';
  return hand === 'arm-r' ? { hand, W, S, base } : { hand, W: mirror(W), S: mirror(S), base };
}

export function poseFor(u, w, dt) {
  const d = u.def, sty = STYLE[u.kind] || d.style || {}, url = d.art; // d.style: the new heroes' touches (heroes2.js)
  const pose = {};
  if (u.frozenT > 0 && u._pose) return u._pose;          // frozen stiff
  if (d.pose) return (u._pose = d.pose(u, w, dt));      // lane B (bosses3): a boss that poses its own parts (the angel's wheels)
  const kind = (u.anim && u.anim.kind) || d.attackAnim || (d.role === 'ranged' ? 'draw' : d.role === 'skirmish' ? 'thrust' : 'swing');
  const base = kind === 'ability' ? (d.attackAnim || 'swing') : kind;
  const mv = (sty.slamPose && base === 'swing' && kind !== 'ability' ? slamMove(sty) : MOVES[base]) || MOVES.swing; // (round 19: style.slamPose, the Griffon's and Warhelm's hammer)
  const amp = (base === 'swing' ? clamp((d.arc || 1.9) / 1.9, 0.85, 1.35) : 1) * (base === 'swing' && kind !== 'ability' ? sty.swingAmp || 1 : 1); // (round 19: style.swingAmp, a wider swing: the Dame)
  // which arm this blow uses
  if (u.anim && u.anim !== u._lastAnim) { u._lastAnim = u.anim; u._n = (u._n || 0) + 1; u._ready = 0; }
  const dual = sty.dual && rigHas(url, 'arm-l');
  let hand = sty.hand && rigHas(url, sty.hand) ? sty.hand : rigHas(url, 'arm-r') ? 'arm-r' : 'arm-l'; // sty.hand: a weapon held in the left hand
  if (dual && (u._n || 0) % 2) hand = 'arm-l';
  if (u.anim && u.anim.hand && rigHas(url, u.anim.hand)) hand = u.anim.hand; // (round 19: a blow with the other hand: the Bandit's punch)
  const other = hand === 'arm-r' ? 'arm-l' : 'arm-r';
  // readiness, eased
  const rt = u.anim ? 0 : readyTarget(u);
  u._ready = (u._ready || 0) + (rt - (u._ready || 0)) * (1 - Math.exp(-dt * (rt > (u._ready || 0) ? 16 : 8)));
  let main = ZERO, off = ZERO, glow = 0, pop = 0;
  const W = scaleP(mv.W, amp), S = scaleP(mv.S, amp);
  if (u.anim) {
    const a = u.anim, big = a.kind === 'ability' || a.big ? 1.45 : 1; // (round 19: a.big, a plain blow swung bigger: the Monk's third)
    const Wb = scaleP(W, big), Sb = scaleP(S, big);
    // when the blow lands: after the sim's wind-up (enemies), at a third of an ability, or at once (heroes)
    const at = a.kind === 'ability' ? a.dur * 0.32 : Math.max(0, Math.min(a.dur - 0.12, d.windup && a.kind === (d.attackAnim || a.kind) ? d.windup : 0));
    const t = a.t, st = mv.strike * (big > 1 ? 1.3 : 1), hold = mv.hold;
    const from = at > 0 ? ZERO : scaleP(Wb, Math.max(u._from ?? 0, 0));
    if (t < at) main = mixP(from, Wb, sm(t / at));
    else if (t < at + st) main = mixP(at > 0 ? Wb : from, Sb, easeOut((t - at) / st));
    else if (t < at + st + hold) main = Sb;
    else main = mixP(Sb, ZERO, sm(clamp((t - at - st - hold) / Math.max(0.05, a.dur - at - st - hold), 0, 1)));
    if (t >= at && t < at + st + hold + 0.04) pop = big > 1 ? 1 : 0.4;
    if (base === 'cast' || (a.kind === 'ability' && sty.glow)) glow = t < at ? t / Math.max(at, 0.01) : clamp(1 - (t - at - st) / 0.22, 0, 1);
  } else {
    u._from = u._ready;
    main = scaleP(W, sm(u._ready));
    if (base === 'cast') glow = u._ready * 0.6;
  }
  // lane H2 (round 13): a backhand swing (style.backhand: the Dame, the Pirate, "swing the other way"); daggers stabbed
  // straight ahead, never turned in across each other (style.straight: the Shade, "should not cross blades")
  if (!!sty.backhand !== !!(u.anim && u.anim.back) && base === 'swing') main = { ...main, r: -(main.r || 0) }; // (round 19: anim.back, one backhand stroke: the Bandit's Dirty Trick)
  if (sty.straight && base === 'thrust') main = { ...main, r: 0 };
  if (sty.stab && base === 'thrust') main = { r: 0, dx: 0, dy: (main.dy || 0) * sty.stab }; // round 19 (Bulwark: "Don't like stab animation"): drawn back and driven straight out along the shaft, never waved
  // the other arm (all in arm-r terms, mirrored onto arm-l below): a shield pushes forward as the blow lands, a free
  // hand counters, casters lift both
  if (base === 'cast' || (u.anim && u.anim.kind === 'ability' && !sty.bow)) off = main;
  else if (sty.bow) off = { dy: main.dy < 0 ? main.dy * 0.08 : -main.dy * 0.4 };
  else if (sty.off === 'shield') off = { dy: Math.max(0, main.dy) * 0.4 + 2 * Math.max(0, -main.r) };
  else if (dual) off = { dy: -main.dy * 0.3 };
  else off = { r: -main.r * 0.12, dy: -main.dy * 0.2 };
  // ---- round 9 touches
  const T = w ? w.time : 0;
  // arms out for a full turn; round 10 (Cleave, Reap: "they hold sword in not out"): a single weapon is held straight out
  // to the side, not across the body
  if (u.anim && u.anim.kind === 'spin') { main = dual ? scaleP(S, 1.15) : { r: -1.25, dy: 8 }; off = dual ? scaleP(S, 1.15) : { r: -0.2, dy: 6 }; }
  // round 13 (Frost Arrow: "Doesnt charge back bow"): while a shot charges (kits.js u.aimT) the drawing hand comes all the
  // way back and holds, the string and the nocked arrow with it
  if (sty.bow && u.aimT > 0) { const q = clamp(1 - u.aimT / (u.aimMax || 0.45), 0, 1); main = scaleP(W, 1.15 * easeOut(clamp(q * 2.2, 0, 1))); off = { dy: main.dy * 0.08 }; }
  if (sty.bow) off = addP(off, { dy: 22 });                      // the bow held forward (round 10: "Move bow forwards more")
  if (u.kind === 'bard' && u.anim && u.anim.kind === 'cast') {    // the strumming hand goes over the strings
    const t = u.anim.t; main = { r: 0.16 * Math.sin(t * 48), dy: 6 + 3 * Math.abs(Math.sin(t * 24)) }; off = { dy: 2 };
  }
  if (u.kind === 'necromancer' && base === 'cast') main = { r: 0, dy: (main.dy || 0) * 1.25 }; // the staff thrust forward, not waved
  if (sty.off === 'shield' && ((u.buffs && u.buffs.some((b) => b.id === 'holdTheLine' || b.raise)) || (u.act && u.act.type === 'charge'))) {
    off = { r: 0.85, dy: 20, dx: 6 }; main = addP(main, { r: -0.2, dy: -6 }); // the shield held out in front
  }
  if (!u.anim && !u.downed && u.spd <= 6) { const s = Math.sin(T * 2.2 + u.id) * 1.4; main = addP(main, { dy: s }); off = addP(off, { dy: -s }); } // idle: the arms breathe too
  // walking: the arms swing a little, opposite each other; less while fighting
  if (!u.downed && u.spd > 6) {
    const k = clamp(u.spd / (d.speed || 60), 0, 1.3) * (1 - Math.max(u._ready, u.anim ? 1 : 0) * 0.85), s = Math.sin(u.bob);
    main = addP(main, { dy: s * 5 * k, r: s * 0.06 * k });
    off = addP(off, { dy: -s * 5 * k, r: -s * 0.06 * k });
  }
  if (u.act && u.act.type === 'drink') main = { r: 0.55, dy: -14 }; // the potion goes to the mouth
  if (u.sleepT > 0 || (u.st && u.st.stagger >= 100)) { main = addP(main, { r: -0.35, dy: -4 }); off = addP(off, { r: -0.35, dy: -4 }); }
  // round 18 (lane dash18): a dash poses the weapon arm itself, so the blade is where its slash is drawn (dashes.js D.arm)
  { const DV = u.act && u.act.dv; if (DV && DV.arm && !u.downed) { main = DV.arm; if (DV.off) off = DV.off; } }
  pose[hand] = hand === 'arm-r' ? main : mirror(main);
  pose[other] = other === 'arm-r' ? off : mirror(off);
  // round 19 (lane sys19): the other hand, when it holds nothing (a bare fist over the body in the art) and isn't a
  // shield, a bow hand or a second weapon, is drawn behind the body: "free hands don't get to float"
  // (and it rests back at the body's side, not out at the front by the face: FREE_BACK, in arm-r terms)
  if (!dual && !sty.bow && sty.off !== 'shield' && rigFree(url, other)) { pose.under = other; const b = addP(off, FREE_BACK); pose[other] = other === 'arm-r' ? b : mirror(b); }
  // round 19 (lane rogue19, the Shade: "They are still holding the blades crossed. Should keep them to the sides"):
  // style.sides turns both hands out by that much (radians), so the daggers are held out at her sides, not across her
  if (sty.sides && !u.downed && !(u.anim && u.anim.kind === 'spin')) { pose['arm-r'] = addP(pose['arm-r'], { r: -sty.sides }); pose['arm-l'] = addP(pose['arm-l'], { r: sty.sides }); }
  // round 10 (the heroes lane: "the falcon still shows on the Falconer's arm while it flies"): the bird rides the
  // left fist as its own part, and is gone from it while it's out hunting (kits2.js looseFalcon)
  pose['arm-l-bird'] = u.kit && u.kit.falconOut ? { hide: true } : pose['arm-l'];
  // round 15 (lane E, art round 12): Warhelm's hammer is its own part that rides his left fist, and is gone from it while
  // it circles him or flies (kits2.js kit2Tick sets hammerOut; his fist stays and punches); Bearskin's club is its own
  // part on his right paw, and is put away while he claws (Bear Claws)
  pose['arm-l-hammer'] = u.kit && u.kit.hammerOut ? { hide: true } : pose['arm-l'];
  pose['arm-r-club'] = u.kit && u.kit.clawsT > (w ? w.time : 0) ? { hide: true } : pose['arm-r'];
  pose['arm-r-tube'] = u.kit && (u.kit.monster || u.kit.tubeGone > (w ? w.time : 0)) ? { hide: true } : pose['arm-r']; // round 19 (lane caster19): the Alchemist's tube, gone from the fist just after a throw and while they are the monster
  pose['arm-l-broom'] = u.kit && u.kit.broomUntil > (w ? w.time : 0) ? { hide: true } : pose['arm-l']; // round 19 (lane caster19): the Witch's broom is under her while she rides it
  // round 19 (lane rogue19): Disarmed, the weapon is gone from its hands (the bare copies of the arms, splitSvg above)
  // (the weapon hand, and the other too when both hold the weapon: two daggers, a bow and its arrow; a shield stays)
  if (u.disarmT > 0 && !u.downed) for (const k of dual || sty.bow || d.attackAnim === 'draw' ? ['arm-r', 'arm-l'] : [hand]) if (pose[k]) pose[k] = { ...pose[k], bare: true };
  // a cape lags behind turns
  const df = u._pf == null ? 0 : wrapAngle(u.facing - u._pf); u._pf = u.facing;
  const capeT = clamp(-df / Math.max(dt, 1e-3) * 0.05, -0.16, 0.16);
  u._cape = (u._cape || 0) + (capeT - (u._cape || 0)) * (1 - Math.exp(-dt * 6));
  pose.back = { r: u._cape };
  if (d.turret) pose.back = { r: wrapAngle((u.baseA ?? u.facing) - u.facing) }; // a turret's legs stay put while its top turns
  // art round 11 (the cobra: "Have that top segment free from the bottom and have it slowly move around the bottom
  // segment in game"): def.sway = { r (SVG units), speed (rad/s) }: every part whose id starts with top, and #front, rides
  // a slow circle over the rest (the coil, #back), a little flatter front to back.
  if (d.sway) { const a = T * d.sway.speed + u.id * 1.7, o = { r: 0, dx: Math.cos(a) * d.sway.r, dy: Math.sin(a) * d.sway.r * 0.7 }; pose.sway = o; }
  pose.glow = glow > 0.02 ? { a: glow, color: sty.glow || '#FFF1B0' } : null;
  pose.pop = pop;
  if (u._force) Object.assign(pose, u._force); // the lab's test poses
  u._pose = pose;
  return pose;
}

// Corpses and the downed: arms flung out.
export const LIMP = { 'arm-r': { r: -0.55, dy: -6 }, 'arm-l': { r: 0.55, dy: -6 }, 'arm-l-bird': { r: 0.55, dy: -6 }, 'arm-l-hammer': { r: 0.55, dy: -6 }, 'arm-r-club': { r: -0.55, dy: -6 }, 'arm-l-broom': { r: 0.55, dy: -6 }, 'arm-r-tube': { r: -0.55, dy: -6 }, back: { r: 0 } };

// Round 19 (lane rogue19): the weapon a figure holds, alone (Disarmed: it spins out of the hand). Draws the weapon of
// `url`'s arm (arm-r unless it holds none) into ctx, centred on 0,0 in the arm's own frame (+y forward), at `px` pixels
// per 220 SVG units; false if the art holds nothing (or isn't ready).
export function drawGear(ctx, url, px, armId = 'arm-r') {
  const set = getRig(url, px); if (!set) return false;
  const L = set.layers.find((l) => l.gearOf === armId) || set.layers.find((l) => l.gearOf);
  if (!L) return false;
  ctx.save(); ctx.translate(-(L.x + L.w / 2), -(L.y + L.h / 2));
  ctx.drawImage(L.ink, L.x, L.y, L.w, L.h); ctx.drawImage(L.img, L.x, L.y, L.w, L.h);
  ctx.restore(); return true;
}
