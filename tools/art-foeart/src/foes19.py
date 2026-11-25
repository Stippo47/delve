"""Round 19 art lane (enemy sprites): options for the enemies still on placeholder art, and for the asks never redone.
Built with the heroes' A2 library (lib.py, common.py: copied from design/class-round12/_src/A2) and the round-8/9 creature
builders (wild8.py, beasts9.py: copied from design/class-round11/_src/A2), so the options are drawn the way the approved
wolves, spiders, the Pit Lord and the heroes are: a few soft shapes, lit from the top left, a darker right side, a contact
shadow on what lies under, no eyes on the fiends and beasts. The files carry NO outline: the game draws one round the
whole figure (round 19, lane outline19); save() takes the library's #outline filter out.
python foes19.py [kind ...]   -> design/r19-art/foes/<kind>/<kind>-<option>.svg   (paths relative to this file)"""
import sys, math, pathlib, re
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from beasts9 import *            # lib, common, wild8's tufts, beasts9's wolf9 / spider9 / flame / ice_shard / taper
from wild8 import tufts, INKC, CLAW, PINK

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = ROOT / "design" / "r19-art" / "foes"
BUILT = []


def save19(kind, name, S):
    """Write the sprite without any outline of its own (the game draws it)."""
    t = S.svg()
    t = re.sub(r'<filter id="outline".*?</filter>\n?', '', t, flags=re.S)
    t = t.replace('<g id="sprite" filter="url(#outline)">', '<g id="sprite">')
    t = re.sub(r'<g id="sprite"([^>]*) data-line="[^"]*"', r'<g id="sprite"\1', t)
    p = OUT / kind / f"{name}.svg"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(t, encoding="utf-8")
    BUILT.append(p)
    return p


LAY = ("Front = DOWN (+y), centre (100,100); the 220 box of every sprite. No outline in the file: the game draws one round "
       "the whole figure.")


# ================================================================== wolves: the frost wolf and the hellhound, as picked
# The designer on the wolves (art-round8): "Show me wolves without paws"; then (art-round10): "Bring their heads forwards a
# bit. Shorten body a bit. And I think this is good. Also show me with the pawns rendering under the body". That went into
# the wolf, the dire wolf and the Alpha (round 11) but not the frost wolf and the hellhound, built on the same wolf
# (beasts9.wolf9): they still wear round 9's long body and paws in front. wolf19 is wolf9 with round 11's three changes
# (wild8.wolf's head=7, short=12 and paws): option A no paws (the picked wolves), B the paws drawn under the body.
def wolf19(S, c, hw=40, mane=None, back=None, tail_tip=None, ear_in=PINK, claw=CLAW, stripe_op=0.7, paws=None,
           head=7, short=12):
    Y = 12
    YT, YH, YR = Y + short, Y + head, Y + head / 2
    fur, snout, stripe, muzzle = c["fur"], c["snout"], c["stripe"], c["muzzle"]
    S.group("back", (100, 52 + YT), "tail")
    tw = 14
    tail = blob([(100, 70 + YT), (100 + tw * 0.55, 56 + YT), (100 + tw, 30 + YT), (100 + tw * 0.85, 6 + YT), (100, -8 + YT),
                 (100 - tw * 0.85, 6 + YT), (100 - tw, 30 + YT), (100 - tw * 0.55, 56 + YT)], 0.9)
    if tail_tip:
        S.shape(tail, fur, shadow=0)
        tail_tip(S, YT, tw)
    else:
        S.shape(tail, fur, shadow=0, decor=f'<path d="{ell(100, -2 + YT, tw + 2, 15)}" fill="{c["tip"]}"/>')
    if paws == "under":
        S.group("arm-l", (70, 118 + Y), "front paw, under the body")
        paw(S, 68, 154 + Y, 8, fur, claw)
        S.group("arm-r", (130, 118 + Y), "front paw, under the body")
        paw(S, 132, 154 + Y, -8, fur, claw)
    S.group("body")
    S.shape(rr(100, 92 + Y + short / 2, hw * 2, 96 - short, hw), fur, shadow=0,
            decor=f'<path d="{ell(100, 80 + Y + short / 2, hw * 0.55, 38 - short / 2)}" fill="{shade(fur, 0.82)}" opacity="0.5"/>')
    if back:
        back(S, Y + short)
    if mane:
        mane(S, YR)
    for s in (-1, 1):
        ear = blob([(100 + s * 14, 116 + YH), (100 + s * 30, 84 + YH), (100 + s * 38, 96 + YH), (100 + s * 32, 122 + YH)], 0.6)
        inner = blob([(100 + s * 19, 113 + YH), (100 + s * 29, 92 + YH), (100 + s * 33, 99 + YH), (100 + s * 29, 116 + YH)], 0.6)
        S.shape(ear, fur, shadow=2, sop=0.18, decor=f'<path d="{inner}" fill="{ear_in}" opacity="0.75"/>')
    S.shape(ell(100, 128 + YH, 29, 28), fur, shadow=3, sop=0.15)
    sn = blob([(100, 130 + YH), (112, 136 + YH), (115, 154 + YH), (110, 172 + YH), (100, 180 + YH), (90, 172 + YH),
               (85, 154 + YH), (88, 136 + YH)], 0.85)
    S.shape(sn, snout, shadow=4,
            decor=f'<path d="M 82 {156 + YH} C 90 {166 + YH} 110 {166 + YH} 118 {156 + YH} L 118 {186 + YH} L 82 {186 + YH} Z" fill="{muzzle}"/>'
                  + strokes(f"M 100 {134 + YH} L 100 {160 + YH}", stripe, 4.5, stripe_op))
    S.shape(ell(100, 175 + YH, 8.5, 6.5), INKC, shadow=2, side=False, decor=f'<circle cx="97" cy="{173 + YH}" r="2.4" fill="#6A6278"/>')
    return S


