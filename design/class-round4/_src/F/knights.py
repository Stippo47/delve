"""Round-4 fixes for the knights. python knights.py [name ...]"""
import sys, re
from fx import *

C = "knight"
FIST_R = f'<path id="fistR" d="{fist_d(+1)}"/>'
FIST_L = f'<path id="fistL" d="{fist_d(-1)}"/>'


def paladin():
    s = read3(C, "knight-paladin")
    s = add_defs(s, FIST_R)
    s = refist(s, "fistR")
    s = s.replace("translate(151 140) rotate(37)", "translate(154 142) rotate(37)").replace("translate(-151 -140)", "translate(-154 -142)")
    s = set_comment(s, "Round 4: hand rule - the sword fist is now a fist wrapped round the grip, long along the handle, knuckles on the outer side.")
    write4(C, "knight-paladin", s)


def dame():
    s = read3(C, "knight-dame")
    s = add_defs(s, FIST_L)
    s = refist(s, "fistL")
    s = s.replace("translate(53 143) rotate(-34)", "translate(50 145) rotate(-34)")
    s = set_comment(s, "Round 4: hand rule - the sword fist is wrapped round the grip, long along the handle, knuckles on the outer side.")
    write4(C, "knight-dame", s)


MACE_HEAD = scale_about("M 0 25 C 4 25 7 26 9.5 28.5 L 8.5 31.5 C 14 33 20 37 23 43 C 22.5 51 18 58 13.5 61 L 10 62 C 7 65.5 4 67 0 67 C -4 67 -7 65.5 -10 62 L -13.5 61 C -18 58 -22.5 51 -23 43 C -20 37 -14 33 -8.5 31.5 L -9.5 28.5 C -7 26 -4 25 0 25 Z", 1.12, 0, 25)


def flanged_mace(tx, ty, rot, side, wpn_clip, shade_ids):
    """Flanged mace (local frame: haft along +y, head forward). Returns (arm group inner, clip def)."""
    fid = "fistR" if side > 0 else "fistL"
    grooveR = scale_about("M 8 28 C 12.5 36 13.5 56 8 64 C 9 56 9.5 36 8 28 Z", 1.12, 0, 25)
    grooveL = mirror_x(grooveR)
    ridge = scale_about("M 0 26 C 5 36 5 56 0 66 C -5 56 -5 36 0 26 Z", 1.12, 0, 25)
    inner = (
        f'<g transform="translate({tx} {ty}) rotate({rot})">'
        '<rect x="-4.5" y="-38" width="9" height="68" rx="3.5" fill="url(#g13)"/>'
        '<rect x="-4.5" y="-38" width="9" height="68" rx="3.5" fill="url(#g14)"/>'
        '<circle cx="0" cy="-38" r="6" fill="url(#g11)"/>'
        f'<g clip-path="url(#mcHaft)"><path d="{MACE_HEAD}" transform="translate(0 4)" fill="#2B2230" opacity="0.3"/></g>'
        f'<path d="{MACE_HEAD}" fill="url(#mgSteel)"/>'
        f'<g clip-path="url(#mcHead)"><path d="{grooveR}" fill="#3A4252" opacity="0.55"/><path d="{grooveL}" fill="#3A4252" opacity="0.55"/>'
        f'<path d="{ridge}" fill="#F2F4F8" opacity="0.75"/><rect x="0" y="20" width="30" height="60" fill="#3A4252" opacity="0.18"/>'
        '<rect x="-25" y="20" width="50" height="9" fill="#2B2230" opacity="0.25"/></g>'
        '<rect x="-7.5" y="19" width="15" height="8" rx="3" fill="url(#g11)"/><circle cx="0" cy="73.5" r="4.5" fill="url(#mgSteel)"/>'
        f'<g clip-path="url(#mcHaft)"><use href="#{fid}" transform="translate(0 3)" fill="#2B2230" opacity="0.3"/></g>'
        f'<use href="#{fid}" fill="url(#gHand)"/>'
        '</g>')
    defs = (
        '<linearGradient id="mgSteel" x1="0" y1="0" x2="1" y2="0.25"><stop offset="0" stop-color="#D3D9E2"/><stop offset="1" stop-color="#7D8697"/></linearGradient>'
        f'<clipPath id="mcHead"><path d="{MACE_HEAD}"/></clipPath>'
        '<clipPath id="mcHaft"><rect x="-4.5" y="-38" width="9" height="68"/><rect x="-7.5" y="20" width="15" height="8"/></clipPath>'
        f'<clipPath id="{wpn_clip}"><g transform="translate({tx} {ty}) rotate({rot})"><rect x="-4.5" y="-38" width="9" height="68"/>'
        f'<path d="{MACE_HEAD}"/><use href="#{fid}"/></g></clipPath>')
    return inner, defs


