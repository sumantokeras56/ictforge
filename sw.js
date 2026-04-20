// ICT Forge — Service Worker v3.1
// ✅ Fix: notifikasi HP (showNotification via SW, bukan new Notification)
// ✅ Fix: data user (journal, checklist, COT) TIDAK terhapus saat update
// ✅ Fix: path /ictforge/, tambah JS/CSS ke precache
// ✅ v11: Mistake Tags REMOVED + Payout Board + Relax FAB (force refresh)
// ✅ v12: Precache lengkap — semua JS module + 16 tab HTML untuk offline penuh

const CACHE_VERSION  = 'ictforge-v13';
const FONT_CACHE     = 'ictforge-fonts-v1';

// ─── PENTING: localStorage user TIDAK terdampak oleh cache apapun.
// Yang kita manage hanya Cache Storage (app shell files).
// Journal, checklist, COT, settings = localStorage → SELALU AMAN.

const PRECACHE_URLS = [
  // App shell
  '/ictforge/',
  '/ictforge/index.html',
  '/ictforge/offline.html',
  '/ictforge/manifest.json',
  '/ictforge/style.css',
  // JS modules (semua yang di-load oleh index.html)
  '/ictforge/main.js',
  '/ictforge/app-core.js',
  '/ictforge/journal-enhanced.js',
  '/ictforge/payout-relax.js',
  '/ictforge/economic-news.js',
  '/ictforge/realtime-news.js',
  // Tab HTML (lazy-loaded — tanpa ini, offline user tidak bisa buka tab)
  '/ictforge/tabs/overview.html',
  '/ictforge/tabs/foundational.html',
  '/ictforge/tabs/structure.html',
  '/ictforge/tabs/liquidity.html',
  '/ictforge/tabs/pd-arrays.html',
  '/ictforge/tabs/amd.html',
  '/ictforge/tabs/killzones.html',
  '/ictforge/tabs/8am-strategy.html',
  '/ictforge/tabs/models.html',
  '/ictforge/tabs/calculator.html',
  '/ictforge/tabs/checklist.html',
  '/ictforge/tabs/cot.html',
  '/ictforge/tabs/calendar.html',
  '/ictforge/tabs/journal.html',
  '/ictforge/tabs/glossary.html',
  '/ictforge/tabs/indicators.html',
  '/ictforge/tabs/pinescript.html',
  '/ictforge/tabs/ictforge-ai.html'
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // Cache satu-per-satu agar 1 file gagal tidak bikin precache batal total.
      // (cache.addAll() rejects jika ada 1 file gagal — kita mau toleran).
      return Promise.all(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Precache skip:', url, err.message);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
// Hanya hapus cache VERSI LAMA — localStorage user TIDAK tersentuh sama sekali.
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
  const url    = e.request.url;
  const method = e.request.method;

  if (method !== 'GET') return;
  // Bypass external API calls — jangan di-cache (data live, private, atau CORS-sensitive)
  if (url.includes('api.anthropic.com'))  return;
  if (url.includes('api.groq.com'))       return;   // Groq API (PineScript AI Fixer)
  if (url.includes('newsdata.io'))        return;
  if (url.includes('workers.dev'))        return;   // Cloudflare Workers proxy
  if (url.includes('chrome-extension://')) return;

  // Google Fonts: cache-first
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

  // App HTML: network-first, fallback offline.html
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

  // JS / CSS / assets: network-first, fallback cache
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

  e.waitUntil(
    self.registration.showNotification(data.title || 'ICT Forge', {
      body:    data.body    || 'Notifikasi dari ICT Forge',
      icon:    '/ictforge/icon-192.png',
      badge:   '/ictforge/icon-192.png',
      vibrate: [200, 100, 200],
      tag:     data.tag     || 'ictforge-notif',
      renotify: true,
      data:    { url: data.url || '/ictforge/' }
    })
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

// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────
// ✅ FIX NOTIFIKASI HP: Semua notifikasi dikirim via SW showNotification
// (new Notification() tidak berfungsi di background/HP — harus via SW)
self.addEventListener('message', e => {
  if (!e.data) return;

  // Notifikasi sesi / news — dipanggil dari main.js
  if (e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, icon } = e.data;
    e.waitUntil(
      self.registration.showNotification(title || 'ICT Forge', {
        body:    body    || 'Notifikasi dari ICT Forge 🔔',
        icon:    icon    || '/ictforge/icon-192.png',
        badge:   '/ictforge/icon-192.png',
        vibrate: [200, 100, 200],
        tag:     tag     || 'ictforge-notif',
        renotify: true,
        data:    { url: '/ictforge/' }
      })
    );
  }

  // Force update SW
  if (e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

