// Numeración de clases: cada CLASE (pista + fecha + hora, con todos sus alumnos) lleva un número único C-0001, C-0002…
// El número vive en cada reserva (claseNum / claseCodigo). El correlativo está en contadores/clases y se reserva dentro de una
// transacción, así que dos clases cargadas a la vez nunca comparten número. Las canceladas conservan el suyo (los huecos se notan).
import { db, doc, getDoc, collection, query, where, getDocs, serverTimestamp } from "./firebase-app.js?v=18";
import { runTransaction, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { formatoCodigo, claveSesion, agruparSesiones, planNumerar, auditarClases } from "./numeracion-calculo.js?v=1";
export { formatoCodigo, claveSesion, agruparSesiones, planNumerar, auditarClases };
const refContador = () => doc(db, "contadores", "clases");

// Reserva `cantidad` números seguidos y devuelve el primero.
export async function reservarNumeros(cantidad = 1) {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(refContador());
    const ultimo = snap.exists() ? Number(snap.data().ultimo) || 0 : 0;
    tx.set(refContador(), { ultimo: ultimo + cantidad, actualizadoEn: serverTimestamp() });
    return ultimo + 1;
  });
}

// Campos a guardar en la reserva para una sesión: reutiliza el número si ya hay otra reserva de esa misma clase, y si no pide uno nuevo.
export async function numeroParaSesion({ profesorId, pistaId, fecha, hora }) {
  const snap = await getDocs(query(collection(db, "reservas"),
    where("profesorId", "==", profesorId), where("fecha", "==", fecha), where("hora", "==", hora)));
  const existente = snap.docs.map((d) => d.data()).find((r) => r.pistaId === pistaId && Number.isInteger(r.claseNum));
  if (existente) return { claseNum: existente.claseNum, claseCodigo: formatoCodigo(existente.claseNum) };
  const n = await reservarNumeros(1);
  return { claseNum: n, claseCodigo: formatoCodigo(n) };
}

// ---------- Escritura ----------
export async function cargarReservas(profesorId) {
  const snap = await getDocs(query(collection(db, "reservas"), where("profesorId", "==", profesorId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Aplica un plan de numerado: primero reserva el bloque en el contador y después escribe por lotes.
export async function aplicarNumerado(profesorId) {
  const reservas = await cargarReservas(profesorId); // datos frescos: nada de trabajar con una vista vieja
  const ya = reservas.filter((r) => Number.isInteger(r.claseNum)).map((r) => r.claseNum);
  const base = planNumerar(reservas, 1);
  if (!base.asignaciones.length) return { escritas: 0, nuevos: 0 };
  const primero = await reservarNumeros(base.cantidadNuevos || 1); // bloque exclusivo [primero, primero + k)
  const plan = planNumerar(reservas, primero);
  const escrituras = [];
  plan.asignaciones.forEach((a) => a.reservasSinNumero.forEach((r) => escrituras.push({ id: r.id, claseNum: a.claseNum, claseCodigo: formatoCodigo(a.claseNum) })));
  for (let i = 0; i < escrituras.length; i += 400) {
    const lote = writeBatch(db);
    escrituras.slice(i, i + 400).forEach((e) => lote.update(doc(db, "reservas", e.id), { claseNum: e.claseNum, claseCodigo: e.claseCodigo }));
    await lote.commit();
  }
  return { escritas: escrituras.length, nuevos: plan.cantidadNuevos, hasta: plan.siguiente - 1, ya: ya.length };
}

export async function ultimoNumero() {
  const snap = await getDoc(refContador());
  return snap.exists() ? Number(snap.data().ultimo) || 0 : 0;
}
