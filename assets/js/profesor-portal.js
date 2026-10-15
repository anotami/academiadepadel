import {
  auth, db,
  onAuthStateChanged, signOut,
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, orderBy, limit, onSnapshot, getDocs, serverTimestamp, increment
} from "./firebase-app.js?v=17";
import {
  DIAS, NIVELES, TIPOS_PAQUETE, TIPOS_CLASE, PRECIOS_CLASE_SUELTA, HORAS_RESERVA, esProgramaRegular, soloDigitos,
  formatearFecha, formatearFechaLarga, diaDeSemana, horaAFranja, estaDisponible, fechaYaPaso, construirGrillaDisponibilidad
} from "./portal-common.js?v=18";

let currentUid = null;
let currentPerfil = null;
let alumnosCache = [];
let pistasCache = [];
let turnosGrupalesCache = [];
let interesadosGrupoCache = [];

function mostrarErrorConsulta(wrap, err) {
  const match = err.message && err.message.match(/https:\/\/\S+/);
  wrap.innerHTML = `<p class="empty-state">No se pudo cargar: ${err.message}${
    match ? ` — <a href="${match[0]}" target="_blank" rel="noopener">crear el índice aquí</a> y recargar la página.` : ""
  }</p>`;
}

document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists() || snap.data().rol !== "profesor") {
    window.location.href = "login.html";
    return;
  }
  currentUid = user.uid;
  currentPerfil = snap.data();
  document.getElementById("who-nombre").textContent = currentPerfil.nombre || user.email;
  rellenarPerfil(currentPerfil);
  await cargarPistasCache();
  cargarPendientes(user.uid);
  cargarConfirmadas(user.uid);
  await cargarAlumnos();
  cargarPaquetes();
  poblarSelectPaquete();
  poblarSelectsClase();
  cargarMetricas(user.uid);
  cargarSeguimiento(user.uid);
  cargarEsperas();
  cargarTurnosGrupales();
  cargarInteresadosGrupo();
  cargarHistorialClases(user.uid);
});

function poblarSelectPaquete() {
  document.getElementById("pq-tipo").innerHTML = TIPOS_PAQUETE.map((t) => `<option>${t}</option>`).join("");
}

// ---- Nuevo alumno + registrar clase ya dictada ----
function poblarSelectsClase() {
  const opcionesTipo = TIPOS_CLASE.map((grupo) => `
    <optgroup label="${grupo.grupo}">
      ${grupo.opciones.map((op) => `<option value="${op}">${op}</option>`).join("")}
    </optgroup>
  `).join("");
  document.getElementById("na-programa").innerHTML = opcionesTipo;
  document.getElementById("cd-tipo").innerHTML = opcionesTipo;

  document.getElementById("cd-pista").innerHTML = pistasCache
    .filter((p) => p.estadoPista !== "Bloqueada")
    .map((p) => `<option value="${p.id}">${p.nombre} — ${p.distrito}</option>`)
    .join("");

  document.getElementById("cd-hora").innerHTML = HORAS_RESERVA.map((h) => `<option value="${h}">${h}</option>`).join("");

  document.getElementById("cd-monto").value = PRECIOS_CLASE_SUELTA["Particular"];
}

document.getElementById("cd-modalidad").addEventListener("change", (e) => {
  document.getElementById("cd-monto").value = PRECIOS_CLASE_SUELTA[e.target.value] ?? "";
});

document.getElementById("form-nuevo-alumno").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("nuevo-alumno-msg");
  const nombre = document.getElementById("na-nombre").value.trim();
  const telefono = document.getElementById("na-telefono").value.trim();
  const whatsapp = document.getElementById("na-whatsapp").value.trim();
  const instagram = document.getElementById("na-instagram").value.trim();
  const edad = Number(document.getElementById("na-edad").value) || null;
  const nivel = document.getElementById("na-nivel").value;
  const programa = document.getElementById("na-programa").value;
  const observaciones = document.getElementById("na-observaciones").value.trim();
  try {
    await setDoc(doc(collection(db, "usuarios")), {
      rol: "alumno", nombre, telefono, whatsapp, instagram, edad, nivel, programa, observaciones,
      disponibilidad: [], creadoEn: serverTimestamp()
    });
    e.target.reset();
    msg.textContent = `Alumno "${nombre}" creado — ya aparece en los selectores de abajo.`;
    msg.className = "form-msg ok";
    await cargarAlumnos();
  } catch (err) {
    msg.textContent = "No se pudo crear: " + err.message;
    msg.className = "form-msg error";
  }
});

document.getElementById("form-clase-dictada").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("clase-dictada-msg");
  const alumnoIds = Array.from(document.getElementById("cd-alumno").selectedOptions).map((o) => o.value);
  const tipoClase = document.getElementById("cd-tipo").value;
  const pistaId = document.getElementById("cd-pista").value;
  const fecha = document.getElementById("cd-fecha").value;
  const hora = document.getElementById("cd-hora").value;
  const modalidad = document.getElementById("cd-modalidad").value;
  const montoCobrado = Number(document.getElementById("cd-monto").value) || 0;
  const costoCanchaPagadoRaw = document.getElementById("cd-cancha-pagada").value;
  const costoCanchaTotal = costoCanchaPagadoRaw === "" ? null : Number(costoCanchaPagadoRaw);
  const pista = pistasCache.find((p) => p.id === pistaId);
  const alumnosSeleccionados = alumnoIds.map((id) => alumnosCache.find((a) => a.id === id)).filter(Boolean);

  if (!alumnosSeleccionados.length || !pista) {
    msg.textContent = "Elige al menos un alumno y una pista válidos.";
    msg.className = "form-msg error";
    return;
  }
  // El costo de cancha es por sesión, no por persona — se reparte entre
  // todos los alumnos elegidos para que Rentabilidad no lo cuente varias veces.
  const costoCanchaPorAlumno = costoCanchaTotal === null ? null : costoCanchaTotal / alumnosSeleccionados.length;

  try {
    for (const alumno of alumnosSeleccionados) {
      await addDoc(collection(db, "reservas"), {
        alumnoId: alumno.id, alumnoNombre: alumno.nombre, alumnoTelefono: alumno.telefono || "",
        profesorId: currentUid, profesorNombre: currentPerfil.nombre,
        tipoClase, pistaId, pistaNombre: `${pista.nombre} — ${pista.distrito}`,
        fecha, hora, estado: "confirmada",
        modalidad, montoCobrado, costoCanchaPagado: costoCanchaPorAlumno,
        creadoEn: serverTimestamp()
      });
    }
    e.target.reset();
    document.getElementById("cd-monto").value = PRECIOS_CLASE_SUELTA["Particular"];
    const nombres = alumnosSeleccionados.map((a) => a.nombre).join(", ");
    msg.textContent = `Clase registrada para ${nombres} — ve a "Hoy" → "Clases por registrar" para marcar asistencia y feedback.`;
    msg.className = "form-msg ok";
  } catch (err) {
    msg.textContent = "No se pudo registrar: " + err.message;
    msg.className = "form-msg error";
  }
});

