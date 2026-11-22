// Round 14, lane I: the drawing kit the three icon styles share. Everything is drawn in a 64x64 box.
// A "part" is one shape with a fill; obj() lays the ink outline under a whole group of parts (as the game's sprites
// do: one outline round the figure, no lines between its own pieces) and then paints them on top.
export const INK = '#2B2230';      // the sprites' outline
export const UI_INK = '#0E1120';   // the UI's darkest (css/base.css --ink)

// materials: [light, dark], laid as a soft top-left to bottom-right gradient (the sprites' one shade step)
export const MAT = {
  steel: ['#F1F4F8', '#A9B2C0'], steelDk: ['#B4BCC8', '#7D879A'], iron: ['#8F97A3', '#5E6678'],
  gold: ['#FFE07A', '#D9962B'], goldDk: ['#E8B53A', '#B07A22'],
  blue: ['#6C9BE6', '#2E5AA8'], blueDk: ['#3F6FC0', '#234684'],
  wood: ['#C9965A', '#8A5A30'], tan: ['#E0AC72', '#A66A3C'], leather: ['#9A623A', '#6B4226'], grip: ['#6A5560', '#3F3140'],
  bone: ['#FBF5E4', '#CFC4A6'], cream: ['#FFF6E0', '#EBD9B4'],
  red: ['#F0705A', '#B43A30'], blood: ['#E0504A', '#8E2434'],
  fire: ['#FFC85A', '#F0702A'], fireCore: ['#FFF6C0', '#FFD45A'],
  frost: ['#E6F9FF', '#7CC8EA'], frostDk: ['#9FDDF6', '#4A9CC8'],
  bolt: ['#FFF7C2', '#FFD23A'],
  holy: ['#FFF3C0', '#F2C14E'],
  leaf: ['#8CC65A', '#3F7A2E'], leafDk: ['#5E9A40', '#2F5E24'],
  shadow: ['#9B86C9', '#4A3A6E'], necro: ['#C9B0FF', '#7A5AC0'], ghost: ['#B5F29A', '#5DBB4E'],
  wolf: ['#AEB8CC', '#66708A'], wolfLt: ['#E4E9F2', '#B4BCCC'], wolfDk: ['#6E7890', '#434A60'],
  earth: ['#8A6A52', '#4E382E'], stone: ['#A99C8B', '#6E6258'],
  white: ['#FFFFFF', '#E3E8F0'], night: ['#3B4478', '#1F2440'],
  feather: ['#FF9A3D', '#D8401F'],
};

const r2 = (n) => Math.round(n * 100) / 100;
export const at = (shape, attrs) => shape.replace(/\/>\s*$/, ` ${attrs}/>`);
export const path = (d) => `<path d="${d}"/>`;
export const circle = (cx, cy, r) => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}"/>`;
export const ellipse = (cx, cy, rx, ry) => `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}"/>`;
export const rect = (x, y, w, h, rx = 0) => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(rx)}"/>`;
// a star / burst: n points, alternating outer and inner radius
export function burst(cx, cy, ro, ri, n, rot = -90) {
  const p = [];
  for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, r = i % 2 ? ri : ro; p.push(`${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}`); }
  return path('M' + p.join('L') + 'Z');
}
// a four-point sparkle
export const spark = (cx, cy, r) => path(`M${r2(cx)} ${r2(cy - r)}Q${r2(cx + r * 0.18)} ${r2(cy - r * 0.18)} ${r2(cx + r)} ${r2(cy)}Q${r2(cx + r * 0.18)} ${r2(cy + r * 0.18)} ${r2(cx)} ${r2(cy + r)}Q${r2(cx - r * 0.18)} ${r2(cy + r * 0.18)} ${r2(cx - r)} ${r2(cy)}Q${r2(cx - r * 0.18)} ${r2(cy - r * 0.18)} ${r2(cx)} ${r2(cy - r)}Z`);
// a pie sector (for the cooldown wipe), clockwise from 12 o'clock, frac 0..1
export function sector(cx, cy, r, frac) {
  if (frac >= 0.999) return circle(cx, cy, r);
  const a = frac * 2 * Math.PI - Math.PI / 2;
  return path(`M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}Z`);
}
// an arc as a path (degrees, 0 = east, clockwise on screen)
export function arc(cx, cy, r, a0, a1) {
  const p = (a) => `${r2(cx + r * Math.cos(a * Math.PI / 180))} ${r2(cy + r * Math.sin(a * Math.PI / 180))}`;
  return `M${p(a0)}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${p(a1)}`;
}

