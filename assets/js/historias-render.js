// Dibuja una lámina de historia (1080×1920) sobre un canvas. Lo usan historias.html y el generador
// automático (scripts/historias/generar.mjs), así lo que ves en la página es lo mismo que se programa.
//
// ZONA SEGURA DE INSTAGRAM: el nombre de la cuenta tapa arriba y los botones abajo. Ningún texto en los
// 250 px de arriba, en los 420 px de abajo ni en los 120 px del borde derecho.
export const W = 1080, H = 1920;
export const ZONA = { arriba: 270, abajo: 440, derecha: 130, izquierda: 72 };
const LIMA = "#c8e94c";
const ANCHO_TEXTO = W - ZONA.izquierda - ZONA.derecha;

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

// Foto a pantalla completa. enc = { fx, fy, z }: punto de la foto (0..1) que queda en el centro-alto de la lámina y zoom.
function fotoDeFondo(ctx, foto, enc, ty) {
  if (!foto) { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0d3140"); g.addColorStop(1, "#14495a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); return; }
  const img = foto.img;
  const k = Math.max(W / img.naturalWidth, H / img.naturalHeight) * enc.z;
  const w = img.naturalWidth * k, h = img.naturalHeight * k;
  const dx = Math.min(Math.max(enc.fx * w - W / 2, 0), w - W);
  const dy = Math.min(Math.max(enc.fy * h - ty * H, 0), h - H);
  ctx.drawImage(img, -dx, -dy, w, h);
}

function oscurecer(ctx, tipo) {
  const a = ctx.createLinearGradient(0, 0, 0, 620);
  a.addColorStop(0, "rgba(6,16,26,0.78)"); a.addColorStop(1, "rgba(6,16,26,0)");
  ctx.fillStyle = a; ctx.fillRect(0, 0, W, 620);
  if (tipo === "gancho") {
    const b = ctx.createLinearGradient(0, 820, 0, H);
    b.addColorStop(0, "rgba(6,16,26,0)"); b.addColorStop(0.5, "rgba(6,16,26,0.82)"); b.addColorStop(1, "rgba(6,16,26,0.95)");
    ctx.fillStyle = b; ctx.fillRect(0, 820, W, H - 820);
  } else {
    ctx.fillStyle = "rgba(6,16,26,0.66)"; ctx.fillRect(0, 0, W, H);
    const c = ctx.createLinearGradient(0, 1100, 0, H);
    c.addColorStop(0, "rgba(6,16,26,0)"); c.addColorStop(1, "rgba(6,16,26,0.55)");
    ctx.fillStyle = c; ctx.fillRect(0, 1100, W, H - 1100);
  }
}

function marca(ctx, logo, etiqueta) {
  const y = ZONA.arriba + 24;
  if (logo) ctx.drawImage(logo, ZONA.izquierda, y, 76, 76);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#fff";
  ctx.font = '700 38px "Sora", sans-serif';
  ctx.fillText("Academia de Pádel GP", ZONA.izquierda + 96, y + 52);
  if (etiqueta) {
    ctx.font = '800 30px "Manrope", sans-serif';
    const t = etiqueta.toUpperCase(), ancho = ctx.measureText(t).width + 52;
    ctx.fillStyle = LIMA; rect(ctx, ZONA.izquierda, y + 100, ancho, 60, 30); ctx.fill();
    ctx.fillStyle = "#0f1e2e"; ctx.fillText(t, ZONA.izquierda + 26, y + 141);
  }
}

function texto(ctx, t, x, y, ancho, interlineado, fuente, color) {
  ctx.font = fuente; ctx.fillStyle = color; ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3;
  const ls = partir(ctx, t, ancho);
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * interlineado));
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  return y + ls.length * interlineado;
}

