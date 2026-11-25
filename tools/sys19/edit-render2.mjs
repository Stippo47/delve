import fs from 'node:fs';
const f = 'js/render.js'; let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error('bad ' + a.slice(0, 80)); s = s.slice(0, i) + b + s.slice(i + a.length); };
rep(`  const order = [...w.units].sort((a, b) => (a.downed ? -1 : 0) - (b.downed ? -1 : 0) || screenDepth(a) - screenDepth(b));`,
`  // round 19 (lane sys19, the designer: in the air, "always render in front of everything on the ground until landed"):
  // the downed first, then everything on the floor, then what hovers, then what flies (height.js airTier: a leap, a
  // thrown foe, a pounce's hang, a hop, a swoop, the imps, the spirit eagle, bats), each by its depth on screen
  const order = [...w.units].map((u) => (u._tier = airTier(u), u)).sort((a, b) => (a.downed ? -1 : 0) - (b.downed ? -1 : 0) || a._tier - b._tier || screenDepth(a) - screenDepth(b));`);
// remove the now unused softShadow
rep(`// A soft round shadow, made once: dark in the middle, fading at the rim.
let shadowImg = null;
function softShadow() {
  if (shadowImg) return shadowImg;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(43,34,48,0.26)'); gr.addColorStop(0.6, 'rgba(43,34,48,0.2)'); gr.addColorStop(1, 'rgba(43,34,48,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (shadowImg = c);
}

`, ``);
fs.writeFileSync(f, s.replace(/\n/g, '\r\n')); console.log('ok');
