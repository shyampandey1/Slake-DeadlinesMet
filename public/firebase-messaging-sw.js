importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore-compat.js');

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

messaging.onBackgroundMessage(async (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Reminder';
  let notificationBody = payload.notification?.body || payload.data?.body || 'Time to stay on track!';
  
  // Tag-based distinct logic
  const tag = payload.data?.tag || payload.notification?.tag || 'default-reformer-tag';
  
  // Social Motivation Logic for Hydration
  if (tag === 'hydration-reminder' || notificationTitle.toLowerCase().includes('hydration')) {
    try {
      // We use the compat SDK already initialized
      const db = firebase.firestore();
      const leaderSnap = await db.collection('reformer_stats').doc('hydration_leader').get();
      if (leaderSnap.exists) {
        const leaderData = leaderSnap.data();
        const leaderName = leaderData.name || 'A top performer';
        // Assuming we might have user info in payload or we just use a generic 'you'
        notificationBody = `Hey, ${leaderName} is leading the hydration league! 💧 Drink up to catch them.`;
      }
    } catch (e) {
      console.error('Failed to fetch social motivation data', e);
    }
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: tag,
    requireInteraction: true,
    priority: 'high',
    actions: [
      {
        action: 'go_to_app',
        title: 'Go to App'
      }
    ],
    data: { 
      url: payload.data?.url || '/',
      ...payload.data 
    }
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
