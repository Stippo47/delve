# Lane physics19: where in a film does a hero jump? The heroes' reds (a cape, a crest, a shield) are followed from frame
# to frame; a jump is a red patch whose move on the screen changes by more than --th (film pixels at half size) from
# one frame to the next: the camera glides, so a patch that only goes with it never shows.
#   python tools/physics19/film-jumps.py docs/clips/physics19/before-spider-feet.mp4 [--th 5] [--top 12]
# Prints the worst moments (the second in the film, how big). It is a pointer to where to look, not a measure: the
# measures are tools/physics19/detect.mjs and staged.mjs.
import sys, os, subprocess, tempfile, shutil, glob
import numpy as np
from PIL import Image

args = sys.argv[1:]
film = args[0]
def opt(k, d):
    return type(d)(args[args.index('--' + k) + 1]) if ('--' + k) in args else d
TH, TOP, FPS = opt('th', 5.0), opt('top', 12), 30
tmp = tempfile.mkdtemp(prefix='p19-')
try:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', film, '-vf', 'scale=390:-1', os.path.join(tmp, 'f%04d.png')], check=True)
    files = sorted(glob.glob(os.path.join(tmp, 'f*.png')))
    def blobs(path):
        a = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
        h = a.shape[0]
        m = (a[:, :, 0] > 170) & (a[:, :, 1] < 95) & (a[:, :, 2] < 95)
        m[:int(h * 0.09), :] = False; m[int(h * 0.58):, :] = False   # the boss's bar at the top, the party's panel at the bottom
        ys, xs = np.nonzero(m)
        out = []
        if len(xs) == 0: return out
        # patches: red pixels gathered on a coarse grid, neighbouring cells joined
        cell = 10
        keys = {}
        for x, y in zip(xs // cell, ys // cell): keys[(x, y)] = keys.get((x, y), 0) + 1
        seen = set()
        for k in list(keys):
            if k in seen: continue
            stack, grp = [k], []
            seen.add(k)
            while stack:
                c = stack.pop(); grp.append(c)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        n = (c[0] + dx, c[1] + dy)
                        if n in keys and n not in seen: seen.add(n); stack.append(n)
            sel = np.zeros(len(xs), bool)
            gs = set(grp)
            cx, cy = xs // cell, ys // cell
            for i in range(len(xs)):
                if (cx[i], cy[i]) in gs: sel[i] = True
            n = int(sel.sum())
            if n >= 25: out.append((float(xs[sel].mean()), float(ys[sel].mean()), n))
        return out
    prev, prevv, ev = [], {}, []
    for fi, f in enumerate(files):
        cur = blobs(f)
        vel = {}
        for j, (x, y, n) in enumerate(cur):
            best, bd = None, 30.0
            for i, (px, py, pn) in enumerate(prev):
                d = ((x - px) ** 2 + (y - py) ** 2) ** 0.5
                if d < bd and 0.6 < n / max(1, pn) < 1.6: bd, best = d, i
            if best is None: continue
            v = (x - prev[best][0], y - prev[best][1]); vel[j] = v
            if best in prevv:
                ax, ay = v[0] - prevv[best][0], v[1] - prevv[best][1]
                acc = (ax * ax + ay * ay) ** 0.5
                if acc >= TH: ev.append((acc, fi / FPS, x, y))
        prev, prevv = cur, vel
    ev.sort(reverse=True)
    # one line a moment: the worst within a third of a second
    kept = []
    for e in ev:
        if all(abs(e[1] - k[1]) > 0.34 for k in kept): kept.append(e)
        if len(kept) >= TOP: break
    print(os.path.basename(film), ': %d frames, %d jumps of %.0f or more; the worst:' % (len(files), len(ev), TH))
    for acc, t, x, y in sorted(kept, key=lambda e: e[1]): print('   %5.2f s  %5.1f  at %d,%d' % (t, acc, x, y))
finally:
    shutil.rmtree(tmp, ignore_errors=True)
