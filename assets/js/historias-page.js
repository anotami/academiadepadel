// historias.html: arma las láminas (1080×1920) con TUS fotos de fondo y las deja listas para descargar o compartir.
// Las fotos y los momentos de video se guardan solo en este navegador (IndexedDB); no se suben a ningún lado.
import { hoyLima, sumarDiasFecha, formatearFechaLarga } from "./portal-common.js?v=30";
import { historiaDeFecha, HORARIOS_DEFECTO, PRECIOS, SITIO, indiceDeDia, CANTIDAD_TEMAS } from "./historias-data.js?v=2";

const W = 1080, H = 1920;
const LIMA = "#c8e94c";
const $ = (id) => document.getElementById(id);
const CLAVE_HORARIOS = "gp_hist_horarios";
const claveHecha = (f) => `gp_hist_hecha_${f}`;
const claveElecciones = (f) => `gp_hist_fotos_${f}`;

// Fotos que ya están en el sitio (verticales, buena calidad). Las tuyas se suman a estas.
const FOTOS_DEFECTO = [
  { id: "d-gabriel-1", nombre: "Gabriel · drive", src: "assets/img/gabriel/gabriel-1.jpg" },
  { id: "d-gabriel-2", nombre: "Gabriel · posición", src: "assets/img/gabriel/gabriel-2.jpg" },
  { id: "d-gabriel-3", nombre: "Gabriel · pala", src: "assets/img/gabriel/gabriel-3.jpg" },
  { id: "d-gabriel-4", nombre: "Gabriel · revés", src: "assets/img/gabriel/gabriel-4.jpg" }
];

let fecha = hoyLima();
let horarios = leerHorarios();
let actual = null;
let logo = null;
let biblioteca = [];                    // [{id, nombre, propia, img(HTMLImageElement), url}]
const encuadres = {};                   // índice de lámina -> 0..1 (posición horizontal de la foto)

function leerHorarios() {
  try { const v = JSON.parse(localStorage.getItem(CLAVE_HORARIOS) || "null"); if (Array.isArray(v) && v.length) return v; } catch { /* usa los de siempre */ }
  return [...HORARIOS_DEFECTO];
}

// ---------- IndexedDB (fotos propias) ----------
const BD = "gp-historias", ALMACEN = "fotos";
function abrirBD() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(BD, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function bdTodas() { try { const db = await abrirBD(); return await new Promise((res) => { const q = db.transaction(ALMACEN).objectStore(ALMACEN).getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); }); } catch { return []; } }
async function bdGuardar(item) { const db = await abrirBD(); return new Promise((res, rej) => { const t = db.transaction(ALMACEN, "readwrite"); t.objectStore(ALMACEN).put(item); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function bdBorrar(id) { const db = await abrirBD(); return new Promise((res) => { const t = db.transaction(ALMACEN, "readwrite"); t.objectStore(ALMACEN).delete(id); t.oncomplete = res; }); }

function cargarImagen(url) {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; });
}

async function cargarBiblioteca() {
  biblioteca = [];
  const propias = (await bdTodas()).sort((a, b) => (b.creado || 0) - (a.creado || 0));
  for (const p of propias) {
    const url = URL.createObjectURL(p.blob);
    const img = await cargarImagen(url);
    if (img) biblioteca.push({ id: p.id, nombre: p.nombre, propia: true, img, url });
  }
  for (const d of FOTOS_DEFECTO) {
    const img = await cargarImagen(d.src);
    if (img) biblioteca.push({ id: d.id, nombre: d.nombre, propia: false, img, url: d.src });
  }
}

// Reduce fotos enormes (4000 px del celular) para que la biblioteca no pese de más.
async function reducir(archivo, maxLado = 2400) {
  const url = URL.createObjectURL(archivo);
  const img = await cargarImagen(url);
  if (!img) { URL.revokeObjectURL(url); return null; }
  const k = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return new Promise((res) => c.toBlob(res, "image/jpeg", 0.92));
}

// ---------- Dibujo ----------
function rect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function partir(ctx, texto, ancho) {
  const res = []; let actual = "";
  String(texto).split(" ").forEach((p) => {
    const prueba = actual ? actual + " " + p : p;
    if (ctx.measureText(prueba).width > ancho && actual) { res.push(actual); actual = p; } else actual = prueba;
  });
  if (actual) res.push(actual);
  return res;
}

// Foto a pantalla completa (recorte vertical, con posición horizontal ajustable).
function fotoDeFondo(ctx, foto, enc) {
  if (!foto) { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0d3140"); g.addColorStop(1, "#14495a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); return; }
  const img = foto.img;
  const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * k, h = img.naturalHeight * k;
  ctx.drawImage(img, -(w - W) * enc, -(h - H) / 2, w, h);
}

function oscurecer(ctx, fuerte) {
  const a = ctx.createLinearGradient(0, 0, 0, 560);
  a.addColorStop(0, "rgba(6,16,26,0.72)"); a.addColorStop(1, "rgba(6,16,26,0)");
  ctx.fillStyle = a; ctx.fillRect(0, 0, W, 560);
  const desde = fuerte ? 380 : 760;
  const b = ctx.createLinearGradient(0, desde, 0, H);
  b.addColorStop(0, "rgba(6,16,26,0)"); b.addColorStop(0.45, `rgba(6,16,26,${fuerte ? 0.86 : 0.8})`); b.addColorStop(1, "rgba(6,16,26,0.95)");
  ctx.fillStyle = b; ctx.fillRect(0, desde, W, H - desde);
}

function marca(ctx, etiqueta) {
  if (logo) ctx.drawImage(logo, 72, 236, 84, 84);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#fff";
  ctx.font = '700 40px "Sora", sans-serif';
  ctx.fillText("Academia de Pádel GP", 174, 292);
  if (etiqueta) {
    ctx.font = '800 32px "Manrope", sans-serif';
    const t = etiqueta.toUpperCase(), ancho = ctx.measureText(t).width + 56;
    ctx.fillStyle = LIMA; rect(ctx, 72, 350, ancho, 64, 32); ctx.fill();
    ctx.fillStyle = "#0f1e2e"; ctx.fillText(t, 100, 394);
  }
}

// Texto con sombra suave para que se lea sobre cualquier foto.
function texto(ctx, t, x, y, ancho, interlineado, fuente, color) {
  ctx.font = fuente; ctx.fillStyle = color; ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
  const ls = partir(ctx, t, ancho);
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * interlineado));
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  return y + ls.length * interlineado;
}

