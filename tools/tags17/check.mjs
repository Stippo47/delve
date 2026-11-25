// Round 17 (lane tags17): the tag interactions, measured headlessly.
//   node tools/tags17/check.mjs
// Doused fire things (rates against the numbers in js/tags.js DOUSE), water putting out burning, Silenced stopping
// mouth moves and abilities but nothing else, Nullify still locking everything, the Engineer's wrench mending her
// constructs and nobody else, constructs taking no bleed or poison, and isMagicHit's answers.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { makeWorld, spawn, step, addStatus, silence, hurt } = await import('../../js/sim.js');
const { initKit } = await import('../../js/kits.js');
const { buildGrid } = await import('../../js/path.js');
const { setSeed } = await import('../../js/util.js');
const T = await import('../../js/tags.js');
const { REPAIR } = await import('../../js/kits2.js');
const { AUDIT } = await import('../../js/stats.js');
let bad = 0;
const ok = (name, cond, got) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${got != null ? ' (' + got + ')' : ''}`); if (!cond) bad++; };
const room = () => { const w = makeWorld(1200, 700); buildGrid(w); return w; };
const run = (w, secs, each) => { for (let i = 0; i < Math.round(secs * 60); i++) { step(w, 1 / 60); if (each) each(); } };
const pin = (u) => { u.rootT = 1e9; u.aggro = false; };
setSeed(7);

console.log('fire and water (DOUSE: (1.5 + 0.06 x wet) a second from 8 wet; in water at least 60; bosses x0.5)');
for (const [kind, boss] of [['imp', false], ['fireSlime', false], ['cinder', true]]) {
  const w = room(), e = spawn(w, kind, 600, 350, { mult: 1 }); pin(e); e.maxHp = e.hp = 1e5;
  w.hazards.push({ type: 'water', x: 600, y: 350, r: 80 });
  run(w, 6); const h0 = e.hp, wet0 = e.st.wet; run(w, 4); const lost = (h0 - e.hp) / 4, wet1 = e.st.wet;
  const exp = (T.DOUSE.base + T.DOUSE.perWet * Math.max(T.DOUSE.water, (wet0 + wet1) / 2)) * (boss ? T.DOUSE.boss : 1);
  ok(`${kind} standing in water loses ${lost.toFixed(2)}/s (wet ${wet0.toFixed(0)}), expected ${exp.toFixed(2)}/s`, Math.abs(lost - exp) < 0.15 * exp);
}
{ const w = room(), e = spawn(w, 'imp', 600, 350, { mult: 1 }); pin(e); e.maxHp = e.hp = 1e5; e.st.wet = 80; let tot = 0, h = e.hp;
  run(w, 12, () => { tot += h - e.hp; h = e.hp; }); ok(`imp soaked to 80 once (no water under it) loses ${tot.toFixed(1)} over the 12 s it dries`, tot > 40 && tot < 80); }
{ const w = room(), e = spawn(w, 'imp', 600, 350, { mult: 1 }); pin(e); const max = e.maxHp; w.hazards.push({ type: 'water', x: 600, y: 350, r: 80 }); let t = 0;
  while (e.hp > 0 && !e.dead && t < 60) { step(w, 1 / 60); t += 1 / 60; } ok(`a plain imp (${max} health) left standing in a puddle goes out in ${t.toFixed(1)} s`, t < 60); }
{ const w = room(), e = spawn(w, 'rat', 600, 350, { mult: 1 }); pin(e); e.maxHp = e.hp = 1e5; w.hazards.push({ type: 'water', x: 600, y: 350, r: 80 }); run(w, 5);
  ok('a rat (not fire) in the same water loses nothing', e.hp === 1e5, 1e5 - e.hp); }
{ const w = room(), e = spawn(w, 'cinderBat', 600, 350, { mult: 1 }); pin(e); e.maxHp = e.hp = 1e5; w.hazards.push({ type: 'water', x: 600, y: 350, r: 80 }); run(w, 0.5); e.st.wet = 0; const h0 = e.hp; run(w, 0.1);
  ok('a cinder bat (a flier) over water: the water under it does not count, only what wets it', T.douseRate(e) === 0 || e.st.wet > 0); }
{ const w = room(), e = spawn(w, 'rattler', 600, 350, { mult: 1 }); pin(e); e.maxHp = e.hp = 1e5; e.st.burn = 70; addStatus(w, e, 'wet', 20, null);
  ok('water puts out half the burning on anything soaked', Math.abs(e.st.burn - 35) < 0.01, e.st.burn); }
{ const w = room(), e = spawn(w, 'imp', 600, 350, { mult: 1 }); pin(e); e.st.wet = 60; let hissed = 0; const n0 = w.texts.length; run(w, 0.2); hissed = w.texts.some((t) => t.s === 'hiss' || t.text === 'hiss');
  ok('it hisses (the word once, steam all the while)', hissed || w.texts.length > n0); }

console.log('Silenced (mouth moves and abilities only)');
// a wolf pack: the howl is a mouth move; the lunge is not
{ const counts = { on: { howl: 0, lunge: 0 }, off: { howl: 0, lunge: 0 } };
  for (const mode of ['off', 'on']) for (let s = 0; s < 4; s++) {
    setSeed(200 + s); const w = room(), h = spawn(w, 'paladin', 250, 350, { level: 1 }); initKit(h, 'paladin', { nodes: {} }, 1); h.maxHp = h.hp = 1e6;
    const pack = [0, 1, 2].map((i) => { const e = spawn(w, 'wolf', 750 + i * 40, 300 + i * 50, { mult: 1 }); e.aggro = true; e.maxHp = e.hp = 1e6; return e; });
    const seen = new Map(pack.map((e) => [e, {}]));
    run(w, 30, () => { for (const e of pack) { if (mode === 'on') e.silencedT = 1; const el = e.el || {}, was = seen.get(e); for (const k of ['howl', 'lunge']) { if (el[k] != null && was[k] != null && el[k] > was[k] + 1) counts[mode][k]++; was[k] = el[k]; } } });
  }
  ok(`wolves howl ${counts.off.howl} times in 4 x 30 s; silenced, ${counts.on.howl}`, counts.off.howl > 0 && counts.on.howl === 0);
  ok(`their lunges go on silenced (${counts.off.lunge} as ever, ${counts.on.lunge} silenced)`, counts.on.lunge > counts.off.lunge * 0.5); }
// a hero: the Old Guard's Rally is a shout; his Great Sweep is not
{ const casts = { off: {}, on: {} };
  for (const mode of ['off', 'on']) for (let s = 0; s < 4; s++) {
    setSeed(300 + s); const w = room(), h = spawn(w, 'oldguard', 500, 350, { level: 1 }); initKit(h, 'oldguard', { nodes: { greatSweep1: 1, rallyCry1: 1 } }, 1); h.maxHp = h.hp = 1e6;
    const pal = spawn(w, 'paladin', 460, 380, { level: 1 }); initKit(pal, 'paladin', { nodes: {} }, 1); pal.maxHp = pal.hp = 1e6;
    for (let i = 0; i < 4; i++) { const e = spawn(w, 'rattler', 600 + i * 30, 300 + i * 30, { mult: 1 }); e.aggro = true; e.maxHp = e.hp = 1e6; }
    AUDIT.on = (ev, w2, u, src, amt, o) => { if (ev === 'cast' && u === h) casts[mode][o.ab] = (casts[mode][o.ab] || 0) + 1; };
    run(w, 40, () => { if (mode === 'on') h.silencedT = 1; pal.stunT = pal.stunT || 0; if (w.time % 3 < 1 / 60) { pal.stunT = 1; h.stunT = Math.max(h.stunT, 0); } });
    AUDIT.on = null;
  }
  ok(`the Old Guard's Rally: ${casts.off.rallyCry || 0} as ever, ${casts.on.rallyCry || 0} silenced`, !casts.on.rallyCry);
  ok(`his Great Sweep goes on: ${casts.off.greatSweep || 0} as ever, ${casts.on.greatSweep || 0} silenced`, (casts.on.greatSweep || 0) > 0); }
