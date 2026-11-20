// The skill tree, drawn two ways (round 7, lane C: "an actual tree or web ... interesting to look at and tap").
// Both read the same nodes (progress.js tree() -> heroes.js treeFor), so new nodes or costs show up by themselves.
//   Grove: a tree growing up out of the hero. Each ability is a bough you climb: tier I, II, III sit on the bands of
//          the run level they wake at (Lv 2, 5, 8); the Lv 8 band is the feat line. Bought boughs glow; the next step
//          you can afford is a lit dashed path. The repeatable training (and the second trinket slot) are the roots.
//          Tap a node for its sheet.
//   Star wheel: the hero at the hub; three spokes (one per ability) cross three rings, one per run level, the
//          outer ring the feat ring. Training stars sit between the spokes. Tap a spoke or a star and the wheel turns
//          that branch to the top; its path is listed underneath with buy buttons in thumb reach.
import { HEROES, BRANCHES, FEAT_LEVEL } from './heroes.js';
import * as P from './progress.js';
import { icon } from './icons.js';
import { I, gold, roman } from './camp-kit.js';

export function treeHtml(kind, o) { return kind === 'wheel' ? wheel(o) : grove(o); }

// A node's state as a class: owned, part (some ranks), ready (can buy now), poor (could, no gold), locked.
function cls(st) { return st.maxed ? 'owned' : st.rank ? 'part' : !st.met ? 'locked' : st.canBuy ? 'ready' : 'poor'; }
// A ring of ticks round a repeatable node: one per rank, lit when bought.
function rankRing(n, rank, r = 46) {
  const segs = [], gap = 10, span = (360 - gap * n) / n;
  for (let k = 0; k < n; k++) {
    const a0 = -90 + k * (span + gap) + gap / 2, a1 = a0 + span;
    const p = (a) => `${50 + r * Math.cos(a * Math.PI / 180)} ${50 + r * Math.sin(a * Math.PI / 180)}`;
    segs.push(`<path d="M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}" class="${k < rank ? 'on' : ''}"/>`);
  }
  return `<svg class="rring" viewBox="0 0 100 100">${segs.join('')}</svg>`;
}
function face(n) {
  if (n.kind === 'tier') return `${icon('ability', n.ability, 'nico')}<i class="rn">${roman(n.tier)}</i>`;
  if (n.kind === 'slot') return '<span class="gem" style="--g:#C9A7FF"></span>';
  return `<b class="plus">+</b>`;
}
function costTag(save, id, n, st) {
  if (st.maxed) return `<span class="ntag got">${n.max > 1 ? 'All' : 'Owned'}</span>`;
  return `<span class="ntag">${gold(st.cost)}</span>`;
}
function lockBadge(save, id, n, st) {
  if (st.met || st.rank) return '';
  const feat = n.req.feat && !save.heroes[id].feat;
  return `<span class="nlock ${feat ? 'feat' : ''}">${feat ? I.star : I.lock}</span>`;
}

// ================================================================ grove
// Laid out on a 360 x 730 board, scaled to the width.
const GW = 360, GH = 730, COLX = [62, 180, 298], BAND = { 1: 380, 2: 236, 3: 94 }, HERO_Y = 496, GROUND = 556, ROOT_Y = 642;
const ROOTX = [45, 135, 225, 315];
const pct = (x, y) => `left:${(x / GW * 100).toFixed(3)}%;top:${(y / GH * 100).toFixed(3)}%`;

