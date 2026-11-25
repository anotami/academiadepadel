#!/usr/bin/env node
// Genera las páginas de sede: /sedes/<slug>/index.html (una por sede de scripts/sitio/datos.mjs).
// Uso: node scripts/sitio/generar-sedes.mjs
// Si una sede tiene algún [COMPLETAR], su página sale con noindex y no entra al sitemap hasta completarlo.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARCA, SEDES, waLink } from "./datos.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const CSP = "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.gstatic.com https://*.googleapis.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google-analytics.com https://*.googleusercontent.com https://*.gstatic.com https://maps.googleapis.com https://*.google.com; connect-src 'self' https://www.google-analytics.com https://*.googleapis.com https://*.firebaseapp.com https://*.gstatic.com; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'";
const canonico = (s) => `${MARCA.dominio}/sedes/${s.slug}/`;
const tieneCompletar = (s) => JSON.stringify(s).includes("[COMPLETAR");

function preguntas(s) {
  const q = [];
  if (!s.horarios.includes("[COMPLETAR")) q.push([`¿Qué horarios tienen las clases en ${s.nombre}?`, `${s.horarios} Coordinamos el día y la hora exacta con vos por WhatsApp, según el programa y la disponibilidad de la pista.`]);
  q.push(["¿Cómo reservo mi clase de prueba?", `Escribinos por WhatsApp al ${MARCA.telefono}, contanos tu nivel y en qué sede querés entrenar, y coordinamos el horario con vos.`]);
  q.push(["¿Qué necesito llevar?", "Ropa deportiva y zapatillas cómodas. Si no tenés pala, coordinamos el préstamo de equipo para tu clase de prueba."]);
  q.push([`¿Quién paga la pista en ${s.nombre}?`, s.costo === "incluido"
    ? "En esta sede la tarifa de tus clases cubre el 100% de la pista. Todos los planes incluyen el alquiler de la pista y la iluminación."
    : "Si la tarifa de alquiler de la pista supera los S/ 80 por hora, la diferencia corre por tu cuenta. Siempre te avisamos el monto exacto antes de dejarte agendado."]);
  return q;
}

function jsonld(s) {
  const url = canonico(s), org = { "@type": "Organization", name: MARCA.nombre, url: MARCA.dominio + "/" };
  const grafo = [
    { "@type": "SportsActivityLocation", "@id": url + "#sede", name: `${MARCA.nombre} · ${s.nombre}`, url, telephone: "+51957085531",
      address: { "@type": "PostalAddress", streetAddress: s.direccion, addressLocality: s.zona, addressRegion: "Lima", addressCountry: "PE" },
      parentOrganization: org, sameAs: [MARCA.instagram], ...(s.foto ? { image: `${MARCA.dominio}/assets/img/${s.foto}.jpg` } : {}) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: MARCA.dominio + "/" },
      { "@type": "ListItem", position: 2, name: "Sedes", item: MARCA.dominio + "/#horarios" },
      { "@type": "ListItem", position: 3, name: s.nombre, item: url }] }
  ];
  if (!tieneCompletar(s)) grafo.push({ "@type": "FAQPage", mainEntity: preguntas(s).map(([n, r]) => ({ "@type": "Question", name: n, acceptedAnswer: { "@type": "Answer", text: r } })) });
  return JSON.stringify({ "@context": "https://schema.org", "@graph": grafo });
}

