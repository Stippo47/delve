// Balance audit, lane "worth" (round 16). What each ability is worth: the same fights played with different sets of
// a hero's abilities switched on, and the outcomes compared. Measure only: nothing in js/ is changed.
//
// The builds (every hero; a, b, c are its three abilities):
//   full       all three at tier III (the baseline)
//   off:a      a switched off, the other two at III  ("minus one": what a is worth to the kit)
//   only:a     a at III, the other two off           ("only one": what a is worth on its own)
//   one:a      a at tier I, the other two at III      (do its upgrades matter?)
//   two:a      a at tier II, the others at III        (only the five abilities in STEP_CHECK)
//   bare       none of the three (the floor)
// "Off" means no tier node of that ability is owned, so the kit sees tier 0 (kits.js refreshKit / tierOf): kitThink
// never picks it, a passive's hook isn't hung, other code that asks tierOf(u, id) gets 0. The 'cast' audit event and
// the 'ab:<id>' damage/heal sources are counted per build so that can be checked.
//
// Two settings:
//   dungeon  (like tools/ability-worth.mjs) the hero and two random others, every dungeon in turn, bare runs at rank 1;
//            every hero in the party has only its three abilities' tier nodes (no web stats), the others all at III.
//   battle   battle mode, the hero's whole tier-III web (heroes.js tierBuild 3) with the ability tier nodes set per
//            build (the web's stat nodes stay, so only the abilities differ). A fixed panel of foes, 1v1, and one
//            group fight with a tank friend.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const B = await imp('js/battle.js');
const D = await imp('js/dungeon.js');
const { setSeed } = await imp('js/util.js');
const { freshSave } = await imp('js/save.js');
const { HEROES, HERO_IDS, tierBuild } = await imp('js/heroes.js');
const K = await imp('js/kits.js');
const { AUDIT, ownerOf, sourceOf } = await imp('js/stats.js');
const { THEME_IDS } = await imp('js/themes.js');
export { HEROES, HERO_IDS, THEME_IDS };
const DT = 1 / 60;

// ---------------------------------------------------------------- builds
// Earlier work found tier steps that look the same as the tier below (Rewind I-II and II-III, Slow Time I-II, Stop the
// Clock II-III, Gale I-II, Nullify I-II): those abilities also get a tier II build (two:id), so each step is measured.
export const STEP_CHECK = ['rewind', 'timeBubble', 'stopClock', 'gale', 'nullify'];
export function builds(hero) {
  const ids = HEROES[hero].abilities.map((a) => a.id), all = (t) => Object.fromEntries(ids.map((id) => [id, t]));
  const out = { full: all(3), bare: all(0) };
  for (const id of ids) {
    out['off:' + id] = { ...all(3), [id]: 0 };
    out['only:' + id] = { ...all(0), [id]: 3 };
    out['one:' + id] = { ...all(3), [id]: 1 };
    if (STEP_CHECK.includes(id)) out['two:' + id] = { ...all(3), [id]: 2 };
  }
  return out;
}
const setTiers = (nodes, spec) => { for (const [id, t] of Object.entries(spec)) for (let i = 1; i <= 3; i++) { if (i <= t) nodes[id + i] = 1; else delete nodes[id + i]; } return nodes; };
export const battleNodes = (hero, spec) => setTiers(tierBuild(hero, 3), spec);
export const dungeonNodes = (hero, spec) => setTiers({}, spec);

// ---------------------------------------------------------------- watching one hero
// casts per ability, and the hero's damage and healing by source (the same split stats.js makes), via AUDIT.on.
let WATCH = null;
AUDIT.on = (ev, w, u, src, amt, o) => {
  const Wt = WATCH; if (!Wt) return;
  if (ev === 'cast') { if (Wt.is(u)) Wt.casts[o.ab] = (Wt.casts[o.ab] || 0) + 1; return; }
  if (ev === 'hurt' || ev === 'heal') {
    if (!src) return; const root = ownerOf(src); if (!Wt.is(root)) return;
    const s = sourceOf(src, root, o || {}), m = ev === 'hurt' ? Wt.dmg : Wt.heal;
    if (ev === 'hurt' && (src.trueTeam || src.team) === (u.trueTeam || u.team)) return; // (friendly fire isn't work)
    m[s] = (m[s] || 0) + amt;
  }
};
function watch(is) { WATCH = { is, casts: {}, dmg: {}, heal: {} }; return WATCH; }

