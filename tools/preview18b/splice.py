# splice a replacement function body into js/preview-sim.js: python splice.py <file with new text> <start marker> <end marker>
import sys
p = 'js/preview-sim.js'
s = open(p, encoding='utf-8').read()
new, a0, b0 = open(sys.argv[1], encoding='utf-8').read(), sys.argv[2], sys.argv[3]
# (Git Bash turns an argument that starts with // into one /: give the markers without their comment slashes)
a0, b0 = a0.lstrip('/'), b0.lstrip('/')
a = s.index(a0); b = s.index(b0, a)
while a > 0 and s[a - 1] == '/': a -= 1
while b > 0 and s[b - 1] == '/': b -= 1
s = s[:a] + new + ('\n' if not new.endswith('\n\n') else '') + s[b:]
open(p, 'w', encoding='utf-8').write(s)
print('spliced', a, b)
