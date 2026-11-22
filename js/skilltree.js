// The skill web (UI v3, docs/UI-v3.md): the hero at the middle of a big canvas, every node of its tree around it,
// joined by their links. Drag to pan, pinch (or the wheel) to zoom, tap a node to see it in the panel at the bottom
// and learn it there. Owned paths glow gold; what can be learned now glows teal; the rest waits in the dark.
// Nodes come from meta.web(id) (x/y in layout units), so a tree of 100+ nodes just works.
import * as M from './meta.js';
import { HEROES } from './heroes.js';
import { icon } from './icons.js';
import { I, roman } from './ui-kit.js';

const NS = 'http://www.w3.org/2000/svg';
const views = {}; // camera per hero, kept between visits: { x, y, k }
// Round 9: nodes that aren't next to a known node (learned, or the hero at the middle) stay hidden; a dev cheat in
// the settings shows the whole web (kept in localStorage, so it stays a per-device switch, not part of the save).
let ALL = false;
try { ALL = localStorage.getItem('delve.webAll') === '1'; } catch {}
export const showAll = () => ALL;
export function setShowAll(on) { ALL = !!on; try { localStorage.setItem('delve.webAll', ALL ? '1' : '0'); } catch {} }
function visibleSet(save, id, w) {
  if (ALL) return null;
  const known = new Set(w.nodes.filter((n) => n.kind === 'root' || M.rank(save, id, n.id) > 0).map((n) => n.id)), vis = new Set(known);
  for (const k of known) for (const l of w.by[k].links) vis.add(l);
  return vis;
}
const R = { root: 46, tier: 30, ability: 30, stat: 19, keystone: 30, slot: 24 };
const sizeOf = (n) => R[n.kind] || 19;

// A tiny glyph for a stat node from what it raises (heroes.js STATS keys first, then words).
const SWORD = '<path d="M14.5 4.5H19.5v5L10.5 18.5l-5-5z"/><path d="M4.5 19.5l3-3"/>', CLOCK = '<circle cx="12" cy="12.5" r="6.5"/><path d="M12 9v3.8l2.4 1.6"/>',
  CROSS = '<path d="M12 6v12M6 12h12" stroke-width="3.4"/>', DROP = '<path d="M12 4.5c3 4 5.5 6.8 5.5 9.7a5.5 5.5 0 0 1-11 0c0-2.9 2.5-5.7 5.5-9.7z"/>';
const BYKEY = {
  dmg: SWORD, abDmg: SWORD, haste: CLOCK, abCd: CLOCK, heal: CROSS, abHeal: CROSS, status: DROP, abStatus: DROP,
  hp: '<path d="M12 19s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.6a3.8 3.8 0 0 1 7 2.2C19 14.6 12 19 12 19z" fill="currentColor" stroke="none"/>',
  atkSpeed: '<path d="M6 7l5 5-5 5M12 7l5 5-5 5"/>', moveSpeed: '<path d="M5 15l5-5 3 3 6-6M14 7h5v5"/>',
  range: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>',
  armor: '<path d="M12 4l7 3v5c0 4-3 6.6-7 8-4-1.4-7-4-7-8V7z"/>',
};
const GLYPH = [
  [/heal|mend/i, '<path d="M12 6v12M6 12h12" stroke-width="3.4"/>'],
  [/health|hp|vigor|life/i, '<path d="M12 19s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.6a3.8 3.8 0 0 1 7 2.2C19 14.6 12 19 12 19z" fill="currentColor" stroke="none"/>'],
  [/cool|cd|quick/i, '<circle cx="12" cy="12.5" r="6.5"/><path d="M12 9v3.8l2.4 1.6"/>'],
  [/range|reach/i, '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>'],
  [/move|speed.*move|swift/i, '<path d="M5 15l5-5 3 3 6-6M14 7h5v5"/>'],
  [/attack speed|haste|as\b/i, '<path d="M6 7l5 5-5 5M12 7l5 5-5 5"/>'],
  [/status|burn|poison|chill|shock|apply/i, '<path d="M12 4.5c3 4 5.5 6.8 5.5 9.7a5.5 5.5 0 0 1-11 0c0-2.9 2.5-5.7 5.5-9.7z"/>'],
  [/armou?r|guard|block|defen/i, '<path d="M12 4l7 3v5c0 4-3 6.6-7 8-4-1.4-7-4-7-8V7z"/>'],
  [/dmg|damage|might|power/i, '<path d="M14.5 4.5H19.5v5L10.5 18.5l-5-5z"/><path d="M4.5 19.5l3-3"/>'],
];
function glyph(n) {
  if (n.id && /Mastery$/.test(n.id)) return '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>';
  const k = n.stats && n.stats[0] && n.stats[0].k;
  if (k && BYKEY[k]) return BYKEY[k];
  const s = `${n.stat || ''} ${n.id} ${n.name}`;
  for (const [re, d] of GLYPH) if (re.test(s)) return d;
  return '<path d="M12 6v12M6 12h12" stroke-width="3"/>';
}