FROST_WOLF = dict(fur="#DCE6EE", snout="#EBF1F5", stripe="#B8C8D6", muzzle="#FFFFFF", tip="#9CB4C8", ruff="#F2F7FA")
HELLHOUND = dict(fur="#332D34", snout="#3F373F", stripe="#F07A34", muzzle="#4C4044", tip="#332D34", ruff="#332D34")


def frost_wolf(opt):
    paws = {"a": None, "b": "under"}[opt]
    S = Sprite(f"FROST WOLF, round 19 option {opt.upper()}: the game's frost wolf (round 9: white coat, a mane of white "
               "tufts, ice shards along the back, a blue-grey tail tip) given what the picked wolves got in round 11: the "
               "head 7 units forward, the body 12 shorter, " + ("no front paws (as the picked wolf, dire wolf and Alpha). "
               "Parts: #back (tail, sways), #body. " if not paws else "the front paws drawn under the body. Parts: #back "
               "(tail, sways), #arm-l / #arm-r (front paws, under the body, swing to walk), #body. ") + LAY)

    def frost_back(S, Y):
        for x, y, a, L, w in ((100, 76 + Y, 180, 34, 10), (84, 72 + Y, 212, 26, 7.5), (116, 72 + Y, 148, 26, 7.5),
                              (91, 52 + Y, 196, 15, 5.5), (109, 52 + Y, 164, 15, 5.5)):
            ice_shard(S, x, y, a, L, w)

    def mane(S, Y):
        S.shape(tufts(100, 114 + Y, 50, 12, 0.24, 0, 1.0, 0.8, 0.85, sweep=22), FROST_WOLF["ruff"], shadow=3)
    wolf19(S, FROST_WOLF, back=frost_back, mane=mane, ear_in="#A6A4BE", claw="#8FCBE6", stripe_op=0.55, paws=paws)
    return save19("frostWolf", f"frostWolf-{opt}", S)


def hellhound(opt):
    paws = {"a": None, "b": "under"}[opt]
    S = Sprite(f"HELLHOUND, round 19 option {opt.upper()}: the game's hellhound (round 9: a lean coal-black wolf, a burning "
               "mane streaming back, a flame for a tail tip, an ember stripe down the snout) given what the picked wolves "
               "got in round 11: the head 7 units forward, the body 12 shorter, " + ("no front paws. Parts: #back (tail, "
               "sways), #body. " if not paws else "the front paws drawn under the body. Parts: #back (tail, sways), #arm-l / "
               "#arm-r (front paws, under the body), #body. ") + LAY)
    S.add_def(FLAME_DEF)

    def mane(S, Y):
        S.shape(tufts(100, 110 + Y, 58, 12, 0.42, 0, 1.06, 0.9, 0.75, sweep=36), fill="url(#gFlameUp)", shadow=3, side=False)
        S.shape(tufts(100, 114 + Y, 46, 10, 0.36, 9, 1.04, 0.9, 0.75, sweep=32), "#FFC650", shadow=0, side=False)

    def tail_tip(S, Y, tw):
        d, T = flame(100, 10 + Y, 180, 28, tw + 4)
        S.shape(d, fill="url(#gFlameUp)", T=T, shadow=0, side=False)
        d2, T2 = flame(100, 6 + Y, 180, 16, tw - 3)
        S.shape(d2, "#FFD25A", T=T2, shadow=0, side=False)
    wolf19(S, HELLHOUND, hw=34, mane=mane, tail_tip=tail_tip, ear_in="#8E3A2A", claw="#EADFCB", stripe_op=0.85, paws=paws)
    return save19("hellhound", f"hellhound-{opt}", S)


