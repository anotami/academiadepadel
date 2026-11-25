// Control de clases (panel profesor): cada clase con su número C-0001, sede, alumnos y pago, y qué falta cargar.
// También numera las clases que ya estaban cargadas (con vista previa antes de escribir).
import { db, collection, getDocs } from "./firebase-app.js?v=18";
import { escapeHtml } from "./utils.js?v=1";
import { cargarReservas, aplicarNumerado, planNumerar, auditarClases, ultimoNumero, formatoCodigo } from "./numeracion-clases.js?v=1";

const $ = (id) => document.getElementById(id);
let uid = null, reservas = [], auditoria = null, paqueteTipo = {};
const msg = (t, error) => { const m = $("cc-msg"); m.textContent = t || ""; m.className = "form-msg" + (error ? " error" : ""); };
const fechaCorta = (f) => { const [y, m, d] = String(f || "").split("-"); return d ? `${d}/${m}/${y}` : ""; };

export function iniciarControlClases(profesorId) {
  uid = profesorId;
  if (!$("card-control-clases")) return;
  $("cc-revisar").addEventListener("click", revisar);
  $("cc-numerar").addEventListener("click", previsualizarNumerado);
  $("cc-confirmar-num").addEventListener("click", confirmarNumerado);
  $("cc-cancelar-num").addEventListener("click", () => { $("cc-preview").hidden = true; });
  ["cc-filtro", "cc-mes"].forEach((id) => $(id).addEventListener("change", pintar));
  $("cc-buscar").addEventListener("input", pintar);
  $("cc-csv").addEventListener("click", descargarCsv);
}

async function revisar() {
  msg("Cargando clases…"); $("cc-preview").hidden = true;
  try {
    reservas = await cargarReservas(uid);
    paqueteTipo = {}; (await getDocs(collection(db, "paquetes"))).docs.forEach((d) => { paqueteTipo[d.id] = d.data().tipo || ""; });
    auditoria = auditarClases(reservas, paqueteTipo);
    const meses = [...new Set(auditoria.filas.map((f) => (f.fecha || "").slice(0, 7)).filter(Boolean))].sort().reverse();
    const actual = $("cc-mes").value;
    $("cc-mes").innerHTML = `<option value="">Todos los meses</option>` + meses.map((m) => `<option value="${m}">${m}</option>`).join("");
    $("cc-mes").value = meses.includes(actual) ? actual : "";
    $("cc-numerar").hidden = !auditoria.filas.some((f) => f.problemas.includes("Sin número"));
    $("cc-csv").hidden = false; msg(""); pintar();
  } catch (e) { msg("No se pudo cargar: " + e.message, true); }
}