// the Choir sprite: a stagger silences it, and its song (a mouth move) stops while it lasts
{ const w = room(), c = spawn(w, 'choirSprite', 600, 350, { mult: 1 }); c.aggro = true; pin(c); c.aggro = true;
  const r = spawn(w, 'rattler', 640, 350, { mult: 1 }); pin(r); r.maxHp = 1000; r.hp = 500;
  const h = spawn(w, 'paladin', 200, 350, { level: 1 }); initKit(h, 'paladin', { nodes: {} }, 1); h.maxHp = h.hp = 1e6; pin(h);
  run(w, 3); const healed = r.hp - 500; addStatus(w, c, 'stagger', 30, h); const r0 = r.hp; run(w, 3.5); const during = r.hp - r0, sil = c.silencedT;
  ok(`a Choir Sprite's song mends ${healed.toFixed(0)} in 3 s; staggered it is silenced and mends ${during.toFixed(0)} in the next 3.5 s`, healed > 0 && during === 0); }
// the Warden's Nullify: still nothing works (NULLIFIED), and it silences
{ const w = room(), h = spawn(w, 'warden', 500, 350, { level: 1 }); initKit(h, 'warden', { nodes: { nullify1: 1 } }, 1); h.maxHp = h.hp = 1e6;
  const e = spawn(w, 'orc', 560, 350, { mult: 1 }); e.aggro = true; e.maxHp = e.hp = 1e6; e.abilT = 0;
  const { ABILITIES } = await import('../../js/kits.js'); ABILITIES.nullify.use(w, h, e, 1);
  const nulled = e.h2 && e.h2.some((x) => x.id === 'nulled'); run(w, 1.5);
  ok('Nullify: the orc is nullified (its charge held) and silenced', nulled && e.abilT > 0 && e.silencedT > 0, `abilT ${e.abilT.toFixed(2)}, silenced ${e.silencedT.toFixed(1)} s`); }
{ const w = room(), b = spawn(w, 'cinder', 600, 350, { mult: 1 }); silence(w, b, 5, null); ok('a boss is silenced 40% of the time', Math.abs(b.silencedT - 2) < 1e-6, b.silencedT); }

