// Takes the outlines out of the art files (round 19, lane outline19: "Outlines shouldn't if possible be built into the
// sprites"). The game draws the one outline itself now (parts.js for figures, sprites.js getProp for props, uiArt for the
// pictures in pages), at one thickness whatever the size, so a file must carry none of its own:
//   - filter="url(#outline)" on #sprite: taken off;
//   - filter="url(#outline)" on any other element (rock-3's three rocks, each outlined on its own): becomes
//     data-ink="own", so the renderer outlines that piece by itself (sprites.js);
//   - the <filter id="outline"> definition: taken out;
//   - data-line on #sprite (art round 11: a thinner line asked for by an art drawn big): taken off (lineFor does it now).
// Interior lines (seams, folds, eyes, door planks) are drawing, not outline, and stay. Mechanical and idempotent: run it
// again after merging other lanes' SVG edits.
//   node tools/outline19/strip-outlines.mjs [--dry] [dir=art]
import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2), dry = args.includes('--dry'), root = path.resolve(args.find((a) => !a.startsWith('--')) || 'art');
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.svg')) files.push(p); } })(root);
let changed = 0; const tally = { spriteFilter: 0, ownPiece: 0, filterDef: 0, dataLine: 0 };
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8'); let s = t;
  // #sprite: no filter, no data-line
  s = s.replace(/<g\b[^>]*\bid="sprite"[^>]*>/g, (tag) => {
    let o = tag;
    if (/\sfilter="url\(#outline\)"/.test(o)) { o = o.replace(/\sfilter="url\(#outline\)"/, ''); tally.spriteFilter++; }
    if (/\sdata-line="[^"]*"/.test(o)) { o = o.replace(/\sdata-line="[^"]*"/, ''); tally.dataLine++; }
    return o;
  });
  // anything else outlined on its own
  s = s.replace(/(<[a-zA-Z]+\b[^>]*?)\sfilter="url\(#outline\)"/g, (m, a) => { tally.ownPiece++; return a + ' data-ink="own"'; });
  // the filter's definition
  s = s.replace(/[ \t]*<filter\b[^>]*\bid="outline"[\s\S]*?<\/filter>[ \t]*\r?\n?/g, () => { tally.filterDef++; return ''; });
  if (s !== t) { changed++; if (!dry) fs.writeFileSync(f, s); }
}
// what is left that could still read as a built-in outline: an ink-coloured stroke (reported, not touched)
const left = files.filter((f) => /stroke="#(2B2230|2b2230)"/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(process.cwd(), f));
console.log(`${files.length} files, ${changed} ${dry ? 'would change' : 'changed'}:`, tally);
if (left.length) console.log('ink-coloured strokes left (interior lines; check by eye):', left.join(', '));
