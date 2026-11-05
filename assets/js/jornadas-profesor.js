// Pestaña "Jornadas" del panel del profesor: crear/editar/duplicar la
// jornada mensual, ver inscriptos y exportarlos a CSV.
import {
  auth, db, onAuthStateChanged,
  doc, getDoc, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp
} from "./firebase-app.js?v=18";
import { escapeHtml } from "./utils.js?v=1";
import { formatearFecha } from "./portal-common.js?v=26";

const $ = (id) => document.getElementById(id);

let jornadasCache = [];
let inscripcionesPorJornada = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists() || snap.data().rol !== "profesor") return;
  escucharJornadas();
  escucharInscripciones();
});

function escucharJornadas() {
  onSnapshot(query(collection(db, "jornadas"), orderBy("fecha", "desc")), (qs) => {
    jornadasCache = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => { $("lista-jornadas").innerHTML = `<p class="empty-state">No se pudo cargar: ${escapeHtml(err.message)}</p>`; });
}

function escucharInscripciones() {
  onSnapshot(collection(db, "inscripciones_jornada"), (qs) => {
    inscripcionesPorJornada = {};
    qs.docs.forEach((d) => {
      const r = { id: d.id, ...d.data() };
      (inscripcionesPorJornada[r.jornadaId] ||= []).push(r);
    });
    render();
  }, (err) => { $("lista-jornadas").innerHTML = `<p class="empty-state">No se pudo cargar: ${escapeHtml(err.message)}</p>`; });
}

function leerFormJornada(prefijo) {
  const activa = $(`${prefijo}-activa`);
  return {
    titulo: $(`${prefijo}-titulo`).value.trim(),
    fecha: $(`${prefijo}-fecha`).value,
    horario: $(`${prefijo}-horario`).value.trim(),
    sede: $(`${prefijo}-sede`).value.trim(),
    direccion: $(`${prefijo}-direccion`).value.trim(),
    mapsUrl: $(`${prefijo}-maps`).value.trim(),
    precio: Number($(`${prefijo}-precio`).value) || 0,
    cupos: Number($(`${prefijo}-cupos`).value) || 1,
    metodoPago: $(`${prefijo}-metodo-pago`).value.trim(),
    portadaUrl: $(`${prefijo}-portada`).value.trim(),
    activa: activa ? activa.checked : true
  };
}

document.getElementById("form-jornada-nueva").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("jn-msg");
  const datos = leerFormJornada("jn");
  if (!datos.titulo || !datos.fecha || !datos.sede) {
    msg.textContent = "Faltan título, fecha o sede.";
    msg.className = "form-msg error";
    return;
  }
  try {
    await addDoc(collection(db, "jornadas"), { ...datos, cuposUsados: 0, creadoEn: serverTimestamp() });
    e.target.reset();
    $("jn-activa").checked = true;
    $("jn-cupos").value = 8;
    msg.textContent = "Jornada creada.";
    msg.className = "form-msg ok";
  } catch (err) {
    msg.textContent = "No se pudo crear: " + err.message;
    msg.className = "form-msg error";
  }
});

// +1 mes a una fecha "YYYY-MM-DD", mismo día del mes siguiente.
function sumarUnMes(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m, d).toISOString().slice(0, 10);
}

