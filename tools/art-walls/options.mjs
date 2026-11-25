// Round 19 art lane (walls): the options, two or three per dungeon. Each is a set of painters in the wall's own frame
// (see lib.mjs): face(s, u0, u1), cap(s, u0, u1), over (hangs over the face from the cap), feature / featureOver (run-b's
// one thing at u 80), bay (the overlay round a door at u 80), post (on the room corner's outer corner).
import { P, f1, hash, shade, mix, jit, rrect, poly, smooth, blob, bez, tube, block, stone, wash, every, courses,
  rivet, hcyl, vcyl, icicle, lumps, gear, patch } from './lib.mjs';

export const OPTIONS = [];
const opt = (o) => { o.letter = o.id.split('-')[1]; OPTIONS.push(o); return o; };
const rect = (s, x, y, w, h, fill, extra = '') => s.add(`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}" ${extra}/>`);
const path = (s, d, fill, extra = '') => s.add(`<path d="${d}" fill="${fill}" ${extra}/>`);
const bg = (s, u0, u1, y0, y1, fill) => rect(s, u0 - 2, y0, u1 - u0 + 4, y1 - y0, fill);
const vgrad = (s, a, b) => s.lg([[0, a], [1, b]]);

// ---------------------------------------------------------------- shared pieces
// The door's arch (art/props/door-*.svg) in the bay's frame: its stone frame stands 24..136 wide, its shoulders at
// v -23.6 and its keystone at v -56.6. A hood round it is the band between two curves following that arch.
const archPts = (x0, y0, ctlY, topY, n) => bez([x0, y0], [x0, ctlY], [x0 + (80 - x0) * 0.5, topY], [80, topY], n * 3).filter((_, i) => i % 3 === 0);
const HOOD = { in: 21, out: 7, spring: -22, inCtl: -50, inTop: -60, outCtl: -60, outTop: -74 };
function hoodPts(o) {
  const h = { ...HOOD, ...o }, n = h.n ?? 5;
  return { n, inner: archPts(h.in, h.spring, h.inCtl, h.inTop, n), outer: archPts(h.out, h.spring, h.outCtl, h.outTop, n) };
}
// voussoirs: the band cut into stones, mirrored; col(i) their colour
function hood(s, o) {
  const { n, inner, outer } = hoodPts(o);
  const band = [...outer, ...outer.map(([x, y]) => [160 - x, y]).reverse().slice(1), ...inner.map(([x, y]) => [160 - x, y]), ...inner.slice().reverse().slice(1)];
  path(s, poly(band), o.grout ?? '#3A3440');
  for (const side of [1, -1]) for (let i = 0; i < n; i++) {
    const X = (p) => [side > 0 ? p[0] : 160 - p[0], p[1]];
    let q = [inner[i], inner[i + 1], outer[i + 1], outer[i]].map(X);
    const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
    q = q.map(([x, y]) => [x + (cx - x) * (o.gap ?? 0.12), y + (cy - y) * (o.gap ?? 0.12)]);
    const c = o.col(i, side);
    path(s, smooth(q, 0.25), s.lg([[0, shade(c, 0.18)], [1, shade(c, -0.16)]], 0, 0, 0.3, 1));
    path(s, tube([q[3], q[2]], 2.2, 2.2), '#FFFFFF', 'opacity="0.24"');
    if (o.each) o.each(q, i, side);
  }
}
// a pier either side of the door: a shaft, a capital where the hood springs, a base
function piers(s, o) {
  const w = o.w ?? 18, x0 = o.x ?? 2, top = o.top ?? -26;
  for (const x of [x0, 160 - x0 - w]) {
    if (o.shaft) o.shaft(x, top, w); else block(s, x, top, w, -top, o.col, { r: 3, glossH: 4 });
    if (o.cap !== false) block(s, x - 2.5, top - 8, w + 5, 9, o.capCol ?? shade(o.col, 0.14), { r: 3, glossH: 3 });
    if (o.base !== false) block(s, x - 2, -9, w + 4, 9, o.baseCol ?? shade(o.col, -0.1), { r: 2.5, glossH: 2.5 });
  }
}
function skull(s, x, y, k = 1, bone = '#EDE4CD') {
  path(s, blob(x, y - 1.5 * k, 8.5 * k, 7.8 * k, 3, 0.04, 10), s.rg([[0, '#FFFDF4'], [0.55, bone], [1, shade(bone, -0.3)]], 0.38, 0.3, 0.8));
  path(s, rrect(x - 5 * k, y + 3.5 * k, 10 * k, 5.5 * k, 2 * k), shade(bone, -0.14));
  for (const sx of [-1, 1]) s.add(`<ellipse cx="${f1(x + sx * 3.4 * k)}" cy="${f1(y)}" rx="${f1(2.4 * k)}" ry="${f1(2.7 * k)}" fill="#2B2230" opacity="0.85"/>`);
  path(s, `M${f1(x)} ${f1(y + 2 * k)}l${f1(-1.3 * k)} ${f1(2.4 * k)}h${f1(2.6 * k)}Z`, '#2B2230', 'opacity="0.75"');
  s.add(`<path d="M${f1(x - 2.6 * k)} ${f1(y + 5.5 * k)}V${f1(y + 8.6 * k)}M${f1(x)} ${f1(y + 5.5 * k)}V${f1(y + 8.6 * k)}M${f1(x + 2.6 * k)} ${f1(y + 5.5 * k)}V${f1(y + 8.6 * k)}" stroke="#6E6458" stroke-width="${f1(0.9 * k)}" opacity="0.7"/>`);
  s.add(`<ellipse cx="${f1(x - 3 * k)}" cy="${f1(y - 5.5 * k)}" rx="${f1(2.6 * k)}" ry="${f1(1.4 * k)}" fill="#FFFFFF" opacity="0.55"/>`);
}
// a long bone lying along the wall
function bone(s, x, y, len, k, c = '#E6DCC2') {
  const r = 3.2 * k;
  path(s, rrect(x + r, y - r * 0.55, len - 2 * r, r * 1.1, r * 0.5), s.lg([[0, shade(c, 0.2)], [1, shade(c, -0.22)]]));
  for (const ex of [x + r, x + len - r]) for (const dy of [-r * 0.55, r * 0.55]) s.add(`<circle cx="${f1(ex)}" cy="${f1(y + dy)}" r="${f1(r * 0.78)}" fill="${s.rg([[0, '#FFFBEE'], [0.6, c], [1, shade(c, -0.28)]], 0.35, 0.3, 0.8)}"/>`);
}
const capstone = (s, H, size, c) => { block(s, H - size, -H, size, size, c, { r: 4, glossH: 5 }); path(s, rrect(H - size + 5, -H + 5, size - 10, size - 10, 3), 'none', 'stroke="#1A1020" stroke-opacity="0.16" stroke-width="1.6"'); };
// soft leafy clumps (bushes, ivy, turf) round a point: a dark body, a lit top, a gloss
function clump(s, x, y, r, seed, g) {
  path(s, blob(x + r * 0.08, y + r * 0.1, r, r * 0.86, seed, 0.16, 8), g[0]);
  path(s, blob(x - r * 0.14, y - r * 0.16, r * 0.74, r * 0.62, seed + 1, 0.18, 8), s.rg([[0, g[2]], [1, g[1]]], 0.35, 0.3, 0.8));
  s.add(`<ellipse cx="${f1(x - r * 0.32)}" cy="${f1(y - r * 0.36)}" rx="${f1(r * 0.26)}" ry="${f1(r * 0.14)}" fill="#FFFFFF" opacity="0.3" transform="rotate(-20 ${f1(x - r * 0.32)} ${f1(y - r * 0.36)})"/>`);
}
// a root: a tapered tube with a lit side and a gloss line
function root(s, pts, w0, w1, c) {
  path(s, tube(pts, w0, w1), shade(c, -0.3));
  path(s, tube(pts, w0 * 0.74, w1 * 0.74, 0.26), c);
  path(s, tube(pts, w0 * 0.2, w1 * 0.2, 2.0), shade(c, 0.38), 'opacity="0.8"');
}
// a small flame (light: no outline in the game's rule, so it is soft)
function flame(s, x, y, k = 1) {
  s.add(`<ellipse cx="${f1(x)}" cy="${f1(y - 3 * k)}" rx="${f1(9 * k)}" ry="${f1(9 * k)}" fill="${s.rg([[0, '#FFD27A', 0.55], [1, '#FF9A3D', 0]], 0.5, 0.5, 0.5)}"/>`);
  path(s, `M${f1(x)} ${f1(y - 9 * k)}C${f1(x + 3.4 * k)} ${f1(y - 4 * k)} ${f1(x + 3.4 * k)} ${f1(y)} ${f1(x)} ${f1(y)}C${f1(x - 3.4 * k)} ${f1(y)} ${f1(x - 3.4 * k)} ${f1(y - 4 * k)} ${f1(x)} ${f1(y - 9 * k)}Z`, s.lg([[0, '#FFF4C8'], [0.6, '#FFC24A'], [1, '#FF8A2A']]));
}
function candle(s, x, y, h, k = 1, wax = '#F2E8CE') {
  vcyl(s, x - 2.6 * k, y - h, 5.2 * k, h, wax, 2 * k);
  path(s, `M${f1(x - 2.6 * k)} ${f1(y - h + 1)}q${f1(1.2 * k)} ${f1(3 * k)} ${f1(2.2 * k)} 0`, shade(wax, 0.1));
  flame(s, x, y - h - 1, 0.8 * k);
}

