// Página /links.html (bio de Instagram). Lista todas las jornadas futuras
// que haya en Firestore -- no hay que tocar este archivo cada vez que se
// genera una jornada nueva desde el panel, aparece sola.
import { db, collection, getDocs } from "./firebase-app.js?v=18";
import { escapeHtml } from "./utils.js?v=1";
import { formatearFecha } from "./portal-common.js?v=26";

async function cargarJornadas() {
  const wrap = document.getElementById("lnk-jornadas");
  const hoy = new Date().toISOString().slice(0, 10);
  const snap = await getDocs(collection(db, "jornadas"));
  const jornadas = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .filter((j) => j.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (!jornadas.length) { wrap.remove(); return; }

  wrap.innerHTML = jornadas.map((j) => `
    <li><a class="lnk-item" href="jornada.html?id=${encodeURIComponent(j.id)}">${escapeHtml(j.titulo)} <span>${formatearFecha(j.fecha)}</span></a></li>
  `).join("");
}

cargarJornadas().catch(() => {
  document.getElementById("lnk-jornadas")?.remove();
});
