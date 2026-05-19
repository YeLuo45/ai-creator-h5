/**
 * Service Worker for AI Creator H5 PWA v19
 * Enhanced Cache Strategy with Background Sync, Push Notifications, and Install Prompt
 * Version: 1.9.0-mobile-offline
 */

const CACHE_NAME = 'ai-creator-v19.0.0-offline';
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
  '/pages/workflow.html',
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
  '/services/workflowStorage.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// API routes that should use network-first strategy
const API_ROUTES = ['/api/', '/api/workflow', '/api/execute', '/api/generate'];

// Static assets that should use cache-first strategy
const STATIC_ROUTES = ['.css', '.js', '.png', '.jpg', '.svg', '.woff', '.woff2'];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW-v19] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW-v19] Caching core assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW-v19] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW-v19] Cache failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW-v19] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versioned caches
            if (cacheName !== CACHE_NAME && cacheName.startsWith('ai-creator-')) {
              console.log('[SW-v19] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW-v19] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - Enhanced Cache Strategy based on request type
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests for caching (except for API POST/PUT)
  const url = new URL(event.request.url);

  // Skip cross-origin requests (except CDN)
  if (url.origin !== location.origin && !url.href.includes('cdnjs.cloudflare.com')) {
    return;
  }

  // Handle API requests - Network First with Offline Queue
  if (isAPIRequest(url)) {
    if (event.request.method === 'GET') {
      event.respondWith(networkFirstStrategy(event.request));
    } else {
      // POST/PUT requests - queue offline if failed
      event.respondWith(networkFirstWithOfflineQueue(event.request));
    }
    return;
  }

  // Handle workflow-related requests - Cache First for offline
  if (url.pathname.includes('workflow') || url.pathname.includes('execute')) {
    event.respondWith(cacheFirstWithOfflineFallback(event.request));
    return;
  }

  // Static assets - Cache First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirstStrategy(event.request));
});

// Check if request is an API call
function isAPIRequest(url) {
  return API_ROUTES.some(route => url.pathname.startsWith(route)) ||
         url.href.includes('.minimax.chat') ||
         url.href.includes('api.');
}

