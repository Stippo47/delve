// Round 18 (lane dash18): writes section 4 of docs/dash18.md (the numbers) from the two tables this lane measured:
// tools/dash18/heroes-compare.txt (tools/dash18/compare.mjs) and tools/dash18/foes-compare.txt (tools/dash18/foes-cmp.sh).
//   node tools/dash18/doc-numbers.mjs
import fs from 'node:fs';
const doc = 'docs/dash18.md'; let s = fs.readFileSync(doc, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
const heroes = fs.readFileSync('tools/dash18/heroes-compare.txt', 'utf8').replace(/\r\n/g, '\n').trimEnd();
const foes = fs.readFileSync('tools/dash18/foes-compare.txt', 'utf8').replace(/\r\n/g, '\n').trimEnd();
const sec = `## 4. Before and after

Checks on the merged tree: \`node --check\` on every js file; \`node tools/battles.mjs\`: 528 battles, 0 problems;
\`node tools/preview-check.mjs\`: threw 0, never fired 0, not offered 0 (tools/dash18/preview.log);
\`node tools/dash18/smoke.mjs\` (each of the six run to its end by a hero and by an enemy);
\`node tools/dash18/threat-check.mjs\` (threat.js sees each of the six before it lands).

### Heroes (tools/ability-worth.mjs, 12 parties a hero, tiers I and III, the same parties and seeds before and after)

Both sides measured on this lane's tree before the merge with main, so nothing else differs. "ability dmg/s" is what
the move itself dealt per second of the run; "share of dmg" its part of everything the hero
dealt. One run of a party differs from the next for good once anything changes, so a single row is good to about
plus or minus 10% (three measures of Iaido I on nearly the same code came out +3%, +11% and +19%). Read the share
column first.

\`\`\`
${heroes}
\`\`\`

Changed after this table was measured, each a small step towards the old number: Shadow Walk's cut 1.0x to 0.9x (III
1.15x to 1.0x); Iaido's cut 0.85 to 0.78 of the old.

Outside a tenth on purpose, or not settled:
- **Iaido III** is worth about a quarter more than it was. The old cut back hit nothing (the first cut had thrown them
  off its line), so the old III dealt what II dealt; the new cut back lands, at 0.3 of the first cut's weight.
- **Spear of the Sky** deals four times what it did, which is still 2% of what the Valkyrie deals: the old line seldom
  struck anything, the spear's point now strikes what it passes (at 1.0x, down from 1.5x).
- **Twinfang's Dash** deals a little where it dealt nothing (4% of her damage): a nick as she passes.
- **Bayonet** (4-6% of the Marksman's damage) and the tier III rows of Bear Claws, Thunder Blow and Sacrifice moved more
  than a tenth in this table with their shares unchanged: the runs differ, the moves are the same weight.

### Enemies (tools/audit/foes16/worth.mjs, worth per cost point against the Bandit, 24 seeds a kind)

Before is the tree this lane started from. After is each kind's last measure: the wolves, the jackal, the bats, the
devil, the angel, the plague rat and the sproutling on the tree merged with main, the rest just before that merge.

\`\`\`
${foes}
\`\`\`

Not measured (the tool fields kinds at rank 0, without their elite or major moves): the elite lizard blade's cut
through the party, the elite brute's bash, the elite spiders' and slimelet's pounces, the crab's snap, every major's
Charge, the dark Herald's and the Archon's charges. They carry the numbers they had; the majors', the Herald's and the
Archon's charges now pick up the first hero they meet (if it is light enough) and throw it, which is harder on that
one hero than the old bump. The Chieftain's and the Cinder Drake's charges are untouched.
`;
const i = s.indexOf('\n## 4. Before and after'); if (i >= 0) s = s.slice(0, i);
s = s.trimEnd() + '\n\n' + sec; fs.writeFileSync(doc, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('section 4 written');
