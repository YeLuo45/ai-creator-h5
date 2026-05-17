/**
 * Offline Queue Service
 * IndexedDB-based offline request queue with automatic retry on reconnection
 */

const OfflineQueue = (function() {
  const DB_NAME = 'ai-creator-offline';
  const DB_VERSION = 1;
  const STORE_NAME = 'queue';
  let db = null;
  let isProcessing = false;
  let networkStatus = navigator.onLine;

  // Initialize IndexedDB
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineQueue] DB open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        db = request.result;
        console.log('[OfflineQueue] DB initialized');
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          console.log('[OfflineQueue] Object store created');
        }
      };
    });
  }

  // Get DB instance
  async function getDB() {
    if (!db) {
      await initDB();
    }
    return db;
  }

  // Add request to queue
  async function addToQueue(requestData) {
    try {
      const database = await getDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const queueItem = {
        ...requestData,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      };

      const request = store.add(queueItem);
      request.onsuccess = () => {
        console.log('[OfflineQueue] Item added, id:', request.result);
      };

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('[OfflineQueue] Add to queue error:', err);
      throw err;
    }
  }

  // Get all pending items
  async function getPendingItems() {
    try {
      const database = await getDB();
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('[OfflineQueue] Get pending items error:', err);
      return [];
    }
  }

  // Update item status
  async function updateItemStatus(id, status, result = null) {
    try {
      const database = await getDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
            item.status = status;
            item.result = result;
            item.processedAt = Date.now();
            const putRequest = store.put(item);
            putRequest.onsuccess = () => resolve(item);
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            reject(new Error('Item not found'));
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (err) {
      console.error('[OfflineQueue] Update status error:', err);
      throw err;
    }
  }

  // Remove item from queue
  async function removeItem(id) {
    try {
      const database = await getDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('[OfflineQueue] Remove item error:', err);
      throw err;
    }
  }

  // Clear all queue items
  async function clearQueue() {
    try {
      const database = await getDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('[OfflineQueue] Queue cleared');
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('[OfflineQueue] Clear queue error:', err);
      throw err;
    }
  }

  // Get queue status
  async function getQueueStatus() {
    try {
      const database = await getDB();
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const countRequest = store.count();

      return new Promise((resolve, reject) => {
        countRequest.onsuccess = () => {
          const pendingRequest = store.index('status').count('pending');
          pendingRequest.onsuccess = () => {
            resolve({
              total: countRequest.result,
              pending: pendingRequest.result,
              isOnline: networkStatus,
              isProcessing: isProcessing
            });
          };
          pendingRequest.onerror = () => reject(pendingRequest.error);
        };
        countRequest.onerror = () => reject(countRequest.error);
      });
    } catch (err) {
      console.error('[OfflineQueue] Get status error:', err);
      return { total: 0, pending: 0, isOnline: networkStatus, isProcessing: false };
    }
  }

  // Process queue items
  async function processQueue() {
    if (isProcessing || !networkStatus) {
      console.log('[OfflineQueue] Skip processing - isProcessing:', isProcessing, 'isOnline:', networkStatus);
      return { processed: 0, failed: 0 };
    }

    isProcessing = true;
    let processed = 0;
    let failed = 0;

    try {
      const items = await getPendingItems();
      console.log('[OfflineQueue] Processing', items.length, 'items');

      for (const item of items) {
        if (!navigator.onLine) {
          console.log('[OfflineQueue] Went offline, stopping');
          break;
        }

        try {
          console.log('[OfflineQueue] Processing item:', item.id, item.type);

          // Dispatch to appropriate service based on type
          let result = null;
          if (item.type === 'image') {
            result = await processImageRequest(item);
          } else if (item.type === 'music') {
            result = await processMusicRequest(item);
          } else if (item.type === 'tts') {
            result = await processTTSRequest(item);
          }

          await updateItemStatus(item.id, 'completed', result);
          processed++;
          console.log('[OfflineQueue] Item completed:', item.id);

        } catch (err) {
          console.error('[OfflineQueue] Item failed:', item.id, err);
          await updateItemStatus(item.id, 'failed', { error: err.message });
          failed++;
        }
      }

      console.log('[OfflineQueue] Processing complete - processed:', processed, 'failed:', failed);

    } catch (err) {
      console.error('[OfflineQueue] Process queue error:', err);
    } finally {
      isProcessing = false;
    }

    return { processed, failed };
  }

  // Process image request
  async function processImageRequest(item) {
    const { generateImage } = await import('./imageService.js');
    const res = await generateImage({
      prompt: item.prompt,
      style: item.params.style,
      size: item.params.size
    });
    const url = res.data?.[0]?.url;
    if (!url) throw new Error('Image generation failed');
    return { url, revised_prompt: res.data?.[0]?.revised_prompt };
  }

  // Process music request
  async function processMusicRequest(item) {
    const { generateFullMusic } = await import('./musicService.js');
    const res = await generateFullMusic({
      prompt: item.prompt,
      genre: item.params.genre,
      duration: item.params.duration
    });
    return res;
  }

  // Process TTS request
  async function processTTSRequest(item) {
    const { generateSpeech, saveB64AudioAsDataUrl } = await import('./ttsService.js');
    const res = await generateSpeech({
      input: item.prompt,
      voice: item.params.voice,
      format: 'mp3'
    });
    if (!res.b64_audio) throw new Error('TTS generation failed');
    const dataUrl = saveB64AudioAsDataUrl(res.b64_audio, 'mp3');
    return { filePath: dataUrl };
  }

  // Handle online event
  function handleOnline() {
    console.log('[OfflineQueue] Network online');
    networkStatus = true;

    // Dispatch event for UI update
    window.dispatchEvent(new CustomEvent('offlineQueue:statusChange', {
      detail: { isOnline: true }
    }));

    // Process queue after a short delay
    setTimeout(() => {
      processQueue().then(({ processed, failed }) => {
        if (processed > 0) {
          window.dispatchEvent(new CustomEvent('offlineQueue:processed', {
            detail: { processed, failed }
          }));
        }
      });
    }, 1000);
  }

  // Handle offline event
  function handleOffline() {
    console.log('[OfflineQueue] Network offline');
    networkStatus = false;

    window.dispatchEvent(new CustomEvent('offlineQueue:statusChange', {
      detail: { isOnline: false }
    }));
  }

  // Setup network listeners
  function setupNetworkListeners() {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    console.log('[OfflineQueue] Network listeners registered');
  }

  // Initialize
  async function init() {
    await initDB();
    setupNetworkListeners();

    // If online and have pending items, process them
    if (navigator.onLine) {
      setTimeout(() => processQueue(), 2000);
    }

    console.log('[OfflineQueue] Service initialized');
  }

  // Start initialization
  init().catch(console.error);

  // Public API
  return {
    addToQueue,
    processQueue,
    getQueueStatus,
    clearQueue,
    getDB
  };
})();

// Export for global access
window.OfflineQueue = OfflineQueue;