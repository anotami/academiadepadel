// Generador de torneos Americano/Mexicano para jornadas sociales. 100% local
// (sin Firebase): rota parejas, acumula puntos individuales por ronda y arma
// la tabla de posiciones.

const STORAGE_KEY = "arbitro_torneo_v1";

function estadoInicial() {
  return {
    jugadores: [],
    formato: "americano",
    numPistas: 2,
    rondas: [], // cada ronda: { numero, partidos: [{pista, equipoA:[], equipoB:[], golesA, golesB, guardado}], descansan: [] }
    historialParejas: {} // "nombreA|nombreB" (orden alfabético) -> veces que jugaron juntos
  };
}

let state = estadoInicial();

function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...estadoInicial(), ...JSON.parse(raw) };
  } catch (e) {}
}

function parKey(pair) { return [...pair].sort().join("|"); }

function puntosPorJugador() {
  const puntos = {};
  const rondasJugadas = {};
  state.jugadores.forEach((j) => { puntos[j] = 0; rondasJugadas[j] = 0; });
  state.rondas.forEach((ronda) => {
    ronda.partidos.forEach((p) => {
      if (!p.guardado) return;
      p.equipoA.forEach((j) => { puntos[j] = (puntos[j] || 0) + p.golesA; rondasJugadas[j] = (rondasJugadas[j] || 0) + 1; });
      p.equipoB.forEach((j) => { puntos[j] = (puntos[j] || 0) + p.golesB; rondasJugadas[j] = (rondasJugadas[j] || 0) + 1; });
    });
  });
  return { puntos, rondasJugadas };
}

function mejorParDeCuatro(grupo, historial) {
  const opciones = [
    [[grupo[0], grupo[1]], [grupo[2], grupo[3]]],
    [[grupo[0], grupo[2]], [grupo[1], grupo[3]]],
    [[grupo[0], grupo[3]], [grupo[1], grupo[2]]]
  ];
  let mejor = opciones[0];
  let mejorCosto = Infinity;
  opciones.forEach((op) => {
    const costo = (historial[parKey(op[0])] || 0) + (historial[parKey(op[1])] || 0);
    if (costo < mejorCosto) { mejorCosto = costo; mejor = op; }
  });
  return { equipoA: mejor[0], equipoB: mejor[1], costo: mejorCosto };
}

function generarRondaAmericano() {
  const numGrupos = Math.min(Math.floor(state.jugadores.length / 4), state.numPistas);
  let mejorIntento = null;
  let mejorCostoTotal = Infinity;
  for (let intento = 0; intento < 300; intento++) {
    const shuffled = [...state.jugadores].sort(() => Math.random() - 0.5);
    const enJuego = shuffled.slice(0, numGrupos * 4);
    const descansan = shuffled.slice(numGrupos * 4);
    let costoTotal = 0;
    const partidos = [];
    for (let i = 0; i < enJuego.length; i += 4) {
      const grupo = enJuego.slice(i, i + 4);
      const { equipoA, equipoB, costo } = mejorParDeCuatro(grupo, state.historialParejas);
      costoTotal += costo;
      partidos.push({ pista: i / 4 + 1, equipoA, equipoB, golesA: null, golesB: null, guardado: false });
    }
    if (costoTotal < mejorCostoTotal) { mejorCostoTotal = costoTotal; mejorIntento = { partidos, descansan }; }
    if (mejorCostoTotal === 0) break;
  }
  return mejorIntento;
}

function generarRondaMexicano() {
  const { puntos } = puntosPorJugador();
  const ordenados = [...state.jugadores].sort((a, b) => (puntos[b] || 0) - (puntos[a] || 0) || Math.random() - 0.5);
  const numGrupos = Math.min(Math.floor(state.jugadores.length / 4), state.numPistas);
  const enJuego = ordenados.slice(0, numGrupos * 4);
  const descansan = ordenados.slice(numGrupos * 4);
  const partidos = [];
  for (let i = 0; i < enJuego.length; i += 4) {
    const grupo = enJuego.slice(i, i + 4); // ya vienen ordenados por nivel dentro del grupo
    partidos.push({
      pista: i / 4 + 1,
      equipoA: [grupo[0], grupo[3]],
      equipoB: [grupo[1], grupo[2]],
      golesA: null, golesB: null, guardado: false
    });
  }
  return { partidos, descansan };
}

function generarRonda() {
  const resultado = state.formato === "mexicano" ? generarRondaMexicano() : generarRondaAmericano();
  state.rondas.push({ numero: state.rondas.length + 1, partidos: resultado.partidos, descansan: resultado.descansan });
  save();
  render();
}

function guardarRonda(rondaIdx) {
  const ronda = state.rondas[rondaIdx];
  let ok = true;
  ronda.partidos.forEach((p, i) => {
    const inputA = document.getElementById(`golesA-${rondaIdx}-${i}`);
    const inputB = document.getElementById(`golesB-${rondaIdx}-${i}`);
    const a = Number(inputA.value);
    const b = Number(inputB.value);
    if (inputA.value === "" || inputB.value === "" || isNaN(a) || isNaN(b)) { ok = false; return; }
    p.golesA = a;
    p.golesB = b;
    p.guardado = true;
    p.equipoA.forEach((j1) => p.equipoA.forEach((j2) => { if (j1 !== j2) bumpHistorial(j1, j2); }));
    p.equipoB.forEach((j1) => p.equipoB.forEach((j2) => { if (j1 !== j2) bumpHistorial(j1, j2); }));
  });
  if (!ok) { alert("Completa el marcador de todas las pistas de esta ronda."); return; }
  save();
  render();
}

