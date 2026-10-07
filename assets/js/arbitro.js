// Árbitro de pádel — app standalone. Funciona 100% local/offline sin Firebase;
// si el profesor está logueado y hay internet, sincroniza opcionalmente el
// partido a Firestore (colección "arbitrajes") para marcador en vivo y multipista.

import {
  LABELS, CHECKLIST_ITEMS, INTERRUPTION_TYPES,
  nombreEquipo, otro, labelsDePuntos, formatMMSS
} from "./arbitro-common.js?v=1";

// Firebase se carga de forma diferida (import dinámico) y nunca de forma
// estática: si no hay internet o falla la red, el resto del árbitro (marcador,
// timers, checklist, incidencias) tiene que seguir funcionando igual, 100%
// local — ese es el punto de que esto sea una PWA offline.
let fb = null;
async function cargarFirebase() {
  try {
    fb = await import("./firebase-app.js?v=12");
  } catch (e) {
    fb = null;
  }
}

const STORAGE_KEY = "arbitro_partido_v1";
const BALL_CHANGE_FIRST = 9;
const BALL_CHANGE_EVERY = 9;

const TIMER_DEFS = [
  { id: "peloteo", label: () => `Peloteo previo (${state.config.peloteoMin} min)`, seconds: () => state.config.peloteoMin * 60 },
  { id: "entrepuntos", label: "Entre puntos", seconds: 20 },
  { id: "cambiolado", label: "Cambio de lado (fin de juego)", seconds: 90 },
  { id: "descansoset", label: "Descanso entre sets", seconds: 120 },
  { id: "tiebreaklado", label: "Cambio de lado en tie-break", seconds: 20 },
  { id: "medico", label: "Atención médica / recuperación", seconds: 300 }
];

const PALABRAS_PUNTO = { "0": "cero", "15": "quince", "30": "treinta", "40": "cuarenta" };

function estadoInicial() {
  return {
    screen: "setup",
    vozActiva: false,
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
      horaFin: null,
      ultimoEvento: "",
      liveId: null,
      interrupcionActiva: null,
      interrupciones: [],
      log: []
    },
    incidents: [],
    history: []
  };
}

let state = estadoInicial();
let timer = null;
let authUser = null;

// ---------------- Persistencia local ----------------
function save() {
  try {
    const { history, ...resto } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resto));
  } catch (e) { /* almacenamiento no disponible */ }
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
    if (state.history.length > 80) state.history.shift();
  } catch (e) { /* sin undo si falla */ }
}

function undo() {
  if (!state.history.length) return;
  const snap = JSON.parse(state.history.pop());
  state.match = snap.match;
  state.incidents = snap.incidents;
  save();
  syncLive();
  render();
}

// ---------------- Firebase: sync opcional del partido en vivo ----------------
function firebaseListo() { return !!fb && !fb.CONFIG_IS_PLACEHOLDER; }

function snapshotParaFirestore() {
  const { history, ...resto } = state;
  return {
    config: resto.config,
    match: resto.match,
    incidents: resto.incidents,
    estado: resto.match.matchWinner ? "finalizado" : (resto.match.interrupcionActiva ? "interrumpido" : "en_curso"),
    creadoPor: authUser ? authUser.uid : null,
    actualizadoEn: fb.serverTimestamp()
  };
}

let syncPendiente = false;
function syncLive() {
  if (!state.match.liveId || !firebaseListo()) return;
  if (syncPendiente) return;
  syncPendiente = true;
  setTimeout(async () => {
    syncPendiente = false;
    try {
      await fb.setDoc(fb.doc(fb.db, "arbitrajes", state.match.liveId), snapshotParaFirestore());
    } catch (e) { /* sin internet: el partido sigue funcionando local */ }
  }, 300);
}

async function iniciarCompartirEnVivo() {
  if (!authUser || !firebaseListo()) return;
  try {
    const ref = await fb.addDoc(fb.collection(fb.db, "arbitrajes"), snapshotParaFirestore());
    state.match.liveId = ref.id;
    save();
    render();
  } catch (e) { /* si falla, el partido sigue 100% local */ }
}

