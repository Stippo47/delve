// Round 16 fixes: Cure I against Cure III in audit-worth's group fight (tools/audit/worth: the Plague Doctor with a
// Tower friend vs six undead, all major), the other two abilities at III. The worth audit found III doing worse.
//   node tools/audit/fixes16/cure-tiers.mjs [--seeds 30]
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const { battleFight } = await import('../worth/lib.mjs');
const n = +opt('seeds', 30);
for (const t of [1, 3]) {
  let win = 0, m = 0, casts = 0;
  for (let i = 0; i < n; i++) { const r = battleFight('plague', 'group', { miasma: 3, cure: t, leeches: 3 }, 9000 + i); win += r.win; m += r.margin; casts += (r.casts && r.casts.cure) || 0; }
  console.log(`Cure ${t === 1 ? 'I' : 'III'}: group fight won ${Math.round(100 * win / n)}%, health margin ${Math.round(100 * m / n)}, Cure casts a fight ${(casts / n).toFixed(1)} (${n} seeds)`);
}
