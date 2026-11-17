// Exporta las próximas clases a un solo archivo .ics para importarlo de una vez en Google Calendar
// (calendar.google.com → Configuración → Importar y exportar). Solo lleva "Clase – nombre", sede y horario:
// nunca teléfonos ni montos. Los UID son estables: si lo importas de nuevo, Google actualiza en vez de duplicar.
import { sumarDiasFecha } from "./portal-common.js?v=30";

const esc = (t) => String(t ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Líneas de máx. 75 bytes (RFC 5545), con continuación.
function plegar(linea) {
  const enc = new TextEncoder(); const partes = []; let actual = "";
  for (const ch of linea) {
    if (enc.encode(actual + ch).length > (partes.length ? 74 : 75)) { partes.push(actual); actual = ch; } else actual += ch;
  }
  partes.push(actual);
  return partes.map((p, i) => (i ? " " + p : p)).join("\r\n");
}
const ymd = (f) => f.replace(/-/g, "");
function rango(r) {
  const [h, m] = (r.hora || "00:00").split(":").map(Number);
  const dur = Number(r.duracionMin) > 0 ? Number(r.duracionMin) : 90;
  const fin = h * 60 + m + dur;
  const fechaFin = fin >= 1440 ? sumarDiasFecha(r.fecha, Math.floor(fin / 1440)) : r.fecha;
  const hf = String(Math.floor((fin % 1440) / 60)).padStart(2, "0"), mf = String(fin % 60).padStart(2, "0");
  return { ini: `${ymd(r.fecha)}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`, fin: `${ymd(fechaFin)}T${hf}${mf}00` };
}

export function construirIcs(reservas) {
  // Una clase con varios alumnos (grupo) = un solo evento.
  const sesiones = new Map();
  reservas.filter((r) => r.fecha && r.hora).forEach((r) => {
    const k = `${r.pistaId || r.pistaNombre || ""}|${r.fecha}|${r.hora}`;
    (sesiones.get(k) || sesiones.set(k, []).get(k)).push(r);
  });
  const ahora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const L = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Academia de Padel GP//Clases//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Clases Academia de Pádel GP", "X-WR-TIMEZONE:America/Lima",
    "BEGIN:VTIMEZONE", "TZID:America/Lima", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0500", "TZNAME:-05", "END:STANDARD", "END:VTIMEZONE"
  ];
  [...sesiones.entries()].sort((a, b) => a[0].split("|").slice(1).join().localeCompare(b[0].split("|").slice(1).join())).forEach(([k, rs]) => {
    const r = rs[0], { ini, fin } = rango(r);
    const nombres = [...new Set(rs.map((x) => (x.alumnoNombre || "").trim()).filter(Boolean))];
    const uid = "clase-" + k.replace(/[^A-Za-z0-9]+/g, "-") + "@academiadepadel.pe";
    L.push("BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${ahora}`, `DTSTART;TZID=America/Lima:${ini}`, `DTEND;TZID=America/Lima:${fin}`,
      `SUMMARY:${esc("Clase" + (nombres.length ? " – " + nombres.join(", ") : ""))}`);
    if (r.pistaNombre) L.push(`LOCATION:${esc(r.pistaNombre)}`);
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.map(plegar).join("\r\n") + "\r\n";
}

export function descargarIcs(reservas) {
  const blob = new Blob([construirIcs(reservas)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "clases-academia-padel-gp.ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
