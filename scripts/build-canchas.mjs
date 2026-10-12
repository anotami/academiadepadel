#!/usr/bin/env node
// Build script del directorio de canchas (Fase 4, punto 17-18 del plan de
// mejora). Genera contenido estático a partir de assets/js/canchas-data.js:
//
//   1. Pre-renderiza las tarjetas del catálogo, una intro (~300 palabras),
//      una FAQ de 5 preguntas y su FAQPage dentro de canchas-padel-lima.html
//      (entre marcadores <!-- BUILD:...:START/END -->), para que el
//      contenido exista en el HTML sin depender de que el navegador
//      ejecute JS. La versión interactiva (canchas-catalogo.js) sigue
//      funcionando igual encima: al cargar, reemplaza este HTML estático
//      por la versión con reseñas, filtros y orden en vivo.
//   2. Genera una página estática /canchas/<distrito>.html por cada
//      distrito con 2 o más canchas registradas (los distritos con una
//      sola cancha no tienen contenido suficiente para una página propia
//      y se quedan solo como filtro dentro del catálogo).
//   3. Actualiza sitemap.xml con esas páginas de distrito.
//
// No usa dependencias nuevas: solo Node (fs/path), tal como pide el plan.
// Se vuelve a ejecutar cada vez que cambien los datos de canchas-data.js:
//
//   node scripts/build-canchas.mjs
//
// Es idempotente: todo lo que toca está delimitado por marcadores
// BUILD:*:START/END, así que correrlo de nuevo no duplica nada.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://academiadepadel.pe";
const WHATSAPP = "51957085531";

const { CANCHAS } = await import(path.join(ROOT, "assets/js/canchas-data.js"));

// ---------- Utilidades ----------

