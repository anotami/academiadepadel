// Constantes compartidas por todo el portal (login, alumno, profesor, setup).

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const FRANJAS = [
  "Mañana (6:00–10:00)",
  "Mediodía (10:00–14:00)",
  "Tarde (14:00–18:00)",
  "Noche (18:00–22:00)"
];

// Horas sueltas para agendar una clase puntual (reserva con fecha exacta).
export const HORAS_RESERVA = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00"
];

export function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}/${y}`;
}

// Tipos de clase ofrecidos, tomados directamente de index.html (secciones
// #programas, #clinicas y #ofertas) para que el portal no invente oferta nueva.
export const TIPOS_CLASE = [
  {
    grupo: "Programas regulares",
    opciones: ["Junior (8-15 años)", "Adultos — Mujeres", "Adultos — Ejecutivos"]
  },
  {
    grupo: "Clínicas de Un Solo Golpe · Nivel inicial",
    opciones: ["Mejora tu derecha", "Domina el saque", "Perfecciona tu volea", "Suma el revés"]
  },
  {
    grupo: "Clínicas de Un Solo Golpe · Nivel intermedio",
    opciones: ["Domina la salida de pared", "Deja de chocar con tu compañero", "La bandeja en 1 hora"]
  },
  {
    grupo: "Otros",
    opciones: ["Jornada gratuita ¡Conociendo el Pádel!", "Tour de Pádel"]
  }
];

// Día de la semana (en español, como en DIAS) a partir de una fecha "YYYY-MM-DD".
export function diaDeSemana(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay(); // 0 = domingo ... 6 = sábado
  return DIAS[(jsDay + 6) % 7]; // reordena para que 0 = Lunes ... 6 = Domingo
}

// Convierte una hora suelta ("06:00".."21:00") en su franja de disponibilidad.
export function horaAFranja(hora) {
  const h = Number(hora.split(":")[0]);
  if (h < 10) return FRANJAS[0];
  if (h < 14) return FRANJAS[1];
  if (h < 18) return FRANJAS[2];
  return FRANJAS[3];
}

export function estaDisponible(disponibilidad, dia, franja) {
  return (disponibilidad || []).some((d) => d.dia === dia && d.franja === franja);
}

// Niveles de la metodología del sitio (sección #metodologia de index.html).
export const NIVELES = ["Iniciación", "Intermedio", "Consolidación"];

// ¿La fecha "YYYY-MM-DD" ya pasó (antes de hoy, no cuenta hoy)?
export function fechaYaPaso(fechaStr) {
  return fechaStr < new Date().toISOString().slice(0, 10);
}
