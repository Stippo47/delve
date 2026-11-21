"""H2 designs 3-10 (imported by gen.py)."""
import math
from lib import *

PL, PR = (46, 108), (154, 108)
LAYOUT = ("Parts in draw order inside #sprite; the outline comes from the #outline filter. Facing = DOWN (+y), "
          "centre (100,100).")


# ------------------------------------------------------------------ 3. Bard
def bard(save):
    S = Sprite("SUPPORT Bard: big floppy plum beret worn tilted, a long red feather sweeping back, auburn hair, teal "
               "doublet. A lute held across the front (an instrument, so in front like the archer's bow): the bowl "
               "front-left, the neck up to the right shoulder. Both hands are on it, so it is all in arm-r (arm-l "
               "left out), drawn after #body. " + LAYOUT)
    S.group("body")
    S.shape(SHOULDERS, "#2E8C86")
    S.shape(blob([(40, 100), (50, 86), (64, 82), (70, 96), (66, 116), (52, 122), (42, 114)]), "#3BA39C", shadow=3)
    S.shape(blob([(160, 100), (150, 86), (136, 82), (130, 96), (134, 116), (148, 122), (158, 114)]), "#3BA39C", shadow=3)
    S.head()
    S.shape(blob([(50, 96), (60, 74), (100, 62), (140, 74), (150, 96), (150, 122), (140, 128), (136, 110), (100, 102),
                  (64, 110), (60, 128), (50, 122)], 0.8), "#9A4E2C", shadow=4)
    S.shape(blob([(36, 84), (46, 54), (80, 34), (120, 36), (148, 56), (152, 82), (130, 98), (96, 100), (60, 100)], 0.9),
            "#7A3C8E", shadow=5,
            decor='<path d="M 44 86 C 70 98 120 100 150 84 L 156 104 L 40 104 Z" fill="#4E2160" opacity="0.45"/>')
    S.shape(circ(84, 52, 7), "#7A3C8E", shadow=2)
    S.shape(blob([(118, 66), (132, 40), (152, 16), (176, -2), (166, 22), (148, 48), (130, 72)], 0.9), "#D8443A", shadow=3,
            decor='<path d="M 122 70 C 136 44 156 18 174 0" stroke="#F3B0A0" stroke-width="2.5" fill="none" opacity="0.8"/>')
    S.mouth()
    S.group("arm-r", PR, "lute + both hands")
    S.shape(poly([(88, 160), (150, 128), (154, 136), (94, 170)]), "#7A4A28", shadow=4,
            decor='<path d="M 92 164 L 152 132" stroke="#E8D9B8" stroke-width="1.6" opacity="0.8"/>')
    S.shape(poly([(146, 126), (166, 116), (172, 128), (152, 138)]), "#5E3820", shadow=2)
    S.shape(blob([(60, 158), (80, 146), (104, 154), (114, 174), (104, 196), (78, 202), (58, 190), (52, 172)], 1.0),
            "#D9893C", shadow=5,
            decor=f'<path d="{circ(86, 172, 7.5)}" fill="#4A2A18"/>'
                  '<path d="M 70 190 L 98 182" stroke="#7A4A28" stroke-width="5" stroke-linecap="round"/>'
                  '<path d="M 60 162 C 70 152 84 150 96 152" stroke="#F0B26A" stroke-width="4" fill="none" opacity="0.7"/>')
    S.fist(68, 182, 70, w=20, h=24)
    S.fist(138, 141, 62, w=20, h=24)
    return save("bard", S)


# ------------------------------------------------------------------ 4. Plague doctor
def plague_doctor(save):
    S = Sprite("SUPPORT Plague doctor: wide flat-brimmed dark hat, a long ivory beak mask jutting forward from under "
               "the brim, slate coat with a short cape. A walking cane in the right hand (arm-r, drawn before #body so "
               "it runs under the shoulder; only the fist shows), left hand free. " + LAYOUT)
    S.group("arm-r", PR, "cane")
    T = frame(152, 126, 14)
    S.shape(rr(0, 30, 8, 92, 4), "#5A3A26", T=T, shadow=0)
    S.shape(rr(0, 74, 10, 8, 3), "#D1A24A", T=T, shadow=0)
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#6E5A44")
    S.shape(blob([(36, 108), (54, 84), (100, 78), (146, 84), (164, 108), (150, 130), (100, 138), (50, 130)], 0.9),
            "#86705A", shadow=3)
    S.shape(HEAD, "#6B4A36", shadow=5)
    S.shape(blob([(84, 122), (116, 122), (114, 150), (107, 180), (100, 202), (93, 180), (86, 150)], 0.9), "#EFE5CB",
            shadow=4, decor='<path d="M 100 124 V 200" stroke="#C9BB9A" stroke-width="3" opacity="0.6"/>'
                             '<path d="M 86 150 C 94 154 106 154 114 150 L 114 158 C 106 162 94 162 86 158 Z" fill="#9C7A42"/>')
    S.shape(ell(100, 86, 64, 52), "#4E4A5C", shadow=5,
            decor=f'<path d="{ell(100, 84, 54, 42)}" fill="#615C72" opacity="0.6"/>')
    S.shape(circ(100, 82, 31), "#5E596E", shadow=4,
            decor=f'<path d="{ell(90, 72, 12, 8)}" fill="#8A84A0" opacity="0.6"/>')
    S.group("arm-l", PL, "free hand")
    S.fist(48, 150, -6)
    return save("plague-doctor", S)