// l = lámina { tipo, titulo, sub?, chips?, lineas? }; h = historia (tema, link visible); foto = { img }; enc = { fx, fy, z }
export function dibujarLamina(canvas, h, indice, foto, enc, logo) {
  const ctx = canvas.getContext("2d");
  const l = h.laminas[indice];
  ctx.clearRect(0, 0, W, H);
  fotoDeFondo(ctx, foto, enc, l.tipo === "gancho" ? 0.4 : 0.3);
  oscurecer(ctx, l.tipo);
  marca(ctx, logo, l.tipo === "gancho" ? h.tema.nombre : "");
  const X = ZONA.izquierda;
  const LIMITE = H - ZONA.abajo;     // 1480: nada pasa de acá

  if (l.tipo === "gancho") {
    ctx.font = '800 108px "Sora", sans-serif';
    const ls = partir(ctx, l.titulo, ANCHO_TEXTO);
    const altoSub = l.sub ? 120 : 0;
    const y0 = LIMITE - altoSub - ls.length * 124 + 90;
    const y = texto(ctx, l.titulo, X, y0, ANCHO_TEXTO, 124, '800 108px "Sora", sans-serif', "#fff");
    if (l.sub) texto(ctx, l.sub, X, y + 6, ANCHO_TEXTO, 64, '700 50px "Manrope", sans-serif', LIMA);
  } else {
    // Detalle: título + tarjetas; si no entra encima del llamado a la acción, se achica todo hasta que entre.
    const YCTA = LIMITE - 200, TOPE = YCTA - 50;
    const pasada = (esc, dibujar) => {
      let y = 600;
      ctx.font = `800 ${Math.round(80 * esc)}px "Sora", sans-serif`;
      const ls = partir(ctx, l.titulo, ANCHO_TEXTO);
      if (dibujar) texto(ctx, l.titulo, X, y, ANCHO_TEXTO, Math.round(94 * esc), `800 ${Math.round(80 * esc)}px "Sora", sans-serif`, "#fff");
      y += ls.length * Math.round(94 * esc) + 6;
      (l.chips || []).forEach((c) => {
        ctx.font = `700 ${Math.round(44 * esc)}px "Manrope", sans-serif`;
        if (dibujar) {
          const ancho = Math.min(ANCHO_TEXTO, ctx.measureText(c).width + 68);
          ctx.fillStyle = LIMA; rect(ctx, X, y, ancho, Math.round(84 * esc), 42); ctx.fill();
          ctx.fillStyle = "#0f1e2e"; ctx.fillText(c, X + 34, y + Math.round(57 * esc));
        }
        y += Math.round(100 * esc);
      });
      (l.lineas || []).slice(0, 4).forEach((t) => {
        ctx.font = `600 ${Math.round(42 * esc)}px "Manrope", sans-serif`;
        const ln = partir(ctx, t, ANCHO_TEXTO - 72);
        const alto = ln.length * Math.round(56 * esc) + Math.round(40 * esc);
        if (dibujar) {
          ctx.fillStyle = "rgba(255,255,255,0.15)"; rect(ctx, X, y, ANCHO_TEXTO, alto, 26); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.26)"; ctx.lineWidth = 2; rect(ctx, X, y, ANCHO_TEXTO, alto, 26); ctx.stroke();
          ctx.fillStyle = "#fff"; ctx.textAlign = "left";
          ln.forEach((x, k) => ctx.fillText(x, X + 36, y + Math.round(60 * esc) + k * Math.round(56 * esc)));
        }
        y += alto + 16;
      });
      return y;
    };
    let esc = 1;
    for (const e of [1, 0.9, 0.8, 0.7]) { esc = e; if (pasada(e, false) <= TOPE) break; }
    pasada(esc, true);
    // Llamado a la acción fijo, siempre dentro de la zona segura.
    ctx.fillStyle = "#fff"; ctx.font = '800 54px "Sora", sans-serif'; ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 14;
    ctx.fillText("Elegí tu horario", X, YCTA);
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
    ctx.fillStyle = "#e1ecf1"; ctx.font = '600 38px "Manrope", sans-serif';
    ctx.fillText("Grupales o individuales", X, YCTA + 58);
    ctx.font = '800 40px "Manrope", sans-serif';
    const url = h.linkVisible || "academiadepadel.pe/disponibilidad";
    const ancho = Math.min(ANCHO_TEXTO, ctx.measureText(url).width + 76);
    ctx.fillStyle = LIMA; rect(ctx, X, YCTA + 96, ancho, 88, 44); ctx.fill();
    ctx.fillStyle = "#0f1e2e"; ctx.fillText(url, X + 38, YCTA + 154);
  }
  ctx.textAlign = "left";
}

// Fotos de Gabriel y dónde mirar en cada una (fx, fy = punto de la foto que se centra; z = zoom).
export const FOCOS = {
  "yo-5718": { fx: 0.58, fy: 0.46, z: 1.0 },
  "yo-orue547": { fx: 0.32, fy: 0.62, z: 1.75 },
  "yo-orue305": { fx: 0.53, fy: 0.52, z: 1.15 },
  "yo-orue292": { fx: 0.44, fy: 0.6, z: 1.3 },
  "yo-orue300": { fx: 0.5, fy: 0.5, z: 1.1 },
  "yo-5715": { fx: 0.6, fy: 0.45, z: 1.0 },
  "yo-2717": { fx: 0.47, fy: 0.45, z: 1.1 }
};
export const ENC_DEFECTO = { fx: 0.5, fy: 0.45, z: 1 };
