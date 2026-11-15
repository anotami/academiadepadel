// Registra que el invitado que acaba de llenar un formulario llegó con un código.
// Nunca bloquea el formulario: si algo falla, el interesado se guardó igual.
import { db, addDoc, collection, serverTimestamp } from "./firebase-app.js?v=18";
import { leerReferidoGuardado, guardarReferido } from "./referidos-config.js?v=1";

export async function registrarReferidoSiHay({ nombre, whatsapp, origen }) {
  const r = leerReferidoGuardado();
  if (!r || !r.invitadorId || r.registrado) return false;
  try {
    await addDoc(collection(db, "referidos"), {
      codigo: r.codigo, invitadorId: r.invitadorId, invitadorNombre: r.nombre,
      invitadoNombre: nombre, invitadoWhatsapp: whatsapp,
      origen, estado: "nuevo", creadoEn: serverTimestamp()
    });
    guardarReferido({ ...r, registrado: true });
    return true;
  } catch {
    return false;
  }
}