# ------------------------------------------------------------------ 5. Monk
def monk(save):
    S = Sprite("SUPPORT Monk: shaved head, saffron robe with a maroon sash over the left shoulder, big wooden "
               "prayer beads hanging in front, a small topknot; no weapon, two big fists with white wraps held up in front (arm-l, arm-r, "
               "after #body). " + LAYOUT)
    S.add_def('<radialGradient id="gBald" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#F6D3B0"/>'
              '<stop offset="0.7" stop-color="#E9B88F"/><stop offset="1" stop-color="#D49E78"/></radialGradient>')
    S.group("body")
    S.shape(SHOULDERS, "#E8892B")
    S.shape(poly([(30, 96), (52, 80), (112, 140), (80, 140)]), "#93302C", shadow=3)
    S.shape(ell(52.1, 108.7, 7, 9.6), fill="#F0C49D", shadow=0, side=False)
    S.shape(ell(147.8, 108.7, 7, 9.6), fill="#D8A27C", shadow=0, side=False)
    S.shape(HEAD, fill="url(#gBald)", shadow=5,
            decor='<rect x="100" y="40" width="56" height="120" fill="url(#gFaceSide)"/>'
                  f'<path d="{ell(84, 70, 15, 10)}" fill="#FFF0DE" opacity="0.55"/>')
    S.shape(circ(100, 40, 10), "#3A2A24", shadow=3)
    for i in range(11):
        t = math.radians(14 + i * 15.2)
        x, y = 100 + 50 * math.cos(t), 124 + 44 * math.sin(t)
        big = i == 5
        S.shape(circ(x, y, 11 if big else 8.5), "#C8402F" if big else "#B07440", shadow=3)
    S.mouth()
    S.group("arm-l", PL, "wrapped fist")
    S.fist(48, 156, 14, w=26, h=26)
    S.shape(rr(48, 144, 24, 8, 3), "#F2EDE2", T="rotate(14 48 156)", shadow=0)
    S.group("arm-r", PR, "wrapped fist, punching")
    S.fist(150, 170, -14, w=26, h=26)
    S.shape(rr(150, 158, 24, 8, 3), "#F2EDE2", T="rotate(-14 150 170)", shadow=0)
    return save("monk", S)


