// historias.html: dibuja las láminas (1080×1920) en canvas y las deja listas para descargar o compartir.
import { hoyLima, sumarDiasFecha, formatearFechaLarga } from "./portal-common.js?v=30";
import { historiaDeFecha, HORARIOS_DEFECTO, PRECIOS, SITIO, indiceDeDia, CANTIDAD_TEMAS } from "./historias-data.js?v=1";

const W = 1080, H = 1920;
const $ = (id) => document.getElementById(id);
const CLAVE_HORARIOS = "gp_hist_horarios";
const claveHecha = (f) => `gp_hist_hecha_${f}`;

let fecha = hoyLima();
let horarios = leerHorarios();

function leerHorarios() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_HORARIOS) || "null");
    if (Array.isArray(v) && v.length) return v;
  } catch { /* sin almacenamiento: se usan los de siempre */ }
  return [...HORARIOS_DEFECTO];
}

// ---------- Dibujo ----------
function rect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function lineas(ctx, texto, ancho) {
  const palabras = String(texto).split(" ");
  const res = [];
  let actual = "";
  palabras.forEach((p) => {
    const prueba = actual ? actual + " " + p : p;
    if (ctx.measureText(prueba).width > ancho && actual) { res.push(actual); actual = p; }
    else actual = prueba;
  });
  if (actual) res.push(actual);
  return res;
}

// Dibuja un texto con salto de línea automático; devuelve la y final.
function parrafo(ctx, texto, x, y, ancho, interlineado) {
  const ls = lineas(ctx, texto, ancho);
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * interlineado));
  return y + ls.length * interlineado;
}

function fondo(ctx, p, n) {
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, p.fondo[0]); g.addColorStop(1, p.fondo[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Líneas de cancha muy suaves + pelota, distintas según la lámina.
  ctx.save();
  ctx.globalAlpha = 0.09; ctx.strokeStyle = p.texto; ctx.lineWidth = 8;
  const desp = (n % 3) * 90;
  rect(ctx, -120 + desp, 1180, W + 240, 900, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + desp, 1180); ctx.lineTo(W / 2 + desp, 2080); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-120, 1560); ctx.lineTo(W + 120, 1560); ctx.stroke();
  ctx.globalAlpha = 0.16; ctx.fillStyle = p.acento;
  ctx.beginPath(); ctx.arc(W - 120, 330 + (n % 2) * 40, 150, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function encabezado(ctx, p, logo) {
  if (logo) ctx.drawImage(logo, 80, 250, 84, 84);
  ctx.fillStyle = p.texto; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.font = '700 40px "Sora", sans-serif';
  ctx.fillText("Academia de Pádel GP", 182, 305);
}

function pie(ctx, p, texto) {
  ctx.fillStyle = p.suave; ctx.textAlign = "left";
  ctx.font = '700 36px "Manrope", sans-serif';
  ctx.fillText(texto || SITIO, 80, 1560);
}

function lamina(canvas, h, indice, logo) {
  const ctx = canvas.getContext("2d");
  const p = h.paleta, l = h.laminas[indice];
  fondo(ctx, p, indice);
  encabezado(ctx, p, logo);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

  if (l.tipo === "gancho") {
    ctx.fillStyle = p.texto;
    ctx.font = '800 112px "Sora", sans-serif';
    let y = parrafo(ctx, l.titulo, 80, 720, W - 160, 128);
    if (l.sub) {
      ctx.fillStyle = p.acento === p.fondo[0] ? p.texto : p.acento;
      ctx.font = '700 54px "Manrope", sans-serif';
      y = parrafo(ctx, l.sub, 80, y + 30, W - 160, 70);
    }
    pie(ctx, p, "Desliza 👉 o toca para seguir");
  } else if (l.tipo === "detalle") {
    ctx.fillStyle = p.texto;
    ctx.font = '800 84px "Sora", sans-serif';
    let y = parrafo(ctx, l.titulo, 80, 560, W - 160, 98);
    y += 30;
    if (l.chips) {
      ctx.font = '700 46px "Manrope", sans-serif';
      l.chips.forEach((c) => {
        const ancho = Math.min(W - 160, ctx.measureText(c).width + 72);
        ctx.fillStyle = p.chip; rect(ctx, 80, y, ancho, 88, 44); ctx.fill();
        ctx.fillStyle = p.chipTexto; ctx.fillText(c, 116, y + 60);
        y += 108;
      });
      y += 16;
    }
    ctx.fillStyle = p.texto; ctx.font = '600 48px "Manrope", sans-serif';
    (l.lineas || []).forEach((t) => { y = parrafo(ctx, t, 80, y + 56, W - 160, 64) + 12; });
    pie(ctx, p);
  } else {
    // CTA: precio + llamado a tocar el link (el sticker de enlace va en la zona de abajo).
    ctx.fillStyle = p.texto;
    ctx.font = '800 100px "Sora", sans-serif';
    let y = parrafo(ctx, "Elige tu horario", 80, 640, W - 160, 116);
    ctx.fillStyle = p.suave; ctx.font = '600 50px "Manrope", sans-serif';
    y = parrafo(ctx, "Cuéntanos cuándo puedes jugar y armamos tu grupo o tu clase individual.", 80, y + 30, W - 160, 66);
    // Precios
    y += 70;
    const cajas = [[`Grupales desde`, PRECIOS.grupalDesde, "por persona"], ["Individual", PRECIOS.individual, "la clase"]];
    cajas.forEach((c, i) => {
      const x = 80 + i * ((W - 200) / 2 + 40), w = (W - 200) / 2;
      ctx.fillStyle = p.chip; rect(ctx, x, y, w, 250, 36); ctx.fill();
      ctx.fillStyle = p.chipTexto; ctx.textAlign = "center";
      ctx.font = '700 34px "Manrope", sans-serif'; ctx.fillText(c[0], x + w / 2, y + 62);
      ctx.font = '800 84px "Sora", sans-serif'; ctx.fillText(c[1], x + w / 2, y + 160);
      ctx.font = '600 32px "Manrope", sans-serif'; ctx.fillText(c[2], x + w / 2, y + 210);
    });
    ctx.textAlign = "left";
    // Zona del sticker (queda libre y marcada con una flecha)
    ctx.fillStyle = p.texto; ctx.font = '800 56px "Sora", sans-serif'; ctx.textAlign = "center";
    ctx.fillText("Toca el link 👇", W / 2, 1500);
    ctx.fillStyle = p.suave; ctx.font = '700 36px "Manrope", sans-serif';
    ctx.fillText(SITIO, W / 2, 1566);
    ctx.textAlign = "left";
  }
}

// ---------- Página ----------
function cargarLogo() {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img); img.onerror = () => res(null);
    img.src = "assets/img/logo.svg";
  });
}

