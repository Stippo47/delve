// Folk (round 19, lane bases19). The designer: "I want you to make some "normal" looking bases. No armour or equipment,
// maybe just a basic sack tunic, then a bunch of hair styles and skin colours, facial hair, jewelry. U can also play
// around with different body types like fat, brutish, skinny, feminine if u can, etc."
//
// A plain person in the heroes' style, built from layers in code so any mix works: body type, skin, hair style, hair
// colour, facial hair, jewellery, tunic, cloth. folkSvg(spec) gives the SVG text, laid out like a hero's file (parts
// #back / #body / #arm-l / #arm-r inside #sprite, 220 box, centre 100,100, front = +y, arms with a data-pivot, no
// outline: js/parts.js adds it), so the game splits and swings it like any other figure. No DOM here: the same code
// writes the files and boards (tools/bases19/).
//
// The base person is the approved base human (design/base-approved/base-1s-160.svg: the head path, ears, the 148-wide
// shoulder band, the 24x21 fists, the bowl cut) in a sack tunic. The rendering is the heroes' (tools/art-heroart/A2/
// lib.py, ported): every shape has a soft top-left-lit fill, a darker right side, and a contact shadow cast down onto
// what was drawn before it. Rulings kept: no eyes, brows or blush, the one small curve on the face; no arms, just
// hands; no sheen patches or lines on hair; a beard and its sideburns are one shape; braids and tails come out from
// under the hair; a puffy moustache covers the curve, a thin one sits under it.

// ---------------------------------------------------------------- colour
const hx = (c) => { c = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); };
const to = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0')).join('').toUpperCase();
function rgb2hls(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, l, 0];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, l, s];
}
function hls2rgb(h, l, s) {
  if (s <= 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = ((t % 1) + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
export const shade = (c, k = 0.8, sat = 1.05) => { const [h, l, s] = rgb2hls(...hx(c)); return to(...hls2rgb(h, l * k, Math.min(1, s * sat))); };
export const light = (c, k = 1.12) => { const [h, l, s] = rgb2hls(...hx(c)); return to(...hls2rgb(h, Math.min(0.97, l * k), s)); };
const mul = (c, k) => { const v = hx(c); return to(v[0] * k[0], v[1] * k[1], v[2] * k[2]); };
const mixc = (a, b, t) => { const p = hx(a), q = hx(b); return to(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t); };

// ---------------------------------------------------------------- geometry (all closed paths run clockwise on screen,
// so several of them in one path are their union)
const f = (v) => { const r = Math.round(v * 10) / 10; return String(r); };
const circ = (cx, cy, r) => `M ${f(cx - r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 1 ${f(cx + r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 1 ${f(cx - r)} ${f(cy)} Z`;
const ell = (cx, cy, rx, ry) => `M ${f(cx - rx)} ${f(cy)} A ${f(rx)} ${f(ry)} 0 1 1 ${f(cx + rx)} ${f(cy)} A ${f(rx)} ${f(ry)} 0 1 1 ${f(cx - rx)} ${f(cy)} Z`;
function rr(cx, cy, w, h, r) {
  const x = cx - w / 2, y = cy - h / 2; r = Math.min(r, w / 2, h / 2);
  return `M ${f(x + r)} ${f(y)} H ${f(x + w - r)} A ${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)} V ${f(y + h - r)} A ${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)} H ${f(x + r)} A ${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)} V ${f(y + r)} A ${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)} Z`;
}
const poly = (pts) => 'M ' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L ') + ' Z';
function blob(pts, t = 1) { // a closed smooth curve through the points (Catmull-Rom as cubic Beziers)
  const n = pts.length; let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6 * t)} ${f(p1[1] + (p2[1] - p0[1]) / 6 * t)} ${f(p2[0] - (p3[0] - p1[0]) / 6 * t)} ${f(p2[1] - (p3[1] - p1[1]) / 6 * t)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + ' Z';
}
const mirror = (pts, cx = 100) => pts.map(([x, y]) => [2 * cx - x, y]);
const sym = (half, cx = 100) => half.concat(mirror(half.slice().reverse(), cx)); // left half, top to bottom -> the whole, anticlockwise
const symCW = (half, cx = 100) => sym(half, cx).reverse();
const circles = (cs) => cs.map(([x, y, r]) => circ(x, y, r)).join(' ');
const qcurve = (p0, p1, p2, n = 9) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]]; });
function ribbon(spine, wAt) { // a strip along a spine, half-width wAt(t), round ends; clockwise
  const n = spine.length, L = [], R = [];
  spine.forEach(([x, y], i) => {
    const a = spine[Math.max(i - 1, 0)], b = spine[Math.min(i + 1, n - 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const w = wAt(i / (n - 1)); L.push([x - dy / d * w, y + dx / d * w]); R.push([x + dy / d * w, y - dx / d * w]);
  });
  const pts = L.concat(R.reverse());
  let area = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; });
  return blob(area < 0 ? pts.reverse() : pts, 0.85);
}
const bandPath = (spine, w) => ribbon(spine, () => w);
// the shoulder band of the approved base, any size: half-width hw, half-depth hd
const shoulderBand = (cx, cy, hw, hd) => `M ${f(cx - hw)} ${f(cy)} C ${f(cx - hw)} ${f(cy - hd * 0.8125)} ${f(cx - hw * 0.62)} ${f(cy - hd)} ${f(cx)} ${f(cy - hd)} C ${f(cx + hw * 0.62)} ${f(cy - hd)} ${f(cx + hw)} ${f(cy - hd * 0.8125)} ${f(cx + hw)} ${f(cy)} C ${f(cx + hw)} ${f(cy + hd * 0.8125)} ${f(cx + hw * 0.62)} ${f(cy + hd)} ${f(cx)} ${f(cy + hd)} C ${f(cx - hw * 0.62)} ${f(cy + hd)} ${f(cx - hw)} ${f(cy + hd * 0.8125)} ${f(cx - hw)} ${f(cy)} Z`;
const frame = (x, y, a) => `translate(${f(x)} ${f(y)}) rotate(${f(a)})`;

