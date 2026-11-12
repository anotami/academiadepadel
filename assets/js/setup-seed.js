import {
  auth, db, CONFIG_IS_PLACEHOLDER,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  doc, setDoc, deleteDoc, addDoc, collection, getDocs, serverTimestamp
} from "./firebase-app.js?v=18";
import { PISTAS_SEED, COSTOS_PISTAS_SEED, PROFESOR_SEED, ALUMNOS_SEED } from "./seed-data.js?v=20";
import { TIPOS_CLASE } from "./portal-common.js?v=22";

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

// Guarda una pista pública y, aparte, tus costos internos de cancha
// (costos_pistas, mismo id) si esa pista los tiene en COSTOS_PISTAS_SEED.
async function guardarPistaConCostos(pista) {
  const ref = doc(collection(db, "pistas"));
  await setDoc(ref, pista);
  const costos = COSTOS_PISTAS_SEED[pista.nombre];
  if (costos) await setDoc(doc(db, "costos_pistas", ref.id), costos);
}

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
      await guardarPistaConCostos(pista);
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
    const costosViejos = await getDocs(collection(db, "costos_pistas"));
    for (const d of costosViejos.docs) {
      await deleteDoc(doc(db, "costos_pistas", d.id));
    }

    for (const pista of PISTAS_SEED) {
      await guardarPistaConCostos(pista);
    }
    logPistas(`✔ ${PISTAS_SEED.length} pistas cargadas de nuevo.`);
  } catch (err) {
    logPistas(`✘ No se pudo actualizar: ${err.message}`);
  } finally {
    await signOut(auth);
    btn.disabled = false;
  }
});

// ---- Habilitar solo Top Padel La Molina (no toca las demás pistas) ----
const logTopEl = document.getElementById("log-top");
function logTop(msg) {
  logTopEl.textContent += (logTopEl.textContent ? "\n" : "") + msg;
}

document.getElementById("form-top-padel").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (CONFIG_IS_PLACEHOLDER) {
    logTop("Falta configurar assets/js/firebase-config.js con tu proyecto de Firebase antes de usar esta página.");
    return;
  }
  const password = document.getElementById("pw-profesor-top").value;
  const btn = document.getElementById("btn-top-padel");
  btn.disabled = true;
  logTopEl.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, PROFESOR_SEED.email, password);
    const top = PISTAS_SEED.find((p) => p.nombre === "Top Padel La Molina");
    const actuales = await getDocs(collection(db, "pistas"));
    const existente = actuales.docs.find((d) => (d.data().nombre || "").toLowerCase().includes("top padel"));
    if (existente) {
      await setDoc(doc(db, "pistas", existente.id), top, { merge: true });
      await setDoc(doc(db, "costos_pistas", existente.id), COSTOS_PISTAS_SEED["Top Padel La Molina"]);
      logTop("✔ Top Padel La Molina actualizada (habilitada, sáb y dom de 8:00 a 20:00; tu costo queda privado).");
    } else {
      await guardarPistaConCostos(top);
      logTop("✔ Top Padel La Molina creada (habilitada, sáb y dom de 8:00 a 20:00; tu costo queda privado).");
    }
  } catch (err) {
    logTop(`✘ No se pudo actualizar: ${err.message}`);
  } finally {
    await signOut(auth);
    btn.disabled = false;
  }
});

// ---- Ocultar tus costos de cancha (mueve costoHora* a costos_pistas) ----
const logOcultarEl = document.getElementById("log-ocultar");
function logOcultar(msg) {
  logOcultarEl.textContent += (logOcultarEl.textContent ? "\n" : "") + msg;
}

