import {
  auth, db,
  onAuthStateChanged, signOut,
  doc, getDoc, updateDoc,
  collection, query, where, orderBy, onSnapshot, getDocs
} from "./firebase-app.js";
import { DIAS, FRANJAS, formatearFecha } from "./portal-common.js";

let currentUid = null;

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
  const perfil = snap.data();
  document.getElementById("who-nombre").textContent = perfil.nombre || user.email;
  rellenarPerfil(perfil);
  cargarPendientes(user.uid);
  cargarConfirmadas(user.uid);
});

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
          <p class="request-title">${r.alumnoNombre} — ${r.pistaNombre}</p>
          <p>${formatearFecha(r.fecha)} · ${r.hora} hrs ${r.alumnoTelefono ? "· " + r.alumnoTelefono : ""}</p>
          ${r.nota ? `<p>"${r.nota}"</p>` : ""}
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
            <p class="request-title">${r.alumnoNombre} — ${r.pistaNombre}</p>
            <p>${formatearFecha(r.fecha)} · ${r.hora} hrs ${r.alumnoTelefono ? "· " + r.alumnoTelefono : ""}</p>
          </div>
          <span class="badge badge-confirmada">confirmada</span>
        </div>`;
    }).join("");
  }, (err) => mostrarErrorConsulta(wrap, err));
}
