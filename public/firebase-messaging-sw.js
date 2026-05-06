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
      // 1. Try to find an existing window and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 2. If not found, open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
