// Lógica de negocio del asistente: arma un PLAN (qué se crearía, cambiaría o borraría)
// replicando las reglas de la página (assets/js/profesor-portal.js). No toca la base:
// trabaja sobre una copia en memoria y devuelve acciones; otro paso las aplica.
import {
  TIPOS_CLASE, HORAS_RESERVA, PRECIOS_CLASE_SUELTA, DURACIONES_CLASE, CANCHAS_BEELUP, NIVELES,
  esPistaBeelup, esProgramaRegular, normalizarTelefonoPeru
} from "../../assets/js/portal-common.js";

export const SERVER_TS = "__SERVER_TIMESTAMP__";

const NIVELES_ALUMNO = ["Inicial", "Inicial-Intermedio", "Intermedio"];
const TIPOS = TIPOS_CLASE.flatMap((g) => g.opciones);
const MODALIDADES = Object.keys(PRECIOS_CLASE_SUELTA);
const CAMPOS_ALUMNO = ["nombre", "telefono", "whatsapp", "instagram", "edad", "nivel", "programa", "observaciones"];

export const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const soles = (n) => `S/ ${Math.round(n * 100) / 100}`;
const fechaValida = (f) => /^\d{4}-\d{2}-\d{2}$/.test(f || "") && !Number.isNaN(Date.parse(f + "T00:00:00Z"));
const fechaCorta = (f) => f.split("-").reverse().join("/");

// ---------- Estado en memoria ----------
// estado = { profesor:{id,nombre}, alumnos:[], pistas:[], paquetes:[], reservas:[] }  (cada uno con id)
export function clonarEstado(e) { return JSON.parse(JSON.stringify(e)); }

// Los ids nuevos los genera quien aplica el plan (Firestore los crea sin red); en pruebas, uno local.
let contador = 0;
let generador = (col) => `${col}-${Date.now().toString(36)}${(contador++).toString(36)}`;
export function usarGeneradorDeIds(fn) { generador = fn; }
const idNuevo = (prefijo) => generador(prefijo === "alumno" ? "usuarios" : "reservas");

function buscarPorNombre(lista, consulta, etiqueta, extraTexto = () => "") {
  if (consulta && typeof consulta === "object" && consulta.id) {
    const x = lista.find((i) => i.id === consulta.id);
    if (!x) throw new Error(`No existe ${etiqueta} con id ${consulta.id}.`);
    return x;
  }
  const q = norm(consulta);
  if (!q) throw new Error(`Falta indicar ${etiqueta}.`);
  const exactos = lista.filter((i) => norm(i.nombre) === q);
  if (exactos.length === 1) return exactos[0];
  const tokens = q.split(" ");
  const parecidos = lista.filter((i) => { const t = norm(`${i.nombre} ${extraTexto(i)}`); return tokens.every((k) => t.includes(k)); });
  if (parecidos.length === 1) return parecidos[0];
  if (parecidos.length === 0) throw new Error(`No encontré ${etiqueta} "${consulta}".`);
  throw new Error(`"${consulta}" es ambiguo (${etiqueta}): ${parecidos.slice(0, 6).map((i) => i.nombre).join(" | ")}. Dame el nombre completo.`);
}
const buscarAlumno = (e, c) => buscarPorNombre(e.alumnos, c, "alumno");
const buscarPista = (e, c) => buscarPorNombre(e.pistas, c, "pista", (p) => p.distrito || "");

