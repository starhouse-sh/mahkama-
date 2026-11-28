const CACHE = 'mahkama-v120-full-sync-tadeil';
const FILES = [
  "./",
  "./app.html",
  "./manifest.json",
  "./version.json",
  "./daira-core.js",
  "./app.js",
  "./d32_auto_backup.js",
  "./pwa-install.js",
  "./Mahgouza-Hokm.html",
  "./SANAWAT-QADAIYA.html",
  "./admin-dairat.html",
  "./admin.html",
  "./ahkam.html",
  "./appeals-list.html",
  "./backup.html",
  "./create-daira.html",
  "./daira-config.html",
  "./debug-password.html",
  "./drive-sync.html",
  "./ealan.html",
  "./edkhal.html",
  "./ehsaiat.html",
  "./eltemasat.html",
  "./emergency-login.html",
  "./estelam.html",
  "./forgot.html",
  "./galasat.html",
  "./hifz.html",
  "./index.html",
  "./kashf.html",
  "./khobara.html",
  "./kitaba.html",
  "./mahdar.html",
  "./mahgouz.html",
  "./mofradat.html",
  "./natiga.html",
  "./rolat.html",
  "./saraky.html",
  "./taalia.html",
  "./tadeil.html",
  "./tajdid_taagel.html",
  "./takrer.html",
  "./tasleem_ahkam.html",
  "./test-daira32.html",
  "./warradat-mofradat.html",
  "./ehsaia-esbaia.html",
  "./Ketabet-Ahkam.html"
];

const DELETED = ['select-daira.html', 'exit.html', 'select-daira', 'exit'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      for (const f of FILES) {
        try { await cache.add(f); } catch(err) { console.log('skip missing', f); }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('script.google.com') || url.includes('googleusercontent')) { return; }
  for (const d of DELETED) {
    if (url.toLowerCase().includes(d.toLowerCase())) {
      e.respondWith(caches.match('./app.html').then(c => c || fetch('./app.html')));
      return;
    }
  }
  if (url.includes('app.html') || url.includes('manifest.json') || url.includes('version.json')) {
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request, {ignoreSearch:true}).then(c => c || caches.match('./app.html')))
    );
    return;
  }
  e.respondWith(
    (async () => {
      let cached = await caches.match(e.request, {ignoreSearch: true});
      if (!cached) {
        try {
          let urlObj = new URL(e.request.url);
          let cleanUrl = urlObj.origin + urlObj.pathname;
          cached = await caches.match(cleanUrl);
          if (!cached) {
            let cache = await caches.open(CACHE);
            let keys = await cache.keys();
            let baseName = urlObj.pathname.split('/').pop().split('?')[0];
            for (let key of keys) {
              if (key.url.toLowerCase().includes(baseName.toLowerCase())) {
                cached = await cache.match(key);
                if (cached) break;
              }
            }
          }
        } catch(err) {}
      }
      if (cached) return cached;
      try {
        let res = await fetch(e.request);
        if (res.ok && e.request.method === 'GET' && url.startsWith(self.location.origin)) {
          let clone = res.clone();
          let cache = await caches.open(CACHE);
          cache.put(e.request, clone.clone());
          try {
            let urlObj = new URL(e.request.url);
            if (urlObj.search) {
              let cleanReq = urlObj.origin + urlObj.pathname;
              cache.put(cleanReq, clone);
            }
          } catch(err) {}
        }
        if (res.status === 404 && e.request.mode === 'navigate') {
          const fb = await caches.match('./app.html');
          if (fb) return fb;
        }
        return res;
      } catch(err) {
        let fallback = await caches.match(e.request, {ignoreSearch: true});
        if (fallback) return fallback;
        try {
          let urlObj = new URL(e.request.url);
          let cleanUrl = urlObj.origin + urlObj.pathname;
          fallback = await caches.match(cleanUrl);
          if (fallback) return fallback;
        } catch(err2) {}
        if (e.request.destination === 'iframe' || url.includes('.html')) {
          try {
            let urlObj = new URL(e.request.url);
            let baseFile = urlObj.pathname.split('/').pop().split('?')[0];
            let cache = await caches.open(CACHE);
            let keys = await cache.keys();
            for (let key of keys) {
              if (key.url.toLowerCase().endsWith(baseFile.toLowerCase()) || key.url.toLowerCase().includes(baseFile.toLowerCase())) {
                let c = await cache.match(key);
                if (c) return c;
              }
            }
          } catch(err3) {}
          let fileName = 'الصفحة';
          try { fileName = new URL(url).pathname.split('/').pop().split('?')[0]; } catch(e) {}
          return new Response('<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Tahoma;text-align:center;padding:20px;background:#fff;direction:rtl"><h3 style="color:#b00020">📴 Offline - الصفحة مش متخزنة</h3><p>افتح الصفحة دي مرة واحدة بالنت عشان تتخزن وتشتغل من غير نت بعد كده</p><p style="font-size:12px;color:#666">'+fileName+'</p><button onclick="location.reload()" style="margin-top:15px;padding:10px 20px;background:#0A2342;color:#fff;border:none;border-radius:8px;cursor:pointer">🔄 حاول تاني</button></body></html>', {headers:{'Content-Type':'text/html; charset=UTF-8'}});
        }
        return caches.match('./app.html');
      }
    })()
  );
});
