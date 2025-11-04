// Enhanced Service Worker for offline support
const CACHE_NAME = 'sipoma-v1';
const API_CACHE_NAME = 'sipoma-api-v1';

// Static assets to cache
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets as needed
];

// API endpoints to cache - expanded for all PocketBase collections
const API_ENDPOINTS = [
  // CCR Data
  '/api/collections/ccr_parameter_data',
  '/api/collections/ccr_silo_data',
  '/api/collections/ccr_downtime',
  '/api/collections/ccr_material_usage',
  '/api/collections/ccr_footer_data',
  '/api/collections/ccr_information',

  // User Management
  '/api/collections/users',
  '/api/collections/profiles',
  '/api/collections/permissions',

  // Plant Operations
  '/api/collections/plant_units',
  '/api/collections/parameter_settings',
  '/api/collections/silo_capacities',

  // System
  '/api/collections/audit_logs',
  '/api/collections/settings',

  // Authentication
  '/api/admins/auth-with-password',
  '/api/collections/users/auth-with-password',
  '/api/collections/users/refresh',

  // File uploads
  '/api/files',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Enhanced fetch event with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with stale-while-revalidate strategy
  if (API_ENDPOINTS.some((endpoint) => url.pathname.includes(endpoint))) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        // Try to get cached response
        const cachedResponse = await cache.match(request);

        // Always try to fetch fresh data in background
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('Network fetch failed:', error);
            // Return cached response if available, otherwise return offline response
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'Data cached locally',
                cached: true,
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle background sync for pending operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingOperations());
  }
});

// Function to sync pending operations
async function syncPendingOperations() {
  try {
    // This would be implemented to sync data from IndexedDB to server
    // For now, just log that sync is attempted
    console.log('Background sync triggered');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
