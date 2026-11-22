// Round 15 (lane E): stills of art round 12's props, summons and weapon hands in the game, at game scale, for a
// before/after look (the lane wired them in place of the code drawings). Each still is the renderer bench's showcase
// (lab.html?m=show: the hero uses the ability on dummies, the real sim and renderer) taken through tools/labshot.mjs
// at phone size (844 x 390 at 2x, the bench's zoom 0.8 = the game's default zoom), then cropped round the thing and its hero.
//   node tools/wire-shots.mjs <before|after> [--port 8975] [--only haybale,totem] [--out clips/r15/wire] [--jobs 3]
// Writes <out>/<name>-<before|after>.png (the crop at game scale) and <out>/full/<name>-<tag>.png (the whole frame).
// Needs node tools/serve.mjs <port> running. Nothing here is read by the game.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const tag = args[0] || 'before', port = opt('port', '8975'), out = path.resolve(opt('out', 'clips/r15/wire')), jobs = +opt('jobs', 3);
const only = (opt('only', '') || '').split(',').filter(Boolean);
fs.mkdirSync(path.join(out, 'full'), { recursive: true });

// the Engineer's Tinker picks its tower at random: the dice are set so it picks the one wanted (util.js setSeed, searched
// for a seed whose next roll gives it; the hero is hurt for the medbay, which wants a friend under 60%)
const TOWER = (kind) => `const U = await import('./js/util.js'), K = await import('./js/kits.js'), A = K.ABILITIES.tinker, orig = A.use;
  const me = LAB.w.units.find((o) => o.kind === 'engineer'); ${kind === 'medbay' ? 'me.hp = me.maxHp * 0.5;' : ''}
  A.use = function (w, u, t, tier) { for (let n = 1; n < 500; n++) { U.setSeed(n); const r = U.rand(); const k = ${kind === 'medbay' ? "r < 0.6 ? 'medbay' : ''" : "['torcher', 'tesla', 'snowMortar'][Math.floor(r * 3)]"}; if (k === '${kind}') { U.setSeed(n); break; } } A.use = orig; return orig.call(this, w, u, t, tier); };`;
// name: { hero, ab, tier, pre (seconds stepped), kinds (what to frame: the hero and these), eval, zoom }
const CASES = {
  haybale: { hero: 'haymaker', ab: 'forkCharge', tier: 1, pre: 1.0, kinds: ['haybale'] },
  'haybale-alone': { hero: 'haymaker', ab: 'forkCharge', tier: 1, pre: 1.3, kinds: ['haybale'], eval: "const me = LAB.w.units.find((o) => o.kind === 'haymaker'); me.def = { ...me.def, draw: () => {} };" }, // (its rider left undrawn, nothing else changed: the bale itself)
  totem: { hero: 'shaman', ab: 'healTotem', tier: 1, pre: 1.9, kinds: ['totem'] },
  spirits: { hero: 'shaman', ab: 'rainDance', tier: 1, pre: 1.6, kinds: ['spiritBear', 'spiritEagle', 'spiritBeaver'] },
  cauldron: { hero: 'witch', ab: 'cursedBrew', tier: 1, pre: 1.6, kinds: ['cauldron'] },
  imp: { hero: 'warlock', ab: 'attack', tier: 1, pre: 1.2, kinds: ['warlockImp'] },
  demon: { hero: 'warlock', ab: 'summonImp', tier: 1, pre: 1.3, kinds: [] },
  beehive: { hero: 'beekeeper', ab: 'honeyPot', tier: 1, pre: 1.8, kinds: ['beehive'] },
  crate: { hero: 'quartermaster', ab: 'resupply', tier: 1, pre: 1.6, kinds: ['crate'] },
  barricade: { hero: 'quartermaster', ab: 'oilBlades', tier: 1, pre: 1.3, kinds: ['barricade'] },
  'barricade-spiked': { hero: 'quartermaster', ab: 'oilBlades', tier: 3, pre: 1.3, kinds: ['barricade'] },
  pavise: { hero: 'crossbowman', ab: 'pavise', tier: 1, pre: 1.1, kinds: ['pavise'] },
  bigBomb: { hero: 'grenadier', ab: 'bigBomb', tier: 1, pre: 1.5, kinds: ['bigBomb'] },
  torcher: { hero: 'engineer', ab: 'tinker', tier: 1, pre: 1.6, kinds: ['torcher'], eval: TOWER('torcher') },
  tesla: { hero: 'engineer', ab: 'tinker', tier: 1, pre: 1.6, kinds: ['tesla'], eval: TOWER('tesla') },
  mortar: { hero: 'engineer', ab: 'tinker', tier: 1, pre: 2.3, kinds: ['snowMortar'], eval: TOWER('snowMortar') },
  medbay: { hero: 'engineer', ab: 'tinker', tier: 1, pre: 2.6, kinds: ['medbay', 'medDrone'], eval: TOWER('medbay') },
  medDrone: { hero: 'engineer', ab: 'tinker', tier: 1, pre: 3.5, kinds: ['medDrone'], eval: TOWER('medbay') },
  windup: { hero: 'engineer', ab: 'shockMine', tier: 1, pre: 1.1, kinds: ['windup'] },
  'windup-walk': { hero: 'engineer', ab: 'shockMine', tier: 1, pre: 0.75, kinds: ['windup'] },
  'mortar-shot': { hero: 'engineer', ab: 'tinker', tier: 1, pre: 3.05, kinds: ['snowMortar'], eval: TOWER('snowMortar') },
  'imp-alone': { hero: 'warlock', ab: 'attack', tier: 1, pre: 2.4, kinds: ['warlockImp'] },
  // the heroes' own weapon hands: standing ready, and in the middle of a blow
  'valkyrie-rest': { hero: 'valkyrie', ab: 'attack', tier: 1, pre: 0.25, kinds: [] },
  'valkyrie-strike': { hero: 'valkyrie', ab: 'attack', tier: 1, pre: 0.55, kinds: [] },
  'samurai-rest': { hero: 'samurai', ab: 'attack', tier: 1, pre: 0.25, kinds: [] },
  'samurai-strike': { hero: 'samurai', ab: 'attack', tier: 1, pre: 0.52, kinds: [] },
  'trapper-rest': { hero: 'trapper', ab: 'attack', tier: 1, pre: 0.25, kinds: [] },
  'trapper-trap': { hero: 'trapper', ab: 'jawTrap', tier: 1, pre: 1.4, kinds: [] },
  'bulwark-rest': { hero: 'bulwark', ab: 'attack', tier: 1, pre: 0.25, kinds: [] },
  'bulwark-strike': { hero: 'bulwark', ab: 'attack', tier: 1, pre: 0.53, kinds: [] },
  'warhelm-rest': { hero: 'warhelm', ab: 'attack', tier: 1, pre: 0.25, kinds: [] },
  'warhelm-storm': { hero: 'warhelm', ab: 'warHorn', tier: 1, pre: 1.55, kinds: [] },
  'bearskin-rest': { hero: 'bearskin', ab: 'attack', tier: 1, pre: 0.25, kinds: [] },
  'bearskin-claws': { hero: 'bearskin', ab: 'bearRoar', tier: 1, pre: 0.72, kinds: [] },
};
// where the hero and the things stand on screen (device pixels), and how many pixels a room unit is
const PROBE = (c) => `(async () => { const { view } = await import('./js/render.js'); const m = view.m, d = view.dpr, at = (u) => [(m[0] * u.x + m[2] * u.y + m[4]) * d, (m[1] * u.x + m[3] * u.y + m[5]) * d, u.vr * Math.hypot(m[0], m[1]) * d, u.kind];
  const L = LAB.w.units.filter((o) => !o.dead && (o.kind === '${c.hero}' || ${JSON.stringify(c.kinds)}.includes(o.kind))).map(at); return { units: L, ppu: Math.hypot(m[0], m[1]) * d }; })()`;

