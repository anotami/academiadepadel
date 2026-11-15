import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { arrayUnion, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, collection, query, where, serverTimestamp } from "firebase/firestore";
import { readFileSync } from "node:fs";

const env = await initializeTestEnvironment({ projectId: "demo-gp", firestore: { rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8") } });
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "usuarios/prof"), { rol: "profesor", nombre: "Gabriel", disponibilidad: [] });
  await setDoc(doc(db, "usuarios/alu1"), { rol: "alumno", nombre: "Ana", cuentaPropia: true, telefono: "+51999" });
  await setDoc(doc(db, "usuarios/alu2"), { rol: "alumno", nombre: "Beto", cuentaPropia: true, telefono: "+51888" });
  await setDoc(doc(db, "usuarios/old1"), { rol: "alumno", nombre: "Carla", cuentaPropia: false, grupoId: "g1" });
  await setDoc(doc(db, "usuarios/new1"), { rol: "alumno", nombre: "Carla", cuentaPropia: true, migradoDe: "old1" });
  for (const [id, a] of [["r1", "alu1"], ["r2", "alu2"], ["r3", "old1"]]) await setDoc(doc(db, "reservas/" + id), { alumnoId: a, estado: "confirmada", pistaId: "p", fecha: "2026-11-20", hora: "10:00", montoCobrado: 100 });
  for (const [id, a] of [["p1", "alu1"], ["p2", "alu2"], ["p3", "old1"]]) await setDoc(doc(db, "paquetes/" + id), { alumnoId: a, clasesUsadas: 2, clasesTotales: 4, monto: 300 });
  await setDoc(doc(db, "reservas/r4"), { alumnoId: "alu1", estado: "confirmada", paqueteId: "p1", fecha: "2026-11-25", hora: "10:00" });
  await setDoc(doc(db, "grupos/g1"), { miembroIds: ["old1"], montoCobrado: 75 });
  await setDoc(doc(db, "costos_reservas/r1"), { costoCanchaPagado: 50 });
  await setDoc(doc(db, "costos_profesor/prof"), { costoHora: 50 });
  await setDoc(doc(db, "costos_pistas/x"), { costoHoraSinLuz: 50 });
});

let fallos = 0, total = 0;
async function t(nombre, esperado, fn) {
  total++;
  try { await (esperado === "ok" ? assertSucceeds(fn()) : assertFails(fn())); console.log("PASS", nombre); }
  catch (e) { fallos++; console.log("FAIL", nombre, "→ esperaba", esperado, "|", String(e.message || e).slice(0, 120)); }
}
const as = (uid) => env.authenticatedContext(uid).firestore();
const prof = as("prof"), alu1 = as("alu1"), new1 = as("new1");
const anon = env.authenticatedContext("anon-x", { firebase: { sign_in_provider: "anonymous" } }).firestore();