function lamina(canvas, h, i, foto) {
  const ctx = canvas.getContext("2d");
  const l = h.laminas[i];
  ctx.clearRect(0, 0, W, H);
  fotoDeFondo(ctx, foto, encuadres[i] ?? 0.5);
  oscurecer(ctx, l.tipo !== "gancho");
  marca(ctx, l.tipo === "gancho" ? h.tema.nombre : "");

  if (l.tipo === "gancho") {
    // Título grande abajo; la foto se ve completa arriba.
    ctx.font = '800 112px "Sora", sans-serif';
    const ls = partir(ctx, l.titulo, W - 144);
    let y = 1500 - (ls.length - 1) * 128 - (l.sub ? 110 : 0);
    y = texto(ctx, l.titulo, 72, y, W - 144, 128, '800 112px "Sora", sans-serif', "#fff");
    if (l.sub) texto(ctx, l.sub, 72, y + 18, W - 144, 66, '700 54px "Manrope", sans-serif', LIMA);
  } else if (l.tipo === "detalle") {
    // Título + tarjetas translúcidas con los datos.
    let y = 760;
    y = texto(ctx, l.titulo, 72, y, W - 144, 96, '800 84px "Sora", sans-serif', "#fff") + 8;
    ctx.font = '700 46px "Manrope", sans-serif';
    (l.chips || []).forEach((c) => {
      const ancho = Math.min(W - 144, ctx.measureText(c).width + 72);
      ctx.fillStyle = LIMA; rect(ctx, 72, y, ancho, 88, 44); ctx.fill();
      ctx.fillStyle = "#0f1e2e"; ctx.fillText(c, 108, y + 60);
      y += 104;
    });
    (l.lineas || []).slice(0, 4).forEach((t) => {
      ctx.font = '600 44px "Manrope", sans-serif';
      const ls = partir(ctx, t, W - 144 - 72);
      const alto = ls.length * 58 + 44;
      ctx.fillStyle = "rgba(255,255,255,0.16)"; rect(ctx, 72, y, W - 144, alto, 28); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 2; rect(ctx, 72, y, W - 144, alto, 28); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.textAlign = "left";
      ls.forEach((x, k) => ctx.fillText(x, 108, y + 62 + k * 58));
      y += alto + 18;
    });
  } else {
    // Llamado a la acción: precios + "Toca el link".
    let y = texto(ctx, "Elige tu horario", 72, 930, W - 144, 118, '800 108px "Sora", sans-serif', "#fff");
    y = texto(ctx, "Cuéntanos cuándo puedes jugar y armamos tu grupo o tu clase individual.", 72, y + 4, W - 144, 62, '600 46px "Manrope", sans-serif', "#e8f0f4");
    const cajas = [["Grupales desde", PRECIOS.grupalDesde, "por persona"], ["Individual", PRECIOS.individual, "la clase"]];
    const w = (W - 144 - 32) / 2;
    cajas.forEach((c, k) => {
      const x = 72 + k * (w + 32), yy = y + 44;
      ctx.fillStyle = LIMA; rect(ctx, x, yy, w, 232, 34); ctx.fill();
      ctx.fillStyle = "#0f1e2e"; ctx.textAlign = "center";
      ctx.font = '700 32px "Manrope", sans-serif'; ctx.fillText(c[0], x + w / 2, yy + 58);
      ctx.font = '800 80px "Sora", sans-serif'; ctx.fillText(c[1], x + w / 2, yy + 148);
      ctx.font = '600 30px "Manrope", sans-serif'; ctx.fillText(c[2], x + w / 2, yy + 196);
    });
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = '800 54px "Sora", sans-serif';
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 14;
    ctx.fillText("Toca el link 👇", W / 2, 1530);
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
    ctx.fillStyle = "#cfdde4"; ctx.font = '700 34px "Manrope", sans-serif'; ctx.fillText(SITIO, W / 2, 1590);
    ctx.textAlign = "left";
  }
}

