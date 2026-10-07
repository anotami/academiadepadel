// Árbitro de pádel — app standalone (sin Firebase, sin backend).
// Todo el estado vive en localStorage para que funcione offline en pista.

const STORAGE_KEY = "arbitro_partido_v1";
const LABELS = ["0", "15", "30", "40"];
const BALL_CHANGE_FIRST = 9; // 7 juegos reales + 2 del peloteo, según bases FIP
const BALL_CHANGE_EVERY = 9;

const CHECKLIST_ITEMS = [
  "Verificación de la pista: superficie, cerramientos y altura de la red",
  "Control de pelotas: marca/modelo oficial y presión/rebote reglamentario",
  "Cantidad de pelotas anunciada coincide con lo verificado",
  "Indumentaria reglamentaria de ambas parejas",
  "Cordón de la pala no elástico y de máximo 35 cm",
  "Ningún jugador porta dispositivos de comunicación en pista",
  "Entrenadores acreditados identificados (si aplica)",
  "Datos de jugadores, club, país y pista registrados"
];

const TIMER_DEFS = [
  { id: "peloteo", label: () => `Peloteo previo (${state.config.peloteoMin} min)`, seconds: () => state.config.peloteoMin * 60 },
  { id: "entrepuntos", label: "Entre puntos", seconds: 20 },
  { id: "cambiolado", label: "Cambio de lado (fin de juego)", seconds: 90 },
  { id: "descansoset", label: "Descanso entre sets", seconds: 120 },
  { id: "tiebreaklado", label: "Cambio de lado en tie-break", seconds: 20 },
  { id: "medico", label: "Atención médica / recuperación", seconds: 300 }
];

function estadoInicial() {
  return {
    screen: "setup",
    config: {
      a1: "", a2: "", b1: "", b2: "", club: "", pais: "Perú", pista: "",
      entrenadorA: "", entrenadorB: "",
      modalidad: "ventaja", tercerSet: "set", peloteoMin: 3,
      bolasMarca: "", bolasCantidad: ""
    },
    checklist: CHECKLIST_ITEMS.map(() => false),
    match: {
      sets: [],
      currentSet: { a: 0, b: 0 },
      currentGame: { a: 0, b: 0 },
      inTiebreak: false,
      isSuperTiebreakSet: false,
      servidor: "A",
      totalGamesForBallChange: 2,
      nextBallChangeAt: BALL_CHANGE_FIRST,
      matchWinner: null,
      horaInicio: null,
      horaFin: null
    },
    incidents: [],
    history: []
  };
}

let state = estadoInicial();
let timer = null; // { id, label, secondsLeft, total, paused, intervalRef }

// ---------------- Persistencia ----------------
function save() {
  try {
    const { history, ...resto } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resto));
  } catch (e) { /* almacenamiento no disponible, seguimos solo en memoria */ }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const datos = JSON.parse(raw);
    state = { ...estadoInicial(), ...datos, history: [] };
  } catch (e) { /* ignorar datos corruptos */ }
}

function pushHistory() {
  try {
    state.history.push(JSON.stringify({ match: state.match, incidents: state.incidents }));
    if (state.history.length > 60) state.history.shift();
  } catch (e) { /* sin undo si falla */ }
}

function undo() {
  if (!state.history.length) return;
  const snap = JSON.parse(state.history.pop());
  state.match = snap.match;
  state.incidents = snap.incidents;
  save();
  render();
}

// ---------------- Helpers de equipo ----------------
function nombreJugador(v, fallback) { return (v || "").trim() || fallback; }
function nombreEquipo(team) {
  const c = state.config;
  if (team === "A") return `${nombreJugador(c.a1, "Jugador A1")} / ${nombreJugador(c.a2, "Jugador A2")}`;
  return `${nombreJugador(c.b1, "Jugador B1")} / ${nombreJugador(c.b2, "Jugador B2")}`;
}
function otro(team) { return team === "A" ? "B" : "A"; }
function inc(obj, team, by = 1) { if (team === "A") obj.a += by; else obj.b += by; }