async function cargarPistasCache() {
  const snap = await getDocs(collection(db, "pistas"));
  pistasCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---- Disponibilidad grid ----
const dispWrap = document.getElementById("p-disponibilidad");
let dispGrid = construirGrillaDisponibilidad(dispWrap);

document.getElementById("p-disp-todo")?.addEventListener("click", () => dispGrid.seleccionarTodo(true));
document.getElementById("p-disp-ninguno")?.addEventListener("click", () => dispGrid.seleccionarTodo(false));

function rellenarPerfil(perfil) {
  document.getElementById("p-telefono").value = perfil.telefono || "";
  document.getElementById("p-especialidad").value = perfil.especialidad || "";
  document.getElementById("p-costo-hora").value = perfil.costoHora || 0;
  document.getElementById("p-bio").value = perfil.bio || "";
  dispGrid = construirGrillaDisponibilidad(dispWrap, { marcadas: perfil.disponibilidad || [] });
}

document.getElementById("form-perfil").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("perfil-msg");
  const disponibilidad = dispGrid.obtenerSeleccion();
  try {
    const costoHora = Number(document.getElementById("p-costo-hora").value) || 0;
    await updateDoc(doc(db, "usuarios", currentUid), {
      telefono: document.getElementById("p-telefono").value.trim(),
      especialidad: document.getElementById("p-especialidad").value.trim(),
      bio: document.getElementById("p-bio").value.trim(),
      costoHora,
      disponibilidad
    });
    currentPerfil.disponibilidad = disponibilidad;
    currentPerfil.costoHora = costoHora;
    msg.textContent = "Datos actualizados.";
    msg.className = "form-msg ok";
  } catch (err) {
    msg.textContent = "No se pudo guardar: " + err.message;
    msg.className = "form-msg error";
  }
});

// ---- Solicitudes pendientes ----
function cargarPendientes(uid) {
  const wrap = document.getElementById("lista-pendientes");
  const q = query(
    collection(db, "reservas"),
    where("profesorId", "==", uid),
    where("estado", "==", "pendiente"),
    orderBy("creadoEn", "asc")
  );
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      wrap.innerHTML = '<p class="empty-state">No hay solicitudes pendientes.</p>';
      return;
    }
    wrap.innerHTML = "";
    snap.docs.forEach((d) => {
      const r = d.data();
      const card = document.createElement("div");
      card.className = "request-card";
      card.innerHTML = `
        <div class="request-info">
          <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.alumnoNombre}</p>
          <p>${r.pistaNombre} · ${formatearFecha(r.fecha)} · ${r.hora} hrs ${r.alumnoTelefono ? "· " + r.alumnoTelefono : ""}</p>
          ${r.nota ? `<p>"${r.nota}"</p>` : ""}
          ${badgesDisponibilidad(r)}
        </div>
        <div class="request-actions">
          <button class="btn btn-primary btn-small" data-action="confirmar">Confirmar</button>
          <button class="btn btn-outline btn-small" data-action="rechazar">Rechazar</button>
        </div>`;

      card.querySelector('[data-action="confirmar"]').addEventListener("click", () => confirmar(d.id, r));
      card.querySelector('[data-action="rechazar"]').addEventListener("click", () => rechazar(d.id));
      wrap.appendChild(card);
    });
  }, (err) => mostrarErrorConsulta(wrap, err));
}

// Compara el horario pedido contra tu disponibilidad y la de la pista.
function badgesDisponibilidad(r) {
  const dia = diaDeSemana(r.fecha);
  const franja = horaAFranja(r.hora);
  const pista = pistasCache.find((p) => p.id === r.pistaId);
  const okProfesor = estaDisponible(currentPerfil.disponibilidad, dia, franja);
  const okPista = pista ? estaDisponible(pista.disponibilidad, dia, franja) : false;
  const badge = (ok, label) =>
    `<span class="badge ${ok ? "badge-confirmada" : "badge-rechazada"}">${ok ? "✓" : "⚠"} ${label}</span>`;
  return `<p>${badge(okProfesor, "tu disponibilidad")} ${badge(okPista, "disponibilidad de la pista")}</p>`;
}

async function confirmar(reservaId, reserva) {
  const choque = await getDocs(
    query(
      collection(db, "reservas"),
      where("pistaId", "==", reserva.pistaId),
      where("fecha", "==", reserva.fecha),
      where("hora", "==", reserva.hora),
      where("estado", "==", "confirmada")
    )
  );
  if (!choque.empty) {
    alert("Esa pista ya tiene otra clase confirmada en ese mismo horario. Rechaza esta o coordina otro horario con el alumno.");
    return;
  }
  await updateDoc(doc(db, "reservas", reservaId), { estado: "confirmada" });

  if (esProgramaRegular(reserva.tipoClase)) {
    await descontarClaseDePaquete(reservaId, reserva.alumnoId);
  }
}

// Busca el paquete activo más antiguo del alumno y le descuenta una clase.
// Si no tiene paquete activo, confirma igual pero sin tocar paquetes (ej. alumno nuevo sin paquete).
async function descontarClaseDePaquete(reservaId, alumnoId) {
  const snap = await getDocs(query(collection(db, "paquetes"), where("alumnoId", "==", alumnoId)));
  const activos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.clasesUsadas < p.clasesTotales)
    .sort((a, b) => (a.creadoEn?.seconds || 0) - (b.creadoEn?.seconds || 0));
  if (activos.length === 0) return;

  const paquete = activos[0];
  await updateDoc(doc(db, "paquetes", paquete.id), { clasesUsadas: paquete.clasesUsadas + 1 });
  await updateDoc(doc(db, "reservas", reservaId), { paqueteId: paquete.id });
}

async function rechazar(reservaId) {
  await updateDoc(doc(db, "reservas", reservaId), { estado: "rechazada" });
}

// ---- Próximas confirmadas + clases por registrar ----
// Una sola consulta (confirmadas) que se reparte en dos listas según la fecha:
// pasadas sin registrar (asistencia + feedback) y futuras.
function cargarConfirmadas(uid) {
  const wrapFuturas = document.getElementById("lista-confirmadas");
  const wrapPorRegistrar = document.getElementById("lista-por-registrar");
  const q = query(
    collection(db, "reservas"),
    where("profesorId", "==", uid),
    where("estado", "==", "confirmada"),
    orderBy("fecha", "asc")
  );
  onSnapshot(q, (snap) => {
    const porRegistrar = [];
    const futuras = [];
    snap.docs.forEach((d) => {
      const r = { id: d.id, ...d.data() };
      if (fechaYaPaso(r.fecha) && !r.registrada) porRegistrar.push(r);
      else if (!r.registrada || !fechaYaPaso(r.fecha)) futuras.push(r);
    });

    wrapPorRegistrar.innerHTML = "";
    if (porRegistrar.length === 0) {
      wrapPorRegistrar.innerHTML = '<p class="empty-state">No hay clases pendientes de registrar.</p>';
    } else {
      porRegistrar.forEach((r) => wrapPorRegistrar.appendChild(construirTarjetaRegistro(r)));
    }

    wrapFuturas.innerHTML = "";
    if (futuras.length === 0) {
      wrapFuturas.innerHTML = '<p class="empty-state">Aún no tienes clases confirmadas.</p>';
    } else {
      futuras.forEach((r) => wrapFuturas.appendChild(construirTarjetaFutura(r)));
    }
  }, (err) => {
    mostrarErrorConsulta(wrapFuturas, err);
    mostrarErrorConsulta(wrapPorRegistrar, err);
  });
}

