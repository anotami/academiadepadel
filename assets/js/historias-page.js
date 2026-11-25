// historias.html: arma las láminas (1080×1920) con TUS fotos de fondo y las deja listas para descargar o compartir.
// Las fotos y los momentos de video se guardan solo en este navegador (IndexedDB); no se suben a ningún lado.
import { hoyLima, sumarDiasFecha, formatearFechaLarga } from "./portal-common.js?v=32";
import { historiaDeFecha, HORARIOS_DEFECTO, indiceDeDia, CANTIDAD_TEMAS } from "./historias-data.js?v=4";
import { W, H, dibujarLamina, FOCOS, ENC_DEFECTO } from "./historias-render.js?v=1";

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
const claveEnc = (f) => `gp_hist_enc_${f}`;
// Encuadre por lámina: fx, fy = punto de la foto que queda en el centro (0..1) y z = zoom. Por defecto, el foco de cada foto.
function encDe(i) {
  const base = { ...ENC_DEFECTO, ...((fotoDeLamina(i) && FOCOS[fotoDeLamina(i).id]) || {}) };
  try { return { ...base, ...(JSON.parse(localStorage.getItem(claveEnc(fecha)) || "{}")[i] || {}) }; } catch { return base; }
}
function guardarEnc(i, e) { try { const t = JSON.parse(localStorage.getItem(claveEnc(fecha)) || "{}"); t[i] = e; localStorage.setItem(claveEnc(fecha), JSON.stringify(t)); } catch { /* sin almacenamiento */ } }

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
  $("h-dm").value = `¡Hola! Gracias por escribir 🙌 Para armar tu clase (grupal o individual) contanos tu disponibilidad aquí: ${h.link}  — te respondemos con horarios y sede.`;

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
    const enc = document.createElement("div"); enc.className = "hist-encuadre-caja";
    const control = (etiqueta, campo, min, max, escala) => {
      const l = document.createElement("label"); l.className = "hist-encuadre"; l.append(etiqueta + " ");
      const r = document.createElement("input"); r.type = "range"; r.min = String(min); r.max = String(max);
      r.value = String(Math.round(encDe(i)[campo] * escala));
      r.setAttribute("aria-label", `${etiqueta} de la lámina ${i + 1}`);
      r.addEventListener("input", () => { const e = encDe(i); e[campo] = r.value / escala; guardarEnc(i, e); dibujarLamina(canvas, h, i, fotoDeLamina(i), encDe(i), logo); });
      l.appendChild(r); enc.appendChild(l);
    };
    control("Zoom", "z", 100, 300, 100);
    control("← →", "fx", 0, 100, 100);
    control("↑ ↓", "fy", 0, 100, 100);
    caja.append(canvas, botones, enc);
    grid.appendChild(caja);
    dibujarLamina(canvas, h, i, fotoDeLamina(i), encDe(i), logo);
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
  aviso("Momento guardado como foto. Podés sacar otro.");
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
  $("h-msg").textContent = "Descargadas. Subilas en orden y poné el sticker de enlace en la última.";
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
