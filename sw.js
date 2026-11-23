const CACHE = 'mahkama-v17-no-nesting-ever';
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
  './daira-core.js',
  './pwa-install.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await Promise.allSettled(FILES.map(url => 
        fetch(url, {cache:'no-store'}).then(res => {
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
        c.match(url, {ignoreSearch:true}).then(hit => {
          if(hit) return;
          return fetch(url, {cache:'no-store'}).then(res => { if(res.ok) return c.put(url, res); }).catch(()=>{});
        })
      ));
    });
  }
  if(e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if(url.includes('script.google.com') || url.includes('googleusercontent')) return;
  if(e.request.method !== 'GET') return;

  const isHTML = e.request.destination === 'document' || (e.request.headers.get('accept')||'').includes('text/html');
  if(isHTML){
    e.respondWith((async ()=>{
      // 1. حاول الكاش الأول - وتجاهل ?v=
      const cached = await caches.match(e.request, {ignoreSearch:true});
      if(cached){
        // حماية ضد التداخل: لو اللي في الكاش index.html والطلب مش index.html، مترجعوش
        const cachedUrl = cached.url || '';
        const reqIsIndex = url.includes('index.html') || url.endsWith('/') || url.includes('select-daira');
        if(cachedUrl.includes('index.html') && !reqIsIndex){
          // الكاش فيه غلطة قديمة - تجاهله وكمل
        } else {
          return cached;
        }
      }
      // 2. لو فيه نت، هات من النت وخزنه
      try{
        const res = await fetch(e.request);
        if(res.ok){
          const cl = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, cl));
          return res;
        }
        return res;
      }catch(err){
        // 3. Offline - جرب الكاش تاني
        const c2 = await caches.match(e.request, {ignoreSearch:true});
        if(c2){
          const c2Url = c2.url || '';
          const reqIsIndex = url.includes('index.html') || url.endsWith('/') || url.includes('select-daira');
          if(!(c2Url.includes('index.html') && !reqIsIndex)) return c2;
        }
        // 4. لو الطلب هو index نفسه، رجع index
        const isIndexReq = url.includes('index.html') || url.endsWith('/') || url.includes('select-daira');
        if(isIndexReq){
          const idx = await caches.match('./index.html', {ignoreSearch:true});
          if(idx) return idx;
        }
        // 5. لأي صفحة فرعية - أبدا مترجعش index.html - رجع صفحة Offline بسيطة
        const pageName = new URL(url).pathname.split('/').pop() || 'الصفحة';
        return new Response(`<html dir=rtl lang=ar><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{font-family:Tahoma;text-align:center;padding:25px;background:#fff;color:#333}h2{color:#0A2342}.btn{padding:12px 20px;background:#0A2342;color:#fff;border:none;border-radius:8px;margin-top:15px;cursor:pointer;font-size:14px}</style></head><body><h2>📴 الصفحة دي لسه متخزنتش</h2><p>افتح النت مرة واحدة عشان تتخزن، وبعدها هتشتغل من غير نت</p><p style="font-size:12px;color:#666">الصفحة: ${pageName}</p><button class=btn onclick="location.reload()">🔄 حاول تاني</button></body></html>`, {headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  e.respondWith(
    caches.match(e.request, {ignoreSearch:true}).then(c=> c || fetch(e.request).then(res=>{
      if(res.ok && url.startsWith(self.location.origin)){
        const cl=res.clone(); caches.open(CACHE).then(ca=>ca.put(e.request, cl));
      }
      return res;
    }).catch(()=>caches.match(e.request, {ignoreSearch:true})))
  );
});
