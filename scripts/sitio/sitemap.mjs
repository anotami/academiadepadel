#!/usr/bin/env node
// Genera sitemap.xml con las páginas públicas (sin noindex) y la fecha real del último cambio de cada una (git log).
// Uso: node scripts/sitio/sitemap.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DOMINIO = "https://academiadepadel.pe";
// Páginas públicas que NO van al sitemap a propósito (son utilitarias o dependen de un evento activo).
const FUERA = new Set(["evento.html", "jornada.html", "links.html"]);
const IGNORAR = new Set(["assets", "scripts", "cloudflare", "node_modules", ".git"]);

const html = (dir = "") => readdirSync(path.join(raiz, dir), { withFileTypes: true }).flatMap((d) => {
  const r = path.join(dir, d.name);
  if (d.isDirectory()) return IGNORAR.has(d.name) ? [] : html(r);
  return d.name.endsWith(".html") ? [r] : [];
});
const url = (r) => r === "index.html" ? "/" : r.endsWith("/index.html") ? "/" + r.slice(0, -"index.html".length) : "/" + r;
const fecha = (r) => { try { return execFileSync("git", ["log", "-1", "--format=%cs", "--", r], { cwd: raiz, encoding: "utf8" }).trim() || null; } catch { return null; } };
const peso = (u) => u === "/" ? 0 : u.startsWith("/sedes/") ? 1 : u.startsWith("/clases/") ? 2 : (u === "/sobre-gabriel/" || u === "/preguntas-frecuentes/") ? 3 : u.startsWith("/guias/") ? 3.5 : u.startsWith("/canchas") ? 6 : 4;

const paginas = html().filter((r) => !/noindex/i.test(readFileSync(path.join(raiz, r), "utf8")) && !FUERA.has(r))
  .map((r) => ({ u: url(r), f: fecha(r) })).sort((a, b) => peso(a.u) - peso(b.u) || a.u.localeCompare(b.u));
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paginas.map((p) => `  <url>\n    <loc>${DOMINIO}${p.u}</loc>${p.f ? `\n    <lastmod>${p.f}</lastmod>` : ""}\n  </url>`).join("\n")}\n</urlset>\n`;
writeFileSync(path.join(raiz, "sitemap.xml"), xml);
console.log(`sitemap.xml: ${paginas.length} páginas`);