function nombreArchivo(h, i) {
  return `historia-${h.fecha}-${i + 1}-${h.tema.id}.png`;
}

function aBlob(canvas) { return new Promise((res) => canvas.toBlob(res, "image/png")); }

function descargar(blob, nombre) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

let logo = null;
let actual = null;

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

  const grid = $("h-grid");
  grid.replaceChildren();
  h.laminas.forEach((_, i) => {
    const caja = document.createElement("div"); caja.className = "hist-lamina";
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Lámina ${i + 1} de la historia`);
    const botones = document.createElement("div"); botones.className = "hist-lamina-botones";
    const bajar = document.createElement("button"); bajar.type = "button"; bajar.className = "btn btn-outline btn-small"; bajar.textContent = `Descargar ${i + 1}`;
    bajar.addEventListener("click", async () => descargar(await aBlob(canvas), nombreArchivo(h, i)));
    botones.appendChild(bajar);
    if (navigator.canShare && navigator.share) {
      const comp = document.createElement("button"); comp.type = "button"; comp.className = "btn btn-primary btn-small"; comp.textContent = "Compartir";
      comp.addEventListener("click", async () => {
        const archivo = new File([await aBlob(canvas)], nombreArchivo(h, i), { type: "image/png" });
        if (navigator.canShare({ files: [archivo] })) { try { await navigator.share({ files: [archivo] }); } catch { /* canceló */ } }
        else descargar(archivo, archivo.name);
      });
      botones.appendChild(comp);
    }
    caja.append(canvas, botones);
    grid.appendChild(caja);
    lamina(canvas, h, i, logo);
  });
  pintarPlan();
}

function pintarPlan() {
  const ol = $("h-plan"); ol.replaceChildren();
  const hoy = hoyLima();
  for (let d = 0; d < CANTIDAD_TEMAS; d++) {
    const f = sumarDiasFecha(hoy, d);
    const h = historiaDeFecha(f, horarios);
    const li = document.createElement("li");
    if (d === 0) li.className = "hoy";
    li.textContent = `${formatearFechaLarga(f)} — ${h.tema.nombre}` + (h.tema.usaSede ? ` (${h.sede.nombre})` : "");
    ol.appendChild(li);
  }
}

async function iniciar() {
  try { await Promise.all([document.fonts.load('800 80px "Sora"'), document.fonts.load('700 40px "Manrope"'), document.fonts.load('600 40px "Manrope"')]); } catch { /* sin fuentes web: se usa la de respaldo */ }
  logo = await cargarLogo();
  $("h-horarios").value = horarios.join("\n");
  await pintar();
}

$("h-ant").addEventListener("click", () => { fecha = sumarDiasFecha(fecha, -1); pintar(); });
$("h-sig").addEventListener("click", () => { fecha = sumarDiasFecha(fecha, 1); pintar(); });
$("h-hoy").addEventListener("click", () => { fecha = hoyLima(); pintar(); });
$("h-hecha").addEventListener("change", (e) => { try { localStorage.setItem(claveHecha(fecha), e.target.checked ? "1" : "0"); } catch { /* idem */ } });
$("h-todas").addEventListener("click", async () => {
  const canvases = [...document.querySelectorAll("#h-grid canvas")];
  for (let i = 0; i < canvases.length; i++) {
    descargar(await aBlob(canvases[i]), nombreArchivo(actual, i));
    await new Promise((r) => setTimeout(r, 350));
  }
  $("h-msg").textContent = "Descargadas. Súbelas en orden y pon el sticker de enlace en la última.";
  $("h-msg").className = "form-msg ok";
});
document.querySelectorAll("[data-copiar]").forEach((b) => b.addEventListener("click", async () => {
  const campo = $(b.dataset.copiar);
  try { await navigator.clipboard.writeText(campo.value); b.textContent = "Copiado ✓"; }
  catch { campo.select(); document.execCommand && document.execCommand("copy"); b.textContent = "Copiado ✓"; }
  setTimeout(() => { b.textContent = "Copiar"; }, 1800);
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

iniciar();
