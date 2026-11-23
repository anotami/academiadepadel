// Programa "Invita a un amigo". Los beneficios se cambian ACÁ, en un solo lugar.
//  - El invitado recibe un descuento en su primer paquete.
//  - Quien lo invitó recibe una clase de regalo cuando el invitado paga su primer paquete.
export const REFERIDOS = {
  descuentoInvitadoPct: 10,
  textoBeneficioInvitado: "10% de descuento en tu primer paquete",        // se lo dicen al invitado
  textoBeneficioInvitadoTercera: "10% de descuento en su primer paquete", // se habla DEL invitado
  clasesRegaloInvitador: 1,
  textoBeneficioInvitador: "1 clase de regalo",
  vigenciaDias: 30,
  claveStorage: "gp_ref",
  sitio: "https://academiadepadel.pe"
};

// Formato: PRIMERNOMBRE-XXXX (ej. KARLA-7QX2). Sin caracteres que se confundan (0/O, 1/I).
export const REGEX_CODIGO = /^[A-Z]{1,8}-[A-Z0-9]{4}$/;

export function generarCodigo(nombre) {
  const base = (nombre || "AMIGO").trim().split(/\s+/)[0]
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 8) || "AMIGO";
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const azar = crypto.getRandomValues(new Uint8Array(4));
  return `${base}-${Array.from(azar, (n) => alfabeto[n % alfabeto.length]).join("")}`;
}

export function linkInvitacion(codigo) {
  return `${REFERIDOS.sitio}/?ref=${encodeURIComponent(codigo)}`;
}

// Mensaje para que quien tiene el código se lo mande a un amigo.
export function mensajeInvitacion(codigo, nombreAlumno) {
  return `Hola! Soy ${nombreAlumno}, entreno pádel en Academia de Pádel GP y te lo recomiendo 🎾\n` +
    `Con mi link tenés ${REFERIDOS.textoBeneficioInvitado}:\n${linkInvitacion(codigo)}\n` +
    `Mi código es ${codigo}.`;
}

// ---- Recordar el código del invitado en este navegador (vigencia limitada) ----
export function leerReferidoGuardado() {
  try {
    const v = JSON.parse(localStorage.getItem(REFERIDOS.claveStorage) || "null");
    if (v && v.codigo && Date.now() - v.ts < REFERIDOS.vigenciaDias * 86400000) return v;
  } catch { /* sin almacenamiento: simplemente no se recuerda */ }
  return null;
}

export function guardarReferido(datos) {
  try { localStorage.setItem(REFERIDOS.claveStorage, JSON.stringify({ ...datos, ts: Date.now() })); } catch { /* idem */ }
}

// Línea que se agrega a los mensajes de WhatsApp para que Gabriel sepa quién invitó.
export function textoRef() {
  const r = leerReferidoGuardado();
  return r && r.invitadorId ? `\n🎁 Me invitó ${r.nombre} (código ${r.codigo})` : "";
}
