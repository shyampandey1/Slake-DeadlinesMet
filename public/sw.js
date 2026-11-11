const CACHE_NAME = 'slake-offline-cache-v4.0';
const scheduledTimers = new Map();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Communication channel for local/in-session background timers & task schedules
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // 1. Active Focus Session Timer Scheduling
  if (event.data.type === 'SCHEDULE_TIMER') {
    const { taskName, endTime } = event.data;
    if (scheduledTimers.has('active-timer')) {
      clearTimeout(scheduledTimers.get('active-timer'));
    }
    const delay = Math.max(0, endTime - Date.now());
    const timerId = setTimeout(() => {
      self.registration.showNotification('Session Complete!', {
        body: `Time's up! You've finished: ${taskName || 'Focus Session'}`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'timer-done',
        vibrate: [200, 100, 200],
        data: {
          url: '/timer?from_notification=true',
          type: 'TIMER',
        },
        requireInteraction: true,
      });
      scheduledTimers.delete('active-timer');
    }, delay);
    scheduledTimers.set('active-timer', timerId);
  }

  // 2. Cancel Active Timer Notification
  if (event.data.type === 'CANCEL_TIMER') {
    if (scheduledTimers.has('active-timer')) {
      clearTimeout(scheduledTimers.get('active-timer'));
      scheduledTimers.delete('active-timer');
    }
  }

  // 3. Scheduled Calendar Task Alert
  if (event.data.type === 'SCHEDULE_TASK') {
    const { id, name, time, duration } = event.data;
    const tag = `task-${id}`;
    if (scheduledTimers.has(tag)) {
      clearTimeout(scheduledTimers.get(tag));
    }
    const delay = Math.max(0, time - Date.now());
    const timerId = setTimeout(() => {
      self.registration.showNotification(`Upcoming Task: ${name}`, {
        body: `Your scheduled task "${name}" (${duration || 25} min) starts now!`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag,
        vibrate: [200, 100, 200],
        data: {
          url: '/calendar?from_notification=true',
          type: 'CALENDAR',
        },
        requireInteraction: true,
      });
      scheduledTimers.delete(tag);
    }, delay);
    scheduledTimers.set(tag, timerId);
  }

  // 4. Scheduled Routine Task Alert
  if (event.data.type === 'SCHEDULE_ROUTINE_TASK') {
    const { id, name, time, duration, category } = event.data;
    const tag = `routine-${id || name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (scheduledTimers.has(tag)) {
      clearTimeout(scheduledTimers.get(tag));
    }
    const delay = Math.max(0, time - Date.now());
    const launchUrl = `/timer?task=${encodeURIComponent(name)}&duration=${duration || 15}&category=${encodeURIComponent(category || 'General')}&autoStart=true`;
    const timerId = setTimeout(() => {
      self.registration.showNotification(`⏰ Scheduled Task: ${name}`, {
        body: `Ready for "${name}" (${duration || 15} min)? Tap to start your focus session now!`,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag,
        vibrate: [200, 100, 200],
        data: {
          url: launchUrl,
          type: 'ROUTINE_TASK',
          taskName: name,
          category,
        },
        requireInteraction: true,
      });
      scheduledTimers.delete(tag);
    }, delay);
    scheduledTimers.set(tag, timerId);
  }
});

// Single authoritative Web Push listener (works closed-app, offline/waking, Android, iOS PWA, Desktop)
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      try {
        payload = { body: event.data.text() };
      } catch {
        payload = {};
      }
    }
  }

  const notif = payload.notification || payload.FCM_MSG?.notification || {};
  const data = payload.data || payload.FCM_MSG?.data || {};

  const title =
    data.title ||
    notif.title ||
    payload.title ||
    'DeadlinesMet Routine Alert';

  const body =
    data.body ||
    notif.body ||
    payload.body ||
    'Time to conquer your scheduled task!';

  const targetUrl =
    data.url ||
    payload.fcmOptions?.link ||
    payload.FCM_MSG?.fcmOptions?.link ||
    notif.click_action ||
    payload.url ||
    '/';

  const options = {
    body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: data.tag || notif.tag || 'routine-nudge',
    data: {
      url: targetUrl,
      type: data.type || payload.type || 'ROUTINE_TASK',
      ...data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const fcmMsg = notificationData.FCM_MSG || {};
  let targetUrl =
    notificationData.url ||
    fcmMsg.data?.url ||
    fcmMsg.fcmOptions?.link ||
    fcmMsg.notification?.click_action ||
    '/';

  if (targetUrl === '/' && notificationData.type) {
    switch (String(notificationData.type).toUpperCase()) {
      case 'REFORMERS':
      case 'LEAGUE':
        targetUrl = '/reformers';
        break;
      case 'CALENDAR':
      case 'PLANNER':
        targetUrl = '/calendar';
        break;
      case 'REWARDS':
      case 'COINS':
        targetUrl = '/rewards';
        break;
      case 'HISTORY':
        targetUrl = '/history';
        break;
      case 'SETTINGS':
        targetUrl = '/settings';
        break;
      case 'TIMER':
      case 'ROUTINE_TASK':
        targetUrl = '/timer';
        break;
    }
  }

  if (targetUrl.startsWith('/')) {
    targetUrl = self.location.origin + targetUrl;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          return client.focus().then(() => {
            if (client.url !== targetUrl && 'navigate' in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }

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

  // Never cache API calls or SW scripts themselves
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js' || url.pathname === '/firebase-messaging-sw.js') {
    return;
  }

  // Next.js static assets and images should be Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => new Response('', { status: 404 }));
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
