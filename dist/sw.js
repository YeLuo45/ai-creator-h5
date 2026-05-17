/**
 * Service Worker for AI Creator H5 PWA
 * Enhanced Cache-First Strategy with Background Sync Support
 */

const CACHE_NAME = 'ai-creator-v1.7.0-offline';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.css',
  '/manifest.json',
  '/lib/app.js',
  '/lib/router.js',
  '/lib/storage.js',
  '/lib/wx-api.js',
  '/lib/router.css',
  '/pages/index.html',
  '/pages/generate.html',
  '/pages/history.html',
  '/pages/creator.html',
  '/pages/my.html',
  '/pages/favorites.html',
  '/pages/folder.html',
  '/data/templates.js',
  '/services/imageService.js',
  '/services/musicService.js',
  '/services/ttsService.js',
  '/services/templateService.js',
  '/services/favoriteService.js',
  '/services/usageService.js',
  '/services/creatorService.js',
  '/services/achievementService.js',
  '/services/offlineQueue.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versioned caches
            if (cacheName !== CACHE_NAME && cacheName.startsWith('ai-creator-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - Enhanced Cache-First with Network Fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests for caching
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests (except CDN)
  if (url.origin !== location.origin && !url.href.includes('cdnjs.cloudflare.com')) {
    return;
  }

  // Handle API requests differently - Network First
  if (url.pathname.startsWith('/api') || url.pathname.includes('.minimax.chat')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Static assets - Cache First
  event.respondWith(cacheFirstStrategy(event.request));
});

// Cache-First Strategy
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Return cached version immediately
    return cachedResponse;
  }

  // Not in cache - fetch from network
  try {
    const networkResponse = await fetch(request);

    // Don't cache non-successful responses
    if (!networkResponse || networkResponse.status !== 200) {
      return networkResponse;
    }

    // Clone and cache the response
    const responseToCache = networkResponse.clone();
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, responseToCache);

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);
    // Return offline fallback for documents
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    // Return a basic error response for other requests
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-First Strategy (for API requests)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful API responses for offline access
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return error response for API failures
    return new Response(JSON.stringify({ error: 'Offline', message: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background Sync for offline generation requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'offline-generation') {
    event.waitUntil(processOfflineQueue());
  }
});

// Process offline queue in service worker context
async function processOfflineQueue() {
  console.log('[SW] Processing offline queue...');

  try {
    // Get all clients and post message to trigger queue processing
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PROCESS_OFFLINE_QUEUE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW] Error processing offline queue:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('ai-creator-')) {
              console.log('[SW] Clearing cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
        return caches.open(CACHE_NAME);
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then(size => {
        event.source.postMessage({
          type: 'CACHE_SIZE',
          size: size
        });
      })
    );
  }
});

// Calculate total cache size
async function getCacheSize() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  let totalSize = 0;

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.clone().blob();
      totalSize += blob.size;
    }
  }

  return totalSize;
}

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCache());
  }
});

// Cleanup old caches periodically
async function cleanupCache() {
  console.log('[SW] Running cache cleanup...');
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  // Keep only recent entries (last 50)
  if (keys.length > 50) {
    console.log('[SW] Cache too large, clearing old entries');
    // For simplicity, we'll just clear all - a smarter implementation would delete oldest
    await cache.clear();
  }
}