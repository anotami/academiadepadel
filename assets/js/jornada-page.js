// Página pública de inscripción a la Jornada de Pádel mensual (jornada.html).
// Muestra la jornada con activa:true más próxima y deja inscribirse -- el
// profesor arma/duplica la jornada cada mes desde el panel ("Jornadas").
import {
  auth, db, onAuthStateChanged, signInAnonymously,
  doc, getDoc, updateDoc, addDoc, deleteDoc, collection, query, where, getDocs,
  serverTimestamp, increment
} from "./firebase-app.js?v=18";
import { DISTRITOS_COMUNIDAD, normalizarTelefonoPeru, formatearFechaLarga } from "./portal-common.js?v=26";

const WHATSAPP_NUMBER = "51957085531";
const $ = (id) => document.getElementById(id);

document.getElementById("jor-distrito").innerHTML = DISTRITOS_COMUNIDAD
  .map((d) => `<option value="${d}">${d}</option>`).join("");

onAuthStateChanged(auth, (user) => {
  if (!user) signInAnonymously(auth).catch(() => {});
});

let jornada = null;

function capitalizar(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

async function cargarJornada() {
  // Un link directo a una jornada puntual (?id=...), como el que se copia
  // desde el panel para publicar en Instagram, se abre tal cual aunque esa
  // jornada no sea "la activa" del momento -- es justo lo que permite tener
  // varios meses publicados en paralelo, cada uno con su propio link.
  const idDeLaUrl = new URLSearchParams(location.search).get("id");
  if (idDeLaUrl) {
    const snap = await getDoc(doc(db, "jornadas", idDeLaUrl));
    if (snap.exists()) {
      jornada = { id: snap.id, ...snap.data() };
      renderJornada();
      $("jorCargando").hidden = true;
      $("jorInfoCard").hidden = false;
      return;
    }
    // Id inválido/borrado: sigue con el comportamiento de siempre.
  }

  const snap = await getDocs(query(collection(db, "jornadas"), where("activa", "==", true)));
  if (snap.empty) {
    $("jorCargando").hidden = true;
    $("jorSinJornada").hidden = false;
    return;
  }
  const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.fecha.localeCompare(b.fecha));
  jornada = todas[0];
  renderJornada();
  $("jorCargando").hidden = true;
  $("jorInfoCard").hidden = false;
}

function cuposRestantes() {
  return Math.max(0, (jornada.cupos || 0) - (jornada.cuposUsados || 0));
}

function renderJornada() {
  const j = jornada;
  if (j.portadaUrl) {
    $("jor-portada").src = j.portadaUrl;
    $("jor-portada").alt = j.titulo || "";
  } else {
    $("jor-portada").remove();
  }
  $("jor-titulo").textContent = j.titulo || "Jornada de Pádel";
  $("jor-fecha").textContent = "📅 " + capitalizar(formatearFechaLarga(j.fecha));
  $("jor-horario").textContent = "🕒 Horario: " + (j.horario && j.horario.trim() ? j.horario : "te lo confirmamos por WhatsApp");
  const lugarTexto = `${j.sede || ""}${j.direccion ? ", " + j.direccion : ""}`;
  $("jor-lugar").innerHTML = "📍 " + (j.mapsUrl
    ? `<a href="${j.mapsUrl}" target="_blank" rel="noopener">${lugarTexto}</a>`
    : lugarTexto);
  $("jor-precio").textContent = `💵 S/${j.precio} por persona${j.metodoPago ? " · pago por " + j.metodoPago : ""}`;

  const restantes = cuposRestantes();
  const badge = $("jor-cupos");
  badge.textContent = restantes > 0 ? `👥 Cupos limitados: quedan ${restantes} de ${j.cupos}` : "👥 Cupos completos";
  badge.className = "jor-cupos" + (restantes === 0 ? " jor-cupos-llenos" : restantes <= 2 ? " jor-cupos-pocos" : "");

  if (restantes > 0) {
    $("jor-btn-inscribite").hidden = false;
    $("jor-completos").hidden = true;
  } else {
    $("jor-btn-inscribite").hidden = true;
    const msg = encodeURIComponent(`Hola, quiero anotarme a la próxima jornada de pádel (la del ${j.titulo || ""} ya no tiene cupos)`);
    $("jor-whatsapp-completos").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
    $("jor-completos").hidden = false;
  }
}

