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
};
export const BUILD_IDS = Object.keys(STATUS);
export const needOf = (u, id) => { const n = STATUS[id].need; return typeof n === 'function' ? n(u) : n; };
// 0..1: how close a unit's status is to bursting.
export const fillOf = (u, id) => Math.max(0, Math.min(1, ((u.st && u.st[id]) || 0) / needOf(u, id)));
export const freshStatuses = () => ({ burn: 0, chill: 0, poison: 0, wet: 0, shock: 0, stagger: 0, radiance: 0, curse: 0, entangle: 0 });

// Radiance (angels, cherubs, seraphs): attacks come slower and much weaker as it builds. Burst: RADIANT, a glow for
// RADIANT_T seconds that can't attack and makes everyone else near it radiant; it doesn't touch itself.
export const RADIANCE = { atkSlow: 0.35, weaken: 0.6, auraT: 3, auraR: 120, auraRate: 24, immuneT: 4 };
// Cursed (ghosts, banshees, the Bone King's last phase): heals do less and then nothing, blows land harder. Burst:
// HEXED, the next attack or ability turns on it (its damage hurts itself, a heal hurts the friend, a summon joins the
// other side). The hex waits up to armT seconds; once it fires, everything that action does in the next windowT turns.
export const CURSE = { healCut: 1.6, taken: 0.4, armT: 8, windowT: 0.6, selfMul: 0.8, selfCap: 0.3 };

// Entangle (round 9, ents and roots; the designer: "makes it so you move very slow and your attacks and movement cause
// slight damage. Burst effect makes it so you are rooted, no movement for a bit but can still attack slowly while
// taking a bit of damage overtime and more damage when you attack"). While it builds: up to `slow` slower, `walkDmg`
// damage per 100 units walked and `atkDmg` per attack or ability (both x fill). Burst: TANGLED for tangledT seconds:
// rooted, attacks at atkSlow of the speed, `dot` damage a second and `tangledAtk` per attack; then a short immunity.
export const ENTANGLE = { slow: 0.7, walkDmg: 2.2, atkDmg: 2.5, tangledT: 3, atkSlow: 0.5, dot: 3, tangledAtk: 5, immuneT: 3 };
