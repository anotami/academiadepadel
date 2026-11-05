// Página pública /evento.html -- reutilizable, toma los datos de
// evento-config.js (un archivo, no una base de datos). Si falta el dato
// clave (titulo o fecha), muestra el estado "a confirmar" en vez de
// inventar algo -- nunca fabrica fecha, precio ni cupo.
import { EVENTO } from "./evento-config.js?v=1";
import { formatearFechaLarga } from "./portal-common.js?v=26";

function capitalizar(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

if (!EVENTO.titulo || !EVENTO.fecha) {
  // Queda el estado por defecto del HTML ("Estamos armando el próximo evento").
} else {
  document.getElementById("evSinDatos").hidden = true;
  const card = document.getElementById("evConDatos");
  card.hidden = false;

  document.getElementById("ev-titulo").textContent = EVENTO.titulo;

  const ficha = [];
  ficha.push("📅 " + capitalizar(formatearFechaLarga(EVENTO.fecha)));
  if (EVENTO.horario) ficha.push("🕒 " + EVENTO.horario);
  if (EVENTO.sede) {
    const lugar = `${EVENTO.sede}${EVENTO.direccion ? ", " + EVENTO.direccion : ""}`;
    ficha.push("📍 " + (EVENTO.mapsUrl ? `<a href="${EVENTO.mapsUrl}" target="_blank" rel="noopener">${lugar}</a>` : lugar));
  }
  if (EVENTO.formato) ficha.push("🎾 " + EVENTO.formato);
  if (EVENTO.precio !== "") ficha.push("💵 S/" + EVENTO.precio);
  if (EVENTO.cupo !== "") ficha.push("👥 Cupos: " + EVENTO.cupo);
  document.getElementById("ev-ficha").innerHTML = ficha.map((f) => `<li>${f}</li>`).join("");

  const btn = document.getElementById("ev-btn-inscripcion");
  if (EVENTO.linkInscripcion) {
    btn.href = EVENTO.linkInscripcion;
  } else {
    btn.remove();
  }

  const desc = document.getElementById("ev-descripcion");
  if (EVENTO.descripcion) desc.textContent = EVENTO.descripcion;
  else desc.remove();
}
