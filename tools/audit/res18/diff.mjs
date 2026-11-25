// Round 18, lane res18: today's resistances (as measured: tools/audit/res18/kinds.json, from dump.mjs) against the
// proposal (proposal.mjs), per kind and per dungeon's spawn budget. MEASURES ONLY.
//   node tools/audit/res18/diff.mjs [--calls bossPoison,holy]  -> tools/audit/res18/diff.json, diff.csv, budget.json
// budget: per dungeon (its three floors' fight rooms, each floor weighted the same; a kind's share is its roster weight
// x cost x pack size, as dungeon.js rollKinds spends a room's budget), the share of the spawn budget that takes none of
// each status (immune), takes half or less (resists), and takes more (weak).
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { DEFS } = await imp('js/units.js');
const P = await imp('tools/audit/res18/proposal.mjs');
const OUT = resolve(ROOT, 'tools/audit/res18');
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : null; };
const calls = (arg('calls') || '').split(',').filter(Boolean);
const kinds = JSON.parse(readFileSync(resolve(OUT, 'kinds.json'), 'utf8'));
const shares = JSON.parse(readFileSync(resolve(OUT, 'shares.json'), 'utf8'));
const S = P.STATUSES;

const now = {}, prop = {}, rows = [];
for (const r of kinds) {
  const d = DEFS[r.kind];
  const t = r.takes.plain && Object.keys(r.takes.plain).length ? r.takes.plain : null;
  now[r.kind] = {}; for (const s of S) now[r.kind][s] = t ? t[s] : (d.res && d.res[s] != null ? d.res[s] : 1);
  const p = P.proposedRes(r.kind, d, { calls });
  prop[r.kind] = p.res;
  const ch = S.filter((s) => Math.abs((now[r.kind][s] ?? 1) - p.res[s]) > 1e-6).map((s) => ({ s, was: now[r.kind][s], is: p.res[s], by: p.from[s] }));
  rows.push({ kind: r.kind, name: r.name, where: r.where, tags: p.tags, changes: ch });
}
const budget = {};
for (const [dg, D] of Object.entries(shares)) {
  const b = { now: {}, prop: {} };
  for (const which of ['now', 'prop']) {
    const T = which === 'now' ? now : prop;
    for (const s of S) {
      let imm = 0, low = 0, weak = 0;
      for (const f of D.floors) for (const [k, sh] of Object.entries(f)) { const v = T[k] ? T[k][s] : 1; if (v === 0) imm += sh; else if (v <= 0.5) low += sh; else if (v > 1) weak += sh; }
      const n = D.floors.length;
      b[which][s] = { immune: Math.round(imm / n * 100), resists: Math.round(low / n * 100), weak: Math.round(weak / n * 100) };
    }
  }
  budget[dg] = b;
}
const tag = calls.length ? '-' + calls.join('-') : '';
writeFileSync(resolve(OUT, `diff${tag}.json`), JSON.stringify(rows, null, 1));
writeFileSync(resolve(OUT, `budget${tag}.json`), JSON.stringify(budget, null, 1));
const q = (x) => `"${String(x).replace(/"/g, '""')}"`;
const csv = ['kind,name,tags,status,was,proposed,because'];
for (const r of rows) for (const c of r.changes) csv.push([r.kind, q(r.name), q(r.tags.join(' ')), c.s, c.was, c.is, q(c.by)].join(','));
writeFileSync(resolve(OUT, `diff${tag}.csv`), csv.join('\n'));
const changed = rows.filter((r) => r.changes.length);
console.log(`${rows.length} kinds, ${changed.length} change, ${changed.reduce((a, r) => a + r.changes.length, 0)} numbers`);
console.log('\nimmune share of each dungeon\'s spawn budget, now -> proposed (%):');
console.log('status   ' + Object.keys(budget).map((d) => d.padEnd(9)).join(''));
for (const s of S) console.log(s.padEnd(9) + Object.keys(budget).map((d) => `${budget[d].now[s].immune}->${budget[d].prop[s].immune}`.padEnd(9)).join(''));