// =============================================================================== THE CRYPT: bone and stone
const CR = { stone: '#9A97A6', grout: '#4A4656', cap: '#B8B5C2', bone: '#EDE4CD', dark: '#2A2632' };
opt({
  id: 'crypt-a', theme: 'crypt', name: 'Tomb ashlar', H: 104, F: 86,
  blurb: 'Big grey cut blocks in courses on a plinth, a string course, burial niches with a skull now and then.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, CR.grout);
    courses(s, u0, u1, 0, [
      { h: 18, w: [80, 80], off: 20, k: -0.14 }, { h: 28, w: [64, 96], off: 0 }, { h: 26, w: [96, 64], off: 34 }, { h: 14, w: [80, 80], off: 52, k: 0.12 },
    ], (i, j, row) => shade(jit(CR.stone, i, j, 0.14), row.k || 0), { r: 5, glossH: 5 });
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, CR.grout); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [80, 80], off: 40 }], (i) => jit(CR.cap, i, 7, 0.08), { r: 4, glossH: 5 }); },
  feature(s, u) { // a burial niche with a skull in it
    path(s, `M${u - 24} -18V-48C${u - 24} -76 ${u + 24} -76 ${u + 24} -48V-18Z`, vgrad(s, shade(CR.cap, 0.08), shade(CR.stone, -0.1)));
    path(s, `M${u - 18} -18V-48C${u - 18} -68 ${u + 18} -68 ${u + 18} -48V-18Z`, vgrad(s, '#1E1A26', '#3E3A4A'));
    skull(s, u, -32, 1.3);
    block(s, u - 28, -19, 56, 10, shade(CR.cap, -0.04), { r: 3, glossH: 3 });
  },
  bay(s) {
    piers(s, { col: shade(CR.stone, 0.06), top: -26 });
    hood(s, { grout: CR.grout, col: (i) => jit(shade(CR.cap, -0.04), i, 3, 0.12) });
    path(s, 'M68 -84H92L88 -56H72Z', s.lg([[0, shade(CR.cap, 0.22)], [1, shade(CR.cap, -0.12)]]));
    skull(s, 80, -72, 0.85);
  },
  post(s) { capstone(s, this.H, 28, shade(CR.cap, 0.06)); },
});
opt({
  id: 'crypt-b', theme: 'crypt', name: 'Ossuary', H: 100, F: 84,
  blurb: 'Stone bands with rows of skulls and stacked long bones set between them; a hood of skulls over each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, CR.dark);
    courses(s, u0, u1, 0, [{ h: 14, w: [80, 80], off: 10 }], (i) => jit(shade(CR.stone, -0.06), i, 1, 0.1), { r: 4 });
    path(s, `M${u0 - 2} -38H${u1 + 2}V-14H${u0 - 2}Z`, vgrad(s, '#1A1620', '#36303E'));
    for (const x of every(u0, u1, 10)) for (let i = 0; i < 8; i++) skull(s, x + i * 20, -27, 1.12, mix(CR.bone, '#C9BC9C', hash(i, 4) * 0.5));
    courses(s, u0, u1, -38, [{ h: 12, w: [40, 40, 40, 40], off: 22 }], (i) => jit(CR.stone, i, 2, 0.12), { r: 3, glossH: 3 });
    path(s, `M${u0 - 2} -72H${u1 + 2}V-50H${u0 - 2}Z`, vgrad(s, '#1A1620', '#36303E'));
    for (const x of every(u0, u1, 0)) for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) bone(s, x + i * 40 + (r % 2) * 20 - 2, -55 - r * 6.4, 40, 1, mix(CR.bone, '#CDBF9E', hash(i, r) * 0.6));
    courses(s, u0, u1, -72, [{ h: this.F - 72, w: [56, 48, 56], off: 8 }], (i) => jit(shade(CR.stone, 0.08), i, 3, 0.1), { r: 3, glossH: 3 });
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, CR.grout); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [40, 40, 40, 40], off: 0 }], (i) => jit(CR.cap, i, 5, 0.1), { r: 4, glossH: 4 }); },
  feature(s, u) { // candles on the band
    block(s, u - 22, -46, 44, 8, shade(CR.cap, -0.02), { r: 2.5, glossH: 2.5 });
    candle(s, u - 12, -45, 12); candle(s, u + 1, -45, 17); candle(s, u + 13, -45, 9);
  },
  bay(s) {
    piers(s, { col: shade(CR.stone, 0.04), top: -26 });
    const { inner, outer } = hoodPts({ n: 5 });
    path(s, poly([...outer, ...outer.map(([x, y]) => [160 - x, y]).reverse().slice(1), ...inner.map(([x, y]) => [160 - x, y]), ...inner.slice().reverse().slice(1)]), CR.dark);
    for (const side of [1, -1]) for (let i = 0; i < 5; i++) { const a = inner[i], b = outer[i + 1]; skull(s, side > 0 ? (a[0] + b[0]) / 2 + 1 : 160 - (a[0] + b[0]) / 2 - 1, (a[1] + b[1]) / 2 + 2, 0.95); }
    skull(s, 80, -70, 1.25);
  },
  post(s) { capstone(s, this.H, 28, shade(CR.cap, 0.04)); skull(s, this.H - 14, -this.H + 13, 1.05); },
});
opt({
  id: 'crypt-c', theme: 'crypt', name: 'Blind arcade', H: 108, F: 90,
  blurb: 'A row of tall pointed arches sunk into the stone, dark inside, a string course over them; candles in some.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, CR.grout);
    courses(s, u0, u1, 0, [{ h: 16, w: [80, 80], off: 40, k: -0.12 }, { h: 30, w: [40, 40, 40, 40], off: 20 }, { h: 30, w: [40, 40, 40, 40], off: 20 }, { h: 14, w: [80, 80], off: 0, k: 0.12 }],
      (i, j, row) => shade(jit(CR.stone, i, j, 0.12), row.k || 0), { r: 4 });
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 4; i++) { // the arches: a lit stone frame round a dark recess
      const cx = x + i * 40 + 20, arch = (w, top, foot) => `M${cx - w} ${foot}V${top + w * 1.1}Q${cx - w} ${top + w * 0.25} ${cx} ${top}Q${cx + w} ${top + w * 0.25} ${cx + w} ${top + w * 1.1}V${foot}Z`;
      path(s, arch(15, -80, -14), s.lg([[0, shade(CR.cap, 0.12)], [1, shade(CR.stone, -0.04)]]));
      path(s, arch(10.5, -72, -16), s.lg([[0, '#1A1622'], [0.7, '#2E2A38'], [1, '#3E3A4A']]));
      block(s, cx - 16, -17, 32, 7, shade(CR.cap, -0.02), { r: 2.5, glossH: 2.5 });
    }
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, CR.grout); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [64, 48, 48], off: 30 }], (i) => jit(CR.cap, i, 2, 0.08), { r: 4, glossH: 5 }); },
  feature(s, u) { // candles in two of the arches
    for (const dx of [-20, 20]) { candle(s, u + dx - 4, -17, 14); candle(s, u + dx + 4, -17, 9); }
    skull(s, u + 60, -26, 0.95);
  },
  bay(s) { // a pointed hood
    piers(s, { col: shade(CR.stone, 0.06), top: -28 });
    hood(s, { grout: CR.grout, outTop: -84, inTop: -64, inCtl: -44, outCtl: -52, col: (i) => jit(shade(CR.cap, -0.06), i, 6, 0.12) });
    path(s, 'M70 -94H90L86 -60H74Z', s.lg([[0, shade(CR.cap, 0.2)], [1, shade(CR.cap, -0.12)]]));
    skull(s, 80, -78, 0.75);
  },
  post(s) { capstone(s, this.H, 30, shade(CR.cap, 0.05)); },
});

// =============================================================================== THE WILDWOOD: wood and roots
const WW = { earth: '#7C5C3E', earthDk: '#5A402A', root: '#8E6840', stone: '#9A907E', turf: ['#466A2A', '#6A963C', '#A2CC5C'], bark: '#7E5A38', wood: '#E2C48E' };
opt({
  id: 'wildwood-a', theme: 'wildwood', name: 'Root bank', H: 100, F: 80,
  blurb: 'A bank of packed earth held together by thick tree roots, with bushes along its top.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, vgrad(s, shade(WW.earth, 0.08), WW.earthDk));
    for (const [at, y, rx, ry] of [[24, -20, 13, 9], [100, -48, 15, 10], [146, -18, 10, 7.5], [60, -60, 10, 7]])
      for (const x of every(u0, u1, at)) stone(s, blob(x, y, rx, ry, at, 0.12), WW.stone);
    for (const x of every(u0, u1, 0)) {
      root(s, bez([x - 4, -this.F - 2], [x + 30, -58], [x + 8, -28], [x + 48, 4]), 17, 8, WW.root);
      root(s, bez([x + 118, -this.F - 2], [x + 96, -46], [x + 140, -34], [x + 120, 4]), 14, 7, shade(WW.root, -0.06));
      root(s, bez([x + 30, -46], [x + 52, -40], [x + 62, -36], [x + 78, -30]), 7, 3, WW.root);
    }
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, vgrad(s, WW.turf[0], WW.turf[1])); },
  over(s, u0, u1) {
    for (const [at, r] of [[18, 8.5], [52, 9], [88, 8], [122, 9], [150, 8.5]]) for (const x of every(u0, u1, at)) clump(s, x, -this.H + 10, r, at + 7, WW.turf);
    for (const [at, dy, r] of [[4, -4, 13], [34, -2, 12], [64, -5, 14], [96, -1, 12], [126, -4, 14], [152, -1, 11]])
      for (const x of every(u0, u1, at)) clump(s, x, -this.F + dy, r, at, WW.turf);
  },
  feature(s, u) { // mushrooms at the foot
    for (const [dx, h, r] of [[-13, 18, 9], [3, 26, 12], [17, 13, 7]]) {
      const x = u + dx;
      path(s, rrect(x - 3, -h, 6, h - 1, 2.5), s.lg([[0, '#F6ECD4'], [1, '#C9B48E']], 0, 0, 1, 0));
      path(s, `M${x - r} ${-h + 1}C${x - r} ${-h - r * 1.15} ${x + r} ${-h - r * 1.15} ${x + r} ${-h + 1}Z`, vgrad(s, '#E8A86E', '#A2522E'));
      s.add(`<ellipse cx="${f1(x - r * 0.35)}" cy="${f1(-h - r * 0.45)}" rx="${f1(r * 0.36)}" ry="${f1(r * 0.18)}" fill="#FFFFFF" opacity="0.38"/>`);
    }
  },
  bay(s) { // two roots climb either side and knot over the door
    root(s, bez([4, 2], [-4, -52], [34, -84], [84, -78]), 20, 11, WW.root);
    root(s, bez([156, 2], [164, -52], [126, -86], [76, -80]), 19, 11, shade(WW.root, -0.04));
    stone(s, blob(80, -79, 11, 8, 5, 0.12), shade(WW.root, -0.12));
  },
  post(s) { clump(s, this.H - 15, -this.H + 15, 15, 11, WW.turf); },
});
opt({
  id: 'wildwood-b', theme: 'wildwood', name: 'Log palisade', H: 98, F: 78,
  blurb: 'A stockade of standing logs lashed with rope, their cut ends showing along the top; a crossbeam over each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#3A2A1C');
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 8; i++) {
      const c = jit(WW.bark, i, 1, 0.16), lx = x + i * 20;
      vcyl(s, lx + 1, -this.F - 2, 18, this.F + 2, c, 6);
      for (const [y, l] of [[-60 + hash(i, 2) * 10, 10], [-30 + hash(i, 3) * 12, 14]]) path(s, `M${f1(lx + 6 + hash(i, 5) * 6)} ${f1(y)}v${l}`, 'none', `stroke="${shade(c, -0.35)}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"`);
    }
    for (const y of [-26, -58]) for (const x of every(u0, u1, 0)) { // rope lashings
      hcyl(s, x - 1, y - 3.5, 162, 7, '#C9A86A', 3.5);
      for (let i = 0; i < 8; i++) path(s, `M${x + i * 20 + 4} ${y - 4}l6 8`, 'none', 'stroke="#7A5E32" stroke-width="1.3" opacity="0.55"');
    }
  },
  cap(s, u0, u1) {
    bg(s, u0, u1, -this.H, -this.F, '#2C2016');
    const r = (this.H - this.F) / 2;
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 8; i++) { // the cut log ends, seen from above
      const cx = x + i * 20 + 10, cy = -this.F - r + 0.5;
      s.add(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r + 0.5)}" fill="${shade(jit(WW.bark, i, 1, 0.16), -0.15)}"/>`);
      s.add(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r - 2.2)}" fill="${s.rg([[0, shade(WW.wood, 0.15)], [1, shade(WW.wood, -0.18)]], 0.4, 0.35, 0.75)}"/>`);
      s.add(`<circle cx="${f1(cx + 0.5)}" cy="${f1(cy + 0.5)}" r="${f1(r * 0.5)}" fill="none" stroke="${shade(WW.wood, -0.3)}" stroke-width="1.1" opacity="0.6"/>`);
      s.add(`<circle cx="${f1(cx + 0.6)}" cy="${f1(cy + 0.6)}" r="1.4" fill="${shade(WW.wood, -0.4)}" opacity="0.7"/>`);
    }
  },
  feature(s, u) { // a stag's skull with antlers, nailed up
    const y = -44;
    for (const sx of [-1, 1]) {
      root(s, bez([u + sx * 6, y - 6], [u + sx * 18, y - 14], [u + sx * 22, y - 24], [u + sx * 20, y - 34]), 5, 2.5, '#E6DABE');
      root(s, bez([u + sx * 17, y - 16], [u + sx * 26, y - 18], [u + sx * 30, y - 22], [u + sx * 32, y - 26]), 3.6, 2, '#E6DABE');
    }
    path(s, blob(u, y, 9, 11, 2, 0.05, 10), s.rg([[0, '#FFFBEE'], [0.6, '#E6DABE'], [1, '#A89878']], 0.38, 0.3, 0.8));
    for (const sx of [-1, 1]) s.add(`<ellipse cx="${u + sx * 3.8}" cy="${y - 2}" rx="2.4" ry="3" fill="#2B2230" opacity="0.85"/>`);
    rivet(s, u, y - 9, 1.8, '#8E949C');
  },
  bay(s) {
    for (const x of [2, 138]) vcyl(s, x, -this.F + 4, 20, this.F - 4, shade(WW.bark, -0.08), 6);
    hcyl(s, -2, -84, 164, 16, shade(WW.bark, 0.04), 8);
    s.add(`<circle cx="-1" cy="-76" r="7" fill="${s.rg([[0, shade(WW.wood, 0.1)], [1, shade(WW.wood, -0.2)]])}"/>`);
    s.add(`<circle cx="161" cy="-76" r="7" fill="${s.rg([[0, shade(WW.wood, 0.1)], [1, shade(WW.wood, -0.2)]])}"/>`);
    for (const x of [12, 148]) { hcyl(s, x - 9, -80, 18, 8, '#C9A86A', 4); hcyl(s, x - 9, -71, 18, 7, '#C9A86A', 3.5); }
  },
  post(s) { const r = 15, cx = this.H - r - 2, cy = -this.H + r + 2; s.add(`<circle cx="${cx}" cy="${cy}" r="${r + 2}" fill="${shade(WW.bark, -0.2)}"/>`); s.add(`<circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="${s.rg([[0, shade(WW.wood, 0.15)], [1, shade(WW.wood, -0.2)]], 0.4, 0.35, 0.75)}"/>`); for (const k of [0.66, 0.36]) s.add(`<circle cx="${cx + 0.6}" cy="${cy + 0.6}" r="${f1(r * k)}" fill="none" stroke="${shade(WW.wood, -0.3)}" stroke-width="1.2" opacity="0.55"/>`); },
});
opt({
  id: 'wildwood-c', theme: 'wildwood', name: 'Mossy drystone', H: 100, F: 82,
  blurb: 'Round fieldstones stacked dry, moss on their tops and ferns along the wall; a great flat lintel over each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#3E3A2C');
    const rows = [[-13, 13, 18, 0], [-37, 12, 17, 11], [-60, 11, 16, 4], [-77, 7, 14, 14]];
    rows.forEach(([y, ry, rx, off], j) => {
      for (const b of every(u0, u1, off)) for (let x = 0, i = 0; x < P; i++) {
        const w = rx * (0.8 + hash(i, j) * 0.5); if (x + w > P - 4) { /* close the row */ }
        const cx = b + x + w, c = jit(mix('#B0AA98', '#98A07E', hash(i + 2, j)), i, j, 0.14);
        stone(s, blob(cx, y + (hash(i, j + 4) - 0.5) * 3, w, ry * (0.85 + hash(j, i) * 0.25), i * 7 + j, 0.14, 9), c);
        patch(s, cx - w * 0.2, y - ry * 0.55, w * 0.55, ry * 0.32, i + j, '#7FA840', 0.85);
        x += w * 2 - 2;
        if (x > P - rx) break;
      }
    });
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, vgrad(s, '#4E7030', '#6E9440')); },
  over(s, u0, u1) {
    for (const [at, r] of [[26, 8], [70, 8.5], [112, 8], [146, 7.5]]) for (const x of every(u0, u1, at)) clump(s, x, -this.H + 9.5, r, at + 9, ['#3E6428', '#5E8E38', '#94C454']);
    for (const [at, dy, r] of [[8, -3, 12], [46, -5, 13], [84, -2, 11], [118, -5, 13], [150, -2, 10]]) for (const x of every(u0, u1, at)) clump(s, x, -this.F + dy, r, at + 3, ['#3E6428', '#5E8E38', '#94C454']);
  },
  feature(s, u) { // a tree root bursting out between the stones
    root(s, bez([u - 30, -this.F], [u - 6, -64], [u - 26, -30], [u + 4, 2]), 22, 12, WW.root);
    root(s, bez([u - 14, -40], [u + 6, -40], [u + 18, -30], [u + 30, -24]), 9, 3, WW.root);
    root(s, bez([u - 8, -18], [u - 24, -14], [u - 30, -8], [u - 40, 0]), 8, 3, shade(WW.root, -0.05));
  },
  bay(s) {
    for (const x of [0, 136]) { stone(s, blob(x + 12, -16, 15, 16, x, 0.08), '#C2B8A0'); stone(s, blob(x + 12, -44, 13, 13, x + 1, 0.08), '#C8BEA6'); }
    stone(s, smooth([[4, -68], [80, -78], [156, -68], [160, -55], [80, -58], [0, -55]], 0.5), '#CCC2A8', { lift: 0.25 });
    patch(s, 50, -70, 22, 4, 3, '#7FA840', 0.9); patch(s, 118, -69, 16, 3.5, 4, '#7FA840', 0.9);
  },
  post(s) { clump(s, this.H - 14, -this.H + 14, 14, 21, ['#3E6428', '#5E8E38', '#94C454']); },
});

