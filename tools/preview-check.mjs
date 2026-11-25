// The Book's safety net (round 13): every preview spec (js/preview-sim.js) stepped once through a whole loop in Node.
// Fails (exit 1) on any that throw and any whose move, trait or item doesn't fire in every one of two loops.
// Round 18: and reports, for every hero ability at every tier, how it goes in its scene (see below).
//   node tools/preview-check.mjs [--only hero|foe|status|trinket|potion] [--id paladin] [--v] [--table]
// Round 18b: and the same for the monsters' moves and the statuses (at the end).
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
// the page's own modules can't load in Node (they need the DOM), so at least their syntax is checked
{ const { execFileSync } = await import('node:child_process'); const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  for (const f of ['js/book.js', 'js/unit.js', 'js/pager.js', 'js/preview.js', 'js/camp.js']) { const tmp = path.join(os.tmpdir(), 'delve-check-' + path.basename(f, '.js') + '.mjs'); fs.copyFileSync(f, tmp);
    try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); } catch (e) { console.log('SYNTAX ' + f + ': ' + String(e.stderr).split(String.fromCharCode(10)).slice(0, 4).join(' | ')); process.exitCode = 1; } finally { fs.rmSync(tmp, { force: true }); } } }
const PS = await import('../js/preview-sim.js');
const { setSeed } = await import('../js/util.js');
const { listen } = await import('../js/sfx.js').catch(() => ({ listen: null }));
if (listen) try { listen(false); } catch {}
const kinds = PS.foeGroups().flatMap((g) => g.kinds);
let specs = PS.allSpecs(kinds);
if (opt('only')) specs = specs.filter((s) => s.t === opt('only'));
if (opt('id')) specs = specs.filter((s) => s.id === opt('id'));
const DT = 1 / 30, bad = [], quiet = [], locked = [], notOffered = [];
const t0 = Date.now();
for (const s of specs) {
  setSeed(11);
  try {
    const S = PS.makeStage(s);
    const n = Math.ceil(2 * S.loop / DT) + 6; // two whole loops (each loop is a fresh world with its own dice) and into the next
    for (let i = 0; i < n; i++) S.step(DT);
    if (S.locked) locked.push(PS.specKey(s) + (S.why ? ' (' + S.why + ')' : ''));
    else if (s.t === 'foe' && s.move !== 'attack' && S.loopsFired === 0) notOffered.push(PS.specKey(s)); // book.js canStage: the Book doesn't offer it
    else if (S.loopsFired < S.loops) quiet.push(PS.specKey(s) + `  (fired in ${S.loopsFired} of ${S.loops} loops)`);
    if (args.includes('--v')) console.log(PS.specKey(s), S.locked ? 'locked' : `${S.loopsFired}/${S.loops}`);
  } catch (e) { bad.push(PS.specKey(s) + '  ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); }
}
console.log(`${specs.length} previews, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(`threw: ${bad.length}`); for (const b of bad) console.log('  ' + b);
console.log(`a loop where the move or trait never fired: ${quiet.length}`); for (const q of quiet) console.log('  ' + q);
console.log(`not offered in the Book (never fires, so its button is left out): ${notOffered.length}`); for (const q of notOffered) console.log('  ' + q);
console.log(`locked (shown as locked): ${locked.filter((l) => !l.includes(':hero:') && !/^hero:/.test(l)).length} not counting heroes' tier 0`);
for (const l of locked) if (!/^hero:/.test(l)) console.log('  ' + l);
// Round 18 (lane preview18): the report on the abilities, from tools/preview-measure.mjs. Each ability at tiers I, II
// and III, two loops each with the same dice for every tier:
//   when it first went off (and how often a loop), whether the hero's own brain chose it there or the stage had to cast
//   it, whether what it did was seen at all and reached anyone, tiers that played the very same loop (nothing on the
//   stage changed with the tier) and tiers that differ only in where things went, and blows on the hero side with
//   nothing seen behind them, on every hero-side stage.
//   --table   one line per ability: each tier's first go, times gone, brain or stage, what it reached
const WITHIN = 2.5; // seconds: "fires within the first second or two"
if (!opt('only') || opt('only') === 'hero') {
  const M = await import('./preview-measure.mjs');
  const { HEROES } = await import('../js/heroes.js');
  const t1 = Date.now(), rows = [], late = [], notShown = [], noOne = [], forced = [], wrong = [], same = [], posOnly = [], unseen = [];
  let runs = 0, fires = 0, byBrain = 0, firstMax = 0, firstSum = 0, firstN = 0;
  for (const id of Object.keys(HEROES)) { if (opt('id') && id !== opt('id')) continue; for (const ab of HEROES[id].abilities) {
    const k = id + ':' + ab.id, T = [1, 2, 3].map((tier) => { try { return M.measureAbility(id, ab.id, tier); } catch (e) { bad.push(k + ':' + tier + '  ' + (e && e.stack ? e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' | ') : e)); return null; } });
    if (T.some((x) => !x)) continue;
    const L = T.flat(); runs += L.length;
    for (const l of L) { fires += l.casts || (l.cast != null ? 1 : 0); if (l.brain) byBrain++; if (l.cast != null) { firstMax = Math.max(firstMax, l.cast); firstSum += l.cast; firstN++; } }
    if (L.some((l) => l.cast == null || l.cast > WITHIN)) late.push(k + '  (' + L.map((l) => (l.cast == null ? '-' : l.cast.toFixed(1))).join(' ') + ' s)');
    if (L.some((l) => !l.shown)) notShown.push(k); else if (L.some((l) => !l.reached)) noOne.push(k);
    if (L.some((l) => l.forced && !l.brain)) forced.push(k);
    if (L.some((l) => !l.right)) wrong.push(k);
    const u = L.reduce((a, l) => a + l.unseen, 0); if (u) unseen.push(k + '  ' + u + ' (' + L.flatMap((l) => l.unseenWhy).slice(0, 2).join(', ') + ')');
    const tr = T.map((x) => x[0].trace), sg = T.map((x) => JSON.stringify(x[0].sig)), words = '  (' + ab.tiers.map((t, i) => ['I', 'II', 'III'][i] + ': ' + t).join(' | ') + ')';
    const eq = [tr[0] === tr[1] ? 'I=II' : '', tr[1] === tr[2] ? 'II=III' : ''].filter(Boolean); if (eq.length) same.push(k + ' ' + eq.join(' ') + words);
    const po = [tr[0] !== tr[1] && sg[0] === sg[1] ? 'I~II' : '', tr[1] !== tr[2] && sg[1] === sg[2] ? 'II~III' : ''].filter(Boolean); if (po.length) posOnly.push(k + ' ' + po.join(' ') + words);
    if (args.includes('--table')) rows.push(k.padEnd(28) + T.map((x, i) => ['I', 'II', 'III'][i] + ' ' + x.map((l) => (l.cast == null ? '  -  ' : l.cast.toFixed(1) + 's') + ' x' + (l.casts || (l.cast != null ? 1 : 0)) + (l.brain ? ' brain' : l.forced ? ' stage' : ' hook') + (l.reached ? '' : ' (no one)') + (l.unseen ? ' UNSEEN' + l.unseen : '')).join(' / ')).join('  |  '));
  } }
  for (const r of rows) console.log(r);
  const list = (a) => { for (const x of a) console.log('  ' + x); };
  console.log(`abilities at tiers I-III: ${runs / 2} runs of two loops, ${((Date.now() - t1) / 1000).toFixed(1)}s`);
  console.log(`  first go: ${(firstSum / Math.max(1, firstN)).toFixed(2)} s on average, ${firstMax.toFixed(1)} s at the latest; ${(fires / runs).toFixed(2)} goes a loop; the hero's own brain chose it in ${byBrain} of ${runs} loops`);
  console.log(`a loop where it didn't go within ${WITHIN} s: ${late.length}`); list(late);
  console.log(`not shown (a loop where it drew nothing and touched no one): ${notShown.length}`); list(notShown);
  console.log(`drawn but reached no one (a loop where nothing it made touched a foe or a friend: a roll, a bush, a change of shape): ${noOne.length}`); list(noOne);
  console.log(`wrong scenario (a loop where the game's own scorer wouldn't have used it there): ${wrong.length}`); list(wrong);
  console.log(`cast by the stage (the brain didn't pick it by forceAt, though the scorer agreed): ${forced.filter((k) => !wrong.includes(k)).length}`); if (args.includes('--v')) list(forced);
  console.log(`tiers identical (the same loop at two tiers: nothing on the stage changed): ${same.length}`); list(same);
  console.log(`tiers that differ only in where things went (the same foes reached, statuses, buffs, heals, summons, sizes): ${posOnly.length}`); list(posOnly);
  // blows from nothing: the abilities' (above) and every other hero-side stage's
  const others = specs.filter((s) => (s.t === 'hero' && (s.move === 'attack' || s.move === 'trait')) || s.t === 'trinket' || s.t === 'potion');
  for (const s of others) { try { const r = M.unseenBlows(s); if (r.blows) unseen.push(PS.specKey(s) + '  ' + r.blows + ' (' + r.why.slice(0, 2).join(', ') + ')'); } catch (e) { /* counted above */ } }
  console.log(`blows on the hero side with nothing seen behind them (a target with no weapon, health set lower): ${unseen.length}`); list(unseen);
}
// Round 18b (lane preview18b): the same report on the monsters' pages (every enemy kind's moves at every rank the Book
// offers) and on the statuses, from tools/preview-measure.mjs measureStage, two loops each:
//   when it first went off and how often a loop, a loop where it didn't go within 2.5 s, straw targets on the stage,
//   wrong scenario (it went off but what it made reached no one, or a status never came to its burst or state), the
//   stage helping it (a target moved up to it, its health set lower), blows or health lost with nothing seen behind
//   them on either side, a status put on from nothing seen, and a monster's loop that showed only its plain blows.
//   --table   one line per move: each loop's first go, goes, what it was shown against
for (const t of ['foe', 'status']) {
  if (opt('only') && opt('only') !== t) continue;
  const M = await import('./preview-measure.mjs');
  const list = specs.filter((s) => s.t === t), t1 = Date.now(), R = {};
  for (const s of list) { try { R[PS.specKey(s)] = M.measureStage(s); } catch (e) { bad.push(PS.specKey(s) + '  ' + (e && e.stack ? e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' | ') : e)); } }
  const L = { late: [], straw: [], wrong: [], helped: [], unseen: [], fromNothing: [], blowsOnly: [] }; let loops = 0, goes = 0, fsum = 0, fn = 0, fmax = 0;
  for (const [k, X] of Object.entries(R)) {
    if (X[0].locked) continue;
    for (const r of X) { loops++; goes += r.fires; if (r.first != null) { fsum += r.first; fn++; fmax = Math.max(fmax, r.first); } }
    if (X.some((r) => r.first == null || r.first > WITHIN)) L.late.push(k + '  (' + X.map((r) => (r.first == null ? '-' : r.first.toFixed(1))).join(' ') + ' s)');
    if (X.some((r) => r.straw > 0)) L.straw.push(k);
    if (X.some((r) => r.fired && !r.reached)) L.wrong.push(k);
    if (X.some((r) => r.crutch)) L.helped.push(k);
    const u = X.reduce((a, r) => a + r.unseen, 0); if (u) L.unseen.push(k + '  ' + u + ' (' + X.flatMap((r) => r.unseenWhy).slice(0, 2).join(', ') + ')');
    if (t === 'status' && X.some((r) => r.fired && r.stFrom !== 'seen')) L.fromNothing.push(k);
    if (t === 'foe' && !k.includes(':attack:') && X.some((r) => r.fired && !r.own)) L.blowsOnly.push(k);
    if (args.includes('--table')) console.log(k.padEnd(30) + X.map((r) => (r.first == null ? '  -  ' : r.first.toFixed(1) + 's') + ' x' + r.fires + (r.reached ? '' : ' (no one)') + (t === 'foe' && !r.own ? ' (blows only)' : '')).join(' / ') + (X[0].against.length ? '   vs ' + X[0].against.join(', ') : ''));
  }
  const show = (a) => { for (const x of a) console.log('  ' + x); };
  console.log(`${t === 'foe' ? 'monster moves' : 'statuses'}: ${list.length} previews of two loops, ${((Date.now() - t1) / 1000).toFixed(1)}s`);
  console.log(`  first go: ${(fsum / Math.max(1, fn)).toFixed(2)} s on average, ${fmax.toFixed(1)} s at the latest; ${(goes / Math.max(1, loops)).toFixed(2)} goes a loop`);
  console.log(`  a loop where it didn't go within ${WITHIN} s: ${L.late.length}`); if (args.includes('--v')) show(L.late);
  console.log(`  straw targets on the stage (never moving, never striking back): ${L.straw.length}`); show(L.straw);
  console.log(`  wrong scenario (went off, but nothing it made reached anyone in 3.5 s${t === 'status' ? '; or it never came to its burst or state' : ''}): ${L.wrong.length}`); show(L.wrong);
  console.log(`  the stage helped it (a target moved up to it, its health set lower): ${L.helped.length}`); show(L.helped);
  console.log(`  blows or health lost with nothing seen behind them (either side): ${L.unseen.length}`); show(L.unseen);
  if (t === 'status') { console.log(`  put on from nothing seen (no fighter in view put it on): ${L.fromNothing.length}`); show(L.fromNothing); }
  if (t === 'foe') { console.log(`  a loop that showed only its plain blows (its own move never came): ${L.blowsOnly.length}`); if (args.includes('--v')) show(L.blowsOnly); }
}
if (bad.length || quiet.length) process.exitCode = 1; // a preview that doesn't fire every loop fails the check
