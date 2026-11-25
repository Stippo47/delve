import fs from 'node:fs';
const f = 'js/render.js'; let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error('bad ' + a.slice(0, 80)); s = s.slice(0, i) + b + s.slice(i + a.length); };
rep(`  for (const p of w.pickups) drawPickup(ctx, p, w.time);
  // shadows straight down under each obstacle (top-down: never cast to one side)
  for (const p of w.pillars) { if (p.painted) continue; const R = p.r * 1.45; ctx.drawImage(softShadow(), p.x - R, p.y - R, R * 2, R * 2); } // (lane W: p.painted = already in the ground's picture, convoy.js)
  for (const p of w.pillars) if (!p.painted) drawPillar(ctx, p, w);
  // crates on the grid (layout.js): square obstacles, colliding as the wall rectangle they are (48 across at sc 1)
  for (const r of w.walls) if (r.prop) { const R = r.w * 0.8, x = r.x + r.w / 2, y = r.y + r.h / 2; ctx.drawImage(softShadow(), x - R, y - R, R * 2, R * 2); prop(ctx, r.prop, x, y, PROP_BOX, { sc: r.w / 48 }); }
  // a round shadow straight under every unit (top-down: no side cast), all of them merged; a leaping unit's shrinks
  // as it rises
  drawShadows(ctx, w, tf);
`, `  // one shadow system (round 19, lane sys19: "MAKE SURE YOU USE 1 SHADOW SYSTEM FOR EVERYTHING"): a round shadow
  // straight under every unit, obstacle, crate, chest, lobbed thing and code-drawn thing in the air (top-down: no side
  // cast), all of them merged into one layer; a thing up in the air leaves its shadow on the floor under it, smaller and
  // fainter the higher it is. Laid before the obstacles and pickups, so a shadow passes under a pillar, not over it.
  drawShadows(ctx, w, tf);
  for (const p of w.pickups) drawPickup(ctx, p, w.time);
  for (const p of w.pillars) if (!p.painted) drawPillar(ctx, p, w); // (lane W: p.painted = already in the ground's picture, convoy.js)
  // crates on the grid (layout.js): square obstacles, colliding as the wall rectangle they are (48 across at sc 1)
  for (const r of w.walls) if (r.prop) { const x = r.x + r.w / 2, y = r.y + r.h / 2; prop(ctx, r.prop, x, y, PROP_BOX, { sc: r.w / 48 }); }
`);
// drawShadows: everything
rep(`  // (round 13, lane E: def.shadows, a body that isn't round; lane B, bosses3: u.shadowK sizes a code-drawn boss's shadow (0: none: a wurm under the sand))
  for (const u of w.units) if ((!u.ethereal || u.hiddenIn) && u.shadowK !== 0) { if (u.def.shadows) { for (const [x, y, r] of u.def.shadows(u)) disc(x, y, r * 1.75, 1); } else disc(u.x, u.y, shadowSize(u) * (u.shadowK ?? 1), 1); }
  // a body in the air leaves its shadow on the floor
  for (const cp of w.corpses) if (cp.z > 2) disc(cp.x, cp.y, cp.vr * 1.3, clamp(cp.t / 4, 0, 1) * 0.8);
`, `  // (round 13, lane E: def.shadows, a body that isn't round; lane B, bosses3: u.shadowK sizes a code-drawn boss's shadow (0: none: a wurm under the sand))
  for (const u of w.units) if ((!u.ethereal || u.hiddenIn) && u.shadowK !== 0 && !u.hidden) {
    if (u.def.shadows) { for (const [x, y, r] of u.def.shadows(u)) disc(x, y, r * 1.75, 1); continue; }
    const ft = footOf(u); // a thing that stands (the totem): its shadow at its foot, the size of its foot
    if (ft) disc(u.x + ft.x, u.y + ft.y, ft.r, 1); else disc(u.x, u.y, shadowSize(u) * (u.shadowK ?? 1), 1);
  }
  // a body in the air leaves its shadow on the floor
  for (const cp of w.corpses) if (cp.z > 2) disc(cp.x, cp.y, cp.vr * 1.3, clamp(cp.t / 4, 0, 1) * 0.8);
  // round 19 (lane sys19): the rest of the room's shadows, in the same layer. Obstacles and crates (they had a softer
  // shadow of their own), the chest and the pedestal; a lobbed thing (kits2.js lob: bread, flasks, bombs, a totem or a
  // hive on its way) on the floor under it, shrinking and fading as it rises (height.js projZ; it drew two of its own);
  // and whatever an effect cast this frame (height.js castShadow: a cannonball falling, a hurled rock, a javelin from the
  // sky, a hammer circling).
  for (const p of w.pillars) if (!p.painted) disc(p.x, p.y, p.r * 1.45, 1);
  for (const r of w.walls) if (r.prop) disc(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.8, 1);
  for (const p of w.pickups) if (p.type === 'chest') disc(p.x, p.y, 34, p.drop > 0 ? 1 - p.drop / 0.45 : 1); else if (p.type === 'pedestal') disc(p.x, p.y, 26, 1);
  for (const p of w.projectiles) if (p.life > 0 && (p.lob || p.noHit)) { const h = projZ(p); if (h > 0 || p.lob) disc(p.x, p.y, shadowOfH(p.shadowR || LOB_SHADOW_R, h) * 1.75, 1 - Math.min(0.55, h / 160)); }
  takeShadows((x, y, r, a) => disc(x, y, r * 1.75, a));
`);
rep(`const shadowSize = (u) =>`, `// round 19 (lane sys19): a thing that stands upright, foot down the screen (def.upright), casts its shadow at its foot:
// def.foot [how far down from its middle, the foot's half-width], in its art's SVG units (the totem's carved foot, an
// ellipse 72 wide at 88 below its middle). Without one an upright thing's shadow is under its middle, as any unit's.
const FOOT = { totem: [88, 36] };
function footOf(u) {
  const f = u.def.upright && (u.def.foot || FOOT[u.kind]); if (!f) return null;
  const k = u.vr / (u.def.headR || headR(u.kind)), [ux, uy] = upVec();
  return { x: -ux * f[0] * k, y: -uy * f[0] * k, r: f[1] * k * 1.45 * bigOf(u) };
}
const shadowSize = (u) =>`);
rep(`import { drawFoeGround, snowRoll, drawFoe } from './foe-draw.js';`, `import { drawFoeGround, snowRoll, drawFoe } from './foe-draw.js';
import { airTier, projZ, takeShadows, shadowOfH, LOB_SHADOW_R } from './height.js'; // round 19 (lane sys19): heights, one shadow system`);
// pickups: their own soft shadows go
rep(`      const R = 26; ctx.drawImage(softShadow(), -R, -R, R * 2, R * 2);
`, ``);
rep(`  { const R = 34; ctx.drawImage(softShadow(), p.x - R, p.y - R, R * 2, R * 2); } // straight down, under it
`, `  // (its shadow, straight down under it: render.js drawShadows, round 19)
`);
fs.writeFileSync(f, s.replace(/\n/g, '\r\n')); console.log('ok');
