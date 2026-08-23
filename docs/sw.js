const CACHE_PREFIX = 'lifeos-shell-';
const CACHE = `${CACHE_PREFIX}v4.0`;
const ROOT = new URL('./', self.location.href).pathname;
const INDEX_URL = `${ROOT}index.html`;
const STATIC_SHELL = [`${ROOT}assets/logo.svg`, `${ROOT}assets/favicon.svg`, `${ROOT}assets/avatar-bot.svg`, `${ROOT}assets/apple-touch-icon.png`, `${ROOT}assets/icon-192.png`, `${ROOT}assets/icon-512.png`, `${ROOT}assets/icon-maskable-512.png`, `${ROOT}manifest.webmanifest`];

async function installBuildShell() {
  // Stage one complete build in its own cache. If any compiled asset is missing,
  // installation fails and the previous, internally consistent shell stays active.
  const response = await fetch(new Request(INDEX_URL, { cache: 'reload' }));
  if (!response.ok) throw new Error(`LifeOS shell unavailable (${response.status})`);

  const html = await response.clone().text();
  const assetUrls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(([, reference]) => new URL(reference, new URL(ROOT, self.location.origin)).href)
    .filter(url => {
      const parsed = new URL(url);
      return parsed.origin === self.location.origin && parsed.pathname.startsWith(ROOT);
    });
  const seedUrls = [...new Set([...assetUrls, ...STATIC_SHELL.map(path => new URL(path, self.location.origin).href)])];
  const fetchedAssets = new Map();
  const pending = new Map();
  const compiledReference = /["'`]((?:assets\/|\.{1,2}\/|\/)[^"'`\s]+?\.(?:js|css|woff2?|svg|png|webp))["'`]/g;

  const fetchAssetTree = url => {
    if (fetchedAssets.has(url) || pending.has(url)) return pending.get(url) || Promise.resolve();
    const work = (async () => {
      const asset = await fetch(new Request(url, { cache: 'reload' }));
      if (!asset.ok) throw new Error(`LifeOS asset unavailable (${asset.status})`);
      fetchedAssets.set(url, asset);
      if (!url.match(/\.js(?:$|\?)/)) return;
      const source = await asset.clone().text();
      const references = [...source.matchAll(compiledReference)].map(([, reference]) => {
        if (reference.startsWith('assets/')) return new URL(`${ROOT}${reference}`, self.location.origin).href;
        return new URL(reference, url).href;
      }).filter(reference => {
        const parsed = new URL(reference);
        return parsed.origin === self.location.origin && parsed.pathname.startsWith(ROOT);
      });
      await Promise.all([...new Set(references)].map(fetchAssetTree));
    })();
    pending.set(url, work);
    return work;
  };
  await Promise.all(seedUrls.map(fetchAssetTree));

  const cache = await caches.open(CACHE);
  await cache.put(INDEX_URL, response.clone());
  await cache.put(ROOT, response);
  await Promise.all([...fetchedAssets].map(([url, asset]) => cache.put(url, asset)));
}

self.addEventListener('install', event => {
  event.waitUntil(installBuildShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('lifeos-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallback) {
  try {
    const response = await fetch(request);
    if (response.ok && request.destination !== 'document') {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (fallback ? await caches.match(fallback) : undefined) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    // Never replace the offline HTML alone: that could mix two compiled builds.
    event.respondWith(networkFirst(event.request, INDEX_URL));
    return;
  }

  if (['script', 'style', 'worker', 'font'].includes(event.request.destination)) {
    event.respondWith(caches.match(event.request).then(hit => hit || networkFirst(event.request)));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
