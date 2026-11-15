// Historias de Instagram para conseguir alumnos: un tema distinto cada día, 3 láminas por día
// (gancho → detalle → llamado a la acción con el link a la disponibilidad).
// Todo lo que se dice sale de datos reales del sitio (sedes, precios, ofertas). Para cambiar
// precios, sedes o textos, se edita ESTE archivo; los horarios de la semana se editan en la
// propia página historias.html (se guardan en el navegador).
import { diasEntreFechas, hoyLima } from "./portal-common.js?v=30";

export const LINK_DISPONIBILIDAD = "https://academiadepadel.pe/disponibilidad.html";
export const LINK_VISIBLE = "academiadepadel.pe/disponibilidad";
export const SITIO = "academiadepadel.pe";

// Reglas de la cuenta (no se cambian sin avisar): sin precios ni promociones, sin emojis de relleno.
// Horarios por defecto de "esta semana" (nivel inicial). Se editan en historias.html.
export const HORARIOS_DEFECTO = [
  "Lunes 7:00 – 8:00",
  "Viernes 7:00 – 8:00",
  "Viernes 16:00",
  "Sábado 7:00 – 10:00",
  "Domingo 7:00 – 10:00"
];

export const SEDES = [
  { id: "x3", nombre: "Club adidas X3", zona: "Miraflores", horario: "Todos los días", nota: "Nuestra sede principal." },
  { id: "laonce", nombre: "La Once (Club Pádel Lima)", zona: "Surquillo", horario: "Lunes a viernes 6 a 8 am y 4 a 11 pm. Sábado y domingo 6 am a 10 pm", nota: "Con luz para jugar de noche." },
  { id: "benavides", nombre: "Pádel Center Benavides", zona: "Miraflores", horario: "Consultá horarios", nota: "Coordinamos tu clase acá si te queda más cerca." },
  { id: "top", nombre: "Top Padel La Molina", zona: "La Molina", horario: "Sábados y domingos 8:00 a 20:00", nota: "Para entrenar el fin de semana." }
];
const sedePorId = (id) => SEDES.find((s) => s.id === id);
const lugar = (s) => (s.nombre.includes(s.zona) ? s.nombre : `${s.nombre}, ${s.zona}`);

