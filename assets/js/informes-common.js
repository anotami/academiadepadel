// Piezas compartidas entre el panel del profesor (informes-profesor.js) y la
// página pública del informe (informe-page.js). Sin dependencias de Firebase.

export const METRICAS = [
  { k: "tiempo_en_cancha_min", label: "Tiempo en cancha (ejercicios)", unidad: "min", pct: false },
  { k: "metros", label: "Metros recorridos", unidad: "m", pct: false },
  { k: "metros_por_min", label: "Ritmo", unidad: "m/min", pct: false },
  { k: "sprints", label: "Arranques rápidos (más de 3 m/s)", unidad: "", pct: false },
  { k: "pct_fondo", label: "Tiempo en el fondo", unidad: "%", pct: true, menosEsMejor: true },
  { k: "pct_red", label: "Tiempo en la red", unidad: "%", pct: true },
  { k: "pct_transicion", label: "Tiempo en tierra de nadie (entre 4,5 y 7 m de la red)", unidad: "%", pct: true },
  { k: "pct_pala_baja_en_red", label: "Pala abajo estando en la red", unidad: "%", pct: true, menosEsMejor: true }
];

// Textos de cada corrección, con las frases de clase de Gabo.
export const TEXTO_CLIP = {
  "PALA ARRIBA": "Estabas en la red, en posición de espera, y la pala se quedó abajo. Mirá dónde la tenés cuando el rival le pega.",
  "TIERRA DE NADIE": "Te quedaste parado entre la red y el fondo. Ahí te llegan todas a los pies. Mirá en qué momento decidís si subís o volvés.",
  "PRIMERO LOS PIES": "Tu desplazamiento más rápido de la clase. Mirá si llegás con los pies o estirás el brazo para alcanzarla."
};

export function tituloClip(t) {
  return { "PALA ARRIBA": "Pala arriba", "TIERRA DE NADIE": "Tierra de nadie", "PRIMERO LOS PIES": "Primero los pies" }[t] || t;
}

// Propuesta para la próxima clase según lo que más pesa en los números.
export function proximaClase(m) {
  const fondo = m.pct_fondo ?? 0, pala = m.pct_pala_baja_en_red ?? 0, trans = m.pct_transicion ?? 0;
  if (fondo >= 50) return `Subir a la red y quedarse con la pala arriba. Con un ${fondo} % de la clase en el fondo, lo que más te va a sumar es animarte a subir y no quedarte a mitad de camino.`;
  if (pala >= 15) return `Pala arriba en la red. Una de cada ${Math.max(2, Math.round(100 / pala))} veces la tuviste abajo: entre golpe y golpe, pala delante y arriba.`;
  if (trans >= 15) return `Terminar de subir. Pasaste un ${trans} % de la clase en tierra de nadie: cuando decidas subir, subí hasta la red.`;
  return "Llegar primero con los pies. Ya te parás bien en la cancha; ahora el trabajo es moverte antes para no tener que estirar el brazo.";
}

export const TAREAS = [
  "Mirar los clips antes de entrar a la cancha",
  "En cada ejercicio de red, chequear la pala entre golpe y golpe",
  "Cuando subas, terminar de subir: nada de quedarse en tierra de nadie"
];

export const driveImg = (id, w = 800) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w}`;
export const driveVideo = (id) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;

export function claveAlumno(nombre) {
  return (nombre || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, "_");
}

export function nuevoToken() {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("");
}

export function fechaCorta(iso) {
  const [y, m, d] = (iso || "").split("-");
  return d ? `${d}/${m}/${y}` : iso;
}

// Línea de evolución en SVG (sin librerías: el CSP solo deja scripts propios).
export function sparkline(valores, { ancho = 260, alto = 56, color = "#1f6feb" } = {}) {
  const v = valores.filter((x) => x != null);
  if (v.length < 2) return "";
  const min = Math.min(...v), max = Math.max(...v), r = max - min || 1, pad = 6;
  const pts = valores.map((x, i) => x == null ? null :
    [pad + (i * (ancho - 2 * pad)) / (valores.length - 1), alto - pad - ((x - min) * (alto - 2 * pad)) / r]).filter(Boolean);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const u = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${u[0].toFixed(1)}" cy="${u[1].toFixed(1)}" r="4" fill="${color}"/></svg>`;
}

export function delta(actual, previo, menosEsMejor) {
  if (actual == null || previo == null) return "";
  const d = Math.round((actual - previo) * 10) / 10;
  if (!d) return `<span class="inf-delta">= que la clase anterior</span>`;
  const bueno = menosEsMejor ? d < 0 : d > 0;
  return `<span class="inf-delta ${bueno ? "inf-up" : "inf-down"}">${d > 0 ? "+" : ""}${d} vs anterior</span>`;
}
