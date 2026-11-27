const CACHE = 'mahkama-v96-fix-black-screen';
const FILES = [
  './',
  './app.html',
  './manifest.json',
  './daira-core.js',
  './mahdar.html',
  './daira-config.html',
  './admin-dairat.html'
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
  if(e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent')){
    return;
  }
  // ل app.html و manifest - هات من النت الأول عشان الشاشة السودة متتخزنش
  if(e.request.url.includes('app.html') || e.request.url.includes('manifest.json') || e.request.url.includes('version.json')){
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).then(res => {
        if(res.ok && e.request.method === 'GET'){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(()=> caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok && e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(()=> caches.match('./app.html'));
    })
  );
});
