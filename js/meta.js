// What the camp and the HUD ask about progression (round 8 contract, docs/BUILD-v4.md), in one place. The rules live
// in progress.js (lane L); this file only reads them, with small stand-ins for anything progress.js doesn't export
// yet, so the UI never has to know which version of the rules it is talking to.
//   save.heroes[id] = { owned, level, xp, points, nodes: { nodeId: rank }, trinkets, recoverUntil }
//   treeFor(id) -> [{ id, x, y, kind: 'root'|'ability'|'tier'|'stat'|'keystone'|'slot', name, desc, max, cost, links, level? }]
import * as P from './progress.js';
import { HEROES, HERO_IDS, treeFor } from './heroes.js';
import { xpToNext } from './units.js';
import { THEMES } from './themes.js';

const has = (name) => typeof P[name] === 'function';

// ---------------------------------------------------------------- money
export const cheat = (save) => !!save.cheat;
export const afford = (save, n) => P.afford(save, 'gold', n);

// ---------------------------------------------------------------- hero levels (permanent)
export const level = (save, id) => Math.max(1, (save.heroes[id] && save.heroes[id].level) || 1);
export const xp = (save, id) => Math.max(0, (save.heroes[id] && save.heroes[id].xp) || 0);
export const xpNeed = (lv) => (has('xpToNext') ? P.xpToNext(lv) : xpToNext(lv));
export const points = (save, id) => (cheat(save) ? Infinity : Math.max(0, (save.heroes[id] && save.heroes[id].points) || 0));
export const pointsShown = (save, id) => (cheat(save) ? '∞' : String(points(save, id)));

// ---------------------------------------------------------------- heroes for gold
// (before the round 8 rules land, prices were gems: shown as gold at 150 a gem)
export const heroPrice = (id) => {
  const u = HEROES[id].unlock || {};
  if (u.gold != null) return u.gold;
  if (has('heroGold')) return P.heroGold(id);
  const p = has('heroPrice') ? P.heroPrice(id) : u.gems || 0;
  const n = typeof p === 'number' ? p : p && p.gold != null ? p.gold : 0;
  return n < 20 ? n * 150 : n;
};
export function recruit(save, id) {
  if (has('buyHero')) return P.buyHero(save, id);
  if (has('unlockHero') && P.unlockHero.length >= 2) {
    const before = save.heroes[id].owned; const ok = P.unlockHero(save, id);
    if (ok || before !== save.heroes[id].owned) return ok;
  }
  if (save.heroes[id].owned || !P.pay(save, 'gold', heroPrice(id))) return false;
  save.heroes[id].owned = true; return true;
}

// ---------------------------------------------------------------- the skill web
// Nodes with x/y come straight from treeFor. Older trees (branches and tiers, no x/y) are laid out as a star round
// the hero so the web still has something to show.
const webCache = {};
export function web(id) {
  if (webCache[id]) return webCache[id];
  let nodes = (P.tree ? P.tree(id) : treeFor(id)).map((n) => ({ ...n }));
  const demo = demoSize();
  if (demo) nodes = demoWeb(id, demo);
  else if (!nodes.every((n) => typeof n.x === 'number')) nodes = starLayout(id, nodes);
  if (!nodes.some((n) => n.kind === 'root')) nodes.unshift({ id: 'root', kind: 'root', x: 0, y: 0, name: HEROES[id].name, desc: '', max: 1, cost: 0, links: [] });
  const by = {};
  for (const n of nodes) { n.links = (n.links || []).slice(); by[n.id] = n; }
  for (const n of nodes) for (const l of n.links) if (by[l] && !by[l].links.includes(n.id)) by[l].links.push(n.id); // links go both ways
  return (webCache[id] = { nodes, by, root: nodes.find((n) => n.kind === 'root') });
}
const costOf = (n, rank) => (Array.isArray(n.cost) ? n.cost[Math.min(rank, n.cost.length - 1)] : n.cost == null ? 1 : n.cost);
export const rank = (save, id, nodeId) => {
  const w = web(id), n = w.by[nodeId];
  if (n && n.kind === 'root') return 1;
  return (save.heroes[id].nodes || {})[nodeId] || 0;
};
// A node can be learned when one linked node is owned (the hero itself counts), the hero has the points, and it
// isn't at its max yet. n.level (optional) is the hero level it needs.
export function nodeState(save, id, n) {
  const r = rank(save, id, n.id), max = n.max || 1, maxed = r >= max;
  const linked = n.kind === 'root' || n.links.some((l) => rank(save, id, l) > 0);
  const cost = maxed ? 0 : costOf(n, r);
  const lvOk = !n.level || level(save, id) >= n.level;
  const owned = save.heroes[id].owned;
  const can = owned && linked && lvOk && !maxed && points(save, id) >= cost;
  return { rank: r, max, maxed, cost, linked, lvOk, owned, can, state: maxed ? 'owned' : r ? 'part' : can ? 'open' : linked && lvOk ? 'near' : 'locked' };
}
export function learn(save, id, nodeId) {
  const n = web(id).by[nodeId]; if (!n) return false;
  if (has('learnNode')) return P.learnNode(save, id, nodeId);
  const st = nodeState(save, id, n); if (!st.can) return false;
  const h = save.heroes[id];
  if (!cheat(save)) h.points = (h.points || 0) - st.cost;
  h.nodes = { ...h.nodes, [nodeId]: st.rank + 1 };
  return true;
}
export const learnedCount = (save, id) => web(id).nodes.filter((n) => n.kind !== 'root' && rank(save, id, n.id) > 0).length;

