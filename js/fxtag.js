// Marks everything an ability makes with the ability's id (round 8, lane V), so the renderer can draw each ability in
// its own look (docs/FX-STYLE.md) without the kits knowing anything about drawing. Pure: no drawing, no DOM (the sim
// also runs in node for balance batches).
//
// tagAbility(w, u, id, tier, use): runs use(); every fx, projectile and telegraph it pushes gets { ab: id, tier },
// and so does anything they push later (a projectile's landing, a zone's ticks, the unit's queued follow-ups, a leap's
// landing). Then a 'sig' fx is pushed: the ability's own signature, drawn by fxkit.js from where the caster stands.
export function tagAbility(w, u, id, tier, use) {
  const mark = (o) => { if (o.ab) return; o.ab = id; o.tier = tier; wrap(o, 'land'); wrap(o, 'tick'); wrap(o, 'onHit'); };
  const wrap = (o, k) => {
    const g = o && o[k];
    if (typeof g !== 'function' || g._tagged) return;
    const f = function (...a) { return run(() => g.apply(this, a)); };
    f._tagged = true; o[k] = f;
  };
  const run = (fn) => {
    const nf = w.fx.length, np = w.projectiles.length, nt = w.telegraphs.length;
    const r = fn();
    for (let i = nf; i < w.fx.length; i++) mark(w.fx[i]);
    for (let i = np; i < w.projectiles.length; i++) mark(w.projectiles[i]);
    for (let i = nt; i < w.telegraphs.length; i++) mark(w.telegraphs[i]);
    if (u.later) for (const l of u.later) wrap(l, 'f');
    if (u.act) { wrap(u.act, 'land'); wrap(u.act, 'tick'); }
    return r;
  };
  const t = u.target;
  const r = run(use);
  w.fx.push({ type: 'sig', ab: id, tier, t: 0, max: 1.4, x: u.x, y: u.y, a: u.facing, u, tgt: t || null, tx: t ? t.x : u.x, ty: t ? t.y : u.y });
  return r;
}
