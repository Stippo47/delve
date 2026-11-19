"""Ghost, the round-3 sheet ghost with two new tails. python ghost.py [a b]"""
from lib import *

UG = ('<linearGradient id="gSheet" x1="50" y1="20" x2="150" y2="160" gradientUnits="userSpaceOnUse">'
      '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DEDDF2"/></linearGradient>'
      '<linearGradient id="shX" x1="96" y1="0" x2="152" y2="0" gradientUnits="userSpaceOnUse">'
      '<stop offset="0" stop-color="#5A5C9A" stop-opacity="0"/><stop offset="1" stop-color="#5A5C9A" stop-opacity="0.36"/></linearGradient>'
      '<linearGradient id="shTail" x1="0" y1="0" x2="0" y2="96" gradientUnits="userSpaceOnUse">'
      '<stop offset="0" stop-color="#5A5C9A" stop-opacity="0.32"/><stop offset="1" stop-color="#5A5C9A" stop-opacity="0"/></linearGradient>'
      '<radialGradient id="gDome" cx="90" cy="112" r="56" gradientUnits="userSpaceOnUse">'
      '<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>'
      '<linearGradient id="gNub" x1="28" y1="0" x2="66" y2="0" gradientUnits="userSpaceOnUse">'
      '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCDBF0"/></linearGradient>'
      '<linearGradient id="gNubR" x1="28" y1="0" x2="66" y2="0" gradientUnits="userSpaceOnUse">'
      '<stop offset="0" stop-color="#C9C8E6"/><stop offset="1" stop-color="#D9D8EE"/></linearGradient>')

NUB = "M64 104 C50 106 36 116 31 132 C30 138 36 141 42 140 C52 138 60 134 66 128 Z"
HEAD = circ(100, 118, 47)


def ghost(take):
    if take == "a":
        tail = stroke_path([(100, 120), (102, 96), (104, 78), (96, 54), (92, 36), (100, 20), (114, 12), (128, 14), (134, 24)], 92, 9)
        desc = ('GHOST (round 4, tail take A "swish"): the round-3 sheet ghost; the sheet now narrows behind the head '
                'into one long S-curved tail that ends in a small curl, centred behind the head so it reads the same in '
                'every facing.')
        fold = ''
    else:
        tail = (stroke_path([(100, 120), (100, 96), (100, 74), (102, 58)], 92, 30) + " " +
                circ(103, 54, 15) + " " + circ(88, 30, 10) + " " + circ(108, 12, 7))
        desc = ('GHOST (round 4, tail take B "trail"): the round-3 sheet ghost; the sheet tapers behind the head and '
                'breaks up into a trail of three shrinking puffs, like smoke left behind as it drifts.')
        fold = ''
    S = Sprite(desc + ' Round head at the front, two dark eyes and an "oo" mouth, two little sheet-arm nubs reaching '
               'forward. Parts: #arm-l, #arm-r = the nubs (pivot at the sheet sides, before #body), #body = the sheet '
               'and tail (sway the tail by skewing #body). Facing = DOWN (+y), centre (100,100).')
    S.defs.append(UG)
    S.defs.append(f'<path id="tail" d="{tail}"/><path id="head" d="{HEAD}"/>'
                  '<clipPath id="sheetC"><use href="#tail"/><use href="#head"/></clipPath>')
    S.group("arm-l", (62, 112))
    S.raw(f'<path d="{NUB}" fill="url(#gNub)" stroke="url(#gNub)" stroke-width="4" stroke-linejoin="round"/>')
    S.group("arm-r", (138, 112))
    S.raw(f'<g transform="translate(200 0) scale(-1 1)"><path d="{NUB}" fill="url(#gNubR)" stroke="url(#gNubR)" '
          'stroke-width="4" stroke-linejoin="round"/></g>')
    S.group("body")
    S.raw('<rect x="-10" y="-10" width="220" height="220" fill="url(#gSheet)" clip-path="url(#sheetC)"/>')
    S.raw('<g clip-path="url(#sheetC)">' + fold +
          '<rect x="30" y="-10" width="140" height="106" fill="url(#shTail)"/>'
          '<rect x="30" y="-10" width="140" height="180" fill="url(#shX)"/>'
          '<circle cx="96" cy="118" r="60" fill="url(#gDome)"/></g>')
    S.flat(ell(86, 136, 7.5, 10), INK)
    S.flat(ell(114, 136, 7.5, 10), INK)
    S.flat(ell(100, 153, 5, 5.5), INK)
    return S


if __name__ == "__main__":
    want = sys.argv[1:] or ["a", "b"]
    lab = {"a": "Ghost, tail A swish", "b": "Ghost, tail B trail"}
    name = {"a": "ghost-a-swish.svg", "b": "ghost-b-trail.svg"}
    render([(ghost(t).write(name[t]), lab[t]) for t in want])
