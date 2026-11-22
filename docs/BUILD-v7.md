# Build v7: round 14 (2026-11-22)

One source, the designer's own words: the Riffle answers in `docs/riffle-log/2026-11-22-round14.txt` (art round 10 and
its second pass, 0.14.1's battle page, 0.15.0's Book and wagon, 0.16.0's statuses, the wither card). **Read your lane's
lines of that file in full**; this file only sorts them and records the lead's readings. Earlier contracts
(BUILD-v1..v6, DECISIONS) hold unless changed here. Lanes work in their own worktree and branch under ~/Dev/delve-wt/,
commit, never push, never use the browser pane, and merge main before finishing.

## The standing rule: no send-backs
The designer: "Make sure the agents are capable so I don't have to send them back." Every lane therefore
- starts from the exact version the designer saw and changes **only** what each note asks ("U changed more than what I
  asked" is a past rejection);
- hands back a checklist: each of the designer's lines for the lane, quoted, with what was done and the evidence (a
  picture, a clip, a number). A line not done is said so, with why;
- looks at its own output (zoomed, in the game, at phone size) before saying it is done;
- where a note is open ("try again", "meh", "don't like the look"), gives a small graded set to pick from instead of
  one guess, and keeps the game on its current art or behaviour until the pick.
Past rejections to learn from: art "bad quality", "losing the style" (the approved heroes are the standard:
design/class-round5..10, the art notes in docs/ART-STYLE.md if present); abilities "samey"; bosses "poor"; a forest of
"broccoli"; text pop-ups in the Book in place of a visible effect.

## Rulings and readings (the lead)
- **XP** (done on main by the lead): each level asks 10% more than the last; a kill's XP follows the same curve by the
  place's level; everyone in the party gets the same XP, the downed too. No bonus for the killing blow (it would level
  damage dealers ahead of the tanks and healers that keep them alive).
- **Wither**: "I said no. I said to fix the source not the symptom." No rule that ends a long room, neither withering
  nor a hunt timer. Lane L finds why rooms drag and fixes each cause.
- **Charm**: bosses are immune. A floor's last enemy, charmed all the way, counts as beaten and follows the party into
  the next room on their side (so "the last unit on a side is stunned instead" is withdrawn for enemies).
- **Poison** drops to 20% (not to nothing) when the sickness ends.
- **The Book and the hero page become one unit page** (lane U), per the designer's layout.
- **Icons**: a handful first, in more than one style, for a pick, before the full set (lane I).
- **The wagon**: the designer's quadrant idea is taken as written (each hero keeps to its own side of the wagon).

## Lanes
| lane | branch | model | what |
|---|---|---|---|
| A | art11 | the strongest, high | art round 10's picks wired into the game, every art note, the new variant sets, the Enchantress and the Succubus drawn |
| I | icons | the strongest, high | a sample of ability, trinket and stat icons in three styles, for a pick |
| W | wagon3 | the strongest, high | the wagon's third round: slower, continual spawns from all sides, heroes guarding sides, the wagon solid, a new forest edge and ground |
| S | status2 | Opus, xhigh | the status notes: charm, confused, sleepy, bleeding's look (a set to pick from), fear, the ghost, the bite, the Succubus, the hunters, poison |
| U | unitpage | Opus, xhigh | one unit page for heroes and monsters (the Book and the camp open the same page), grids, stat icons, the preview notes |
| L | longrooms | Opus, xhigh | why rooms drag on: measured, each cause fixed at its source |

### Lane A, art (art-round10 and art-round10b in the log)
Picks to wire in: ghost A tail 1, ghost B tail 1; the Alpha's claw marks; the Elder Ent's face B; the frost spirit's
tail (the game draws it: lane E's `drawSpiritTail`); the biblical angel (the boss lane uses it).
Picks with a change: the troll's head B ("Sharper jaw. Slightly longer head. No mouth. Long nose."), with arms (the
no-arms version is rejected); the ent's face B without the mouth and without the leaf on the nose; the boar's ridge,
also shown "without the mane"; the wolves without paws ("Bring their heads forwards a bit. Shorten body a bit... Also
show me with the paws rendering under the body").
New sets asked for: four more golem bodies (keep the three); the gilded golem without "the gold mask look"; the
sproutling ("try the original design just better. No arms. Less busy leaves"; the three are saved, the bud is the
weakest); the automaton's visor (3) and its key (3); the repair drone's front (3; "Eye?"); the dart trap's eye
(variants); the Pit Lord's face (variants) and a tail; the mummy as the one before, without the button, shown without
the collar too; a hive sprite; the bee from the wasp's base.
Every other item note in the two decks is a fix to the version shown: do each, change nothing else.
From v141-battle: "Note the gaper in this pic has big outlines" (its outline is drawn thicker on screen than the
other undead's, being an early drawing scaled up: bring its line to theirs, change nothing else).
Also owed from earlier rounds: the Enchantress (a recoloured Witch today) and the Succubus (a recoloured Devil) need
their own art, to the approved heroes' and enemies' standard; put both on a board.

### Lane I, icons (v15-book-wagon, part layout)
"Also get an agent to make better icons for every ability and trinkets. Start with a handful so I can choose if I like
the style before you go all out." and "I want every stat to have a readable icon so u can see sword + a number for
damage for example."

### Lane W, the wagon (v15-book-wagon, card wagon2)
Parts size, edge and downed in the log, in full. In short: the ground 15% less wide; everyone about 50% slower; enemies
trickle in continually from all sides with bursts now and then; heroes pulled hard to the wagon, each guarding its own
side (the overlapping quadrants the designer describes), a shorter view for party members if needed; the wagon solid
all round; the forest edge redone as larger, simpler trees whose canopy hides the ground, on a faster parallax; no dark
green tufts in the grass; no puddles.

### Lane S, statuses (v16-statuses)
Every part note in the log. Bleeding's look is "Don't like visual at all": three looks to pick from, as clips.

### Lane U, the unit page (v15-book-wagon, card book; v141-battle, part dev)
The designer's layout, in full in the log under "part monsters". The preview notes: a locked ability still previews; no
text pop-ups, the effect itself must be visible; a trait's scene shows only what it needs (targets given bows, swords,
spears or hammers instead of an Archer standing by); no trinkets on elites or majors; the status build-up "freaks out
when full"; Frozen shows the shatter as well as being left alone. "Put all dev controls in 1 place."

### Lane L, long rooms (v12-report, card wither)
"I said no. I said to fix the source not the symptom."