// ---------------------------------------------------------------- drawing
function nodeSvg(save, id, n, st, sel) {
  const r = sizeOf(n), cls = `wn ${n.kind} ${st.state}${n.id === sel ? ' sel' : ''}`;
  let shape = '', inner = '';
  if (n.kind === 'root') {
    return `<g class="${cls}" data-n="${n.id}" transform="translate(${n.x} ${n.y})">
      <circle r="${r + 10}" class="halo"/><circle r="${r}" class="body"/>
      <clipPath id="wclip"><circle r="${r - 4}"/></clipPath>
      <image href="${HEROES[id].portrait || HEROES[id].art}" x="${-r}" y="${-r + 2}" width="${2 * r}" height="${2 * r}" clip-path="url(#wclip)"/>
      <circle r="${r}" class="rim"/></g>`;
  }
  if (n.kind === 'tier' || n.kind === 'ability') {
    shape = `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.42}" class="body"/>`;
    const ic = icon('ability', n.ability || n.id).replace('<svg ', `<svg x="${-r * 0.66}" y="${-r * 0.66}" width="${r * 1.32}" height="${r * 1.32}" `);
    inner = ic + (n.tier ? `<g transform="translate(${r * 0.72} ${-r * 0.72})"><circle r="11" class="tierdot"/><text y="4" class="tiert">${roman(n.tier)}</text></g>` : '');
  } else if (n.kind === 'keystone') {
    shape = `<rect x="${-r * 0.8}" y="${-r * 0.8}" width="${r * 1.6}" height="${r * 1.6}" rx="7" transform="rotate(45)" class="body"/>`;
    inner = `<path d="M0 -11L3.4 -3.4 11 0 3.4 3.4 0 11 -3.4 3.4 -11 0 -3.4 -3.4z" class="gl fillgl"/>`;
  } else if (n.kind === 'slot') {
    const p = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
    shape = `<polygon points="${p}" class="body"/>`;
    inner = `<path d="M0 -9L8 -2 0 10 -8 -2z" class="gl gem"/>`;
  } else {
    shape = `<circle r="${r}" class="body"/>`;
    inner = `<svg x="-12" y="-12" width="24" height="24" viewBox="0 0 24 24" class="gl" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${glyph(n)}</svg>`;
  }
  // ranks: a tick per rank round the node
  let ticks = '';
  if (st.max > 1 && (st.rank || st.state !== 'locked')) {
    const rr = r + 7, gap = 0.32, span = (Math.PI * 2 - gap * st.max) / st.max;
    for (let k = 0; k < st.max; k++) {
      const a0 = -Math.PI / 2 + k * (span + gap) + gap / 2, a1 = a0 + span;
      ticks += `<path d="M${(Math.cos(a0) * rr).toFixed(1)} ${(Math.sin(a0) * rr).toFixed(1)}A${rr} ${rr} 0 0 1 ${(Math.cos(a1) * rr).toFixed(1)} ${(Math.sin(a1) * rr).toFixed(1)}" class="tick ${k < st.rank ? 'on' : ''}"/>`;
    }
  }
  const lock = !st.lvOk && st.state !== 'owned' ? `<g class="lk" transform="translate(${r * 0.7} ${r * 0.7})"><circle r="9"/><path d="M-3.4 -0.5v-2a3.4 3.4 0 0 1 6.8 0v2M-4.6 -0.5h9.2v6h-9.2z"/></g>` : '';
  return `<g class="${cls}" data-n="${n.id}" transform="translate(${n.x} ${n.y})"><circle r="${r + 14}" class="hit"/>
    ${st.state === 'open' ? `<circle r="${r + 6}" class="glow"/>` : ''}${shape}${inner}${ticks}${lock}</g>`;
}

