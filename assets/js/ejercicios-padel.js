// Banco de ejercicios de clase: arma las pestañas Individual/Grupal, los
// bloques por nivel y las tarjetas de ejercicio, con un diagrama de cancha
// en SVG generado a partir de una plantilla liviana (sin coordenadas a mano
// por ejercicio). 100% local, basado en ejercicios-padel-data.js.
import { MODALIDADES, NIVELES, PLANES, EJERCICIOS, CONSEJOS } from "./ejercicios-padel-data.js?v=1";

function $(id) { return document.getElementById(id); }

// ---------------- Diagramas de cancha (SVG) ----------------
function marcador(x, y, label, rol) {
  const fill = rol === "coach" ? "var(--court)" : "var(--accent)";
  const textFill = rol === "coach" ? "#fff" : "var(--court-dark)";
  return `<circle cx="${x}" cy="${y}" r="10" style="fill:${fill};stroke:#fff;stroke-width:2"/>
    <text x="${x}" y="${y + 4}" text-anchor="middle" style="font-size:10px;font-weight:800;font-family:'Sora',sans-serif;fill:${textFill}">${label}</text>`;
}
// Punta de flecha dibujada inline (en vez de <marker>): con 36 diagramas en
// la misma página, los id de <marker> se repetirían y url(#id) podría
// resolver contra el primer marcador del documento en vez del propio.
function puntaFlecha(x1, y1, x2, y2, color) {
  const angulo = Math.atan2(y2 - y1, x2 - x1);
  const largo = 7, apertura = 0.45;
  const ax1 = x2 - largo * Math.cos(angulo - apertura);
  const ay1 = y2 - largo * Math.sin(angulo - apertura);
  const ax2 = x2 - largo * Math.cos(angulo + apertura);
  const ay2 = y2 - largo * Math.sin(angulo + apertura);
  return `<polygon points="${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}" style="fill:${color}"/>`;
}
function flechaPelota(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--court);stroke-width:2.5"/>` +
    puntaFlecha(x1, y1, x2, y2, "var(--court)");
}
function flechaMov(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--ink-soft);stroke-width:2;stroke-dasharray:4 3"/>` +
    puntaFlecha(x1, y1, x2, y2, "var(--ink-soft)");
}
function cono(x, y) {
  return `<polygon points="${x},${y - 6} ${x - 5},${y + 5} ${x + 5},${y + 5}" style="fill:var(--accent-dark)"/>`;
}
function etiqueta(x, y, texto) {
  return `<text x="${x}" y="${y}" text-anchor="middle" style="font-size:8px;font-weight:800;letter-spacing:0.03em;fill:var(--ink-soft);text-transform:uppercase">${texto}</text>`;
}

