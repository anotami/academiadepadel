// Referencia del script para correr UNA VEZ en la carpeta local de admin de
// Gabriel (junto a clave.json), para sembrar 10 jugadores ficticios en
// jugadores_comunidad y poder probar el directorio, "Falta el cuarto" y
// Leads sin esperar altas reales.
// No se ejecuta como parte del sitio — queda acá solo como registro.
//
// Por seguridad corre en modo "vista previa" por default (no toca nada).
// Para sembrar de verdad:
//   node seed-jugadores-comunidad.js --confirmo
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const app = initializeApp({ credential: cert(require("./clave.json")) });
const db = getFirestore(app);

const CONFIRMAR = process.argv.includes("--confirmo");

const JUGADORES_PRUEBA = [
  { nombreCompleto: "Renzo Salazar (prueba)", whatsapp: "+51900111001", categoria: "2da", categoriaEstado: "verificada", genero: "Masculino", posicion: "Drive", distrito: "Miraflores", horarios: ["Noche"], interesadoClases: "no" },
  { nombreCompleto: "Valeria Chávez (prueba)", whatsapp: "+51900111002", categoria: "3ra", categoriaEstado: "verificada", genero: "Femenino", posicion: "Revés", distrito: "San Isidro", horarios: ["Tarde", "Noche"], interesadoClases: "tal_vez" },
  { nombreCompleto: "Diego Huamán (prueba)", whatsapp: "+51900111003", categoria: "4ta", categoriaEstado: "a_verificar", genero: "Masculino", posicion: "Indistinto", distrito: "Surco", horarios: ["Mañana"], interesadoClases: "si" },
  { nombreCompleto: "Camila Ortiz (prueba)", whatsapp: "+51900111004", categoria: "4ta", categoriaEstado: "verificada", genero: "Femenino", posicion: "Drive", distrito: "La Molina", horarios: ["Tarde"], interesadoClases: "no" },
  { nombreCompleto: "Martín Flores (prueba)", whatsapp: "+51900111005", categoria: "5ta", categoriaEstado: "a_verificar", genero: "Masculino", posicion: "Revés", distrito: "San Borja", horarios: ["Noche"], interesadoClases: "si" },
  { nombreCompleto: "Daniela Rojas (prueba)", whatsapp: "+51900111006", categoria: "5ta", categoriaEstado: "verificada", genero: "Femenino", posicion: "Indistinto", distrito: "Barranco", horarios: ["Mañana", "Tarde"], interesadoClases: "tal_vez" },
  { nombreCompleto: "Sebastián Quispe (prueba)", whatsapp: "+51900111007", categoria: "6ta", categoriaEstado: "a_verificar", genero: "Masculino", posicion: "Drive", distrito: "Miraflores", horarios: ["Tarde", "Noche"], interesadoClases: "no" },
  { nombreCompleto: "Fiorella Núñez (prueba)", whatsapp: "+51900111008", categoria: "7ma", categoriaEstado: "a_verificar", genero: "Femenino", posicion: "Revés", distrito: "Otro", horarios: ["Noche"], interesadoClases: "si" },
  { nombreCompleto: "Álvaro Medina (prueba)", whatsapp: "+51900111009", categoria: "8va", categoriaEstado: "verificada", genero: "Masculino", posicion: "Indistinto", distrito: "San Isidro", horarios: ["Mañana"], interesadoClases: "tal_vez" },
  { nombreCompleto: "Gabriela Torres (prueba)", whatsapp: "+51900111010", categoria: "No sé / empezando", categoriaEstado: "a_verificar", genero: "Femenino", posicion: "Indistinto", distrito: "Surco", horarios: ["Tarde"], interesadoClases: "si" }
];

(async () => {
  console.log(CONFIRMAR ? "APLICANDO:" : "VISTA PREVIA (todavía no se tocó nada):");
  console.log(`  Jugadores de prueba a crear/actualizar: ${JUGADORES_PRUEBA.length}`);
  JUGADORES_PRUEBA.forEach((j) => console.log(`    - ${j.nombreCompleto} · ${j.whatsapp} · ${j.categoria}`));

  if (!CONFIRMAR) {
    console.log("\nSi esto se ve bien, corre de nuevo así: node seed-jugadores-comunidad.js --confirmo");
    process.exit(0);
  }

  const ahora = Timestamp.now();
  const batch = db.batch();
  JUGADORES_PRUEBA.forEach((j) => {
    const ref = db.collection("jugadores_comunidad").doc(j.whatsapp);
    batch.set(ref, {
      ...j,
      consentimiento: { aceptado: true, fecha: ahora },
      origen: "formulario",
      activo: true,
      notas: "Jugador de prueba creado por seed-jugadores-comunidad.js — bórralo cuando termines de probar.",
      creadoEn: ahora,
      actualizadoEn: ahora
    }, { merge: true });
  });
  await batch.commit();
  console.log("\nListo. Búscalos en el panel por \"(prueba)\" para borrarlos fácil cuando termines.");
  process.exit(0);
})();
