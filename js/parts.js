// Sprites built from parts. Every kind with `art` (an SVG laid out in parts: #back, #body, #arm-l, #arm-r, #front
// inside #sprite, arms with a data-pivot) is split into one image per part, so the game can swing the arms. The
// outline goes on afterwards over the whole figure: each part also has an "ink" copy, its silhouette grown by the
// outline radius; all the inks are drawn first, then the parts in file order on top. The union of grown silhouettes
// is the grown union, so the outline hugs the combined figure with no lines between parts, like the SVG filter did.
//
// Coordinates: everything here is in SVG units, the sprite's own frame (220 box, centre 100,100, front = +y).
import { INK, clamp, wrapAngle } from './util.js';

const LINE = 6;            // outline radius in SVG units (the #outline filter's; = OUTLINE in room units at hero scale)
const B0 = -24, BOX = 248; // the raster box: the 220 box plus room for the outline
const arts = new Map();    // url -> { text, layers, string } once loaded, or a promise while loading

// ---------------------------------------------------------------- loading and splitting
export function loadArt(url) {
  if (arts.has(url)) return arts.get(url).promise;
  const e = { promise: null, rig: null, sets: new Map() };
  arts.set(url, e);
  e.promise = fetch(url).then((r) => r.text()).then((text) => { e.rig = splitSvg(text); }).catch(() => { e.rig = null; e.failed = true; });
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
    layers.push({ id, pivot, moves: /^(arm-|back|front)/.test(id) && el.hasAttribute('data-pivot'), text: ser.serializeToString(root) });
  });
  return { layers, string, has: Object.fromEntries(layers.map((l) => [l.id, true])) };
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
async function buildSet(rig, px) {
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
      const m = Math.ceil(LINE * k) + 2;
      x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(px, x1 + m + 1); y1 = Math.min(px, y1 + m + 1);
    }
    const w = x1 - x0, h = y1 - y0;
    const img = canvas(w, h); img.getContext('2d').drawImage(cvs[i], -x0, -y0);
    out.push({ id: l.id, pivot: l.pivot, moves: l.moves, img, ink: grow(img, LINE * k, INK), x: B0 + x0 / k, y: B0 + y0 / k, w: w / k, h: h / k, tints: {} });
  });
  return { px, k, layers: out, string: rig.string, used: 0 };
}

// The silhouette grown by r pixels, filled with one colour: stamps of the alpha round two circles.
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
    if (l.moves) return;
    const below = []; for (let j = i - 1; j >= 0; j--) if (rig.layers[j].moves) below.push(data[j].data);
    if (!below.length) return;
    const s = data[i].data;
    for (let p = 0; p < n; p += 4) {
      const a = s[p + 3];
      if (a < 6 || a > 215 || s[p] + s[p + 1] + s[p + 2] > 330) continue; // only see-through dark pixels
      const t = below.find((d) => d[p + 3] > 0);
      if (!t) continue;
      const f = a / 255;
      for (let c = 0; c < 3; c++) t[p + c] = Math.round(s[p + c] * f + t[p + c] * (1 - f));
      s[p + 3] = 0;
    }
  });
}

// sizes step by about 12%, so a pinch zoom re-renders a few times, not at every pixel
const bucket = (px) => clamp(Math.round(32 * Math.pow(2, Math.ceil(Math.log2(Math.max(px, 32) / 32) * 6) / 6)), 32, 640);

// The raster set for an art file at about px pixels per 220 units, or the nearest one ready while it renders.
export function getRig(url, px220) {
  const e = arts.get(url);
  if (!e) { loadArt(url); return null; }
  if (!e.rig) return null;
  const px = bucket(px220 * BOX / 220);
  let s = e.sets.get(px);
  if (!s) {
    s = { pending: true }; e.sets.set(px, s);
    buildSet(e.rig, px).then((r) => { if (r) { Object.assign(s, r); s.pending = false; s.ready = true; } else e.sets.delete(px); prune(e); });
  }
  s.used = performance.now();
  if (s.ready) return s;
  let best = null; // a ready set of another size stands in
  for (const o of e.sets.values()) if (o.ready && (!best || Math.abs(o.px - px) < Math.abs(best.px - px))) best = o;
  return best;
}
function prune(e) {
  const ready = [...e.sets.entries()].filter(([, s]) => s.ready).sort((a, b) => b[1].used - a[1].used);
  for (const [px] of ready.slice(3)) e.sets.delete(px);
}
export const artReady = (url) => { const e = arts.get(url); return !!(e && e.rig); };
export const rigHas = (url, id) => { const e = arts.get(url); return !!(e && e.rig && e.rig.has[id]); };