// =============================================================================== THE WARREN: goblin tunnels
const WR = { earth: '#A47650', earthDk: '#7A5434', timber: '#7A5232', plank: ['#A87A4A', '#8E6A42', '#B58A56', '#9C7048'], iron: '#5E5A62', straw: '#D9B862' };
function lantern(s, x, y, k = 1) { // a hanging lantern, its top at (x, y)
  s.add(`<circle cx="${f1(x)}" cy="${f1(y + 14 * k)}" r="${f1(20 * k)}" fill="${s.rg([[0, '#FFC66A', 0.5], [1, '#FF9A3D', 0]], 0.5, 0.5, 0.5)}"/>`);
  block(s, x - 7 * k, y, 14 * k, 5 * k, WR.iron, { r: 1.5, gloss: false });
  path(s, rrect(x - 6 * k, y + 5 * k, 12 * k, 15 * k, 3 * k), s.lg([[0, '#FFF2C0'], [1, '#FFB04A']]));
  for (const dx of [-6, 0, 6]) path(s, `M${f1(x + dx * k)} ${f1(y + 5 * k)}v${f1(15 * k)}`, 'none', `stroke="#3A3238" stroke-width="${f1(1.6 * k)}"`);
  block(s, x - 7.5 * k, y + 19 * k, 15 * k, 5 * k, WR.iron, { r: 1.5, gloss: false });
}
opt({
  id: 'warren-a', theme: 'warren', name: 'Shored tunnel', H: 100, F: 82,
  blurb: 'Dug earth held up by thick timber posts, boards and a heavy top beam with iron brackets; lanterns hang here and there.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, vgrad(s, shade(WR.earth, 0.05), WR.earthDk));
    for (const [at, y, rx, ry] of [[40, -16, 14, 9], [116, -22, 12, 8], [62, -36, 8, 6]]) for (const x of every(u0, u1, at)) stone(s, blob(x, y, rx, ry, at, 0.14), '#B09A7E');
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 2; i++) for (let b = 0; b < 2; b++) // boards between the posts
      block(s, x + i * 80 + 10, -this.F + 18 + b * 17, 60, 16, jit(WR.plank[(i + b) % 4], i, b, 0.1), { r: 2.5, glossH: 3 });
    for (const x of every(u0, u1, 0)) for (const px of [0, 80]) vcyl(s, x + px - 12, -this.F + 12, 24, this.F - 12, jit(WR.timber, px, 2, 0.08), 3);
    for (const x of every(u0, u1, 0)) hcyl(s, x - 2, -this.F, 164, 20, shade(WR.timber, 0.06), 4);
    for (const x of every(u0, u1, 0)) for (const px of [0, 80]) { block(s, x + px - 9, -this.F + 13, 18, 14, WR.iron, { r: 2, glossH: 3 }); rivet(s, x + px - 4, -this.F + 20, 1.9, '#A8A2AC'); rivet(s, x + px + 4, -this.F + 20, 1.9, '#A8A2AC'); }
  },
  cap(s, u0, u1) {
    bg(s, u0, u1, -this.H, -this.F, vgrad(s, '#5E4430', '#8A6444'));
    for (const [at, r] of [[10, 7], [46, 5], [92, 8], [132, 6]]) for (const x of every(u0, u1, at)) stone(s, blob(x, -this.F - 9, r * 1.3, r, at, 0.14), '#A89A86');
  },
  featureOver(s, u) { path(s, `M${u} ${-this.F + 20}V${-this.F + 26}`, 'none', 'stroke="#3A3238" stroke-width="2"'); lantern(s, u, -this.F + 26, 1.5); },
  feature() {},
  bay(s) {
    for (const x of [0, 136]) vcyl(s, x, -this.F + 8, 24, this.F - 8, shade(WR.timber, 0.02), 3);
    hcyl(s, -2, -80, 164, 20, shade(WR.timber, 0.1), 4);
    for (const x of [12, 148]) { block(s, x - 12, -84, 24, 26, WR.iron, { r: 2, glossH: 3 }); for (const [dx, dy] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) rivet(s, x + dx, -71 + dy, 2, '#A8A2AC'); }
    skull(s, 80, -71, 1, '#E6D8B8');
  },
  post(s) { vcyl(s, this.H - 26, -this.H, 24, 24, shade(WR.timber, 0.05), 12); },
});
opt({
  id: 'warren-b', theme: 'warren', name: 'Junk stockade', H: 102, F: 80,
  blurb: 'Goblin work: odd planks nailed every which way, an iron band, sharpened stakes along the top, shields hung up.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#3A2618');
    const rows = [[-20, 20], [-40, 20], [-60, 20], [-80, 20]];
    rows.forEach(([y, h], j) => {
      const ws = [[52, 60, 48], [40, 72, 48], [64, 44, 52], [48, 56, 56]][j];
      courses(s, u0, u1, y + h, [{ h, w: ws, off: j * 17 }], (i) => jit(WR.plank[(i + j) % 4], i, j, 0.12), { r: 2.5, gap: 2.5, glossH: 3, each: (x, yt, bw, hh) => { rivet(s, x + 5, yt + hh / 2, 1.5, '#9A949E'); rivet(s, x + bw - 6, yt + hh / 2, 1.5, '#9A949E'); } });
    });
    for (const x of every(u0, u1, 0)) { hcyl(s, x - 1, -44, 162, 9, WR.iron, 2); for (let i = 0; i < 4; i++) rivet(s, x + 20 + i * 40, -39.5, 2.2, '#B0AAB4'); }
  },
  cap(s, u0, u1) {
    bg(s, u0, u1, -this.H, -this.F, '#2C1C12');
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 10; i++) { // stakes, their points out of the room
      const cx = x + i * 16 + 8, top = -this.H + 1 + hash(i, 3) * 3, c = jit('#B48A58', i, 5, 0.1);
      path(s, `M${cx - 7} ${-this.F + 1}V${top + 8}L${cx} ${top}L${cx + 7} ${top + 8}V${-this.F + 1}Z`, s.lg([[0, shade(c, 0.15)], [1, shade(c, -0.25)]], 0, 0, 1, 0));
      path(s, `M${cx - 3} ${top + 6}L${cx} ${top + 1}L${cx + 3} ${top + 6}Z`, '#F2DCB0', 'opacity="0.7"');
    }
    for (const x of every(u0, u1, 0)) hcyl(s, x - 1, -this.F - 9, 162, 5, '#C9A86A', 2.5);
  },
  feature(s, u) { // a round goblin shield
    s.add(`<circle cx="${u}" cy="-52" r="19" fill="${s.rg([[0, '#F0A848'], [0.7, '#D2782A'], [1, '#9A4E1C']], 0.38, 0.3, 0.8)}"/>`);
    s.add(`<circle cx="${u}" cy="-52" r="19" fill="none" stroke="${WR.iron}" stroke-width="4"/>`);
    path(s, `M${u - 12} -52H${u + 12}M${u} -64V-40`, 'none', 'stroke="#7A3A16" stroke-width="3" opacity="0.6"');
    rivet(s, u, -52, 5, '#A8A2AC');
  },
  bay(s) {
    for (const x of [0, 140]) for (let i = 0; i < 4; i++) block(s, x + (i % 2) * 2, -14 - i * 16, 20, 15, jit(WR.plank[i % 4], i, x, 0.1), { r: 2, glossH: 3 });
    block(s, -2, -82, 164, 16, WR.plank[3], { r: 2.5, glossH: 4 });
    for (const x of [10, 150]) rivet(s, x, -74, 2.4, '#A8A2AC');
    for (const sx of [24, 136]) { s.add(`<circle cx="${sx}" cy="-74" r="11" fill="${s.rg([[0, '#F0A848'], [1, '#9A4E1C']], 0.38, 0.3, 0.8)}"/>`); s.add(`<circle cx="${sx}" cy="-74" r="11" fill="none" stroke="${WR.iron}" stroke-width="3"/>`); rivet(s, sx, -74, 3, '#A8A2AC'); }
    skull(s, 80, -74, 0.9, '#E6D8B8');
  },
  post(s) { const c = this.H - 14; path(s, `M${c - 12} ${-this.H + 26}L${c - 10} ${-this.H + 4}L${c + 12} ${-this.H + 2}L${c + 12} ${-this.H + 26}Z`, s.lg([[0, '#C99A62'], [1, '#7E5A36']])); },
});
// =============================================================================== THE SEWERS: brick, pipes, slime
const SW = { brick: '#9A6A52', mortar: '#4E443A', stone: '#8E9478', cap: '#A3A88E', moss: '#6E9A3E', slime: '#9CCB4A', copper: '#B97A48', verd: '#6FB096', tile: '#CFE0C8', tileDk: '#3F7360' };
const slimeDrip = (s, x, y0, len, w = 6) => { path(s, `M${x - w / 2} ${y0}V${y0 + len - w / 2}a${w / 2} ${w / 2} 0 0 0 ${w} 0V${y0}Z`, s.lg([[0, SW.slime, 0.9], [1, shade(SW.slime, -0.2), 0.9]])); path(s, rrect(x - w / 2 + 1.2, y0 + 2, w * 0.3, len - w, w * 0.15), '#FFFFFF', 'opacity="0.35"'); };
opt({
  id: 'sewers-a', theme: 'sewers', name: 'Sewer brick', H: 100, F: 84,
  blurb: 'Old red brick on a green stone footing, moss and slime running down it; brick arches over the doors.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, SW.mortar);
    courses(s, u0, u1, 0, [{ h: 18, w: [80, 80], off: 24, k: 1 }], (i) => jit(SW.stone, i, 0, 0.1), { r: 4 });
    const rows = []; for (let j = 0; j < 5; j++) rows.push({ h: 13.2, w: [40, 40, 40, 40], off: (j % 2) * 20 });
    courses(s, u0, u1, -18, rows, (i, j) => jit(SW.brick, i * 3 + j, j, 0.16), { r: 3, gap: 2.6, glossH: 3 });
    for (const [at, y, rx] of [[30, -16, 30], [120, -20, 22], [80, -10, 18]]) for (const x of every(u0, u1, at)) patch(s, x, y, rx, 9, at, SW.moss, 0.9);
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, SW.mortar); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [80, 80], off: 0 }], (i) => jit(SW.cap, i, 1, 0.08), { r: 4, glossH: 4 }); },
  over(s, u0, u1) {
    for (const [at, len] of [[46, 30], [52, 18], [132, 40]]) for (const x of every(u0, u1, at)) slimeDrip(s, x, -this.F - 2, len, at === 52 ? 4.5 : 6);
    for (const [at, rx] of [[20, 20], [96, 26], [146, 14]]) for (const x of every(u0, u1, at)) patch(s, x, -this.F - 3, rx, 6, at, SW.moss, 0.95);
  },
  feature(s, u) { // a drain outlet: a round mouth with bars and a green trickle
    path(s, blob(u, -44, 22, 22, 2, 0.02, 12), vgrad(s, shade(SW.stone, 0.15), shade(SW.stone, -0.15)));
    s.add(`<circle cx="${u}" cy="-44" r="15" fill="${s.rg([[0, '#0E140E'], [1, '#2A3424']], 0.5, 0.6, 0.6)}"/>`);
    for (const dx of [-8, 0, 8]) vcyl(s, u + dx - 2, -58, 4, 28, '#5E6662', 2);
    path(s, `M${u - 9} -31C${u - 9} -16 ${u - 3} -6 ${u - 5} 0H${u + 7}C${u + 6} -8 ${u + 9} -18 ${u + 9} -31Z`, s.lg([[0, SW.slime, 0.85], [1, '#7AA83A', 0.85]], 0, 0, 1, 0));
  },
  bay(s) {
    piers(s, { col: SW.stone, top: -26 });
    hood(s, { grout: SW.mortar, n: 7, col: (i) => jit(SW.brick, i, 9, 0.16), gap: 0.1 });
    path(s, 'M70 -82H90L87 -58H73Z', s.lg([[0, shade(SW.cap, 0.18)], [1, shade(SW.cap, -0.12)]]));
  },
  bayOver(s) { slimeDrip(s, 118, -60, 22, 5); },
  post(s) { capstone(s, this.H, 26, shade(SW.cap, 0.04)); },
});
opt({
  id: 'sewers-b', theme: 'sewers', name: 'Pipe wall', H: 104, F: 86,
  blurb: 'Green stone blocks carrying two big copper pipes, flanged and bolted, valve wheels and gauges here and there.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, SW.mortar);
    courses(s, u0, u1, 0, [{ h: 22, w: [56, 48, 56], off: 0 }, { h: 22, w: [64, 48, 48], off: 30 }, { h: 22, w: [48, 56, 56], off: 12 }, { h: 20, w: [80, 80], off: 44 }], (i, j) => jit(SW.stone, i, j, 0.12), { r: 4 });
    for (const [y, d] of [[-40, 18], [-74, 13]]) for (const x of every(u0, u1, 0)) {
      hcyl(s, x - 1, y, 162, d, SW.copper);
      patch(s, x + 50, y + d * 0.4, 14, d * 0.3, y, SW.verd, 0.9); patch(s, x + 130, y + d * 0.6, 10, d * 0.25, y + 1, SW.verd, 0.8);
      for (const fx of [0, 80]) { hcyl(s, x + fx - 4, y - 3, 8, d + 6, shade(SW.copper, -0.12), 2.5); rivet(s, x + fx, y - 0.5, 1.6, '#D8C8A8'); rivet(s, x + fx, y + d + 0.5, 1.6, '#D8C8A8'); }
    }
    for (const x of every(u0, u1, 40)) { block(s, x - 3, -22, 6, 6, '#5E6662', { r: 1, gloss: false }); block(s, x - 3, -60, 6, 8, '#5E6662', { r: 1, gloss: false }); }
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, SW.mortar); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [40, 40, 40, 40], off: 20 }], (i) => jit(SW.cap, i, 4, 0.08), { r: 4, glossH: 4 }); },
  over(s, u0, u1) { for (const [at, len] of [[100, 26], [24, 16]]) for (const x of every(u0, u1, at)) slimeDrip(s, x, -this.F - 2, len, 5); },
  feature(s, u) { // a valve wheel and a gauge
    const y = -31;
    s.add(`<circle cx="${u - 20}" cy="${y - 12}" r="13" fill="none" stroke="#C0302A" stroke-width="4"/>`);
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; path(s, `M${f1(u - 20 - Math.cos(a) * 12)} ${f1(y - 12 - Math.sin(a) * 12)}L${f1(u - 20 + Math.cos(a) * 12)} ${f1(y - 12 + Math.sin(a) * 12)}`, 'none', 'stroke="#C0302A" stroke-width="3"'); }
    rivet(s, u - 20, y - 12, 3.4, '#D8C8A8');
    s.add(`<circle cx="${u + 18}" cy="${y - 14}" r="12" fill="${s.rg([[0, '#F6F2E2'], [1, '#C9C2A8']])}" stroke="${shade(SW.copper, -0.2)}" stroke-width="3.5"/>`);
    path(s, `M${u + 18} ${y - 14}L${u + 24} ${y - 21}`, 'none', 'stroke="#2B2230" stroke-width="1.8" stroke-linecap="round"');
  },
  bay(s) {
    piers(s, { col: shade(SW.stone, 0.04), top: -28 });
    for (const x of [6, 144]) { vcyl(s, x, -86, 10, 60, SW.copper, 5); }
    path(s, tube(bez([11, -84], [11, -100], [149, -100], [149, -84]).map(([x, y]) => [x, Math.max(y, -94)]), 10, 10), shade(SW.copper, -0.25));
    hcyl(s, 6, -92, 148, 10, SW.copper);
    s.add(`<circle cx="80" cy="-74" r="11" fill="none" stroke="#C0302A" stroke-width="3.5"/>`);
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; path(s, `M${f1(80 - Math.cos(a) * 10)} ${f1(-74 - Math.sin(a) * 10)}L${f1(80 + Math.cos(a) * 10)} ${f1(-74 + Math.sin(a) * 10)}`, 'none', 'stroke="#C0302A" stroke-width="2.6"'); }
    rivet(s, 80, -74, 3, '#D8C8A8');
  },
  post(s) { capstone(s, this.H, 26, shade(SW.cap, 0.04)); },
});
opt({
  id: 'sewers-c', theme: 'sewers', name: 'Glazed tile', H: 98, F: 82,
  blurb: 'The city\'s old tiled tunnels: pale green glazed tiles, a dark green band, grime creeping up from the foot.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#6E7A68');
    const T = 20, rows = [];
    for (let j = 0; j < 4; j++) rows.push({ h: T, w: [20, 20, 20, 20, 20, 20, 20, 20], off: 0, dark: j === 2 });
    courses(s, u0, u1, -2, rows, (i, j, row) => (row.dark ? jit(SW.tileDk, i, j, 0.12) : jit(SW.tile, i * 7, j, 0.07)), { r: 3, gap: 2.4, glossH: 4, glossA: 0.4, lift: 0.1, drop: 0.12 });
    wash(s, u0 - 2, -34, u1 - u0 + 4, 0, '#5A4E2A', 0, 0.55);
    for (const [at, rx] of [[30, 26], [110, 34]]) for (const x of every(u0, u1, at)) patch(s, x, -6, rx, 10, at, '#6E5E34', 0.7);
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, SW.mortar); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [40, 40, 40, 40], off: 0 }], (i) => jit('#A8705A', i, 3, 0.1), { r: 3, glossH: 4 }); },
  over(s, u0, u1) { for (const [at, len] of [[60, 34], [140, 20]]) for (const x of every(u0, u1, at)) slimeDrip(s, x, -this.F - 2, len, 5.5); },
  feature(s, u) { // a round grate
    s.add(`<circle cx="${u}" cy="-42" r="24" fill="${s.rg([[0, shade(SW.tileDk, 0.2)], [1, shade(SW.tileDk, -0.2)]])}"/>`);
    s.add(`<circle cx="${u}" cy="-42" r="18" fill="${s.rg([[0, '#101810'], [1, '#2A3828']], 0.5, 0.6, 0.6)}"/>`);
    for (const dy of [-10, -3.5, 3, 9.5]) { const w = Math.sqrt(324 - dy * dy) * 2; hcyl(s, u - w / 2, -42 + dy - 2, w, 4, '#7A847E', 2); }
  },
  bay(s) {
    for (const x of [0, 140]) for (let j = 0; j < 4; j++) block(s, x, -20 - j * 20 + 1, 20, 19, jit(SW.tileDk, j, x, 0.1), { r: 3, glossH: 4, glossA: 0.35 });
    hood(s, { grout: '#6E7A68', n: 6, col: (i) => jit(SW.tileDk, i, 2, 0.12), gap: 0.08 });
    block(s, 70, -84, 20, 22, jit(SW.tile, 1, 1, 0.05), { r: 3, glossA: 0.4 });
  },
  post(s) { capstone(s, this.H, 24, '#B07A62'); },
});

