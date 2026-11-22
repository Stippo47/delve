// The Book's safety net (round 13): every preview spec (js/preview-sim.js) stepped once through a whole loop in Node.
// Reports the ones that throw and the ones whose move never fired.
//   node tools/preview-check.mjs [--only hero|foe|status|trinket|potion] [--id paladin] [--v]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const PS = await import('../js/preview-sim.js');
const { setSeed } = await import('../js/util.js');
const { listen } = await import('../js/sfx.js').catch(() => ({ listen: null }));
if (listen) try { listen(false); } catch {}
const kinds = PS.foeGroups().flatMap((g) => g.kinds);
let specs = PS.allSpecs(kinds);
if (opt('only')) specs = specs.filter((s) => s.t === opt('only'));
if (opt('id')) specs = specs.filter((s) => s.id === opt('id'));
const DT = 1 / 30, bad = [], quiet = [], locked = [];
const t0 = Date.now();
for (const s of specs) {
  setSeed(11);
  try {
    const S = PS.makeStage(s);
    const n = Math.ceil(S.loop / DT) + 2; // one whole loop and into the next (the reset runs too)
    for (let i = 0; i < n; i++) S.step(DT);
    if (S.locked) locked.push(PS.specKey(s) + (S.why ? ' (' + S.why + ')' : ''));
    else if (!S.fired()) quiet.push(PS.specKey(s));
    if (args.includes('--v')) console.log(PS.specKey(s), S.locked ? 'locked' : S.fired() ? 'ok' : 'NEVER FIRED');
  } catch (e) { bad.push(PS.specKey(s) + '  ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); }
}
console.log(`${specs.length} previews, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(`threw: ${bad.length}`); for (const b of bad) console.log('  ' + b);
console.log(`never fired: ${quiet.length}`); for (const q of quiet) console.log('  ' + q);
console.log(`locked (shown as locked): ${locked.filter((l) => !l.includes(':hero:') && !/^hero:/.test(l)).length} not counting heroes' tier 0`);
for (const l of locked) if (!/^hero:/.test(l)) console.log('  ' + l);
process.exitCode = bad.length ? 1 : 0;
