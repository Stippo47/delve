// Writes docs/audit/worth.md from analyze.mjs's numbers. The hand-written parts (the short of it, the proposals) are
// read from tools/audit/worth/notes.md if it is there, between the markers <!-- short --> and <!-- proposals -->.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));

export function write(R) {
  const { zw, L, P, ABS, PAIRS, HERO, NOISE, SD, summary, it, sg, pc, nm, hn, abName, clear, castTxt, PANEL4, BT } = R;
  const notes = existsSync(resolve(HERE, 'notes.md')) ? readFileSync(resolve(HERE, 'notes.md'), 'utf8') : '';
  const part = (k) => { const m = notes.match(new RegExp(`<!-- ${k} -->([\\s\\S]*?)<!-- /${k} -->`)); return m ? m[1].trim() : '_(to write)_'; };
  const rooms = (e) => it(e, (x) => sg(x, 2));
  const hp = (e) => it(e, (x) => pc(x)); // health margin in percentage points
  const win = (e) => it(e, (x) => pc(x) + '%');
  const casts = (A) => castTxt(A.casts.full);
  const S = summary.runs;
  const nAb = ABS.length;
  const fights = Object.values(BT.heroes).reduce((a, H) => a + Object.values(H).reduce((b, Bd) => b + Object.values(Bd).reduce((c, r) => c + r.win.length, 0), 0), 0);
  const runs = Object.values(R.DG.heroes).reduce((a, H) => a + Object.entries(H).filter(([k]) => k[0] !== '_').reduce((b, [, r]) => b + r.rooms.length, 0), 0);

  P('# What each ability is worth (balance audit, round 16, lane "worth")');
  P();
  P('**Measure only.** No rule or number in the game was changed. Everything under "Proposals" is a proposal for the designer.');
  P();
  P('The designer: "Test how much having or not having a specific ability affects outcomes: 2 abilities at lvl 3 and 1 at 1, or 1 at 3');
  P('and none of the others. Whatever combo would show the best results for how each ability changes outcomes overall, not just');
  P('measure its fixed influence."');
  P();
  P('## The short of it');
  P();
  P(part('short'));
  P();
  P('## How it was measured');
  P();
  P('Every hero (59), every one of its three abilities (177), these builds, each played on the same seeds so the builds are');
  P('compared fight for fight and run for run (tools/audit/worth):');
  P();
  P('| Build | What is on | Read as |');
  P('|---|---|---|');
  P('| full | all three abilities at tier III | the baseline |');
  P('| minus one | two at III, this one switched off | **its worth to the kit** (full minus this): the main number |');
  P('| only one | this one at III, the other two off | its worth on its own (this minus bare) |');
  P('| one at I | this one at tier I, the others at III | what its upgrades (I to III) are worth (full minus this) |');
  P('| one at II | this one at II, the others at III | only for Rewind, Slow Time, Stop the Clock, Gale and Nullify: each tier step on its own |');
  P('| bare | none of the three | the floor |');
  P();
  P('"Switched off" means no tier node of the ability is owned, so the game sees it at tier 0: it is never picked, a passive');
  P('one is not hung on the hero. Checked: in every build where an ability is off it was cast 0 times and did 0 damage and 0');
  P(`healing (the audit hook's 'cast' event and the 'ab:' sources).${ABS.some((A) => A.leaks.length) ? ' **Except:** ' + ABS.filter((A) => A.leaks.length).map((A) => `${nm(A)} ${JSON.stringify(A.leaks)}`).join('; ') : ''}`);
  P();
  P('Two settings:');
  P();
  P(`- **Dungeon** (tools/ability-worth.mjs widened to every build): the hero and two random others, every dungeon in turn, bare`);
  P(`  runs (no trinkets, potions or web stats; the hero's three abilities set by the build, the other two heroes all at III),`);
  P(`  enemies at rank 1. ${S.dungeonN} parties per hero, each played once per build: **${runs.toLocaleString('en')} runs**. Measured: rooms cleared`);
  P(`  (a lost run's last room doesn't count), plus the hero's damage, the party's damage taken, healing and downs.`);
  P(`- **Battle** (battle mode, the crypt arena, foes at their own dungeon's strength): the hero with its whole tier III skill web`);
  P(`  (heroes.js tierBuild 3, the web's stat nodes kept so only the abilities differ), ${S.battleSeeds} seeds per fight: **${fights.toLocaleString('en')} fights**.`);
  P('  Four duels against a fixed panel, and one group fight:');
  for (const [k, v] of Object.entries(S.panel || {})) P(`  - ${k}: ${v}`);
  P('  The panel was picked (tools/audit/worth/calibrate.mjs) so a full kit wins most duels but not all and a bare one loses most;');
  P('  the group is hard on a bare kit (it wins 13% of them, a full kit 83%; duels 32% and 82%) so supports and healers have a fight to swing. Measured: the health margin');
  P('  (our side\'s share of health left minus theirs, -100 to +100) and the win rate. The margin is the main battle number:');
  P('  it moves even when the win doesn\'t.');
  P();
  P('### Reading the numbers');
  P();
  P('- **Rooms**: extra rooms cleared in a dungeon run. **Health**: points of health margin in battle (a fight\'s margin runs');
  P('  from -100, lost without a scratch on them, to +100, won without a scratch, so a difference can be up to 200). **Win**:');
  P('  points of win rate. Dungeon rates: the hero\'s damage a second, party damage a second it spares (hurt saved), healing a second.');
  P('- **kit** = full minus "minus one". **alone** = "only one" minus bare. **I to III** = full minus "one at I".');
  P('- A number in *italics* is inside the noise (under two standard errors from zero). Plain numbers are clear of it.');
  P('  With 177 abilities, about one plain number in twenty in a column is still luck (some 9 a column), so a lone plain number');
  P('  in one measure, against the other measures, is weak evidence; the same sign in two settings is strong.');
  P(`- The combined **score** ranks abilities across both settings: the dungeon rooms worth and the battle health worth (duels and`);
  P(`  group averaged, half each), each divided by how widely real worths spread across all ${nAb} abilities in that measure (rooms`);
  P(`  ${SD.rooms.toFixed(2)}, health ${(100 * SD.battle).toFixed(1)} points; the spread the noise adds taken out), then averaged with each weighted by how sure`);
  P(`  it is (one over its standard error squared). Rooms are far noisier than battle health, so the battle carries most of the score.`);
  P(`  1.0 = one typical spread.`);
  P('- **Casts** = casts a dungeon run / casts a battle fight, in the full build.');
  P();
  P('### Noise');
  P();
  P('Median standard error of one ability\'s worth (paired builds, same seeds):');
  P();
  P('| | kit | alone | I to III | one build\'s own level |');
  P('|---|---|---|---|---|');
  P(`| Dungeon rooms (n=${S.dungeonN}) | ${NOISE.rooms.kitSE.toFixed(2)} | ${NOISE.rooms.aloneSE.toFixed(2)} | ${NOISE.rooms.upgSE.toFixed(2)} | ${NOISE.rooms.levelSE.toFixed(2)} |`);
  P(`| Duels, health points (${S.battleSeeds} seeds x 4) | ${(100 * NOISE.duel.kitSE).toFixed(1)} | ${(100 * NOISE.duel.aloneSE).toFixed(1)} | ${(100 * NOISE.duel.upgSE).toFixed(1)} | ${(100 * NOISE.duel.levelSE).toFixed(1)} |`);
  P(`| Duels, win points | ${(100 * NOISE.duelWin.kitSE).toFixed(1)} | ${(100 * NOISE.duelWin.aloneSE).toFixed(1)} | ${(100 * NOISE.duelWin.upgSE).toFixed(1)} | ${(100 * NOISE.duelWin.levelSE).toFixed(1)} |`);
  P(`| Group, health points (${S.battleSeeds} seeds) | ${(100 * NOISE.group.kitSE).toFixed(1)} | ${(100 * NOISE.group.aloneSE).toFixed(1)} | ${(100 * NOISE.group.upgSE).toFixed(1)} | ${(100 * NOISE.group.levelSE).toFixed(1)} |`);
  P(`| Group, win points | ${(100 * NOISE.groupWin.kitSE).toFixed(1)} | ${(100 * NOISE.groupWin.aloneSE).toFixed(1)} | ${(100 * NOISE.groupWin.upgSE).toFixed(1)} | ${(100 * NOISE.groupWin.levelSE).toFixed(1)} |`);
  P(`| Dungeon hero damage a second | ${NOISE.dDps.kitSE.toFixed(2)} | ${NOISE.dDps.aloneSE.toFixed(2)} | ${NOISE.dDps.upgSE.toFixed(2)} | ${NOISE.dDps.levelSE.toFixed(2)} |`);
  P(`| Dungeon party damage taken a second | ${NOISE.dSaved.kitSE.toFixed(2)} | ${NOISE.dSaved.aloneSE.toFixed(2)} | ${NOISE.dSaved.upgSE.toFixed(2)} | ${NOISE.dSaved.levelSE.toFixed(2)} |`);
  P();
  P('Twice these is the line between a real difference and noise. Playing every build on the same seeds helps less than one');
  P('would hope: the builds share a fight only until the first moment they differ (the first cast), then drift apart, so');
  P('a worth\'s error is close to what two unmatched builds would give (compare the last column). Dungeon rooms are the');
  P('noisiest by far: a run ends at its first wipe, so rooms cleared swing by several rooms from run to run, and one');
  P('ability\'s rooms worth carries an error of most of a room. The dungeon\'s per-second rates and the battle numbers are');
  P('much steadier.');
  P();
  P('**Same seed, different fight.** On the way it turned out that one seed did not give one fight: unit ids come from a');
  P('counter that is never reset (js/sim.js `NEXT_ID`), and ids feed some movement (the wander and spacing wobble), so a fight');
  P('played after other fights in the same process plays out differently. The battle batch was run with the counter set to');
  P('the same start for every fight (one audit line, `AUDIT.idFrom`; nothing changes in the game); the dungeon batch was run');
  P('before that was found, so its builds are matched by party, dungeon and seed but not fight for fight. Its numbers are');
  P('still fair, just as noisy as unmatched runs (a test with the counter reset showed rooms no steadier). The same applies to');
  P('tools/ability-worth.mjs and tools/balance.mjs: same seeds there are not the same fights either.');
  P();

  // ---- the ranking
  const ranked = ABS.slice().sort((a, b) => b.score - a.score);
  P(`## All ${nAb} abilities by worth to their kit`);
  P();
  P('Sorted by the combined score of "minus one" (what the hero loses when this one is switched off and the other two are kept).');
  P();
  P('| # | Hero | Ability | Score | Rooms: kit | Duels health: kit | Group health: kit | Duels win | Group win | Score alone | Casts |');
  P('|---|---|---|---|---|---|---|---|---|---|---|');
  ranked.forEach((A, i) => P(`| ${i + 1} | ${hn(A.hero)} | ${nm(A)}${A.passive ? ' (passive)' : ''} | ${sg(A.score, 2)} | ${rooms(A.m.rooms.kit)} | ${hp(A.m.duel.kit)} | ${hp(A.m.group.kit)} | ${win(A.m.duelWin.kit)} | ${win(A.m.groupWin.kit)} | ${sg(A.scoreAlone, 2)} | ${casts(A)} |`));
  P();

  // ---- worth nothing
  const MS = ['rooms', 'duel', 'group'];
  const nothing = ABS.filter((A) => MS.every((m) => !clear(A.m[m].kit)) && MS.every((m) => !clear(A.m[m].alone)));
  const kitNothing = ABS.filter((A) => MS.every((m) => !clear(A.m[m].kit)) && !nothing.includes(A));
  const why = (A) => { const c = A.casts.full, o = A.casts.only;
    if (A.passive) return 'passive (never cast; works through a hook)';
    if ((c.dPerRun || 0) < 0.05 && (c.bPerFight || 0) < 0.05) return '**never fires** (0 casts in the full build)';
    if ((c.dPerRun || 0) < 1 && (c.bPerFight || 0) < 0.5) return `fires rarely (${castTxt(c)}; alone ${castTxt(o)})`;
    return `fires (${castTxt(c)}) but changes little`; };
  P('## Abilities worth about nothing');
  P();
  P('Neither switching it off (kit) nor having it alone (alone) makes a clear difference in any of the three measures (dungeon');
  P('rooms, duel health, group health). The "why" column checks whether it fires at all.');
  P();
  P('| Hero | Ability | Rooms kit / alone | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels kit / alone | Group kit / alone | Casts (full) | Why |');
  P('|---|---|---|---|---|---|---|---|');
  for (const A of nothing.sort((a, b) => a.score - b.score)) P(`| ${hn(A.hero)} | ${nm(A)} | ${rooms(A.m.rooms.kit)} / ${rooms(A.m.rooms.alone)} | ${it(A.m.dDps.kit, (x) => sg(x, 1))} / ${it(A.m.dSaved.kit, (x) => sg(x, 1))} / ${it(A.m.dHeal.kit, (x) => sg(x, 1))} | ${hp(A.m.duel.kit)} / ${hp(A.m.duel.alone)} | ${hp(A.m.group.kit)} / ${hp(A.m.group.alone)} | ${casts(A)} | ${why(A)} |`);
  if (!nothing.length) P('| (none) | | | | | | | |');
  P();
  P('Worth nothing **to the kit** but clearly worth something alone (the other two already do its job, so switching it off costs');
  P('nothing while they are on):');
  P();
  P('| Hero | Ability | Rooms kit / alone | Duels kit / alone | Group kit / alone | Casts (full) |');
  P('|---|---|---|---|---|---|');
  for (const A of kitNothing.sort((a, b) => a.score - b.score)) P(`| ${hn(A.hero)} | ${nm(A)} | ${rooms(A.m.rooms.kit)} / ${rooms(A.m.rooms.alone)} | ${hp(A.m.duel.kit)} / ${hp(A.m.duel.alone)} | ${hp(A.m.group.kit)} / ${hp(A.m.group.alone)} | ${casts(A)} |`);
  if (!kitNothing.length) P('| (none) | | | | | |');
  P();
  // casts check across all
  const never = ABS.filter((A) => !A.passive && (A.casts.full.dPerRun || 0) < 0.05 && (A.casts.full.bPerFight || 0) < 0.05);
  const rare = ABS.filter((A) => !A.passive && !never.includes(A) && (A.casts.full.dPerRun || 0) < 1 && (A.casts.full.bPerFight || 0) < 0.3);
  P(`Casts, all ${nAb}: ${ABS.filter((A) => A.passive).length} passive (${ABS.filter((A) => A.passive).map(nm).join(', ')}); never cast in the full build: ${never.length ? never.map((A) => `${nm(A)} [${A.heroName}]`).join(', ') : 'none'}; under one cast a dungeon run and under 0.3 a battle fight: ${rare.length ? rare.map((A) => `${nm(A)} [${A.heroName}] ${castTxt(A.casts.full)}`).join(', ') : 'none'}.`);
  P();

  // ---- carries
  const shareOf = (A, m) => { const sp = HERO[A.hero].lvl[m].span; return sp && clear(sp) && A.m[m].kit ? A.m[m].kit.m / sp.m : NaN; };
  const carries = ABS.map((A) => ({ A, sh: MS.map((m) => shareOf(A, m)) })).filter(({ A, sh }) => sh.filter((x) => x >= 0.6).length >= 2 && MS.some((m) => clear(A.m[m].kit)));
  P('## Abilities that carry their hero');
  P();
  P('Switching this one off takes away most of what the whole kit is worth (the share is "minus one" worth over "full minus bare"; 100% means');
  P('the hero without it is as weak as with nothing). Listed when the share is 60% or more in at least two of the three measures.');
  P();
  P('| Hero | Ability | Share: rooms / duels / group | Rooms full, without it, bare | Duels win full, without it, bare | Group win full, without it, bare |');
  P('|---|---|---|---|---|---|');
  const lv = (h, b, m, f) => { const s = summary.abilities; return f; };
  for (const { A, sh } of carries.sort((a, b) => b.A.score - a.A.score)) {
    const H = HERO[A.hero].lvl;
    const offR = A.m.rooms.offLvl, offD = A.m.duelWin.offLvl, offG = A.m.groupWin.offLvl;
    P(`| ${hn(A.hero)} | ${nm(A)} | ${sh.map((x) => (Number.isFinite(x) ? Math.round(100 * x) + '%' : '-')).join(' / ')} | ${H.rooms.full.m.toFixed(1)}, ${offR.m.toFixed(1)}, ${H.rooms.bare.m.toFixed(1)} | ${Math.round(100 * H.duelWin.full.m)}%, ${Math.round(100 * offD.m)}%, ${Math.round(100 * H.duelWin.bare.m)}% | ${Math.round(100 * H.groupWin.full.m)}%, ${Math.round(100 * offG.m)}%, ${Math.round(100 * H.groupWin.bare.m)}% |`);
  }
  if (!carries.length) P('| (none) | | | | | |');
  P();

  // ---- tier steps
  const upNothing = ABS.filter((A) => MS.every((m) => !clear(A.m[m].upg)));
  const matters = upNothing.filter((A) => MS.some((m) => clear(A.m[m].kit)));
  P('## Tier steps that change nothing');
  P();
  P('"I to III" is full minus "one at I": the whole upgrade path. Where an ability is worth nothing at all its upgrades are');
  P('worth nothing too, so the list that matters is abilities that **are** worth something to the kit but whose tiers II and');
  P(`III add nothing clear in any measure (${matters.length} of ${nAb}):`);
  P();
  P('| Hero | Ability | Rooms: kit / I to III | Duels: kit / I to III | Group: kit / I to III | Score: kit / I to III |');
  P('|---|---|---|---|---|---|');
  for (const A of matters.sort((a, b) => b.score - a.score)) P(`| ${hn(A.hero)} | ${nm(A)} | ${rooms(A.m.rooms.kit)} / ${rooms(A.m.rooms.upg)} | ${hp(A.m.duel.kit)} / ${hp(A.m.duel.upg)} | ${hp(A.m.group.kit)} / ${hp(A.m.group.upg)} | ${sg(A.score)} / ${sg(A.scoreUpg)} |`);
  P();
  P(`All ${upNothing.length} abilities with no clear I-to-III change, for the record: ${upNothing.map((A) => `${nm(A)} [${A.heroName}]`).join(', ')}.`);
  P();
  P('The upgrades worth the most (I to III, combined score):');
  P();
  P('| Hero | Ability | Rooms I to III | Duels I to III | Group I to III | Score I to III | Score kit |');
  P('|---|---|---|---|---|---|---|');
  for (const A of ABS.slice().sort((a, b) => b.scoreUpg - a.scoreUpg).slice(0, 15)) P(`| ${hn(A.hero)} | ${nm(A)} | ${rooms(A.m.rooms.upg)} | ${hp(A.m.duel.upg)} | ${hp(A.m.group.upg)} | ${sg(A.scoreUpg)} | ${sg(A.score)} |`);
  P();
  P('Upgrades that make it **worse** (I to III clearly negative somewhere):');
  P();
  const worse = ABS.filter((A) => MS.some((m) => clear(A.m[m].upg) && A.m[m].upg.m < 0));
  P('| Hero | Ability | Rooms I to III | Duels I to III | Group I to III |');
  P('|---|---|---|---|---|');
  for (const A of worse) P(`| ${hn(A.hero)} | ${nm(A)} | ${rooms(A.m.rooms.upg)} | ${hp(A.m.duel.upg)} | ${hp(A.m.group.upg)} |`);
  if (!worse.length) P('| (none) | | | | |');
  P();
  P('### The five steps flagged earlier');
  P();
  P('Each step on its own (tier II minus tier I, tier III minus tier II), the other two abilities at III:');
  P();
  P('| Hero | Ability | Step | Rooms | Duels health | Group health | Duels win | Group win |');
  P('|---|---|---|---|---|---|---|---|');
  for (const A of ABS.filter((x) => x.m.rooms.s12 || x.m.duel.s12)) for (const [st, lab] of [['s12', 'I to II'], ['s23', 'II to III']])
    P(`| ${hn(A.hero)} | ${nm(A)} | ${lab} | ${rooms(A.m.rooms[st])} | ${hp(A.m.duel[st])} | ${hp(A.m.group[st])} | ${win(A.m.duelWin[st])} | ${win(A.m.groupWin[st])} |`);
  P();

  // ---- combos
  const pz = (P2, k) => zw([[P2.m.rooms[k], SD.rooms], [P2.m.battle[k], SD.battle]]);
  for (const P2 of PAIRS) { P2.zOff = pz(P2, 'off'); P2.zOn = pz(P2, 'on'); P2.z = (P2.zOff + P2.zOn) / 2; }
  const anyClear = (P2, sign) => ['rooms', 'duel', 'group'].some((m) => ['off', 'on'].some((k) => clear(P2.m[m][k]) && Math.sign(P2.m[m][k].m) === sign));
  const abOf = (h, id) => ABS.find((x) => x.hero === h && x.id === id);
  const lvls = (P2, m) => { const A = abOf(P2.hero, P2.a), Bb = abOf(P2.hero, P2.b), C = abOf(P2.hero, P2.c), f = (e) => (e && Number.isFinite(e.m) ? pc(e.m) : '?');
    return `${f(HERO[P2.hero].lvl[m].bare)}; ${f(A.m[m].onlyLvl)}, ${f(Bb.m[m].onlyLvl)}; ${f(C.m[m].offLvl)}`; };
  const pairRow = (P2) => `| ${hn(P2.hero)} | ${abName(P2.hero, P2.a)} (${P2.a}) + ${abName(P2.hero, P2.b)} (${P2.b}) | ${rooms(P2.m.rooms.off)} / ${rooms(P2.m.rooms.on)} | ${hp(P2.m.duel.off)} / ${hp(P2.m.duel.on)} | ${hp(P2.m.group.off)} / ${hp(P2.m.group.on)} | ${sg(P2.z)} | ${lvls(P2, 'duel')} | ${lvls(P2, 'group')} |`;
  P('## Combo pairs');
  P();
  P('How much more two abilities are worth together than the two of them apart: (both) minus (first alone) minus (second alone)');
  P('plus (neither). Measured twice: with the hero\'s third ability off (AB - A - B + bare) and on (ABC - BC - AC + C). A');
  P('positive number is a combo; a negative one means they overlap (each does part of the other\'s job, or one keeps the other');
  P('from being cast: the hero casts one ability at a time and some lock it out while they last). Score as above.');
  P();
  P('Worth more together (clear somewhere, best first):');
  P();
  P('| Hero | Pair | Rooms (third off / on) | Duels health | Group health | Score | Duels level: none; each alone; both | Group level: none; each alone; both |');
  P('|---|---|---|---|---|---|---|---|');
  for (const P2 of PAIRS.filter((x) => anyClear(x, 1) && x.z > 0).sort((a, b) => b.z - a.z).slice(0, 25)) P(pairRow(P2));
  P();
  P('Worth less together (they overlap or get in each other\'s way):');
  P();
  P('Read the "level" columns before believing one of these. The health margin stops at +100 (won without a scratch), so when');
  P('either ability alone already wins the duel, the pair cannot add much: that shows up here as "worth less together" though');
  P('nothing overlaps. That is most of the list below (each alone already near the top). The real overlaps are the rows where');
  P('each alone is middling and both together are no better than one.');
  P();
  P('| Hero | Pair | Rooms (third off / on) | Duels health | Group health | Score | Duels level: none; each alone; both | Group level: none; each alone; both |');
  P('|---|---|---|---|---|---|---|---|');
  for (const P2 of PAIRS.filter((x) => anyClear(x, -1) && x.z < 0).sort((a, b) => a.z - b.z).slice(0, 20)) P(pairRow(P2));
  P();
  // gap
  const gz = (A) => zw([[A.m.rooms.gap, SD.rooms], [A.m.battle.gap, SD.battle]]);
  for (const A of ABS) A.gapZ = gz(A);
  P('### Worth with the others vs worth alone');
  P();
  P('The gap between "minus one" (its worth beside the other two) and "only one" (its worth on its own). Abilities that work');
  P('through the others are worth far more in the kit than alone; abilities that are worth more alone are partly covered by the');
  P('other two (or crowd them out).');
  P();
  P('| Hero | Ability | Rooms: kit / alone | Duels: kit / alone | Group: kit / alone | Gap score |');
  P('|---|---|---|---|---|---|');
  const gapRow = (A) => `| ${hn(A.hero)} | ${nm(A)} | ${rooms(A.m.rooms.kit)} / ${rooms(A.m.rooms.alone)} | ${hp(A.m.duel.kit)} / ${hp(A.m.duel.alone)} | ${hp(A.m.group.kit)} / ${hp(A.m.group.alone)} | ${sg(A.gapZ)} |`;
  for (const A of ABS.slice().sort((a, b) => b.gapZ - a.gapZ).slice(0, 12)) P(gapRow(A));
  P('| ... | | | | | |');
  for (const A of ABS.slice().sort((a, b) => b.gapZ - a.gapZ).slice(-12)) P(gapRow(A));
  P();

  // ---- the battle-mode bug
  const eth = [], base = [];
  for (const [h, H] of Object.entries(BT.heroes)) { let et = 0, ge = 0, n = 0, geDuel = 0, nDuel = 0; for (const [b, Bd] of Object.entries(H)) for (const [sc, r] of Object.entries(Bd)) { n += r.win.length; et += r.ethT || 0; ge += r.gameEnd || 0; if (sc !== 'group') { nDuel += r.win.length; geDuel += r.gameEnd || 0; } } if (et > 0) eth.push({ h, et, ge, n, geDuel, nDuel }); else if (n) base.push(ge / n); }
  P('## A battle-mode bug found on the way');
  P();
  P('Battle mode drops an ethereal unit from its side\'s head count (js/battle.js `fighting()`: meant for things like a ghost).');
  P('A hero is ethereal while it burrows (Digger, Burrow), rides its broom (Witch, Broom Ride), flies off with the flock');
  P('(Falconer, Call the Flock), hides in a bush (Trapper, Bush) or is a shadow (Shade: the Shadow Walk dash, Blackout at III and her');
  P('Fade trait). So a hero fighting alone who does any of those **loses on the spot**: the side counts as empty and');
  P('the fight ends in 2 to 5 seconds, scored as a wipe. In a first battle batch run with the game\'s rule this made Burrow, Call the Flock and Broom');
  P('Ride look like the three worst abilities in the game (Digger lost 100% of duels with Burrow, 0% without).');
  P();
  P('This audit\'s runner counts a hero as still in the fight while it is ethereal (tools/audit/worth/lib.mjs `stepBattle`,');
  P('otherwise the game\'s own step), and the battle batch was run that way. Nothing in js/ was changed. With the corrected count,');
  P('the fights where the game\'s own rule would have ended the battle early (all builds, all fights):');
  P();
  P('| Hero | Fights | Would have ended early: duels | group | Seconds ethereal a fight |');
  P('|---|---|---|---|---|');
  for (const e of eth) P(`| ${hn(e.h)} | ${e.n} | ${e.geDuel} of ${e.nDuel} | ${e.ge - e.geDuel} of ${e.n - e.nDuel} | ${(e.et / e.n).toFixed(1)} |`);
  if (!eth.length) P('| (none) | | | | |');
  P();
  P(`(Heroes that never go ethereal show ${Math.round(100 * Math.min(...base))} to ${Math.round(100 * Math.max(...base))}% on the same count: moments when one side is empty but something of theirs is still on its way in, which the game rightly waits for. Read the five above against that.)`);
  P();
  P('In a game the player sets up a lone Digger, Witch, Falconer, Trapper or Shade and watches it lose in seconds. Proposal');
  P('below. (The dungeon is not affected: it counts heroes that are standing, not ethereal ones.)');
  P();

  // ---- per hero
  P('## Per hero');
  P();
  P('Each hero: its level with everything (full) and with nothing (bare), then each ability\'s worth in every build and setting.');
  P('Rooms in rooms cleared; health and win in points out of 100. Kit = full minus "minus one"; alone = "only one" minus bare;');
  P('I to III = full minus "one at I". Italics = inside the noise.');
  P();
  for (const h of Object.keys(HERO)) {
    const H = HERO[h].lvl;
    P(`### ${hn(h)}`);
    P();
    P(`Full: ${H.rooms.full.m.toFixed(2)} rooms, duels won ${Math.round(100 * H.duelWin.full.m)}% (health ${pc(H.duel.full.m)}), group won ${Math.round(100 * H.groupWin.full.m)}% (health ${pc(H.group.full.m)}). Bare: ${H.rooms.bare.m.toFixed(2)} rooms, duels ${Math.round(100 * H.duelWin.bare.m)}% (${pc(H.duel.bare.m)}), group ${Math.round(100 * H.groupWin.bare.m)}% (${pc(H.group.bare.m)}).`);
    P();
    P('| Ability | Casts | Dmg share | Rooms: kit / alone / I-III | Dungeon kit, a second: hero dmg / hurt saved / heal | Duels health: kit / alone / I-III | Group health: kit / alone / I-III | Win kit: duels / group |');
    P('|---|---|---|---|---|---|---|---|');
    for (const A of ABS.filter((x) => x.hero === h)) {
      const m = A.m;
      P(`| ${nm(A)}${A.passive ? ' (passive)' : ''} | ${casts(A)} | ${Math.round(100 * A.share.dDmg)}% / ${Math.round(100 * A.share.bDmg)}%${A.share.dHeal > 0.05 ? `, heals ${Math.round(100 * A.share.dHeal)}%` : ''} | ${rooms(m.rooms.kit)} / ${rooms(m.rooms.alone)} / ${rooms(m.rooms.upg)} | ${it(m.dDps.kit, (x) => sg(x, 1))} / ${it(m.dSaved.kit, (x) => sg(x, 1))} / ${it(m.dHeal.kit, (x) => sg(x, 1))} | ${hp(m.duel.kit)} / ${hp(m.duel.alone)} / ${hp(m.duel.upg)} | ${hp(m.group.kit)} / ${hp(m.group.alone)} / ${hp(m.group.upg)} | ${win(m.duelWin.kit)} / ${win(m.groupWin.kit)} |`);
    }
    P();
  }

  P('## Proposals');
  P();
  P(part('proposals'));
  P();
  P('## What this could not measure');
  P();
  P(part('limits'));
  P();
  P('## Files');
  P();
  P('- tools/audit/worth/lib.mjs: the builds, the panel, one battle fight, one dungeon run, the cast and source watcher (AUDIT.on).');
  P('- tools/audit/worth/battle.mjs, dungeon.mjs: the batches (--shard i/n to split across processes).');
  P('- tools/audit/worth/calibrate.mjs: how the battle panel was picked.');
  P('- tools/audit/worth/analyze.mjs, report.mjs, notes.md: this page from the batches.');
  P('- docs/audit/data/worth/summary.json: every ability\'s worth in every build and measure with its standard error, casts,');
  P('  damage shares, every pair\'s interaction, each hero\'s full and bare levels.');
  P('- docs/audit/data/worth/battle-*.json, dungeon-*.json: the raw batches (per seed win and margin, per run rooms).');
  P();
  return L.join('\n');
}