async function cargarAlumnosParaAutocompletar() {
  if (!authUser || !firebaseListo()) return;
  try {
    const snap = await fb.getDocs(fb.query(fb.collection(fb.db, "usuarios"), fb.where("rol", "==", "alumno")));
    const datalist = document.getElementById("listaAlumnos");
    datalist.innerHTML = "";
    snap.forEach((d) => {
      const nombre = d.data().nombre;
      if (!nombre) return;
      const opt = document.createElement("option");
      opt.value = nombre;
      datalist.appendChild(opt);
    });
  } catch (e) { /* sin autocompletar si falla */ }
}

// ---------------- Helpers de equipo ----------------
function nomEq(team) { return nombreEquipo(state.config, team); }
function inc(obj, team, by = 1) { if (team === "A") obj.a += by; else obj.b += by; }

// ---------------- Historial punto a punto ----------------
function addLog(tipo, texto, extra = {}) {
  state.match.log.push({ ts: Date.now(), tipo, texto, ...extra });
}

// ---------------- Voz ----------------
function hablar(texto) {
  if (!state.vozActiva || !texto) return;
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-PE";
    u.rate = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) { /* voz no disponible */ }
}

// ---------------- Motor de puntuación ----------------
function toggleServidor() { state.match.servidor = otro(state.match.servidor); }

function bumpBallChange() {
  const m = state.match;
  m.totalGamesForBallChange++;
  if (m.totalGamesForBallChange >= m.nextBallChangeAt) {
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
  m.ultimoEvento = `Juego, pareja ${team}`;
  addLog("juego", `Juego para ${nomEq(team)} (${m.currentSet.a}-${m.currentSet.b})`, { equipo: team });
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
  const ultimo = m.sets[m.sets.length - 1];
  addLog("set", `Set para ${nomEq(winner)}: ${ultimo.a}-${ultimo.b}${tiebreakScore ? ` (${tiebreakScore})` : ""}`, { equipo: winner });
  if (setsA >= 2 || setsB >= 2) {
    m.matchWinner = setsA >= 2 ? "A" : "B";
    m.horaFin = Date.now();
    m.ultimoEvento = `Partido para ${nomEq(m.matchWinner)}`;
    addLog("partido", `Gana el partido: ${nomEq(m.matchWinner)}`, { equipo: m.matchWinner });
    return;
  }
  m.ultimoEvento = `Set para pareja ${winner}`;
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
  if (g.a >= 4 && g.a - g.b >= 2) { winGame("A"); return; }
  if (g.b >= 4 && g.b - g.a >= 2) { winGame("B"); return; }
  const [la, lb] = labelsDePuntos(g.a, g.b);
  if (la === "40" && lb === "40") m.ultimoEvento = state.config.modalidad === "oro" ? "Punto de oro" : "Iguales";
  else if (la === "VENT.") m.ultimoEvento = "Ventaja, pareja A";
  else if (lb === "VENT.") m.ultimoEvento = "Ventaja, pareja B";
  else m.ultimoEvento = `${PALABRAS_PUNTO[la]} - ${PALABRAS_PUNTO[lb]}`;
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
  } else {
    m.ultimoEvento = `${g.a} a ${g.b}`;
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
    m.ultimoEvento = `Partido para ${nomEq(winner)}`;
    addLog("partido", `Gana el partido (super tie-break): ${nomEq(winner)} ${g.a}-${g.b}`, { equipo: winner });
  } else {
    m.ultimoEvento = `${g.a} a ${g.b}`;
  }
}

function addPoint(team) {
  const m = state.match;
  if (m.matchWinner || m.interrupcionActiva) return;
  pushHistory();
  if (m.isSuperTiebreakSet) addSuperTiebreakPoint(team);
  else if (m.inTiebreak) addTiebreakPoint(team);
  else addGamePoint(team);
  addLog("punto", `Punto ${nomEq(team)} → ${marcadorActual()}`, { equipo: team });
  save();
  syncLive();
  render();
  hablar(m.ultimoEvento);
}

// ---------------- Incidencias (código de conducta) ----------------
function marcadorActual() {
  const m = state.match;
  const sets = m.sets.map((s) => `${s.a}-${s.b}${s.tiebreak ? `(${s.tiebreak})` : ""}`).join(" · ");
  const vivo = m.isSuperTiebreakSet || m.inTiebreak
    ? `${m.currentGame.a}-${m.currentGame.b}`
    : `${m.currentSet.a}-${m.currentSet.b} (${labelsDePuntos(m.currentGame.a, m.currentGame.b).join("-")})`;
  return [sets, vivo].filter(Boolean).join(" | ");
}