const list = Object.entries(CASES).filter(([n]) => !only.length || only.includes(n));
const run = ([name, c]) => new Promise((resolve) => {
  const full = path.join(out, 'full', `${name}-${tag}.png`);
  const q = `m=show&hero=${c.hero}&ab=${c.ab}&tier=${c.tier}&loop=30&zoom=${c.zoom || 0.8}`;
  const a = ['tools/labshot.mjs', full, '--port', port, '--w', '844', '--h', '390', '--q', q, '--pre', String(c.pre), '--probe', PROBE(c)];
  if (c.eval) a.push('--eval', c.eval);
  execFile(process.execPath, a, { maxBuffer: 1 << 24 }, (err, so, se) => {
    const line = (so || '').split('\n').find((l) => l.startsWith('probe ')), errs = (so + se).split('\n').filter((l) => /page errors:|Error/.test(l) && !/^no page errors/.test(l));
    if (err || !line) { console.log(`FAILED ${name}`, (se || so || '').slice(0, 400)); resolve(); return; }
    const p = JSON.parse(line.slice(6));
    // a crop round the hero and the things (at least 300 x 220 device pixels), from the full frame
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y, r] of p.units) { x0 = Math.min(x0, x - r * 2.6); y0 = Math.min(y0, y - r * 2.6); x1 = Math.max(x1, x + r * 2.6); y1 = Math.max(y1, y + r * 2.6); }
    if (!p.units.length) { x0 = 0; y0 = 0; x1 = 1688; y1 = 780; }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, W = Math.max(300, x1 - x0), H = Math.max(220, y1 - y0);
    const box = [Math.max(0, Math.round(cx - W / 2)), Math.max(0, Math.round(cy - H / 2)), Math.min(1688, Math.round(cx + W / 2)), Math.min(780, Math.round(cy + H / 2))];
    const crop = path.join(out, `${name}-${tag}.png`);
    execFile('python', ['-c', `from PIL import Image; Image.open(r'${full}').crop(tuple(${JSON.stringify(box)})).save(r'${crop}')`], (e2) => {
      console.log(`${e2 ? 'CROP FAILED' : 'ok'} ${name} ${JSON.stringify(p.units.map((u) => u[3]))} ppu ${p.ppu.toFixed(2)}${errs.length ? ' ' + errs.join(' | ').slice(0, 300) : ''}`); resolve();
    });
  });
});
let i = 0; const next = async () => { while (i < list.length) await run(list[i++]); };
await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, next));
console.log(`${list.length} stills -> ${path.relative(process.cwd(), out)}`);
