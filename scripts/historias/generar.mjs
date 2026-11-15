#!/usr/bin/env node
// Genera las imágenes de las historias de Instagram (2 por día, 1080x1920 JPG) con las fotos de Gabriel.
// Usa el mismo dibujo que historias.html (assets/js/historias-render.js), en un Chrome sin pantalla.
//
//   node scripts/historias/generar.mjs --desde 2026-11-16 --dias 28 --fotos /ruta/fotos --salida /ruta/salida
//
// --fotos: carpeta con las fotos (los nombres deben existir en FOCOS de historias-render.js, ej. yo-5718.jpg)
// --fuentes: carpeta con sora-latin-{600,700,800}-normal.woff2 y manrope-latin-{600,700,800}-normal.woff2 (opcional)
// Requiere Playwright (import "playwright"). Escribe también manifest.json con fecha, hora y link de cada pieza.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i >= 0 ? process.argv[i + 1] : d; };
const desde = arg("desde"), dias = Number(arg("dias", "28"));
const dirFotos = arg("fotos"), dirSalida = arg("salida", "./historias-salida"), dirFuentes = arg("fuentes");
const HORAS = (arg("horas", "12:15,19:15")).split(",");
if (!desde || !dirFotos) { console.error("Uso: --desde AAAA-MM-DD --fotos CARPETA [--dias 28] [--salida CARPETA] [--fuentes CARPETA] [--horas 12:15,19:15]"); process.exit(1); }

const tipos = { ".js": "text/javascript", ".html": "text/html", ".svg": "image/svg+xml", ".json": "application/json" };
const servidor = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const f = path.join(raiz, url);
  if (!f.startsWith(raiz) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": tipos[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => servidor.listen(0, r));
const puerto = servidor.address().port;

const pw = await import("playwright").catch(() => import("/opt/node-tools/node_modules/playwright/index.js"));
const chromium = (pw.chromium || pw.default.chromium);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on("pageerror", (e) => console.error("pageerror", e.message));
await p.route("**/__fotos/*", (r) => r.fulfill({ body: readFileSync(path.join(dirFotos, path.basename(new URL(r.request().url()).pathname))), contentType: "image/jpeg" }));
await p.route("**/__fuentes/*", (r) => r.fulfill({ body: readFileSync(path.join(dirFuentes, path.basename(new URL(r.request().url()).pathname))), contentType: "font/woff2" }));
await p.goto(`http://localhost:${puerto}/scripts/historias/lienzo.html`);

const nombres = readdirSync(dirFotos).filter((f) => /\.jpe?g$/i.test(f)).sort();
const piezas = await p.evaluate(async ({ desde, dias, nombres, conFuentes }) => {
  const { historiaDeFecha, indiceDeDia, HORARIOS_DEFECTO } = await import("/assets/js/historias-data.js");
  const { dibujarLamina, FOCOS, ENC_DEFECTO } = await import("/assets/js/historias-render.js");
  const { sumarDiasFecha } = await import("/assets/js/portal-common.js");
  if (conFuentes) {
    for (const [fam, pesos] of [["Sora", [600, 700, 800]], ["Manrope", [600, 700, 800]]]) {
      for (const w of pesos) {
        const f = new FontFace(fam, `url(/__fuentes/${fam.toLowerCase()}-latin-${w}-normal.woff2)`, { weight: String(w) });
        document.fonts.add(await f.load());
      }
    }
  }
  const carga = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const logo = await carga("/assets/img/logo.svg");
  const fotos = [];
  for (const n of nombres) { const img = await carga(`/__fotos/${n}`); if (img) fotos.push({ id: n.replace(/\.jpe?g$/i, ""), img }); }
  const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
  const salida = [];
  for (let d = 0; d < dias; d++) {
    const fecha = sumarDiasFecha(desde, d);
    const h = historiaDeFecha(fecha);
    const n = indiceDeDia(fecha);
    for (let i = 0; i < h.laminas.length; i++) {
      const foto = fotos[(((n * 2 + i) % fotos.length) + fotos.length) % fotos.length];
      dibujarLamina(canvas, h, i, foto, { ...ENC_DEFECTO, ...(FOCOS[foto.id] || {}) }, logo);
      salida.push({ fecha, lamina: i + 1, tema: h.tema.id, nombreTema: h.tema.nombre, sede: h.tema.usaSede ? h.sede.nombre : null, foto: foto.id, link: h.link, sticker: h.sticker, jpg: canvas.toDataURL("image/jpeg", 0.92).split(",")[1] });
    }
  }
  return salida;
}, { desde, dias, nombres, conFuentes: !!dirFuentes });

mkdirSync(dirSalida, { recursive: true });
const manifest = piezas.map((x, k) => {
  const archivo = `${x.fecha}_${x.lamina}_${x.tema}.jpg`;
  writeFileSync(path.join(dirSalida, archivo), Buffer.from(x.jpg, "base64"));
  return { fecha: x.fecha, hora: HORAS[(x.lamina - 1) % HORAS.length], lamina: x.lamina, archivo, tema: x.nombreTema, sede: x.sede, foto: x.foto, link: x.link, sticker: x.sticker };
});
writeFileSync(path.join(dirSalida, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`${manifest.length} imágenes en ${dirSalida}`);
await b.close(); servidor.close();
