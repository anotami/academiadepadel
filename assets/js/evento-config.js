// Datos del próximo evento (evento.html) -- Gabriel los completa acá cada
// vez que hay uno nuevo. Dejar un campo vacío ("") es válido: evento.html
// no inventa fecha ni precio, muestra "a confirmar" en su lugar.
export const EVENTO = {
  titulo: "",          // Ej: "Torneo relámpago de pádel"
  fecha: "",            // "YYYY-MM-DD", ej: "2026-12-05"
  horario: "",          // Ej: "Desde las 18:00"
  sede: "",              // Ej: "Club Pádel Lima (La Once)"
  direccion: "",         // Ej: "Surquillo"
  mapsUrl: "",           // Link de Google Maps
  formato: "",           // Ej: "Americano, parejas mixtas"
  cupo: "",               // Número de cupos, ej: 16 (vacío = no mostrar)
  precio: "",             // Ej: 50 (vacío = "a confirmar" en vez de inventar un precio)
  linkInscripcion: "",   // Link externo de inscripción, si no usa un form propio
  descripcion: ""        // Texto corto, en voseo
};
