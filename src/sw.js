// src/sw.js
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Cache external libraries (ZXing, etc.)
registerRoute(
  ({ url }) => url.origin === 'https://cdnjs.cloudflare.com',
  new CacheFirst({
    cacheName: 'external-libs',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Cache API responses with stale-while-revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Handle background sync for offline barcode storage
self.addEventListener('sync', (event) => {
  if (event.tag === 'barcode-sync') {
    event.waitUntil(syncBarcodes());
  }
});

async function syncBarcodes() {
  try {
    // Get stored barcodes from IndexedDB
    const barcodes = await getStoredBarcodes();
    
    // Sync with server when online
    if (barcodes.length > 0) {
      await fetch('/api/sync-barcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barcodes)
      });
      
      // Clear synced barcodes
      await clearStoredBarcodes();
    }
  } catch (error) {
    console.error('Barcode sync failed:', error);
  }
}

// IndexedDB helpers for offline barcode storage
async function getStoredBarcodes() {
  return new Promise((resolve) => {
    const request = indexedDB.open('BarcodeDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['barcodes'], 'readonly');
      const store = transaction.objectStore('barcodes');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
    };
  });
}

async function clearStoredBarcodes() {
  return new Promise((resolve) => {
    const request = indexedDB.open('BarcodeDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['barcodes'], 'readwrite');
      const store = transaction.objectStore('barcodes');
      store.clear();
      transaction.oncomplete = () => resolve();
    };
  });
}

// Handle push notifications for barcode updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'barcode-update') {
      event.waitUntil(
        self.registration.showNotification('Barcode Scanner', {
          body: data.message,
          icon: '/icons/icon-192.png',
          badge: '/icons/favicon.svg',
          vibrate: [200, 100, 200],
          tag: 'barcode-notification',
          actions: [
            {
              action: 'view',
              title: 'View Details'
            }
          ]
        })
      );
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Skip waiting and claim clients immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim all clients when activated
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});