// Referencia del script que se le entregó a Gabriel para correr UNA VEZ en su
// carpeta local de admin (junto a clave.json y set-admin.js), para resetear
// el portal antes de empezar a registrar alumnos reales.
// No se ejecuta como parte del sitio — queda acá solo como registro.
//
// BORRA: usuarios con rol "alumno", reservas, paquetes, lista de espera
// (esperas), "busco con quién jugar" (partidos) e interesados del widget
// de grupos nuevos (interesados_grupo).
//
// NO TOCA: tu propio usuario (rol "profesor"), pistas, turnos_grupales,
// arbitrajes ni reseñas de canchas. TAMPOCO borra ninguna cuenta de acceso
// de Firebase Authentication — solo borra los documentos de Firestore, así
// que un alumno de prueba podría seguir entrando a login.html pero el
// portal ya no encontrará su perfil.
//
// Por seguridad corre en modo "vista previa" por default (solo cuenta
// cuántos documentos borraría, sin tocar nada). Para borrar de verdad:
//   node reset-datos.js --confirmo
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const app = initializeApp({ credential: cert(require("./clave.json")) });
const db = getFirestore(app);

const CONFIRMAR = process.argv.includes("--confirmo");

async function borrarDocs(docs) {
  for (let i = 0; i < docs.length; i += 450) {
    const batch = db.batch();
    docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function borrarColeccion(nombre) {
  const snap = await db.collection(nombre).get();
  if (CONFIRMAR) await borrarDocs(snap.docs);
  return snap.size;
}

async function borrarAlumnos() {
  const snap = await db.collection("usuarios").where("rol", "==", "alumno").get();
  if (CONFIRMAR) await borrarDocs(snap.docs);
  return snap.size;
}

(async () => {
  const resultados = {
    "usuarios (rol: alumno)": await borrarAlumnos(),
    reservas: await borrarColeccion("reservas"),
    paquetes: await borrarColeccion("paquetes"),
    esperas: await borrarColeccion("esperas"),
    partidos: await borrarColeccion("partidos"),
    interesados_grupo: await borrarColeccion("interesados_grupo")
  };

  console.log(CONFIRMAR ? "BORRADO (ya se aplicó):" : "VISTA PREVIA (todavía no se borró nada):");
  Object.entries(resultados).forEach(([col, n]) => console.log(`  ${col}: ${n} documento(s)`));

  if (!CONFIRMAR) {
    console.log("\nSi los números de arriba se ven bien, corre de nuevo así: node reset-datos.js --confirmo");
  } else {
    console.log("\nListo. Tu usuario de profesor, pistas, turnos_grupales, arbitrajes y reseñas quedaron intactos.");
  }
  process.exit(0);
})();