const PLANTILLAS = {
  estatico(p) {
    if (p.labelA === "4") {
      return [50, 90, 130, 70].map((y, i) => marcador(60 + (i % 2) * 40, y, String(i + 1), "alumno")).join("");
    }
    return marcador(70, 75, "P", "coach") + marcador(100, 75, p.labelA || "A", "alumno");
  },
  feed(p) {
    const destino = p.lado === "derecha" ? [40, 45] : p.lado === "izquierda" ? [40, 105] : [40, 75];
    return marcador(120, 75, "P", "coach") + flechaPelota(120, 75, destino[0], destino[1]) + marcador(destino[0], destino[1], "A", "alumno");
  },
  feedMove(p) {
    const destino = p.lado === "derecha" ? [40, 45] : [40, 105];
    return marcador(120, 75, "P", "coach") +
      flechaMov(40, 75, destino[0], destino[1]) +
      flechaPelota(120, 75, destino[0], destino[1]) +
      marcador(destino[0], destino[1], "A", "alumno");
  },
  saque() {
    return marcador(100, 75, "A", "alumno") + flechaMov(100, 68, 100, 50);
  },
  circuito() {
    const a = [40, 45], b = [110, 75], c = [40, 105];
    return cono(...a) + cono(...b) + cono(...c) +
      flechaMov(a[0], a[1], b[0], b[1]) + flechaMov(b[0], b[1], c[0], c[1]) + flechaMov(c[0], c[1], a[0], a[1]) +
      marcador(a[0], a[1] - 16, "A", "alumno");
  },
  circuitoDoble() {
    const aL = [40, 45], bL = [110, 75], cL = [40, 105];
    const aR = [260, 45], bR = [190, 75], cR = [260, 105];
    return cono(...aL) + cono(...bL) + cono(...cL) +
      flechaMov(aL[0], aL[1], bL[0], bL[1]) + flechaMov(bL[0], bL[1], cL[0], cL[1]) + flechaMov(cL[0], cL[1], aL[0], aL[1]) +
      cono(...aR) + cono(...bR) + cono(...cR) +
      flechaMov(aR[0], aR[1], bR[0], bR[1]) + flechaMov(bR[0], bR[1], cR[0], cR[1]) + flechaMov(cR[0], cR[1], aR[0], aR[1]) +
      marcador(aL[0], aL[1] - 16, "A", "alumno") + marcador(aR[0], aR[1] - 16, "B", "alumno");
  },
  pared() {
    return flechaPelota(20, 20, 70, 75) + marcador(70, 75, "A", "alumno") + etiqueta(20, 12, "pared");
  },
  red() {
    return marcador(130, 55, "P", "coach") + flechaPelota(130, 55, 90, 95) + marcador(90, 95, "A", "alumno");
  },
  smash() {
    return flechaPelota(30, 75, 110, 55) + marcador(110, 55, "A", "alumno") + etiqueta(30, 90, "alto");
  },
  sparring() {
    return marcador(260, 75, "P", "coach") + marcador(40, 75, "A", "alumno") +
      flechaPelota(40, 60, 260, 60) + flechaPelota(260, 90, 40, 90);
  },
  fila() {
    const posiciones = [30, 60, 90, 120];
    return marcador(120, 75, "P", "coach") +
      flechaPelota(120, 75, 40, posiciones[0]) +
      posiciones.map((y, i) => marcador(40, y, String(i + 1), i === 0 ? "alumno-activo" : "alumno")).join("");
  },
  parejaRed() {
    return marcador(100, 55, "A1", "alumno") + marcador(100, 95, "A2", "alumno") + flechaPelota(100, 55, 100, 95);
  },
  defensaAtaque() {
    return etiqueta(120, 25, "ataque") + etiqueta(60, 25, "defensa") +
      marcador(120, 55, "A1", "alumno") + marcador(120, 95, "A2", "alumno") +
      marcador(60, 55, "A3", "alumno") + marcador(60, 95, "A4", "alumno");
  },
  grupo2v2() {
    return marcador(40, 45, "A1", "alumno") + marcador(40, 105, "A2", "alumno") +
      marcador(260, 45, "B1", "alumno") + marcador(260, 105, "B2", "alumno") +
      flechaPelota(40, 45, 260, 105) + flechaPelota(260, 45, 40, 105);
  },
  grupo2v2centro() {
    return marcador(40, 45, "A1", "alumno") + marcador(40, 105, "A2", "alumno") +
      marcador(260, 45, "B1", "alumno") + marcador(260, 105, "B2", "alumno") +
      flechaPelota(40, 45, 260, 75) + flechaPelota(260, 45, 40, 75) + etiqueta(150, 10, "al centro");
  },
  redDoble() {
    return marcador(120, 55, "A1", "alumno") + marcador(120, 95, "A2", "alumno") +
      marcador(180, 55, "B1", "alumno") + marcador(180, 95, "B2", "alumno") +
      flechaPelota(120, 55, 180, 95) + flechaPelota(180, 55, 120, 95);
  },
  cuna() {
    return marcador(260, 45, "B1", "alumno") + marcador(260, 105, "B2", "alumno") +
      flechaMov(40, 55, 100, 60) + flechaMov(40, 95, 100, 90) +
      marcador(100, 60, "A1", "alumno") + marcador(100, 90, "A2", "alumno");
  },
  pico() {
    return flechaPelota(90, 75, 20, 125) + marcador(90, 75, "A", "alumno") + etiqueta(30, 132, "pico");
  },
  lateral() {
    return flechaPelota(90, 75, 55, 20) + marcador(90, 75, "A", "alumno") + etiqueta(55, 12, "pared lateral");
  },
  pantano() {
    return `<rect x="55" y="55" width="40" height="40" style="fill:rgba(192,57,43,0.18);stroke:#c0392b;stroke-width:1.5;stroke-dasharray:3 2"/>` +
      etiqueta(75, 50, "zona pantano") +
      marcador(120, 45, "A1", "alumno") + marcador(120, 105, "A2", "alumno") +
      marcador(30, 45, "A3", "alumno") + marcador(30, 105, "A4", "alumno");
  }
};

