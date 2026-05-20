const CACHE_NAME = 'cekaceka-v1';
const ASSETS_TO_CACHE = [
  '/app',
  '/manifest.json',
  '/icons/icon_64x64.png',
  '/icons/icon_144x144.png',
  '/icons/icon_192x192.png',
  '/icons/icon_384x384.png',
  '/icons/icon_512x512.png',
  '/logo-light.png',
  '/logo-dark.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard non-GET requests, API requests, and HMR hot-reloading scripts
  if (event.request.method !== 'GET' || event.request.url.includes('/_nuxt/') || event.request.url.includes('__vite_ping')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for offline usage
        if (event.request.mode === 'navigate') {
          return caches.match('/app');
        }
      });
    })
  );
});
