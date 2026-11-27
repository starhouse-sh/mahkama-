const CACHE = 'mahkama-v103-offline-all-pages';
const FILES = [
  './',
  './app.html',
  './manifest.json',
  './daira-core.js',
  './version.json',
  './mahdar.html',
  './rolat.html',
  './galasat.html',
  './ehsaiat.html',
  './ketabet-ahkam-final.html',
  './ketabet-ahkam-daira.html',
  './ahkam.html',
  './estelam.html',
  './mofradat.html',
  './kashf.html',
  './tadeil.html',
  './edkhal.html',
  './daira-config.html',
  './admin-dairat.html',
  './admin.html',
  './taalia.html',
  './kitaba.html',
  './mahgouz.html',
  './warradat-mofradat.html',
  './hifz.html',
  './exit.html',
  './create-daira.html',
  './forgot.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(FILES).catch(err => {
        console.log('Some files failed to cache', err);
        return Promise.all(FILES.map(f => cache.add(f).catch(()=>{})));
      });
    }).then(()=> self.skipWaiting())
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
  if(url.includes('script.google.com') || url.includes('googleusercontent')){
    return;
  }
  // app.html - نت أولا، كاش لو مفيش نت
  if(url.includes('app.html') || url.includes('manifest.json') || url.includes('version.json')){
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).then(res => {
        if(res.ok && e.request.method === 'GET'){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(()=> caches.match(e.request).then(c => c || caches.match('./app.html')))
    );
    return;
  }
  // باقي الصفحات - كاش أولا عشان Offline
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok && e.request.method === 'GET' && url.startsWith(self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(()=> {
        // لو مفيش نت والصفحة مش في الكاش - مترجعش app.html جوه الـ iframe عشان ميعملش تداخل
        return caches.match(e.request).then(c => {
          if(c) return c;
          // لو صفحة مهمة مش متخزنة - رجع رسالة صغيرة جوه الـ iframe بس، مش التطبيق كله
          if(e.request.destination === 'iframe' || url.includes('.html')){
            return new Response('<html><body style="font-family:Tahoma;text-align:center;padding:20px;background:#fff"><h3>📴 Offline - الصفحة مش متخزنة</h3><p>افتح الصفحة دي مرة واحدة بالنت عشان تتخزن وتشتغل من غير نت بعد كده</p><p style="font-size:12px;color:#666">'+url.split('/').pop()+'</p></body></html>', {headers:{'Content-Type':'text/html'}});
          }
          return caches.match('./app.html');
        });
      });
    })
  );
});
