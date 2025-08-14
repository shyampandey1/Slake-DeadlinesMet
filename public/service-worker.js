
// A simple, no-op service worker that exists to allow us to display
// web-based notifications.

self.addEventListener('install', (event) => {
    // This is a no-op, but it's good practice to have an install event listener.
    // It can be used for pre-caching assets in a more advanced PWA.
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        // Try to find a focused client first.
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        // If we found a client, focus it.
        if (client) {
            return client.focus();
        }
      }
      // If no client is found or focused, open a new window.
      return clients.openWindow(urlToOpen);
    })
  );
});
