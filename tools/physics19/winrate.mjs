// Lane physics19 (round 19): did anybody's strength move? Plain battle-mode fights (the room as the game makes it, no
// staging), the same seeds on a copy of the game as it was (--root scratch/before) and on this tree.
//   node tools/physics19/winrate.mjs [--root <tree>] [--n 30] [--json out.json]
// The kinds whose bodies changed layer or rule: the ones that always fly (they no longer shove or block those on the
// floor), chains, big bodies, crowds, heroes that put things down. Bosses are measured in their own rooms with
// tools/runs.mjs --boss (tools/physics19/bosses.sh).
import FS from 'node:fs'; import PATH from 'node:path'; import URL_ from 'node:url';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const here = PATH.dirname(URL_.fileURLToPath(import.meta.url)), root = PATH.resolve(opt('root', PATH.join(here, '..', '..')));
const imp = (f) => import(URL_.pathToFileURL(PATH.join(root, 'js', f)).href);
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const B = await imp('battle.js'), { setSeed } = await imp('util.js'), { freshSave } = await imp('save.js'), P = await imp('progress.js');
const N = +opt('n', 30), DT = 1 / 60;
const save = freshSave(); save.cheat = true;
const parse = (s) => s.split(',').filter(Boolean).map((x) => { const [kn, rank] = x.split('@'), [k, n] = kn.split('*'); return { k, n: +n || 1, rank: +rank || 0 }; });
// [what, the foes, the party, its level]
const SETS = [
  ['bats', 'bat*10', 'paladin,archer', 19], ['ghosts and banshees', 'ghost*5,banshee*2', 'paladin,berserker,cleric', 26], ['wisps and wolves', 'wisp*8,wolf*8', 'paladin,archer', 1],
  ['cherubs and angels', 'cherub*6,angel*4', 'tower,twinfang,archer,cleric', 17], ['cinder bats and imps', 'cinderBat*8,imp*8', 'paladin,archer,cleric', 13], ['bees and wasps', 'bee*10,wasp*6', 'tower,twinfang,archer,cleric', 18],
  ['spirits', 'spiritFrost*4,spiritFire*4,spiritPoison*3', 'paladin,berserker,cleric', 10], ['rattlers (a crowd)', 'rattler*12,rattlerSpear*5', 'paladin,berserker,cleric,archer', 24],
  ['goblins and ogres', 'goblin*10,orc*4,ogre*2', 'paladin,berserker,cleric,archer', 11], ['sand serpents', 'sandSerpent*3', 'paladin,berserker,twinfang,cleric', 28], ['chain crawlers', 'chainCrawler*3', 'paladin,berserker,twinfang,cleric', 40],
  ['golems', 'golem*3,gildedGolem', 'tower,twinfang,archer,cleric', 40], ['slimes', 'slime*10,slimeBig*5', 'paladin,archer', 4], ['heroes with things to put down', 'orc*6,ogre*2,wolfRider*3', 'engineer,beekeeper,quartermaster,shaman', 12],
  ['the Mob', 'rattler*10,brute*2', 'mob,cleric,archer', 26],
];
let allW = 0, allN = 0; const out = {};
for (const [what, foes, party, lvl] of SETS) {
  let wins = 0, time = 0, never = 0;
  for (let i = 0; i < N; i++) {
    setSeed(7000 + i * 13);
    for (const id of party.split(',')) { const hv = save.heroes[id]; hv.owned = true; hv.level = lvl; hv.nodes = {}; hv.points = P.START_POINTS + lvl - 1; P.autoSpend(save, id); }
    const run = B.newBattle(save, { arena: B.homeOf(parse(foes)[0].k) || 'crypt', size: i % 2 ? 's' : 'l', a: parse(party), b: parse(foes) });
    globalThis.GAME = { run };
    let t = 0; while (!run.summary && t < 300) { B.updateBattle(run, DT); t += DT; }
    if (!run.summary) never++; else { if (run.summary.winner === 'b') wins++; time += run.summary.time; }
  }
  allW += wins; allN += N; out[what] = { foes, party, level: lvl, fights: N, foesWon: wins, secs: +(time / Math.max(1, N - never)).toFixed(1), never };
  console.log(`${what.padEnd(32)} ${foes.padEnd(40)} v ${party.padEnd(40)} L${lvl}: the foes won ${String(wins).padStart(2)} of ${N}, ${(time / Math.max(1, N - never)).toFixed(0)}s a fight${never ? ', never ended ' + never : ''}`);
}
console.log(`all: the foes won ${allW} of ${allN}`);
if (opt('json')) FS.writeFileSync(opt('json'), JSON.stringify(out, null, 1));