// Check if request is for static assets
function isStaticAsset(url) {
  return STATIC_ROUTES.some(ext => url.pathname.endsWith(ext));
}

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
    console.log('[SW-v19] Network failed for:', request.url);
    // Return offline fallback for documents
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    // Return a basic error response for other requests
    return new Response(JSON.stringify({ error: 'Offline', message: 'Network unavailable' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
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
    console.log('[SW-v19] Network failed, trying cache for:', request.url);
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

// Network First with Offline Queue (for POST/PUT requests)
async function networkFirstWithOfflineQueue(request) {
  try {
    const networkResponse = await fetch(request.clone());

    if (networkResponse && networkResponse.status === 200) {
      return networkResponse;
    }

    // If network failed, queue for later
    throw new Error('Network request failed');
  } catch (error) {
    console.log('[SW-v19] Network failed, queuing for offline:', request.url);

    // Clone request body for queueing
    let requestData = null;
    try {
      requestData = await request.clone().json();
    } catch (e) {
      requestData = { url: request.url, method: request.method };
    }

    // Notify clients to queue this request
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_QUEUE_REQUEST',
        request: {
          url: request.url,
          method: request.method,
          data: requestData,
          headers: Object.fromEntries(request.headers.entries())
        },
        timestamp: Date.now()
      });
    });

    // Return a pending response
    return new Response(JSON.stringify({
      error: 'QueuedOffline',
      message: 'Request queued for when online',
      queued: true
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache First with Offline Fallback (for workflow requests)
async function cacheFirstWithOfflineFallback(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Not in cache - fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW-v19] All strategies failed for:', request.url);
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Resource unavailable offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background Sync for offline generation requests
self.addEventListener('sync', (event) => {
  console.log('[SW-v19] Sync event:', event.tag);

  if (event.tag === 'offline-generation') {
    event.waitUntil(processOfflineQueue());
  }

  if (event.tag === 'offline-workflow-sync') {
    event.waitUntil(syncOfflineWorkflows());
  }
});

// Process offline queue in service worker context
async function processOfflineQueue() {
  console.log('[SW-v19] Processing offline queue...');

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
    console.error('[SW-v19] Error processing offline queue:', error);
  }
}

// Sync offline workflows
async function syncOfflineWorkflows() {
  console.log('[SW-v19] Syncing offline workflows...');

  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_WORKFLOWS',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW-v19] Error syncing workflows:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW-v19] Push notification received');

  let data = {
    title: 'AI Creator',
    body: '您有一条新消息',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      date: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: '打开' },
      { action: 'close', title: '关闭' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW-v19] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              notification: {
                title: event.notification.title,
                body: event.notification.body,
                url: url
              }
            });
            return;
          }
        }
        // Open new window
        return self.clients.openWindow(url);
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW-v19] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('ai-creator-')) {
              console.log('[SW-v19] Clearing cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        console.log('[SW-v19] All caches cleared');
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

  // Handle workflow save for offline
  if (event.data && event.data.type === 'SAVE_WORKFLOW_OFFLINE') {
    event.waitUntil(
      saveWorkflowOffline(event.data.workflow)
        .then(() => {
          event.source.postMessage({
            type: 'WORKFLOW_SAVED_OFFLINE',
            workflowId: event.data.workflow.id,
            timestamp: Date.now()
          });
        })
        .catch(err => {
          event.source.postMessage({
            type: 'WORKFLOW_SAVE_ERROR',
            workflowId: event.data.workflow.id,
            error: err.message
          });
        })
    );
  }

  // Handle workflow execution offline
  if (event.data && event.data.type === 'EXECUTE_WORKFLOW_OFFLINE') {
    event.waitUntil(
      executeWorkflowOffline(event.data.workflowId, event.data.executionId)
        .then(result => {
          event.source.postMessage({
            type: 'WORKFLOW_EXECUTION_COMPLETE',
            workflowId: event.data.workflowId,
            executionId: event.data.executionId,
            result: result
          });
        })
        .catch(err => {
          event.source.postMessage({
            type: 'WORKFLOW_EXECUTION_ERROR',
            workflowId: event.data.workflowId,
            executionId: event.data.executionId,
            error: err.message
          });
        })
    );
  }
});

// Save workflow data to cache
async function saveWorkflowOffline(workflow) {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(JSON.stringify(workflow), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put(`/offline/workflow/${workflow.id}`, response);
  console.log('[SW-v19] Workflow saved offline:', workflow.id);
}

// Execute workflow offline
async function executeWorkflowOffline(workflowId, executionId) {
  const cache = await caches.open(CACHE_NAME);
  const workflowResponse = await cache.match(`/offline/workflow/${workflowId}`);

  if (!workflowResponse) {
    throw new Error('Workflow not found in offline cache');
  }

  const workflow = await workflowResponse.json();

  // Process workflow nodes sequentially
  const results = {};
  for (const node of workflow.nodes || []) {
    try {
      // Simulate node execution (in real app, this would call actual services)
      results[node.id] = {
        status: 'completed',
        output: { result: 'mock_output' },
        timestamp: Date.now()
      };
    } catch (err) {
      results[node.id] = {
        status: 'error',
        error: err.message,
        timestamp: Date.now()
      };
    }
  }

  // Store execution result
  const executionResponse = new Response(JSON.stringify({
    id: executionId,
    workflowId: workflowId,
    status: 'completed',
    results: results,
    completedAt: Date.now()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put(`/offline/execution/${executionId}`, executionResponse);

  return { id: executionId, status: 'completed', results };
}

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
  console.log('[SW-v19] Running cache cleanup...');
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  // Keep only recent entries (last 100)
  if (keys.length > 100) {
    console.log('[SW-v19] Cache too large, clearing old entries');
    // For simplicity, we'll just clear all - a smarter implementation would delete oldest
    await cache.clear();
  }
}
