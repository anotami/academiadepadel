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

// Páginas de clases (/clases/<slug>/). Todo el contenido sale de lo ya publicado en la home (programas, método, políticas y preguntas);
// no se copian precios (se enlaza a la sección de tarifas) y no se inventan plazos, resultados ni testimonios.
const FAQ_REGISTRO = ["¿Cómo reservo mi clase de prueba?", "Escribinos por WhatsApp indicando el programa de interés y te confirmamos horario disponible. Coordinamos el día y la hora con vos, según la disponibilidad de la pista."];
const FAQ_CANCELAR = ["¿Puedo reprogramar o cancelar una clase?", "Sí, sin problema, avisando con al menos 24 horas de anticipación por WhatsApp. Con menos aviso, o si faltás sin avisar, la clase se considera dictada: la pista ya quedó reservada y prepagada para ese horario."];
const FAQ_LLEVAR = ["¿Qué tengo que llevar a la primera clase?", "Ropa deportiva y zapatillas cómodas. Si no tenés pala, coordinamos el préstamo de equipo para tu clase de prueba: te prestamos pala y pelotas sin costo extra durante tus primeras clases."];
const FAQ_GRUPO = ["¿Qué pasa si no se llena el grupo?", "Las clases grupales se confirman y arrancan con un mínimo de 2 alumnos. La tarifa por clase se mantiene exactamente igual: no cobramos recargos por ser 2."];

