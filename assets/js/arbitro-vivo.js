// Visor público de solo lectura del marcador en vivo. Sin login: cualquiera
// con el link puede ver el partido mientras el árbitro lo tiene compartido.
import { nombreEquipo, labelsDePuntos, tiempoRelativo } from "./arbitro-common.js?v=4";

const id = new URLSearchParams(location.search).get("id");

function nomEq(config, team) { return nombreEquipo(config, team); }

function mostrarError() {
  document.getElementById("vivoCargando").hidden = true;
  document.getElementById("vivoContenido").hidden = true;
  document.getElementById("vivoError").hidden = false;
}

function render(data) {
  document.getElementById("vivoCargando").hidden = true;
  document.getElementById("vivoError").hidden = true;
  document.getElementById("vivoContenido").hidden = false;

  const c = data.config;
  const m = data.match;
  document.getElementById("nombreEquipoA").textContent = nomEq(c, "A");
  document.getElementById("nombreEquipoB").textContent = nomEq(c, "B");
  document.getElementById("vivoMeta").textContent = [c.club, c.pista ? `Pista ${c.pista}` : "", c.pais].filter(Boolean).join(" · ");

  const badge = document.getElementById("vivoEstadoBadge");
  if (data.estado === "finalizado") { badge.textContent = "Finalizado"; badge.className = "badge badge-confirmada"; }
  else if (data.estado === "interrumpido") { badge.textContent = "Interrumpido"; badge.className = "badge badge-pendiente"; }
  else { badge.textContent = "En curso"; badge.className = "badge badge-confirmada"; }

  for (const team of ["A", "B"]) {
    for (let col = 0; col < 3; col++) {
      const cell = document.getElementById(`set${team}${col + 1}`);
      const completed = m.sets[col];
      if (completed) cell.textContent = team === "A" ? completed.a : completed.b;
      else if (col === m.sets.length && !m.matchWinner) cell.textContent = team === "A" ? m.currentSet.a : m.currentSet.b;
      else cell.textContent = "–";
    }
  }

  const [la, lb] = m.isSuperTiebreakSet || m.inTiebreak ? [m.currentGame.a, m.currentGame.b] : labelsDePuntos(m.currentGame.a, m.currentGame.b);
  document.getElementById("ptsA").textContent = la;
  document.getElementById("ptsB").textContent = lb;
  document.getElementById("rowA").classList.toggle("sirve", m.servidor === "A" && !m.matchWinner);
  document.getElementById("rowB").classList.toggle("sirve", m.servidor === "B" && !m.matchWinner);

  const estado = document.getElementById("estadoJuego");
  if (m.matchWinner) estado.textContent = `🏆 Gana el partido: ${nomEq(c, m.matchWinner)}`;
  else if (m.interrupcionActiva) estado.textContent = `⏸ Interrumpido: ${m.interrupcionActiva.tipo}`;
  else if (m.isSuperTiebreakSet) estado.textContent = "Super tie-break a 10";
  else if (m.inTiebreak) estado.textContent = "Tie-break a 7";
  else estado.textContent = `Saca ${nomEq(c, m.servidor)}`;

  const actualizadoMs = data.actualizadoEn && data.actualizadoEn.toMillis ? data.actualizadoEn.toMillis() : Date.now();
  const elAct = document.getElementById("ultimaActualizacion");
  elAct.dataset.ms = String(actualizadoMs);
  elAct.textContent = `Actualizado ${tiempoRelativo(actualizadoMs)}`;
}

setInterval(() => {
  const el = document.getElementById("ultimaActualizacion");
  if (el && el.dataset.ms) el.textContent = `Actualizado ${tiempoRelativo(Number(el.dataset.ms))}`;
}, 15000);

// El import de Firebase se hace de forma diferida: si no hay internet o el
// CDN no responde, mostramos el error de conexión en vez de dejar la página
// colgada en "Cargando…" para siempre.
if (!id) {
  mostrarError();
} else {
  import("./firebase-app.js?v=12")
    .then(({ db, doc, onSnapshot }) => {
      onSnapshot(doc(db, "arbitrajes", id), (snap) => {
        if (!snap.exists()) { mostrarError(); return; }
        render(snap.data());
      }, mostrarError);
    })
    .catch(mostrarError);
}