// ---------- Elecciones de foto por lámina ----------
function eleccionesDelDia() { try { return JSON.parse(localStorage.getItem(claveElecciones(fecha)) || "{}"); } catch { return {}; } }
function guardarEleccion(i, id) { const e = eleccionesDelDia(); e[i] = id; try { localStorage.setItem(claveElecciones(fecha), JSON.stringify(e)); } catch { /* idem */ } }
function fotoDeLamina(i) {
  if (!biblioteca.length) return null;
  const id = eleccionesDelDia()[i];
  const elegida = id && biblioteca.find((f) => f.id === id);
  if (elegida) return elegida;
  // Por defecto: rota por día y por lámina, empezando por tus fotos propias.
  return biblioteca[(((indiceDeDia(fecha) * 3 + i) % biblioteca.length) + biblioteca.length) % biblioteca.length];
}

// ---------- Descarga / compartir ----------
const nombreArchivo = (h, i) => `historia-${h.fecha}-${i + 1}-${h.tema.id}.png`;
const aBlob = (canvas) => new Promise((res) => canvas.toBlob(res, "image/png"));
function descargar(blob, nombre) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------- Página ----------
function pintarBiblioteca() {
  const cont = $("h-fotos"); cont.replaceChildren();
  biblioteca.forEach((f) => {
    const b = document.createElement("div"); b.className = "hist-foto"; b.title = f.nombre;
    const im = document.createElement("img"); im.src = f.url; im.alt = f.nombre; im.loading = "lazy";
    b.appendChild(im);
    if (f.propia) {
      const x = document.createElement("button"); x.type = "button"; x.className = "quitar"; x.textContent = "×"; x.setAttribute("aria-label", `Quitar ${f.nombre}`);
      x.addEventListener("click", async () => { await bdBorrar(f.id); await cargarBiblioteca(); pintarBiblioteca(); pintar(); });
      b.appendChild(x);
    }
    cont.appendChild(b);
  });
}

let laminaEnEdicion = 0;
function abrirSelector(i) {
  laminaEnEdicion = i;
  const lista = $("h-picker-lista"); lista.replaceChildren();
  const actualId = fotoDeLamina(i)?.id;
  biblioteca.forEach((f) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "hist-foto" + (f.id === actualId ? " elegida" : ""); b.title = f.nombre;
    const im = document.createElement("img"); im.src = f.url; im.alt = f.nombre;
    b.appendChild(im);
    b.addEventListener("click", () => { guardarEleccion(laminaEnEdicion, f.id); $("h-picker").close(); pintar(); });
    lista.appendChild(b);
  });
  $("h-picker").showModal();
}

