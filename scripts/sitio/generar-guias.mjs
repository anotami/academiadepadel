#!/usr/bin/env node
// Genera /guias/ (índice) y las guías nuevas (/guias/<slug>/). Las guías existentes (beneficios, equipamiento, ejercicios, glosario, categorías,
// reglas y pistas) se listan leyendo su <title> y su meta description, así el índice nunca queda desfasado.
// Uso: node scripts/sitio/generar-guias.mjs
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARCA, waLink } from "./datos.mjs";
import { pagina, esc } from "./plantilla.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const D = MARCA.dominio;
const org = { "@type": "Organization", name: MARCA.nombre, url: D + "/" };
const autor = { "@type": "Person", name: "Gabriel Pizarro", url: D + "/sobre-gabriel/" };

// ---------- Guías nuevas (una por semana). Todo el contenido sale de material ya publicado y validado en el sitio. ----------
export const GUIAS = [
  { slug: "empunadura-continental", fecha: "2026-11-25", etiqueta: "Técnica", imagen: "court/grip-detail", imagenAlt: "Primer plano de la empuñadura de una pala de pádel",
    titulo: "Empuñadura continental en pádel",
    h1: "Empuñadura continental: cómo agarrar la pala de pádel",
    descripcion: "Cómo agarrar la pala de pádel con la empuñadura continental, la base de todos los golpes: paso a paso, el error más común y cómo corregirlo.",
    lead: "La empuñadura continental es la base de todos los golpes. Acá ves cómo agarrar la pala, cómo saber si la tenés bien y cómo corregir el error más común.",
    seccionIntro: ["¿Qué es la empuñadura continental?", "Es la forma de tomar el mango que usamos como base para todos los golpes. La idea es simple: «darle la mano» a la pala, buscando que el vértice entre el pulgar y el índice quede en el centro del mango."],
    pasos: ["Sostené la pala «dándole la mano» al mango.", "Buscá que el vértice entre el pulgar y el índice quede en el centro del mango.", "Pedile a alguien, o a tu profesor, que mire la toma para verificarla.", "Si te cuesta ubicarla, marcá el grip con una lapicera para sentir cuál es la posición correcta."],
    error: ["El error más común", "Agarrar el mango como un martillo (el agarre de tenis), con la palma plana contra la cara de la pala. Así el golpe sale cerrado y sin control.", "Cómo corregirlo: volvé a «darle la mano» al mango, despacio, y fijate que el pulgar quede ligeramente por detrás, no al costado."],
    practica: ["Para practicarla", ["Más fácil: mirá tu propia mano mientras armás el agarre, sin pala, para sentir primero el vértice entre el pulgar y el índice.", "Más difícil: cambiá el agarre entre continental y lateral (cerrado y abierto) con los ojos cerrados, solo por el tacto."], "Para cerrar: ¿en qué parte de la mano sentís el vértice del mango?"],
    fuente: "Esta guía se basa en el ejercicio «Dale la mano a tu pala» de nuestro banco de ejercicios, que sigue el Manual de entrenador (empuñadura, páginas 4 y 5, y corrección de errores, página 23).",
    relacionados: [["../../ejercicios-padel.html", "Banco de ejercicios por nivel"], ["../../glosario-padel.html", "Glosario de pádel"], ["../../clases/inicial/", "Clases para principiantes"], ["../../equipamiento-padel.html", "Qué equipamiento necesitás para empezar"]] }
];

// ---------- Guías ya publicadas ----------
const EXISTENTES = [
  ["beneficios-del-padel.html", "Beneficios"], ["equipamiento-padel.html", "Equipamiento"], ["ejercicios-padel.html", "Ejercicios"],
  ["glosario-padel.html", "Glosario"], ["categorias-padel.html", "Categorías"], ["faq-padel.html", "Reglas"], ["canchas-padel-lima.html", "Pistas de Lima"]
];
const leer = (f) => readFileSync(path.join(raiz, f), "utf8");
const dato = (f) => { const h = leer(f);
  const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1].replace(/\s*\|\s*academiadepadel\.pe\s*$/i, "").replace(/&amp;/g, "&");
  const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1].replace(/&amp;/g, "&"); return { t, d }; };
const corto = (d) => d.length > 150 ? d.slice(0, d.lastIndexOf(" ", 147)) + "…" : d;
const fechaLarga = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const migas = (items) => `<nav class="breadcrumb" aria-label="Ubicación en el sitio">${items.map(([h, t]) => h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join(" › ")}</nav>`;
const bc = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([u, n], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: u })) });

mkdirSync(path.join(raiz, "guias"), { recursive: true });

