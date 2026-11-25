#!/usr/bin/env node
// Asistente de la academia: registra y modifica alumnos y clases en la base real,
// SIEMPRE en dos pasos:
//   1) simular <lote.json>              -> muestra qué se crearía/cambiaría/borraría (no escribe nada)
//   2) aplicar <lote.json> --plan <id>  -> escribe, solo si el plan es idéntico al simulado
//      (agregar --borrados si el plan incluye borrados). Antes de escribir guarda un respaldo.
// Otros: probar (revisa conexión) · ver alumnos [texto] · ver clases [--desde AAAA-MM-DD] [--alumno texto]
// Credenciales: variables de entorno GP_ASISTENTE_EMAIL y GP_ASISTENTE_PASSWORD (cuenta "asistente" con rol profesor).
// Actúa con los permisos de esa cuenta, o sea, bajo las mismas reglas de seguridad que el panel.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { planificar, usarGeneradorDeIds, SERVER_TS, norm, OPERACIONES, numerosParaCreadas, claveClase, codigoClase } from "./logica.mjs";
import { firebaseConfig } from "../../assets/js/firebase-config.js";

const [, , comando, ...resto] = process.argv;
const flag = (n) => { const i = resto.indexOf(n); return i >= 0 ? resto[i + 1] : undefined; };

function uso() {
  console.log(`Comandos: probar | pendiente "título" [--detalle ..] [--destino ..] | pendientes | ver alumnos [texto] | ver clases [--desde AAAA-MM-DD] [--alumno texto] | simular lote.json | aplicar lote.json --plan ID [--borrados]\nOperaciones: ${OPERACIONES.join(", ")}`);
  process.exit(1);
}

async function conectar() {
  const email = process.env.GP_ASISTENTE_EMAIL, password = process.env.GP_ASISTENTE_PASSWORD;
  if (!email || !password) { console.error("Faltan GP_ASISTENTE_EMAIL y GP_ASISTENTE_PASSWORD en el entorno."); process.exit(2); }
  const { initializeApp } = await import("firebase/app");
  const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
  const fs = await import("firebase/firestore");
  const app = initializeApp(firebaseConfig);
  const cred = await signInWithEmailAndPassword(getAuth(app), email, password);
  const db = fs.getFirestore(app);
  const yo = await fs.getDoc(fs.doc(db, "usuarios", cred.user.uid));
  if (!yo.exists() || yo.data().rol !== "profesor") { console.error("La cuenta del asistente no tiene rol profesor."); process.exit(3); }
  usarGeneradorDeIds((col) => fs.doc(fs.collection(db, col)).id);
  return { fs, db, uid: cred.user.uid, nombre: yo.data().nombre || email };
}

function limpiar(d) {
  const { creadoEn, ...resto } = d.data();
  return { id: d.id, ...resto, ...(creadoEn?.seconds ? { creadoEnSeg: creadoEn.seconds } : {}) };
}

async function cargarEstado({ fs, db, uid, nombre }) {
  const q = (c, ...w) => fs.getDocs(w.length ? fs.query(fs.collection(db, c), ...w) : fs.collection(db, c));
  const [al, pi, pa, re] = await Promise.all([
    q("usuarios", fs.where("rol", "==", "alumno")), q("pistas"), q("paquetes"), q("reservas", fs.where("profesorId", "==", uid))
  ]);
  const migrados = new Set(al.docs.map((d) => d.data().migradoDe).filter(Boolean));
  return {
    profesor: { id: uid, nombre },
    alumnos: al.docs.filter((d) => !migrados.has(d.id)).map(limpiar),
    pistas: pi.docs.map(limpiar), paquetes: pa.docs.map(limpiar), reservas: re.docs.map(limpiar)
  };
}

const hashDe = (plan) => createHash("sha256").update(plan.lineas.join("\n") + JSON.stringify(plan.pendientes || [])).digest("hex").slice(0, 10);

