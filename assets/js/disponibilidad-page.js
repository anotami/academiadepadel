// Página pública "Cuéntanos tu disponibilidad" (disponibilidad.html).
// Dos modos, misma página:
//
// 1) Sin "?alumno=" en la URL — el link que Gabriel manda a alguien que le
//    escribió directo (no pasó por el widget "¿Eres nuevo en el pádel?").
//    Pide nombre + WhatsApp + cancha de preferencia + disponibilidad y crea
//    un interesado en interesados_grupo (sin turno asignado).
//
// 2) Con "?alumno=<id del documento en usuarios>" — el link que Gabriel
//    manda a un alumno YA registrado para que actualice su propia
//    disponibilidad sin que él tenga que transcribirla. Carga el nombre y
//    la disponibilidad actual, y al guardar solo actualiza ese campo del
//    alumno (igual que "Mis datos" del portal, pero sin necesitar cuenta).
import {
  auth, db, onAuthStateChanged, signInAnonymously,
  doc, getDoc, updateDoc,
  collection, getDocs, addDoc, serverTimestamp
} from "./firebase-app.js?v=18";
import { construirGrillaDisponibilidad } from "./portal-common.js?v=18";

const WHATSAPP_NUMBER = "51957085531";
const alumnoId = new URLSearchParams(location.search).get("alumno");

const form = document.getElementById("form-disponibilidad");
const camposInteresado = document.getElementById("dp-campos-interesado");
const nombreInput = document.getElementById("dp-nombre");
const whatsappInput = document.getElementById("dp-whatsapp");
const canchaSelect = document.getElementById("dp-cancha");
const submitBtn = document.getElementById("dp-submit");
const msg = document.getElementById("dp-msg");
const errorMsg = document.getElementById("dp-error");
const formCard = document.getElementById("dispFormCard");
const okCard = document.getElementById("dispOkCard");
const eyebrow = document.getElementById("dp-eyebrow");
const heading = document.getElementById("dp-heading");
const sub = document.getElementById("dp-sub");

let dispGrid = construirGrillaDisponibilidad(document.getElementById("dp-disponibilidad"));
document.getElementById("dp-disp-todo").addEventListener("click", () => dispGrid.seleccionarTodo(true));
document.getElementById("dp-disp-ninguno").addEventListener("click", () => dispGrid.seleccionarTodo(false));

if (alumnoId) {
  camposInteresado.hidden = true;
  eyebrow.textContent = "Tu disponibilidad";
  heading.textContent = "Actualiza tu disponibilidad";
  sub.textContent = "Marca los bloques en los que normalmente podrías jugar — tu profesor la usa para armar y confirmar tus clases.";
  submitBtn.textContent = "Guardar disponibilidad";
  document.getElementById("dp-ok-texto").textContent = "Guardamos tu disponibilidad — tu profesor ya la ve actualizada.";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try { await signInAnonymously(auth); }
    catch { msg.textContent = "No se pudo conectar — revisa tu conexión y recarga la página."; msg.className = "form-msg error"; }
    return;
  }

  if (alumnoId) {
    try {
      const snap = await getDoc(doc(db, "usuarios", alumnoId));
      if (!snap.exists() || snap.data().rol !== "alumno") {
        form.hidden = true;
        errorMsg.textContent = "No encontramos este link. Pide a tu profesor que te mande uno nuevo.";
        errorMsg.hidden = false;
        return;
      }
      const alumno = snap.data();
      heading.textContent = `Hola, ${alumno.nombre || ""} — actualiza tu disponibilidad`;
      dispGrid = construirGrillaDisponibilidad(document.getElementById("dp-disponibilidad"), { marcadas: alumno.disponibilidad || [] });
    } catch (err) {
      form.hidden = true;
      errorMsg.textContent = "No se pudo cargar tu disponibilidad (" + err.message + "). Recarga la página.";
      errorMsg.hidden = false;
    }
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
  const disponibilidad = dispGrid.obtenerSeleccion();
  if (!disponibilidad.length) {
    msg.textContent = "Marca al menos un bloque de tu disponibilidad.";
    msg.className = "form-msg error";
    return;
  }

  if (alumnoId) {
    submitBtn.disabled = true;
    msg.textContent = "Guardando...";
    msg.className = "form-msg";
    try {
      await updateDoc(doc(db, "usuarios", alumnoId), { disponibilidad });
      formCard.hidden = true;
      okCard.hidden = false;
    } catch (err) {
      msg.textContent = "No se pudo guardar (" + err.message + "). Avísale a tu profesor.";
      msg.className = "form-msg error";
    } finally {
      submitBtn.disabled = false;
    }
    return;
  }

  const nombre = nombreInput.value.trim();
  const whatsapp = whatsappInput.value.trim();
  const canchaOpcion = canchaSelect.options[canchaSelect.selectedIndex];
  const canchaInteresadaId = canchaSelect.value || null;
  const canchaInteresada = canchaSelect.value ? canchaOpcion.dataset.nombre : "";

  if (!nombre) { nombreInput.focus(); return; }
  if (!whatsapp) { whatsappInput.focus(); return; }

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
