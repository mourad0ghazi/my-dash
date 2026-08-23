const CACHE = 'lifeos-v2.2';
const ROOT = new URL('./', self.location.href).pathname;
const CORE = [ROOT, `${ROOT}index.html`, `${ROOT}assets/logo.svg`, `${ROOT}assets/avatar-bot.svg`];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(async () => {
      const hit = await caches.match(event.request);
      if (hit) return hit;
      if (event.request.mode === 'navigate') return caches.match(`${ROOT}index.html`);
      return Response.error();
    })
  );
});