function pedirEquipo(callback) {
  document.querySelectorAll(".arbitro-equipo-chooser").forEach((el) => el.remove());
  const row = document.createElement("div");
  row.className = "arbitro-incident-buttons arbitro-equipo-chooser";
  row.style.marginTop = "-4px";
  const bA = document.createElement("button");
  bA.className = "btn btn-outline btn-small";
  bA.textContent = nomEq("A");
  const bB = document.createElement("button");
  bB.className = "btn btn-outline btn-small";
  bB.textContent = nomEq("B");
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
  state.incidents.push({ ts: Date.now(), tipo, equipo: equipoSancionado, marcador: marcadorActual() });
  addLog("incidencia", `${tipo} — ${nomEq(equipoSancionado)}`, { equipo: equipoSancionado });
  const beneficiado = otro(equipoSancionado);
  const m = state.match;
  if (tipo === "Point Penalty") {
    if (m.isSuperTiebreakSet) addSuperTiebreakPoint(beneficiado);
    else if (m.inTiebreak) addTiebreakPoint(beneficiado);
    else addGamePoint(beneficiado);
  } else if (tipo === "Game Penalty") {
    if (!m.isSuperTiebreakSet && !m.inTiebreak) winGame(beneficiado);
  } else if (tipo === "Descalificación") {
    m.matchWinner = beneficiado;
    m.horaFin = Date.now();
    addLog("partido", `Partido terminado por descalificación: gana ${nomEq(beneficiado)}`, { equipo: beneficiado });
  }
  save();
  syncLive();
  render();
}

// ---------------- Interrupciones ----------------
function iniciarInterrupcion(tipo) {
  const nota = (prompt(`Detalle de la interrupción (opcional) — ${tipo}`) || "").trim();
  pushHistory();
  state.match.interrupcionActiva = { tipo, nota, inicio: Date.now() };
  addLog("interrupcion", `Interrupción iniciada: ${tipo}${nota ? ` — ${nota}` : ""}`);
  save();
  syncLive();
  render();
}

function reanudarPartido() {
  const ia = state.match.interrupcionActiva;
  if (!ia) return;
  pushHistory();
  const fin = Date.now();
  const duracionSeg = Math.round((fin - ia.inicio) / 1000);
  state.match.interrupciones.push({ ...ia, fin, duracionSeg });
  state.match.interrupcionActiva = null;
  addLog("interrupcion", `Partido reanudado (interrupción de ${formatMMSS(duracionSeg)})`);
  save();
  syncLive();
  render();
}

// ---------------- Timers ----------------
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

function renderPartido() {
  const c = state.config;
  const m = state.match;
  document.getElementById("nombreEquipoA").textContent = nomEq("A");
  document.getElementById("nombreEquipoB").textContent = nomEq("B");
  document.getElementById("metaInfo").textContent =
    [c.club, c.pista, c.pais].filter(Boolean).join(" · ") +
    (c.modalidad === "oro" ? " · Punto de oro" : " · Con ventajas") +
    (c.tercerSet === "super" ? " · 3er set: super tie-break a 10" : "");

  for (const team of ["A", "B"]) {
    for (let col = 0; col < 3; col++) {
      const cell = document.getElementById(`set${team}${col + 1}`);
      const completed = m.sets[col];
      if (completed) cell.textContent = team === "A" ? completed.a : completed.b;
      else if (col === m.sets.length && !m.matchWinner) cell.textContent = team === "A" ? m.currentSet.a : m.currentSet.b;
      else cell.textContent = "–";
    }
  }

  const [la, lb] = m.isSuperTiebreakSet || m.inTiebreak
    ? [m.currentGame.a, m.currentGame.b]
    : labelsDePuntos(m.currentGame.a, m.currentGame.b);
  document.getElementById("ptsA").textContent = la;
  document.getElementById("ptsB").textContent = lb;

  document.getElementById("rowA").classList.toggle("sirve", m.servidor === "A" && !m.matchWinner);
  document.getElementById("rowB").classList.toggle("sirve", m.servidor === "B" && !m.matchWinner);

  const estado = document.getElementById("estadoJuego");
  if (m.matchWinner) estado.textContent = `🏆 Gana el partido: ${nomEq(m.matchWinner)}`;
  else if (m.isSuperTiebreakSet) estado.textContent = `Super tie-break a 10 (gana por 2) · Saca ${nomEq(m.servidor)}`;
  else if (m.inTiebreak) estado.textContent = `Tie-break a 7 (gana por 2) · Saca ${nomEq(m.servidor)}`;
  else if (m.currentGame.a >= 3 && m.currentGame.b >= 3 && m.currentGame.a === m.currentGame.b) estado.textContent = c.modalidad === "oro" ? "40-40 · ¡Punto de oro! Define el próximo punto" : "40-40 · Iguales";
  else estado.textContent = `Saca ${nomEq(m.servidor)}`;

  document.getElementById("btnPuntoA").disabled = !!m.matchWinner || !!m.interrupcionActiva;
  document.getElementById("btnPuntoB").disabled = !!m.matchWinner || !!m.interrupcionActiva;

  document.getElementById("interrupcionBanner").hidden = !m.interrupcionActiva;
  if (m.interrupcionActiva) {
    document.getElementById("interrupcionTipo").textContent = m.interrupcionActiva.tipo;
  }

  renderIncidencias();
  renderInterrupciones();
  renderHistorial();
  renderShareBox();
}

