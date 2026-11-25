// Round 16, lane play16: the report's charts as PNGs (docs/audit/play16/), drawn on a canvas in headless Chromium.
//   node tools/play16/charts.mjs   (after analyze.mjs: reads docs/audit/data/play16/summary.json and the campaigns)
import fs from 'node:fs';
import { openEdge } from '../edge.mjs'; // (headless Edge over CDP, as the repo's other picture tools)
const DIR = 'docs/audit/data/play16', OUT = 'docs/audit/play16';
const S = JSON.parse(fs.readFileSync(DIR + '/summary.json', 'utf8'));
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

// a line chart spec: { title, sub, xLabels (every n-th shown), xTitle, yTitle, series: [{ name, data: [y|null] }], bands: [{ from, to, label }], hline }
function page(spec) {
  return `<!doctype html><html><body style="margin:0;background:#fcfcfb"><canvas id="c" width="1200" height="680"></canvas><script>(() => {
const spec = ${JSON.stringify(spec)}, COL = ${JSON.stringify(SERIES)};
const c = document.getElementById('c'), g = c.getContext('2d');
const W = 1200, H = 680, L = 90, R = 190, T = 96, B = 92;
g.fillStyle = '#fcfcfb'; g.fillRect(0, 0, W, H);
g.font = '600 26px system-ui, sans-serif'; g.fillStyle = '#0b0b0b'; g.fillText(spec.title, L, 42);
g.font = '17px system-ui, sans-serif'; g.fillStyle = '#52514e'; g.fillText(spec.sub || '', L, 70);
const n = spec.series[0].data.length, all = spec.series.flatMap((s) => s.data).filter((v) => v != null);
let y0 = spec.yMin ?? 0, y1 = spec.yMax ?? Math.max(...all) * 1.08;
const X = (i) => L + (W - L - R) * (n === 1 ? 0.5 : i / (n - 1)), Y = (v) => H - B - (H - T - B) * (v - y0) / (y1 - y0);
// bands (dungeons / floors)
for (const [j, b] of (spec.bands || []).entries()) { if (j % 2) { g.fillStyle = 'rgba(0,0,0,0.035)'; g.fillRect(X(b.from) - 4, T, X(b.to) - X(b.from) + 8, H - T - B); }
  g.fillStyle = '#52514e'; g.font = '15px system-ui'; g.fillText(b.label, X(b.from) + 4, T + 18); }
// grid
g.strokeStyle = '#e6e5e0'; g.lineWidth = 1; g.fillStyle = '#52514e'; g.font = '15px system-ui'; g.textAlign = 'right';
const step = spec.yStep || (y1 - y0 > 40 ? 10 : y1 - y0 > 8 ? 2 : y1 - y0 > 2 ? 0.5 : 0.25);
for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(W - R, Y(v)); g.stroke(); g.fillText(spec.yFmt === 'pct' ? Math.round(v * 100) + '%' : +v.toFixed(2), L - 10, Y(v) + 5); }
if (spec.hline != null) { g.strokeStyle = '#8a8983'; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(L, Y(spec.hline)); g.lineTo(W - R, Y(spec.hline)); g.stroke(); g.setLineDash([]);
  g.textAlign = 'left'; g.fillText(spec.hlineLabel || '', L + 6, Y(spec.hline) - 7); }
g.textAlign = 'center';
const every = spec.xEvery || 1;
spec.xLabels.forEach((s, i) => { if (i % every === 0 || (i === n - 1 && (n - 1) % every > every / 2)) g.fillText(s, X(i), H - B + 24); });
g.fillText(spec.xTitle || '', L + (W - L - R) / 2, H - 28);
g.save(); g.translate(26, T + (H - T - B) / 2); g.rotate(-Math.PI / 2); g.fillText(spec.yTitle || '', 0, 0); g.restore();
// lines
spec.series.forEach((s, k) => {
  g.strokeStyle = COL[k]; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath(); let on = false, last = null;
  s.data.forEach((v, i) => { if (v == null) { on = false; return; } if (!on) { g.moveTo(X(i), Y(v)); on = true; } else g.lineTo(X(i), Y(v)); last = i; });
  g.stroke();
  if (spec.dots) s.data.forEach((v, i) => { if (v == null) return; g.fillStyle = '#fcfcfb'; g.beginPath(); g.arc(X(i), Y(v), 5.5, 0, 7); g.fill(); g.fillStyle = COL[k]; g.beginPath(); g.arc(X(i), Y(v), 4, 0, 7); g.fill(); });
});
// legend (and direct labels at the line ends)
g.textAlign = 'left'; g.font = '16px system-ui';
spec.series.forEach((s, k) => { const y = T + 10 + k * 28; g.fillStyle = COL[k]; g.fillRect(W - R + 22, y - 4, 22, 4); g.fillStyle = '#0b0b0b'; g.fillText(s.name, W - R + 52, y + 2); });
})();</script></body></html>`;
}

