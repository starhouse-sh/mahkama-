const CACHE = 'mahkama-v101-no-password-save';
const FILES = [
  './',
  './app.html',
  './manifest.json',
  './daira-core.js',
  './mahdar.html',
  './daira-config.html',
  './admin-dairat.html',
  './galasat.html',
  './rolat.html',
  './taalia.html',
  './ketabet-ahkam-final.html',
  './ahkam.html',
  './estelam.html',
  './mofradat.html',
  './kashf.html',
  './tadeil.html',
  './edkhal.html',
  './version.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(FILES).catch(err => {
        console.log('Cache addAll failed for some files', err);
        // حاول تخزن اللي تقدر عليه واحد واحد
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
  // للدرايف سيب النت يشتغل عادي
  if(url.includes('script.google.com') || url.includes('googleusercontent')){
    return;
  }

  // app.html و manifest - هات من النت الأول، ولو مفيش نت هات من الكاش
  if(url.includes('app.html') || url.includes('manifest.json') || url.includes('version.json')){
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).then(res => {
        if(res.ok && e.request.method === 'GET'){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(()=> {
        return caches.match(e.request).then(c => c || caches.match('./app.html'));
      })
    );
    return;
  }

  // باقي الملفات - كاش أولا عشان يشتغل من غير نت
  // المهم: لو فشل، مترجعش app.html جوه الـ iframe - ده اللي كان بيعمل التكرار اللي في الصورة
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
        // لو مفيش نت والملف مش في الكاش
        // لو الطلب لصفحة (navigate) - رجع app.html
        // لو الطلب لملف جوه iframe - مترجعش app.html - رجع الكاش بتاع نفس الملف أو صفحة فاضية
        if(e.request.mode === 'navigate' || e.request.destination === 'document'){
          // شوف هل ده طلب للـ iframe ولا للنافذة الرئيسية
          // لو الـ iframe بيطلب app.html نفسه - امنعه عشان ميعملش تكرار
          if(url.includes('app.html')){
            return caches.match('./app.html');
          }
          // لو طلب عادي لصفحة مش موجودة - رجع الكاش بتاعها لو موجود
          return caches.match(e.request).then(c => c || caches.match('./app.html'));
        }
        // للـ iframe والملفات التانية - حاول تجيب نفس الملف من الكاش، لو مفيش رجع response فاضي مش app.html
        return caches.match(e.request).then(c => {
          if(c) return c;
          // لو مفيش خالص - رجع صفحة فاضية فيها رسالة Offline بدل ما ترجع app.html وتعمل تكرار
          return new Response('<html><body style="font-family:Tahoma;text-align:center;padding:20px"><h3>📴 Offline</h3><p>الملف مش متخزن للعمل بدون نت<br>افتح التطبيق مرة بالنت عشان يتخزن</p></body></html>', {headers:{'Content-Type':'text/html'}});
        });
      });
    })
  );
});