SLOT_L = "M 66 115 Q 66 110.5 71 110.5 L 91 112 Q 95 112.5 95 116.5 Q 95 120.5 91 120.5 L 71 120.5 Q 66 120 66 115 Z"


def tower():
    s = read3(C, "knight-tower")
    s = add_defs(s, FIST_R)
    # flanged mace: a steel head with three flanges showing (two edge-on, one face-on), gold collar, wooden haft
    inner, d = flanged_mace(158, 144, 42, +1, "tcWpn2", None)
    s = add_defs(s, d)
    s = s.replace('clip-path="url(#tcWpn)"', 'clip-path="url(#tcWpn2)"')
    arm = ('<g id="arm-r" data-pivot="150 108">\n  <!-- flanged mace, held low: the haft passes under the right pauldron and the head comes out past the front of the body; only the fist shows at the body\'s edge, wrapped round the haft -->\n  '
           + inner + '\n</g>')
    s = set_group(s, "arm-r", arm)
    # eye slots: two dark slots either side of the centre, under the crest
    slots = (f'<g clip-path="url(#c18)"><path d="{SLOT_L}" fill="#232030" opacity="0.9"/><path d="{mirror_x(SLOT_L, 100)}" fill="#232030" opacity="0.9"/>'
             f'<path d="{move(SLOT_L, 0, 9.5)}" fill="#FFFFFF" opacity="0.0"/></g>')
    s = sub1(s, '  <!-- crest -->', '  <!-- eye slots -->\n  ' + slots + '\n  <!-- crest -->')
    s = set_comment(s, "Round 4: eye slots back (two dark slots either side of the centre); a new flanged mace (steel head with flanges, gold collar, wooden haft); the fist wraps the haft.")
    write4(C, "knight-tower", s)


def bulwark():
    s = read3(C, "knight-bulwark")
    s = add_defs(s, FIST_R)
    # held further back on the shaft: bare shaft now shows between the fist and the lugs; spear moved out a little so
    # the fist still shows at the pauldron's front-outer edge
    T = "translate(179 138) rotate(8)"
    head = move(scale_about("M -3.5 20 L 3.5 20 L 13 37 L 0 61 L -13 37 Z", 0.92, 0, 20), 0, 10)
    s = s.replace('<path id="bHead" d="M -3.5 20 L 3.5 20 L 13 37 L 0 61 L -13 37 Z"/>', f'<path id="bHead" d="{head}"/>')
    s = s.replace('<rect x="-3" y="-104" width="6" height="122" rx="3"', '<rect x="-3" y="-104" width="6" height="134" rx="3"')
    s = s.replace('<rect x="-3" y="-104" width="6" height="122"/><rect x="-4.5" y="11" width="9" height="8"/>',
                  '<rect x="-3" y="-104" width="6" height="134"/><rect x="-4.5" y="22" width="9" height="8"/>')
    s = s.replace('<path d="M -12 15.5 L 12 15.5 L 10 20.5 L -10 20.5 Z" fill="url(#g5)"/>', '<path d="M -12 25.5 L 12 25.5 L 10 30.5 L -10 30.5 Z" fill="url(#g5)"/>')
    s = s.replace('<rect x="-4.5" y="11" width="9" height="8" rx="2" fill="url(#g5)"/>', '<rect x="-4.5" y="22" width="9" height="8" rx="2" fill="url(#g5)"/>')
    s = s.replace('<rect x="-4.5" y="-108" width="9" height="126"/><use href="#bHead"/>', '<rect x="-4.5" y="-108" width="9" height="138"/><use href="#bHead"/>')
    s = s.replace('<path d="M -12 15.5 L 12 15.5 L 10 20.5 L -10 20.5 Z"/>', '<path d="M -12 25.5 L 12 25.5 L 10 30.5 L -10 30.5 Z"/>')
    s = s.replace("translate(160 142) rotate(12)", T)
    s = refist(s, "fistR")
    s = set_comment(s, "Round 4: the spear is held further back on the shaft (bare shaft between the fist and the head); the fist wraps the shaft.")
    write4(C, "knight-bulwark", s)


HELM_OUT = "M 100 40 C 134 40 154 64 154 98 C 154 130 138 154 100 158 C 62 154 46 130 46 98 C 46 64 66 40 100 40 Z"
HELM_HOLE = ("M 100 103 C 111 98 127 98 134 104 C 140 110 140 124 139 136 C 138 150 126 166 100 166 "
             "C 74 166 62 150 61 136 C 60 124 60 110 66 104 C 73 98 89 98 100 103 Z")
