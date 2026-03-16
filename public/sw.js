// Service Worker disabled - caching caused issues
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Clear all caches
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Don't cache anything - pass through to network
self.addEventListener('fetch', (e) => {
  // Do nothing - let browser handle the request
});
