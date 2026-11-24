# One-off (round 17, lane foes16): take `cost` and `pack` out of the enemy defs, now that js/prices.js holds them.
# Leaves cost: 99 (the welder drone's "never in a room" mark) and anything not a plain number.
import re, io
FILES = ['js/wildwood.js', 'js/foes.js', 'js/foes9.js', 'js/foes10.js', 'js/dunes.js', 'js/foundry.js', 'js/enemies.js']
num = r'\d+(?:\.\d+)?'
for f in FILES:
    s = io.open(f, encoding='utf8', newline='').read()
    n0 = len(s)
    def drop_cost(m):
        return m.group(0) if m.group(1) == '99' else ''
    s = re.sub(r'cost: (' + num + r'), ', drop_cost, s)
    s = re.sub(r', cost: (' + num + r')(?=\s*[}\n])', drop_cost, s)
    s = re.sub(r'pack: \[\d+, \d+\], ', '', s)
    s = re.sub(r', pack: \[\d+, \d+\](?=\s*[}\n])', '', s)
    io.open(f, 'w', encoding='utf8', newline='').write(s)
    print(f, n0 - len(s), 'chars out')