// Crea una copia de `base` en `fechaNueva` -- misma sede/precio/cupos/portada,
// horario vacío y pausada, igual que "Duplicar para el mes siguiente". La usan
// tanto ese botón como "Generar próximos meses" (que la llama varias veces seguidas).
async function duplicarJornada(base, fechaNueva) {
  await addDoc(collection(db, "jornadas"), {
    titulo: base.titulo, fecha: fechaNueva, horario: "", sede: base.sede, direccion: base.direccion || "",
    mapsUrl: base.mapsUrl || "", precio: base.precio, cupos: base.cupos, metodoPago: base.metodoPago || "",
    portadaUrl: base.portadaUrl || "", activa: false, cuposUsados: 0, creadoEn: serverTimestamp()
  });
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportarCSV(j, inscriptos) {
  const encabezados = ["Nombre", "Celular", "Email", "Personas", "Acompañantes", "Distrito", "Experiencia", "Estado de pago"];
  const filas = inscriptos.map((i) => [
    i.nombre, i.celular, i.email, i.cantidadPersonas, i.acompanantes || "", i.distrito, i.experienciaRaqueta, i.estadoPago
  ]);
  const csv = [encabezados, ...filas].map((fila) => fila.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inscriptos_${(j.titulo || j.id).replace(/[^\w]+/g, "_")}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const ESTADOS_PAGO = ["pendiente", "pagado", "cancelado"];

function campoJornadaHtml(prefijo, j = {}) {
  return `
    <div class="form-grid" style="margin-top:8px;">
      <div class="field field-full"><label>Título</label><input type="text" id="${prefijo}-titulo" required maxlength="80" value="${escapeHtml(j.titulo || "")}"></div>
      <div class="field"><label>Fecha</label><input type="date" id="${prefijo}-fecha" required value="${j.fecha || ""}"></div>
      <div class="field"><label>Horario</label><input type="text" id="${prefijo}-horario" maxlength="60" value="${escapeHtml(j.horario || "")}" placeholder="Vacío = 'te lo confirmamos por WhatsApp'"></div>
      <div class="field"><label>Sede</label><input type="text" id="${prefijo}-sede" required maxlength="80" value="${escapeHtml(j.sede || "")}"></div>
      <div class="field"><label>Dirección</label><input type="text" id="${prefijo}-direccion" maxlength="120" value="${escapeHtml(j.direccion || "")}"></div>
      <div class="field field-full"><label>Link de Google Maps</label><input type="url" id="${prefijo}-maps" value="${escapeHtml(j.mapsUrl || "")}"></div>
      <div class="field"><label>Precio por persona (S/)</label><input type="number" id="${prefijo}-precio" required min="0" step="1" value="${j.precio ?? 0}"></div>
      <div class="field"><label>Cupos totales</label><input type="number" id="${prefijo}-cupos" required min="1" step="1" value="${j.cupos ?? 8}"></div>
      <div class="field"><label>Método de pago</label><input type="text" id="${prefijo}-metodo-pago" maxlength="40" value="${escapeHtml(j.metodoPago || "")}"></div>
      <div class="field field-full"><label>URL de la foto de portada</label><input type="url" id="${prefijo}-portada" value="${escapeHtml(j.portadaUrl || "")}"></div>
      <label class="avail-slot" style="display:inline-flex;"><input type="checkbox" id="${prefijo}-activa" ${j.activa ? "checked" : ""}> Activa</label>
    </div>`;
}

function render() {
  const wrap = $("lista-jornadas");
  if (!jornadasCache.length) {
    wrap.innerHTML = '<p class="empty-state">Todavía no creaste ninguna jornada.</p>';
    return;
  }
  wrap.innerHTML = "";
  jornadasCache.forEach((j) => {
    const inscriptos = inscripcionesPorJornada[j.id] || [];
    const personasTotal = inscriptos.reduce((s, i) => s + (i.cantidadPersonas || 1), 0);
    const card = document.createElement("div");
    card.className = "court-card";
    card.innerHTML = `
      <h3>${escapeHtml(j.titulo)} ${j.activa ? '<span class="badge badge-confirmada">Activa</span>' : '<span class="badge badge-rechazada">Pausada</span>'}</h3>
      <p class="court-meta">${formatearFecha(j.fecha)}${j.horario ? " · " + escapeHtml(j.horario) : ""} · ${escapeHtml(j.sede)}</p>
      <p class="court-meta">S/ ${j.precio} por persona · <span class="badge ${personasTotal >= j.cupos ? "badge-pendiente" : "badge-confirmada"}">${j.cuposUsados || 0}/${j.cupos} cupos</span></p>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
        <button class="btn btn-outline btn-small" type="button" data-toggle-editar>Editar</button>
        <button class="btn btn-outline btn-small" type="button" data-toggle-activa>${j.activa ? "Pausar" : "Activar"}</button>
        <button class="btn btn-outline btn-small" type="button" data-copiar-link>Copiar link para Instagram</button>
        <button class="btn btn-outline btn-small" type="button" data-duplicar>Duplicar para el mes siguiente</button>
        <button class="btn btn-outline btn-small" type="button" data-generar-meses>Generar próximos meses</button>
        <button class="btn btn-outline btn-small" type="button" data-borrar>Borrar</button>
        ${inscriptos.length ? `<button class="btn btn-outline btn-small" type="button" data-exportar>Exportar CSV (${inscriptos.length})</button>` : ""}
        ${inscriptos.length ? `<button class="btn btn-outline btn-small" type="button" data-toggle-inscriptos>Ver inscriptos</button>` : ""}
      </div>
      <div class="form-grid" data-editar-form hidden>${campoJornadaHtml(`je-${j.id}`, j)}
        <button class="btn btn-primary btn-small" type="button" data-guardar>Guardar</button>
      </div>
      <p class="form-msg"></p>
      ${inscriptos.length ? `
      <div data-inscriptos-wrap hidden style="margin-top:12px; overflow-x:auto;">
        <table class="inf-tabla">
          <thead><tr><th>Nombre</th><th>Celular</th><th>Personas</th><th>Distrito</th><th>Experiencia</th><th>Pago</th></tr></thead>
          <tbody>
            ${inscriptos.map((i) => `
              <tr data-insc-id="${escapeHtml(i.id)}">
                <td>${escapeHtml(i.nombre)}${i.acompanantes ? `<br><span class="field-hint">${escapeHtml(i.acompanantes)}</span>` : ""}</td>
                <td>${escapeHtml(i.celular)}</td>
                <td>${i.cantidadPersonas}</td>
                <td>${escapeHtml(i.distrito || "")}</td>
                <td>${escapeHtml(i.experienciaRaqueta || "")}</td>
                <td><select data-estado-pago>${ESTADOS_PAGO.map((es) => `<option value="${es}" ${es === i.estadoPago ? "selected" : ""}>${es}</option>`).join("")}</select></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>` : ""}`;

    const form = card.querySelector("[data-editar-form]");
    const msg = card.querySelector(".form-msg");
    card.querySelector("[data-toggle-editar]").addEventListener("click", () => { form.hidden = !form.hidden; });
    card.querySelector("[data-toggle-activa]").addEventListener("click", async () => {
      try { await updateDoc(doc(db, "jornadas", j.id), { activa: !j.activa }); }
      catch (err) { msg.textContent = "No se pudo cambiar: " + err.message; msg.className = "form-msg error"; }
    });
    card.querySelector("[data-guardar]").addEventListener("click", async () => {
      try {
        await updateDoc(doc(db, "jornadas", j.id), leerFormJornada(`je-${j.id}`));
        msg.textContent = "Guardado."; msg.className = "form-msg ok";
      } catch (err) { msg.textContent = "No se pudo guardar: " + err.message; msg.className = "form-msg error"; }
    });
    card.querySelector("[data-copiar-link]").addEventListener("click", async () => {
      const url = `https://academiadepadel.pe/jornada.html?id=${j.id}`;
      try {
        await navigator.clipboard.writeText(url);
        msg.textContent = "Link copiado: " + url;
      } catch {
        prompt("Copiá el link:", url);
        msg.textContent = "";
      }
      msg.className = "form-msg ok";
    });
    card.querySelector("[data-duplicar]").addEventListener("click", async () => {
      try {
        await duplicarJornada(j, sumarUnMes(j.fecha));
        msg.textContent = "Duplicada para el mes siguiente — revisa/edita la fecha y el horario.";
        msg.className = "form-msg ok";
      } catch (err) { msg.textContent = "No se pudo duplicar: " + err.message; msg.className = "form-msg error"; }
    });
    card.querySelector("[data-generar-meses]").addEventListener("click", async () => {
      const cantidadRaw = prompt("¿Cuántos meses más generar a partir de esta jornada (misma sede/precio/cupos, horario vacío, pausadas)?", "5");
      const cantidad = Number(cantidadRaw);
      if (!cantidadRaw || !Number.isInteger(cantidad) || cantidad < 1) return;
      msg.textContent = `Generando ${cantidad} jornada(s)...`;
      msg.className = "form-msg";
      try {
        let fecha = j.fecha;
        for (let i = 0; i < cantidad; i++) {
          fecha = sumarUnMes(fecha);
          await duplicarJornada(j, fecha);
        }
        msg.textContent = `Se generaron ${cantidad} jornada(s) — quedaron pausadas, revisa/edita fecha y horario de cada una.`;
        msg.className = "form-msg ok";
      } catch (err) { msg.textContent = "No se pudo generar: " + err.message; msg.className = "form-msg error"; }
    });
    card.querySelector("[data-borrar]").addEventListener("click", async () => {
      if (!confirm(`¿Borrar "${j.titulo}"? Los inscriptos ya anotados no se borran, solo la jornada.`)) return;
      try { await deleteDoc(doc(db, "jornadas", j.id)); }
      catch (err) { msg.textContent = "No se pudo borrar: " + err.message; msg.className = "form-msg error"; }
    });
    card.querySelector("[data-exportar]")?.addEventListener("click", () => exportarCSV(j, inscriptos));
    card.querySelector("[data-toggle-inscriptos]")?.addEventListener("click", () => {
      const w = card.querySelector("[data-inscriptos-wrap]"); w.hidden = !w.hidden;
    });
    card.querySelectorAll("[data-insc-id]").forEach((fila) => {
      fila.querySelector("[data-estado-pago]").addEventListener("change", async (e) => {
        try { await updateDoc(doc(db, "inscripciones_jornada", fila.dataset.inscId), { estadoPago: e.target.value }); }
        catch (err) { alert("No se pudo actualizar: " + err.message); }
      });
    });

    wrap.appendChild(card);
  });
}