// =============================================================================== THE FROST HOLLOW: ice
const FR = { ice: '#9DD2EC', iceDk: '#5E9CC4', snow: '#F2F8FC', snowSh: '#B8CCDC', rock: '#5E6E84', rime: '#E4F2FA' };
const SNOW = ['#AFC4D8', '#E4EEF6', '#FFFFFF'];
function snowCap(s, o, u0, u1, seed) { bg(s, u0, u1, -o.H, -o.F, vgrad(s, '#C4D6E4', '#DCE8F2')); }
function snowOver(s, o, u0, u1, seed) { // pillows of snow along the top, the front ones hanging over the face
  for (const [at, r] of [[14, 8.5], [46, 9], [80, 8], [112, 9], [144, 8.5]]) for (const x of every(u0, u1, at)) clump(s, x, -o.H + 10, r, at + seed, SNOW);
  for (const [at, dy, r] of [[0, -3, 12], [30, -1, 13], [62, -4, 12], [94, -1, 13], [128, -3, 12], [154, 0, 10]]) for (const x of every(u0, u1, at)) clump(s, x, -o.F + dy, r, at + seed + 3, SNOW);
}
function hangIcicles(s, o, u0, u1, list) { for (const [at, len, w] of list) for (const x of every(u0, u1, at)) icicle(s, x, -o.F + 2, len, w); }
opt({
  id: 'frost-a', theme: 'frost', name: 'Ice blocks', H: 104, F: 84,
  blurb: 'Big glassy blocks of blue ice, snow heaped along the top and icicles hanging down; an ice arch over each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#4A7EA4');
    courses(s, u0, u1, 0, [{ h: 28, w: [64, 48, 48], off: 0 }, { h: 28, w: [48, 64, 48], off: 34 }, { h: 28, w: [56, 48, 56], off: 12 }], (i, j) => jit(mix(FR.ice, '#B8E2F4', hash(i, j)), i, j, 0.08), { r: 6, glossH: 6, glossA: 0.45, lift: 0.22, drop: 0.2, gap: 3.4,
      each: (x, yt, bw, h, i, j) => { path(s, `M${f1(x + bw * 0.62)} ${f1(yt + 6)}l${f1(bw * 0.18)} ${f1(h * 0.18)}l${f1(-bw * 0.12)} ${f1(h * 0.42)}`, 'none', 'stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"'); } });
  },
  cap(s, u0, u1) { snowCap(s, this, u0, u1, 1); },
  over(s, u0, u1) { hangIcicles(s, this, u0, u1, [[12, 26, 10], [24, 14, 7], [46, 36, 11], [76, 18, 7], [104, 28, 10], [134, 34, 11], [148, 14, 6]]); snowOver(s, this, u0, u1, 1); },
  feature(s, u) { // a sword frozen in the ice
    const y = -46;
    path(s, rrect(u - 36, y - 22, 72, 44, 8), '#2E6A94', 'opacity="0.55"');
    path(s, `M${u - 26} ${y + 10}L${u + 12} ${y - 9}L${u + 17} ${y - 3}L${u - 23} ${y + 14}Z`, s.lg([[0, '#FFFFFF'], [1, '#9AA4B6']]));
    path(s, `M${u + 9} ${y - 15}L${u + 21} ${y + 2}`, 'none', 'stroke="#E2B23C" stroke-width="5" stroke-linecap="round"');
    path(s, `M${u + 15} ${y - 7}L${u + 26} ${y - 13}`, 'none', 'stroke="#7A4A2A" stroke-width="5" stroke-linecap="round"');
    s.add(`<circle cx="${u + 28}" cy="${y - 14}" r="3.4" fill="#E2B23C"/>`);
    path(s, rrect(u - 36, y - 22, 72, 44, 8), s.lg([[0, '#FFFFFF', 0.35], [0.5, '#FFFFFF', 0.05], [1, '#FFFFFF', 0.15]]));
    path(s, `M${u - 30} ${y - 16}l16 0`, 'none', 'stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.7"');
  },
  bay(s) {
    piers(s, { col: '#B4E0F4', top: -26 });
    hood(s, { grout: '#4A7EA4', col: (i) => jit('#C2E8F8', i, 4, 0.08), gap: 0.1 });
    block(s, 69, -86, 22, 26, '#D8F2FC', { r: 4, glossA: 0.5 });
  },
  bayOver(s) { for (const [x, len, w] of [[30, 16, 6], [44, 24, 8], [62, 12, 5], [98, 14, 5], [116, 26, 8], [130, 14, 6]]) icicle(s, x, -64 + Math.abs(x - 80) * 0.3, len, w); },
  post(s) { clump(s, this.H - 13, -this.H + 13, 13, 9, SNOW); },
});
opt({
  id: 'frost-b', theme: 'frost', name: 'Frosted rock', H: 102, F: 82,
  blurb: 'Dark blue-grey rock with white rime on every stone, snow along the top and long icicles; a stone lintel heavy with snow.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#2E3A4A');
    const rows = [[-14, 14, 26, 0], [-40, 13, 24, 13], [-64, 12, 22, 5]];
    rows.forEach(([y, ry, rx, off], j) => {
      for (const b of every(u0, u1, off)) for (let x = 0, i = 0; x < P; i++) {
        const w = rx * (0.8 + hash(i, j + 9) * 0.45), cx = b + x + w, c = jit(FR.rock, i, j, 0.14);
        stone(s, blob(cx, y, w, ry * (0.9 + hash(j, i) * 0.2), i * 5 + j, 0.12, 9), c);
        path(s, blob(cx - w * 0.1, y - ry * 0.62, w * 0.7, ry * 0.3, i + j * 3, 0.2, 8), FR.rime, 'opacity="0.9"');
        x += w * 2 - 2; if (x > P - rx) break;
      }
    });
  },
  cap(s, u0, u1) { snowCap(s, this, u0, u1, 4); },
  over(s, u0, u1) { hangIcicles(s, this, u0, u1, [[8, 32, 10], [22, 18, 7], [52, 42, 11], [66, 20, 7], [96, 26, 9], [122, 36, 10], [140, 16, 6]]); snowOver(s, this, u0, u1, 4); },
  feature(s, u) { // a frozen waterfall down the face
    path(s, `M${u - 16} ${-this.F}C${u - 20} -50 ${u - 14} -24 ${u - 22} 0H${u + 22}C${u + 14} -24 ${u + 20} -50 ${u + 16} ${-this.F}Z`, s.lg([[0, '#E8F8FF'], [0.5, '#A8DCF4'], [1, '#78B8E0']], 0, 0, 1, 0), 'opacity="0.95"');
    for (const dx of [-8, 2, 10]) path(s, `M${u + dx} ${-this.F + 4}C${u + dx - 2} -50 ${u + dx + 2} -26 ${u + dx - 1} -4`, 'none', 'stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.55"');
  },
  bay(s) {
    for (const x of [0, 138]) { stone(s, blob(x + 11, -15, 14, 15, x, 0.08), FR.rock); stone(s, blob(x + 11, -42, 12, 13, x + 2, 0.08), shade(FR.rock, 0.06)); path(s, blob(x + 9, -51, 9, 3.5, x, 0.2, 8), FR.rime); }
    stone(s, smooth([[4, -66], [80, -74], [156, -66], [158, -54], [80, -58], [2, -54]], 0.5), shade(FR.rock, 0.06));
    for (const [x, r] of [[14, 8], [36, 9], [58, 8], [80, 9], [102, 8], [124, 9], [146, 8]]) clump(s, x, -72 - (x > 30 && x < 130 ? 4 : 0), r, x, SNOW);
  },
  bayOver(s) { for (const [x, len, w] of [[22, 20, 7], [40, 30, 9], [58, 14, 6], [104, 16, 6], [122, 28, 9], [140, 18, 7]]) icicle(s, x, -58 - (x > 40 && x < 120 ? 3 : 0), len, w); },
  post(s) { clump(s, this.H - 13, -this.H + 13, 13, 7, SNOW); },
});
opt({
  id: 'frost-c', theme: 'frost', name: 'Crystal ridge', H: 110, F: 82,
  blurb: 'Packed snow and ice in blue bands, topped with a ridge of big ice crystals; crystals crown each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#5E9CC4');
    const ys = [0, -26, -54, -this.F], X = (i) => i * 32 + (i % 5 ? (hash(i % 5, 1) - 0.5) * 14 : 0), Y = (i, j) => (j === 0 || j === 3 ? ys[j] : ys[j] + (hash(i % 5, j) - 0.5) * 12);
    for (const b of every(u0, u1, 0)) for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { // facets: each cell two triangles, each lit its own way
      const a = [b + X(i), Y(i, j)], c = [b + X(i + 1), Y(i + 1, j)], d = [b + X(i + 1), Y(i + 1, j + 1)], e = [b + X(i), Y(i, j + 1)];
      const tris = (i + j) % 2 ? [[a, c, d], [a, d, e]] : [[a, c, e], [c, d, e]];
      tris.forEach((t, k) => { const v = hash(i % 5 + k * 7, j + 3); path(s, poly(t), mix('#7FC0E6', '#E2F6FF', v * 0.85), `stroke="#FFFFFF" stroke-width="0.9" stroke-opacity="0.35" stroke-linejoin="round"`); });
    }
  },
  cap(s, u0, u1) {
    bg(s, u0, u1, -this.H, -this.F, '#6E9CC0');
    const cr = (x, len, w, lean, c) => { // a crystal lying out of the room: a long hexagonal prism seen from above
      const tip = [x + lean, -this.F - len], L = [x - w / 2, -this.F + 4], R = [x + w / 2, -this.F + 4];
      path(s, poly([L, [x - w / 2 + lean * 0.7, -this.F - len + w * 0.7], tip, [x + w / 2 + lean * 0.7, -this.F - len + w * 0.7], R]), s.lg([[0, shade(c, 0.35)], [0.5, c], [1, shade(c, -0.25)]], 0, 0, 1, 0));
      path(s, poly([[x, -this.F + 4], [x + lean * 0.8, -this.F - len + w * 0.6], tip, [x + w / 2 + lean * 0.7, -this.F - len + w * 0.7], R]), shade(c, -0.15), 'opacity="0.5"');
      path(s, `M${f1(x - w * 0.22)} ${-this.F}L${f1(x - w * 0.22 + lean * 0.6)} ${f1(-this.F - len * 0.7)}`, 'none', 'stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.75"');
    };
    for (const x of every(u0, u1, 0)) for (const [dx, len, w, lean] of [[8, 22, 12, -2], [24, 30, 15, 2], [44, 20, 11, 3], [62, 28, 14, -3], [82, 24, 13, 1], [100, 30, 15, -1], [120, 20, 11, 2], [140, 26, 14, -2]])
      cr(x + dx, Math.min(len, this.H - this.F + 2), w, lean, mix('#A8E0F8', '#7FC4EC', hash(dx, 1)));
  },
  feature(s, u) { // a snowflake carved in the ice
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; path(s, `M${f1(u - Math.cos(a) * 18)} ${f1(-40 - Math.sin(a) * 18)}L${f1(u + Math.cos(a) * 18)} ${f1(-40 + Math.sin(a) * 18)}`, 'none', 'stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity="0.75"'); }
    s.add(`<circle cx="${u}" cy="-40" r="5" fill="#FFFFFF" opacity="0.8"/>`);
  },
  bay(s) {
    for (const x of [2, 140]) { vcyl(s, x, -66, 18, 66, '#9ED4F0', 3); path(s, `M${x} -66L${x + 9} -76L${x + 18} -66Z`, s.lg([[0, '#E4F6FF'], [1, '#8CC8EA']], 0, 0, 1, 0)); }
    for (const [x, len, w, lean] of [[52, 18, 12, -4], [66, 26, 15, -2], [80, 34, 17, 0], [94, 26, 15, 2], [108, 18, 12, 4]]) {
      const base = -60, tip = [x + lean, base - len];
      path(s, poly([[x - w / 2, base + 4], [x - w / 2 + lean * 0.7, base - len + w * 0.7], tip, [x + w / 2 + lean * 0.7, base - len + w * 0.7], [x + w / 2, base + 4]]), s.lg([[0, '#E4F6FF'], [0.5, '#A8E0F8'], [1, '#6AAED8']], 0, 0, 1, 0));
      path(s, `M${f1(x - w * 0.2)} ${base}L${f1(x - w * 0.2 + lean * 0.6)} ${f1(base - len * 0.7)}`, 'none', 'stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.8"');
    }
  },
  post(s) { for (const [dx, dy, r] of [[-14, 10, 12], [-6, 18, 9]]) stone(s, blob(this.H + dx, -this.H + dy, r, r, dx, 0.1, 6), '#A8E0F8'); },
});

