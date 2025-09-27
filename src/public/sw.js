/* Simple SW pour LevelUp — cache statique + offline fallback */

const CACHE_NAME = 'levelup-cache-v1';
const OFFLINE_URL = '/offline.html';

/** Pré-cache minimal (offline page & manifest) */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([OFFLINE_URL, '/manifest.webmanifest']);
      // Active immédiatement ce SW
      await self.skipWaiting();
    })()
  );
});

/** Prend le contrôle des clients ouverts dès l'activation */
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Stratégies :
 * - Navigations (SPA) : network-first → fallback offline.html si échec
 * - Assets statiques (script/style/image/font) : cache-first
 * - Autres requêtes : network-first → fallback cache si existant
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Navigations (routes SPA)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone()); // on garde une copie
          return fresh;
        } catch (err) {
          // offline → dernière version en cache ou page offline
          const cached = await caches.match(req);
          return cached || caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // 2) Assets statiques : cache-first
  const dest = req.destination;
  if (['script', 'style', 'image', 'font'].includes(dest)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return new Response('', { status: 504, statusText: 'Gateway Timeout' });
        }
      })()
    );
    return;
  }

  // 3) Autres : network-first
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});
