import fs from 'node:fs';
function edit(f, pairs) {
  let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error(f + ' bad ' + a.slice(0, 90)); s = s.slice(0, i) + b + s.slice(i + a.length); }
  fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('ok', f);
}
edit('js/parts.js', [
  [`  const line = +sprite.getAttribute('data-line') || LINE;
  return { layers, string, line, has: Object.fromEntries(layers.map((l) => [l.id, true])) };`,
  `  const line = +sprite.getAttribute('data-line') || LINE;
  // round 19 (lane sys19; the designer on Warhelm: "Left should be behind, free hands don't get to float"): an arm part
  // that is only a fist (three shapes or fewer: the fist, its shadow) drawn over the body in the file is a free hand;
  // poseFor puts it under the body while the other hand holds the weapon (pose.under; paintRig)
  const bodyAt = kids.findIndex((el) => el.getAttribute('id') === 'body'), free = new Set();
  kids.forEach((el, i) => { const id = el.getAttribute('id') || ''; if (bodyAt >= 0 && i > bodyAt && /^arm-[lr]$/.test(id) && el.querySelectorAll('path,rect,circle,ellipse,polygon,line,use').length <= 3) free.add(id); });
  return { layers, string, line, free, has: Object.fromEntries(layers.map((l) => [l.id, true])) };`],
  [`export const rigHas = (url, id) => { const e = arts.get(url); return !!(e && e.rig && e.rig.has[id]); };`,
   `export const rigHas = (url, id) => { const e = arts.get(url); return !!(e && e.rig && e.rig.has[id]); };
const rigFree = (url, id) => { const e = arts.get(url); return !!(e && e.rig && e.rig.free && e.rig.free.has(id)); };`],
  // paint order
  [`export function paintRig(g, set, pose, mode = 'normal', ink = null, shift = false, border = null) {
  const Ls = set.layers,`, `export function paintRig(g, set, pose, mode = 'normal', ink = null, shift = false, border = null) {
  const Ls = underFirst(set.layers, pose && pose.under),`],
  [`// A scratch canvas for figures that must be composed first`, `// round 19 (lane sys19): a free hand (pose.under) is drawn just before the body, so it sits at the body's side, behind it
function underFirst(Ls, id) {
  if (!id) return Ls; const i = Ls.findIndex((l) => l.id === id), b = Ls.findIndex((l) => l.id === 'body');
  if (i < 0 || b < 0 || i < b) return Ls;
  const out = Ls.slice(); const [L] = out.splice(i, 1); out.splice(b, 0, L); return out;
}

// A scratch canvas for figures that must be composed first`],
  [`  pose[hand] = hand === 'arm-r' ? main : mirror(main);
  pose[other] = other === 'arm-r' ? off : mirror(off);`, `  pose[hand] = hand === 'arm-r' ? main : mirror(main);
  pose[other] = other === 'arm-r' ? off : mirror(off);
  // round 19 (lane sys19): the other hand, when it holds nothing (a bare fist over the body in the art) and isn't a
  // shield, a bow hand or a second weapon, is drawn behind the body: "free hands don't get to float"
  if (!dual && !sty.bow && sty.off !== 'shield' && rigFree(url, other)) pose.under = other;`],
]);
