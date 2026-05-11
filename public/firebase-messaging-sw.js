importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDzkJ_Y0y2BKRIHxUeslXLblxO-0wjMCx0",
  authDomain: "dealdlinesmet.firebaseapp.com",
  projectId: "dealdlinesmet",
  storageBucket: "dealdlinesmet.firebasestorage.app",
  messagingSenderId: "703127832822",
  appId: "1:703127832822:web:5138c41dff450efca084d7",
  measurementId: "G-ZSSHQ37TH2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/icon.png',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: payload.notification?.tag || payload.data?.tag || 'default',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || '/';

  // Ensure absolute URL
  if (targetUrl.startsWith('/')) {
    targetUrl = self.location.origin + targetUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      console.log('[firebase-messaging-sw.js] Found windows:', windowClients.length);
      
      // 1. Try to find an existing window with the exact URL
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          console.log('[firebase-messaging-sw.js] Found exact match, focusing...');
          return client.focus();
        }
      }

      // 2. If no exact match, try to find any window on the same origin
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client && 'navigate' in client) {
          console.log('[firebase-messaging-sw.js] Found origin match, navigating and focusing...');
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      
      // 3. If not found, open new window
      if (clients.openWindow) {
        console.log('[firebase-messaging-sw.js] Opening new window for:', targetUrl);
        return clients.openWindow(targetUrl);
      }
    })
  );
});
