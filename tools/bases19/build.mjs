// lane bases19: write the folk files the game and the design folder keep (js/folk.js makes them; never edit them by hand).
//   node tools/bases19/build.mjs
//   art/folk/villager.svg            the plain base (the Villager kind's picture in pages; in a fight each one is rolled)
//   design/bases19/base.svg, layers/<layer>-<name>.svg, mixes/mix-NN.svg
import path from 'node:path';
import { folkSvg, BASE, HAIRS, BEARDS, SKINS, BODIES, TUNICS, CLOTHS, JEWELS, HAIR_COLOURS, randomFolk, dice, folkKey } from '../../js/folk.js';
import { ROOT, write } from './lib.mjs';
import { SETS } from './sets.mjs';
write(path.join(ROOT, 'art/folk/villager.svg'), folkSvg(BASE));
write(path.join(ROOT, 'design/bases19/base.svg'), folkSvg(BASE));
let n = 2;
for (const [set, items] of Object.entries(SETS)) for (const it of items) { write(path.join(ROOT, 'design/bases19', set === 'mixes' ? 'mixes' : 'layers', `${set}-${it.id}.svg`), folkSvg(it.spec)); n++; }
console.log(n, 'files');
