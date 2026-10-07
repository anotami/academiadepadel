// Service worker de la app de arbitraje. Cachea solo lo necesario para que
// funcione offline en pista; no toca el resto del sitio.
const CACHE = "arbitro-v1";
const ASSETS = [
  "arbitro.html",
  "manifest.json",
  "assets/css/style.css?v=12",
  "assets/js/arbitro.js?v=1",
  "assets/img/arbitro-icon-192.png",
  "assets/img/arbitro-icon-512.png",
  "assets/img/logo.svg",
  "assets/img/favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && req.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