# ================================================================== spiders: the hunter and the momma
# The designer (round 4): "Spider: Try again. 4 variants/styles"; (round 6) "The spiders may have to stay that way but they
# seemed to not match the style". The game still wears the round-5 hunter and momma. The fire and frost spiders (round 9,
# ticked) are the spider build that matches: spider19 is beasts9.spider9 with the abdomen's size and place free and a
# hook for what rides on it.
LEGS = [((118, 140), (146, 152), (144, 190)), ((124, 132), (164, 128), (186, 158)), ((126, 122), (166, 104), (190, 84)),
        ((120, 112), (154, 80), (162, 42))]


def spider19(S, p, mark=None, joint=None, abd=(100, 62, 40, 46), legw=(14, 7), on_back=None, head=(30, 28), fangk=1.0,
             leg_decor=None, behind=None):
    def leg(pts, w0, w1):
        (hx, hy), (kx, ky), (tx, ty) = pts
        outer = strokes(f"M {f(kx)} {f(ky)} L {f(tx)} {f(ty)} L {f(tx + (tx - kx) * 0.4)} {f(ty + (ty - ky) * 0.4)}",
                        p["dleg"], 26) if p.get("dleg") else ""
        S.shape(taper([(hx, hy), (kx, ky), (tx, ty)], w0, w1, 0.7), p["leg"], shadow=0,
                decor=outer + (leg_decor(pts) if leg_decor else "") + (joint(kx, ky) if joint else ""))
    S.group("back", (100, 104), "abdomen and the back legs")
    if behind:
        behind(S)
    for s in (-1, 1):
        for L in LEGS[1:]:
            leg([(100 + s * (x - 100), y) for x, y in L], *legw)
    ax, ay, rx, ry = abd
    S.shape(ell(ax, ay, rx, ry), p["body"], shadow=0, decor=mark(S) if mark else "")
    if on_back:
        on_back(S)
    S.shape(rr(100, 106, 22, 14, 6), shade(p["body"], 0.8), shadow=2)
    for gid, s in (("arm-l", -1), ("arm-r", 1)):
        S.group(gid, (100 + s * 20, 136), "front leg")
        leg([(100 + s * (x - 100), y) for x, y in LEGS[0]], legw[0], legw[1] + 2)
    S.group("body")
    hx_, hy_ = head
    S.shape(ell(100, 128, hx_, hy_), p["body"], shadow=4, sop=0.25, decor=f'<path d="{ell(90, 118, 14, 9)}" fill="#FFFFF4" opacity="0.18"/>')
    k = fangk
    for s in (-1, 1):
        jaw = blob([(100 + s * 2, 148), (100 + s * 13 * k, 146), (100 + s * 15 * k, 158), (100 + s * 9 * k, 166), (100 + s * 3, 162)], 0.9)
        S.shape(jaw, shade(p["body"], 0.86), shadow=3)
        fang = blob([(100 + s * 4, 160), (100 + s * 11 * k, 161), (100 + s * 8 * k, 171 + 4 * (k - 1)), (100 + s * 3, 178 + 8 * (k - 1)),
                     (100 + s * 4, 169)], 0.8)
        S.shape(fang, p["fang"], shadow=2, side=False)
    return S


