from chars import Sprite, rrect, circ, hand, light, shade, MOUTH, INK

def knight(variant='A'):
    s = Sprite()
    STEEL, BLUE, GOLD = '#C3CAD4', '#4F7BC4', '#F2B53A'
    # back pauldrons (darker), front pauldrons (left lit, right shaded) — same swept shapes as the archer's petals
    s.part('M64 98 C40 88 14 98 12 122 C11 132 20 138 32 136 C46 134 60 126 70 114 Z', shade(STEEL, 0.66), split=False)
    s.part('M136 98 C160 88 186 98 188 122 C189 132 180 138 168 136 C154 134 140 126 130 114 Z', shade(STEEL, 0.66), split=False)
    s.part('M56 112 C32 108 15 124 17 146 C18 156 27 161 39 157 C53 153 66 143 76 127 Z', STEEL, split=False, contact=True)
    s.part('M144 112 C168 108 185 124 183 146 C182 156 173 161 161 157 C147 153 134 143 124 127 Z', shade(STEEL, 0.76), split=False, contact=True)
    # round shield slung on the back-left (the archer's quiver sits back-right)
    s.part(circ(50, 56, 31), GOLD, split_x=50)
    s.part(circ(50, 56, 23), BLUE, sil=False, split_x=50)
    # helmet: a rounder dome than the hood
    s.part('M100 22 C136 22 161 52 161 92 C161 126 144 153 100 155 C56 153 39 126 39 92 C39 52 64 22 100 22 Z',
           STEEL, contact=True, shade_k=0.72)
    # plume ridge running from the back of the helmet forward
    if variant == 'A':
        s.part('M89 88 C85 58 85 30 90 16 L94 2 L100 12 L106 2 L110 16 C115 30 115 58 111 88 Z', BLUE, contact=True)
    else:
        s.part('M89 88 C85 58 85 30 90 16 L94 2 L100 12 L106 2 L110 16 C115 30 115 58 111 88 Z', '#C8553D', contact=True)
    # gold brim with a nose guard dropping from it (the archer's peak, knight-ified)
    s.part('M50 134 C50 104 72 96 100 96 C128 96 150 104 150 134 C148 152 130 160 100 160 C70 160 52 152 50 134 Z',
           GOLD, sil=False, contact=True)
    s.part('M62 132 C64 104 136 104 138 132 C134 151 66 151 62 132 Z', '#F2C7A0', sil=False, grad='url(#gFace)',
           extra='<rect x="100" y="90" width="50" height="70" fill="#8A4E36" opacity="0.14"/>' + MOUTH.format(y=141, y2=143.5))
    s.part('M94 92 H106 V128 C106 133 103 136 100 136 C97 136 94 133 94 128 Z', GOLD, sil=False, contact=True)
    # sword along the centre line, like the archer's arrow
    s.part('M92.5 168 H107.5 V190 L100 204 L92.5 190 Z', '#DCE0E6', contact=True)
    s.part(rrect(74, 160, 52, 10, 5), GOLD, contact=True)
    hand(s, 100, 152)
    return s.svg('Knight')

if __name__ == '__main__':
    open('knight-a.svg', 'w').write(knight('A'))
    open('knight-b.svg', 'w').write(knight('B'))
    print('ok')
