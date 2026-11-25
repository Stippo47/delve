// Round 18, lane res18: every enemy kind's resistances, weaknesses and immunities, where each comes from, and how much
// of each dungeon's spawn budget takes none of a status. MEASURES ONLY: nothing here changes js/.
//   node tools/audit/res18/dump.mjs            -> tools/audit/res18/kinds.json, kinds.csv, shares.json
// takes: 60 of each build-up given once through sim.js addStatus (the opponent as source), rank 0 / elite / major, so
// spawn-time buffs (the gilded shell), boss-kit defaults, charmProof and the like show as what really lands.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const B = await imp('js/battle.js');
const SIM = await imp('js/sim.js');
const { setSeed } = await imp('js/util.js');
const { freshSave } = await imp('js/save.js');
const { AUDIT } = await imp('js/stats.js');
const { DEFS } = await imp('js/units.js');
const { THEMES, DUNGEON_ORDER } = await imp('js/themes.js');
const { ENEMY_ARMOUR } = await imp('js/armour.js');
const { BEASTS } = await imp('js/bestiary.js');
const { BUILD_IDS } = await imp('js/statuses.js');
const OUT = resolve(ROOT, 'tools/audit/res18');
const save = freshSave(); save.cheat = true;

const { makeElite, makeMajor } = await imp('js/elites.js');
// one kind alone in a battle against a far-off paladin; a few frames stepped first so what its brain puts on itself at
// once (the gilded shell) is on. A kind battle mode won't seat (a summon, a part) is spawned straight into the world.
function takes(kind, type, amt, rank) {
  setSeed(1);
  let run, u, w, src;
  try { run = B.newBattle(save, { arena: 'crypt', size: 'l', a: [{ k: kind, n: 1, rank }], b: [{ k: 'paladin', n: 1, tier: 1 }] }); w = run.world; u = run.sides.a[0]; src = run.sides.b[0]; } catch (e) { run = null; }
  if (!u) {
    try { run = B.newBattle(save, { arena: 'crypt', size: 'l', a: [{ k: 'paladin', n: 1, tier: 1 }], b: [{ k: 'paladin', n: 1, tier: 1 }] }); } catch (e) { return null; }
    w = run.world; src = run.sides.b[0];
    try { u = SIM.spawn(w, kind, 200, 200, { mult: 1, team: 'enemy' }); } catch (e) { return null; }
    if (!u) return null;
    if (rank === 1) makeElite(w, u); else if (rank === 2) makeMajor(w, u);
    u.fallback = true;
  }
  src.x = u.x + 900; src.y = u.y;
  for (let i = 0; i < 3; i++) { try { SIM.step(w, 1 / 60); } catch (e) { break; } }
  if (!SIM.alive(u)) return null;
  const lead = u.linkTo || u;
  for (const k of Object.keys(lead.st || {})) lead.st[k] = 0;
  // what landed, read off the stats hook (amount x res, before any burst drops it again); src's own hit x taken off
  let got = 0; const hm = (src.def && src.def.hitMul) || 1;
  AUDIT.on = (ev, w2, uu, s2, a2, o) => { if (ev === 'status' && o && o.type === type && (uu === u || uu === lead)) got += a2; };
  try { SIM.addStatus(w, u, type, amt, src); } catch (e) { AUDIT.on = null; return null; }
  AUDIT.on = null;
  return Math.round(got / amt / hm * 100) / 100;
}

// where each kind spawns: per dungeon, per floor weight; its budget share in a fight room (weight x cost x pack size)
const spawnIn = {}, shares = {};
for (const id of DUNGEON_ORDER) {
  const T = THEMES[id]; if (!T) continue;
  shares[id] = { floors: [] };
  T.floors.forEach((F, fi) => {
    let tot = 0; const row = {};
    for (const [k, wt] of F.enemies) {
      const d = DEFS[k]; if (!d) continue;
      const pk = d.pack ? (d.pack[0] + d.pack[1]) / 2 : 1;
      const v = wt * (d.cost || 3) * pk; row[k] = v; tot += v;
      (spawnIn[k] || (spawnIn[k] = new Set())).add(`${id}${fi + 1}`);
    }
    for (const k in row) row[k] = Math.round(row[k] / tot * 1000) / 1000;
    shares[id].floors.push(row);
    for (const k of [F.mini, F.elite, ...(F.bossAdds || [])]) if (k) (spawnIn[k] || (spawnIn[k] = new Set())).add(`${id}${fi + 1}` + (k === F.mini ? ':mini' : k === F.elite ? ':elite' : ':adds'));
  });
  for (const k of [T.boss, T.bossKind, T.warden, T.elite, ...(T.bossAdds || [])]) if (k) (spawnIn[k] || (spawnIn[k] = new Set())).add(id + ':' + (k === T.boss || k === T.bossKind ? 'boss' : k === T.warden ? 'warden' : 'extra'));
}

const FLAGS = ['boss', 'mini', 'part', 'undead', 'construct', 'spirit', 'sandy', 'turret', 'hops', 'flies', 'fly', 'segment', 'chain', 'ethereal', 'goldShell', 'trap', 'noElite', 'cargo'];
const kinds = [];
for (const [k, d] of Object.entries(DEFS)) {
  if (d.team === 'hero') continue;
  const flags = FLAGS.filter((f) => d[f]).map((f) => (f === 'spirit' ? 'spirit:' + d.spirit : f));
  const row = { kind: k, name: d.name, base: d.base || null, where: [...(spawnIn[k] || [])], flags, res: d.res || {}, armour: d.armor ?? ENEMY_ARMOUR[k] ?? 0,
    puts: BUILD_IDS.filter((s) => d[s] > 0).map((s) => `${s}:${d[s]}`),
    habit: (BEASTS[k] && BEASTS[k].habit) || '', fun: (BEASTS[k] && BEASTS[k].fun) || '', takes: {} };
  for (const rank of [0, 1, 2]) {
    if (rank && (d.noElite || d.boss || d.part)) continue;
    const t = {};
    for (const s of BUILD_IDS) { const g = takes(k, s, 60, rank); if (g != null) t[s] = g; }
    row.takes[['plain', 'elite', 'major'][rank]] = t;
  }
  kinds.push(row);
}
writeFileSync(resolve(OUT, 'kinds.json'), JSON.stringify(kinds, null, 1));
writeFileSync(resolve(OUT, 'shares.json'), JSON.stringify(shares, null, 1));
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const lines = [['kind', 'name', 'where', 'flags', 'armour', 'puts', ...BUILD_IDS.map((s) => 'res_' + s), ...BUILD_IDS.map((s) => 'takes_' + s)].join(',')];
for (const r of kinds) lines.push([r.kind, q(r.name), q(r.where.join(' ')), q(r.flags.join(' ')), r.armour, q(r.puts.join(' ')),
  ...BUILD_IDS.map((s) => r.res[s] ?? ''), ...BUILD_IDS.map((s) => (r.takes.plain && r.takes.plain[s] != null ? r.takes.plain[s] : ''))].join(','));
writeFileSync(resolve(OUT, 'kinds.csv'), lines.join('\n'));
console.log(kinds.length, 'enemy kinds');
