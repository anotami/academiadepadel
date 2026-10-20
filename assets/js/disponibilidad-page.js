// Página pública "Cuéntanos tu disponibilidad" (disponibilidad.html).
//
// Gabriel manda este link por WhatsApp a quien ya le escribió directo
// (no pasó por el widget "¿Eres nuevo en el pádel?" de la home). Guarda el
// interesado en la misma colección interesados_grupo — sin turno asignado,
// con disponibilidad en grilla y la cancha de preferencia — para que
// aparezca en su panel ("Grupos nuevos" → Interesados) y lo pueda cruzar
// con "Cruce de disponibilidad".
import {
  auth, db, onAuthStateChanged, signInAnonymously,
  collection, getDocs, addDoc, serverTimestamp
} from "./firebase-app.js?v=17";
import { construirGrillaDisponibilidad } from "./portal-common.js?v=18";

const WHATSAPP_NUMBER = "51957085531";

const form = document.getElementById("form-disponibilidad");
const nombreInput = document.getElementById("dp-nombre");
const whatsappInput = document.getElementById("dp-whatsapp");
const canchaSelect = document.getElementById("dp-cancha");
const submitBtn = document.getElementById("dp-submit");
const msg = document.getElementById("dp-msg");
const formCard = document.getElementById("dispFormCard");
const okCard = document.getElementById("dispOkCard");

const dispGrid = construirGrillaDisponibilidad(document.getElementById("dp-disponibilidad"));
document.getElementById("dp-disp-todo").addEventListener("click", () => dispGrid.seleccionarTodo(true));
document.getElementById("dp-disp-ninguno").addEventListener("click", () => dispGrid.seleccionarTodo(false));

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try { await signInAnonymously(auth); }
    catch { msg.textContent = "No se pudo conectar — revisa tu conexión y recarga la página."; msg.className = "form-msg error"; }
    return;
  }
  try {
    const snap = await getDocs(collection(db, "pistas"));
    const pistas = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
    canchaSelect.innerHTML = '<option value="">No tengo preferencia</option>' +
      pistas.map((p) => `<option value="${p.id}" data-nombre="${(p.nombre || "")} — ${(p.distrito || "")}">${p.nombre} — ${p.distrito || ""}</option>`).join("");
  } catch {
    // Si no se pudo cargar la lista de pistas, se sigue con "No tengo preferencia".
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = nombreInput.value.trim();
  const whatsapp = whatsappInput.value.trim();
  const canchaOpcion = canchaSelect.options[canchaSelect.selectedIndex];
  const canchaInteresadaId = canchaSelect.value || null;
  const canchaInteresada = canchaSelect.value ? canchaOpcion.dataset.nombre : "";
  const disponibilidad = dispGrid.obtenerSeleccion();

  if (!nombre) { nombreInput.focus(); return; }
  if (!whatsapp) { whatsappInput.focus(); return; }
  if (!disponibilidad.length) {
    msg.textContent = "Marca al menos un bloque de tu disponibilidad.";
    msg.className = "form-msg error";
    return;
  }

  submitBtn.disabled = true;
  msg.textContent = "Enviando...";
  msg.className = "form-msg";
  try {
    const datos = {
      nombre, whatsapp, email: "",
      nivel: "", turnoId: "", turnoNombre: "",
      canchaInteresada, disponibilidad,
      estado: "nuevo", origen: "link_directo",
      creadoEn: serverTimestamp()
    };
    if (canchaInteresadaId) datos.canchaInteresadaId = canchaInteresadaId;
    await addDoc(collection(db, "interesados_grupo"), datos);

    if (typeof gtag === "function") gtag("event", "disponibilidad_enviada");

    const resumen = disponibilidad.map((d) => `${d.dia} ${d.franja}`).join(", ");
    const mensaje = "Hola, ya completé mi disponibilidad.\n" +
      "Nombre: " + nombre + "\n" +
      (canchaInteresada ? "Cancha: " + canchaInteresada + "\n" : "") +
      "Disponible: " + resumen;
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mensaje), "_blank", "noopener");

    formCard.hidden = true;
    okCard.hidden = false;
  } catch (err) {
    msg.textContent = "No se pudo enviar (" + err.message + "). Escríbenos directo por WhatsApp.";
    msg.className = "form-msg error";
  } finally {
    submitBtn.disabled = false;
  }
});
