const CACHE = 'mahkama-v14-auto-cache-all';
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
  './tajdid_taagel.html',
  './kitaba.html',
  './eltemasat.html',
  './manifest.json',
  './icon-512.png',
  './icon-192.png',
  './icon.png',
  './daira-core.js',
  './pwa-install.js'
];

// تخزين تلقائي: خزن كل ملف لوحده، لو واحد فشل كمل الباقي
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      // خزن كل ملف لوحده - مش addAll اللي بيفشل كله لو ملف واحد ناقص
      await Promise.allSettled(FILES.map(url => 
        fetch(url).then(res => {
          if(res.ok) return c.put(url, res);
        }).catch(()=>{})
      ));
      // خزن الصفحات اللي ممكن تكون بأسماء تانية
      const extra = ['./taalia.html','./galasat.html','./mahdar.html','./ahkam.html','./estelam.html','./mofradat.html','./kashf.html','./rolat.html'];
      await Promise.allSettled(extra.map(url => 
        fetch(url).then(res => { if(res.ok) return c.put(url, res); }).catch(()=>{})
      ));
    }).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

// لما الصفحة تطلب تخزين الكل، خزنهم في الخلفية
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'CACHE_ALL'){
    caches.open(CACHE).then(async c => {
      await Promise.allSettled(FILES.map(url => 
        c.match(url).then(hit => {
          if(hit) return;
          return fetch(url).then(res => { if(res.ok) return c.put(url, res); }).catch(()=>{});
        })
      ));
    });
  }
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if(url.includes('script.google.com') || url.includes('googleusercontent')) return;
  
  // للصفحات HTML - كاش أولا
  if(e.request.destination === 'document' || (e.request.headers.get('accept')||'').includes('text/html')){
    e.respondWith(
      caches.match(e.request).then(cached => {
        if(cached) return cached;
        return fetch(e.request).then(res => {
          if(res.ok){
            const cl = res.clone();
            caches.open(CACHE).then(c=>c.put(e.request, cl));
          }
          return res;
        }).catch(async ()=>{
          const c2 = await caches.match(e.request);
          if(c2) return c2;
          const idx = await caches.match('./index.html');
          if(idx) return idx;
          return new Response('<html dir=rtl><body style="font-family:Tahoma;text-align:center;padding:40px"><h2>⚠️ مفيش نت</h2><p>افتح النت مرة واحدة لتخزين الصفحة</p></body></html>', {headers:{'Content-Type':'text/html'}});
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(c=> c || fetch(e.request).then(res=>{
      if(res.ok && e.request.method==='GET' && url.startsWith(self.location.origin)){
        const cl=res.clone(); caches.open(CACHE).then(ca=>ca.put(e.request, cl));
      }
      return res;
    }).catch(()=>caches.match(e.request)))
  );
});