BEAK = "M 86 95 C 92 89 108 89 114 95 C 116 104 108 114 100 124 C 92 114 84 104 86 95 Z"
HAM = "M -20 31 L 20 31 C 23 31 25 33 25 36 L 25 54 C 25 57 23 59 20 59 L -20 59 C -23 59 -25 57 -25 54 L -25 36 C -25 33 -23 31 -20 31 Z"


def griffon():
    s = read3(C, "knight-griffon")
    s = add_defs(s, FIST_L)
    # helm: a much wider open face (cheek guards, open at the chin), the beak shortened to a brow peak
    s = sub1(s, 'd="' + HELM_OUT + ' M 100 114 C 116 114 128 120 129 133 C 129 146 116 152 100 152 C 84 152 71 146 71 133 C 72 120 84 114 100 114 Z"',
             'd="' + HELM_OUT + ' ' + HELM_HOLE + '"')
    s = sub1(s, '<path id="gBeak" d="M 84 98 C 90 91 110 91 116 98 C 119 112 110 130 100 146 C 90 130 81 112 84 98 Z"/>', f'<path id="gBeak" d="{BEAK}"/>')
    s = sub1(s, '<path d="M 84 132 Q 100 127 116 132 L 116 150 L 84 150 Z" fill="#B0661A" opacity="0.8"/><path d="M 95 96 L 98 96 L 98 124 L 95 124 Z" fill="#FFF1C4" opacity="0.6"/>',
             '<path d="M 86 112 Q 100 108 114 112 L 114 130 L 86 130 Z" fill="#B0661A" opacity="0.8"/><path d="M 95 94 L 98 94 L 98 108 L 95 108 Z" fill="#FFF1C4" opacity="0.6"/>')
    # bigger warhammer: head 50 x 28 (was 40 x 22), longer haft
    T0, T = "translate(52 146) rotate(-28)", "translate(50 142) rotate(-32)"
    s = s.replace(T0, T)
    s = sub1(s, '<path id="gHam" d="M -15 32 L 15 32 C 18 32 20 34 20 37 L 20 49 C 20 52 18 54 15 54 L -15 54 C -18 54 -20 52 -20 49 L -20 37 C -20 34 -18 32 -15 32 Z"/>',
             f'<path id="gHam" d="{HAM}"/>')
    s = s.replace('<rect x="-4.5" y="-40" width="9" height="74" rx="3.5"', '<rect x="-5" y="-48" width="10" height="84" rx="3.5"')
    s = s.replace('<circle cx="0" cy="-40" r="6" fill="url(#g9)"/>', '<circle cx="0" cy="-48" r="6.5" fill="url(#g9)"/>')
    s = s.replace('<rect x="-4.5" y="-40" width="9" height="88"/>', '<rect x="-5" y="-48" width="10" height="84"/>')
    s = sub1(s, '<rect x="-20" y="32" width="8" height="22" fill="#F2F4F8" opacity="0.8"/><rect x="12" y="32" width="8" height="22" fill="#7E8899" opacity="0.6"/><rect x="-3" y="32" width="6" height="22" fill="url(#g9)"/>',
             '<rect x="-25" y="31" width="10" height="28" fill="#F2F4F8" opacity="0.8"/><rect x="15" y="31" width="10" height="28" fill="#7E8899" opacity="0.6"/><rect x="-4" y="31" width="8" height="28" fill="url(#g9)"/>')
    s = refist(s, "fistL")
    s = set_comment(s, "Round 4: helm with a much wider open face (cheek guards, open at the chin) and the beak cut down to a short brow peak; warhammer head about 1.3x bigger on a longer haft; the fist wraps the haft.")
    write4(C, "knight-griffon", s)