function renderIncidencias() {
  const incLog = document.getElementById("incidentLog");
  const incEmpty = document.getElementById("incidentEmpty");
  incLog.innerHTML = "";
  incEmpty.hidden = state.incidents.length > 0;
  state.incidents.slice().reverse().forEach((inc) => {
    const li = document.createElement("li");
    li.className = "arbitro-incident-item";
    const hora = new Date(inc.ts).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    li.innerHTML = `<span><span class="inc-tipo">${inc.tipo}</span> — ${nomEq(inc.equipo)}<br><small>${inc.marcador}</small></span><span>${hora}</span>`;
    incLog.appendChild(li);
  });
}

function renderInterrupciones() {
  const log = document.getElementById("interrupcionLog");
  const empty = document.getElementById("interrupcionEmpty");
  const lista = state.match.interrupciones;
  log.innerHTML = "";
  empty.hidden = lista.length > 0;
  lista.slice().reverse().forEach((it) => {
    const li = document.createElement("li");
    li.className = "arbitro-incident-item";
    const hora = new Date(it.inicio).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    li.innerHTML = `<span><span class="inc-tipo">${it.tipo}</span>${it.nota ? ` — ${it.nota}` : ""}<br><small>Duración: ${formatMMSS(it.duracionSeg)}</small></span><span>${hora}</span>`;
    log.appendChild(li);
  });
}

function renderHistorial() {
  const log = document.getElementById("historialLog");
  log.innerHTML = "";
  state.match.log.slice().reverse().slice(0, 300).forEach((e) => {
    const li = document.createElement("li");
    li.className = "arbitro-incident-item";
    const hora = new Date(e.ts).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    li.innerHTML = `<span>${e.texto}</span><span>${hora}</span>`;
    log.appendChild(li);
  });
}

function renderShareBox() {
  const box = document.getElementById("shareBox");
  if (!state.match.liveId) { box.hidden = true; return; }
  box.hidden = false;
  const url = `${location.origin}${location.pathname.replace(/arbitro\.html$/, "")}arbitro-vivo.html?id=${state.match.liveId}`;
  document.getElementById("shareLink").value = url;
}

