// Funciones y constantes compartidas entre arbitro.js (activo), arbitro-vivo.js
// (visor público de solo lectura) y arbitro-pistas.js (multipista pasiva + ranking).

export const LABELS = ["0", "15", "30", "40"];
export const BALL_CHANGE_FIRST = 9; // 7 juegos reales + 2 del peloteo (bases FIP)
export const BALL_CHANGE_EVERY = 9;

export const CHECKLIST_ITEMS = [
  "Verificación de la pista: superficie, cerramientos y altura de la red",
  "Control de pelotas: marca/modelo oficial y presión/rebote reglamentario",
  "Cantidad de pelotas anunciada coincide con lo verificado",
  "Indumentaria reglamentaria de ambas parejas",
  "Cordón de la pala no elástico y de máximo 35 cm",
  "Ningún jugador porta dispositivos de comunicación en pista",
  "Entrenadores acreditados identificados (si aplica)",
  "Datos de jugadores, club, país y pista registrados"
];

// Tipos de interrupción, con la referencia de tiempo de la Regla 2 FIP para
// que el árbitro no tenga que buscarla — son solo una guía, la decisión final
// siempre es suya.
export const INTERRUPTION_TYPES = [
  { tipo: "Lesión / condición médica tratable", ref: "Hasta 3 min de atención; puede repetirse en los próximos 2 cambios de lado, dentro del tiempo reglamentario. Una vez por jugador y por cada condición distinta (Regla 2.14)." },
  { tipo: "Calambres musculares", ref: "Solo se tratan durante el cambio de lado (no genera tiempo médico aparte). Hasta 2 tratamientos en 2 cambios de lado, no necesariamente consecutivos." },
  { tipo: "Sangrado", ref: "Detener de inmediato; no se reanuda hasta limpiar la pista. Hasta 15 min (Regla 2.14)." },
  { tipo: "Urgencia médica ajena al juego (desmayo, alergia, mareo, crisis respiratoria)", ref: "A criterio del árbitro, hasta 15 min (Regla 2.16)." },
  { tipo: "Incidente súbito en el punto (caída, pelotazo)", ref: "Hasta 5 min para recuperarse y continuar (Regla 2.17)." },
  { tipo: "Condiciones climáticas", ref: "Reanudación: ≤5 min sin peloteo; 5-20 min, 1 min; +20 min, 3 min (Regla 2.11)." },
  { tipo: "Falta de luz natural", ref: "Si es posible, detener al final de un set o con suma par de juegos, para conservar los lados al reanudar (Regla 2.13)." },
  { tipo: "Falla de instalaciones (red, pista)", ref: "" },
  { tipo: "Disputa de tanteo", ref: "Reconstruir con cada pareja; se conservan los puntos/juegos en que hay coincidencia. No se sortea ni se repite el juego completo." },
  { tipo: "Revisión de equipamiento", ref: "Ropa, calzado o equipo roto por causas ajenas al jugador: tiempo adicional razonable (Regla 2.8)." },
  { tipo: "Pausa de hidratación / baño", ref: "" },
  { tipo: "Interferencia externa (público, ruido, otra pista)", ref: "" },
  { tipo: "Otro", ref: "" }
];

// Categorías del Código de Conducta (no incluye demora: tiene su propia
// escalera independiente, ver TIME_VIOLATION más abajo).
export const CONDUCT_CATEGORIES = [
  "Obscenidad audible o visible",
  "Abuso de pelota",
  "Abuso de pala o equipo",
  "Abuso verbal",
  "Abuso físico / agresión",
  "Instrucciones no autorizadas al técnico",
  "Conducta antideportiva",
  "Otro"
];

// Escalera real de la FIP para el Código de Conducta (por pareja): 1ra
// infracción = advertencia; 2da = advertencia + pérdida de punto; 3ra =
// advertencia + descalificación. "Descalificación directa" es un camino
// aparte para faltas muy graves (agresión física o verbal muy grave).
export function consecuenciaConducta(numero) {
  if (numero === 1) return "Advertencia";
  if (numero === 2) return "Advertencia + pérdida de punto";
  return "Advertencia + descalificación";
}

// Escalera de infracciones de TIEMPO/demora (tabla aparte de la de conducta):
// 1ra = advertencia; 2da en adelante = pérdida de punto (o del primer saque
// si estaba al servicio); reiteración grave puede llegar a descalificación.
export function consecuenciaDemora(numero) {
  if (numero === 1) return "Advertencia por demora";
  return "Pérdida de punto por demora";
}

export function nombreJugador(v, fallback) { return (v || "").trim() || fallback; }

export function nombreEquipo(config, team) {
  if (team === "A") return `${nombreJugador(config.a1, "Jugador A1")} / ${nombreJugador(config.a2, "Jugador A2")}`;
  return `${nombreJugador(config.b1, "Jugador B1")} / ${nombreJugador(config.b2, "Jugador B2")}`;
}

export function otro(team) { return team === "A" ? "B" : "A"; }

export function labelsDePuntos(a, b) {
  if (a < 3 && b < 3) return [LABELS[a], LABELS[b]];
  if (a >= 3 && b >= 3) {
    if (a === b) return ["40", "40"];
    return a > b ? ["VENT.", "40"] : ["40", "VENT."];
  }
  return [LABELS[Math.min(a, 3)], LABELS[Math.min(b, 3)]];
}

export function formatMMSS(s) {
  const m = Math.floor(Math.max(s, 0) / 60);
  const r = Math.max(s, 0) % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function tiempoRelativo(ms) {
  const seg = Math.round((Date.now() - ms) / 1000);
  if (seg < 5) return "ahora mismo";
  if (seg < 60) return `hace ${seg} s`;
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const horas = Math.round(min / 60);
  return `hace ${horas} h`;
}

// Regla 2.11 FIP: peloteo de cortesía al reanudar según cuánto duró la suspensión.
export function peloteoSugeridoSeg(duracionSuspensionSeg) {
  if (duracionSuspensionSeg <= 5 * 60) return 0;
  if (duracionSuspensionSeg <= 20 * 60) return 60;
  return 180;
}

export function marcadorCortoDesdeDoc(m) {
  const sets = (m.sets || []).map((s) => `${s.a}-${s.b}`).join(", ");
  const vivo = m.isSuperTiebreakSet || m.inTiebreak
    ? `${m.currentGame.a}-${m.currentGame.b}`
    : labelsDePuntos(m.currentGame.a, m.currentGame.b).join("-");
  return [sets, `${m.currentSet.a}-${m.currentSet.b}`, `(${vivo})`].filter(Boolean).join(" · ");
}