function construirTarjetaFutura(r) {
  const card = document.createElement("div");
  card.className = "request-card";
  card.innerHTML = `
    <div class="request-info">
      <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.alumnoNombre}</p>
      <p>${r.pistaNombre} · ${formatearFecha(r.fecha)} · ${r.hora} hrs ${r.alumnoTelefono ? "· " + r.alumnoTelefono : ""}</p>
      <div class="field-full" data-reprogramar-form hidden style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end;">
        <div class="field"><label>Nueva fecha</label><input type="date" data-campo="fecha" value="${r.fecha}"></div>
        <div class="field"><label>Nueva hora</label><select data-campo="hora">${HORAS_RESERVA.map((h) => `<option ${h === r.hora ? "selected" : ""}>${h}</option>`).join("")}</select></div>
        <button class="btn btn-primary btn-small" type="button" data-guardar-reprogramacion>Guardar</button>
      </div>
      <p class="form-msg"></p>
    </div>
    <div class="request-actions">
      <span class="badge badge-confirmada">confirmada</span>
      ${linkRecordatorio(r)}
      <button class="btn btn-outline btn-small" type="button" data-toggle-reprogramar>Reprogramar</button>
      <button class="btn btn-outline btn-small" type="button" data-cancelar>Cancelar</button>
    </div>`;

  const form = card.querySelector("[data-reprogramar-form]");
  card.querySelector("[data-toggle-reprogramar]").addEventListener("click", () => {
    form.hidden = !form.hidden;
  });
  const msg = card.querySelector(".form-msg");

  card.querySelector("[data-cancelar]").addEventListener("click", async () => {
    if (!confirm(`¿Cancelar la clase de ${r.alumnoNombre} del ${formatearFecha(r.fecha)}?`)) return;
    try {
      await updateDoc(doc(db, "reservas", r.id), { estado: "cancelada" });
    } catch (err) {
      msg.textContent = "No se pudo cancelar: " + err.message;
      msg.className = "form-msg error";
    }
  });
  card.querySelector("[data-guardar-reprogramacion]").addEventListener("click", async () => {
    const fecha = form.querySelector('[data-campo="fecha"]').value;
    const hora = form.querySelector('[data-campo="hora"]').value;
    const choque = await getDocs(
      query(
        collection(db, "reservas"),
        where("pistaId", "==", r.pistaId),
        where("fecha", "==", fecha),
        where("hora", "==", hora),
        where("estado", "==", "confirmada")
      )
    );
    if (choque.docs.some((d) => d.id !== r.id)) {
      msg.textContent = "Esa pista ya tiene otra clase confirmada en ese horario.";
      msg.className = "form-msg error";
      return;
    }
    try {
      await updateDoc(doc(db, "reservas", r.id), { fecha, hora });
      msg.textContent = "Reprogramada.";
      msg.className = "form-msg ok";
    } catch (err) {
      msg.textContent = "No se pudo reprogramar: " + err.message;
      msg.className = "form-msg error";
    }
  });

  return card;
}

