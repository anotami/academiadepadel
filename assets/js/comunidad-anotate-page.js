// Página pública "Sumate a la comunidad" (comunidad-anotate.html). Escribe
// en jugadores_comunidad con el id del documento = WhatsApp normalizado, así
// que volver a enviar el mismo teléfono actualiza el registro en vez de
// duplicarlo (ver firestore.rules) sin que esta página necesite leer nada.
import {
  auth, db, onAuthStateChanged, signInAnonymously,
  doc, setDoc, serverTimestamp
} from "./firebase-app.js?v=18";
import {
  CATEGORIAS_COMUNIDAD, DISTRITOS_COMUNIDAD, HORARIOS_COMUNIDAD, POSICIONES_COMUNIDAD,
  normalizarTelefonoPeru
} from "./portal-common.js?v=21";

const WHATSAPP_NUMBER = "51957085531";

const form = document.getElementById("form-anotate");
const submitBtn = document.getElementById("ca-submit");
const msg = document.getElementById("ca-msg");
const formCard = document.getElementById("caFormCard");
const okCard = document.getElementById("caOkCard");
const honeypot = document.getElementById("ca-web");

document.getElementById("ca-categoria").innerHTML = CATEGORIAS_COMUNIDAD
  .map((c) => `<option value="${c}">${c}</option>`).join("");
document.getElementById("ca-posicion").innerHTML = ['Indistinto', ...POSICIONES_COMUNIDAD.filter((p) => p !== "Indistinto")]
  .map((p) => `<option value="${p}">${p}</option>`).join("");
document.getElementById("ca-distrito").innerHTML = DISTRITOS_COMUNIDAD
  .map((d) => `<option value="${d}">${d}</option>`).join("");

const horariosWrap = document.getElementById("ca-horarios");
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
      msg.textContent = "No se pudo conectar — revisa tu conexión y recarga la página.";
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

  const nombreCompleto = document.getElementById("ca-nombre").value.trim();
  const whatsappRaw = document.getElementById("ca-whatsapp").value;
  const whatsapp = normalizarTelefonoPeru(whatsappRaw);
  const categoria = document.getElementById("ca-categoria").value;
  const genero = document.getElementById("ca-genero").value;
  const posicion = document.getElementById("ca-posicion").value;
  const distrito = document.getElementById("ca-distrito").value;
  const horarios = Array.from(horariosWrap.querySelectorAll("input:checked")).map((i) => i.value);
  const interesadoClases = document.getElementById("ca-clases").value;
  const consentimientoOk = document.getElementById("ca-consentimiento").checked;

  if (!nombreCompleto) {
    msg.textContent = "Falta tu nombre y apellido.";
    msg.className = "form-msg error";
    return;
  }
  if (!whatsapp) {
    msg.textContent = "Ese WhatsApp no parece un celular de Perú válido (9 dígitos, empieza con 9).";
    msg.className = "form-msg error";
    return;
  }
  if (!consentimientoOk) {
    msg.textContent = "Tienes que aceptar que te contactemos por WhatsApp para poder anotarte.";
    msg.className = "form-msg error";
    return;
  }
  if (Date.now() - cargadaEn < 1500) {
    msg.textContent = "Revisa el formulario y vuelve a enviarlo.";
    msg.className = "form-msg error";
    return;
  }

  submitBtn.disabled = true;
  msg.textContent = "Enviando...";
  msg.className = "form-msg";
  try {
    await setDoc(doc(db, "jugadores_comunidad", whatsapp), {
      nombreCompleto, whatsapp, categoria, categoriaEstado: "a_verificar",
      genero, posicion, distrito, horarios, interesadoClases,
      consentimiento: { aceptado: true, fecha: serverTimestamp() },
      origen: "formulario", activo: true,
      creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp()
    }, { merge: true });

    if (typeof gtag === "function") gtag("event", "comunidad_anotado");

    document.getElementById("ca-whatsapp-cta").href =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, me anoté en la comunidad y quiero info de clases")}`;
    formCard.hidden = true;
    okCard.hidden = false;
  } catch (err) {
    msg.textContent = "No se pudo enviar (" + err.message + "). Escríbenos directo por WhatsApp.";
    msg.className = "form-msg error";
  } finally {
    submitBtn.disabled = false;
  }
});
