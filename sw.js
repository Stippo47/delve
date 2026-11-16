// Keeps the whole game on the phone so it opens with no signal. Bump VERSION on every release.
const VERSION = '0.1.0';
const CACHE = `delve-${VERSION}`;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'art/archer.svg', 'art/knight.svg', 'art/rogue.svg', 'art/skeleton.svg', 'art/boss.svg',
  'js/main.js', 'js/util.js', 'js/sprites.js', 'js/units.js', 'js/sim.js', 'js/dungeon.js', 'js/render.js', 'js/save.js'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('delve-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => { if (e.request.method !== 'GET') return; e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request))); });
