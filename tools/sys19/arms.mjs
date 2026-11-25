// which heroes' arms are drawn over the body, and what each arm part holds (a quick survey)
import fs from 'node:fs';
const H = (await import('../../js/heroes.js')).HEROES;
const { STYLE } = await import('../../js/parts.js').catch(() => ({ STYLE: {} }));
for (const [k, h] of Object.entries(H)) {
  if (!h.art) continue; let t; try { t = fs.readFileSync(h.art, 'utf8'); } catch { continue; }
  const sp = t.slice(t.indexOf('id="sprite"'));
  const ids = [...sp.matchAll(/<g id="([^"]+)"/g)].map((m) => m[1]).filter((x) => /^(arm|body|back|front|top)/.test(x));
  const cnt = (id) => { const i = sp.indexOf(`<g id="${id}"`); if (i < 0) return 0; let d = 0, j = i, n = 0; const re = /<(\/?)(g|path|rect|circle|use|ellipse|polygon|line)\b[^>]*?(\/?)>/g; re.lastIndex = i; let m; while ((m = re.exec(sp))) { if (m[2] === 'g') { if (m[1]) { d--; if (d === 0) break; } else if (!m[3]) d++; } else n++; } return n; };
  const st = h.style || STYLE[k] || {};
  console.log(k.padEnd(14), ids.join(' > ').padEnd(60), 'arm-l:' + cnt('arm-l'), 'arm-r:' + cnt('arm-r'), JSON.stringify({ hand: st.hand, off: st.off, dual: st.dual, bow: st.bow, glow: !!st.glow, atk: h.attack && h.attack.anim }));
}