function visibles() {
  const f = $("cc-filtro").value, mes = $("cc-mes").value, q = $("cc-buscar").value.trim().toLowerCase();
  return auditoria.filas.filter((x) => {
    if (mes && !(x.fecha || "").startsWith(mes)) return false;
    if (f === "problemas" && !x.problemas.length) return false;
    if (f === "sin-numero" && !x.problemas.includes("Sin número")) return false;
    if (f === "sin-pago" && !x.problemas.includes("Sin pago cargado")) return false;
    if (f === "sin-sede" && !x.problemas.includes("Sin sede")) return false;
    if (q && !(`${x.codigo} ${x.sede} ${x.tipo} ${x.alumnos.map((a) => a.nombre).join(" ")}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

function pintar() {
  if (!auditoria) return;
  const a = auditoria, lista = visibles();
  const huecos = a.huecos.length ? ` · faltan en la secuencia: ${a.huecos.slice(0, 12).map(formatoCodigo).join(", ")}${a.huecos.length > 12 ? ` … (+${a.huecos.length - 12})` : ""}` : "";
  $("cc-resumen").innerHTML = `<strong>${a.total}</strong> clases confirmadas` + (a.minimo ? ` · numeradas de ${formatoCodigo(a.minimo)} a ${formatoCodigo(a.maximo)}` : " · ninguna numerada todavía")
    + ` · <strong style="color:${a.conProblemas ? "#b02a24" : "inherit"}">${a.conProblemas}</strong> con algo por revisar` + escapeHtml(huecos);
  $("cc-filas").innerHTML = lista.slice(0, 500).map((x) => `
    <tr>
      <td>${x.num ? `<span class="badge badge-clase-num">${x.codigo}</span>` : `<span class="badge badge-rechazada">Sin número</span>`}</td>
      <td>${fechaCorta(x.fecha)}<br><small>${escapeHtml(x.hora || "")} hrs</small></td>
      <td>${x.sede ? escapeHtml(x.sede) : '<span style="color:#b02a24;">Sin sede</span>'}${x.tipo ? `<br><small>${escapeHtml(x.tipo)}</small>` : ""}</td>
      <td>${x.alumnos.map((al) => `<div>${escapeHtml(al.nombre)} — <span style="${al.sinPago ? "color:#b02a24;font-weight:700;" : ""}">${escapeHtml(al.pago)}</span></div>`).join("")}</td>
      <td>${x.estadoCierre}</td>
      <td>${x.problemas.length ? x.problemas.map((p) => `<span class="badge badge-rechazada" style="margin:1px;">${escapeHtml(p)}</span>`).join(" ") : '<span class="badge badge-confirmada">✓ OK</span>'}</td>
    </tr>`).join("") || `<tr><td colspan="6">No hay clases con ese filtro.</td></tr>`;
  $("cc-cuenta").textContent = `Mostrando ${Math.min(lista.length, 500)} de ${lista.length} clases` + (lista.length > 500 ? " (afiná el filtro para ver el resto)" : "");
}

async function previsualizarNumerado() {
  msg("Calculando…");
  try {
    const desde = (await ultimoNumero()) + 1;
    const plan = planNumerar(reservas, desde);
    if (!plan.asignaciones.length) { msg("Todas las clases confirmadas ya tienen número."); return; }
    const nuevas = plan.asignaciones.filter((x) => x.nueva), n = plan.asignaciones.reduce((s, x) => s + x.reservasSinNumero.length, 0);
    const linea = (x) => `<li><strong>${formatoCodigo(x.claseNum)}</strong> — ${fechaCorta(x.sesion[0].fecha)} ${x.sesion[0].hora} · ${escapeHtml(x.sesion[0].pistaNombre || "sin sede")} · ${escapeHtml(x.sesion.map((r) => r.alumnoNombre).join(", "))}</li>`;
    const mostrar = nuevas.length > 12 ? [...nuevas.slice(0, 8), null, ...nuevas.slice(-3)] : nuevas;
    $("cc-preview-detalle").innerHTML = `Se van a numerar <strong>${nuevas.length}</strong> clases (<strong>${n}</strong> reservas de alumnos), de la más vieja a la más nueva`
      + (nuevas.length ? `, del <strong>${formatoCodigo(nuevas[0].claseNum)}</strong> al <strong>${formatoCodigo(nuevas[nuevas.length - 1].claseNum)}</strong>` : "")
      + `.<ul style="margin:8px 0 8px 18px;">${mostrar.map((x) => (x ? linea(x) : "<li>…</li>")).join("")}</ul><small>Solo se agrega el número: no cambia fechas, alumnos, sedes ni pagos. Las canceladas, rechazadas y pendientes no se numeran.</small>`;
    $("cc-preview").hidden = false; msg("");
  } catch (e) { msg("No se pudo calcular: " + e.message, true); }
}

async function confirmarNumerado() {
  const b = $("cc-confirmar-num"); b.disabled = true; msg("Numerando…");
  try {
    const r = await aplicarNumerado(uid);
    $("cc-preview").hidden = true;
    await revisar(); // recarga la tabla (y limpia el mensaje); el aviso se muestra después
    msg(`Listo: ${r.nuevos} clases numeradas (${r.escritas} reservas actualizadas).`);
  } catch (e) { msg("No se pudo numerar: " + e.message + " (¿publicaste la regla de contadores?)", true); }
  finally { b.disabled = false; }
}

function descargarCsv() {
  const celda = (v) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const filas = [["N°", "Fecha", "Hora", "Sede", "Tipo", "Alumnos y pago", "Estado", "Por revisar"]].concat(visibles().map((x) => [x.codigo, x.fecha, x.hora, x.sede, x.tipo,
    x.alumnos.map((a) => `${a.nombre}: ${a.pago}`).join(" | "), x.estadoCierre, x.problemas.join(" | ")]));
  const blob = new Blob(["﻿" + filas.map((f) => f.map(celda).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "control-de-clases.csv";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
