import {
  auth, db,
  onAuthStateChanged, signOut,
  doc, getDoc, updateDoc, addDoc, collection,
  query, where, orderBy, onSnapshot, getDocs, serverTimestamp
} from "./firebase-app.js?v=12";
import {
  DIAS, FRANJAS, HORAS_RESERVA, TIPOS_CLASE,
  formatearFecha, diaDeSemana, horaAFranja, estaDisponible, fechaYaPaso, soloDigitos
} from "./portal-common.js?v=12";

let currentUid = null;
let currentPerfil = null;

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
  if (!snap.exists() || snap.data().rol !== "alumno") {
    window.location.href = "login.html";
    return;
  }
  currentUid = user.uid;
  currentPerfil = snap.data();
  document.getElementById("who-nombre").textContent = currentPerfil.nombre || user.email;
  rellenarPerfil(currentPerfil);
  await cargarPistasEnSelect();
  await cargarProfesor();
  cargarReservas(user.uid);
  cargarPaquete(user.uid);
  cargarProgreso(user.uid);
  cargarJugar();
});

// ---- Busco con quién jugar ----
document.getElementById("form-jugar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("jugar-msg");
  const fecha = document.getElementById("jg-fecha").value;
  const nota = document.getElementById("jg-nota").value.trim();
  try {
    await addDoc(collection(db, "partidos"), {
      alumnoId: currentUid,
      alumnoNombre: currentPerfil.nombre,
      alumnoTelefono: currentPerfil.telefono || "",
      nivel: currentPerfil.nivel || "",
      fecha,
      nota,
      creadoEn: serverTimestamp()
    });
    msg.textContent = "¡Publicado! Otros alumnos ya pueden verte.";
    msg.className = "form-msg ok";
    e.target.reset();
  } catch (err) {
    msg.textContent = "No se pudo publicar: " + err.message;
    msg.className = "form-msg error";
  }
});

function cargarJugar() {
  const wrap = document.getElementById("lista-jugar");
  onSnapshot(collection(db, "partidos"), (snap) => {
    const otros = snap.docs
      .map((d) => d.data())
      .filter((p) => p.alumnoId !== currentUid && !fechaYaPaso(p.fecha))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (otros.length === 0) {
      wrap.innerHTML = '<p class="empty-state">Nadie más está buscando partido por ahora.</p>';
      return;
    }
    wrap.innerHTML = otros.map((p) => {
      const telefono = soloDigitos(p.alumnoTelefono);
      const texto = `Hola ${p.alumnoNombre}, vi en academiadepadel.pe que buscabas con quién jugar el ${formatearFecha(p.fecha)}. ¿Jugamos?`;
      const link = telefono ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${telefono}?text=${encodeURIComponent(texto)}">Escribirle</a>` : "";
      return `
        <div class="request-card">
          <div class="request-info">
            <p class="request-title">${p.alumnoNombre}${p.nivel ? " · Nivel " + p.nivel : ""}</p>
            <p>${formatearFecha(p.fecha)}${p.nota ? " · " + p.nota : ""}</p>
          </div>
          ${link}
        </div>`;
    }).join("");
  }, (err) => mostrarErrorConsulta(wrap, err));
}


// ---- Mi progreso (línea de tiempo del feedback de sesiones) ----
function cargarProgreso(uid) {
  const wrap = document.getElementById("mi-progreso");
  onSnapshot(
    query(collection(db, "reservas"), where("alumnoId", "==", uid), where("registrada", "==", true)),
    (snap) => {
      if (snap.empty) {
        wrap.innerHTML = '<p class="empty-state">Todavía no hay sesiones registradas por tu profesor.</p>';
        return;
      }
      const sesiones = snap.docs.map((d) => d.data()).sort((a, b) => a.fecha.localeCompare(b.fecha));
      wrap.innerHTML = sesiones.map((r) => {
        const f = r.feedback || {};
        return `
          <div class="request-card">
            <div class="request-info">
              <p class="request-title">${formatearFecha(r.fecha)} · <span class="badge badge-confirmada">${f.nivelTrabajado || "—"}</span></p>
              ${f.comentario ? `<p>${f.comentario}</p>` : ""}
              ${f.siguienteObjetivo ? `<p><em>Próximo objetivo: ${f.siguienteObjetivo}</em></p>` : ""}
            </div>
          </div>`;
      }).join("");
    },
    (err) => mostrarErrorConsulta(wrap, err)
  );
}

