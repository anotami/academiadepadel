// Datos únicos del sitio (fuente de verdad). Todo lo que las páginas generadas dicen sobre la academia sale de acá.
// Regla: nada de precios, ofertas, eventos ni testimonios inventados. Lo que falta queda como [COMPLETAR: ...].
export const MARCA = {
  nombre: "Academia de Pádel GP",
  dominio: "https://academiadepadel.pe",
  whatsapp: "51957085531",
  telefono: "+51 957 085 531",
  instagram: "https://www.instagram.com/academiapadelgp/",
  tiktok: null, // la academia todavía no tiene TikTok
  ciudad: "Lima",
  pais: "PE"
};

export const waLink = (mensaje) => `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent(mensaje)}`;

// Sedes de la academia (4). Los horarios generales vienen del esquema v1; los servicios y la política de costo de pista, de lo que ya
// está publicado en la home. Nada de esto se inventa: lo que falta queda como [COMPLETAR: ...] y la página sale con noindex hasta completarlo.
const AMENIDADES = ["🚗 Amplio estacionamiento", "🚿 Vestuarios y duchas", "🎾 Pala incluida en tu clase de prueba", "🛋️ Zona de descanso"];
export const SEDES = [
  { slug: "x3", nombre: "Club adidas X3", zona: "Miraflores", direccion: "Av. Paseo de la República 5840, Miraflores",
    titulo: "Clases de pádel en X3, Miraflores", h1: "Clases de pádel en el Club adidas X3, Miraflores",
    descripcion: "Clases de pádel en el Club adidas X3, Miraflores: nuestra sede principal, con mañanas de lunes a viernes. Pedí tu clase de prueba por WhatsApp.",
    intro: "Es nuestra sede principal y la que más recomendamos: la tarifa de tus clases incluye el 100% del alquiler de la pista y la iluminación.",
    horarios: "Mañanas de lunes a viernes.", amenidades: AMENIDADES, costo: "incluido", foto: "club-adidas-x3",
    fotoAlt: "Vista aérea de las pistas del Club adidas X3, en Miraflores" },
  { slug: "top-padel", nombre: "Top Padel La Molina", zona: "La Molina", direccion: "Av. Melgarejo 147, La Molina",
    titulo: "Clases de pádel en Top Padel, La Molina", h1: "Clases de pádel en Top Padel La Molina",
    descripcion: "Clases de pádel en Top Padel La Molina los sábados y domingos, de 8:00 a 20:00. Pedí tu clase de prueba por WhatsApp y reservamos tu lugar.",
    intro: "Entrenamos los fines de semana en La Molina. Ideal si vivís por la zona o preferís jugar el sábado o el domingo.",
    horarios: "Sábados y domingos, de 8:00 a 20:00 (sobre todo por la mañana).", amenidades: ["🎾 Pala incluida en tu clase de prueba"], costo: "aparte", foto: "top-padel-la-molina",
    fotoAlt: "Gabriel jugando en una pista de Top Padel La Molina" },
  { slug: "club-padel-lima", nombre: "Club Pádel Lima (La Once)", zona: "Surquillo", direccion: "Av. Tomás Marsano 630 - A, Surquillo",
    titulo: "Clases de pádel en Club Pádel Lima", h1: "Clases de pádel en Club Pádel Lima (La Once), Surquillo",
    descripcion: "Clases de pádel en Club Pádel Lima (La Once), Surquillo: mañanas de lunes a viernes y viernes por la tarde. Pedí tu clase de prueba por WhatsApp.",
    intro: "Coordinamos clases en La Once, en Surquillo, con mañanas de lunes a viernes y viernes por la tarde.",
    horarios: "Mañanas de lunes a viernes y viernes por la tarde.", amenidades: AMENIDADES, costo: "aparte", foto: null, fotoAlt: "" },
  { slug: "benavides", nombre: "Peru Padel Center - Benavides", zona: "Miraflores", direccion: "Av. Alfredo Benavides 347 (Expocentro), Miraflores",
    titulo: "Clases de pádel en Benavides, Miraflores", h1: "Clases de pádel en Peru Padel Center - Benavides, Miraflores",
    descripcion: "Clases de pádel en Peru Padel Center - Benavides, Miraflores: pista techada en pleno Miraflores. Consultá la disponibilidad por WhatsApp.",
    intro: "Pista techada en pleno Miraflores, en la sucursal de Benavides de Peru Padel Center.",
    horarios: "De 6:00 a 21:00.", amenidades: AMENIDADES, costo: "aparte", foto: "peru-padel-center-benavides",
    fotoAlt: "Pista techada de Peru Padel Center - Benavides, en Miraflores" }
];

// Niveles / tipos de clase. Inicial, intermedio y particulares están confirmados; mujeres y niños se confirman en la Etapa b.
export const CLASES = [
  { slug: "inicial", nombre: "Inicial" },
  { slug: "intermedio", nombre: "Intermedio" },
  { slug: "particulares", nombre: "Clases particulares" },
  { slug: "mujeres", nombre: "Mujeres" },
  { slug: "ninos", nombre: "Niños" }
];
