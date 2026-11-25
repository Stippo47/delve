"""Round 19 art lane (heroes and bosses): shared pieces and saving. Built on round 12's A2 library (lib.py, common.py,
kit12.py, copied). The game draws the outline now (round 19, lane outline19), so the saved files carry none: the
library's #outline filter is taken off as each file is written."""
import re, pathlib, math
from kit12 import *

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = ROOT / "design" / "r19-art"


def bare(svg):
    """The library's file without its outline filter (the renderer draws the outline)."""
    svg = re.sub(r'<filter id="outline".*?</filter>\n?', '', svg, flags=re.S)
    svg = re.sub(r'<g id="sprite"[^>]*>', '<g id="sprite">', svg, count=1)
    svg = svg.replace("; the outline comes from the #outline filter.", ".")
    return svg


def save(kind, uid, take, S):
    d = OUT / kind / uid
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"{uid}-{take}.svg"
    p.write_text(bare(S.svg()), encoding="utf-8")
    return p


def grad_r(S, gid, stops, cx=0.36, cy=0.32, r=0.8):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    S.add_def(f'<radialGradient id="{gid}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>')
    return f"url(#{gid})"


def water_ball(S, cx, cy, r, T="", gid="gWaterBall"):
    """A ball of water: a radial gradient, a bright catch-light, a curl of current inside."""
    if gid not in "".join(S.defs):
        grad_r(S, gid, [(0, "#F2FBFF"), (0.45, "#7EC8F0"), (1, "#2F7FB8")])
    dec = (f'<path d="{ell(cx - r * 0.33, cy - r * 0.35, r * 0.34, r * 0.22)}" fill="#FFFFFF" opacity="0.85"/>'
           + strokes(f"M {f(cx - r * 0.65)} {f(cy + r * 0.3)} Q {f(cx)} {f(cy + r * 0.85)} {f(cx + r * 0.6)} {f(cy + r * 0.15)}", "#CFF0FC", r * 0.15, 0.9))
    return S.shape(circ(cx, cy, r), fill=f"url(#{gid})", T=T, shadow=2, side=False, decor=dec)


def wave_crest(x0, y0, L, h, flip=1):
    """A breaking wave seen from above: a hump of length L along +x from (x0, y0), its lip curling over by h."""
    s = flip
    pts = [(x0, y0), (x0 + L * 0.25, y0 - h * 0.5 * s), (x0 + L * 0.6, y0 - h * s), (x0 + L * 0.9, y0 - h * 0.8 * s),
           (x0 + L, y0 - h * 0.35 * s), (x0 + L * 0.86, y0 - h * 0.1 * s), (x0 + L * 0.8, y0 - h * 0.45 * s),
           (x0 + L * 0.66, y0 - h * 0.4 * s), (x0 + L * 0.7, y0 + h * 0.1 * s), (x0 + L * 0.4, y0 + h * 0.2 * s)]
    return blob(pts, 0.8)
