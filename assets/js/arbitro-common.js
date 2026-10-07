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

export const INTERRUPTION_TYPES = [
  "Lesión / atención médica",
  "Condiciones climáticas",
  "Falla de instalaciones (luz, red, pista)",
  "Disputa de tanteo",
  "Revisión de equipamiento",
  "Pausa de hidratación / baño",
  "Interferencia externa (público, ruido, otra pista)",
  "Otro"
];

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

export function marcadorCortoDesdeDoc(m) {
  const sets = (m.sets || []).map((s) => `${s.a}-${s.b}`).join(", ");
  const vivo = m.isSuperTiebreakSet || m.inTiebreak
    ? `${m.currentGame.a}-${m.currentGame.b}`
    : labelsDePuntos(m.currentGame.a, m.currentGame.b).join("-");
  return [sets, `${m.currentSet.a}-${m.currentSet.b}`, `(${vivo})`].filter(Boolean).join(" · ");
}