function bumpHistorial(a, b) {
  const key = parKey([a, b]);
  state.historialParejas[key] = (state.historialParejas[key] || 0) + 1;
}

function render() {
  const setup = document.getElementById("pantallaSetupTorneo");
  const torneo = document.getElementById("pantallaTorneo");
  const hayTorneo = state.rondas.length > 0;
  setup.hidden = hayTorneo;
  torneo.hidden = !hayTorneo;
  if (!hayTorneo) return;

  document.getElementById("torneoInfo").textContent =
    `${state.jugadores.length} jugadores · Formato ${state.formato === "mexicano" ? "Mexicano" : "Americano"} · ${state.numPistas} pista(s) · Ronda ${state.rondas.length}`;

  const cont = document.getElementById("rondasContenedor");
  cont.innerHTML = "";
  state.rondas.slice().reverse().forEach((ronda) => {
    const idx = ronda.numero - 1;
    const div = document.createElement("div");
    div.className = "portal-card";
    const todasGuardadas = ronda.partidos.every((p) => p.guardado);
    div.innerHTML = `
      <h3>Ronda ${ronda.numero}${todasGuardadas ? " ✓" : ""}</h3>
      ${ronda.descansan.length ? `<p class="field-hint">Descansan: ${ronda.descansan.join(", ")}</p>` : ""}
      ${ronda.partidos.map((p, i) => `
        <div class="request-card">
          <div class="request-info">
            <p class="request-title">Pista ${p.pista}</p>
            <p>${p.equipoA.join(" / ")} <strong>vs</strong> ${p.equipoB.join(" / ")}</p>
          </div>
          <div class="request-actions">
            <input type="number" min="0" style="width:60px" id="golesA-${idx}-${i}" value="${p.golesA ?? ""}" ${p.guardado ? "disabled" : ""} placeholder="A">
            <span>-</span>
            <input type="number" min="0" style="width:60px" id="golesB-${idx}-${i}" value="${p.golesB ?? ""}" ${p.guardado ? "disabled" : ""} placeholder="B">
          </div>
        </div>
      `).join("")}
      ${!todasGuardadas ? `<button class="btn btn-primary btn-small" data-guardar-ronda="${idx}">Guardar resultados de esta ronda</button>` : ""}
    `;
    cont.appendChild(div);
  });

  cont.querySelectorAll("[data-guardar-ronda]").forEach((btn) => {
    btn.addEventListener("click", () => guardarRonda(Number(btn.dataset.guardarRonda)));
  });

  const ultimaRonda = state.rondas[state.rondas.length - 1];
  const btnGenerar = document.getElementById("btnSiguienteRonda");
  if (!ultimaRonda.partidos.every((p) => p.guardado)) {
    if (btnGenerar) btnGenerar.remove();
  } else if (!btnGenerar) {
    const btn = document.createElement("button");
    btn.id = "btnSiguienteRonda";
    btn.className = "btn btn-primary btn-large";
    btn.style.marginBottom = "20px";
    btn.textContent = `Generar ronda ${state.rondas.length + 1} ▶`;
    btn.addEventListener("click", generarRonda);
    cont.prepend(btn);
  }

  const { puntos, rondasJugadas } = puntosPorJugador();
  const filas = state.jugadores
    .map((j) => ({ nombre: j, puntos: puntos[j] || 0, rondas: rondasJugadas[j] || 0 }))
    .sort((a, b) => b.puntos - a.puntos);
  const body = document.getElementById("posicionesBody");
  body.innerHTML = "";
  filas.forEach((f, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td style="text-align:left">${f.nombre}</td><td>${f.puntos}</td><td>${f.rondas}</td>`;
    body.appendChild(tr);
  });
}

function wireToggleGroup(id, cb) {
  const group = document.getElementById(id);
  group.querySelectorAll(".arbitro-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      group.querySelectorAll(".arbitro-toggle").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      cb(btn.dataset.value);
    });
  });
}

function init() {
  load();
  wireToggleGroup("g-formato", (v) => { state.formato = v; });

  document.getElementById("btnGenerarTorneo").addEventListener("click", () => {
    const nombres = document.getElementById("t-jugadores").value
      .split("\n").map((s) => s.trim()).filter(Boolean);
    const msg = document.getElementById("torneoMsg");
    if (nombres.length < 4) { msg.className = "form-msg error"; msg.textContent = "Ingresa al menos 4 jugadores."; return; }
    state.jugadores = nombres;
    state.numPistas = Math.max(1, Number(document.getElementById("t-pistas").value) || 1);
    msg.textContent = "";
    generarRonda();
  });

  document.getElementById("btnReiniciarTorneo").addEventListener("click", () => {
    if (!confirm("¿Empezar un torneo nuevo? Se perderá la tabla actual.")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = estadoInicial();
    render();
    document.getElementById("t-jugadores").value = "";
  });

  document.getElementById("btnCompartirTorneo").addEventListener("click", () => {
    const { puntos } = puntosPorJugador();
    const filas = state.jugadores.map((j) => ({ nombre: j, puntos: puntos[j] || 0 })).sort((a, b) => b.puntos - a.puntos);
    let txt = `🎾 TABLA DE POSICIONES — academiadepadel.pe\nTorneo ${state.formato === "mexicano" ? "Mexicano" : "Americano"}, ronda ${state.rondas.length}\n\n`;
    filas.forEach((f, i) => { txt += `${i + 1}. ${f.nombre} — ${f.puntos} pts\n`; });
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  });

  render();
}

document.addEventListener("DOMContentLoaded", init);
