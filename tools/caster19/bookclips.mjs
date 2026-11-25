// Round 19 (lane caster19): one short film of each changed attack and ability, recorded off the Book's own preview player
// (a real little fight: tools/preview18/clips.mjs's way), stepped a frame at a time. Framed to follow (round 19 check:
// "the caster is cut off at the frame edge ... frame your clips to follow the hero"): each frame is cut from the Book's
// canvas round the hero (or round what the clip names, c.focus), eased, at --zoom, and scaled back up.
//   node tools/caster19/bookclips.mjs [--port 8934] [--out docs/clips/caster19] [--only digger,witch-attack] [--zoom 1.4]
//   node tools/caster19/bookclips.mjs --stills design/caster19/stills   (one still of each new piece of art at game size)
// Needs the dev server: node tools/serve.mjs 8934; run with TEMP pointed at this lane's own folder (its Edge profile).
// c.prep: JS run in the page when the clip starts (S: the stage, H: the hero); c.each: JS run every frame (T: seconds in).
import { openEdge } from '../edge.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const port = +opt('port', 8934), out = path.resolve(opt('out', 'docs/clips/caster19')), only = (opt('only', '') || '').split(',').filter(Boolean);
const stillsDir = opt('stills', null);
fs.mkdirSync(out, { recursive: true });
// name, hero, move, tier, seconds, options { zoom, focus: JS expression for the point to follow, prep, each }
export const CLIPS = [
  ['digger-attack', 'digger', 'attack', 3, 4, { zoom: 1.7 }],
  ['digger-dirtFling-III', 'digger', 'dirtFling', 3, 5],
  ['digger-burrow-III', 'digger', 'burrow', 3, 5, { zoom: 1.2 }],
  ['digger-bury-III', 'digger', 'spadeBat', 3, 5],
  ['digger-trait', 'digger', 'trait', 3, 6, { zoom: 1.8 }],
  // a friend wearing the coat of dirt (the fling's friend, the Paladin, with the enemy's blows held off it for the film, so the
  // coat isn't knocked off at once by the next blow: it soaks one and goes)
  ['digger-dirtyFriend-III', 'digger', 'dirtFling', 3, 4, { zoom: 1.7, focus: 'S.friends[0]', each: 'for (const e of S.dummies) if (e.target === S.friends[0]) e.atkT = Math.max(e.atkT, 0.5);' }],
  ['grandpa-breadToss-II', 'grandpa', 'breadToss', 2, 4.6],
  ['grandpa-harvest-III', 'grandpa', 'harvest', 3, 4, { zoom: 1.6 }],
  ['grandpa-sheaves-III', 'grandpa', 'oldTales', 3, 8, { zoom: 1.3 }],
  ['alchemist-attack', 'alchemist', 'attack', 3, 4, { zoom: 1.6 }],
  // (the brews come out of a shuffled rack: the clip lays the rack out so the first cast is cold, water and shocking, and
  // brings the ability round again at 3.2 s for the other three: acid, whirling, fire)
  ['alchemist-brewPools-III', 'alchemist', 'acidFlask', 3, 7.5, { zoom: 1.15, prep: "H.kit.poolBag = ['cold', 'water', 'shock', 'acid', 'whirl', 'fire'];", each: "if (T > 3.2 && !S._again) { S._again = true; H.kit.cd.acidFlask = 0; }" }],
  ['alchemist-elixir-II', 'alchemist', 'elixir', 2, 4.5, { zoom: 1.3 }],
  ['alchemist-monstrosity-III', 'alchemist', 'bangFlask', 3, 6, { zoom: 1.7 }],
  ['shaman-attack', 'shaman', 'attack', 3, 4, { zoom: 1.25 }],
  ['shaman-healTotem-III', 'shaman', 'healTotem', 3, 6, { zoom: 1.15, focus: "({ x: (H.x + (S.friends[0] || H).x) / 2, y: (H.y + (S.friends[0] || H).y) / 2 })" }], // (between him and the friend the totem is thrown to)
  ['shaman-spiritLink-III', 'shaman', 'spiritLink', 3, 6, { zoom: 1.2 }],
  ['shaman-ancestorsCall-III', 'shaman', 'rainDance', 3, 6, { zoom: 1.3 }],
  ['witch-attack', 'witch', 'attack', 3, 4, { zoom: 1.3 }],
  ['witch-hex-III', 'witch', 'frogHex', 3, 5, { zoom: 1.4, focus: "(S.dummies || []).find((o) => o.frogUntil > S.w.time) || H" }],
  ['witch-cursedBrew-III', 'witch', 'cursedBrew', 3, 6, { zoom: 1.3 }],
  ['witch-broomRide-III', 'witch', 'broomRide', 3, 5, { zoom: 1.0, focus: "({ x: H.x, y: H.y - (H.hop || 0) * 0.9 })" }], // (where she is drawn, up in the air)
];
const zoom0 = +opt('zoom', 1.4);
const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const errors = [];
// the point to follow, in the canvas's CSS pixels: the preview fits its room (W x H, and 12 round it) into the canvas
const WHERE = `(() => { const p = UNIT.player, S = p.stage, H = S.hero, c = document.querySelector('#unit .pv-cv'), cw = c.clientWidth, ch = c.clientHeight;
  const F = (FOCUS) || H, W = S.w.W, Hh = S.w.H, s = Math.min(cw / (W + 24), ch / (Hh + 24));
  return { x: cw / 2 + (F.x - W / 2) * s, y: ch / 2 + (F.y - Hh / 2) * s, cw, ch }; })()`;