// =============================================================================== THE EMBER DEEP: basalt and fire
const EM = { basalt: '#4A3634', basaltLt: '#6A4E48', lava: '#FF7A2F', glow: '#FFC85A', brick: '#6E3A30', iron: '#3E3438' };
const lavaFoot = (s, u0, u1, h = 10) => { rect(s, u0 - 2, -h, u1 - u0 + 4, h, s.lg([[0, EM.lava, 0], [0.55, EM.lava, 0.6], [1, EM.glow, 0.95]])); rect(s, u0 - 2, -3, u1 - u0 + 4, 3, '#FFF0B0', 'opacity="0.8"'); };
opt({
  id: 'ember-a', theme: 'ember', name: 'Basalt columns', H: 106, F: 84,
  blurb: 'Black basalt in tall six-sided columns, their tops showing along the wall; lava glowing in the cracks at the foot.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#1E1412');
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 8; i++) {
      const cx = x + i * 20, k = (hash(i, 3) - 0.5) * 0.16, top = -this.F - 2 + hash(i, 6) * 8;
      path(s, poly([[cx + 1, 0], [cx + 1, top + 4], [cx + 10, top], [cx + 10, 0]]), s.lg([[0, shade('#7A5248', k)], [0.7, shade('#5E3E36', k)], [1, '#C8582A']]));
      path(s, poly([[cx + 10, 0], [cx + 10, top], [cx + 19, top + 4], [cx + 19, 0]]), s.lg([[0, shade('#3A2624', k)], [0.75, shade('#2E1E1C', k)], [1, '#8A3418']]));
      const c = '#4A3634';
      path(s, rrect(cx + 3.5, top + 6, 2.6, -top - 10, 1.3), '#FFFFFF', 'opacity="0.18"');
      for (const y of [-30 - hash(i, 2) * 20, -60 - hash(i, 4) * 10]) path(s, `M${cx + 1} ${f1(y)}l9 -3l9 3`, 'none', `stroke="${shade(c, -0.45)}" stroke-width="1.4" opacity="0.7"`);
    }
    lavaFoot(s, u0, u1, 20);
    for (const x of every(u0, u1, 50)) path(s, `M${x} 0L${x - 3} -10L${x + 2} -18`, 'none', `stroke="${EM.glow}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"`);
  },
  ao: 0.18,
  cap(s, u0, u1) {
    bg(s, u0, u1, -this.H, -this.F, '#1A1110');
    const r = 9.6;
    for (const x of every(u0, u1, 0)) for (let j = 0; j < 2; j++) for (let i = 0; i < 9; i++) { // hexagon tops seen from above
      const cx = x + i * 18.2 + (j % 2) * 9.1, cy = -this.F - 5 - j * 15.4, c = jit(EM.basaltLt, i, j, 0.16);
      const pts = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      path(s, poly(pts), s.lg([[0, shade(c, 0.18)], [1, shade(c, -0.22)]], 0, 0, 0.4, 1));
      path(s, poly(pts.map(([px, py]) => [cx + (px - cx) * 0.5 - 1, cy + (py - cy) * 0.5 - 1.2])), '#FFFFFF', 'opacity="0.12"');
    }
  },
  feature(s, u) { // a lava seep running down a crack
    path(s, `M${u - 4} ${-this.F + 6}C${u + 6} -60 ${u - 8} -40 ${u + 2} -20C${u + 6} -10 ${u - 2} -4 ${u} 0`, 'none', `stroke="${EM.lava}" stroke-width="7" stroke-linecap="round" opacity="0.9"`);
    path(s, `M${u - 4} ${-this.F + 6}C${u + 6} -60 ${u - 8} -40 ${u + 2} -20C${u + 6} -10 ${u - 2} -4 ${u} 0`, 'none', `stroke="${EM.glow}" stroke-width="2.6" stroke-linecap="round"`);
    s.add(`<ellipse cx="${u}" cy="-40" rx="16" ry="40" fill="${s.rg([[0, EM.lava, 0.35], [1, EM.lava, 0]], 0.5, 0.5, 0.5)}"/>`);
  },
  bay(s) {
    for (const x of [0, 140]) { path(s, poly([[x, 0], [x, -72], [x + 10, -76], [x + 10, 0]]), shade(EM.basalt, 0.2)); path(s, poly([[x + 10, 0], [x + 10, -76], [x + 20, -72], [x + 20, 0]]), shade(EM.basalt, -0.2)); }
    block(s, -2, -88, 164, 20, '#4A3A3E', { r: 3, glossH: 4, lift: 0.2, drop: 0.3 });
    path(s, `M8 -78L30 -80L44 -76L62 -79`, 'none', `stroke="${EM.lava}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"`);
    path(s, `M98 -79L116 -76L132 -80L152 -77`, 'none', `stroke="${EM.lava}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"`);
    s.add(`<circle cx="80" cy="-78" r="8" fill="${s.rg([[0, '#FFF0B0'], [0.5, EM.glow], [1, EM.lava]])}"/>`);
  },
  post(s) { const cx = this.H - 13, cy = -this.H + 13, r = 13, pts = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } path(s, poly(pts), s.lg([[0, shade(EM.basaltLt, 0.2)], [1, shade(EM.basaltLt, -0.2)]], 0, 0, 0.4, 1)); },
});
opt({
  id: 'ember-b', theme: 'ember', name: 'Hell brick', H: 104, F: 86,
  blurb: 'Dark red brick with fire glowing in the joints near the floor, an iron cap set with spikes; horned skulls over the doors.',
  face(s, u0, u1) {
    rect(s, u0 - 2, -this.F, u1 - u0 + 4, this.F, s.lg([[0, '#2A1410'], [0.55, '#5A1C10'], [1, '#FF7A2F']]));
    const rows = []; for (let j = 0; j < 6; j++) rows.push({ h: 14.33, w: [32, 32, 32, 32, 32], off: (j % 2) * 16 });
    courses(s, u0, u1, 0, rows, (i, j) => jit(EM.brick, i * 5 + j, j, 0.18), { r: 3, gap: 3, glossH: 3, glossA: 0.14 });
    wash(s, u0 - 2, -26, u1 - u0 + 4, 0, EM.lava, 0, 0.25);
  },
  ao: 0.12,
  cap(s, u0, u1) {
    bg(s, u0, u1, -this.H, -this.F, EM.iron);
    rect(s, u0 - 2, -this.H, u1 - u0 + 4, this.H - this.F, s.lg([[0, '#2A2226'], [1, '#56484E']]));
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 8; i++) { const cx = x + i * 20 + 10, cy = -this.F - (this.H - this.F) / 2; // spikes, seen from above: cones
      s.add(`<circle cx="${cx}" cy="${f1(cy)}" r="5.6" fill="${s.rg([[0, '#C8BEC4'], [0.35, '#7E7278'], [1, '#2E2428']], 0.38, 0.32, 0.75)}"/>`); }
  },
  feature(s, u) { // a fire grate in the wall
    path(s, rrect(u - 22, -50, 44, 34, 6), EM.iron);
    path(s, rrect(u - 17, -45, 34, 26, 4), s.rg([[0, '#FFF0B0'], [0.4, EM.glow], [1, '#C8401F']], 0.5, 0.7, 0.7));
    for (const dx of [-9, 0, 9]) vcyl(s, u + dx - 2.2, -47, 4.4, 30, '#4A4044', 2);
    hcyl(s, u - 22, -52, 44, 6, '#5A4E54', 2);
  },
  bay(s) {
    piers(s, { col: shade(EM.brick, -0.1), top: -26, capCol: '#4A3E44', baseCol: '#4A3E44' });
    hood(s, { grout: '#FF8A3D', n: 7, gap: 0.14, col: (i) => jit(shade(EM.brick, -0.05), i, 5, 0.14) });
    const y = -76; // a horned skull
    for (const sx of [-1, 1]) root(s, bez([80 + sx * 6, y - 2], [80 + sx * 16, y - 4], [80 + sx * 22, y - 10], [80 + sx * 20, y - 20]), 6, 1.5, '#E6DABE');
    skull(s, 80, y, 1.05, '#E6DABE');
  },
  post(s) { capstone(s, this.H, 24, '#5A4E54'); s.add(`<circle cx="${this.H - 12}" cy="${-this.H + 12}" r="7" fill="${s.rg([[0, '#C8BEC4'], [0.35, '#7E7278'], [1, '#2E2428']], 0.38, 0.32, 0.75)}"/>`); },
});