function slug(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ESTADO_BADGE = {
  Habilitada: "badge-confirmada",
  Reservada: "badge-pendiente",
  Bloqueada: "badge-rechazada"
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceBetween(text, marker, html) {
  const re = new RegExp(`<!-- BUILD:${marker}:START -->[\\s\\S]*?<!-- BUILD:${marker}:END -->`);
  const block = `<!-- BUILD:${marker}:START -->\n${html}\n<!-- BUILD:${marker}:END -->`;
  if (!re.test(text)) throw new Error(`Marcador BUILD:${marker} no encontrado`);
  return text.replace(re, block);
}

// ---------- Distritos con página propia ----------

const conteo = {};
CANCHAS.forEach((c) => { conteo[c.distrito] = (conteo[c.distrito] || 0) + 1; });
const DISTRITOS_PAGINA = Object.keys(conteo)
  .filter((d) => conteo[d] >= 2)
  .sort((a, b) => a.localeCompare(b, "es"))
  .map((nombre) => ({ nombre, slug: slug(nombre), count: conteo[nombre] }));

// ---------- Tarjeta estática de una cancha ----------

function tarjetaEstatica(c, { relPrefix = "" } = {}) {
  const nombreMostrar = c.nombre.replace(" (nuestra academia)", "");
  const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nombreMostrar}, ${c.direccion}`)}`;
  const redesHtml = c.redesLinks.map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)}</a>`).join(" · ");
  const waTexto = encodeURIComponent(`Hola, vi ${nombreMostrar} en el directorio de academiadepadel.pe y quisiera consultar disponibilidad.`);
  const contacto = !c.telefono
    ? ""
    : /^519\d{8}$/.test(c.telefono)
      ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${c.telefono}?text=${waTexto}">WhatsApp</a>`
      : `<a class="btn btn-outline btn-small" href="tel:+${c.telefono}">Llamar</a>`;
  const techadaTexto = c.techada === true ? "Techada" : c.techada === false ? "Aire libre" : "Techada/aire libre: no especificado";
  const actualizaTexto = encodeURIComponent(`Hola, soy de ${nombreMostrar} y quiero actualizar nuestros datos en el directorio de canchas de academiadepadel.pe`);

  let media;
  if (c.foto) {
    media = `<img class="cancha-media-foto" src="${relPrefix}${c.foto.src}" alt="${esc(c.foto.alt)}" loading="lazy" width="300" height="180"><span class="cancha-foto-credito">Foto: Google Maps</span>`;
  } else if (c.logo) {
    media = `<div class="cancha-media-logo-wrap"><img class="cancha-media-logo" src="${relPrefix}${c.logo.src}" alt="${esc(c.logo.alt)}" loading="lazy"></div>`;
  } else {
    media = `<svg viewBox="0 0 120 80" class="cancha-media-svg" aria-hidden="true"><rect width="120" height="80" rx="10" fill="#14495a"/><rect x="14" y="10" width="92" height="60" rx="4" fill="none" stroke="#c8e94c" stroke-width="2"/><line x1="60" y1="10" x2="60" y2="70" stroke="#c8e94c" stroke-width="2"/><circle cx="60" cy="40" r="5" fill="#c8e94c"/></svg>`;
  }

  return `<article class="cancha-card${c.featured ? " cancha-card-featured" : ""}">
    <div class="cancha-media">
      ${media}
      ${c.featured ? '<span class="cancha-ribbon">Nuestra academia</span>' : ""}
    </div>
    <div class="cancha-body">
      <div class="cancha-head">
        <h3>${esc(nombreMostrar)}</h3>
        <span class="badge ${ESTADO_BADGE[c.estado] || ""}">${esc(c.estado)}</span>
      </div>
      <p class="cancha-distrito">${esc(c.distrito)}</p>
      <ul class="cancha-meta">
        <li><strong>Dirección:</strong> ${esc(c.direccion)}</li>
        <li><strong>Cancha:</strong> ${esc(c.cancha)}</li>
        <li><strong>Horario:</strong> ${esc(c.dias)}, ${esc(c.horario)}</li>
        <li><strong>Tarifa estimada:</strong> ${esc(c.tarifa)}</li>
        <li><strong>Tipo:</strong> ${techadaTexto}</li>
      </ul>
      <p class="cancha-redes">${redesHtml}</p>
      <div class="cancha-acciones">
        ${contacto}
        <a class="btn btn-outline btn-small" target="_blank" rel="noopener" href="${mapaUrl}">Ver mapa</a>
      </div>
      ${c.featured ? "" : `<a class="cancha-actualiza" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${actualizaTexto}">¿Eres el club? Actualiza tus datos</a>`}
    </div>
  </article>`;
}

// ---------- 1. Catálogo principal: tarjetas + intro + FAQ ----------

function buildCatalogoCards() {
  return CANCHAS.map((c) => tarjetaEstatica(c)).join("\n");
}

function buildDistritosLinks() {
  const items = DISTRITOS_PAGINA.map((d) => `<a href="canchas/${d.slug}.html">${esc(d.nombre)} (${d.count})</a>`).join("\n        ");
  return `<section class="catalogo-explora">
        <h2>Explora por distrito</h2>
        <div class="catalogo-explora-links">
        ${items}
        </div>
      </section>`;
}

function buildIntro() {
  const total = CANCHAS.length - 1; // sin contar la academia
  const distritoTop = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0][0];
  return `<section class="catalogo-intro">
        <h2>Cómo usar este directorio de canchas de pádel en Lima</h2>
        <p>
          Este directorio reúne ${total} clubes y canchas de pádel repartidos por Lima, además de
          <a href="index.html">academiadepadel.pe</a>, donde dictamos las clases. Cada ficha trae la
          dirección exacta, los días y horario de atención, una tarifa estimada por hora, el teléfono o
          WhatsApp del club y un enlace directo al mapa — toda información pública que reunimos para
          ahorrarte la búsqueda, no datos oficiales del club, así que confirma siempre precio y
          disponibilidad real antes de ir.
        </p>
        <p>
          ${esc(distritoTop)} es, por ahora, el distrito con más opciones registradas, pero puedes filtrar
          por cualquier distrito, buscar por nombre, ordenar por precio o por nombre, y pedir solo canchas
          techadas o al aire libre con el filtro "Techada o aire libre" — ese dato todavía no está
          confirmado para todos los clubes, así que aparece como "no especificado" hasta que lo verifiquemos
          club por club.
        </p>
        <p>
          Si ya jugaste en alguna de estas canchas, dejar tu calificación de 1 a 5 estrellas y un comentario
          corto le sirve al resto de la comunidad de pádel en Lima para elegir mejor. Y si eres parte de uno
          de estos clubes y algún dato está desactualizado, hay un enlace de "¿Eres el club? Actualiza tus
          datos" en cada ficha que te escribe directo por WhatsApp.
        </p>
      </section>`;
}

const FAQ_CATALOGO = [
  {
    p: "¿Cuánto cuesta alquilar una cancha de pádel en Lima?",
    r: "Según las tarifas estimadas que reunimos en este directorio, el rango más común está entre S/ 80 y S/ 150 por hora, variando según el club, el distrito y el horario. Siempre es una tarifa estimada: confirma el precio exacto con cada club antes de reservar."
  },
  {
    p: "¿Qué distrito de Lima tiene más canchas de pádel?",
    r: "Santiago de Surco es, dentro de los clubes que reunimos en este directorio, el distrito con más opciones registradas, seguido de Miraflores y La Molina. Puedes ver el listado completo filtrando por distrito más arriba."
  },
  {
    p: "¿Necesito llevar mi propia pala para jugar pádel?",
    r: "La mayoría de clubes de este directorio no incluye el alquiler de pala en la tarifa de cancha, así que conviene preguntar al reservar. Si tomas tu clase de prueba en academiadepadel.pe, te prestamos la pala sin costo."
  },
  {
    p: "¿Cómo reservo una cancha de las que aparecen en el directorio?",
    r: "Directamente con cada club: cada ficha tiene su WhatsApp, teléfono o redes sociales para coordinar la reserva. academiadepadel.pe no gestiona las reservas de los demás clubes, solo las propias."
  },
  {
    p: "¿Puedo dejar una reseña de una cancha en este directorio?",
    r: "Sí. En la ficha de cada cancha hay un botón \"Dejar reseña\" donde puedes calificar de 1 a 5 estrellas y escribir un comentario corto, visible para el resto de la comunidad."
  }
];

function buildFaqHtml() {
  const items = FAQ_CATALOGO.map((f, i) => `<details class="faq-item"${i === 0 ? " open" : ""}>
          <summary>${esc(f.p)}</summary>
          <p>${esc(f.r)}</p>
        </details>`).join("\n        ");
  return `<section class="catalogo-faq">
        <h2>Preguntas frecuentes sobre canchas de pádel en Lima</h2>
        <div class="faq-list">
        ${items}
        </div>
      </section>`;
}

function buildFaqPageJsonLd() {
  const doc = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_CATALOGO.map((f) => ({
      "@type": "Question",
      "name": f.p,
      "acceptedAnswer": { "@type": "Answer", "text": f.r }
    }))
  };
  return `<script type="application/ld+json">\n${JSON.stringify(doc)}\n</script>`;
}

// ---------- 2. Páginas por distrito ----------

function buildDistrictPage(d) {
  const clubes = CANCHAS.filter((c) => c.distrito === d.nombre && !c.featured);
  const otros = DISTRITOS_PAGINA.filter((o) => o.slug !== d.slug);
  const title = `Canchas de pádel en ${d.nombre}, Lima`;
  const withBrand = `${title} | academiadepadel.pe`;
  const titleTag = withBrand.length <= 60 ? withBrand : title.length <= 60 ? title : title.slice(0, 57) + "...";
  const metaDesc = `${clubes.length} canchas de pádel en ${d.nombre}, Lima: dirección, horario, tarifa estimada y mapa de cada club. Compara y reserva directo con el club.`;
  const descFinal = metaDesc.length <= 155 ? metaDesc : metaDesc.slice(0, 152) + "...";

  const tarjetas = clubes.map((c) => tarjetaEstatica(c, { relPrefix: "../" })).join("\n");

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Canchas de pádel en ${d.nombre}`,
    "itemListElement": clubes.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "SportsActivityLocation",
        "name": c.nombre,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": c.direccion,
          "addressLocality": c.distrito,
          "addressRegion": "Lima",
          "addressCountry": "PE"
        }
      }
    }))
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": `${SITE}/` },
      { "@type": "ListItem", "position": 2, "name": "Canchas de pádel en Lima", "item": `${SITE}/canchas-padel-lima.html` },
      { "@type": "ListItem", "position": 3, "name": d.nombre, "item": `${SITE}/canchas/${d.slug}.html` }
    ]
  };

  const otrosLinks = otros.map((o) => `<a href="${o.slug}.html">${esc(o.nombre)}</a>`).join(" · ");

  const mapaQuery = encodeURIComponent(`Canchas de pádel en ${d.nombre}, Lima, Perú`);

  return `<!DOCTYPE html>
<html lang="es-PE">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.gstatic.com https://*.googleapis.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.googleapis.com https://*.firebaseapp.com https://*.gstatic.com; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta name="referrer" content="strict-origin-when-cross-origin">

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C2DJ9V0L4Z"></script>
<script src="../assets/js/gtag-init.js?v=2"></script>

<title>${esc(titleTag)}</title>
<meta name="description" content="${esc(descFinal)}">
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="${SITE}/canchas/${d.slug}.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css?v=24">
<link rel="stylesheet" href="../assets/css/canchas-padel.css?v=4">

<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(descFinal)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_PE">
<meta property="og:url" content="${SITE}/canchas/${d.slug}.html">
<meta property="og:image" content="${SITE}/assets/img/court/paddles-court.jpg">
<meta name="twitter:card" content="summary_large_image">

<script type="application/ld+json">
${JSON.stringify(itemListLd)}
</script>
<script type="application/ld+json">
${JSON.stringify(breadcrumbLd)}
</script>
</head>
<body>

<a class="skip-link" href="#main">Saltar al contenido</a>

<header class="site-header" id="top">
  <div class="container header-inner">
    <a href="../index.html" class="brand">
      <img src="../assets/img/logo.svg" alt="academiadepadel.pe" class="brand-logo" width="36" height="36">
      <span>Academia de Pádel GP</span>
    </a>
    <a href="../canchas-padel-lima.html" class="test-back-link">← Volver al directorio</a>
  </div>
</header>

<main id="main">
  <section class="section">
    <div class="container">
      <p class="distrito-breadcrumb"><a href="../index.html">Inicio</a> › <a href="../canchas-padel-lima.html">Canchas de pádel en Lima</a> › ${esc(d.nombre)}</p>
      <p class="eyebrow eyebrow-center">Directorio por distrito</p>
      <h1 class="test-title" style="text-align:center;">Canchas de pádel en ${esc(d.nombre)}, Lima</h1>
      <p class="section-sub" style="text-align:center; max-width:720px; margin-left:auto; margin-right:auto;">
        ${clubes.length} cancha${clubes.length === 1 ? "" : "s"} de pádel en ${esc(d.nombre)} con dirección, horario,
        tarifa estimada y contacto directo. Si no vives en ${esc(d.nombre)}, mira también el
        <a href="../canchas-padel-lima.html">directorio completo de Lima</a> o el
        <a href="../canchas-padel-lima.html?distrito=${encodeURIComponent(d.nombre)}">catálogo filtrado e interactivo de ${esc(d.nombre)}</a>,
        con reseñas, mapa y calificaciones.
      </p>

      <div class="catalogo-mapa-distrito">
        <div class="catalogo-mapa-distrito-wrap">
          <iframe class="cancha-mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=${mapaQuery}&output=embed" title="Mapa de canchas de pádel en ${esc(d.nombre)}"></iframe>
        </div>
      </div>

      <div class="catalogo-grid">
${tarjetas}
      </div>

      <section class="catalogo-intro">
        <p>
          Estas son las canchas de pádel que registramos en ${esc(d.nombre)}, con la dirección, el horario
          de atención y una tarifa estimada por hora de cada club — confirma siempre precio y disponibilidad
          real directo con el club antes de ir, porque esta información es pública y puede cambiar. Si no
          encuentras cancha disponible en ${esc(d.nombre)}, el <a href="../canchas-padel-lima.html">directorio
          completo de Lima</a> tiene más de 30 opciones en otros distritos, y en
          <a href="../index.html">academiadepadel.pe</a> dictamos clases de pádel para adolescentes y adultos,
          con clase de prueba y pala incluida.
        </p>
      </section>

      ${otrosLinks ? `<section class="catalogo-explora">
        <h2>Otros distritos con canchas de pádel</h2>
        <div class="catalogo-explora-links">
        ${otrosLinks}
        </div>
      </section>` : ""}

      <section class="section-cta" style="margin-top:32px; border-radius:16px;">
        <div class="container cta-inner">
          <h2>¿Buscas clases, no solo cancha?</h2>
          <p>En academiadepadel.pe enseñamos pádel a adolescentes y adultos en grupos reducidos, con clase de prueba disponible.</p>
          <a class="btn btn-whatsapp btn-large" target="_blank" rel="noopener"
             href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, vi el directorio de canchas de ${d.nombre} en academiadepadel.pe y quiero información sobre las clases`)}">
            Quiero mi clase de prueba
          </a>
        </div>
      </section>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div class="brand footer-brand">
      <img src="../assets/img/logo.svg" alt="" width="28" height="28">
      <span>Academia de Pádel GP</span>
    </div>
    <p>Lima, Perú · <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a> · <a href="https://www.instagram.com/academiapadelgp/" target="_blank" rel="noopener">Instagram</a></p>
    <p class="footer-copy">© <span id="year"></span> academiadepadel.pe. Todos los derechos reservados. · <a href="../privacidad.html">Privacidad</a> · <a href="../arbitro.html" rel="nofollow">Árbitro</a> · <a href="../login.html" rel="nofollow">Acceso Portal</a></p>
  </div>
