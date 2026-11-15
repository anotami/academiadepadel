// Historias de Instagram para conseguir alumnos: un tema distinto cada día, 3 láminas por día
// (gancho → detalle → llamado a la acción con el link a la disponibilidad).
// Todo lo que se dice sale de datos reales del sitio (sedes, precios, ofertas). Para cambiar
// precios, sedes o textos, se edita ESTE archivo; los horarios de la semana se editan en la
// propia página historias.html (se guardan en el navegador).
import { diasEntreFechas, hoyLima } from "./portal-common.js?v=30";

export const LINK_DISPONIBILIDAD = "https://academiadepadel.pe/disponibilidad.html";
export const SITIO = "academiadepadel.pe";

// Precios de lista (los mismos de la sección "Planes y Tarifas" de la home).
export const PRECIOS = { grupalDesde: "S/ 75", individual: "S/ 120" };

// Horarios por defecto de "esta semana" (nivel inicial). Cambialos en historias.html.
export const HORARIOS_DEFECTO = [
  "Lunes 7:00 – 8:00",
  "Viernes 7:00 – 8:00",
  "Viernes 16:00",
  "Sábado 7:00 – 10:00",
  "Domingo 7:00 – 10:00"
];

export const SEDES = [
  { id: "x3", nombre: "Club adidas X3", zona: "Miraflores", horario: "Lunes a domingo", nota: "Nuestra sede principal: cancha e iluminación incluidas en el precio." },
  { id: "laonce", nombre: "La Once (Club Pádel Lima)", zona: "Surquillo", horario: "Lunes a viernes 6–8 am y 4–11 pm · Sáb y dom 6 am–10 pm", nota: "Con luz de noche para jugar después del trabajo." },
  { id: "benavides", nombre: "Pádel Center Benavides", zona: "Miraflores", horario: "Consulta horarios", nota: "Coordinamos tu clase aquí si te queda más cerca." },
  { id: "top", nombre: "Top Padel La Molina", zona: "La Molina", horario: "Sábados y domingos 8:00 – 20:00", nota: "Ideal para entrenar el fin de semana." }
];
const sedePorId = (id) => SEDES.find((s) => s.id === id);

