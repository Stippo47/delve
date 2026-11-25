// Round 17, lane foes16: writes js/prices.js, the price list of every enemy kind.
//   node tools/audit/foes16/price.mjs --init                       the list as the game had it (each kind's cost and pack, hp x1, hit x1)
//   node tools/audit/foes16/price.mjs --from worth.json [--damp 1]  moves each kind's hp and hit towards worth 1.00 per cost point
// A kind's strength per cost point goes (to first order) as its health x its damage (Lanchester's square law), so a
// kind measured at worth W gets health and hit x (1/W)^(damp/2) each, or split by SPLIT below; inside BAND it is left alone.
// Costs and packs are kept as the file has them (they are set by hand there).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, DEFS, ROSTER, opt, flag } from './lib.mjs';

const FILE = resolve(ROOT, 'js/prices.js');
// the share of a kind's change that goes on its health (the rest on its hit); 0.5 by default
const SPLIT = {
  slime: 0.15, slimeBig: 0.3, slimeSmall: 0.3, slimeSludge: 0.3, slimeIce: 0.3, fireSlime: 0.3, slimePoison: 0.3, // the designer: slimes have too much health
  wolf: 0.3, // the designer: the wolf maybe too little damage
};
const MIN_HELPER = 1; // (below this a helper would come by the handful; what's left is for its moves, not its price)
const BAND = [+(opt('band') || '0.9,1.1').split(',')[0], +(opt('band') || '0.9,1.1').split(',')[1]], LO = 0.3, HI = 3.2, SKIP = new Set(['sawBlade']); // (a trap: battle mode can't measure it)
const r2 = (x) => Math.round(x * 100) / 100;

let cur = {};
if (!flag('init')) cur = (await import(pathToFileURL(FILE).href + '?' + Date.now())).PRICES;
const worth = opt('from') ? Object.fromEntries(JSON.parse(readFileSync(opt('from'), 'utf8')).rows.map((r) => [r.k, r])) : {};
const damp = +opt('damp', 1);
const NAME = { wildwood: 'the Wildwood', warren: 'the Warren', sewers: 'the Sewers', crypt: 'the Crypt', frost: 'the Frost Hollow', ember: 'the Ember Deep',
  spire: 'the Gilded Spire', dunes: 'the Sunken Dunes', foundry: 'the Clockwork Foundry' };
const OLD_COST = { rat: 1, slime: 2, slimeSmall: 1, skeleton: 3 }, OLD_PACK = { rat: [2, 4] };
const lines = [];
let moved = 0;
for (const d of ROSTER.dungeons) {
  lines.push(`  // ${NAME[d.id] || d.id}`);
  for (const k of d.kinds) {
    const p = cur[k] ? { ...cur[k] } : { cost: DEFS[k].cost ?? OLD_COST[k] ?? 3, pack: DEFS[k].pack || OLD_PACK[k] || null, hp: 1, hit: 1 };
    // (a cost set by hand since the measure: worth per point goes as 1 / cost^2 at the same health and hit; a helper's,
    // what it adds to a group, as 1 / cost)
    const row = worth[k], W = row && row.worth * (row.cost / p.cost) ** (row.helper ? 1 : 2);
    if (W && row.helper && (W < BAND[0] || W > BAND[1])) { // a helper: its health and hit hardly matter (it does no harm itself), so its price moves
      p.cost = Math.max(MIN_HELPER, Math.round(p.cost * Math.pow(W, damp) * 10) / 10); moved++;
    } else if (W && !SKIP.has(k) && (W < BAND[0] || W > BAND[1])) {
      const F = Math.pow(1 / W, damp), s = SPLIT[k] ?? 0.5;
      p.hp = r2(Math.min(HI, Math.max(LO, p.hp * Math.pow(F, s))));
      p.hit = r2(Math.min(HI, Math.max(LO, p.hit * Math.pow(F, 1 - s))));
      moved++;
    }
    lines.push(`  ${k}: { cost: ${p.cost}, ${p.pack ? `pack: [${p.pack.join(', ')}], ` : ''}hp: ${p.hp}, hit: ${p.hit} },`);
  }
}
const head = readFileSync(FILE, 'utf8').split('export const PRICES = {')[0];
writeFileSync(FILE, head + 'export const PRICES = {\n' + lines.join('\n') + '\n};\n');
console.log('wrote js/prices.js,', moved, 'kinds moved');