def spider_hunter(opt):
    if opt == "a":
        S = Sprite("HUNTER SPIDER, round 19 option A, 'chevron': the round-5 hunter's colours and mark (sandy brown, dark "
                   "tips on the legs, a dark chevron on the abdomen, ivory fangs) in the ticked fire/frost spider's build: "
                   "a round abdomen, a smaller head, four smooth jointed legs a side, the front pair in the arm parts. No "
                   "eyes. Parts: #back (abdomen and the six back legs), #arm-l / #arm-r (front legs, they strike), #body "
                   "(head and fangs). " + LAY)
        P = dict(body="#9A7A56", leg="#8C6E4C", dleg="#5E4632", fang="#F2E8D4")

        def mark(S):
            ch = "M 100 30 L 126 56 L 118 66 L 100 50 L 82 66 L 74 56 Z M 100 60 L 120 80 L 113 89 L 100 77 L 87 89 L 80 80 Z"
            return f'<path d="{ch}" fill="#5E4632" opacity="0.85"/>'
        spider19(S, P, mark=mark)
    else:
        S = Sprite("HUNTER SPIDER, round 19 option B, 'striped': a wolf spider in the ticked spider build: a longer, narrower "
                   "abdomen with one dark stripe down its back edged in pale fur, a bigger head with heavier fangs (it "
                   "pounces), the legs banded light and dark at the knee. No eyes. Parts: #back (abdomen and the six back "
                   "legs), #arm-l / #arm-r (front legs, they strike), #body (head and fangs). " + LAY)
        P = dict(body="#8E7254", leg="#7E6248", dleg="#4E3A2A", fang="#F2E8D4")

        def mark(S):
            return (f'<path d="{rr(100, 64, 30, 92, 15)}" fill="#C8AE86" opacity="0.7"/>'
                    f'<path d="{rr(100, 64, 16, 84, 8)}" fill="#4E3A2A"/>')

        def joint(x, y):
            return f'<circle cx="{f(x)}" cy="{f(y)}" r="9" fill="#C8AE86"/>'
        spider19(S, P, mark=mark, joint=joint, abd=(100, 58, 34, 50), head=(32, 29), fangk=1.15)
    return save19("spiderHunter", f"spiderHunter-{opt}", S)


def spider_momma(opt):
    P = dict(body="#7E6E8E", leg="#6E5E7E", dleg="#4A3E58", fang="#EDE4F2")
    if opt == "a":
        S = Sprite("MOMMA SPIDER, round 19 option A, 'clutch': the ticked spider build, big and heavy: a huge round abdomen in "
                   "the round-5 momma's purple-grey, thick legs, and on her back one tidy clutch of seven pale eggs, all the "
                   "same size (the old file scattered bumps of every size). No eyes. Parts: #back (abdomen, eggs and the six "
                   "back legs), #arm-l / #arm-r (front legs), #body (head and fangs). " + LAY)

        def on_back(S):
            eggs = [(100, 50), (86, 42), (114, 42), (86, 58), (114, 58), (100, 33), (100, 67)]
            for x, y in sorted(eggs, key=lambda e: e[1]):
                S.shape(circ(x, y, 11), "#F2EAF4", shadow=2, sop=0.22, decor=f'<circle cx="{x - 3}" cy="{y - 3}" r="3" fill="#FFFFFF" opacity="0.7"/>')
        spider19(S, P, abd=(100, 52, 50, 56), legw=(17, 9), on_back=on_back)
    else:
        S = Sprite("MOMMA SPIDER, round 19 option B, 'egg sac': the ticked spider build, big and heavy, purple-grey with a "
                   "paler band round the abdomen, carrying a big round white silk egg sac on the back end of her abdomen (its "
                   "spiderlings hatch from it: her brood). No eyes. Parts: #back (abdomen, egg sac and the six back legs), "
                   "#arm-l / #arm-r (front legs), #body (head and fangs). " + LAY)

        def mark(S):
            ch = "M 100 38 L 124 62 L 116 72 L 100 56 L 84 72 L 76 62 Z M 100 66 L 118 84 L 111 92 L 100 81 L 89 92 L 82 84 Z"
            return f'<path d="{ch}" fill="#4A3E58" opacity="0.8"/>'

        def sac(S):   # the egg sac lies behind the abdomen, under it
            S.shape(circ(100, 24, 25), "#F1ECF2", shadow=4, sop=0.3,
                    decor=strokes("M 78 16 Q 100 26 122 16 M 78 32 Q 100 42 122 32 M 92 0 Q 84 24 92 48 M 108 0 Q 116 24 108 48",
                                  "#C8BCD0", 2.6, 0.8))
        spider19(S, P, abd=(100, 64, 46, 48), legw=(17, 9), on_back=sac)
    return save19("spiderMomma", f"spiderMomma-{opt}", S)


BUILD = {
    "frostWolf": (frost_wolf, "ab"), "hellhound": (hellhound, "ab"),
    "spiderHunter": (spider_hunter, "ab"), "spiderMomma": (spider_momma, "ab"),
}

if __name__ == "__main__":
    want = sys.argv[1:] or list(BUILD)
    for k in want:
        fn, opts = BUILD[k]
        for o in opts:
            print(fn(o).relative_to(ROOT).as_posix())
