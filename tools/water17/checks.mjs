// Round 17 (lane water17): the Water Mage's kit, checked against the designer's words.
//   node tools/water17/checks.mjs
// The beam's 2 s on / 1.5 s off; it turns to a hurt friend, heals and washes without soaking; the bubble stops magic
// blows and shots and lets physical ones through untouched, and pops (Wet, a knock-back); the dome holds bodies on their
// side, deflects shots, lets the party walk out, soaks enemies and heals friends inside; the cannon hurts enemies and heals
// friends on its line; the trait throws three balls of water only when she stands in water.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { makeWorld, spawn, step, hurt } = await import('../../js/sim.js');
const { initKit, ABILITIES, TRAITS } = await import('../../js/kits.js');
const { buildGrid } = await import('../../js/path.js');
const { setSeed } = await import('../../js/util.js');
const KW = await import('../../js/kits-water.js');
let bad = 0;
const ok = (name, cond, got) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${got != null ? ' (' + got + ')' : ''}`); if (!cond) bad++; };
const room = () => { setSeed(7); const w = makeWorld(1000, 560); buildGrid(w); return w; };
const run = (w, secs, each) => { for (let i = 0; i < Math.round(secs * 60); i++) { step(w, 1 / 60); if (each) each(w.time); } };
const mage = (w, x, y, tiers = '000') => { const u = spawn(w, 'waterMage', x, y, { level: 9 }); const n = {}; ['bubbleShield', 'waterDome', 'waterCannon'].forEach((id, i) => { for (let k = 1; k <= +tiers[i]; k++) n[id + k] = 1; }); initKit(u, 'waterMage', { nodes: n }, 9); for (const k in u.kit.cd) u.kit.cd[k] = 999; u.maxHp = u.hp = 1e5; return u; };
const hero = (w, kind, x, y) => { const u = spawn(w, kind, x, y, { level: 9 }); initKit(u, kind, { nodes: {} }, 9); for (const k in u.kit.cd) u.kit.cd[k] = 999; return u; };
const foe = (w, kind, x, y) => { const e = spawn(w, kind, x, y, { mult: 1 }); e.aggro = true; e.maxHp = e.hp = 1e5; return e; };
const use = (u, id, tier, t) => { u.kit.using = id; try { ABILITIES[id].use(u.w || u._w, u, t, tier); } finally { u.kit.using = null; } };

console.log('the beam');
{ const w = room(), u = mage(w, 300, 280), e = foe(w, 'rattler', 470, 280); e.dmgMul = 0; e.def = { ...e.def, speed: 0 };
  const spans = []; let on = null;
  run(w, 12, (t) => { const b = u.kit.wb; if (b && on == null) on = t; if (!b && on != null) { spans.push([on, t]); on = null; } });
  const lens = spans.map(([a, b]) => b - a), gaps = spans.slice(1).map((s, i) => s[0] - spans[i][1]);
  ok('each beam lasts 2 s', lens.length >= 3 && lens.every((l) => Math.abs(l - 2) < 0.06), lens.map((l) => l.toFixed(2)).join(' '));
  ok('then 1.5 s off before the next', gaps.length >= 2 && gaps.every((g) => Math.abs(g - 1.5) < 0.08), gaps.map((g) => g.toFixed(2)).join(' '));
  ok('it soaks the enemy slowly (Wet on, not a slip in one beam)', e.st.wet > 10 && !(e.bursts && e.bursts.wet && e.bursts.wet < 2), e.st.wet.toFixed(0));
  ok('it hurts', e.hp < e.maxHp, Math.round(e.maxHp - e.hp)); }
{ const w = room(), u = mage(w, 300, 280), e = foe(w, 'rattler', 470, 280), f = hero(w, 'paladin', 360, 360); e.dmgMul = 0; e.def = { ...e.def, speed: 0 }; f.atkT = 1e9;
  f.hp = f.maxHp * 0.45; f.st.burn = 60; f.st.poison = 50; f.st.wet = 0; const hp0 = f.hp;
  run(w, 1.0); const b = u.kit.wb;
  ok('a friend under 60% gets the beam, not the enemy', b && b.to === f);
  run(w, 1.2);
  ok('it heals them', f.hp > hp0, Math.round(f.hp - hp0));
  ok('it puts out their burning', f.st.burn === 0, f.st.burn.toFixed(0));
  ok('it washes off poison', f.st.poison < 25, f.st.poison.toFixed(0));
  ok('it does not soak them', !(f.st.wet > 0.5), (f.st.wet || 0).toFixed(1)); }
{ const w = room(), u = mage(w, 300, 280), e = foe(w, 'rattler', 470, 280), f = hero(w, 'paladin', 360, 380); e.dmgMul = 0; e.def = { ...e.def, speed: 0 }; f.atkT = 1e9;
  run(w, 1.2); const b = u.kit.wb; ok('with the friend well, the beam is on the enemy', b && b.to === e);
  f.hp = f.maxHp * 0.3; run(w, 0.6); ok('mid-beam it swings to a friend who drops under 40%', u.kit.wb && u.kit.wb.to === f); }

console.log('Bubble Shields');
{ const w = room(), u = mage(w, 300, 280, '100'), f = hero(w, 'paladin', 420, 280), e = foe(w, 'rattler', 600, 280); f.maxHp = f.hp = 300; u.maxHp = u.hp = 300; e.dmgMul = 0; f.atkT = 1e9; u.atkT = 1e9;
  KW.ABILITIES_WATER.bubbleShield.use(w, u, e, 1); const on = (o) => o.h2 && o.h2.some((h) => h.id === 'bubble');
  const who = [u, f].filter(on); ok('one bubble at tier I', who.length === 1);
  const a = who[0]; a.hp = a.maxHp = 300; const B0 = 300;
  const got = hurt(w, a, 30, e, { knock: 0, burn: 20 }); ok('a magic blow (it carries fire) is stopped whole', got === 0 && a.hp === B0 && !(a.st.burn > 0));
  const got2 = hurt(w, a, 30, e, { knock: 0 }); ok('a physical blow goes through', got2 > 0 && a.hp < B0, Math.round(got2));
  ok('and leaves the bubble be', on(a));
  // shots: a fire bolt at it is caught before it lands; an arrow goes through
  const shot = (kind, o) => { w.projectiles.push({ kind, x: a.x, y: a.y - 150, vx: 0, vy: 420, r: 6, team: e.team, owner: e, dmg: 20, o: { knock: 0, ...o }, life: 1.2, a: Math.PI }); return w.projectiles[w.projectiles.length - 1]; };
  let hp1 = a.hp; shot('bolt', { burn: 10 }); run(w, 0.5); ok('a magic shot (a fire bolt) is caught on the bubble', a.hp === hp1 && !(a.st.burn > 0));
  hp1 = a.hp; shot('arrow', {}); run(w, 0.5); ok('an arrow goes through it', a.hp < hp1, Math.round(hp1 - a.hp));
  // spend it: it pops, soaks the one inside, knocks a near enemy back
  const near = foe(w, 'rattler', a.x + 60, a.y); near.dmgMul = 0; const x0 = near.x; a.st.wet = 0;
  hurt(w, a, 1000, e, { knock: 0, chill: 10 });
  ok('spent, it pops', !on(a));
  ok('the one inside is soaked', a.st.wet >= 35, a.st.wet.toFixed(0));
  run(w, 0.3); ok('an enemy near is knocked back', near.x - x0 > 15, Math.round(near.x - x0)); }
{ const w = room(), u = mage(w, 300, 280, '300'), f = hero(w, 'paladin', 420, 280), g = hero(w, 'archer', 380, 360), e = foe(w, 'rattler', 600, 280); e.dmgMul = 0;
  KW.ABILITIES_WATER.bubbleShield.use(w, u, e, 3); const n = [u, f, g].filter((o) => o.h2 && o.h2.some((h) => h.id === 'bubble')).length; ok('three bubbles at tier III', n === 3);
  const caster = foe(w, 'rattler', 640, 200); caster.dmgMul = 0; hurt(w, f, 9999, caster, { knock: 0, curse: 10 });
  ok('III: a popped bubble throws what it caught back at its caster', w.projectiles.some((p) => p.kind === 'water' && p.owner === u && p.home === caster)); }
{ const w = room(), u = mage(w, 300, 280, '100'), e = foe(w, 'rattler', 600, 280); hurt(w, u, 1, e, {}); u.hp = u.maxHp;
  const s0 = KW.ABILITIES_WATER.bubbleShield.score(w, u, e, 1);
  w.projectiles.push({ kind: 'bolt', x: u.x + 200, y: u.y, vx: -420, vy: 0, r: 6, team: e.team, owner: e, dmg: 20, o: { burn: 10 }, life: 1.2, a: Math.PI });
  const s1 = KW.ABILITIES_WATER.bubbleShield.score(w, u, e, 1);
  ok('it is wanted when magic is about to land, not before', s0 === 0 && s1 >= 0.8, s0.toFixed(2) + ' -> ' + s1.toFixed(2)); }

console.log('the Dome');
{ const w = room(), u = mage(w, 400, 280, '010'), f = hero(w, 'paladin', 460, 280), out = foe(w, 'rattler', 640, 280), inn = foe(w, 'rattler', 360, 330), bow = foe(w, 'rattlerBow', 800, 160);
  out.dmgMul = inn.dmgMul = 0; f.atkT = 1e9; f.hp = f.maxHp * 0.5; const hpF = f.hp;
  KW.ABILITIES_WATER.waterDome.use(w, u, out, 1); const D = w.fx.find((x) => x.draw === 'waterDome');
  // the one outside walks at the paladin; the one inside is shoved hard outward
  out.target = f; inn.kx = -900;
  let maxIn = 0, minOut = 1e9; const shotsAt = [];
  run(w, 3.5, () => { minOut = Math.min(minOut, Math.hypot(out.x - D.x, out.y - D.y)); maxIn = Math.max(maxIn, Math.hypot(inn.x - D.x, inn.y - D.y));
    if (w.projectiles.length < 3 && Math.random() < 0.15) w.projectiles.push({ kind: 'arrow', x: D.x + 260, y: D.y + 10, vx: -480, vy: 0, r: 6, team: out.team, owner: out, dmg: 5, o: { knock: 0 }, life: 1.2, a: Math.PI });
    for (const p of w.projectiles) if (p.team === out.team && !shotsAt.includes(p)) shotsAt.push(p); });
  ok('an enemy outside can\'t get in', minOut >= D.r, Math.round(minOut) + ' of r ' + D.r);
  ok('an enemy inside can\'t get out', maxIn <= D.r, Math.round(maxIn));
  ok('enemy shots glance off (turned round at the skin)', shotsAt.length > 2 && shotsAt.filter((p) => p.vx > 0).length >= 2, shotsAt.filter((p) => p.vx > 0).length + ' of ' + shotsAt.length);
  ok('the friend inside is not hit by them', f.hp >= hpF);
  ok('the friend inside heals slowly', f.hp > hpF, Math.round(f.hp - hpF));
  ok('the enemy inside is soaked', inn.st.wet > 25, inn.st.wet.toFixed(0)); }
{ const w = room(), u = mage(w, 400, 280, '010'), f = hero(w, 'paladin', 440, 280), e = foe(w, 'rattler', 700, 280); e.dmgMul = 0;
  KW.ABILITIES_WATER.waterDome.use(w, u, e, 1); const D = w.fx.find((x) => x.draw === 'waterDome');
  f.forcedGoal = null; f.kx = 1400; run(w, 0.8); ok('the party walks (or is knocked) out freely', Math.hypot(f.x - D.x, f.y - D.y) > D.r, Math.round(Math.hypot(f.x - D.x, f.y - D.y))); }
{ const w = room(), u = mage(w, 400, 280, '030'), e = foe(w, 'rattler', 700, 280); e.dmgMul = 0;
  KW.ABILITIES_WATER.waterDome.use(w, u, e, 3); run(w, 6.3); ok('III: it comes down as a flood (standing water)', w.hazards.some((h) => h.type === 'water' && h.r > 100)); }

console.log('the Water Cannon');
{ const w = room(), u = mage(w, 200, 280, '001'), f = hero(w, 'paladin', 330, 286), e1 = foe(w, 'rattler', 470, 280), e2 = foe(w, 'rattler', 540, 270);
  f.hp = f.maxHp * 0.5; f.atkT = 1e9; f.st.burn = 50; e1.dmgMul = e2.dmgMul = 0; const hpF = f.hp, x1 = e1.x;
  KW.ABILITIES_WATER.waterCannon.use(w, u, e1, 1); run(w, 1.4);
  ok('it hurts both enemies on the line', e1.hp < e1.maxHp && e2.hp < e2.maxHp, Math.round(e1.maxHp - e1.hp) + ', ' + Math.round(e2.maxHp - e2.hp));
  ok('and shoves them down it', e1.x - x1 > 20, Math.round(e1.x - x1));
  ok('and soaks them', e1.st.wet > 30, e1.st.wet.toFixed(0));
  ok('the friend it passes through is healed', f.hp > hpF, Math.round(f.hp - hpF));
  ok('and washed (burning down)', f.st.burn < 50, f.st.burn.toFixed(0));
  ok('and not hurt', !(f.hp < hpF)); }

console.log('Splashback');
{ const w = room(), u = mage(w, 400, 280), e = foe(w, 'rattler', 450, 280); e.dmgMul = 1; u.atkT = 1e9;
  const n0 = w.projectiles.length; TRAITS.splashback.struck(w, u, e, 5, {}); ok('off water: nothing', w.projectiles.length === n0);
  w.hazards.push({ type: 'water', x: 400, y: 280, r: 50 });
  TRAITS.splashback.struck(w, u, e, 5, {}); const balls = w.projectiles.filter((p) => p.kind === 'water' && p.owner === u);
  ok('in water: three balls of water at whoever hit her', balls.length === 3, balls.length);
  TRAITS.splashback.struck(w, u, e, 5, {}); ok('not again within 0.6 s', w.projectiles.filter((p) => p.kind === 'water' && p.owner === u).length === 3);
  const hp0 = e.hp; run(w, 0.8); ok('they land: hurt and soak', e.hp < hp0 && e.st.wet > 20, Math.round(hp0 - e.hp) + ' / wet ' + e.st.wet.toFixed(0)); }
{ const w = room(), u = mage(w, 400, 280), e = foe(w, 'rattler', 452, 280); u.atkT = 1e9; w.hazards.push({ type: 'water', x: 400, y: 280, r: 50 }); e.dmgMul = 1;
  run(w, 4); ok('in a real fight, a lizard-like answer to its blows', w.projectiles.some((p) => p.kind === 'water' && p.owner === u) || e.st.wet > 0); }

console.log(bad ? `${bad} FAILED` : 'all ok');
process.exitCode = bad ? 1 : 0;