// ---------------- Motor de puntuación ----------------
function toggleServidor() { state.match.servidor = otro(state.match.servidor); }

function bumpBallChange() {
  const m = state.match;
  m.totalGamesForBallChange++;
  if (m.totalGamesForBallChange >= m.nextBallChangeAt) {
    state.ui = state.ui || {};
    document.getElementById("alertaBolas").hidden = false;
    m.nextBallChangeAt += BALL_CHANGE_EVERY;
  }
}

function marcarAlertaLado(sideTotal) {
  if (sideTotal % 2 === 1) document.getElementById("alertaLado").hidden = false;
}

function winGame(team) {
  const m = state.match;
  inc(m.currentSet, team);
  const sideTotal = m.currentSet.a + m.currentSet.b;
  m.currentGame = { a: 0, b: 0 };
  toggleServidor();
  bumpBallChange();
  marcarAlertaLado(sideTotal);
  checkSetStatus();
}

function checkSetStatus() {
  const m = state.match;
  const set = m.currentSet;
  if (set.a >= 6 || set.b >= 6) {
    if (Math.abs(set.a - set.b) >= 2) {
      finishSet(set.a > set.b ? "A" : "B");
    } else if (set.a === 6 && set.b === 6) {
      m.inTiebreak = true;
      m.currentGame = { a: 0, b: 0 };
    }
  }
}

function finishSet(winner, tiebreakScore) {
  const m = state.match;
  m.sets.push({ a: m.currentSet.a, b: m.currentSet.b, winner, tiebreak: tiebreakScore || null, super: m.isSuperTiebreakSet });
  m.currentSet = { a: 0, b: 0 };
  m.inTiebreak = false;
  const setsA = m.sets.filter((s) => s.winner === "A").length;
  const setsB = m.sets.filter((s) => s.winner === "B").length;
  if (setsA >= 2 || setsB >= 2) {
    m.matchWinner = setsA >= 2 ? "A" : "B";
    m.horaFin = Date.now();
    return;
  }
  if (setsA === 1 && setsB === 1 && state.config.tercerSet === "super") {
    m.isSuperTiebreakSet = true;
  }
}

function addGamePoint(team) {
  const m = state.match;
  const g = m.currentGame;
  if (state.config.modalidad === "oro" && g.a >= 3 && g.b >= 3) {
    winGame(team);
    return;
  }
  inc(g, team);
  if (g.a >= 4 && g.a - g.b >= 2) winGame("A");
  else if (g.b >= 4 && g.b - g.a >= 2) winGame("B");
}

function addTiebreakPoint(team) {
  const m = state.match;
  const g = m.currentGame;
  inc(g, team);
  const total = g.a + g.b;
  if (total % 2 === 1) toggleServidor();
  if (total % 6 === 0) document.getElementById("alertaLado").hidden = false;
  if ((g.a >= 7 || g.b >= 7) && Math.abs(g.a - g.b) >= 2) {
    const winner = g.a > g.b ? "A" : "B";
    inc(m.currentSet, winner);
    const score = `${g.a}-${g.b}`;
    m.currentGame = { a: 0, b: 0 };
    bumpBallChange();
    finishSet(winner, score);
  }
}

function addSuperTiebreakPoint(team) {
  const m = state.match;
  const g = m.currentGame;
  inc(g, team);
  const total = g.a + g.b;
  if (total % 2 === 1) toggleServidor();
  if (total % 4 === 0) document.getElementById("alertaLado").hidden = false;
  if ((g.a >= 10 || g.b >= 10) && Math.abs(g.a - g.b) >= 2) {
    const winner = g.a > g.b ? "A" : "B";
    m.sets.push({ a: g.a, b: g.b, winner, tiebreak: null, super: true });
    m.currentGame = { a: 0, b: 0 };
    bumpBallChange();
    m.matchWinner = winner;
    m.horaFin = Date.now();
  }
}

