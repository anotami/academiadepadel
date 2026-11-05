// Página pública "Sumate a la comunidad" (comunidad.html) -- embudo
// Instagram -> grupo de WhatsApp por nivel. Distinta de
// comunidad-anotate.html (ese es el directorio "falta el cuarto" por
// categoría, para armar partidos; este formulario arma la comunidad de
// WhatsApp por nivel/sede).
import {
  auth, db, onAuthStateChanged, signInAnonymously,
  addDoc, collection, serverTimestamp
} from "./firebase-app.js?v=18";
import { HORARIOS_COMUNIDAD, normalizarTelefonoPeru } from "./portal-common.js?v=26";

// PENDIENTE: Gabriel carga acá el link real de cada grupo de WhatsApp
// (Configuración del grupo -> Invitar a través de link, en WhatsApp).
// Mientras tanto quedan en "#" -- no rompen el formulario, solo no llevan
// a ningún lado todavía.
const LINKS_GRUPO_WHATSAPP = {
  cero: "https://chat.whatsapp.com/CJjPY60FamzCN0FLD81X1K?s=sw&p=i&mlu=4&ilr=4&iam=2",
  principiante: "#",
  intermedio: "#",
  avanzado: "#"
};

const form = document.getElementById("form-comunidad");
const submitBtn = document.getElementById("com-submit");
const msg = document.getElementById("com-msg");
const formCard = document.getElementById("comFormCard");
const okCard = document.getElementById("comOkCard");
const honeypot = document.getElementById("com-web");

const horariosWrap = document.getElementById("com-horarios");
HORARIOS_COMUNIDAD.forEach((h) => {
  const label = document.createElement("label");
  label.className = "avail-slot";
  label.innerHTML = `<input type="checkbox" value="${h}"> ${h}`;
  label.querySelector("input").addEventListener("change", (e) => {
    label.classList.toggle("checked", e.target.checked);
  });
  horariosWrap.appendChild(label);
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(() => {
      msg.textContent = "No se pudo conectar — revisá tu conexión y recargá la página.";
      msg.className = "form-msg error";
    });
  }
});

// Fricción mínima antiabuso: un envío legítimo tarda al menos unos segundos
// en completarse. No reemplaza un rate-limit real, pero frena los bots más
// torpes sin necesitar backend propio.
const cargadaEn = Date.now();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (honeypot.value.trim() !== "") {
    // Probablemente un bot: simula éxito sin escribir nada en Firestore.
    formCard.hidden = true;
    okCard.hidden = false;
    return;
  }

  const nombre = document.getElementById("com-nombre").value.trim();
  const whatsapp = normalizarTelefonoPeru(document.getElementById("com-whatsapp").value);
  const nivel = document.getElementById("com-nivel").value;
  const sedePreferida = document.getElementById("com-sede").value;
  const horariosDisponibles = Array.from(horariosWrap.querySelectorAll("input:checked")).map((i) => i.value);
  const comoNosConocio = document.getElementById("com-conocio").value;
  const consentimientoOk = document.getElementById("com-consentimiento").checked;

  if (!nombre) { msg.textContent = "Te falta el nombre y apellido."; msg.className = "form-msg error"; return; }
  if (!whatsapp) { msg.textContent = "Ese WhatsApp no parece un celular de Perú válido (9 dígitos, empieza con 9)."; msg.className = "form-msg error"; return; }
  if (!consentimientoOk) { msg.textContent = "Tenés que aceptar para que te sumemos al grupo."; msg.className = "form-msg error"; return; }
  if (Date.now() - cargadaEn < 1500) { msg.textContent = "Revisá el formulario y volvé a enviarlo."; msg.className = "form-msg error"; return; }

  submitBtn.disabled = true;
  msg.textContent = "Enviando...";
  msg.className = "form-msg";
  try {
    await addDoc(collection(db, "comunidad_whatsapp"), {
      nombre, whatsapp, nivel, sedePreferida, horariosDisponibles, comoNosConocio,
      consentimiento: { aceptado: true, fecha: serverTimestamp() },
      creadoEn: serverTimestamp()
    });

    if (typeof gtag === "function") gtag("event", "comunidad_whatsapp_sumado");

    document.getElementById("com-grupo-cta").href = LINKS_GRUPO_WHATSAPP[nivel] || "#";
    formCard.hidden = true;
    okCard.hidden = false;
  } catch (err) {
    msg.textContent = "No se pudo enviar (" + err.message + "). Escribinos directo por WhatsApp.";
    msg.className = "form-msg error";
  } finally {
    submitBtn.disabled = false;
  }
});
