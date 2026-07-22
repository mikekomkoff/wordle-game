const CACHE_NAME = 'wordle-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/game.js',
    '/words.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            for (const client of clients) {
                if (client.url.includes('/') && 'focus' in client) return client.focus();
            }
            return self.clients.openWindow('/');
        })
    );
});

self.addEventListener('message', e => {
    if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
        const delay = e.data.delay;
        setTimeout(() => {
            self.registration.showNotification('Вордли', {
                body: 'Новое слово дня уже ждёт тебя!',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🟦</text></svg>',
                tag: 'new-word',
                requireInteraction: false
            });
        }, delay);
    }
});
