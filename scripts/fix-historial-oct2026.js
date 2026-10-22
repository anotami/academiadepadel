// Referencia del script para correr UNA VEZ en la carpeta local de admin de
// Gabriel (junto a clave.json), para corregir 3 cosas del historial de
// octubre 2026 que se vieron mal en "Rentabilidad":
//
// 1) Borra la reserva de Jose Alfonso Jara del 09/10/2026 por S/ 75 — no existió.
// 2) Borra la reserva de Jose Alfonso Jara del 16/10/2026 por S/ 40 — no existió.
// 3) La reserva de Bryan Yataco del 16/10/2026 (S/ 40 suelta) en realidad fue
//    la 1ra clase consumida de su paquete de 4 clases (S/ 170) — se vincula
//    esa reserva al paqueteId y se marca clasesUsadas: 1 en el paquete.
//    (Su clase del 09/10/2026, pagada aparte, queda intacta: esa sí la pagó suelta.)
//
// No se ejecuta como parte del sitio — queda acá solo como registro.
//
// Por seguridad corre en modo "vista previa" por default (no toca nada).
// Para aplicar de verdad:
//   node fix-historial-oct2026.js --confirmo
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const app = initializeApp({ credential: cert(require("./clave.json")) });
const db = getFirestore(app);

const CONFIRMAR = process.argv.includes("--confirmo");

(async () => {
  const reservasSnap = await db.collection("reservas").get();
  const reservas = reservasSnap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }));

  const aBorrar = reservas.filter((r) =>
    (r.alumnoNombre || "").trim() === "Jose Alfonso Jara" &&
    ((r.fecha === "2026-10-09" && r.montoCobrado === 75) ||
     (r.fecha === "2026-10-16" && r.montoCobrado === 40))
  );

  const reservaBryan16 = reservas.find((r) =>
    (r.alumnoNombre || "").trim() === "Bryan Yataco" && r.fecha === "2026-10-16" && !r.paqueteId
  );

  const paquetesSnap = await db.collection("paquetes")
    .where("alumnoNombre", "==", "Bryan Yataco")
    .get();
  const paquetes = paquetesSnap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }));
  const paquete4 = paquetes.find((p) => p.clasesTotales === 4 && p.monto === 170);

  console.log(CONFIRMAR ? "APLICANDO:" : "VISTA PREVIA (todavía no se tocó nada):");
  console.log(`  Reservas fantasma de Jose Alfonso Jara a borrar: ${aBorrar.length}`);
  aBorrar.forEach((r) => console.log(`    - ${r.id} · ${r.fecha} · S/ ${r.montoCobrado}`));
  console.log(`  Reserva de Bryan Yataco (16/10) a vincular: ${reservaBryan16 ? reservaBryan16.id : "NO ENCONTRADA — revisar a mano"}`);
  console.log(`  Paquete de Bryan Yataco (4 clases, S/170): ${paquete4 ? `${paquete4.id} (clasesUsadas actual: ${paquete4.clasesUsadas})` : "NO ENCONTRADO — revisar a mano"}`);

  if (!CONFIRMAR) {
    console.log("\nSi esto se ve bien, corre de nuevo así: node fix-historial-oct2026.js --confirmo");
    process.exit(0);
  }

  const batch = db.batch();
  aBorrar.forEach((r) => batch.delete(r.ref));
  if (reservaBryan16 && paquete4) {
    batch.update(reservaBryan16.ref, { paqueteId: paquete4.id });
    batch.update(paquete4.ref, { clasesUsadas: 1 });
  }
  await batch.commit();
  console.log("\nListo.");
  process.exit(0);
})();