function grove({ save, id, sel }) {
  const nodes = P.tree(id), h = HEROES[id], feat = save.heroes[id].feat;
  const tiers = (b) => nodes.filter((n) => n.branch === b.id && n.kind === 'tier').sort((a, c) => a.tier - c.tier);
  const rest = nodes.filter((n) => n.kind !== 'tier');
  let svg = '', html = '';
  // the bands: the run level each tier wakes at; the top one is the feat line
  for (const t of [1, 2, 3]) {
    const y = BAND[t], lvl = tiers(BRANCHES[0])[t - 1] ? tiers(BRANCHES[0])[t - 1].req.level : [2, 5, 8][t - 1];
    svg += `<line class="band ${t === 3 ? 'featband' : ''} ${t === 3 && feat ? 'met' : ''}" x1="6" x2="${GW - 6}" y1="${y}" y2="${y}"/>`;
    html += `<span class="bandtag ${t === 3 ? 'feat' : ''} ${t === 3 && feat ? 'met' : ''}" style="${pct(121, y)}">Lv ${lvl}${t === 3 ? ` ${I.star}` : ''}</span>`;
  }
  // the ground and the roots
  svg += `<rect class="soil" x="0" y="${GROUND}" width="${GW}" height="${GH - GROUND}" rx="18"/>`;
  svg += `<path class="grass" d="M0 ${GROUND + 2}${Array.from({ length: 30 }, (_, i) => ` l6 -${4 + (i * 7) % 6} l6 ${4 + (i * 7) % 6}`).join('')}"/>`;
  rest.forEach((n, k) => {
    const x = ROOTX[k % 4], st = P.nodeState(save, id, n), on = st.rank > 0;
    svg += `<path class="root ${on ? 'lit' : ''}" d="M180 ${HERO_Y + 30} C180 ${GROUND + 20} ${x} ${GROUND + 10} ${x} ${ROOT_Y}"/>`;
  });
  // the boughs: hero -> I -> II -> III; lit when the node they lead to is owned, marching when it's the next buy
  BRANCHES.forEach((b, bi) => {
    const x = COLX[bi];
    let px = 180, py = HERO_Y - 40;
    tiers(b).forEach((n, k) => {
      const st = P.nodeState(save, id, n), y = BAND[n.tier];
      const d = k === 0 ? `M${px} ${py} C${px} ${py - 50} ${x} ${y + 60} ${x} ${y}` : `M${px} ${py} C${px + (bi - 1) * -14} ${py - 50} ${x + (bi - 1) * 16} ${y + 50} ${x} ${y}`;
      const w = [13, 10, 7][k];
      svg += `<path class="bark" d="${d}" style="stroke-width:${w + 5}"/><path class="bough ${cls(st)}" d="${d}" style="stroke-width:${w}"/>`;
      // a couple of leaves along the way
      const lx = (px + x) / 2, ly = (py + y) / 2;
      svg += `<ellipse class="leaf ${st.rank ? 'lit' : ''}" cx="${lx + (bi === 2 ? -12 : 12)}" cy="${ly}" rx="9" ry="4.5" transform="rotate(${bi === 2 ? 30 : -30} ${lx + (bi === 2 ? -12 : 12)} ${ly})"/>`;
      px = x; py = y;
    });
    // a twig past the top, so the bough doesn't stop dead
    svg += `<path class="bark" d="M${px} ${py} q${(bi - 1) * 10} -30 ${(bi - 1) * 6} -50" style="stroke-width:6"/>`;
  });
  // the nodes
  BRANCHES.forEach((b, bi) => {
    const ab = h.abilities[b.ability];
    html += `<span class="bhead" style="${pct(COLX[bi], 26)}">${icon('ability', ab.id, 'bico')}<b>${ab.name}</b><span>${b.name}</span></span>`;
    for (const n of tiers(b)) html += gnode(save, id, n, COLX[bi], BAND[n.tier], sel);
  });
  rest.forEach((n, k) => { html += gnode(save, id, n, ROOTX[k % 4], ROOT_Y, sel, true); });
  html += `<span class="soiltag" style="${pct(14, GROUND + 22)}">Roots: training, bought again and again</span>`;
  html += `<span class="ghero" style="${pct(180, HERO_Y)}"><span class="halo"></span><img src="${h.art}" alt=""></span>`;
  return `<div class="grove" style="aspect-ratio:${GW}/${GH}"><svg class="gsvg" viewBox="0 0 ${GW} ${GH}" preserveAspectRatio="none">${svg}</svg>${html}</div>
    <p class="treekey"><span class="k owned"></span>owned <span class="k ready"></span>can buy <span class="k poor"></span>short of gold <span class="k locked"></span>locked</p>`;
}
function gnode(save, id, n, x, y, sel, root = false) {
  const st = P.nodeState(save, id, n);
  const ring = n.max > 1 ? rankRing(n.max, st.rank) : '';
  return `<button class="gnode ${n.kind} ${cls(st)} ${sel === n.id ? 'sel' : ''} ${root ? 'rootnode' : ''}" data-act="node:${n.id}" data-node="${n.id}" style="${pct(x, y)}">
    <span class="nface">${ring}${face(n)}</span>${lockBadge(save, id, n, st)}
    ${root ? `<span class="nname">${n.name}</span>` : ''}${costTag(save, id, n, st)}</button>`;
}