// Cada tema = 2 láminas: gancho (foto + título) y detalle (con el llamado a la acción y el link).
const TEMAS = [
  {
    id: "sede-del-dia", nombre: "Sede del día", usaSede: true,
    pregunta: "¿Cuál es tu sede favorita?",
    laminas: (c) => [
      { tipo: "gancho", titulo: `¿Dónde jugamos hoy? ${c.sede.zona}`, sub: c.sede.nombre },
      { tipo: "detalle", titulo: c.sede.nombre, lineas: [c.sede.zona, c.sede.horario, c.sede.nota] }
    ]
  },
  {
    id: "grupal", nombre: "Clases grupales",
    pregunta: "¿Con quién vendrías a jugar?",
    laminas: () => [
      { tipo: "gancho", titulo: "Pádel en grupo, con gente de tu nivel", sub: "Clases de 2 a 4 alumnos" },
      { tipo: "detalle", titulo: "Clases grupales", lineas: ["Grupos armados por nivel", "No hace falta que traigas pareja", "Técnica y partidos de dobles de verdad"] }
    ]
  },
  {
    id: "individual", nombre: "Clase individual",
    pregunta: "¿Qué golpe querés mejorar primero?",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Querés avanzar más rápido? Clase individual", sub: "Atención completa para vos" },
      { tipo: "detalle", titulo: "Clase individual", lineas: ["Horario a tu medida", "Trabajamos tu técnica golpe por golpe", "Ideal para corregir un vicio puntual"] }
    ]
  },
  {
    id: "primera-vez", nombre: "Primera vez",
    pregunta: "¿Ya agarraste una pala alguna vez?",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Nunca jugaste al pádel?", sub: "Se empieza desde cero" },
      { tipo: "detalle", titulo: "Tu primera clase", lineas: ["Pala y pelotas prestadas al empezar", "Grupos de nivel inicial", "No necesitás experiencia previa"] }
    ]
  },
  {
    id: "horarios-semana", nombre: "Horarios de la semana",
    pregunta: "¿Cuál de estos horarios te queda mejor?",
    laminas: (c) => [
      { tipo: "gancho", titulo: "Horarios de esta semana", sub: "Nivel inicial" },
      { tipo: "detalle", titulo: "Elegí tu día", chips: c.horarios.slice(0, 5), lineas: [] }
    ]
  },
  {
    id: "despues-del-trabajo", nombre: "Después del trabajo", usaSede: true, sedeId: "laonce",
    pregunta: "¿A qué hora salís del trabajo?",
    laminas: () => {
      const s = sedePorId("laonce");
      return [
        { tipo: "gancho", titulo: "Salí del trabajo y jugá al pádel", sub: lugar(s) },
        { tipo: "detalle", titulo: "Pádel de noche", lineas: [lugar(s), s.horario, s.nota] }
      ];
    }
  },
  {
    id: "fin-de-semana", nombre: "Fin de semana", usaSede: true, sedeId: "top",
    pregunta: "¿Sábado o domingo?",
    laminas: () => {
      const s = sedePorId("top");
      return [
        { tipo: "gancho", titulo: "Tu fin de semana, con pádel", sub: lugar(s) },
        { tipo: "detalle", titulo: "Sábados y domingos", lineas: [lugar(s), s.horario, "Grupales o individuales"] }
      ];
    }
  },
  {
    id: "madrugador", nombre: "Antes del trabajo",
    pregunta: "¿Sos de madrugar o de tarde?",
    laminas: () => [
      { tipo: "gancho", titulo: "Arrancá el día jugando", sub: "Clases desde las 6:00" },
      { tipo: "detalle", titulo: "Mañanas de pádel", lineas: ["Bloques desde las 6:00", "Miraflores y Surquillo", "Grupales o individuales"] }
    ]
  },
  {
    id: "grupal-o-individual", nombre: "¿Grupal o individual?",
    pregunta: "¿Grupal o individual?",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Grupal o individual?", sub: "Te ayudo a elegir" },
      { tipo: "detalle", titulo: "Vos elegís", lineas: ["Grupal: jugás, te divertís y conocés gente de tu nivel", "Individual: atención completa y horario a tu medida"] }
    ]
  },
  {
    id: "mito", nombre: "Mito",
    pregunta: "¿Qué mito del pádel escuchaste?",
    laminas: () => [
      { tipo: "gancho", titulo: "“Para empezar ya tenés que saber jugar”", sub: "Mito" },
      { tipo: "detalle", titulo: "Se empieza desde cero", lineas: ["Grupos por nivel", "Pala y pelotas prestadas al empezar", "Lo básico lo aprendés en la primera clase"] }
    ]
  },
  {
    id: "sin-complicaciones", nombre: "Sin complicaciones",
    pregunta: "¿Qué te frena para empezar?",
    laminas: () => [
      { tipo: "gancho", titulo: "Empezar es fácil", sub: "Sin vueltas" },
      { tipo: "detalle", titulo: "Así de simple", lineas: ["Me contás cuándo podés jugar", "Armamos tu grupo o tu clase individual", "Reprogramás avisando 24 horas antes"] }
    ]
  },
  {
    id: "tres-pasos", nombre: "Cómo empezar",
    pregunta: "¿Listo para el primer paso?",
    laminas: () => [
      { tipo: "gancho", titulo: "Empezá en tres pasos", sub: "Así de fácil" },
      { tipo: "detalle", titulo: "Cómo funciona", lineas: ["1. Me contás tu disponibilidad", "2. Armamos tu grupo o tu horario individual", "3. Venís a tu primera clase"] }
    ]
  },
  {
    id: "benavides", nombre: "Sede Benavides", usaSede: true, sedeId: "benavides",
    pregunta: "¿Miraflores o Surquillo?",
    laminas: () => {
      const s = sedePorId("benavides");
      return [
        { tipo: "gancho", titulo: "Pádel en Miraflores, cerca tuyo", sub: s.nombre },
        { tipo: "detalle", titulo: s.nombre, lineas: [s.zona, s.nota, "Grupales o individuales"] }
      ];
    }
  },
  {
    id: "momento", nombre: "Elegí tu momento",
    pregunta: "¿Mañana, tarde o noche?",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Cuándo podés jugar?", sub: "Mañana, tarde, noche o fin de semana" },
      { tipo: "detalle", titulo: "Hay horarios para vos", chips: ["Mañanas desde las 6:00", "Tardes", "Noches con luz", "Sábado y domingo"], lineas: [] }
    ]
  }
];

export const CANTIDAD_TEMAS = TEMAS.length;

const PALETAS = [
  { fondo: ["#0d3140", "#14495a"], texto: "#ffffff", suave: "#cfe0e6", acento: "#c8e94c", chip: "#c8e94c", chipTexto: "#0f1e2e" },
  { fondo: ["#c8e94c", "#b6d83d"], texto: "#0f1e2e", suave: "#2d4a22", acento: "#14495a", chip: "#14495a", chipTexto: "#ffffff" },
  { fondo: ["#0f1e2e", "#16304a"], texto: "#ffffff", suave: "#b7c6d4", acento: "#c8e94c", chip: "#c8e94c", chipTexto: "#0f1e2e" },
  { fondo: ["#f6f8fa", "#e3ebef"], texto: "#0f1e2e", suave: "#47586b", acento: "#14495a", chip: "#14495a", chipTexto: "#ffffff" }
];

// Día N desde una fecha fija: así cada día cae un tema distinto y se repite recién tras 14 días.
const BASE = "2026-01-01";
export const indiceDeDia = (fecha) => diasEntreFechas(BASE, fecha);

export function historiaDeFecha(fecha, horarios) {
  const n = indiceDeDia(fecha);
  const t = TEMAS[((n % TEMAS.length) + TEMAS.length) % TEMAS.length];
  const sede = (t.sedeId && sedePorId(t.sedeId)) || SEDES[((n % SEDES.length) + SEDES.length) % SEDES.length];
  const paleta = PALETAS[((n % PALETAS.length) + PALETAS.length) % PALETAS.length];
  const laminas = t.laminas({ sede, horarios: (horarios && horarios.length ? horarios : HORARIOS_DEFECTO) });
  return {
    fecha,
    tema: t,
    sede,
    paleta,
    laminas,
    link: `${LINK_DISPONIBILIDAD}?utm_source=instagram&utm_medium=story&utm_campaign=${t.id}`,
    linkVisible: LINK_VISIBLE,
    sticker: t.pregunta
  };
}

export const historiaDeHoy = (horarios) => historiaDeFecha(hoyLima(), horarios);
export const temaDelDia = () => historiaDeFecha(hoyLima()).tema.nombre;