// One drawing's context: collects <defs> (gradients, clips) with ids that are unique to the icon.
export class Ctx {
  constructor(prefix) { this.prefix = prefix; this.defs = []; this.n = 0; this.grads = {}; }
  id() { return `${this.prefix}-${this.n++}`; }
  // a material or a plain colour -> a fill value
  fill(f) {
    if (!f) return 'none';
    if (!MAT[f]) return f;
    if (!this.grads[f]) { const id = this.id(); this.grads[f] = id; this.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${MAT[f][0]}"/><stop offset="1" stop-color="${MAT[f][1]}"/></linearGradient>`); }
    return `url(#${this.grads[f]})`;
  }
  flat(f, k = 0.5) { // a material's middle colour (for strokes, whose box can be flat)
    if (!MAT[f]) return f;
    const [a, b] = MAT[f].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join('');
  }
  clip(shapes, t) { const id = this.id(); this.defs.push(`<clipPath id="${id}">${[].concat(shapes).map((s) => (t ? at(s, `transform="${t}"`) : s)).join('')}</clipPath>`); return id; }
  radial(stops, cx = 0.5, cy = 0.5, r = 0.5) { const id = this.id(); this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</radialGradient>`); return `url(#${id})`; }
  linear(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) { const id = this.id(); this.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`); return `url(#${id})`; }

  // parts: [{ s: shape, f: fill | material, w: stroke width (a line part: s is stroked, not filled), t: transform,
  //           sh: [shapes] darker, clipped to s,  hi: [shapes] lighter, clipped to s,  ink: [shapes] thin ink lines, clipped,
  //           shc / hic: colours for those, sho / hio: opacities, raw: markup drawn after (clipped to s) }]
  // opts: ow = outline width as seen (the stroke under is twice that), t = a transform for the whole object, ink colour
  obj(parts, opts = {}) {
    const ow = opts.ow === undefined ? 3 : opts.ow, ink = opts.ink || INK;
    const tr = (p) => (p.t ? ` transform="${p.t}"` : '');
    let under = '', top = '';
    for (const p of parts) {
      if (p.noOutline) continue;
      if (p.w) under += at(p.s, `fill="none" stroke="${ink}" stroke-width="${r2(p.w + ow * 2)}" stroke-linecap="${p.cap || 'round'}" stroke-linejoin="round"${tr(p)}`);
      else under += at(p.s, `fill="${ink}" stroke="${ink}" stroke-width="${r2(ow * 2)}" stroke-linejoin="round"${tr(p)}`);
    }
    for (const p of parts) {
      if (p.w) { top += at(p.s, `fill="none" stroke="${this.flat(p.f, p.k)}" stroke-width="${p.w}" stroke-linecap="${p.cap || 'round'}" stroke-linejoin="round"${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}${tr(p)}`); continue; }
      top += at(p.s, `fill="${this.fill(p.f)}"${p.o ? ` opacity="${p.o}"` : ''}${tr(p)}`);
      if (p.sh || p.hi || p.ink || p.raw) {
        const cid = this.clip(p.s);
        let inner = '';
        for (const s of [].concat(p.sh || [])) inner += at(s, `fill="${p.shc || INK}" opacity="${p.sho === undefined ? 0.22 : p.sho}"`);
        for (const s of [].concat(p.hi || [])) inner += /stroke-width/.test(s) ? at(s, `fill="none" stroke="${p.hic || '#FFFFFF'}" stroke-linecap="round" opacity="${p.hio === undefined ? 0.75 : p.hio}"`) : at(s, `fill="${p.hic || '#FFFFFF'}" opacity="${p.hio === undefined ? 0.6 : p.hio}"`);
        for (const s of [].concat(p.ink || [])) inner += at(s, `fill="none" stroke="${ink}" stroke-width="${p.inkw || 1.8}" stroke-linecap="round" stroke-linejoin="round"`);
        if (p.raw) inner += p.raw;
        top += `<g${tr(p)}><g clip-path="url(#${cid})">${inner}</g></g>`;
      }
    }
    const g = `<g>${under}</g><g>${top}</g>`;
    return opts.t ? `<g transform="${opts.t}">${g}</g>` : g;
  }
  svg(inner, { size = 64, vb = '0 0 64 64', cls = '' } = {}) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${size}"${cls ? ` class="${cls}"` : ''}>${this.defs.length ? `<defs>${this.defs.join('')}</defs>` : ''}${inner}</svg>`;
  }
}
