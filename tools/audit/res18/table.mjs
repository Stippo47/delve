// Round 18, lane res18: the full per-kind table in docs/audit/res18.md (between the TABLE markers), from kinds.json
// (what lands today, dump.mjs) and proposal.mjs (the base proposal; calls marked apart).
//   node tools/audit/res18/table.mjs
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { DEFS } = await imp('js/units.js');
const P = await imp('tools/audit/res18/proposal.mjs');
const kinds = JSON.parse(readFileSync(resolve(ROOT, 'tools/audit/res18/kinds.json'), 'utf8'));
const ALLCALLS = Object.keys(P.CALLS).concat(Object.keys(P.RAISE), ['bossPoison']);
const AB = { burn: 'Burn', chill: 'Chill', poison: 'Poison', wet: 'Wet', shock: 'Shock', stagger: 'Stagger', radiance: 'Radiance', curse: 'Curse',
  entangle: 'Entangle', charm: 'Charm', confuse: 'Confuse', sleepy: 'Sleepy', bleed: 'Bleed', fear: 'Fear', shackle: 'Shackle' };
// code-side rules a player can't see on the kind (beyond def.res)
const CODE = {
  rattlerGold: 'gilded buff: no status at all', scarabGold: 'gilded buff: no status at all',
  elderEnt: 'every frame: stun, root, sleep, KO and freeze wiped (STEADY)', sunBlade: 'stuns, KO, freeze, sleep, roots wiped while it sweeps (bladeLock)',
  rat: 'elite: poison-proof while it trails gas', sandSerpent: 'its 6 coils each pass 60% to the head', chainCrawler: 'its 8 plates each pass 60% to the head',
  spiritPoison: 'its ray makes the friend poison-proof', spiritFire: 'its ray makes the friend fireproof', spiritFrost: 'its ray makes the friend chill-proof', spiritShock: 'its ray makes the friend shock-proof',
  sawBlade: 'a trap: never takes anything (ethereal)', dustDevil: 'a summon of the Sand Mage',
};
const where = (r) => { const w = r.where.map((x) => x.replace(/:.*/, '')); const d = [...new Set(w.map((x) => x.replace(/\d$/, '')))]; return d.join(' ') || (r.flags.includes('part') ? 'part' : 'summon'); };
const fmt = (m) => Object.entries(m).filter(([, v]) => v !== 1).map(([s, v]) => `${AB[s]} ${v === 0 ? '0' : v}`).join(', ');
const lines = ['| kind | what it is | where | today (effect axis: x of the build-up; 0 = immune) | from | proposed change (base) | with the calls |', '|---|---|---|---|---|---|---|'];
for (const r of kinds) {
  const d = DEFS[r.kind];
  const t = r.takes.plain && Object.keys(r.takes.plain).length ? r.takes.plain : Object.fromEntries(P.STATUSES.map((s) => [s, d.res && d.res[s] != null ? d.res[s] : 1]));
  const dataOnly = Object.fromEntries(P.STATUSES.map((s) => [s, d.res && d.res[s] != null ? d.res[s] : 1]));
  const codeDiff = P.STATUSES.filter((s) => Math.abs((t[s] ?? 1) - dataOnly[s]) > 0.01);
  const from = [d.res && Object.keys(d.res).length ? 'data' : '', codeDiff.length ? 'code: ' + codeDiff.map((s) => AB[s]).join(' ') + (d.boss || r.flags.includes('mini') ? ' (charmProof)' : '') : '', CODE[r.kind] ? 'code: ' + CODE[r.kind] : ''].filter(Boolean).join('; ');
  const base = P.proposedRes(r.kind, d, { calls: [] }), all = P.proposedRes(r.kind, d, { calls: ALLCALLS });
  const ch = P.STATUSES.filter((s) => Math.abs((t[s] ?? 1) - base.res[s]) > 1e-6).map((s) => `${AB[s]} ${t[s] ?? 1}->${base.res[s]}`).join(', ');
  const cc = P.STATUSES.filter((s) => Math.abs(base.res[s] - all.res[s]) > 1e-6).map((s) => `${AB[s]} ${base.res[s]}->${all.res[s]} (${all.from[s].replace(/^call: /, '').replace(/:.*/, '')})`).join(', ');
  const what = (r.habit || '').split(/(?<=\.)\s/)[0].slice(0, 90).replace(/\|/g, '/');
  lines.push(`| ${r.kind} | ${r.name}${what ? ': ' + what : ''} | ${where(r)} | ${fmt(t) || 'nothing'} | ${from || '-'} | ${ch || '-'} | ${cc || '-'} |`);
}
const doc = resolve(ROOT, 'docs/audit/res18.md');
const src = readFileSync(doc, 'utf8');
const A = '<!-- TABLE:start (tools/audit/res18/table.mjs) -->', Z = '<!-- TABLE:end -->';
writeFileSync(doc, src.slice(0, src.indexOf(A) + A.length) + '\n' + lines.join('\n') + '\n' + src.slice(src.indexOf(Z)));
console.log(lines.length - 2, 'rows');
