// Look variants the designer asked to compare (round 10, lane V3): "try 2 more variants", "show me 3 variations".
// Each ability with variants reads its own choice: ?v_<key>=N in the address (the showcase records them side by side:
// tools/showcase.mjs --q v_shockwave=2), else 1, the look they saw last. Once one is picked, make it the default here.
//   shockwave  (round 13: Ridge, Slabs and Rolling, earth out of the floor, all came back: these are waves that travel)
//              1 Arcs (a pale crescent of force running out over the floor), 2 Ripples (the same front as a soft dust
//              ripple under the units), 3 Stomps (the floor pounded where the front passes, three blows marching out)
//   wolfBite   1 Jaws (two rows of fangs snapping shut), 2 Chomp (a big wolf's muzzle outline closing, tooth marks
//              left), 3 Rake (three curved fang streaks crossing the foe), 4 Snap (a quick white crescent bite with a
//              burst of fur tufts)
export const VARIANTS = {
  shockwave: ['Arcs', 'Ripples', 'Stomps'],
  wolfBite: ['Jaws', 'Chomp', 'Rake', 'Snap'],
};
const cache = {};
export function variant(key) {
  if (cache[key]) return cache[key];
  let n = 1;
  try { n = +new URLSearchParams(location.search).get('v_' + key) || 1; } catch {}
  const max = (VARIANTS[key] || []).length || 1;
  return (cache[key] = Math.min(max, Math.max(1, Math.round(n))));
}
