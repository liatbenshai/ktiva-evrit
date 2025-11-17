// Service Worker for PWA
const CACHE_NAME = 'ktiva-evrit-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const method = request.method;
  const url = new URL(request.url);
  
  // Skip service worker for API routes - always fetch from network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Skip service worker for protected routes that require authentication
  // These routes may have redirects that the service worker can't handle
  if (url.pathname.startsWith('/dashboard') || 
      url.pathname.startsWith('/login') || 
      url.pathname.startsWith('/register')) {
    // For protected routes, always fetch from network with redirect mode
    event.respondWith(fetch(request, { redirect: 'follow' }));
    return;
  }
  
  // Only cache GET requests - skip POST, DELETE, PUT, PATCH
  if (method !== 'GET') {
    // For non-GET requests, just fetch from network without caching
    event.respondWith(fetch(request, { redirect: 'follow' }));
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(request, { redirect: 'follow' }).then(
          (response) => {
            // Check if we received a valid response
            // Don't cache redirects (3xx status codes)
            if (!response || response.status < 200 || response.status >= 300 || response.type !== 'basic') {
              return response;
            }
            // Only cache successful GET requests
            if (method === 'GET' && response.status === 200) {
              // Clone the response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            return response;
          }
        );
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

