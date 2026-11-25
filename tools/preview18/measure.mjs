// Round 18 (lane preview18): measures every hero ability preview at tiers I-III the same way for the old stage and the
// new one, so the before / after counts in docs/preview18.md come from one ruler.
//   node tools/preview18/measure.mjs [--id paladin] [--ab guard] [--json tools/preview18/before.json] [--v]
// Per ability per tier (two loops, the same dice for every tier):
//   cast      when it first went off in the loop (an 'abRun' of the ability, or its hook acting), and how many times
//   right     the game's own scorer agreed the scene called for it at that moment (score / reflex >= 0.3), or, for an
//             ability that only works through a hook, the hook acted on a blow that was seen coming
//   shown     what it did reached someone: a foe hurt, held or marked, a friend healed or shielded, a summon...
//   sig       what it made, for the tier comparison: foes it reached, statuses, buffs, heals, summons, areas
//   unseen    blows on the hero or its friends with nothing to see behind them (a target with no weapon, a blow from
//             nowhere, health simply set lower)
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const { measureAbility: measure } = await import('../preview-measure.mjs');
const { HEROES } = await import('../../js/heroes.js');

if (import.meta.url === 'file://' + process.argv[1].replace(/\\/g, '/') || process.argv[1].endsWith('measure.mjs')) {
  const out = {}; const t0 = Date.now();
  for (const id of Object.keys(HEROES)) { if (opt('id') && id !== opt('id')) continue;
    for (const a of HEROES[id].abilities) { if (opt('ab') && a.id !== opt('ab')) continue;
      out[id + ':' + a.id] = [1, 2, 3].map((tier) => { try { return measure(id, a.id, tier); } catch (e) { return { err: String(e && e.stack || e).split('\n').slice(0, 3).join(' | ') }; } });
      if (args.includes('--v')) console.log(id + ':' + a.id, JSON.stringify(out[id + ':' + a.id]));
    } }
  const keys = Object.keys(out); let notShown = 0, wrong = 0, same = 0, unseen = 0, unseenEvents = 0, threw = 0, never = 0;
  const lists = { notShown: [], noOne: [], wrong: [], same: [], sameSig: [], unseen: [], never: [] }; let noOne = 0, sameSig = 0;
  for (const k of keys) {
    const T = out[k]; if (T.some((x) => x.err)) { threw++; continue; }
    const loops = T.flat();
    if (loops.some((l) => l.cast == null)) { never++; lists.never.push(k); }
    if (loops.some((l) => !l.shown)) { notShown++; lists.notShown.push(k); }
    else if (loops.some((l) => !l.reached)) { noOne++; lists.noOne.push(k); }
    if (loops.some((l) => !l.right)) { wrong++; lists.wrong.push(k + ' (score ' + (loops.find((l) => !l.right).score ?? '-') + ')'); }
    const u = loops.reduce((a, l) => a + l.unseen, 0); if (u) { unseen++; unseenEvents += u; lists.unseen.push(k + ' ' + u + ' ' + loops.flatMap((l) => l.unseenWhy).slice(0, 2).join(' ')); }
    const sig = T.map((L) => JSON.stringify(L[0].sig)), tr = T.map((L) => L[0].trace);
    const pairs = [tr[0] === tr[1] ? 'I=II' : '', tr[1] === tr[2] ? 'II=III' : ''].filter(Boolean);
    if (pairs.length) { same++; lists.same.push(k + ' ' + pairs.join(' ')); }
    const spairs = [sig[0] === sig[1] && tr[0] !== tr[1] ? 'I~II' : '', sig[1] === sig[2] && tr[1] !== tr[2] ? 'II~III' : ''].filter(Boolean);
    if (spairs.length) { sameSig++; lists.sameSig.push(k + ' ' + spairs.join(' ')); }
  }
  console.log(`${keys.length} abilities x 3 tiers, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`threw: ${threw}`);
  console.log(`never went off in a loop: ${never}`); if (args.includes('--list')) for (const x of lists.never) console.log('  ' + x);
  console.log(`not shown (a loop where it drew nothing of its own and touched no one): ${notShown}`); if (args.includes('--list')) for (const x of lists.notShown) console.log('  ' + x);
  console.log(`drawn but reached no one (a loop where nothing it made touched a foe or a friend): ${noOne}`); if (args.includes('--list')) for (const x of lists.noOne) console.log('  ' + x);
  console.log(`wrong scenario (the game's own scorer would not have used it there): ${wrong}`); if (args.includes('--list')) for (const x of lists.wrong) console.log('  ' + x);
  console.log(`tiers identical (two tiers played the very same loop: nothing on the stage changed): ${same}`); if (args.includes('--list')) for (const x of lists.same) console.log('  ' + x);
  console.log(`tiers that differ only in where things went (the same foes reached, statuses, buffs, heals, summons, sizes): ${sameSig}`); if (args.includes('--list')) for (const x of lists.sameSig) console.log('  ' + x);
  console.log(`abilities whose hero or friend took blows from nothing seen: ${unseen} (${unseenEvents} blows)`); if (args.includes('--list')) for (const x of lists.unseen) console.log('  ' + x);
  if (opt('json')) (await import('node:fs')).writeFileSync(opt('json'), JSON.stringify({ out, lists }, null, 1));
}
