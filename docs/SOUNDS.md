# Delve: sound

Round 6 asked for "sound effects and ambient music". Everything is **made in the browser with WebAudio** (oscillators,
filtered noise, FM bells). There are **no sound files**: nothing was downloaded, there is no licence to track, and
the whole of the sound is the code in `js/audio.js` (about 63 KB) and `js/sfx.js` (about 6 KB). It works offline
because it is just two more scripts in `sw.js`.

## How it fits together
- `js/sfx.js`: the cue bus and the run watcher. Pure JS, safe in Node.
  - `cue(name, ...)`: a one-liner where something happens that can't be seen afterwards. There are only a few:
    `sim.js` hurt() (`hit`, with weight, crit, shot and whether a shield or block took it), `sim.js` shatter(),
    `kits.js` kitThink() (`ability`), and `camp.js` (`buy` in popGold(), `deny` in no()).
  - `watchRun(run)`: once a frame it compares the world with the last frame and cues whatever is new: projectiles
    (by kind and, for bolts, by caster), fx (zones, beams, walls, waves, pillars, rings, rifts), telegraphs
    (`blast` is an explosion, `swing` a melee swing, `ring` a slam wind-up), corpses (a death, by kind), danger zones
    (a boss tell when one appears, a strike when it goes off), statuses landing (each one going from nothing to
    something; freeze, KO, slip, rot, root, sleep), heroes going down, being revived, drinking or levelling up, coins,
    keys, gems, chests opening, pedestals, fountains, a door being chosen, waves arriving, the boss waking and each
    phase turn, and the run's phase (room clear, floor clear, won, lost, left).
- `js/audio.js`: the engine.
  - The effects are recipes, rendered once each into a buffer (24 kHz mono) on the first tap, the common ones first;
    that takes about 0.2 s on the PC and holds about 9 MB. Each is normalised to its own level.
  - Playing one is a buffer voice with ±5% pitch and ±12% volume, panned by where it is on screen and quieter off
    screen.
  - Limits: a cap per sound per second, a cap per group (hits, swings, shots, spells, statuses, deaths, booms, boss
    tells), the same sound at most twice in one frame, and 18 voices at most (the least important one is dropped).
    At 2x speed effects play at 80% volume; at 4x at 50%, and only the ones that matter (no hits, swings or coins).
    While recording a clip (`GAME.record`) effects are off.
  - The music bus dips under stingers.
  - Everything goes through a limiter.
- Unlock: the first `pointerdown`/`touchend`/`keydown` creates the AudioContext (iOS only allows it there). The
  context is suspended while the page is hidden. `navigator.audioSession.type = 'ambient'` where iOS has it: the
  phone's silent switch mutes the game, and the player's own music keeps playing.
- Settings: master, effects, music and a mute switch are in the camp's settings sheet (`soundSettingsHtml()`) and
  kept in localStorage `delve-audio` (not in the save). The defaults are 80 / 80 / 50.

