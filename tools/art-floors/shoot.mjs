// Round 19 art lane (art-floors): one full-resolution still per floor option, a real room of the game at phone size
// with heroes and that dungeon's enemies standing on it (js/floors19.js painted over the floor through the preview hook).
//   node tools/art-floors/shoot.mjs [--port 8942] [--only id,id] [--out design/r19-art/floors] [--seed 5] [--dpr 2]
// Files: <out>/<id>/room.png (the room, phone size) and swatch.png (a 640-unit square of the option alone, 800 px).
import { openEdge } from '../edge.mjs';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const site = +opt('port', 8942), out = path.resolve(opt('out', 'design/r19-art/floors')), seed = +opt('seed', 5), dpr = +opt('dpr', 2);
const only = opt('only', '') ? opt('only', '').split(',') : null, base = args.includes('--base'); // --base: the current floor, no option
const FOES = {
  wildwood: ['wolf', 'goblin', 'slime', 'bandit', 'sproutling'], crypt: ['rattler', 'rattlerBow', 'ghost', 'gaper', 'rat'],
  sewers: ['rat', 'slime', 'lizardBlade', 'crab', 'ratPlague'], warren: ['goblin', 'goblinSpear', 'hobgoblin', 'mouse', 'orc'],
  frost: ['frostWolf', 'snowman', 'bat', 'slimeIce', 'spiderFrost'], ember: ['imp', 'hellhound', 'fireSlime', 'devil', 'cinderBat'],
  spire: ['cherub', 'angel', 'sunBlade', 'seraph', 'choirSprite'], dunes: ['scarab', 'cobra', 'mummy', 'jackal', 'golem'],
  foundry: ['gearSprite', 'bombBot', 'automaton', 'bee', 'drillBot'],
};
const PARTY = ['paladin', 'archer', 'pyromancer', 'cleric'];

const edge = await openEdge({ flags: ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const errors = [];
try {
  const ctx = await edge.browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('' + e));
  await page.goto(`http://localhost:${site}/?seed=${seed}&env=1`);
  await page.waitForFunction(() => window.GAME && GAME.ready && GAME.state === 'camp', null, { timeout: 180000 });
  const ids = await page.evaluate(async () => Object.keys((await import('./js/floors19.js')).FLOORS));
  const list = base ? Object.keys(FOES).map((t) => 'base-' + t) : ids.filter((id) => !only || only.includes(id) || only.includes(id.split('-')[0]));
  for (const id of list) {
    const theme = id.split('-')[base ? 1 : 0];
    const t0 = Date.now();
    await page.evaluate(async ({ id, theme, foes, party, base }) => {
      const F = await import('./js/floors19.js'), R = await import('./js/render.js'), S = await import('./js/sim.js');
      if (!base) F.installFloorPreview([id]); else delete Object.prototype.paintGround;
      document.getElementById('hud').style.visibility = 'hidden'; document.getElementById('dock').style.visibility = 'hidden';
      // a room with a big open stretch the camera can sit in (try a few: each run rolls new rooms). The screen is
      // portrait, so room x runs up the screen: look for ~1100 x 560 room units of floor.
      const inF = (w, x, y) => (w.cells && w.cells.length ? w.cells : [{ x: 0, y: 0, w: w.W, h: w.H }]).some((c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
      const best = (w) => { let top = null;
        for (let x = 300; x < w.W - 300; x += 60) for (let y = 200; y < w.H - 200; y += 60) {
          let n = 0, m = 0; for (let dx = -540; dx <= 540; dx += 90) for (let dy = -270; dy <= 270; dy += 90) { m++; if (inF(w, x + dx, y + dy)) n++; }
          const sc = n / m - Math.abs(x - w.W / 2) / w.W * 0.05; if (!top || sc > top.sc) top = { x, y, sc };
        } return top || { x: w.W / 2, y: w.H / 2, sc: 0 }; };
      let w = null, B = null;
      for (let t = 0; t < 40; t++) { GAME.record(true); GAME.startRun({ depth: 1, theme, party }); w = GAME.run.world; B = best(w); if (B.sc > 0.93) break; }
      w.walls = (w.walls || []).filter((r) => r.solid || r.temp != null || r.prop); // no free-standing walls: more floor to judge
      for (let i = 0; i < 40; i++) GAME.recFrame(1 / 30);
      for (const u of w.units) if (u.team !== 'hero') u.x = -9999;
      w.hazards.length = 0; w.pickups.length = 0;
      // a skirmish across the middle of the room: the party on the near side, the dungeon's foes facing them
      const cx = B.x, cy = B.y, heroes = w.units.filter((u) => u.team === 'hero');
      const spots = [[-150, -60], [-170, 50], [-90, 10], [-230, -5]];
      heroes.forEach((u, i) => { const s = spots[i % spots.length]; u.x = cx + s[0]; u.y = cy + s[1]; u.facing = 0; });
      const fs2 = [[60, -90], [90, 20], [40, 110], [170, -30], [200, 80]];
      const mine = new Set(heroes);
      foes.forEach((k, i) => { try { const u = S.spawn(w, k, cx + fs2[i][0], cy + fs2[i][1], { level: 1 }); u.facing = Math.PI; mine.add(u); } catch (e) { console.warn(k, e); } });
      const calm = () => { for (const u of w.units) { if (!mine.has(u)) u.x = -9999; u.atkT = 99; u.abilT = 99; } if (w.projectiles) w.projectiles.length = 0; w.hazards.length = 0; };
      calm();
      w.pillars = w.pillars.filter((p) => Math.hypot(p.x - cx, p.y - cy) > 280);
      R.view.manual = cx; R.view.manualY = cy; R.view.manualT = 999; R.view.snap = true;
      for (let i = 0; i < 4; i++) { GAME.recFrame(1 / 30); calm(); }
    }, { id, theme, foes: FOES[theme], party: PARTY, base });
    await new Promise((r) => setTimeout(r, 700)); // sprite art rasterises in the background
    await page.evaluate(() => GAME.recFrame(0));
    await new Promise((r) => setTimeout(r, 150));
    const dir = path.join(out, id); fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, base ? 'before.png' : 'room.png');
    await page.screenshot({ path: file });
    console.log(id, Date.now() - t0, 'ms', path.relative(process.cwd(), file));
    if (!base) { // the swatch: a 640-unit square room of the option on its own (walls all round, so the edge shows), light from the top left
      const url = await page.evaluate(async ({ id, theme }) => {
        const F = await import('./js/floors19.js'), R = await import('./js/render.js');
        const rot = R.view.rot; R.view.rot = false;
        const S = 640, k = 1.25, c = document.createElement('canvas'); c.width = c.height = S * k; const g = c.getContext('2d'); g.scale(k, k);
        const w = { W: S, H: S, cells: [{ c: 0, r: 0, x: 0, y: 0, w: S, h: S }], pillars: [], walls: [], water: [], doors: [{ y: S * 0.3 }, { y: S * 0.75 }], doorIn: { y: S * 0.5 }, theme: { id: theme } };
        g.fillStyle = '#777'; g.fillRect(0, 0, S, S); F.paintFloor19(g, w, id);
        R.view.rot = rot; return c.toDataURL('image/png');
      }, { id, theme });
      fs.writeFileSync(path.join(dir, 'swatch.png'), Buffer.from(url.split(',')[1], 'base64'));
    }
  }
} finally {
  await edge.close();
  if (errors.length) console.log('page errors:\n' + errors.slice(0, 12).join('\n'));
}
