// Round 15 (lane N): six new heroes the designer asked for in the showcase 3 deck notes
// (docs/riffle-log/2026-11-22-round12.txt): the Mob, the Clockwork hero, the Air mage, the Warden, the Telekinetic and
// the Earth mage. Pure data, in heroes2.js's shape, merged into HEROES by heroes.js. The kits are in kits3.js, the looks
// in fx3.js, every decision in docs/HEROES-r15.md.
//
// Art: another lane is drawing these. Until its files land, each wears a stand-in: an existing hero's sprite recoloured
// with js/recolor.js (tools/standins.mjs writes them to art/heroes/standin/), props drawn in code (fx3.js). The final
// files will be art/heroes/<id>.svg, and the Mob's bodies art/heroes/mob-torch.svg, -pitchfork, -axe, -dagger: when
// they are in, change ART below to 'art/heroes/' and nothing else (docs/ART-NEEDED.md has what each must have).
const ART = 'art/heroes/standin/';
const art = (file) => ART + file + '.svg';

// The Mob's four (mob.js): each about 30% of a plain fighter (a fighter's blows are worth about 12.5 a second; these
// come to about 3.8 each, 15 for the four), all melee, small (r 19 against a hero's 32). The torch-bearer is the hero's
// own unit; the other three are its bodies. The fighters' share of ROLE_TUNE (x1.1 damage) is already in these numbers.
const BODY = { r: 19, vr: 14, turn: 5, accel: 300, face: 5, mass: 0.7, hp: 40, speed: 62, role: 'melee', mobBody: true };
const MOB_BODIES = {
  mobPitchfork: { ...BODY, name: 'The Mob (pitchfork)', art: art('mob-pitchfork'), range: 26, atkCd: 1.25, dmg: 5.1, knock: 120, arc: 0.9, attackAnim: 'thrust', weapon: 'fork' },
  mobAxe: { ...BODY, name: 'The Mob (axe)', art: art('mob-axe'), range: 16, atkCd: 1.5, dmg: 6.8, knock: 150, arc: 1.7, attackAnim: 'swing', weapon: 'blade', heavy: true, stagger: 8 },
  mobDagger: { ...BODY, name: 'The Mob (dagger)', art: art('mob-dagger'), range: 12, atkCd: 0.6, dmg: 2.5, knock: 20, arc: 1.2, attackAnim: 'thrust', bleed: 5 },
};

