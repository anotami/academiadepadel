// Página pública del informe de clase: informe.html?t=<token>.
// Lee un solo documento (informes/<token>) por id; las reglas no dejan listar.
import { db, doc, getDoc } from "./firebase-app.js?v=18";
import { escapeHtml } from "./utils.js?v=1";
import { METRICAS, driveImg, driveVideo, fechaCorta, sparkline, delta } from "./informes-common.js?v=1";

const main = document.getElementById("informe");
const token = new URLSearchParams(location.search).get("t") || "";

async function cargar() {
  if (!/^[A-Za-z0-9]{12,40}$/.test(token)) return error();
  let snap;
  try { snap = await getDoc(doc(db, "informes", token)); } catch { return error(); }
  // Un borrador también se ve (el profe lo previsualiza); el alumno recibe el link recién cuando está listo.
  if (!snap.exists()) return error();
  render(snap.data());
}

function error() {
  main.innerHTML = `<div class="inf-hoja"><h1>Informe no disponible</h1><p>El link no es válido o el informe fue retirado. Escribile a la academia por WhatsApp.</p></div>`;
}

function render(i) {
  document.title = `Tu clase del ${fechaCorta(i.fecha)} · Academia de Pádel GP`;
  const m = i.metricas || {}, p = i.previa || null;
  const filas = METRICAS.filter((x) => m[x.k] != null).map((x) => `
    <tr><td>${x.label}</td><td><strong>${m[x.k]}${x.unidad ? " " + x.unidad : ""}</strong>
      ${p ? delta(m[x.k], p[x.k], x.menosEsMejor) : ""}</td></tr>`).join("");
  const clips = (i.correcciones || []).map((c, n) => `
    <li class="inf-clip">
      <h3>${n + 1}. ${escapeHtml(c.titulo)} <span class="inf-hora">· ${escapeHtml(c.hora || "")}</span></h3>
      <p>${escapeHtml(c.texto || "")}</p>
      ${c.fileId ? `<div class="inf-video"><iframe src="${driveVideo(c.fileId)}" title="${escapeHtml(c.titulo)}" allow="autoplay" loading="lazy" allowfullscreen></iframe></div>` : ""}
    </li>`).join("");
  const h = i.historial || [];
  const evolucion = h.length >= 2 ? `
    <section><h2>Tu evolución</h2>
      <p class="inf-sub">${h.length} clases analizadas, desde el ${fechaCorta(h[0].fecha)}.</p>
      <div class="inf-spark"><span>Tiempo en la red</span>${sparkline(h.map((x) => x.red))}</div>
      <div class="inf-spark"><span>Pala abajo en la red (mejor si baja)</span>${sparkline(h.map((x) => x.pala), { color: "#d1242f" })}</div>
      <div class="inf-spark"><span>Ritmo (m/min)</span>${sparkline(h.map((x) => x.ritmo), { color: "#1a7f37" })}</div>
    </section>` : "";
  main.innerHTML = `
    <div class="inf-hoja">
      <p class="inf-marca">Academia de Pádel GP</p>
      <h1>Tu clase del ${fechaCorta(i.fecha)}</h1>
      <p class="inf-sub">${escapeHtml(i.primerNombre || "")}, acá tenés tus números, tres cosas para mirar y la tarea para la próxima.</p>
      <div class="inf-cabecera">
        ${i.foto ? `<img class="inf-foto" src="${driveImg(i.foto, 400)}" alt="Vos en la clase">` : ""}
        ${i.mapa ? `<figure><img class="inf-mapa" src="${driveImg(i.mapa, 700)}" alt="Mapa de calor: dónde estuviste en la cancha"><figcaption>Dónde estuviste en la cancha</figcaption></figure>` : ""}
      </div>
      <section><h2>Tu clase en números</h2><table class="inf-tabla"><tbody>${filas}</tbody></table></section>
      ${clips ? `<section><h2>Tres cosas para mirar</h2><p class="inf-sub">Cada una tiene su clip. Miralo antes de la próxima clase y fijate solo en eso.</p><ol class="inf-clips">${clips}</ol></section>` : ""}
      ${evolucion}
      <section><h2>Para la próxima clase</h2><p>${escapeHtml(i.proxima || "")}</p>
        <ul class="inf-tareas">${(i.tareas || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
        <p><strong>${escapeHtml(i.cierre || "")}</strong></p></section>
      <p class="inf-pie">Análisis automático del video de tu clase (posición y desplazamiento; no evalúa golpes), revisado por tu profe.<br>
        Academia de Pádel GP · <a href="https://wa.me/51957085531">WhatsApp +51 957 085 531</a></p>
    </div>`;
}

cargar();
