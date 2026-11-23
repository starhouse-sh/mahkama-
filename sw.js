const CACHE = 'mahkama-v5-fix-nesting';
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
  './ehsaiat.html',
  './ehsaia-esbaia.html',
  './SANAWAT-QADAIYA.html',
  './ealan.html',
  './manifest.json',
  './daira-core.js',
  './pwa-install.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES).catch(err => {
      console.log('cache add fail', err);
      return cache.addAll(['./','./index.html','./manifest.json']);
    })).then(()=> self.skipWaiting())
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
  const url = e.request.url;
  // سيب طلبات الدرايف للنت فقط - متخزنهاش
  if(url.includes('script.google.com') || url.includes('googleusercontent') || url.includes('google.com')){
    return;
  }
  
  // لو الطلب لصفحة HTML فرعية - رجعها من الكاش بس، مترجعش index.html
  if(e.request.destination === 'document' || e.request.headers.get('accept')?.includes('text/html')){
    e.respondWith(
      caches.match(e.request).then(cached => {
        if(cached) return cached;
        return fetch(e.request).then(res => {
          if(res.ok){
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => {
          // لو مفيش نت ومفيش كاش - رجع offline بسيط مش index.html
          return caches.match('./index.html').then(idx => {
            // لو الطلب هو index.html نفسه رجعه، غير كده رجع صفحة بتقول مفيش نت
            if(url.endsWith('index.html') || url.endsWith('/') || url.includes('select-daira')){
              return idx;
            }
            return new Response('<html dir=rtl><body style="font-family:Tahoma;text-align:center;padding:40px"><h2>⚠️ مفيش نت</h2><p>الصفحة دي لسه متخزنتش</p><p>افتح النت مرة واحدة وبعدين هتشتغل من غير نت</p><button onclick="location.reload()">إعادة تحميل</button></body></html>', {headers:{'Content-Type':'text/html'}});
          });
        });
      })
    );
    return;
  }

  // باقي الملفات - كاش أولاً ثم نت
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if(res.ok && e.request.method === 'GET'){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
