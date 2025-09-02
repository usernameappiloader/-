// ===== SERVICE WORKER FOR PWA AND OFFLINE MODE =====

const CACHE_NAME = 'mr-dev-tech-v1.0.0';
const STATIC_CACHE = 'mr-dev-tech-static-v1.0.0';
const DYNAMIC_CACHE = 'mr-dev-tech-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/responsive.css',
  '/js/main.js',
  '/js/firebase-init.js',
  '/js/firestore-storage.js',
  '/images/icon.png',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API requests (Firebase)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(request.url) || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle HTML pages
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default strategy for other resources
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Cache-first strategy for static assets
function cacheFirstStrategy(request) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        return response;
      }
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          return caches.open(STATIC_CACHE)
            .then((cache) => {
              cache.put(request, responseToCache);
              return response;
            });
        });
    });
}

// Network-first strategy for dynamic content
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200) {
        throw new Error('Network response was not ok');
      }
      const responseToCache = response.clone();
      return caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          cache.put(request, responseToCache);
          return response;
        });
    })
    .catch(() => {
      return caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          // Return offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    });
}

// Stale-while-revalidate strategy
function staleWhileRevalidateStrategy(request) {
  return caches.match(request)
    .then((response) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, networkResponse.clone());
              });
          }
          return networkResponse;
        })
        .catch(() => response); // Return cached version if network fails

      return response || fetchPromise;
    });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'Nouvelle mise à jour disponible!',
    icon: '/images/icon.png',
    badge: '/images/icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/images/icon.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'MR.DEV-TECH',
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync any pending offline actions
    console.log('[SW] Performing background sync');

    // You can implement specific sync logic here
    // For example, sync download counts, user preferences, etc.

  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Periodic cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCaches();
  }
});

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name =>
    name !== STATIC_CACHE &&
    name !== DYNAMIC_CACHE &&
    name.startsWith('mr-dev-tech')
  );

  await Promise.all(oldCaches.map(cache => caches.delete(cache)));
  console.log('[SW] Old caches cleaned');
}