// ---------- Páginas de cada guía nueva ----------
for (const g of GUIAS) {
  const url = `${D}/guias/${g.slug}/`;
  const main = `  <section class="section sede-hero">
    <div class="container guia-cuerpo">
      ${migas([["../../index.html", "Inicio"], ["../", "Guías"], [null, g.h1.split(":")[0]]])}
      <p class="eyebrow">Guía · ${esc(g.etiqueta)}</p>
      <h1>${esc(g.h1)}</h1>
      <p class="sede-lead">${esc(g.lead)}</p>
      <p class="guia-meta">Por <a href="../../sobre-gabriel/">Gabriel Pizarro</a> · Publicada el ${fechaLarga(g.fecha)}</p>
      <picture><source srcset="../../assets/img/${g.imagen}.webp" type="image/webp"><img class="guia-foto" src="../../assets/img/${g.imagen}.jpg" alt="${esc(g.imagenAlt)}" width="1146" height="761" fetchpriority="high"></picture>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container guia-cuerpo">
      <h2>${esc(g.seccionIntro[0])}</h2>
      <p>${esc(g.seccionIntro[1])}</p>
      <h2>Cómo agarrarla, paso a paso</h2>
      <ol class="sede-lista">
${g.pasos.map((p) => `        <li>${esc(p)}</li>`).join("\n")}
      </ol>
      <h2>${esc(g.error[0])}</h2>
      <p>${esc(g.error[1])}</p>
      <p>${esc(g.error[2])}</p>
      <h2>${esc(g.practica[0])}</h2>
      <ul class="sede-lista">
${g.practica[1].map((p) => `        <li>${esc(p)}</li>`).join("\n")}
      </ul>
      <p>${esc(g.practica[2])}</p>
      <p class="guia-fuente">${esc(g.fuente)}</p>
    </div>
  </section>

  <section class="section">
    <div class="container guia-cuerpo">
      <h2>¿Querés que alguien mire tu agarre?</h2>
      <p>En una clase de prueba te corregimos la toma y vemos tu nivel real. Escribinos y coordinamos el horario con vos.</p>
      <div class="sede-cta"><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${waLink("Hola, leí la guía de empuñadura y quiero reservar una clase de prueba")}">Reservá tu clase de prueba</a></div>
      <ul class="sede-relacionados">
${g.relacionados.map(([h, t]) => `        <li><a href="${h}">${esc(t)} →</a></li>`).join("\n")}
      </ul>
    </div>
  </section>`;
  const grafo = [
    { "@type": "Article", "@id": url + "#articulo", headline: g.h1, description: g.descripcion, image: `${D}/assets/img/${g.imagen}.jpg`, datePublished: g.fecha, dateModified: g.fecha, inLanguage: "es-PE", author: autor, publisher: org, mainEntityOfPage: url },
    { "@type": "HowTo", name: g.h1, description: g.descripcion, step: g.pasos.map((p, i) => ({ "@type": "HowToStep", position: i + 1, text: p })) },
    bc([[D + "/", "Inicio"], [D + "/guias/", "Guías"], [url, g.h1.split(":")[0]]])
  ];
  mkdirSync(path.join(raiz, "guias", g.slug), { recursive: true });
  writeFileSync(path.join(raiz, "guias", g.slug, "index.html"), pagina({ up: "../../", slug: `guias/${g.slug}/`, titulo: g.titulo, descripcion: g.descripcion, og: g.imagen, grafo, main, volver: ["guias/", "← Todas las guías"] }));
  console.log(`✔  guias/${g.slug}/index.html`);
}

// ---------- Índice ----------
const tarjetas = [
  ...GUIAS.map((g) => ({ href: `${g.slug}/`, abs: `${D}/guias/${g.slug}/`, etiqueta: `Nueva · ${g.etiqueta}`, t: g.h1, d: g.descripcion })),
  ...EXISTENTES.map(([f, et]) => { const x = dato(f); return { href: `../${f}`, abs: `${D}/${f}`, etiqueta: et, t: x.t, d: x.d }; })
];
const idx = `  <section class="section sede-hero">
    <div class="container">
      ${migas([["../index.html", "Inicio"], [null, "Guías"]])}
      <p class="eyebrow">Aprendé pádel</p>
      <h1>Guías de pádel para aprender y entender el juego</h1>
      <p class="sede-lead">Guías escritas por Gabriel Pizarro, para empezar bien, practicar con criterio y entender las reglas. Sumamos una nueva cada semana.</p>
      <div class="sede-cta"><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${waLink("Hola, quiero reservar una clase de prueba")}">Reservá tu clase de prueba</a></div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container sede-bloques guias-grid">
${tarjetas.map((t) => `      <a class="card guia-tarjeta" href="${t.href}"><span class="guia-etiqueta">${esc(t.etiqueta)}</span><h2>${esc(t.t)}</h2><p>${esc(corto(t.d))}</p><span class="guia-leer">Leer la guía →</span></a>`).join("\n")}
    </div>
  </section>`;
const grafoIdx = [
  { "@type": "CollectionPage", "@id": `${D}/guias/#coleccion`, name: "Guías de pádel", url: `${D}/guias/`, inLanguage: "es-PE", publisher: org, mainEntity: { "@type": "ItemList", itemListElement: tarjetas.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: t.abs, name: t.t })) } },
  bc([[D + "/", "Inicio"], [D + "/guias/", "Guías"]])
];
writeFileSync(path.join(raiz, "guias", "index.html"), pagina({ up: "../", slug: "guias/", titulo: "Guías de pádel para aprender", descripcion: "Guías de pádel de Academia de Pádel GP: técnica, equipamiento, ejercicios, reglas y pistas de Lima, para aprender y entender el juego.", og: "court/paddles-court", grafo: grafoIdx, main: idx }));
console.log(`✔  guias/index.html (${tarjetas.length} guías)`);
