// The build-up statuses (designer, round 8: "a value from 0 to x; when the value reaches x a burst effect is applied
// and the status effect is removed or lowered"). One table shared by the sim (thresholds, what's left after a burst),
// the HUD rings and the inspect panel (how full a status is: value / threshold, so a ring fills as it builds and the
// burst happens when it's full). The rules in words, with every number: docs/STATUSES.md.
//   need: the threshold (a function of the unit for chill, which needs more after each freeze)
//   after: the value it drops to when it bursts; decay: points lost per second; col: its colour
export const STATUS = {
  burn: { need: 100, after: 20, decay: 7, col: '#FF7A2F' },
  chill: { need: (u) => 100 + (u.freezeImmune || 0), after: 0, decay: 6, col: '#7FD6F5' },
  poison: { need: 100, after: 30, decay: 4, col: '#9BCB3C' },
  wet: { need: 100, after: 60, decay: 6, col: '#6FB7E8' },
  shock: { need: 100, after: 0, decay: 14, col: '#FFF27A' },
  stagger: { need: 100, after: 0, decay: 12, col: '#E8E2D0' },
  radiance: { need: 100, after: 0, decay: 6, col: '#FFE48A' },
  curse: { need: 100, after: 0, decay: 5, col: '#9A5CC8' },
  entangle: { need: 100, after: 0, decay: 6, col: '#7FA04A' },
  // round 13 (lane S): the designer's new five (docs/STATUSES.md has the rules in words)
  charm: { need: 100, after: 0, decay: 8, col: '#FF8AC8' },
  confuse: { need: 100, after: 0, decay: 7, col: '#C9A8F0' },
  sleepy: { need: 100, after: 0, decay: 5, col: '#A99CD8' },
  bleed: { need: 100, after: 0, decay: 6, col: '#C8453D' },
  fear: { need: 100, after: 0, decay: 8, col: '#DCE4D0' },
  // round 15 (lane N): Shackled, the Warden's (the designer: "Shackled status effect, target can't do basic attacks,
  // ability cooldowns are set back 50%")
  shackle: { need: 100, after: 0, decay: 6, col: '#A9B4C6' },
};
// Poison's burst (round 11; it used to take 15% of max health at once): SICKENED for sickT seconds. The unit loses
// `drain` of its max health over that time (not at once: it can be healed through), deals `weaken` less damage and
// moves and attacks `slow` slower. Anything that cleans statuses off ends it.
// Round 14 (the designer: "Poison drops to 20%"): when the sickness ends the build-up drops to `ends` (of 100), not to
// nothing (it never rises to it: a build-up already lower stays where it is).
export const POISON = { sickT: 6, drain: 0.1, weaken: 0.3, slow: 0.2, ends: 20 };
export const BUILD_IDS = Object.keys(STATUS);
export const needOf = (u, id) => { const n = STATUS[id].need; return typeof n === 'function' ? n(u) : n; };
// 0..1: how close a unit's status is to bursting.
export const fillOf = (u, id) => Math.max(0, Math.min(1, ((u.st && u.st[id]) || 0) / needOf(u, id)));
export const freshStatuses = () => Object.fromEntries(BUILD_IDS.map((k) => [k, 0]));

// Radiance (angels, cherubs, seraphs): attacks come slower and much weaker as it builds. Burst: RADIANT, a glow for
// RADIANT_T seconds that can't attack and makes everyone else near it radiant; it doesn't touch itself.
export const RADIANCE = { atkSlow: 0.35, weaken: 0.6, auraT: 3, auraR: 120, auraRate: 24, immuneT: 4 };
// Cursed (ghosts, banshees, the Bone King's last phase): heals do less and then nothing, blows land harder. Burst:
// HEXED, the next attack or ability turns on it (its damage hurts itself, a heal hurts the friend, a summon joins the
// other side). The hex waits up to armT seconds; once it fires, everything that action does in the next windowT turns.
export const CURSE = { healCut: 1.6, taken: 0.4, armT: 8, windowT: 0.6, selfMul: 0.8, selfCap: 0.3 };

