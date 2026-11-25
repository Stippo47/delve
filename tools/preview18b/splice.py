# splice a replacement function body into js/preview-sim.js: python splice.py <file with new text> <start marker> <end marker>
import sys
p = 'js/preview-sim.js'
s = open(p, encoding='utf-8').read()
new, a0, b0 = open(sys.argv[1], encoding='utf-8').read(), sys.argv[2], sys.argv[3]
a = s.index(a0); b = s.index(b0, a)
s = s[:a] + new + ('\n' if not new.endswith('\n\n') else '') + s[b:]
open(p, 'w', encoding='utf-8').write(s)
print('spliced', a, b)