function construirTarjetaRegistro(r) {
  const card = document.createElement("div");
  card.className = "request-card";
  card.innerHTML = `
    <div class="request-info" style="flex:1 1 100%;">
      <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.alumnoNombre}</p>
      <p>${r.pistaNombre} · ${formatearFecha(r.fecha)} · ${r.hora} hrs</p>
      <label class="avail-slot" style="display:inline-flex; margin:8px 0;">
        <input type="checkbox" checked data-campo="asistio"> Asistió a la clase
      </label>
      <div class="form-grid">
        <div class="field">
          <label>Nivel trabajado</label>
          <select data-campo="nivel">${NIVELES.map((n) => `<option>${n}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>Próximo objetivo</label>
          <input type="text" data-campo="objetivo" placeholder="Ej: afirmar la volea">
        </div>
        <div class="field field-full">
          <label>Comentario de la sesión</label>
          <input type="text" data-campo="comentario" placeholder="Qué se trabajó, cómo le fue...">
        </div>
      </div>
      <button class="btn btn-primary btn-small" type="button" style="margin-top:10px;">Guardar registro</button>
      <p class="form-msg"></p>
    </div>`;

  const msg = card.querySelector(".form-msg");
  card.querySelector("button").addEventListener("click", async () => {
    const asistio = card.querySelector('[data-campo="asistio"]').checked;
    const nivelTrabajado = card.querySelector('[data-campo="nivel"]').value;
    const siguienteObjetivo = card.querySelector('[data-campo="objetivo"]').value.trim();
    const comentario = card.querySelector('[data-campo="comentario"]').value.trim();
    try {
      await updateDoc(doc(db, "reservas", r.id), {
        registrada: true,
        asistio,
        feedback: { nivelTrabajado, comentario, siguienteObjetivo }
      });
      msg.textContent = "Registrado. El alumno ya puede verlo.";
      msg.className = "form-msg ok";
    } catch (err) {
      msg.textContent = "No se pudo guardar: " + err.message;
      msg.className = "form-msg error";
    }
  });

  return card;
}

// ---- Historial de clases registradas (ver + corregir monto/cancha) ----
function cargarHistorialClases(uid) {
  const wrap = document.getElementById("lista-historial");
  const q = query(
    collection(db, "reservas"),
    where("profesorId", "==", uid),
    orderBy("fecha", "desc"),
    limit(150)
  );
  onSnapshot(q, (snap) => {
    const reservas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    wrap.innerHTML = "";
    if (reservas.length === 0) {
      wrap.innerHTML = '<p class="empty-state">Aún no registraste ninguna clase.</p>';
      return;
    }
    reservas.forEach((r) => wrap.appendChild(construirTarjetaHistorial(r)));
  }, (err) => mostrarErrorConsulta(wrap, err));
}

function construirTarjetaHistorial(r) {
  const card = document.createElement("div");
  card.className = "request-card";
  const estadoLabel = { confirmada: "confirmada", cancelada: "cancelada", rechazada: "rechazada", pendiente: "pendiente" }[r.estado] || r.estado;
  card.innerHTML = `
    <div class="request-info" style="flex:1 1 100%;">
      <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.alumnoNombre}</p>
      <p>${r.pistaNombre || ""} · ${formatearFecha(r.fecha)} · ${r.hora} hrs
        ${r.modalidad ? "· " + r.modalidad : ""}
        ${typeof r.montoCobrado === "number" ? `· cobrado S/ ${r.montoCobrado}` : ""}
        ${typeof r.costoCanchaPagado === "number" ? `· cancha S/ ${r.costoCanchaPagado.toFixed(2)}` : ""}
      </p>
      <div class="form-grid" data-editar-form hidden style="margin-top:8px;">
        <div class="field">
          <label>Modalidad</label>
          <select data-campo="modalidad">
            <option value="Particular" ${r.modalidad === "Particular" ? "selected" : ""}>Particular</option>
            <option value="Grupal (2-4 personas)" ${r.modalidad === "Grupal (2-4 personas)" ? "selected" : ""}>Grupal (2-4 personas)</option>
            ${r.modalidad === "Dúo (2 personas)" || r.modalidad === "Grupal (3-4 personas)" ? `<option value="${r.modalidad}" selected>${r.modalidad} (anterior)</option>` : ""}
          </select>
        </div>
        <div class="field">
          <label>Monto cobrado (S/)</label>
          <input type="number" min="0" step="1" data-campo="montoCobrado" value="${typeof r.montoCobrado === "number" ? r.montoCobrado : ""}">
        </div>
        <div class="field">
          <label>Costo de cancha de ESTA clase (S/)</label>
          <input type="number" min="0" step="0.01" data-campo="costoCanchaPagado" value="${typeof r.costoCanchaPagado === "number" ? r.costoCanchaPagado.toFixed(2) : ""}">
          <p class="field-hint">Si fue grupal, pon aquí la parte que le toca a este alumno (el total de la cancha dividido entre todos), no el total de la sesión.</p>
        </div>
        <div class="field">
          <label>Estado</label>
          <select data-campo="estado">
            <option value="confirmada" ${r.estado === "confirmada" ? "selected" : ""}>Confirmada</option>
            <option value="cancelada" ${r.estado === "cancelada" ? "selected" : ""}>Cancelada</option>
          </select>
        </div>
        <button class="btn btn-primary btn-small" type="button" data-guardar-historial>Guardar</button>
      </div>
      <p class="form-msg"></p>
    </div>
    <div class="request-actions">
      <span class="badge ${r.estado === "confirmada" ? "badge-confirmada" : "badge-pendiente"}">${estadoLabel}</span>
      <button class="btn btn-outline btn-small" type="button" data-toggle-editar-historial>Editar</button>
    </div>`;

  const form = card.querySelector("[data-editar-form]");
  card.querySelector("[data-toggle-editar-historial]").addEventListener("click", () => {
    form.hidden = !form.hidden;
  });
  const msg = card.querySelector(".form-msg");
  card.querySelector("[data-guardar-historial]").addEventListener("click", async () => {
    const modalidad = form.querySelector('[data-campo="modalidad"]').value;
    const montoCobrado = Number(form.querySelector('[data-campo="montoCobrado"]').value) || 0;
    const costoCanchaRaw = form.querySelector('[data-campo="costoCanchaPagado"]').value;
    const estado = form.querySelector('[data-campo="estado"]').value;
    try {
      await updateDoc(doc(db, "reservas", r.id), {
        modalidad,
        montoCobrado,
        costoCanchaPagado: costoCanchaRaw === "" ? null : Number(costoCanchaRaw),
        estado
      });
      msg.textContent = "Actualizado.";
      msg.className = "form-msg ok";
    } catch (err) {
      msg.textContent = "No se pudo guardar: " + err.message;
      msg.className = "form-msg error";
    }
  });

  return card;
}

// ---- Disponibilidad de alumnos ----
async function cargarAlumnos() {
  const wrap = document.getElementById("lista-alumnos");
  const [snapAlumnos, snapReservas] = await Promise.all([
    getDocs(query(collection(db, "usuarios"), where("rol", "==", "alumno"))),
    getDocs(query(collection(db, "reservas"), where("profesorId", "==", currentUid)))
  ]);
  alumnosCache = snapAlumnos.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Qué tipos de clase tomó cada alumno hasta ahora — un alumno no queda
  // encasillado en un solo programa, cada reserva elige el suyo.
  const tiposPorAlumno = {};
  snapReservas.docs.forEach((d) => {
    const r = d.data();
    if (!r.alumnoId || !r.tipoClase) return;
    (tiposPorAlumno[r.alumnoId] ||= new Set()).add(r.tipoClase);
  });

  const opcionesAlumno = alumnosCache.map((a) => `<option value="${a.id}">${a.nombre}</option>`).join("");
  document.getElementById("pq-alumno").innerHTML = opcionesAlumno;
  document.getElementById("cd-alumno").innerHTML = opcionesAlumno;

  if (!alumnosCache.length) {
    wrap.innerHTML = '<p class="empty-state">Todavía no hay alumnos registrados.</p>';
    return;
  }
  wrap.innerHTML = "";
  alumnosCache.forEach((a) => {
    const chipsDisp = (a.disponibilidad || [])
      .map((x) => `<span class="badge badge-confirmada">${x.dia} · ${x.franja}</span>`)
      .join(" ");
    const clasesTomadas = Array.from(tiposPorAlumno[a.id] || []);
    const card = document.createElement("div");
    card.className = "court-card";
    const instagramLink = a.instagram
      ? `<a href="https://instagram.com/${a.instagram.replace(/^@/, "")}" target="_blank" rel="noopener">@${a.instagram.replace(/^@/, "")}</a>`
      : "";
    card.innerHTML = `
      <h3>${a.nombre}</h3>
      <p class="court-meta">${a.telefono || "Sin teléfono"} · Nivel ${a.nivel || "—"}</p>
      ${a.whatsapp ? `<p class="court-meta">WhatsApp: ${a.whatsapp}</p>` : ""}
      ${instagramLink ? `<p class="court-meta">Instagram: ${instagramLink}</p>` : ""}
      ${a.programa ? `<p class="court-meta">Llegó por: ${a.programa}</p>` : ""}
      ${clasesTomadas.length ? `<p class="court-meta">Clases tomadas: ${clasesTomadas.join(", ")}</p>` : ""}
      ${a.apoderado ? `<p class="court-meta">👪 Apoderado: ${a.apoderado.nombre} · ${a.apoderado.telefono}</p>` : ""}
      ${a.referidoPor ? `<p class="court-meta">🤝 Invitado por: ${a.referidoPor}</p>` : ""}
      ${a.observaciones ? `<p class="court-meta">📝 ${a.observaciones}</p>` : ""}
      <p>${chipsDisp || '<span class="court-meta">Sin disponibilidad cargada todavía.</span>'}</p>
      <button class="btn btn-outline btn-small" type="button" data-toggle-editar style="margin-top:8px;">Editar</button>
      <div class="form-grid" data-editar-form hidden style="margin:10px 0;">
        <div class="field"><label>Nombre</label><input type="text" data-campo="nombre" value="${a.nombre || ""}"></div>
        <div class="field"><label>Teléfono</label><input type="tel" data-campo="telefono" value="${a.telefono || ""}"></div>
        <div class="field"><label>Usuario de WhatsApp</label><input type="text" data-campo="whatsapp" value="${a.whatsapp || ""}"></div>
        <div class="field"><label>Usuario de Instagram</label><input type="text" data-campo="instagram" value="${a.instagram || ""}"></div>
        <div class="field"><label>Nivel</label>
          <select data-campo="nivel">
            ${["Inicial", "Inicial-Intermedio", "Intermedio"].map((n) => `<option ${n === a.nivel ? "selected" : ""}>${n}</option>`).join("")}
          </select>
        </div>
        <div class="field field-full"><label>Observaciones</label><textarea data-campo="observaciones" rows="2">${a.observaciones || ""}</textarea></div>
        <div class="field field-full">
          <div class="disp-grid-head">
            <label style="margin:0;">Disponibilidad</label>
            <div class="disp-grid-actions">
              <button class="btn btn-outline btn-small" type="button" data-disp-todo>Marcar todo</button>
              <button class="btn btn-outline btn-small" type="button" data-disp-ninguno>Limpiar todo</button>
            </div>
          </div>
          <div class="availability-grid" data-disp-grid></div>
        </div>
        <button class="btn btn-primary btn-small" type="button" data-guardar-alumno>Guardar</button>
      </div>
      <p class="form-msg"></p>`;
    const form = card.querySelector("[data-editar-form]");
    const msg = card.querySelector(".form-msg");
    let dispGridAlumno = null;
    card.querySelector("[data-toggle-editar]").addEventListener("click", () => {
      form.hidden = !form.hidden;
      if (!form.hidden && !dispGridAlumno) {
        dispGridAlumno = construirGrillaDisponibilidad(form.querySelector("[data-disp-grid]"), { marcadas: a.disponibilidad || [] });
        form.querySelector("[data-disp-todo]").addEventListener("click", () => dispGridAlumno.seleccionarTodo(true));
        form.querySelector("[data-disp-ninguno]").addEventListener("click", () => dispGridAlumno.seleccionarTodo(false));
      }
    });
    card.querySelector("[data-guardar-alumno]").addEventListener("click", async () => {
      const nombre = form.querySelector('[data-campo="nombre"]').value.trim();
      const telefono = form.querySelector('[data-campo="telefono"]').value.trim();
      const whatsapp = form.querySelector('[data-campo="whatsapp"]').value.trim();
      const instagram = form.querySelector('[data-campo="instagram"]').value.trim();
      const nivel = form.querySelector('[data-campo="nivel"]').value;
      const observaciones = form.querySelector('[data-campo="observaciones"]').value.trim();
      const disponibilidad = dispGridAlumno ? dispGridAlumno.obtenerSeleccion() : (a.disponibilidad || []);
      try {
        await updateDoc(doc(db, "usuarios", a.id), { nombre, telefono, whatsapp, instagram, nivel, observaciones, disponibilidad });
        msg.textContent = "Guardado.";
        msg.className = "form-msg ok";
        await cargarAlumnos();
      } catch (err) {
        msg.textContent = "No se pudo guardar: " + err.message; msg.className = "form-msg error";
      }
    });
    wrap.appendChild(card);
  });
}

// ---- Paquetes de clases ----
document.getElementById("form-paquete").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("paquete-msg");
  const alumnoId = document.getElementById("pq-alumno").value;
  const alumno = alumnosCache.find((a) => a.id === alumnoId);
  const tipo = document.getElementById("pq-tipo").value;
  const monto = Number(document.getElementById("pq-monto").value);
  const pagado = document.getElementById("pq-pagado").checked;

  if (!alumno) {
    msg.textContent = "Elige un alumno (primero debe existir al menos uno registrado).";
    msg.className = "form-msg error";
    return;
  }

  try {
    await addDoc(collection(db, "paquetes"), {
      alumnoId,
      alumnoNombre: alumno.nombre,
      tipo,
      clasesTotales: Number(tipo.split(" ")[0]),
      clasesUsadas: 0,
      monto,
      pagado,
      creadoEn: serverTimestamp()
    });
    msg.textContent = `Paquete de ${alumno.nombre} activado.`;
    msg.className = "form-msg ok";
    e.target.reset();
    document.getElementById("pq-pagado").checked = true;
  } catch (err) {
    msg.textContent = "No se pudo activar: " + err.message;
    msg.className = "form-msg error";
  }
});

function cargarPaquetes() {
  const wrap = document.getElementById("lista-paquetes");
  onSnapshot(collection(db, "paquetes"), (snap) => {
    if (snap.empty) {
      wrap.innerHTML = '<p class="empty-state">Todavía no activaste ningún paquete.</p>';
      return;
    }
    const porAlumno = {};
    snap.docs.forEach((d) => {
      const p = { id: d.id, ...d.data() };
      (porAlumno[p.alumnoId] ||= []).push(p);
    });
    wrap.innerHTML = "";
    Object.values(porAlumno).forEach((paquetes) => {
      paquetes.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
      const card = document.createElement("div");
      card.className = "court-card";
      card.innerHTML = `<h3>${paquetes[0].alumnoNombre}</h3>`;
      paquetes.forEach((p) => card.appendChild(construirFilaPaquete(p)));
      wrap.appendChild(card);
    });
  }, (err) => mostrarErrorConsulta(wrap, err));
}

function construirFilaPaquete(p) {
  const agotado = p.clasesUsadas >= p.clasesTotales;
  const fila = document.createElement("div");
  fila.className = "paquete-fila";
  fila.innerHTML = `
    <p>
      ${p.tipo}: ${p.clasesUsadas}/${p.clasesTotales} usadas
      <span class="badge ${agotado ? "badge-rechazada" : "badge-confirmada"}">${agotado ? "agotado" : "activo"}</span>
      <span class="badge ${p.pagado ? "badge-confirmada" : "badge-pendiente"}">${p.pagado ? "pagado" : "pendiente de pago"}</span>
      · S/ ${p.monto}
      <button class="btn btn-outline btn-small" type="button" data-toggle-editar>Editar</button>
      <button class="btn btn-outline btn-small" type="button" data-borrar>Borrar</button>
    </p>
    <div class="form-grid" data-editar-form hidden style="margin:8px 0;">
      <div class="field"><label>Clases usadas</label><input type="number" min="0" data-campo="clasesUsadas" value="${p.clasesUsadas}"></div>
      <div class="field"><label>Monto (S/)</label><input type="number" min="0" data-campo="monto" value="${p.monto}"></div>
      <div class="field"><label>Pagado</label>
        <label class="avail-slot" style="display:inline-flex;"><input type="checkbox" data-campo="pagado" ${p.pagado ? "checked" : ""}> Ya pagó</label>
      </div>
      <button class="btn btn-primary btn-small" type="button" data-guardar-paquete>Guardar</button>
    </div>
    <p class="form-msg"></p>
  `;

  const form = fila.querySelector("[data-editar-form]");
  const msg = fila.querySelector(".form-msg");

  fila.querySelector("[data-toggle-editar]").addEventListener("click", () => {
    form.hidden = !form.hidden;
  });

  fila.querySelector("[data-guardar-paquete]").addEventListener("click", async () => {
    const clasesUsadas = Number(form.querySelector('[data-campo="clasesUsadas"]').value) || 0;
    const monto = Number(form.querySelector('[data-campo="monto"]').value) || 0;
    const pagado = form.querySelector('[data-campo="pagado"]').checked;
    try {
      await updateDoc(doc(db, "paquetes", p.id), { clasesUsadas, monto, pagado });
      msg.textContent = "Guardado.";
      msg.className = "form-msg ok";
    } catch (err) {
      msg.textContent = "No se pudo guardar: " + err.message;
      msg.className = "form-msg error";
    }
  });

  fila.querySelector("[data-borrar]").addEventListener("click", async () => {
    if (!confirm(`¿Borrar este paquete de ${p.alumnoNombre} (${p.tipo}, S/ ${p.monto})?`)) return;
    try {
      await deleteDoc(doc(db, "paquetes", p.id));
    } catch (err) {
      msg.textContent = "No se pudo borrar: " + err.message;
      msg.className = "form-msg error";
    }
  });

  return fila;
}

// ---- Recordatorio por WhatsApp (link manual, no se envía solo) ----
function linkRecordatorio(r) {
  const telefono = soloDigitos(r.alumnoTelefono);
  if (!telefono) return "";
  const texto = `Hola ${r.alumnoNombre}, te recuerdo tu clase de pádel el ${formatearFecha(r.fecha)} a las ${r.hora} hrs en ${r.pistaNombre}. ¡Nos vemos en la cancha!`;
  return `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Recordar</a>`;
}

// ---- Resumen / métricas ----
async function cargarMetricas(uid) {
  const wrap = document.getElementById("metricas");
  const wrapRent = document.getElementById("rentabilidad");
  try {
    const snap = await getDocs(query(collection(db, "reservas"), where("profesorId", "==", uid)));
    const reservas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const confirmadas = reservas.filter((r) => r.estado === "confirmada").length;
    const rechazadas = reservas.filter((r) => r.estado === "rechazada").length;
    const pendientes = reservas.filter((r) => r.estado === "pendiente").length;

    const conteoPistas = {};
    reservas.filter((r) => r.estado === "confirmada").forEach((r) => {
      conteoPistas[r.pistaNombre] = (conteoPistas[r.pistaNombre] || 0) + 1;
    });
    const pistaTop = Object.entries(conteoPistas).sort((a, b) => b[1] - a[1])[0];

    const conNps = reservas.filter((r) => typeof r.nps === "number");
    const npsPromedio = conNps.length
      ? (conNps.reduce((sum, r) => sum + r.nps, 0) / conNps.length).toFixed(1)
      : "—";

    const alumnosActivos = new Set(reservas.filter((r) => r.estado === "confirmada").map((r) => r.alumnoId)).size;

    wrap.innerHTML = `
      <div class="card"><div class="card-icon">✅</div><h3>${confirmadas}</h3><p>Clases confirmadas</p></div>
      <div class="card"><div class="card-icon">🚫</div><h3>${rechazadas}</h3><p>Rechazadas</p></div>
      <div class="card"><div class="card-icon">⏳</div><h3>${pendientes}</h3><p>Pendientes ahora</p></div>
      <div class="card"><div class="card-icon">📍</div><h3>${pistaTop ? pistaTop[0] : "—"}</h3><p>Pista más usada${pistaTop ? ` (${pistaTop[1]})` : ""}</p></div>
      <div class="card"><div class="card-icon">⭐</div><h3>${npsPromedio}</h3><p>NPS promedio (${conNps.length} respuestas)</p></div>
      <div class="card"><div class="card-icon">👥</div><h3>${alumnosActivos}</h3><p>Alumnos con clase confirmada</p></div>
    `;

    await calcularRentabilidad(wrapRent, reservas);
  } catch (err) {
    mostrarErrorConsulta(wrap, err);
  }
}

async function calcularRentabilidad(wrap, reservas) {
  const paquetesSnap = await getDocs(collection(db, "paquetes"));
  const paquetesPagados = paquetesSnap.docs.map((d) => d.data()).filter((p) => p.pagado);

  // Clases sueltas registradas con su propio monto (ej. "Registrar clase ya
  // dictada"), que no pertenecen a ningún paquete — cuentan aparte.
  const reservasSueltas = reservas.filter((r) => r.estado === "confirmada" && !r.paqueteId && typeof r.montoCobrado === "number" && r.montoCobrado > 0);

  if (paquetesPagados.length === 0 && reservasSueltas.length === 0) {
    wrap.innerHTML = '<p class="empty-state">Todavía no hay paquetes pagados ni clases sueltas con monto cargado para calcular rentabilidad.</p>';
    return;
  }

  const costoPromedioPistas = pistasCache.length
    ? pistasCache.reduce((sum, p) => sum + (p.costoHoraSinLuz || 0), 0) / pistasCache.length
    : 0;
  const costoProfesorHora = currentPerfil.costoHora || 0;

  let ingresoTotal = 0;
  let costoTotal = 0;

  paquetesPagados.forEach((paquete) => {
    const reservasDelPaquete = reservas.filter((r) => r.paqueteId && r.paqueteId === paquete.id);
    const pistasUsadas = reservasDelPaquete
      .map((r) => pistasCache.find((p) => p.id === r.pistaId))
      .filter(Boolean);
    const costoCanchaHora = pistasUsadas.length
      ? pistasUsadas.reduce((sum, p) => sum + (p.costoHoraSinLuz || 0), 0) / pistasUsadas.length
      : costoPromedioPistas;

    ingresoTotal += paquete.monto || 0;
    costoTotal += paquete.clasesTotales * (costoCanchaHora + costoProfesorHora);
  });

  reservasSueltas.forEach((r) => {
    const pista = pistasCache.find((p) => p.id === r.pistaId);
    const costoCancha = typeof r.costoCanchaPagado === "number"
      ? r.costoCanchaPagado
      : (pista ? pista.costoHoraSinLuz || 0 : costoPromedioPistas);

    ingresoTotal += r.montoCobrado;
    costoTotal += costoCancha + costoProfesorHora;
  });

  const margenTotal = ingresoTotal - costoTotal;
  const margenPct = ingresoTotal ? Math.round((margenTotal / ingresoTotal) * 100) : 0;
  const sinDatos = costoPromedioPistas === 0 && costoProfesorHora === 0 && !reservasSueltas.some((r) => typeof r.costoCanchaPagado === "number");

  wrap.innerHTML = `
    <div class="card"><div class="card-icon">💵</div><h3>S/ ${ingresoTotal.toFixed(0)}</h3><p>Ingreso (paquetes pagados + clases sueltas)</p></div>
    <div class="card"><div class="card-icon">🧾</div><h3>S/ ${costoTotal.toFixed(0)}</h3><p>Costo estimado (cancha + tu hora)</p></div>
    <div class="card"><div class="card-icon">${margenTotal >= 0 ? "📈" : "📉"}</div><h3>S/ ${margenTotal.toFixed(0)}</h3><p>Margen neto</p></div>
    <div class="card"><div class="card-icon">%</div><h3>${margenPct}%</h3><p>Margen sobre ingreso</p></div>
    ${sinDatos ? '<p class="empty-state" style="grid-column:1/-1;">⚠ No cargaste costo de cancha ni tu costo por hora todavía, así que el costo estimado es S/0 y no refleja la realidad. Cárgalos en pistas.html y en "Mis datos" (o el costo de cancha específico al registrar cada clase suelta).</p>' : ""}
  `;
}

// ---- Seguimiento: riesgo de abandono, renovaciones, cobros pendientes ----
const DIAS_RIESGO_ABANDONO = 14;

const TIPO_JORNADA_GRATIS = TIPOS_CLASE.find((g) => g.grupo === "Otros").opciones[0];

async function cargarSeguimiento(uid) {
  const wrapRiesgo = document.getElementById("lista-riesgo");
  const wrapRenovar = document.getElementById("lista-renovar");
  const wrapCobros = document.getElementById("lista-cobros");
  const wrapLeads = document.getElementById("lista-leads");

  try {
    const [reservasSnap, paquetesSnap] = await Promise.all([
      getDocs(query(collection(db, "reservas"), where("profesorId", "==", uid))),
      getDocs(collection(db, "paquetes"))
    ]);
    const reservas = reservasSnap.docs.map((d) => d.data());
    const paquetes = paquetesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    renderRiesgoAbandono(wrapRiesgo, reservas);
    renderPorRenovar(wrapRenovar, paquetes);
    renderCobrosPendientes(wrapCobros, paquetes);
    renderLeadsJornadaGratis(wrapLeads, reservas, paquetes);
  } catch (err) {
    mostrarErrorConsulta(wrapRiesgo, err);
    mostrarErrorConsulta(wrapRenovar, err);
    mostrarErrorConsulta(wrapCobros, err);
    mostrarErrorConsulta(wrapLeads, err);
  }
}

function renderLeadsJornadaGratis(wrap, reservas, paquetes) {
  const leads = reservas.filter((r) => r.tipoClase === TIPO_JORNADA_GRATIS && fechaYaPaso(r.fecha));
  if (leads.length === 0) {
    wrap.innerHTML = '<p class="empty-state">Nadie ha hecho la jornada gratis todavía.</p>';
    return;
  }
  const alumnosConPaquete = new Set(paquetes.map((p) => p.alumnoId));
  wrap.innerHTML = leads.map((r) => {
    const convirtio = alumnosConPaquete.has(r.alumnoId);
    const alumno = alumnosCache.find((a) => a.id === r.alumnoId);
    const telefono = soloDigitos(alumno?.telefono);
    const texto = `Hola ${r.alumnoNombre}, ¿qué te pareció la jornada "Conociendo el Pádel"? Te cuento los paquetes para seguir jugando.`;
    const link = !convirtio && telefono
      ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Dar seguimiento</a>`
      : "";
    return `
      <div class="request-card">
        <div class="request-info">
          <p class="request-title">${r.alumnoNombre}</p>
          <p>Jornada: ${formatearFecha(r.fecha)}</p>
        </div>
        <span class="badge ${convirtio ? "badge-confirmada" : "badge-pendiente"}">${convirtio ? "✓ Convirtió" : "Sin paquete aún"}</span>
        ${link}
      </div>`;
  }).join("");
}