// Entangle (round 9, ents and roots; the designer: "makes it so you move very slow and your attacks and movement cause
// slight damage. Burst effect makes it so you are rooted"). While it builds: up to `slow` slower, `walkDmg` damage per
// 100 units walked and `atkDmg` per attack or ability (both x fill). Burst (round 13: "Tangled and rooted are the same
// thing"): ROOTED for rootT seconds (bosses 40%), the one rooted state every root uses, and a squeeze of `squeeze`
// damage; then immuneT seconds before it can be entangled again.
export const ENTANGLE = { slow: 0.7, walkDmg: 2.2, atkDmg: 2.5, rootT: 3, squeeze: 12, immuneT: 3 };

// ---------------------------------------------------------------- round 13 (lane S): Charm, Confused, Sleepy, Bleeding, Fear
// Charm (the designer: "can't hurt who is charming them, burst effect makes them fight for you for a bit"). While it
// builds (from `guard` up: the first blows still land), its blows on whoever charmed it (u.stBy.charm) do nothing and it
// looks for someone else to fight. Burst:
// ENTHRALLED, it fights for the charmer's side for `dur` seconds (elites x0.8, majors x0.6), then comes back; a boss, or
// the last one standing on its side, is SMITTEN instead (stunned `smitT`, bosses 40%). Then immuneT before it builds again.
// Round 14 (the designer: "Bosses immune to charm. The last unit on a floor charmed will count as beating the level.
// They will follow u into the next room fully charmed."): bosses, mini-bosses and boss parts take no charm. An enemy is
// enthralled even when it is the last of its side; once no enemy in a room is left fighting the party (and no wave is to
// come), every enemy still enthralled there counts as beaten and becomes a FOLLOWER: charmed with no end, it walks
// through the door with the party and fights for them until it dies or the floor ends (dungeon.js). Only the party's
// last hero standing, and in a battle the last unit of either side, is still SMITTEN instead of turned.
export const CHARM = { dur: 5, elite: 0.8, major: 0.6, smitT: 1.5, immuneT: 6, guard: 35 };
// Confused ("bad aim, turns randomly, attacks when no target is in range. Burst effect. Attacks can hurt allies for a
// bit, uses all available abilities at once"). While it builds (x fill): every shot it makes goes up to `aim` radians
// wide, it lurches round to a random heading now and then (`turn` a second), and with an attack ready and nothing in
// reach it swings or shoots at the air (`flail` a second). Burst: ADDLED for addledT s (bosses 40%): its weapon hits
// friends as well as foes, and it uses every ability it has ready at once. Then immuneT.
// Round 14 (the designer: "Should also make them turn randomly. Instead of using all abilities at once, will have a
// chance to trigger randomly while bursted"): the lurch is a real turn now: `turn` times a second (x fill) it swings
// round to a random heading over a moment and walks off that way for lurchT seconds (it can't attack while turned
// away). Addled no longer fires everything at once: each second it has a `trigger` chance (x2 when it has several ready)
// to let off ONE ability that's ready, picked at random, at whatever it happens to face.
export const CONFUSE = { aim: 0.7, turn: 1.2, lurchT: [0.6, 1.1], lurchSpeed: 0.7, flail: 1.2, addledT: 4, immuneT: 4, trigger: 0.8 };
// Sleepy ("lower chance to use abilities, slow attack speed"): attacks up to atkSlow slower and up to abilCut of its
// chances to use an ability lost (x fill). Burst (the lead's call): ASLEEP for sleepT s (bosses 40%), the Bard's
// Lullaby's sleep, but nothing wakes it for its first deepT s (bosses 0.6); after that a blow does. Then immuneT.
// Round 14 (the designer: "Should make all wind ups like 40% longer too. Anything charged up"): every wind-up runs up to
// `windup` slower (x fill): a melee wind-up, a charge's tell, a slam, every danger zone it shows on the floor, a stand
// through a tell, a hero's charged shot and anything else it has queued (sim.js windMul).
export const SLEEPY = { atkSlow: 0.4, abilCut: 0.6, sleepT: 4, deepT: 2, immuneT: 5, windup: 0.4 };
export const windMul = (u) => (u && u.st && u.st.sleepy > 0 ? 1 + SLEEPY.windup * fillOf(u, 'sleepy') : 1);
// Bleeding ("drains hp, taking damage increases duration. Burst effect removes 33% of remaining hp. Make healing
// weaker"): loses `dot` x value health a second (armour doesn't help); every blow it takes holds the drain still for
// holdT s (it doesn't wear off while it's being hit); heals do up to healCut less (x fill). Burst: HAEMORRHAGE, it loses
// `burst` of the health it has left at once (a boss at most bossCap of its max health); drops to 0, then immuneT.
export const BLEED = { dot: 0.05, holdT: 1.5, healCut: 0.5, burst: 0.33, bossCap: 0.06, immuneT: 3 };
// Fear (round 9's proposal: "run away; burst = terror, an ability wasted/misfired"): while it builds it backs away from
// whoever frightened it (u.stBy.fear) when that one is within `reach`, more as it builds (x fill). Burst: TERRIFIED for
// terrT s (bosses: a cower, stunned bossT): it runs from the frightener and can't attack or use an ability, and every
// ability it had ready is wasted (its cooldown starts again, at least `waste` s). Then immuneT.
// Round 14 (the designer: "Doesn't seem to back away. Burst will make them turn away and run. Will have a radius of fear
// around them giving other entities fear."): from the first point of fear it backs away, facing what frightened it
// (a backpedal: its walk turned away by at least `back`, which is all the way when it was coming straight on), keeping
// off to 40% of `reach` at the first point and all of it when full.
// Terrified, it turns its back and runs (from where the fright came if the frightener is gone). While it runs, everyone
// of its own side within spreadR gains `spread` fear a second from it, halved for every hand it has passed through
// (u.fearGen: the banshee's own victims spread at full strength, theirs at half, theirs at a quarter: below the 8 a
// second fear drains, so a panic dies out after two links).
export const FEAR = { reach: 320, back: 0.6, pull: 1.0, terrT: 3, bossT: 0.6, run: 1.2, waste: 5, immuneT: 5, spreadR: 120, spread: 34, spreadGen: 0.5 };

