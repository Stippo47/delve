import fs from 'node:fs';
function edit(f, pairs) {
  let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error(f + ' bad ' + a.slice(0, 90)); s = s.slice(0, i) + b + s.slice(i + a.length); }
  fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('ok', f);
}
const C = '/* round 19 (lane sys19): its shadow is the units\' own (height.js castShadow) */ ';
edit('js/fx2.js', [
  [`import { ART2 } from './looks2.js';`, `import { ART2 } from './looks2.js';\nimport { castShadow } from './height.js'; // round 19 (lane sys19): one shadow system: what flies casts the units' shadow`],
  // Storm Born's hammer circling
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= a * 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 12, 6, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}castShadow(S.x, S.y, 11, a, hh); return; }`],
  // the frog
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(u.x, u.y, 13 * s, 7 * s, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}castShadow(u.x, u.y, 11 * s, 1, h); return; } // (the unit is hidden while it is a frog: this is its only shadow, the frog's size)`],
  // the broom
  [`ctx.save(); ctx.globalAlpha *= 0.25 * a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(u.x, u.y, 26, 10, u.facing, 0, TAU); ctx.fill(); ctx.restore();\n`,
   `${C}castShadow(u.x, u.y, 18, a, up); // (she is ethereal on the broom, so this is the only shadow)\n`],
  // the falcon
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.22 * life(f, 0.1, 0.1); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 12, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}castShadow(f.x, f.y, 10, life(f, 0.1, 0.1), h); return; }`],
  // the flock
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.18 * a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(u.x, u.y, 34, 16, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}for (const b of F.birds) { const ang = f.t * 4 * b.s + b.o; castShadow(u.x + Math.cos(ang) * b.r, u.y + Math.sin(ang) * b.r * 0.7, 6, a, 22); } return; } // (he is hidden: each bird its own)`],
  // the anchor
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, 22 * (0.6 + 0.4 * k), 9, 0, 0, TAU); ctx.fill(); ctx.restore();\n`,
   `if (layer === 'ground') { ${C}castShadow(x, y, 16, 1, h);\n`],
  // javelin rain
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3 * k; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 6 + 6 * k, 3 + 3 * k, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}castShadow(f.x, f.y, 8, 0.3 + 0.7 * k, h); return; }`],
  // the cannonball
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.15 + 0.3 * k; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, 8 + 8 * k, 4 + 4 * k, 0, 0, TAU); ctx.fill(); ctx.restore();\n`,
   `if (layer === 'ground') { ${C}castShadow(x, y, 10 * (1.4 - 0.4 * k), 0.4 + 0.6 * k, h);\n`],
  // the ram
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.25 * life(f, 0.05, 0.2); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 26, 13, f.a, 0, TAU); ctx.fill(); ctx.restore(); `,
   `if (layer === 'ground') { ${C}castShadow(f.x, f.y, 20, life(f, 0.05, 0.2), h); `],
  // the sheep
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, 12, 6, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}castShadow(x, y, 11, 1, h); return; }`],
  // Ill Omen
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3 * a; ctx.fillStyle = '#2E2440'; star(ctx, f.x, f.y, f.r, 7, 0.55, f.t * 0.3); ctx.fill(); ctx.restore(); return; }
  const h = 60 + 4 * Math.sin(f.t * 2);`,
   `const h = 60 + 4 * Math.sin(f.t * 2);
  if (layer === 'ground') { ${C}castShadow(f.x, f.y, 20, a, h); return; }`],
  // Rain Dance's cloud
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.3 * a; ctx.fillStyle = '#2F5F88'; blob(ctx, f.x, f.y, f.r, 9, 1, 1); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}castShadow(f.x, f.y, f.r * 0.62, 0.8 * a); return; } // (the cloud's shadow, the size of the rain)`],
]);
edit('js/fx3.js', [
  [`import { variant } from './fxvar.js';`, `import { variant } from './fxvar.js';\nimport { castShadow } from './height.js'; // round 19 (lane sys19): one shadow system`],
  [`if (layer === 'ground') { ctx.save(); ctx.globalAlpha *= 0.28; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(gx, gy, f.r * 0.9, f.r * 0.45, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }`,
   `if (layer === 'ground') { ${C}castShadow(gx, gy, f.r, 1, h); return; }`],
]);
edit('js/boss-cinder-fx.js', [
  [`import { dustPuffs } from './fxkit.js';`, `import { dustPuffs } from './fxkit.js';\nimport { castShadow } from './height.js'; // round 19 (lane sys19): one shadow system`],
  [`  ground(ctx, f, k) { shade(ctx, f.x, f.y, 20 + 30 * k, 16 + 24 * k, 0.12 + 0.3 * k); },`,
   `  ground(ctx, f, k) { ${C}castShadow(f.x, f.y, (20 + 30 * k) * 0.55, 0.3 + 0.7 * k); },`],
]);
