# Lane toggles19 scratch helper: apply exact one-time replacements to a js file and add OUTLINES to its util.js import.
import sys, json, re
def patch(p, R, add_import=True):
    s = open(p, encoding='utf-8').read()
    for a, b in R:
        n = s.count(a)
        if n != 1: raise SystemExit(f'{p}: {n} matches for {a[:80]!r}')
        s = s.replace(a, b)
    if add_import and not re.search(r"import \{[^}]*\bOUTLINES\b[^}]*\} from './util\.js'", s):
        m = re.search(r"import \{([^}]*)\} from './util\.js';", s)
        if m: s = s[:m.start()] + "import {" + m.group(1).rstrip() + ", OUTLINES } from './util.js';" + s[m.end():]
        else:
            m = re.search(r"^import [^\n]*\n", s, re.M)
            s = s[:m.start()] + "import { OUTLINES } from './util.js'; // (round 19, lane toggles19)\n" + s[m.start():]
    open(p, 'w', encoding='utf-8').write(s)
if __name__ == '__main__':
    spec = json.load(open(sys.argv[1], encoding='utf-8'))
    for p, R in spec.items(): patch(p, R)
