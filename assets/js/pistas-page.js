import { auth, db, onAuthStateChanged, signInAnonymously, doc, getDoc, updateDoc, addDoc, collection, getDocs } from "./firebase-app.js?v=18";
import { construirGrillaTarifaPista, prioridadNombreSede } from "./portal-common.js?v=21";

const ESTADOS_PISTA = ["Habilitada", "Reservada", "Bloqueada"];
const BADGE_POR_ESTADO = { Habilitada: "badge-confirmada", Reservada: "badge-pendiente", Bloqueada: "badge-rechazada" };
const ORDEN_ESTADO = { Habilitada: 0, Reservada: 1, Bloqueada: 2 };

// Las 3 sedes principales (X3, La Once, Benavides) primero, siempre.
// Después, el resto ordenado por estado (Habilitada antes que
// Reservada/Bloqueada) y luego por nombre.
function prioridadPista(pista) {
  const base = prioridadNombreSede(pista.nombre, pista.cancha);
  return base < 3 ? base : 3 + (ORDEN_ESTADO[pista.estadoPista] ?? 3);
}

function ordenarPistas(docs) {
  return docs.slice().sort((a, b) => {
    const pa = prioridadPista(a.data()), pb = prioridadPista(b.data());
    if (pa !== pb) return pa - pb;
    return (a.data().nombre || "").localeCompare(b.data().nombre || "", "es");
  });
}

// La página es pública: cualquiera puede ver las pistas sin crear cuenta.
// Si no hay sesión, entra con una cuenta anónima (igual que al dejar una
// reseña en el catálogo de canchas) solo para cumplir la regla de
// Firestore "allow read: if request.auth != null" — no crea ni pide
// ninguna cuenta real. Si ya hay una cuenta de profesor, además habilita
// el formulario para crear/editar pistas.
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      document.getElementById("lista-pistas").innerHTML =
        '<p class="empty-state">No se pudo cargar (revisa tu conexión) — recarga la página.</p>';
    }
    return; // onAuthStateChanged se vuelve a disparar con la cuenta anónima
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

  const pistasOrdenadas = ordenarPistas(snap.docs);
  construirFiltroDistrito(pistasOrdenadas, esProfesor);
});

