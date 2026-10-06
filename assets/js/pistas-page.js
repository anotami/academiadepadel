import { auth, db, onAuthStateChanged, doc, getDoc, updateDoc, addDoc, collection, getDocs } from "./firebase-app.js?v=5";
import { DIAS, FRANJAS, estaDisponible } from "./portal-common.js?v=5";

const ESTADOS_PISTA = ["Habilitada", "Reservada", "Bloqueada"];
const BADGE_POR_ESTADO = { Habilitada: "badge-confirmada", Reservada: "badge-pendiente", Bloqueada: "badge-rechazada" };

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const usuarioSnap = await getDoc(doc(db, "usuarios", user.uid));
  const esProfesor = usuarioSnap.exists() && usuarioSnap.data().rol === "profesor";

  if (esProfesor) {
    document.getElementById("form-nueva-pista-wrap").appendChild(construirFormularioNuevaPista());
  }

  const wrap = document.getElementById("lista-pistas");
  const snap = await getDocs(collection(db, "pistas"));
  if (snap.empty) {
    wrap.innerHTML = '<p class="empty-state">Aún no hay pistas cargadas.</p>';
    return;
  }

  wrap.innerHTML = "";
  snap.docs.forEach((d) => wrap.appendChild(construirTarjetaPista(d.id, d.data(), esProfesor)));
});

function construirFormularioNuevaPista() {
  const card = document.createElement("div");
  card.className = "portal-card";
  card.innerHTML = `
    <h2>Agregar una pista nueva</h2>
    <div class="form-grid">
      <div class="field"><label>Nombre</label><input type="text" data-campo="nombre" required></div>
      <div class="field"><label>Cancha (opcional)</label><input type="text" data-campo="cancha" placeholder="Ej: Cancha 2"></div>
      <div class="field"><label>Distrito</label><input type="text" data-campo="distrito" required></div>
      <div class="field"><label>Dirección</label><input type="text" data-campo="direccion" required></div>
      <div class="field"><label>Teléfono</label><input type="text" data-campo="telefono"></div>
      <div class="field"><label>Horario (texto libre)</label><input type="text" data-campo="horario" placeholder="Ej: Lunes a domingo, 6:00 - 22:00"></div>
      <div class="field"><label>Precio</label><input type="text" data-campo="precio" placeholder="Ej: S/ 90 - S/ 130 / hr"></div>
      <div class="field"><label>Web / redes</label><input type="text" data-campo="web" placeholder="Ej: sitio.com | @usuario"></div>
      <div class="field">
        <label>Estado</label>
        <select data-campo="estadoPista">${ESTADOS_PISTA.map((e) => `<option>${e}</option>`).join("")}</select>
      </div>
    </div>
    <h3 style="margin-top:16px; font-size:0.92rem;">Disponibilidad habitual</h3>
    <div class="availability-grid" data-campo="disponibilidad"></div>
    <button class="btn btn-primary btn-small" type="button" style="margin-top:14px;">Crear pista</button>
    <p class="form-msg"></p>
  `;

  const grid = card.querySelector('[data-campo="disponibilidad"]');
  DIAS.forEach((dia) => {
    FRANJAS.forEach((franja) => {
      const label = document.createElement("label");
      label.className = "avail-slot";
      label.innerHTML = `<input type="checkbox" data-dia="${dia}" data-franja="${franja}"> ${dia} · ${franja}`;
      const input = label.querySelector("input");
      input.addEventListener("change", () => label.classList.toggle("checked", input.checked));
      grid.appendChild(label);
    });
  });

  const msg = card.querySelector(".form-msg");
  card.querySelector("button").addEventListener("click", async () => {
    const campo = (nombre) => card.querySelector(`[data-campo="${nombre}"]`).value.trim();
    const nombre = campo("nombre");
    const direccion = campo("direccion");
    const distrito = campo("distrito");
    if (!nombre || !direccion || !distrito) {
      msg.textContent = "Nombre, distrito y dirección son obligatorios.";
      msg.className = "form-msg error";
      return;
    }
    const disponibilidad = Array.from(grid.querySelectorAll("input:checked")).map((input) => ({
      dia: input.dataset.dia,
      franja: input.dataset.franja
    }));
    try {
      await addDoc(collection(db, "pistas"), {
        nombre,
        cancha: campo("cancha"),
        distrito,
        direccion,
        telefono: campo("telefono"),
        horario: campo("horario"),
        precio: campo("precio"),
        web: campo("web"),
        estadoPista: card.querySelector('[data-campo="estadoPista"]').value,
        notas: "",
        fuente: "Cargada por el profesor desde el portal",
        disponibilidad
      });
      msg.textContent = "Pista creada. Actualizando la lista...";
      msg.className = "form-msg ok";
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      msg.textContent = "No se pudo crear: " + err.message;
      msg.className = "form-msg error";
    }
  });

  return card;
}

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