// ---------------------------------------------------------------- battle
// The panel (the hero alone): each foe at its own dungeon's strength (battle mode "scaled"), in the crypt arena. Picked by
// calibrate.mjs so a full tier-III kit wins most but not all (about 0.75-0.85 across the heroes) and a bare one loses
// most. The group fight: the hero with a Tower friend (a Paladin when the hero is the Tower) against a mixed crypt group.
export const PANEL = {
  melee: { a: [], b: [{ k: 'jackal', n: 1, rank: 2 }], name: 'a Jackal Guard (jackal), major: spear and shield, sidesteps and lunges' },
  ranged: { a: [], b: [{ k: 'cobra', n: 1, rank: 2 }], name: 'a Cobra (cobra), major: spits poison from range, backs off' },
  caster: { a: [], b: [{ k: 'frostShaman', n: 2, rank: 2 }], name: 'two Frost Shamans (frostShaman), major: lobbed blizzards (one alone is too weak to lose to)' },
  tank: { a: [], b: [{ k: 'golem', n: 1, rank: 2 }], name: 'a Golem (golem), major: 420 base health, throws lumps of itself' },
  group: { a: 'ally', b: [{ k: 'rattler', n: 3, rank: 2 }, { k: 'rattlerBow', n: 1, rank: 2 }, { k: 'banshee', n: 1, rank: 2 }, { k: 'brute', n: 1, rank: 2 }],
    name: 'with a Tower friend (a Paladin for the Tower) vs 3 skeletons, a skeleton archer, a banshee and a brute, all major' },
};
export const allyOf = (hero) => (hero === 'tower' ? 'paladin' : 'tower');
export function setPanel(p) { Object.assign(PANEL, p); }

export function battleFight(hero, scen, spec, seed, opts = {}) {
  const P = PANEL[scen], save = freshSave(); save.cheat = true;
  const a = [{ k: hero, n: 1, tier: 3 }]; if (P.a === 'ally') a.push({ k: allyOf(hero), n: 1, tier: 3 });
  setSeed(seed);
  const run = B.newBattle(save, { arena: opts.arena || 'crypt', size: opts.size || 'l', scaled: true, a, b: P.b });
  const me = run.sides.a.find((u) => u.kind === hero);
  me.kit.nodes = battleNodes(hero, spec); K.refreshKit(me, 1);
  const Wt = watch((x) => x === me);
  let guard = 0;
  try { while (run.phase === 'fight' && guard++ < 60 * 260) B.updateBattle(run, DT); } finally { WATCH = null; }
  if (run.phase === 'fight') B.callBattle(run);
  const S = B.summarizeBattle(run), row = S.sides.a.rows[0];
  return { win: run.winner === 'a' ? 1 : run.winner === 'draw' ? 0.5 : 0, margin: S.sides.a.health - S.sides.b.health, hpA: S.sides.a.health, hpB: S.sides.b.health,
    t: run.t, timeUp: run.timeUp ? 1 : 0, dmg: row.dmg || 0, taken: row.taken || 0, heal: row.heal || 0, casts: Wt.casts, src: Wt.dmg, hsrc: Wt.heal };
}

// ---------------------------------------------------------------- dungeon
function dungeonSave(party, lead, spec) {
  const s = freshSave();
  for (const k of party) {
    const h = s.heroes[k]; h.owned = true; h.level = 1; h.trinkets = []; h.nodes = {};
    if (k === lead) h.nodes = dungeonNodes(k, spec);
    else for (const ab of HEROES[k].abilities) for (let i = 1; i <= 3; i++) h.nodes[ab.id + i] = 1;
  }
  s.party = party.slice(); s.trinkets = []; s.potions = 0; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true };
  return s;
}
export function dungeonRun(lead, party, theme, spec, seed, cap = 900) {
  setSeed(seed);
  const run = D.newRun(dungeonSave(party, lead, spec), { theme, party, asRank: 1, bare: true });
  const Wt = watch((x) => x && x.kind === lead && (x.trueTeam || x.team) === 'hero' && !x.summonBy);
  let t = 0;
  try { while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < cap) { D.update(run, DT); t += DT; } } finally { WATCH = null; }
  const S = D.summarize(run).stats, me = S.heroes[lead];
  let taken = 0, heal = 0, downs = 0, pdmg = 0;
  for (const k of party) { taken += S.heroes[k].taken; heal += S.heroes[k].heal; downs += S.heroes[k].downs; pdmg += S.heroes[k].dmg; }
  return { rooms: Math.max(0, run.rooms - (run.phase === 'lost' ? 1 : 0)), won: run.phase === 'won' ? 1 : 0, secs: t, dmg: me.dmg, pdmg, hdowns: me.downs,
    taken, heal, downs, casts: Wt.casts, src: me.src.dmg, hsrc: me.src.heal };
}
export const ABILITIES = K.ABILITIES;