// ?web=100 fills every tree with a made-up web of that size, to try the canvas at the size the designer wants.
function demoSize() { try { const n = +new URLSearchParams(location.search).get('web'); return n > 10 ? Math.min(400, n) : 0; } catch { return 0; } }
function demoWeb(id, size) {
  const h = HEROES[id], nodes = [{ id: 'root', kind: 'root', x: 0, y: 0, name: h.name, desc: '', links: [] }];
  const stats = [['dmg', 'Damage', '+4% damage'], ['hp', 'Health', '+5% health'], ['as', 'Attack speed', '+3% attack speed'],
    ['rng', 'Range', '+4% attack range'], ['ms', 'Move speed', '+3% move speed'], ['heal', 'Healing', '+6% healing'], ['st', 'Status', '+8% status applied']];
  let k = 0;
  h.abilities.forEach((ab, b) => {
    const a0 = -Math.PI / 2 + b * Math.PI * 2 / 3;
    let prev = 'root';
    for (let t = 1; t <= 3; t++) {
      const r = 150 + t * 150, nid = `${ab.id}${t}`;
      nodes.push({ id: nid, kind: 'tier', ability: ab.id, tier: t, name: `${ab.name} ${'I'.repeat(t)}`, desc: ab.tiers[t - 1], x: Math.cos(a0) * r, y: Math.sin(a0) * r, links: [prev], max: 1, cost: t });
      prev = nid;
    }
  });
  const ringN = [12, 18, 24, 30, 36, 42];
  const rings = [];
  for (let ri = 0; ri < ringN.length && nodes.length < size; ri++) {
    const R = 110 + ri * 85, ring = [];
    for (let i = 0; i < ringN[ri] && nodes.length < size; i++) {
      const a = -Math.PI / 2 + (i + 0.5 + (ri % 2) * 0.5) * Math.PI * 2 / ringN[ri], s = stats[k++ % stats.length];
      const nid = `d${ri}_${i}`, key = ri > 1 && i % 9 === 4;
      ring.push(nid);
      nodes.push({ id: nid, kind: key ? 'keystone' : 'stat', stat: s[0], name: key ? 'Keystone' : s[1], desc: key ? 'A big change to how the hero fights.' : s[2],
        x: Math.cos(a) * R, y: Math.sin(a) * R, links: [], max: key ? 1 : 3, cost: key ? 2 : 1 });
    }
    rings.push(ring);
  }
  const at = (nid) => nodes.find((n) => n.id === nid);
  rings.forEach((ring, ri) => ring.forEach((nid, i) => {
    const n = at(nid);
    if (i % 3 !== 2) n.links.push(ring[(i + 1) % ring.length]);
    const inner = ri ? rings[ri - 1] : ['root'];
    let best = inner[0], bd = Infinity;
    for (const o of inner) { const m = at(o), d = Math.hypot(m.x - n.x, m.y - n.y); if (d < bd) { bd = d; best = o; } }
    if (ri === 0 || i % 2 === 0) n.links.push(best);
  }));
  return nodes;
}
// The old three-branch tree as a star: each ability's tiers out along a spoke, its training beside tier I.
function starLayout(id, old) {
  const out = [{ id: 'root', kind: 'root', x: 0, y: 0, name: HEROES[id].name, desc: '', links: [] }];
  const branches = [...new Set(old.map((n) => n.branch))];
  for (const n of old) {
    const b = Math.max(0, branches.indexOf(n.branch)), a = -Math.PI / 2 + b * Math.PI * 2 / Math.max(3, branches.length);
    let r = 150, da = 0;
    if (n.kind === 'tier') r = 70 + n.tier * 110;
    else if (n.kind === 'stat') { r = 170; da = 0.42; } else { r = 300; da = -0.5; }
    const links = n.req && n.req.node ? [n.req.node] : n.kind === 'tier' ? ['root'] : [old.find((o) => o.branch === n.branch && o.kind === 'tier').id];
    out.push({ ...n, kind: n.kind === 'tier' ? 'tier' : n.kind, x: Math.cos(a + da) * r, y: Math.sin(a + da) * r, links, cost: 1, level: undefined });
  }
  return out;
}

