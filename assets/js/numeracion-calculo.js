// Cálculo puro de la numeración de clases (sin Firebase): se prueba con node.
export const formatoCodigo = (n) => "C-" + String(n).padStart(4, "0");
export const claveSesion = (r) => `${r.pistaId}|${r.fecha}|${r.hora}`;

const orden = (a, b) => (a.fecha || "").localeCompare(b.fecha || "") || (a.hora || "").localeCompare(b.hora || "")
  || ((a.creadoEn?.seconds ?? a.creadoEnSeg ?? 0) - (b.creadoEn?.seconds ?? b.creadoEnSeg ?? 0));

export function agruparSesiones(reservas) {
  const mapa = new Map();
  reservas.forEach((r) => { const k = claveSesion(r); (mapa.get(k) || mapa.set(k, []).get(k)).push(r); });
  return [...mapa.values()].sort((x, y) => orden(x[0], y[0]));
}

// Qué números recibirían las clases confirmadas que todavía no tienen. `desde` = primer número libre.
export function planNumerar(reservas, desde) {
  const confirmadas = reservas.filter((r) => r.estado === "confirmada");
  const sesiones = agruparSesiones(confirmadas);
  let n = desde; const asignaciones = []; // {sesion, claseNum, reservasSinNumero[]}
  for (const s of sesiones) {
    const conNum = [...new Set(s.filter((r) => Number.isInteger(r.claseNum)).map((r) => r.claseNum))];
    const sin = s.filter((r) => !Number.isInteger(r.claseNum));
    if (!sin.length) continue;
    const num = conNum.length ? conNum[0] : n++;
    asignaciones.push({ sesion: s, claseNum: num, reservasSinNumero: sin, nueva: !conNum.length });
  }
  return { asignaciones, cantidadNuevos: n - desde, siguiente: n };
}

// Revisión de cada clase: devuelve filas con sus problemas.
export function auditarClases(reservas, paquetesPorId = {}) {
  const sesiones = agruparSesiones(reservas.filter((r) => r.estado === "confirmada"));
  const porNumero = new Map();
  sesiones.forEach((s) => s.forEach((r) => { if (Number.isInteger(r.claseNum)) (porNumero.get(r.claseNum) || porNumero.set(r.claseNum, new Set()).get(r.claseNum)).add(claveSesion(r)); }));
  const filas = sesiones.map((s) => {
    const base = s[0]; const problemas = [];
    const nums = [...new Set(s.map((r) => r.claseNum).filter((x) => Number.isInteger(x)))];
    if (!nums.length) problemas.push("Sin número");
    if (nums.length > 1) problemas.push("Dos números en la misma clase");
    if (nums.length === 1 && porNumero.get(nums[0]).size > 1) problemas.push("Número repetido en otra clase");
    if (s.some((r) => !Number.isInteger(r.claseNum)) && nums.length) problemas.push("Algún alumno sin número");
    if (!base.pistaNombre) problemas.push("Sin sede");
    if (!base.tipoClase) problemas.push("Sin tipo de clase");
    const alumnos = s.map((r) => {
      let pago;
      if (r.paqueteId) pago = paquetesPorId[r.paqueteId] ? `Paquete ${paquetesPorId[r.paqueteId]}` : "Paquete";
      else if (typeof r.montoCobrado === "number") pago = `S/ ${r.montoCobrado}`;
      else { pago = "Sin pago"; }
      if (!r.alumnoNombre) problemas.push("Reserva sin alumno");
      return { nombre: r.alumnoNombre || "(sin alumno)", pago, sinPago: pago === "Sin pago" };
    });
    if (alumnos.some((a) => a.sinPago)) problemas.push("Sin pago cargado");
    if (s.length > 4) problemas.push("Más de 4 alumnos");
    return { num: nums[0] ?? null, codigo: nums.length ? formatoCodigo(nums[0]) : "—", fecha: base.fecha, hora: base.hora, sede: base.pistaNombre || "", tipo: base.tipoClase || "",
      alumnos, estadoCierre: base.registrada ? "Cerrada" : "Abierta", problemas: [...new Set(problemas)], reservaIds: s.map((r) => r.id) };
  });
  const numeros = [...porNumero.keys()].sort((a, b) => a - b);
  const huecos = [];
  for (let i = 1; i < numeros.length; i++) for (let k = numeros[i - 1] + 1; k < numeros[i]; k++) huecos.push(k);
  return { filas, huecos, minimo: numeros[0] ?? null, maximo: numeros[numeros.length - 1] ?? null, total: filas.length, conProblemas: filas.filter((f) => f.problemas.length).length };
}

