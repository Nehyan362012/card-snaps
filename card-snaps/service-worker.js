
/* eslint-disable no-restricted-globals */

// This service worker caches the app shell and handles offline requests.
const CACHE_NAME = 'cardsnaps-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  // Add other static assets here if built (e.g. static/js/bundle.js) 
  // In dev mode, we mainly cache the shell and rely on browser cache for HMR
];

// Install Event: Cache Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Fetch Event: Cache First for assets, Network First for API (handled by app logic), Stale-While-Revalidate for others
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. API Requests (Community Hub) - Network only (handled by api.ts fallback) or Network First
  if (requestUrl.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline, the app handles the error gracefully via api.ts fallback
        return new Response(JSON.stringify({ offline: true }), { 
            headers: { 'Content-Type': 'application/json' } 
        });
      })
    );
    return;
  }

  // 2. External Assets (DiceBear, Fonts) - Stale While Revalidate
  if (requestUrl.hostname.includes('dicebear.com') || requestUrl.hostname.includes('googleapis.com')) {
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.match(event.request).then((response) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
            return response || fetchPromise;
          });
        })
      );
      return;
  }

  // 3. App Shell - Cache First, Fallback to Network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});