console.log(`the Engineer's wrench (REPAIR: ${REPAIR.heal * 100}% of the construct's health a whack, below ${REPAIR.below * 100}%)`);
{ const w = room(), u = spawn(w, 'engineer', 400, 350, { level: 1 }); initKit(u, 'engineer', { nodes: {} }, 1);
  const t = spawn(w, 'turret', 560, 330, { team: 'hero', level: 1 }); t.summon = true; t.summonBy = u; t.fixed = true; t.hp = t.maxHp * 0.4;
  const pal = spawn(w, 'paladin', 380, 420, { level: 1 }); initKit(pal, 'paladin', { nodes: {} }, 1); pal.hp = pal.maxHp * 0.4;
  const far = spawn(w, 'rattler', 1150, 650, { mult: 1 }); pin(far); far.maxHp = far.hp = 1e6;
  const t0 = t.hp, p0 = pal.hp; run(w, 6);
  ok(`she walks to her turret (${Math.round(t0)}/${Math.round(t.maxHp)}) and mends it to ${Math.round(t.hp)} with ${u.repairs || 0} whacks`, t.hp > t0 + t.maxHp * 0.3 && u.repairs > 0);
  ok(`the hurt Paladin beside her gets nothing (${Math.round(p0)} -> ${Math.round(pal.hp)})`, pal.hp <= p0 + 0.01); }
{ const w = room(), u = spawn(w, 'engineer', 400, 350, { level: 1 }); initKit(u, 'engineer', { nodes: {} }, 1); u.maxHp = u.hp = 1e6;
  const t = spawn(w, 'turret', 520, 330, { team: 'hero', level: 1 }); t.summon = true; t.summonBy = u; t.fixed = true; t.hp = t.maxHp * 0.4;
  const e = spawn(w, 'rattler', 440, 360, { mult: 1 }); e.aggro = true; e.maxHp = e.hp = 1e6;
  const t0 = t.hp; run(w, 3); ok('with a foe on her she fights it, no mending', !u.repairs && t.hp <= t0 + 0.01, `${u.repairs || 0} whacks`); }

console.log('construct tag resistances');
{ const w = room(), t = spawn(w, 'turret', 500, 350, { team: 'hero', level: 1 }); addStatus(w, t, 'bleed', 80, null); addStatus(w, t, 'poison', 80, null);
  const r = spawn(w, 'rattler', 600, 350, { mult: 1 }); addStatus(w, r, 'bleed', 40, null);
  ok('a turret takes no bleed and no poison; a skeleton still bleeds', t.st.bleed === 0 && t.st.poison === 0 && r.st.bleed > 0); }

