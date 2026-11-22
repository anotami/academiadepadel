// Datos únicos del sitio (fuente de verdad). Todo lo que las páginas generadas dicen sobre la academia sale de acá.
// Regla: nada de precios, ofertas, eventos ni testimonios inventados. Lo que falta queda como [COMPLETAR: ...].
export const MARCA = {
  nombre: "Academia de Pádel GP",
  dominio: "https://academiadepadel.pe",
  whatsapp: "51957085531",
  telefono: "+51 957 085 531",
  instagram: "https://www.instagram.com/academiapadelgp/",
  tiktok: "[COMPLETAR: URL de TikTok]",
  ciudad: "Lima",
  pais: "PE"
};

export const waLink = (mensaje) => `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent(mensaje)}`;

// Sedes de la academia (4). Los horarios generales vienen del esquema v1; Benavides todavía no tiene clases.
export const SEDES = [
  { slug: "top-padel", nombre: "Top Padel La Molina", zona: "La Molina", direccion: "Av. Melgarejo 147, La Molina",
    horarios: "Sábados y domingos por la mañana.", pista: "Cancha 1" },
  { slug: "x3", nombre: "Club adidas X3", zona: "Miraflores", direccion: "Av. Paseo de la República 5840, Miraflores",
    horarios: "Mañanas de lunes a viernes." },
  { slug: "club-padel-lima", nombre: "Club Pádel Lima (La Once)", zona: "Surquillo", direccion: "Av. Tomás Marsano 630 - A, Surquillo",
    horarios: "Mañanas de lunes a viernes y viernes por la tarde." },
  { slug: "benavides", nombre: "Peru Padel Center - Benavides", zona: "Miraflores", direccion: "Av. Alfredo Benavides 347 (Expocentro), Miraflores",
    horarios: "[COMPLETAR: horarios generales en Benavides]", nota: "Sucursal de Padel Center. Todavía sin clases dadas." }
];

// Niveles / tipos de clase. Inicial, intermedio y particulares están confirmados; mujeres y niños se confirman en la Etapa b.
export const CLASES = [
  { slug: "inicial", nombre: "Inicial" },
  { slug: "intermedio", nombre: "Intermedio" },
  { slug: "particulares", nombre: "Clases particulares" },
  { slug: "mujeres", nombre: "Mujeres", pendiente: true },
  { slug: "ninos", nombre: "Niños", pendiente: true }
];
