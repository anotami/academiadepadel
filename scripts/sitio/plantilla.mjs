// Plantilla común (cabecera, pie, WhatsApp flotante) para las páginas generadas que viven un nivel o más adentro del sitio.
import { MARCA, waLink } from "./datos.mjs";
export const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const CSP = "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.gstatic.com https://*.googleapis.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google-analytics.com https://*.googleusercontent.com https://*.gstatic.com; connect-src 'self' https://www.google-analytics.com https://*.googleapis.com https://*.firebaseapp.com https://*.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'";
// `up` = "../" por cada nivel de carpeta (p. ej. "../" para /guias/, "../../" para /guias/<guia>/).
export function pagina({ up, slug, titulo, descripcion, og, grafo, main, volver = ["index.html", "← Volver al inicio"] }) {
  const url = `${MARCA.dominio}/${slug}`;
  return `<!DOCTYPE html>
<html lang="es-PE">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C2DJ9V0L4Z"></script>
<script src="${up}assets/js/gtag-init.js?v=2"></script>

<title>${esc(titulo)} | ${MARCA.nombre}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}assets/css/style.css?v=67">
<link rel="stylesheet" href="${up}assets/css/sedes.css?v=5">

<meta property="og:title" content="${esc(titulo)} | ${MARCA.nombre}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:type" content="${slug.split("/").length > 2 ? "article" : "website"}">
<meta property="og:locale" content="es_PE">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${MARCA.dominio}/assets/img/${og}.jpg">
<meta name="twitter:card" content="summary_large_image">

<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": grafo })}</script>
</head>
<body>

<a class="skip-link" href="#main">Saltar al contenido</a>

<header class="site-header" id="top">
  <div class="container header-inner">
    <a href="${up}index.html" class="brand">
      <img src="${up}assets/img/logo.svg" alt="${MARCA.nombre}" class="brand-logo" width="36" height="36">
      <span>${MARCA.nombre}</span>
    </a>
    <a href="${up}${volver[0]}" class="test-back-link">${volver[1]}</a>
  </div>
</header>

<main id="main">
${main}
</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div class="brand footer-brand">
      <img src="${up}assets/img/logo.svg" alt="" width="28" height="28">
      <span>${MARCA.nombre}</span>
    </div>
    <p>Lima, Perú · <a href="${waLink("Hola, quiero más información sobre las clases")}" target="_blank" rel="noopener">WhatsApp ${MARCA.telefono}</a> · <a href="${MARCA.instagram}" target="_blank" rel="noopener">Instagram @academiapadelgp</a></p>
    <p class="footer-copy">© ${new Date().getFullYear()} academiadepadel.pe. Todos los derechos reservados. · <a href="${up}privacidad.html">Privacidad</a> · <a href="${up}tienda/">Tienda</a></p>
  </div>
</footer>

<a class="whatsapp-float" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp" href="${waLink("Hola, vi academiadepadel.pe y quiero más información")}">
  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.26.62 4.38 1.7 6.2L4 29l7.94-1.65a12 12 0 0 0 4.08.71h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm0 21.86h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.78.8-3.65-.24-.37a9.87 9.87 0 0 1-1.51-5.2c0-5.46 4.45-9.9 9.92-9.9 2.64 0 5.12 1.03 6.99 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9z"/></svg>
</a>

<script src="${up}assets/js/main.js?v=14"></script>
<script src="${up}assets/js/cookie-banner.js?v=1"></script>
</body>
</html>
`;
}