export const HEROES3 = {
  // ------------------------------------------------------------------ the Mob
  // The designer: "Make new hero. Mob. Is 4 peasants. Is the collective of all 4. Each is like 30% the strength of 1
  // normal hero. Torch, pitchfork, axe, and dagger. They are strongly attracted to each other. All melee. They share 1
  // health pool."
  mob: {
    name: 'The Mob', art: art('mob-torch'), portrait: art('mob'), role: 'melee', unlock: { gems: 3 },
    blurb: 'Four angry villagers with a torch, a pitchfork, an axe and a dagger. One hero, four pairs of boots.',
    fun: 'Came about the taxes. Stayed for the dungeon. Nobody remembers who brought the torch.',
    // (the torch-bearer's own numbers; hp is the one pool the four share: 4 x 30% of a fighter's 150)
    stats: { hp: 168, speed: 62, r: 19, vr: 14, turn: 5, accel: 300, face: 5, mass: 0.7, range: 16, atkCd: 1.1, dmg: 3.8, knock: 60, arc: 1.5, burn: 6 },
    weapon: 'blade', style: { torch: true },
    bodies: Object.keys(MOB_BODIES), summons: MOB_BODIES,
    attack: { name: 'Torch, pitchfork, axe and dagger', anim: 'swing', desc: 'Each of the four strikes with what it carries: the torch burns, the pitchfork jabs from further off and shoves, the axe is slow and heavy, the dagger is quick and makes them bleed. Each is about a third of a fighter.' },
    abilities: [
      { id: 'pileOn', name: 'Pile On', cd: 12, tags: 'sd', glyph: 'fist', desc: 'All four jump on one enemy and hold it down by the arms and legs: it can\'t move, turn, strike or use anything, and everyone hits it 25% harder while they hold it. Only the dagger keeps stabbing.',
        tiers: ['They hold it for 2.2s.', 'For 3s.', 'When they let go they throw it: it flies, and it is knocked out where it lands.'] },
      { id: 'surround', name: 'Surround', cd: 13, tags: 'ds', glyph: 'swirl', desc: 'The four run out to four sides of the enemies and close in at once, shoving everything they meet into one knot in the middle.',
        tiers: ['Herds the enemies together; each one shoved is hit.', 'The torch sets the ground alight where they meet, for 4s.', 'Those herded together are knocked off their feet for 1.2s.'] },
      { id: 'scatter', name: 'Scatter', cd: 16, tags: 'h', glyph: 'dash', desc: 'They bolt in four directions. Whoever was after them loses them, and for a few seconds each runs on its own and takes 50% less; then they find each other again.',
        tiers: ['Apart for 3s.', 'They get their breath back as they regroup: healed 14%.', 'Apart, each strikes twice as fast.'] },
    ],
    trait: { id: 'strengthInNumbers', name: 'Strength in Numbers', desc: 'Each of the four hits 9% harder for every other one of them shoulder to shoulder with it: 27% when all four stand together, nothing when they are scattered.' },
  },
  // ------------------------------------------------------------------ the Clockwork hero
  // The designer: "Clock work hero. Influence time."
  clockwork: {
    name: 'Clockmaker', art: art('clockwork'), role: 'support', unlock: { gems: 3 },
    blurb: 'A brass key on his back and a pocket watch that is never wrong. He turns clocks back, slows them, and stops them.',
    fun: 'Is always exactly on time. Finds everyone else being late or early deeply upsetting, and has started fixing it.',
    stats: { hp: 80, speed: 62, r: 30, vr: 22, turn: 4.4, accel: 230, face: 4.4, mass: 1.1, range: 220, keep: 170, atkCd: 1.25, dmg: 8.5 },
    style: { glow: '#E8C36A' },
    attack: { name: 'Clock hand', anim: 'throw', desc: 'Throws a brass clock hand. Whatever it hits loses a moment: its next blow comes a third of a second later.' },
    abilities: [
      { id: 'rewind', name: 'Rewind', cd: 14, tags: 'h', glyph: 'clock', desc: 'Turns one friend\'s clock back: they are put where they stood a few seconds ago with the health they had then, and whatever statuses they have picked up since are gone.',
        tiers: ['Back 3s (at most 35% of their health comes back).', 'Back 5s (at most 50%).', 'Once a room, a friend who has just fallen is turned back to before the blow that felled them.'] },
      { id: 'timeBubble', name: 'Slow Time', cd: 15, tags: 's', glyph: 'cloud', desc: 'A bubble of slow time over the enemies: inside it they walk, strike, wind up and recharge at 45% speed, and their shots crawl.',
        tiers: ['For 5s.', 'Time runs fast for friends inside it: they move, strike and recharge 30% faster.', 'Wider, and for 7s.'] },
      { id: 'stopClock', name: 'Stop the Clock', cd: 20, tags: 's', glyph: 'clock', desc: 'Stops the room\'s clock. Every enemy and every enemy shot hangs where it is, mid-step, mid-swing, mid-air, while the party carries on.',
        tiers: ['For 1.4s (bosses 0.6s).', 'For 2s.', 'When time starts again each of them takes at once a third of what it was dealt while it stood still.'] },
    ],
    trait: { id: 'spareSecond', name: 'Spare Second', desc: 'Once a room, the blow that would bring him down never happens: he is back where he stood three seconds ago, with the health he had then.' },
  },
  // ------------------------------------------------------------------ the Air mage
  // The designer: "Air mage. Whirled effect"
  airMage: {
    name: 'Air Mage', art: art('airMage'), role: 'caster', unlock: { gems: 2 },
    blurb: 'Sky-blue robes that never hang still. Pushes, lifts and spins the enemy until they don\'t know which way is up.',
    fun: 'Has never once had to open a door by hand. Has lost a great many hats.',
    stats: { hp: 70, speed: 68, r: 30, vr: 22, turn: 4.6, accel: 250, face: 4.8, mass: 0.9, range: 230, keep: 180, atkCd: 1.15, dmg: 9 },
    style: { glow: '#DDEFFA' },
    attack: { name: 'Gust', anim: 'cast', desc: 'A crescent of wind that goes through the first enemy to the one behind: a small shove, and a little Whirled on each.' },
    abilities: [
      { id: 'gale', name: 'Gale', cd: 9, tags: 'ds', glyph: 'swirl', desc: 'A wall of wind down a wide lane in front of her: every enemy in it is blown far back and whirled, and whatever is blown into a wall or a rock is hurt by it.',
        tiers: ['Blows them back and whirls them.', 'Enemy shots in the lane are blown back at whoever loosed them.', 'A wider lane, and they are whirled half as much again.'] },
      { id: 'updraft', name: 'Updraft', cd: 12, tags: 'sd', glyph: 'up', desc: 'A column of rising air under an enemy lifts it off its feet: it hangs there, helpless, then is dropped.',
        tiers: ['One enemy, in the air for 1.8s; the fall hurts and staggers.', 'Everything close to it is lifted too.', 'They are slammed down: knocked out, and a whirled one bursts.'] },
      { id: 'cyclone', name: 'Cyclone', cd: 15, tags: 'ds', glyph: 'cloud', desc: 'A whirlwind that wanders after the enemies: it drags whatever is near into itself, batters it and whirls it until it is flung out.',
        tiers: ['For 5s.', 'A stronger pull, and for 7s.', 'When it dies down it bursts: everything in it is thrown outwards.'] },
    ],
    trait: { id: 'stormsEye', name: 'Eye of the Storm', desc: 'When an enemy she has whirled is flung about, a clap of wind goes off round it: its neighbours are hit and whirled too.' },
  },
  // ------------------------------------------------------------------ the Warden
  // The designer: "Warden (uses a lot or shackles and restraints. Nullification themed)"; and Shackled (the Old Guard's
  // Pommel Strike note): "Shackled status effect, target can't do basic attacks, ability cooldowns are set back 50%...
  // the shackled ability goes to someone else."
  warden: {
    name: 'Warden', art: art('warden'), role: 'tank', unlock: { gems: 3 },
    blurb: 'Iron plate, a ring of keys and a great deal of chain. Nothing he has locked up has ever got out.',
    fun: 'Counts his prisoners twice a night. Has been known to count the party.',
    stats: { hp: 170, speed: 52, r: 34, vr: 24, turn: 3.2, accel: 170, face: 3.4, mass: 2.4, range: 34, atkCd: 1.35, dmg: 14, knock: 150, arc: 2, armor: 5, shackle: 14 },
    weapon: 'heavy', style: { off: 'shield' },
    attack: { name: 'Iron chain', anim: 'swing', desc: 'A weighted chain swung in a wide arc. Every blow closes the irons a little further: Shackled builds on what it hits.' },
    abilities: [
      { id: 'manacle', name: 'Manacles', cd: 10, tags: 's', glyph: 'chain', desc: 'Throws a pair of manacles at the enemy with the most to lose: a caster, a shooter, whatever is about to do something. They snap shut and it is Shackled at once: no basic attacks, and its abilities set back.',
        tiers: ['Shackles one enemy.', 'The chain is staked to the floor: it can\'t move either.', 'A second pair flies on to the next enemy.'] },
      { id: 'nullify', name: 'Nullify', cd: 16, tags: 's', glyph: 'null', desc: 'Raises the null key. In a wide ring round him nothing works: enemy shots drop out of the air, what enemies were winding up is broken off, and they can use no ability for a while.',
        tiers: ['Breaks off their moves and silences them for 3s.', 'It strips what protects and strengthens them, and washes the statuses off friends in the ring.', 'Silenced for 5s, and the silenced take 20% more.'] },
      { id: 'chainGang', name: 'Chain Gang', cd: 14, tags: 's', glyph: 'chain', desc: 'Chains fly from his belt to the enemies round him and lock on. They are leashed to him: they can\'t get further than the chain allows, they have to fight him, and he takes 20% less while he holds them.',
        tiers: ['Three enemies, for 5s.', 'Five enemies.', 'At the end he hauls them all in at once and they are knocked reeling.'] },
    ],
    trait: { id: 'ballAndChain', name: 'Ball and Chain', desc: 'Whatever he shackles drags an iron ball as well: it moves 40% slower and can\'t dash, leap or charge until the irons come off.' },
  },
  // ------------------------------------------------------------------ the Telekinetic
  // The designer: "Telekinetic."
  telekinetic: {
    name: 'Telekinetic', art: art('telekinetic'), role: 'caster', unlock: { gems: 3 },
    blurb: 'Never lifts a finger. Lifts everything else: rocks, crates, enemies, the arrows meant for her friends.',
    fun: 'Has not carried her own shopping in years. The shopping finds this unsettling.',
    stats: { hp: 72, speed: 64, r: 30, vr: 22, turn: 4.5, accel: 240, face: 4.6, mass: 1, range: 235, keep: 185, atkCd: 1.25, dmg: 9.5 },
    style: { glow: '#C79BFF' },
    attack: { name: 'Flung stone', anim: 'cast', desc: 'A loose stone lifts off the floor beside her and is flung at the enemy.' },
    abilities: [
      { id: 'hurl', name: 'Hurl', cd: 9, tags: 'ds', glyph: 'rock', desc: 'Picks up the nearest heavy thing, a rock or a crate standing in the room, a body off the floor, or a slab torn out of the floor itself, and hurls it into the enemies. It lands hard on everything there.',
        tiers: ['One thing thrown.', 'A second straight after it.', 'It bursts into shrapnel where it lands: a wider blast that staggers.'] },
      { id: 'levitate', name: 'Levitate', cd: 13, tags: 'sd', glyph: 'up', desc: 'Lifts an enemy off the floor and holds it helpless in the air, then throws it at its own friends: it and whatever it lands on are hurt. A boss is too heavy to lift: it is pressed down and slowed instead.',
        tiers: ['Held for 2s, then thrown.', 'Held for 3s, and it takes 20% more while it hangs there.', 'Two enemies at once.'] },
      { id: 'mindShield', name: 'Mind Shield', cd: 16, tags: 's', glyph: 'shield', desc: 'A dome of force round her and the friends beside her. Enemy shots that reach it stop dead and hang in the air; enemies that walk into it are pushed back out. When it drops, everything it caught flies back at whoever loosed it.',
        tiers: ['For 3.5s.', 'For 5s, and what it throws back hits 50% harder.', 'It ends with a shove: every enemy near is thrown back and staggered.'] },
    ],
    trait: { id: 'poltergeist', name: 'Poltergeist', desc: 'When an enemy dies near her, its body is flung at the nearest of its friends.' },
  },
  // ------------------------------------------------------------------ the Earth mage
  // The designer: "Earth mage (earth quakes, chains of spikes from the ground, spawn stone walls.)"
  earthMage: {
    name: 'Earth Mage', art: art('earthMage'), role: 'caster', unlock: { gems: 2 },
    blurb: 'Bare feet, clay to the elbows. The floor does what she tells it: it shakes, it bites, it stands up and gets in the way.',
    fun: 'Has never been lost underground. Has been lost in every town she ever visited.',
    stats: { hp: 82, speed: 58, r: 31, vr: 22, turn: 4, accel: 210, face: 4.2, mass: 1.3, range: 220, keep: 170, atkCd: 1.3, dmg: 10 },
    style: { glow: '#D9B98A' },
    attack: { name: 'Rock', anim: 'cast', desc: 'A lump of rock punched out of the floor and thrown: a solid knock, and a little stagger.' },
    abilities: [
      { id: 'earthquake', name: 'Earthquake', cd: 14, tags: 'sd', glyph: 'wave', desc: 'The floor under the enemies shakes itself to pieces: everything on it is slowed to a stumble, staggered again and again, and hurt.',
        tiers: ['A quake for 3s.', 'Wider, and for 4.5s.', 'It ends with the floor heaving up: everything on it is thrown off its feet.'] },
      { id: 'spikeChain', name: 'Spike Chain', cd: 9, tags: 'ds', glyph: 'spike', desc: 'A line of stone spikes bursts out of the floor one after another, running from her to an enemy; from there it runs on to the next enemy, and the next.',
        tiers: ['Runs through three enemies.', 'Through five.', 'The last spike under each holds it fast: rooted for 1.4s.'] },
      { id: 'stoneWall', name: 'Stone Wall', cd: 15, tags: 's', glyph: 'wall', desc: 'A wall of stone slabs heaves up out of the floor across the way of whoever is coming for the party. It is a real wall: nothing walks or shoots through it.',
        tiers: ['Stands for 6s.', 'A longer wall, for 8s.', 'When it comes down it falls on the enemies\' side: those near it are hurt and staggered.'] },
    ],
    trait: { id: 'aftershock', name: 'Aftershock', desc: 'The ground remembers. A moment after one of her abilities hurts an enemy, a stone spike comes up under it.' },
  },
};
