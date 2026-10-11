// Catálogo de canchas de pádel en Lima. academiadepadel.pe es la entrada
// "featured" (propia); el resto es un directorio informativo para quien
// busca dónde jugar — confirma siempre precio y disponibilidad con cada club.
// Teléfonos en formato solo-dígitos con código de país (51) para enlazar a wa.me.

function slug(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function redesA(lista) {
  return lista.map((r) => {
    if (typeof r === "object") return r; // { label, url } explícito, cuando el link real no es el dominio tal cual
    r = r.trim();
    if (r.startsWith("@")) return { label: r, url: `https://instagram.com/${r.slice(1)}` };
    return { label: r, url: r.startsWith("http") ? r : `https://${r}` };
  });
}

const CRUDO = [
  { nombre: "academiadepadel.pe (nuestra academia)", cancha: "Cancha 11", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "51957085531", direccion: "Lima, Perú", distrito: "Lima", redes: ["academiadepadel.pe", { label: "@academiapadelgp", url: "https://www.instagram.com/academiapadelgp/" }], tarifa: "Ver planes y precios", featured: true, foto: { src: "assets/img/gabriel/gabriel-2.jpg", alt: "Gabriel, de Academia de Pádel GP, en la cancha" } },
  { nombre: "Peru Padel Center - Mendiburu", cancha: "Cancha 1 (Panorámica)", dias: "Lunes a Viernes", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51934377679", direccion: "Av. Gral. Mendiburu 671, Miraflores", distrito: "Miraflores", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 100 - S/ 140 / hr" },
  { logo: { src: "assets/img/canchas-logos/onepadel.png", alt: "One Padel" }, nombre: "One Padel - Centro Naval", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "51980003317", direccion: "Av. San Luis 2347, San Borja", distrito: "San Borja", redes: ["onepadel-pe.matchpoint.com.es", "@onepadel.pe"], tarifa: "S/ 100 - S/ 130 / hr" },
  { nombre: "Inside Court Padel", cancha: "Cancha Central", dias: "Lunes a Domingo", horario: "07:00 - 23:00", estado: "Reservada", telefono: "51964290667", direccion: "Ca. Viña del Mar 235, Sol de La Molina, La Molina", distrito: "La Molina", redes: ["@insidecourtpadel"], tarifa: "S/ 90 - S/ 120 / hr" },
  { nombre: "Club Pádel Tenis Villa", cancha: "Cancha 1", dias: "Lunes a Sábado", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "51905465088", direccion: "Av. Hernando de Lavalle s/n, Chorrillos", distrito: "Chorrillos", redes: ["@clubpadeltenisvilla"], tarifa: "S/ 80 - S/ 110 / hr" },
  { nombre: "IGMA Padel Center", cancha: "Cancha 2", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Bloqueada", telefono: "51981334560", direccion: "Yoy Lima Box Park, Santiago de Surco", distrito: "Santiago de Surco", redes: ["igmapadel-pe.matchpoint.com.es", "@igmapadel"], tarifa: "S/ 90 - S/ 130 / hr" },
  { logo: { src: "assets/img/canchas-logos/onepadel.png", alt: "One Padel" }, nombre: "One Padel - Manuel Olguín", cancha: "Cancha 2", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51959881552", direccion: "Av. Manuel Olguín 245, Santiago de Surco", distrito: "Santiago de Surco", redes: ["onepadel-pe.matchpoint.com.es", "@onepadel.pe"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Más+ Padel Perú", cancha: "Cancha Panorámica", dias: "Lunes a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51948255017", direccion: "Av. Juan Bertolotto 611, San Miguel", distrito: "San Miguel", redes: ["maspadelperu.com", "@maspadelperu"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Eureka Sports - El Polo", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51982405663", direccion: "Jr. El Cortijo esq. Av. El Derby y Jr. El Polo, Santiago de Surco", distrito: "Santiago de Surco", redes: ["eurekasports.pe", "@eureka_sportsoficial"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Cortijo Terraza Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "", direccion: "Jr. Ernesto López Mindreau 132, Santiago de Surco", distrito: "Santiago de Surco", redes: ["@cortijoterrazaclub"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Club Pádel Lima (La Once)", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51963571563", direccion: "Av. Tomás Marsano 630 - A, Surquillo", distrito: "Surquillo", redes: ["@clubpadelima"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Bohemia Pádel Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51975613680", direccion: "Av. San Borja Sur 1228, San Borja", distrito: "San Borja", redes: ["@bohemiapadelclub"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Top Padel La Molina", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:59", estado: "Habilitada", telefono: "51940513952", direccion: "Av. Melgarejo 147, La Molina", distrito: "La Molina", redes: ["toppadel-pe.matchpoint.com.es", "@toppadel.pe"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Peru Padel Center - Benavides", cancha: "Cancha 1 (Indoor)", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51957033544", direccion: "Av. Alfredo Benavides 347 (Expocentro), Miraflores", distrito: "Miraflores", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club adidas X3", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51913861726", direccion: "Av. Paseo de la República 5840, Miraflores", distrito: "Miraflores", redes: ["beacons.ai/padelclubx3", "@padelclubx3"], tarifa: "S/ 100 - S/ 140 / hr" },
  { logo: { src: "assets/img/canchas-logos/onepadel.png", alt: "One Padel" }, nombre: "One Padel - El Trigal", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51921633793", direccion: "Ca. Los Antares 298, Santiago de Surco", distrito: "Santiago de Surco", redes: ["onepadel-pe.matchpoint.com.es", "@onepadel.pe"], tarifa: "S/ 100 - S/ 140 / hr" },
  { logo: { src: "assets/img/canchas-logos/onepadel.png", alt: "One Padel" }, nombre: "One Padel - Domingo Orué", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:30", estado: "Habilitada", telefono: "51916994252", direccion: "Pje. Recabarraca s/n, Surquillo", distrito: "Surquillo", redes: ["onepadel-pe.matchpoint.com.es", "@onepadel.pe"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Padel Arena", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "", direccion: "Jr. El Polo 843, Santiago de Surco", distrito: "Santiago de Surco", redes: ["@padelarenaperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Lima Cricket & Football Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:30", estado: "Habilitada", telefono: "5112640027", direccion: "Jr. Faustino Sánchez Carrión 200, Magdalena del Mar", distrito: "Magdalena del Mar", redes: ["clublimacricket.com", "@lima_cricket"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "XPadel Lawn Tennis", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:30", estado: "Habilitada", telefono: "51994322888", direccion: "Av. República de Chile 254, Jesús María", distrito: "Jesús María", redes: ["clublawntennis.pe", "@xpadelperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Country Club La Planicie", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "5114790045", direccion: "Av. José León Barandiarán 457, La Planicie, La Molina", distrito: "La Molina", redes: ["cclp.pe", "@countryclublaplanicie"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Mad Padel Indoor", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "", direccion: "Jr. Venegas 898, Santiago de Surco", distrito: "Santiago de Surco", redes: [{ label: "Reservas Mad Padel", url: "https://clubs.reva.la/madpadel-surco-indoor/app" }, "@madpadelperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Centro Español del Perú", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:30", estado: "Habilitada", telefono: "51948231172", direccion: "Av. Gral. Felipe Salaverry 1910, Jesús María", distrito: "Jesús María", redes: ["centroespanolperu.pe", "@centroespanolperu"], tarifa: "S/ 90 - S/ 120 / hr" },
  { nombre: "Peru Padel Center - Villa", cancha: "Cancha 1 (Panorámica)", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51934377679", direccion: "Av. Alameda del Premio Real Mz. D-01 Lt. 07, Chorrillos", distrito: "Chorrillos", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club Tennis Las Terrazas Miraflores", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:30", estado: "Habilitada", telefono: "5115123200", direccion: "Malecón 28 de Julio 390, Miraflores", distrito: "Miraflores", redes: ["clubterrazas.com.pe", "@clubterrazas"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Jockey Club del Perú", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "", direccion: "Av. El Derby s/n, Santiago de Surco", distrito: "Santiago de Surco", redes: ["@jockeyclubperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "PPA Sports - Magdalena", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51993666527", direccion: "Av. del Ejército 750, Magdalena del Mar", distrito: "Magdalena del Mar", redes: ["linktr.ee/ppa.sports", "@ppasports.pe"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Club de Regatas \"Lima\" - Filial Villa Deportiva", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:00", estado: "Habilitada", telefono: "5112134567", direccion: "Carretera Panamericana Sur Km 20.4, Chorrillos", distrito: "Chorrillos", redes: ["clubregatas.org.pe", "@clubderegataslima"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Rinconada Country Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:00", estado: "Habilitada", telefono: "5116197979", direccion: "Av. Manuel Prado Ugarteche 901, La Molina", distrito: "La Molina", redes: ["rinconadacountryclub.org.pe", "@rinconadacountryclub"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Real Club de Lima", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:30", estado: "Habilitada", telefono: "5112070760", direccion: "Calle Los Castaños 505, San Isidro", distrito: "San Isidro", redes: ["realclubdelima.org.pe", "@realclubdelima"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Peru Padel Center - Asia", cancha: "Cancha 1 (Verano / Panorámica)", dias: "Jueves a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51934377679", direccion: "Km 97.5 Panamericana Sur, Boulevard de Asia", distrito: "Asia", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 110 - S/ 150 / hr" },
  { nombre: "Eureka Sports - San Borja", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:30 - 22:30", estado: "Habilitada", telefono: "51982405663", direccion: "Av. Del Aire 150, San Borja", distrito: "San Borja", redes: ["eurekasports.pe", "@eureka_sportsoficial"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Mad Padel - La Molina", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51950303330", direccion: "La Molina, Lima", distrito: "La Molina", redes: ["@madpadelperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Club Petroperú", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "51994607554", direccion: "Av. Club Golf Los Incas 320, Santiago de Surco", distrito: "Santiago de Surco", redes: ["clubpetroperu.com.pe", "@clubpetroperuoficial"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Club Náutico Poseidón", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "08:00 - 20:00", estado: "Habilitada", telefono: "5113187381", direccion: "Bahía de Pucusana, Km 57 Panamericana Sur, Pucusana", distrito: "Pucusana", redes: [], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Playa Palabritas", cancha: "Cancha 1", dias: "Jueves a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "", direccion: "Km 102 Panamericana Sur, Playa Palabritas, Asia", distrito: "Asia", redes: [], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club Deporcentro Casuarinas", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "5113440119", direccion: "Jr. Tomasal 1145, Santiago de Surco", distrito: "Santiago de Surco", redes: ["@deporcentro_casuarinas"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Lima Golf Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:00", estado: "Habilitada", telefono: "5112777090", direccion: "Av. Camino Real 770, San Isidro", distrito: "San Isidro", redes: ["limagolfclub.org.pe", "@lima_golf_club"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club Playa del Sol", cancha: "Cancha 1 (Verano)", dias: "Jueves a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "", direccion: "Km 97.5 Panamericana Sur, Asia", distrito: "Asia", redes: [], tarifa: "S/ 100 - S/ 140 / hr" }
];

export const CANCHAS = CRUDO.map((c) => ({
  ...c,
  id: slug(c.nombre),
  redesLinks: redesA(c.redes)
}));

export const DISTRITOS = Array.from(new Set(CANCHAS.map((c) => c.distrito))).sort((a, b) => a.localeCompare(b, "es"));
