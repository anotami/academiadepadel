// Registra que el invitado que acaba de llenar un formulario llegó con un código.
// Nunca bloquea el formulario: si algo falla, el interesado se guardó igual.
import { db, addDoc, collection, serverTimestamp, doc, getDoc } from "./firebase-app.js?v=18";
import { leerReferidoGuardado, guardarReferido, REGEX_CODIGO } from "./referidos-config.js?v=1";

// Si la persona escribió a mano un código de invitación (en vez de entrar por el
// link), lo valida contra codigos_referido y lo recuerda como si hubiera
// entrado por el link. Devuelve "ok", "invalido" o "vacio". No lanza errores.
export async function adoptarCodigoManual(texto) {
  const codigo = (texto || "").trim().toUpperCase();
  if (!codigo) return "vacio";
  const guardado = leerReferidoGuardado();
  if (guardado && guardado.codigo === codigo) return "ok";
  if (!REGEX_CODIGO.test(codigo)) return "invalido";
  try {
    const snap = await getDoc(doc(db, "codigos_referido", codigo));
    if (!snap.exists()) return "invalido";
    const d = snap.data();
    guardarReferido({ codigo, invitadorId: d.alumnoId, nombre: (d.alumnoNombre || "").split(" ")[0], registrado: false });
    return "ok";
  } catch {
    return "invalido";
  }
}

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
