import {
  auth, db, CONFIG_IS_PLACEHOLDER,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp
} from "./firebase-app.js?v=2";
import { PISTAS_SEED, PROFESOR_SEED, ALUMNOS_SEED } from "./seed-data.js?v=2";

const logEl = document.getElementById("log");
function log(msg) {
  logEl.textContent += (logEl.textContent ? "\n" : "") + msg;
}

async function crearCuenta(email, password, perfil) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      ...perfil,
      email,
      creadoEn: serverTimestamp()
    });
    log(`✔ Cuenta creada: ${email}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      log(`– ${email} ya existía, se omite (si quieres recrearla bórrala antes en Firebase Auth).`);
    } else {
      log(`✘ Error con ${email}: ${err.message}`);
    }
  } finally {
    await signOut(auth);
  }
}

document.getElementById("form-seed").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (CONFIG_IS_PLACEHOLDER) {
    log("Falta configurar assets/js/firebase-config.js con tu proyecto de Firebase antes de usar esta página.");
    return;
  }

  const pwProfesor = document.getElementById("pw-profesor").value;
  const pwAlumno1 = document.getElementById("pw-alumno1").value;
  const pwAlumno2 = document.getElementById("pw-alumno2").value;

  document.getElementById("btn-seed").disabled = true;

  log("Creando profesor...");
  const { email: emailProfesor, ...perfilProfesor } = PROFESOR_SEED;
  await crearCuenta(emailProfesor, pwProfesor, perfilProfesor);

  const passwords = [pwAlumno1, pwAlumno2];
  for (let i = 0; i < ALUMNOS_SEED.length; i++) {
    const { email, ...perfilAlumno } = ALUMNOS_SEED[i];
    log(`Creando alumno ${perfilAlumno.nombre}...`);
    await crearCuenta(email, passwords[i], perfilAlumno);
  }

  log("Revisando pistas...");
  await crearSesionTemporalYsembrarPistas(emailProfesor, pwProfesor);

  log("\nListo. Ve a login.html e inicia sesión con cualquiera de las cuentas de arriba.");
  document.getElementById("btn-seed").disabled = false;
});

async function crearSesionTemporalYsembrarPistas(email, password) {
  try {
    // Leer y escribir "pistas" requiere estar autenticado: entra brevemente con el profesor.
    await signInWithEmailAndPassword(auth, email, password);
    const pistasSnap = await getDocs(collection(db, "pistas"));
    if (!pistasSnap.empty) {
      log("– Ya había pistas cargadas, no se duplican.");
      return;
    }
    for (const pista of PISTAS_SEED) {
      await setDoc(doc(collection(db, "pistas")), pista);
    }
    log(`✔ ${PISTAS_SEED.length} pistas cargadas.`);
  } catch (err) {
    log(`✘ No se pudieron cargar las pistas: ${err.message}`);
  } finally {
    await signOut(auth);
  }
}

// ---- Reemplazar por completo la lista de pistas ----
const logPistasEl = document.getElementById("log-pistas");
function logPistas(msg) {
  logPistasEl.textContent += (logPistasEl.textContent ? "\n" : "") + msg;
}

document.getElementById("form-reseed-pistas").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (CONFIG_IS_PLACEHOLDER) {
    logPistas("Falta configurar assets/js/firebase-config.js con tu proyecto de Firebase antes de usar esta página.");
    return;
  }
  const password = document.getElementById("pw-profesor-pistas").value;
  const btn = document.getElementById("btn-reseed-pistas");
  btn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, PROFESOR_SEED.email, password);

    const actuales = await getDocs(collection(db, "pistas"));
    logPistas(`Borrando ${actuales.size} pista(s) existentes...`);
    for (const d of actuales.docs) {
      await deleteDoc(doc(db, "pistas", d.id));
    }

    for (const pista of PISTAS_SEED) {
      await setDoc(doc(collection(db, "pistas")), pista);
    }
    logPistas(`✔ ${PISTAS_SEED.length} pistas cargadas de nuevo.`);
  } catch (err) {
    logPistas(`✘ No se pudo actualizar: ${err.message}`);
  } finally {
    await signOut(auth);
    btn.disabled = false;
  }
});
