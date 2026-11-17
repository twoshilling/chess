/* Keeps the trainer working offline. The page is fetched fresh when online and falls back to the saved copy;
   the engine and other files come from the saved copy. The cache name changes with each version. */
const CACHE = 'italian-trainer-__VERSION__';
const FILES = ['./', './index.html', './chess.js', './stockfish-19-lite-single.js', './stockfish-19-lite-single.wasm', './stockfish.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('italian-trainer-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (page) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
