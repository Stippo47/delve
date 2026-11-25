import { openEdge } from '../edge.mjs';
const edge = await openEdge(); const page = await (await edge.browser.newContext()).newPage();
await page.goto('http://localhost:8933/tools/rogue19/bare-board.html?S=10&cols=1');
await page.waitForFunction(() => window.DONE, null, { timeout: 60000 });
const r = await page.evaluate(async (f) => { const t = await (await fetch(f)).text(); const doc = new DOMParser().parseFromString(t, 'image/svg+xml');
  return ['arm-r', 'arm-l', 'body'].map((id) => { const arm = doc.getElementById(id); return id + ': ' + [...arm.querySelectorAll('*')].filter((n) => /path|use|rect|circle|ellipse/.test(n.tagName)).map((n) => (n.getAttribute('href') || n.tagName) + '=' + n.getAttribute('fill') + (n.getAttribute('opacity') ? '@' + n.getAttribute('opacity') : '') + (n.closest('[clip-path]') ? '(c)' : '')).join(' '); }).join('\n'); }, process.argv[2]);
console.log(r); await edge.close();
