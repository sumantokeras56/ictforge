// ICT Forge — Service Worker v2.0
// Fixes: notifikasi, cache versioning aman (user data tidak reset), offline page

const CACHE_VERSION = 'ictforge-v2';
const FONT_CACHE = 'ictforge-fonts-v1';

// File yang di-precache (app shell saja)
const PRECACHE_URLS = [
  '/ictforge/',
  '/ictforge/index.html',
  '/ictforge/offline.html',
  '/ictforge/manifest.json'
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c =>
      c.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Precache partial fail (ok):', err);
      })
    )
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
// PENTING: Hanya hapus cache VERSI LAMA.
// localStorage / IndexedDB / journal user TIDAK ikut terhapus — aman.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      const toDelete = keys.filter(k =>
        k !== CACHE_VERSION && k !== FONT_CACHE
      );
      return Promise.all(toDelete.map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }));
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const method = e.request.method;

  // Bypass: non-GET, Anthropic API, external APIs
  if (method !== 'GET') return;
  if (url.includes('api.anthropic.com')) return;
  if (url.includes('newsdata.io')) return;
  if (url.includes('chrome-extension://')) return;

  // Google Fonts: cache-first (stabil, jarang berubah)
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(FONT_CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            c.put(e.request, res.clone());
            return res;
          });
        })
      ).catch(() => fetch(e.request))
    );
    return;
  }

  // App HTML (navigasi): network-first, fallback offline.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(cached =>
            cached || caches.match('/ictforge/offline.html')
          )
        )
    );
    return;
  }

  // Asset lain (JS, CSS, gambar): network-first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'ICT Forge', body: 'Ada update dari ICT Forge!' };
  try {
    if (e.data) data = e.data.json();
  } catch (_) {
    if (e.data) data.body = e.data.text();
  }

  const options = {
    body: data.body || 'Notifikasi dari ICT Forge',
    icon: '/ictforge/icon-192.png',
    badge: '/ictforge/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'ictforge-notif',
    renotify: true,
    data: { url: data.url || '/ictforge/' }
  };

  e.waitUntil(
    self.registration.showNotification(data.title || 'ICT Forge', options)
  );
});

// ─── NOTIFICATION CLICK ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url)
    ? e.notification.data.url
    : '/ictforge/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('/ictforge/') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});

// ─── MESSAGE: TEST NOTIFIKASI dari halaman ───────────────────────────────────
// Dipanggil dari index.html via: navigator.serviceWorker.controller.postMessage(...)
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title || 'ICT Forge', {
      body: body || 'Test notifikasi berhasil! 🔔',
      icon: '/ictforge/icon-192.png',
      badge: '/ictforge/icon-192.png',
      vibrate: [200, 100, 200],
      tag: tag || 'ictforge-test',
      renotify: true
    });
  }

  // Skip waiting (force update)
  if (e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