// ================================================================ star wheel
const WR = { 1: 76, 2: 130, 3: 184 }, WS = 420, C = WS / 2, STAT_R = 103;
const wpos = (ang, r) => ({ x: C + Math.cos(ang * Math.PI / 180) * r, y: C + Math.sin(ang * Math.PI / 180) * r });
const wp = (p) => `left:${(p.x / WS * 100).toFixed(3)}%;top:${(p.y / WS * 100).toFixed(3)}%`;
// The angle the wheel is turned to, to bring branch b to the top, taken the short way round from where it was.
export function wheelAngle(b, from = 0) {
  let to = -120 * b;
  while (to - from > 180) to -= 360;
  while (to - from < -180) to += 360;
  return to;
}

function wheel({ save, id, pick, shown, sel }) {
  const nodes = P.tree(id), h = HEROES[id], feat = save.heroes[id].feat;
  const from = shown[id] ?? -120 * pick, to = wheelAngle(pick, from); shown[id] = to;
  let svg = '', html = '';
  // the rings
  for (const t of [1, 2, 3]) svg += `<circle class="wring ${t === 3 ? 'featring' : ''} ${t === 3 && feat ? 'met' : ''}" cx="${C}" cy="${C}" r="${WR[t]}"/>`;
  // a faint web between the tiers of neighbouring spokes (looks only: no rule behind it)
  for (const t of [1, 2, 3]) for (let b = 0; b < 3; b++) {
    const a = wpos(-90 + b * 120, WR[t]), c = wpos(-90 + ((b + 1) % 3) * 120, WR[t]);
    svg += `<path class="web" d="M${a.x} ${a.y}Q${C} ${C} ${c.x} ${c.y}"/>`;
  }
  BRANCHES.forEach((b, bi) => {
    const ang = -90 + bi * 120, mine = nodes.filter((n) => n.branch === b.id);
    const tiers = mine.filter((n) => n.kind === 'tier').sort((a, c) => a.tier - c.tier);
    let r0 = 44;
    for (const n of tiers) {
      const st = P.nodeState(save, id, n), a = wpos(ang, r0), c = wpos(ang, WR[n.tier]);
      svg += `<line class="spoke ${cls(st)}" x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}"/>`;
      html += wnode(save, id, n, c, bi, sel);
      r0 = WR[n.tier];
    }
    // training (and the second slot) sit between the spokes, a little round from their own
    mine.filter((n) => n.kind !== 'tier').forEach((n) => {
      const st = P.nodeState(save, id, n), p = wpos(ang + 60, n.kind === 'slot' ? WR[3] : STAT_R), hub = wpos(ang + 60, 44);
      svg += `<line class="tether ${cls(st)}" x1="${hub.x}" y1="${hub.y}" x2="${p.x}" y2="${p.y}"/>`;
      html += wnode(save, id, n, p, bi, sel);
    });
  });
  // labels that don't turn: the run level beside each ring, at the top spoke
  const tags = [1, 2, 3].map((t) => `<span class="ringtag ${t === 3 ? 'feat' : ''} ${t === 3 && feat ? 'met' : ''}" style="${wp({ x: C + 31, y: C - WR[t] })}">Lv ${[2, 5, 8][t - 1]}${t === 3 ? ` ${I.star}${feat ? '' : '<em>feat</em>'}` : ''}</span>`).join('');
  const hub = `<span class="whub"><span class="halo"></span><img src="${h.art}" alt=""></span>`;
  return `<div class="wheelbox"><div class="wheel">
      <div class="wheel-rot" style="--turn:${from}deg" data-turn-to="${to}"><svg class="wsvg" viewBox="0 0 ${WS} ${WS}">${svg}</svg>${html}</div>
      ${hub}${tags}<i class="pointer"></i></div>
    ${branchPanel(save, id, pick, sel)}</div>`;
}
function wnode(save, id, n, p, bi, sel) {
  const st = P.nodeState(save, id, n), ring = n.max > 1 ? rankRing(n.max, st.rank) : '';
  return `<button class="wnode ${n.kind} ${cls(st)} ${sel === n.id ? 'sel' : ''}" data-act="spin:${bi}:${n.id}" data-node="${n.id}" style="${wp(p)}">
    <span class="up"><span class="nface">${ring}${face(n)}</span>${lockBadge(save, id, n, st)}</span></button>`;
}

