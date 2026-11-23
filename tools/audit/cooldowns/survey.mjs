// What each ability leaves behind, by component: how often (share of casts), how long (median), how often still up when
// the fight ended. node tools/audit/cooldowns/survey.mjs raw1.json [raw2.json...] [--min 0.8]
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2), files = args.filter((a) => a.endsWith('.json')), min = args.includes('--min') ? +args[args.indexOf('--min') + 1] : 0.8;
const med = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const by = {};
for (const f of files) for (const F of JSON.parse(readFileSync(f, 'utf8')).fights) for (const c of F.casts) {
  const A = by[F.hero + '.' + c.ab] || (by[F.hero + '.' + c.ab] = { n: 0, comps: {} }); A.n++;
  for (const k of c.comps) { const C = A.comps[k.key] || (A.comps[k.key] = { cls: k.cls, n: 0, d: [], open: 0 }); C.n++; if (k.end == null) C.open++; else C.d.push(k.end - c.t); }
}
for (const [id, A] of Object.entries(by)) {
  const L = Object.entries(A.comps).filter(([, C]) => (med(C.d) ?? 99) >= min || C.open / C.n > 0.5).map(([k, C]) => `${k}[${C.cls}] ${(100 * C.n / A.n).toFixed(0)}% ${med(C.d)?.toFixed(1) ?? '-'}s open${(100 * C.open / C.n).toFixed(0)}%`);
  if (L.length) console.log(id.padEnd(32), String(A.n).padStart(5), ' ', L.join(' | '));
}
