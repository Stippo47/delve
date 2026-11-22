// Look variants the designer asked to compare (round 10, lane V3): "try 2 more variants", "show me 3 variations".
// Each ability with variants reads its own choice: ?v_<key>=N in the address (the showcase records them side by side:
// tools/showcase.mjs --q v_shockwave=2), else 1, the look they saw last. Once one is picked, make it the default here.
//   shockwave  (round 13: Ridge, Slabs and Rolling, earth out of the floor, all came back: these are waves that travel)
//              1 Arcs (a pale crescent of force running out over the floor), 2 Ripples (the same front as a soft dust
//              ripple under the units), 3 Stomps (the floor pounded where the front passes, three blows marching out)
//   wolfBite   (round 13: Jaws, Chomp, Rake and Snap, four small tooth glyphs laid over the wolf's head, all came back)
//              drawn on the one bitten, as big as it is: 1 Fangs (two jaws with gums and long canines open wide and
//              snap shut on it), 2 Crunch (no teeth: the foe is pinched and two rows of tooth holes are left), 3 Clamp
//              (two great curved fangs swing shut on it like pincers)
//   boneSpear  (round 13, "Still not it. Make 3 variations.") 1 Spear (a bone shaft with a broad leaf head lashed on),
//              2 Femur (one big thigh bone broken to a point), 3 Fang (a great curved fang flying point first)
//   oldBones   (round 13: bones, a skull, then her soul: three things floating over her, three noes) she wears a
//              bone-white protection border while it holds, and the moment is 1 Stand (a flash, dust stamped out, chips
//              thrown off), 2 Creak (comic crack marks snap out round her), 3 Glance (the blow clangs off the side it
//              came from)
//   bleed      (round 14, the designer of round 13's red cuts, drops and wash: "Don't like visual at all") three looks
//              that differ in kind, drawn by fx-status.js: 1 Spurts (blood squirts from a wound in time with a heartbeat
//              that quickens as it builds, and splashes on the floor), 2 Trail (nothing on the body: a pool grows
//              under it and it leaves a trail of blood where it goes), 3 Drop (a blood drop over its head fills up
//              like a gauge and throbs); each its own burst
//   shackle    (round 15, lane N: Shackled's look on a unit is new, so three takes that differ in kind, fx3.js drawMarks3)
//              1 Irons (a cuff at each wrist, open while it builds and shut when it bursts, the chain across its front,
//              a lock on it), 2 Wound (a chain wound round the body link by link as it builds, locked at the burst),
//              3 Staked (the cuffs, and a chain down to a ring bolted to the floor behind it)
//   timeBubble (round 15, lane N: the Clockmaker's Slow Time) 1 Dial (a great clock face on the floor whose hands barely
//              move, cold thick air, slow motes), 2 Glass (a dome of pale glass with a bright rim and a slow shine)
export const VARIANTS = {
  shackle: ['Irons', 'Wound', 'Staked'],
  timeBubble: ['Dial', 'Glass'],
  bleed: ['Spurts', 'Trail', 'Drop'],
  shockwave: ['Arcs', 'Ripples', 'Stomps'],
  oldBones: ['Stand', 'Creak', 'Glance'],
  boneSpear: ['Spear', 'Femur', 'Fang'],
  wolfBite: ['Fangs', 'Crunch', 'Clamp'],
};
const cache = {};
export function variant(key) {
  if (cache[key]) return cache[key];
  let n = 1;
  try { n = +new URLSearchParams(location.search).get('v_' + key) || 1; } catch {}
  const max = (VARIANTS[key] || []).length || 1;
  return (cache[key] = Math.min(max, Math.max(1, Math.round(n))));
}
