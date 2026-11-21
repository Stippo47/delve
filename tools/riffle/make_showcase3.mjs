// Write decks/showcase3.json: the 37 heroes added in round 10 (js/heroes2.js), one board a hero with its attack and
// three abilities on target dummies (clips/showcase3/<hero>-<ability|attack>.mp4, from tools/showcase.mjs).
//   node tools/riffle/make_showcase3.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../..');
const { HEROES2 } = await import('../../js/heroes2.js');
const ROLE = { tank: 'Tank', melee: 'Fighter', skirmish: 'Skirmisher', ranged: 'Shooter', caster: 'Caster', support: 'Support' };
const clipId = (id) => (id === 'rogueBandit' ? 'bandit' : id); // (the clips were recorded before the id changed)
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/[\s,;:.]+\S*$/, '') + '.');
const cards = [];
for (const [id, h] of Object.entries(HEROES2)) {
  const items = [];
  for (const [aid, name, what] of [['attack', `${h.attack.name} (attack)`, h.attack.desc], ...h.abilities.map((a) => [a.id, a.name, a.desc])]) {
    const file = `clips/showcase3/${clipId(id)}-${aid}.mp4`;
    if (!fs.existsSync(path.join(root, file))) continue;
    items.push({ id: `${id}-${aid}`, label: cut(name, 36), video: `../../../${file}`, text: cut(`${h.name}: ${name}. ${what}${aid === 'attack' ? '' : ' Shown at tier III.'}`, 200) });
  }
  if (!items.length) continue;
  cards.push({ id, kind: 'board', rarity: 'common', title: cut(h.name, 26),
    text: cut(`${ROLE[h.role]}. ${h.blurb}`.replace('pushed up', 'raised'), 110), // (Riffle's checker reads "pushed up" as a swipe)
    why: cut(`Trait: ${h.trait.name}. ${h.trait.desc} Tick what reads well; anything unticked or commented on gets reworked.`, 300),
    pick: items.map((x) => x.id), items });
}
const deck = { title: 'Showcase 3: the 37 new heroes', topic: 'art', order: 14, priority: 3, cards };
fs.writeFileSync(path.join(here, 'decks', 'showcase3.json'), JSON.stringify(deck, null, 2));
console.log('cards', cards.length, 'clips', cards.reduce((n, c) => n + c.items.length, 0));
