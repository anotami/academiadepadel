// Multipista (arbitraje pasivo): ve en vivo todas las pistas que se están
// arbitrando ahora mismo, y un ranking interno acumulado de partidos
// finalizados que se jugaron con marcador en vivo activado.
import { nombreEquipo, labelsDePuntos, tiempoRelativo } from "./arbitro-common.js?v=2";

// El cambio de pestañas es pura UI local: se conecta primero y sin depender
// de que Firebase cargue bien, para que nunca quede "colgado".
document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".auth-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab === "enVivo" ? "panelEnVivo" : "panelRanking").classList.add("active");
  });
});

function tarjetaPartido(id, data) {
  const c = data.config;
  const m = data.match;
  const [la, lb] = m.isSuperTiebreakSet || m.inTiebreak ? [m.currentGame.a, m.currentGame.b] : labelsDePuntos(m.currentGame.a, m.currentGame.b);
  const sets = m.sets.map((s) => `${s.a}-${s.b}`).join(" · ") || "Set 1";
  const actualizadoMs = data.actualizadoEn && data.actualizadoEn.toMillis ? data.actualizadoEn.toMillis() : Date.now();
  const alerta = m.interrupcionActiva ? `<span class="badge badge-pendiente">⏸ ${m.interrupcionActiva.tipo}</span>` : "";

  const div = document.createElement("div");
  div.className = "court-card arbitro-multipista-card";
  div.innerHTML = `
    <h3>${c.pista ? `Pista ${c.pista}` : "Pista sin nombre"} ${alerta}</h3>
    <p class="court-meta">${[c.club, c.pais].filter(Boolean).join(" · ")}</p>
    <p><strong>${nombreEquipo(c, "A")}</strong> vs <strong>${nombreEquipo(c, "B")}</strong></p>
    <p>Sets: ${sets} · Juego actual: ${m.currentSet.a}-${m.currentSet.b} (${la}-${lb})</p>
    <p class="field-hint">Actualizado ${tiempoRelativo(actualizadoMs)}</p>
    <a class="btn btn-outline btn-small" href="arbitro-vivo.html?id=${id}" target="_blank" rel="noopener">Ver pantalla completa</a>
  `;
  return div;
}

function renderGrid(docs) {
  const grid = document.getElementById("gridPistas");
  const empty = document.getElementById("sinPartidos");
  grid.innerHTML = "";
  empty.hidden = docs.length > 0;
  docs
    .sort((a, b) => {
      const ma = a.data().actualizadoEn && a.data().actualizadoEn.toMillis ? a.data().actualizadoEn.toMillis() : 0;
      const mb = b.data().actualizadoEn && b.data().actualizadoEn.toMillis ? b.data().actualizadoEn.toMillis() : 0;
      return mb - ma;
    })
    .forEach((d) => grid.appendChild(tarjetaPartido(d.id, d.data())));
}

function renderRanking(docs) {
  const stats = new Map();
  function sumar(nombre, gano) {
    if (!stats.has(nombre)) stats.set(nombre, { jugados: 0, ganados: 0 });
    const s = stats.get(nombre);
    s.jugados++;
    if (gano) s.ganados++;
  }
  docs.forEach((d) => {
    const data = d.data();
    const c = data.config;
    const winner = data.match.matchWinner;
    if (!winner) return;
    const ganadores = winner === "A" ? [c.a1, c.a2] : [c.b1, c.b2];
    const perdedores = winner === "A" ? [c.b1, c.b2] : [c.a1, c.a2];
    ganadores.map((n) => (n || "").trim()).filter(Boolean).forEach((n) => sumar(n, true));
    perdedores.map((n) => (n || "").trim()).filter(Boolean).forEach((n) => sumar(n, false));
  });

  const filas = Array.from(stats.entries())
    .map(([nombre, s]) => ({ nombre, ...s, pct: s.jugados ? Math.round((s.ganados / s.jugados) * 100) : 0 }))
    .sort((a, b) => b.ganados - a.ganados || b.pct - a.pct);

  const body = document.getElementById("rankingBody");
  body.innerHTML = "";
  document.getElementById("sinRanking").hidden = filas.length > 0;
  filas.forEach((f, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td style="text-align:left">${f.nombre}</td><td>${f.jugados}</td><td>${f.ganados}</td><td>${f.pct}%</td>`;
    body.appendChild(tr);
  });
}

// La carga de datos sí depende de Firebase; si el CDN falla (sin internet,
// bloqueado), mostramos un aviso en vez de dejar la grilla vacía sin explicar.
import("./firebase-app.js?v=12")
  .then(({ db, collection, query, where, onSnapshot }) => {
    const enCurso = new Map();
    const interrumpidos = new Map();
    function repintar() {
      renderGrid([...enCurso.values(), ...interrumpidos.values()]);
    }
    onSnapshot(query(collection(db, "arbitrajes"), where("estado", "==", "en_curso")), (snap) => {
      enCurso.clear();
      snap.docs.forEach((d) => enCurso.set(d.id, d));
      repintar();
    }, () => { document.getElementById("sinPartidos").textContent = "No se pudo conectar (revisa tu internet)."; });

    onSnapshot(query(collection(db, "arbitrajes"), where("estado", "==", "interrumpido")), (snap) => {
      interrumpidos.clear();
      snap.docs.forEach((d) => interrumpidos.set(d.id, d));
      repintar();
    });

    onSnapshot(query(collection(db, "arbitrajes"), where("estado", "==", "finalizado")), (snap) => {
      renderRanking(snap.docs);
    });
  })
  .catch(() => {
    document.getElementById("sinPartidos").textContent = "No se pudo conectar con el marcador en vivo (revisa tu internet).";
    document.getElementById("sinRanking").hidden = false;
    document.getElementById("sinRanking").textContent = "No se pudo conectar con el ranking (revisa tu internet).";
  });
