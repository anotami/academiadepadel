import {
  auth, db,
  onAuthStateChanged, signOut,
  doc, getDoc, updateDoc,
  collection, query, where, orderBy, onSnapshot, getDocs
} from "./firebase-app.js?v=2";
import { DIAS, FRANJAS, formatearFecha, diaDeSemana, horaAFranja, estaDisponible } from "./portal-common.js?v=2";

let currentUid = null;
let currentPerfil = null;
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
  cargarAlumnos();
});

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
}

async function rechazar(reservaId) {
  await updateDoc(doc(db, "reservas", reservaId), { estado: "rechazada" });
}

// ---- Próximas confirmadas ----
function cargarConfirmadas(uid) {
  const wrap = document.getElementById("lista-confirmadas");
  const q = query(
    collection(db, "reservas"),
    where("profesorId", "==", uid),
    where("estado", "==", "confirmada"),
    orderBy("fecha", "asc")
  );
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      wrap.innerHTML = '<p class="empty-state">Aún no tienes clases confirmadas.</p>';
      return;
    }
    wrap.innerHTML = snap.docs.map((d) => {
      const r = d.data();
      return `
        <div class="request-card">
          <div class="request-info">
            <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.alumnoNombre}</p>
            <p>${r.pistaNombre} · ${formatearFecha(r.fecha)} · ${r.hora} hrs ${r.alumnoTelefono ? "· " + r.alumnoTelefono : ""}</p>
          </div>
          <span class="badge badge-confirmada">confirmada</span>
        </div>`;
    }).join("");
  }, (err) => mostrarErrorConsulta(wrap, err));
}

// ---- Disponibilidad de alumnos ----
async function cargarAlumnos() {
  const wrap = document.getElementById("lista-alumnos");
  const snap = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "alumno")));
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