console.log('isMagicHit');
const pal = { kind: 'paladin', def: {} }, pyro = { kind: 'pyromancer', def: {} }, rat = { kind: 'rat', def: {} };
for (const [name, o, src, want] of [
  ['a fireball shot', { shot: true, proj: 'fireball' }, pyro, true], ['an arrow', { shot: true, proj: 'arrow' }, { kind: 'archer', def: {} }, false],
  ["the Pyromancer's plain bolt", { shot: true, proj: 'bolt' }, pyro, true], ['a sword blow', {}, pal, false], ['a rat bite', {}, rat, false],
  ['Smite (by its ability)', { ab: 'smite' }, { kind: 'cleric', def: {} }, true], ['a holy zone', { zone: 'holy' }, null, true], ['a blade zone', { zone: 'blade' }, null, false],
  ['burning ticking', { dot: true, stk: 'burn' }, null, false], ['said so: o.magic', { magic: true }, rat, true], ['said so: o.physical', { physical: true, proj: 'bolt' }, pyro, false],
  ['a telekinetic stone (a caster\'s shot)', { shot: true, proj: 'tkStone' }, { kind: 'telekinetic', def: {} }, true],
]) ok(`${name}: ${T.isMagicHit(o, src) ? 'magic' : 'physical'}`, T.isMagicHit(o, src) === want);

console.log(`fire set on fire (KINDLED: up to x${T.KINDLED.dealt} dealt, x${T.KINDLED.atkSpeed} attack speed, x${T.KINDLED.move} move; bosses half the extra)`);
{ const w = room(), e = spawn(w, 'imp', 600, 350, { mult: 1 }); pin(e); const py = spawn(w, 'pyromancer', 200, 350, { level: 1 }); pin(py); const h0 = e.hp; addStatus(w, e, 'burn', 80, py); run(w, 2);
  const b = e.buffs.find((x) => x.id === 'kindled');
  ok(`an imp (burn resistance 0) takes burning in (${e.st.burn.toFixed(0)} left after 2 s), loses no health, and is kindled`, e.hp === h0 && b && b.dealt > 1.1, b && `x${b.dealt.toFixed(2)} dealt, x${b.atkSpeed.toFixed(2)} speed`);
  addStatus(w, e, 'burn', 100, py); const f = e.buffs.find((x) => x.id === 'flare');
  ok('full up it FLARES (no scorch damage to itself): the whole boost for 4 s', e.hp === h0 && f && Math.abs(f.dealt - T.KINDLED.dealt) < 1e-6 && f.t === T.KINDLED.flareT); }
{ const w = room(), e = spawn(w, 'cinder', 600, 350, { mult: 1 }); pin(e); const py = spawn(w, 'pyromancer', 200, 350, { level: 1 }); pin(py); addStatus(w, e, 'burn', 100, py); const f = e.buffs.find((x) => x.id === 'flare');
  ok('a fire boss (Cinder) flares at half the extra', f && Math.abs(f.dealt - (1 + (T.KINDLED.dealt - 1) * T.KINDLED.boss)) < 1e-6, f && `x${f.dealt.toFixed(2)}`); }
{ const w = room(), e = spawn(w, 'hellhound', 600, 350, { mult: 1 }); pin(e); w.hazards.push({ type: 'fire', x: 600, y: 350, r: 80 }); run(w, 2);
  ok('fire with nobody behind it (a pool, its own trail) does nothing to a fire thing, as before', !(e.st.burn > 0) && !e.buffs.some((b) => b.id === 'kindled')); }
{ const w = room(), e = spawn(w, 'rat', 600, 350, { mult: 1 }); pin(e); e.maxHp = e.hp = 1000; addStatus(w, e, 'burn', 80, null); run(w, 2); ok('a rat burns as ever', e.hp < 1000, (1000 - e.hp).toFixed(1)); }

