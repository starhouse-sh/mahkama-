const CACHE = 'mahkama-v18-7-manifest-password';
const FILES = [
  './',
  './index.html',
  './select-daira.html',
  './daira-config.html',
  './taalia.html',
  './galasat.html',
  './mahdar.html',
  './ahkam.html',
  './estelam.html',
  './mofradat.html',
  './kashf.html',
  './rolat.html',
  './tadeil.html',
  './edkhal.html',
  './manifest.json',
  './daira-core.js',
  './pwa-install.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // للدرايف سيب النت يشتغل عادي، متخزنهوش
  if(e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent')){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        // خزن النسخة الجديدة
        if(res.ok && e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(()=> caches.match('./index.html'));
    })
  );
});