function renderActa() {
  const c = state.config;
  const m = state.match;
  const setsRow = [0, 1, 2].map((i) => {
    const s = m.sets[i];
    if (!s) return "<td>–</td>";
    return `<td>${s.a}-${s.b}${s.tiebreak ? ` (${s.tiebreak})` : ""}${s.super ? " ST" : ""}</td>`;
  }).join("");

  const ganador = m.matchWinner ? `${nomEq(m.matchWinner)} gana el partido` : "Partido no finalizado por marcador (retiro / w.o. / suspendido)";
  const duracionMin = m.horaInicio && m.horaFin ? Math.round((m.horaFin - m.horaInicio) / 60000) : null;

  const puntosLog = m.log.filter((e) => e.tipo === "punto");
  const puntosA = puntosLog.filter((e) => e.equipo === "A").length;
  const puntosB = puntosLog.filter((e) => e.equipo === "B").length;
  const juegosA = m.sets.reduce((acc, s) => acc + s.a, 0) + m.currentSet.a;
  const juegosB = m.sets.reduce((acc, s) => acc + s.b, 0) + m.currentSet.b;
  const duracionInterrupciones = m.interrupciones.reduce((acc, it) => acc + it.duracionSeg, 0);

  const statsHtml = `
    <table>
      <thead><tr><th></th><th>${nomEq("A")}</th><th>${nomEq("B")}</th></tr></thead>
      <tbody>
        <tr><td style="text-align:left">Puntos jugados</td><td>${puntosA}</td><td>${puntosB}</td></tr>
        <tr><td style="text-align:left">Juegos ganados</td><td>${juegosA}</td><td>${juegosB}</td></tr>
      </tbody>
    </table>
    <p style="font-size:0.88rem;color:var(--ink-soft)">
      Duración del partido: ${duracionMin !== null ? duracionMin + " min" : "—"} ·
      Incidencias registradas: ${state.incidents.length} ·
      Interrupciones: ${m.interrupciones.length} (${formatMMSS(duracionInterrupciones)} en total)
    </p>`;

  const incidentesHtml = state.incidents.length
    ? `<div class="arbitro-table-scroll"><table><thead><tr><th>Hora</th><th>Tipo</th><th>Pareja</th><th>Marcador</th></tr></thead><tbody>
        ${state.incidents.map((i) => `<tr><td>${new Date(i.ts).toLocaleTimeString("es-PE")}</td><td>${i.tipo}</td><td>${nomEq(i.equipo)}</td><td>${i.marcador}</td></tr>`).join("")}
       </tbody></table></div>`
    : "<p>Sin incidencias registradas.</p>";

  const interrupcionesHtml = m.interrupciones.length
    ? `<div class="arbitro-table-scroll"><table><thead><tr><th>Tipo</th><th>Inicio</th><th>Fin</th><th>Duración</th><th>Nota</th></tr></thead><tbody>
        ${m.interrupciones.map((it) => `<tr><td>${it.tipo}</td><td>${new Date(it.inicio).toLocaleTimeString("es-PE")}</td><td>${new Date(it.fin).toLocaleTimeString("es-PE")}</td><td>${formatMMSS(it.duracionSeg)}</td><td>${it.nota || "—"}</td></tr>`).join("")}
       </tbody></table></div>`
    : "<p>Sin interrupciones registradas.</p>";

  document.getElementById("actaContenido").innerHTML = `
    <h2>Acta de partido</h2>
    <p class="acta-meta">
      ${c.club ? c.club + " · " : ""}${c.pista ? "Pista " + c.pista + " · " : ""}${c.pais}<br>
      ${m.horaInicio ? new Date(m.horaInicio).toLocaleString("es-PE") : ""}
    </p>
    <table>
      <thead><tr><th>Pareja</th><th>Set 1</th><th>Set 2</th><th>Set 3</th></tr></thead>
      <tbody>
        <tr><td style="text-align:left;font-weight:700">${nomEq("A")}</td>${[0, 1, 2].map((i) => m.sets[i] ? `<td>${m.sets[i].a}</td>` : "<td>–</td>").join("")}</tr>
        <tr><td style="text-align:left;font-weight:700">${nomEq("B")}</td>${[0, 1, 2].map((i) => m.sets[i] ? `<td>${m.sets[i].b}</td>` : "<td>–</td>").join("")}</tr>
      </tbody>
    </table>
    <p class="acta-resultado">${ganador}</p>
    <h3>Estadísticas</h3>
    ${statsHtml}
    <h3>Incidencias / código de conducta</h3>
    ${incidentesHtml}
    <h3>Interrupciones</h3>
    ${interrupcionesHtml}
    <h3>Detalle de sets</h3>
    <table><thead><tr><th>Set 1</th><th>Set 2</th><th>Set 3</th></tr></thead><tbody><tr>${setsRow}</tr></tbody></table>
  `;
}