function renderDiagrama(spec) {
  const fn = PLANTILLAS[spec.tipo] || PLANTILLAS.estatico;
  const interior = fn(spec);
  return `<svg viewBox="0 0 300 150" class="ejercicio-diagram" role="img" aria-hidden="true">
    <rect x="10" y="15" width="280" height="120" rx="4" style="fill:var(--bg);stroke:var(--border);stroke-width:2"/>
    <line x1="150" y1="15" x2="150" y2="135" style="stroke:var(--court-dark);stroke-width:3"/>
    <line x1="80" y1="15" x2="80" y2="135" style="stroke:var(--border);stroke-width:1.5;stroke-dasharray:3 3"/>
    <line x1="220" y1="15" x2="220" y2="135" style="stroke:var(--border);stroke-width:1.5;stroke-dasharray:3 3"/>
    ${interior}
  </svg>`;
}

// ---------------- Armado de la página ----------------
function renderPlan(modalidadId) {
  const plan = PLANES.find((p) => p.modalidad === modalidadId);
  if (!plan) return "";
  const bloques = plan.bloques.map((b) =>
    `<li class="plan-clase-bloque"><span class="plan-tiempo">${b.tiempo}</span><span>${b.actividad}</span></li>`
  ).join("");
  return `<div class="plan-clase">
    <h3>${plan.titulo}</h3>
    <ol class="plan-clase-bloques">${bloques}</ol>
  </div>`;
}

function renderEjercicioCard(item) {
  const pasos = item.pasos.map((p) => `<li>${p}</li>`).join("");
  return `<article class="ejercicio-card">
    <div class="ejercicio-media">
      <img class="ejercicio-foto" src="${item.foto.src}" alt="${item.foto.alt}" loading="lazy" width="300" height="225">
      <div class="ejercicio-diagram-wrap">${renderDiagrama(item.diagrama)}</div>
    </div>
    <div class="ejercicio-body">
      <div class="ejercicio-meta">
        <span class="ejercicio-tema">${item.tema}</span>
        <span class="ejercicio-duracion">⏱️ ${item.duracion}</span>
      </div>
      <h4>${item.titulo}</h4>
      <p class="ejercicio-objetivo">${item.objetivo}</p>
      <ol class="ejercicio-pasos">${pasos}</ol>
    </div>
  </article>`;
}

function renderModalidad(modalidadId) {
  const niveles = NIVELES.map((nivel) => {
    const items = EJERCICIOS.filter((e) => e.modalidad === modalidadId && e.nivel === nivel.id);
    if (!items.length) return "";
    return `<div class="nivel-bloque">
      <div class="nivel-titulo">
        <span class="level-num">${nivel.numero}</span>
        <h3>${nivel.nombre}</h3>
      </div>
      <p class="nivel-sub">${items.length} ejercicios para este nivel.</p>
      <div class="ejercicios-grid">${items.map(renderEjercicioCard).join("")}</div>
    </div>`;
  }).join("");
  return renderPlan(modalidadId) + niveles;
}

function construirTabs() {
  const tabsWrap = $("ejerciciosTabs");
  const vistasWrap = $("ejerciciosVistas");
  MODALIDADES.forEach((m, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "faq-tab" + (i === 0 ? " active" : "");
    tab.textContent = `${m.icono} ${m.nombre}`;
    tab.dataset.modalidad = m.id;
    tab.addEventListener("click", () => {
      document.querySelectorAll("#ejerciciosTabs .faq-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll("#ejerciciosVistas .faq-view").forEach((v) => v.classList.remove("active"));
      tab.classList.add("active");
      $(`vista-${m.id}`).classList.add("active");
    });
    tabsWrap.appendChild(tab);

    const vista = document.createElement("div");
    vista.className = "faq-view" + (i === 0 ? " active" : "");
    vista.id = `vista-${m.id}`;
    vista.innerHTML = renderModalidad(m.id);
    vistasWrap.appendChild(vista);
  });

  const total = EJERCICIOS.length;
  $("ejerciciosContador").textContent = `${total} ejercicios en total, basados en nuestro manual de entrenador y en guías de metodología de PadelStar.`;
}

function renderConsejos() {
  const wrap = $("consejosLista");
  if (!wrap) return;
  wrap.innerHTML = CONSEJOS.map((c) => `
    <div class="consejo-card">
      <h4>${c.titulo}</h4>
      <p>${c.texto}</p>
    </div>`).join("");
}

construirTabs();
renderConsejos();
