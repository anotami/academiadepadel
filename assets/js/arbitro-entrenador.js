// Vista de entrenador: lectura en vivo del partido que lleva el árbitro +
// registro propio de feedback táctico (golpe, resultado, zona, nota) por
// punto, pensado para que cada pareja tenga su propia ventana/pestaña.
// No requiere login — cualquiera con el link + código del partido puede
// entrar, igual que el marcador en vivo (arbitro-vivo.html).
import {
  nombreEquipo, nombreJugador, labelsDePuntos, tiempoRelativo,
  SHOT_TYPES, POINT_OUTCOMES, COURT_ZONES, outcomeInfo
} from "./arbitro-common.js?v=4";

const params = new URLSearchParams(location.search);
let matchId = params.get("id") || "";
let equipo = (params.get("equipo") || "A").toUpperCase() === "B" ? "B" : "A";

let matchData = null;
let feedbackList = [];
let filtroSet = "todos"; // "todos" | 0 | 1 | 2
let seleccion = { jugador: null, golpe: null, resultado: null, zona: null };
let db, doc, onSnapshot, collection, addDoc, deleteDoc, query, orderBy;
let jugadoresConstruidos = false;

function otro(t) { return t === "A" ? "B" : "A"; }

function $(id) { return document.getElementById(id); }

function mostrarError() {
  $("entCargando").hidden = true;
  $("entContenido").hidden = true;
  $("entError").hidden = false;
}

// ---------------- Chips reutilizables ----------------
function crearChip(label, value, tipo) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "entrenador-chip" + (tipo ? ` tipo-${tipo}` : "");
  btn.textContent = label;
  btn.dataset.value = value;
  return btn;
}

function seleccionarEnGrupo(container, btn) {
  container.querySelectorAll(".entrenador-chip, .entrenador-zona-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function construirFormularioEstatico() {
  // Golpes
  const golpes = $("entGolpes");
  golpes.innerHTML = "";
  SHOT_TYPES.forEach((g) => {
    const btn = crearChip(g, g);
    btn.addEventListener("click", () => { seleccion.golpe = g; seleccionarEnGrupo(golpes, btn); });
    golpes.appendChild(btn);
  });

  // Resultados
  const resultados = $("entResultados");
  resultados.innerHTML = "";
  POINT_OUTCOMES.forEach((o) => {
    const btn = crearChip(o.label, o.id, o.tipo);
    btn.addEventListener("click", () => { seleccion.resultado = o.id; seleccionarEnGrupo(resultados, btn); });
    resultados.appendChild(btn);
  });

  // Zonas (entrada)
  const zonas = $("entZonas");
  zonas.innerHTML = "";
  COURT_ZONES.forEach((z) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "entrenador-zona-btn";
    btn.textContent = z.label;
    btn.dataset.value = z.id;
    btn.addEventListener("click", () => { seleccion.zona = z.id; seleccionarEnGrupo(zonas, btn); });
    zonas.appendChild(btn);
  });

  // Pestañas de set (filtro de stats/historial)
  const tabs = $("entSetTabs");
  tabs.innerHTML = "";
  [["todos", "Todos"], [0, "Set 1"], [1, "Set 2"], [2, "Set 3"]].forEach(([valor, label]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "entrenador-chip" + (valor === "todos" ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      filtroSet = valor;
      tabs.querySelectorAll(".entrenador-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderFeedback();
    });
    tabs.appendChild(btn);
  });
}

function construirJugadores(config) {
  if (jugadoresConstruidos) return;
  const cont = $("entJugadores");
  cont.innerHTML = "";
  [1, 2].forEach((num) => {
    const nombre = nombreJugador(num === 1 ? config[`${equipo.toLowerCase()}1`] : config[`${equipo.toLowerCase()}2`], `Jugador ${equipo}${num}`);
    const btn = crearChip(nombre, num);
    btn.addEventListener("click", () => { seleccion.jugador = num; seleccionarEnGrupo(cont, btn); });
    cont.appendChild(btn);
  });
  jugadoresConstruidos = true;
}