// =============================================================================== THE GILDED SPIRE: gold and marble
const SP = { marble: '#F2ECE0', marbleSh: '#D6CDBA', gold: '#E2B23C', goldDk: '#A87A22', violet: '#5A4E8E', violetDk: '#3C3266' };
const goldBand = (s, u0, u1, y, h) => { rect(s, u0 - 2, y, u1 - u0 + 4, h, s.lg([[0, '#FFE69A'], [0.35, SP.gold], [1, SP.goldDk]])); rect(s, u0 - 2, y + 1, u1 - u0 + 4, 1.4, '#FFFFFF', 'opacity="0.5"'); };
function sun(s, x, y, r) {
  for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, L = k % 2 ? 1.6 : 2.25, w = k % 2 ? 0.16 : 0.2; path(s, poly([[x + Math.cos(a - w) * r * 0.95, y + Math.sin(a - w) * r * 0.95], [x + Math.cos(a) * r * L, y + Math.sin(a) * r * L], [x + Math.cos(a + w) * r * 0.95, y + Math.sin(a + w) * r * 0.95]]), s.lg([[0, '#FFE69A'], [1, k % 2 ? SP.goldDk : SP.gold]], 0, 0, 1, 1)); }
  s.add(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 1.12)}" fill="${SP.goldDk}"/>`);
  s.add(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${s.rg([[0, '#FFF4C0'], [0.6, SP.gold], [1, SP.goldDk]], 0.38, 0.32, 0.8)}"/>`);
  s.add(`<ellipse cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.35)}" rx="${f1(r * 0.35)}" ry="${f1(r * 0.2)}" fill="#FFFFFF" opacity="0.5"/>`);
}
opt({
  id: 'spire-a', theme: 'spire', name: 'Marble and gold', H: 108, F: 90,
  blurb: 'White marble panels framed in gold, a gold plinth and frieze; a sun of gold above each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#B9AE96');
    rect(s, u0 - 2, -14, u1 - u0 + 4, 14, s.lg([[0, '#7E72B0'], [1, SP.violetDk]]));
    goldBand(s, u0, u1, -16, 4);
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 2; i++) {
      const px = x + i * 80;
      block(s, px + 2, -74, 76, 56, '#DCD2BE', { r: 3, glossH: 5, lift: 0.1, drop: 0.1 });
      path(s, rrect(px + 9, -67, 62, 42, 3), 'none', `stroke="${SP.gold}" stroke-width="3"`);
      path(s, rrect(px + 13, -63, 54, 34, 2), s.lg([[0, SP.marble], [1, SP.marbleSh]]));
      path(s, `M${px + 20} -60C${px + 34} -50 ${px + 28} -36 ${px + 50} -26`, 'none', `stroke="${SP.marbleSh}" stroke-width="1.6" opacity="0.8"`);
    }
    goldBand(s, u0, u1, -this.F, 16);
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 8; i++) rivet(s, x + i * 20 + 10, -this.F + 8, 2.6, '#FFF0B8');
  },
  ao: 0.2,
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, SP.marbleSh); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [80, 80], off: 40 }], (i) => jit(SP.marble, i, 1, 0.04), { r: 3, glossH: 5, glossA: 0.35 }); for (const x of every(u0, u1, 0)) rect(s, x, -this.H + 4, 160, 3, SP.gold); },
  feature(s, u) { sun(s, u, -46, 8.5); },
  bay(s) {
    for (const x of [2, 140]) { block(s, x, -78, 18, 78, '#F6F0E4', { r: 2, glossA: 0.35 }); for (const fx of [6, 12]) rect(s, x + fx - 1, -72, 2, 64, SP.marbleSh); goldBand(s, x - 2, x + 20, -84, 8); goldBand(s, x - 2, x + 20, -8, 8); }
    hood(s, { grout: SP.goldDk, n: 5, col: (i) => jit(SP.marble, i, 2, 0.05), gap: 0.08 });
    sun(s, 80, -76, 7.5);
  },
  post(s) { capstone(s, this.H, 26, SP.marble); s.add(`<circle cx="${this.H - 13}" cy="${-this.H + 13}" r="6" fill="${s.rg([[0, '#FFF4C0'], [0.6, SP.gold], [1, SP.goldDk]], 0.38, 0.32, 0.8)}"/>`); },
});
opt({
  id: 'spire-b', theme: 'spire', name: 'Gilded colonnade', H: 110, F: 92,
  blurb: 'White fluted columns with gold heads and feet, deep violet between them set with gold stars; a gold pediment over each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, vgrad(s, SP.violet, SP.violetDk));
    for (const x of every(u0, u1, 20)) for (const [dy, r] of [[-60, 3.4], [-36, 2.4]]) { const cx = x + (dy === -36 ? 20 : 0), cy = dy; path(s, poly([0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = k * Math.PI / 4 - Math.PI / 2, rr = k % 2 ? r * 0.42 : r * 1.6; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; })), SP.gold); }
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 2; i++) {
      const cx = x + i * 80 - 11;
      vcyl(s, cx + 1, -this.F + 12, 20, this.F - 22, SP.marble, 3);
      for (const fx of [7, 13]) rect(s, cx + fx, -this.F + 16, 1.6, this.F - 30, SP.marbleSh, 'opacity="0.9"');
      block(s, cx - 3, -this.F + 4, 28, 10, SP.gold, { r: 2, glossA: 0.45 });
      block(s, cx - 3, -12, 28, 12, SP.gold, { r: 2, glossA: 0.45 });
    }
    goldBand(s, u0, u1, -this.F, 5);
  },
  ao: 0.24,
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, SP.marbleSh); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [40, 40, 40, 40], off: 9 }], (i) => jit(SP.marble, i, 3, 0.04), { r: 3, glossH: 5, glossA: 0.35 }); for (const x of every(u0, u1, 0)) hcyl(s, x, -this.H + 2, 160, 6, SP.gold, 3); },
  feature(s, u) { // a hanging banner
    hcyl(s, u - 24, -this.F + 14, 48, 5, SP.gold, 2.5);
    path(s, `M${u - 19} ${-this.F + 18}H${u + 19}V-22L${u} -30L${u - 19} -22Z`, s.lg([[0, '#C83A4A'], [1, '#8A2236']], 0, 0, 1, 0));
    sun(s, u, -54, 6);
  },
  bay(s) {
    for (const x of [0, 138]) { vcyl(s, x + 1, -82, 20, 72, SP.marble, 3); block(s, x - 2, -86, 26, 10, SP.gold, { r: 2, glossA: 0.45 }); block(s, x - 2, -12, 26, 12, SP.gold, { r: 2, glossA: 0.45 }); }
    path(s, 'M-2 -84L80 -104L162 -84Z', s.lg([[0, '#FFE69A'], [1, SP.goldDk]]));
    path(s, 'M16 -86L80 -100L144 -86Z', s.lg([[0, SP.marble], [1, SP.marbleSh]]));
    sun(s, 80, -91, 5);
  },
  post(s) { capstone(s, this.H, 26, SP.marble); s.add(`<circle cx="${this.H - 13}" cy="${-this.H + 13}" r="6" fill="${s.rg([[0, '#FFF4C0'], [0.6, SP.gold], [1, SP.goldDk]], 0.38, 0.32, 0.8)}"/>`); },
});

