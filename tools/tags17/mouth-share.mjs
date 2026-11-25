// Round 17 (lane tags17): how much of what enemies do with their timed moves is a mouth move, i.e. what the Warden's
// Nullify would still stop if it were only a Silence (mouth moves) and not a full lock (every move).
//   node tools/tags17/mouth-share.mjs [--secs 30] [--seeds 2]
// Every kind of every dungeon (bosses apart), three of it against a Paladin, an Archer and a Cleric in battle mode; a
// move is counted each time its clock (elites.js due / again, or a plain enemy's def.ability) starts again.
globalThis.location = { search: '?x' };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { pathToFileURL } = await import('node:url');
const u = (p) => pathToFileURL(p).href;
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const { newBattle, updateBattle, battleRoster } = await import(u('js/battle.js'));
const { freshSave } = await import(u('js/save.js'));
const { setSeed } = await import(u('js/util.js'));
const { moveHas } = await import(u('js/tags.js'));
const secs = +opt('secs', 30), seeds = +opt('seeds', 2);
const save = freshSave(); save.cheat = true;
const R = battleRoster(save);
const out = [];
let all = 0, mouth = 0;
for (const d of R.dungeons) {
  let dAll = 0, dMouth = 0; const byKey = {};
  for (const group of [d.kinds, d.bosses]) for (const k of group) for (let s = 0; s < seeds; s++) {
    setSeed(500 + s);
    let run; try { run = newBattle(save, { arena: d.id, a: [{ k: 'paladin', n: 1, tier: 2 }, { k: 'archer', n: 1, tier: 2 }, { k: 'cleric', n: 1, tier: 2 }], b: [{ k, n: group === d.bosses ? 1 : 3 }] }); } catch (e) { continue; }
    const seen = new Map();
    for (let t = 0; t < secs && run.phase === 'fight'; t += 1 / 60) {
      updateBattle(run, 1 / 60);
      for (const e of run.world.units) {
        if (e.dead || e.team !== 'enemy') continue;
        const was = seen.get(e) || {}, now = {};
        const el = e.el || {};
        for (const key of Object.keys(el.dueLen || {})) { now[key] = el[key]; if (was[key] != null && el[key] > was[key] + 0.5) { const m = moveHas(e, key, 'mouth'); dAll++; if (m) dMouth++; const kk = (m ? '*' : '') + e.kind + ':' + key; byKey[kk] = (byKey[kk] || 0) + 1; } }
        now.abilT = e.abilT; if (e.def.ability && was.abilT != null && e.abilT > was.abilT + 0.5) { dAll++; const kk = e.kind + ':' + e.def.ability; byKey[kk] = (byKey[kk] || 0) + 1; }
        seen.set(e, now);
      }
    }
  }
  all += dAll; mouth += dMouth;
  const top = Object.entries(byKey).filter(([k]) => k.startsWith('*')).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k.slice(1)} ${n}`).join(', ');
  out.push(`${d.name.padEnd(22)} moves ${String(dAll).padStart(5)}  mouth ${String(dMouth).padStart(4)}  ${(100 * dMouth / Math.max(1, dAll)).toFixed(0).padStart(3)}%   ${top}`);
}
console.log(out.join('\n'));
console.log(`all dungeons: ${all} timed moves, ${mouth} of them mouth moves (${(100 * mouth / Math.max(1, all)).toFixed(1)}%)`);
process.exit(0);
