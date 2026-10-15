// Calendario público de "Agenda tu clase" (sección #agenda de index.html).
// Muestra solo los horarios donde coincide la disponibilidad real de Gabriel
// como profe (usuarios/{uid}.disponibilidad) CON la disponibilidad real de
// cada cancha habilitada (pistas/{id}.disponibilidad) — exactamente el mismo
// cruce que ya usa profesor-portal.js al revisar una solicitud de clase.
//
// Es mejora progresiva: si Firestore no responde o no hay datos, el
// formulario manual (#agendaForm) se queda visible tal como estaba, sin
// avisar ningún error al visitante.
import { auth, db, onAuthStateChanged, signInAnonymously, collection, query, where, getDocs } from "./firebase-app.js?v=17";
import { DIAS, DIAS_CORTO, FRANJAS, estaDisponible } from "./portal-common.js?v=18";

const WHATSAPP_NUMBER = "51957085531";

const gridWrap = document.getElementById("agendaGridWrap");
const tabsWrap = document.getElementById("agendaCanchaTabs");
const gridHost = document.getElementById("agendaGrid");
const confirmWrap = document.getElementById("agendaConfirm");
const resumenEl = document.getElementById("agendaConfirmResumen");
const nombreInput = document.getElementById("agendaGridNombre");
const programaSelect = document.getElementById("agendaGridPrograma");
const enviarBtn = document.getElementById("agendaGridEnviar");
const formManual = document.getElementById("agendaForm");

if (gridWrap) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch {
        // Sin conexión o Firestore caído: no pasa nada, queda el formulario manual.
      }
      return;
    }
    cargarDisponibilidad();
  });
}

async function cargarDisponibilidad() {
  try {
    const [profesorSnap, pistasSnap] = await Promise.all([
      getDocs(query(collection(db, "usuarios"), where("rol", "==", "profesor"))),
      getDocs(query(collection(db, "pistas"), where("estadoPista", "==", "Habilitada")))
    ]);
    if (profesorSnap.empty || pistasSnap.empty) return;

    const disponibilidadProfesor = profesorSnap.docs[0].data().disponibilidad || [];
    const pistas = ordenarPistas(pistasSnap.docs.map((d) => d.data()));
    if (!pistas.length) return;

    montarWidget(pistas, disponibilidadProfesor);
    gridWrap.hidden = false;
    if (formManual) formManual.hidden = true;
  } catch {
    // Reglas de Firestore, red, etc.: el formulario manual sigue disponible.
  }
}

function ordenarPistas(pistas) {
  const prioridad = (p) => {
    const nombre = (p.nombre || "").toLowerCase();
    if (nombre.includes("x3")) return 0;
    if (nombre.includes("once")) return 1;
    return 2;
  };
  return pistas.slice().sort((a, b) => prioridad(a) - prioridad(b) || (a.nombre || "").localeCompare(b.nombre || "", "es"));
}

// Solo nos dice si la pista tiene ese bloque abierto o no — el costo de
// cancha (sin luz / con luz) es un dato interno de Gabriel y nunca se le
// muestra al alumno: él paga por la clase, no por la cancha.
function disponibleEnPista(pista, dia, franja) {
  return (pista.disponibilidad || []).some((d) => d.dia === dia && d.franja === franja);
}

let seleccion = null; // { pista, dia, franja }

function montarWidget(pistas, disponibilidadProfesor) {
  tabsWrap.innerHTML = "";
  pistas.forEach((pista, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "agenda-cancha-tab" + (i === 0 ? " activa" : "");
    tab.textContent = pista.nombre;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
    tab.addEventListener("click", () => {
      tabsWrap.querySelectorAll(".agenda-cancha-tab").forEach((t) => {
        t.classList.remove("activa");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("activa");
      tab.setAttribute("aria-selected", "true");
      renderGrid(pista, disponibilidadProfesor);
    });
    tabsWrap.appendChild(tab);
  });
  renderGrid(pistas[0], disponibilidadProfesor);
}

function renderGrid(pista, disponibilidadProfesor) {
  seleccion = null;
  confirmWrap.hidden = true;
  gridHost.innerHTML = "";
  gridHost.classList.add("disp-grid");

  const headRow = document.createElement("div");
  headRow.className = "disp-row disp-row-head";
  headRow.innerHTML = `<span class="disp-cell disp-cell-corner"></span>` +
    DIAS.map((dia, i) => `<span class="disp-cell disp-cell-head" title="${dia}">${DIAS_CORTO[i]}</span>`).join("");
  gridHost.appendChild(headRow);

  FRANJAS.forEach((franja) => {
    const row = document.createElement("div");
    row.className = "disp-row";
    row.innerHTML = `<span class="disp-cell disp-cell-label">${franja}</span>`;
    DIAS.forEach((dia) => {
      const disponible = estaDisponible(disponibilidadProfesor, dia, franja) && disponibleEnPista(pista, dia, franja);
      const cell = document.createElement(disponible ? "button" : "span");
      cell.dataset.dia = dia;
      cell.dataset.franja = franja;
      if (disponible) {
        cell.type = "button";
        cell.className = "disp-cell disp-toggle agenda-disponible agenda-slot";
        cell.setAttribute("aria-label", `${dia}, ${franja}: disponible`);
        cell.addEventListener("click", () => elegirSlot(cell, pista, dia, franja));
      } else {
        cell.className = "disp-cell disp-toggle disp-off";
        cell.setAttribute("aria-label", `${dia}, ${franja}: no disponible`);
      }
      row.appendChild(cell);
    });
    gridHost.appendChild(row);
  });
}

function elegirSlot(cell, pista, dia, franja) {
  gridHost.querySelectorAll(".agenda-slot.seleccionada").forEach((el) => el.classList.remove("seleccionada"));
  cell.classList.add("seleccionada");
  seleccion = { pista, dia, franja };

  resumenEl.textContent = `${pista.nombre} · ${dia} · ${franja}`;
  confirmWrap.hidden = false;
  confirmWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

if (enviarBtn) {
  enviarBtn.addEventListener("click", () => {
    if (!seleccion) return;
    const nombre = nombreInput.value.trim();
    if (!nombre) {
      nombreInput.focus();
      return;
    }
    const programa = programaSelect.value;
    if (!programa) {
      programaSelect.focus();
      return;
    }

    const { pista, dia, franja } = seleccion;

    const mensaje = "Hola, quiero agendar una clase.\n" +
      "Nombre: " + nombre + "\n" +
      "Programa: " + programa + "\n" +
      "Cancha: " + pista.nombre + "\n" +
      "Día: " + dia + "\n" +
      "Horario: " + franja;

    if (typeof gtag === "function") {
      gtag("event", "agenda_solicitud", { programa, cancha: pista.nombre, via: "calendario" });
    }

    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mensaje), "_blank", "noopener");
  });
}
