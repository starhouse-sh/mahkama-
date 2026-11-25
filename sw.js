const CACHE = 'mahkama-v23-offline-fixed';
const FILES = [
  './',
  './index.html',
  './index-fixed.html',
  './select-daira.html',
  './admin.html',
  './app.html',
  './daira-config.html',
  './estelam.html',
  './mahdar.html',
  './galasat.html',
  './mofradat.html',
  './kashf.html',
  './rolat.html',
  './tajdid_taagel.html',
  './kitaba.html',
  './eltemasat.html',
  './ahkam.html',
  './taalia.html',
  './tasleem_ahkam.html',
  './hifz.html',
  './natiga.html',
  './khobara.html',
  './Ketabet-Ahkam.html',
  './tadeil.html',
  './edkhal.html',
  './ehsaiat.html',
  './ehsaia-esbaia.html',
  './SANAWAT-QADAIYA.html',
  './ealan.html',
  './daira-core.js',
  './pwa-install.js',
  './manifest.json',
  './scales-192.png',
  './scales-512.png',
  './scales-512-maskable.png'
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

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'CACHE_ALL'){
    e.waitUntil(
      caches.open(CACHE).then(cache => cache.addAll(FILES).catch(()=>{}))
    );
  }
});

self.addEventListener('fetch', e => {
  if(e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent')){
    return;
  }
  // لو الطلب هو index.html نفسه، رجعه من الكاش بس، متعملش لوب
  const url = new URL(e.request.url);
  const isHTML = e.request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html');
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok && e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(async () => {
        // Offline - حاول تجيب نفس الصفحة المطلوبة من الكاش، مش index.html
        const reqCache = await caches.match(e.request);
        if(reqCache) return reqCache;
        // لو الصفحة مش متخزنة خالص، رجع صفحة فاضية تقول Offline، مش صفحة تحميل التطبيق
        if(isHTML){
          // رجع mahdar.html كـ fallback للصفحات الجانبية، مش index.html
          const fallback = await caches.match('./mahdar.html');
          if(fallback) return fallback;
          // لو حتى mahdar مش موجود، رجع response بسيط
          return new Response('<html dir=rtl><body style="font-family:Tahoma;text-align:center;padding:40px"><h3>📴 وضع Offline</h3><p>الصفحة دي مش متخزنة للعمل بدون نت</p><p>افتح التطبيق مرة واحدة بالنت عشان تتخزن كل الصفحات</p></body></html>', {headers:{'Content-Type':'text/html'}});
        }
        return new Response('', {status: 404});
      });
    })
  );
});