// ---- alumno (alu1) ----
await t("alumno lee SU reserva (consulta por alumnoId)", "ok", () => getDocs(query(collection(alu1, "reservas"), where("alumnoId", "==", "alu1"))));
await t("alumno NO lista todas las reservas", "fail", () => getDocs(collection(alu1, "reservas")));
await t("alumno NO ve reservas de otros por pista/fecha/hora", "fail", () => getDocs(query(collection(alu1, "reservas"), where("pistaId", "==", "p"), where("fecha", "==", "2026-11-20"), where("hora", "==", "10:00"), where("estado", "==", "confirmada"))));
await t("alumno NO lee la reserva de otro", "fail", () => getDoc(doc(alu1, "reservas/r2")));
await t("alumno cancela SU reserva", "ok", () => updateDoc(doc(alu1, "reservas/r1"), { estado: "cancelada" }));
await t("alumno NO confirma su reserva", "fail", () => updateDoc(doc(alu1, "reservas/r1"), { estado: "confirmada" }));
await t("alumno NO cambia el monto de su reserva", "fail", () => updateDoc(doc(alu1, "reservas/r1"), { montoCobrado: 0 }));
await t("alumno NO cancela la reserva de otro", "fail", () => updateDoc(doc(alu1, "reservas/r2"), { estado: "cancelada" }));
await t("alumno deja su NPS", "ok", () => updateDoc(doc(alu1, "reservas/r1"), { nps: 9, npsEn: serverTimestamp() }));
await t("alumno pide una clase (pendiente, a su nombre)", "ok", () => addDoc(collection(alu1, "reservas"), { alumnoId: "alu1", estado: "pendiente", fecha: "2026-11-21" }));
await t("alumno NO crea una reserva confirmada", "fail", () => addDoc(collection(alu1, "reservas"), { alumnoId: "alu1", estado: "confirmada" }));
await t("alumno NO crea reserva con costoCanchaPagado", "fail", () => addDoc(collection(alu1, "reservas"), { alumnoId: "alu1", estado: "pendiente", costoCanchaPagado: 5 }));
await t("alumno ve SUS paquetes", "ok", () => getDocs(query(collection(alu1, "paquetes"), where("alumnoId", "==", "alu1"))));
await t("alumno NO lista todos los paquetes", "fail", () => getDocs(collection(alu1, "paquetes")));
await t("alumno NO se devuelve una clase sin cancelar nada", "fail", () => updateDoc(doc(alu1, "paquetes/p1"), { clasesUsadas: 1 }));
await t("alumno NO se devuelve una clase aunque indique una reserva NO cancelada", "fail", () => updateDoc(doc(alu1, "paquetes/p1"), { clasesUsadas: 1, ultimaDevolucion: "r4", devueltas: arrayUnion("r4") }));
await t("alumno cancela su reserva con paquete", "ok", () => updateDoc(doc(alu1, "reservas/r4"), { estado: "cancelada" }));
await t("alumno se devuelve 1 clase de SU paquete (reserva cancelada)", "ok", () => updateDoc(doc(alu1, "paquetes/p1"), { clasesUsadas: 1, ultimaDevolucion: "r4", devueltas: arrayUnion("r4") }));
await t("alumno NO se devuelve la MISMA reserva dos veces", "fail", () => updateDoc(doc(alu1, "paquetes/p1"), { clasesUsadas: 0, ultimaDevolucion: "r4", devueltas: arrayUnion("r4") }));
await t("alumno NO se devuelve clases con la reserva de otro", "fail", () => updateDoc(doc(alu1, "paquetes/p1"), { clasesUsadas: 0, ultimaDevolucion: "r2", devueltas: arrayUnion("r2") }));
await t("alumno NO toca el monto de su paquete", "fail", () => updateDoc(doc(alu1, "paquetes/p1"), { monto: 1 }));
await t("alumno NO toca el paquete de otro", "fail", () => updateDoc(doc(alu1, "paquetes/p2"), { clasesUsadas: 1 }));
await t("alumno NO crea paquetes", "fail", () => addDoc(collection(alu1, "paquetes"), { alumnoId: "alu1", clasesTotales: 99, monto: 0 }));
await t("alumno NO lista alumnos", "fail", () => getDocs(collection(alu1, "usuarios")));
await t("alumno NO lista alumnos (consulta rol=alumno)", "fail", () => getDocs(query(collection(alu1, "usuarios"), where("rol", "==", "alumno"))));
await t("alumno lista profesores (selector)", "ok", () => getDocs(query(collection(alu1, "usuarios"), where("rol", "==", "profesor"))));
await t("alumno lee su propio perfil", "ok", () => getDoc(doc(alu1, "usuarios/alu1")));
await t("alumno actualiza su perfil", "ok", () => updateDoc(doc(alu1, "usuarios/alu1"), { nivel: "Inicial" }));
await t("alumno NO edita el perfil de otro", "fail", () => updateDoc(doc(alu1, "usuarios/alu2"), { nombre: "x" }));
await t("alumno se anota en espera (a su nombre)", "ok", () => addDoc(collection(alu1, "esperas"), { alumnoId: "alu1", fecha: "2026-11-20" }));
await t("alumno NO se anota en espera por otro", "fail", () => addDoc(collection(alu1, "esperas"), { alumnoId: "alu2" }));
await t("alumno NO lee las esperas", "fail", () => getDocs(collection(alu1, "esperas")));
await t("alumno NO lee grupos (lista)", "fail", () => getDocs(collection(alu1, "grupos")));
await t("alumno NO lee costos_reservas", "fail", () => getDoc(doc(alu1, "costos_reservas/r1")));
await t("alumno NO lee costos_profesor", "fail", () => getDoc(doc(alu1, "costos_profesor/prof")));
await t("alumno NO lee costos_pistas", "fail", () => getDoc(doc(alu1, "costos_pistas/x")));
await t("alumno NO escribe costos_reservas", "fail", () => setDoc(doc(alu1, "costos_reservas/zz"), { costoCanchaPagado: 1 }));

// ---- visitante anónimo ----
await t("anónimo NO lista reservas", "fail", () => getDocs(collection(anon, "reservas")));
await t("anónimo NO lista alumnos", "fail", () => getDocs(query(collection(anon, "usuarios"), where("rol", "==", "alumno"))));
await t("anónimo NO lista paquetes", "fail", () => getDocs(collection(anon, "paquetes")));
await t("anónimo lee un alumno por su id (link de disponibilidad)", "ok", () => getDoc(doc(anon, "usuarios/old1")));
await t("anónimo actualiza SOLO la disponibilidad (link)", "ok", () => updateDoc(doc(anon, "usuarios/old1"), { disponibilidad: [{ dia: "Lunes", franja: "6:00–8:00" }] }));
await t("anónimo NO cambia otros campos del alumno", "fail", () => updateDoc(doc(anon, "usuarios/old1"), { telefono: "x" }));
await t("anónimo lista profesores (agenda pública)", "ok", () => getDocs(query(collection(anon, "usuarios"), where("rol", "==", "profesor"))));

