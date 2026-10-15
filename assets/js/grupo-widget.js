// Widget público "¿Eres nuevo en el pádel?" (sección #grupo-nuevo de index.html).
// 3 pasos en una sola vista: nivel (autodiagnóstico ligero, no reemplaza el
// test.html) -> turno con cupos (leídos en vivo de turnos_grupales, que
// administras desde profesor.html) -> datos + confirmación.
//
// Al confirmar: guarda el interesado en Firestore (para que quede en tu
// panel) Y abre WhatsApp con el resumen, igual que el resto del sitio.
//
// Mejora progresiva: si no hay turnos abiertos o Firestore no responde, el
// wizard se queda oculto y se ve el link directo de WhatsApp (#grupoFallback).
import {
  auth, db, onAuthStateChanged, signInAnonymously,
  collection, query, where, getDocs, addDoc, updateDoc, doc, increment, serverTimestamp
} from "./firebase-app.js?v=16";
import { formatearFechaLarga, fechaYaPaso } from "./portal-common.js?v=15";

const WHATSAPP_NUMBER = "51957085531";

const wizard = document.getElementById("grupoWizard");
const fallback = document.getElementById("grupoFallback");
const paso2 = document.getElementById("grupoPaso2");
const paso3 = document.getElementById("grupoPaso3");
const turnosGrid = document.getElementById("turnosGrid");
const resumenEl = document.getElementById("grupoResumen");
const nombreInput = document.getElementById("grupoNombre");
const whatsappInput = document.getElementById("grupoWhatsapp");
const emailInput = document.getElementById("grupoEmail");
const confirmarBtn = document.getElementById("grupoConfirmar");
const estadoMsg = document.getElementById("grupoEstadoMsg");

let nivelSeleccionado = null;
let turnoSeleccionado = null;

if (wizard) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch {
        // Sin conexión o Firestore caído: queda el link de WhatsApp.
      }
      return;
    }
    cargarTurnos();
  });

  document.querySelectorAll(".nivel-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".nivel-card").forEach((c) => c.classList.remove("seleccionada"));
      card.classList.add("seleccionada");
      nivelSeleccionado = card.dataset.nivel;
      paso2.hidden = false;
      paso2.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

async function cargarTurnos() {
  try {
    const snap = await getDocs(query(collection(db, "turnos_grupales"), where("activo", "==", true)));
    if (snap.empty) return;
    // Un turno con fecha puntual (ej. la clínica mensual) ya pasada no se
    // ofrece más — evita que alguien se anote a un evento que ya ocurrió.
    const turnos = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((t) => !t.fecha || !fechaYaPaso(t.fecha));
    if (!turnos.length) return;
    renderTurnos(turnos);
    wizard.hidden = false;
    if (fallback) fallback.hidden = true;
  } catch {
    // Reglas de Firestore, red, etc.: el link de WhatsApp sigue disponible.
  }
}

function renderTurnos(turnos) {
  turnosGrid.innerHTML = "";
  turnosGrid.classList.add("turnos-grid");
  turnos.forEach((t) => {
    const cupoUsado = t.cupoUsado || 0;
    const lleno = cupoUsado >= t.cupoTotal;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "turno-card" + (t.tipo === "clinica-gratuita" ? " turno-card-gratis" : "");
    card.innerHTML = `
      <strong>${t.nombre}</strong>
      ${t.fecha ? `<span class="turno-fecha">${formatearFechaLarga(t.fecha)}</span>` : ""}
      <span>${t.horarioTexto}</span>
      <span class="badge ${lleno ? "badge-pendiente" : "badge-confirmada"}">${lleno ? "Casi lleno — anótate igual" : `Quedan ${Math.max(t.cupoTotal - cupoUsado, 0)} cupos`}</span>
    `;
    card.addEventListener("click", () => {
      turnosGrid.querySelectorAll(".turno-card").forEach((c) => c.classList.remove("seleccionada"));
      card.classList.add("seleccionada");
      turnoSeleccionado = t;
      const cuando = t.fecha ? `${formatearFechaLarga(t.fecha)}, ${t.horarioTexto}` : t.horarioTexto;
      resumenEl.textContent = `Nivel: ${nivelSeleccionado} — Turno: ${t.nombre} (${cuando})`;
      paso3.hidden = false;
      paso3.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    turnosGrid.appendChild(card);
  });
}

if (confirmarBtn) {
  confirmarBtn.addEventListener("click", async () => {
    if (!nivelSeleccionado || !turnoSeleccionado) return;
    const nombre = nombreInput.value.trim();
    const whatsapp = whatsappInput.value.trim();
    const email = emailInput.value.trim();
    if (!nombre) { nombreInput.focus(); return; }
    if (!whatsapp) { whatsappInput.focus(); return; }
    if (!email) { emailInput.focus(); return; }

    confirmarBtn.disabled = true;
    estadoMsg.textContent = "Enviando...";
    try {
      await addDoc(collection(db, "interesados_grupo"), {
        nombre, whatsapp, email,
        nivel: nivelSeleccionado,
        turnoId: turnoSeleccionado.id,
        turnoNombre: turnoSeleccionado.nombre,
        estado: "nuevo",
        creadoEn: serverTimestamp()
      });
      try {
        await updateDoc(doc(db, "turnos_grupales", turnoSeleccionado.id), { cupoUsado: increment(1) });
      } catch {
        // No bloquea la inscripción si el contador público no se pudo actualizar.
      }
      if (typeof gtag === "function") {
        gtag("event", "grupo_interes", { nivel: nivelSeleccionado, turno: turnoSeleccionado.nombre });
      }
      const cuando = turnoSeleccionado.fecha
        ? `${formatearFechaLarga(turnoSeleccionado.fecha)}, ${turnoSeleccionado.horarioTexto}`
        : turnoSeleccionado.horarioTexto;
      const mensaje = "Hola, quiero empezar a jugar pádel y armar grupo.\n" +
        "Nombre: " + nombre + "\n" +
        "Nivel: " + nivelSeleccionado + "\n" +
        "Turno: " + turnoSeleccionado.nombre + " (" + cuando + ")";
      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mensaje), "_blank", "noopener");
      estadoMsg.textContent = "¡Listo! Te escribimos por WhatsApp para confirmar tu cupo.";
    } catch (err) {
      estadoMsg.textContent = "No se pudo enviar (" + err.message + "). Escríbenos directo por WhatsApp.";
    } finally {
      confirmarBtn.disabled = false;
    }
  });
}