def old_guard(tx=94, ty=161, rot=50, gap=29):
    s = read3(C, "knight-old-guard")
    # shorter fists (two on one grip, with bare grip showing between them so they read as two hands)
    s = add_defs(s, f'<path id="fistR" d="{fist_d(+1, W=21, L=23)}"/>')
    # shorter blade: held in the middle the sword can't run as far forward inside the sprite box
    s = sub1(s, '<path id="ogBlade" d="M -16 16 L 16 16 L 15 60 L 0 95 L -15 60 Z"/>', '<path id="ogBlade" d="M -14 16 L 14 16 L 13 47 L 0 66 L -13 47 Z"/>')
    # two-handed: both fists on the grip, in the middle, in front of the body (arm-r now drawn after #body);
    # the blade comes forward and a little to his right-front... (sprite left)
    T = f"translate({tx} {ty}) rotate({rot})"
    arm = (f'<g id="arm-r" data-pivot="150 108">\n'
           '  <!-- greatsword held two-handed in the middle, in front of the body: both fists wrap the grip (no arm-l). '
           'This group is drawn after #body, so the fists and the sword sit over the beard. -->\n'
           f'  <g transform="{T}">\n'
           '    <use href="#ogBlade" fill="url(#g14)"/>\n'
           '    <g clip-path="url(#ogcBlade)"><rect x="0" y="0" width="22" height="120" fill="#6F7A8E" opacity="0.5"/><rect x="-2.2" y="22" width="4.4" height="40" rx="2.2" fill="#8E97A8" opacity="0.7"/><rect x="-0.8" y="22" width="1.6" height="58" fill="#F4F6FA" opacity="0.5"/></g>\n'
           f'    <rect x="-5" y="{-gap - 18}" width="10" height="{gap + 28}" rx="3.5" fill="#5A2E1E"/>\n'
           f'    <circle cx="0" cy="{-gap - 18}" r="7.5" fill="url(#g12)"/><circle cx="0" cy="{-gap - 18}" r="7.5" fill="url(#g13)"/>\n'
           '    <g clip-path="url(#ogcBlade)"><use href="#ogGuard" transform="translate(0 4)" fill="#2B2230" opacity="0.3"/></g>\n'
           '    <use href="#ogGuard" fill="url(#g12)"/>\n'
           '    <use href="#ogGuard" fill="url(#g15)"/>\n'
           f'    <g clip-path="url(#ogcGrip2)"><use href="#fistR" transform="translate(0 {-gap + 3})" fill="#2B2230" opacity="0.3"/></g>\n'
           f'    <use href="#fistR" transform="translate(0 {-gap})" fill="url(#gHand)"/>\n'
           '    <g clip-path="url(#ogcGrip)"><use href="#fistR" transform="translate(0 3)" fill="#2B2230" opacity="0.3"/></g>\n'
           '    <use href="#fistR" fill="url(#gHand)"/>\n'
           '  </g>\n</g>')
    s = set_group(s, "arm-r", arm)
    s = move_group_after(s, "arm-r", "body")
    s = sub1(s, '<clipPath id="ogcGrip"><use href="#ogGuard"/><use href="#ogBlade"/><rect x="-13" y="-29" width="26" height="22" rx="9"/></clipPath>',
             f'<clipPath id="ogcGrip"><use href="#ogGuard"/><use href="#ogBlade"/><use href="#fistR" transform="translate(0 {-gap})"/></clipPath>'
             f'<clipPath id="ogcGrip2"><rect x="-5" y="{-gap - 18}" width="10" height="{gap + 28}"/><circle cx="0" cy="{-gap - 18}" r="7.5"/></clipPath>')
    # the old 'shadow of the body on the sword' no longer applies (the sword is in front now)
    s = re.sub(r'  <!-- shadow of the body on the sword where it comes out from under it -->\n  <g clip-path="url\(#ogcWpn\)">.*?</g>\n', '', s, flags=re.S)
    s = re.sub(r'<clipPath id="ogcWpn">.*?</clipPath>\n', '', s, flags=re.S)
    # a contact shadow of the sword and fists on the body below them
    sh = (f'<g clip-path="url(#ogcBody)"><g transform="translate(1 4) {T}"><use href="#ogBlade" fill="#2B2230" opacity="0.22"/>'
          f'<use href="#ogGuard" fill="#2B2230" opacity="0.22"/><use href="#fistR" fill="#2B2230" opacity="0.22"/>'
          f'<use href="#fistR" transform="translate(0 {-gap})" fill="#2B2230" opacity="0.22"/></g></g>')
    s = add_defs(s, '<clipPath id="ogcBody"><use href="#s1"/><use href="#s3"/><use href="#s5"/><use href="#s8"/><use href="#s11"/><use href="#s14"/><use href="#s21"/></clipPath>')
    a, b = group_span(s, "body")
    s = s[:b - 4] + "  <!-- contact shadow of the sword held in front -->\n  " + sh + "\n" + s[b - 4:]
    s = set_comment(s, "Round 4: two-handed, so held in the middle, in front: both fists wrap the grip at the centre of the body (arm-r drawn after #body), and the blade comes forward past the beard.")
    write4(C, "knight-old-guard", s)


if __name__ == "__main__":
    for n in sys.argv[1:] or ["paladin", "dame"]:
        globals()[n.replace("-", "_")]()
    print("ok")