// ---------------------------------------------------------------- the sprite builder (lib.py's Sprite)
const INK = '#2B2230';
class Sprite {
  constructor(comment) { this.comment = comment; this.defs = []; this.out = []; this.shapes = []; this.n = 0; this.cache = new Map(); this.open = false; this.ids = {}; }
  grad(c, kind) {
    const key = c + kind; if (this.cache.has(key)) return this.cache.get(key);
    const i = 'g' + (this.cache.size + 1);
    if (kind === 'fill') this.defs.push(`<linearGradient id="${i}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${light(c, 1.1)}"/><stop offset="1" stop-color="${shade(c, 0.86)}"/></linearGradient>`);
    else if (kind === 'side') { const dk = shade(c, 0.45, 1.1); this.defs.push(`<linearGradient id="${i}" x1="0.45" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dk}" stop-opacity="0"/><stop offset="1" stop-color="${dk}" stop-opacity="0.42"/></linearGradient>`); }
    // hair: one fill and one side shade in the sprite's own frame, so a head of hair built from several shapes is one mass
    else if (kind === 'hfill') this.defs.push(`<linearGradient id="${i}" x1="62" y1="34" x2="94" y2="140" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${light(c, 1.1)}"/><stop offset="1" stop-color="${shade(c, 0.84)}"/></linearGradient>`);
    else if (kind === 'hside') { const dk = shade(c, 0.45, 1.1); this.defs.push(`<linearGradient id="${i}" x1="96" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dk}" stop-opacity="0"/><stop offset="1" stop-color="${dk}" stop-opacity="0.42"/></linearGradient>`); }
    this.cache.set(key, i); return i;
  }
  def(s) { this.defs.push(s); }
  group(id, pivot, note, T) {
    if (this.open) this.out.push('</g>');
    this.out.push(`<g id="${id}"${pivot ? ` data-pivot="${f(pivot[0])} ${f(pivot[1])}"` : ''}${T ? ` transform="${T}"` : ''}>${note ? `<!-- ${note} -->` : ''}`);
    this.open = true;
  }
  // o: color (gets the fill + side gradients) | fill (a paint as given); hair (the shared hair paints); T; shadow (how
  // far down the contact shadow falls, 0 = none); on (shape ids the shadow may fall on; default: everything before it);
  // side; decor (drawn inside the shape); over (a second paint); catch (later shadows fall on it); rule
  shape(d, o = {}) {
    const { color = null, fill = null, hair = false, T = '', shadow = 4, sop = 0.3, side = true, decor = '', over = null, on = null, rule = null, name = null } = o;
    const sid = 's' + (++this.n), tr = T ? ` transform="${T}"` : '', fr = rule ? ` fill-rule="${rule}" clip-rule="${rule}"` : '';
    this.defs.push(`<path id="${sid}" d="${d}"${fr}/>`);
    let s = '';
    const under = on ? on.map((id) => this.shapes.find((x) => x[0] === id)).filter(Boolean) : this.shapes;
    if (shadow && under.length) {
      this.defs.push(`<clipPath id="u${this.n}">${under.map(([id, t]) => `<use href="#${id}"${t ? ` transform="${t}"` : ''}/>`).join('')}</clipPath>`);
      s += `<g clip-path="url(#u${this.n})"><use href="#${sid}" transform="translate(0 ${shadow}) ${T}" fill="${INK}" opacity="${sop}"/></g>`;
    }
    s += `<use href="#${sid}"${tr} fill="${fill || `url(#${this.grad(color, hair ? 'hfill' : 'fill')})`}"/>`;
    if (side && color) s += `<use href="#${sid}"${tr} fill="url(#${this.grad(color, hair ? 'hside' : 'side')})"/>`;
    if (over) s += `<use href="#${sid}"${tr} fill="${over}"/>`;
    if (decor) { this.defs.push(`<clipPath id="c${this.n}"><use href="#${sid}"${tr}/></clipPath>`); s += `<g clip-path="url(#c${this.n})">${T ? `<g transform="${T}">${decor}</g>` : decor}</g>`; }
    if (o.catch !== false) this.shapes.push([sid, T]);
    if (name) this.ids[name] = sid;
    this.out.push(s);
    return sid;
  }
  raw(s) { this.out.push(s); }
  svg() {
    if (this.open) { this.out.push('</g>'); this.open = false; }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 220 220" width="220" height="220">\n<!-- ${this.comment} -->\n<defs>\n${this.defs.join('\n')}\n</defs>\n<g id="sprite">\n${this.out.join('\n')}\n</g>\n</svg>\n`;
  }
}
const dash = (x, y, a, len, col, w = 2.6, op = 0.8) => { const r = a * Math.PI / 180, dx = Math.cos(r) * len / 2, dy = Math.sin(r) * len / 2; return `<path d="M ${f(x - dx)} ${f(y - dy)} L ${f(x + dx)} ${f(y + dy)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`; };

// ---------------------------------------------------------------- the layers: what there is to pick from
// skin: one colour (the middle of the face); everything else is worked out from it the way the heroes' two skins are
export const SKINS = {
  pale: { name: 'Pale', c: '#F6D8C0' }, fair: { name: 'Fair', c: '#F2C7A0' }, olive: { name: 'Olive', c: '#DFB183' }, tan: { name: 'Tan', c: '#CC9668' },
  brown: { name: 'Brown', c: '#AF7550' }, dark: { name: 'Dark', c: '#8B5A3E' }, deep: { name: 'Deep', c: '#6A4532' },
  // fantasy, kept apart: never rolled unless asked for
  moss: { name: 'Moss', c: '#A8BE7C', fantasy: true }, slate: { name: 'Slate', c: '#A9BBCB', fantasy: true }, ash: { name: 'Ash', c: '#C3ADD2', fantasy: true }, ember: { name: 'Ember', c: '#D97A62', fantasy: true },
};
export const HAIR_COLOURS = {
  black: { name: 'Black', c: '#3E3843' }, umber: { name: 'Dark brown', c: '#553828' }, brown: { name: 'Brown', c: '#87563A' }, chestnut: { name: 'Chestnut', c: '#9C4F2C' },
  ginger: { name: 'Ginger', c: '#D8742F' }, sandy: { name: 'Sandy', c: '#C59B63' }, blonde: { name: 'Blonde', c: '#EBC063' }, grey: { name: 'Grey', c: '#9C9BA3' }, white: { name: 'White', c: '#E6E3DC' },
};
export const CLOTHS = {
  oat: { name: 'Undyed sack', c: '#C6AD82' }, flax: { name: 'Flax', c: '#DCCFAC' }, brown: { name: 'Brown', c: '#9B7250' }, grey: { name: 'Grey wool', c: '#8E8D93' },
  moss: { name: 'Moss', c: '#7F8E5A' }, rust: { name: 'Rust', c: '#B26A4E' }, woad: { name: 'Woad blue', c: '#7188A6' }, ochre: { name: 'Ochre', c: '#C99D4C' }, plum: { name: 'Plum', c: '#8C6883' },
};
export const BODIES = {
  average: { name: 'Average' }, skinny: { name: 'Skinny' }, fat: { name: 'Fat' }, brute: { name: 'Brutish' }, feminine: { name: 'Feminine' }, old: { name: 'Old' }, young: { name: 'Young' },
};
export const HAIRS = {
  bald: { name: 'Bald' }, shaved: { name: 'Shaved' }, crop: { name: 'Short crop' }, bowl: { name: 'Bowl cut' }, swept: { name: 'Side-swept' }, slick: { name: 'Combed back' },
  messy: { name: 'Shaggy' }, curly: { name: 'Curly' }, afro: { name: 'Afro' }, bun: { name: 'Bun' }, topknot: { name: 'Topknot' }, ponytail: { name: 'Ponytail' },
  long: { name: 'Long loose' }, bob: { name: 'Bob' }, braids: { name: 'Two braids' }, backbraid: { name: 'Long braid' }, pigtails: { name: 'Bunches' }, locs: { name: 'Locs' },
  mohawk: { name: 'Mohawk' }, balding: { name: 'Balding' },
};
export const BEARDS = {
  none: { name: 'Clean' }, stubble: { name: 'Stubble' }, moustache: { name: 'Moustache' }, vandyke: { name: 'Moustache and goatee' }, goatee: { name: 'Goatee' }, chops: { name: 'Mutton chops' },
  scruff: { name: 'Short beard' }, full: { name: 'Full beard' }, long: { name: 'Long beard' }, braided: { name: 'Braided beard' }, forked: { name: 'Forked beard' },
};
export const JEWELS = {
  earrings: { name: 'Earrings' }, studs: { name: 'Ear studs' }, nosering: { name: 'Nose ring' }, necklace: { name: 'Pendant' }, beads: { name: 'Bead string' }, torc: { name: 'Torc' },
  armbands: { name: 'Armbands' }, bangles: { name: 'Bangles' }, rings: { name: 'Rings' }, headband: { name: 'Headband' }, circlet: { name: 'Circlet' },
};
export const TUNICS = {
  sack: { name: 'Sack tunic' }, patched: { name: 'Patched' }, roped: { name: 'Rope strap' }, sleeveless: { name: 'Sleeveless' }, torn: { name: 'Torn sleeves' }, yoke: { name: 'Collar' },
};
export const METALS = { gold: ['#F2B53A', '#FFF1B8'], silver: ['#CCD2DB', '#FFFFFF'], copper: ['#CF8148', '#FFD9B0'] };
export const BASE = { body: 'average', skin: 'fair', hair: 'bowl', hairCol: 'brown', beard: 'none', tunic: 'sack', cloth: 'oat', jewels: [], metal: 'gold' };

// ---------------------------------------------------------------- body types: the silhouette from above
const HEADS = {
  round: 'M 100 47.8 C 129.6 47.8 147.8 68.7 147.8 98.3 C 147.8 122.6 136.5 140 120.9 147.8 C 113.9 151.3 107 153.1 100 153.1 C 93 153.1 86.1 151.3 79.1 147.8 C 63.5 140 52.1 122.6 52.1 98.3 C 52.1 68.7 70.4 47.8 100 47.8 Z', // approved base 1 (every hero's)
  oval: 'M 100 47.8 C 128.6 47.8 146.6 68 146.6 97 C 146.6 121 136 137.6 121.4 146.6 C 114.2 151 107 153.1 100 153.1 C 93 153.1 85.8 151 78.6 146.6 C 64 137.6 53.4 121 53.4 97 C 53.4 68 71.4 47.8 100 47.8 Z', // approved base 2's: the chin pulled in
  square: 'M 100 47.8 C 129 47.8 147.6 62 147.6 88 L 147.6 114 C 147.6 136.6 131.4 150.6 114 152.4 L 86 152.4 C 68.6 150.6 52.4 136.6 52.4 114 L 52.4 88 C 52.4 62 71 47.8 100 47.8 Z', // approved base 3's: a firm jaw
  full: 'M 100 47.8 C 129.6 47.8 148.4 68.7 148.6 98.3 C 148.8 112 150 122 146 132 C 141 145 124 153.6 100 153.6 C 76 153.6 59 145 54 132 C 50 122 51.2 112 51.4 98.3 C 51.6 68.7 70.4 47.8 100 47.8 Z', // round cheeks and jowls
};
function bodyOf(type) {
  // shoulders: the body's outline; pl/pr: where the arms turn; hands: [cx, cy, turn] and their size; scale: the whole figure
  switch (type) {
    case 'skinny': return { head: 'oval', sh: blob(symCW([[100, 85], [74, 84], [47, 89], [35, 103], [44, 116], [70, 124], [100, 126]])), hw: 65, cy: 104, pl: [48, 104], pr: [152, 104], hand: [20, 18], hl: [51, 141, 8], hr: [149, 137, -8], ear: [6.2, 8.8] };
    case 'fat': return { head: 'full', sh: blob(symCW([[100, 58], [62, 62], [30, 80], [16, 112], [26, 146], [58, 170], [100, 177]])), hw: 84, cy: 112, pl: [34, 112], pr: [166, 112], hand: [26, 23], hl: [26, 148, 14], hr: [174, 146, -14], ear: [7, 9.6], belly: true };
    case 'brute': return { head: 'square', sh: blob(symCW([[100, 69], [70, 64], [36, 65], [10, 83], [2, 112], [14, 138], [40, 151], [70, 147], [100, 141]])), hw: 97, cy: 108, pl: [34, 110], pr: [166, 110], hand: [31, 27], hl: [27, 161, 10], hr: [173, 157, -10], ear: [7.6, 10.4] };
    case 'feminine': return { head: 'oval', sh: blob(symCW([[100, 80], [74, 80], [48, 88], [37, 104], [41, 120], [56, 134], [77, 148], [100, 145]])), hw: 63, cy: 104, pl: [46, 106], pr: [154, 106], hand: [21, 19], hl: [41, 138, 14], hr: [159, 135, -14], ear: [6.2, 8.8], rosy: true };
    case 'old': return { head: 'round', sh: blob(symCW([[100, 62], [68, 64], [42, 76], [33, 96], [42, 116], [68, 126], [100, 128]])), hw: 67, cy: 96, pl: [48, 98], pr: [152, 98], hand: [22, 20], hl: [58, 140, 16], hr: [142, 136, -16], ear: [7.4, 10.4], scale: 0.96 };
    case 'young': return { head: 'round', sh: shoulderBand(100, 108, 62, 27), hw: 62, cy: 108, pl: [52, 108], pr: [148, 108], hand: [20, 18], hl: [56, 144, 8], hr: [144, 141, -8], ear: [7, 9.6], scale: 0.86 };
    default: return { head: 'round', sh: shoulderBand(100, 108, 74, 32), hw: 74, cy: 108, pl: [46, 108], pr: [154, 108], hand: [24, 21], hl: [49, 148, 6], hr: [151, 143, -6], ear: [7, 9.6] };
  }
}

// ---------------------------------------------------------------- skin paints
function skinDefs(S, base, faceTop, fantasy) {
  // (a fantasy skin keeps its own hue in the shade: the warm shadow is for skin-coloured skin)
  const m = fantasy ? (k) => { const q = (k[0] + k[1] + k[2]) / 3; return q < 1 ? shade(base, q, 1.08) : light(base, q); } : (k) => mul(base, k);
  S.def(`<radialGradient id="gHand" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="${m([1.03, 1.065, 1.11])}"/><stop offset="1" stop-color="${m([0.915, 0.83, 0.79])}"/></radialGradient>`);
  S.def(`<linearGradient id="gFace" x1="0" y1="${f(faceTop)}" x2="0" y2="153" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${m([0.715, 0.58, 0.6])}"/><stop offset="0.2" stop-color="${m([0.89, 0.81, 0.79])}"/><stop offset="0.45" stop-color="${base}"/><stop offset="0.85" stop-color="${m([1.01, 1.025, 1.04])}"/><stop offset="1" stop-color="${m([0.95, 0.91, 0.9])}"/></linearGradient>`);
  S.def(`<linearGradient id="gFaceSide" x1="100" y1="0" x2="156" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${m([0.57, 0.39, 0.34])}" stop-opacity="0"/><stop offset="1" stop-color="${m([0.57, 0.39, 0.34])}" stop-opacity="0.28"/></linearGradient>`);
  S.def(`<radialGradient id="gBald" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="${m([1.016, 1.06, 1.1])}"/><stop offset="0.7" stop-color="${m([0.963, 0.925, 0.89])}"/><stop offset="1" stop-color="${m([0.876, 0.794, 0.75])}"/></radialGradient>`);
  S.def(`<linearGradient id="gArm" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="${m([1.02, 1.045, 1.07])}"/><stop offset="0.5" stop-color="${m([0.97, 0.94, 0.92])}"/><stop offset="1" stop-color="${m([0.8, 0.71, 0.67])}"/></linearGradient>`);
  return { base, earL: m([0.99, 0.985, 0.98]), earR: m([0.89, 0.81, 0.775]), mouth: m([0.83, 0.68, 0.65]), shine: mixc(m([1.03, 1.065, 1.11]), '#FFFFFF', 0.55), arm: m([0.97, 0.94, 0.92]) };
}

// ---------------------------------------------------------------- hair
// Each style: back (S, P): shapes behind the head (in #body, before it) or a tail in the #back part; cap (S, P): shapes
// over the head. P = { col (hair colour), head (the head's shape id), skin, B (the body) }. `top`: where the face's
// shadow under the hair starts (the hairline); `bare`: the scalp shows (the bald head's shading); `ears`: hidden.
const CAP = 'M 49 106 C 43 74 62 41 100 41 C 138 41 157 74 151 106'; // from the left temple over the crown to the right temple
const slickCap = CAP + ' C 147 96 140 87 128 84 C 117 81.5 107 85 100 90.5 C 93 85 83 81.5 72 84 C 60 87 53 96 49 106 Z'; // combed back: the hairline dips to a small peak
// parted in the middle: the crown dips where the parting is, and the hairline rises to it
const partCap = 'M 49 106 C 43 76 58 44.5 82 40.5 C 90 39.4 96 41.6 100 46 C 104 41.6 110 39.4 118 40.5 C 142 44.5 157 76 151 106' + ' C 150.5 112.5 144.5 113 142.5 107 C 138 93 121 84 100 79 C 79 84 62 93 57.5 107 C 55.5 113 49.5 112.5 49 106 Z';
const fringe = (y, n, r, x0 = 62, x1 = 138, arch = 5) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1), x = x0 + (x1 - x0) * t; return [x, y + arch * Math.pow(Math.abs(t - 0.5) * 2, 2), r]; });
const H = (S, P, d, o = {}) => S.shape(d, { color: P.col, hair: true, shadow: 4, on: [P.head], ...o }); // a piece of the hair over the head: its shadow falls on the head only
const HB = (S, P, d, o = {}) => S.shape(d, { color: o.col || P.col, hair: true, shadow: 3, ...o });       // a piece behind the head
const braid = (pts) => circles(pts); // a braid: a chain of soft lobes, getting smaller
const STYLE = {
  bald: { bare: true },
  shaved: { bare: true, cap(S, P) { // cut to the scalp: the hair's colour through the skin, flat on the head (no shadow, never past its edge)
    const c = mixc(P.skin.base, P.col, 0.58), d = CAP + ' C 148 97 143 88 133 85 C 122 82 110 86 100 89.5 C 90 86 78 82 67 85 C 57 88 52 97 49 106 Z';
    S.raw(`<g clip-path="url(#headClip)"><path d="${d}" fill="${c}"/><path d="${d}" fill="url(#${S.grad(P.col, 'hside')})" opacity="0.7"/></g>`);
  } },
  crop: { top: 93, cap(S, P) { H(S, P, 'M 51.3 100 C 44.3 84.3 46.1 68.7 53 60 C 53 49.5 63.5 44.3 73.9 46.1 C 79.1 39.1 93 37.4 100 42.6 C 107 37.4 122.6 39.1 127.8 47.8 C 140 46.1 150.5 54.8 147 66.9 C 153.9 75.6 153.9 89.6 147 100 C 143.5 94.8 138.3 93 133.1 98.3 C 127.8 89.6 117.4 89.6 112.2 96.5 C 107 91.3 100 91.3 94.8 96.5 C 89.6 87.8 77.4 87.8 72.2 96.5 C 65.2 91.3 56.5 93 51.3 100 Z'); } }, // approved base 3's
  bowl: { top: 95, cap(S, P) { H(S, P, 'M 49.5 110.4 C 42.6 82.6 51.3 53 75.6 44.3 C 89.6 39.1 110.4 39.1 124.4 44.3 C 148.7 53 157.4 82.6 150.5 108.7 C 148.7 113.9 143.5 113.9 141.8 108.7 C 140 100 134.8 93 127.8 89.6 C 124.4 96.5 117.4 101.7 108.7 103.5 C 107 100 103.5 98.3 100 98.3 C 96.5 105.2 89.6 108.7 80.9 108.7 C 77.4 107 73.9 105.2 70.4 105.2 C 66.9 112.2 61.7 117.4 54.8 118.3 C 52.1 115.7 50.4 113.9 49.5 110.4 Z'); } }, // approved base 1's
  swept: { top: 92, cap(S, P) { H(S, P, 'M 51 105.2 C 44 73.9 62 42.6 100 40.8 C 138 42.6 156 73.9 149 103.5 C 143.5 94.8 134 89.6 125 87.8 C 121.3 94.8 114 98.3 105.2 100 C 103.5 96.5 101.7 94.8 98.3 93 C 93 101.7 84.3 107 73.9 108.7 C 70.4 115.7 63.5 120.9 56.5 122.6 C 53.6 117.4 51 112.2 51 105.2 Z'); } }, // approved base 2's
  slick: { top: 84, cap(S, P) { H(S, P, slickCap); } },
  messy: { top: 95, cap(S, P) {
    const pts = [], R = [51, 62, 52, 63, 53, 66, 54, 64, 53, 65, 52, 63, 51, 61, 51];
    R.forEach((r, i) => { const a = (172 + i * (196 / (R.length - 1))) * Math.PI / 180; pts.push([100 + r * Math.cos(a), 82 + r * Math.sin(a)]); });
    H(S, P, poly(pts.concat([[143, 113], [131, 98], [122, 111], [110, 96], [99, 110], [88, 95], [78, 111], [68, 98], [57, 114]])));
  } },
  curly: { top: 96, cap(S, P) {
    const rim = Array.from({ length: 12 }, (_, i) => { const a = (166 + i * (208 / 11)) * Math.PI / 180; return [100 + 43 * Math.cos(a), 84 + 43 * Math.sin(a), 13]; });
    H(S, P, slickCap + ' ' + circles(rim.concat(fringe(93, 6, 10.5, 61, 139, 9), [[100, 70, 34]])));
  } },
  afro: { top: 97, ears: true, back(S, P) {
    const rim = Array.from({ length: 15 }, (_, i) => { const a = (140 + i * (260 / 14)) * Math.PI / 180; return [100 + 55 * Math.cos(a), 80 + 55 * Math.sin(a), 15]; });
    HB(S, P, circles(rim.concat([[100, 80, 56]])), { name: 'hairBack' });
  }, cap(S, P) { H(S, P, slickCap + ' ' + circles(fringe(94, 6, 11, 60, 140, 10).concat([[100, 72, 36]])), { shadow: 4 }); } },
  bun: { top: 84, back(S, P) { HB(S, P, circ(100, 40, 16), { col: shade(P.col, 0.9) }); }, cap(S, P) { H(S, P, slickCap); } },
  topknot: { bare: true, cap(S, P) { STYLE.shaved.cap(S, P); S.shape(circ(100, 46, 11), { color: P.col, hair: true, shadow: 3, on: [P.head] }); } },
  ponytail: { top: 86, tail(S, P) { HB(S, P, ribbon(qcurve([99, 57], [117, 44], [114, 15], 10), (t) => 6.5 + 7 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.12)) - (t > 0.8 ? (t - 0.8) * 20 : 0)), { col: shade(P.col, 0.92), shadow: 0 }); }, cap(S, P) { H(S, P, slickCap); } },
  long: { top: 88, ears: true, back(S, P) { // parted in the middle: a mass behind the head, and a lock down each side onto the shoulders, out from under the top
    HB(S, P, 'M 43 114 C 36 74 58 45 100 45 C 142 45 164 74 157 114 Z', { col: shade(P.col, 0.88) });
  }, cap(S, P) {
    const locks = [-1, 1].map((s) => ribbon([[100 + s * 46, 90], [100 + s * 51.5, 108], [100 + s * 53, 126], [100 + s * 50.5, 144], [100 + s * 47, 158]], (t) => 8.5 + 2.5 * Math.sin(Math.PI * t) - 6 * t * t)).join(' ');
    S.shape(locks, { color: shade(P.col, 0.94), hair: true, shadow: 3, name: 'locks' });
    S.shape(partCap, { color: P.col, hair: true, shadow: 4, on: [P.head, S.ids.locks] });
  } },
  bob: { top: 92, ears: true, cap(S, P) { S.shape('M 46 124 C 39 96 44 62 64 48 C 80 38 120 38 136 48 C 156 62 161 96 154 124 C 152 134 141 136 138.5 128 C 141 112 139 100 131 93 C 123 97 112 100 100 96 C 88 100 77 97 69 93 C 61 100 59 112 61.5 128 C 59 136 48 134 46 124 Z', { color: P.col, hair: true, shadow: 4 }); } },
  braids: { top: 88, back(S, P) { // the braids hang from behind the ears, over the shoulders, and come out from under the hair
    for (const s of [-1, 1]) HB(S, P, braid([[100 + s * 51, 118, 9.5], [100 + s * 54, 132, 9], [100 + s * 55, 145.5, 8.4], [100 + s * 55, 158, 7.6], [100 + s * 54.5, 168.5, 5.4]]), { col: shade(P.col, 0.93) });
  }, cap(S, P) { H(S, P, partCap); } },
  backbraid: { top: 86, tail(S, P) { HB(S, P, braid([[100, 44, 12.5], [103, 29, 11], [102, 15.5, 9.4], [100.5, 6, 5.6]]), { col: shade(P.col, 0.92), shadow: 0 }); }, cap(S, P) { H(S, P, slickCap); } },
  pigtails: { top: 88, back(S, P) { for (const s of [-1, 1]) { const pts = [[44, 76], [57, 68], [70, 80], [73, 101], [65, 118], [54, 111], [49, 93]].map(([x, y]) => [100 + s * x, y]); HB(S, P, blob(s > 0 ? pts : pts.reverse()), { col: shade(P.col, 0.92) }); } },
    cap(S, P) { H(S, P, partCap); } },
  locs: { top: 95, ears: true, back(S, P) { // thick strands: short ones round the back of the head, longer ones hanging at the sides
    const rim = Array.from({ length: 7 }, (_, i) => { const a = (198 + i * 24) * Math.PI / 180; return [100 + 45 * Math.cos(a), 88 + 45 * Math.sin(a), 12.5]; });
    const side = [];
    for (const s of [-1, 1]) for (const [x, y1, w] of [[47, 152, 7], [57.5, 139, 6.6]]) side.push(ribbon([[100 + s * (x - 3), 92], [100 + s * x, (92 + y1) / 2], [100 + s * (x + 1), y1]], () => w));
    HB(S, P, circles(rim) + ' ' + side.join(' ') + ' ' + ell(100, 86, 50, 46), { col: shade(P.col, 0.92) });
  }, cap(S, P) { H(S, P, CAP + ' C 149 98 132 90 100 90 C 68 90 51 98 49 106 Z ' + circles(fringe(92, 5, 8.6, 64, 136, 7))); } },
  mohawk: { bare: true, cap(S, P) { // a crest from the brow to past the back of the head, the sides cut to the scalp
    STYLE.shaved.cap(S, P);
    const L = [[100, 18], [93, 29], [87, 27], [90, 41], [83, 41], [87, 55], [80, 57], [85, 70], [80, 75], [87, 87], [92, 96], [100, 102]];
    S.shape(poly(symCW(L)), { color: P.col, hair: true, shadow: 4, on: [P.head] });
  } },
  balding: { bare: true, cap(S, P) { // the top bare, soft tufts left over the ears
    const cs = []; for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const a = (162 + i * 10.5) * Math.PI / 180; cs.push([100 - s * 50 * Math.cos(a), 93 + 50 * Math.sin(a), 9.6 - i * 0.5]); }
    H(S, P, circles(cs), { shadow: 3 });
  } },
};

