// lane bases19: the draft Riffle deck (tools/riffle/decks/r19-bases19.json). Written here, NOT sent: the lead reviews, then sends.
//   node tools/bases19/deck.mjs
import path from 'node:path';
import { ROOT, write } from './lib.mjs';
import { SETS } from './sets.mjs';
import { folkKey } from '../../js/folk.js';
const P = '../../../docs/clips/bases19/';
const item = (set, it, text) => ({ id: it.id, label: it.name, image: `${P}boards/${set}-${it.id}.png`, thumb: `${P}boards/thumbs/${set}-${it.id}.png`, ...(text ? { text } : {}) });
const NOTE = {
  body: { average: 'The base build: every hero stands on these shoulders.', skinny: 'Thin sloping shoulders, a narrower jaw, small fists.', fat: 'A round body past the head all the way round, a rope belt over the belly, full cheeks.',
    brute: 'Shoulders nearly twice as wide, a square jaw, big fists held low.', feminine: 'Narrow sloped shoulders, a slimmer jaw, the chest curving forward beside it, small fists held out.',
    old: 'Stooped: the shoulders sit back behind the head and the fists come together in front.', young: 'Smaller all over, narrow shoulders, small fists.' },
  hair: { bald: 'Bare, with a shine.', shaved: 'Cut to the scalp: the colour shows through the skin.', crop: 'The tufty crop of approved base 3.', bowl: 'The bowl cut of approved base 1 (the base wears it).', swept: 'The side-swept fringe of approved base 2.',
    slick: 'Combed back, the hairline dipping to a small peak.', messy: 'Shaggy spikes and a jagged fringe.', curly: 'A cap of soft curls.', afro: 'Big and round, well past the head.', bun: 'Combed back into a bun behind the head.',
    topknot: 'Cut to the scalp but for a small knot on top.', ponytail: 'Combed back; the tail hangs behind and sways when they turn.', long: 'Parted in the middle, a lock down each side onto the shoulders.', bob: 'Chin length, a straight fringe.',
    braids: 'Parted, two braids out from under the hair over the shoulders.', backbraid: 'One thick braid down the back; it sways when they turn.', pigtails: 'Parted, a bunch at each side.', locs: 'Thick strands: a fringe of them, more hanging at the sides.',
    mohawk: 'A crest from the brow to past the back of the head, the sides cut short.', balding: 'Bare on top, soft tufts left over the ears.' },
  beard: { none: 'Clean.', stubble: 'A soft shadow of the hair colour on the jaw (as on approved base 3).', moustache: 'Two soft halves; it covers the small curve on the face.', vandyke: 'A smaller moustache over a chin beard.', goatee: 'A chin beard, the tip past the chin.',
    chops: 'Sideburns down the cheeks to the jaw, the chin bare.', scruff: 'Sideburns and beard as one shape round the jaw, the curve above it.', full: 'The same, thicker, with a lobed lower edge past the chin.', long: 'Down to the chest, a moustache on top of it.',
    braided: 'A full beard with one braid from the chin, held by a metal clasp.', forked: 'A full beard ending in two points.' },
  jewel: { earrings: 'A hoop in each ear.', studs: 'A small stud in each ear.', nosering: 'A small ring under the curve.', necklace: 'A cord with a teal stone that hangs out from under the chin.', beads: 'Wooden beads, a big red one in front.', torc: 'A thick open ring, its two knobs meeting in front.',
    armbands: 'A band round each upper arm (shown on bare arms: over a sleeve they read as stripes).', bangles: 'A band at each wrist.', rings: 'A ring on each fist. Tiny at game size.', headband: 'A strip of cloth tied round the brow, the knot at the side.', circlet: 'A thin metal band with a red stone.' },
  tunic: { sack: 'The base tunic: undyed sackcloth with a rough weave.', patched: 'A square patch stitched on each shoulder.', roped: 'A rope tied over one shoulder.', sleeveless: 'Bare arms: the shoulders are skin, the tunic a narrower piece.', torn: 'The sleeves torn off, ragged ends.', yoke: 'A second cloth round the neck, in another colour.' },
};
const cards = [];
cards.push({ id: 'base', kind: 'design', rarity: 'rare', title: 'The plain base person',
  text: 'One plain villager in a sack tunic, built on your approved base body. Everything after this sits on it.',
  why: 'You asked for normal looking bases, no armour or equipment, a basic sack tunic. Judge this one first: every hair, skin, beard and build in the next cards is built on it. Same head, shoulders and fists as the heroes. The film is eight of this one person walking and punching. Pin what looks wrong.',
  pick: 'Keep it as the base: the approved head and fists, the bowl cut of approved base 1, undyed sackcloth shoulders with a rough weave.',
  images: [`${P}boards/base.png`], videos: [`${P}base.mp4`] });
