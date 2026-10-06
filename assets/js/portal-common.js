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

export function claveDisponibilidad(dia, franja) {
  return `${dia}__${franja}`;
}

export function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}/${y}`;
}
