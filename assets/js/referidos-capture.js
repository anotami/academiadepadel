// Invitaciones ("Invita a un amigo"): detecta ?ref=CODIGO en el link, valida que el código
// exista, lo recuerda 30 días, da la bienvenida y suma el código a los botones de WhatsApp.
import { db, doc, getDoc } from "./firebase-app.js?v=18";
import { REFERIDOS, REGEX_CODIGO, leerReferidoGuardado, guardarReferido, textoRef } from "./referidos-config.js?v=1";

const WHATSAPP = "51957085531";

// Los formularios clásicos (sin módulos) leen esto al armar su mensaje.
window.gpRefTexto = textoRef;

async function resolverCodigo() {
  const param = (new URLSearchParams(location.search).get("ref") || "").trim().toUpperCase();
  const guardado = leerReferidoGuardado();
  if (!param || !REGEX_CODIGO.test(param) || (guardado && guardado.codigo === param)) return guardado;
  try {
    const snap = await getDoc(doc(db, "codigos_referido", param));
    if (!snap.exists()) return guardado;
    const d = snap.data();
    const nombre = (d.alumnoNombre || "").split(" ")[0];
    guardarReferido({ codigo: param, invitadorId: d.alumnoId, nombre, registrado: false });
    return leerReferidoGuardado();
  } catch {
    return guardado;
  }
}

function sumarCodigoALosBotonesDeWhatsApp(r) {
  const extra = textoRef();
  if (!extra) return;
  document.querySelectorAll(`a[href^="https://wa.me/${WHATSAPP}"]`).forEach((a) => {
    try {
      const url = new URL(a.href);
      const texto = url.searchParams.get("text") || "Hola, quiero más información";
      if (texto.includes(r.codigo)) return;
      url.searchParams.set("text", texto + extra);
      a.href = url.toString();
    } catch { /* link raro: se deja como está */ }
  });
}

function mostrarBienvenida(r) {
  if (document.getElementById("ref-banner")) return;
  const mensaje = `Hola, quiero reclamar mi beneficio de invitación.${textoRef()}`;
  const banner = document.createElement("div");
  banner.id = "ref-banner";
  banner.className = "ref-banner";
  banner.setAttribute("role", "status");
  banner.innerHTML = `
    <span class="ref-banner-texto">🎁 <strong></strong> te invitó: tienes <strong></strong>. Tu código: <strong class="ref-banner-codigo"></strong></span>
    <a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener">Reclamar por WhatsApp</a>
    <button class="ref-banner-cerrar" type="button" aria-label="Cerrar">×</button>`;
  const fuertes = banner.querySelectorAll("strong");
  fuertes[0].textContent = r.nombre;
  fuertes[1].textContent = REFERIDOS.textoBeneficioInvitado;
  fuertes[2].textContent = r.codigo;
  banner.querySelector("a").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  banner.querySelector(".ref-banner-cerrar").addEventListener("click", () => banner.remove());
  const cabecera = document.querySelector(".site-header");
  if (cabecera) cabecera.insertAdjacentElement("afterend", banner);
  else document.body.prepend(banner);
}

resolverCodigo().then((r) => {
  if (!r || !r.invitadorId) return;
  mostrarBienvenida(r);
  sumarCodigoALosBotonesDeWhatsApp(r);
});
