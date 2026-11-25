// Round 18 (lane preview18): the per-ability table in docs/preview18.md, from measure.mjs's before and after runs.
//   node tools/preview18/audit.mjs > tools/preview18/audit-table.md
globalThis.location = { search: '?x' }; globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const fs = await import('node:fs');
const { HEROES } = await import('../../js/heroes.js');
const { ABILITIES } = await import('../../js/kits.js');
const { sceneOf } = await import('../../js/preview-scenes.js');
const B = JSON.parse(fs.readFileSync('tools/preview18/before.json', 'utf8')).out, Af = JSON.parse(fs.readFileSync('tools/preview18/after.json', 'utf8')).out;
// the old stage's staging rules (preview-sim.js before round 18), to say what each ability was shown on
const FAR = new Set(['charge', 'leap', 'hook', 'backstab', 'dash', 'barrage', 'frostArrow', 'fireball', 'flameWall', 'iceShard', 'iceWall', 'chainLightning', 'thunderclap', 'stormCloud', 'smite', 'entangle', 'raiseDead', 'lifeDrain', 'boneSpear', 'miasma', 'mend', 'rejuvenate', 'cure', 'encore']);
const NEEDS_ALLY = new Set(['guard', 'mend', 'sanctuary', 'warSong', 'encore', 'rejuvenate', 'cure', 'consecrate']);
const SINGLE = new Set(['shieldBash', 'backstab', 'smite', 'hook', 'mend', 'encore', 'rejuvenate', 'cure', 'guard']);
const oldStage = (ab) => { const sh = (ABILITIES[ab] && ABILITIES[ab].show) || {}; const bits = [];
  bits.push((FAR.has(ab) || sh.far ? 'far' : 'near') + ' ' + (SINGLE.has(ab) || sh.single ? '3' : '6') + ' targets');
  if (NEEDS_ALLY.has(ab) || sh.ally) bits.push(sh.downed ? 'a downed friend' : sh.strikeAlly ? 'a friend struck by no one' : 'a friend at 35%, hit by no one');
  if (sh.hitme) bits.push('blows from a target with no weapon'); if (sh.shootme) bits.push(sh.shootme === 'spell' ? 'fire bolts from a target' : 'arrows from a target');
  if (ab === 'oldBones') bits.push('health set to 1, then a blow from nowhere');
  return bits.join('; ');
};
const T3 = ['I', 'II', 'III'];
const verdict = (T) => {
  if (!T || T.some((x) => x.err)) return 'threw';
  const L = T.flat(), out = [];
  if (L.some((l) => l.cast == null)) out.push('never went off');
  if (L.some((l) => !l.shown)) out.push('NOT SHOWN'); else if (L.some((l) => !l.reached)) out.push('reached no one');
  if (L.some((l) => !l.right)) out.push('WRONG SCENE (score ' + (L.find((l) => !l.right).score ?? '-') + ')');
  const tr = T.map((x) => x[0].trace), sg = T.map((x) => JSON.stringify(x[0].sig));
  const eq = [tr[0] === tr[1] ? 'I=II' : '', tr[1] === tr[2] ? 'II=III' : ''].filter(Boolean); if (eq.length) out.push('TIERS SAME ' + eq.join(' '));
  const po = [tr[0] !== tr[1] && sg[0] === sg[1] ? 'I~II' : '', tr[1] !== tr[2] && sg[1] === sg[2] ? 'II~III' : ''].filter(Boolean); if (po.length) out.push('tiers differ only in positions ' + po.join(' '));
  const u = L.reduce((a, l) => a + l.unseen, 0); if (u) out.push(u + ' BLOWS FROM NOTHING');
  return out.length ? out.join('; ') : 'ok';
};
const first = (T) => { if (!T || T.some((x) => x.err)) return '-'; return T.map((x, i) => T3[i] + ' ' + (x[0].cast == null ? '-' : x[0].cast.toFixed(1) + 's') + (x[0].brain ? '' : x[0].forced ? ' (stage)' : ' (hook)')).join(', '); };
console.log('| Hero | Ability | Before: staged on | Before | After: scene | After: first go (I, II, III) | After |');
console.log('|---|---|---|---|---|---|---|');
for (const [id, h] of Object.entries(HEROES)) for (const a of h.abilities) {
  const k = id + ':' + a.id, sc = sceneOf(a.id, ABILITIES[a.id]);
  console.log(`| ${h.name || id} | ${a.name} | ${oldStage(a.id)} | ${verdict(B[k])} | ${sc.name}${sc.wall ? ' + wall' : ''}${sc.oil ? ' + oil' : ''}${sc.corpses ? '' : ''}${sc.foeKind ? ' (' + sc.foeKind + ')' : ''} | ${first(Af[k])} | ${verdict(Af[k])} |`);
}
