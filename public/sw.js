const CACHE_NAME = 'h75-v6';
const STATIC_ASSETS = ['/', '/dashboard', '/food', '/stats'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Notification scheduling ──────────────────────────────────────────────────

let reminderTimeout = null;

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_REMINDER') {
    const { time, enabled } = event.data;
    if (reminderTimeout) clearTimeout(reminderTimeout);
    if (enabled && time) scheduleReminder(time);
  }
});

function scheduleReminder(reminderTime) {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  let delay = target.getTime() - now.getTime();
  if (delay < 0) delay += 24 * 60 * 60 * 1000; // tomorrow

  reminderTimeout = setTimeout(() => {
    self.registration.showNotification('H75 🔥', {
      body: 'As-tu complété tous tes objectifs du jour ?',
      icon: '/h75-192.png',
      badge: '/h75-192.png',
      tag: 'daily-reminder',
    });
    // Re-schedule for next day
    scheduleReminder(reminderTime);
  }, delay);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/dashboard')) return client.focus();
      }
      return self.clients.openWindow('/dashboard');
    })
  );
});