// Cada tema define sus 3 láminas. `ctx` = { sede, horarios[] }.
// tipos de lámina: "gancho" (título grande), "detalle" (título + líneas/chips), "cta" (se arma sola).
const TEMAS = [
  {
    id: "sede-del-dia", nombre: "Sede del día", usaSede: true,
    pregunta: "¿Cuál es tu sede favorita? 🏟️",
    laminas: (c) => [
      { tipo: "gancho", titulo: `¿Dónde jugamos hoy? ${c.sede.zona}`, sub: c.sede.nombre },
      { tipo: "detalle", titulo: c.sede.nombre, lineas: [`📍 ${c.sede.zona}`, `🕒 ${c.sede.horario}`, c.sede.nota, "Grupales o individuales: tú eliges."] }
    ]
  },
  {
    id: "grupal-precio", nombre: "Clases grupales",
    pregunta: "¿Con quién vendrías a jugar? 👯",
    laminas: () => [
      { tipo: "gancho", titulo: `Pádel en grupo desde ${PRECIOS.grupalDesde} por persona`, sub: "Aprende jugando con alumnos de tu nivel" },
      { tipo: "detalle", titulo: "Clases grupales (2 a 4)", lineas: ["✅ Con 2 inscritos la clase se confirma", "✅ No necesitas venir con pareja: te asignamos con alumnos afines", "✅ Técnica + dinámica de dobles real"] }
    ]
  },
  {
    id: "individual", nombre: "Clase individual",
    pregunta: "¿Qué golpe quieres mejorar primero? 🎯",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Quieres avanzar más rápido? Clase 1 a 1", sub: `${PRECIOS.individual} la clase` },
      { tipo: "detalle", titulo: "Clase individual", lineas: ["🎯 100% enfocada en tu técnica", "🕒 Horario a tu medida", "🛠️ Corregimos vicios de juego desde el primer día"] }
    ]
  },
  {
    id: "primera-vez", nombre: "Primera vez",
    pregunta: "¿Ya agarraste una pala de pádel? 🎾",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Nunca jugaste pádel?", sub: "Empieza desde cero, sin vergüenza" },
      { tipo: "detalle", titulo: "Tu primera clase", lineas: ["🎾 Te prestamos pala y pelotas si recién empiezas", "👥 La mayoría de nuestros alumnos parten de cero", "🆓 Clínica de iniciación gratuita todos los meses"] }
    ]
  },
  {
    id: "horarios-semana", nombre: "Horarios de la semana",
    pregunta: "¿Cuál de estos horarios te acomoda? ⏰",
    laminas: (c) => [
      { tipo: "gancho", titulo: "Horarios de esta semana", sub: "Nivel inicial · cupos limitados" },
      { tipo: "detalle", titulo: "Elige tu día", chips: c.horarios, lineas: ["Grupales o individuales", "Confirmamos según cupos"] }
    ]
  },
  {
    id: "despues-del-trabajo", nombre: "Después del trabajo", usaSede: true, sedeId: "laonce",
    pregunta: "¿A qué hora sales del trabajo? 🌙",
    laminas: () => {
      const s = sedePorId("laonce");
      return [
        { tipo: "gancho", titulo: "Sal del trabajo y juega pádel", sub: `${s.nombre} · ${s.zona}` },
        { tipo: "detalle", titulo: "Pádel de noche", lineas: [`📍 ${s.nombre}, ${s.zona}`, `🕒 ${s.horario}`, "💡 Con luz para jugar tarde", "Grupales o individuales"] }
      ];
    }
  },
  {
    id: "fin-de-semana", nombre: "Fin de semana", usaSede: true, sedeId: "top",
    pregunta: "¿Sábado o domingo? 🗓️",
    laminas: () => {
      const s = sedePorId("top");
      return [
        { tipo: "gancho", titulo: "Tu fin de semana, con pádel", sub: `${s.nombre} · ${s.zona}` },
        { tipo: "detalle", titulo: "Sábados y domingos", lineas: [`📍 ${s.nombre}, ${s.zona}`, `🕒 ${s.horario}`, "Grupales o individuales", "Ven con tus amigos o llega solo"] }
      ];
    }
  },
  {
    id: "madrugador", nombre: "Antes del trabajo",
    pregunta: "¿Eres de madrugar o de tarde? ☀️",
    laminas: () => [
      { tipo: "gancho", titulo: "Empieza el día jugando", sub: "Clases desde las 6:00 am" },
      { tipo: "detalle", titulo: "Mañanas de pádel", lineas: ["☀️ Bloques desde las 6:00 am", "📍 Miraflores y Surquillo", "⚡ Sales activado a tu día", "Grupales o individuales"] }
    ]
  },
  {
    id: "grupal-o-individual", nombre: "¿Grupal o individual?",
    pregunta: "¿Grupal o individual? 🗳️",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Grupal o individual?", sub: "Te ayudamos a elegir" },
      { tipo: "detalle", titulo: "Tú decides", lineas: [`👥 Grupal: desde ${PRECIOS.grupalDesde} por persona. Juegas, te diviertes y haces comunidad.`, `🎯 Individual: ${PRECIOS.individual}. Atención 100% para ti y horario a tu medida.`] }
    ]
  },
  {
    id: "mito", nombre: "Mito vs realidad",
    pregunta: "¿Qué mito del pádel habías escuchado? 🤔",
    laminas: () => [
      { tipo: "gancho", titulo: "“Para jugar pádel ya debes saber jugar”", sub: "❌ Mito" },
      { tipo: "detalle", titulo: "✅ Realidad", lineas: ["Empiezas desde cero, con alumnos de tu nivel", "Te prestamos pala y pelotas si recién empiezas", "Aprendes lo básico desde la primera clase"] }
    ]
  },
  {
    id: "sin-riesgo", nombre: "Sin complicaciones",
    pregunta: "¿Qué te frena para empezar? 💬",
    laminas: () => [
      { tipo: "gancho", titulo: "Empezar es fácil", sub: "Sin compromisos raros" },
      { tipo: "detalle", titulo: "Así de simple", lineas: ["📲 Nos cuentas cuándo puedes jugar", "🔁 Reprogramas sin costo avisando 24 h antes", "🎾 Pala y pelotas prestadas si recién empiezas"] }
    ]
  },
  {
    id: "tres-pasos", nombre: "3 pasos",
    pregunta: "¿Listo para el paso 1? 👇",
    laminas: () => [
      { tipo: "gancho", titulo: "Empieza en 3 pasos", sub: "Así de fácil" },
      { tipo: "detalle", titulo: "Cómo funciona", lineas: ["1️⃣ Nos cuentas tu disponibilidad (1 minuto)", "2️⃣ Armamos tu grupo o tu horario individual", "3️⃣ Vienes a tu primera clase"] }
    ]
  },
  {
    id: "benavides", nombre: "Sede Benavides", usaSede: true, sedeId: "benavides",
    pregunta: "¿Miraflores o Surquillo? 📍",
    laminas: () => {
      const s = sedePorId("benavides");
      return [
        { tipo: "gancho", titulo: "Pádel en Miraflores, cerca de ti", sub: s.nombre },
        { tipo: "detalle", titulo: s.nombre, lineas: [`📍 ${s.zona}`, s.nota, "Grupales o individuales", "Cuéntanos tu horario y lo coordinamos"] }
      ];
    }
  },
  {
    id: "momento", nombre: "Elige tu momento",
    pregunta: "¿Mañana, tarde o noche? 🌤️",
    laminas: () => [
      { tipo: "gancho", titulo: "¿Cuándo puedes jugar?", sub: "Mañana, tarde, noche o fin de semana" },
      { tipo: "detalle", titulo: "Tenemos horarios para ti", chips: ["☀️ Mañanas desde 6:00", "🌇 Tardes", "🌙 Noches con luz", "🗓️ Sáb y dom"], lineas: ["Grupales o individuales"] }
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
  laminas.push({ tipo: "cta" });
  return {
    fecha,
    tema: t,
    sede,
    paleta,
    laminas,
    link: `${LINK_DISPONIBILIDAD}?utm_source=instagram&utm_medium=story&utm_campaign=${t.id}`,
    sticker: t.pregunta
  };
}

export const historiaDeHoy = (horarios) => historiaDeFecha(hoyLima(), horarios);
export const temaDelDia = () => historiaDeFecha(hoyLima()).tema.nombre;
