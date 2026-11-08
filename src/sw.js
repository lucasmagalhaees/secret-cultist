// Service worker: keeps the app on the device, so it opens at once and without a connection, and lets the page know
// when a newer version has been published. Plain JavaScript, copied to dist/sw.js by the build (see vite.config.js).
const VERSION = '__APP_VERSION__';
const PAGE = 'secret-cultist-page-' + VERSION;        // this version of the app
const ASSETS = 'secret-cultist-assets-v1';            // files from other addresses that do not change under the same address (fonts, libraries)
const ASSET_HOSTS = [];                          // e.g. 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'

self.addEventListener('install', event => {
  // a fresh copy of the page, past the browser's own HTTP cache
  event.waitUntil(caches.open(PAGE).then(cache => cache.add(new Request('./', { cache: 'reload' }))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('secret-cultist-page-') && k !== PAGE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// A new version waits until the person taps "Atualizar agora": swapping the app under what the person is doing would be rude.
self.addEventListener('message', event => { if (event.data === 'activate') self.skipWaiting(); });

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // the page itself comes from the device; the network is only the fallback
    if (req.mode === 'navigate') event.respondWith(caches.open(PAGE).then(cache => cache.match('./')).then(hit => hit || fetch(req)));
    return;
  }
  if (ASSET_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(ASSETS).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }));
  }
  // The data source is never answered from here: the app needs it fresh, and keeps its own copy of the last answers
  // for when there is no connection.
});
