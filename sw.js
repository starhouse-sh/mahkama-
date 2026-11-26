const CACHE = 'mahkama-v50-offline-fix';
const FILES = [
  './',
  './app.html',
  './admin.html',
  './daira-config.html',
  './index.html',
  './index-fixed.html',
  './create-daira.html',
  './mahdar.html',
  './galasat.html',
  './ahkam.html',
  './estelam.html',
  './mofradat.html',
  './kashf.html',
  './rolat.html',
  './tajdid_taagel.html',
  './rolat.html',
  './tadeil.html',
  './edkhal.html',
  './taalia.html',
  './kitaba.html',
  './eltemasat.html',
  './tasleem_ahkam.html',
  './hifz.html',
  './natiga.html',
  './khobara.html',
  './Ketabet-Ahkam.html',
  './ehsaiat.html',
  './ehsaia-esbaia.html',
  './SANAWAT-QADAIYA.html',
  './ealan.html',
  './manifest.json',
  './daira-core.js',
  './pwa-install.js',
  './scales-192.png',
  './scales-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(FILES).catch(err => {
        console.log('cache addAll failed', err);
        // جرب ملف ملف عشان واحد فاشل ميوقفش الكل
        return Promise.allSettled(FILES.map(f => cache.add(f).catch(()=>{})));
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
  // جوجل سكريبت سيبه يروح للنت مباشر
  if(url.includes('script.google.com') || url.includes('googleusercontent') || url.includes('googleapis')){
    return;
  }

  // لو الطلب لنفس الدومين (التطبيق)
  if(e.request.method === 'GET' && url.startsWith(self.location.origin)){
    e.respondWith((async () => {
      try{
        // أول حاجة جرب الكاش مع تجاهل الـ ?v= 
        let cached = await caches.match(e.request, {ignoreSearch: true});
        if(cached) {
          // في الخلفية حدث الكاش لو فيه نت
          if(navigator.onLine){
            try{
              let fresh = await fetch(e.request);
              if(fresh.ok){
                let cache = await caches.open(CACHE);
                cache.put(e.request, fresh.clone());
                // وكمان احفظه من غير ?v= عشان الـ offline
                let reqNoSearch = new Request(e.request.url.split('?')[0]);
                cache.put(reqNoSearch, fresh.clone());
              }
            }catch(err){}
          }
          return cached;
        }
        // لو مفيش كاش، جرب النت
        let res = await fetch(e.request);
        if(res.ok){
          let cache = await caches.open(CACHE);
          cache.put(e.request, res.clone());
          // احفظ نسخة من غير بارامترات
          try{
            let reqNoSearch = new Request(e.request.url.split('?')[0]);
            cache.put(reqNoSearch, res.clone());
          }catch(err){}
        }
        return res;
      }catch(err){
        // مفيش نت ومفيش كاش مطابق - رجع أقرب حاجة
        let fallback = await caches.match(e.request, {ignoreSearch: true});
        if(fallback) return fallback;
        // لو بيطلب صفحة html، رجع app.html أو index.html
        if(e.request.headers.get('accept')?.includes('text/html') || e.request.mode === 'navigate'){
          let appCache = await caches.match('./app.html');
          if(appCache) return appCache;
          let indexCache = await caches.match('./index.html');
          if(indexCache) return indexCache;
          let root = await caches.match('./');
          if(root) return root;
        }
        throw err;
      }
    })());
  }
});

// رسالة لتخزين كل الصفحات
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'CACHE_ALL'){
    caches.open(CACHE).then(cache => {
      cache.addAll(FILES.map(f => f.split('?')[0])).catch(()=>{});
    });
  }
});
