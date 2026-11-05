// Página pública /evento.html -- "Próximo evento" para la bio de
// Instagram. Muestra la misma jornada activa más próxima que ya carga
// jornada.html (colección `jornadas`, panel "Jornadas"), para no mantener
// un archivo de datos aparte. El botón manda a jornada.html, que es donde
// vive el formulario real de inscripción.
import { db, collection, query, where, getDocs } from "./firebase-app.js?v=18";
import { formatearFechaLarga } from "./portal-common.js?v=26";

function capitalizar(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

async function cargarEvento() {
  const snap = await getDocs(query(collection(db, "jornadas"), where("activa", "==", true)));
  if (snap.empty) return; // queda el estado por defecto del HTML

  const jornada = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  document.getElementById("evSinDatos").hidden = true;
  const card = document.getElementById("evConDatos");
  card.hidden = false;

  document.getElementById("ev-titulo").textContent = jornada.titulo || "Próximo evento";

  const restantes = Math.max(0, (jornada.cupos || 0) - (jornada.cuposUsados || 0));
  const ficha = [];
  ficha.push("📅 " + capitalizar(formatearFechaLarga(jornada.fecha)));
  ficha.push("🕒 " + (jornada.horario && jornada.horario.trim() ? jornada.horario : "te lo confirmamos por WhatsApp"));
  if (jornada.sede) {
    const lugar = `${jornada.sede}${jornada.direccion ? ", " + jornada.direccion : ""}`;
    ficha.push("📍 " + (jornada.mapsUrl ? `<a href="${jornada.mapsUrl}" target="_blank" rel="noopener">${lugar}</a>` : lugar));
  }
  if (jornada.precio != null) ficha.push(`💵 S/${jornada.precio} por persona${jornada.metodoPago ? " · pago por " + jornada.metodoPago : ""}`);
  ficha.push(restantes > 0 ? `👥 Quedan ${restantes} de ${jornada.cupos} cupos` : "👥 Cupos completos");
  document.getElementById("ev-ficha").innerHTML = ficha.map((f) => `<li>${f}</li>`).join("");

  document.getElementById("ev-btn-inscripcion").textContent = restantes > 0 ? "Ver detalles y reservar mi lugar" : "Ver detalles";
}

cargarEvento().catch(() => {});