// =============================================================================== THE SUNKEN DUNES: sandstone
const DU = { sand: '#ECD29A', sandSh: '#C9A466', stone: '#C28A52', stoneDk: '#7E5A30', teal: '#3E8A9A', terra: '#C0603A', gold: '#E8B84A' };
const sandFoot = (s, o, u0, u1, seed, h = 14) => lumps(s, u0, u1, 2, -h, seed, DU.sand, { top: shade(DU.sand, 0.06), amp: 6, step: 40 });
opt({
  id: 'dunes-a', theme: 'dunes', name: 'Sandstone', H: 104, F: 86,
  blurb: 'Warm cut sandstone with a carved band of signs, sand drifted against its foot and along its top; a winged sun over each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, DU.stoneDk);
    courses(s, u0, u1, 0, [{ h: 26, w: [64, 48, 48], off: 0 }, { h: 22, w: [80, 80], off: 40, band: true }, { h: 22, w: [48, 64, 48], off: 24 }, { h: 16, w: [56, 48, 56], off: 8 }],
      (i, j, row) => jit(row.band ? shade(DU.stone, 0.1) : DU.stone, i, j, 0.1), { r: 4 });
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 8; i++) { // carved signs: a cut line with a lit lower edge
      const cx = x + i * 20 + 10, cy = -37, k = i % 4, d = k === 0 ? `M${cx - 5} ${cy + 4}L${cx} ${cy - 5}L${cx + 5} ${cy + 4}Z` : k === 1 ? `M${cx - 6} ${cy}c2 -4 4 4 6 0c2 -4 4 4 6 0` : k === 2 ? `M${cx - 1} ${cy + 7}Q${cx - 6} ${cy - 1} ${cx + 2} ${cy - 7}Q${cx + 3} ${cy} ${cx - 1} ${cy + 7}` : `M${cx - 4.5} ${cy}a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0`;
      path(s, d, 'none', `stroke="${shade(DU.stoneDk, -0.2)}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" transform="translate(0 -0.8)"`);
      path(s, d, 'none', `stroke="#FFF4D8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" transform="translate(0.6 0.9)"`);
    }
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, DU.stoneDk); courses(s, u0, u1, -this.F, [{ h: this.H - this.F, w: [80, 80], off: 20 }], (i) => jit(shade(DU.stone, 0.14), i, 1, 0.06), { r: 4, glossH: 5 }); },
  over(s, u0, u1) {
    sandFoot(s, this, u0, u1, 2, 12);
    for (const x of every(u0, u1, 100)) path(s, `M${x - 40} ${-this.F + 1}Q${x} ${-this.F + 12} ${x + 40} ${-this.F + 1}Z`, s.lg([[0, shade(DU.sand, 0.05)], [1, DU.sandSh]]));
  },
  feature(s, u) { // a cartouche
    path(s, rrect(u - 14, -76, 28, 44, 13), s.lg([[0, shade(DU.stone, 0.2)], [1, shade(DU.stone, -0.06)]]));
    path(s, rrect(u - 14, -76, 28, 44, 13), 'none', `stroke="${DU.gold}" stroke-width="3"`);
    s.add(`<circle cx="${u}" cy="-64" r="5" fill="${DU.terra}"/>`);
    path(s, `M${u - 7} -51c2.3 -3 4.7 3 7 0c2.3 -3 4.7 3 7 0`, 'none', `stroke="${DU.teal}" stroke-width="2.6" stroke-linecap="round"`);
    path(s, `M${u - 6} -38L${u} -46L${u + 6} -38Z`, DU.teal);
  },
  bay(s) {
    for (const x of [2, 140]) { block(s, x, -72, 18, 72, shade(DU.stone, 0.08), { r: 2 }); for (const [dx, c] of [[-3, DU.teal], [6, DU.terra], [15, DU.teal]]) path(s, `M${x + 9} -72Q${x + dx - 3} -84 ${x + dx} -88Q${x + 9} -82 ${x + 9} -72Z`, c); }
    block(s, 0, -96, 160, 14, shade(DU.stone, 0.14), { r: 3 });
    const y = -89; // the winged sun
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) path(s, `M${80 + sx * 8} ${y - 3 + k * 2}Q${80 + sx * (30 + k * 6)} ${y - 8 + k * 3} ${80 + sx * (44 - k * 6)} ${y + 1 + k * 1.2}L${80 + sx * 8} ${y + 1 + k * 1.2}Z`, k % 2 ? DU.teal : shade(DU.teal, 0.2));
    s.add(`<circle cx="80" cy="${y}" r="6.5" fill="${s.rg([[0, '#FFF0B0'], [0.6, DU.gold], [1, '#A87A22']], 0.38, 0.32, 0.8)}"/>`);
  },
  bayOver(s) { lumps(s, 0, 30, 2, -12, 5, DU.sand, { top: shade(DU.sand, 0.06), amp: 4, step: 30 }); },
  post(s) { clump(s, this.H - 14, -this.H + 14, 14, 3, [DU.sandSh, DU.sand, '#FFF2D0']); },
});
opt({
  id: 'dunes-b', theme: 'dunes', name: 'Painted tomb', H: 106, F: 88,
  blurb: 'Smooth plaster painted in teal, red and gold bands under a curved cornice; tapered frames and a sun disc at each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, vgrad(s, '#F0DCAE', '#D8BC84'));
    rect(s, u0 - 2, -16, u1 - u0 + 4, 16, s.lg([[0, shade(DU.terra, 0.1)], [1, shade(DU.terra, -0.15)]]));
    rect(s, u0 - 2, -22, u1 - u0 + 4, 4, DU.gold);
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 8; i++) path(s, `M${x + i * 20} -46l10 -10l10 10`, 'none', `stroke="${DU.teal}" stroke-width="4" stroke-linejoin="round"`);
    rect(s, u0 - 2, -36, u1 - u0 + 4, 3, DU.terra, 'opacity="0.9"');
    rect(s, u0 - 2, -62, u1 - u0 + 4, 3, DU.terra, 'opacity="0.9"');
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 16; i++) rect(s, x + i * 10 + 1, -74, 8, 8, i % 2 ? DU.teal : DU.gold, 'rx="1.5"');
  },
  cap(s, u0, u1) { // the cornice, its curve seen from above: stripes of colour
    bg(s, u0, u1, -this.H, -this.F, '#B89458');
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 16; i++) path(s, rrect(x + i * 10 + 1, -this.H + 1, 8, this.H - this.F - 2, 3), s.lg([[0, shade(i % 2 ? DU.teal : '#E8D4A4', -0.12)], [0.6, shade(i % 2 ? DU.teal : '#E8D4A4', 0.1)], [1, i % 2 ? DU.teal : '#E8D4A4']]));
  },
  lip: 0.4,
  feature(s, u) { // a painted scarab
    path(s, blob(u, -84 + 40, 8, 10, 2, 0.04, 10), s.rg([[0, shade(DU.teal, 0.3)], [1, shade(DU.teal, -0.25)]]));
    for (const sx of [-1, 1]) path(s, `M${u + sx * 6} -46Q${u + sx * 26} -56 ${u + sx * 30} -40Q${u + sx * 20} -42 ${u + sx * 6} -40Z`, sx > 0 ? shade(DU.teal, 0.15) : DU.teal);
    s.add(`<circle cx="${u}" cy="-58" r="5" fill="${DU.terra}"/>`);
  },
  over(s, u0, u1) { sandFoot(s, this, u0, u1, 7, 9); },
  bay(s) {
    for (const sx of [1, -1]) { const X = (x) => (sx > 0 ? x : 160 - x); path(s, poly([[X(2), 0], [X(8), -80], [X(26), -80], [X(24), 0]]), s.lg([[0, '#F6E6C0'], [1, '#D2B478']])); path(s, poly([[X(6), -30], [X(7), -44], [X(25.5), -44], [X(24), -30]]), DU.teal); }
    path(s, 'M0 -80H160V-92C130 -98 30 -98 0 -92Z', s.lg([[0, shade(DU.teal, 0.2)], [1, DU.teal]]));
    rect(s, 0, -82, 160, 4, DU.gold);
    s.add(`<circle cx="80" cy="-89" r="7" fill="${s.rg([[0, '#FFE0A0'], [0.6, DU.terra], [1, shade(DU.terra, -0.3)]], 0.38, 0.32, 0.8)}"/>`);
  },
  post(s) { capstone(s, this.H, 22, '#E8D4A4'); },
});

