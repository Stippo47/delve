// The audit of the monsters' pages and the statuses (lane preview18b): every foe move at every rank the Book offers,
// and every status, two loops each, by tools/preview-measure.mjs measureStage.
//   node tools/preview18b/foe-audit.mjs [--out file.json] [--only foe|status] [--id kind] [--v]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const PS = await import('../../js/preview-sim.js');
const M = await import('../preview-measure.mjs');
const fs = await import('node:fs');
const kinds = PS.foeGroups().flatMap((g) => g.kinds);
let specs = PS.allSpecs(kinds).filter((s) => s.t === 'foe' || s.t === 'status');
if (opt('only')) specs = specs.filter((s) => s.t === opt('only'));
if (opt('id')) specs = specs.filter((s) => s.id === opt('id'));
if (opt('move')) specs = specs.filter((s) => s.move === opt('move'));
const out = {}; const t0 = Date.now();
for (const s of specs) { try { out[PS.specKey(s)] = M.measureStage(s); } catch (e) { out[PS.specKey(s)] = [{ threw: String(e && e.stack || e).split('\n').slice(0, 3).join(' | ') }]; } }
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify(out, null, 0));
export const summarize = (out) => {
  const C = { n: 0, threw: 0, locked: 0, never: 0, late: 0, straw: 0, unseen: 0, unseenBlows: 0, noReach: 0, crutch: 0, stNothing: 0, firstSum: 0, firstN: 0, fires: 0, loops: 0 };
  const L = { threw: [], locked: [], never: [], late: [], unseen: [], noReach: [], crutch: [], stNothing: [] };
  for (const [k, R] of Object.entries(out)) {
    C.n++;
    if (R[0].threw) { C.threw++; L.threw.push(k + ' ' + R[0].threw); continue; }
    if (R[0].locked) { C.locked++; L.locked.push(k); continue; }
    for (const r of R) { C.loops++; C.fires += r.fires; if (r.first != null) { C.firstSum += r.first; C.firstN++; } }
    if (R.some((r) => !r.fired)) { C.never++; L.never.push(k); }
    if (R.some((r) => r.first == null || r.first > 2.5)) { C.late++; L.late.push(k + ' (' + R.map((r) => (r.first == null ? '-' : r.first.toFixed(1))).join(' ') + ')'); }
    if (R.some((r) => r.straw > 0)) C.straw++;
    const u = R.reduce((a, r) => a + r.unseen, 0); if (u) { C.unseen++; C.unseenBlows += u; L.unseen.push(k + ' ' + u + ' (' + R.flatMap((r) => r.unseenWhy).slice(0, 2).join(', ') + ')'); }
    if (R.some((r) => r.fired && !r.reached)) { C.noReach++; L.noReach.push(k); }
    if (R.some((r) => r.crutch)) { C.crutch++; L.crutch.push(k); }
    if (k.startsWith('status:') && R.some((r) => r.stFrom !== 'seen')) { C.stNothing++; L.stNothing.push(k + ' (' + R.map((r) => r.stFrom).join(' ') + ')'); }
  }
  return { C, L };
};
const { C, L } = summarize(out);
console.log(`${C.n} previews (${((Date.now() - t0) / 1000).toFixed(0)} s): threw ${C.threw}, locked ${C.locked}`);
console.log(`first go ${(C.firstSum / Math.max(1, C.firstN)).toFixed(2)} s on average; ${(C.fires / Math.max(1, C.loops)).toFixed(2)} goes a loop`);
console.log(`a loop where it never went: ${C.never}`);
console.log(`a loop where it didn't go within 2.5 s: ${C.late}`);
console.log(`straw targets on the stage: ${C.straw}`);
console.log(`blows or health lost with nothing seen behind them: ${C.unseen} previews (${C.unseenBlows} blows)`);
console.log(`went off but reached no one in 3.5 s, or a status that never came to its burst or state (wrong scenario): ${C.noReach}`);
console.log(`the stage had to help it (a target stepped up, its health set lower): ${C.crutch}`);
console.log(`statuses put on from nothing seen: ${C.stNothing}`);
if (args.includes('--v')) for (const [n, l] of Object.entries(L)) { console.log('## ' + n + ' ' + l.length); for (const x of l) console.log('  ' + x); }