function addPoint(team) {
  const m = state.match;
  if (m.matchWinner) return;
  pushHistory();
  if (m.isSuperTiebreakSet) addSuperTiebreakPoint(team);
  else if (m.inTiebreak) addTiebreakPoint(team);
  else addGamePoint(team);
  save();
  render();
}

// ---------------- Incidencias ----------------
function marcadorActual() {
  const m = state.match;
  const sets = m.sets.map((s) => `${s.a}-${s.b}${s.tiebreak ? `(${s.tiebreak})` : ""}`).join(" · ");
  const vivo = m.isSuperTiebreakSet || m.inTiebreak
    ? `${m.currentGame.a}-${m.currentGame.b}`
    : `${m.currentSet.a}-${m.currentSet.b} (${LABELS[Math.min(m.currentGame.a, 3)]}-${LABELS[Math.min(m.currentGame.b, 3)]})`;
  return [sets, vivo].filter(Boolean).join(" | ");
}

function pedirEquipo(callback) {
  document.querySelectorAll(".arbitro-equipo-chooser").forEach((el) => el.remove());
  const row = document.createElement("div");
  row.className = "arbitro-incident-buttons arbitro-equipo-chooser";
  row.style.marginTop = "-4px";
  const bA = document.createElement("button");
  bA.className = "btn btn-outline btn-small";
  bA.textContent = nombreEquipo("A");
  const bB = document.createElement("button");
  bB.className = "btn btn-outline btn-small";
  bB.textContent = nombreEquipo("B");
  const bC = document.createElement("button");
  bC.className = "btn btn-outline btn-small";
  bC.textContent = "Cancelar";
  bA.onclick = () => { row.remove(); callback("A"); };
  bB.onclick = () => { row.remove(); callback("B"); };
  bC.onclick = () => row.remove();
  row.append(bA, bB, bC);
  document.querySelector(".arbitro-incident-buttons").after(row);
}

function addIncident(tipo, equipoSancionado) {
  pushHistory();
  state.incidents.push({
    ts: Date.now(),
    tipo,
    equipo: equipoSancionado,
    marcador: marcadorActual()
  });
  const beneficiado = otro(equipoSancionado);
  if (tipo === "Point Penalty") {
    const m = state.match;
    if (m.isSuperTiebreakSet) addSuperTiebreakPoint(beneficiado);
    else if (m.inTiebreak) addTiebreakPoint(beneficiado);
    else addGamePoint(beneficiado);
  } else if (tipo === "Game Penalty") {
    if (!state.match.isSuperTiebreakSet && !state.match.inTiebreak) winGame(beneficiado);
  } else if (tipo === "Descalificación") {
    state.match.matchWinner = beneficiado;
    state.match.horaFin = Date.now();
  }
  save();
  render();
}

// ---------------- Timers ----------------
function formatMMSS(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 250].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay / 1000);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.18);
    });
  } catch (e) { /* audio no disponible */ }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

function stopTimer() {
  if (timer && timer.intervalRef) clearInterval(timer.intervalRef);
  timer = null;
  document.getElementById("timerDisplay").hidden = true;
}

function startTimer(def) {
  stopTimer();
  const seconds = typeof def.seconds === "function" ? def.seconds() : def.seconds;
  const label = typeof def.label === "function" ? def.label() : def.label;
  timer = { id: def.id, label, secondsLeft: seconds, total: seconds, paused: false };
  document.getElementById("timerDisplay").hidden = false;
  document.getElementById("timerLabel").textContent = label;
  document.getElementById("timerCountdown").textContent = formatMMSS(seconds);
  document.getElementById("btnTimerPausa").textContent = "Pausar";
  timer.intervalRef = setInterval(() => {
    if (timer.paused) return;
    timer.secondsLeft--;
    document.getElementById("timerCountdown").textContent = formatMMSS(Math.max(timer.secondsLeft, 0));
    if (timer.secondsLeft <= 0) {
      clearInterval(timer.intervalRef);
      beep();
      setTimeout(stopTimer, 1500);
    }
  }, 1000);
}

