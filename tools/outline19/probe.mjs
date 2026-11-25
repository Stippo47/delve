// A one-off look into a page (lane outline19): node tools/outline19/probe.mjs "<js expression, may await>" [path]
import { openEdge } from '../edge.mjs';
const edge = await openEdge({ port: 9936 });
try {
  const page = await (await edge.browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
  page.on('pageerror', (e) => console.log('pageerror', String(e)));
  await page.goto('http://localhost:8935/' + (process.argv[3] || 'tools/outline19/measure.html?q=zzz'));
  await page.waitForTimeout(1500);
  console.log(JSON.stringify(await page.evaluate(`(async () => { ${process.argv[2]} })()`), null, 1));
} finally { await edge.close(); }
