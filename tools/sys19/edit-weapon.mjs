import fs from 'node:fs';
function edit(f, pairs) {
  let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error(f + ' bad ' + a.slice(0, 90)); s = s.slice(0, i) + b + s.slice(i + a.length); }
  fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('ok', f);
}
edit('js/render.js', [[`// Round 13 (lane E): what foe-draw.js drawFoe needs from here`, `// Round 19 (lane sys19; the designer: "Thrown hammer looks different than held hammer", Warhelm "Throws a different
// hammer than what he holds"): a weapon of the hero's own that leaves the hand (thrown, flung, circling, lying where it
// fell) is drawn as the very part he holds it with: his art's weapon part (def.style.weaponPart, or a part named
// arm-l-hammer, arm-r-club, ...: the weapon as its own part, hidden in his hand while it is out, parts.js), at his own
// scale x k, centred on the weapon's middle (ctx's origin), turned by ctx. false when there is no such part or its
// picture isn't ready yet (the caller draws its own then).
const WEAPON_PART = /^arm-[lr]-(hammer|club|axe|sword|spear|blade|weapon)$/;
export function drawHeldWeapon(ctx, u, k = 1) {
  if (!u || !u.def || !u.def.art) return false;
  const sizeU = u.vr * 220 / (u.def.headR || headR(u.kind)), set = getRig(u.def.art, sizeU * view.scale * view.dpr * 1.04 * k);
  if (!set) return false;
  const want = u.def.style && u.def.style.weaponPart, L = set.layers.find((l) => (want ? l.id === want : WEAPON_PART.test(l.id)));
  if (!L) return false;
  const s = sizeU / 220 * k * bigOf(u);
  ctx.save(); ctx.scale(s, s); ctx.translate(-(L.x + L.w / 2), -(L.y + L.h / 2));
  ctx.drawImage(L.ink, L.x, L.y, L.w, L.h); ctx.drawImage(L.img, L.x, L.y, L.w, L.h);
  ctx.restore();
  return true;
}

// Round 13 (lane E): what foe-draw.js drawFoe needs from here`]]);
edit('js/fx2.js', [
  [`import { castShadow } from './height.js';`, `import { castShadow } from './height.js';\nimport { drawHeldWeapon } from './render.js'; // round 19 (lane sys19): a thrown weapon drawn as the one held`],
  // Stormhammer
  [`    ctx.rotate(T * 20 + p.x * 0.01); ctx.scale(s, s);
    inked(ctx, () => roundRect(ctx, -2.2, -2, 4.4, 20, 2), '#8A5A30');`, `    ctx.rotate(T * 20 + p.x * 0.01);
    if (drawHeldWeapon(ctx, p.owner, p.big ? 1.25 : 1)) return; // round 19 (lane sys19): the hammer he holds
    ctx.scale(s, s);
    inked(ctx, () => roundRect(ctx, -2.2, -2, 4.4, 20, 2), '#8A5A30');`],
  // Skull Splitter's flight
  [`  ctx.rotate(T * 18 + p.x * 0.01); ctx.scale(1.6, 1.6);
  inked(ctx, () => roundRect(ctx, -2.4, -2, 4.8, 22, 2), '#7A4A28');
  inked(ctx, () => roundRect(ctx, -12, -13, 24, 13, 3), '#8E98A6'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-10, -12, 20, 3.4);
};`, `  ctx.rotate(T * 18 + p.x * 0.01);
  if (drawHeldWeapon(ctx, p.owner)) return; // round 19 (lane sys19): the hammer he holds
  ctx.scale(1.6, 1.6);
  inked(ctx, () => roundRect(ctx, -2.4, -2, 4.8, 22, 2), '#7A4A28');
  inked(ctx, () => roundRect(ctx, -12, -13, 24, 13, 3), '#8E98A6'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-10, -12, 20, 3.4);
};`],
  // Storm Born
  [`  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1.5, 1.5);
  inked(ctx, () => roundRect(ctx, -2.4, -2, 4.8, 22, 2), '#7A4A28');
  inked(ctx, () => roundRect(ctx, -12, -13, 24, 13, 3), '#8E98A6'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-10, -12, 20, 3.4);
  ctx.restore();`, `  ctx.translate(x, y); ctx.rotate(rot);
  if (!drawHeldWeapon(ctx, u)) { // round 19 (lane sys19): the hammer he holds
    ctx.scale(1.5, 1.5);
    inked(ctx, () => roundRect(ctx, -2.4, -2, 4.8, 22, 2), '#7A4A28');
    inked(ctx, () => roundRect(ctx, -12, -13, 24, 13, 3), '#8E98A6'); ctx.fillStyle = '#C9D2DE'; ctx.fillRect(-10, -12, 20, 3.4);
  }
  ctx.restore();`],
  // lying where it fell
  [`  ctx.save(); ctx.globalAlpha *= a; ctx.translate(f.x, f.y); ctx.rotate(f.a + Math.PI / 2);
  inked(ctx, () => roundRect(ctx, -2.6, -26, 5.2, 24, 2), '#7A4A28'); inked(ctx, () => roundRect(ctx, -13, -4, 26, 14, 3), '#8E98A6');
  ctx.restore();`, `  ctx.save(); ctx.globalAlpha *= a; ctx.translate(f.x, f.y); ctx.rotate(f.a + Math.PI / 2);
  if (!drawHeldWeapon(ctx, f.unit)) { inked(ctx, () => roundRect(ctx, -2.6, -26, 5.2, 24, 2), '#7A4A28'); inked(ctx, () => roundRect(ctx, -13, -4, 26, 14, 3), '#8E98A6'); } // (round 19: the hammer he holds)
  ctx.restore();`],
]);
edit('js/kits2.js', [
  [`k2(w, { draw: 'hammerDown', x: x1, y: y1, a, max: 0.55 });`, `k2(w, { draw: 'hammerDown', x: x1, y: y1, a, max: 0.55, unit: u }); // (round 19: unit, drawn as the hammer he holds)`],
  [`    if (out) u._force = { 'arm-l': { hide: true } }; else if (u._force && u._force['arm-l'] && u._force['arm-l'].hide) u._force = null;\n`, `    // (round 19, lane sys19: his hammer is its own part now, arm-l-hammer, hidden by parts.js while it's out; his fist stays)\n`],
]);