function actaTexto() {
  const c = state.config;
  const m = state.match;
  const setsTxt = m.sets.map((s) => `${s.a}-${s.b}${s.tiebreak ? `(${s.tiebreak})` : ""}`).join(", ") || "—";
  const ganador = m.matchWinner ? `${nomEq(m.matchWinner)} gana el partido` : "Partido no finalizado";
  let txt = `🎾 ACTA DE PARTIDO — academiadepadel.pe\n`;
  txt += `${nomEq("A")} vs ${nomEq("B")}\n`;
  if (c.club) txt += `Club: ${c.club}\n`;
  if (c.pista) txt += `Pista: ${c.pista}\n`;
  txt += `Sets: ${setsTxt}\n`;
  txt += `Resultado: ${ganador}\n`;
  if (state.incidents.length) {
    txt += `\nIncidencias:\n`;
    state.incidents.forEach((i) => { txt += `• ${i.tipo} — ${nomEq(i.equipo)} (${i.marcador})\n`; });
  }
  if (m.interrupciones.length) {
    txt += `\nInterrupciones:\n`;
    m.interrupciones.forEach((it) => { txt += `• ${it.tipo} (${formatMMSS(it.duracionSeg)})${it.nota ? ` — ${it.nota}` : ""}\n`; });
  }
  return txt;
}

// ---------------- Tarjeta de resultado (imagen) ----------------
function generarTarjetaResultado() {
  const c = state.config;
  const m = state.match;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#14495a";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "#c8e94c";
  ctx.fillRect(0, 0, 1080, 14);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 36px sans-serif";
  ctx.fillText("academiadepadel.pe", 60, 90);
  ctx.font = "800 44px sans-serif";
  ctx.fillText("Acta de partido", 60, 160);

  ctx.font = "600 34px sans-serif";
  ctx.fillText(nomEq("A"), 60, 320);
  ctx.fillText(nomEq("B"), 60, 420);

  const setsTxt = m.sets.map((s) => `${s.a}-${s.b}`).join("   ");
  ctx.font = "800 60px sans-serif";
  ctx.fillStyle = "#c8e94c";
  ctx.fillText(setsTxt || "—", 60, 520);

  ctx.font = "700 38px sans-serif";
  ctx.fillStyle = "#ffffff";
  const ganadorTxt = m.matchWinner ? `🏆 Gana: ${nomEq(m.matchWinner)}` : "Partido no finalizado";
  wrapText(ctx, ganadorTxt, 60, 620, 960, 46);

  ctx.font = "500 28px sans-serif";
  ctx.fillStyle = "#cfe3ea";
  const meta = [c.club, c.pista ? `Pista ${c.pista}` : "", c.pais].filter(Boolean).join(" · ");
  ctx.fillText(meta, 60, 980);

  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = w + " ";
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

async function exportarTarjeta() {
  const canvas = generarTarjetaResultado();
  canvas.toBlob(async (blob) => {
    const nombreArchivo = "acta-academiadepadel.png";
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], nombreArchivo, { type: "image/png" })] })) {
      try {
        await navigator.share({ files: [new File([blob], nombreArchivo, { type: "image/png" })], title: "Acta de partido" });
        return;
      } catch (e) { /* si cancela o falla, caemos a la descarga */ }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombreArchivo;
    a.click();
  }, "image/png");
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
  addLog("inicio", `Partido iniciado: ${nomEq("A")} vs ${nomEq("B")}`);
  state.screen = "partido";
  save();
  render();

  const compartir = document.getElementById("chkCompartir").checked && !document.getElementById("cardCompartir").hidden;
  if (compartir) iniciarCompartirEnVivo();
}

