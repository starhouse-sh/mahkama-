const CACHE = 'mahkama-v15-no-nesting';
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
  './tasleem_ahkam.html',
  './hifz.html',
  './natiga.html',
  './khobara.html',
  './Ketabet-Ahkam.html',
  './ealan.html',
  './SANAWAT-QADAIYA.html',
  './manifest.json',
  './icon-512.png',
  './icon-192.png',
  './icon.png',
  './daira-core.js',
  './pwa-install.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await Promise.allSettled(FILES.map(url => 
        fetch(url).then(res => {
          if(res.ok) return c.put(url, res);
        }).catch(()=>{})
      ));
    }).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

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
          
          // مهم جدا: لو الطلب لصفحة فرعية (mahdar.html مثلا) وهي مش متخزنة، مترجعش index.html عشان ميعملش تداخل
          // رجع صفحة Offline بسيطة للـ iframe فقط
          if(url.includes('index.html') || url.endsWith('/') || url.includes('select-daira') || e.request.mode === 'navigate' && !url.includes('.html')){
            const idx = await caches.match('./index.html');
            if(idx) return idx;
          }
          // للصفحات الفرعية - رجع صفحة بسيطة مش index
          return new Response(`
            <html dir=rtl lang=ar>
            <head><meta charset=utf-8><meta name=viewport content=width=device-width,initial-scale=1>
            <style>body{font-family:Tahoma;text-align:center;padding:30px;background:#fff;color:#333}h2{color:#0A2342}.btn{padding:12px 20px;background:#0A2342;color:#fff;border:none;border-radius:8px;margin-top:15px;cursor:pointer}</style>
            </head>
            <body>
              <h2>📴 الصفحة دي لسه متخزنتش</h2>
              <p>افتح النت مرة واحدة عشان تتخزن، وبعدها هتشتغل من غير نت</p>
              <p style="font-size:12px;color:#666;margin-top:10px">الصفحة: ${new URL(url).pathname.split('/').pop()}</p>
              <button class=btn onclick="location.reload()">🔄 حاول تاني</button>
            </body></html>
          `, {headers:{'Content-Type':'text/html; charset=utf-8'}});
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
