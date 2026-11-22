// Tienda Academia de Pádel GP: lee productos.csv y arma el catálogo.
// Sin base de datos, sin carrito, sin pagos online: cada producto termina en un chat de WhatsApp.
import { WHATSAPP, CSV_URL, SALUDO, POR_PAGINA, MAX_RECOMENDADAS, TALLES_ZAPATILLAS, TALLES_ROPA, REF_POR_DOMINIO } from "./config.js";

const $ = (id) => document.getElementById(id);
const ORDEN_CATEGORIAS = ["Palas", "Zapatillas", "Ropa", "Accesorios"];
const NIVEL_RANGO_PALAS = { inicial: 0, todos: 1, medio: 2, avanzado: 3, sin_dato: 4 };
const ETIQUETA_NIVEL = { inicial: "Nivel inicial", medio: "Nivel medio", avanzado: "Nivel avanzado", todos: "Todos los niveles" };
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#eef2f5"/>' +
  '<g fill="none" stroke="#9fb0bd" stroke-width="6" stroke-linecap="round"><ellipse cx="100" cy="85" rx="42" ry="50"/>' +
  '<path d="M100 135v40"/></g><g fill="#9fb0bd"><circle cx="88" cy="70" r="5"/><circle cx="112" cy="70" r="5"/>' +
  '<circle cx="100" cy="88" r="5"/><circle cx="88" cy="104" r="5"/><circle cx="112" cy="104" r="5"/></g></svg>');

let productos = [];
let filtrados = [];
let visibles = POR_PAGINA;

// ---------- CSV ----------
function parseCSV(texto) {
  texto = texto.replace(/^﻿/, "");
  const primera = texto.split(/\r?\n/, 1)[0] || "";
  const sep = (primera.match(/;/g) || []).length > (primera.match(/,/g) || []).length ? ";" : ",";
  const filas = [];
  let fila = [], campo = "", dentro = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentro) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else dentro = false; }
      else campo += c;
    } else if (c === '"') dentro = true;
    else if (c === sep) { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo); campo = "";
      if (fila.some((x) => x.trim() !== "")) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  fila.push(campo);
  if (fila.some((x) => x.trim() !== "")) filas.push(fila);
  return filas;
}

const sinTildes = (t) => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// ---------- Limpieza de textos (el CSV viene de varias fuentes y con mayúsculas dispares) ----------
const MINUSCULAS = new Set(["de", "del", "la", "el", "los", "las", "y", "con", "para", "por", "en", "a"]);
const capitalizar = (w) => w.toLowerCase().replace(/\p{L}+/gu, (x, i) => (i === 0 ? x[0].toUpperCase() + x.slice(1) : x[0].toUpperCase() + x.slice(1)));
const aTitulo = (t) => t.split(" ").map((w, i) => (i > 0 && MINUSCULAS.has(w.toLowerCase()) ? w.toLowerCase() : capitalizar(w))).join(" ");

function limpiarMarca(marca) {
  const m = (marca || "").trim();
  return m && m === m.toUpperCase() ? aTitulo(m) : m;
}

