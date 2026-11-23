const CACHE = 'mahkama-v12-icon-scales-only';
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
  './manifest.json',
  './icon-512.png',
  './icon-192.png',
  './icon.png',
  './daira-core.js',
  './pwa-install.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES).catch(()=>c.addAll(['./','./index.html']))).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if(url.includes('script.google.com') || url.includes('googleusercontent')) return;
  
  // للصفحات HTML - كاش أولا، لو مفيش كاش هات من النت، لو مفيش نت رجع index فقط لو هو index
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
        }).catch(()=>{
          // لو offline وطلب صفحة فرعية مش متخزنة، مترجعش index عشان ميعملش nesting
          if(url.includes('index.html') || url.endsWith('/') || url.includes('select-daira')){
            return caches.match('./index.html');
          }
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
    }))
  );
});