async function pintar() {
  const h = historiaDeFecha(fecha, horarios);
  actual = h;
  const larga = formatearFechaLarga(fecha);
  $("h-fecha").textContent = larga.charAt(0).toUpperCase() + larga.slice(1) + (fecha === hoyLima() ? " · hoy" : "");
  $("h-tema").textContent = `Tema: ${h.tema.nombre}` + (h.tema.usaSede ? ` · ${h.sede.nombre}` : "");
  $("h-hecha").checked = (() => { try { return localStorage.getItem(claveHecha(fecha)) === "1"; } catch { return false; } })();
  $("h-link").value = h.link;
  $("h-sticker").value = h.sticker;
  $("h-dm").value = `¡Hola! Gracias por escribir 🙌 Para armar tu clase (grupal o individual) cuéntanos tu disponibilidad aquí: ${h.link}  — te respondemos con horarios y sede.`;

  const grid = $("h-grid"); grid.replaceChildren();
  h.laminas.forEach((_, i) => {
    const caja = document.createElement("div"); caja.className = "hist-lamina";
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", `Lámina ${i + 1} de la historia`);
    const botones = document.createElement("div"); botones.className = "hist-lamina-botones";
    const bajar = document.createElement("button"); bajar.type = "button"; bajar.className = "btn btn-primary btn-small"; bajar.textContent = `Descargar ${i + 1}`;
    bajar.addEventListener("click", async () => descargar(await aBlob(canvas), nombreArchivo(h, i)));
    const cambiar = document.createElement("button"); cambiar.type = "button"; cambiar.className = "btn btn-outline btn-small"; cambiar.textContent = "Cambiar foto";
    cambiar.addEventListener("click", () => abrirSelector(i));
    botones.append(bajar, cambiar);
    if (navigator.canShare && navigator.share) {
      const comp = document.createElement("button"); comp.type = "button"; comp.className = "btn btn-outline btn-small"; comp.textContent = "Compartir";
      comp.addEventListener("click", async () => {
        const archivo = new File([await aBlob(canvas)], nombreArchivo(h, i), { type: "image/png" });
        if (navigator.canShare({ files: [archivo] })) { try { await navigator.share({ files: [archivo] }); } catch { /* canceló */ } } else descargar(archivo, archivo.name);
      });
      botones.appendChild(comp);
    }
    const enc = document.createElement("label"); enc.className = "hist-encuadre"; enc.append("Encuadre ");
    const rango = document.createElement("input"); rango.type = "range"; rango.min = "0"; rango.max = "100"; rango.value = String(Math.round((encuadres[i] ?? 0.5) * 100));
    rango.setAttribute("aria-label", `Encuadre horizontal de la lámina ${i + 1}`);
    rango.addEventListener("input", () => { encuadres[i] = rango.value / 100; lamina(canvas, h, i, fotoDeLamina(i)); });
    enc.appendChild(rango);
    caja.append(canvas, botones, enc);
    grid.appendChild(caja);
    lamina(canvas, h, i, fotoDeLamina(i));
  });
  pintarPlan();
}

function pintarPlan() {
  const ol = $("h-plan"); ol.replaceChildren();
  const hoy = hoyLima();
  for (let d = 0; d < CANTIDAD_TEMAS; d++) {
    const f = sumarDiasFecha(hoy, d);
    const h = historiaDeFecha(f, horarios);
    const li = document.createElement("li"); if (d === 0) li.className = "hoy";
    li.textContent = `${formatearFechaLarga(f)} — ${h.tema.nombre}` + (h.tema.usaSede ? ` (${h.sede.nombre})` : "");
    ol.appendChild(li);
  }
}

// ---------- Subir fotos y videos ----------
function aviso(t, ok = true) { const m = $("h-msg-bib"); m.textContent = t; m.className = "form-msg " + (ok ? "ok" : "error"); }

$("h-subir-fotos").addEventListener("change", async (e) => {
  const archivos = [...e.target.files]; e.target.value = "";
  let n = 0;
  for (const a of archivos) {
    const blob = await reducir(a);
    if (!blob) continue;
    await bdGuardar({ id: `p-${Date.now()}-${n}`, nombre: a.name.replace(/\.[^.]+$/, ""), blob, creado: Date.now() + n });
    n++;
  }
  await cargarBiblioteca(); pintarBiblioteca(); pintar();
  aviso(n ? `${n} foto${n === 1 ? "" : "s"} agregada${n === 1 ? "" : "s"}.` : "No se pudo leer esa imagen.", n > 0);
});