document.getElementById("form-ocultar-costos").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (CONFIG_IS_PLACEHOLDER) {
    logOcultar("Falta configurar assets/js/firebase-config.js con tu proyecto de Firebase antes de usar esta página.");
    return;
  }
  const password = document.getElementById("pw-profesor-ocultar").value;
  const btn = document.getElementById("btn-ocultar-costos");
  btn.disabled = true;
  logOcultarEl.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, PROFESOR_SEED.email, password);
    const snap = await getDocs(collection(db, "pistas"));
    let movidas = 0;
    for (const d of snap.docs) {
      const { costoHoraSinLuz, costoHoraConLuz, ...publica } = d.data();
      const nombre = (publica.nombre || "").toLowerCase();
      const cancha = (publica.cancha || "").toLowerCase();
      const esX3 = nombre.includes("x3");
      const esLaOnce = nombre.includes("once") || cancha.includes("11");
      const esTop = nombre.includes("top padel");
      const propia = esX3 || esLaOnce || esTop;
      const teniaCostos = costoHoraSinLuz !== undefined || costoHoraConLuz !== undefined;
      if (!propia && !teniaCostos) continue;

      const claveSeed = esX3 ? "Club adidas X3" : esLaOnce ? "Club Pádel Lima (La Once)" : esTop ? "Top Padel La Molina" : null;
      const deSeed = (claveSeed && COSTOS_PISTAS_SEED[claveSeed]) || {};
      const sinLuz = Number(costoHoraSinLuz) || deSeed.costoHoraSinLuz || 0;
      const conLuz = Number(costoHoraConLuz) || deSeed.costoHoraConLuz || 0;
      if (sinLuz || conLuz) {
        await setDoc(doc(db, "costos_pistas", d.id), { costoHoraSinLuz: sinLuz, costoHoraConLuz: conLuz });
      }

      // En tus 3 sedes el precio y las notas públicas eran tu costo: se vacían.
      if (propia) {
        publica.precio = "";
        publica.notas = esTop ? "Solo sábados y domingos, de 8:00 a 20:00." : "";
      }
      // Reemplazo completo del documento: así desaparecen costoHora* de la pista pública.
      await setDoc(doc(db, "pistas", d.id), publica);
      movidas++;
      logOcultar(`✔ ${publica.nombre}: costos privados${propia ? ", precio y notas públicos vaciados" : ""}.`);
    }
    logOcultar(movidas ? `Listo. ${movidas} pista(s) actualizadas.` : "No había nada que mover: tus costos ya estaban ocultos.");
  } catch (err) {
    logOcultar(`✘ No se pudo actualizar: ${err.message}`);
  } finally {
    await signOut(auth);
    btn.disabled = false;
  }
});

// ---- Herramienta de prueba: reserva confirmada de ayer ----
const logPruebaEl = document.getElementById("log-prueba");
function logPrueba(msg) {
  logPruebaEl.textContent += (logPruebaEl.textContent ? "\n" : "") + msg;
}

document.getElementById("form-reserva-prueba").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (CONFIG_IS_PLACEHOLDER) {
    logPrueba("Falta configurar assets/js/firebase-config.js con tu proyecto de Firebase antes de usar esta página.");
    return;
  }
  const password = document.getElementById("pw-profesor-prueba").value;
  const btn = document.getElementById("btn-reserva-prueba");
  btn.disabled = true;

  try {
    const cred = await signInWithEmailAndPassword(auth, PROFESOR_SEED.email, password);

    const alumnosSnap = await getDocs(collection(db, "usuarios"));
    const alumno = alumnosSnap.docs.map((d) => ({ id: d.id, ...d.data() })).find((u) => u.rol === "alumno");
    if (!alumno) throw new Error("No hay ningún alumno registrado todavía. Crea uno primero en login.html.");

    const pistasSnap = await getDocs(collection(db, "pistas"));
    if (pistasSnap.empty) throw new Error("No hay ninguna pista cargada todavía.");
    const pista = { id: pistasSnap.docs[0].id, ...pistasSnap.docs[0].data() };

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fecha = ayer.toISOString().slice(0, 10);

    await addDoc(collection(db, "reservas"), {
      alumnoId: alumno.id,
      alumnoNombre: alumno.nombre,
      alumnoTelefono: alumno.telefono || "",
      profesorId: cred.user.uid,
      profesorNombre: PROFESOR_SEED.nombre,
      tipoClase: TIPOS_CLASE[0].opciones[0],
      pistaId: pista.id,
      pistaNombre: `${pista.nombre} — ${pista.distrito}`,
      fecha,
      hora: "18:00",
      nota: "Reserva de prueba generada desde setup.html",
      estado: "confirmada",
      creadoEn: serverTimestamp()
    });

    logPrueba(`✔ Reserva de prueba creada: ${alumno.nombre}, ${fecha} 18:00, ${pista.nombre}. Ve a profesor.html → "Clases por registrar".`);
  } catch (err) {
    logPrueba(`✘ No se pudo crear: ${err.message}`);
  } finally {
    await signOut(auth);
    btn.disabled = false;
  }
});
