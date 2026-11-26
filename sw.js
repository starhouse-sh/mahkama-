const CACHE = 'mahkama-v60-auto-update';
const VERSION = 'v60-2026-05-13';
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
  './mahgouz.html',
  './ahkam.html',
  './estelam.html',
  './mofradat.html',
  './kashf.html',
  './rolat.html',
  './tajdid_taagel.html',
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
  './version.json',
  './daira-core.js',
  './pwa-install.js',
  './scales-192.png',
  './scales-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(FILES.map(f=> f + '?v=' + VERSION)).catch(()=>{
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
  if(url.includes('script.google.com') || url.includes('googleusercontent') || url.includes('googleapis')){
    return;
  }
  if(e.request.method === 'GET' && url.startsWith(self.location.origin)){
    e.respondWith((async () => {
      try{
        // حاول النت أولا للـ HTML عشان يجيب التحديث
        if(e.request.headers.get('accept')?.includes('text/html') || e.request.mode==='navigate'){
          if(navigator.onLine){
            try{
              let fresh = await fetch(e.request, {cache:'no-store'});
              if(fresh.ok){
                let cache = await caches.open(CACHE);
                cache.put(e.request, fresh.clone());
                try{ cache.put(new Request(e.request.url.split('?')[0]), fresh.clone()); }catch(err){}
                return fresh;
              }
            }catch(err){}
          }
        }
        // كاش مع تجاهل ?v=
        let cached = await caches.match(e.request, {ignoreSearch:true});
        if(cached) {
          if(navigator.onLine && e.request.url.includes('.html')){
            // حدث في الخلفية
            fetch(e.request, {cache:'no-store'}).then(async res=>{
              if(res.ok){
                let cache = await caches.open(CACHE);
                cache.put(e.request, res.clone());
                cache.put(new Request(e.request.url.split('?')[0]), res.clone());
              }
            }).catch(()=>{});
          }
          return cached;
        }
        let res = await fetch(e.request);
        if(res.ok){
          let cache = await caches.open(CACHE);
          cache.put(e.request, res.clone());
        }
        return res;
      }catch(err){
        let fallback = await caches.match(e.request, {ignoreSearch:true});
        if(fallback) return fallback;
        if(e.request.headers.get('accept')?.includes('text/html') || e.request.mode==='navigate'){
          let appCache = await caches.match('./app.html', {ignoreSearch:true});
          if(appCache) return appCache;
          let idx = await caches.match('./index-fixed.html', {ignoreSearch:true});
          if(idx) return idx;
        }
        throw err;
      }
    })());
  }
});

self.addEventListener('message', e => {
  if(e.data && e.data.type==='SKIP_WAITING'){
    self.skipWaiting();
  }
  if(e.data && e.data.type==='CACHE_ALL'){
    caches.open(CACHE).then(cache=>{
      cache.addAll(FILES.map(f=> f.split('?')[0])).catch(()=>{});
    });
  }
});
