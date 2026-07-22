const CACHE_NAME = 'ync-v1';
const STATIC_ASSETS = [
  '/',
  '/events',
  '/login',
  '/register',
];

// Install event — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate event — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — network first, fallback to cache, never throw
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(cached => cached || new Response('', { status: 503 }));
    })
  );
});

// Push event — display notification
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? JSON.parse(event.data.text()) : {};
  } catch (e) {
    data = { title: 'YNC', message: event.data?.text() || 'New notification' };
  }

  const options = {
    title: data.title || 'YNC',
    body: data.message || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click — open URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