function buscarReserva(e, op, { soloConfirmadas = false } = {}) {
  const alumno = buscarAlumno(e, op.alumno);
  if (!fechaValida(op.fecha)) throw new Error(`Fecha inválida "${op.fecha}" (usa AAAA-MM-DD).`);
  let rs = e.reservas.filter((r) => r.alumnoId === alumno.id && r.fecha === op.fecha && r.estado !== "rechazada");
  if (soloConfirmadas) rs = rs.filter((r) => r.estado === "confirmada");
  if (op.hora) rs = rs.filter((r) => r.hora === op.hora);
  if (rs.length === 0) throw new Error(`${alumno.nombre} no tiene una clase el ${fechaCorta(op.fecha)}${op.hora ? " a las " + op.hora : ""}.`);
  if (rs.length > 1) throw new Error(`${alumno.nombre} tiene ${rs.length} clases el ${fechaCorta(op.fecha)} (${rs.map((r) => r.hora).join(", ")}). Indica la hora.`);
  return { alumno, reserva: rs[0] };
}

const paquetesActivos = (e, alumnoId) => e.paquetes
  .filter((p) => p.alumnoId === alumnoId && (p.clasesUsadas || 0) < p.clasesTotales)
  .sort((a, b) => (a.creadoEnSeg || 0) - (b.creadoEnSeg || 0));

// ---------- Acciones ----------
function accion(plan, a) { plan.acciones.push(a); }

function devolverClaseAlPaquete(e, plan, reserva, textos) {
  if (!reserva.paqueteId) return;
  const p = e.paquetes.find((x) => x.id === reserva.paqueteId);
  if (p) {
    const antes = p.clasesUsadas || 0;
    p.clasesUsadas = Math.max(0, antes - 1);
    accion(plan, { tipo: "actualizar", col: "paquetes", id: p.id, cambios: { clasesUsadas: p.clasesUsadas }, antes: { clasesUsadas: antes } });
    textos.push(`le devuelve la clase a su paquete "${p.tipo}" (${antes}/${p.clasesTotales} → ${p.clasesUsadas}/${p.clasesTotales})`);
  }
}

