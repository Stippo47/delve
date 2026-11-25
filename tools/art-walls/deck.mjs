// Round 19 art lane (walls): writes the Riffle board deck tools/riffle/decks/r19-art-walls.json from the options.
//   node tools/art-walls/deck.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'design', 'r19-art', 'walls', 'index.json'), 'utf8'));
const DUNGEONS = [
  ['wildwood', 'Wildwood walls', 'wildwood-b'], ['warren', 'Warren walls', 'warren-b'], ['sewers', 'Sewers walls', 'sewers-a'],
  ['crypt', 'Crypt walls', 'crypt-b'], ['frost', 'Frost Hollow walls', 'frost-b'], ['ember', 'Ember Deep walls', 'ember-b'],
  ['spire', 'Gilded Spire walls', 'spire-b'], ['dunes', 'Sunken Dunes walls', 'dunes-a'], ['foundry', 'Foundry walls', 'foundry-a'],
];
const cards = DUNGEONS.map(([theme, title, fav]) => {
  const opts = index.filter((o) => o.theme === theme);
  return {
    id: theme, kind: 'board', rarity: 'uncommon', title,
    text: `${opts.length} wall looks, each with two doors set in it, a corner and a hero for size. Tick the one you want.`,
    why: 'The walls are now taller than the doors: each door sits in its own frame in the wall, and the wall rises above it. Every picture is the game\'s real floor and doors at game scale.',
    pick: [fav],
    items: opts.map((o) => ({ id: o.id, label: o.name, image: `../../../design/r19-art/walls/${o.id}/${o.id}.png`, text: o.blurb })),
  };
});
const deck = { title: 'Art: dungeon walls', topic: 'art', stack: 'r19art', order: 1, cards };
fs.writeFileSync(path.join(ROOT, 'tools', 'riffle', 'decks', 'r19-art-walls.json'), JSON.stringify(deck, null, 1) + '\n');
console.log('wrote', cards.length, 'cards,', cards.reduce((a, c) => a + c.items.length, 0), 'items');
for (const c of cards) { if (c.title.length > 26) console.log('long title', c.title); if (c.text.length > 110) console.log('long text', c.id, c.text.length); }
