const CACHE_NAME = 'h75-v8';
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

// ─── Notifications ────────────────────────────────────────────────────────────

// Textes de rappel — un tiré au hasard à chaque notification.
const REMINDER_MESSAGES = [
  'As-tu validé ta journée ? Coche tes objectifs avant minuit.',
  'Ton streak compte sur toi — complète tes objectifs du jour.',
  'Encore quelques objectifs pour une journée parfaite.',
  'Eau, pas, sport, lecture… où en es-tu aujourd’hui ?',
  'N’oublie pas de valider ta journée H75.',
  'Un dernier effort : boucle tes objectifs avant ce soir.',
];

function pickMessage() {
  return REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
}

function showReminder(body) {
  return self.registration.showNotification('H75', {
    body: body || pickMessage(),
    icon: '/h75-192.png',
    badge: '/h75-192.png',
    tag: 'daily-reminder',
    renotify: true,
  });
}


// ─── Web Push (rappels serveur — marchent app/téléphone fermés) ────────────────
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(showReminder(payload.body));
});

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