// ---------------------------------------------------------------- facial hair (over the head; P.fc = its colour)
// the horseshoe: sideburns down both cheeks and round the jaw as one shape, the curve inside it; out = how far it stands
// off the jaw, low = its lowest point
const horseshoe = (out, low, inY = 143.5, cheek = 0) => `M 55 100 C 57 103 60 103.5 62 102 C ${f(63 + cheek)} 122 ${f(73 + cheek)} ${f(137 - cheek * 0.4)} 86 141.5 C 92 ${f(inY + 0.5)} 96 ${f(inY)} 100 ${f(inY)} C 104 ${f(inY)} 108 ${f(inY + 0.5)} 114 141.5 C ${f(127 - cheek)} ${f(137 - cheek * 0.4)} ${f(137 - cheek)} 122 138 102 C 140 103.5 143 103 145 100 C 146 106 146.5 111 146 116 C ${f(147 + out)} 124 ${f(143 + out)} ${f(low - 14)} ${f(124 + out * 0.5)} ${f(low - 4)} C 112 ${f(low + 1)} 88 ${f(low + 1)} ${f(76 - out * 0.5)} ${f(low - 4)} C ${f(57 - out)} ${f(low - 14)} ${f(53 - out)} 124 54 116 C 53.5 111 54 106 55 100 Z`;
// a moustache: two soft halves meeting under the middle, the ends hanging a little
const tache = (y, w = 1, droop = 0) => [-1, 1].map((s) => { const pts = [[0, -3.5], [12, -7], [24, -3], [32 , 6 + droop], [26, 9 + droop], [13, 6.5], [0, 6]].map(([x, yy]) => [100 + s * x * w, y + yy]); return blob(s > 0 ? pts : pts.reverse(), 0.9); }).join(' ');
const FACE = {
  none: {},
  stubble: { on(S, P) { // the approved base 3's stubble: a soft shadow of the hair's colour on the jaw
    const c = mixc(P.fc, P.skin.base, 0.3);
    S.def(`<linearGradient id="gStub" x1="0" y1="112" x2="0" y2="153" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset="0.4" stop-color="${c}" stop-opacity="0.4"/><stop offset="1" stop-color="${c}" stop-opacity="0.58"/></linearGradient>`);
    S.raw(`<use href="#${P.head}" fill="url(#gStub)"/>`);
  } },
  moustache: { noCurve: true, over(S, P) { S.shape(tache(131, 1, 1), { color: P.fc, hair: P.fh, shadow: 3, on: [P.head] }); } },
  vandyke: { noCurve: true, over(S, P) { FACE.goatee.over(S, P); S.shape(tache(131, 0.82, 0), { color: P.fc, hair: P.fh, shadow: 3, on: [P.head] }); } },
  goatee: { over(S, P) { S.shape('M 87 143.5 C 91 141.5 95 143.5 100 143.5 C 105 143.5 109 141.5 113 143.5 C 116 152 111 163 100 168 C 89 163 84 152 87 143.5 Z', { color: P.fc, hair: P.fh, shadow: 3 }); } },
  chops: { over(S, P) { for (const s of [-1, 1]) { const pts = [[55, 100], [62.5, 101.5], [65, 116], [71, 129], [80, 140], [78, 150.5], [66, 153], [53, 141], [49.5, 127], [54, 116]].map(([x, y]) => [s < 0 ? x : 200 - x, y]); S.shape(blob(s < 0 ? pts : pts.reverse(), 0.9), { color: P.fc, hair: P.fh, shadow: 3 }); } } },
  scruff: { over(S, P) { S.shape(horseshoe(2, 159, 143.5, 4), { color: P.fc, hair: P.fh, shadow: 3 }); } },
  full: { over(S, P) { S.shape(circles([[81, 159, 9.5], [100, 164, 10.5], [119, 159, 9.5]]), { color: P.fc, hair: P.fh, shadow: 4 }); S.shape(horseshoe(5, 166), { color: P.fc, hair: P.fh, shadow: 0 }); } },
  long: { noCurve: true, over(S, P) {
    S.shape(`M 55 100 C 57 103 60 103.5 62 102 C 64 118 71 128 84 131 L 116 131 C 129 128 136 118 138 102 C 140 103.5 143 103 145 100 C 146 106 146.5 111 146 116 C 157 132 150 153 133 170 C 122 182 110 189 100 192 C 90 189 78 182 67 170 C 50 153 43 132 54 116 C 53.5 111 54 106 55 100 Z`, { color: P.fc, hair: P.fh, shadow: 4 });
    S.shape(tache(133, 1.05, 2), { color: light(P.fc, 1.07), hair: false, shadow: 3, side: true });
  } },
  braided: { over(S, P) {
    S.shape(circles([[100, 170, 8], [100, 182, 6.8], [100, 192, 5.6]]), { color: shade(P.fc, 0.93), hair: P.fh, shadow: 0 });
    S.shape(horseshoe(4, 165), { color: P.fc, hair: P.fh, shadow: 4 });
    S.shape(rr(100, 176, 12, 5, 2.4), { color: METALS[P.metal][0], shadow: 2 });
  } },
  forked: { over(S, P) { S.shape('M 74 150 C 82 157 92 160 98.5 159 C 99 170 93 182 81 189 C 74 178 72 163 74 150 Z M 101.5 159 C 108 160 118 157 126 150 C 128 163 126 178 119 189 C 107 182 101 170 101.5 159 Z', { color: P.fc, hair: P.fh, shadow: 4 }); S.shape(horseshoe(4, 163), { color: P.fc, hair: P.fh, shadow: 0 }); } },
};