function renderRiesgoAbandono(wrap, reservas) {
  const hoyMs = Date.now();
  const enRiesgo = alumnosCache.map((a) => {
    const confirmadasAlumno = reservas.filter((r) => r.alumnoId === a.id && r.estado === "confirmada");
    const ultimaFecha = confirmadasAlumno.map((r) => r.fecha).sort().pop();
    const diasSinClase = ultimaFecha
      ? Math.floor((hoyMs - new Date(ultimaFecha + "T00:00:00").getTime()) / 86400000)
      : null;
    return { alumno: a, ultimaFecha, diasSinClase };
  }).filter((x) => x.diasSinClase === null || x.diasSinClase >= DIAS_RIESGO_ABANDONO);

  if (enRiesgo.length === 0) {
    wrap.innerHTML = '<p class="empty-state">Todos tus alumnos tuvieron clase en los últimos ' + DIAS_RIESGO_ABANDONO + ' días.</p>';
    return;
  }

  wrap.innerHTML = enRiesgo.map(({ alumno, ultimaFecha, diasSinClase }) => {
    const telefono = soloDigitos(alumno.telefono);
    const texto = `Hola ${alumno.nombre}, hace tiempo no te vemos por la academia — ¿coordinamos tu próxima clase de pádel?`;
    const link = telefono ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Escribirle</a>` : "";
    return `
      <div class="request-card">
        <div class="request-info">
          <p class="request-title">${alumno.nombre}</p>
          <p>${ultimaFecha ? `Última clase: ${formatearFecha(ultimaFecha)} (${diasSinClase} días)` : "Nunca tuvo una clase confirmada"}</p>
        </div>
        ${link}
      </div>`;
  }).join("");
}

function renderPorRenovar(wrap, paquetes) {
  const porRenovar = paquetes.filter((p) => p.clasesTotales - p.clasesUsadas <= 1);
  if (porRenovar.length === 0) {
    wrap.innerHTML = '<p class="empty-state">Ningún paquete está por agotarse.</p>';
    return;
  }
  wrap.innerHTML = porRenovar.map((p) => {
    const alumno = alumnosCache.find((a) => a.id === p.alumnoId);
    const telefono = soloDigitos(alumno?.telefono);
    const restantes = p.clasesTotales - p.clasesUsadas;
    const texto = `Hola ${p.alumnoNombre}, ${restantes <= 0 ? "ya usaste todas las clases de tu paquete" : "te queda solo " + restantes + " clase de tu paquete"} "${p.tipo}" — ¿coordinamos la renovación?`;
    const link = telefono ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Ofrecer renovación</a>` : "";
    return `
      <div class="request-card">
        <div class="request-info">
          <p class="request-title">${p.alumnoNombre} — ${p.tipo}</p>
          <p>${restantes <= 0 ? "Agotado" : `${restantes} clase restante`}</p>
        </div>
        ${link}
      </div>`;
  }).join("");
}