function linkSvg(a, b, sa, sb) {
  const ao = sa.rank > 0, bo = sb.rank > 0;
  const cls = ao && bo ? 'own' : (ao && sb.state === 'open') || (bo && sa.state === 'open') ? 'open' : ao || bo ? 'near' : '';
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="wl ${cls}"/>`;
}

function contentSvg(save, id, sel) {
  const w = M.web(id), st = {}, vis = visibleSet(save, id, w), shown = (n) => !vis || vis.has(n.id);
  for (const n of w.nodes) st[n.id] = M.nodeState(save, id, n);
  let maxR = 0; for (const n of w.nodes) maxR = Math.max(maxR, Math.hypot(n.x - w.root.x, n.y - w.root.y));
  // faint rings every 150 units: the wheel the web grows on
  let rings = '';
  for (let r = 150; r <= maxR + 60; r += 150) rings += `<circle cx="${w.root.x}" cy="${w.root.y}" r="${r}" class="ring"/>`;
  let links = '';
  const seen = new Set();
  for (const n of w.nodes) for (const l of n.links) {
    const k = n.id < l ? n.id + '|' + l : l + '|' + n.id; if (seen.has(k) || !w.by[l] || !shown(n) || !shown(w.by[l])) continue; seen.add(k);
    links += linkSvg(n, w.by[l], st[n.id], st[l]);
  }
  // draw the dim ones first so lit paths sit on top
  const order = w.nodes.filter(shown).sort((a, b) => (st[a.id].state === 'locked') - (st[b.id].state === 'locked')).reverse();
  return { html: `<g class="rings">${rings}</g><g class="links">${links}</g><g class="nodes">${order.map((n) => nodeSvg(save, id, n, st[n.id], sel)).join('')}</g>`, maxR, st };
}

// ---------------------------------------------------------------- the component
// mountTree(host, { save, id, sel, onSelect(nodeId|null), onLearn(nodeId) }) -> { refresh(save, sel), focus(nodeId) }
export function mountTree(host, o) {
  const { id } = o;
  let save = o.save, sel = o.sel || null, maxR = contentSvg(o.save, id, null).maxR;
  host.innerHTML = `<svg class="web" xmlns="${NS}"><defs><radialGradient id="wbg" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#1D2347"/><stop offset="1" stop-color="#0E1120"/></radialGradient></defs>
      <rect class="bg" width="100%" height="100%" fill="url(#wbg)"/><g class="stars"></g><g class="cam"></g></svg>
    <div class="web-hud"><span class="pill wp">${I.lock}</span><button class="pill wcenter" aria-label="centre">${I.center}</button></div>
    <div class="web-panel hidden"></div>`;
  const svgEl = host.querySelector('svg.web'), cam = svgEl.querySelector('.cam'), panel = host.querySelector('.web-panel');
  // stars: fixed to the screen, so panning feels like moving over the sky
  svgEl.querySelector('.stars').innerHTML = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 97.13) % 100, y = (i * 61.7 + (i % 7) * 13) % 100, r = 0.5 + (i % 5) * 0.28;
    return `<circle cx="${x}%" cy="${y}%" r="${r}" fill="#fff" opacity="${0.1 + (i % 4) * 0.08}"/>`;
  }).join('');

  const W = () => host.clientWidth || 390, Hh = () => host.clientHeight || 600;
  let v = views[id];
  const fitK = () => Math.max(0.42, Math.min(1, (Math.min(W(), Hh() - 120) / 2 - 24) / Math.min(400, Math.max(200, maxR + 40))));
  if (!v) { v = views[id] = { k: fitK(), x: 0, y: 0 }; const w = M.web(id); v.x = W() / 2 - w.root.x * v.k; v.y = (Hh() - 40) / 2 - w.root.y * v.k; }
  const apply = () => { cam.setAttribute('transform', `translate(${v.x.toFixed(1)} ${v.y.toFixed(1)}) scale(${v.k.toFixed(4)})`); };
  const clamp = () => {
    const w = M.web(id), cx = w.root.x, cy = w.root.y, pad = (maxR + 80) * v.k;
    const sx = cx * v.k + v.x, sy = cy * v.k + v.y;
    const nx = Math.max(W() / 2 - pad, Math.min(W() / 2 + pad, sx)), ny = Math.max(Hh() / 2 - pad, Math.min(Hh() / 2 + pad, sy));
    v.x += nx - sx; v.y += ny - sy;
  };
  const zoomAt = (k, px, py) => {
    k = Math.max(0.28, Math.min(2.4, k));
    v.x = px - (px - v.x) * (k / v.k); v.y = py - (py - v.y) * (k / v.k); v.k = k; clamp(); apply();
  };

  function draw() {
    const c = contentSvg(save, id, sel); maxR = c.maxR;
    cam.innerHTML = c.html;
    const p = M.points(save, id);
    host.querySelector('.wp').innerHTML = `<span class="pts">${M.pointsShown(save, id)}</span><span class="quiet small">${p === 1 ? 'point' : 'points'}</span>`;
    drawPanel(c.st);
    apply();
  }
  function drawPanel(st) {
    const n = sel && M.web(id).by[sel];
    panel.classList.toggle('hidden', !n || n.kind === 'root');
    if (!n || n.kind === 'root') { panel.innerHTML = ''; return; }
    const s = st[n.id];
    const kind = n.kind === 'tier' || n.kind === 'ability' ? `Ability${n.tier ? ' · tier ' + roman(n.tier) : ''}` : n.kind === 'keystone' ? 'Keystone' : n.kind === 'slot' ? 'Trinket slot' : 'Training';
    const rankTxt = s.max > 1 ? ` · ${s.rank}/${s.max}` : s.maxed ? ' · learned' : '';
    const miss = (s.needs || []).find((x) => !x.ok);
    const need = !s.owned ? 'Recruit this hero first' : !miss ? '' : miss.what === 'link' ? 'Learn a node next to it first' : miss.text;
    const ico = n.kind === 'tier' || n.kind === 'ability' ? `<span class="np-ico ab">${icon('ability', n.ability || n.id)}</span>` : `<span class="np-ico ${n.kind}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${n.kind === 'keystone' ? '<path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="currentColor" stroke="none"/>' : n.kind === 'slot' ? '<path d="M12 3l8 6-8 12-8-12z"/>' : glyph(n)}</svg></span>`;
    const btn = s.maxed ? `<button class="btn wide no" disabled>${I.check} Learned</button>`
      : `<button class="btn wide ${s.can ? 'teal' : 'no'}" data-learn="${n.id}">${s.can ? `Learn - ${s.cost} ${s.cost === 1 ? 'point' : 'points'}` : need || `Needs ${s.cost} ${s.cost === 1 ? 'point' : 'points'}`}</button>`;
    panel.innerHTML = `<div class="np-head">${ico}<div><b class="np-name">${n.name}</b><span class="cap">${kind}${rankTxt}</span></div><button class="np-x" data-close aria-label="close">×</button></div>
      <p class="np-desc">${n.desc || ''}</p>${btn}`;
  }

  // ---- easing the camera to a node (it sits above the panel)
  let anim = 0;
  function focus(nodeId) {
    const n = M.web(id).by[nodeId]; if (!n) return;
    const tx = W() / 2 - n.x * v.k, ty = (Hh() - (nodeId === 'root' ? 0 : 200)) / 2 - n.y * v.k;
    const fx = v.x, fy = v.y, t0 = performance.now();
    cancelAnimationFrame(anim);
    const step = (now) => { const t = Math.min(1, (now - t0) / 260), e = 1 - Math.pow(1 - t, 3); v.x = fx + (tx - fx) * e; v.y = fy + (ty - fy) * e; apply(); if (t < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function choose(nodeId) {
    sel = nodeId && nodeId !== 'root' ? nodeId : null;
    draw();
    if (sel) focus(sel);
    o.onSelect && o.onSelect(sel);
  }

  // ---- touch: one finger pans, two pinch, a still tap picks
  const ptr = new Map(); let pinch = null, down = null;
  svgEl.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(anim);
    try { svgEl.setPointerCapture(e.pointerId); } catch {}
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const hit = e.target && e.target.closest ? e.target.closest('[data-n]') : null;
    if (ptr.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), n: hit ? hit.dataset.n : null, moved: false };
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: v.k }; if (down) down.moved = true; }
  });
  svgEl.addEventListener('pointermove', (e) => {
    const p = ptr.get(e.pointerId); if (!p) return;
    const r = svgEl.getBoundingClientRect();
    if (ptr.size === 2 && pinch) {
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...ptr.values()];
      zoomAt(pinch.k * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(20, pinch.d), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
    if (down && down.moved) { v.x += dx; v.y += dy; clamp(); apply(); }
  });
  const up = (e) => {
    if (!ptr.has(e.pointerId)) return;
    ptr.delete(e.pointerId);
    if (ptr.size < 2) pinch = null;
    if (ptr.size === 0 && down && !down.moved && performance.now() - down.t < 500) choose(down.n || null);
    if (ptr.size === 0) down = null;
  };
  svgEl.addEventListener('pointerup', up); svgEl.addEventListener('pointercancel', up);
  svgEl.addEventListener('wheel', (e) => { e.preventDefault(); const r = svgEl.getBoundingClientRect(); zoomAt(v.k * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  host.querySelector('.wcenter').onclick = () => { v.k = fitK(); focus('root'); };
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { choose(null); return; }
    const b = e.target.closest('[data-learn]'); if (!b) return;
    if (b.classList.contains('no')) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); o.onDeny && o.onDeny(); return; }
    o.onLearn && o.onLearn(b.dataset.learn);
  });

  draw();
  if (sel) focus(sel);
  return {
    refresh(s, pulse) {
      save = s; draw();
      if (pulse) { const g = cam.querySelector(`[data-n="${pulse}"]`); if (g) g.classList.add('justgot'); }
    },
    focus, select: choose,
  };
}
