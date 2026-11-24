// Round 16, lane play16: how often the very first room of the Wildwood (floor 1, room 1) holds an elite or a major,
// counting the first lot and every wave. A strong party (level 20, points spent) plays the room out so every wave comes.
//   node tools/play16/room1.mjs [--n 1000] [--sizes 1,2,3,4] [--out file.json]
import './env.mjs';
import fs from 'node:fs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const N = +opt('n', 1000), sizes = opt('sizes', '1,2,3,4').split(',').map(Number);
const { newRun, update } = await import('../../js/dungeon.js');
const { setSeed } = await import('../../js/util.js');
const { freshSave } = await import('../../js/save.js');
const P = await import('../../js/progress.js');
const PARTY = ['archer', 'paladin', 'twinfang', 'cleric'];
const out = {};
for (const size of sizes) {
  const party = PARTY.slice(0, size);
  const o = out[size] = { n: 0, foes: 0, rooms: { anyElite: 0, anyMajor: 0, majorFirstLot: 0, majorInWaves: 0, twoMajors: 0 }, perRoomFoes: [], elites: 0, majors: 0, waves: 0 };
  for (let i = 0; i < N; i++) {
    const s = freshSave();
    for (const k of party) { const h = s.heroes[k]; h.owned = true; h.level = 20; h.points = 20; P.autoSpend(s, k); }
    s.party = party.slice(); s.unlocks = { slotMini1: true, slotBoss1: true, slotBoss2: true }; s.slots = 4;
    setSeed(1 + i * 7919 + size * 13);
    const run = newRun(s, { theme: 'wildwood', party, floor: 1 });
    o.waves += run.world.waves ? run.world.waves.left : 0;
    const seen = new Map(); let t = 0;
    while (run.rooms === 1 && run.phase !== 'lost' && t < 400) {
      for (const u of run.world.units) if ((u.trueTeam || u.team) === 'enemy' && !u.def.trap && !seen.has(u.id) && !(u.minion || u.summon || u.calledBy || u.gen)) seen.set(u.id, { elite: !!u.elite, major: !!u.major, at: t });
      update(run, 1 / 60); t += 1 / 60;
      if (run.phase === 'loot' || run.phase === 'choose') break; // (the room is won: nothing more comes)
    }
    const f = [...seen.values()], maj = f.filter((x) => x.major), eli = f.filter((x) => x.elite && !x.major);
    o.n++; o.foes += f.length; o.perRoomFoes.push(f.length); o.elites += eli.length; o.majors += maj.length;
    if (eli.length) o.rooms.anyElite++;
    if (maj.length) o.rooms.anyMajor++;
    if (maj.length > 1) o.rooms.twoMajors++;
    if (maj.some((x) => x.at < 0.5)) o.rooms.majorFirstLot++;
    if (maj.some((x) => x.at >= 0.5)) o.rooms.majorInWaves++;
  }
  const r = o.rooms;
  console.log(`party of ${size}: ${o.n} first rooms, ${(o.foes / o.n).toFixed(1)} foes a room (${(o.waves / o.n).toFixed(2)} waves); a major in ${(100 * r.anyMajor / o.n).toFixed(1)}% (first lot ${(100 * r.majorFirstLot / o.n).toFixed(1)}%, a wave ${(100 * r.majorInWaves / o.n).toFixed(1)}%, two+ ${(100 * r.twoMajors / o.n).toFixed(1)}%), an elite in ${(100 * r.anyElite / o.n).toFixed(1)}%`);
  delete o.perRoomFoes;
}
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify(out, null, 1));
