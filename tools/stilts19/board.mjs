// Lane stilts19: a picture of tools/stilts19/board.html (the idol's figure).
//   node tools/stilts19/board.mjs out.png [query, e.g. 'h=44,8&step=1'] [--port 8961]
import { openEdge } from '../edge.mjs';
import os from 'node:os'; import path from 'node:path'; import fs from 'node:fs';
const LANE = path.join(os.tmpdir(), 'delve-lane-stilts19'); fs.mkdirSync(LANE, { recursive: true });
process.env.TEMP = LANE; process.env.TMP = LANE;
const out = process.argv[2] || 'board.png', query = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '';
const pi = process.argv.indexOf('--port'), port = pi >= 0 ? process.argv[pi + 1] : '8961';
const edge = await openEdge();
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 2200, height: 1300 } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://localhost:${port}/tools/stilts19/board.html?${query}`);
  await page.waitForFunction(() => window.DONE, null, { timeout: 30000 }).catch(() => {});
  await page.locator('#c').screenshot({ path: out });
  console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'ok', '->', out);
} finally { await edge.close(); }
