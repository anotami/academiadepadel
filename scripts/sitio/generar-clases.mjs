#!/usr/bin/env node
// Genera las páginas de clases: /clases/<slug>/index.html (inicial, intermedio, particulares, mujeres y niños) desde scripts/sitio/datos.mjs.
// Uso: node scripts/sitio/generar-clases.mjs
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARCA, SEDES, CLASES, waLink } from "./datos.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const CSP = "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.gstatic.com https://*.googleapis.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google-analytics.com https://*.googleusercontent.com https://*.gstatic.com https://maps.googleapis.com https://*.google.com; connect-src 'self' https://www.google-analytics.com https://*.googleapis.com https://*.firebaseapp.com https://*.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'";
const canonico = (c) => `${MARCA.dominio}/clases/${c.slug}/`;
const lista = (items) => `<ul class="sede-lista">\n${items.map((i) => `          <li>${esc(i)}</li>`).join("\n")}\n        </ul>`;

function jsonld(c) {
  const url = canonico(c), org = { "@type": "Organization", name: MARCA.nombre, url: MARCA.dominio + "/" };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "Service", "@id": url + "#servicio", name: `${c.h1}`, serviceType: "Clases de pádel", url, provider: org, areaServed: { "@type": "City", name: "Lima" }, description: c.descripcion },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: MARCA.dominio + "/" },
      { "@type": "ListItem", position: 2, name: "Clases", item: MARCA.dominio + "/#programas" },
      { "@type": "ListItem", position: 3, name: c.nombre, item: url }] },
    { "@type": "FAQPage", mainEntity: c.faq.map(([n, r]) => ({ "@type": "Question", name: n, acceptedAnswer: { "@type": "Answer", text: r } })) }
  ] });
}

function pagina(c) {
  return `<!DOCTYPE html>
<html lang="es-PE">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C2DJ9V0L4Z"></script>
<script src="../../assets/js/gtag-init.js?v=2"></script>

<title>${esc(c.titulo)} | ${MARCA.nombre}</title>
<meta name="description" content="${esc(c.descripcion)}">
<link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="${canonico(c)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/style.css?v=66">
<link rel="stylesheet" href="../../assets/css/sedes.css?v=5">

<meta property="og:title" content="${esc(c.titulo)} | ${MARCA.nombre}">
<meta property="og:description" content="${esc(c.descripcion)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_PE">
<meta property="og:url" content="${canonico(c)}">
<meta property="og:image" content="${MARCA.dominio}/assets/img/court/paddles-court.jpg">
<meta name="twitter:card" content="summary_large_image">

<script type="application/ld+json">${jsonld(c)}</script>
</head>
<body>

<a class="skip-link" href="#main">Saltar al contenido</a>

<header class="site-header" id="top">
  <div class="container header-inner">
    <a href="../../index.html" class="brand">
      <img src="../../assets/img/logo.svg" alt="${MARCA.nombre}" class="brand-logo" width="36" height="36">
      <span>${MARCA.nombre}</span>
    </a>
    <a href="../../index.html#programas" class="test-back-link">← Todos los programas</a>
  </div>
</header>

<main id="main">
  <section class="section sede-hero">
    <div class="container">
      <nav class="breadcrumb" aria-label="Ubicación en el sitio"><a href="../../index.html">Inicio</a> › <a href="../../index.html#programas">Clases</a> › <span>${esc(c.nombre)}</span></nav>
      <p class="eyebrow">${esc(c.eyebrow)}</p>
      <h1>${esc(c.h1)}</h1>
      <p class="sede-lead">${esc(c.lead)}</p>
      <div class="sede-cta">
        <a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${waLink(c.wa)}">Reservá tu clase de prueba</a>
${c.test ? '        <a class="btn btn-outline" href="../../test.html">Hacé el test de nivel</a>' : '        <a class="btn btn-outline" href="../../disponibilidad.html">Contanos tu disponibilidad</a>'}
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container sede-bloques">
      <div class="card">
        <h2>Para quién es</h2>
        ${lista(c.paraQuien)}
      </div>
      <div class="card">
        <h2>Qué vas a trabajar</h2>
        ${lista(c.trabajas)}
      </div>
      <div class="card">
        <h2>Cómo son las clases</h2>
        ${lista(c.formato)}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container sede-bloques sede-bloques-2">
      <div class="card">
        <h2>Cómo empezás</h2>
        <ol class="sede-lista">
${c.pasos.map((p) => `          <li>${esc(p)}</li>`).join("\n")}
        </ol>
        <p>${esc(c.horario)}</p>
      </div>
      <div class="card">
        <h2>Qué llevar</h2>
        <p>Ropa deportiva y zapatillas cómodas. Si no tenés pala, te la prestamos sin costo extra durante tus primeras clases: no necesitás comprar nada para tu clase de prueba.</p>
        <p><a href="../../index.html#precios">Ver planes y tarifas →</a></p>
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <h2 class="section-title">Dónde entrenamos</h2>
      <p class="section-sub">Coordinamos las clases en estas sedes de Lima.</p>
      <div class="sede-bloques sede-sedes">
${SEDES.map((s) => `        <a class="card sede-enlace" href="../../sedes/${s.slug}/"><strong>${esc(s.nombre)}</strong><span>${esc(s.zona)}</span></a>`).join("\n")}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2 class="section-title">Preguntas frecuentes</h2>
      <div class="faq-list">
${c.faq.map(([n, r]) => `        <details class="faq-item"><summary>${esc(n)}</summary><p>${esc(r)}</p></details>`).join("\n")}
      </div>
      <ul class="sede-relacionados">
${c.relacionados.map(([h, t]) => `        <li><a href="${h}">${esc(t)} →</a></li>`).join("\n")}
      </ul>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div class="brand footer-brand">
      <img src="../../assets/img/logo.svg" alt="" width="28" height="28">
      <span>${MARCA.nombre}</span>
    </div>
    <p>Lima, Perú · <a href="${waLink("Hola, quiero más información sobre las clases")}" target="_blank" rel="noopener">WhatsApp ${MARCA.telefono}</a> · <a href="${MARCA.instagram}" target="_blank" rel="noopener">Instagram @academiapadelgp</a></p>
    <p class="footer-copy">© ${new Date().getFullYear()} academiadepadel.pe. Todos los derechos reservados. · <a href="../../privacidad.html">Privacidad</a> · <a href="https://padelacademia.pe/">Tienda</a></p>
  </div>
</footer>

<a class="whatsapp-float" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp" href="${waLink("Hola, vi academiadepadel.pe y quiero más información")}">
  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.26.62 4.38 1.7 6.2L4 29l7.94-1.65a12 12 0 0 0 4.08.71h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm0 21.86h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.78.8-3.65-.24-.37a9.87 9.87 0 0 1-1.51-5.2c0-5.46 4.45-9.9 9.92-9.9 2.64 0 5.12 1.03 6.99 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9z"/></svg>
</a>

<script src="../../assets/js/main.js?v=14"></script>
<script src="../../assets/js/cookie-banner.js?v=1"></script>
</body>
</html>
`;
}

for (const c of CLASES) {
  const dir = path.join(raiz, "clases", c.slug); mkdirSync(dir, { recursive: true });
  const html = pagina(c);
  if (/\[COMPLETAR/.test(html.replace(/<!--[\s\S]*?-->/g, ""))) { console.error(`✘ ${c.slug}: [COMPLETAR] visible`); process.exit(1); }
  writeFileSync(path.join(dir, "index.html"), html); console.log(`✔  clases/${c.slug}/index.html`);
}