// ---------- Operaciones ----------
const OPS = {
  "alumno.crear"(e, plan, op) {
    const nombre = String(op.nombre || "").trim();
    if (!nombre) throw new Error("alumno.crear: falta el nombre.");
    const nivel = op.nivel || "Inicial";
    if (!NIVELES_ALUMNO.includes(nivel)) throw new Error(`Nivel "${nivel}" inválido. Opciones: ${NIVELES_ALUMNO.join(", ")}.`);
    const programa = op.programa || "Clase individual";
    if (!TIPOS.includes(programa)) throw new Error(`Programa "${programa}" inválido. Opciones: ${TIPOS.join(" | ")}.`);
    const tel = String(op.telefono || op.whatsapp || "").replace(/\D/g, "");
    const repetido = e.alumnos.find((a) => norm(a.nombre) === norm(nombre) || (tel && String(a.telefono || a.whatsapp || "").replace(/\D/g, "") === tel));
    if (repetido && !op.permitirDuplicado) throw new Error(`Ya existe un alumno parecido: "${repetido.nombre}". Si es otra persona, agrega "permitirDuplicado": true.`);
    const avisos = [];
    if (op.telefono && !normalizarTelefonoPeru(op.telefono)) avisos.push("el teléfono no parece un celular peruano");
    if (!op.programa) avisos.push('programa por defecto "Clase individual"');
    const datos = {
      rol: "alumno", nombre, telefono: String(op.telefono || "").trim(), whatsapp: String(op.whatsapp || "").trim(),
      instagram: String(op.instagram || "").trim(), edad: Number(op.edad) || null, nivel, programa,
      observaciones: String(op.observaciones || "").trim(), disponibilidad: [], cuentaPropia: false, creadoEn: SERVER_TS
    };
    const id = idNuevo("alumno");
    e.alumnos.push({ id, ...datos, creadoEn: undefined });
    accion(plan, { tipo: "crear", col: "usuarios", id, datos });
    return `CREAR alumno "${nombre}" · ${nivel} · ${programa}${datos.telefono ? " · " + datos.telefono : ""}${avisos.length ? "  (⚠ " + avisos.join("; ") + ")" : ""}`;
  },

  "alumno.modificar"(e, plan, op) {
    const alumno = buscarAlumno(e, op.alumno);
    const cambios = op.cambios || {};
    const raros = Object.keys(cambios).filter((k) => !CAMPOS_ALUMNO.includes(k));
    if (raros.length) throw new Error(`No se puede cambiar: ${raros.join(", ")}. Permitido: ${CAMPOS_ALUMNO.join(", ")}.`);
    if (!Object.keys(cambios).length) throw new Error("alumno.modificar: no hay cambios.");
    if (cambios.nivel && !NIVELES_ALUMNO.includes(cambios.nivel)) throw new Error(`Nivel "${cambios.nivel}" inválido.`);
    if (cambios.programa && !TIPOS.includes(cambios.programa)) throw new Error(`Programa "${cambios.programa}" inválido.`);
    if ("nombre" in cambios && !String(cambios.nombre).trim()) throw new Error("El nombre no puede quedar vacío.");
    const antes = {}; const nuevos = {};
    for (const k of Object.keys(cambios)) { antes[k] = alumno[k] ?? null; nuevos[k] = k === "edad" ? (Number(cambios[k]) || null) : String(cambios[k]).trim(); }
    Object.assign(alumno, nuevos);
    accion(plan, { tipo: "actualizar", col: "usuarios", id: alumno.id, cambios: nuevos, antes });
    return `MODIFICAR alumno "${antes.nombre ?? alumno.nombre}": ${Object.keys(nuevos).map((k) => `${k}: ${antes[k] ?? "(vacío)"} → ${nuevos[k]}`).join("; ")}`;
  },

  "clase.crear"(e, plan, op) {
    const alumnos = (Array.isArray(op.alumnos) ? op.alumnos : [op.alumno]).filter(Boolean).map((a) => buscarAlumno(e, a));
    if (!alumnos.length) throw new Error("clase.crear: indica al menos un alumno.");
    if (new Set(alumnos.map((a) => a.id)).size !== alumnos.length) throw new Error("clase.crear: un alumno está repetido.");
    const pista = buscarPista(e, op.pista);
    if (!fechaValida(op.fecha)) throw new Error(`Fecha inválida "${op.fecha}" (usa AAAA-MM-DD).`);
    if (!HORAS_RESERVA.includes(op.hora)) throw new Error(`Hora "${op.hora}" inválida. Opciones: ${HORAS_RESERVA.join(", ")}.`);
    if (!TIPOS.includes(op.tipoClase)) throw new Error(`tipoClase "${op.tipoClase}" inválido. Opciones: ${TIPOS.join(" | ")}.`);
    const modalidad = op.modalidad || (alumnos.length > 1 ? "Grupal (2-4 personas)" : "Particular");
    if (!MODALIDADES.includes(modalidad)) throw new Error(`Modalidad "${modalidad}" inválida. Opciones: ${MODALIDADES.join(" | ")}.`);
    const duracionMin = Number(op.duracionMin) || 90;
    if (!DURACIONES_CLASE.includes(duracionMin)) throw new Error(`duracionMin ${duracionMin} inválida. Opciones: ${DURACIONES_CLASE.join(", ")}.`);
    const pistaNombre = `${pista.nombre} — ${pista.distrito}`;
    const avisos = [];
    if (pista.estadoPista === "Bloqueada") avisos.push("la pista está Bloqueada para clases");
    let canchaBeelup = null;
    if (esPistaBeelup(pistaNombre)) {
      canchaBeelup = String(op.canchaBeelup || "2");
      if (!CANCHAS_BEELUP.includes(canchaBeelup)) throw new Error(`canchaBeelup "${canchaBeelup}" inválida (${CANCHAS_BEELUP.join(", ")}).`);
    }
    const total = op.costoCanchaTotal === undefined || op.costoCanchaTotal === null ? null : Number(op.costoCanchaTotal);
    if (total !== null && !(total >= 0)) throw new Error("costoCanchaTotal inválido.");
    const costoPorAlumno = total === null ? null : total / alumnos.length;
    const monto = op.monto === undefined ? PRECIOS_CLASE_SUELTA[modalidad] : Number(op.monto);
    if (!(monto >= 0)) throw new Error("monto inválido.");
    const lineas = [];
    for (const alumno of alumnos) {
      const dup = e.reservas.find((r) => r.alumnoId === alumno.id && r.pistaId === pista.id && r.fecha === op.fecha && r.hora === op.hora && r.estado !== "cancelada" && r.estado !== "rechazada");
      if (dup) throw new Error(`${alumno.nombre} ya tiene esa clase cargada (${fechaCorta(op.fecha)} ${op.hora}, ${pista.nombre}). Usa clase.modificar.`);
      const datos = {
        alumnoId: alumno.id, alumnoNombre: alumno.nombre, alumnoTelefono: alumno.telefono || "",
        profesorId: e.profesor.id, profesorNombre: e.profesor.nombre,
        tipoClase: op.tipoClase, pistaId: pista.id, pistaNombre, fecha: op.fecha, hora: op.hora, estado: "confirmada",
        modalidad, duracionMin, creadoEn: SERVER_TS
      };
      if (canchaBeelup) datos.canchaBeelup = canchaBeelup;
      let cobro;
      const usarPaquete = (op.paquete ?? "auto") !== "ninguno";
      const activos = usarPaquete ? paquetesActivos(e, alumno.id) : [];
      if (activos.length && esProgramaRegular(op.tipoClase)) {
        const p = activos[0];
        const antes = p.clasesUsadas || 0;
        p.clasesUsadas = Math.min(p.clasesTotales, antes + 1);
        datos.montoCobrado = null; datos.paqueteId = p.id;
        accion(plan, { tipo: "actualizar", col: "paquetes", id: p.id, cambios: { clasesUsadas: p.clasesUsadas }, antes: { clasesUsadas: antes } });
        cobro = `usa su paquete "${p.tipo}" (${antes}/${p.clasesTotales} → ${p.clasesUsadas}/${p.clasesTotales})`;
      } else {
        datos.montoCobrado = monto;
        cobro = `cobro suelto ${soles(monto)}`;
        if (activos.length && !esProgramaRegular(op.tipoClase)) avisos.push(`${alumno.nombre} tiene paquete pero "${op.tipoClase}" no descuenta de paquete`);
      }
      const id = idNuevo("reserva");
      e.reservas.push({ id, ...datos, creadoEn: undefined });
      accion(plan, { tipo: "crear", col: "reservas", id, datos });
      // El costo de cancha es PRIVADO: va aparte (costos_reservas), no en la reserva que ve el alumno.
      if (costoPorAlumno !== null) accion(plan, { tipo: "crear", col: "costos_reservas", id, datos: { costoCanchaPagado: costoPorAlumno, profesorId: e.profesor.id } });
      lineas.push(`${alumno.nombre} (${cobro})`);
    }
    return `CREAR clase ${op.tipoClase} · ${fechaCorta(op.fecha)} ${op.hora} · ${pistaNombre} · ${modalidad}${costoPorAlumno === null ? "" : " · cancha " + soles(costoPorAlumno) + " c/u"}\n      ${lineas.join("\n      ")}${avisos.length ? "\n      ⚠ " + avisos.join("; ") : ""}`;
  },

  "clase.modificar"(e, plan, op) {
    const { alumno, reserva } = buscarReserva(e, op);
    const c = op.cambios || {};
    const permitidos = ["fecha", "hora", "modalidad", "montoCobrado", "costoCanchaPagado", "estado", "duracionMin"];
    const raros = Object.keys(c).filter((k) => !permitidos.includes(k));
    if (raros.length) throw new Error(`No se puede cambiar: ${raros.join(", ")}. Permitido: ${permitidos.join(", ")}.`);
    if (!Object.keys(c).length) throw new Error("clase.modificar: no hay cambios.");
    const cambios = {}; const notas = []; const avisos = [];
    if (c.fecha !== undefined) { if (!fechaValida(c.fecha)) throw new Error(`Fecha inválida "${c.fecha}".`); cambios.fecha = c.fecha; }
    if (c.hora !== undefined) { if (!HORAS_RESERVA.includes(c.hora)) throw new Error(`Hora "${c.hora}" inválida.`); cambios.hora = c.hora; }
    if (c.modalidad !== undefined) { if (!MODALIDADES.includes(c.modalidad)) throw new Error(`Modalidad "${c.modalidad}" inválida.`); cambios.modalidad = c.modalidad; }
    if (c.duracionMin !== undefined) { if (!DURACIONES_CLASE.includes(Number(c.duracionMin))) throw new Error("duracionMin inválida."); cambios.duracionMin = Number(c.duracionMin); }
    if (c.montoCobrado !== undefined) {
      if (reserva.paqueteId) throw new Error(`${alumno.nombre}: esa clase ya está cobrada dentro de un paquete; no tiene monto aparte.`);
      if (!(Number(c.montoCobrado) >= 0)) throw new Error("montoCobrado inválido.");
      cambios.montoCobrado = Number(c.montoCobrado);
    }
    let costoNuevo; // undefined = no se toca
    if (c.costoCanchaPagado !== undefined) {
      costoNuevo = c.costoCanchaPagado === null ? null : Number(c.costoCanchaPagado);
      if (costoNuevo !== null && !(costoNuevo >= 0)) throw new Error("costoCanchaPagado inválido.");
      if (typeof reserva.costoCanchaPagado === "number") cambios.costoCanchaPagado = null; // limpia el dato viejo que ve el alumno
    }
    if (c.estado !== undefined) {
      if (!["confirmada", "cancelada"].includes(c.estado)) throw new Error('estado debe ser "confirmada" o "cancelada".');
      cambios.estado = c.estado;
    }
    if ((cambios.fecha || cambios.hora) && (cambios.fecha ?? reserva.fecha) + (cambios.hora ?? reserva.hora) !== reserva.fecha + reserva.hora) {
      const choque = e.reservas.find((r) => r.id !== reserva.id && r.alumnoId === alumno.id && r.pistaId === reserva.pistaId && r.fecha === (cambios.fecha ?? reserva.fecha) && r.hora === (cambios.hora ?? reserva.hora) && r.estado !== "cancelada" && r.estado !== "rechazada");
      if (choque) throw new Error(`${alumno.nombre} ya tiene una clase en esa fecha y hora.`);
      if (reserva.videoUrl) avisos.push("tiene video de Beelup de la hora original");
      if (reserva.grupoId) avisos.push("viene de un Grupo fijo: puede volver a generarse en su fecha original");
    }
    const antes = {}; Object.keys(cambios).forEach((k) => { antes[k] = reserva[k] ?? null; });
    if (Object.keys(cambios).length) accion(plan, { tipo: "actualizar", col: "reservas", id: reserva.id, cambios, antes });
    if (costoNuevo !== undefined) {
      if (costoNuevo === null) accion(plan, { tipo: "borrar", col: "costos_reservas", id: reserva.id, antes: {} });
      else accion(plan, { tipo: "crear", col: "costos_reservas", id: reserva.id, datos: { costoCanchaPagado: costoNuevo, profesorId: e.profesor.id } });
      notas.push(`costo de cancha (privado) → ${costoNuevo === null ? "(vacío)" : soles(costoNuevo)}`);
    }
    if (cambios.estado === "cancelada" && reserva.estado !== "cancelada" && reserva.paqueteId) {
      devolverClaseAlPaquete(e, plan, reserva, notas);
      accion(plan, { tipo: "actualizar", col: "reservas", id: reserva.id, cambios: { paqueteId: null }, antes: { paqueteId: reserva.paqueteId } });
      reserva.paqueteId = null;
    }
    Object.assign(reserva, cambios);
    return `MODIFICAR clase de ${alumno.nombre} (${fechaCorta(antes.fecha ?? reserva.fecha)} ${antes.hora ?? reserva.hora}): ${[...Object.keys(cambios).filter((k) => k !== "costoCanchaPagado").map((k) => `${k}: ${antes[k] ?? "(vacío)"} → ${cambios[k]}`), ...notas].join("; ")}${avisos.length ? "\n      ⚠ " + avisos.join("; ") : ""}`;
  },

  "clase.borrar"(e, plan, op) {
    const { alumno, reserva } = buscarReserva(e, op);
    const notas = [];
    devolverClaseAlPaquete(e, plan, reserva, notas);
    accion(plan, { tipo: "borrar", col: "reservas", id: reserva.id, antes: { ...reserva } });
    accion(plan, { tipo: "borrar", col: "costos_reservas", id: reserva.id, antes: {} });
    e.reservas = e.reservas.filter((r) => r.id !== reserva.id);
    return `BORRAR clase de ${alumno.nombre} · ${fechaCorta(reserva.fecha)} ${reserva.hora} · ${reserva.pistaNombre}${notas.length ? " → " + notas.join("; ") : ""}`;
  },

  "clase.cerrar"(e, plan, op) {
    const { alumno, reserva } = buscarReserva(e, op, { soloConfirmadas: true });
    const asistio = op.asistio !== false;
    const nivelTrabajado = op.nivelTrabajado || NIVELES[0];
    if (!NIVELES.includes(nivelTrabajado)) throw new Error(`nivelTrabajado "${nivelTrabajado}" inválido. Opciones: ${NIVELES.join(", ")}.`);
    const feedback = { nivelTrabajado, comentario: String(op.comentario || ""), siguienteObjetivo: String(op.siguienteObjetivo || ""), temas: op.temas || [], materialUrl: String(op.materialUrl || "") };
    const cambios = { registrada: true, asistio, feedback };
    accion(plan, { tipo: "actualizar", col: "reservas", id: reserva.id, cambios, antes: { registrada: reserva.registrada ?? false, asistio: reserva.asistio ?? null } });
    Object.assign(reserva, cambios);
    let extra = "";
    // Si NO asistió: no se cuenta ni se cobra -> se devuelve la clase al paquete.
    if (!asistio && reserva.paqueteId) {
      const idPaq = reserva.paqueteId;
      const notasNoShow = [];
      devolverClaseAlPaquete(e, plan, reserva, notasNoShow);
      accion(plan, { tipo: "actualizar", col: "reservas", id: reserva.id, cambios: { paqueteId: null, paqueteDevuelto: idPaq }, antes: { paqueteId: idPaq, paqueteDevuelto: reserva.paqueteDevuelto ?? null } });
      reserva.paqueteId = null; reserva.paqueteDevuelto = idPaq;
      extra = "; " + notasNoShow.join("; ");
    }
    // Corrección "sí asistió" de una clase que se había devuelto: se vuelve a descontar.
    if (asistio && reserva.paqueteDevuelto && !reserva.paqueteId) {
      const p = e.paquetes.find((x) => x.id === reserva.paqueteDevuelto);
      const idPaq = reserva.paqueteDevuelto;
      if (p && (p.clasesUsadas || 0) < p.clasesTotales) {
        const antes = p.clasesUsadas || 0;
        p.clasesUsadas = antes + 1;
        accion(plan, { tipo: "actualizar", col: "paquetes", id: p.id, cambios: { clasesUsadas: p.clasesUsadas }, antes: { clasesUsadas: antes } });
        accion(plan, { tipo: "actualizar", col: "reservas", id: reserva.id, cambios: { paqueteId: p.id, paqueteDevuelto: null }, antes: { paqueteId: null, paqueteDevuelto: idPaq } });
        reserva.paqueteId = p.id; reserva.paqueteDevuelto = null;
        extra = `; vuelve a descontar de su paquete "${p.tipo}" (${antes}/${p.clasesTotales} → ${p.clasesUsadas}/${p.clasesTotales})`;
      }
    }
    if (asistio && reserva.grupoId && !reserva.paqueteId && esProgramaRegular(reserva.tipoClase)) {
      const activos = paquetesActivos(e, alumno.id);
      if (activos.length) {
        const p = activos[0]; const antes = p.clasesUsadas || 0;
        p.clasesUsadas = antes + 1;
        accion(plan, { tipo: "actualizar", col: "paquetes", id: p.id, cambios: { clasesUsadas: p.clasesUsadas }, antes: { clasesUsadas: antes } });
        accion(plan, { tipo: "actualizar", col: "reservas", id: reserva.id, cambios: { paqueteId: p.id, montoCobrado: null }, antes: { paqueteId: null, montoCobrado: reserva.montoCobrado ?? null } });
        reserva.paqueteId = p.id; reserva.montoCobrado = null;
        extra += `; descuenta de su paquete "${p.tipo}" (${antes}/${p.clasesTotales} → ${p.clasesUsadas}/${p.clasesTotales})`;
      }
    }
    return `CERRAR clase de ${alumno.nombre} · ${fechaCorta(reserva.fecha)} ${reserva.hora} · ${asistio ? "asistió" : "NO asistió"}${op.comentario ? ` · "${op.comentario}"` : ""}${extra}${op.nivelTrabajado ? "" : "  (⚠ nivel trabajado por defecto: " + nivelTrabajado + ")"}`;
  }
};