function limpiarSeleccion() {
  seleccion = { jugador: null, golpe: null, resultado: null, zona: null };
  document.querySelectorAll("#entJugadores .active, #entGolpes .active, #entResultados .active, #entZonas .active")
    .forEach((b) => b.classList.remove("active"));
  $("entNota").value = "";
  $("entTagMsg").textContent = "";
  $("entTagMsg").className = "form-msg";
}

// ---------------- Render del partido (datos del árbitro) ----------------
function renderMatch(data) {
  matchData = data;
  $("entCargando").hidden = true;
  $("entError").hidden = true;
  $("entContenido").hidden = false;

  const c = data.config;
  const m = data.match;
  construirJugadores(c);

  const rival = otro(equipo);
  const nombrePropio = nombreEquipo(c, equipo);
  const nombreRival = nombreEquipo(c, rival);
  $("entTitulo").textContent = `🧑‍🏫 Entrenador — ${nombrePropio}`;
  $("entMeta").textContent = [c.club, c.pista ? `Pista ${c.pista}` : "", c.pais].filter(Boolean).join(" · ");
  $("nombrePropio").textContent = nombrePropio;
  $("nombreRival").textContent = nombreRival;

  const badge = $("entEstadoBadge");
  if (data.estado === "finalizado") { badge.textContent = "Finalizado"; badge.className = "badge badge-confirmada"; }
  else if (data.estado === "interrumpido") { badge.textContent = "Interrumpido"; badge.className = "badge badge-pendiente"; }
  else { badge.textContent = "En curso"; badge.className = "badge badge-confirmada"; }

  const get = (team, col) => {
    const completed = m.sets[col];
    if (completed) return team === "A" ? completed.a : completed.b;
    if (col === m.sets.length && !m.matchWinner) return team === "A" ? m.currentSet.a : m.currentSet.b;
    return "–";
  };
  for (let col = 0; col < 3; col++) {
    $(`setP${col + 1}`).textContent = get(equipo, col);
    $(`setR${col + 1}`).textContent = get(rival, col);
  }
  const [la, lb] = m.isSuperTiebreakSet || m.inTiebreak ? [m.currentGame.a, m.currentGame.b] : labelsDePuntos(m.currentGame.a, m.currentGame.b);
  $("ptsP").textContent = equipo === "A" ? la : lb;
  $("ptsR").textContent = equipo === "A" ? lb : la;
  $("rowPropio").classList.toggle("sirve", m.servidor === equipo && !m.matchWinner);
  $("rowRival").classList.toggle("sirve", m.servidor === rival && !m.matchWinner);

  const estado = $("entEstadoJuego");
  if (m.matchWinner) estado.textContent = `🏆 Gana el partido: ${nombreEquipo(c, m.matchWinner)}`;
  else if (m.interrupcionActiva) estado.textContent = `⏸ Interrumpido: ${m.interrupcionActiva.tipo}`;
  else if (m.isSuperTiebreakSet) estado.textContent = "Super tie-break a 10";
  else if (m.inTiebreak) estado.textContent = "Tie-break a 7";
  else estado.textContent = `Saca ${nombreEquipo(c, m.servidor)}`;

  // Alertas: incidentes de conducta y demoras de la propia pareja, marcadas
  // por el árbitro — así el entrenador sabe si sus jugadores ya tienen
  // advertencias antes de que escale.
  const alertas = $("entAlertas");
  alertas.innerHTML = "";
  const incidentesPropios = (data.incidents || []).filter((i) => i.equipo === equipo);
  const demorasPropias = (m.demoras || []).filter((d) => d.equipo === equipo);
  [...incidentesPropios, ...demorasPropias].slice(-3).forEach((i) => {
    const div = document.createElement("div");
    div.className = "entrenador-alert";
    div.textContent = `⚠️ ${i.consecuencia}${i.categoria ? ` — ${i.categoria}` : ""} (marcador ${i.marcador})`;
    alertas.appendChild(div);
  });

  // Último punto registrado por el árbitro: contexto para taggear.
  const puntos = m.puntos || [];
  const ultimo = puntos.length ? puntos[puntos.length - 1] : null;
  const cont = $("entUltimoPunto");
  if (!ultimo) {
    cont.textContent = "Todavía no hay puntos jugados en este partido.";
  } else {
    const ganoPropio = ultimo.equipoGana === equipo;
    cont.innerHTML = `Último punto: ganó <strong>${ganoPropio ? nombrePropio : nombreRival}</strong> (${ultimo.equipoGana === "A" ? "Pareja A" : "Pareja B"}) → ${ultimo.marcador}<br><small>${tiempoRelativo(ultimo.ts)} · Set ${ultimo.setIdx + 1}</small>`;
  }

  renderFeedback();
}

