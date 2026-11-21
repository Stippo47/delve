// What the camp and the HUD ask about progression (round 8 contract, docs/BUILD-v4.md), in one place. The rules live
// in progress.js (lane L); this file only reads them and shapes them for the screens (plus the cheat for points and
// ?web=N, a made-up web of N nodes to try the canvas at the size the designer wants).
//   save.heroes[id] = { owned, level, xp, points, nodes: { nodeId: rank }, trinkets, recoverUntil }
//   treeFor(id) -> [{ id, x, y, kind: 'root'|'ability'|'tier'|'stat'|'keystone'|'slot', name, desc, max, cost, links, level? }]
import * as P from './progress.js';
import { HEROES, HERO_IDS } from './heroes.js';
import { THEMES } from './themes.js';


// ---------------------------------------------------------------- money
export const cheat = (save) => !!save.cheat;
export const afford = (save, n) => P.afford(save, 'gold', n);

// ---------------------------------------------------------------- hero levels (permanent)
export const level = (save, id) => Math.max(1, (save.heroes[id] && save.heroes[id].level) || 1);
export const xp = (save, id) => Math.max(0, (save.heroes[id] && save.heroes[id].xp) || 0);
export const xpNeed = (lv) => P.xpToNext(lv);
export const points = (save, id) => (cheat(save) ? Infinity : Math.max(0, (save.heroes[id] && save.heroes[id].points) || 0));
export const pointsShown = (save, id) => (cheat(save) ? '∞' : String(points(save, id)));

// ---------------------------------------------------------------- heroes for gold
export const heroPrice = (id) => P.heroPrice(id);
export const recruit = (save, id) => P.unlockHero(save, id);

// ---------------------------------------------------------------- the skill web
// treeFor(id) nodes: { id, x, y, kind, name, desc, max, cost, links, needs, level, stats, ability?, tier? }.
const webCache = {};
export function web(id) {
  if (webCache[id]) return webCache[id];
  const demo = demoSize();
  const nodes = demo ? demoWeb(id, demo) : P.tree(id).map((n) => ({ ...n }));
  const by = {};
  for (const n of nodes) { n.links = (n.links || []).slice(); n.needs = n.needs || []; by[n.id] = n; }
  for (const n of nodes) for (const l of n.links) if (by[l] && !by[l].links.includes(n.id)) by[l].links.push(n.id); // both ways
  return (webCache[id] = { nodes, by, root: nodes.find((n) => n.kind === 'root'), demo: !!demo });
}
export const rank = (save, id, nodeId) => (web(id).by[nodeId] && web(id).by[nodeId].kind === 'root' ? 1 : P.rank(save, id, nodeId));
// One node for the web's drawing: owned (all ranks), part (some), open (learn it now), near (linked, but short of
// points, a level or a node it needs), locked (not linked yet). The cheat makes points free.
export function nodeState(save, id, n) {
  const st = web(id).demo ? demoState(save, id, n) : P.nodeState(save, id, n);
  const need = (w) => st.needs.find((x) => x.what === w);
  const lv = need('level'), linked = st.reachable !== false, owned = save.heroes[id].owned;
  const lvOk = !lv || lv.ok;
  const needsOk = st.needs.every((x) => x.ok || x.what === 'owned');
  const can = st.canBuy || (cheat(save) && st.met && !st.maxed);
  const max = n.max || 1;
  return { rank: st.rank, max, maxed: st.maxed, cost: st.cost, linked, lvOk, owned, can, needs: st.needs,
    state: st.maxed ? 'owned' : st.rank ? 'part' : can ? 'open' : linked && needsOk ? 'near' : 'locked' };
}
export function learn(save, id, nodeId) {
  const n = web(id).by[nodeId]; if (!n) return false;
  const st = nodeState(save, id, n); if (!st.can) return false;
  const h = save.heroes[id];
  if (web(id).demo) { h.nodes = { ...h.nodes, [nodeId]: st.rank + 1 }; if (!cheat(save)) h.points -= st.cost; return true; }
  if (cheat(save)) h.points = (h.points || 0) + st.cost; // the cheat: the point comes back as it's spent
  return P.buyNode(save, id, nodeId);
}
export const learnedCount = (save, id) => web(id).nodes.filter((n) => n.kind !== 'root' && rank(save, id, n.id) > 0).length;
function demoState(save, id, n) {
  const r = n.kind === 'root' ? 1 : (save.heroes[id].nodes || {})[n.id] || 0, max = n.max || 1, maxed = r >= max;
  const linked = n.kind === 'root' || n.links.some((l) => rank(save, id, l) > 0);
  const needs = [{ what: 'link', ok: linked, text: 'Buy a node next to it first' }];
  const met = linked && save.heroes[id].owned;
  return { rank: r, maxed, cost: maxed ? 0 : n.cost || 1, needs, met, reachable: linked, canBuy: met && !maxed && (save.heroes[id].points || 0) >= (n.cost || 1) };
}

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
// ---------------------------------------------------------------- party slots (from boss kills)
export const SLOT_MAX = P.SLOT_MAX;
export const slots = (save) => P.slotCount(save);
// What opens the next seat, for the locked seat's line (null when every seat is open).
export function nextSlotHint(save) {
  const u = P.slotUnlocks(save).find((x) => !x.have);
  return u ? u.text : null;
}

// ---------------------------------------------------------------- dungeons, gating and checkpoints
export const dungeonOrder = () => P.DUNGEON_ORDER.filter((t) => THEMES[t]);
export const dungeonOpen = (save, t) => P.dungeonOpen(save, t);
export const dungeonState = (save, t) => P.dungeonState(save, t);
export const dungeonLockText = (t, save) => {
  const order = dungeonOrder(), prev = order[order.indexOf(t) - 1];
  return prev ? `Beat the boss of ${THEMES[prev].name}` : '';
};
export const checkpoint = (save, t) => P.dungeonState(save, t).checkpoint;
export const FLOORS = 3;
export const ROOMS = 7;

// ---------------------------------------------------------------- going in, and leaving early
export const LEAVE_CUT = P.LEAVE_LOSS;
export const runOptions = (save, theme, potionFor, floor) => P.runOptions(save, theme, potionFor, floor);
// What leaving now would cost: { lose: fraction, gold }.
export const leaveCost = (run) => (run && !run.summary ? P.leaveCost(run) : { lose: 0, gold: 0 });

export { HERO_IDS, HEROES };
