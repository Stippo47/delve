// The Book's safety net (round 13): every preview spec (js/preview-sim.js) stepped once through a whole loop in Node.
// Fails (exit 1) on any that throw and any whose move, trait or item doesn't fire in every one of two loops.
//   node tools/preview-check.mjs [--only hero|foe|status|trinket|potion] [--id paladin] [--v]
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
// tiers that look alike: each ability played one loop at tiers I, II and III with the same dice; if two tiers in a row
// make exactly the same things (effects, shots, units, zones), the preview can't show what the tier changed
if (!opt('only') || opt('only') === 'hero') {
  const { HEROES } = await import('../js/heroes.js');
  const same = [];
  for (const id of Object.keys(HEROES)) { if (opt('id') && id !== opt('id')) continue; for (const ab of HEROES[id].abilities) {
    const sigs = [1, 2, 3].map((tier) => { setSeed(11); try { const S = PS.makeStage({ t: 'hero', id, move: ab.id, tier }); for (let i = 0; i < Math.ceil(S.loop / DT) - 1; i++) S.step(DT); return JSON.stringify(S.sig); } catch (e) { return 'err'; } });
    const pairs = [sigs[0] === sigs[1] ? 'I=II' : '', sigs[1] === sigs[2] ? 'II=III' : ''].filter(Boolean);
    if (pairs.length) same.push(`${id}:${ab.id} ${pairs.join(' ')}  (${ab.tiers.map((t, k) => ['I', 'II', 'III'][k] + ': ' + t).join(' | ')})`);
  } }
  console.log(`tier steps that make the same things (round 14: what the tier adds is in the caption under the stage; on the stage it shows only in how long, how big or how much): ${same.length}`); for (const x of same) console.log('  ' + x);
}
if (bad.length || quiet.length) process.exitCode = 1; // a preview that doesn't fire every loop fails the check
