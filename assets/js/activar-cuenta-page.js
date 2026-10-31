import {
  auth, db,
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
  createUserWithEmailAndPassword, serverTimestamp, CONFIG_IS_PLACEHOLDER
} from "./firebase-app.js?v=18";

const elCargando = document.getElementById("ac-cargando");
const elForm = document.getElementById("form-activar");
const elError = document.getElementById("ac-error");
const elErrorMsg = document.getElementById("ac-error-msg");
const elYaActivada = document.getElementById("ac-ya-activada");
const elNombre = document.getElementById("ac-nombre");
const msg = document.getElementById("ac-msg");

function mostrarError(texto) {
  elCargando.hidden = true;
  elError.hidden = false;
  elErrorMsg.textContent = texto;
}

const passwordInput = document.getElementById("ac-password");
const passwordHint = document.getElementById("ac-password-hint");
passwordInput.addEventListener("input", () => {
  const ok = passwordInput.value.length >= 8;
  passwordHint.textContent = ok ? "✓ Mínimo 8 caracteres" : `Mínimo 8 caracteres (llevas ${passwordInput.value.length})`;
  passwordHint.className = "field-hint" + (passwordInput.value.length === 0 ? "" : ok ? " valido" : " invalido");
});

const params = new URLSearchParams(window.location.search);
const alumnoId = params.get("alumno");

let datosAlumno = null;

async function init() {
  if (!alumnoId) {
    mostrarError("Este link no tiene los datos necesarios — pide uno nuevo a tu profesor.");
    return;
  }
  if (CONFIG_IS_PLACEHOLDER) {
    mostrarError("El portal todavía no está conectado a una base de datos.");
    return;
  }
  try {
    const snap = await getDoc(doc(db, "usuarios", alumnoId));
    if (!snap.exists() || snap.data().rol !== "alumno") {
      mostrarError("Este link no es válido o ya no corresponde a una cuenta — pide uno nuevo a tu profesor.");
      return;
    }
    datosAlumno = snap.data();
    if (datosAlumno.cuentaPropia === true) {
      elCargando.hidden = true;
      elYaActivada.hidden = false;
      return;
    }
    const yaMigrado = await getDocs(query(collection(db, "usuarios"), where("migradoDe", "==", alumnoId)));
    if (!yaMigrado.empty) {
      elCargando.hidden = true;
      elYaActivada.hidden = false;
      return;
    }
    elNombre.textContent = `Hola, ${datosAlumno.nombre || ""}`;
    elCargando.hidden = true;
    elForm.hidden = false;
  } catch (err) {
    mostrarError("No se pudo cargar: " + err.message);
  }
}
init();

elForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  msg.className = "form-msg";
  const email = document.getElementById("ac-email").value.trim();
  const password = passwordInput.value;
  const btn = elForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newUid = cred.user.uid;

    // 1) Perfil nuevo, con el mismo historial de datos, en el uid real.
    await setDoc(doc(db, "usuarios", newUid), {
      ...datosAlumno,
      email,
      cuentaPropia: true,
      migradoDe: alumnoId,
      activadoEn: serverTimestamp()
    });

    // 2) Reapuntar sus reservas y paquetes al uid nuevo, para no perder
    // historial, feedback ni el paquete activo.
    const reservasSnap = await getDocs(query(collection(db, "reservas"), where("alumnoId", "==", alumnoId)));
    for (const d of reservasSnap.docs) {
      await updateDoc(doc(db, "reservas", d.id), { alumnoId: newUid });
    }
    const paquetesSnap = await getDocs(query(collection(db, "paquetes"), where("alumnoId", "==", alumnoId)));
    for (const d of paquetesSnap.docs) {
      await updateDoc(doc(db, "paquetes", d.id), { alumnoId: newUid });
    }

    // 3) Si pertenece a un grupo fijo, reemplazar su id ahí también.
    if (datosAlumno.grupoId) {
      const grupoSnap = await getDoc(doc(db, "grupos", datosAlumno.grupoId));
      if (grupoSnap.exists()) {
        const miembroIds = (grupoSnap.data().miembroIds || []).map((id) => (id === alumnoId ? newUid : id));
        await updateDoc(doc(db, "grupos", datosAlumno.grupoId), { miembroIds });
      }
    }

    msg.textContent = "¡Cuenta activada! Entrando a tu portal...";
    msg.className = "form-msg ok";
    window.location.href = "alumno.html";
  } catch (err) {
    btn.disabled = false;
    if (err.code === "auth/email-already-in-use") {
      msg.textContent = "Ese correo ya tiene una cuenta — si ya la activaste, inicia sesión normal.";
    } else {
      msg.textContent = "No se pudo activar tu cuenta: " + err.message;
    }
    msg.className = "form-msg error";
  }
});
