// Offline cache for the installed app. cloudflare-build.sh replaces 'dev' with the commit id,
// so each release gets a fresh cache; saves live in localStorage and are never touched.
const VERSION = 'dev';
const CACHE = 'aquarium-world-' + VERSION;
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './js/engine.js', './js/data.js', './js/art.js', './js/ui.js', './js/field.js', './js/fishing.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('aquarium-world-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