// ---------------------------------------------------------------- round 15 (lane N): Shackled
// The designer (the Old Guard's Pommel Strike note, given to the Warden): "Shackled status effect, target can't do basic
// attacks, ability cooldowns are set back 50%". Built as a build-up like the rest. While it builds, irons closing on its
// wrists: every ability cooldown it has runs up to `cdSlow` slower (x fill). Burst: SHACKLED for `dur` seconds (elites
// x0.8, majors and mini-bosses x0.6, bosses x0.4): it can't make a basic attack, and at the moment the irons lock every
// ability cooldown it has is set back by `setback` of that ability's full length (a ready one has half its cooldown to
// wait again; never past one full cooldown). Then it can't be shackled again for immuneT.
// The limit on bosses: 40% of the time, a quarter of a cooldown instead of half, and 12 s before the next.
// What a "cooldown" is: a hero's abilities (kits.js), a plain enemy's one ability (def.abilCd), its dash, and every move
// an enemy's own brain times with elites.js due() / again() (elites, majors, the families, the bosses' timed moves).
export const SHACKLE = { cdSlow: 0.5, dur: 4, elite: 0.8, major: 0.6, boss: 0.4, setback: 0.5, bossSetback: 0.25, immuneT: 6, bossImmuneT: 12, hold: 0.25 };
// how fast a unit's ability cooldowns run right now (1 = as ever): slower while Shackled builds
export const cdRate = (u) => (u && u.st && u.st.shackle > 0 ? 1 - SHACKLE.cdSlow * fillOf(u, 'shackle') : 1);
// every move an enemy's brain times with elites.js due() / again() (u.el, its lengths in u.el.dueLen), set back by a
// share of its own length
export function setBackDue(u, frac) { const e = u.el; if (!e || !e.dueLen) return; for (const k in e.dueLen) if (typeof e[k] === 'number') e[k] = Math.min(Math.max(e.dueLen[k], e[k]), Math.max(0, e[k]) + frac * e.dueLen[k]); }

