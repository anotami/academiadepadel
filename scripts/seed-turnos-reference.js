// Referencia del script que se le entregó a Gabriel para correr UNA VEZ en su
// carpeta local de admin (junto a clave.json), para cargar de una sola vez
// los turnos de "¿Eres nuevo en el pádel?" armados a partir de su
// disponibilidad real (pestaña "Mis datos" de profesor.html).
// No se ejecuta como parte del sitio — queda acá solo como registro.
//
// Crea 3 turnos regulares (2 activos de entrada, 1 guardado sin publicar,
// para abrir según demanda) + 6 clínicas de iniciación gratuitas, una por
// mes, en el primer sábado de cada uno de los próximos 6 meses.
//
// A propósito NO hay un turno "2x por semana": con un solo profesor, cada
// bloque de la semana solo puede pertenecer a UN turno (no puedes dictar
// dos grupos a la misma hora). "2 veces por semana" simplemente pasa
// cuando alguien se anota a Martes Y a Viernes por separado — no necesita
// ser un turno aparte, y si lo fuera, competiría por el mismo horario que
// esos dos turnos sueltos.
//
// OJO con el choque de horario: el turno regular de fin de semana se puso
// en DOMINGO 6-8am (no sábado) a propósito, para no competir por el mismo
// bloque que la clínica mensual (sábado 6-8am, primera semana del mes).
//
// No borra turnos existentes — si corres esto dos veces, duplica. Revisa
// la lista de turnos en profesor.html antes de correr si no es la primera vez.
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const app = initializeApp({ credential: cert(require("./clave.json")) });
const db = getFirestore(app);

const TURNOS_REGULARES = [
  {
    nombre: "Martes · Nivel Inicial",
    horarioTexto: "Martes, 6:00 – 8:00 pm",
    fecha: null,
    cupoTotal: 4,
    tipo: "regular",
    activo: true
  },
  {
    nombre: "Viernes · Nivel Intermedio",
    horarioTexto: "Viernes, 6:00 – 8:00 pm",
    fecha: null,
    cupoTotal: 4,
    tipo: "regular",
    activo: false
  },
  {
    nombre: "Domingo · Fin de Semana · Todo nivel",
    horarioTexto: "Domingo, 6:00 – 8:00 am",
    fecha: null,
    cupoTotal: 4,
    tipo: "regular",
    activo: true
  }
];

// Primer sábado de cada mes, a partir del próximo mes calendario completo.
function primerSabado(year, monthIndex0) {
  const d = new Date(year, monthIndex0, 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function clinicasProximos6Meses() {
  const hoy = new Date();
  let year = hoy.getFullYear();
  let mes = hoy.getMonth() + 1; // próximo mes calendario completo
  const clinicas = [];
  for (let i = 0; i < 6; i++) {
    if (mes > 11) { mes = 0; year++; }
    const fecha = primerSabado(year, mes);
    clinicas.push({
      nombre: `Clínica de Iniciación Gratuita · ${MESES[mes]} ${year}`,
      horarioTexto: "Sábado, 6:00 – 8:00 am",
      fecha,
      cupoTotal: 4,
      tipo: "clinica-gratuita",
      activo: true
    });
    mes++;
  }
  return clinicas;
}

(async () => {
  const todos = [...TURNOS_REGULARES, ...clinicasProximos6Meses()];
  for (const t of todos) {
    await db.collection("turnos_grupales").add({ ...t, cupoUsado: 0, creadoEn: FieldValue.serverTimestamp() });
    console.log(`✔ ${t.nombre}${t.fecha ? " (" + t.fecha + ")" : ""} — ${t.activo ? "activo" : "guardado, sin publicar"}`);
  }
  console.log(`\nListo. ${todos.length} turnos creados.`);
  process.exit(0);
})();