# ------------------------------------------------------------------ 6. Seer
def seer(save):
    S = Sprite("SUPPORT Seer: long silver-lilac hair falling down the back, a violet blindfold tied over the eyes with "
               "its tails trailing behind, midnight shawl. A glowing crystal ball held out in front in both cupped "
               "hands (all in arm-r, after #body; arm-l left out); the hands sit under the ball. " + LAYOUT)
    S.add_def('<radialGradient id="gOrb" cx="0.38" cy="0.34" r="0.7"><stop offset="0" stop-color="#E9FFFB"/>'
              '<stop offset="0.35" stop-color="#8BEFE0"/><stop offset="1" stop-color="#2FA7B4"/></radialGradient>')
    S.group("back", (100, 70), "hair fall and blindfold tails")
    S.shape(blob([(52, 100), (44, 66), (46, 36), (54, 14), (70, 6), (86, 10), (100, 4), (114, 10), (130, 6),
                  (146, 14), (154, 36), (156, 66), (148, 100)], 0.9), "#B9A6DD",
            shadow=0, decor='<path d="M 70 20 C 64 50 66 76 72 100 M 100 8 C 98 40 98 70 100 100 M 130 20 C 136 50 134 76 128 100" '
                            'stroke="#9C88C6" stroke-width="5" fill="none" opacity="0.7"/>')
    S.shape(blob([(96, 52), (90, 36), (80, 22), (74, 8), (82, 6), (90, 20), (102, 40)], 0.8), "#7A45B4", shadow=3)
    S.shape(blob([(104, 52), (112, 36), (124, 24), (132, 10), (138, 16), (130, 28), (98, 40)], 0.8), "#7A45B4", shadow=3)
    S.shape(circ(100, 42, 8), "#7A45B4", shadow=3)
    S.group("body")
    S.shape(SHOULDERS, "#33447F")
    S.head()
    S.shape(blob([(50, 116), (46, 84), (62, 56), (100, 45), (138, 56), (154, 84), (150, 116), (100, 112)], 0.8),
            "#DCD0F0", shadow=4,
            decor='<path d="M 100 46 C 96 64 98 86 100 110" stroke="#A796CB" stroke-width="4" fill="none" opacity="0.8"/>')
    S.shape(blob([(48, 104), (60, 112), (66, 134), (62, 156), (52, 160), (44, 140), (42, 118)], 0.9), "#D2C4EC", shadow=3)
    S.shape(blob([(152, 104), (140, 112), (134, 134), (138, 156), (148, 160), (156, 140), (158, 118)], 0.9), "#D2C4EC", shadow=3)
    S.shape("M 46 106 C 70 100 130 100 154 106 L 152 124 C 130 118 70 118 48 124 Z", "#6B3FA0", shadow=3)
    S.mouth()
    S.group("arm-r", PR, "crystal ball in both hands")
    S.fist(78, 170, 35, w=20, h=24)
    S.fist(122, 170, -35, w=20, h=24)
    S.shape(circ(100, 174, 20), fill="url(#gOrb)", shadow=4,
            decor='<path d="M 86 168 A 14 14 0 0 1 98 158" stroke="#FFFFFF" stroke-width="4" fill="none" '
                  'stroke-linecap="round" opacity="0.85"/>')
    return save("seer", S)


# ------------------------------------------------------------------ 7. Beekeeper
def bee(S, x, y, a):
    T = frame(x, y, a)
    S.shape(ell(-6, -1, 6, 4.5), fill="#FFFFFF", T=T, shadow=0, side=False)
    S.shape(ell(6, -1, 6, 4.5), fill="#FFFFFF", T=T, shadow=0, side=False)
    S.shape(ell(0, 3, 6.5, 8.5), "#F4C430", T=T, shadow=0,
            decor='<rect x="-8" y="1" width="16" height="3" fill="#2B2230"/>'
                  '<rect x="-8" y="6.5" width="16" height="3" fill="#2B2230"/>')


def beekeeper(save):
    S = Sprite("SUPPORT Beekeeper: wide canvas hat with a dark mesh veil hiding the face, white suit, a copper smoker "
               "puffing smoke in the right hand (arm-r, drawn before #body; only the fist shows), left hand free, "
               "three bees buzzing round (#front). " + LAYOUT)
    S.add_def('<pattern id="pMesh" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0 L5 5 M5 0 L0 5" '
              'stroke="#8C8890" stroke-width="0.8" opacity="0.55"/></pattern>')
    S.group("arm-r", PR, "smoker")
    T = frame(150, 124, 22)
    S.shape(rr(0, 8, 16, 26, 5), "#7A5236", T=T, shadow=0)
    S.shape(rr(0, 36, 26, 30, 7), "#C8783C", T=T, shadow=0,
            decor='<rect x="-14" y="29" width="28" height="4" fill="#8E4F22" opacity="0.6"/>')
    S.shape(poly([(-8, 49), (8, 49), (3, 60), (-3, 60)]), "#9A9FA8", T=T, shadow=2)
    S.shape(circ(2, 67, 6.5), "#E6E3E0", T=T, shadow=0)
    S.shape(circ(-5, 78, 5), "#E6E3E0", T=T, shadow=0)
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#F2EFE8")
    S.shape(ell(100, 118, 56, 40), "#4F4B55", shadow=4,
            decor='<rect x="40" y="70" width="120" height="100" fill="url(#pMesh)"/>')
    S.shape(ell(100, 86, 66, 54), "#C4B892", shadow=5,
            decor=f'<path d="{ell(100, 84, 54, 42)}" fill="#D3C8A4" opacity="0.6"/>')
    S.shape(circ(100, 80, 31), "#CFC39E", shadow=4,
            decor='<circle cx="100" cy="80" r="31" fill="none" stroke="#6E5A3C" stroke-width="12"/>'
                  f'<path d="{ell(90, 70, 11, 7)}" fill="#ECE4C8" opacity="0.7"/>')
    S.group("arm-l", PL, "free hand")
    S.fist(50, 150, -6)
    S.group("front", note="bees")
    bee(S, 22, 58, -30)
    bee(S, 182, 36, 25)
    bee(S, 26, 184, 160)
    return save("beekeeper", S)


