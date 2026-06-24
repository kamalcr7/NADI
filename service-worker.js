/* ============================================================
   KTMY — Service Worker for Offline & PWA support
   ============================================================
   Strategy: Cache-first for static assets, network-first for
   data files and API calls.
   ============================================================ */

const CACHE_NAME = 'ktmy-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/index.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/datastore.js',
  '/js/i18n.js',
  '/js/charts.js',
  '/js/animations.js',
  '/js/api.js',
  '/js/sections/hero.js',
  '/js/sections/weather.js',
  '/js/sections/fuel.js',
  '/js/sections/economy.js',
  '/js/sections/population.js',
  '/js/sections/transport.js',
  '/js/sections/employment.js',
  '/js/sections/safety.js',
  '/js/sections/exchange.js',
  '/js/sections/prices.js',
  '/js/sections/government.js',
  '/js/sections/tariffs.js',
  '/js/sections/environment.js',
  '/js/sections/tourism.js',
  '/js/sections/healthcare.js',
  '/js/sections/education.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/_headers'
];

/* ---- Install: cache static assets ---- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ---- Activate: clean old caches ---- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

/* ---- Fetch: cache-first for static, network-first for data ---- */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Data files — network-first (stale-while-revalidate)
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // JSON, JS, CSS — stale-while-revalidate
  if (url.pathname.endsWith('.json') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Images and icons — cache-first
  if (url.pathname.startsWith('/icons/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.svg')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // HTML / root — network-first
  event.respondWith(networkFirst(event.request));
});

/* ---- Cache Strategies ---- */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetchAndCache(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
