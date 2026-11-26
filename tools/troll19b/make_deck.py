# Lane troll19b: the draft Riffle deck (tools/riffle/decks/r19-troll19b.json). Not sent: the lead reviews, then sends.
#   python tools/troll19b/make_deck.py
import json, os
C = '../../../docs/clips/troll19b/'
v = lambda *names: [C + n + '.mp4' for n in names]
pair = lambda n: v('before-' + n, 'after-' + n)

report = {
    'id': 'report', 'kind': 'report', 'rarity': 'rare',
    'title': 'Trolls bowl harder',
    'text': 'Your nine notes on the trolls, each with a before and after film of the same set-up.',
    'why': 'You wrote them after seeing the solid boulders. Each part below is one of your notes, in your words, with what changed and the films. Before is the last release, after is this work. Mark any part that is off.',
    'videos': pair('bowl-troll'),
    'parts': [
        {'id': 'fists', 'title': 'Fights back on the way',
         'text': '"the troll should fight back while going to boulder": anyone in reach on its way gets its fists, one blow, then it walks on. It used to walk past them. The rock troll and the yeti do the same.',
         'videos': pair('fetch-troll')},
        {'id': 'often', 'title': 'Bowls more often',
         'text': '"they should bowl more often": about 9 to 13 bowls a minute, was 7 to 8 (rock troll 8 to 10, was 6 to 7). The 3 second wait with the boulder against you is gone, and it hurries after its boulder.',
         'videos': pair('bowl-troll')},
        {'id': 'further', 'title': 'Further, and faster off',
         'text': '"Boulder should go further and start a bit faster": it leaves a quarter faster and slows less. With nobody in its way it rolls nearly twice as far (about 650, was 350). It rolls on through whoever it hits.',
         'videos': pair('stand-troll') + v('after-live-troll')},
        {'id': 'windup', 'title': 'Charge up',
         'text': '"Should show a charge up animation": before every bowl the troll steps back and rears, the boulder drawn in to its chest, shaking, swelling and turning pale, grit flying. Then it lunges and the floor goes up in dust.',
         'videos': v('after-stand-troll', 'after-near-troll')},
        {'id': 'health', 'title': 'Boulder health',
         'text': '"Boulder should have hp and can be destroyed and targeted": every boulder has a health bar, cracks as it is hurt and bursts. Heroes go for it when it stands between them and the troll. Then the troll is bare-handed.',
         'videos': pair('break-troll')},
        {'id': 'spikes', 'title': 'The spikes',
         'text': '"idk why spikes come out when the boulder is bowled": the red warning line was set up as a bone attack, and bone attacks end in a row of spikes. It did no harm; it was a mistake. The line only warns now.',
         'videos': pair('near-troll')},
        {'id': 'back', 'title': 'Backs away first',
         'text': '"They should back away from enemies to a min distance before the bowl": with you close it steps back, dragging the boulder, then winds up and bowls. It no longer walks the boulder into you and holds it there.',
         'videos': pair('near-troll')},
        {'id': 'knock', 'title': 'Heavy knockback',
         'text': '"Boulder should do heavy knockback ... There no strong impact": you are thrown on down its way: a paladin twice as far as before, an archer further still. A burst of dust, sparks, a shake and a boom where it lands.',
         'videos': pair('stand-archer') + v('after-bowl-troll')},
        {'id': 'rock', 'title': 'Rock troll',
         'text': '"Rock troll should have a huge boulder and the boulder comes back to them": its boulder is a third wider, as wide as the troll, and rolls home to it after every bowl. It fights with its fists while it waits.',
         'videos': pair('stand-rocktroll') + pair('bowl-rocktroll')},
        {'id': 'rockbreak', 'title': 'Rock boulder broken',
         'text': 'Its boulder has much more health than the troll\'s. When it breaks the rock troll fights bare-handed for 7 seconds, then tears a new one out of the floor. (The boulder starts this film at half health.)',
         'videos': pair('break-rocktroll')},
        {'id': 'yeti', 'title': 'Yeti',
         'text': 'What fits it: its snowball has health and can be gone for, it throws people the same way, and the yeti hits back on its way to its ball. Its own run-up and heave are as they were.',
         'videos': pair('bowl-yeti')},
        {'id': 'fights', 'title': 'Whole fights',
         'text': 'A troll, a rock troll and a yeti against a paladin and an archer, 20 seconds each, nothing staged.',
         'videos': pair('live-troll') + pair('live-rocktroll') + pair('live-yeti')},
        {'id': 'fair', 'title': 'Still fair',
         'text': 'Trolls that bowl this much won far more fights, so the bowl itself hurts less (the throw and the wall do the work), and the troll and rock troll have a little less health and weaker fists. Who wins is back within a few points.'},
    ],
}
questions = [
    {'id': 'run', 'kind': 'question', 'rarity': 'uncommon', 'title': "Rock troll's run",
     'text': 'The rock troll sometimes runs behind its boulder instead of bowling. Keep that move?',
     'why': 'You said they "charge forwards still holding the boulder". That may have meant trolls walking the boulder into you, which is gone, or this run, which is an older move of the rock troll. It is rare now (about one bowl in seven) and lets the boulder go at the end.',
     'pick': 'Keep the run, rare, with the boulder let go at the end.',
     'videos': v('after-live-rocktroll')},
    {'id': 'broken', 'kind': 'question', 'rarity': 'uncommon', 'title': 'A broken boulder',
     'text': "The troll's broken boulder stays broken. The rock troll tears up a new one after 7 seconds.",
     'why': "Breaking the troll's boulder should be worth the effort, so it fights bare-handed for the rest of the fight, as it always has. The rock troll has nothing but its boulder, so it gets a new one. The other way: the troll gets a new one after a while too.",
     'pick': 'Keep: troll stays bare-handed, rock troll gets a new one.',
     'videos': v('after-break-troll', 'after-break-rocktroll')},
    {'id': 'far', 'kind': 'question', 'rarity': 'uncommon', 'title': 'How far they fly',
     'text': 'A struck archer goes about three body widths (was two), a paladin two (was one). Enough?',
     'why': 'It is one number. Further looks stronger but throws heroes into walls more, and walls hurt: that is already most of what a bowl does to you. Less far is safer and tamer.',
     'pick': 'Keep it as filmed.',
     'videos': pair('stand-archer')},
    {'id': 'aim', 'kind': 'question', 'rarity': 'uncommon', 'title': 'Who hits the boulder',
     'text': 'Heroes go for a boulder only when it stands between them and the troll. Others ignore it.',
     'why': 'If every hero treated it as one more enemy they would waste the fight on a rock: in tests the troll then won three times as often. Stray swings and blasts still hurt it when it is in the way.',
     'pick': 'Keep: only when it is in their way.',
     'videos': v('after-break-troll')},
]
deck = {'title': 'Trolls bowl harder', 'topic': 'art', 'stack': 'r19b', 'order': 3, 'priority': 1, 'cards': [report] + questions}

bad = []
for c in deck['cards']:
    if len(c['title']) > 26: bad.append(('title', c['id'], len(c['title'])))
    if len(c['text']) > 110: bad.append(('text', c['id'], len(c['text'])))
    if len(c.get('why', '')) > 300: bad.append(('why', c['id'], len(c['why'])))
    if isinstance(c.get('pick'), str) and len(c['pick']) > 150: bad.append(('pick', c['id'], len(c['pick'])))
    for p in c.get('parts', []):
        if len(p['title']) > 26: bad.append(('part title', p['id'], len(p['title'])))
here = os.path.dirname(os.path.abspath(__file__))
for c in deck['cards']:
    for f in c.get('videos', []) + [x for p in c.get('parts', []) for x in p.get('videos', [])]:
        if not os.path.exists(os.path.normpath(os.path.join(here, '..', 'riffle', 'decks', f))): bad.append(('missing', f))
out = os.path.join(here, '..', 'riffle', 'decks', 'r19-troll19b.json')
json.dump(deck, open(out, 'w', encoding='utf-8', newline='\n'), indent=1, ensure_ascii=False)
print('written', os.path.normpath(out), 'problems:', bad or 'none')