// ---- Mi paquete de clases ----
function cargarPaquete(uid) {
  const wrap = document.getElementById("mi-paquete");
  onSnapshot(query(collection(db, "paquetes"), where("alumnoId", "==", uid)), (snap) => {
    if (snap.empty) {
      wrap.innerHTML = '<p class="empty-state">No tienes un paquete activo. Coordina con tu profesor por WhatsApp para contratar uno.</p>';
      return;
    }
    const paquetes = snap.docs.map((d) => d.data()).sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
    const activo = paquetes.find((p) => p.clasesUsadas < p.clasesTotales);
    if (!activo) {
      wrap.innerHTML = '<p class="empty-state">Ya usaste todas tus clases del último paquete. Coordina la renovación con tu profesor.</p>';
      return;
    }
    const restantes = activo.clasesTotales - activo.clasesUsadas;
    wrap.innerHTML = `
      <div class="callout">
        <span class="callout-icon">🎾</span>
        <p><strong>Te quedan ${restantes} de ${activo.clasesTotales} clases</strong> de tu paquete "${activo.tipo}".
        ${activo.pagado ? "" : " (pago pendiente de confirmar)"}</p>
      </div>`;
  }, (err) => mostrarErrorConsulta(wrap, err));
}

// ---- Horas select ----
const horaSelect = document.getElementById("r-hora");
HORAS_RESERVA.forEach((h) => {
  const opt = document.createElement("option");
  opt.value = h;
  opt.textContent = h;
  horaSelect.appendChild(opt);
});
document.getElementById("r-fecha").min = new Date().toISOString().slice(0, 10);

// ---- Tipo de clase select ----
const tipoSelect = document.getElementById("r-tipo");
tipoSelect.innerHTML = TIPOS_CLASE.map((grupo) => `
  <optgroup label="${grupo.grupo}">
    ${grupo.opciones.map((op) => `<option value="${op}">${op}</option>`).join("")}
  </optgroup>
`).join("");

// ---- Aviso en vivo: ¿el horario elegido calza con la disponibilidad habitual? ----
const hintEl = document.getElementById("r-disponibilidad-hint");
function actualizarHint() {
  const pistaId = document.getElementById("r-pista").value;
  const fecha = document.getElementById("r-fecha").value;
  const hora = document.getElementById("r-hora").value;
  if (!pistaId || !fecha || !hora) {
    hintEl.textContent = "";
    return;
  }
  const pista = pistasCache.find((p) => p.id === pistaId);
  const dia = diaDeSemana(fecha);
  const franja = horaAFranja(hora);
  const okProfesor = profesorCache ? estaDisponible(profesorCache.disponibilidad, dia, franja) : null;
  const okPista = pista ? estaDisponible(pista.disponibilidad, dia, franja) : null;

  if (okProfesor === false || okPista === false) {
    const partes = [];
    if (okProfesor === false) partes.push("fuera de la disponibilidad habitual del profesor");
    if (okPista === false) partes.push("fuera del horario habitual de la pista");
    hintEl.textContent = `⚠ Este horario está ${partes.join(" y ")}. Igual puedes enviarlo, pero puede tardar más en confirmarse.`;
    hintEl.className = "form-msg error";
  } else if (okProfesor && okPista) {
    hintEl.textContent = "✓ Este horario calza con la disponibilidad habitual del profesor y de la pista.";
    hintEl.className = "form-msg ok";
  } else {
    hintEl.textContent = "";
    hintEl.className = "field-hint";
  }
}
["r-pista", "r-fecha", "r-hora"].forEach((id) => {
  document.getElementById(id).addEventListener("change", actualizarHint);
});

// ---- Disponibilidad grid (perfil) ----
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
  document.getElementById("p-edad").value = perfil.edad || "";
  document.getElementById("p-nivel").value = perfil.nivel || "Inicial";
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
      edad: Number(document.getElementById("p-edad").value),
      nivel: document.getElementById("p-nivel").value,
      disponibilidad
    });
    msg.textContent = "Datos actualizados.";
    msg.className = "form-msg ok";
  } catch (err) {
    msg.textContent = "No se pudo guardar: " + err.message;
    msg.className = "form-msg error";
  }
});