// ---------------------------------------------------------------- the figure
export function normal(spec = {}) { // every field filled in, unknown names put back to the base's
  const s = { ...BASE, ...spec };
  if (!BODIES[s.body]) s.body = BASE.body; if (!SKINS[s.skin]) s.skin = BASE.skin; if (!HAIRS[s.hair]) s.hair = BASE.hair; if (!HAIR_COLOURS[s.hairCol]) s.hairCol = BASE.hairCol;
  if (!BEARDS[s.beard]) s.beard = BASE.beard; if (!TUNICS[s.tunic]) s.tunic = BASE.tunic; if (!CLOTHS[s.cloth]) s.cloth = BASE.cloth; if (!METALS[s.metal]) s.metal = BASE.metal;
  s.jewels = (Array.isArray(s.jewels) ? s.jewels : []).filter((j) => JEWELS[j]);
  if (s.cloth2 && !CLOTHS[s.cloth2]) delete s.cloth2;
  return s;
}
const describe = (s) => `${BODIES[s.body].name} build, ${SKINS[s.skin].name.toLowerCase()} skin, ${HAIRS[s.hair].name.toLowerCase()}${s.hair === 'bald' ? '' : ' (' + HAIR_COLOURS[s.hairCol].name.toLowerCase() + ')'}, ${BEARDS[s.beard].name.toLowerCase()}, ${TUNICS[s.tunic].name.toLowerCase()} in ${CLOTHS[s.cloth].name.toLowerCase()}${s.jewels.length ? ', ' + s.jewels.map((j) => JEWELS[j].name.toLowerCase()).join(', ') : ''}`;

