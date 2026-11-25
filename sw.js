const CACHE = 'mahkama-v24-ignore-search';
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
    e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES).catch(()=>{})));
  }
});

self.addEventListener('fetch', e => {
  if(e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent')){
    return;
  }
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok && e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(async () => {
        // Offline: جرب تجيب نفس الصفحة من الكاش حتى لو فيها ?safe=1
        const fromCache = await caches.match(e.request, {ignoreSearch: true});
        if(fromCache) return fromCache;
        // لو صفحة HTML ومش لاقيها، رجع رسالة بسيطة مش mahdar
        if(e.request.headers.get('accept')?.includes('text/html')){
          return new Response('<!DOCTYPE html><html dir=rtl><head><meta charset=utf-8></head><body style="font-family:Tahoma;text-align:center;padding:40px"><h3>📴 Offline - الصفحة غير مخزنة</h3><p>افتح التطبيق مرة بالنت عشان تتخزن</p><p>'+e.request.url+'</p></body></html>', {headers:{'Content-Type':'text/html; charset=utf-8'}});
        }
        return new Response('', {status: 404});
      });
    })
  );
});