// Pestaña del panel a la que lleva el pendiente.
function destinoDeOp(nombreOp) {
  return String(nombreOp).startsWith("alumno.") ? "alumnos" : "clases";
}

// ---------- Planificar un lote ----------
export function planificar(estadoReal, lote) {
  let e = clonarEstado(estadoReal);
  const plan = { acciones: [], lineas: [], errores: [], pendientes: [] };
  (Array.isArray(lote) ? lote : lote.operaciones || []).forEach((op, i) => {
    const etiqueta = `#${i + 1} ${op.op}`;
    const fn = OPS[op.op];
    if (!fn) { plan.errores.push(`${etiqueta}: operación desconocida. Disponibles: ${Object.keys(OPS).join(", ")}.`); return; }
    const antesAcciones = plan.acciones.length;
    const copia = clonarEstado(e);
    try {
      const linea = `${etiqueta}: ${fn(e, plan, op)}`;
      plan.lineas.push(linea);
      // Pendientes para que Gabriel avance desde el panel: los que pide el lote
      // (op.pendiente) y los avisos (⚠) que dejó la simulación.
      if (op.pendiente) {
        const p = typeof op.pendiente === "string" ? { titulo: op.pendiente } : op.pendiente;
        plan.pendientes.push({ titulo: String(p.titulo || "Pendiente del asistente").slice(0, 140), detalle: String(p.detalle || linea).slice(0, 400), destino: p.destino || destinoDeOp(op.op) });
      }
      const aviso = linea.match(/⚠ ([^)\n]+)/);
      if (aviso) plan.pendientes.push({ titulo: `Revisar: ${aviso[1].trim()}`.slice(0, 140), detalle: linea.split("\n")[0].slice(0, 400), destino: destinoDeOp(op.op) });
    } catch (err) {
      // Una operación con error no deja nada a medias: ni acciones ni cambios en la copia de trabajo.
      plan.acciones.length = antesAcciones;
      e = copia;
      plan.errores.push(`${etiqueta}: ${err.message}`);
    }
  });
  plan.borra = plan.acciones.some((a) => a.tipo === "borrar");
  return plan;
}

export const OPERACIONES = Object.keys(OPS);