// ---- Pistas en el select de reserva ----
let pistasCache = [];
async function cargarPistasEnSelect() {
  const select = document.getElementById("r-pista");
  const snap = await getDocs(collection(db, "pistas"));
  pistasCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  select.innerHTML = pistasCache
    .filter((p) => p.estadoPista !== "Bloqueada")
    .map((p) => {
      const aviso = p.estadoPista === "Reservada" ? " (reservada, confirma disponibilidad)" : "";
      return `<option value="${p.id}">${p.nombre} — ${p.distrito}${aviso}</option>`;
    })
    .join("");
}

// ---- Buscar profesor(es) ----
let profesorCache = null;
let profesoresCache = [];
async function cargarProfesor() {
  const snap = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "profesor")));
  profesoresCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  profesorCache = profesoresCache[0] || null;

  if (profesoresCache.length > 1) {
    const wrap = document.getElementById("r-profesor-wrap");
    const select = document.getElementById("r-profesor");
    wrap.hidden = false;
    select.innerHTML = profesoresCache.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("");
    select.addEventListener("change", () => {
      profesorCache = profesoresCache.find((p) => p.id === select.value) || profesorCache;
      actualizarHint();
    });
  }
}

document.getElementById("form-reserva").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("reserva-msg");
  msg.textContent = "";
  msg.className = "form-msg";

  const tipoClase = document.getElementById("r-tipo").value;
  const pistaId = document.getElementById("r-pista").value;
  const fecha = document.getElementById("r-fecha").value;
  const hora = document.getElementById("r-hora").value;
  const nota = document.getElementById("r-nota").value.trim();
  const pista = pistasCache.find((p) => p.id === pistaId);

  if (!pista) {
    msg.textContent = "Elige una pista válida.";
    msg.className = "form-msg error";
    return;
  }

  try {
    // Evita duplicar una solicitud si ese horario de esa pista ya está confirmado.
    const conflicto = await getDocs(
      query(
        collection(db, "reservas"),
        where("pistaId", "==", pistaId),
        where("fecha", "==", fecha),
        where("hora", "==", hora),
        where("estado", "==", "confirmada")
      )
    );
    if (!conflicto.empty) {
      msg.innerHTML = `Ese horario ya está confirmado para otro alumno en esa pista. Elige otra hora, o
        <button type="button" class="btn btn-outline btn-small" id="btn-anotar-espera" style="margin-top:8px;">Anotarme en lista de espera</button>`;
      msg.className = "form-msg error";
      document.getElementById("btn-anotar-espera").addEventListener("click", async () => {
        try {
          await addDoc(collection(db, "esperas"), {
            alumnoId: currentUid,
            alumnoNombre: currentPerfil.nombre,
            alumnoTelefono: currentPerfil.telefono || "",
            pistaId,
            pistaNombre: `${pista.nombre} — ${pista.distrito}`,
            fecha,
            hora,
            tipoClase,
            creadoEn: serverTimestamp()
          });
          msg.textContent = "Anotado en lista de espera. Te avisamos si se libera ese horario.";
          msg.className = "form-msg ok";
        } catch (err) {
          msg.textContent = "No se pudo anotar: " + err.message;
          msg.className = "form-msg error";
        }
      });
      return;
    }

    await addDoc(collection(db, "reservas"), {
      alumnoId: currentUid,
      alumnoNombre: currentPerfil.nombre,
      alumnoTelefono: currentPerfil.telefono || "",
      profesorId: profesorCache ? profesorCache.id : null,
      profesorNombre: profesorCache ? profesorCache.nombre : "Por asignar",
      tipoClase,
      pistaId,
      pistaNombre: `${pista.nombre} — ${pista.distrito}`,
      fecha,
      hora,
      nota,
      estado: "pendiente",
      creadoEn: serverTimestamp()
    });

    msg.textContent = "Solicitud enviada. Tu profesor la confirmará según disponibilidad de la pista.";
    msg.className = "form-msg ok";
    e.target.reset();
    document.getElementById("r-fecha").min = new Date().toISOString().slice(0, 10);
    hintEl.textContent = "";
  } catch (err) {
    msg.textContent = "No se pudo enviar la solicitud: " + err.message;
    msg.className = "form-msg error";
  }
});

