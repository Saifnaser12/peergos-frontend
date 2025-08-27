// Peergos Service Worker for Offline Capabilities
const CACHE_NAME = 'peergos-v1';
const STATIC_CACHE = 'peergos-static-v1';
const DATA_CACHE = 'peergos-data-v1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/users/me',
  '/api/notifications',
  '/api/kpi-data',
  '/api/chart-of-accounts'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_FILES);
      }),
      caches.open(DATA_CACHE)
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static files
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with cache-first strategy for read operations
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(DATA_CACHE);
  
  try {
    // For GET requests, try cache first
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      
      // If cached and offline, return cached version
      if (cachedResponse && !navigator.onLine) {
        return cachedResponse;
      }
      
      // Try network first, fallback to cache
      try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
          // Cache successful GET responses
          if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
            await cache.put(request, networkResponse.clone());
          }
        }
        
        return networkResponse;
      } catch (error) {
        console.log('Network failed, serving from cache:', url.pathname);
        return cachedResponse || new Response(
          JSON.stringify({ 
            error: 'Offline - data not available',
            offline: true 
          }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // For POST/PUT/DELETE, try network only
    const networkResponse = await fetch(request);
    
    // If network fails, store for later sync
    if (!networkResponse.ok && request.method !== 'GET') {
      await storeFailedRequest(request);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('API request failed:', error);
    
    // For failed POST requests, store for later sync
    if (request.method !== 'GET') {
      await storeFailedRequest(request);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Request saved for later sync',
          offline: true 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For GET requests, try to serve from cache
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response(
      JSON.stringify({ 
        error: 'Offline - data not available',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    // Try network first for HTML files to get updates
    if (request.url.includes('.html') || request.url.endsWith('/')) {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
          return networkResponse;
        }
      } catch (error) {
        console.log('Network failed for HTML, serving from cache');
      }
    }
    
    // Check cache first for other static files
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network if not in cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response(
      'Offline - resource not available',
      { status: 503 }
    );
  }
}

// Store failed requests for later sync
async function storeFailedRequest(request) {
  try {
    const body = await request.text();
    const failedRequest = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    };
    
    // Store in IndexedDB for later sync
    const db = await openDB();
    const transaction = db.transaction(['failed_requests'], 'readwrite');
    const store = transaction.objectStore('failed_requests');
    await store.add(failedRequest);
    
    console.log('Stored failed request for later sync:', request.url);
  } catch (error) {
    console.error('Failed to store request:', error);
  }
}

// Open IndexedDB for storing failed requests
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PeergosOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('failed_requests')) {
        const store = db.createObjectStore('failed_requests', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncFailedRequests());
  }
});

// Sync failed requests when back online
async function syncFailedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['failed_requests'], 'readonly');
    const store = transaction.objectStore('failed_requests');
    const requests = await store.getAll();
    
    for (const failedRequest of requests) {
      try {
        const response = await fetch(failedRequest.url, {
          method: failedRequest.method,
          headers: failedRequest.headers,
          body: failedRequest.body
        });
        
        if (response.ok) {
          // Remove successfully synced request
          const deleteTransaction = db.transaction(['failed_requests'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('failed_requests');
          await deleteStore.delete(failedRequest.id);
          
          console.log('Successfully synced failed request:', failedRequest.url);
        }
      } catch (error) {
        console.log('Failed to sync request, will retry later:', failedRequest.url);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_NOW') {
    syncFailedRequests();
  }
});