function renderCobrosPendientes(wrap, paquetes) {
  const pendientes = paquetes.filter((p) => !p.pagado);
  if (pendientes.length === 0) {
    wrap.innerHTML = '<p class="empty-state">No hay cobros pendientes.</p>';
    return;
  }
  wrap.innerHTML = pendientes.map((p) => {
    const alumno = alumnosCache.find((a) => a.id === p.alumnoId);
    const telefono = soloDigitos(alumno?.telefono);
    const texto = `Hola ${p.alumnoNombre}, te recuerdo que el pago de tu paquete "${p.tipo}" (S/ ${p.monto}) está pendiente.`;
    const link = telefono ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Cobrar</a>` : "";
    return `
      <div class="request-card">
        <div class="request-info">
          <p class="request-title">${p.alumnoNombre} — ${p.tipo}</p>
          <p>S/ ${p.monto}</p>
        </div>
        ${link}
      </div>`;
  }).join("");
}

// ---- Lista de espera ----
function cargarEsperas() {
  const wrap = document.getElementById("lista-esperas");
  onSnapshot(collection(db, "esperas"), (snap) => {
    if (snap.empty) {
      wrap.innerHTML = '<p class="empty-state">Nadie está esperando un horario ahora mismo.</p>';
      return;
    }
    const esperas = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.creadoEn?.seconds || 0) - (b.creadoEn?.seconds || 0));
    wrap.innerHTML = esperas.map((e) => {
      const telefono = soloDigitos(e.alumnoTelefono);
      const texto = `Hola ${e.alumnoNombre}, se liberó el horario que esperabas: ${e.pistaNombre}, ${formatearFecha(e.fecha)} ${e.hora} hrs. ¿Lo confirmamos?`;
      const link = telefono ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Avisarle</a>` : "";
      return `
        <div class="request-card">
          <div class="request-info">
            <p class="request-title">${e.alumnoNombre}${e.tipoClase ? " — " + e.tipoClase : ""}</p>
            <p>${e.pistaNombre} · ${formatearFecha(e.fecha)} · ${e.hora} hrs</p>
          </div>
          ${link}
        </div>`;
    }).join("");
  }, (err) => mostrarErrorConsulta(wrap, err));
}

