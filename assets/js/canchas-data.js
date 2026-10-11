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
  { nombre: "academiadepadel.pe (nuestra academia)", cancha: "Cancha 11", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "51957085531", direccion: "Lima, Perú", distrito: "Lima", redes: ["academiadepadel.pe", "@academiadepadel"], tarifa: "Ver planes y precios", featured: true, foto: { src: "assets/img/gabriel/gabriel-2.jpg", alt: "Gabriel, de Academia de Pádel GP, en la cancha" } },
  { nombre: "Peru Padel Center - Mendiburu", cancha: "Cancha 1 (Panorámica)", dias: "Lunes a Viernes", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51934377679", direccion: "Av. Gral. Mendiburu 671, Miraflores", distrito: "Miraflores", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "One Padel - Centro Naval", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "51980003317", direccion: "Av. San Luis 2347, San Borja", distrito: "San Borja", redes: ["onepadel-pe.matchpoint.com.es", "@onepadelperu"], tarifa: "S/ 100 - S/ 130 / hr" },
  { nombre: "Inside Court Padel", cancha: "Cancha Central", dias: "Lunes a Domingo", horario: "07:00 - 23:00", estado: "Reservada", telefono: "51964290667", direccion: "Ca. Viña del Mar 235, Sol de La Molina, La Molina", distrito: "La Molina", redes: ["@insidecourtpadel"], tarifa: "S/ 90 - S/ 120 / hr" },
  { nombre: "Club Pádel Tenis Villa", cancha: "Cancha 1", dias: "Lunes a Sábado", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "51905465088", direccion: "Av. Hernando de Lavalle s/n, Chorrillos", distrito: "Chorrillos", redes: ["@clubpadeltenisvilla"], tarifa: "S/ 80 - S/ 110 / hr" },
  { nombre: "IGMA Padel Center", cancha: "Cancha 2", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Bloqueada", telefono: "51981334560", direccion: "Yoy Lima Box Park, Santiago de Surco", distrito: "Santiago de Surco", redes: ["igmapadel-pe.matchpoint.com.es", "@igmapadel"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "One Padel - Manuel Olguín", cancha: "Cancha 2", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51959881552", direccion: "Av. Manuel Olguín 245, Santiago de Surco", distrito: "Santiago de Surco", redes: ["onepadel-pe.matchpoint.com.es", "@onepadelperu"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Más+ Padel Perú", cancha: "Cancha Panorámica", dias: "Lunes a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51940123456", direccion: "Av. La Marina cdra. 25, San Miguel", distrito: "San Miguel", redes: ["maspadelperu.com", "@maspadelperu"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Eureka Sports - El Polo", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51982405663", direccion: "Jr. El Cortijo esq. Av. El Derby y Jr. El Polo, Santiago de Surco", distrito: "Santiago de Surco", redes: ["eurekasports.pe", "@eurekasportspe"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Cortijo Terraza Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "51981123789", direccion: "Jr. Ernesto López Mindreau 132, Santiago de Surco", distrito: "Santiago de Surco", redes: ["@cortijoterrazaclub"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Club Pádel Lima (La Once)", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51987727200", direccion: "Av. Tomás Marsano 630 - A, Surquillo", distrito: "Surquillo", redes: ["laonce.com.pe", "@clubpadellima"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Bohemia Pádel Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51975613680", direccion: "Av. San Borja Sur 1228, San Borja", distrito: "San Borja", redes: ["@bohemiapadelclub"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Top Padel La Molina", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:59", estado: "Habilitada", telefono: "51940513952", direccion: "Av. Melgarejo 147, La Molina", distrito: "La Molina", redes: ["toppadel-pe.matchpoint.com.es", "@toppadelperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Peru Padel Center - Benavides", cancha: "Cancha 1 (Indoor)", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51957033544", direccion: "Av. Alfredo Benavides 347 (Expocentro), Miraflores", distrito: "Miraflores", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club adidas X3", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51913861726", direccion: "Av. Paseo de la República 5840, Miraflores", distrito: "Miraflores", redes: ["@clubadidasx3"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "One Padel - El Trigal", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51921633793", direccion: "Ca. Los Antares 298, Santiago de Surco", distrito: "Santiago de Surco", redes: ["onepadel-pe.matchpoint.com.es", "@onepadelperu"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "One Padel - Domingo Orué", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:30", estado: "Habilitada", telefono: "51916994252", direccion: "Pje. Recabarraca s/n, Surquillo", distrito: "Surquillo", redes: ["onepadel-pe.matchpoint.com.es", "@onepadelperu"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Padel Arena", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51994123890", direccion: "Santiago de Surco, Lima", distrito: "Santiago de Surco", redes: ["@padelarenaperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Pro Padel Peru", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51981456789", direccion: "Jr. Bolognesi 498, Magdalena del Mar", distrito: "Magdalena del Mar", redes: ["propadel.pe", "@propadelperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Lima Cricket & Football Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:30", estado: "Habilitada", telefono: "51970812345", direccion: "Ca. Justo Vigil 200, Magdalena del Mar", distrito: "Magdalena del Mar", redes: ["clublimacricket.com", "@limacricket1859"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "XPadel Lawn Tennis", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:30", estado: "Habilitada", telefono: "51984567890", direccion: "Av. República de Chile 254, Jesús María", distrito: "Jesús María", redes: ["clublawntennis.pe", "@xpadelperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Country Club La Planicie", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "51998765432", direccion: "Av. Las Bellotas 340, La Planicie, La Molina", distrito: "La Molina", redes: ["cclaplanicie.org", "@cclaplanicie"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Mad Padel Indoor", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51922456789", direccion: "Límite Surco - Barranco, Lima", distrito: "Surco / Barranco", redes: ["madpadel.pe", "@madpadelpe"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Centro Español del Perú", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:30", estado: "Habilitada", telefono: "51948231172", direccion: "Av. Gral. Felipe Salaverry 1910, Jesús María", distrito: "Jesús María", redes: ["centroespanolperu.pe", "@centroespanolperu"], tarifa: "S/ 90 - S/ 120 / hr" },
  { nombre: "Peru Padel Center - Villa", cancha: "Cancha 1 (Panorámica)", dias: "Lunes a Domingo", horario: "06:00 - 22:30", estado: "Habilitada", telefono: "51934377679", direccion: "Av. Alameda del Premio Real Mz. D-01 Lt. 07, Chorrillos", distrito: "Chorrillos", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club Tennis Las Terrazas Miraflores", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:30", estado: "Habilitada", telefono: "51981234567", direccion: "Malecón 28 de Julio 390, Miraflores", distrito: "Miraflores", redes: ["clubterrazas.com.pe", "@clubterrazas"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Jockey Club del Perú", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "51946789123", direccion: "Av. El Derby s/n, Santiago de Surco", distrito: "Santiago de Surco", redes: ["jockeyclub.com.pe", "@jockeyclubperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "PPA Sports - Magdalena", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51982765432", direccion: "Jr. Diego Ferré 240, Magdalena del Mar", distrito: "Magdalena del Mar", redes: ["ppasports.pe", "@ppasportsperu"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Club de Regatas \"Lima\" - Filial Villa Deportiva", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:00", estado: "Habilitada", telefono: "51977123456", direccion: "Carretera Panamericana Sur Km 20.4, Chorrillos", distrito: "Chorrillos", redes: ["clubregatas.org.pe", "@clubderegataslima"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Rinconada Country Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:00", estado: "Habilitada", telefono: "51983210987", direccion: "Av. Manuel Prado Ugarteche 901, La Molina", distrito: "La Molina", redes: ["rinconadacountryclub.org.pe", "@rinconadacc"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Real Club de Lima", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:30", estado: "Habilitada", telefono: "51991345678", direccion: "Av. Los Eucaliptos 500, San Isidro", distrito: "San Isidro", redes: ["realclubdelima.org.pe", "@realclubdelima"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Peru Padel Center - Asia", cancha: "Cancha 1 (Verano / Panorámica)", dias: "Jueves a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51934377679", direccion: "Km 97.5 Panamericana Sur, Boulevard de Asia", distrito: "Asia", redes: [{ label: "perupadelcenter.com", url: "http://www.perupadelcenter.com/" }, "@perupadelcenter"], tarifa: "S/ 110 - S/ 150 / hr" },
  { nombre: "Inka Padel - JBM Complex", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51985678901", direccion: "Av. Los Héroes 780, San Juan de Miraflores", distrito: "San Juan de Miraflores", redes: ["inkapadel.pe", "@inkapadelperu"], tarifa: "S/ 80 - S/ 110 / hr" },
  { nombre: "Eureka Sports - San Borja", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:30 - 22:30", estado: "Habilitada", telefono: "51982405663", direccion: "Av. Del Aire 150, San Borja", distrito: "San Borja", redes: ["eurekasports.pe", "@eurekasportspe"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Mad Padel - La Molina", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 23:00", estado: "Habilitada", telefono: "51950303330", direccion: "La Molina, Lima", distrito: "La Molina", redes: ["madpadel.pe", "@madpadelpe"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Club Petroperú", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "07:00 - 22:00", estado: "Habilitada", telefono: "5114344578", direccion: "Av. Club Golf Los Incas 320, Santiago de Surco", distrito: "Santiago de Surco", redes: ["clubpetroperu.com.pe", "@clubpetroperu"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Club Náutico Poseidón", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "08:00 - 20:00", estado: "Habilitada", telefono: "5113187381", direccion: "Bahía de Pucusana, Km 57 Panamericana Sur, Pucusana", distrito: "Pucusana", redes: ["poseidon.pe", "@clubnauticoposeidon"], tarifa: "S/ 90 - S/ 130 / hr" },
  { nombre: "Playa Palabritas", cancha: "Cancha 1", dias: "Jueves a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51981234567", direccion: "Km 102 Panamericana Sur, Playa Palabritas, Asia", distrito: "Asia", redes: ["palabritas.pe", "@playapalabritas"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club Deporcentro Casuarinas", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:00 - 22:00", estado: "Habilitada", telefono: "5113440119", direccion: "Jr. Tomasal 1145, Santiago de Surco", distrito: "Santiago de Surco", redes: ["deporcentrocasuarinas.pe", "@clubcasuarinas"], tarifa: "S/ 80 - S/ 120 / hr" },
  { nombre: "Lima Golf Club", cancha: "Cancha 1", dias: "Lunes a Domingo", horario: "06:30 - 22:00", estado: "Habilitada", telefono: "5112777090", direccion: "Av. Camino Real 770, San Isidro", distrito: "San Isidro", redes: ["limagolfclub.org.pe", "@limagolfclub"], tarifa: "S/ 100 - S/ 140 / hr" },
  { nombre: "Club Playa del Sol", cancha: "Cancha 1 (Verano)", dias: "Jueves a Domingo", horario: "07:00 - 23:00", estado: "Habilitada", telefono: "51981765432", direccion: "Km 97.5 Panamericana Sur, Asia", distrito: "Asia", redes: ["playadelsol.pe", "@clubplayadelsol"], tarifa: "S/ 100 - S/ 140 / hr" }
];

export const CANCHAS = CRUDO.map((c) => ({
  ...c,
  id: slug(c.nombre),
  redesLinks: redesA(c.redes)
}));

export const DISTRITOS = Array.from(new Set(CANCHAS.map((c) => c.distrito))).sort((a, b) => a.localeCompare(b, "es"));