function pagina(s) {
  const wa = waLink(`Hola, quiero reservar una clase de prueba en ${s.nombre}`);
  const mapa = encodeURIComponent(`${s.nombre}, ${s.direccion}, Lima`);
  const pendiente = tieneCompletar(s);
  const foto = s.foto ? `<picture><source srcset="../../assets/img/${s.foto}.webp" type="image/webp"><img src="../../assets/img/${s.foto}.jpg" alt="${esc(s.fotoAlt)}" width="800" height="480" fetchpriority="high"></picture>` : "";
  return `<!DOCTYPE html>
<html lang="es-PE">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
${pendiente ? '<meta name="robots" content="noindex">\n' : ""}
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C2DJ9V0L4Z"></script>
<script src="../../assets/js/gtag-init.js?v=2"></script>

<title>${esc(s.titulo)} | ${MARCA.nombre}</title>
<meta name="description" content="${esc(s.descripcion)}">
<link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="${canonico(s)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/style.css?v=66">
<link rel="stylesheet" href="../../assets/css/sedes.css?v=4">

<meta property="og:title" content="${esc(s.titulo)} | ${MARCA.nombre}">
<meta property="og:description" content="${esc(s.descripcion)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_PE">
<meta property="og:url" content="${canonico(s)}">
<meta property="og:image" content="${MARCA.dominio}/assets/img/${s.foto || "court/paddles-court"}.jpg">
<meta name="twitter:card" content="summary_large_image">

<script type="application/ld+json">${jsonld(s)}</script>
</head>
<body>

<a class="skip-link" href="#main">Saltar al contenido</a>

<header class="site-header" id="top">
  <div class="container header-inner">
    <a href="../../index.html" class="brand">
      <img src="../../assets/img/logo.svg" alt="${MARCA.nombre}" class="brand-logo" width="36" height="36">
      <span>${MARCA.nombre}</span>
    </a>
    <a href="../../index.html#horarios" class="test-back-link">← Todas las sedes</a>
  </div>
</header>

<main id="main">
  <section class="section sede-hero">
    <div class="container sede-hero-grid">
      <div class="sede-hero-texto">
        <nav class="breadcrumb" aria-label="Ubicación en el sitio"><a href="../../index.html">Inicio</a> › <a href="../../index.html#horarios">Sedes</a> › <span>${esc(s.nombre)}</span></nav>
        <p class="eyebrow">Sede · ${esc(s.zona)}</p>
        <h1>${esc(s.h1)}</h1>
        <p class="sede-lead">${esc(s.intro)}</p>
        <div class="sede-cta">
          <a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${wa}">Reservá tu clase de prueba</a>
          <a class="btn btn-outline" href="../../disponibilidad.html">Contanos tu disponibilidad</a>
        </div>
      </div>
${foto ? `      <div class="sede-hero-foto">${foto}</div>\n` : ""}    </div>
  </section>

  <section class="section section-alt">
    <div class="container sede-bloques">
      <div class="card">
        <h2>Horarios generales</h2>
        <p>${esc(s.horarios)}</p>
        <p>Coordinamos el día y la hora exacta con vos por WhatsApp, según el programa y la disponibilidad de la pista — sin turnos fijos cerrados.</p>
      </div>
      <div class="card">
        <h2>Costo de la pista</h2>
        <p>${s.costo === "incluido"
          ? "En esta sede la tarifa de tus clases cubre el 100% de la pista y la iluminación."
          : "Si la tarifa de alquiler de la pista supera los S/ 80 por hora, la diferencia corre por tu cuenta. Siempre te avisamos el monto exacto antes de dejarte agendado."}</p>
        <p><a href="../../index.html#precios">Ver planes y tarifas →</a></p>
      </div>
      <div class="card">
        <h2>Qué hay en la sede</h2>
        <ul class="amenities">
${s.amenidades.map((a) => `          <li class="amenity-badge">${a}</li>`).join("\n")}
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2 class="section-title">Dónde queda</h2>
      <p class="section-sub">${esc(s.nombre)}, ${esc(s.direccion)}.</p>
      <div class="sede-mapa">
        <div class="map-embed">
          <iframe src="https://www.google.com/maps?q=${mapa}&amp;output=embed" title="Ubicación de ${esc(s.nombre)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
      <p class="sede-mapa-links"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&amp;query=${mapa}">Abrir en Google Maps →</a></p>
      <div class="card sede-llegar">
        <h3>Cómo llegar</h3>
        <p>Abrí la ubicación en Google Maps y te lleva desde donde estés, a pie, en auto o en transporte público.</p>
        <p><a class="btn btn-outline btn-small" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&amp;destination=${mapa}">Cómo llegar con Google Maps</a></p>
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <h2 class="section-title">Preguntas frecuentes sobre esta sede</h2>
      <div class="faq-list">
${preguntas(s).map(([n, r]) => `        <details class="faq-item"><summary>${esc(n)}</summary><p>${esc(r)}</p></details>`).join("\n")}
      </div>
      <p class="sede-mas"><a href="../../index.html#programas">Mirá todos los programas →</a></p>
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
    <p class="footer-copy">© ${new Date().getFullYear()} academiadepadel.pe. Todos los derechos reservados. · <a href="../../privacidad.html">Privacidad</a> · <a href="../../tienda/">Tienda</a></p>
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

const generadas = [];
for (const s of SEDES) {
  const dir = path.join(raiz, "sedes", s.slug); mkdirSync(dir, { recursive: true });
  const html = pagina(s);
  const visible = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  if (!tieneCompletar(s) && visible.includes("[COMPLETAR")) { console.error(`✘ ${s.slug}: tiene un [COMPLETAR] visible en una página pública`); process.exit(1); }
  writeFileSync(path.join(dir, "index.html"), html); generadas.push(s);
  console.log(`${tieneCompletar(s) ? "⚠ noindex (tiene [COMPLETAR])" : "✔"}  sedes/${s.slug}/index.html`);
}

// sitemap: solo las sedes completas
const sm = path.join(raiz, "sitemap.xml"); let x = readFileSync(sm, "utf8");
for (const s of generadas) {
  const loc = `<loc>${canonico(s)}</loc>`;
  if (!tieneCompletar(s) && !x.includes(loc)) x = x.replace("</urlset>", `  <url>\n    ${loc}\n  </url>\n</urlset>`);
}
writeFileSync(sm, x);
