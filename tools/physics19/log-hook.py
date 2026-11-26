# Lane physics19: the five logging lines tools/physics19/detect.mjs reads (w.physLog), put into a copy of the game as
# it was (scratch/before, `git archive 085fcc6`), so the same detector measures before and after. Nothing else in the
# copy is changed.   python tools/physics19/log-hook.py scratch/before/js/sim.js
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if 'physLog' in s: sys.exit('already there')
s = s.replace("function physics(w, dt) {\n", "function physics(w, dt) {\n  const LOG = w.physLog || null;\n", 1)
s = s.replace("    // walls\n    const ks = Math.hypot(u.kx, u.ky);", "    // walls\n    const lx0 = u.x, ly0 = u.y;\n    const ks = Math.hypot(u.kx, u.ky);", 1)
s = s.replace("    let thrown = false; // (round 19, lane troll19: see below)", "    if (LOG && (u.x !== lx0 || u.y !== ly0)) LOG(u, u.x - lx0, u.y - ly0, null, 'wall');\n    let thrown = false; // (round 19, lane troll19: see below)", 1)
s = s.replace("        u.x = p.x + nx * m; u.y = p.y + ny * m; thrown = true;", "        if (LOG) LOG(u, p.x + nx * m - u.x, p.y + ny * m - u.y, p, 'rock');\n        u.x = p.x + nx * m; u.y = p.y + ny * m; thrown = true;", 1)
s = s.replace("      a.x -= nx * over * ta; a.y -= ny * over * ta; b.x += nx * over * tb; b.y += ny * over * tb;", "      a.x -= nx * over * ta; a.y -= ny * over * ta; b.x += nx * over * tb; b.y += ny * over * tb;\n      if (LOG) { if (ta) LOG(a, -nx * over * ta, -ny * over * ta, b, 'body'); if (tb) LOG(b, nx * over * tb, ny * over * tb, a, 'body'); }", 1)
open(p, 'w', encoding='utf-8', newline='\n').write(s)
