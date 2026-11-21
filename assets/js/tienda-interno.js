// Menú PRIVADO "Tienda" (solo el profesor): proveedores, sigla de 4 letras, costo y margen por producto.
// Los datos viven en Firestore (tienda_interno, regla esProfesor), NO en el repo ni en la web pública.
// Se cargan una vez desde el panel con el CSV interno (interno_proveedores_web_v1.csv).
import { db, doc, setDoc, collection, onSnapshot, serverTimestamp } from "./firebase-app.js?v=18";
import { escapeHtml } from "./utils.js?v=1";

const $ = (id) => document.getElementById(id);
let filas = [];

function parseCsv(txt) {
  const rows = []; let f = "", r = [], q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { r.push(f); f = ""; }
    else if (c === "\n") { r.push(f); rows.push(r); r = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows.filter((x) => x.some((v) => v !== ""));
}
const soles = (n) => "S/ " + Math.round(n).toLocaleString("es-PE");
const msg = (t, error) => { const m = $("ti-msg"); m.textContent = t; m.className = "form-msg" + (error ? " error" : ""); };

function pintar() {
  const por = {};
  filas.forEach((f) => {
    const k = f.sigla || "—";
    const g = por[k] || (por[k] = { sigla: k, tienda: f.tienda, n: 0, costo: 0, venta: 0 });
    g.n++; g.costo += f.costo; g.venta += f.venta;
  });
  $("ti-resumen").innerHTML = Object.values(por).sort((a, b) => b.n - a.n).map((g) =>
    `<tr><td><strong>${escapeHtml(g.sigla)}</strong></td><td>${escapeHtml(g.tienda)}</td><td>${g.n}</td><td>${soles(g.costo / g.n)}</td><td>${Math.round((g.venta / g.costo - 1) * 100)}%</td></tr>`).join("")
    || `<tr><td colspan="5">Aún no hay datos: carga el CSV interno abajo.</td></tr>`;

  const sel = $("ti-filtro-tienda");
  const actual = sel.value;
  sel.innerHTML = `<option value="">Todas las tiendas</option>` + Object.values(por).map((g) => `<option value="${escapeHtml(g.sigla)}">${escapeHtml(g.sigla)} · ${escapeHtml(g.tienda)}</option>`).join("");
  sel.value = actual;
  pintarProductos();
}

function pintarProductos() {
  const t = $("ti-buscar").value.trim().toLowerCase();
  const s = $("ti-filtro-tienda").value;
  const lista = filas.filter((f) => (!s || f.sigla === s) && (!t || (f.codigo + " " + f.nombre).toLowerCase().includes(t))).slice(0, 200);
  $("ti-productos").innerHTML = lista.map((f) => {
    const m = f.venta - f.costo;
    const enlace = /^https?:\/\//.test(f.url || "") ? `<a href="${escapeHtml(f.url)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : "—";
    return `<tr><td>${escapeHtml(f.codigo)}</td><td>${escapeHtml(f.nombre)}</td><td><strong>${escapeHtml(f.sigla)}</strong></td><td>${soles(f.costo)}</td><td>${soles(f.venta)}</td><td>${soles(m)} (${Math.round((m / f.costo) * 100)}%)</td><td>${enlace}</td></tr>`;
  }).join("") || `<tr><td colspan="7">Sin resultados.</td></tr>`;
  $("ti-cuenta").textContent = `Mostrando ${lista.length} de ${filas.length} productos` + (lista.length === 200 ? " (primeros 200: afina la búsqueda)" : "");
}

async function cargarCsv(archivo) {
  msg("Leyendo…");
  const filasCsv = parseCsv(await archivo.text());
  const h = filasCsv.shift().map((x) => x.trim());
  const ix = (n) => h.indexOf(n);
  if (["codigo", "nombre", "precio_costo", "tienda_origen", "url_origen"].some((n) => ix(n) < 0)) { msg("Ese CSV no tiene las columnas codigo, nombre, precio_costo, tienda_origen y url_origen.", true); return; }
  // Sigla y precio de venta de la web vienen del catálogo público (por código de producto).
  const web = parseCsv(await (await fetch("tienda/productos.csv?v=" + Date.now())).text());
  const wh = web.shift(); const wi = (n) => wh.indexOf(n);
  const pub = {}; web.forEach((r) => { pub[r[wi("codigo")]] = { sigla: r[wi("ref_tienda")] || "", venta: parseFloat(r[wi("precio_venta_PEN")]) || 0 }; });
  const docs = filasCsv.map((r) => {
    const codigo = r[ix("codigo")]; const p = pub[codigo] || { sigla: "", venta: 0 };
    return { codigo, nombre: r[ix("nombre")], tienda: r[ix("tienda_origen")], url: r[ix("url_origen")], costo: parseFloat(r[ix("precio_costo")]) || 0, venta: p.venta || parseFloat(r[ix("precio_venta")]) || 0, sigla: p.sigla };
  }).filter((d) => d.codigo);
  try {
    for (let i = 0; i < docs.length; i += 25) {
      await Promise.all(docs.slice(i, i + 25).map((d) => setDoc(doc(db, "tienda_interno", d.codigo), { ...d, actualizadoEn: serverTimestamp() })));
      msg(`Guardando… ${Math.min(i + 25, docs.length)} de ${docs.length}`);
    }
    // La libreta (decodificador de pedidos) aprende sigla → tienda sin que nada quede en el código público.
    const tiendas = {}; docs.forEach((d) => { if (d.sigla) tiendas[d.sigla] = d.tienda; });
    await Promise.all(Object.entries(tiendas).map(([sigla, tienda]) => setDoc(doc(db, "libreta_tienda", sigla), { ref: sigla, tienda, actualizadoEn: serverTimestamp() }, { merge: true })));
    msg(`Listo: ${docs.length} productos y ${Object.keys(tiendas).length} tiendas guardados.`);
  } catch (err) { msg("No se pudo guardar: " + err.message + " (¿publicaste la regla de tienda_interno?)", true); }
}

export function iniciarTiendaInterno() {
  if (!$("ti-resumen")) return;
  onSnapshot(collection(db, "tienda_interno"), (snap) => { filas = snap.docs.map((d) => d.data()); pintar(); },
    (err) => msg("No se pudo leer (" + err.message + "). ¿Publicaste la regla de tienda_interno?", true));
  $("ti-buscar").addEventListener("input", pintarProductos);
  $("ti-filtro-tienda").addEventListener("change", pintarProductos);
  $("ti-archivo").addEventListener("change", (e) => { const a = e.target.files[0]; if (a) cargarCsv(a); e.target.value = ""; });
}