// ---- Grupo nuevo: turnos e interesados ("¿Eres nuevo en el pádel?" en la web) ----

document.getElementById("form-turno").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("turno-msg");
  const nombre = document.getElementById("tg-nombre").value.trim();
  const horarioTexto = document.getElementById("tg-horario").value.trim();
  const fecha = document.getElementById("tg-fecha").value || null;
  const cupoTotal = Number(document.getElementById("tg-cupo").value) || 1;
  const tipo = document.getElementById("tg-tipo").value;
  try {
    await addDoc(collection(db, "turnos_grupales"), {
      nombre, horarioTexto, fecha, cupoTotal, tipo, activo: true, cupoUsado: 0, creadoEn: serverTimestamp()
    });
    e.target.reset();
    document.getElementById("tg-cupo").value = 4;
    msg.textContent = "Turno agregado."; msg.className = "form-msg ok";
  } catch (err) {
    msg.textContent = "No se pudo agregar: " + err.message; msg.className = "form-msg error";
  }
});

// Próxima fecha (desde hoy) en que cae un día de la semana dado, para poder
// ordenar cronológicamente turnos recurrentes (sin fecha propia, ej.
// "Lunes, 6:00 – 8:00 am") junto con turnos puntuales (con fecha, ej. la
// clínica mensual) en una sola lista por "qué sigue primero".
function proximaFechaDia(diaNombre) {
  const idx = DIAS.indexOf(diaNombre);
  if (idx === -1) return null;
  const hoy = new Date();
  const hoyIdx = (hoy.getDay() + 6) % 7; // 0=Lunes...6=Domingo, mismo orden que DIAS
  const delta = (idx - hoyIdx + 7) % 7;
  const resultado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + delta);
  return resultado.toISOString().slice(0, 10);
}

function fechaDeOrden(t) {
  if (t.fecha) return t.fecha;
  const dia = (t.horarioTexto || "").split(",")[0].trim();
  return proximaFechaDia(dia) || "9999-99-99";
}

function cargarTurnosGrupales() {
  onSnapshot(collection(db, "turnos_grupales"), (snap) => {
    turnosGrupalesCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => fechaDeOrden(a).localeCompare(fechaDeOrden(b)));
    renderTurnos();
    poblarSelectTurnoManual();
  }, (err) => mostrarErrorConsulta(document.getElementById("lista-turnos"), err));
}

function poblarSelectTurnoManual() {
  const select = document.getElementById("im-turno");
  const valorPrevio = select.value;
  select.innerHTML = turnosGrupalesCache
    .map((t) => `<option value="${t.id}">${t.nombre} — ${t.fecha ? formatearFechaLarga(t.fecha) + ", " : ""}${t.horarioTexto}</option>`)
    .join("");
  if (turnosGrupalesCache.some((t) => t.id === valorPrevio)) select.value = valorPrevio;
}

document.getElementById("form-interesado-manual").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("interesado-manual-msg");
  const nombre = document.getElementById("im-nombre").value.trim();
  const whatsapp = document.getElementById("im-whatsapp").value.trim();
  const nivel = document.getElementById("im-nivel").value.trim() || "No especificado";
  const turnoId = document.getElementById("im-turno").value;
  const turno = turnosGrupalesCache.find((t) => t.id === turnoId);
  if (!turno) {
    msg.textContent = "Crea al menos un turno primero.";
    msg.className = "form-msg error";
    return;
  }
  try {
    await addDoc(collection(db, "interesados_grupo"), {
      nombre, whatsapp, email: "",
      nivel,
      turnoId: turno.id,
      turnoNombre: turno.nombre,
      estado: "nuevo",
      creadoEn: serverTimestamp()
    });
    try {
      await updateDoc(doc(db, "turnos_grupales", turno.id), { cupoUsado: increment(1) });
    } catch {
      // No bloquea si el contador público no se pudo actualizar.
    }
    e.target.reset();
    msg.textContent = `Agregado a "${turno.nombre}".`;
    msg.className = "form-msg ok";
  } catch (err) {
    msg.textContent = "No se pudo agregar: " + err.message;
    msg.className = "form-msg error";
  }
});

