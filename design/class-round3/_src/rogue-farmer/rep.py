import sys
p, a, b = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p, encoding='utf-8').read()
n = s.count(a)
if n != 1: sys.exit(f"match count {n}")
open(p, 'w', encoding='utf-8').write(s.replace(a, b))
