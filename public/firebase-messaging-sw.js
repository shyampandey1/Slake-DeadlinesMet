importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDzkJ_Y0y2BKRIHxUeslXLblxO-0wjMCx0",
  authDomain: "dealdlinesmet.firebaseapp.com",
  projectId: "dealdlinesmet",
  storageBucket: "dealdlinesmet.firebasestorage.app",
  messagingSenderId: "703127832822",
  appId: "1:703127832822:web:5138c41dff450efca084d7",
  measurementId: "G-ZSSHQ37TH2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Reminder';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Time to stay on track!',
    icon: '/icon.svg',
    actions: [
      {
        action: 'go_to_app',
        title: 'Go to App'
      }
    ],
    data: { url: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        // If so, just focus it.
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
