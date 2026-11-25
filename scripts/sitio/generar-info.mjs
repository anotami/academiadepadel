#!/usr/bin/env node
// Genera /sobre-gabriel/ y /preguntas-frecuentes/. Todo sale de lo ya publicado en la home (#quien-soy y #faq): no se inventa nada.
// Uso: node scripts/sitio/generar-info.mjs
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARCA, SEDES, waLink } from "./datos.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const limpiar = (t) => t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const CSP = "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.gstatic.com https://*.googleapis.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://www.google-analytics.com https://*.googleusercontent.com https://*.gstatic.com; connect-src 'self' https://www.google-analytics.com https://*.googleapis.com https://*.firebaseapp.com https://*.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'";
const org = { "@type": "Organization", name: MARCA.nombre, url: MARCA.dominio + "/" };

function cuerpo(p) {
  return `<!DOCTYPE html>
<html lang="es-PE">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C2DJ9V0L4Z"></script>
<script src="../assets/js/gtag-init.js?v=2"></script>

<title>${esc(p.titulo)} | ${MARCA.nombre}</title>
<meta name="description" content="${esc(p.descripcion)}">
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="${MARCA.dominio}/${p.slug}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css?v=66">
<link rel="stylesheet" href="../assets/css/sedes.css?v=4">

<meta property="og:title" content="${esc(p.titulo)} | ${MARCA.nombre}">
<meta property="og:description" content="${esc(p.descripcion)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_PE">
<meta property="og:url" content="${MARCA.dominio}/${p.slug}/">
<meta property="og:image" content="${MARCA.dominio}/assets/img/${p.og}.jpg">
<meta name="twitter:card" content="summary_large_image">

<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": p.grafo })}</script>
</head>
<body>

<a class="skip-link" href="#main">Saltar al contenido</a>

<header class="site-header" id="top">
  <div class="container header-inner">
    <a href="../index.html" class="brand">
      <img src="../assets/img/logo.svg" alt="${MARCA.nombre}" class="brand-logo" width="36" height="36">
      <span>${MARCA.nombre}</span>
    </a>
    <a href="../index.html" class="test-back-link">← Volver al inicio</a>
  </div>
</header>

<main id="main">
${p.main}
</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div class="brand footer-brand">
      <img src="../assets/img/logo.svg" alt="" width="28" height="28">
      <span>${MARCA.nombre}</span>
    </div>
    <p>Lima, Perú · <a href="${waLink("Hola, quiero más información sobre las clases")}" target="_blank" rel="noopener">WhatsApp ${MARCA.telefono}</a> · <a href="${MARCA.instagram}" target="_blank" rel="noopener">Instagram @academiapadelgp</a></p>
    <p class="footer-copy">© ${new Date().getFullYear()} academiadepadel.pe. Todos los derechos reservados. · <a href="../privacidad.html">Privacidad</a> · <a href="../tienda/">Tienda</a></p>
  </div>
</footer>

<a class="whatsapp-float" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp" href="${waLink("Hola, vi academiadepadel.pe y quiero más información")}">
  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.26.62 4.38 1.7 6.2L4 29l7.94-1.65a12 12 0 0 0 4.08.71h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm0 21.86h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.78.8-3.65-.24-.37a9.87 9.87 0 0 1-1.51-5.2c0-5.46 4.45-9.9 9.92-9.9 2.64 0 5.12 1.03 6.99 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9z"/></svg>
</a>

<script src="../assets/js/main.js?v=14"></script>
<script src="../assets/js/cookie-banner.js?v=1"></script>
</body>
</html>
`;
}
const migas = (nombre) => `<nav class="breadcrumb" aria-label="Ubicación en el sitio"><a href="../index.html">Inicio</a> › <span>${esc(nombre)}</span></nav>`;
const bc = (nombre, slug) => ({ "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: MARCA.dominio + "/" }, { "@type": "ListItem", position: 2, name: nombre, item: `${MARCA.dominio}/${slug}/` }] });
const foto = (n, alt, w, h, extra = "") => `<picture><source srcset="../assets/img/gabriel/${n}.webp" type="image/webp"><img src="../assets/img/gabriel/${n}.jpg" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy"${extra}></picture>`;

// ---------- Preguntas frecuentes (desde el #faq de la home) ----------
const home = readFileSync(path.join(raiz, "index.html"), "utf8");
const faqHome = home.match(/<section[^>]*id="faq"[\s\S]*?<\/section>/)[0];
const preguntas = [...faqHome.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [limpiar(m[1]), limpiar(m[2])]);
if (preguntas.length < 8) { console.error("No encontré las preguntas de la home"); process.exit(1); }

const faq = { slug: "preguntas-frecuentes", titulo: "Preguntas frecuentes de las clases", og: "court/paddles-court",
  descripcion: "Respuestas sobre las clases de pádel de Academia de Pádel GP en Lima: experiencia previa, qué llevar, grupos, sedes, costo de pista, reservas y cancelaciones.",
  grafo: [{ "@type": "FAQPage", "@id": `${MARCA.dominio}/preguntas-frecuentes/#faq`, mainEntity: preguntas.map(([n, r]) => ({ "@type": "Question", name: n, acceptedAnswer: { "@type": "Answer", text: r } })) }, bc("Preguntas frecuentes", "preguntas-frecuentes")],
  main: `  <section class="section sede-hero">
    <div class="container">
      ${migas("Preguntas frecuentes")}
      <p class="eyebrow">Clases de pádel en Lima</p>
      <h1>Preguntas frecuentes sobre las clases</h1>
      <p class="sede-lead">Lo que más nos preguntan antes de la primera clase. Si no encontrás lo tuyo, escribinos por WhatsApp.</p>
      <div class="sede-cta"><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${waLink("Hola, tengo una consulta sobre las clases de pádel")}">Consultanos por WhatsApp</a></div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <div class="faq-list">
${preguntas.map(([n, r]) => `        <details class="faq-item"><summary>${esc(n)}</summary><p>${esc(r)}</p></details>`).join("\n")}
      </div>
      <ul class="sede-relacionados">
        <li><a href="../clases/inicial/">Clases para principiantes →</a></li>
        <li><a href="../clases/particulares/">Clases particulares →</a></li>
        <li><a href="../index.html#horarios">Sedes y horarios →</a></li>
        <li><a href="../index.html#precios">Planes y tarifas →</a></li>
      </ul>
    </div>
  </section>` };

// ---------- Sobre Gabriel (desde #quien-soy de la home) ----------
const gab = { slug: "sobre-gabriel", titulo: "Gabriel Pizarro, profesor de pádel en Lima", og: "gabriel/gabriel-3",
  descripcion: "Soy Gabriel Pizarro, profesor de pádel en Lima: Curso de Entrenador de Pádel, Clínica de Arbitraje de la FPP y clases en grupos pequeños para aprender.",
  grafo: [{ "@type": "Person", "@id": `${MARCA.dominio}/sobre-gabriel/#gabriel`, name: "Gabriel Pizarro", jobTitle: "Profesor de pádel", url: `${MARCA.dominio}/sobre-gabriel/`,
    image: `${MARCA.dominio}/assets/img/gabriel/gabriel-3.jpg`, worksFor: org, sameAs: [MARCA.instagram], knowsAbout: ["Pádel", "Enseñanza del pádel", "Arbitraje de pádel"],
    description: "Profesor de pádel en Lima. Hizo el Curso de Entrenador de Pádel (Alta Competencia y Etapas Formativas) y participó en la Clínica de Arbitraje de la Federación Peruana de Pádel." }, bc("Sobre Gabriel", "sobre-gabriel")],
  main: `  <section class="section sede-hero">
    <div class="container sede-hero-grid">
      <div class="sede-hero-texto">
        ${migas("Sobre Gabriel")}
        <p class="eyebrow">Quién enseña</p>
        <h1>Soy Gabriel Pizarro, profesor de pádel en Lima</h1>
        <p class="sede-lead">Jugué mucho pádel en mi adolescencia y lo seguí jugando de grande: nunca lo dejé. Hoy enseño en grupos pequeños, para que cada alumno se vaya de la clase con algo de valor.</p>
        <div class="sede-cta">
          <a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${waLink("Hola Gabriel, quiero reservar una clase de prueba")}">Reservá tu clase de prueba</a>
          <a class="btn btn-outline" href="../index.html#programas">Ver los programas</a>
        </div>
      </div>
      <div class="sede-hero-foto">${foto("gabriel-3", "Gabriel Pizarro sonriendo en la pista de pádel", 639, 1100, ' style="aspect-ratio:3/4;object-fit:cover;max-height:520px"')}</div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container sede-bloques">
      <div class="card">
        <h2>Mi recorrido</h2>
        <ul class="sede-lista">
          <li>Jugué mucho pádel en mi adolescencia y lo seguí jugando de grande.</li>
          <li>Hice el Curso de Entrenador de Pádel (Alta Competencia y Etapas Formativas) en Academia de Pádel, Argentina. Ahí confirmé algo que ya sospechaba: enseñar me gusta tanto como jugar.</li>
          <li>Participé en la Clínica de Arbitraje de la Federación Peruana de Pádel. Por eso, además de las clases, armé una <a href="../arbitro.html">herramienta de arbitraje gratuita</a> para la comunidad.</li>
        </ul>
      </div>
      <div class="card">
        <h2>Cómo enseño</h2>
        <ul class="sede-lista">
          <li>Grupos pequeños, de 1 a 4 alumnos por clase, con foco en la corrección individual de la técnica.</li>
          <li>3 niveles de progresión, con objetivos claros en cada etapa.</li>
          <li>Un ambiente donde equivocarse forma parte de aprender, sin presión de torneo.</li>
        </ul>
      </div>
      <div class="card">
        <h2>Con quién trabajo</h2>
        <ul class="sede-lista">
          <li>Adolescentes que recién empiezan y adultos que buscan actividad física, socialización y bienestar.</li>
          <li>Programa Junior, de 8 a 15 años.</li>
          <li>Mi terreno es la iniciación y la consolidación de nivel; no compito con clubes de alto rendimiento.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container sede-bloques sede-bloques-2">
      <div class="card">
        <h2>Por qué doy clases</h2>
        <p>Para mí el pádel es un hobby que me permite conocer gente y, sobre todo, dejarles algo. Esa es mi motivación detrás de academiadepadel.pe: no es llenar pistas, es que cada alumno se vaya de cada clase con algo de valor.</p>
      </div>
      <figure class="card sede-foto-clinica">
        ${foto("arbitraje-clinica-recorte", "Gabriel con otros participantes de la Clínica de Arbitraje de la Federación Peruana de Pádel", 900, 805)}
        <figcaption>Clínica de Arbitraje de la Federación Peruana de Pádel.</figcaption>
      </figure>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <h2 class="section-title">Empezá cuando quieras</h2>
      <ul class="sede-relacionados">
        <li><a href="../clases/inicial/">Clases para principiantes →</a></li>
        <li><a href="../clases/intermedio/">Clases de nivel intermedio →</a></li>
        <li><a href="../clases/particulares/">Clases particulares →</a></li>
        <li><a href="../preguntas-frecuentes/">Preguntas frecuentes →</a></li>
      </ul>
    </div>
  </section>` };

const sm = path.join(raiz, "sitemap.xml"); let x = readFileSync(sm, "utf8");
for (const p of [faq, gab]) {
  mkdirSync(path.join(raiz, p.slug), { recursive: true });
  const html = cuerpo(p);
  if (/\[COMPLETAR/.test(html.replace(/<!--[\s\S]*?-->/g, ""))) { console.error(`✘ ${p.slug}: [COMPLETAR] visible`); process.exit(1); }
  writeFileSync(path.join(raiz, p.slug, "index.html"), html); console.log(`✔  ${p.slug}/index.html`);
  const loc = `<loc>${MARCA.dominio}/${p.slug}/</loc>`;
  if (!x.includes(loc)) x = x.replace("</urlset>", `  <url>\n    ${loc}\n  </url>\n</urlset>`);
}
writeFileSync(sm, x);
