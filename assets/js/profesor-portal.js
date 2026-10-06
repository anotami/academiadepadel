import {
  auth, db,
  onAuthStateChanged, signOut,
  doc, getDoc, updateDoc, addDoc,
  collection, query, where, orderBy, onSnapshot, getDocs, serverTimestamp
} from "./firebase-app.js?v=6";
import {
  DIAS, FRANJAS, NIVELES, TIPOS_PAQUETE, esProgramaRegular, soloDigitos,
  formatearFecha, diaDeSemana, horaAFranja, estaDisponible, fechaYaPaso
} from "./portal-common.js?v=6";

let currentUid = null;
let currentPerfil = null;
let alumnosCache = [];
let pistasCache = [];

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
  cargarMetricas(user.uid);
});

function poblarSelectPaquete() {
  document.getElementById("pq-tipo").innerHTML = TIPOS_PAQUETE.map((t) => `<option>${t}</option>`).join("");
}

async function cargarPistasCache() {
  const snap = await getDocs(collection(db, "pistas"));
  pistasCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---- Disponibilidad grid ----
const dispWrap = document.getElementById("p-disponibilidad");
DIAS.forEach((dia) => {
  FRANJAS.forEach((franja) => {
    const id = `pav-${dia}-${franja}`.replace(/\s+/g, "");
    const label = document.createElement("label");
    label.className = "avail-slot";
    label.innerHTML = `<input type="checkbox" value="${dia}|${franja}" id="${id}"> ${dia} · ${franja}`;
    const input = label.querySelector("input");
    input.addEventListener("change", () => label.classList.toggle("checked", input.checked));
    dispWrap.appendChild(label);
  });
});

function rellenarPerfil(perfil) {
  document.getElementById("p-telefono").value = perfil.telefono || "";
  document.getElementById("p-especialidad").value = perfil.especialidad || "";
  document.getElementById("p-bio").value = perfil.bio || "";
  const marcadas = new Set((perfil.disponibilidad || []).map((d) => `${d.dia}|${d.franja}`));
  dispWrap.querySelectorAll("input[type=checkbox]").forEach((input) => {
    if (marcadas.has(input.value)) {
      input.checked = true;
      input.closest(".avail-slot").classList.add("checked");
    }
  });
}

document.getElementById("form-perfil").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("perfil-msg");
  const disponibilidad = Array.from(dispWrap.querySelectorAll("input:checked")).map((input) => {
    const [dia, franja] = input.value.split("|");
    return { dia, franja };
  });
  try {
    await updateDoc(doc(db, "usuarios", currentUid), {
      telefono: document.getElementById("p-telefono").value.trim(),
      especialidad: document.getElementById("p-especialidad").value.trim(),
      bio: document.getElementById("p-bio").value.trim(),
      disponibilidad
    });
    currentPerfil.disponibilidad = disponibilidad;
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

    wrapFuturas.innerHTML = futuras.length === 0
      ? '<p class="empty-state">Aún no tienes clases confirmadas.</p>'
      : futuras.map((r) => `
          <div class="request-card">
            <div class="request-info">
              <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.alumnoNombre}</p>
              <p>${r.pistaNombre} · ${formatearFecha(r.fecha)} · ${r.hora} hrs ${r.alumnoTelefono ? "· " + r.alumnoTelefono : ""}</p>
            </div>
            <div class="request-actions">
              <span class="badge badge-confirmada">confirmada</span>
              ${linkRecordatorio(r)}
            </div>
          </div>`).join("");
  }, (err) => {
    mostrarErrorConsulta(wrapFuturas, err);
    mostrarErrorConsulta(wrapPorRegistrar, err);
  });
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

// ---- Disponibilidad de alumnos ----
async function cargarAlumnos() {
  const wrap = document.getElementById("lista-alumnos");
  const snap = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "alumno")));
  alumnosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const selectAlumno = document.getElementById("pq-alumno");
  selectAlumno.innerHTML = alumnosCache.map((a) => `<option value="${a.id}">${a.nombre}</option>`).join("");

  if (snap.empty) {
    wrap.innerHTML = '<p class="empty-state">Todavía no hay alumnos registrados.</p>';
    return;
  }
  wrap.innerHTML = snap.docs.map((d) => {
    const a = d.data();
    const chips = (a.disponibilidad || [])
      .map((x) => `<span class="badge badge-confirmada">${x.dia} · ${x.franja}</span>`)
      .join(" ");
    return `
      <div class="court-card">
        <h3>${a.nombre}</h3>
        <p class="court-meta">${a.telefono || "Sin teléfono"} · Nivel ${a.nivel || "—"}</p>
        <p>${chips || '<span class="court-meta">Sin disponibilidad cargada todavía.</span>'}</p>
      </div>`;
  }).join("");
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
      const p = d.data();
      (porAlumno[p.alumnoId] ||= []).push(p);
    });
    wrap.innerHTML = Object.values(porAlumno).map((paquetes) => {
      paquetes.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
      const filas = paquetes.map((p) => {
        const agotado = p.clasesUsadas >= p.clasesTotales;
        return `<p>${p.tipo}: ${p.clasesUsadas}/${p.clasesTotales} usadas
          <span class="badge ${agotado ? "badge-rechazada" : "badge-confirmada"}">${agotado ? "agotado" : "activo"}</span>
          <span class="badge ${p.pagado ? "badge-confirmada" : "badge-pendiente"}">${p.pagado ? "pagado" : "pendiente de pago"}</span>
          · S/ ${p.monto}</p>`;
      }).join("");
      return `<div class="court-card"><h3>${paquetes[0].alumnoNombre}</h3>${filas}</div>`;
    }).join("");
  }, (err) => mostrarErrorConsulta(wrap, err));
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
  try {
    const snap = await getDocs(query(collection(db, "reservas"), where("profesorId", "==", uid)));
    const reservas = snap.docs.map((d) => d.data());

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
  } catch (err) {
    mostrarErrorConsulta(wrap, err);
  }
}