</footer>

<script src="../assets/js/main.js?v=13"></script>
<script src="../assets/js/cookie-banner.js?v=1"></script>
</body>
</html>
`;
}

// ---------- Ejecutar ----------

const catalogoPath = path.join(ROOT, "canchas-padel-lima.html");
let catalogoHtml = readFileSync(catalogoPath, "utf8");
catalogoHtml = replaceBetween(catalogoHtml, "CATALOGO", buildCatalogoCards());
catalogoHtml = replaceBetween(catalogoHtml, "DISTRITOS", buildDistritosLinks());
catalogoHtml = replaceBetween(catalogoHtml, "INTRO", buildIntro());
catalogoHtml = replaceBetween(catalogoHtml, "FAQ", buildFaqHtml());
catalogoHtml = replaceBetween(catalogoHtml, "FAQPAGE", buildFaqPageJsonLd());
writeFileSync(catalogoPath, catalogoHtml);
console.log("✔ canchas-padel-lima.html actualizado (tarjetas, intro, FAQ, FAQPage, enlaces por distrito)");

const districtDir = path.join(ROOT, "canchas");
mkdirSync(districtDir, { recursive: true });
for (const d of DISTRITOS_PAGINA) {
  writeFileSync(path.join(districtDir, `${d.slug}.html`), buildDistrictPage(d));
}
console.log(`✔ ${DISTRITOS_PAGINA.length} páginas de distrito generadas en /canchas/`);

const sitemapPath = path.join(ROOT, "sitemap.xml");
let sitemap = readFileSync(sitemapPath, "utf8");
const sitemapEntries = DISTRITOS_PAGINA.map((d) => `  <url>
    <loc>${SITE}/canchas/${d.slug}.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n");
sitemap = replaceBetween(sitemap, "DISTRITOS", sitemapEntries);
writeFileSync(sitemapPath, sitemap);
console.log("✔ sitemap.xml actualizado con las páginas de distrito");