// ---------------- Feedback táctico (lo que registra el entrenador) ----------------
function feedbackFiltrado() {
  if (filtroSet === "todos") return feedbackList;
  return feedbackList.filter((f) => f.setIdx === filtroSet);
}

function renderFeedback() {
  const lista = feedbackFiltrado();

  // Stats por jugador
  const grid = $("entStatsGrid");
  grid.innerHTML = "";
  [1, 2].forEach((num) => {
    const propios = lista.filter((f) => f.jugador === num);
    const card = document.createElement("div");
    card.className = "entrenador-player-card";
    const nombre = matchData ? nombreJugador(matchData.config[`${equipo.toLowerCase()}${num}`], `Jugador ${equipo}${num}`) : `Jugador ${num}`;
    const porOutcome = {};
    POINT_OUTCOMES.forEach((o) => { porOutcome[o.id] = propios.filter((f) => f.resultado === o.id).length; });
    const aFavor = porOutcome.winner + porOutcome.ace + porOutcome.rival_error;
    const enContra = porOutcome.ue + porOutcome.doble_falta;
    const efectividad = (aFavor + enContra) > 0 ? Math.round((aFavor / (aFavor + enContra)) * 100) : null;

    const filasPorGolpe = SHOT_TYPES
      .map((g) => {
        const deEsteGolpe = propios.filter((f) => f.golpe === g);
        if (!deEsteGolpe.length) return null;
        const favor = deEsteGolpe.filter((f) => ["winner", "ace", "rival_error"].includes(f.resultado)).length;
        const contra = deEsteGolpe.filter((f) => ["ue", "doble_falta"].includes(f.resultado)).length;
        return `<tr><td>${g}</td><td>${deEsteGolpe.length}</td><td>${favor}</td><td>${contra}</td></tr>`;
      })
      .filter(Boolean)
      .join("");

    card.innerHTML = `
      <h4>${nombre}</h4>
      <div class="entrenador-stat-row"><span>Puntos ganadores</span><strong>${porOutcome.winner}</strong></div>
      <div class="entrenador-stat-row"><span>Aces</span><strong>${porOutcome.ace}</strong></div>
      <div class="entrenador-stat-row"><span>Puntos por error del rival</span><strong>${porOutcome.rival_error}</strong></div>
      <div class="entrenador-stat-row"><span>Errores forzados</span><strong>${porOutcome.fe}</strong></div>
      <div class="entrenador-stat-row"><span>Errores no forzados</span><strong>${porOutcome.ue}</strong></div>
      <div class="entrenador-stat-row"><span>Dobles faltas</span><strong>${porOutcome.doble_falta}</strong></div>
      <div class="entrenador-stat-row"><span>% efectividad</span><strong>${efectividad === null ? "—" : efectividad + "%"}</strong></div>
      ${filasPorGolpe ? `<table class="entrenador-shot-table"><thead><tr><th>Golpe</th><th>Total</th><th>A favor</th><th>En contra</th></tr></thead><tbody>${filasPorGolpe}</tbody></table>` : ""}
    `;
    grid.appendChild(card);
  });

  // Heatmap simple de zonas
  const zonasStats = $("entZonasStats");
  zonasStats.innerHTML = "";
  COURT_ZONES.forEach((z) => {
    const n = lista.filter((f) => f.zona === z.id).length;
    const btn = document.createElement("div");
    btn.className = "entrenador-zona-btn readonly";
    btn.innerHTML = `${z.label}<span class="ez-conteo">${n || "–"}</span>`;
    zonasStats.appendChild(btn);
  });

  // Historial
  const historial = $("entHistorial");
  historial.innerHTML = "";
  $("entHistorialEmpty").hidden = lista.length > 0;
  lista.slice().reverse().forEach((f) => {
    const nombre = matchData ? nombreJugador(matchData.config[`${equipo.toLowerCase()}${f.jugador}`], `Jugador ${f.jugador}`) : `Jugador ${f.jugador}`;
    const info = outcomeInfo(f.resultado);
    const zona = COURT_ZONES.find((z) => z.id === f.zona);
    const row = document.createElement("div");
    row.className = "entrenador-feedback-item";
    row.innerHTML = `
      <span>
        <strong>${nombre}</strong> — ${f.golpe} — ${info ? info.label : f.resultado}${zona ? ` — ${zona.label}` : ""}
        ${f.nota ? `<br><em>${f.nota}</em>` : ""}
        <br><small>Set ${f.setIdx + 1} · ${f.marcador || ""} · ${tiempoRelativo(f.ts)}</small>
      </span>
      <button class="btn btn-outline btn-small" data-id="${f.id}">Borrar</button>
    `;
    row.querySelector("button").addEventListener("click", () => borrarFeedback(f.id));
    historial.appendChild(row);
  });
}