// Numera las clases nuevas del plan (C-0001…): reserva el bloque en el contador con una transacción (nunca se repite un número,
// aunque el panel esté cargando clases a la vez) y reutiliza el número si la clase ya existía.
async function asignarNumerosDeClase(ctx, plan, e) {
  const creadas = plan.acciones.filter((a) => a.tipo === "crear" && a.col === "reservas");
  if (!creadas.length) return;
  const { cantidad } = numerosParaCreadas(e.reservas, creadas, 1);
  let primero = 1;
  if (cantidad) {
    try {
      primero = await ctx.fs.runTransaction(ctx.db, async (tx) => {
        const ref = ctx.fs.doc(ctx.db, "contadores", "clases");
        const s = await tx.get(ref); const ultimo = s.exists() ? Number(s.data().ultimo) || 0 : 0;
        tx.set(ref, { ultimo: ultimo + cantidad, actualizadoEn: ctx.fs.serverTimestamp() });
        return ultimo + 1;
      });
    } catch (err) {
      console.error(`⚠ No se pudo reservar números de clase (${err.message}). ¿Publicaste la regla de contadores? Las clases se crean igual, sin número: después usá "Numerar clases existentes" en el panel.`);
      return;
    }
  }
  const { porClave } = numerosParaCreadas(e.reservas, creadas, primero);
  creadas.forEach((a) => { const n = porClave[claveClase(a.datos)]; a.datos.claseNum = n; a.datos.claseCodigo = codigoClase(n); });
  console.log(`Numeración: ${cantidad} clase(s) nueva(s)` + (cantidad ? ` desde ${codigoClase(primero)}` : "") + ".");
}

// Deja un pendiente visible en el panel (tarjeta "Pendientes del asistente" con botón Hecho).
async function dejarPendiente(ctx, { titulo, detalle = "", destino = "clases" }) {
  const ref = ctx.fs.doc(ctx.fs.collection(ctx.db, "pendientes_asistente"));
  await ctx.fs.setDoc(ref, { titulo, detalle, destino, resuelto: false, origen: "asistente", creadoEn: ctx.fs.serverTimestamp() });
  return ref.id;
}

function mostrarPlan(plan) {
  console.log(plan.lineas.join("\n"));
  if (plan.errores.length) console.log("\nERRORES (no se aplicarían):\n" + plan.errores.map((x) => "  ✘ " + x).join("\n"));
  const n = { crear: 0, actualizar: 0, borrar: 0 };
  plan.acciones.forEach((a) => n[a.tipo]++);
  console.log(`\nResumen: ${n.crear} por crear · ${n.actualizar} por modificar · ${n.borrar} por borrar` + (plan.borra ? "  ⚠ INCLUYE BORRADOS" : ""));
  if (plan.pendientes?.length) console.log(`Al aplicar quedarán ${plan.pendientes.length} pendiente(s) visibles en tu panel:\n` + plan.pendientes.map((p) => "  ☐ " + p.titulo).join("\n"));
  if (plan.acciones.some((a) => a.tipo === "crear" && a.col === "reservas")) console.log("Numeración: cada clase nueva recibe su N° (C-0001…) al aplicar; los alumnos de una misma clase comparten el número.");
  console.log(`ID DEL PLAN: ${hashDe(plan)}`);
}

function leerLote(archivo) {
  if (!archivo) uso();
  return JSON.parse(readFileSync(archivo, "utf8"));
}

function convertir(valor, fs) {
  return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, v === SERVER_TS ? fs.serverTimestamp() : v]));
}

