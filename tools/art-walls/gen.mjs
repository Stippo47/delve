// Round 19 art lane (walls): writes every wall option's tiling pieces into design/r19-art/walls/<theme>-<option>/.
//   node tools/art-walls/gen.mjs            (from the worktree root)
// Each option: run-a.svg and run-b.svg (a 160-long straight wall; b carries the option's feature), bay.svg (the 160
// stretch a door sits in: the door's art goes on top, centred at u 80 on the foot), corner-out.svg (the room's corner,
// the floor's corner at the piece's bottom left), corner-in.svg (a rock corner jutting into the floor, at the bottom
// left). index.json lists the options with their sizes for the renderer.
import fs from 'node:fs';
import path from 'node:path';
import { P, Svg, f1, wash, poly } from './lib.mjs';
import { OPTIONS } from './options.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const OUT = path.join(ROOT, 'design', 'r19-art', 'walls');

// The wall along [u0, u1] in its own frame: face, its feature, the face's light, cap, the cap's light, then what hangs over.
function wall(s, o, u0, u1, feature, bay) {
  const { F, H } = o;
  o.face(s, u0, u1);
  if (feature && o.feature) o.feature(s, 80);
  if (o.finish !== false) {
    wash(s, u0 - 2, -F * 0.42, u1 - u0 + 4, 0, '#1A1020', 0, o.ao ?? 0.3); // darker at the foot
    wash(s, u0 - 2, -F, u1 - u0 + 4, -F + 7, '#1A1020', o.under ?? 0.28, 0); // under the cap's lip
  }
  o.cap(s, u0, u1);
  if (o.finish !== false) {
    s.add(`<rect x="${f1(u0 - 2)}" y="${f1(-F - 2.2)}" width="${f1(u1 - u0 + 4)}" height="2.2" fill="#FFFFFF" opacity="${o.lip ?? 0.3}"/>`); // the cap's inner edge catches the light
    wash(s, u0 - 2, -H, u1 - u0 + 4, -H + 6, '#1A1020', o.rim ?? 0.22, 0); // and falls away at its outer edge
  }
  if (o.over) o.over(s, u0, u1);
  if (feature && o.featureOver) o.featureOver(s, 80);
}

const NOTE = (o, piece, extra) => `${o.theme} walls, option ${o.letter} (${o.name}): ${piece}. Round 19 art lane (walls). 1 SVG unit = 1 room unit. `
  + `The wall's own frame: x runs along the wall, y = 0 is the foot (where the wall meets the floor; the room is below, +y), y < 0 rises up the wall away from the room. `
  + `Face (the wall's inner side, folded flat like the doors' arch): y ${-o.F}..0. Cap (the top, seen from above): y ${-o.H}..${-o.F}. The whole wall is ${o.H} deep; the doors' arch reaches y -57, so the wall rises ${o.H - 57} past it. `
  + `Everything repeats every ${P} along x, so runs tile end to end. No outline in the file: the renderer draws the one ink outline round the wall's mass. Rotate the piece so +y points into the room. ${extra}`;

function pieces(o) {
  const { H } = o, out = {};
  for (const [name, feature, bay] of [['run-a', false, false], ['run-b', true, false], ['bay', false, true]]) {
    const s = new Svg(); const c = s.clip(`M0 ${-H}H${P}V0H0Z`);
    s.open(`clip-path="${c}"`); if (bay) { o.bay(s); if (o.bayOver) o.bayOver(s); } else wall(s, o, 0, P, feature, false); s.close();
    out[name] = s.svg([0, -H, P, H], NOTE(o, name === 'bay' ? 'the stretch a door sits in' : name === 'run-b' ? 'a straight run with its feature' : 'a straight run',
      name === 'bay' ? 'An overlay: drawn over the run (which carries on under it) wherever a door stands, then the door (art/props/door-*.svg, box 141.4) on top, its doorway centred on (80, 0).' : name === 'run-b' ? 'Mix it in now and then among run-a.' : 'Tile it.'));
  }
  // corners: a square H x H at the corner, split on the diagonal (a mitre). The wall along the top keeps its frame; the
  // wall down the side is the same wall turned a quarter (its u runs down the screen, its v out to the right).
  for (const [name, inner] of [['corner-out', false], ['corner-in', true]]) {
    const s = new Svg();
    const triTop = inner ? `M0 0L${H} 0L${H} ${-H}Z` : `M0 0L0 ${-H}L${H} ${-H}Z`, triSide = inner ? `M0 0L${H} ${-H}L0 ${-H}Z` : `M0 0L${H} ${-H}L${H} 0Z`;
    s.open(`clip-path="${s.clip(triTop)}"`); wall(s, o, 0, H, false, false); s.close();
    s.open(`clip-path="${s.clip(triSide)}"`); s.open('transform="matrix(0 1 -1 0 0 0)"'); wall(s, o, -H, 0, false, false); s.close(); s.close();
    if (!inner && o.post) o.post(s);
    if (inner && o.postIn) o.postIn(s);
    out[name] = s.svg([0, -H, H, H], NOTE(o, inner ? 'the inside corner (a rock corner jutting into the floor)' : "the room's corner",
      inner ? 'Placed with its (0,0) on the rock corner, the rock up and right of it; the wall along the top (foot y = 0, x > 0) and the wall up the left side (foot x = 0, y < 0) meet on the diagonal.'
        : "Placed with its (0,0) on the floor's corner, the floor down and left of it; the wall along the top ends here and the wall down the right side begins, meeting on the diagonal."));
  }
  return out;
}

const index = [];
const only = process.argv[2] ? process.argv[2].split(',') : null;
for (const o of OPTIONS) {
  index.push({ id: o.id, theme: o.theme, letter: o.letter, name: o.name, blurb: o.blurb, H: o.H, F: o.F, mass: o.mass, floorShade: o.floorShade || null });
  if (only && !only.includes(o.id) && !only.includes(o.theme)) continue;
  const dir = path.join(OUT, o.id); fs.mkdirSync(dir, { recursive: true });
  const ps = pieces(o);
  for (const [n, text] of Object.entries(ps)) fs.writeFileSync(path.join(dir, n + '.svg'), text);
  console.log('wrote', o.id, Object.keys(ps).join(' '));
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1) + '\n');
