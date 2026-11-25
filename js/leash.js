// Keeping a unit on a stage without pinning it (round 19, lane sys19). The designer: "Can you make it so the bench stops
// pinning people, it messes up a lot of replays as movement is the whole part of many abilities."
// The Book's previews (preview-sim.js) and the bench (lab.js m=show) used to put units back on their spot every frame,
// which undid every shove, knock back, leap, pull, toss and dash the moment it happened. Now nobody is put anywhere: a
// unit the stage wants to keep is held only by soft means. Its own walking is stopped (its moveMul, as the stages
// already did), the yard has walls, and this leash walks it back towards its spot only once it is far off and nothing is
// moving it (no act, no knock, not in the air, not stunned, rooted, asleep or frozen): what an ability does to it plays
// out in full first.
export function leash(u, home, dt, far = 60, speed = 140) {
  if (!u || !home || u.dead || u.downed || u.act || u.forcedGoal) return;
  if (Math.hypot(u.kx || 0, u.ky || 0) > 20 || (u.hop || 0) > 1 || u.stunT > 0 || u.rootT > 0 || u.koT > 0 || u.sleepT > 0 || u.frozenT > 0) return;
  const dx = home.x - u.x, dy = home.y - u.y, d = Math.hypot(dx, dy);
  if (d <= far) { if (u._leashed) { u._leashed = false; u.spd = 0; } return; }
  const s = Math.min(d - far * 0.5, speed * dt);
  u.x += dx / d * s; u.y += dy / d * s; u.mvA = Math.atan2(dy, dx); u.facing = u.mvA; u.spd = speed; u._leashed = true; // (walking back: the legs and arms move)
}
// stop a unit's own walking (the stage's hold), or give it back
export const holdWalk = (u) => { if (u && u._walk0 == null) { u._walk0 = u.moveMul; u.moveMul = 1e-4; } }; // (sim.js reads a moveMul of 0 as 1)
export const freeWalk = (u) => { if (u && u._walk0 != null) { u.moveMul = u._walk0; u._walk0 = null; } };