$("jor-btn-inscribite").addEventListener("click", () => {
  $("jorInfoCard").hidden = true;
  $("jorFormCard").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("jor-personas").addEventListener("change", (e) => {
  $("jor-acompanantes-wrap").hidden = e.target.value === "1";
});

const form = $("form-jornada");
const submitBtn = $("jor-submit");
const msg = $("jor-msg");
const honeypot = $("jor-web");
const cargadaEn = Date.now();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (honeypot.value.trim() !== "") {
    // Probablemente un bot: simula éxito sin escribir nada en Firestore.
    mostrarExito();
    return;
  }

  const cantidadPersonas = Number($("jor-personas").value);
  const nombre = $("jor-nombre").value.trim();
  const email = $("jor-email").value.trim();
  const celular = normalizarTelefonoPeru($("jor-celular").value);
  const distrito = $("jor-distrito").value;
  const experienciaRaqueta = $("jor-experiencia").value;
  const acompanantes = $("jor-acompanantes").value.trim();

  if (!nombre) { msg.textContent = "Falta tu nombre y apellido."; msg.className = "form-msg error"; return; }
  if (!email) { msg.textContent = "Falta tu email."; msg.className = "form-msg error"; return; }
  if (!celular) { msg.textContent = "Ese celular no parece válido (9 dígitos, empieza con 9)."; msg.className = "form-msg error"; return; }
  if (!distrito) { msg.textContent = "Elige tu distrito."; msg.className = "form-msg error"; return; }
  if (Date.now() - cargadaEn < 1500) { msg.textContent = "Revisa el formulario y vuelve a enviarlo."; msg.className = "form-msg error"; return; }

  submitBtn.disabled = true;
  msg.textContent = "Enviando...";
  msg.className = "form-msg";
  try {
    // Vuelve a leer la jornada por si los cupos se llenaron mientras
    // completaba el formulario -- evita un intento inútil si ya no hay lugar.
    const freshSnap = await getDoc(doc(db, "jornadas", jornada.id));
    const fresh = freshSnap.data();
    if ((fresh.cupos || 0) - (fresh.cuposUsados || 0) < cantidadPersonas) {
      jornada = { id: jornada.id, ...fresh };
      msg.textContent = "Justo se llenaron los cupos mientras completabas el formulario.";
      msg.className = "form-msg error";
      submitBtn.disabled = false;
      $("jorFormCard").hidden = true;
      $("jorInfoCard").hidden = false;
      renderJornada();
      return;
    }

    const datos = {
      jornadaId: jornada.id, cantidadPersonas, nombre, email, celular,
      distrito, experienciaRaqueta, creado: serverTimestamp(), estadoPago: "pendiente"
    };
    if (acompanantes) datos.acompanantes = acompanantes;
    const inscRef = await addDoc(collection(db, "inscripciones_jornada"), datos);

    try {
      await updateDoc(doc(db, "jornadas", jornada.id), { cuposUsados: increment(cantidadPersonas) });
    } catch (errCupos) {
      // Las reglas rechazaron el incremento (ya no había cupo) -- deshace la
      // inscripción para no dejar un registro huérfano sin lugar real.
      await deleteDoc(inscRef).catch(() => {});
      throw new Error("justo se llenaron los cupos");
    }

    if (typeof gtag === "function") gtag("event", "jornada_inscripcion");

    const textoWa = encodeURIComponent(`Hola, me inscribí a la ${jornada.titulo || "jornada"} y quiero pagar por Yape`);
    $("jor-whatsapp-ok").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${textoWa}`;
    mostrarExito();
  } catch (err) {
    msg.textContent = "No se pudo completar (" + err.message + "). Escríbenos directo por WhatsApp.";
    msg.className = "form-msg error";
  } finally {
    submitBtn.disabled = false;
  }
});

function mostrarExito() {
  $("jorFormCard").hidden = true;
  $("jorOkCard").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

cargarJornada().catch((err) => {
  $("jorCargando").innerHTML = `<p class="empty-state">No se pudo cargar: ${err.message}</p>`;
});
