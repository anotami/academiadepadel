import {
  auth, db,
  onAuthStateChanged, signOut,
  doc, getDoc, updateDoc, addDoc, collection,
  query, where, orderBy, onSnapshot, getDocs, serverTimestamp
} from "./firebase-app.js";
import {
  DIAS, FRANJAS, HORAS_RESERVA, TIPOS_CLASE,
  formatearFecha, diaDeSemana, horaAFranja, estaDisponible
} from "./portal-common.js";

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
});

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
    .map((p) => `<option value="${p.id}">${p.nombre} — ${p.distrito}</option>`)
    .join("");
}

// ---- Buscar al profesor (hay uno solo por ahora) ----
let profesorCache = null;
async function cargarProfesor() {
  const snap = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "profesor")));
  if (!snap.empty) {
    const docu = snap.docs[0];
    profesorCache = { id: docu.id, ...docu.data() };
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
      msg.textContent = "Ese horario ya está confirmado para otro alumno en esa pista. Elige otra hora.";
      msg.className = "form-msg error";
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
    wrap.innerHTML = snap.docs.map((d) => {
      const r = d.data();
      return `
        <div class="request-card">
          <div class="request-info">
            <p class="request-title">${r.tipoClase ? r.tipoClase + " — " : ""}${r.pistaNombre}</p>
            <p>${formatearFecha(r.fecha)} · ${r.hora} hrs · Prof. ${r.profesorNombre}</p>
            ${r.nota ? `<p>"${r.nota}"</p>` : ""}
          </div>
          <span class="badge badge-${r.estado}">${r.estado}</span>
        </div>`;
    }).join("");
  }, (err) => mostrarErrorConsulta(wrap, err));
}
