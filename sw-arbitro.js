// Service worker de la app de arbitraje. Cachea solo lo necesario para que
// funcione offline en pista.
//
// IMPORTANTE: este archivo vive en la raíz del sitio (igual que index.html),
// así que por defecto su "scope" de Service Worker es el sitio ENTERO, no
// solo las páginas del árbitro — si no se filtra explícitamente en el
// handler de "fetch", este SW terminaría interceptando y cacheando también
// index.html, style.css, main.js, etc., sirviendo versiones viejas de todo
// el sitio a cualquiera que haya visitado alguna vez una página del árbitro.
// Por eso cada fetch se filtra contra ARBITRO_PATHS antes de tocarlo.
const CACHE = "arbitro-v11";

// Páginas y archivos EXCLUSIVOS del árbitro: nunca los pide el sitio
// principal, así que siempre es seguro cachearlos.
const ARBITRO_PAGES = [
  "/arbitro.html", "/arbitro-vivo.html", "/arbitro-pistas.html",
  "/arbitro-historial.html", "/arbitro-torneo.html", "/arbitro-login.html",
  "/arbitro-entrenador.html", "/arbitro-ayuda.html"
];
const ARBITRO_ONLY_ASSETS = [
  "/manifest.json",
  "/assets/css/arbitro.css",
  "/assets/js/arbitro.js", "/assets/js/arbitro-common.js",
  "/assets/js/arbitro-vivo.js", "/assets/js/arbitro-pistas.js",
  "/assets/js/arbitro-historial.js", "/assets/js/arbitro-torneo.js",
  "/assets/js/arbitro-login.js", "/assets/js/arbitro-entrenador.js",
  "/assets/img/arbitro-icon-192.png", "/assets/img/arbitro-icon-512.png"
];
// Archivos COMPARTIDOS con el sitio principal (style.css, logo, favicon) o
// con otras páginas generales del sitio (faq-padel.css, usado también por
// faq-padel.html, que está fuera de la sección del árbitro): solo se
// cachean/sirven desde este SW cuando el pedido vino de una página del
// árbitro (se mira el "referrer" del fetch) — si lo pide index.html, faq-padel.html
// u otra página del sitio, se deja pasar siempre a la red, sin tocar.
const SHARED_ASSETS = ["/assets/css/style.css", "/assets/css/faq-padel.css", "/assets/img/logo.svg", "/assets/img/favicon.svg"];

const ASSETS = [
  "arbitro.html",
  "manifest.json",
  "assets/css/style.css?v=12",
  "assets/css/arbitro.css?v=7",
  "assets/js/arbitro.js?v=7",
  "assets/js/arbitro-common.js?v=4",
  "assets/img/arbitro-icon-192.png",
  "assets/img/arbitro-icon-512.png",
  "assets/img/logo.svg",
  "assets/img/favicon.svg"
];
// Nota: firebase-app.js y firebase-config.js NO se precachean a propósito.
// arbitro.js los carga con import() dinámico envuelto en try/catch, así que
// si no hay red esa carga simplemente falla y el árbitro sigue funcionando
// 100% local (marcador, timers, checklist, incidencias, interrupciones).

function esDelArbitro(req) {
  const path = new URL(req.url).pathname;
  if (ARBITRO_PAGES.includes(path) || ARBITRO_ONLY_ASSETS.includes(path)) return true;
  if (SHARED_ASSETS.includes(path)) {
    try {
      const refPath = req.referrer ? new URL(req.referrer).pathname : "";
      return ARBITRO_PAGES.includes(refPath);
    } catch (e) { return false; }
  }
  return false;
}

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
  if (!esDelArbitro(req)) return; // deja pasar todo lo que no es del árbitro, sin tocarlo ni cachearlo

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