async function guardarTag() {
  const msg = $("entTagMsg");
  if (!seleccion.jugador || !seleccion.golpe || !seleccion.resultado) {
    msg.className = "form-msg error";
    msg.textContent = "Elige jugador, tipo de golpe y resultado antes de guardar.";
    return;
  }
  if (!matchId || !db) return;
  const m = matchData ? matchData.match : null;
  const puntos = m && m.puntos ? m.puntos : [];
  const ultimo = puntos.length ? puntos[puntos.length - 1] : null;
  const entrada = {
    equipo,
    jugador: seleccion.jugador,
    golpe: seleccion.golpe,
    resultado: seleccion.resultado,
    zona: seleccion.zona || null,
    nota: $("entNota").value.trim(),
    puntoIdx: ultimo ? ultimo.idx : null,
    setIdx: ultimo ? ultimo.setIdx : (m ? m.sets.length : 0),
    marcador: ultimo ? ultimo.marcador : "",
    ts: Date.now()
  };
  try {
    msg.className = "form-msg";
    msg.textContent = "Guardando…";
    await addDoc(collection(db, "arbitrajes", matchId, "feedback"), entrada);
    msg.className = "form-msg ok";
    msg.textContent = "✓ Guardado";
    limpiarSeleccion();
  } catch (e) {
    msg.className = "form-msg error";
    msg.textContent = "No se pudo guardar (revisa tu conexión).";
  }
}

async function borrarFeedback(id) {
  if (!confirm("¿Borrar este punto registrado?")) return;
  try { await deleteDoc(doc(db, "arbitrajes", matchId, "feedback", id)); } catch (e) { /* sin conexión */ }
}

