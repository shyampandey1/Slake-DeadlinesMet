const CACHE_NAME = 'slake-offline-cache-v2';

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      
      const title = payload.title || "DeadlinesMet Notifications";
      const options = {
        body: payload.body || "Time to focus!",
        icon: "/icon", // Using the new clock icon
        badge: "/icon",
        data: {
          // If the payload contains a 'url', we store it entirely here to navigate the client on click
          url: payload.url || "/",
        },
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Error parsing push payload", e);
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || "/";

  // If a specific activity type is provided without a URL, map it
  if (!notificationData.url && notificationData.type) {
    switch (notificationData.type.toUpperCase()) {
      case 'REFORMERS': 
      case 'LEAGUE':
        targetUrl = "/reformers"; 
        break;
      case 'CALENDAR': 
      case 'PLANNER':
        targetUrl = "/calendar"; 
        break;
      case 'REWARDS': 
      case 'COINS':
        targetUrl = "/rewards"; 
        break;
      case 'HISTORY': 
        targetUrl = "/history"; 
        break;
      case 'SETTINGS': 
        targetUrl = "/settings"; 
        break;
      case 'TIMER':
        targetUrl = "/";
        break;
    }
  }

  // Convert relative URLs to absolute
  if (targetUrl.startsWith('/')) {
    targetUrl = self.location.origin + targetUrl;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 1. Try to find an existing window of our app
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          return client.focus().then(() => {
            // Only navigate if we're not already there to avoid unnecessary reloads
            if (client.url !== targetUrl) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      
      // 2. If no window is found, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (!url.origin.startsWith(self.location.origin)) return;

  // Next.js static assets and images should be Cache-First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/images/') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Everything else is Network-First, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
           const responseToCache = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, responseToCache);
           });
        }
        return networkResponse;
      })
      .catch(async (error) => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === 'navigate') {
          const rootCache = await caches.match('/');
          if (rootCache) return rootCache;
        }
        throw error;
      })
  );
});
