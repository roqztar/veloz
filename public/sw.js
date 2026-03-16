// Service Worker for Eyedance PWA
// SECURITY: Only caches same-origin requests to prevent cache poisoning

const CACHE_NAME = 'eyedance-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/eyedance.svg',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('SW: Cache install failed:', err);
      })
  );
  // Activate immediately
  self.skipWaiting();
});

// Fetch event - serve from cache or network
// SECURITY: Only handle same-origin requests
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // SECURITY: Only process same-origin requests
  // Prevents cache poisoning from external redirects
  if (new URL(request.url).origin !== self.location.origin) {
    // For external requests (like PDF.js CDN), just fetch without caching
    event.respondWith(fetch(request));
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then((networkResponse) => {
            // SECURITY: Only cache successful same-origin responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone response for caching
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('SW: Fetch failed:', error);
            // Return offline fallback if available
            throw error;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// SECURITY: Message handling for client communication
self.addEventListener('message', (event) => {
  // Only accept messages from same-origin clients
  if (event.source && event.source.url) {
    const sourceOrigin = new URL(event.source.url).origin;
    if (sourceOrigin !== self.location.origin) {
      console.warn('SW: Ignored message from foreign origin:', sourceOrigin);
      return;
    }
  }
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
