// Lane B (bosses2): the designed bosses, one per dungeon, each in its own file (js/boss-<id>.js) with its design doc
// (docs/BOSS-<id>.md). A theme names its boss by id (themes.js `boss`); enemies.js merges BOSS_DEFS into the kinds and
// dungeon.js builds a boss's room from BOSS_ARENAS (keyed by the def's `arena`). ?bossroom&boss=<id> puts any of
// them in floor 3's room (testing), lab.html?m=boss&boss=<id>&phase=N is the bench.
// The Bone King (js/boss.js) and the Elder Ent (js/elderent.js) came first and stay where they are.
import { CHIEFTAIN } from './boss-chieftain.js';
import { OOZE } from './boss-ooze.js';
import { QUEEN } from './boss-queen.js';
import { CINDER } from './boss-cinder.js';
import { ANGEL } from './boss-angel.js'; // (bosses3: the Gilded Seraph remade as a biblically accurate angel; the kind's id is still gildedSeraph)
import { WURM } from './boss-wurm.js';
import { ENGINE } from './boss-engine.js';
import { SPIDER } from './boss-spider.js'; // round 19 (lane spider19): Old Longlegs, the IK spider; a test boss, in no dungeon yet

const BOSS_FILES = [CHIEFTAIN, OOZE, QUEEN, CINDER, ANGEL, WURM, ENGINE, SPIDER];

// every boss (and its parts and adds) by kind
export const BOSS_DEFS = Object.assign({}, ...BOSS_FILES.map((b) => b.defs));
// every boss room by arena name: (w) => builds it (w.throne: where the boss starts)
export const BOSS_ARENAS = Object.assign({}, ...BOSS_FILES.map((b) => b.arenas));
// dungeon -> its boss (for reference; themes.js holds the live one, and roster3's new dungeons name theirs)
export const BOSS_OF = { warren: 'chieftain', sewers: 'greatOoze', frost: 'winterQueen', ember: 'cinder', spire: 'gildedSeraph', dunes: 'sandWurm', foundry: 'greatEngine' };
// bosses that live in no dungeon yet (round 19): battle mode lists them on a tab of their own (battle.js battleRoster),
// at the strength of the dungeon their def names as `home`; ?bossroom&boss=<id> fights them in a boss room
export const LOOSE_BOSSES = ['ikSpider'];