// =============================================================================== THE CLOCKWORK FOUNDRY: brass and iron
const FO = { steel: '#7E7C78', steelDk: '#4A4844', brass: '#D29A3E', brassDk: '#8E5E22', fire: '#E8923A', brick: '#8A5A42' };
opt({
  id: 'foundry-a', theme: 'foundry', name: 'Riveted plates', H: 104, F: 86,
  blurb: 'Steel plates riveted at the seams on a brass plinth, a warning stripe at the foot; gear-headed brass hoods over the doors.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#2E2C2A');
    rect(s, u0 - 2, -14, u1 - u0 + 4, 14, '#2B2230');
    for (const x of every(u0, u1, 0)) for (let i = 0; i < 12; i++) path(s, poly([[x + i * 14, 0], [x + i * 14 + 7, 0], [x + i * 14 + 14, -14], [x + i * 14 + 7, -14]]), '#E8B830', 'opacity="0.95"');
    hcyl(s, u0 - 2, -20, u1 - u0 + 4, 7, FO.brass, 2);
    courses(s, u0, u1, -20, [{ h: 32, w: [80, 80], off: 0 }, { h: 34, w: [80, 80], off: 40 }], (i, j) => jit(FO.steel, i, j, 0.1), { r: 3, gap: 2.4, glossH: 5, each: (x, y, w, h) => { for (const fx of [6, w / 2, w - 6]) for (const fy of [5, h - 5]) rivet(s, x + fx, y + fy, 2.1, '#B8B4AE'); } });
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, FO.steelDk); for (const x of every(u0, u1, 0)) { hcyl(s, x - 1, -this.H + 2, 162, this.H - this.F - 4, FO.brass, 6); for (let i = 0; i < 4; i++) rivet(s, x + i * 40 + 20, -this.F - (this.H - this.F) / 2, 2.4, '#FFE0A0'); } },
  feature(s, u) { // a furnace porthole
    s.add(`<circle cx="${u}" cy="-52" r="17" fill="${s.rg([[0, shade(FO.brass, 0.3)], [1, FO.brassDk]])}"/>`);
    s.add(`<circle cx="${u}" cy="-52" r="12" fill="${s.rg([[0, '#FFF0B0'], [0.45, FO.fire], [1, '#8A2A10']], 0.5, 0.6, 0.6)}"/>`);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rivet(s, u + Math.cos(a) * 14.5, -52 + Math.sin(a) * 14.5, 1.6, '#FFE0A0'); }
    s.add(`<ellipse cx="${u - 4}" cy="-57" rx="4" ry="2.2" fill="#FFFFFF" opacity="0.5"/>`);
  },
  bay(s) {
    piers(s, { col: FO.steel, top: -26, capCol: FO.brass, baseCol: FO.brass });
    hood(s, { grout: '#2E2C2A', n: 5, gap: 0.08, col: (i) => jit(FO.brass, i, 3, 0.08), each: (q) => rivet(s, (q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, 1.8, '#FFE0A0') });
    gear(s, 80, -74, 14, 10, FO.brass);
  },
  post(s) { capstone(s, this.H, 24, FO.steel); rivet(s, this.H - 12, -this.H + 12, 4, '#FFE0A0'); },
});
opt({
  id: 'foundry-b', theme: 'foundry', name: 'Brass pipeworks', H: 108, F: 88,
  blurb: 'Fire brick below, brass pipes, valves and gauges above, a big pipe along the top; pipes arch over each door.',
  face(s, u0, u1) {
    bg(s, u0, u1, -this.F, 0, '#3A2A22');
    const rows = []; for (let j = 0; j < 3; j++) rows.push({ h: 14, w: [40, 40, 40, 40], off: (j % 2) * 20 });
    courses(s, u0, u1, 0, rows, (i, j) => jit(FO.brick, i * 3 + j, j, 0.14), { r: 3, gap: 2.6, glossH: 3 });
    courses(s, u0, u1, -42, [{ h: this.F - 42, w: [80, 80], off: 40 }], (i) => jit('#625E58', i, 1, 0.08), { r: 3, gap: 2.4, glossH: 4, each: (x, y, w, h) => { for (const fx of [6, w - 6]) for (const fy of [6, h - 6]) rivet(s, x + fx, y + fy, 2, '#B8B4AE'); } });
    for (const x of every(u0, u1, 0)) {
      for (const px of [10, 62, 116]) vcyl(s, x + px, -this.F, 16, this.F - 40, FO.brass, 4);
      hcyl(s, x - 1, -66, 162, 18, shade(FO.brass, -0.05));
      for (const px of [10, 62, 116]) { block(s, x + px - 4, -70, 24, 26, FO.brassDk, { r: 3, glossH: 4 }); rivet(s, x + px + 8, -57, 2.6, '#FFE0A0'); }
      block(s, x - 1, -44, 162, 5, FO.steelDk, { r: 1, gloss: false });
    }
  },
  cap(s, u0, u1) { bg(s, u0, u1, -this.H, -this.F, FO.steelDk); for (const x of every(u0, u1, 0)) { hcyl(s, x - 1, -this.H + 1, 162, this.H - this.F - 2, FO.brass); for (const fx of [0, 80]) hcyl(s, x + fx - 4, -this.H - 1, 8, this.H - this.F + 2, FO.brassDk, 2.5); } },
  feature(s, u) { // a big gauge and a red valve wheel
    s.add(`<circle cx="${u - 24}" cy="-30" r="11" fill="${s.rg([[0, '#F6F2E2'], [1, '#C9C2A8']])}" stroke="${FO.brassDk}" stroke-width="3.5"/>`);
    path(s, `M${u - 24} -30L${u - 18} -36`, 'none', 'stroke="#C0302A" stroke-width="2" stroke-linecap="round"');
    s.add(`<circle cx="${u + 16}" cy="-30" r="12" fill="none" stroke="#C0302A" stroke-width="4"/>`);
    for (let k = 0; k < 2; k++) { const a = k * Math.PI / 2; path(s, `M${f1(u + 16 - Math.cos(a) * 11)} ${f1(-30 - Math.sin(a) * 11)}L${f1(u + 16 + Math.cos(a) * 11)} ${f1(-30 + Math.sin(a) * 11)}`, 'none', 'stroke="#C0302A" stroke-width="3"'); }
    rivet(s, u + 16, -30, 3.2, '#FFE0A0');
  },
  bay(s) {
    for (const x of [0, 142]) vcyl(s, x, -80, 18, 80, FO.brass, 4);
    const arc = bez([9, -78], [9, -100], [151, -100], [151, -78]);
    path(s, tube(arc, 18, 18), shade(FO.brass, -0.3));
    path(s, tube(arc, 13, 13, 0.3), FO.brass);
    path(s, tube(arc, 3.4, 3.4, 3), '#FFE8B0', 'opacity="0.6"');
    for (const x of [9, 151]) block(s, x - 12, -84, 24, 12, FO.brassDk, { r: 3, glossH: 3 });
    gear(s, 80, -74, 11, 8, FO.steel);
  },
  post(s) { capstone(s, this.H, 22, FO.brassDk); rivet(s, this.H - 11, -this.H + 11, 4, '#FFE0A0'); },
});