// ---------------- Informe de devolución ----------------
function generarInformeTexto() {
  const lista = feedbackFiltrado();
  const c = matchData.config;
  let txt = `📤 INFORME DE DEVOLUCIÓN — academiadepadel.pe\n`;
  txt += `Pareja: ${nombreEquipo(c, equipo)}\n`;
  if (c.club) txt += `Club: ${c.club}\n`;
  txt += `Puntos analizados: ${lista.length}\n\n`;

  [1, 2].forEach((num) => {
    const propios = lista.filter((f) => f.jugador === num);
    if (!propios.length) return;
    const nombre = nombreJugador(c[`${equipo.toLowerCase()}${num}`], `Jugador ${num}`);
    txt += `— ${nombre} —\n`;
    const favor = propios.filter((f) => ["winner", "ace", "rival_error"].includes(f.resultado));
    const contra = propios.filter((f) => ["ue", "doble_falta"].includes(f.resultado));
    txt += `Puntos a favor: ${favor.length} · Errores propios: ${contra.length}\n`;

    const conteoGolpeFavor = {};
    favor.forEach((f) => { conteoGolpeFavor[f.golpe] = (conteoGolpeFavor[f.golpe] || 0) + 1; });
    const mejorGolpe = Object.entries(conteoGolpeFavor).sort((a, b) => b[1] - a[1])[0];
    if (mejorGolpe) txt += `Fortaleza: ${mejorGolpe[0]} (${mejorGolpe[1]} puntos ganados con ese golpe)\n`;

    const conteoGolpeContra = {};
    contra.forEach((f) => { conteoGolpeContra[f.golpe] = (conteoGolpeContra[f.golpe] || 0) + 1; });
    const peorGolpe = Object.entries(conteoGolpeContra).sort((a, b) => b[1] - a[1])[0];
    if (peorGolpe) txt += `A mejorar: ${peorGolpe[0]} (${peorGolpe[1]} errores)\n`;

    const notas = propios.filter((f) => f.nota).map((f) => `• ${f.nota}`);
    if (notas.length) txt += `Notas:\n${notas.join("\n")}\n`;
    txt += `\n`;
  });

  return txt;
}

function wireInforme() {
  $("btnInformeWhatsapp").addEventListener("click", () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generarInformeTexto())}`, "_blank");
  });
  $("btnInformeCsv").addEventListener("click", () => {
    const lista = feedbackFiltrado();
    const encabezado = "jugador,golpe,resultado,zona,set,marcador,nota\n";
    const filas = lista.map((f) => [
      f.jugador, f.golpe, f.resultado, f.zona || "", f.setIdx + 1, f.marcador || "", (f.nota || "").replace(/"/g, "'")
    ].map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([encabezado + filas], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `devolucion-pareja-${equipo}.csv`;
    a.click();
  });
  $("btnInformeImprimir").addEventListener("click", () => {
    const pre = $("entInforme");
    pre.textContent = generarInformeTexto();
    pre.hidden = false;
    document.body.classList.add("imprimiendo-informe");
    window.print();
    setTimeout(() => document.body.classList.remove("imprimiendo-informe"), 500);
  });
}

// ---------------- Conexión ----------------
function iniciarSuscripciones() {
  $("entCodigo").hidden = true;
  $("entCargando").hidden = false;
  import("./firebase-app.js?v=12")
    .then((mod) => {
      db = mod.db; doc = mod.doc; onSnapshot = mod.onSnapshot;
      collection = mod.collection; addDoc = mod.addDoc; deleteDoc = mod.deleteDoc;
      query = mod.query; orderBy = mod.orderBy;

      onSnapshot(doc(db, "arbitrajes", matchId), (snap) => {
        if (!snap.exists()) { mostrarError(); return; }
        renderMatch(snap.data());
      }, mostrarError);

      onSnapshot(query(collection(db, "arbitrajes", matchId, "feedback"), orderBy("ts", "asc")), (snap) => {
        feedbackList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderFeedback();
      }, () => { /* si falla la subcolección, el resto de la vista sigue funcionando */ });
    })
    .catch(mostrarError);
}

function init() {
  construirFormularioEstatico();
  wireInforme();
  $("btnGuardarTag").addEventListener("click", guardarTag);
  $("btnLimpiarTag").addEventListener("click", limpiarSeleccion);

  if (matchId) {
    $("in-equipo").value = equipo;
    iniciarSuscripciones();
  }

  $("formCodigo").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("in-id").value.trim();
    if (!id) return;
    matchId = id;
    equipo = $("in-equipo").value;
    const url = new URL(location.href);
    url.searchParams.set("id", matchId);
    url.searchParams.set("equipo", equipo);
    history.replaceState(null, "", url);
    iniciarSuscripciones();
  });
}

document.addEventListener("DOMContentLoaded", init);
