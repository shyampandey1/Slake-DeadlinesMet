const CACHE_NAME = 'slake-offline-cache-v2';
const scheduledTimers = new Map();

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

// Communication channel for background timers & task schedules
self.addEventListener("message", (event) => {
  if (!event.data) return;

  // 1. Active Focus Session Timer Scheduling
  if (event.data.type === "SCHEDULE_TIMER") {
    const { taskName, endTime } = event.data;
    if (scheduledTimers.has("active-timer")) {
      clearTimeout(scheduledTimers.get("active-timer"));
    }
    const delay = Math.max(0, endTime - Date.now());
    const timerId = setTimeout(() => {
      self.registration.showNotification("Session Complete!", {
        body: `Time's up! You've finished: ${taskName || 'Focus Session'}`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: "timer-done",
        vibrate: [200, 100, 200],
        data: {
          url: "/timer?from_notification=true",
          type: "TIMER",
        },
        requireInteraction: true,
      });
      scheduledTimers.delete("active-timer");
    }, delay);
    scheduledTimers.set("active-timer", timerId);
  }

  // 2. Cancel Active Timer Notification
  if (event.data.type === "CANCEL_TIMER") {
    if (scheduledTimers.has("active-timer")) {
      clearTimeout(scheduledTimers.get("active-timer"));
      scheduledTimers.delete("active-timer");
    }
  }

  // 3. Scheduled Calendar Task Alert
  if (event.data.type === "SCHEDULE_TASK") {
    const { id, name, time, duration } = event.data;
    const tag = `task-${id}`;
    if (scheduledTimers.has(tag)) {
      clearTimeout(scheduledTimers.get(tag));
    }
    const delay = Math.max(0, time - Date.now());
    const timerId = setTimeout(() => {
      self.registration.showNotification(`Upcoming Task: ${name}`, {
        body: `Your scheduled task "${name}" (${duration || 25} min) starts now!`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: tag,
        vibrate: [200, 100, 200],
        data: {
          url: "/calendar?from_notification=true",
          type: "CALENDAR",
        },
        requireInteraction: true,
      });
      scheduledTimers.delete(tag);
    }, delay);
    scheduledTimers.set(tag, timerId);
  }
});

// Incoming Web Push Notifications (including Firebase Cloud Messaging)
self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      
      const title = payload.notification?.title || payload.data?.title || payload.title || "DeadlinesMet Notifications";
      const body = payload.notification?.body || payload.data?.body || payload.body || "Time to focus!";
      const targetUrl = payload.data?.url || payload.url || "/";

      const options = {
        body: body,
        icon: "/icon.svg",
        badge: "/icon.svg",
        vibrate: [200, 100, 200],
        data: {
          url: targetUrl,
          type: payload.data?.type || payload.type || "DEFAULT",
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
