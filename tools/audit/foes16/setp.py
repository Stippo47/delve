# set prices by hand: python setp.py kind=hp,hit[,cost] ...
import re, sys
p='js/prices.js'; s=open(p,encoding='utf8').read()
for a in sys.argv[1:]:
    k, v = a.split('='); v = v.split(',')
    def f(m):
        cost = v[2] if len(v) > 2 else m.group(1)
        return f'  {k}: {{ cost: {cost}, {m.group(2) or ""}hp: {v[0]}, hit: {v[1]} }},'
    s, n = re.subn(r'  ' + k + r': \{ cost: ([0-9.]+), (pack: \[[0-9, ]+\], )?hp: [0-9.]+, hit: [0-9.]+ \},', f, s); assert n == 1, k
open(p,'w',encoding='utf8',newline='\n').write(s)