cards.push({ id: 'bodies', kind: 'board', rarity: 'uncommon', title: 'Body types',
  text: 'Seven builds on the same base, so only the build changes. Tick the ones that read right to you.',
  why: 'You asked for fat, brutish, skinny, feminine. From above a build is shoulder width, belly, fist size, jaw and how they stand, so each has its own outline rather than the base made bigger or smaller. Each picture is one build, large, then at game size in four facings.',
  pick: ['fat', 'brute', 'skinny', 'old'], items: SETS.body.map((it) => item('body', it, NOTE.body[it.id])) });
cards.push({ id: 'skin', kind: 'board', rarity: 'uncommon', title: 'Skin colours',
  text: 'Seven skin colours from pale to deep, and four fantasy ones kept apart. Tick the ones to keep.',
  why: 'Each is one colour; the shading of the face, ears and fists is worked out from it the same way the heroes are shaded. The four fantasy ones (moss, slate, ash, ember) are never given to anyone unless switched on.',
  pick: ['pale', 'fair', 'olive', 'tan', 'brown', 'dark', 'deep'], items: SETS.skin.map((it) => item('skin', it)) });
cards.push({ id: 'hair', kind: 'board', rarity: 'uncommon', title: 'Hair styles',
  text: 'Twenty hair styles drawn to read from above, all in brown on the base. Tick the ones you like.',
  why: 'Three are the hair of your three approved bases; the rest are new. No shine patches and no lines on any of them, tails and braids come out from under the hair, and the tail and the long braid sway when they turn. Pin any that reads as a hat or a hood.',
  pick: ['bowl', 'swept', 'crop', 'afro', 'bun', 'long', 'braids', 'mohawk', 'messy', 'pigtails'], items: SETS.hair.map((it) => item('hair', it, NOTE.hair[it.id])) });
cards.push({ id: 'haircol', kind: 'board', rarity: 'common', title: 'Hair colours',
  text: 'Nine hair colours, each shown on the same side-swept hair with a short beard.',
  why: 'A beard always takes the hair colour. Old folk mostly get grey or white. Black is a touch lighter than the outline so the hair still shows inside it.',
  pick: ['black', 'umber', 'brown', 'chestnut', 'ginger', 'sandy', 'blonde', 'grey', 'white'], items: SETS.haircol.map((it) => item('haircol', it)) });
cards.push({ id: 'beards', kind: 'board', rarity: 'uncommon', title: 'Facial hair',
  text: 'Ten kinds of facial hair, and clean. Tick the ones you like.',
  why: 'Built to your earlier notes: a beard and its sideburns are one shape, a beard sits on the face with the small curve above it, and a moustache covers the curve rather than sitting over it. Pin any that reads as a grin, a strap or a mask.',
  pick: ['stubble', 'moustache', 'vandyke', 'scruff', 'full', 'long'], items: SETS.beard.map((it) => item('beard', it, NOTE.beard[it.id])) });
cards.push({ id: 'jewels', kind: 'board', rarity: 'uncommon', title: 'Jewellery',
  text: 'Eleven pieces, each alone on the base. Any of them can be worn together. Tick the ones to keep.',
  why: 'Gold here; the same pieces also come in silver and copper. At game size most are a small glint, so the bigger ones (torc, beads, headband, hoops) do the most. Rings are close to invisible in a fight.',
  pick: ['earrings', 'beads', 'torc', 'headband', 'circlet', 'bangles'], items: SETS.jewel.map((it) => item('jewel', it, NOTE.jewel[it.id])) });