# ------------------------------------------------------------------ 8. Chef
def chef(save):
    S = Sprite("SUPPORT Chef: tall puffy white toque, big black handlebar moustache, white jacket, red neckerchief. "
               "A black iron frying pan in the right hand and a steel ladle in the left; both arms are drawn before "
               "#body, so the handles run under the shoulders and only the fists show. " + LAYOUT)
    S.group("arm-l", PL, "ladle")
    T = frame(52, 128, -24)
    S.shape(rr(0, 24, 7, 64, 3.5), "#B9C0CB", T=T, shadow=0)
    S.shape(circ(0, 60, 12), "#C9CFD8", T=T, shadow=2,
            decor='<circle cx="2" cy="62" r="8" fill="#8E96A4" opacity="0.6"/>')
    S.fist(0, 12, T=T, under=True)
    S.group("arm-r", PR, "frying pan")
    T = frame(150, 128, 30)
    S.shape(rr(0, 18, 10, 52, 5), "#3F3B45", T=T, shadow=0)
    S.shape(circ(0, 54, 25), "#47434E", T=T, shadow=3,
            decor='<circle cx="2" cy="56" r="18" fill="#2F2C35"/><path d="M -12 44 A 16 16 0 0 1 4 38" stroke="#7B7686" '
                  'stroke-width="3" fill="none" stroke-linecap="round"/>')
    S.fist(0, 12, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#F1EFEA",
            decor='<circle cx="70" cy="132" r="3" fill="#B9B2A6"/><circle cx="130" cy="132" r="3" fill="#B9B2A6"/>')
    S.head()
    S.shape(rr(100, 116, 90, 40, 16), "#F6F4EF", shadow=4,
            decor='<path d="M 54 126 H 146 V 136 H 54 Z" fill="#DDD8CE" opacity="0.7"/>')
    S.shape(cloud(100, 70, 46, 8, 0.66, 22.5), "#FBFAF6", shadow=5,
            decor=f'<path d="{circ(100, 70, 30)}" fill="#FFFFFF" opacity="0.5"/>'
                  f'<path d="{circ(100, 70, 22)}" fill="#E4DFD4" opacity="0.6"/>')
    S.shape("M 100 134 C 92 128 78 128 70 134 C 62 140 56 138 54 130 C 50 142 62 150 74 146 C 84 143 94 140 100 142 "
            "C 106 140 116 143 126 146 C 138 150 150 142 146 130 C 144 138 138 140 130 134 C 122 128 108 128 100 134 Z",
            "#4A2E22", shadow=3)
    S.shape(poly([(80, 148), (120, 148), (112, 160), (100, 172), (88, 160)]), "#D23A32", shadow=3)
    S.mouth(144.5)
    return save("chef", S)


# ------------------------------------------------------------------ 9. Quartermaster
def quartermaster(save):
    S = Sprite("SUPPORT Quartermaster: a travelling merchant with a huge backpack (#back: pack, bedroll on top, a "
               "copper pot and a rope coil hung on the sides), mustard knit cap, teal tunic with pack straps. No "
               "weapon: both fists grip the straps at the front of the shoulders (arm-l, arm-r, after #body). " + LAYOUT)
    S.group("back", (100, 80), "backpack")
    S.shape(rr(100, 50, 136, 84, 24), "#9A6B3F", shadow=0)
    S.shape(rr(100, 66, 112, 34, 12), "#7E5530", shadow=3,
            decor='<rect x="94" y="70" width="12" height="14" rx="3" fill="#D1A24A"/>')
    S.shape(rr(100, 10, 152, 24, 12), "#B8483A", shadow=3,
            decor='<rect x="50" y="-4" width="9" height="30" fill="#5E3820"/>'
                  '<rect x="141" y="-4" width="9" height="30" fill="#5E3820"/>'
                  '<path d="M 26 4 H 174" stroke="#D86A58" stroke-width="3" opacity="0.6"/>')
    S.shape(circ(176, 60, 15), "#C77A44", shadow=3, decor='<circle cx="176" cy="60" r="9" fill="#7E4A26" opacity="0.7"/>')
    S.shape(circ(24, 58, 15), "#D6BC86", shadow=3,
            decor='<circle cx="24" cy="58" r="6" fill="#8E7448"/>'
                  '<circle cx="24" cy="58" r="11" fill="none" stroke="#B89A62" stroke-width="2"/>')
    S.group("body")
    S.shape(SHOULDERS, "#3E8C88")
    S.shape(poly([(56, 78), (72, 78), (74, 140), (58, 140)]), "#6B4528", shadow=3)
    S.shape(poly([(144, 78), (128, 78), (126, 140), (142, 140)]), "#6B4528", shadow=3)
    S.head()
    S.shape(blob([(50, 108), (50, 78), (66, 54), (100, 44), (134, 54), (150, 78), (150, 108), (100, 102)], 0.8), "#D9932F",
            shadow=4, decor='<path d="M 46 92 C 70 84 130 84 154 92 L 154 112 L 46 112 Z" fill="#B8761E"/>'
                            '<path d="M 70 50 V 86 M 85 46 V 86 M 100 44 V 86 M 115 46 V 86 M 130 50 V 86" '
                            'stroke="#B8761E" stroke-width="3" opacity="0.5"/>')
    S.shape(circ(100, 46, 11), "#F1E7D2", shadow=3)
    S.mouth()
    S.group("arm-l", PL, "fist on the strap")
    S.fist(65, 144, 0)
    S.group("arm-r", PR, "fist on the strap")
    S.fist(135, 144, 0)
    return save("quartermaster", S)