export function folkSvg(specIn) {
  const sp = normal(specIn), B = bodyOf(sp.body), st = STYLE[sp.hair] || {}, fa = FACE[sp.beard] || {};
  const S = new Sprite(`FOLK (round 19, lane bases19; made by js/folk.js, do not edit by hand): ${describe(sp)}. Parts in draw order inside #sprite; no outline in the file (js/parts.js adds it). Facing = DOWN (+y), centre (100,100).`);
  const skin = skinDefs(S, SKINS[sp.skin].c, st.bare ? 95 : st.top || 95, SKINS[sp.skin].fantasy);
  const cloth = CLOTHS[sp.cloth].c, cloth2 = CLOTHS[sp.cloth2 || ({ oat: 'rust', flax: 'woad', brown: 'ochre', grey: 'rust', moss: 'oat', rust: 'oat', woad: 'flax', ochre: 'brown', plum: 'flax' })[sp.cloth]].c;
  const [metal, glint] = METALS[sp.metal], has = (j) => sp.jewels.includes(j);
  const P = { col: HAIR_COLOURS[sp.hairCol].c, fc: HAIR_COLOURS[sp.hairCol].c, fh: true, skin, B, metal: sp.metal, headD: HEADS[sp.head && HEADS[sp.head] ? sp.head : B.head] };
  const T = B.scale ? `translate(100 104) scale(${B.scale}) translate(-100 -104)` : null;
  const gold = (d, o = {}) => S.shape(d, { color: metal, shadow: 2, ...o });

  // ---- back: a tail of hair that swings behind the head
  if (st.tail) { S.group('back', [100, 52], 'the tail of hair', T); st.tail(S, P); }

  // ---- body
  S.group('body', null, null, T);
  const rope = '#B4975F';
  // the tunic over the shoulders (and the belly, on the fat build)
  let shDecor = '';
  const hem = (s) => { const x = 100 + s * (B.hw - 15); return `<path d="M ${f(x)} ${f(B.cy - 30)} Q ${f(x + s * 12)} ${f(B.cy)} ${f(x)} ${f(B.cy + 30)}" fill="none" stroke="${shade(cloth, 0.72)}" stroke-width="3.6" opacity="0.5"/>`; };
  // the rough weave of sackcloth: a few short ticks, some along, some across (shapes, not lines round anything)
  const seam = (s) => [[9, -15, 8], [19, -5, 96], [10, 7, 4], [20, 17, 92], [27, -17, 98], [29, 5, 6]].map(([dx, dy, a]) => dash(100 + s * (B.hw - dx), B.cy + dy, s * a, 4.6, shade(cloth, 0.62), 2.3, 0.6)).join('');
  const bareArms = sp.tunic === 'sleeveless' || sp.tunic === 'torn';
  if (!bareArms) shDecor += hem(-1) + hem(1) + seam(-1) + seam(1);
  if (sp.tunic === 'patched') {
    const patch = (x, y, w, h, a, c) => `<g transform="${frame(x, y, a)}"><path d="${rr(0, 2, w, h, 3)}" fill="${INK}" opacity="0.25"/><path d="${rr(0, 0, w, h, 3)}" fill="${c}"/>${dash(-w / 2 + 1, -h / 2 + 1, 45, 5, shade(c, 0.5), 2.2, 0.9)}${dash(w / 2 - 1, -h / 2 + 1, -45, 5, shade(c, 0.5), 2.2, 0.9)}${dash(w / 2 - 1, h / 2 - 1, 45, 5, shade(c, 0.5), 2.2, 0.9)}${dash(-w / 2 + 1, h / 2 - 1, -45, 5, shade(c, 0.5), 2.2, 0.9)}</g>`;
    shDecor += patch(100 - B.hw + 15, B.cy + 9, 15, 14, -12, cloth2) + patch(100 + B.hw - 13, B.cy - 6, 12, 12, 10, shade(cloth, 0.7));
  }
  if (sp.tunic === 'roped') { // a rope tied over one shoulder
    const x0 = 100 - B.hw + 6, sp1 = [[x0 - 4, B.cy - 30], [x0 + 8, B.cy - 6], [x0 + 22, B.cy + 34]];
    shDecor += `<path d="${bandPath(sp1.map(([x, y]) => [x, y + 2.5]), 3.6)}" fill="${INK}" opacity="0.28"/><path d="${bandPath(sp1, 3.6)}" fill="${rope}"/>` + [0.18, 0.36, 0.54, 0.72].map((t) => dash(x0 - 4 + 26 * t + 1, B.cy - 30 + 64 * t, -25, 6.5, shade(rope, 0.62), 2.2, 0.85)).join('');
  }
  if (has('armbands') ) { // a band round each upper arm
    for (const s of [-1, 1]) { const x = 100 + s * (B.hw - 13), spn = [[x + s * 4, B.cy - 36], [x - s * 3, B.cy], [x + s * 4, B.cy + 36]];
      shDecor += `<path d="${bandPath(spn.map(([px, py]) => [px, py + 2.2]), 3.4)}" fill="${INK}" opacity="0.3"/><path d="${bandPath(spn, 3.4)}" fill="${s > 0 ? shade(metal, 0.82) : metal}"/><path d="${bandPath(spn.map(([px, py]) => [px - 1.2, py]), 0.9)}" fill="${glint}" opacity="0.7"/>`; }
  }
  if (bareArms) {
    // bare arms: the shoulders are skin, the tunic a narrower piece over them (torn: its ends ragged)
    S.shape(B.sh, { fill: 'url(#gArm)', side: false, shadow: 0, name: 'shoulders', decor: has('armbands') ? shDecor : '' });
    const inner = B.hw - 19;
    let d;
    if (sp.tunic === 'torn') { const zig = (s) => { const x = 100 + s * inner, ys = [-40, -27, -15, -3, 9, 21, 33, 44]; return ys.map((y, i) => [x + s * (i % 2 ? 7 : -3), B.cy + y]); };
      d = poly([[100 - inner + 8, B.cy - 60], [100 + inner - 8, B.cy - 60], ...zig(1), [100 + inner - 8, B.cy + 80], [100 - inner + 8, B.cy + 80], ...zig(-1).reverse()]); }
    else d = ell(100, B.cy + 4, inner, 74); // the armholes curve in round the shoulders
    if (B.belly) d += ' ' + ell(100, B.cy + 40, B.hw + 4, 42); // the fat build: the tunic still covers the whole belly
    S.def(`<clipPath id="shClip"><use href="#${S.ids.shoulders}"/></clipPath>`);
    S.raw(`<g clip-path="url(#shClip)">`); S.shape(d, { color: cloth, shadow: 3, catch: false, decor: B.belly ? bellyRope(B, rope) : '' }); S.raw('</g>');
  } else S.shape(B.sh, { color: cloth, shadow: 0, name: 'shoulders', decor: shDecor + (B.belly ? bellyRope(B, rope) : '') });
  if (sp.tunic === 'yoke') { // a second cloth over the shoulders
    S.def(`<clipPath id="shClip"><use href="#${S.ids.shoulders}"/></clipPath>`);
    S.raw(`<g clip-path="url(#shClip)">`); S.shape(shoulderBand(100, B.cy - 3, B.hw - 13, 40), { color: cloth2, shadow: 3, catch: false }); S.raw('</g>');
  }
  if (B.belly) bellyKnot(S, B, rope);
  // things round the neck hang out from under the chin, so they are drawn before the head
  if (has('necklace')) {
    S.shape(bandPath(qcurve([70, 140], [100, 186], [130, 140], 11), 1.9), { color: '#7A5234', shadow: 2 });
    S.shape('M 100 158 C 105 163 107.5 168 107.5 172 C 107.5 177 104 180 100 180 C 96 180 92.5 177 92.5 172 C 92.5 168 95 163 100 158 Z', { color: '#3FA7A0', shadow: 2, decor: '<ellipse cx="97.4" cy="170" rx="2" ry="3.2" fill="#E9FFFA" opacity="0.8"/>' });
  }
  if (has('beads')) { // a string of wooden beads, one big one in front (the Monk's, smaller)
    const pts = qcurve([66, 138], [100, 190], [134, 138], 13).slice(1, -1), big = pts.splice(5, 1)[0];
    S.shape(circles(pts.map(([x, y]) => [x, y, 5.6])), { color: '#9A6238', shadow: 2 });
    S.shape(circ(big[0], big[1] + 1, 7.4), { color: '#C4473D', shadow: 2 });
  }
  if (has('torc')) { // a thick open ring, its two knobs meeting in front
    for (const s of [-1, 1]) gold(bandPath(qcurve([100 + s * 37, 132], [100 + s * 30, 160], [100 + s * 9, 163], 8), 4.2), { color: s > 0 ? shade(metal, 0.86) : metal });
    for (const s of [-1, 1]) gold(circ(100 + s * 8.5, 163.5, 6.4), { decor: `<circle cx="${100 + s * 8.5 - 2}" cy="161.5" r="1.8" fill="${glint}"/>` });
  }
  if (st.back) st.back(S, P);
  // ears, head
  if (!st.ears) { S.shape(ell(52.1, 108.7, B.ear[0], B.ear[1]), { fill: skin.earL, shadow: 0, side: false }); S.shape(ell(147.9, 108.7, B.ear[0], B.ear[1]), { fill: skin.earR, shadow: 0, side: false }); }
  P.head = S.shape(P.headD, { fill: st.bare ? 'url(#gBald)' : 'url(#gFace)', shadow: 5, side: false, name: 'head',
    decor: '<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>' + (sp.hair === 'bald' || sp.hair === 'balding' ? `<ellipse cx="84" cy="${sp.hair === 'balding' ? 76 : 70}" rx="15" ry="10" fill="${skin.shine}" opacity="0.5"/>` : '') });
  S.def(`<clipPath id="headClip"><use href="#${P.head}"/></clipPath>`);
  S.def(`<linearGradient id="gScalp" x1="0" y1="70" x2="0" y2="84" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${skin.base}" stop-opacity="0"/><stop offset="1" stop-color="${skin.base}" stop-opacity="0.35"/></linearGradient>`);
  if (fa.on) fa.on(S, P);
  if (st.cap) st.cap(S, P);
  // the one curve on the face (the designer calls it the nose); a puffy moustache covers it
  if (!fa.noCurve) S.raw(`<path d="M96 136.5 Q100 139 104 136.5" fill="none" stroke="${B.rosy ? mixc(skin.mouth, '#C2605A', 0.35) : skin.mouth}" stroke-width="2.5" stroke-linecap="round"/>`);
  if (has('nosering')) S.raw(`<circle cx="100" cy="142.2" r="3.4" fill="none" stroke="${metal}" stroke-width="2.3"/>`);
  if (fa.over) fa.over(S, P);
  // on the head: a band round the brow, rings in the ears
  if (has('headband')) { // a strip of cloth tied round the brow, its knot and two ends at the side
    S.shape(ribbon([[150, 100], [159, 95], [167, 87]], (t) => 2.2 + 1.6 * t) + ' ' + ribbon([[150, 102], [160, 103], [169, 99]], (t) => 2.2 + 1.6 * t) + ' ' + circ(151.5, 100.5, 5), { color: shade(cloth2, 0.9), shadow: 2 });
    S.shape('M 49.5 95 C 66 83 134 83 150.5 95 L 151 106 C 134 94.5 66 94.5 49 106 Z', { color: cloth2, shadow: 2 });
  }
  if (has('circlet')) { gold('M 50 96.5 C 66 85.5 134 85.5 150 96.5 L 150.4 103 C 134 92.5 66 92.5 49.6 103 Z'); S.shape(circ(100, 89.6, 5.4), { color: '#C63B45', shadow: 1.5, decor: `<circle cx="98.2" cy="87.8" r="1.7" fill="#FFE1DC" opacity="0.9"/>` }); }
  if (!st.ears) {
    if (has('earrings')) for (const s of [-1, 1]) gold(circ(100 + s * 51.5, 119.5, 6.6) + ' ' + `M ${f(100 + s * 51.5 - 3)} 119.5 A 3 3 0 1 0 ${f(100 + s * 51.5 + 3)} 119.5 A 3 3 0 1 0 ${f(100 + s * 51.5 - 3)} 119.5 Z`, { color: s > 0 ? shade(metal, 0.86) : metal, rule: 'evenodd' });
    if (has('studs')) for (const s of [-1, 1]) gold(circ(100 + s * 52.5, 113.5, 3.8), { shadow: 1.5, decor: `<circle cx="${f(100 + s * 52.5 - 1.2)}" cy="112.2" r="1.3" fill="${glint}"/>` });
  }

  // ---- the hands: plain fists (no arms), a bangle at the wrist, a ring on a finger
  const fist = (id, pivot, [cx, cy, a], ring) => {
    S.group(id, pivot, 'a bare fist', T);
    const [w, h] = B.hand, Tf = frame(cx, cy, a);
    S.shape(rr(0, 0, w, h, 8), { fill: 'url(#gHand)', T: Tf, shadow: 3, side: false });
    if (has('bangles')) gold(rr(0, -h / 2 + 2.4, w + 2.5, 6.4, 3), { T: Tf, decor: `<rect x="${f(-w / 2)}" y="${f(-h / 2 + 0.4)}" width="${f(w * 0.45)}" height="1.8" rx="0.9" fill="${glint}" opacity="0.8"/>` });
    if (has('rings') && ring) gold(rr(ring * w * 0.2, h / 2 - 4.6, 7, 5, 2.2), { T: Tf, shadow: 1.2 });
  };
  fist('arm-l', B.pl, B.hl, -1);
  fist('arm-r', B.pr, B.hr, 1);
  return S.svg();
}
// the fat build's rope belt: an arc across the belly, and its knot with two ends hanging
const bellySpine = (B) => qcurve([100 - B.hw - 2, B.cy + 24], [100, B.cy + 78], [100 + B.hw + 2, B.cy + 24], 13);
function bellyRope(B, rope) {
  const sp = bellySpine(B);
  return `<path d="${bandPath(sp.map(([x, y]) => [x, y + 2.6]), 3.8)}" fill="${INK}" opacity="0.28"/><path d="${bandPath(sp, 3.8)}" fill="${rope}"/>` + sp.filter((_, i) => i % 2 === 1).map(([x, y], i) => dash(x, y, 62 - i * 24, 6.5, shade(rope, 0.62), 2.2, 0.8)).join('');
}
function bellyKnot(S, B, rope) {
  const [x, y] = bellySpine(B)[5];
  S.shape(bandPath([[x + 1, y], [x - 1.5, y + 6.5], [x - 3.5, y + 12.5]], 2.8) + ' ' + bandPath([[x + 3, y], [x + 5.5, y + 6], [x + 6, y + 11]], 2.8), { color: shade(rope, 0.9), shadow: 2 });
  S.shape(circ(x + 2, y, 5.6), { color: rope, shadow: 2 });
}

