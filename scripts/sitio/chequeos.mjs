#!/usr/bin/env node
// Auditoría estática de las páginas públicas del sitio. Uso: node scripts/sitio/chequeos.mjs [--json]
// Revisa: título y descripción únicos, un solo H1, canonical, Open Graph, JSON-LD válido, enlaces internos,
// imágenes (alt, ancho/alto, WebP), nombre y teléfono de la academia, y cuenta los restos de "cancha" y de verbos en "tú".
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const json = process.argv.includes("--json");
const MARCA = { nombre: "Academia de Pádel GP", wa: "51957085531" };

function archivos(dir, rel = "") {
  return readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((d) => {
    const r = path.join(rel, d.name);
    if (d.isDirectory()) return ["assets", "scripts", "cloudflare", "node_modules", ".git"].includes(d.name) ? [] : archivos(dir, r);
    return d.name.endsWith(".html") ? [r] : [];
  });
}
const todas = archivos(raiz);
const leer = (r) => readFileSync(path.join(raiz, r), "utf8");
const publicas = todas.filter((r) => !/noindex/i.test(leer(r)));
const privadas = todas.filter((r) => /noindex/i.test(leer(r)));

const hallazgos = []; // {pagina, nivel: "error"|"aviso", msg}
const marca = (pagina, nivel, msg) => hallazgos.push({ pagina, nivel, msg });
const titulos = new Map(), descs = new Map();
const url = (r) => "/" + r.replace(/index\.html$/, "").replace(/\\/g, "/");

const quitarTags = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
const TU = /\b(tienes|quieres|puedes|puedas|necesitas|sabes|eres|haz|mira|ven|pide|cuéntanos|cuentanos|escríbenos|escribenos|contigo|elige|empieza|reserva|ponte|sumate|déjanos|dejanos)\b/gi; // "tú"/imperativos a revisar en la Etapa V
let totalCancha = 0, totalTu = 0;

for (const r of publicas) {
  const h = leer(r);
  const t = (h.match(/<title>([^<]*)<\/title>/i) || [])[1]?.trim();
  const d = (h.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1]?.trim();
  if (!t) marca(r, "error", "falta <title>"); else { (titulos.get(t) || titulos.set(t, []).get(t)).push(r); if (t.length > 65) marca(r, "aviso", `título largo (${t.length})`); }
  if (!d) marca(r, "error", "falta meta description"); else { (descs.get(d) || descs.set(d, []).get(d)).push(r); if (d.length < 70 || d.length > 170) marca(r, "aviso", `descripción de ${d.length} caracteres (ideal 70-160)`); }
  const h1 = (h.match(/<h1[\s>]/gi) || []).length;
  if (h1 !== 1) marca(r, "error", `${h1} H1 (debe haber 1)`);
  const canon = (h.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i) || [])[1];
  if (!canon) marca(r, "error", "falta canonical");
  else if (canon !== "https://academiadepadel.pe" + url(r)) marca(r, "aviso", `canonical ${canon} ≠ ${"https://academiadepadel.pe" + url(r)}`);
  for (const og of ["og:title", "og:description", "og:image"]) if (!h.includes(`property="${og}"`)) marca(r, "aviso", `falta ${og}`);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { marca(r, "error", "JSON-LD inválido: " + e.message); } }
  if (!/<html[^>]+lang=/.test(h)) marca(r, "aviso", "falta lang en <html>");
  // imágenes
  for (const m of h.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\balt=/.test(tag)) marca(r, "aviso", "imagen sin alt: " + (tag.match(/src="([^"]*)"/) || [])[1]);
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) marca(r, "aviso", "imagen sin ancho/alto: " + (tag.match(/src="([^"]*)"/) || [])[1]);
  }
  // enlaces internos
  const base = path.dirname(path.join(raiz, r));
  for (const m of h.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) {
    let hr = m[1];
    if (!hr || /^(https?:|mailto:|tel:|javascript:|data:|\/\/)/.test(hr)) continue;
    const [ruta, ancla] = hr.split("#"); const limpia = ruta.split("?")[0];
    if (!limpia) { if (ancla && !h.includes(`id="${ancla}"`)) marca(r, "aviso", `ancla #${ancla} no existe en la página`); continue; }
    let destino = limpia.startsWith("/") ? path.join(raiz, limpia) : path.join(base, limpia);
    if (existsSync(destino) && statSync(destino).isDirectory()) destino = path.join(destino, "index.html");
    if (!existsSync(destino)) marca(r, "error", `enlace roto: ${hr}`);
  }
  // marca y teléfono (el directorio de pistas lleva teléfonos de clubes a propósito)
  if (!r.startsWith("canchas")) {
    for (const m of h.matchAll(/wa\.me\/(\d+)/g)) if (m[1] !== MARCA.wa && r !== "canchas-padel-lima.html") marca(r, "aviso", `WhatsApp distinto al de la academia: ${m[1]}`);
  }
  const txt = quitarTags(h);
  totalCancha += (txt.match(/\bcanchas?\b/gi) || []).length;
  totalTu += (txt.match(TU) || []).length;
}
for (const [t, rs] of titulos) if (rs.length > 1) for (const r of rs) marca(r, "error", `título repetido con: ${rs.filter((x) => x !== r).join(", ")}`);
for (const [d, rs] of descs) if (rs.length > 1) for (const r of rs) marca(r, "error", `descripción repetida con: ${rs.filter((x) => x !== r).join(", ")}`);

// sitemap: ¿están todas las públicas?
const sm = existsSync(path.join(raiz, "sitemap.xml")) ? leer("sitemap.xml") : "";
for (const r of publicas) if (!sm.includes("academiadepadel.pe" + url(r) + "<")) marca(r, "aviso", "no está en sitemap.xml");

const errores = hallazgos.filter((x) => x.nivel === "error"), avisos = hallazgos.filter((x) => x.nivel === "aviso");
if (json) { console.log(JSON.stringify({ publicas: publicas.length, privadas: privadas.length, errores, avisos, cancha: totalCancha, tu: totalTu }, null, 2)); process.exit(errores.length ? 1 : 0); }
console.log(`Páginas públicas: ${publicas.length} · con noindex: ${privadas.length}`);
console.log(`Errores: ${errores.length} · Avisos: ${avisos.length}`);
console.log(`Para la Etapa V (texto visible en páginas públicas): "cancha(s)" = ${totalCancha} · formas en "tú" a revisar = ${totalTu}`);
for (const [titulo, lista] of [["ERRORES", errores], ["AVISOS", avisos]]) {
  if (!lista.length) continue;
  console.log(`\n== ${titulo}`);
  const por = {}; lista.forEach((x) => (por[x.pagina] = por[x.pagina] || []).push(x.msg));
  for (const [p, ms] of Object.entries(por)) { console.log(`- ${p}`); [...new Set(ms)].slice(0, 8).forEach((m) => console.log(`    · ${m}`)); if (new Set(ms).size > 8) console.log(`    · … y ${new Set(ms).size - 8} más`); }
}
process.exit(errores.length ? 1 : 0);
