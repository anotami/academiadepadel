// Historial de partidos arbitrados: local (siempre, este dispositivo) y en
// la nube (si el partido se compartió en vivo, recuperable desde cualquier
// dispositivo con la misma cuenta).
import { tiempoRelativo } from "./arbitro-common.js?v=4";

const HISTORIAL_KEY = "arbitro_historial_v1";

// ---------------- Local ----------------
function renderLocal() {
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || "[]"); } catch (e) { lista = []; }
  const ul = document.getElementById("historialLocalLista");
  const vacio = document.getElementById("historialLocalVacio");
  ul.innerHTML = "";
  vacio.hidden = lista.length > 0;
  lista.forEach((item) => {
    const li = document.createElement("li");
    li.className = "arbitro-incident-item";
    const setsTxt = (item.sets || []).map((s) => `${s.a}-${s.b}`).join(", ") || "—";
    const fecha = new Date(item.ts).toLocaleString("es-PE");
    const meta = [item.club, item.pista ? `Pista ${item.pista}` : ""].filter(Boolean).join(" · ");
    li.innerHTML = `<span>
        <span class="inc-tipo">${item.equipoA} vs ${item.equipoB}</span><br>
        <small>${meta ? meta + " · " : ""}Sets: ${setsTxt} · Gana: ${item.ganador ? (item.ganador === "A" ? item.equipoA : item.equipoB) : "sin terminar"}</small>
      </span><span>${fecha}</span>`;
    ul.appendChild(li);
  });
}

document.getElementById("btnBorrarHistorialLocal").addEventListener("click", () => {
  if (!confirm("¿Borrar el historial guardado en este dispositivo? No afecta lo que quedó guardado en la nube.")) return;
  localStorage.removeItem(HISTORIAL_KEY);
  renderLocal();
});

renderLocal();

// ---------------- Nube ----------------
import("./firebase-app.js?v=12")
  .then(({ auth, db, onAuthStateChanged, collection, query, where, onSnapshot }) => {
    onAuthStateChanged(auth, (user) => {
      const hint = document.getElementById("nubeHint");
      const ul = document.getElementById("historialNubeLista");
      const vacio = document.getElementById("historialNubeVacio");
      if (!user) {
        ul.innerHTML = "";
        vacio.hidden = false;
        vacio.innerHTML = 'Inicia sesión para ver tu historial en la nube — <a href="arbitro-login.html">entra aquí</a>.';
        hint.textContent = 'Partidos que arbitraste con "Compartir en vivo" activado — con acta completa, recuperable desde cualquier dispositivo. Necesitas haber iniciado sesión al arbitrarlos.';
        return;
      }
      onSnapshot(query(collection(db, "arbitrajes"), where("creadoPor", "==", user.uid)), (snap) => {
        const docs = snap.docs.slice().sort((a, b) => {
          const ma = a.data().actualizadoEn && a.data().actualizadoEn.toMillis ? a.data().actualizadoEn.toMillis() : 0;
          const mb = b.data().actualizadoEn && b.data().actualizadoEn.toMillis ? b.data().actualizadoEn.toMillis() : 0;
          return mb - ma;
        });
        ul.innerHTML = "";
        vacio.hidden = docs.length > 0;
        docs.forEach((d) => {
          const data = d.data();
          const c = data.config;
          const li = document.createElement("li");
          li.className = "arbitro-incident-item";
          const setsTxt = (data.match.sets || []).map((s) => `${s.a}-${s.b}`).join(", ") || "—";
          const actualizadoMs = data.actualizadoEn && data.actualizadoEn.toMillis ? data.actualizadoEn.toMillis() : Date.now();
          const badge = data.estado === "finalizado" ? "Finalizado" : data.estado === "interrumpido" ? "Interrumpido" : "En curso";
          const ganadorTxt = data.match.matchWinner ? (data.match.matchWinner === "A" ? `${c.a1} / ${c.a2}` : `${c.b1} / ${c.b2}`) : "sin terminar";
          li.innerHTML = `<span>
              <span class="inc-tipo">${c.a1} / ${c.a2} vs ${c.b1} / ${c.b2}</span>
              <span class="badge badge-confirmada" style="margin-left:6px">${badge}</span><br>
              <small>${[c.club, c.pista ? "Pista " + c.pista : ""].filter(Boolean).join(" · ")} · Sets: ${setsTxt} · Gana: ${ganadorTxt}</small>
            </span>
            <span>${tiempoRelativo(actualizadoMs)}<br>
              <a class="btn btn-outline btn-small" style="margin-top:4px" href="arbitro-vivo.html?id=${d.id}" target="_blank" rel="noopener">Ver acta</a>
            </span>`;
          ul.appendChild(li);
        });
      });
    });
  })
  .catch(() => {
    document.getElementById("nubeHint").textContent = "No se pudo conectar con el historial en la nube (revisa tu internet).";
  });
