// one-off: restage clips.mjs entries after the round 19 clip check
const fs = require('fs'); const f = 'tools/rogue19/clips.mjs'; let s = fs.readFileSync(f, 'utf8');
const BT = '`';
function set(name, def) {
  const a = s.indexOf("  '" + name + "': {"); if (a < 0) throw new Error('no ' + name);
  const b = s.indexOf(BT + ' },\n', a); if (b < 0) throw new Error('no end ' + name);
  s = s.slice(0, a) + "  '" + name + "': " + def + ',\n' + s.slice(b + 4);
}
const st = (body) => BT + '\n    ' + body + BT;
set('bandit-bolas', "{ hero: 'rogueBandit', battle: 'rattlerBow*1,rattler*1|rogueBandit', t: '300', secs: 6, stage: " + st(`clear(); put(me, CX - 70, CY, 0); const F = foes(); tough(F, 4, 0.2); put(F[0], CX + 75, CY - 25, Math.PI); put(F[1], CX + 90, CY + 70, Math.PI);
    each = (T) => { me.kit.lightW = w; me.kit.lightT = 99; at(T, 0.8, 'a', () => use('smokeBomb', 3, F[0])); };`) + ' }');
set('bandit-dirtyTrick', "{ hero: 'rogueBandit', battle: 'orc*1,goblin*2|rogueBandit', t: '030', secs: 5, stage: " + st(`clear(); put(me, CX - 50, CY, 0); const F = foes(); tough(F, 4, 0.2); put(F[0], CX + 10, CY, Math.PI); put(F[1], CX + 110, CY - 25, Math.PI); put(F[2], CX + 120, CY + 35, Math.PI);
    each = (T) => { me.kit.lightW = w; me.kit.lightT = 99; at(T, 0.6, 'a', () => use('pickpocket', 3, F[0])); };`) + ' }');
set('bandit-hostage', "{ hero: 'rogueBandit', battle: 'goblin*1,rattlerBow*2|rogueBandit', t: '003', secs: 6, stage: " + st(`clear(); put(me, CX - 80, CY, 0); const F = foes(); tough(F, 4, 0.3); put(F[0], CX - 30, CY, Math.PI); put(F[1], CX + 110, CY - 25, Math.PI); put(F[2], CX + 115, CY + 25, Math.PI);
    each = (T) => { me.kit.lightW = w; me.kit.lightT = 99; for (const e of F.slice(1)) { e.target = me; e.x = e.home.x; e.y = e.home.y; } if (T > 0.7) { me.facing = 0; me.target = F[1]; me.vx = me.vy = 0; me.x = CX - 80; me.y = CY; } at(T, 0.7, 'a', () => use('lowBlow', 3, F[0])); };`) + ' }');
set('ghost-incorporeal', "{ hero: 'paladin', battle: 'ghost*1|paladin', t: '000', secs: 6, stage: " + st(`clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 6, 0.3); put(F[0], CX + 20, CY, Math.PI); F[0].incorpCd = 99;
    each = (T) => { F[0].incorpCd = 99; at(T, 1.2, 'a', () => SIM.incorporeal(w, F[0], 3.2, 'mist')); };`) + ' }');
set('monk-attack', "{ hero: 'monk', battle: 'goblin*1|monk', t: '000', secs: 5, stage: " + st(`clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 8, 0.2); put(F[0], CX + 20, CY, Math.PI);`) + ' }');
set('monk-flurry', "{ hero: 'monk', battle: 'goblin*1|monk', t: '200', secs: 4, stage: " + st(`clear(); put(me, CX - 80, CY, 0); const F = foes(); tough(F, 8, 0.2); put(F[0], CX - 30, CY, Math.PI); SIM.stun(w, F[0], 0.7);
    each = (T) => { at(T, 0.7, 'a', () => use('flurry', 2, F[0])); };`) + ' }');
set('monk-innerPeace', "{ hero: 'monk', battle: 'orc*2,rattlerBow*2|monk', t: '002', secs: 5, stage: " + st(`clear(); put(me, CX - 40, CY, 0); const F = foes(); tough(F, 4, 1); put(F[0], CX + 15, CY - 25, Math.PI); put(F[1], CX + 15, CY + 30, Math.PI); put(F[2], CX + 140, CY - 50, Math.PI); put(F[3], CX + 145, CY + 50, Math.PI);
    each = (T) => { for (const e of F) e.target = me; at(T, 0.6, 'a', () => use('innerPeace', 2, F[0])); };`) + ' }');
set('cultist-sacrifice', "{ hero: 'cultist', battle: 'goblin*2,orc*1|cultist', t: '003', secs: 5, stage: " + st(`clear(); put(me, CX - 120, CY, 0); const F = foes(); tough(F, 1, 0.2); put(F[0], CX - 20, CY - 60, Math.PI); put(F[1], CX + 50, CY + 40, Math.PI); put(F[2], CX + 110, CY - 20, Math.PI);
    for (const e of F) { e.hp = e.maxHp * 0.3; K.addStatus(w, e, 'bleed', 60, me); }
    each = (T) => { at(T, 0.6, 'a', () => use('soulCandle', 3, F[0])); };`) + ' }');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing ' + a); s = s.replace(a, b); };
rep("'cultist-bloodRite': { hero: 'cultist', battle: 'orc*2|cultist,paladin', t: '111', secs: 6, stage:", "'cultist-bloodRite': { hero: 'cultist', battle: 'orc*2|cultist,paladin', t: '111', secs: 5, follow: 'paladin', zoom: 1.7, stage:");
rep("'monk-palmStrike': { hero: 'monk', battle: 'goblin*3|monk', t: '030', secs: 7, stage:", "'monk-palmStrike': { hero: 'monk', battle: 'goblin*3|monk', t: '030', secs: 5, stage:");
rep('String(c.zoom || 2.1)', 'String(c.zoom || 1.8)');
fs.writeFileSync(f, s);
