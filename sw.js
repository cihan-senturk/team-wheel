// Takım Çarkı – service worker (çevrimdışı destek)
//
// Strateji: "önce ağ". İnternet varsa her zaman en güncel dosyalar sunucudan alınır ve
// önbellek güncellenir; böylece yeni bir sürüm yüklendiğinde kullanıcılar onu hemen görür.
// İnternet yoksa en son başarıyla alınan kopya önbellekten gösterilir.
// Uygulamanın verileri (oyuncular, lig) zaten tarayıcıda saklanır; buraya girmez.

const CACHE = 'team-wheel-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  // Eski sürümlerin önbelleklerini temizle.
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Yalnızca bu sitenin GET isteklerine karış (paylaşım bağlantıları vb. dokunulmaz).
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
          .then(hit => hit || Response.error())
      )
  );
});