// ---------------- Modo pantalla grande ----------------
function toggleModoTv() {
  const on = document.body.classList.toggle("modo-tv");
  document.getElementById("btnSalirTv").hidden = !on;
  if (on && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (!on && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
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

  document.getElementById("btnVoz").addEventListener("click", () => {
    state.vozActiva = !state.vozActiva;
    document.getElementById("btnVoz").textContent = `🔊 Narración: ${state.vozActiva ? "ON" : "OFF"}`;
    save();
  });
  document.getElementById("btnPantallaGrande").addEventListener("click", toggleModoTv);
  document.getElementById("btnSalirTv").addEventListener("click", toggleModoTv);

  const timersGrid = document.getElementById("timersGrid");
  TIMER_DEFS.forEach((def) => {
    const btn = document.createElement("button");
    btn.className = "arbitro-timer-btn";
    btn.textContent = typeof def.label === "function" ? def.label() : def.label;
    btn.addEventListener("click", () => startTimer(def));
    timersGrid.appendChild(btn);
  });
  document.getElementById("btnTimerPausa").addEventListener("click", () => {
    if (!timer) return;
    timer.paused = !timer.paused;
    document.getElementById("btnTimerPausa").textContent = timer.paused ? "Reanudar" : "Pausar";
  });
  document.getElementById("btnTimerCancelar").addEventListener("click", stopTimer);

  document.querySelectorAll("#pantallaPartido [data-tipo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tipo = btn.dataset.tipo;
      pedirEquipo((equipo) => {
        if (tipo === "Descalificación" && !confirm(`¿Confirmas descalificar a ${nomEq(equipo)}? Esto termina el partido.`)) return;
        addIncident(tipo, equipo);
      });
    });
  });

  const interrupcionBotones = document.getElementById("interrupcionBotones");
  INTERRUPTION_TYPES.forEach((tipo) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline btn-small";
    btn.textContent = tipo;
    btn.addEventListener("click", () => {
      if (state.match.interrupcionActiva) { alert("Ya hay una interrupción activa. Reanuda el partido antes de registrar otra."); return; }
      iniciarInterrupcion(tipo);
    });
    interrupcionBotones.appendChild(btn);
  });
  document.getElementById("btnReanudar").addEventListener("click", reanudarPartido);

  document.getElementById("btnCopiarLink").addEventListener("click", async () => {
    const input = document.getElementById("shareLink");
    input.select();
    try { await navigator.clipboard.writeText(input.value); } catch (e) { document.execCommand("copy"); }
  });
  document.getElementById("btnCompartirLinkWhatsapp").addEventListener("click", () => {
    const url = document.getElementById("shareLink").value;
    window.open(`https://wa.me/?text=${encodeURIComponent(`🎾 Sigue el partido en vivo: ${url}`)}`, "_blank");
  });

  document.getElementById("btnTerminarPartido").addEventListener("click", () => {
    if (!state.match.matchWinner && !confirm("El marcador no muestra un partido terminado. ¿Finalizar igual (retiro / w.o. / suspendido)?")) return;
    if (state.match.interrupcionActiva) reanudarPartido();
    if (!state.match.horaFin) state.match.horaFin = Date.now();
    state.screen = "acta";
    save();
    syncLive();
    render();
  });

  document.getElementById("btnVolverPartido").addEventListener("click", () => { state.screen = "partido"; render(); });
  document.getElementById("btnExportarPdf").addEventListener("click", () => window.print());
  document.getElementById("btnExportarWhatsapp").addEventListener("click", () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(actaTexto())}`, "_blank");
  });
  document.getElementById("btnTarjeta").addEventListener("click", exportarTarjeta);
  document.getElementById("btnNuevoPartido").addEventListener("click", () => {
    if (!confirm("¿Empezar un partido nuevo? Se perderá el marcador actual.")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = estadoInicial();
    stopTimer();
    document.body.classList.remove("modo-tv");
    document.getElementById("alertaBolas").hidden = true;
    document.getElementById("alertaLado").hidden = true;
    render();
  });

  render();
  setupPwa();
  setupAuth();
}

// ---------------- Sesión (opcional, solo habilita Firebase) ----------------
async function setupAuth() {
  const bar = document.getElementById("authStatus");
  await cargarFirebase();
  if (!firebaseListo()) {
    bar.textContent = "Marcador en vivo y multipista no disponibles ahora mismo (sin conexión o Firebase no configurado) — el árbitro funciona igual, 100% local.";
    return;
  }
  fb.onAuthStateChanged(fb.auth, (user) => {
    authUser = user;
    if (user) {
      bar.textContent = `Conectado como ${user.email} — el marcador en vivo y la multipista están disponibles.`;
      document.getElementById("cardCompartir").hidden = false;
      cargarAlumnosParaAutocompletar();
    } else {
      bar.innerHTML = `No has iniciado sesión — el árbitro funciona igual, 100% local. Para marcador en vivo y multipista, <a href="login.html">inicia sesión</a>.`;
      document.getElementById("cardCompartir").hidden = true;
    }
  });
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