async function openClip(page, id, move, tier) {
  await page.evaluate(([id, move, tier]) => { if (window.BOOK) BOOK.close(); CAMP.setMode('ground'); CAMP.setMode('hero', { id, page: 'preview' }); UNIT.set({ move, tier }); }, [id, move, tier]);
  await page.waitForTimeout(900);
  await page.evaluate(() => { const p = UNIT.player; p.resume(); p.restart(); p.stop(); });
}
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e)); page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${port}/?seed=4`);
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.GAME && GAME.ready, null, { timeout: 120000 });
  if (stillsDir) {
    // [file, hero, move, tier, seconds in, what to frame (JS: a unit), half the box (CSS px)]
    const STILLS = [
      ['wolf', 'shaman', 'rainDance', 3, 2.6, "S.w.units.find((o) => o.kind === 'spiritWolf' && !o.dead)", 56],
      ['eagle', 'shaman', 'rainDance', 3, 2.6, "S.w.units.find((o) => o.kind === 'spiritEagle' && !o.dead)", 56],
      ['totem', 'shaman', 'healTotem', 3, 2.2, "S.w.units.find((o) => o.kind === 'totem' && !o.dead)", 56],
      ['monstrosity', 'alchemist', 'bangFlask', 3, 1.6, 'H', 56],
      ['frog', 'witch', 'frogHex', 3, 2.2, "(S.dummies || []).find((o) => o.frogUntil > S.w.time)", 50],
      ['cauldron', 'witch', 'cursedBrew', 3, 2.2, "S.w.units.find((o) => o.kind === 'cauldron' && !o.dead)", 56],
      ['broom', 'witch', 'broomRide', 3, 3.65, "({ x: H.x, y: H.y - (H.hop || 0) * 0.9 })", 75],
      ['sheaves', 'grandpa', 'oldTales', 3, 0.95, 'H', 90],
    ];
    fs.mkdirSync(path.resolve(stillsDir), { recursive: true });
    for (const [name, id, move, tier, at, who, half] of STILLS) {
      if (only.length && !only.some((o) => name.includes(o))) continue;
      await openClip(page, id, move, tier);
      for (let i = 0; i < Math.round(at * 30); i++) await page.evaluate(() => { const p = UNIT.player; p.stop(); p.advance(1 / 30, 1 / 30); });
      const box = await page.evaluate(([who, half]) => { const p = UNIT.player, S = p.stage, H = S.hero, c = document.querySelector('#unit .pv-cv'), r = c.getBoundingClientRect(), cw = c.clientWidth, ch = c.clientHeight;
        const F = eval(who) || H, W = S.w.W, Hh = S.w.H, s = Math.min(cw / (W + 24), ch / (Hh + 24)), x = cw / 2 + (F.x - W / 2) * s, y = ch / 2 + (F.y - Hh / 2) * s;
        return { x: r.left + Math.max(0, Math.min(cw - half * 2, x - half)), y: r.top + Math.max(0, Math.min(ch - half * 2, y - half)), width: half * 2, height: half * 2, found: !!eval(who) }; }, [who, half]);
      const file = path.join(path.resolve(stillsDir), name + '.png');
      await page.screenshot({ path: file, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
      console.log('still', name, box.found ? '' : '(not found: framed on the hero)');
    }
  } else for (const [name, id, move, tier, secs, o = {}] of CLIPS) {
    if (only.length && !only.some((x) => name.includes(x))) continue;
    await openClip(page, id, move, tier);
    if (o.prep) await page.evaluate((js) => { const S = UNIT.player.stage, H = S.hero; eval(js); }, o.prep);
    const box = await page.evaluate(() => { const c = document.querySelector('#unit .pv-cv'); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
    const zoom = o.zoom || zoom0, cwW = box.width / zoom, chH = box.height / zoom;
    const dir = fs.mkdtempSync(path.join(out, '.f-')), fps = 30; let cx = null, cy = null;
    const where = WHERE.replace('FOCUS', o.focus || 'null');
    for (let i = 0; i < Math.round(secs * fps); i++) {
      await page.evaluate(([each, T]) => { const p = UNIT.player, S = p.stage, H = S.hero; if (each) eval(each); p.stop(); p.advance(1 / 30, 1 / 30); }, [o.each || '', i / fps]);
      const at = await page.evaluate((js) => eval(js), where);
      if (cx == null) { cx = at.x; cy = at.y; } else { cx += (at.x - cx) * 0.18; cy += (at.y - cy) * 0.18; }
      const x = Math.max(0, Math.min(box.width - cwW, cx - cwW / 2)), y = Math.max(0, Math.min(box.height - chH, cy - chH / 2));
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`), clip: { x: box.x + x, y: box.y + y, width: cwW, height: chH } });
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'), '-vf', `scale=${Math.round(box.width * 2 / 2) * 2}:-2`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(out, name + '.mp4')]);
    fs.rmSync(dir, { recursive: true, force: true });
    const info = await page.evaluate(() => { const S = UNIT.player.stage; return { scene: S.scene, castT: S.castT, casts: S.casts, brain: S.byBrain, forced: S.forced, loop: S.loop }; });
    console.log('film', name, JSON.stringify(info));
  }
} finally { await edge.close(); }
if (errors.length) { console.log('errors:'); for (const e of errors) console.log('  ' + e); }
