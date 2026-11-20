// Which sounds a run makes and how often, headless in Node (no audio): runs the game, feeds the sound watcher once a
// frame, and passes every cue through the same per-sound caps and voice limit the game uses.
//   node tools/sound-cues.mjs [--secs 240] [--theme crypt|sewers|warren|all] [--seed 1] [--speed 1] [--boss] [--lvl N]
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const secs = +opt('secs', 240), seed = +opt('seed', 1), speed = +opt('speed', 1), lvl = +opt('lvl', 0);
globalThis.location = { search: (args.includes('--boss') ? '?bossroom' : '?x') + (lvl ? '&lvl=' + lvl : '') };
const { newRun, update } = await import('../js/dungeon.js');
const { setSeed } = await import('../js/util.js');
const { THEME_IDS } = await import('../js/themes.js');
const { listen, drain, watchRun, resetWatch } = await import('../js/sfx.js');
const { soundsFor, Gate, SOUNDS, MAX_VOICES } = await import('../js/audio.js');
const themes = opt('theme', 'all') === 'all' ? THEME_IDS : [opt('theme')];
const party = opt('party', 'paladin,archer,twinfang').split(',');
const STEP = 1 / 60, FRAME = 1 / 30;
listen(true);
let bad = 0;
for (const theme of themes) {
  setSeed(seed);
  resetWatch();
  const run = newRun({ heroes: {}, depth: 1 }, { theme, party });
  const gate = new Gate();
  const cues = {}, plays = {}, perSec = {}, unknown = new Set();
  let t = 0, game = 0, maxVoices = 0, busiest = { n: 0, at: 0 };
  const secTotals = [];
  while (t < secs && run.phase !== 'won' && run.phase !== 'lost') {
    // a frame: the game moves on by FRAME * speed, then the sound side looks
    for (let k = 0; k < Math.round(FRAME * speed / STEP) && run.phase !== 'won' && run.phase !== 'lost'; k++) { update(run, STEP); game += STEP; }
    t += FRAME;
    watchRun(run);
    const n = {};
    for (const ev of drain()) {
      cues[ev.name] = (cues[ev.name] || 0) + 1;
      for (const [name, o] of soundsFor(ev)) {
        if (!SOUNDS[name]) { unknown.add(name); continue; }
        n[name] = (n[name] || 0) + 1; if (n[name] > 2) continue;
        const at = t + ((o && o.delay) || 0);
        if (!gate.allow(name, at, speed)) continue;
        const len = SOUNDS[name][0];
        gate.voice({ prio: SOUNDS[name][2].prio || 1, start: at, end: at + len });
        plays[name] = (plays[name] || 0) + 1;
        const s = Math.floor(at); (perSec[name] || (perSec[name] = {}))[s] = (perSec[name][s] || 0) + 1;
        secTotals[s] = (secTotals[s] || 0) + 1;
      }
    }
    maxVoices = Math.max(maxVoices, gate.voices.filter((v) => v.end > t).length);
  }
  for (let s = 0; s < secTotals.length; s++) if ((secTotals[s] || 0) > busiest.n) busiest = { n: secTotals[s], at: s };
  const total = Object.values(plays).reduce((a, b) => a + b, 0);
  console.log(`\n== ${theme}: ${Math.round(t)}s real at ${speed}x (${Math.round(game)}s of game), phase ${run.phase}, floor ${run.floor}, rooms ${run.rooms}`);
  console.log(`   sounds played ${total} (${(total / t).toFixed(1)}/s), busiest second ${busiest.n} (at ${busiest.at}s), most voices at once ${maxVoices}/${MAX_VOICES}`);
  console.log('   cues:', Object.entries(cues).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
  const rows = Object.entries(plays).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
    const peak = Math.max(...Object.values(perSec[k])), cap = SOUNDS[k][2].cap || 8;
    if (peak > cap) bad++;
    return `${k} ${v} (peak ${peak}/s, cap ${cap})`;
  });
  console.log('   plays:', rows.join(', '));
  const never = Object.keys(SOUNDS).filter((k) => !plays[k]);
  console.log('   not heard:', never.join(', '));
  if (unknown.size) { bad++; console.log('   UNKNOWN sounds:', [...unknown].join(', ')); }
}
console.log(bad ? `\n${bad} problems` : '\nall within caps');
process.exit(bad ? 1 : 0);
