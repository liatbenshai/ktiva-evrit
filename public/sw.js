// Service Worker for PWA
const CACHE_NAME = 'ktiva-evrit-v4';

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Only cache static files that don't require authentication
        // Don't cache login or auth-related pages
        return cache.addAll([
          '/manifest.json',
        ]).catch((error) => {
          console.error('Cache install failed:', error);
        });
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
  
  // Skip service worker entirely for routes that may have redirects or require authentication
  // Let the browser handle these naturally without service worker interception
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/dashboard') || 
      url.pathname.startsWith('/login') || 
      url.pathname.startsWith('/register') ||
      url.pathname.startsWith('/admin') ||
      url.pathname === '/' || // Don't cache home page - might have auth redirects
      url.searchParams.has('callbackUrl')) { // Don't cache pages with callback URLs
    // Don't intercept these requests at all - let browser handle redirects
    return;
  }
  
  // Only cache GET requests - skip POST, DELETE, PUT, PATCH
  if (method !== 'GET') {
    // Don't intercept non-GET requests
    return;
  }
  
  // Only handle static assets that we know won't redirect
  // Use redirect: 'follow' explicitly to handle any redirects properly
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Fetch with redirect: 'follow' to properly handle any redirects
        return fetch(request, { redirect: 'follow' }).then(
          (response) => {
            // Check if we received a valid response
            // Don't cache redirects (3xx status codes) or errors
            if (!response || response.status < 200 || response.status >= 300 || response.type !== 'basic') {
              return response;
            }
            // Only cache successful GET requests for static assets
            if (method === 'GET' && response.status === 200) {
              // Only cache static files, not dynamic pages or HTML pages
              // Never cache HTML pages - they might contain auth state
              if (url.pathname === '/manifest.json' ||
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