// ---------------- Render ----------------
function render() {
  document.getElementById("pantallaSetup").hidden = state.screen !== "setup";
  document.getElementById("pantallaPartido").hidden = state.screen !== "partido";
  document.getElementById("pantallaActa").hidden = state.screen !== "acta";
  if (state.screen === "setup") renderSetup();
  if (state.screen === "partido") renderPartido();
  if (state.screen === "acta") renderActa();
}

function renderSetup() {
  const c = state.config;
  document.getElementById("s-a1").value = c.a1;
  document.getElementById("s-a2").value = c.a2;
  document.getElementById("s-b1").value = c.b1;
  document.getElementById("s-b2").value = c.b2;
  document.getElementById("s-club").value = c.club;
  document.getElementById("s-pais").value = c.pais;
  document.getElementById("s-pista").value = c.pista;
  document.getElementById("s-entrenadorA").value = c.entrenadorA;
  document.getElementById("s-entrenadorB").value = c.entrenadorB;
  document.getElementById("s-bolas-marca").value = c.bolasMarca;
  document.getElementById("s-bolas-cantidad").value = c.bolasCantidad;

  renderChecklist();
}

function renderChecklist() {
  const checklist = document.getElementById("checklist");
  checklist.innerHTML = "";
  CHECKLIST_ITEMS.forEach((texto, i) => {
    const li = document.createElement("li");
    li.className = "arbitro-check-item" + (state.checklist[i] ? " checked" : "");
    li.innerHTML = `<input type="checkbox" ${state.checklist[i] ? "checked" : ""}> <span>${texto}</span>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      leerFormularioSetup();
      state.checklist[i] = !state.checklist[i];
      save();
      renderChecklist();
    });
    checklist.appendChild(li);
  });
}

function labelsDePuntos(a, b) {
  if (a < 3 && b < 3) return [LABELS[a], LABELS[b]];
  if (a >= 3 && b >= 3) {
    if (a === b) return ["40", "40"];
    return a > b ? ["VENT.", "40"] : ["40", "VENT."];
  }
  return [LABELS[Math.min(a, 3)], LABELS[Math.min(b, 3)]];
}

function renderPartido() {
  const c = state.config;
  const m = state.match;
  document.getElementById("nombreEquipoA").textContent = nombreEquipo("A");
  document.getElementById("nombreEquipoB").textContent = nombreEquipo("B");
  document.getElementById("metaInfo").textContent =
    [c.club, c.pista, c.pais].filter(Boolean).join(" · ") +
    (c.modalidad === "oro" ? " · Punto de oro" : " · Con ventajas") +
    (c.tercerSet === "super" ? " · 3er set: super tie-break a 10" : "");

  for (const team of ["A", "B"]) {
    for (let col = 0; col < 3; col++) {
      const cell = document.getElementById(`set${team}${col + 1}`);
      const completed = m.sets[col];
      if (completed) {
        cell.textContent = team === "A" ? completed.a : completed.b;
      } else if (col === m.sets.length && !m.matchWinner) {
        if (m.isSuperTiebreakSet || m.inTiebreak) {
          cell.textContent = team === "A" ? m.currentSet.a : m.currentSet.b;
        } else {
          cell.textContent = team === "A" ? m.currentSet.a : m.currentSet.b;
        }
      } else {
        cell.textContent = "–";
      }
    }
  }

  const [la, lb] = m.isSuperTiebreakSet
    ? [m.currentGame.a, m.currentGame.b]
    : m.inTiebreak
    ? [m.currentGame.a, m.currentGame.b]
    : labelsDePuntos(m.currentGame.a, m.currentGame.b);
  document.getElementById("ptsA").textContent = la;
  document.getElementById("ptsB").textContent = lb;

  document.getElementById("rowA").classList.toggle("sirve", m.servidor === "A" && !m.matchWinner);
  document.getElementById("rowB").classList.toggle("sirve", m.servidor === "B" && !m.matchWinner);

  const estado = document.getElementById("estadoJuego");
  if (m.matchWinner) {
    estado.textContent = `🏆 Gana el partido: ${nombreEquipo(m.matchWinner)}`;
  } else if (m.isSuperTiebreakSet) {
    estado.textContent = `Super tie-break a 10 (gana por 2) · Saca ${nombreEquipo(m.servidor)}`;
  } else if (m.inTiebreak) {
    estado.textContent = `Tie-break a 7 (gana por 2) · Saca ${nombreEquipo(m.servidor)}`;
  } else if (m.currentGame.a >= 3 && m.currentGame.b >= 3 && m.currentGame.a === m.currentGame.b) {
    estado.textContent = c.modalidad === "oro" ? "40-40 · ¡Punto de oro! Define el próximo punto" : "40-40 · Iguales";
  } else {
    estado.textContent = `Saca ${nombreEquipo(m.servidor)}`;
  }

  document.getElementById("btnPuntoA").disabled = !!m.matchWinner;
  document.getElementById("btnPuntoB").disabled = !!m.matchWinner;

  const incLog = document.getElementById("incidentLog");
  const incEmpty = document.getElementById("incidentEmpty");
  incLog.innerHTML = "";
  incEmpty.hidden = state.incidents.length > 0;
  state.incidents.slice().reverse().forEach((inc) => {
    const li = document.createElement("li");
    li.className = "arbitro-incident-item";
    const hora = new Date(inc.ts).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    li.innerHTML = `<span><span class="inc-tipo">${inc.tipo}</span> — ${nombreEquipo(inc.equipo)}<br><small>${inc.marcador}</small></span><span>${hora}</span>`;
    incLog.appendChild(li);
  });
}

function renderActa() {
  const c = state.config;
  const m = state.match;
  const setsRow = [0, 1, 2].map((i) => {
    const s = m.sets[i];
    if (!s) return "<td>–</td>";
    return `<td>${s.a}-${s.b}${s.tiebreak ? ` (${s.tiebreak})` : ""}${s.super ? " ST" : ""}</td>`;
  }).join("");

  const ganador = m.matchWinner
    ? `${nombreEquipo(m.matchWinner)} gana el partido`
    : "Partido no finalizado por marcador (retiro / w.o. / suspendido)";

  const duracion = m.horaInicio && m.horaFin
    ? `${Math.round((m.horaFin - m.horaInicio) / 60000)} min`
    : "—";

  const incidentesHtml = state.incidents.length
    ? `<table><thead><tr><th>Hora</th><th>Tipo</th><th>Pareja</th><th>Marcador</th></tr></thead><tbody>
        ${state.incidents.map((i) => `<tr><td>${new Date(i.ts).toLocaleTimeString("es-PE")}</td><td>${i.tipo}</td><td>${nombreEquipo(i.equipo)}</td><td>${i.marcador}</td></tr>`).join("")}
       </tbody></table>`
    : "<p>Sin incidencias registradas.</p>";

  document.getElementById("actaContenido").innerHTML = `
    <h2>Acta de partido</h2>
    <p class="acta-meta">
      ${c.club ? c.club + " · " : ""}${c.pista ? "Pista " + c.pista + " · " : ""}${c.pais}<br>
      ${m.horaInicio ? new Date(m.horaInicio).toLocaleString("es-PE") : ""} · Duración: ${duracion}
    </p>
    <table>
      <thead><tr><th>Pareja</th><th>Set 1</th><th>Set 2</th><th>Set 3</th></tr></thead>
      <tbody>
        <tr><td style="text-align:left;font-weight:700">${nombreEquipo("A")}</td>${[0, 1, 2].map((i) => m.sets[i] ? `<td>${m.sets[i].a}</td>` : "<td>–</td>").join("")}</tr>
        <tr><td style="text-align:left;font-weight:700">${nombreEquipo("B")}</td>${[0, 1, 2].map((i) => m.sets[i] ? `<td>${m.sets[i].b}</td>` : "<td>–</td>").join("")}</tr>
      </tbody>
    </table>
    <p class="acta-resultado">${ganador}</p>
    <h3>Incidencias / código de conducta</h3>
    ${incidentesHtml}
    <h3>Detalle de sets</h3>
    <table><thead><tr><th>Set 1</th><th>Set 2</th><th>Set 3</th></tr></thead><tbody><tr>${setsRow}</tr></tbody></table>
  `;
}

function actaTexto() {
  const c = state.config;
  const m = state.match;
  const setsTxt = m.sets.map((s) => `${s.a}-${s.b}${s.tiebreak ? `(${s.tiebreak})` : ""}`).join(", ") || "—";
  const ganador = m.matchWinner ? `${nombreEquipo(m.matchWinner)} gana el partido` : "Partido no finalizado";
  let txt = `🎾 ACTA DE PARTIDO — academiadepadel.pe\n`;
  txt += `${nombreEquipo("A")} vs ${nombreEquipo("B")}\n`;
  if (c.club) txt += `Club: ${c.club}\n`;
  if (c.pista) txt += `Pista: ${c.pista}\n`;
  txt += `Sets: ${setsTxt}\n`;
  txt += `Resultado: ${ganador}\n`;
  if (state.incidents.length) {
    txt += `\nIncidencias:\n`;
    state.incidents.forEach((i) => {
      txt += `• ${i.tipo} — ${nombreEquipo(i.equipo)} (${i.marcador})\n`;
    });
  }
  return txt;
}

// ---------------- Validación e inicio ----------------
function leerFormularioSetup() {
  const c = state.config;
  c.a1 = document.getElementById("s-a1").value.trim();
  c.a2 = document.getElementById("s-a2").value.trim();
  c.b1 = document.getElementById("s-b1").value.trim();
  c.b2 = document.getElementById("s-b2").value.trim();
  c.club = document.getElementById("s-club").value.trim();
  c.pais = document.getElementById("s-pais").value.trim();
  c.pista = document.getElementById("s-pista").value.trim();
  c.entrenadorA = document.getElementById("s-entrenadorA").value.trim();
  c.entrenadorB = document.getElementById("s-entrenadorB").value.trim();
  c.bolasMarca = document.getElementById("s-bolas-marca").value.trim();
  c.bolasCantidad = document.getElementById("s-bolas-cantidad").value;
}

function iniciarPartido() {
  leerFormularioSetup();
  const c = state.config;
  const msg = document.getElementById("setupMsg");
  if (!c.a1 || !c.a2 || !c.b1 || !c.b2) {
    msg.className = "form-msg error";
    msg.textContent = "Completa los 4 jugadores antes de iniciar.";
    return;
  }
  const faltan = state.checklist.filter((v) => !v).length;
  if (faltan > 0) {
    msg.className = "form-msg error";
    msg.textContent = `Faltan ${faltan} punto(s) del checklist pre-partido.`;
    return;
  }
  msg.textContent = "";
  state.match.horaInicio = Date.now();
  state.screen = "partido";
  save();
  render();
}

// ---------------- Inicialización de UI ----------------
function wireToggleGroup(id, configKey) {
  const group = document.getElementById(id);
  group.querySelectorAll(".arbitro-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      group.querySelectorAll(".arbitro-toggle").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const value = btn.dataset.value;
      if (configKey === "peloteoMin") state.config.peloteoMin = Number(value);
      else state.config[configKey] = value;
      save();
    });
  });
}

function init() {
  load();
  if (state.match.matchWinner) state.screen = "acta";

  wireToggleGroup("g-modalidad", "modalidad");
  wireToggleGroup("g-tercerset", "tercerSet");
  wireToggleGroup("g-peloteo", "peloteoMin");

  document.getElementById("btnIniciarPartido").addEventListener("click", iniciarPartido);
  document.getElementById("btnPuntoA").addEventListener("click", () => addPoint("A"));
  document.getElementById("btnPuntoB").addEventListener("click", () => addPoint("B"));
  document.getElementById("btnDeshacer").addEventListener("click", undo);

  document.getElementById("alertaBolas").addEventListener("click", (e) => { e.currentTarget.hidden = true; });
  document.getElementById("alertaLado").addEventListener("click", (e) => { e.currentTarget.hidden = true; });

  const timersGrid = document.getElementById("timersGrid");
  TIMER_DEFS.forEach((def) => {
    const btn = document.createElement("button");
    btn.className = "arbitro-timer-btn";
    btn.textContent = typeof def.label === "function" ? def.label() : def.label;
    btn.addEventListener("click", () => startTimer(def));
    btn._def = def;
    timersGrid.appendChild(btn);
  });
  document.getElementById("btnTimerPausa").addEventListener("click", () => {
    if (!timer) return;
    timer.paused = !timer.paused;
    document.getElementById("btnTimerPausa").textContent = timer.paused ? "Reanudar" : "Pausar";
  });
  document.getElementById("btnTimerCancelar").addEventListener("click", stopTimer);

  document.querySelectorAll("[data-tipo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tipo = btn.dataset.tipo;
      pedirEquipo((equipo) => {
        if (tipo === "Descalificación" && !confirm(`¿Confirmas descalificar a ${nombreEquipo(equipo)}? Esto termina el partido.`)) return;
        addIncident(tipo, equipo);
      });
    });
  });

  document.getElementById("btnTerminarPartido").addEventListener("click", () => {
    if (!state.match.matchWinner && !confirm("El marcador no muestra un partido terminado. ¿Finalizar igual (retiro / w.o. / suspendido)?")) return;
    if (!state.match.horaFin) state.match.horaFin = Date.now();
    state.screen = "acta";
    save();
    render();
  });

  document.getElementById("btnVolverPartido").addEventListener("click", () => {
    state.screen = "partido";
    render();
  });
  document.getElementById("btnExportarPdf").addEventListener("click", () => window.print());
  document.getElementById("btnExportarWhatsapp").addEventListener("click", () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(actaTexto())}`, "_blank");
  });
  document.getElementById("btnNuevoPartido").addEventListener("click", () => {
    if (!confirm("¿Empezar un partido nuevo? Se perderá el marcador actual.")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = estadoInicial();
    stopTimer();
    document.getElementById("alertaBolas").hidden = true;
    document.getElementById("alertaLado").hidden = true;
    render();
  });

  render();
  setupPwa();
}

// ---------------- PWA: service worker + instalación ----------------
function setupPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw-arbitro.js").catch(() => {});
  }

  const badge = document.getElementById("modoOfflineBadge");
  function actualizarOffline() { badge.hidden = navigator.onLine; }
  window.addEventListener("online", actualizarOffline);
  window.addEventListener("offline", actualizarOffline);
  actualizarOffline();

  let deferredPrompt = null;
  const btnInstall = document.getElementById("btnInstall");
  const installHint = document.getElementById("installHint");
  const yaInstalada = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!yaInstalada) btnInstall.hidden = false;
  });
  btnInstall.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btnInstall.hidden = true;
  });
  setTimeout(() => {
    if (!yaInstalada && !deferredPrompt) installHint.hidden = false;
  }, 2500);
}

document.addEventListener("DOMContentLoaded", init);