# ------------------------------------------------------------------ 10. Lantern keeper
def lantern_keeper(save):
    S = Sprite("SUPPORT Lantern keeper: deep navy hooded cloak with a grey capelet, face in the hood's shadow. A long "
               "pole in the right hand (arm-r, drawn before #body; only the fist shows) held out front-right, a brass "
               "lantern with a warm glow hanging from its end; left hand free. " + LAYOUT)
    S.add_def('<radialGradient id="gGlow" cx="0.45" cy="0.42" r="0.6"><stop offset="0" stop-color="#FFF6C8"/>'
              '<stop offset="0.5" stop-color="#FFD25A"/><stop offset="1" stop-color="#F08A24"/></radialGradient>')
    S.add_def(f'<clipPath id="cFace"><path d="{HEAD}"/></clipPath>')
    S.group("back", (100, 60), "hood tail")
    S.shape(blob([(82, 50), (86, 26), (98, 8), (116, 0), (126, 4), (114, 16), (108, 34), (118, 52)], 0.9), "#34507E",
            shadow=0)
    S.group("arm-r", PR, "lantern pole")
    T = frame(156, 96, -14)
    S.shape(rr(0, 80, 38, 38, 12), fill="url(#gGlow)", T=T, shadow=0)
    S.shape(poly([(0, 66), (14, 73), (14, 87), (0, 94), (-14, 87), (-14, 73)]), "#C9962E", T=T, shadow=3)
    S.shape(rr(0, 40, 8, 84, 4), "#5A3A26", T=T, shadow=3)
    S.shape(circ(0, 80, 5), "#3F3B45", T=T, shadow=2)
    S.fist(0, 44, T=T, under=True)
    S.group("body")
    S.shape(SHOULDERS, "#2F4A73")
    S.shape(blob([(34, 112), (48, 86), (100, 80), (152, 86), (166, 112), (150, 134), (100, 140), (50, 134)], 0.9),
            "#7D8796", shadow=3)
    S.head()
    hood = ("M 44 132 C 30 84 54 30 100 28 C 146 30 170 84 156 132 C 152 146 136 148 132 134 C 126 112 116 104 100 104 "
            "C 84 104 74 112 68 134 C 64 148 48 146 44 132 Z")
    S.shape(hood, "#34507E", shadow=5)
    S.raw('<path d="M 68 134 C 74 112 84 104 100 104 C 116 104 126 112 132 134 C 130 150 70 150 68 134 Z" '
          'fill="#1F1B33" opacity="0.3" clip-path="url(#cFace)"/>')
    S.shape(blob([(64, 140), (80, 148), (100, 152), (120, 148), (136, 140), (134, 154), (118, 164), (100, 166), (82, 164),
                  (66, 154)], 0.8), "#E0902E", shadow=3)
    S.mouth(op=0.7)
    S.group("arm-l", PL, "free hand")
    S.fist(52, 150, -6)
    return save("lantern-keeper", S)


ALL = {"bard": bard, "plague-doctor": plague_doctor, "monk": monk, "seer": seer, "beekeeper": beekeeper,
       "chef": chef, "quartermaster": quartermaster, "lantern-keeper": lantern_keeper}
