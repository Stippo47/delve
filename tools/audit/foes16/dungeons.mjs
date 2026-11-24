// Round 17, lane foes16: how hard each dungeon's floors are, for one fixed party, so RANK_MULT can be re-set to keep
// each dungeon about where it was when its kinds' numbers change.
//   node tools/audit/foes16/dungeons.mjs [--dungeons wildwood,warren] [--n 30] [--seed 1] [--out file.json]
//     [--party a,b,c] [--level N] (every floor at that level) [--mult 0:0.8,3:3.1] (RANK_MULT entries tried instead)
// For each dungeon and floor: the party (paladin, archer, cleric, twinfang: the campaign's first four) at the level the
// round 12 campaign goes into that floor with (dungeon.js placeLevel), points spent by progress.js autoSpend, no
// trinkets or potions (a "bare" run: none picked up either), starts at the floor and plays it until it falls or the
// floor's last room is won. rooms: rooms won on that floor (7 = the floor done, its mini-boss or boss too).
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { D, setSeed, freshSave, AUDIT, ROOT, opt, r2 } from './lib.mjs';
const P = await import(pathToFileURL(resolve(ROOT, 'js/progress.js')).href);

const PARTY = opt('party') ? opt('party').split(',') : ['paladin', 'archer', 'cleric', 'twinfang'];
for (const kv of (opt('mult') || '').split(',').filter(Boolean)) { const [r, x] = kv.split(':'); D.RANK_MULT[+r] = +x; }
const DUNG = ['wildwood', 'warren', 'sewers', 'crypt', 'frost', 'ember', 'spire', 'dunes', 'foundry'];
const only = opt('dungeons') ? opt('dungeons').split(',') : null;
const N = +opt('n', 30), seed0 = +opt('seed', 1), DT = 1 / 60;
const levelFor = (rank, f) => (opt('level') ? +opt('level') : Math.round(D.placeLevel(rank, (f - 1) / D.FLOORS)));

function buildSave(level) {
  const s = freshSave();
  for (const k of PARTY) { const h = s.heroes[k]; h.owned = true; h.level = level; h.points = P.START_POINTS + level - 1; h.trinkets = []; P.autoSpend(s, k); }
  s.party = PARTY.slice(); s.trinkets = []; s.potions = 0; s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
  return s;
}
function floorRun(theme, f, level, seed) {
  setSeed(seed); AUDIT.idFrom = 1;
  const run = D.newRun(buildSave(level), { theme, party: PARTY, floor: f, bare: true });
  let t = 0, won = 0;
  const start = run.rooms;
  while (run.phase !== 'won' && run.phase !== 'lost' && run.phase !== 'retreated' && t < 3000) {
    D.update(run, DT); t += DT;
    if (run.floor > f) { won = 1; break; }
  }
  if (run.phase === 'won') won = 1;
  const rooms = won ? 7 : Math.max(0, run.rooms - start); // (run.rooms counts the rooms entered; the first is built by newRun)
  return { rooms, won, t };
}
const rows = [];
for (const theme of DUNG) {
  if (only && !only.includes(theme)) continue;
  const rank = D.DUNGEON_RANK[theme];
  for (let f = 1; f <= D.FLOORS; f++) {
    const level = levelFor(rank, f);
    let rooms = 0, won = 0, t = 0;
    for (let i = 0; i < N; i++) { const r = floorRun(theme, f, level, seed0 * 100003 + rank * 7919 + f * 613 + i * 31); rooms += r.rooms; won += r.won; t += r.t; }
    const row = { theme, rank, floor: f, level, n: N, rooms: r2(rooms / N), won: r2(won / N), secs: Math.round(t / N) };
    rows.push(row); console.log(JSON.stringify(row));
  }
}
if (opt('out')) writeFileSync(opt('out'), JSON.stringify({ party: PARTY, n: N, mult: D.RANK_MULT, rows }, null, 1));