// ---- Filtro por distrito (checkboxes múltiples) ----
function construirFiltroDistrito(docs, esProfesor) {
  const wrap = document.getElementById("lista-pistas");
  const filtroWrap = document.getElementById("filtro-distrito");
  const distritos = Array.from(new Set(docs.map((d) => d.data().distrito).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));

  function renderLista() {
    const seleccionados = new Set(
      Array.from(filtroWrap.querySelectorAll("input:checked")).map((i) => i.value)
    );
    const visibles = docs.filter((d) => seleccionados.has(d.data().distrito));
    wrap.innerHTML = "";
    if (!visibles.length) {
      wrap.innerHTML = '<p class="empty-state">No hay pistas en los distritos elegidos.</p>';
      return;
    }
    visibles.forEach((d) => wrap.appendChild(construirTarjetaPista(d.id, d.data(), esProfesor)));
  }

  if (!distritos.length) {
    filtroWrap.hidden = true;
    wrap.innerHTML = "";
    docs.forEach((d) => wrap.appendChild(construirTarjetaPista(d.id, d.data(), esProfesor)));
    return;
  }

  filtroWrap.hidden = false;
  filtroWrap.innerHTML = `
    <p class="field-hint" style="margin:0 0 8px; font-weight:700; color:var(--ink);">Filtrar por distrito</p>
    <div class="filtro-distrito-opciones">
      ${distritos.map((d) => `
        <label class="avail-slot filtro-distrito-item">
          <input type="checkbox" value="${d}" checked> ${d}
        </label>
      `).join("")}
    </div>
    <div class="disp-grid-actions" style="margin-top:8px;">
      <button class="btn btn-outline btn-small" type="button" id="filtro-todos">Marcar todos</button>
      <button class="btn btn-outline btn-small" type="button" id="filtro-ninguno">Ninguno</button>
    </div>
  `;
  filtroWrap.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", renderLista);
  });
  filtroWrap.querySelector("#filtro-todos").addEventListener("click", () => {
    filtroWrap.querySelectorAll('input[type="checkbox"]').forEach((i) => { i.checked = true; });
    renderLista();
  });
  filtroWrap.querySelector("#filtro-ninguno").addEventListener("click", () => {
    filtroWrap.querySelectorAll('input[type="checkbox"]').forEach((i) => { i.checked = false; });
    renderLista();
  });

  renderLista();
}

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
      <div class="field"><label>Precio (público, el que ve el alumno)</label><input type="text" data-campo="precio" placeholder="Ej: S/ 90 - S/ 130 / hr"></div>
      <div class="field"><label>Tu costo sin luz, por hora (S/, solo lo ves tú)</label><input type="number" min="0" step="1" data-campo="costoHoraSinLuz" placeholder="Ej: 80"></div>
      <div class="field"><label>Tu costo con luz, por hora (S/, solo lo ves tú)</label><input type="number" min="0" step="1" data-campo="costoHoraConLuz" placeholder="Ej: 100"></div>
      <div class="field"><label>Web / redes</label><input type="text" data-campo="web" placeholder="Ej: sitio.com | @usuario"></div>
      <div class="field">
        <label>Estado</label>
        <select data-campo="estadoPista">${ESTADOS_PISTA.map((e) => `<option>${e}</option>`).join("")}</select>
      </div>
    </div>
    <div class="disp-grid-head">
      <h3 style="margin:16px 0 0; font-size:0.92rem;">Horario y tarifa (con o sin luz)</h3>
      <div class="disp-grid-actions">
        <button class="btn btn-outline btn-small" type="button" data-accion="todo-sin-luz">Todo sin luz</button>
        <button class="btn btn-outline btn-small" type="button" data-accion="todo-con-luz">Todo con luz</button>
        <button class="btn btn-outline btn-small" type="button" data-accion="limpiar-todo">Limpiar todo</button>
      </div>
    </div>
    <p class="field-hint">Toca cada bloque para rotar: libre → sin luz → con luz → libre.</p>
    <p class="disp-legend"><span class="disp-legend-swatch tarifa-sin-luz"></span> Sin luz <span class="disp-legend-swatch tarifa-con-luz"></span> Con luz</p>
    <div class="availability-grid" data-campo="disponibilidad"></div>
    <button class="btn btn-primary btn-small" type="button" data-accion="crear-pista" style="margin-top:14px;">Crear pista</button>
    <p class="form-msg"></p>
  `;

  const gridWrap = card.querySelector('[data-campo="disponibilidad"]');
  const grid = construirGrillaTarifaPista(gridWrap);
  card.querySelector('[data-accion="todo-sin-luz"]').addEventListener("click", () => grid.marcarTodoComo("sin-luz"));
  card.querySelector('[data-accion="todo-con-luz"]').addEventListener("click", () => grid.marcarTodoComo("con-luz"));
  card.querySelector('[data-accion="limpiar-todo"]').addEventListener("click", () => grid.marcarTodoComo(null));

  const msg = card.querySelector(".form-msg");
  card.querySelector('[data-accion="crear-pista"]').addEventListener("click", async () => {
    const campo = (nombre) => card.querySelector(`[data-campo="${nombre}"]`).value.trim();
    const nombre = campo("nombre");
    const direccion = campo("direccion");
    const distrito = campo("distrito");
    if (!nombre || !direccion || !distrito) {
      msg.textContent = "Nombre, distrito y dirección son obligatorios.";
      msg.className = "form-msg error";
      return;
    }
    const disponibilidad = grid.obtenerSeleccion();
    try {
      await addDoc(collection(db, "pistas"), {
        nombre,
        cancha: campo("cancha"),
        distrito,
        direccion,
        telefono: campo("telefono"),
        horario: campo("horario"),
        precio: campo("precio"),
        costoHoraSinLuz: Number(campo("costoHoraSinLuz")) || 0,
        costoHoraConLuz: Number(campo("costoHoraConLuz")) || 0,
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
    <h3 style="margin-top:16px; font-size:0.92rem;">${esProfesor ? "Horario y tarifa (editable)" : "Horario y tarifa"}</h3>
    <p class="disp-legend"><span class="disp-legend-swatch tarifa-sin-luz"></span> Sin luz <span class="disp-legend-swatch tarifa-con-luz"></span> Con luz</p>
  `;
  card.appendChild(header);

  const gridWrap = document.createElement("div");
  const grid = construirGrillaTarifaPista(gridWrap, { editable: esProfesor, marcadas: pista.disponibilidad || [] });
  card.appendChild(gridWrap);

  if (esProfesor) {
    const accionesWrap = document.createElement("div");
    accionesWrap.className = "disp-grid-actions";
    accionesWrap.style.marginTop = "8px";
    accionesWrap.innerHTML = `
      <button class="btn btn-outline btn-small" type="button" data-accion="todo-sin-luz">Todo sin luz</button>
      <button class="btn btn-outline btn-small" type="button" data-accion="todo-con-luz">Todo con luz</button>
      <button class="btn btn-outline btn-small" type="button" data-accion="limpiar-todo">Limpiar todo</button>
    `;
    accionesWrap.querySelector('[data-accion="todo-sin-luz"]').addEventListener("click", () => grid.marcarTodoComo("sin-luz"));
    accionesWrap.querySelector('[data-accion="todo-con-luz"]').addEventListener("click", () => grid.marcarTodoComo("con-luz"));
    accionesWrap.querySelector('[data-accion="limpiar-todo"]').addEventListener("click", () => grid.marcarTodoComo(null));
    card.appendChild(accionesWrap);

    const fieldsWrap = document.createElement("div");
    fieldsWrap.className = "form-grid";
    fieldsWrap.style.maxWidth = "460px";
    fieldsWrap.style.marginTop = "14px";
    fieldsWrap.innerHTML = `
      <div class="field">
        <label>Estado de la pista</label>
        <select data-campo="estadoPista">${ESTADOS_PISTA.map((e) => `<option ${e === estado ? "selected" : ""}>${e}</option>`).join("")}</select>
      </div>
      <div class="field field-full">
        <label>Precio (público, el que ve el alumno)</label>
        <input type="text" data-campo="precio" value="${pista.precio || ""}" placeholder="Ej: S/ 80 (sin luz) - S/ 100 (con luz) / hr">
      </div>
      <div class="field">
        <label>Tu costo sin luz, por hora (S/)</label>
        <input type="number" min="0" step="1" data-campo="costoHoraSinLuz" value="${pista.costoHoraSinLuz || 0}">
      </div>
      <div class="field">
        <label>Tu costo con luz, por hora (S/)</label>
        <input type="number" min="0" step="1" data-campo="costoHoraConLuz" value="${pista.costoHoraConLuz || 0}">
      </div>
    `;
    const estadoSelect = fieldsWrap.querySelector('[data-campo="estadoPista"]');
    const precioInput = fieldsWrap.querySelector('[data-campo="precio"]');
    const costoSinLuzInput = fieldsWrap.querySelector('[data-campo="costoHoraSinLuz"]');
    const costoConLuzInput = fieldsWrap.querySelector('[data-campo="costoHoraConLuz"]');
    card.appendChild(fieldsWrap);

    const msg = document.createElement("p");
    msg.className = "form-msg";

    const btn = document.createElement("button");
    btn.className = "btn btn-outline btn-small";
    btn.type = "button";
    btn.textContent = "Guardar cambios";
    btn.style.marginTop = "10px";
    btn.addEventListener("click", async () => {
      const disponibilidad = grid.obtenerSeleccion();
      try {
        await updateDoc(doc(db, "pistas", pistaId), {
          disponibilidad,
          estadoPista: estadoSelect.value,
          precio: precioInput.value.trim(),
          costoHoraSinLuz: Number(costoSinLuzInput.value) || 0,
          costoHoraConLuz: Number(costoConLuzInput.value) || 0
        });
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