// ---------------------------------------------------------------- a folk as a short string, and a random one
const ORDER = ['body', 'skin', 'hair', 'hairCol', 'beard', 'tunic', 'cloth', 'metal'];
export const folkKey = (spec) => { const s = normal(spec); return ORDER.map((k) => s[k]).join('.') + '.' + s.jewels.join('+'); };
export function parseFolkKey(key) { const p = String(key).replace(/^folk:/, '').split('.'), s = {}; ORDER.forEach((k, i) => { s[k] = p[i]; }); s.jewels = (p[ORDER.length] || '').split('+').filter(Boolean); return normal(s); }
export const folkUrl = (spec) => 'folk:' + folkKey(spec);
export const isFolkUrl = (url) => typeof url === 'string' && url.startsWith('folk:');

// rnd: a function giving 0..1 (the caller's own dice, so a figure's look never spends the game's). o.fantasy: skins
// from the fantasy set too.
export function randomFolk(rnd, o = {}) {
  const pick = (list) => list[Math.floor(rnd() * list.length) % list.length];
  const weigh = (table) => { let t = 0; for (const k in table) t += table[k]; let r = rnd() * t; for (const k in table) { r -= table[k]; if (r <= 0) return k; } return Object.keys(table)[0]; };
  const s = {};
  s.body = o.body || weigh({ average: 4, skinny: 2, fat: 2, brute: 2, feminine: 4, old: 2, young: 1.5 });
  s.skin = pick(Object.keys(SKINS).filter((k) => !SKINS[k].fantasy || o.fantasy));
  const fem = s.body === 'feminine', old = s.body === 'old', young = s.body === 'young';
  s.hair = fem ? weigh({ long: 4, bob: 3, braids: 3, bun: 3, ponytail: 3, backbraid: 2, curly: 2, afro: 1.5, locs: 1.5, pigtails: 1, swept: 1.5, bowl: 1, shaved: 0.5, crop: 1 })
    : old ? weigh({ balding: 5, bald: 3, slick: 2, bun: 2, crop: 2, long: 1.5, messy: 1.5, swept: 1, ponytail: 1 })
    : young ? weigh({ bowl: 3, messy: 3, crop: 2, pigtails: 2.5, swept: 2, curly: 2, braids: 1.5, ponytail: 1.5, afro: 1, shaved: 1 })
    : weigh({ bald: 1.5, shaved: 2, crop: 3, bowl: 2, swept: 2.5, slick: 2, messy: 3, curly: 2, afro: 1.5, bun: 1, topknot: 1.5, ponytail: 1.5, long: 1.5, locs: 1.5, mohawk: 1.2, balding: 1.5, backbraid: 0.8 });
  const darkSkin = ['brown', 'dark', 'deep'].includes(s.skin);
  s.hairCol = old ? weigh({ grey: 5, white: 5, black: 0.5, sandy: 0.5 }) : darkSkin ? weigh({ black: 6, umber: 3, brown: 1, grey: 0.6, ginger: 0.3, blonde: 0.2 })
    : weigh({ black: 2, umber: 3, brown: 3.5, chestnut: 2, ginger: 1.6, sandy: 2, blonde: 2, grey: 0.7 });
  s.beard = fem || young ? 'none' : old ? weigh({ none: 2, stubble: 1, moustache: 1.5, long: 3, full: 2, chops: 1.5, goatee: 1, forked: 1 })
    : weigh({ none: 4, stubble: 2.5, moustache: 1.5, vandyke: 1, goatee: 1.2, chops: 1, scruff: 2, full: 2, long: 0.6, braided: 0.8, forked: 0.6 });
  s.tunic = weigh({ sack: 4, patched: 2.5, roped: 2, sleeveless: s.body === 'brute' ? 4 : 1.5, torn: s.body === 'brute' ? 2.5 : 1, yoke: 2 });
  s.cloth = weigh({ oat: 5, flax: 2.5, brown: 2.5, grey: 2, moss: 1.5, rust: 1.5, woad: 1.5, ochre: 1.2, plum: 0.8 });
  s.metal = weigh({ gold: 5, silver: 2.5, copper: 2 });
  const j = [];
  if (rnd() < (fem ? 0.5 : 0.2)) j.push(rnd() < 0.6 ? 'earrings' : 'studs');
  if (rnd() < 0.08) j.push('nosering');
  if (rnd() < 0.3) j.push(weigh({ necklace: 3, beads: 3, torc: 1.5 }));
  if ((s.tunic === 'sleeveless' || s.tunic === 'torn') && rnd() < 0.4) j.push('armbands'); // (on bare arms: over a sleeve they read as stripes)
  if (rnd() < 0.18) j.push('bangles');
  if (rnd() < 0.15) j.push('rings');
  if (rnd() < 0.14) j.push(rnd() < 0.7 ? 'headband' : 'circlet');
  s.jewels = j;
  return normal(s);
}
// a small steady dice from a number (mulberry32)
export function dice(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
