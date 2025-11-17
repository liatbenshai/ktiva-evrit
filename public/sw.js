// Service Worker for PWA
const CACHE_NAME = 'ktiva-evrit-v3';

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Only cache static files that don't require authentication
        return cache.addAll([
          '/',
          '/manifest.json',
        ]);
      })
      .catch((error) => {
        console.error('Cache install failed:', error);
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const method = request.method;
  const url = new URL(request.url);
  
  // Always use redirect: 'follow' for all fetch requests
  const fetchOptions = { redirect: 'follow' };
  
  // Skip service worker for API routes - always fetch from network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request, fetchOptions));
    return;
  }
  
  // Skip service worker for protected routes that require authentication
  // These routes may have redirects that the service worker can't handle
  if (url.pathname.startsWith('/dashboard') || 
      url.pathname.startsWith('/login') || 
      url.pathname.startsWith('/register')) {
    // For protected routes, always fetch from network with redirect mode
    event.respondWith(fetch(request, fetchOptions));
    return;
  }
  
  // Only cache GET requests - skip POST, DELETE, PUT, PATCH
  if (method !== 'GET') {
    // For non-GET requests, just fetch from network without caching
    event.respondWith(fetch(request, fetchOptions));
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(request, fetchOptions).then(
          (response) => {
            // Check if we received a valid response
            // Don't cache redirects (3xx status codes) or errors
            if (!response || response.status < 200 || response.status >= 300 || response.type !== 'basic') {
              return response;
            }
            // Only cache successful GET requests for static assets
            if (method === 'GET' && response.status === 200) {
              // Only cache static files, not dynamic pages
              if (url.pathname === '/' || 
                  url.pathname === '/manifest.json' ||
                  url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i)) {
                // Clone the response
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  })
                  .catch((error) => {
                    console.error('Cache put failed:', error);
                  });
              }
            }
            return response;
          }
        ).catch((error) => {
          console.error('Fetch failed:', error);
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

