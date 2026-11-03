// Pestaña "Informes" del panel del profesor.
// 1) Clases por revisar: el script de la laptop (beelup_sync v5) deja cada clase
//    analizada en clases_analisis con "Persona 1, 2…" y su foto. Gabo asigna
//    quién es quién; recién ahí se arman los informes. Nunca se asume la
//    identidad por la reserva.
// 2) Informes: borrador editable → "Listo" → copiar mensaje de WhatsApp.
//    Nada se envía solo.
// 3) Avances: historial de métricas por alumno (colección progreso).
import {
  auth, db, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, orderBy, limit, onSnapshot, getDocs, serverTimestamp
} from "./firebase-app.js?v=18";
import { escapeHtml } from "./utils.js?v=1";
import {
  METRICAS, TEXTO_CLIP, tituloClip, proximaClase, TAREAS, driveImg, claveAlumno, nuevoToken, fechaCorta, sparkline
} from "./informes-common.js?v=1";

const $ = (id) => document.getElementById(id);
const ORIGEN = location.origin;
let alumnosNombres = [];
let clasesCache = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists() || snap.data().rol !== "profesor") return;
  try {
    const us = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "alumno")));
    alumnosNombres = us.docs.map((d) => (d.data().nombre || "").trim()).filter(Boolean).sort((a, b) => a.localeCompare(b));
  } catch (e) { alumnosNombres = []; }
  const dl = $("inf-alumnos-lista");
  if (dl) dl.innerHTML = alumnosNombres.map((n) => `<option value="${escapeHtml(n)}"></option>`).join("");
  escucharClases();
  escucharInformes();
  cargarAvances();
});

// ---------------------------------------------------------------- 1) Clases por revisar
function escucharClases() {
  const wrap = $("inf-clases");
  onSnapshot(query(collection(db, "clases_analisis"), where("estado", "==", "por_revisar")), (qs) => {
    clasesCache = qs.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.id > a.id ? 1 : -1));
    $("inf-badge").textContent = clasesCache.length ? ` (${clasesCache.length})` : "";
    if (!clasesCache.length) { wrap.innerHTML = `<p class="empty-state">No hay clases por revisar. El video de cada clase se procesa a las 23:00.</p>`; return; }
    wrap.innerHTML = clasesCache.map(htmlClase).join("");
  }, (err) => { wrap.innerHTML = `<p class="empty-state">No se pudo cargar: ${escapeHtml(err.message)}</p>`; });
}

