// Keeps the whole game on the phone so it opens with no signal. Bump VERSION on every release.
const VERSION = '0.7.0';
const CACHE = `delve-${VERSION}`;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png',
  'icons/icon-512.png', 'js/audio.js', 'js/bestiary.js', 'js/boss.js', 'js/camp-kit.js', 'js/camp-scenes.js',
  'js/camp.js', 'js/dungeon.js', 'js/enemies.js', 'js/env.js', 'js/fx.js', 'js/heroes.js', 'js/hud.js',
  'js/icons.js', 'js/inspect.js', 'js/kits.js', 'js/main.js', 'js/map.js', 'js/parts.js', 'js/path.js',
  'js/potions.js', 'js/progress.js', 'js/render.js', 'js/save.js', 'js/scenery.js', 'js/sfx.js', 'js/sim.js',
  'js/skilltree.js', 'js/sprites.js', 'js/themes.js', 'js/trinkets.js', 'js/units.js', 'js/util.js', 'css/camp.css',
  'css/hud.css', 'css/scenes.css', 'css/tree.css', 'art/archer.svg', 'art/boss.svg', 'art/bosses/bone-king.svg',
  'art/enemies/brute.svg', 'art/enemies/gaper.svg', 'art/enemies/ghost.svg', 'art/enemies/goblin.svg',
  'art/enemies/hobgoblin.svg', 'art/enemies/lizardman-blade.svg', 'art/enemies/lizardman.svg',
  'art/enemies/mimic.svg', 'art/enemies/orc-shaman.svg', 'art/enemies/orc.svg',
  'art/enemies/rattler-jawless-bow.svg', 'art/enemies/rattler-jawless-spear.svg', 'art/enemies/rattler-loosejaw.svg',
  'art/enemies/rattler.svg', 'art/enemies/troll.svg', 'art/heroes/archer.svg', 'art/heroes/bard.svg',
  'art/heroes/berserker.svg', 'art/heroes/cleric.svg', 'art/heroes/druid.svg', 'art/heroes/frost.svg',
  'art/heroes/granny.svg', 'art/heroes/necromancer.svg', 'art/heroes/paladin.svg', 'art/heroes/plague.svg',
  'art/heroes/pyromancer.svg', 'art/heroes/storm.svg', 'art/heroes/tower.svg', 'art/heroes/twinfang.svg',
  'art/heroes/wildmane.svg', 'art/knight.svg', 'art/props/barrel.svg', 'art/props/brazier.svg',
  'art/props/chest-closed.svg', 'art/props/chest-locked.svg', 'art/props/chest-open.svg', 'art/props/crate.svg',
  'art/props/door-open-boss.svg', 'art/props/door-open-choice.svg', 'art/props/door-open-elite.svg',
  'art/props/door-open-fight.svg', 'art/props/door-open-fountain.svg', 'art/props/door-open-hazard.svg',
  'art/props/door-open-treasure.svg', 'art/props/door-open.svg', 'art/props/door-shut.svg',
  'art/props/fountain-used.svg', 'art/props/fountain.svg', 'art/props/hazard-oil.svg',
  'art/props/obstacle-crates.svg', 'art/props/obstacle-pillar.svg', 'art/props/obstacle-rock.svg',
  'art/props/pedestal.svg', 'art/props/rock-1.svg', 'art/props/rock-2.svg', 'art/props/rock-3.svg',
  'art/props/rock-4.svg', 'art/props/trap-spikes-down.svg', 'art/props/trap-spikes-up.svg', 'art/rogue.svg',
  'art/skeleton.svg'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('delve-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => { if (e.request.method !== 'GET') return; e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request))); });
