"""Structure audit: per SVG, the parts inside #sprite in file order, their pivots, and what paints hands
(gHand) or common weapon fills in each. python audit.py <svg>..."""
import sys, re, pathlib
import xml.etree.ElementTree as ET
NS = "{http://www.w3.org/2000/svg}"
for f in sys.argv[1:]:
    t = ET.parse(f).getroot()
    sp = [e for e in t.iter() if e.get("id") == "sprite"][0]
    out = []
    for g in sp:
        s = ET.tostring(g, encoding="unicode")
        hands = s.count("gHand")
        out.append(f"{g.get('id')}[{g.get('data-pivot') or '-'}] hand={hands}")
    print(pathlib.Path(f).name.ljust(40), " | ".join(out))