// ---- activación de cuenta (new1 reemplaza a old1) ----
await t("activación: lee reservas del alumno sin cuenta", "ok", () => getDocs(query(collection(new1, "reservas"), where("alumnoId", "==", "old1"))));
await t("activación: NO lee reservas de alumno con cuenta", "fail", () => getDocs(query(collection(new1, "reservas"), where("alumnoId", "==", "alu2"))));
await t("activación: reapunta su reserva a su uid nuevo", "ok", () => updateDoc(doc(new1, "reservas/r3"), { alumnoId: "new1" }));
await t("activación: NO reapunta la reserva de otro alumno con cuenta", "fail", () => updateDoc(doc(new1, "reservas/r2"), { alumnoId: "new1" }));
await t("activación: lee paquetes del alumno sin cuenta", "ok", () => getDocs(query(collection(new1, "paquetes"), where("alumnoId", "==", "old1"))));
await t("activación: reapunta su paquete", "ok", () => updateDoc(doc(new1, "paquetes/p3"), { alumnoId: "new1" }));
await t("activación: lee su grupo por id", "ok", () => getDoc(doc(new1, "grupos/g1")));
await t("activación: se pone en el grupo", "ok", () => updateDoc(doc(new1, "grupos/g1"), { miembroIds: ["new1"] }));
await t("activación: NO mete a otro en el grupo", "fail", () => updateDoc(doc(new1, "grupos/g1"), { miembroIds: ["alu2"] }));
await t("alumno NO cambia el monto del grupo", "fail", () => updateDoc(doc(new1, "grupos/g1"), { montoCobrado: 1, miembroIds: ["new1"] }));

// ---- profesor ----
await t("profesor lista alumnos", "ok", () => getDocs(query(collection(prof, "usuarios"), where("rol", "==", "alumno"))));
await t("profesor lista reservas del profesor", "ok", () => getDocs(collection(prof, "reservas")));
await t("profesor lista paquetes", "ok", () => getDocs(collection(prof, "paquetes")));
await t("profesor crea un paquete", "ok", () => addDoc(collection(prof, "paquetes"), { alumnoId: "alu1", clasesTotales: 4, clasesUsadas: 0, monto: 400 }));
await t("profesor edita un paquete", "ok", () => updateDoc(doc(prof, "paquetes/p2"), { monto: 350, pagado: true }));
await t("profesor edita una reserva (monto/estado)", "ok", () => updateDoc(doc(prof, "reservas/r2"), { montoCobrado: 90, estado: "confirmada" }));
await t("profesor lee/escribe costos_reservas", "ok", () => setDoc(doc(prof, "costos_reservas/r2"), { costoCanchaPagado: 40 }));
await t("profesor lee costos_profesor", "ok", () => getDoc(doc(prof, "costos_profesor/prof")));
await t("profesor lista/escribe grupos", "ok", () => getDocs(collection(prof, "grupos")));
await t("profesor lee las esperas", "ok", () => getDocs(collection(prof, "esperas")));


// ---- profesor sin claim de admin (cuenta del asistente) ----
await t("profesor crea la ficha de un alumno nuevo (sin claim admin)", "ok", () => setDoc(doc(prof, "usuarios/nuevoAlumno"), { rol: "alumno", nombre: "Nuevo", cuentaPropia: false }));
await t("profesor edita la ficha de un alumno", "ok", () => updateDoc(doc(prof, "usuarios/alu2"), { nivel: "Intermedio" }));
await t("profesor borra la ficha de un alumno", "ok", () => deleteDoc(doc(prof, "usuarios/nuevoAlumno")));
await t("profesor NO crea a otro profesor", "fail", () => setDoc(doc(prof, "usuarios/otroProf"), { rol: "profesor", nombre: "X" }));
await t("profesor NO convierte a un alumno en profesor", "fail", () => updateDoc(doc(prof, "usuarios/alu2"), { rol: "profesor" }));
await t("alumno NO crea fichas de otros", "fail", () => setDoc(doc(alu1, "usuarios/colado"), { rol: "alumno", nombre: "Colado" }));
await t("alumno NO se hace profesor", "fail", () => updateDoc(doc(alu1, "usuarios/alu1"), { rol: "profesor" }));
await t("visitante NO se registra como profesor", "fail", () => setDoc(doc(env.authenticatedContext("nuevo1").firestore(), "usuarios/nuevo1"), { rol: "profesor", nombre: "Intruso" }));
await t("visitante se registra como alumno", "ok", () => setDoc(doc(env.authenticatedContext("nuevo2").firestore(), "usuarios/nuevo2"), { rol: "alumno", nombre: "Ok", cuentaPropia: true }));
await t("árbitro se registra como árbitro", "ok", () => setDoc(doc(env.authenticatedContext("nuevo3").firestore(), "usuarios/nuevo3"), { rol: "arbitro", nombre: "Ref" }));
await t("profesor actualiza su propio perfil", "ok", () => updateDoc(doc(prof, "usuarios/prof"), { bio: "hola" }));
console.log(`\n${total - fallos}/${total} pasan` + (fallos ? `  ·  ${fallos} FALLAN` : ""));
await env.cleanup();
process.exit(fallos ? 1 : 0);