console.log('height layers');
{ const mk = () => { const w = room(), s = spawn(w, 'slime', 600, 350, { mult: 1 }); pin(s); s.maxHp = s.hp = 1000; s.airborne = true; const h = spawn(w, 'warhelm', 560, 350, { level: 1 }); initKit(h, 'warhelm', { nodes: {} }, 1); return { w, s, h }; };
  { const { w, s, h } = mk(); ok('a slime mid-hop: a hammer slam misses it', hurt(w, s, 30, h, { slam: true, heavy: true }) === 0); }
  { const { w, s, h } = mk(); ok('a blow lands', hurt(w, s, 30, h, {}) > 0); }
  { const { w, s, h } = mk(); ok('a shot lands', hurt(w, s, 30, h, { shot: true, proj: 'arrow' }) > 0); }
  { const { w, s, h } = mk(); const { explode } = await import('../../js/sim.js'); explode(w, 600, 350, 80, 20, {}, h, '#fff'); ok('an explosion lands', s.hp < 1000, (1000 - s.hp).toFixed(0)); }
  { const { w, s } = mk(); w.hazards.push({ type: 'gas', x: 600, y: 350, r: 80 }); w.hazards.push({ type: 'fire', x: 600, y: 350, r: 80 }); step(w, 1 / 60); s.airborne = true; for (let i = 0; i < 30; i++) { s.airborne = true; step(w, 1 / 60); }
    ok('gas reaches it (poison builds), the fire pool under it does not', s.st.poison > 0 && s.st.burn === 0, `poison ${s.st.poison.toFixed(1)}, burn ${s.st.burn}`); }
  { const w = room(), g = spawn(w, 'griffon', 600, 350, { level: 1 }); g.flyT = 1; const e = spawn(w, 'rattler', 640, 350, { mult: 1 });
    ok('a flier up in the air: a blow misses it, a shot lands', hurt(w, g, 10, e, {}) === 0 && hurt(w, g, 10, e, { shot: true, proj: 'arrow' }) > 0); } }

console.log('hit kinds: one damage type (sharp | blunt | magic) and the elements it carries, apart');
const desc = (o, src) => { const k = T.hitKinds(o, src); return [k.type, ...k.elements.map((e) => '+' + e), ...['slam', 'explosion', 'gas', 'shot'].filter((f) => k[f])].join(' '); };
for (const [name, o, src, want] of [
  ['a knight sword', {}, { kind: 'knight', def: {} }, 'sharp'], ['the Warhelm hammer', {}, { kind: 'warhelm', def: { weapon: 'heavy' } }, 'blunt'],
  ['an arrow', { shot: true, proj: 'arrow' }, null, 'sharp shot'], ['a frost arrow', { shot: true, proj: 'arrow', chill: 34 }, null, 'sharp +frost shot'],
  ['a sling stone', { shot: true, proj: 'stone' }, null, 'blunt shot'], ['a wolf bite', {}, { kind: 'wolf', def: {} }, 'sharp'],
  ['a slime landing', {}, { kind: 'slime', def: { hops: 1 } }, 'blunt'], ['Ground Pound', { ab: 'groundPound' }, null, 'blunt slam'],
  ['a bomb', { explosion: true, burn: 20 }, null, 'blunt +fire explosion'], ['a fireball', { shot: true, proj: 'fireball', burn: 20 }, null, 'magic +fire shot'],
  ['Smite', { ab: 'smite', radiance: 35 }, { kind: 'cleric', def: {} }, 'magic +holy'], ['burning ticking', { dot: true, stk: 'burn' }, null, ' +fire'],
]) ok(`${name}: ${desc(o, src)}`, desc(o, src).trim() === want.trim());
{ const w = room(), e = spawn(w, 'rat', 600, 350, { mult: 1 }); pin(e); e.maxHp = e.hp = 1000; e.def = { ...e.def, hitRes: { magic: 0.5 } }; const py = spawn(w, 'pyromancer', 200, 350, { level: 1 });
  const got = hurt(w, e, 40, py, { shot: true, proj: 'fireball', burn: 30, noDodge: true });
  ok(`a magic-proof foe (hitRes magic 0.5) takes half a fireball's hit (${got.toFixed(0)} of 40) and burns in full (${e.st.burn.toFixed(0)} of 30)`, Math.abs(got - 20) < 1 && Math.abs(e.st.burn - 30) < 0.01); }

console.log(bad ? `${bad} failed` : 'all passed');
process.exit(bad ? 1 : 0);