function htmlClase(c) {
  const nombresReserva = (c.reservas || []).map((r) => r.alumno).filter(Boolean);
  const opciones = (p) => {
    const def = p.rol === "profesor" ? "__profe" : "";
    const ops = [`<option value="" ${def === "" ? "selected" : ""}>¿Quién es?</option>`]
      .concat(nombresReserva.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)} (reserva)</option>`))
      .concat([`<option value="__otro">Otro alumno…</option>`, `<option value="__no">No es alumno</option>`,
        `<option value="__profe" ${def === "__profe" ? "selected" : ""}>Profesor (yo)</option>`]);
    return ops.join("");
  };
  const personas = (c.personas || []).map((p) => `
    <div class="inf-persona" data-pid="${escapeHtml(p.pid)}">
      ${p.foto ? `<img src="${driveImg(p.foto, 300)}" alt="Foto de ${escapeHtml(p.pid)}" loading="lazy">` : `<div class="inf-sinfoto">Sin foto</div>`}
      <div class="inf-persona-datos">
        <strong>${escapeHtml(p.pid.replace("persona_", "Persona ").replace("profesor", "Profesor (probable)"))}</strong>
        <span class="field-hint">${p.metricas?.tiempo_en_cancha_min ?? "?"} min en cancha · ${(p.clips || []).length} clips</span>
        <select class="inf-asignar">${opciones(p)}</select>
        <input class="inf-otro" list="inf-alumnos-lista" placeholder="Nombre del alumno" hidden>
      </div>
    </div>`).join("");
  return `
    <div class="inf-clase" data-id="${escapeHtml(c.id)}">
      <h3>Clase ${fechaCorta(c.fecha)} · ${escapeHtml(c.hora || "")} · Cancha ${escapeHtml(c.cancha || "")}</h3>
      <p class="field-hint">Reserva: ${escapeHtml(nombresReserva.join(", ") || "—")}${c.partido ? "" : " · sin partido detectado"} ·
        <a href="${escapeHtml(c.videoUrl || c.carpeta || "#")}" target="_blank" rel="noopener">ver video</a></p>
      <div class="inf-personas">${personas || `<p class="empty-state">El análisis no detectó jugadores.</p>`}</div>
      <p class="field-hint">Si una misma persona aparece dos veces, asignale el mismo nombre a las dos: se unen en un solo informe.</p>
      <div class="inf-acciones">
        <button class="btn btn-small" type="button" data-accion="armar">Armar informes</button>
        <button class="btn btn-outline btn-small" type="button" data-accion="descartar">Descartar clase</button>
        <span class="form-msg"></span>
      </div>
    </div>`;
}

document.addEventListener("change", (e) => {
  if (!e.target.classList.contains("inf-asignar")) return;
  const otro = e.target.parentElement.querySelector(".inf-otro");
  otro.hidden = e.target.value !== "__otro";
  if (!otro.hidden) otro.focus();
});

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-accion]");
  if (!b) return;
  const accion = b.dataset.accion;
  if (accion === "armar" || accion === "descartar") return accionClase(b, accion);
  if (accion === "guardar-inf" || accion === "listo-inf" || accion === "copiar-inf" || accion === "enviado-inf") return accionInforme(b, accion);
});

async function accionClase(b, accion) {
  const card = b.closest(".inf-clase");
  const msg = card.querySelector(".form-msg");
  const c = clasesCache.find((x) => x.id === card.dataset.id);
  if (!c) return;
  if (accion === "descartar") {
    if (!confirm("¿Descartar esta clase? No se arma ningún informe (el video queda en Drive).")) return;
    await updateDoc(doc(db, "clases_analisis", c.id), { estado: "descartada", revisado: serverTimestamp() });
    return;
  }
  // asignaciones: nombre de alumno -> [personas]
  const asign = {}, faltan = [];
  card.querySelectorAll(".inf-persona").forEach((el) => {
    const sel = el.querySelector(".inf-asignar").value;
    const nombre = sel === "__otro" ? el.querySelector(".inf-otro").value.trim() : sel;
    if (!nombre) { faltan.push(el.dataset.pid); return; }
    if (nombre.startsWith("__")) return;
    (asign[nombre] = asign[nombre] || []).push(c.personas.find((p) => p.pid === el.dataset.pid));
  });
  if (faltan.length) { msg.textContent = "Falta asignar a: " + faltan.join(", ").replaceAll("persona_", "Persona "); return; }
  if (!Object.keys(asign).length) { msg.textContent = "No asignaste ningún alumno. Si nadie es alumno, usá Descartar."; return; }
  b.disabled = true; msg.textContent = "Armando informes…";
  try {
    for (const [nombre, ps] of Object.entries(asign)) await crearInforme(c, nombre, unir(ps));
    await updateDoc(doc(db, "clases_analisis", c.id), {
      estado: "revisada", revisado: serverTimestamp(),
      asignaciones: Object.fromEntries(Object.entries(asign).map(([n, ps]) => [n, ps.map((p) => p.pid)]))
    });
    cargarAvances();
  } catch (err) { msg.textContent = "Error: " + err.message; b.disabled = false; }
}

// Une varias "personas" que el tracking separó y son la misma.
function unir(ps) {
  if (ps.length === 1) return ps[0];
  const min = (p) => p.metricas?.tiempo_en_cancha_min || 0;
  const T = ps.reduce((s, p) => s + min(p), 0) || 1;
  const pond = (k) => { const v = ps.filter((p) => p.metricas?.[k] != null); const t = v.reduce((s, p) => s + min(p), 0);
    return t ? Math.round(v.reduce((s, p) => s + p.metricas[k] * min(p), 0) / t) : null; };
  const metros = ps.reduce((s, p) => s + (p.metricas?.metros || 0), 0);
  const base = ps.slice().sort((a, b) => min(b) - min(a))[0];
  const clips = [];
  for (const p of ps.slice().sort((a, b) => min(b) - min(a)))
    for (const k of p.clips || []) if (!clips.some((x) => x.titulo === k.titulo)) clips.push(k);
  return {
    ...base, pid: ps.map((p) => p.pid).join("+"),
    metricas: {
      tiempo_en_cancha_min: Math.round(T * 10) / 10, metros, metros_por_min: Math.round(metros / T),
      sprints: ps.reduce((s, p) => s + (p.metricas?.sprints || 0), 0),
      pct_red: pond("pct_red"), pct_transicion: pond("pct_transicion"), pct_fondo: pond("pct_fondo"),
      pct_pala_baja_en_red: pond("pct_pala_baja_en_red")
    },
    clips: clips.slice(0, 3)
  };
}

async function crearInforme(c, nombre, p) {
  const key = claveAlumno(nombre);
  const prev = (await getDocs(query(collection(db, "progreso"), where("alumnoKey", "==", key))))
    .docs.map((d) => d.data()).sort((a, b) => (a.fecha + a.hora > b.fecha + b.hora ? 1 : -1));
  const previa = prev.length ? prev[prev.length - 1].metricas : null;
  const historial = prev.concat([{ fecha: c.fecha, hora: c.hora, metricas: p.metricas }]).slice(-12)
    .map((h) => ({ fecha: h.fecha, red: h.metricas?.pct_red ?? null, pala: h.metricas?.pct_pala_baja_en_red ?? null,
      ritmo: h.metricas?.metros_por_min ?? null }));
  const token = nuevoToken();
  await setDoc(doc(db, "informes", token), {
    token, estado: "borrador", claseId: c.id, fecha: c.fecha, hora: c.hora, cancha: c.cancha,
    alumnoNombre: nombre, alumnoKey: key, primerNombre: nombre.split(" ")[0],
    foto: p.foto || null, mapa: p.mapa || null, metricas: p.metricas, previa, historial,
    correcciones: (p.clips || []).map((k) => ({ titulo: tituloClip(k.titulo), hora: k.hora, texto: TEXTO_CLIP[k.titulo] || k.motivo, fileId: k.fileId })),
    proxima: proximaClase(p.metricas || {}), tareas: TAREAS, cierre: "Dale, otra.",
    creado: serverTimestamp()
  });
  await addDoc(collection(db, "progreso"), {
    alumnoKey: key, alumnoNombre: nombre, fecha: c.fecha, hora: c.hora, claseId: c.id, informe: token,
    metricas: p.metricas, creado: serverTimestamp()
  });
}

// ---------------------------------------------------------------- 2) Informes
let informesCache = [];
function escucharInformes() {
  const wrap = $("inf-informes");
  onSnapshot(query(collection(db, "informes"), orderBy("creado", "desc"), limit(30)), (qs) => {
    informesCache = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    const vivos = informesCache.filter((i) => i.estado !== "enviado");
    if (!vivos.length) { wrap.innerHTML = `<p class="empty-state">Todavía no hay informes armados.</p>`; return; }
    wrap.innerHTML = vivos.map((i) => `
      <div class="inf-informe" data-id="${escapeHtml(i.id)}">
        <h3>${escapeHtml(i.alumnoNombre)} · ${fechaCorta(i.fecha)} ${escapeHtml(i.hora || "")}
          <span class="inf-estado inf-${escapeHtml(i.estado)}">${i.estado === "listo" ? "Listo para enviar" : "Borrador"}</span></h3>
        <p><a href="informe.html?t=${encodeURIComponent(i.id)}" target="_blank" rel="noopener">Ver el informe como lo ve el alumno</a></p>
        <label class="field-hint" for="prox-${escapeHtml(i.id)}">Para la próxima clase</label>
        <textarea id="prox-${escapeHtml(i.id)}" class="inf-proxima" rows="3">${escapeHtml(i.proxima || "")}</textarea>
        <div class="inf-acciones">
          <button class="btn btn-outline btn-small" type="button" data-accion="guardar-inf">Guardar cambios</button>
          ${i.estado === "listo"
            ? `<button class="btn btn-small" type="button" data-accion="copiar-inf">Copiar mensaje de WhatsApp</button>
               <button class="btn btn-outline btn-small" type="button" data-accion="enviado-inf">Marcar como enviado</button>`
            : `<button class="btn btn-small" type="button" data-accion="listo-inf">Listo para enviar</button>`}
          <span class="form-msg"></span>
        </div>
      </div>`).join("");
  }, (err) => { wrap.innerHTML = `<p class="empty-state">No se pudo cargar: ${escapeHtml(err.message)}</p>`; });
}

async function accionInforme(b, accion) {
  const card = b.closest(".inf-informe");
  const msg = card.querySelector(".form-msg");
  const i = informesCache.find((x) => x.id === card.dataset.id);
  const ref = doc(db, "informes", i.id);
  const proxima = card.querySelector(".inf-proxima").value.trim();
  if (accion === "guardar-inf") { await updateDoc(ref, { proxima }); msg.textContent = "Guardado."; return; }
  if (accion === "listo-inf") { await updateDoc(ref, { proxima, estado: "listo", listo: serverTimestamp() }); return; }
  if (accion === "enviado-inf") { await updateDoc(ref, { estado: "enviado", enviado: serverTimestamp() }); return; }
  if (accion === "copiar-inf") {
    const url = `${ORIGEN}/informe.html?t=${encodeURIComponent(i.id)}`;
    const texto = `Hola ${i.primerNombre || ""}! Te dejo el informe de tu clase del ${fechaCorta(i.fecha)}, con tus clips y tus números: ${url}\n\nMiralo antes de la próxima. Dale, otra.`;
    try { await navigator.clipboard.writeText(texto); msg.textContent = "Copiado. Pegalo en el chat del alumno."; }
    catch { prompt("Copiá el mensaje:", texto); }
  }
}

// ---------------------------------------------------------------- 3) Avances por alumno
async function cargarAvances() {
  const wrap = $("inf-avances");
  try {
    const qs = await getDocs(collection(db, "progreso"));
    const por = {};
    qs.docs.forEach((d) => { const r = d.data(); (por[r.alumnoKey] = por[r.alumnoKey] || { nombre: r.alumnoNombre, filas: [] }).filas.push(r); });
    const alumnos = Object.values(por).sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (!alumnos.length) { wrap.innerHTML = `<p class="empty-state">Los avances aparecen cuando armes el primer informe.</p>`; return; }
    wrap.innerHTML = alumnos.map((a) => {
      const f = a.filas.sort((x, y) => (x.fecha + x.hora > y.fecha + y.hora ? 1 : -1));
      const serie = (k) => f.map((r) => r.metricas?.[k] ?? null);
      const ult = f[f.length - 1].metricas || {};
      return `<details class="inf-avance"><summary><strong>${escapeHtml(a.nombre)}</strong> · ${f.length} clase${f.length > 1 ? "s" : ""} analizada${f.length > 1 ? "s" : ""}</summary>
        <div class="inf-spark"><span>Tiempo en la red: ${ult.pct_red ?? "?"} %</span>${sparkline(serie("pct_red"))}</div>
        <div class="inf-spark"><span>Pala abajo en la red: ${ult.pct_pala_baja_en_red ?? "?"} %</span>${sparkline(serie("pct_pala_baja_en_red"), { color: "#d1242f" })}</div>
        <div class="inf-spark"><span>Ritmo: ${ult.metros_por_min ?? "?"} m/min</span>${sparkline(serie("metros_por_min"), { color: "#1a7f37" })}</div>
        <table class="inf-tabla"><thead><tr><th>Fecha</th><th>Min</th><th>Red</th><th>Fondo</th><th>Pala abajo</th><th>m/min</th><th></th></tr></thead><tbody>
        ${f.slice().reverse().map((r) => `<tr><td>${fechaCorta(r.fecha)}</td><td>${r.metricas?.tiempo_en_cancha_min ?? ""}</td><td>${r.metricas?.pct_red ?? ""} %</td>
          <td>${r.metricas?.pct_fondo ?? ""} %</td><td>${r.metricas?.pct_pala_baja_en_red ?? "—"} %</td><td>${r.metricas?.metros_por_min ?? ""}</td>
          <td>${r.informe ? `<a href="informe.html?t=${encodeURIComponent(r.informe)}" target="_blank" rel="noopener">informe</a>` : ""}</td></tr>`).join("")}
        </tbody></table></details>`;
    }).join("");
  } catch (err) { wrap.innerHTML = `<p class="empty-state">No se pudo cargar: ${escapeHtml(err.message)}</p>`; }
}