const video = $("h-video"), posVideo = $("h-video-pos");
let urlVideo = null, nombreVideo = "video";
$("h-subir-video").addEventListener("change", (e) => {
  const a = e.target.files[0]; e.target.value = "";
  if (!a) return;
  if (urlVideo) URL.revokeObjectURL(urlVideo);
  urlVideo = URL.createObjectURL(a); nombreVideo = a.name.replace(/\.[^.]+$/, "");
  video.src = urlVideo; posVideo.value = "0";
  $("h-video-panel").hidden = false;
  video.addEventListener("loadedmetadata", () => { video.currentTime = 0; }, { once: true });
});
posVideo.addEventListener("input", () => { if (video.duration) video.currentTime = (posVideo.value / 1000) * video.duration; });
$("h-video-cerrar").addEventListener("click", () => { $("h-video-panel").hidden = true; video.pause(); video.removeAttribute("src"); video.load(); });
$("h-video-usar").addEventListener("click", async () => {
  if (!video.videoWidth) { aviso("El video todavía está cargando.", false); return; }
  video.pause();
  const k = Math.min(1, 2400 / Math.max(video.videoWidth, video.videoHeight));
  const c = document.createElement("canvas"); c.width = Math.round(video.videoWidth * k); c.height = Math.round(video.videoHeight * k);
  c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
  const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.92));
  const seg = Math.round(video.currentTime);
  await bdGuardar({ id: `v-${Date.now()}`, nombre: `${nombreVideo} · ${seg}s`, blob, creado: Date.now() });
  await cargarBiblioteca(); pintarBiblioteca(); pintar();
  aviso("Momento guardado como foto. Puedes sacar otro.");
});
$("h-picker-cerrar").addEventListener("click", () => $("h-picker").close());

// ---------- Resto de controles ----------
$("h-ant").addEventListener("click", () => { fecha = sumarDiasFecha(fecha, -1); pintar(); });
$("h-sig").addEventListener("click", () => { fecha = sumarDiasFecha(fecha, 1); pintar(); });
$("h-hoy").addEventListener("click", () => { fecha = hoyLima(); pintar(); });
$("h-hecha").addEventListener("change", (e) => { try { localStorage.setItem(claveHecha(fecha), e.target.checked ? "1" : "0"); } catch { /* idem */ } });
$("h-todas").addEventListener("click", async () => {
  const canvases = [...document.querySelectorAll("#h-grid canvas")];
  for (let i = 0; i < canvases.length; i++) { descargar(await aBlob(canvases[i]), nombreArchivo(actual, i)); await new Promise((r) => setTimeout(r, 350)); }
  $("h-msg").textContent = "Descargadas. Súbelas en orden y pon el sticker de enlace en la última.";
  $("h-msg").className = "form-msg ok";
});
document.querySelectorAll("[data-copiar]").forEach((b) => b.addEventListener("click", async () => {
  const campo = $(b.dataset.copiar);
  try { await navigator.clipboard.writeText(campo.value); } catch { campo.select(); document.execCommand && document.execCommand("copy"); }
  b.textContent = "Copiado ✓"; setTimeout(() => { b.textContent = "Copiar"; }, 1800);
}));
$("h-guardar").addEventListener("click", () => {
  horarios = $("h-horarios").value.split("\n").map((x) => x.trim()).filter(Boolean);
  if (!horarios.length) horarios = [...HORARIOS_DEFECTO];
  try { localStorage.setItem(CLAVE_HORARIOS, JSON.stringify(horarios)); } catch { /* idem */ }
  $("h-msg-h").textContent = "Guardado."; $("h-msg-h").className = "form-msg ok";
  pintar();
});
$("h-restaurar").addEventListener("click", () => {
  horarios = [...HORARIOS_DEFECTO];
  try { localStorage.removeItem(CLAVE_HORARIOS); } catch { /* idem */ }
  $("h-horarios").value = horarios.join("\n");
  $("h-msg-h").textContent = "Restaurado."; $("h-msg-h").className = "form-msg ok";
  pintar();
});

async function iniciar() {
  try { await Promise.all([document.fonts.load('800 80px "Sora"'), document.fonts.load('700 40px "Manrope"'), document.fonts.load('600 40px "Manrope"')]); } catch { /* sin fuentes web */ }
  logo = await cargarImagen("assets/img/logo.svg");
  $("h-horarios").value = horarios.join("\n");
  await cargarBiblioteca();
  pintarBiblioteca();
  await pintar();
}
iniciar();
