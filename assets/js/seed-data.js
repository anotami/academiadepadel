// Datos de ejemplo para poblar el portal la primera vez (ver setup.html).
// Las pistas son canchas de pádel reales de Lima (datos públicos recogidos en oct. 2026);
// confirma precios y disponibilidad real con cada club antes de coordinar una clase ahí.

import { DIAS, FRANJAS } from "./portal-common.js";

const TODOS_LOS_DIAS_TODAS_LAS_FRANJAS = DIAS.flatMap((dia) =>
  FRANJAS.map((franja) => ({ dia, franja }))
);

function disponibilidadDias(dias, franjas = FRANJAS) {
  return dias.flatMap((dia) => franjas.map((franja) => ({ dia, franja })));
}

export const PISTAS_SEED = [
  {
    nombre: "La Once — Complejo Deportivo",
    distrito: "Surquillo",
    direccion: "Av. Tomás Marsano 630, Surquillo, Lima",
    telefono: "+51 957 085 531",
    horario: "Lunes a domingo, 6:00 am – 11:00 pm",
    notas: "Sede principal de academiadepadel.pe.",
    fuente: "Sede propia",
    disponibilidad: TODOS_LOS_DIAS_TODAS_LAS_FRANJAS
  },
  {
    nombre: "Peru Padel Center — Mendiburu",
    distrito: "Miraflores",
    direccion: "Av. Gral. Mendiburu 671, Miraflores, Lima 15074",
    telefono: "+51 934 377 679",
    horario: "Lunes a viernes 6:00 am – 9:00 pm · Sábado 6:30 am – 6:00 pm · Domingo cerrado",
    notas: "",
    fuente: "limapadel.pe / perupadelcenter-pe.matchpoint.com.es",
    disponibilidad: [
      ...disponibilidadDias(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]),
      ...disponibilidadDias(["Sábado"], [FRANJAS[0], FRANJAS[1], FRANJAS[2]])
    ]
  },
  {
    nombre: "One Padel",
    distrito: "Santiago de Surco",
    direccion: "Av. Manuel Olguín 245, Santiago de Surco 15023",
    telefono: "+51 959 881 552",
    horario: "Lunes a domingo, 6:00 am – 10:30 pm",
    notas: "",
    fuente: "haycancha.com",
    disponibilidad: TODOS_LOS_DIAS_TODAS_LAS_FRANJAS
  },
  {
    nombre: "Bohemia Padel Club",
    distrito: "San Borja",
    direccion: "Av. San Borja Sur 1228, San Borja, Lima",
    telefono: "+51 975 613 680 (WhatsApp)",
    horario: "Lunes a domingo, 6:00 am – 10:30 pm",
    notas: "",
    fuente: "bohemiapadel.com",
    disponibilidad: TODOS_LOS_DIAS_TODAS_LAS_FRANJAS
  },
  {
    nombre: "Top Padel La Molina",
    distrito: "La Molina",
    direccion: "Av. Melgarejo 147, La Molina 15026",
    telefono: "No publicado — confirmar al reservar",
    horario: "Por confirmar con el club",
    notas: "",
    fuente: "limapadel.pe",
    disponibilidad: []
  },
  {
    nombre: "Club X3",
    distrito: "Miraflores",
    direccion: "Av. Paseo de la República 5840, Miraflores, Lima",
    telefono: "No publicado — confirmar al reservar",
    horario: "Por confirmar con el club",
    notas: "",
    fuente: "limapadel.pe",
    disponibilidad: []
  }
];

export const PROFESOR_SEED = {
  email: "anotami@gmail.com",
  rol: "profesor",
  nombre: "Gabriel Pizarro",
  telefono: "+51 957 085 531",
  especialidad: "Adultos — ejecutivos y nivel inicial/intermedio",
  bio: "Fundador de academiadepadel.pe. Clases para adultos con foco en aprendizaje a tu ritmo, sin presión de competir.",
  disponibilidad: [
    { dia: "Lunes", franja: "Noche (18:00–22:00)" },
    { dia: "Martes", franja: "Noche (18:00–22:00)" },
    { dia: "Miércoles", franja: "Noche (18:00–22:00)" },
    { dia: "Jueves", franja: "Noche (18:00–22:00)" },
    { dia: "Viernes", franja: "Noche (18:00–22:00)" },
    { dia: "Sábado", franja: "Mañana (6:00–10:00)" },
    { dia: "Sábado", franja: "Mediodía (10:00–14:00)" }
  ]
};

export const ALUMNOS_SEED = [
  {
    email: "alumno1@academiadepadel.pe",
    rol: "alumno",
    nombre: "Valeria Ramos",
    telefono: "+51 999 111 222",
    edad: 34,
    nivel: "Inicial",
    programa: "Adultos — mujeres",
    disponibilidad: [
      { dia: "Martes", franja: "Noche (18:00–22:00)" },
      { dia: "Jueves", franja: "Noche (18:00–22:00)" },
      { dia: "Sábado", franja: "Mañana (6:00–10:00)" }
    ]
  },
  {
    email: "alumno2@academiadepadel.pe",
    rol: "alumno",
    nombre: "Diego Fernández",
    telefono: "+51 999 333 444",
    edad: 29,
    nivel: "Intermedio",
    programa: "Adultos — ejecutivos",
    disponibilidad: [
      { dia: "Lunes", franja: "Noche (18:00–22:00)" },
      { dia: "Miércoles", franja: "Noche (18:00–22:00)" },
      { dia: "Sábado", franja: "Mediodía (10:00–14:00)" }
    ]
  }
];
