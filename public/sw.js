// Advanced Service Worker with intelligent caching strategies
// Handles API responses, static assets, and dynamic content caching

const CACHE_NAME = 'sipoma-v2-cache-v1';
const API_CACHE_NAME = 'sipoma-api-cache-v1';
const STATIC_CACHE_NAME = 'sipoma-static-cache-v1';

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
};

// Routes and their caching strategies
const CACHE_ROUTES = {
  // API routes - Network first for fresh data
  '/api/ccr-data': CACHE_STRATEGIES.NETWORK_FIRST,
  '/api/parameters': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/api/work-instructions': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/api/plant-units': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,

  // Static assets - Cache first
  '/assets/': CACHE_STRATEGIES.CACHE_FIRST,
  '/icons/': CACHE_STRATEGIES.CACHE_FIRST,
  '/fonts/': CACHE_STRATEGIES.CACHE_FIRST,

  // Pages - Network first
  '/': CACHE_STRATEGIES.NETWORK_FIRST,
  '/plant-operations': CACHE_STRATEGIES.NETWORK_FIRST,
  '/dashboard': CACHE_STRATEGIES.NETWORK_FIRST,
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  API_DATA: 5 * 60 * 1000, // 5 minutes
  STATIC_ASSETS: 24 * 60 * 60 * 1000, // 24 hours
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
  FONTS: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/favicon.ico',
          // Add critical CSS and JS files here
        ]);
      })
      .then(() => {
        console.log('✅ Essential resources cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache essential resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME
            ) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) return;

  // Determine cache strategy based on route
  const cacheStrategy = getCacheStrategy(url.pathname);

  switch (cacheStrategy) {
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirstStrategy(request));
      break;

    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirstStrategy(request));
      break;

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidateStrategy(request));
      break;

    default:
      // Default to network first
      event.respondWith(networkFirstStrategy(request));
  }
});

// Cache strategies implementation
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline fallback
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

async function cacheFirstStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Check if cache is still valid
    if (isCacheValid(cachedResponse, request.url)) {
      return cachedResponse;
    } else {
      // Remove expired cache
      await caches.open(STATIC_CACHE_NAME).then((cache) => cache.delete(request));
    }
  }

  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Cache and network failed for:', request.url);
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

async function staleWhileRevalidateStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);

  // Always try to update cache in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(API_CACHE_NAME);
        cache.then((cache) => cache.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => {
      // Silently fail background update
    });

  // Return cached response if available and valid
  if (cachedResponse && isCacheValid(cachedResponse, request.url)) {
    return cachedResponse;
  }

  // Wait for network response
  try {
    const networkResponse = await fetchPromise;
    return networkResponse;
  } catch (error) {
    // Return cached response even if expired
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Helper functions
function getCacheStrategy(pathname) {
  // Check exact matches first
  if (CACHE_ROUTES[pathname]) {
    return CACHE_ROUTES[pathname];
  }

  // Check pattern matches
  for (const [route, strategy] of Object.entries(CACHE_ROUTES)) {
    if (route.endsWith('/') && pathname.startsWith(route)) {
      return strategy;
    }
  }

  // Default strategy
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

function isCacheValid(response, url) {
  const cacheTime = response.headers.get('sw-cache-time');
  if (!cacheTime) return true; // No timestamp, assume valid

  const age = Date.now() - parseInt(cacheTime);
  const maxAge = getMaxAge(url);

  return age < maxAge;
}

function getMaxAge(url) {
  if (url.includes('/api/')) {
    return CACHE_EXPIRATION.API_DATA;
  } else if (url.includes('/assets/') || url.includes('/static/')) {
    return CACHE_EXPIRATION.STATIC_ASSETS;
  } else if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
    return CACHE_EXPIRATION.IMAGES;
  } else if (url.match(/\.(woff|woff2|ttf|eot)$/)) {
    return CACHE_EXPIRATION.FONTS;
  }

  return CACHE_EXPIRATION.STATIC_ASSETS;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('📡 Performing background sync...');

  // Example: Retry failed API calls
  const failedRequests = await getFailedRequests();

  for (const request of failedRequests) {
    try {
      await fetch(request);
      await removeFailedRequest(request);
      console.log('✅ Retried failed request:', request.url);
    } catch (error) {
      console.log('❌ Failed to retry request:', request.url);
    }
  }
}

// Storage helpers for failed requests
async function getFailedRequests() {
  // In a real implementation, you'd use IndexedDB
  return [];
}

async function removeFailedRequest(request) {
  // In a real implementation, you'd use IndexedDB
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: data.url,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');

  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});

// Periodic cache cleanup
setInterval(
  async () => {
    console.log('🧹 Running periodic cache cleanup...');

    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response && !isCacheValid(response, request.url)) {
          await cache.delete(request);
          console.log('🗑️ Cleaned up expired cache:', request.url);
        }
      }
    }
  },
  30 * 60 * 1000
); // Run every 30 minutes

console.log('🎯 Advanced Service Worker loaded successfully');