// ---------------------------------------------------------------- party slots (from boss kills)
export const SLOT_MAX = 4;
export const slots = (save) => Math.max(1, Math.min(SLOT_MAX, has('partySlots') ? P.partySlots(save) : save.slots || 1));
// What opens the next seat: a line for the locked seat.
export function nextSlotHint(save) {
  if (has('nextSlot')) { const s = P.nextSlot(save); if (s) return typeof s === 'string' ? s : s.text; return null; }
  const order = dungeonOrder();
  const n = slots(save);
  if (n >= SLOT_MAX) return null;
  const a = THEMES[order[0]], b = THEMES[order[1]];
  return [`Beat the ${short(a)} first mini-boss`, `Beat the ${short(a)} boss`, `Beat the ${short(b)} boss`][n - 1];
}

// ---------------------------------------------------------------- dungeons, gating and checkpoints
export function dungeonOrder() {
  if (P.DUNGEON_ORDER) return P.DUNGEON_ORDER.filter((t) => THEMES[t]);
  return Object.keys(THEMES).sort((a, b) => (THEMES[a].rank ?? 9) - (THEMES[b].rank ?? 9));
}
const rec = (save, t) => (save.dungeons && save.dungeons[t]) || { best: 0, cleared: 0 };
export function dungeonOpen(save, t) {
  if (has('dungeonOpen')) return P.dungeonOpen(save, t);
  const order = dungeonOrder(), i = order.indexOf(t);
  return i <= 0 || rec(save, order[i - 1]).cleared > 0;
}
export const dungeonLockText = (t) => { const order = dungeonOrder(), i = order.indexOf(t); return i > 0 ? `Beat the ${short(THEMES[order[i - 1]])} boss` : ''; };
const short = (th) => th.name.replace(/^The /, '');
// The deepest floor a run can start on (1 = the top).
export function checkpoint(save, t) {
  if (has('checkpoint')) return Math.max(1, P.checkpoint(save, t) || 1);
  const r = rec(save, t);
  return Math.max(1, Math.min(FLOORS, r.checkpoint || r.best || 1));
}
export const FLOORS = 3;
export const ROOMS = 7;
export const record = rec;

// ---------------------------------------------------------------- going in, and leaving early
export const LEAVE_CUT = P.LEAVE_CUT != null ? P.LEAVE_CUT : 0.2;
export function runOptions(save, theme, potionFor, floor) {
  const o = P.runOptions(save, theme, potionFor, floor);
  o.floor = floor || 1; o.startFloor = o.floor;
  return o;
}
// Would leaving now cost the cut? Not once the floor is done (between floors), or when the run is over.
export function leaveCosts(run) {
  if (!run || run.summary) return false;
  if (typeof run.floorDone === 'boolean') return !run.floorDone;
  return true;
}

export { HERO_IDS, HEROES };