// ---- Mis reservas (tiempo real) ----
function cargarReservas(uid) {
  const wrap = document.getElementById("lista-reservas");
  const q = query(collection(db, "reservas"), where("alumnoId", "==", uid), orderBy("creadoEn", "desc"));
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      wrap.innerHTML = '<p class="empty-state">Aún no tienes reservas. Envía tu primera solicitud arriba.</p>';
      return;
    }
    wrap.innerHTML = "";
    snap.docs.forEach((d) => {
      const r = { id: d.id, ...d.data() };
      const puedeCancelar = r.estado === "confirmada" && !fechaYaPaso(r.fecha);
      const card = document.createElement("div");
      card.className = "request-card";
      card.innerHTML = `
        <div class="request-info">
          <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.pistaNombre}</p>
          <p>${formatearFecha(r.fecha)} · ${r.hora} hrs · Prof. ${r.profesorNombre}</p>
          ${r.nota ? `<p>"${r.nota}"</p>` : ""}
          ${bloqueFeedback(r)}
          ${bloqueNps(r)}
        </div>
        <div class="request-actions">
          <span class="badge badge-${r.estado === "cancelada" ? "rechazada" : r.estado}">${r.estado}</span>
          ${puedeCancelar ? '<button type="button" class="btn btn-outline btn-small" data-cancelar>Cancelar</button>' : ""}
        </div>`;
      if (puedeCancelar) {
        card.querySelector("[data-cancelar]").addEventListener("click", () => cancelarReserva(r));
      }
      wrap.appendChild(card);
    });
  }, (err) => mostrarErrorConsulta(wrap, err));
}

async function cancelarReserva(r) {
  if (!confirm("¿Seguro que quieres cancelar esta clase?")) return;
  try {
    const horasAntes = (new Date(`${r.fecha}T${r.hora}:00`).getTime() - Date.now()) / 3600000;
    await updateDoc(doc(db, "reservas", r.id), { estado: "cancelada" });
    if (r.paqueteId && horasAntes >= 24) {
      const paqueteSnap = await getDoc(doc(db, "paquetes", r.paqueteId));
      if (paqueteSnap.exists()) {
        const clasesUsadas = Math.max(0, (paqueteSnap.data().clasesUsadas || 0) - 1);
        await updateDoc(doc(db, "paquetes", r.paqueteId), { clasesUsadas });
      }
    }
  } catch (err) {
    alert("No se pudo cancelar: " + err.message);
  }
}

// Delegación de eventos: un solo listener para todos los botones de NPS que se vayan creando.
document.getElementById("lista-reservas").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-nps-score]");
  if (!btn) return;
  const reservaId = btn.closest("[data-reserva-id]").dataset.reservaId;
  const score = Number(btn.dataset.npsScore);
  try {
    await updateDoc(doc(db, "reservas", reservaId), { nps: score, npsEn: serverTimestamp() });
  } catch (err) {
    alert("No se pudo enviar tu respuesta: " + err.message);
  }
});

function bloqueNps(r) {
  if (r.estado !== "confirmada" || !fechaYaPaso(r.fecha) || r.nps !== undefined) return "";
  const botones = Array.from({ length: 11 }, (_, n) =>
    `<button type="button" class="btn btn-outline btn-small" data-nps-score="${n}" style="padding:6px 11px; margin:2px;">${n}</button>`
  ).join("");
  return `
    <div class="callout" data-reserva-id="${r.id}" style="margin:10px 0 0; flex-direction:column; align-items:stretch;">
      <p style="margin-bottom:6px;"><strong>¿Qué tan probable es que recomiendes tu clase de hoy?</strong> (0 = nada, 10 = totalmente)</p>
      <div>${botones}</div>
    </div>`;
}

function bloqueFeedback(r) {
  if (!r.registrada) return "";
  if (r.asistio === false) {
    return '<p class="court-meta">No se registró asistencia en esta clase.</p>';
  }
  const f = r.feedback || {};
  return `
    <div class="callout" style="margin:10px 0 0;">
      <span class="callout-icon">📝</span>
      <p>
        <strong>${f.nivelTrabajado || ""}</strong>${f.comentario ? " — " + f.comentario : ""}
        ${f.siguienteObjetivo ? `<br><em>Próximo objetivo: ${f.siguienteObjetivo}</em>` : ""}
      </p>
    </div>`;
}
