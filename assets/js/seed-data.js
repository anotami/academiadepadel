// Datos de ejemplo para poblar el portal la primera vez (ver setup.html).
// Las pistas son canchas de pádel reales de Lima (datos recogidos en oct. 2026 por el dueño
// del sitio); confirma precios y disponibilidad real con cada club antes de coordinar una
// clase ahí, y actualiza aquí si algo cambia.

import { DIAS, FRANJAS } from "./portal-common.js?v=2";

// Rangos [horaInicio, horaFin) de cada franja de portal-common.js, en ese mismo orden.
const RANGOS_FRANJA = [
  [6, 10],
  [10, 14],
  [14, 18],
  [18, 22]
];

function aMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Franjas que se solapan con [horaInicio, horaFin). Un cierre a medianoche o pasada
// (23:00, 23:59...) sigue contando como disponible hasta el final de la franja Noche.
function franjasEnRango(horaInicio, horaFin) {
  const ini = aMinutos(horaInicio);
  const fin = horaFin <= horaInicio ? 24 * 60 : aMinutos(horaFin);
  return FRANJAS.filter((_, i) => ini < RANGOS_FRANJA[i][1] * 60 && fin > RANGOS_FRANJA[i][0] * 60);
}

// "Lunes a Viernes" -> [Lunes, Martes, Miércoles, Jueves, Viernes], usando el orden de DIAS.
function rangoDias(texto) {
  const [desde, hasta] = texto.split(" a ").map((s) => s.trim());
  const i = DIAS.indexOf(desde);
  const j = DIAS.indexOf(hasta);
  return DIAS.slice(i, j + 1);
}

function extraerDistrito(direccion) {
  const partes = direccion.split(",").map((s) => s.trim());
  const ultimo = partes[partes.length - 1];
  return ultimo.toLowerCase() === "lima" && partes.length > 1 ? partes[partes.length - 2] : ultimo;
}

