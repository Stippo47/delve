// Writes docs/HEROES.md from js/heroes2.js: one short block per new hero (role, price, attack, abilities with tiers,
// trait). Run after changing a kit:  node tools/heroes-doc.mjs
import fs from 'node:fs';
import { HEROES2 } from '../js/heroes2.js';

const GOLD = 350; // progress.js HERO_GOLD
const out = ['# Delve: the new heroes (round 10, lane H)', '',
  'Every picked hero that was not yet playable, with its kit. Data: `js/heroes2.js`; the kits: `js/kits2.js`; the looks: `js/fx2.js`.',
  'Each has 1 attack, 3 abilities with 3 tiers, and 1 trait that works on its own. Written by `tools/heroes-doc.mjs`.', ''];
for (const [id, h] of Object.entries(HEROES2)) {
  out.push(`## ${h.name} (\`${id}\`, ${h.role}, ${((h.unlock && h.unlock.gems) || 0) * GOLD} gold)`);
  out.push(`${h.blurb} Art: \`${h.art}\`${h.form ? `, and \`${h.form.art}\` (${h.form.name})` : ''}.`, '');
  out.push(`- **Attack: ${h.attack.name}.** ${h.attack.desc}`);
  for (const ab of h.abilities) out.push(`- **${ab.name}** (${ab.cd}s). ${ab.desc} I: ${ab.tiers[0]} II: ${ab.tiers[1]} III: ${ab.tiers[2]}`);
  out.push(`- **Trait: ${h.trait.name}.** ${h.trait.desc}`, '');
}
fs.writeFileSync(new URL('../docs/HEROES.md', import.meta.url), out.join('\n'));
console.log('docs/HEROES.md:', Object.keys(HEROES2).length, 'heroes');
