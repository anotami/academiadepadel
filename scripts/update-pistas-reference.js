// Referencia del script que se le entregó a Gabriel para correr UNA VEZ
// en su carpeta local de admin (junto a clave.json y set-admin.js), para
// bloquear todas las pistas salvo X3 y La Once en su Firestore en vivo.
// No se ejecuta como parte del sitio — queda acá solo como registro.
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const app = initializeApp({ credential: cert(require("./clave.json")) });
const db = getFirestore(app);

const FRANJAS = ["6:00–8:00", "8:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00", "20:00–22:00"];
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const FIN_DE_SEMANA = ["Sábado", "Domingo"];

function grilla(dias, franjas) {
  return dias.flatMap((dia) => franjas.map((franja) => ({ dia, franja })));
}

const X3 = {
  estadoPista: "Habilitada",
  costoHora: 70,
  horario: "Lunes a Domingo, 7:30 – 18:00",
  notas: "Costo fijo: S/ 70/hora.",
  disponibilidad: grilla(DIAS, ["6:00–8:00", "8:00–10:00", "10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00"])
};

const LA_ONCE = {
  estadoPista: "Habilitada",
  costoHora: 80,
  horario: "Lunes a Viernes 6:00-8:00 y 16:00-23:00 · Sábado y domingo 6:00-22:00",
  notas: "S/ 80/hora hasta las 18:00; desde las 18:00 sube a S/ 100/hora.",
  disponibilidad: [
    ...grilla(DIAS_SEMANA, ["6:00–8:00", "16:00–18:00", "18:00–20:00", "20:00–22:00"]),
    ...grilla(FIN_DE_SEMANA, FRANJAS)
  ]
};

(async () => {
  const snap = await db.collection("pistas").get();
  console.log(`Encontradas ${snap.size} pistas.`);
  const batch = db.batch();
  let actualizadas = 0, bloqueadas = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const nombre = (data.nombre || "").toLowerCase();
    const cancha = (data.cancha || "").toLowerCase();
    const esX3 = nombre.includes("x3");
    const esLaOnce = nombre.includes("once") || cancha.includes("11");

    if (esX3) {
      batch.update(docSnap.ref, X3);
      console.log("✔ X3 ->", data.nombre);
      actualizadas++;
    } else if (esLaOnce) {
      batch.update(docSnap.ref, LA_ONCE);
      console.log("✔ La Once ->", data.nombre);
      actualizadas++;
    } else {
      batch.update(docSnap.ref, { estadoPista: "Bloqueada" });
      bloqueadas++;
    }
  });

  await batch.commit();
  console.log(`Listo. ${actualizadas} actualizadas (X3/La Once), ${bloqueadas} bloqueadas.`);
  process.exit(0);
})();