## What makes each sound
| sound | made of |
|---|---|
| hits (flesh, bone, slime, ghost, armour; light and heavy) | a pitched thump plus filtered noise. Bone is a scatter of wood-block clicks, slime a resonant low-pass squelch with wobble, ghost an airy band sweep, armour an FM clank (heroes with the tank role). Heavy = a heavy weapon, a crit or 14+ damage. Smaller units sound a little higher. |
| crit | a bright "shing": high sines over a noise flick |
| block / shield | an inharmonic FM clang |
| swings, thrusts, dodges | band-pass noise sweeping up (whooshes) |
| bow | a short creak, then a plucked twang and a flick of air |
| bolts | fire: a noise "fwip" with crackle. Frost: high glassy sines. Storm: a falling zap. Cleric: a soft falling orb tone |
| thrown things | daggers, vials, bones: a quick whoosh. Vials smash (glass) where they land; water splashes |
| bard notes | a plucked note from a pentatonic scale (five variants, so a barrage plays a little tune) |
| fire, frost, storm, holy, heal, poison, drain, vines | fire: a low-pass noise swell with crackles. Frost: a sine chime cluster with hiss. Lightning: a sawtooth jumping in pitch, plus cracks. Thunder (pillars): a crack and a long brown-noise rumble. Holy: a soft A-major sine chord with air. Heal: a rising sine. Poison/gas: low hiss and bubbles. Drain: a wobbling falling tone. Vines: a creaking saw and rustles. Shockwave: a deep thump. |
| explosions | a falling sine thump and a pink-noise blast (a fire one adds crackles) |
| statuses landing | burn: an ignite whoosh. Chill: an icy hiss. Poison: bubbles. Wet: a splash. Shock: a buzz. Stagger: a bonk. Freeze: an ice crackle. KO: a bonk and a dizzy wobble. Slip: a squeak. Rot: a squelch. Root: vines. Sleep: a falling pair of tones. Thaw: steam. Shatter: a burst of glassy tinkles. |
| deaths | bone: a clatter of falling bones. Slime: a splat. Rat: a squeak. Ghost: a falling wail. Lizards: a hiss and a fall. Goblins and orcs: a short grunt and a fall. Trolls: a bigger one. Bosses: a long falling growl and rumble. |
| heroes | down: a fall and two sad notes. Revive: a rising arpeggio. Level up: a bright arpeggio with bells. Potion: three glugs and a chime. |
| loot | coin: the classic two-note ding, rising a semitone with each coin in a row. Chest: a latch, a creak, the lid, then coins. Key, gem, pedestal and fountain: bells and water. |
| the room | a door chosen: a stone grind. Leaving: a soft whoosh. A new room: a door thud. A wave coming: a rumble and cracks as the rifts open, then a low horn when they're up. |
| stingers | room clear: three plucked notes with bells. Floor clear: a short brass fanfare. Won: a longer fanfare and a chord. Lost: four falling notes over a drone. Left: two horn notes. |
| bosses | a tell rises in pitch and ends exactly on the strike (it starts later for long tells). The soul attacks get a darker, choir-like rise. Strike: a heavy thump with crunch. Waking: a low brass swell and drum. A phase turn: a growl, a drum and a cymbal swell. |
| the camp | a soft click on every button, a "ka-ching" on a purchase, a low double buzz when you can't. |

## The music (generative: never the same twice, no loops to tire of)
Each place has a calm layer and a fight layer. The fight layer fades in while any enemy is awake and fades out a few
seconds after the last one. Places cross-fade over about 2.5 s. One shared reverb.
- **Camp** (D major, 64 bpm): a warm triangle pad (I-vi-IV-V), soft lute-like plucked arpeggios, now and then a few
  breathy flute notes, and the campfire (brown-noise rumble and crackles). No fight layer.
- **The Crypt** (A minor, 56 bpm): a slow detuned "choir" pad, a low drone, distant FM bells, a drifting wind.
  Fight: a low string-like sawtooth ostinato and toms.
- **The Sewers** (E dorian, 72 bpm): a low hum, marimba-like plucks and drips through an echo, flowing water.
  Fight: a syncopated bass, shakers and a low drum.
- **The Warren** (G dorian, 90 bpm): a reedy drone on the fifth, wooden knocks, a goblin flute, a plucked bass.
  Fight: frame drums (boom-tak) and a sawtooth bass riff.
- **Boss** (the dungeon's own key, phrygian, 100 bpm): a dark choir, a driving sawtooth ostinato, taiko-like drums
  and brass stabs. The boss's phase raises it: phase 2 adds hats and a second stab, phase 3 opens the filter and
  adds a high line and a snare.
- After a run, the stinger plays over silence, then the camp's music comes back after about 3 s.

## Levels (measured)
Rendered offline with `tools/sound-render.mjs` at the default settings:
- a crypt fight with waves: about -19 LUFS, peaks about -1.3 dBFS;
- the Bone King: about -17 LUFS, peaks -1.6 dBFS;
- music alone: about -22 (camp) to -24 LUFS (dungeons).

The limiter keeps every peak under 0 dBFS. Nothing clips.

## Tools
- `node tools/sound-cues.mjs [--secs 240] [--theme all] [--boss --lvl 6] [--party ...] [--speed 4]`: headless runs in
  Node. It prints which sounds would play, how often, the busiest second and the most voices at once, and fails if any
  sound goes over its cap.
- `node tools/sound-render.mjs out.wav [--camp 10] [--secs 40] [--theme crypt] [--q 'bossroom&lvl=6'] [--music]
  [--board] [--m4a]`: renders the real engine offline in Edge to a WAV and measures it with ffmpeg. `--board` plays
  every effect in a row and lists each one's level. Needs the dev server.
- `node tools/sound-smoke.mjs [--secs 20]`: the real page in Edge. It taps to unlock, waits for the effects to be
  ready, opens the settings sheet, plays a run, and reports what played and any errors.
