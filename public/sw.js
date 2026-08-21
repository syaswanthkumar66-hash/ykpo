self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: data.url
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data)
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName === 'pdf-cache-v1') {
            console.log('Deleting old corrupted PDF cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the updated SW takes control immediately
  self.clients.claim();
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

