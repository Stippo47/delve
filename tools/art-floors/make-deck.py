# Writes tools/riffle/decks/r19-art-floors.json: one board card per dungeon, its three floor options as items.
#   python tools/art-floors/make-deck.py
import json, os

IMG = '../../../design/r19-art/floors/{}/room.png'
WHY = ('The floor has to stay quiet under a busy fight, so each one keeps a narrow, soft range of light and dark with '
       'big shapes and no fine grain, and the units stand on it in every picture so you can judge that. Tick the one '
       'you want for this dungeon; a comment can mix parts of two.')
CARDS = [
    ('wildwood', 'Wildwood floors', 'Three forest floors: moss and earth, stepping stones, or a worn trail door to door.', 'wildwood-trail', [
        ('wildwood-loam', 'Mossy loam', 'Big moss and bare-earth patches, leaf drifts, roots reaching in from the walls.'),
        ('wildwood-stones', 'Stepping stones', 'Flat stones laid door to door, moss on their shady side.'),
        ('wildwood-trail', 'Worn trail', 'A trodden dirt trail from the way in to each door, wheel ruts, leaves at its sides.'),
    ], 'My pick: the trail. It quietly points the way out and its two tones are the calmest under a crowd.'),
    ('crypt', 'Crypt floors', 'Three crypt floors: grave flags with tomb slabs, bone-dust cobbles, or pale tomb marble.', 'crypt-flags', [
        ('crypt-flags', 'Grave flags', 'Mixed flagstones, a few cracked, carved tomb slabs with a cross; dust at the walls.'),
        ('crypt-cobble', 'Bone-dust cobbles', 'Big rounded cobbles, pale dust drifted in the joints, scattered bones.'),
        ('crypt-marble', 'Tomb marble', 'Large marble slabs with soft veins, slate diamonds at the corners, a slate border.'),
    ], 'My pick: grave flags. The tomb slabs make it the Crypt at a glance; the cobbles are the busiest of the three.'),
    ('sewers', 'Sewers floors', 'Three sewer floors: wet brick, mossy setts, or old glazed cistern tiles.', 'sewers-brick', [
        ('sewers-brick', 'Wet brick', 'Rounded bricks, soft damp stains, moss from the walls, drain grates and puddles.'),
        ('sewers-setts', 'Mossy setts', 'Square setts with moss filling the joints in patches, round manhole covers.'),
        ('sewers-tile', 'Cistern tiles', 'Pale green glazed tiles, a few missing down to the mortar, grime at the walls.'),
    ], 'My pick: wet brick. Its shapes are the biggest; the tiles are a close second and the most unusual.'),
    ('warren', 'Warren floors', 'Three goblin floors: trodden earth, plank walkways, or broken dwarf flagstones.', 'warren-boards', [
        ('warren-earth', 'Trodden earth', 'Packed earth worn pale where feet go, dark hollows, pebbles, straw, a dug lip.'),
        ('warren-boards', 'Plank walks', 'Crooked nailed boardwalks laid door to door over the earth, loose planks about.'),
        ('warren-ruin', 'Broken flags', 'Old cut flagstones with whole stretches gone to earth, rubble at the edges.'),
    ], 'My pick: plank walks, the most goblin of the three. Trodden earth is the quietest if the fights get too busy.'),
    ('frost', 'Frost Hollow floors', 'Three cold floors: packed snow with drifts, glacier ice plates, or rimed flagstones.', 'frost-ice', [
        ('frost-snow', 'Packed snow', 'Wind-shaped drifts all lying one way, glassy ice patches, snow banked at the walls.'),
        ('frost-ice', 'Glacier plates', 'Big pale-blue ice plates split by blue cracks, frost feathers, trapped bubbles.'),
        ('frost-rime', 'Rimed flags', 'Blue-grey flagstones, snow packed in the joints, rime creeping in from the walls.'),
    ], 'My pick: glacier plates. Clearly ice, and white units (wolf, snowman) still stand out on its blue.'),
    ('ember', 'Ember Deep floors', 'Three hot floors: basalt columns with glowing joints, ash and lava flows, or scorched brick.', 'ember-basalt', [
        ('ember-basalt', 'Basalt columns', 'Hexagonal basalt tops, a faint ember glow down a few joints, ash at the walls.'),
        ('ember-ash', 'Ash and lava', 'Warm grey ash over dark cooled lava flows, a glowing fissure here and there.'),
        ('ember-brick', 'Scorched brick', 'Dark red forge brick, soot scorches, cooled slag spills, soot thick at the walls.'),
    ], 'My pick: basalt columns. The glowing joints say Ember Deep without any bright patches that read as fire on the ground.'),
    ('spire', 'Gilded Spire floors', 'Three bright floors: gilded marble grid, cut-stone octagons, or flags mended with gold.', 'spire-sectile', [
        ('spire-inlay', 'Gilded marble', 'Cream marble in a soft checker, a gold inlay grid with rosettes where lines cross.'),
        ('spire-sectile', 'Opus sectile', 'Cream octagons with small lavender and gold squares between them.'),
        ('spire-kintsugi', 'Mended flags', 'Near-white flagstones, the cracked ones mended with angular gold seams.'),
    ], 'My pick: opus sectile. Rich but even all over, so nothing on it looks like a marker.'),
    ('dunes', 'Sunken Dunes floors', 'Three desert floors: wind-swept sand, sandstone tomb blocks, or a sun-cracked clay pan.', 'dunes-sand', [
        ('dunes-sand', 'Wind-swept sand', 'Long soft dunes all lying one way, half-buried slabs, shards, drifts at the walls.'),
        ('dunes-tomb', 'Sandstone tomb', 'Big sandstone blocks, some cut with old signs, sand blown over them in tongues.'),
        ('dunes-clay', 'Sun-cracked clay', 'A dried clay pan in big curled plates, sand in the cracks, shards and pebbles.'),
    ], 'My pick: wind-swept sand, the softest of the three. The tomb blocks would suit the Buried Halls floor.'),
    ('foundry', 'Foundry floors', 'Three factory floors: riveted deck plates, tread plate panels, or brick with brass rails.', 'foundry-plates', [
        ('foundry-plates', 'Riveted plates', 'Big steel plates, rivets at the corners, oil stains, brass hatches, hazard stripes.'),
        ('foundry-tread', 'Tread plate', 'Panels of low chunky tread plate, brass name plates bolted down, scorches.'),
        ('foundry-rails', 'Brick and brass', 'Grey factory brick with brass rails sunk in it door to door, a turn plate.'),
    ], 'My pick: riveted plates. Big calm panels, and the hazard stripes frame the room without crowding it.'),
]

def main():
    cards = []
    for theme, title, text, pick, opts, mine in CARDS:
        assert len(title) <= 26 and len(text) <= 110, (theme, len(title), len(text))
        cards.append({
            'id': theme, 'kind': 'board', 'rarity': 'uncommon', 'title': title, 'text': text, 'why': WHY, 'pick': [pick],
            'details': mine + '\n\nEach picture is a real room of the game at phone size with heroes and this dungeon\'s enemies '
                       'standing on it. To walk around in one: floors.html?floor=' + pick + ' (or ?floor=a, b or c for that '
                       'option in every dungeon). Code: js/floors19.js; each folder also has swatch.png, the option alone.',
            'items': [{'id': i, 'label': l, 'image': IMG.format(i), 'text': t} for i, l, t in opts],
        })
    deck = {'title': 'Art: dungeon floors', 'topic': 'art', 'stack': 'r19art', 'order': 2, 'cards': cards}
    out = os.path.join(os.path.dirname(__file__), '..', 'riffle', 'decks', 'r19-art-floors.json')
    with open(out, 'w', encoding='utf8') as f: json.dump(deck, f, indent=2, ensure_ascii=False); f.write('\n')
    print('wrote', os.path.normpath(out), len(cards), 'cards')

main()
