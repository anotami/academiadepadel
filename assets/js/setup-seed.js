import {
  auth, db, CONFIG_IS_PLACEHOLDER,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  doc, setDoc, collection, getDocs, serverTimestamp
} from "./firebase-app.js";
import { PISTAS_SEED, PROFESOR_SEED, ALUMNOS_SEED } from "./seed-data.js";

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
  const pistasSnap = await getDocs(collection(db, "pistas"));
  if (!pistasSnap.empty) {
    log("– Ya había pistas cargadas, no se duplican.");
  } else {
    // Requiere estar autenticado para escribir: entra brevemente con la cuenta del profesor.
    await crearSesionTemporalYsembrarPistas(emailProfesor, pwProfesor);
  }

  log("\nListo. Ve a login.html e inicia sesión con cualquiera de las cuentas de arriba.");
  document.getElementById("btn-seed").disabled = false;
});

async function crearSesionTemporalYsembrarPistas(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
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
