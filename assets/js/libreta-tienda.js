// Libreta PRIVADA de la tienda (solo el profesor): a qué tienda corresponde cada "Ref: Tn" que llega
// en los pedidos de WhatsApp. Vive en Firestore (libreta_tienda), no en el sitio público.
import { db, doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from "./firebase-app.js?v=18";
import { escapeHtml } from "./utils.js?v=1";

// Códigos que ya genera la tienda según el servidor de la foto (tienda/config.js).
// Se siembran la primera vez; la columna "Tienda" la completas tú.
// Códigos de 3 letras que la web pone en "Ref:" (columna ref_tienda de tienda/productos.csv).
const TIENDAS_3L = { RAQ: "Raqueton", WIL: "Wilson Store Perú", PSP: "PadelShop Perú", PHO: "Padel House", BUL: "Bullpadel Perú", MAS: "Más Padel Perú", LIM: "LimaPadel", MER: "Mercado Pádel Perú" };
const SEMILLA = [
  ["T1", "bullpadel.com.pe"], ["T2", "cms.limapadel.pe"], ["T3", "padelhouse.pe"], ["T4", "mercadopadelperu.com"],
  ["T5", "cdn.shopify.com"], ["T6", "static.wixstatic.com"], ["T7", "Supabase (nizmaeaiphwrtxtsowpq)"]
];

const $ = (id) => document.getElementById(id);
let filas = {};
let sembrado = false;

function pintar() {
  const cuerpo = $("lt-filas");
  const refs = Object.keys(filas).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  cuerpo.innerHTML = refs.map((r) => {
    const f = filas[r];
    return `<tr data-ref="${escapeHtml(r)}">
      <td><strong>${escapeHtml(r)}</strong></td>
      <td class="court-meta">${escapeHtml(f.origenFoto || "—")}</td>
      <td><input type="text" data-campo="tienda" value="${escapeHtml(f.tienda || "")}" placeholder="¿Qué tienda es?" maxlength="80" aria-label="Tienda de ${escapeHtml(r)}"></td>
      <td><input type="text" data-campo="notas" value="${escapeHtml(f.notas || "")}" placeholder="Notas (contacto, descuento…)" maxlength="200" aria-label="Notas de ${escapeHtml(r)}"></td>
      <td><button class="btn btn-outline btn-small" type="button" data-guardar>Guardar</button> <button class="btn btn-outline btn-small" type="button" data-borrar aria-label="Borrar ${escapeHtml(r)}">✕</button></td>
    </tr>`;
  }).join("");
  cuerpo.querySelectorAll("tr").forEach((tr) => {
    const ref = tr.dataset.ref;
    tr.querySelector("[data-guardar]").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      try {
        await setDoc(doc(db, "libreta_tienda", ref), {
          ref, origenFoto: filas[ref].origenFoto || "",
          tienda: tr.querySelector('[data-campo="tienda"]').value.trim(),
          notas: tr.querySelector('[data-campo="notas"]').value.trim(),
          actualizadoEn: serverTimestamp()
        });
        btn.textContent = "Guardado ✓"; setTimeout(() => { btn.textContent = "Guardar"; }, 1500);
      } catch (err) { $("lt-msg").textContent = "No se pudo guardar: " + err.message; $("lt-msg").className = "form-msg error"; }
    });
    tr.querySelector("[data-borrar]").addEventListener("click", async () => {
      if (!confirm(`¿Borrar el código ${ref} de la libreta?`)) return;
      try { await deleteDoc(doc(db, "libreta_tienda", ref)); }
      catch (err) { $("lt-msg").textContent = "No se pudo borrar: " + err.message; $("lt-msg").className = "form-msg error"; }
    });
  });
}

// Pega un mensaje de WhatsApp y te dice de qué tienda es.
function decodificar() {
  const texto = $("lt-pegado").value;
  const salida = $("lt-resultado");
  if (!texto.trim()) { salida.textContent = ""; return; }
  const ref = (texto.match(/Ref:\s*([A-Za-z0-9-]+)/i) || [])[1];
  const producto = (texto.match(/GP-[A-Z]{3}-\d{3}/) || [])[0];
  const precio = (texto.match(/S\/\s*[\d.,]+/) || [])[0];
  const talle = (texto.match(/Talle:\s*([^·\n]+)/i) || [])[1];
  if (!ref) { salida.textContent = "Ese mensaje no trae un “Ref: …” (no viene de la tienda, o es un pedido viejo)."; return; }
  const f = filas[ref.toUpperCase()];
  const tienda = TIENDAS_3L[ref.toUpperCase()] || (f && f.tienda ? f.tienda : "(sin nombre todavía: complétalo en la tabla)");
  salida.textContent = `Tienda: ${tienda}  ·  Ref ${ref.toUpperCase()}` + (producto ? `  ·  ${producto}` : "") + (precio ? `  ·  precio de la web ${precio}` : "") + (talle ? `  ·  talle ${talle.trim()}` : "") + (f && f.notas ? `  ·  ${f.notas}` : "");
}

export function iniciarLibretaTienda() {
  const card = $("card-libreta-tienda");
  if (!card) return;
  onSnapshot(collection(db, "libreta_tienda"), async (snap) => {
    filas = {};
    snap.docs.forEach((d) => { filas[d.id] = d.data(); });
    if (!snap.docs.length && !sembrado) {
      sembrado = true;
      try { await Promise.all(SEMILLA.map(([r, o]) => setDoc(doc(db, "libreta_tienda", r), { ref: r, origenFoto: o, tienda: "", notas: "", actualizadoEn: serverTimestamp() }))); } catch { /* regla aún sin publicar */ }
      return;
    }
    pintar();
    decodificar();
  }, (err) => {
    $("lt-msg").textContent = "No se pudo leer la libreta (" + err.message + "). ¿Publicaste la regla de libreta_tienda?";
    $("lt-msg").className = "form-msg error";
  });
  $("lt-pegado").addEventListener("input", decodificar);
  $("lt-agregar").addEventListener("click", async () => {
    const ref = $("lt-nuevo").value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!ref) return;
    try { await setDoc(doc(db, "libreta_tienda", ref), { ref, origenFoto: "", tienda: "", notas: "", actualizadoEn: serverTimestamp() }); $("lt-nuevo").value = ""; }
    catch (err) { $("lt-msg").textContent = "No se pudo agregar: " + err.message; $("lt-msg").className = "form-msg error"; }
  });
}