// Under the wheel: the branch at the top, its path step by step, buyable right there.
function branchPanel(save, id, pick, sel) {
  const h = HEROES[id], b = BRANCHES[pick], ab = h.abilities[b.ability];
  const mine = P.tree(id).filter((n) => n.branch === b.id);
  const tabs = BRANCHES.map((x, i) => `<button class="wtab ${i === pick ? 'on' : ''}" data-act="spin:${i}">${icon('ability', h.abilities[x.ability].id, 'bico')}<span><b>${h.abilities[x.ability].name}</b><span>${x.name}</span></span></button>`).join('');
  const rows = mine.sort((a, c) => (a.kind === 'tier' ? a.tier : 9) - (c.kind === 'tier' ? c.tier : 9)).map((n) => {
    const st = P.nodeState(save, id, n), c = cls(st);
    const head = n.kind === 'tier' ? `<span class="step">${roman(n.tier)}</span>` : n.kind === 'slot' ? '<span class="step gemstep"><span class="gem" style="--g:#C9A7FF"></span></span>' : '<span class="step plus">+</span>';
    const when = n.kind === 'tier' ? `<span class="wake">Wakes at Lv ${n.req.level}</span>` : n.max > 1 ? `<span class="pips">${Array.from({ length: n.max }, (_, k) => `<i class="${k < st.rank ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const need = st.needs.filter((x) => !x.ok).map((x) => `<span class="need">${x.what === 'feat' ? I.star : I.lock}${x.text}</span>`).join('');
    const btn = st.maxed ? `<span class="done">${I.check}${n.max > 1 ? 'All bought' : 'Owned'}</span>`
      : `<button class="btn buy ${st.canBuy ? '' : 'poor'}" data-act="buynode:${n.id}">${gold(st.cost)}</button>`;
    return `<div class="prow2 ${c} ${sel === n.id ? 'sel' : ''}" data-node="${n.id}">${head}<span class="ptext"><b>${n.kind === 'tier' ? `Tier ${roman(n.tier)}` : n.name}</b>${when}
      <span class="pdesc">${n.kind === 'tier' ? ab.tiers[n.tier - 1] : n.desc}</span>${need}</span>${btn}</div>`;
  }).join('');
  return `<div class="wtabs">${tabs}</div>
    <div class="bpanel"><div class="bp-head">${icon('ability', ab.id, 'bico big')}<span><b>${ab.name}</b><span class="muted">${ab.desc}</span></span></div>
      <div class="path">${rows}</div>
      <p class="muted">Tier III and the second trinket slot need the feat: reach level ${FEAT_LEVEL} in a dungeon.</p></div>`;
}