// Tabla fuente: una fila por pista, tal como se recopiló. nombre | cancha | dias | horaInicio |
// horaFin | estadoPista | telefono | direccion | web | precio | notas (opcional).
const PISTAS_RAW = [
  ["Peru Padel Center - Mendiburu", "Cancha 1 (Panorámica)", "Lunes a Viernes", "06:00", "22:30", "Habilitada", "+51 934 377 679", "Av. Gral. Mendiburu 671, Miraflores", "perupadelcenter.com | @perupadelcenter", "S/ 100 - S/ 140 / hr"],
  ["One Padel - Centro Naval", "Cancha 1", "Lunes a Domingo", "06:00", "22:00", "Habilitada", "+51 980 003 317", "Av. San Luis 2347, San Borja", "onepadel-pe.matchpoint.com.es | @onepadelperu", "S/ 100 - S/ 130 / hr"],
  ["Inside Court Padel", "Cancha Central", "Lunes a Domingo", "07:00", "23:00", "Reservada", "+51 964 290 667", "Ca. Viña del Mar 235, Sol de La Molina, La Molina", "@insidecourtpadel", "S/ 90 - S/ 120 / hr"],
  ["Club Pádel Tenis Villa", "Cancha 1", "Lunes a Sábado", "07:00", "22:00", "Habilitada", "+51 905 465 088", "Av. Hernando de Lavalle s/n, Chorrillos", "@clubpadeltenisvilla", "S/ 80 - S/ 110 / hr"],
  ["IGMA Padel Center", "Cancha 2", "Lunes a Domingo", "06:00", "23:00", "Bloqueada", "+51 981 334 560", "Yoy Lima Box Park, Santiago de Surco", "igmapadel-pe.matchpoint.com.es", "S/ 90 - S/ 130 / hr"],
  ["One Padel - Manuel Olguín", "Cancha 2", "Lunes a Domingo", "06:00", "22:30", "Habilitada", "+51 959 881 552", "Av. Manuel Olguín 245, Santiago de Surco", "onepadel-pe.matchpoint.com.es | @onepadelperu", "S/ 100 - S/ 140 / hr"],
  ["Más+ Padel Perú", "Cancha Panorámica", "Lunes a Domingo", "07:00", "23:00", "Habilitada", "+51 940 123 456", "Av. La Marina cdra. 25, San Miguel", "maspadelperu.com | @maspadelperu", "S/ 80 - S/ 120 / hr"],
  ["Eureka Sports - El Polo", "Cancha 1", "Lunes a Domingo", "07:00", "23:00", "Habilitada", "+51 982 405 663", "Jr. El Cortijo esq. Av. El Derby y Jr. El Polo, Santiago de Surco", "eurekasports.pe | @eurekasportspe", "S/ 90 - S/ 130 / hr"],
  ["Cortijo Terraza Club", "Cancha 1", "Lunes a Domingo", "06:00", "22:00", "Habilitada", "+51 981 123 789", "Jr. Ernesto López Mindreau 132, Santiago de Surco", "@cortijoterrazaclub", "S/ 80 - S/ 120 / hr"],
  ["Club Pádel Lima (La Once)", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 987 727 200", "Av. Tomás Marsano 630 - A, Surquillo", "laonce.com.pe | @clubpadellima", "S/ 90 - S/ 130 / hr", "Sede principal de academiadepadel.pe."],
  ["Bohemia Pádel Club", "Cancha 1", "Lunes a Domingo", "06:00", "22:30", "Habilitada", "+51 975 613 680", "Av. San Borja Sur 1228, San Borja", "@bohemiapadelclub", "S/ 100 - S/ 140 / hr"],
  ["Top Padel La Molina", "Cancha 1", "Lunes a Domingo", "06:00", "23:59", "Habilitada", "+51 940 513 952", "Av. Melgarejo 147, La Molina", "toppadel-pe.matchpoint.com.es | @toppadelperu", "S/ 90 - S/ 130 / hr"],
  ["Peru Padel Center - Benavides", "Cancha 1 (Indoor)", "Lunes a Domingo", "06:00", "22:30", "Habilitada", "+51 957 033 544", "Av. Alfredo Benavides 347 (Expocentro), Miraflores", "perupadelcenter.com | @perupadelcenter", "S/ 100 - S/ 140 / hr"],
  ["Club adidas X3", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 913 861 726", "Av. Paseo de la República 5840, Miraflores", "@clubadidasx3", "S/ 100 - S/ 140 / hr"],
  ["One Padel - El Trigal", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 921 633 793", "Ca. Los Antares 298, Santiago de Surco", "onepadel-pe.matchpoint.com.es | @onepadelperu", "S/ 100 - S/ 140 / hr"],
  ["One Padel - Domingo Orué", "Cancha 1", "Lunes a Domingo", "06:00", "23:30", "Habilitada", "+51 916 994 252", "Pje. Recabarraca s/n, Surquillo", "onepadel-pe.matchpoint.com.es | @onepadelperu", "S/ 100 - S/ 140 / hr"],
  ["Padel Arena", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 994 123 890", "Santiago de Surco, Lima", "@padelarenaperu", "S/ 90 - S/ 130 / hr"],
  ["Pro Padel Peru", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 981 456 789", "Jr. Bolognesi 498, Magdalena del Mar", "propadel.pe | @propadelperu", "S/ 90 - S/ 130 / hr"],
  ["Lima Cricket & Football Club", "Cancha 1", "Lunes a Domingo", "07:00", "22:30", "Habilitada", "+51 970 812 345", "Ca. Justo Vigil 200, Magdalena del Mar", "@limacricket1859", "S/ 100 - S/ 140 / hr"],
  ["XPadel Lawn Tennis", "Cancha 1", "Lunes a Domingo", "06:30", "22:30", "Habilitada", "+51 984 567 890", "Av. República de Chile 254, Jesús María", "clublawntennis.pe | @xpadelperu", "S/ 90 - S/ 130 / hr"],
  ["Country Club La Planicie", "Cancha 1", "Lunes a Domingo", "07:00", "22:00", "Habilitada", "+51 998 765 432", "Av. Las Bellotas 340, La Planicie, La Molina", "cclaplanicie.org | @cclaplanicie", "S/ 100 - S/ 140 / hr"],
  ["Mad Padel Indoor", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 922 456 789", "Límite Surco - Barranco, Lima", "madpadel.pe | @madpadelpe", "S/ 90 - S/ 130 / hr"],
  ["Centro Español del Perú", "Cancha 1", "Lunes a Domingo", "07:00", "22:30", "Habilitada", "+51 948 231 172", "Av. Gral. Felipe Salaverry 1910, Jesús María", "centroespanolperu.pe | @centroespanolperu", "S/ 90 - S/ 120 / hr"],
  ["Peru Padel Center - Villa", "Cancha 1 (Panorámica)", "Lunes a Domingo", "06:00", "22:30", "Habilitada", "+51 934 377 679", "Av. Alameda del Premio Real Mz. D-01 Lt. 07, Chorrillos", "perupadelcenter.com | @perupadelcenter", "S/ 100 - S/ 140 / hr"],
  ["Club Tennis Las Terrazas Miraflores", "Cancha 1", "Lunes a Domingo", "06:30", "22:30", "Habilitada", "+51 981 234 567", "Malecón 28 de Julio 390, Miraflores", "clubterrazas.com.pe | @clubterrazas", "S/ 90 - S/ 130 / hr"],
  ["Jockey Club del Perú", "Cancha 1", "Lunes a Domingo", "07:00", "22:00", "Habilitada", "+51 946 789 123", "Av. El Derby s/n, Santiago de Surco", "jockeyclub.com.pe | @jockeyclubperu", "S/ 90 - S/ 130 / hr"],
  ["PPA Sports - Magdalena", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 982 765 432", "Jr. Diego Ferré 240, Magdalena del Mar", "ppasports.pe | @ppasportsperu", "S/ 90 - S/ 130 / hr"],
  ["Club de Regatas \"Lima\" - Filial Villa Deportiva", "Cancha 1", "Lunes a Domingo", "06:30", "22:00", "Habilitada", "+51 977 123 456", "Carretera Panamericana Sur Km 20.4, Chorrillos", "clubregatas.org.pe | @clubderegataslima", "S/ 80 - S/ 120 / hr"],
  ["Rinconada Country Club", "Cancha 1", "Lunes a Domingo", "06:30", "22:00", "Habilitada", "+51 983 210 987", "Av. Manuel Prado Ugarteche 901, La Molina", "rinconadacountryclub.org.pe | @rinconadacc", "S/ 90 - S/ 130 / hr"],
  ["Real Club de Lima", "Cancha 1", "Lunes a Domingo", "06:30", "22:30", "Habilitada", "+51 991 345 678", "Av. Los Eucaliptos 500, San Isidro", "realclubdelima.org.pe | @realclubdelima", "S/ 100 - S/ 140 / hr"],
  ["Peru Padel Center - Asia", "Cancha 1 (Verano / Panorámica)", "Jueves a Domingo", "07:00", "23:00", "Habilitada", "+51 934 377 679", "Km 97.5 Panamericana Sur, Boulevard de Asia", "perupadelcenter.com | @perupadelcenter", "S/ 110 - S/ 150 / hr"],
  ["Inka Padel - JBM Complex", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 985 678 901", "Av. Los Héroes 780, San Juan de Miraflores", "inkapadel.pe | @inkapadelperu", "S/ 80 - S/ 110 / hr"],
  ["Eureka Sports - San Borja", "Cancha 1", "Lunes a Domingo", "07:30", "22:30", "Habilitada", "+51 982 405 663", "Av. Del Aire 150, San Borja", "eurekasports.pe | @eurekasportspe", "S/ 90 - S/ 130 / hr"],
  ["Mad Padel - La Molina", "Cancha 1", "Lunes a Domingo", "06:00", "23:00", "Habilitada", "+51 950 303 330", "La Molina, Lima", "madpadel.pe | @madpadelpe", "S/ 90 - S/ 130 / hr"]
];

export const PISTAS_SEED = PISTAS_RAW.map(
  ([nombre, cancha, dias, horaInicio, horaFin, estadoPista, telefono, direccion, web, precio, notas]) => ({
    nombre,
    cancha,
    distrito: extraerDistrito(direccion),
    direccion,
    telefono,
    horario: `${dias}, ${horaInicio} – ${horaFin}`,
    estadoPista,
    web,
    precio,
    notas: notas || "",
    fuente: "Recopilado por el dueño del sitio (oct. 2026)",
    disponibilidad: disponibilidadDesde(dias, horaInicio, horaFin)
  })
);

function disponibilidadDesde(dias, horaInicio, horaFin) {
  const diasLista = rangoDias(dias);
  const franjas = franjasEnRango(horaInicio, horaFin);
  return diasLista.flatMap((dia) => franjas.map((franja) => ({ dia, franja })));
}

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