// ---------------------------------------------------------------- drawing
function colored(L, key, make) { return L.tints[key] || (L.tints[key] = make()); }
function washed(L, color, a) {
  return colored(L, 'w' + color + a, () => {
    const c = canvas(L.img.width, L.img.height), g = c.getContext('2d');
    g.drawImage(L.img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  });
}
function filled(L, color) {
  return colored(L, 'f' + color, () => {
    const c = canvas(L.ink.width, L.ink.height), g = c.getContext('2d');
    g.drawImage(L.ink, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  });
}

function place(g, L, p) {
  if (!p || (!p.r && !p.dx && !p.dy)) return;
  g.translate(L.pivot[0] + (p.dx || 0), L.pivot[1] + (p.dy || 0)); g.rotate(p.r || 0); g.translate(-L.pivot[0], -L.pivot[1]);
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
  const b = hand ? xf(hand, pose['arm-r'], st.pts[1][0], st.pts[1][1]) : xf(bow, pb, ...st.pts[1]);
  return [a, b, c];
}
function strokeString(g, pts, color, w) {
  g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.lineTo(...pts[2]);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color; g.lineWidth = w; g.stroke();
}

// Paint a figure into g, whose transform maps SVG units. mode: 'normal' | 'flash' (all white) | 'grey' (downed) |
// 'sil' (the parts' own silhouette, for washing with a colour afterwards).
export function paintRig(g, set, pose, mode = 'normal') {
  const Ls = set.layers, str = set.string ? stringPts(set, pose) : null, strLayer = set.string && set.string.layer;
  if (mode !== 'sil') {
    for (const L of Ls) {
      g.save(); place(g, L, pose[L.id]);
      g.drawImage(mode === 'flash' ? filled(L, '#FFFFFF') : L.ink, L.x, L.y, L.w, L.h);
      g.restore();
    }
    if (str) strokeString(g, str, mode === 'flash' ? '#FFFFFF' : INK, set.string.w + LINE * 2);
    if (mode === 'flash') return;
  }
  for (const L of Ls) {
    if (str && L.id === strLayer) strokeString(g, str, mode === 'grey' ? '#9A929C' : set.string.color, set.string.w);
    g.save(); place(g, L, pose[L.id]);
    g.drawImage(mode === 'grey' ? washed(L, 'rgb(120,112,125)', 0.72) : L.img, L.x, L.y, L.w, L.h);
    g.restore();
  }
}

// A scratch canvas for figures that must be composed first (see-through, or washed with a colour).
const SCR0 = -60, SCR = 320;
let scratch = null;
export function composeRig(set, pose, mode, wash) {
  const px = Math.ceil(SCR * set.k);
  if (!scratch || scratch.width < px) scratch = canvas(px, px);
  const g = scratch.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.clearRect(0, 0, px, px);
  g.setTransform(set.k, 0, 0, set.k, -SCR0 * set.k, -SCR0 * set.k);
  paintRig(g, set, pose, mode);
  if (wash) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = wash; g.fillRect(0, 0, px, px); g.globalCompositeOperation = 'source-over'; }
  return { c: scratch, sx: px, x: SCR0, s: SCR };
}
// Draw a composed scratch into ctx (whose transform maps SVG units).
export function drawComposed(ctx, k) { ctx.drawImage(k.c, 0, 0, k.sx, k.sx, k.x, k.x, k.s, k.s); }

// Draw the figure into ctx (transform in SVG units). o: { mode, alpha, washes: [[color, a], ...] }
export function drawRig(ctx, set, pose, o = {}) {
  const alpha = o.alpha ?? 1;
  if (alpha >= 0.999) paintRig(ctx, set, pose, o.mode || 'normal');
  else { const k = composeRig(set, pose, o.mode || 'normal'); const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; drawComposed(ctx, k); ctx.globalAlpha = a; }
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
};

// How far into its swing a unit is "readying" before the blow lands (the sim attacks at once, so the wind-up is shown
// in the moment before the cooldown runs out, while the target is in reach).
function readyTarget(u) {
  const t = u.target, d = u.def;
  if (!t || t.dead || t.downed || u.act || u.downed) return 0;
  const gap = Math.hypot(t.x - u.x, t.y - u.y) - u.r - t.r;
  const ranged = (d.role === 'ranged' || d.role === 'caster' || d.keep) && (d.range || 0) > 80;
  if (ranged) return gap + t.r + u.r <= d.range + 10 ? clamp(1 - u.atkT / 0.55, 0, 1) : 0;
  return gap <= (d.range || 20) + 34 ? clamp(1 - u.atkT / 0.2, 0, 1) : 0;
}

export function poseFor(u, w, dt) {
  const d = u.def, sty = STYLE[u.kind] || {}, url = d.art;
  const pose = {};
  if (u.frozenT > 0 && u._pose) return u._pose;          // frozen stiff
  const kind = (u.anim && u.anim.kind) || d.attackAnim || (d.role === 'ranged' ? 'draw' : d.role === 'skirmish' ? 'thrust' : 'swing');
  const base = kind === 'ability' ? (d.attackAnim || 'swing') : kind;
  const mv = MOVES[base] || MOVES.swing;
  const amp = base === 'swing' ? clamp((d.arc || 1.9) / 1.9, 0.85, 1.35) : 1;
  // which arm this blow uses
  if (u.anim && u.anim !== u._lastAnim) { u._lastAnim = u.anim; u._n = (u._n || 0) + 1; u._ready = 0; }
  const dual = sty.dual && rigHas(url, 'arm-l');
  let hand = rigHas(url, 'arm-r') ? 'arm-r' : 'arm-l';
  if (dual && (u._n || 0) % 2) hand = 'arm-l';
  const other = hand === 'arm-r' ? 'arm-l' : 'arm-r';
  // readiness, eased
  const rt = u.anim ? 0 : readyTarget(u);
  u._ready = (u._ready || 0) + (rt - (u._ready || 0)) * (1 - Math.exp(-dt * (rt > (u._ready || 0) ? 16 : 8)));
  let main = ZERO, off = ZERO, glow = 0, pop = 0;
  const W = scaleP(mv.W, amp), S = scaleP(mv.S, amp);
  if (u.anim) {
    const a = u.anim, big = a.kind === 'ability' ? 1.45 : 1;
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
  // the other arm (all in arm-r terms, mirrored onto arm-l below): a shield pushes forward as the blow lands, a free
  // hand counters, casters lift both
  if (base === 'cast' || (u.anim && u.anim.kind === 'ability' && !sty.bow)) off = main;
  else if (sty.bow) off = { dy: main.dy < 0 ? main.dy * 0.08 : -main.dy * 0.4 };
  else if (sty.off === 'shield') off = { dy: Math.max(0, main.dy) * 0.4 + 2 * Math.max(0, -main.r) };
  else if (dual) off = { dy: -main.dy * 0.3 };
  else off = { r: -main.r * 0.12, dy: -main.dy * 0.2 };
  // walking: the arms swing a little, opposite each other; less while fighting
  if (!u.downed && u.spd > 6) {
    const k = clamp(u.spd / (d.speed || 60), 0, 1.3) * (1 - Math.max(u._ready, u.anim ? 1 : 0) * 0.85), s = Math.sin(u.bob);
    main = addP(main, { dy: s * 5 * k, r: s * 0.06 * k });
    off = addP(off, { dy: -s * 5 * k, r: -s * 0.06 * k });
  }
  if (u.sleepT > 0 || (u.st && u.st.stagger >= 100)) { main = addP(main, { r: -0.35, dy: -4 }); off = addP(off, { r: -0.35, dy: -4 }); }
  pose[hand] = hand === 'arm-r' ? main : mirror(main);
  pose[other] = other === 'arm-r' ? off : mirror(off);
  // a cape lags behind turns
  const df = u._pf == null ? 0 : wrapAngle(u.facing - u._pf); u._pf = u.facing;
  const capeT = clamp(-df / Math.max(dt, 1e-3) * 0.05, -0.16, 0.16);
  u._cape = (u._cape || 0) + (capeT - (u._cape || 0)) * (1 - Math.exp(-dt * 6));
  pose.back = { r: u._cape };
  pose.glow = glow > 0.02 ? { a: glow, color: sty.glow || '#FFF1B0' } : null;
  pose.pop = pop;
  if (u._force) Object.assign(pose, u._force); // the lab's test poses
  u._pose = pose;
  return pose;
}

// Corpses and the downed: arms flung out.
export const LIMP = { 'arm-r': { r: -0.55, dy: -6 }, 'arm-l': { r: 0.55, dy: -6 }, back: { r: 0 } };