function limpiarNombre(nombre, marca) {
  let n = (nombre || "").trim();
  const escapada = (marca || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Se sacan, en cualquier orden, la marca repetida y los prefijos "Pala"/"Padel" del inicio.
  for (let i = 0; i < 4; i++) {
    const antes = n;
    if (escapada) n = n.replace(new RegExp("^" + escapada + "\\b\\s*[-–:]?\\s*", "i"), "");
    n = n.replace(/^[-–:]\s*/, "").replace(/^(pala de p[aá]del|pala|padel)\b\s*/i, "").trim();
    if (n === antes) break;
  }
  const letras = n.replace(/[^\p{L}]/gu, "");
  const mayus = n.replace(/[^\p{Lu}]/gu, "");
  const casiTodoMayus = letras.length > 0 && mayus.length > letras.length * 0.6;
  n = n.split(" ").map((w, i) => {
    if (/\d/.test(w)) return w;                                   // modelos y tallas (V2, X24, 2026)
    const soloLetras = w.replace(/[^\p{L}]/gu, "");
    const gritando = soloLetras === soloLetras.toUpperCase() && soloLetras.length > 0;
    if (!gritando) return w;
    if (casiTodoMayus || soloLetras.length > 3) return i > 0 && MINUSCULAS.has(w.toLowerCase()) ? w.toLowerCase() : capitalizar(w);
    return w;                                                      // siglas cortas sueltas (XL, BK, CMF)
  }).join(" ");
  return n.trim();
}

// Las descripciones traen a veces listas tipo ['a', 'b'] y terminan cortadas con "…".
function limpiarDescripcion(texto) {
  let d = (texto || "").trim();
  d = d.replace(/\[[^\]]*$/, "").trim();   // lista cortada a la mitad: se descarta
  if (d.endsWith("…")) {
    // Cortada en el origen: se deja hasta la última frase completa; si no hay una decente, se omite.
    const cuerpo = d.slice(0, -1);
    const corte = Math.max(cuerpo.lastIndexOf(". "), cuerpo.lastIndexOf("! "), cuerpo.lastIndexOf("? "));
    d = corte >= 50 ? cuerpo.slice(0, corte + 1) : "";
  }
  return d;
}

function pintarDescripcion(contenedor, texto) {
  contenedor.replaceChildren();
  const lista = /\[((?:'[^']*'|"[^"]*")(?:\s*,\s*(?:'[^']*'|"[^"]*"))*)\]/g;
  let desde = 0, m;
  const parrafo = (t) => { t = t.trim(); if (t) contenedor.appendChild(el("p", "", t)); };
  while ((m = lista.exec(texto))) {
    parrafo(texto.slice(desde, m.index));
    const ul = el("ul", "m-lista");
    (m[1].match(/'[^']*'|"[^"]*"/g) || []).forEach((it) => ul.appendChild(el("li", "", it.slice(1, -1))));
    contenedor.appendChild(ul);
    desde = m.index + m[0].length;
  }
  parrafo(texto.slice(desde));
}

function aProductos(filas) {
  if (filas.length < 2) return [];
  const cab = filas[0].map((h) => sinTildes(h).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  const idx = (...nombres) => { for (const n of nombres) { const i = cab.indexOf(n); if (i >= 0) return i; } return -1; };
  const col = {
    codigo: idx("codigo"), categoria: idx("categoria"), marca: idx("marca"), nombre: idx("nombre"),
    precio: idx("precio_venta_pen", "precio_venta", "precio"), nivel: idx("nivel"), vendido: idx("mas_vendido"),
    disponible: idx("disponible"), imagen: idx("imagen_url", "imagen"), descripcion: idx("descripcion"),
    tallas: idx("tallas", "talles"), ref: idx("ref_tienda", "ref")
  };
  const val = (f, k) => (col[k] >= 0 ? (f[col[k]] || "").trim() : "");
  const lista = filas.slice(1).map((f, orden) => {
    const precio = Number(val(f, "precio").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
    const nivel = sinTildes(val(f, "nivel")) || "sin_dato";
    const marca = limpiarMarca(val(f, "marca"));
    const categoria = val(f, "categoria");
    const nombreCrudo = val(f, "nombre");
    // Zapatillas y ropa se piden con talle (salvo que el nombre ya traiga la talla, ej. "Pack x3 Talla 39/42").
    const pideTalle = (categoria === "Zapatillas" || categoria === "Ropa") && !/\btalla\b/i.test(nombreCrudo);
    const propias = val(f, "tallas").split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
    const tallas = !pideTalle ? [] : propias.length ? propias : categoria === "Zapatillas" ? TALLES_ZAPATILLAS : TALLES_ROPA;
    let ref = val(f, "ref");
    if (!ref) { try { ref = REF_POR_DOMINIO[new URL(val(f, "imagen")).hostname] || ""; } catch { ref = ""; } }
    return {
      orden,
      codigo: val(f, "codigo"),
      categoria,
      marca,
      nombre: limpiarNombre(val(f, "nombre"), val(f, "marca")) || val(f, "nombre"),
      precio,
      nivel: nivel === "intermedio" ? "medio" : nivel,
      masVendido: sinTildes(val(f, "vendido")) === "si",
      sinStock: sinTildes(val(f, "disponible")) === "no",
      tallas,
      ref,
      imagen: val(f, "imagen"),
      descripcion: limpiarDescripcion(val(f, "descripcion"))
    };
  }).filter((p) => p.codigo && p.nombre && !p.sinStock); // lo que no tiene stock no se muestra
  return sinRepetidos(lista);
}

// El mismo producto puede venir de dos tiendas (mismo nombre, distinto código y Ref): se muestra una sola vez,
// el de menor precio (si empatan, el primero del CSV). Así el cliente no ve la misma pala repetida.
function sinRepetidos(lista) {
  const mejor = new Map();
  for (const p of lista) {
    const clave = sinTildes(`${p.marca} ${p.nombre}`).replace(/[^a-z0-9]+/g, " ").trim();
    const actual = mejor.get(clave);
    if (!actual || (p.precio > 0 && (actual.precio <= 0 || p.precio < actual.precio))) mejor.set(clave, p);
  }
  return lista.filter((p) => mejor.get(sinTildes(`${p.marca} ${p.nombre}`).replace(/[^a-z0-9]+/g, " ").trim()) === p);
}

// ---------- Formato ----------
// "Todos los niveles" solo tiene sentido en palas; en accesorios y ropa sería ruido.
function etiquetaNivel(p) {
  if (p.nivel === "sin_dato" || !ETIQUETA_NIVEL[p.nivel]) return null;
  if (p.nivel === "todos" && p.categoria !== "Palas") return null;
  return ETIQUETA_NIVEL[p.nivel];
}

function soles(n) {
  const entero = Math.floor(n);
  const dec = Math.round((n - entero) * 100);
  const miles = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `S/ ${miles}${dec ? "," + String(dec).padStart(2, "0") : ""}`;
}

// Mensaje que te llega: código, marca, nombre y el precio que vio el cliente (+ talle y tu referencia privada).
function linkWhatsApp(p, talle) {
  const partes = [`${SALUDO}, quiero el producto ${p.codigo} · ${p.marca} ${p.nombre} · ${soles(p.precio)}`];
  if (talle) partes.push(`Talle: ${talle}`);
  if (p.ref) partes.push(`Ref: ${p.ref}`);
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(partes.join(" · "))}`;
}

function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function imagen(p, tam) {
  const img = el("img");
  img.alt = `${p.marca} ${p.nombre}`;
  img.width = tam; img.height = tam;
  img.loading = "lazy"; img.decoding = "async";
  img.referrerPolicy = "no-referrer"; // varios sitios de fotos bloquean según desde dónde se pide
  img.addEventListener("error", () => { img.src = PLACEHOLDER; img.classList.add("sin-foto"); }, { once: true });
  img.src = p.imagen || PLACEHOLDER;
  if (!p.imagen) img.classList.add("sin-foto");
  return img;
}

// ---------- Tarjeta ----------
function tarjeta(p) {
  const li = el("article", "card");
  const abrir = el("button", "card-abrir");
  abrir.type = "button";
  abrir.setAttribute("aria-label", `Ver ${p.marca} ${p.nombre}`);
  const foto = el("div", "card-foto");
  foto.appendChild(imagen(p, 300));
  if (etiquetaNivel(p)) foto.appendChild(el("span", `tag tag-${p.nivel}`, etiquetaNivel(p)));
  if (p.masVendido) foto.appendChild(el("span", "tag tag-top", "Más vendido"));
  abrir.appendChild(foto);
  const cuerpo = el("div", "card-cuerpo");
  cuerpo.appendChild(el("p", "card-marca", p.marca));
  cuerpo.appendChild(el("h3", "card-nombre", p.nombre));
  cuerpo.appendChild(el("p", "card-precio", soles(p.precio)));
  abrir.appendChild(cuerpo);
  abrir.addEventListener("click", () => abrirFicha(p));
  li.appendChild(abrir);
  if (p.tallas.length) {
    // Con talle: primero se elige en la ficha, para que el pedido llegue completo.
    const pedir = el("button", "btn btn-wa btn-chico", "Elegir talle y pedir");
    pedir.type = "button";
    pedir.addEventListener("click", () => abrirFicha(p));
    li.appendChild(pedir);
  } else {
    const wa = el("a", "btn btn-wa btn-chico", "Pedir por WhatsApp");
    wa.href = linkWhatsApp(p); wa.target = "_blank"; wa.rel = "noopener";
    li.appendChild(wa);
  }
  return li;
}

// ---------- Filtros y orden ----------
function clasificar(lista, orden, categoria) {
  const copia = [...lista];
  if (orden === "asc") return copia.sort((a, b) => a.precio - b.precio || a.orden - b.orden);
  if (orden === "desc") return copia.sort((a, b) => b.precio - a.precio || a.orden - b.orden);
  // Recomendados: en Palas van primero las de nivel inicial; los más vendidos siempre arriba de su grupo.
  const rangoCat = (p) => { const i = ORDEN_CATEGORIAS.indexOf(p.categoria); return i < 0 ? 99 : i; };
  return copia.sort((a, b) =>
    (categoria ? 0 : rangoCat(a) - rangoCat(b)) ||
    ((a.categoria === "Palas" ? NIVEL_RANGO_PALAS[a.nivel] ?? 4 : 0) - (b.categoria === "Palas" ? NIVEL_RANGO_PALAS[b.nivel] ?? 4 : 0)) ||
    (Number(b.masVendido) - Number(a.masVendido)) ||
    a.orden - b.orden
  );
}

function aplicarFiltros({ reiniciar = true } = {}) {
  const q = sinTildes($("f-q").value);
  const cat = $("f-cat").value, nivel = $("f-nivel").value, marca = $("f-marca").value, orden = $("f-orden").value;
  const lista = productos.filter((p) =>
    (!cat || p.categoria === cat) &&
    (!nivel || p.nivel === nivel || (p.nivel === "todos" && nivel)) &&
    (!marca || p.marca === marca) &&
    (!q || sinTildes(`${p.marca} ${p.nombre} ${p.codigo} ${p.categoria}`).includes(q))
  );
  filtrados = clasificar(lista, orden, cat);
  if (reiniciar) visibles = POR_PAGINA;
  pintar();
  marcarCategoria(cat);
}

function pintar() {
  const grilla = $("grilla");
  grilla.replaceChildren(...filtrados.slice(0, visibles).map(tarjeta));
  $("cuenta").textContent = filtrados.length
    ? `${filtrados.length} producto${filtrados.length === 1 ? "" : "s"}`
    : "";
  $("vacio").hidden = filtrados.length > 0;
  $("mas").hidden = filtrados.length <= visibles;
  if (filtrados.length > visibles) $("mas").textContent = `Ver más productos (${filtrados.length - visibles} más)`;
}

function marcarCategoria(cat) {
  document.querySelectorAll(".cat").forEach((b) => b.classList.toggle("activa", b.dataset.cat === cat));
}

function poblarSelect(id, valores, etiquetaTodos) {
  const s = $(id);
  const previo = s.value;
  s.replaceChildren(new Option(etiquetaTodos, ""), ...valores.map((v) => new Option(v, v)));
  s.value = valores.includes(previo) ? previo : "";
}

// ---------- Recomendadas ----------
function pintarRecomendadas() {
  const base = productos.filter((p) => ((p.categoria === "Palas" && p.nivel === "inicial") || p.masVendido));
  const lista = base.sort((a, b) => Number(b.masVendido) - Number(a.masVendido) || a.precio - b.precio).slice(0, MAX_RECOMENDADAS);
  $("recomendadas").hidden = lista.length === 0;
  $("carril").replaceChildren(...lista.map((p) => { const c = tarjeta(p); c.setAttribute("role", "listitem"); return c; }));
}

// ---------- Ficha de producto ----------
const modal = $("modal");

function abrirFicha(p, { sinHash = false } = {}) {
  $("m-img").replaceWith(Object.assign(imagen(p, 600), { id: "m-img" }));
  $("m-marca").textContent = p.marca;
  $("m-nombre").textContent = p.nombre;
  $("m-cod").textContent = p.codigo;
  $("m-precio").textContent = soles(p.precio);
  const tagNivel = $("m-nivel");
  const hayNivel = etiquetaNivel(p);
  tagNivel.hidden = !hayNivel;
  if (hayNivel) { tagNivel.textContent = hayNivel; tagNivel.className = `tag tag-${p.nivel}`; }
  pintarDescripcion($("m-desc"), p.descripcion || "Consultame por WhatsApp los colores, tamaños y el stock que tengo disponible.");
  prepararTalles(p);
  if (!modal.open) modal.showModal();
  document.body.classList.add("modal-abierto");
  if (!sinHash && location.hash !== "#" + p.codigo) history.pushState(null, "", "#" + p.codigo);
}

// Talle obligatorio en zapatillas y ropa: el botón de WhatsApp se activa al elegirlo.
function prepararTalles(p) {
  const wa = $("m-wa"), caja = $("m-tallas"), chips = $("m-tallas-lista");
  chips.replaceChildren();
  const activar = (talle) => {
    wa.removeAttribute("aria-disabled");
    wa.href = linkWhatsApp(p, talle);
    wa.textContent = talle ? `Pedir por WhatsApp · talle ${talle}` : "Pedir por WhatsApp";
    wa.target = "_blank";
  };
  if (!p.tallas.length) { caja.hidden = true; activar(""); return; }
  caja.hidden = false;
  wa.setAttribute("aria-disabled", "true");
  wa.removeAttribute("href");
  wa.removeAttribute("target");
  wa.textContent = "Elegí tu talle para pedir";
  p.tallas.forEach((t) => {
    const b = el("button", "talle", t);
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      chips.querySelectorAll(".talle").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      activar(t);
    });
    chips.appendChild(b);
  });
}

function cerrarFicha() {
  if (modal.open) modal.close();
  document.body.classList.remove("modal-abierto");
}

$("m-cerrar").addEventListener("click", () => { if (location.hash) history.back(); else cerrarFicha(); });
modal.addEventListener("click", (e) => { if (e.target === modal) { if (location.hash) history.back(); else cerrarFicha(); } });
modal.addEventListener("cancel", (e) => { e.preventDefault(); if (location.hash) history.back(); else cerrarFicha(); });

function segunHash() {
  const codigo = decodeURIComponent(location.hash.slice(1));
  const p = codigo && productos.find((x) => x.codigo === codigo);
  if (p) abrirFicha(p, { sinHash: true }); else cerrarFicha();
}
window.addEventListener("hashchange", segunHash);

// ---------- Arranque ----------
function enlazarWhatsAppGeneral() {
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`${SALUDO}, quiero consultar por la tienda`)}`;
  $("wa-flotante").href = url;
  $("pie-wa").href = url;
}

function limpiar() {
  $("f-q").value = ""; $("f-cat").value = ""; $("f-nivel").value = ""; $("f-marca").value = ""; $("f-orden").value = "rec";
  aplicarFiltros();
}

async function iniciar() {
  enlazarWhatsAppGeneral();
  try {
    const r = await fetch(CSV_URL, { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    productos = aProductos(parseCSV(await r.text()));
  } catch {
    $("cuenta").textContent = "No pudimos cargar los productos. Escribime por WhatsApp y te los paso.";
    return;
  }
  const categorias = [...new Set(productos.map((p) => p.categoria))]
    .sort((a, b) => (ORDEN_CATEGORIAS.indexOf(a) + 1 || 99) - (ORDEN_CATEGORIAS.indexOf(b) + 1 || 99));
  poblarSelect("f-cat", categorias, "Todas");
  poblarSelect("f-marca", [...new Set(productos.map((p) => p.marca))].filter(Boolean).sort((a, b) => a.localeCompare(b, "es")), "Todas");
  document.querySelectorAll("[data-n]").forEach((s) => {
    const n = productos.filter((p) => p.categoria === s.dataset.n).length;
    s.textContent = n ? `${n} productos` : "";
  });
  pintarRecomendadas();
  aplicarFiltros();
  if (location.hash) segunHash();
}

["f-q", "f-cat", "f-nivel", "f-marca", "f-orden"].forEach((id) => {
  $(id).addEventListener(id === "f-q" ? "input" : "change", () => aplicarFiltros());
});
$("filtros").addEventListener("submit", (e) => e.preventDefault());
$("f-limpiar").addEventListener("click", limpiar);
$("vacio-limpiar").addEventListener("click", limpiar);
$("mas").addEventListener("click", () => { visibles += POR_PAGINA; pintar(); });
document.querySelectorAll(".cat").forEach((b) => b.addEventListener("click", () => {
  $("f-cat").value = b.dataset.cat;
  $("f-q").value = "";
  aplicarFiltros();
  $("catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
}));

iniciar();