function renderTurnos() {
  const wrap = document.getElementById("lista-turnos");
  if (!turnosGrupalesCache.length) {
    wrap.innerHTML = '<p class="empty-state">Todavía no creaste ningún turno — agrega uno arriba para que aparezca en la web.</p>';
    return;
  }
  wrap.innerHTML = "";
  turnosGrupalesCache.forEach((t) => {
    const interesados = interesadosGrupoCache.filter((i) => i.turnoId === t.id && i.estado !== "descartado");
    const lleno = interesados.length >= t.cupoTotal;
    const fechaPasada = t.fecha && fechaYaPaso(t.fecha);
    const card = document.createElement("div");
    card.className = "court-card";
    card.innerHTML = `
      <h3>${t.nombre} ${t.tipo === "clinica-gratuita" ? '<span class="badge badge-pendiente">Clínica gratuita</span>' : ""}</h3>
      ${t.fecha ? `<p class="court-meta"><strong>${formatearFechaLarga(t.fecha)}</strong>${fechaPasada ? ' <span class="badge badge-rechazada">Fecha pasada</span>' : ""}</p>` : ""}
      <p class="court-meta">${t.horarioTexto}</p>
      <p>
        <span class="badge ${lleno ? "badge-pendiente" : "badge-confirmada"}">${interesados.length}/${t.cupoTotal} interesados</span>
        <span class="badge ${t.activo ? "badge-confirmada" : "badge-rechazada"}">${t.activo ? "Abierto en la web" : "Cerrado"}</span>
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        <button class="btn btn-outline btn-small" type="button" data-toggle-activo>${t.activo ? "Cerrar turno" : "Abrir turno"}</button>
        <button class="btn btn-outline btn-small" type="button" data-toggle-editar>Editar</button>
        <button class="btn btn-outline btn-small" type="button" data-borrar>Borrar</button>
      </div>
      <div class="form-grid" data-editar-form hidden style="margin:10px 0;">
        <div class="field"><label>Nombre</label><input type="text" data-campo="nombre" value="${t.nombre}"></div>
        <div class="field"><label>Horario</label><input type="text" data-campo="horarioTexto" value="${t.horarioTexto}"></div>
        <div class="field"><label>Fecha puntual (opcional)</label><input type="date" data-campo="fecha" value="${t.fecha || ""}"></div>
        <div class="field"><label>Cupos</label><input type="number" min="1" data-campo="cupoTotal" value="${t.cupoTotal}"></div>
        <button class="btn btn-primary btn-small" type="button" data-guardar-turno>Guardar</button>
      </div>
      <p class="form-msg"></p>`;
    const form = card.querySelector("[data-editar-form]");
    const msg = card.querySelector(".form-msg");
    card.querySelector("[data-toggle-activo]").addEventListener("click", async () => {
      try { await updateDoc(doc(db, "turnos_grupales", t.id), { activo: !t.activo }); }
      catch (err) { msg.textContent = "No se pudo cambiar: " + err.message; msg.className = "form-msg error"; }
    });
    card.querySelector("[data-toggle-editar]").addEventListener("click", () => { form.hidden = !form.hidden; });
    card.querySelector("[data-guardar-turno]").addEventListener("click", async () => {
      const nombre = form.querySelector('[data-campo="nombre"]').value.trim();
      const horarioTexto = form.querySelector('[data-campo="horarioTexto"]').value.trim();
      const fecha = form.querySelector('[data-campo="fecha"]').value || null;
      const cupoTotal = Number(form.querySelector('[data-campo="cupoTotal"]').value) || 1;
      try {
        await updateDoc(doc(db, "turnos_grupales", t.id), { nombre, horarioTexto, fecha, cupoTotal });
        msg.textContent = "Guardado."; msg.className = "form-msg ok";
      } catch (err) { msg.textContent = "No se pudo guardar: " + err.message; msg.className = "form-msg error"; }
    });
    card.querySelector("[data-borrar]").addEventListener("click", async () => {
      if (!confirm(`¿Borrar el turno "${t.nombre}"? Los interesados que ya se anotaron no se borran.`)) return;
      try { await deleteDoc(doc(db, "turnos_grupales", t.id)); }
      catch (err) { msg.textContent = "No se pudo borrar: " + err.message; msg.className = "form-msg error"; }
    });
    wrap.appendChild(card);
  });
}

const ESTADOS_INTERESADO = ["nuevo", "contactado", "descartado"];
const BADGE_POR_ESTADO_INTERESADO = { nuevo: "badge-pendiente", contactado: "badge-confirmada", descartado: "badge-rechazada" };

function cargarInteresadosGrupo() {
  onSnapshot(collection(db, "interesados_grupo"), (snap) => {
    interesadosGrupoCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
    renderTurnos();
    renderInteresados();
  }, (err) => mostrarErrorConsulta(document.getElementById("lista-interesados"), err));
}

function renderInteresados() {
  const wrap = document.getElementById("lista-interesados");
  if (!interesadosGrupoCache.length) {
    wrap.innerHTML = '<p class="empty-state">Todavía nadie se anotó en "¿Eres nuevo en el pádel?".</p>';
    return;
  }
  wrap.innerHTML = "";
  interesadosGrupoCache.forEach((i) => {
    const telefono = soloDigitos(i.whatsapp);
    const texto = `Hola ${i.nombre}, soy Gabriel de Academia de Pádel GP. Vi que te interesó el turno "${i.turnoNombre}" — ¿coordinamos tu primera clase?`;
    const waLink = telefono ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Escribirle</a>` : "";
    const card = document.createElement("div");
    card.className = "request-card";
    card.innerHTML = `
      <div class="request-info">
        <p class="request-title">${i.nombre} <span class="badge ${BADGE_POR_ESTADO_INTERESADO[i.estado] || "badge-pendiente"}">${i.estado}</span></p>
        <p>${i.turnoNombre} · ${i.nivel}</p>
        <p class="court-meta">${i.whatsapp}${i.email ? " · " + i.email : ""}</p>
        <select data-estado style="margin-top:6px;">
          ${ESTADOS_INTERESADO.map((e) => `<option value="${e}" ${e === i.estado ? "selected" : ""}>${e}</option>`).join("")}
        </select>
      </div>
      ${waLink}`;
    card.querySelector("[data-estado]").addEventListener("change", async (e) => {
      try { await updateDoc(doc(db, "interesados_grupo", i.id), { estado: e.target.value }); }
      catch (err) { alert("No se pudo cambiar el estado: " + err.message); }
    });
    wrap.appendChild(card);
  });
}

// ---- Exportar a CSV ----
function descargarCSV(nombreArchivo, filas) {
  if (filas.length === 0) {
    alert("No hay datos para exportar todavía.");
    return;
  }
  const encabezados = Object.keys(filas[0]);
  const escapar = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
  const csv = [encabezados.join(",")]
    .concat(filas.map((fila) => encabezados.map((h) => escapar(fila[h])).join(",")))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("btn-exportar-reservas").addEventListener("click", async () => {
  const snap = await getDocs(query(collection(db, "reservas"), where("profesorId", "==", currentUid)));
  const filas = snap.docs.map((d) => {
    const r = d.data();
    return {
      fecha: r.fecha,
      hora: r.hora,
      alumno: r.alumnoNombre,
      telefono: r.alumnoTelefono || "",
      tipoClase: r.tipoClase || "",
      pista: r.pistaNombre,
      estado: r.estado,
      asistio: r.asistio === undefined ? "" : r.asistio ? "si" : "no",
      nps: r.nps === undefined ? "" : r.nps
    };
  });
  descargarCSV("reservas.csv", filas);
});

document.getElementById("btn-exportar-paquetes").addEventListener("click", async () => {
  const snap = await getDocs(collection(db, "paquetes"));
  const filas = snap.docs.map((d) => {
    const p = d.data();
    return {
      alumno: p.alumnoNombre,
      tipo: p.tipo,
      clasesTotales: p.clasesTotales,
      clasesUsadas: p.clasesUsadas,
      monto: p.monto,
      pagado: p.pagado ? "si" : "no"
    };
  });
  descargarCSV("paquetes.csv", filas);
});
