import { auth, db, onAuthStateChanged, doc, getDoc, updateDoc, collection, getDocs } from "./firebase-app.js?v=3";
import { DIAS, FRANJAS, estaDisponible } from "./portal-common.js?v=3";

const ESTADOS_PISTA = ["Habilitada", "Reservada", "Bloqueada"];
const BADGE_POR_ESTADO = { Habilitada: "badge-confirmada", Reservada: "badge-pendiente", Bloqueada: "badge-rechazada" };

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const usuarioSnap = await getDoc(doc(db, "usuarios", user.uid));
  const esProfesor = usuarioSnap.exists() && usuarioSnap.data().rol === "profesor";

  const wrap = document.getElementById("lista-pistas");
  const snap = await getDocs(collection(db, "pistas"));
  if (snap.empty) {
    wrap.innerHTML = '<p class="empty-state">Aún no hay pistas cargadas.</p>';
    return;
  }

  wrap.innerHTML = "";
  snap.docs.forEach((d) => wrap.appendChild(construirTarjetaPista(d.id, d.data(), esProfesor)));
});

// Convierte "sitio.com | @handle" en enlaces para los dominios y texto plano para lo demás.
function renderWeb(web) {
  if (!web) return "";
  return web
    .split("|")
    .map((parte) => parte.trim())
    .map((parte) => (/\.[a-z]{2,}$/i.test(parte) ? `<a href="https://${parte}" target="_blank" rel="noopener">${parte}</a>` : parte))
    .join(" · ");
}

function construirTarjetaPista(pistaId, pista, esProfesor) {
  const card = document.createElement("div");
  card.className = "court-card";
  const estado = pista.estadoPista || "Habilitada";

  const header = document.createElement("div");
  header.innerHTML = `
    <h3>${pista.nombre} ${pista.cancha ? `<span class="court-meta">· ${pista.cancha}</span>` : ""}</h3>
    <p>${pista.direccion}</p>
    <p class="court-meta">📞 ${pista.telefono || "No publicado"} · 🕒 ${pista.horario || "Por confirmar"}</p>
    ${pista.precio ? `<p class="court-meta">💰 ${pista.precio}</p>` : ""}
    ${pista.web ? `<p class="court-meta">🔗 ${renderWeb(pista.web)}</p>` : ""}
    ${pista.notas ? `<p class="court-meta">${pista.notas}</p>` : ""}
    <p><span class="badge ${BADGE_POR_ESTADO[estado] || "badge-confirmada"}">${estado}</span></p>
    <h3 style="margin-top:16px; font-size:0.92rem;">${esProfesor ? "Disponibilidad habitual (editable)" : "Disponibilidad habitual"}</h3>
  `;
  card.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "availability-grid";
  DIAS.forEach((dia) => {
    FRANJAS.forEach((franja) => {
      const checked = estaDisponible(pista.disponibilidad, dia, franja);
      const label = document.createElement("label");
      label.className = "avail-slot" + (checked ? " checked" : "");
      label.innerHTML = `<input type="checkbox" data-dia="${dia}" data-franja="${franja}" ${checked ? "checked" : ""} ${esProfesor ? "" : "disabled"}> ${dia} · ${franja}`;
      if (esProfesor) {
        const input = label.querySelector("input");
        input.addEventListener("change", () => label.classList.toggle("checked", input.checked));
      }
      grid.appendChild(label);
    });
  });
  card.appendChild(grid);

  if (esProfesor) {
    const estadoField = document.createElement("div");
    estadoField.className = "field";
    estadoField.style.maxWidth = "220px";
    estadoField.style.marginTop = "14px";
    estadoField.innerHTML = `
      <label>Estado de la pista</label>
      <select>${ESTADOS_PISTA.map((e) => `<option ${e === estado ? "selected" : ""}>${e}</option>`).join("")}</select>
    `;
    const estadoSelect = estadoField.querySelector("select");
    card.appendChild(estadoField);

    const msg = document.createElement("p");
    msg.className = "form-msg";

    const btn = document.createElement("button");
    btn.className = "btn btn-outline btn-small";
    btn.type = "button";
    btn.textContent = "Guardar cambios";
    btn.style.marginTop = "10px";
    btn.addEventListener("click", async () => {
      const disponibilidad = Array.from(grid.querySelectorAll("input:checked")).map((input) => ({
        dia: input.dataset.dia,
        franja: input.dataset.franja
      }));
      try {
        await updateDoc(doc(db, "pistas", pistaId), { disponibilidad, estadoPista: estadoSelect.value });
        msg.textContent = "Guardado.";
        msg.className = "form-msg ok";
      } catch (err) {
        msg.textContent = "No se pudo guardar: " + err.message;
        msg.className = "form-msg error";
      }
    });
    card.appendChild(btn);
    card.appendChild(msg);
  }

  return card;
}