async function main() {
  if (comando === "probar") {
    const ctx = await conectar(); const e = await cargarEstado(ctx);
    console.log(`Conectado como ${ctx.nombre}. Alumnos: ${e.alumnos.length} · Pistas: ${e.pistas.length} · Paquetes: ${e.paquetes.length} · Clases: ${e.reservas.length}`);
    return ctx;
  }
  if (comando === "ver") {
    const ctx = await conectar(); const e = await cargarEstado(ctx);
    if (resto[0] === "alumnos") {
      const t = norm(resto[1] || "");
      e.alumnos.filter((a) => norm(a.nombre).includes(t)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        .forEach((a) => console.log(`${a.nombre} · ${a.nivel || ""} · ${a.telefono || a.whatsapp || "sin teléfono"} · ${a.programa || ""}`));
    } else if (resto[0] === "clases") {
      const desde = flag("--desde") || "0000-00-00"; const t = norm(flag("--alumno") || "");
      e.reservas.filter((r) => r.fecha >= desde && norm(r.alumnoNombre).includes(t)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
        .forEach((r) => console.log(`${r.claseCodigo || "sin N°"} · ${r.fecha} ${r.hora} · ${r.alumnoNombre} · ${r.pistaNombre} · ${r.tipoClase || ""} · ${r.estado}${r.registrada ? " · cerrada" : ""}${r.paqueteId ? " · paquete" : typeof r.montoCobrado === "number" ? " · S/" + r.montoCobrado : ""}`));
    } else uso();
    return ctx;
  }
  if (comando === "pendiente") {
    // pendiente "Título" [--detalle "texto"] [--destino alumnos|clases|cobros|datos]
    const titulo = resto[0];
    if (!titulo) uso();
    const ctx = await conectar();
    const id = await dejarPendiente(ctx, { titulo, detalle: flag("--detalle") || "", destino: flag("--destino") || "clases" });
    console.log(`Pendiente dejado en tu panel (${id}): ${titulo}`);
    return ctx;
  }
  if (comando === "pendientes") {
    const ctx = await conectar();
    const snap = await ctx.fs.getDocs(ctx.fs.collection(ctx.db, "pendientes_asistente"));
    const filas = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((x, y) => (x.creadoEn?.seconds || 0) - (y.creadoEn?.seconds || 0));
    if (!filas.length) console.log("No hay pendientes.");
    filas.forEach((p) => console.log(`${p.resuelto ? "☑" : "☐"} ${p.titulo}${p.detalle ? " — " + p.detalle : ""} [${p.id}]`));
    return ctx;
  }
  if (comando === "simular" || comando === "aplicar") {
    const lote = leerLote(resto[0]);
    const ctx = await conectar(); const e = await cargarEstado(ctx);
    const plan = planificar(e, lote);
    if (comando === "simular") { mostrarPlan(plan); return ctx; }
    // aplicar
    const id = hashDe(plan);
    if (plan.errores.length) { mostrarPlan(plan); console.error("\nHay errores: no se aplicó nada."); process.exitCode = 4; return ctx; }
    if (flag("--plan") !== id) { mostrarPlan(plan); console.error(`\nEl plan no coincide con el confirmado (${flag("--plan") || "ninguno"}). Vuelve a simular y confirmar. No se aplicó nada.`); process.exitCode = 5; return ctx; }
    if (plan.borra && !resto.includes("--borrados")) { console.error("El plan incluye borrados: agrega --borrados para confirmarlo. No se aplicó nada."); process.exitCode = 6; return ctx; }
    await asignarNumerosDeClase(ctx, plan, e);
    const dir = process.env.GP_RESPALDOS || path.join(homedir(), "respaldos-academia");
    mkdirSync(dir, { recursive: true });
    const archivo = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}_${id}.json`);
    writeFileSync(archivo, JSON.stringify({ plan: plan.lineas, acciones: plan.acciones }, null, 2));
    console.log(`Respaldo guardado en ${archivo}`);
    for (const a of plan.acciones) {
      const ref = ctx.fs.doc(ctx.db, a.col, a.id);
      if (a.tipo === "crear") await ctx.fs.setDoc(ref, convertir(a.datos, ctx.fs));
      else if (a.tipo === "actualizar") await ctx.fs.updateDoc(ref, convertir(a.cambios, ctx.fs));
      else await ctx.fs.deleteDoc(ref);
      console.log(`  ✔ ${a.tipo} ${a.col}/${a.id}`);
    }
    for (const p of plan.pendientes || []) {
      try { await dejarPendiente(ctx, p); console.log(`  ☐ pendiente dejado en el panel: ${p.titulo}`); }
      catch (err) { console.error(`  (no se pudo dejar el pendiente "${p.titulo}": ${err.message} — ¿publicaste la regla de pendientes_asistente?)`); }
    }
    console.log(`Listo: ${plan.acciones.length} escrituras aplicadas.`);
    return ctx;
  }
  uso();
}

const ctx = await main();
if (ctx) { await ctx.fs.terminate(ctx.db); }
process.exit(process.exitCode || 0);