export const CLASES = [
  { slug: "inicial", nombre: "Inicial", eyebrow: "Nivel inicial", test: true,
    titulo: "Clases de pádel para principiantes en Lima", h1: "Clases de pádel para principiantes en Lima",
    descripcion: "Clases de pádel para principiantes en Lima, nivel inicial: empuñadura, golpes básicos y reglas, en grupos reducidos y sin presión de competir.",
    lead: "Si nunca jugaste al pádel, empezás acá. Aprendés lo esencial en grupos reducidos, a tu ritmo y sin presión de competir.",
    wa: "Hola, quiero reservar una clase de prueba de nivel inicial",
    paraQuien: ["Si nunca agarraste una pala de pádel.", "Si jugaste algunas veces pero querés aprender bien desde el principio.", "Si sos adolescente o adulto y no tenés ninguna exigencia de nivel previo."],
    trabajas: ["Empuñadura y golpes básicos.", "Ubicación en la pista.", "Las reglas esenciales del juego."],
    formato: ["Grupos de 2 a 4 alumnos del mismo nivel, o clases personales 1 a 1.", "Te evaluamos y te asignamos con alumnos afines: no necesitás venir con pareja ni armar tu grupo.", "Pala incluida en tu clase de prueba."],
    horario: "Horario a convenir: coordinamos el día y la hora con vos por WhatsApp, según la disponibilidad de la pista.",
    pasos: ["Contanos tu nivel (podés hacer el test de 30 segundos).", "Elegí pista y horario.", "Confirmás por WhatsApp. Si tu nivel real es otro, lo ajustamos en tu primera clase."],
    faq: [["¿Necesito experiencia previa?", "No. La mayoría de nuestros alumnos, tanto adolescentes como adultos, empieza desde cero. El nivel inicial está diseñado para eso."], FAQ_LLEVAR, FAQ_REGISTRO, FAQ_GRUPO],
    relacionados: [["../../test.html", "Test de nivel de 30 segundos"], ["../../equipamiento-padel.html", "Qué equipamiento necesitás para empezar"], ["../../beneficios-del-padel.html", "Beneficios del pádel"], ["../intermedio/", "Siguiente paso: nivel intermedio"]] },
  { slug: "intermedio", nombre: "Intermedio", eyebrow: "Nivel intermedio", test: true,
    titulo: "Clases de pádel nivel intermedio en Lima", h1: "Clases de pádel de nivel intermedio en Lima",
    descripcion: "Clases de pádel de nivel intermedio en Lima: golpes de pared, volea, bandeja y construcción de puntos con tu pareja, en grupos reducidos.",
    lead: "Si ya manejás los golpes básicos y querés jugar mejor, acá trabajás la pared, la volea, la bandeja y cómo construir los puntos en pareja.",
    wa: "Hola, quiero reservar una clase de prueba de nivel intermedio",
    paraQuien: ["Si ya tenés base de golpes y jugás o querés jugar dobles recreativos.", "Si querés pasar de pelotear a construir puntos con tu compañero.", "Si no estás seguro de tu nivel: lo ajustamos juntos en tu primera clase."],
    trabajas: ["Golpes de pared, volea y bandeja.", "Construcción de puntos con la pareja.", "Después, en la etapa de consolidación: táctica de dobles, remate y consistencia para jugar partidos recreativos con soltura."],
    formato: ["Grupos de 2 a 4 alumnos del mismo nivel, o clases personales 1 a 1.", "Seguimiento por niveles, con objetivos claros en cada etapa.", "También podés sumar las Clínicas de Un Solo Golpe: una sesión monográfica para resolver una cosa puntual (la bandeja, la salida de pared, la volea o el saque)."],
    horario: "Horario a convenir: coordinamos el día y la hora con vos por WhatsApp, según la disponibilidad de la pista.",
    pasos: ["Contanos tu nivel (podés hacer el test de 30 segundos).", "Elegí pista y horario.", "Confirmás por WhatsApp."],
    faq: [["¿Cómo sé si mi nivel es intermedio?", "Si ya tenés base de golpes y jugás dobles recreativos, probablemente sí. Podés hacer el test de nivel de 30 segundos, y en tu primera clase ajustamos tu nivel real."], FAQ_REGISTRO, FAQ_CANCELAR, FAQ_GRUPO],
    relacionados: [["../../test.html", "Test de nivel de 30 segundos"], ["../../ejercicios-padel.html", "Banco de ejercicios por nivel"], ["../../index.html#clinicas", "Clínicas de Un Solo Golpe"], ["../particulares/", "Clases particulares"]] },
  { slug: "particulares", nombre: "Clases particulares", eyebrow: "Clases 1 a 1", test: false,
    titulo: "Clases particulares de pádel en Lima", h1: "Clases particulares de pádel en Lima",
    descripcion: "Clases particulares de pádel en Lima, 1 a 1: entrenamiento personalizado para corregir tu técnica, con el horario a tu medida.",
    lead: "Entrenamiento personalizado, enfocado al 100% en tu técnica, tu biomecánica y la corrección de vicios de juego.",
    wa: "Hola, quiero consultar por clases particulares de pádel",
    paraQuien: ["Si querés acelerar un golpe o corregir un vicio puntual.", "Si preferís un horario 100% a tu medida, sin esperar a nadie.", "Si querés corrección individual de principio a fin."],
    trabajas: ["Tu técnica y tu biomecánica.", "La corrección de vicios de juego.", "El golpe o el aspecto que vos elijas."],
    formato: ["Clases 1 a 1, con el profesor enfocado solo en vos.", "Horario a tu medida.", "Hay paquetes particulares con descuento de lunes a viernes de 6:00 a 17:00. Para horarios nocturnos o fines de semana, consultá disponibilidad."],
    horario: "Coordinamos el día y la hora con vos por WhatsApp, según la disponibilidad de la pista.",
    pasos: ["Escribinos y contanos qué querés mejorar.", "Consultá disponibilidad de horarios particulares.", "Confirmás por WhatsApp."],
    faq: [["¿Qué diferencia hay con una clase grupal?", "En la clase particular el profesor se dedica solo a vos, con corrección individual de principio a fin y el horario a tu medida. Las clases grupales son de 2 a 4 alumnos."], FAQ_REGISTRO, FAQ_CANCELAR, FAQ_LLEVAR],
    relacionados: [["../../index.html#precios", "Planes y tarifas"], ["../inicial/", "Clases para principiantes"], ["../intermedio/", "Clases de nivel intermedio"], ["../../ejercicios-padel.html", "Banco de ejercicios"]] },
  { slug: "mujeres", nombre: "Mujeres", eyebrow: "Adultos · Mujeres y ejecutivos", test: false,
    titulo: "Clases de pádel para mujeres en Lima", h1: "Clases de pádel para mujeres en Lima",
    descripcion: "Clases de pádel para mujeres en Lima: turnos solo mujeres o mixtos, a tu ritmo y sin exigencia de nivel previo. Reservá tu clase de prueba.",
    lead: "Aprendé desde cero o retomá la técnica en un ritmo compatible con tu agenda. Una forma de socializar, hacer ejercicio y desconectar del trabajo.",
    wa: "Hola, quiero reservar una clase de prueba de pádel para mujeres",
    paraQuien: ["Si querés empezar a jugar o retomar el pádel.", "Si preferís entrenar en un grupo solo de mujeres, o en un grupo mixto: elegís vos.", "Si no tenés ninguna experiencia: no hace falta nivel previo."],
    trabajas: ["Foco en técnica, táctica básica y juego.", "Un ritmo que se adapta a tu agenda semanal."],
    formato: ["Dentro del programa de Adultos ofrecemos turnos exclusivos para mujeres, además de turnos mixtos.", "Turnos de tarde o noche entre semana, según preferencia.", "Grupos de 2 a 4 alumnos, o clases personales 1 a 1."],
    horario: "Horario a convenir (mañana, almuerzo o noche): coordinamos con vos por WhatsApp.",
    pasos: ["Escribinos y contanos si preferís turno solo mujeres o mixto.", "Elegí pista y horario.", "Confirmás por WhatsApp."],
    faq: [["¿Tienen clases solo para mujeres?", "Sí. Dentro del programa de Adultos ofrecemos turnos exclusivos para mujeres, además de turnos mixtos y horarios para ejecutivos."], ["¿Necesito experiencia previa?", "No. Podés empezar desde cero: el programa no pide nivel previo."], FAQ_LLEVAR, FAQ_REGISTRO],
    relacionados: [["../inicial/", "Nivel inicial"], ["../../test.html", "Test de nivel de 30 segundos"], ["../../equipamiento-padel.html", "Equipamiento para empezar"], ["../../beneficios-del-padel.html", "Beneficios del pádel"]] },
  { slug: "ninos", nombre: "Niños y adolescentes", eyebrow: "Programa Junior · 8 a 15 años", test: false,
    titulo: "Clases de pádel para niños en Lima", h1: "Clases de pádel para niños y adolescentes en Lima",
    descripcion: "Clases de pádel para niños y adolescentes de 8 a 15 años en Lima: enfoque lúdico, grupos por nivel y un entorno supervisado y seguro.",
    lead: "Clases pensadas para el desarrollo motriz, la coordinación y el trabajo en equipo, con enfoque lúdico y disciplina básica de pista.",
    wa: "Hola, quiero consultar por clases de pádel para mi hijo/a",
    paraQuien: ["Si tu hijo o hija tiene entre 8 y 15 años.", "Si nunca jugó: no hace falta haber jugado antes.", "Si buscás un entorno supervisado y seguro para que aprenda."],
    trabajas: ["Fundamentos técnicos y juego dirigido.", "Coordinación y desarrollo motriz.", "Trabajo en equipo."],
    formato: ["Agrupamos por nivel de manejo de la pala, no por edad exacta: cada chico avanza a su ritmo.", "Entorno supervisado y seguro.", "Pala incluida en la clase de prueba."],
    horario: "Horario a convenir (después del colegio o los sábados): coordinamos el bloque exacto con vos por WhatsApp. Consultá horarios y cupos.",
    pasos: ["Escribinos contándonos la edad y si ya jugó.", "Elegí pista y horario.", "Confirmás por WhatsApp."],
    faq: [["¿Mi hijo o hija puede empezar sin haber jugado nunca?", "Sí. El programa Junior agrupa por nivel de manejo de la pala, no por edad exacta, así que cada chico avanza a su ritmo."], FAQ_LLEVAR, FAQ_REGISTRO, FAQ_CANCELAR],
    relacionados: [["../inicial/", "Nivel inicial"], ["../../beneficios-del-padel.html", "Beneficios del pádel"], ["../../equipamiento-padel.html", "Equipamiento para empezar"], ["../../index.html#programas", "Todos los programas"]] }
];