const camps = fs.readdirSync(DIR).filter((f) => /-s\d+\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(DIR + '/' + f, 'utf8')));
const FRESH = S.FRESH;
const charts = [];
// 1. enemy / hero room by room, the first three dungeons, the baseline and the lone Archer
{
  const ds = ['wildwood', 'warren', 'sewers'], labels = [], bands = [];
  const ser = { baseline: [], solo: [], enemy: [], hero: [] };
  ds.forEach((d, j) => { bands.push({ from: j * 21, to: j * 21 + 20, label: { wildwood: 'Wildwood', warren: 'Warren', sewers: 'Sewers' }[d] });
    for (let p = 0; p < 21; p++) { labels.push(`${(p / 7 | 0) + 1}.${p % 7 + 1}`);
      for (const g of ['baseline', 'solo']) { const r = S.curves[g + ':' + d][p]; ser[g].push(r && r.n ? r.enemy / r.heroFirst : null); } } });
  charts.push(['curve-ratio.png', { title: 'How hard each room is when the party first gets there', sub: 'Enemy strength per foe ÷ the party\'s measured power per hero (median over 4 seeds). Higher is harder.',
    xLabels: labels, xEvery: 7, xTitle: 'Floor.room (room 7 is the mini-boss or boss)', yTitle: 'Enemy ÷ hero', bands, dots: true, yMin: 0,
    series: [{ name: 'Archer + seats', data: ser.baseline }, { name: 'Lone Archer', data: ser.solo }], hline: 0.83, hlineLabel: 'the first room, run 1' }]);
}
// 2. damage taken in fight rooms
{
  const ds = ['wildwood', 'warren', 'sewers'], labels = [], bands = [], a = [], b = [];
  ds.forEach((d, j) => { bands.push({ from: j * 21, to: j * 21 + 20, label: { wildwood: 'Wildwood', warren: 'Warren', sewers: 'Sewers' }[d] });
    for (let p = 0; p < 21; p++) { labels.push(`${(p / 7 | 0) + 1}.${p % 7 + 1}`); const x = S.curves['baseline:' + d][p], y = S.curves['solo:' + d][p]; a.push(x && x.n ? x.taken : null); b.push(y && y.n ? y.taken : null); } });
  charts.push(['curve-damage.png', { title: 'What a fight room costs', sub: 'Damage taken in a fight room as a share of the party\'s full health (healing makes more than 100% possible). Median of 4 seeds.',
    xLabels: labels, xEvery: 7, xTitle: 'Floor.room', yTitle: 'Damage taken', yFmt: 'pct', bands, dots: true, yMin: 0,
    series: [{ name: 'Archer + seats', data: a.map((v, i) => (i % 7 === 6 ? null : v)) }, { name: 'Lone Archer', data: b.map((v, i) => (i % 7 === 6 ? null : v)) }] }]);
}
// 3. the starter's level over runs
{
  const names = ['archer-fill', 'archer-solo', 'archer-solo-stats', 'paladin-fill', 'twinfang-fill', 'archer-floor'];
  const n = Math.min(60, Math.max(...names.map((k) => (S.levels[k] || []).length)));
  charts.push(['levels.png', { title: 'The starting hero\'s level, run by run', sub: 'Median over 4 seeds; a line stops where fewer than half the seeds were still playing.',
    xLabels: Array.from({ length: n }, (_, i) => String(i + 1)), xEvery: 5, xTitle: 'Run', yTitle: 'Level going in', yMin: 0,
    series: names.filter((k) => S.levels[k]).map((k) => ({ name: k, data: Array.from({ length: n }, (_, i) => S.levels[k][i] ?? null) })) }]);
}
// 4. one campaign as played: enemy / hero in every room, in order (the baseline, seed 1)
{
  const c = camps.find((x) => x.strategy === 'archer-fill' && x.seed === 1);
  const ratio = [], labels = [], bands = []; let lastTheme = null;
  const ep = (m) => Math.sqrt((m > 1 ? Math.pow(m, 0.75) : m) * (0.65 + 0.35 * m) * (m > 1 ? 1 + 0.07 * (m - 1) : 1));
  for (const r of c.runs) { const hp = r.heroes.reduce((a, h) => a + h.probe.power, 0) / r.heroes.length / FRESH;
    if (r.theme !== lastTheme) { if (bands.length) bands[bands.length - 1].to = ratio.length - 1; bands.push({ from: ratio.length, to: ratio.length, label: r.theme[0].toUpperCase() + r.theme.slice(1) }); lastTheme = r.theme; }
    for (const rm of r.rooms) { ratio.push(rm.boss ? null : ep(rm.m) / hp); labels.push('run ' + r.i); } }
  bands[bands.length - 1].to = ratio.length - 1;
  charts.push(['campaign-sawtooth.png', { title: 'One campaign as played (Archer + seats, seed 1)', sub: 'Every room in the order played: enemy strength per foe ÷ party power per hero. Each run climbs; camp drops it again.',
    xLabels: labels, xEvery: 60, xTitle: 'Rooms played, in order', yTitle: 'Enemy ÷ hero', bands, yMin: 0, series: [{ name: 'Enemy ÷ hero', data: ratio }] }]);
}
const edge = await openEdge();
const ctx = edge.browser.contexts()[0] || await edge.browser.newContext();
const pg = await ctx.newPage(); await pg.setViewportSize({ width: 1200, height: 680 });
fs.mkdirSync(OUT, { recursive: true });
pg.on('pageerror', (e) => console.log('page error', e.message));
for (const [file, spec] of charts) { await pg.setContent(page(spec)); await pg.waitForTimeout(50); await (await pg.$('#c')).screenshot({ path: OUT + '/' + file }); console.log('wrote', OUT + '/' + file); }
await edge.close();