cards.push({ id: 'tunics', kind: 'board', rarity: 'uncommon', title: 'Tunics and cloth',
  text: 'Six tunics, then nine cloth colours. From above a tunic is mostly two shoulders, so these are small.',
  why: 'The heroes show no arms and no chest, only shoulders, so a tunic can only change the shoulders: a patch, a rope, bare arms, a collar. A rope belt shows only on the fat build, where the belly is in view. The colours are dull dyes, kept plain on purpose.',
  pick: ['sack', 'patched', 'sleeveless', 'oat', 'brown', 'moss', 'rust', 'woad'], items: [...SETS.tunic.map((it) => item('tunic', it, NOTE.tunic[it.id])), ...SETS.cloth.map((it) => item('cloth', it))] });
cards.push({ id: 'mixes', kind: 'board', rarity: 'uncommon', title: 'Twenty random people',
  text: 'Twenty people rolled from the layers, as the game rolls them. Tick the ones that look right.',
  why: 'Nothing here was picked by hand: this is what a crowd gets. The roll leans a little: feminine and young builds get no beard, old ones go grey and bald, armbands only go on bare arms. Pin any mix that looks wrong and I can rule it out.',
  pick: ['01', '03', '07', '11', '15', '18'], items: SETS.mixes.map((it) => ({ ...item('mixes', it), text: folkKey(it.spec).replace(/\.+$/, '').split('.').filter((x) => x && x !== 'none' && x !== 'gold').join(', ').replace(/\+/g, ', ') })) });
cards.push({ id: 'crowd', kind: 'report', rarity: 'common', title: 'A crowd of them in game',
  text: 'A test unit, the Villager, wears the layers: every one is a different person, and they walk and brawl.',
  why: 'They are split into parts like the heroes, so the game swings their fists, sways tails and braids, and draws its own outline round them. Pin any frame that looks wrong.',
  videos: [`${P}crowd.mp4`],
  parts: [
    { id: 'crowd', title: 'Twenty-four at game size', text: 'Two lines of twelve walk in (first 3 seconds), then fight with their fists, a fist at a time.', videos: [`${P}crowd.mp4`] },
    { id: 'close', title: 'Fourteen, closer', text: 'The same closer in: hair, beards, jewellery and builds as they turn, walk (first 3 seconds) and punch.', videos: [`${P}close.mp4`] },
    { id: 'try', title: 'Trying it yourself', text: 'Battle mode, the "No dungeon yet" tab: Villager. Plain and weak, no ability. Every one you field is rolled afresh.' },
    { id: 'marks', title: 'The punch mark', text: 'A punch draws the game\'s own white poke mark, the same one a jab or a dagger gets. It can read as a blade; a fist mark of its own would be a small job.' },
  ] });
cards.push({ id: 'next', kind: 'options', rarity: 'uncommon', title: 'Where do these go next?',
  text: 'The bases are only in the test Villager for now. Where should they be used first?',
  why: 'The layers can dress anyone: a crowd in the camp, human enemies, or the bodies under new heroes. Each is a different next job, so it helps to know which you had in mind.',
  options: [{ id: 'foes', label: 'Human enemies (bandits, cultists) built on them' }, { id: 'camp', label: 'Townsfolk standing about in the camp' }, { id: 'heroes', label: 'The bodies new heroes are dressed on' }, { id: 'wait', label: 'Nothing yet: just the bases' }],
  pick: 'foes' });
const deck = { title: 'Normal people: the bases', topic: 'art', stack: 'r19b', order: 4, cards };
write(path.join(ROOT, 'tools/riffle/decks/r19-bases19.json'), JSON.stringify(deck, null, 1) + '\n');
for (const c of cards) { const over = [['title', 26], ['text', 110], ['why', 300]].filter(([k, n]) => (c[k] || '').length > n).map(([k, n]) => `${k} ${c[k].length}/${n}`); if (typeof c.pick === 'string' && c.pick.length > 150) over.push('pick ' + c.pick.length); if (over.length) console.log('TOO LONG', c.id, over.join(', ')); }
console.log(cards.length, 'cards');
