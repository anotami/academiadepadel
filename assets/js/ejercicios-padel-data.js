// Banco de ejercicios de clase, basado en el manual de entrenador de
// academiadepadel.pe (progresiones de golpes, tablas de corrección de
// errores y estructura de clases individuales/grupales) y en 5 guías
// descargables de PadelStar aportadas por la academia como fuente adicional:
//   - Guía 2: Tipos de empuñaduras y posicionamiento táctico en defensa y ataque
//   - Guía 3: Saque, resto y golpes fundamentales (técnicas y tácticas)
//   - Guía 4: El remate de pádel
//   - Guía 5: Consejos para monitores y entrenadores
//   - Guía 6: Consejos para clases con niños
// El contenido de esas guías se usa como referencia técnica, reescrito en
// nuestras propias palabras (no copiado), para dar más precisión a los
// ejercicios y para la sección de Consejos de metodología. Las fotos siguen
// siendo únicamente las propias de la academia.
//
// Cada ejercicio indica: modalidad (individual/grupal), nivel (iniciacion/
// intermedio/consolidacion), tema, objetivo, duración orientativa, pasos y
// la fuente de la que viene (o la base conceptual, cuando es una
// adaptación a formato de clase de la academia).

export const MODALIDADES = [
  { id: "individual", nombre: "Clase individual (1 alumno)", icono: "🧍" },
  { id: "grupal", nombre: "Clase grupal (hasta 4 alumnos)", icono: "👥" }
];

export const NIVELES = [
  { id: "iniciacion", nombre: "Iniciación", numero: 1 },
  { id: "intermedio", nombre: "Intermedio", numero: 2 },
  { id: "consolidacion", nombre: "Consolidación", numero: 3 }
];

// Estructura base de cada tipo de clase (tal como la define el manual).
export const PLANES = [
  {
    modalidad: "individual",
    titulo: "Así se arma una clase individual de 1 hora",
    bloques: [
      { tiempo: "5-10 min", actividad: "Entrada en calor" },
      { tiempo: "10 min", actividad: "Peloteo con control de bola de fondo" },
      { tiempo: "25 min", actividad: "Canastos con desplazamientos de un golpe específico" },
      { tiempo: "15 min", actividad: "Situación de juego de acuerdo al golpe trabajado" }
    ],
    fuente: "Manual de entrenador, p.28 (Tipos de clases — Individual)"
  },
  {
    modalidad: "grupal",
    titulo: "Así se arma una clase grupal de 1 hora 30",
    bloques: [
      { tiempo: "5-10 min", actividad: "Entrada en calor" },
      { tiempo: "20 min", actividad: "Físico-técnico con golpe (ej. golpes de ataque, desplazamiento de volea y bandeja)" },
      { tiempo: "10 min", actividad: "Peloteo intenso todo por abajo" },
      { tiempo: "20 min", actividad: "Ejercicio de competencia con tácticas sin definición (ej. defensa con solo 2 globos por punto)" }
    ],
    fuente: "Manual de entrenador, p.29 (Tipos de clases — Tres o más jugadores)"
  }
];

// Consejos de metodología para quien da la clase, basados en las guías de
// PadelStar aportadas por la academia (ver cabecera del archivo).
export const CONSEJOS = [
  {
    titulo: "Muestra antes de explicar",
    texto: "La mayoría de lo que se aprende en pádel viene de ver la demostración, no de escuchar la explicación. Haz tú el gesto (o pide a otro alumno que lo haga) antes de dar la consigna larga.",
    fuente: "Guía 6, p.7 (PadelStar)"
  },
  {
    titulo: "Pelota más grande cuanto más chico el alumno",
    texto: "Con niños de iniciación conviene empezar con globos o pelotas de playa antes de pasar a la pelota de pádel estándar, para que puedan controlar el golpeo desde el primer día.",
    fuente: "Guía 6, p.10 (PadelStar)"
  },
  {
    titulo: "Un armado corto da control; uno amplio da potencia",
    texto: "Si el alumno falla por pegarle tarde o sin control, pide un armado más corto. Si ya domina el golpe y busca más potencia (por ejemplo en la salida de pared o el remate), recién ahí sugiere un armado más amplio.",
    fuente: "Guía 3, p.6 (PadelStar)"
  },
  {
    titulo: "Corrige un solo error a la vez",
    texto: "Elige el error más importante de cada alumno y trabaja solo ese durante la sesión. Corregir varias cosas a la vez satura al alumno y no mejora ninguna.",
    fuente: "Guía 5, p.31 (PadelStar)"
  },
  {
    titulo: "Evita la \"zona pantano\"",
    texto: "A mitad de camino entre la red y la línea de saque (ni volea ni defensa) es la peor zona para quedarse parado: desde ahí no se vuelea cómodo ni se defiende bien. Si un alumno queda ahí seguido, es la primera corrección posicional a hacer.",
    fuente: "Guía 2, p.25 (PadelStar)"
  }
];

// ---------------- Plantillas de diagrama ----------------
// Cada ejercicio referencia una plantilla (tipo) + parámetros livianos
// (lado, jugadores) en vez de coordenadas a mano por ejercicio.
// El renderer vive en ejercicios-padel.js.

export const EJERCICIOS = [
  // ============ INDIVIDUAL · INICIACIÓN ============
  {
    id: 1, modalidad: "individual", nivel: "iniciacion", tema: "Empuñadura",
    titulo: "Dale la mano a tu pala",
    objetivo: "Fijar la empuñadura continental, la base de todos los golpes.",
    duracion: "5 min",
    pasos: [
      "El alumno sostiene la pala \"dando la mano\" al mango, buscando que el vértice entre el pulgar y el índice quede en el centro del mango.",
      "El profesor verifica visualmente la toma.",
      "Corrección si hace falta: marcar el grip con una lapicera para que el alumno sienta la posición correcta."
    ],
    fuente: "Manual de entrenador, p.4-5 (Empuñadura) y p.23 (Corrección de errores: Drive)",
    diagrama: { tipo: "estatico", labelA: "A" },
    foto: { src: "assets/img/court/grip-detail.jpg", alt: "Primer plano de la empuñadura de una pala de pádel" },
    material: "Lapicera o marcador (opcional)",
    varianteFacil: "Deja que el alumno mire su propia mano mientras arma el grip, sin pala, para sentir primero el vértice pulgar-índice.",
    varianteDificil: "Pide el cambio de grip entre continental y lateral (cerrado/abierto) con los ojos cerrados, solo por tacto.",
    errorFrecuente: "El alumno agarra el mango como un martillo (grip de tenis), con la palma plana contra la cara de la pala — así el golpe sale cerrado y sin control.",
    correccion: "Vuelve a \"dar la mano\" al mango despacio, verificando que el pulgar quede ligeramente por detrás, no al costado.",
    preguntaCierre: "¿En qué parte de la mano sientes el vértice del mango?"
  },
  {
    id: 2, modalidad: "individual", nivel: "iniciacion", tema: "Drive",
    titulo: "Derecha: frenar y empujar",
    objetivo: "Primer contacto con el golpe de derecha, sin pensar aún en potencia.",
    duracion: "8 min",
    pasos: [
      "El alumno se para de frente, en el medio de la cancha.",
      "El profesor le arroja la pelota con la mano hacia su derecha, para que la frene delante del cuerpo luego del pique en el suelo.",
      "Una vez puede frenarla con comodidad, se le pide que la impacte y la empuje bien hacia adelante."
    ],
    fuente: "Manual de entrenador, p.10 (Drive, progresión, pasos 1-2)",
    diagrama: { tipo: "feed", lado: "derecha" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" },
    material: "Pelotas (sin cesto)",
    varianteFacil: "El profesor deja picar la pelota más cerca del alumno, reduciendo el tiempo de reacción necesario.",
    varianteDificil: "El profesor varía la altura del pique (más alto o más bajo) para que el alumno ajuste la preparación en cada bola.",
    errorFrecuente: "El alumno golpea con el brazo estirado desde el hombro, sin flexionar el codo al preparar — la pelota sale sin control de dirección.",
    correccion: "Marca con la mano libre dónde debe \"armar\" antes de empujar: codo cerca del cuerpo, pala atrás a la altura de la cadera.",
    preguntaCierre: "¿Sentiste más control cuando frenaste primero o cuando pegaste directo?"
  },
  {
    id: 3, modalidad: "individual", nivel: "iniciacion", tema: "Revés",
    titulo: "Revés: frenar y empujar",
    objetivo: "Primer contacto con el golpe de revés (espejo de la derecha).",
    duracion: "8 min",
    pasos: [
      "El alumno se para de frente, en el medio de la cancha.",
      "El profesor le arroja la pelota hacia su izquierda para que la frene delante del cuerpo luego del pique.",
      "Cuando la frena con comodidad, se le pide que impacte y empuje hacia adelante."
    ],
    fuente: "Manual de entrenador, p.12 (Revés, progresión, pasos 1-2)",
    diagrama: { tipo: "feed", lado: "izquierda" },
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" },
    material: "Pelotas (sin cesto)",
    varianteFacil: "El profesor arroja la pelota más despacio y más cerca del cuerpo del alumno.",
    varianteDificil: "Se agrega un paso lateral antes del golpe, para que el alumno ya no esté parado de frente.",
    errorFrecuente: "El alumno gira solo el brazo y no los hombros, por lo que el golpe sale sin potencia ni dirección.",
    correccion: "Pide que gire el hombro no dominante hacia la pelota antes de golpear, como si fuera a mostrar la espalda al profesor.",
    preguntaCierre: "¿Qué parte del cuerpo giraste primero: el hombro o el brazo?"
  },
  {
    id: 4, modalidad: "individual", nivel: "iniciacion", tema: "Globo",
    titulo: "Globo con la mano",
    objetivo: "Sentir el gesto ascendente del globo antes de usar la pala.",
    duracion: "6 min",
    pasos: [
      "El alumno lanza la pelota con la mano, de abajo hacia arriba, para familiarizarse con el movimiento.",
      "Repite el lanzamiento comenzando de costado y acompañándose con las piernas."
    ],
    fuente: "Manual de entrenador, p.13 (Globo, progresión, pasos 1-2)",
    diagrama: { tipo: "feed", lado: "centro" },
    foto: { src: "assets/img/gabriel/gabriel-3.jpg", alt: "Jugador de la academia en posición de espera con la pala" },
    material: "Pelotas",
    varianteFacil: "El alumno practica el lanzamiento parado, sin desplazamiento.",
    varianteDificil: "Se agrega un desplazamiento hacia atrás antes de lanzar, simulando que retrocede para un globo.",
    errorFrecuente: "El alumno lanza la pelota con trayectoria plana en vez de alta, porque el brazo no termina el movimiento hacia arriba.",
    correccion: "Pide que \"apunte\" con la mano hacia el techo al final del lanzamiento, no hacia adelante.",
    preguntaCierre: "¿Hacia dónde terminó apuntando tu mano al final del lanzamiento?"
  },
  {
    id: 5, modalidad: "individual", nivel: "iniciacion", tema: "Saque",
    titulo: "Saque: fijar el punto de impacto",
    objetivo: "Aprender la posición de armado del saque, sin preocuparse aún por la potencia.",
    duracion: "6 min",
    pasos: [
      "El alumno se coloca de lado, con la cara de la pala por encima de la pelota, piernas separadas al ancho de los hombros.",
      "Suelta la pelota con la mano libre y practica encontrar el punto de impacto antes de golpear con intención.",
      "Se recuerda la regla: el golpe debe darse a la altura de la cintura o por debajo, con al menos un pie en el suelo."
    ],
    fuente: "Manual de entrenador, p.19-20 (El saque, armado) + Guía 3 de PadelStar, p.9 (Reglas de saque y resto)",
    diagrama: { tipo: "saque" },
    foto: { src: "assets/img/court/paddles-court.jpg", alt: "Palas de pádel y pelotas sobre la cancha" },
    material: "Pelotas",
    varianteFacil: "El alumno practica solo el armado y la caída de la pelota, sin golpear todavía.",
    varianteDificil: "Se exige sacar apuntando a un cono colocado en un cuadrante específico del campo contrario.",
    errorFrecuente: "El alumno deja caer la pelota muy lejos del cuerpo o demasiado alta, perdiendo el punto de impacto antes de golpear.",
    correccion: "Pide que suelte la pelota cerca del pie de atrás y la deje picar sin moverse, antes de recién ahí golpear.",
    preguntaCierre: "¿La pelota picó cerca de tu pie o se alejó?"
  },
  {
    id: 6, modalidad: "individual", nivel: "iniciacion", tema: "Desplazamientos",
    titulo: "Circuito de desplazamiento básico",
    objetivo: "Mecanizar los 3 movimientos base de cualquier golpe: acercarse, frenar y preparar.",
    duracion: "7 min",
    pasos: [
      "Con conos marcando 3 puntos de la cancha, el alumno se desplaza hacia cada cono.",
      "Debe frenar antes de llegar (paso de ajuste) y recién ahí preparar el golpe, como si fuera a pegar.",
      "Se repite el circuito 3 veces para automatizar la secuencia completa."
    ],
    fuente: "Manual de entrenador, p.8 (¿Cómo grabar la técnica de los desplazamientos?)",
    diagrama: { tipo: "circuito" },
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" },
    material: "3 conos",
    varianteFacil: "Se reduce a 2 conos y se aumenta el tiempo de descanso entre repeticiones.",
    varianteDificil: "El profesor indica el cono al que debe ir recién cuando el alumno ya está en movimiento, obligándolo a reaccionar.",
    errorFrecuente: "El alumno llega corriendo hasta el cono y recién ahí frena de golpe, llegando descontrolado al golpe.",
    correccion: "Marca el último paso como \"paso de ajuste\" corto, antes de llegar al cono — frenar antes de llegar, no al llegar.",
    preguntaCierre: "¿En qué cono te costó más frenar a tiempo?"
  },

  // ============ INDIVIDUAL · INTERMEDIO ============
  {
    id: 7, modalidad: "individual", nivel: "intermedio", tema: "Drive",
    titulo: "Drive con desplazamiento lateral",
    objetivo: "Pasar de golpear parado a golpear desplazándose.",
    duracion: "8 min",
    pasos: [
      "El profesor juega la pelota hacia un lado para que el alumno dé pasitos cortos de ajuste y golpee.",
      "Se aumenta progresivamente la distancia del desplazamiento."
    ],
    fuente: "Manual de entrenador, p.10 (Drive, progresión, paso 4)",
    diagrama: { tipo: "feedMove", lado: "derecha" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" },
    material: "Pelotas",
    varianteFacil: "Se reduce la distancia del desplazamiento lateral a 1-2 pasos.",
    varianteDificil: "El profesor juega la pelota variando la distancia en cada repetición, sin patrón fijo.",
    errorFrecuente: "El alumno llega al golpe sin terminar de frenar, por lo que el impacto sale apurado y sin equilibrio.",
    correccion: "Recuerda la secuencia completa: desplazarse, frenar, armar, recién ahí golpear — no saltear el paso de frenado.",
    preguntaCierre: "¿Llegaste a tiempo a frenar antes de golpear, o golpeaste en movimiento?"
  },
  {
    id: 8, modalidad: "individual", nivel: "intermedio", tema: "Revés",
    titulo: "Revés con desplazamiento lateral",
    objetivo: "Consolidar el revés jugándolo en movimiento.",
    duracion: "8 min",
    pasos: [
      "El profesor juega la pelota hacia la izquierda para que el alumno se desplace con pasos cortos y golpee.",
      "Se aumenta progresivamente la distancia del desplazamiento."
    ],
    fuente: "Manual de entrenador, p.12 (Revés, progresión, paso 4)",
    diagrama: { tipo: "feedMove", lado: "izquierda" },
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" },
    material: "Pelotas",
    varianteFacil: "Se reduce la distancia del desplazamiento.",
    varianteDificil: "Se alterna sin aviso entre pelotas a mayor y menor distancia.",
    errorFrecuente: "El alumno gira el cuerpo tarde, llegando al golpe todavía de frente en vez de perfilado.",
    correccion: "Pide que el giro de hombros empiece apenas ve hacia dónde va la pelota, no al llegar al lugar del golpe.",
    preguntaCierre: "¿Cuándo empezaste a girar el cuerpo: apenas viste la pelota o al llegar?"
  },
  {
    id: 9, modalidad: "individual", nivel: "intermedio", tema: "Salida de pared",
    titulo: "Salida de pared controlada",
    objetivo: "Golpear con seguridad después de un pique en la pared de fondo.",
    duracion: "10 min",
    pasos: [
      "El alumno se para en el fondo con la paleta apuntando hacia la pared y espera que el profesor le juegue pelotas con poco repique.",
      "Golpea hacia adelante luego de uno o dos piques en el suelo.",
      "Repite el ejercicio pero golpeando a un solo pique."
    ],
    fuente: "Manual de entrenador, p.16 (Salida de pared, progresión)",
    diagrama: { tipo: "pared" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pared de fondo",
    varianteFacil: "El profesor juega pelotas con más repique antes del pique en pared, dando más tiempo de reacción.",
    varianteDificil: "Se exige golpear a un solo pique y dirigir la pelota cruzada.",
    errorFrecuente: "El alumno golpea apenas la pelota sale de la pared, sin esperar que baje a una altura cómoda.",
    correccion: "Pide que cuente mentalmente \"uno\" después del pique en la pared antes de golpear, para no apurarse.",
    preguntaCierre: "¿A qué altura te resultó más cómodo golpear: alta o baja?"
  },
  {
    id: 10, modalidad: "individual", nivel: "intermedio", tema: "Bandeja",
    titulo: "Bandeja: frena y empuja",
    objetivo: "Introducir el gesto de bandeja a partir del globo.",
    duracion: "8 min",
    pasos: [
      "El profesor juega globos cortos; el alumno debe frenar la pelota a su derecha con la mano.",
      "Repite el movimiento, pero frenando la pelota con la paleta.",
      "Ante el mismo globo, el alumno \"frena y empuja\" la pelota hacia adelante."
    ],
    fuente: "Manual de entrenador, p.18 (Bandeja, progresión, pasos 1-3)",
    diagrama: { tipo: "red" },
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" },
    material: "Pelotas",
    varianteFacil: "Se reduce la velocidad del globo que arroja el profesor.",
    varianteDificil: "Se juega el mismo ejercicio pero con el alumno debiendo recuperar posición de espera entre cada bandeja.",
    errorFrecuente: "El alumno golpea la bandeja como si fuera un remate, con swing largo, en vez de bloquear y empujar.",
    correccion: "Recuerda que la bandeja frena la pelota con la pala casi quieta y solo empuja al final — no hay que \"pegarle fuerte\".",
    preguntaCierre: "¿La pelota salió más controlada cuando empujaste suave o cuando le pegaste fuerte?"
  },
  {
    id: 11, modalidad: "individual", nivel: "intermedio", tema: "Volea",
    titulo: "10 canastos de volea con buen apoyo",
    objetivo: "Consolidar el trabajo de pies de la volea (la \"V\" de apoyo cruzado).",
    duracion: "10 min",
    pasos: [
      "El profesor alimenta con canasto desde la red; el alumno vuelve a la posición de espera entre bola y bola.",
      "Se marca con un cono la \"V\" de apoyo que debe respetar el alumno al volear."
    ],
    fuente: "Manual de entrenador, p.13-14 (Volea de drive/revés) y p.24 (Corrección de errores: Volea)",
    diagrama: { tipo: "red" },
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" },
    material: "Cesto de pelotas, 1 cono",
    varianteFacil: "Se reduce el número de repeticiones y se aumenta el tiempo entre bola y bola.",
    varianteDificil: "Se alterna volea de derecha y revés sin patrón fijo, obligando a decidir rápido.",
    errorFrecuente: "El alumno vuelea con los pies juntos o parado, sin dar el paso de apoyo cruzado hacia la pelota.",
    correccion: "Marca con el cono dónde debe pisar: un paso cruzado en diagonal hacia la pelota antes de cada volea.",
    preguntaCierre: "¿Pisaste el cono antes de volear en la mayoría de las bolas?"
  },
  {
    id: 12, modalidad: "individual", nivel: "intermedio", tema: "Juego",
    titulo: "Situación de juego: punto al golpe trabajado",
    objetivo: "Cerrar la clase llevando el golpe entrenado a un punto real.",
    duracion: "15 min",
    pasos: [
      "Se juega un punto completo donde el primer intercambio debe incluir el golpe trabajado en la clase.",
      "El profesor da feedback inmediato después de cada punto."
    ],
    fuente: "Manual de entrenador, p.28 (clase individual, bloque \"situación de juego\")",
    diagrama: { tipo: "sparring" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "El profesor arma el primer intercambio para que el golpe trabajado salga con menos presión.",
    varianteDificil: "Se juega el punto completo a competencia real, sumando puntaje.",
    errorFrecuente: "El alumno vuelve al golpe que ya domina apenas tiene oportunidad, evitando usar el golpe nuevo trabajado en la clase.",
    correccion: "Antes de empezar el punto, recuérdale en voz alta que el primer intercambio debe salir con el golpe de la clase.",
    preguntaCierre: "¿Usaste el golpe trabajado hoy en el momento justo, o lo evitaste?"
  },

  // ============ INDIVIDUAL · CONSOLIDACIÓN ============
  {
    id: 13, modalidad: "individual", nivel: "consolidacion", tema: "Drive / Revés",
    titulo: "Movimiento completo con señal visual",
    objetivo: "Jugar el golpe leyendo la jugada, no anticipando el lado.",
    duracion: "10 min",
    pasos: [
      "El alumno parte de frente, en el fondo de la cancha.",
      "El profesor da una señal visual (con la mano) y recién ahí juega la pelota hacia un lado.",
      "El alumno lee la señal, se desplaza e impacta con el movimiento completo."
    ],
    fuente: "Manual de entrenador, p.10 y p.12 (Drive y Revés, último paso de la progresión)",
    diagrama: { tipo: "feedMove", lado: "derecha" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" },
    material: "Pelotas",
    varianteFacil: "El profesor da la señal con más anticipación, antes de jugar la pelota.",
    varianteDificil: "Se juega la pelota casi al mismo tiempo que la señal, exigiendo reacción más rápida.",
    errorFrecuente: "El alumno anticipa el lado antes de ver la señal, adivinando en vez de leer la jugada.",
    correccion: "Pide que espere con los pies quietos hasta ver la señal — moverse antes es trampa, aunque adivine bien.",
    preguntaCierre: "¿Esperaste a ver la señal antes de moverte, o saliste antes?"
  },
  {
    id: 14, modalidad: "individual", nivel: "consolidacion", tema: "Smash",
    titulo: "Smash en 3 pasos de potencia",
    objetivo: "Construir el remate de definición de forma segura y progresiva.",
    duracion: "10 min",
    pasos: [
      "De frente, agarrar la pelota con la mano en el punto más alto.",
      "De perfil, dejar picar y agarrar en el punto más alto.",
      "De perfil, hacer \"arco y flecha\" con la pala y golpear, con el brazo libre extendido hacia arriba señalando la pelota (ayuda a equilibrar el cuerpo y a calcular la distancia)."
    ],
    fuente: "Manual de entrenador, p.22 (Smash x3, progresión) + Guía 4 de PadelStar, p.9-10 (preparación y brazos en el remate)",
    diagrama: { tipo: "smash" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" },
    material: "Pelotas",
    varianteFacil: "Se trabaja solo el primer paso (agarrar de frente con la mano) hasta que esté cómodo.",
    varianteDificil: "Se juega el globo desde más lejos, exigiendo más desplazamiento antes del remate.",
    errorFrecuente: "El alumno golpea de frente a la red, sin perfilarse, perdiendo potencia y dirección.",
    correccion: "Recuerda el paso 2 de la progresión: siempre de perfil antes de golpear, nunca de frente.",
    preguntaCierre: "¿Tu brazo libre quedó apuntando hacia la pelota al momento del impacto?"
  },
  {
    id: 15, modalidad: "individual", nivel: "consolidacion", tema: "Víbora",
    titulo: "Introducción a la víbora",
    objetivo: "Primer contacto con un golpe especial de nivel alto.",
    duracion: "10 min",
    pasos: [
      "Desde el mismo lado de la cancha y de frente a la pared de fondo, el alumno lanza la pelota con la mano buscando el punto de impacto correcto.",
      "A medida que domina el gesto, el profesor se aleja y se la juega de frente con la mano."
    ],
    fuente: "Manual de entrenador, p.22-23 (La víbora, progresión)",
    diagrama: { tipo: "pared" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pared de fondo",
    varianteFacil: "El alumno practica solo el lanzamiento con la mano, sin pala, hasta encontrar el punto de impacto.",
    varianteDificil: "El profesor juega la pelota más rápido y desde más cerca de la red.",
    errorFrecuente: "El alumno espera que la pelota baje mucho antes de golpear, perdiendo el momento alto del bote que necesita la víbora.",
    correccion: "Marca el punto de impacto ideal: justo cuando la pelota todavía sube después del pique, no cuando ya está bajando.",
    preguntaCierre: "¿Golpeaste cuando la pelota subía o cuando ya bajaba?"
  },
  {
    id: 16, modalidad: "individual", nivel: "consolidacion", tema: "Defensa",
    titulo: "Control hacia el otro campo",
    objetivo: "Afinar la dirección de la defensa, no solo la continuidad.",
    duracion: "8 min",
    pasos: [
      "Sobre los ejercicios de defensa ya conocidos, se le pide al alumno buscar control de bola hacia el lado contrario de la cancha en cada repetición."
    ],
    fuente: "Manual de entrenador, p.30 (Ejercicios de enseñanza de defensa, paso 8)",
    diagrama: { tipo: "sparring" },
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" },
    material: "Pelotas",
    varianteFacil: "Se reduce la exigencia a solo cruzar la red con dirección aproximada.",
    varianteDificil: "Se pide dirigir la defensa a una zona específica marcada con un cono.",
    errorFrecuente: "El alumno defiende sin pensar en dirección, solo buscando devolver la pelota como sea.",
    correccion: "Antes de cada bola, pide que decida en voz alta hacia qué lado va a dirigir antes de golpear.",
    preguntaCierre: "¿Decidiste la dirección antes o después de golpear?"
  },
  {
    id: 17, modalidad: "individual", nivel: "consolidacion", tema: "Juego",
    titulo: "Sparring de puntos dirigidos",
    objetivo: "Simular competencia con un objetivo táctico claro.",
    duracion: "15 min",
    pasos: [
      "El profesor hace de sparring y juega puntos reales.",
      "Se pide que el alumno resuelva siempre con el mismo patrón (por ejemplo, subir a la red después de la salida de pared)."
    ],
    fuente: "Manual de entrenador, p.28 (clase individual avanzada — sparrings)",
    diagrama: { tipo: "sparring" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "Se reduce el patrón táctico a un solo paso (ej. solo subir después de la salida de pared).",
    varianteDificil: "Se suma un segundo patrón táctico encadenado al primero.",
    errorFrecuente: "El alumno resuelve el punto con lo que le sale más cómodo, en vez de seguir el patrón pedido.",
    correccion: "Detén el punto apenas se desvíe del patrón y hazlo repetir desde ese momento, no desde el inicio.",
    preguntaCierre: "¿Cuántas veces lograste completar el patrón pedido?"
  },
  {
    id: 18, modalidad: "individual", nivel: "consolidacion", tema: "Corrección",
    titulo: "Pulido fino con tabla de errores",
    objetivo: "Corregir el detalle puntual que falta para consolidar un golpe.",
    duracion: "8 min",
    pasos: [
      "El profesor elige un solo error de la tabla de corrección del golpe trabajado ese día (ej. Smash: \"golpea de frente\" → apuntar con la mano libre a la pelota).",
      "Se repite el gesto corregido hasta automatizarlo."
    ],
    fuente: "Manual de entrenador, p.23-26 (Corrección de errores por golpe)",
    diagrama: { tipo: "feed", lado: "derecha" },
    foto: { src: "assets/img/court/grip-detail.jpg", alt: "Primer plano de la empuñadura de una pala de pádel" },
    material: "Tabla de corrección de errores (referencia del profesor)",
    varianteFacil: "Se trabaja el error aislado, sin pelota en juego, solo el gesto corregido en seco.",
    varianteDificil: "Se integra el gesto corregido dentro de un punto de competencia real.",
    errorFrecuente: "El alumno corrige el gesto cuando está relajado pero vuelve al error bajo presión de un punto.",
    correccion: "Sube la exigencia gradualmente: primero en seco, luego con pelota fácil, recién al final en un punto real.",
    preguntaCierre: "¿En qué momento se te escapó el error: relajado o bajo presión?"
  },

  // ============ GRUPAL · INICIACIÓN ============
  {
    id: 19, modalidad: "grupal", nivel: "iniciacion", tema: "Drive",
    titulo: "Rotación de derecha en fila",
    objetivo: "Dar a cada uno de los 4 alumnos repeticiones de drive sin perder tiempo de clase.",
    duracion: "10 min",
    pasos: [
      "Los 4 alumnos forman una fila al fondo de la cancha.",
      "El profesor arroja la pelota a la derecha del primero, que la frena y empuja.",
      "El alumno pasa al final de la fila y sigue el siguiente."
    ],
    fuente: "Manual de entrenador, p.10 (Drive, progresión) adaptado a formato grupal",
    diagrama: { tipo: "fila" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" },
    material: "Pelotas",
    varianteFacil: "Se arrojan pelotas más lentas y más cerca del alumno en turno.",
    varianteDificil: "Se reduce el tiempo entre turno y turno para que la fila avance más rápido.",
    errorFrecuente: "Los alumnos que esperan en la fila se distraen y no prestan atención a la corrección del compañero que está golpeando.",
    correccion: "Pide a los que esperan que identifiquen en voz baja un punto a mejorar del compañero que golpea.",
    preguntaCierre: "¿Qué le viste mejorar a tu compañero mientras esperabas tu turno?"
  },
  {
    id: 20, modalidad: "grupal", nivel: "iniciacion", tema: "Revés",
    titulo: "Rotación de revés en fila",
    objetivo: "Mismo formato que la rotación de derecha, ahora de revés.",
    duracion: "10 min",
    pasos: [
      "Los 4 alumnos forman una fila al fondo de la cancha.",
      "El profesor arroja la pelota a la izquierda del primero, que la frena y empuja.",
      "El alumno pasa al final de la fila y sigue el siguiente."
    ],
    fuente: "Manual de entrenador, p.12 (Revés, progresión) adaptado a formato grupal",
    diagrama: { tipo: "fila" },
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" },
    material: "Pelotas",
    varianteFacil: "Mismo ajuste que la rotación de derecha: pelotas más lentas y cercanas.",
    varianteDificil: "Se reduce el tiempo entre turnos.",
    errorFrecuente: "Igual que en derecha: falta de atención de quien espera en la fila.",
    correccion: "Mismo recurso que en derecha: pedir que observen activamente al compañero que golpea.",
    preguntaCierre: "¿Te resultó más fácil el revés en fila que la derecha?"
  },
  {
    id: 21, modalidad: "grupal", nivel: "iniciacion", tema: "Desplazamientos",
    titulo: "Circuito de desplazamiento por parejas",
    objetivo: "Trabajar el trabajo de pies de los 4 alumnos en paralelo, sin tiempos muertos.",
    duracion: "10 min",
    pasos: [
      "Se arman 2 parejas, una en cada mitad de la cancha.",
      "Cada pareja practica el circuito de acercarse, frenar y preparar, mientras la otra descansa.",
      "Rotan cada 2 minutos."
    ],
    fuente: "Manual de entrenador, p.8 (circuito de desplazamiento), adaptado a grupo de 4",
    diagrama: { tipo: "circuitoDoble" },
    foto: { src: "assets/img/court/paddles-court.jpg", alt: "Palas de pádel y pelotas sobre la cancha" },
    material: "3 conos por pareja",
    varianteFacil: "Se reduce a 2 conos por pareja.",
    varianteDificil: "Se achica el tiempo de rotación a 1 minuto, exigiendo más repeticiones en menos tiempo.",
    errorFrecuente: "Mientras una pareja descansa, se desconcentra y no observa a la pareja activa.",
    correccion: "Asigna a la pareja que descansa la tarea de contar en voz alta las repeticiones de la otra pareja.",
    preguntaCierre: "¿Cuántas repeticiones completó tu pareja en su turno?"
  },
  {
    id: 22, modalidad: "grupal", nivel: "iniciacion", tema: "Globo",
    titulo: "Globo en parejas",
    objetivo: "Practicar el gesto de globo con feedback entre compañeros.",
    duracion: "8 min",
    pasos: [
      "En parejas, uno lanza el globo con la mano y el otro practica el armado y el empuje hacia arriba.",
      "Cambian de rol cada 5 lanzamientos."
    ],
    fuente: "Manual de entrenador, p.13 (Globo, progresión, paso 1), adaptado a parejas",
    diagrama: { tipo: "parejaRed" },
    foto: { src: "assets/img/gabriel/gabriel-3.jpg", alt: "Jugador de la academia en posición de espera con la pala" },
    material: "Pelotas",
    varianteFacil: "Se reduce la distancia entre los dos compañeros.",
    varianteDificil: "Se agrega que el que recibe debe desplazarse antes de armar el globo.",
    errorFrecuente: "El que lanza arroja la pelota muy fuerte o muy lejos, dificultando el ejercicio del compañero.",
    correccion: "Pide lanzamientos suaves y altos, priorizando que el compañero pueda practicar bien el gesto.",
    preguntaCierre: "¿Cambiaron de rol las veces que correspondía?"
  },
  {
    id: 23, modalidad: "grupal", nivel: "iniciacion", tema: "Posiciones",
    titulo: "Defensa vs. ataque: siente la posición",
    objetivo: "Diferenciar físicamente la posición de defensa y la de ataque.",
    duracion: "6 min",
    pasos: [
      "Dos alumnos se ubican en zona de defensa (un palmo detrás de la línea de saque) y dos en zona de ataque (1.5 m de la red).",
      "Rotan de zona cada 2 minutos, sintiendo el cambio de peso del cuerpo y de altura de pala.",
      "Se marca con un cono la franja intermedia entre ambas zonas (\"zona pantano\") para que la reconozcan como el lugar donde nunca deben quedarse parados."
    ],
    fuente: "Manual de entrenador, p.5 (Posiciones de juego: Defensa/Ataque) + Guía 2 de PadelStar, p.25-26 (posiciones estándar y zona pantano)",
    diagrama: { tipo: "defensaAtaque" },
    foto: { src: "assets/img/gabriel/gabriel-3.jpg", alt: "Jugador de la academia en posición de espera con la pala" },
    material: "2 conos (marcar zona pantano)",
    varianteFacil: "Se dan más de 2 minutos por rotación, para que sientan mejor cada posición.",
    varianteDificil: "Se agrega una señal sorpresa del profesor para rotar antes de tiempo, exigiendo reacción rápida.",
    errorFrecuente: "Los alumnos en zona de ataque se paran demasiado cerca de la red, perdiendo tiempo de reacción ante un remate.",
    correccion: "Marca con un segundo cono la distancia correcta de 1.5 m de la red para la posición de ataque.",
    preguntaCierre: "¿En qué posición sentiste más seguridad: ataque o defensa?"
  },
  {
    id: 24, modalidad: "grupal", nivel: "iniciacion", tema: "Juego",
    titulo: "Juego libre 2 vs 2 controlado",
    objetivo: "Cerrar la clase con el primer contacto de juego real en grupo.",
    duracion: "12 min",
    pasos: [
      "Las dos parejas pelotean de forma libre y de baja intensidad.",
      "El profesor detiene el punto para corregir solo lo más urgente de cada alumno."
    ],
    fuente: "Manual de entrenador, p.29 (estructura de clase grupal, bloque de peloteo)",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "Se juega sin puntaje, solo peloteo continuo.",
    varianteDificil: "Se suma puntaje real desde el inicio del ejercicio.",
    errorFrecuente: "Las parejas suben la intensidad demasiado rápido, perdiendo el control de bola que buscaba el ejercicio.",
    correccion: "Recuerda antes de empezar que el objetivo es continuidad, no ganar el punto — baja el ritmo si hace falta.",
    preguntaCierre: "¿Cuántos golpes seguidos lograron sin perder la pelota?"
  },

  // ============ GRUPAL · INTERMEDIO ============
  {
    id: 25, modalidad: "grupal", nivel: "intermedio", tema: "Entrada en calor",
    titulo: "Movilidad y activación en grupo",
    objetivo: "Preparar el cuerpo de los 4 alumnos antes de la parte técnica.",
    duracion: "8 min",
    pasos: [
      "Ejercicios de movilidad de miembros inferiores, tronco y miembros superiores, en círculo.",
      "Se suman ejercicios de activación de baja intensidad (sentadillas, planchas)."
    ],
    fuente: "Manual de entrenador, p.27-28 (Entrada en calor: Movilidad y Activación)",
    diagrama: { tipo: "estatico", labelA: "4" },
    foto: { src: "assets/img/gabriel/gabriel-2.jpg", alt: "Jugador de la academia con la pala, antes de empezar la clase" },
    material: "Ninguno",
    varianteFacil: "Se reduce la intensidad de la activación (sin sentadillas con salto).",
    varianteDificil: "Se suma activación específica con pala (sombra de golpes) al final del calentamiento.",
    errorFrecuente: "Los alumnos hacen los ejercicios de movilidad con rango de movimiento muy corto, sin calentar realmente la articulación.",
    correccion: "Marca el rango completo con tu propio ejemplo antes de que empiecen, y corrige en vivo al que se quede corto.",
    preguntaCierre: "¿Sentiste el cuerpo más suelto al terminar el calentamiento?"
  },
  {
    id: 26, modalidad: "grupal", nivel: "intermedio", tema: "Volea / Bandeja",
    titulo: "Circuito de volea y bandeja en parejas",
    objetivo: "Trabajar el desplazamiento específico de red en las dos parejas a la vez.",
    duracion: "20 min",
    pasos: [
      "Una pareja en cada mitad de la cancha; el profesor alimenta con canasto alternando volea y bandeja.",
      "Se exige recuperar la posición de espera entre cada bola."
    ],
    fuente: "Manual de entrenador, p.29 (clase grupal, bloque \"físico técnico con golpe\")",
    diagrama: { tipo: "redDoble" },
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" },
    material: "Cesto de pelotas",
    varianteFacil: "Se reduce a solo volea, sin alternar con bandeja, hasta que esté cómoda.",
    varianteDificil: "Se alterna volea y bandeja sin aviso previo, obligando a decidir el gesto en el aire.",
    errorFrecuente: "Los alumnos no vuelven a la posición de espera entre bola y bola, llegando tarde a la siguiente.",
    correccion: "Marca en voz alta \"posición\" después de cada golpe para recordar la recuperación.",
    preguntaCierre: "¿Volviste a la posición de espera después de cada golpe?"
  },
  {
    id: 27, modalidad: "grupal", nivel: "intermedio", tema: "Competencia",
    titulo: "Peloteo intenso todo por abajo",
    objetivo: "Forzar consistencia sin poder resolver con remates.",
    duracion: "10 min",
    pasos: [
      "Las dos parejas juegan puntos donde toda la pelota debe pasar por debajo de la altura de la red + 50 cm.",
      "Quien remata o juega alto pierde el punto."
    ],
    fuente: "Manual de entrenador, p.29 (\"peloteo intenso todo por abajo\")",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "Se baja la exigencia a \"toda la pelota por debajo de la cabeza\" en vez de la altura exacta de la red + 50cm.",
    varianteDificil: "Se suma que, además, ningún golpe puede picar antes de la línea de servicio.",
    errorFrecuente: "Las parejas rematan apenas tienen una bola cómoda, rompiendo la regla del ejercicio.",
    correccion: "El punto se pierde automáticamente si alguien remata — hazlo cumplir desde el primer punto para que no se vuelva hábito.",
    preguntaCierre: "¿Cuántos golpes seguidos lograron sin que nadie rematara?"
  },
  {
    id: 28, modalidad: "grupal", nivel: "intermedio", tema: "Táctica",
    titulo: "Defensa con dos globos máximo",
    objetivo: "Obligar a construir el punto en vez de defender solo con el globo.",
    duracion: "15 min",
    pasos: [
      "Durante el punto, la pareja en defensa solo puede elegir el globo dos veces en total.",
      "A partir del tercer globo \"obligado\", pierde el punto."
    ],
    fuente: "Manual de entrenador, p.29 (ejercicio de competencia con tácticas sin definición)",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "Se permite 3 globos en vez de 2, para bajar la presión.",
    varianteDificil: "Se reduce a 1 solo globo permitido por punto.",
    errorFrecuente: "La pareja en defensa pierde la cuenta de cuántos globos ya usó.",
    correccion: "Pide que, en voz alta, cuenten los globos usados (\"uno\", \"dos\") para hacerse responsables del límite.",
    preguntaCierre: "¿Qué hicieron para defender cuando ya no podían usar el globo?"
  },
  {
    id: 29, modalidad: "grupal", nivel: "intermedio", tema: "Táctica",
    titulo: "Contraataque de un solo pique",
    objetivo: "Entrenar el contragolpe temprano.",
    duracion: "15 min",
    pasos: [
      "Durante todo el punto, la pelota solo puede picar una vez en cada campo antes de ser devuelta.",
      "Esto obliga a adelantar el punto de impacto y jugar más de volea o bandeja."
    ],
    fuente: "Manual de entrenador, p.29 (variante — \"la bola solo puede picar una vez\")",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "Se permiten 2 piques en vez de 1, bajando la exigencia de tiempo de reacción.",
    varianteDificil: "Se juega directamente de aire (volea/bandeja obligatoria, sin ningún pique permitido).",
    errorFrecuente: "Las parejas retroceden de forma automática esperando el segundo pique, por costumbre.",
    correccion: "Recuerda antes de cada punto que la regla cambió — frenar el hábito de retroceder es el primer paso.",
    preguntaCierre: "¿Se adelantaron más de lo normal durante el ejercicio?"
  },
  {
    id: 30, modalidad: "grupal", nivel: "intermedio", tema: "Táctica",
    titulo: "Chiquita y avance en grupo",
    objetivo: "Introducir la jugada de chiquita para forzar la volea incómoda del rival.",
    duracion: "12 min",
    pasos: [
      "Las parejas juegan puntos donde se premia cada chiquita bien ejecutada que genere un error del rival."
    ],
    fuente: "Manual de entrenador, p.52 (mención de la jugada de chiquita y avance)",
    diagrama: { tipo: "redDoble" },
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" },
    material: "Pelotas",
    varianteFacil: "Se juega sin puntaje extra, solo practicando el gesto de chiquita cuando surja la oportunidad.",
    varianteDificil: "Se exige avanzar a la red inmediatamente después de cada chiquita propia.",
    errorFrecuente: "El alumno le pega a la chiquita con el mismo swing que un golpe normal, por lo que sale con demasiada velocidad y no \"muere\" cerca de la red.",
    correccion: "Pide un gesto corto, casi sin swing, solo acompañando la pelota con la pala hacia abajo y adelante.",
    preguntaCierre: "¿Tu chiquita picó dos veces antes de la línea de saque del rival?"
  },

  // ============ GRUPAL · CONSOLIDACIÓN ============
  {
    id: 31, modalidad: "grupal", nivel: "consolidacion", tema: "Táctica",
    titulo: "Teoría del centro en 2 vs 2",
    objetivo: "Jugar siempre buscando el centro de la pareja rival.",
    duracion: "15 min",
    pasos: [
      "Durante el peloteo de control de bola, solo cuentan los golpes dirigidos al centro de la pareja contraria."
    ],
    fuente: "Manual de entrenador, p.29 (clase en pareja — \"teoría del centro\"), adaptado a 4 jugadores",
    diagrama: { tipo: "grupo2v2centro" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "Se juega sin contar puntos, solo identificando en voz alta cuándo el golpe fue al centro.",
    varianteDificil: "Solo cuentan los golpes al centro Y por abajo de la red + 50cm, combinando ambas reglas.",
    errorFrecuente: "Los alumnos siguen golpeando a las líneas por costumbre, aunque la regla pida el centro.",
    correccion: "Antes de cada punto, señala con la mano hacia el centro de la pareja rival como recordatorio visual.",
    preguntaCierre: "¿Qué ventaja notaron en jugar al centro en vez de a las líneas?"
  },
  {
    id: 32, modalidad: "grupal", nivel: "consolidacion", tema: "Táctica",
    titulo: "Avance en cuña por parejas",
    objetivo: "Subir a la red de forma coordinada y segura.",
    duracion: "15 min",
    pasos: [
      "Cada pareja practica el avance en cuña: un jugador ligeramente adelantado marca el ritmo de subida del otro, mientras la pareja rival defiende."
    ],
    fuente: "Manual de entrenador, p.29 (trabajo táctico — \"avance en cuña\")",
    diagrama: { tipo: "cuna" },
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" },
    material: "Pelotas",
    varianteFacil: "Se practica el avance sin presión de la pareja rival, con el profesor alimentando desde el otro lado.",
    varianteDificil: "La pareja rival defiende activamente, buscando pasar a los que avanzan.",
    errorFrecuente: "Los dos jugadores de la pareja suben a la misma velocidad, perdiendo la coordinación de \"uno marca el ritmo del otro\".",
    correccion: "Define claramente quién marca el ritmo en cada repetición, y que el otro espere medio paso detrás.",
    preguntaCierre: "¿Quién marcó el ritmo de la subida en tu pareja?"
  },
  {
    id: 33, modalidad: "grupal", nivel: "consolidacion", tema: "Competencia",
    titulo: "Presión de 4 puntos consecutivos",
    objetivo: "Entrenar bajo presión real de marcador.",
    duracion: "20 min",
    pasos: [
      "Se juega hasta que una pareja gane o pierda 4 puntos consecutivos.",
      "Ese resultado marca el final del ejercicio."
    ],
    fuente: "Manual de entrenador, p.29 (ejercicios de competición — \"presión con cuatro puntos consecutivos\")",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pelotas",
    varianteFacil: "Se reduce a 3 puntos consecutivos para terminar el ejercicio antes.",
    varianteDificil: "Se suma que, además, deben ganar o perder esos puntos sin ningún error no forzado.",
    errorFrecuente: "Las parejas bajan el nivel de concentración en los puntos del medio, solo enfocándose en el primero y el último.",
    correccion: "Recuerda antes de cada punto que todos cuentan igual para el objetivo — no hay puntos \"de descanso\".",
    preguntaCierre: "¿En qué punto de la secuencia sintieron más presión?"
  },
  {
    id: 34, modalidad: "grupal", nivel: "consolidacion", tema: "Táctica",
    titulo: "Método de los 16 segundos",
    objetivo: "Usar el tiempo entre puntos para tomar mejores decisiones.",
    duracion: "15 min",
    pasos: [
      "Entre punto y punto, cada pareja tiene 16 segundos para definir en voz baja qué van a intentar en el próximo punto."
    ],
    fuente: "Manual de entrenador, p.29 (mención del \"método de los 16 segundos\")",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" },
    material: "Ninguno",
    varianteFacil: "Se da más tiempo (hasta 20 segundos) para decidir entre punto y punto.",
    varianteDificil: "Se reduce a 10 segundos, exigiendo decisiones más rápidas.",
    errorFrecuente: "Las parejas usan el tiempo para comentar el punto anterior en vez de planear el siguiente.",
    correccion: "Recuérdales que la pregunta a responder en esos segundos es \"qué vamos a intentar\", no \"qué salió mal\".",
    preguntaCierre: "¿Lograron ejecutar lo que planearon en los 16 segundos?"
  },
  {
    id: 35, modalidad: "grupal", nivel: "consolidacion", tema: "Táctica",
    titulo: "Semáforo táctico",
    objetivo: "Reconocer en qué momento atacar, construir o defender.",
    duracion: "15 min",
    pasos: [
      "El profesor nombra en voz alta \"rojo\" (defender), \"amarillo\" (construir) o \"verde\" (atacar) durante el punto.",
      "Las parejas deben ajustar su decisión en tiempo real."
    ],
    fuente: "Manual de entrenador, p.29 (mención del \"semáforo\")",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" },
    material: "Ninguno",
    varianteFacil: "El profesor avisa el color antes de que empiece el punto, no durante.",
    varianteDificil: "Se agregan colores intermedios (ej. \"amarillo-verde\") que exigen una decisión más matizada.",
    errorFrecuente: "Los alumnos siguen jugando igual sin importar el color anunciado, ignorando la consigna bajo presión del punto.",
    correccion: "Detén el punto apenas se ignore el color y pide que lo repitan prestando atención solo a esa señal.",
    preguntaCierre: "¿Qué color te costó más respetar: rojo, amarillo o verde?"
  },
  {
    id: 36, modalidad: "grupal", nivel: "consolidacion", tema: "Táctica",
    titulo: "FODA de la pareja: scouting cruzado",
    objetivo: "Jugar con información, no solo con técnica.",
    duracion: "15 min",
    pasos: [
      "Antes del set de puntos de competencia, cada pareja identifica una fortaleza y una debilidad propia, y una de la pareja rival.",
      "Juegan el set intentando explotar esa información."
    ],
    fuente: "Manual de entrenador, p.29 (mención de la \"matriz FODA de la pareja\")",
    diagrama: { tipo: "grupo2v2" },
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" },
    material: "Ninguno",
    varianteFacil: "Se identifica solo una fortaleza propia, sin debilidad ni información del rival.",
    varianteDificil: "Se suma ajustar el plan a mitad del set, si el scouting inicial resultó incorrecto.",
    errorFrecuente: "Las parejas identifican la información pero no la usan realmente durante el set, jugando igual que siempre.",
    correccion: "Para el set a mitad de camino y pregunta si están aplicando lo que identificaron — si no, ajusta en vivo.",
    preguntaCierre: "¿Lograron explotar la debilidad que identificaron en la pareja rival?"
  },

  // ============ Ampliación con las guías de PadelStar (remate y posicionamiento) ============
  {
    id: 37, modalidad: "individual", nivel: "consolidacion", tema: "Remate",
    titulo: "Remate al pico: la jugada de presión",
    objetivo: "Sumar una variante de remate de velocidad media para desgastar al rival sin arriesgar tanto como en el remate de potencia.",
    duracion: "10 min",
    pasos: [
      "El profesor juega globos cortos para que el alumno remate buscando el \"pico\" de la pista: la esquina donde se juntan la verja y la pared de fondo.",
      "Se insiste en la paciencia: rara vez el primer remate da justo en el pico, hay que repetir buscando el fallo del rebote.",
      "Se corrige que el remate salga cruzado y no demasiado fuerte, para controlar dónde pica."
    ],
    fuente: "Guía 4 de PadelStar, p.12 (\"Remate al pico como arma de presión\")",
    diagrama: { tipo: "pico" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando con extensión completa" },
    material: "Pelotas",
    varianteFacil: "Se juega desde más cerca de la red, con menos presión de tiempo.",
    varianteDificil: "Se exige que el remate al pico sea además cruzado, no indiferente a la dirección.",
    errorFrecuente: "El alumno le pega con toda la potencia buscando que entre directo, en vez de dejar que el rebote haga el trabajo.",
    correccion: "Recuerda que el objetivo no es la potencia sino la precisión — bajar la velocidad ayuda a encontrar el pico.",
    preguntaCierre: "¿Cuántos intentos de 10 terminaron saliendo por el pico?"
  },
  {
    id: 38, modalidad: "individual", nivel: "consolidacion", tema: "Remate",
    titulo: "Sacarla por 3: el remate con efecto a la pared lateral",
    objetivo: "Aprender el remate liftado que busca que la bola salga de la pista por el lateral, tras pegar primero en la pared de fondo.",
    duracion: "10 min",
    pasos: [
      "El profesor juega globos hacia el lado de revés del alumno (o el lado derecho si es zurdo).",
      "El alumno remata en cruzado imaginando la pared de fondo como un reloj y buscando pegarle \"a las tres\", con efecto liftado.",
      "Se controla la potencia: si el golpe es demasiado fuerte la pelota puede saltar y dar tiempo al rival a llegar."
    ],
    fuente: "Guía 4 de PadelStar, p.13 (\"Golpear la pelota con efecto a la pared lateral\" / \"Sacarla por 3 metros\")",
    diagrama: { tipo: "lateral" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando con extensión completa" },
    material: "Pelotas",
    varianteFacil: "Se practica primero sin la referencia del reloj, solo buscando pegarle a la pared con efecto.",
    varianteDificil: "Se juega desde ambos lados (derecha e izquierda), no solo del lado de revés.",
    errorFrecuente: "El alumno pega demasiado fuerte, haciendo que la pelota salte alto en vez de salir con el efecto esperado.",
    correccion: "Baja la potencia y pide que \"acompañe\" la pelota con la pala hacia el costado, no que le pegue de lleno.",
    preguntaCierre: "¿La pelota salió por el lateral o quedó jugable dentro de la pista?"
  },
  {
    id: 39, modalidad: "grupal", nivel: "intermedio", tema: "Posiciones",
    titulo: "Evita la zona pantano",
    objetivo: "Dejar de quedarse parado en la peor zona de la pista: ni suficientemente cerca de la red para volear bien, ni suficientemente atrás para defender bien.",
    duracion: "10 min",
    pasos: [
      "Se marca con conos la \"zona pantano\": la franja entre la posición de volea (1.5 m de la red) y un palmo detrás de la línea de saque.",
      "Los 4 alumnos juegan puntos normales; cada vez que alguien golpea desde esa franja marcada, el profesor lo señala.",
      "Se corrige el hábito: tras cada golpe, recuperar rápido una de las dos posiciones válidas (de volea o de defensa), nunca quedarse a mitad de camino."
    ],
    fuente: "Guía 2 de PadelStar, p.25-26 (\"La zona pantano\" y \"¿Qué hacer si me quedo en media pista?\")",
    diagrama: { tipo: "pantano" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Conos",
    varianteFacil: "Se juega con el profesor marcando en voz alta cada vez que alguien entra en la zona marcada.",
    varianteDificil: "Se juega un set de competencia donde entrar en la zona pantano pierde el punto automáticamente.",
    errorFrecuente: "Después de un golpe, el alumno se queda parado en el lugar donde golpeó en vez de recuperar posición.",
    correccion: "Recuerda que la regla es simple: después de cada golpe, moverse — nunca quedarse quieto donde se pegó.",
    preguntaCierre: "¿En qué momento del punto te quedaste parado en la zona pantano?"
  },
  {
    id: 40, modalidad: "grupal", nivel: "consolidacion", tema: "Remate",
    titulo: "Sacarla por 4: la bola entregada",
    objetivo: "Aprovechar una bola fácil y cercana a la red para terminar el punto sacando la pelota de la pista por el fondo.",
    duracion: "15 min",
    pasos: [
      "En un punto de competencia 2 vs 2, cuando una pareja le \"entrega\" a la otra una bola alta y cerca de la red, el que remata debe adelantarse antes de golpear.",
      "Se busca que el bote sea cerca de la red, con un buen giro de muñeca, para que la pelota salga por el fondo de la pista (por el conjunto pared + verja, que mide 4 metros).",
      "Si no se logra adelantar a tiempo, se corrige: mejor dejar picar y jugar un golpe seguro que forzar el remate desde atrás."
    ],
    fuente: "Guía 4 de PadelStar, p.12 (\"Sacar la bola de la pista — sacarla por 4\")",
    diagrama: { tipo: "pico" },
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" },
    material: "Pelotas",
    varianteFacil: "Se practica con bolas servidas fáciles por el profesor, sin presión de punto real.",
    varianteDificil: "Se exige lograrlo dentro de un punto de competencia real, con la pareja rival defendiendo activamente.",
    errorFrecuente: "El alumno remata desde atrás sin haberse adelantado, perdiendo el ángulo necesario para sacarla por el fondo.",
    correccion: "Recuerda la regla simple de la progresión: primero el pie, después la pala — adelantarse es el primer movimiento, no el golpe.",
    preguntaCierre: "¿Lograste adelantarte a tiempo antes de rematar?"
  },

  // ============ Ampliación: golpes complementarios (contrapared, pared lateral, chiquita técnica) ============
  {
    id: 41, modalidad: "individual", nivel: "consolidacion", tema: "Contrapared",
    titulo: "Contrapared: golpear antes del segundo pique",
    objetivo: "Aprender a devolver la pelota directo desde la pared de fondo, sin esperar que baje al piso, para ganar tiempo quitándole ritmo al rival.",
    duracion: "10 min",
    pasos: [
      "El profesor juega pelotas hacia la pared de fondo con trayectoria alta, para que el alumno la tome apenas rebota en el vidrio, antes de que pique en el piso.",
      "El alumno se ubica cerca de la pared, de perfil, y golpea la pelota \"de aire\" justo después del rebote en el vidrio.",
      "Se repite variando la altura del globo para acostumbrar el ojo a distintos puntos de impacto."
    ],
    fuente: "Adaptación propia de academiadepadel.pe a partir de la progresión de salida de pared (Manual de entrenador, p.16) y Guía 3 de PadelStar (golpes especiales).",
    diagrama: { tipo: "pared" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pared de fondo",
    varianteFacil: "Se deja que pique una vez en el piso antes de golpear, como paso intermedio antes de quitar el pique.",
    varianteDificil: "Se juega directo en un punto real, donde el alumno debe decidir solo cuándo usar el contrapared.",
    errorFrecuente: "El alumno retrocede instintivamente esperando que la pelota baje al piso, perdiendo la oportunidad de jugarla de aire.",
    correccion: "Pide que se quede parado cerca de la pared y confíe en golpear apenas sale del vidrio, sin retroceder.",
    preguntaCierre: "¿Te animaste a golpearla de aire o preferiste esperar el pique en el piso?"
  },
  {
    id: 42, modalidad: "individual", nivel: "intermedio", tema: "Pared lateral",
    titulo: "Salida de pared lateral",
    objetivo: "Resolver con seguridad una pelota que pica primero en la pared lateral (vidrio del costado), distinto a la salida de pared de fondo.",
    duracion: "10 min",
    pasos: [
      "El profesor juega pelotas hacia la pared lateral del alumno, con trayectoria cruzada.",
      "El alumno se desplaza hacia el costado y espera que la pelota rebote en el vidrio lateral antes de golpear.",
      "Se corrige el ángulo de salida: la pelota debe salir hacia el centro de la cancha, no hacia la línea."
    ],
    fuente: "Adaptación propia de academiadepadel.pe, complemento a la progresión de salida de pared de fondo (Manual de entrenador, p.16).",
    diagrama: { tipo: "pared" },
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" },
    material: "Pared lateral",
    varianteFacil: "El profesor juega la pelota más lenta y con menos efecto hacia la pared lateral.",
    varianteDificil: "Se suma que el alumno debe dirigir la devolución cruzada después de la salida de pared.",
    errorFrecuente: "El alumno se para de frente a la pared esperando la pelota, en vez de ubicarse de perfil anticipando hacia dónde rebota.",
    correccion: "Pide que se ubique de perfil, mirando hacia el centro de la cancha y no hacia la pared, para anticipar el ángulo de salida.",
    preguntaCierre: "¿Hacia qué lado salió la pelota después del rebote en la pared lateral?"
  },
  {
    id: 43, modalidad: "individual", nivel: "intermedio", tema: "Chiquita",
    titulo: "Chiquita: el golpe que muere cerca de la red",
    objetivo: "Aprender el gesto técnico de la chiquita (dejada corta) antes de usarla en situación de juego.",
    duracion: "8 min",
    pasos: [
      "El profesor juega pelotas cómodas a media distancia del alumno.",
      "El alumno golpea con un gesto corto, casi sin swing, acompañando la pelota hacia abajo y adelante con la pala abierta.",
      "Se busca que la pelota pique dos veces antes de llegar a la línea de saque del rival."
    ],
    fuente: "Adaptación propia de academiadepadel.pe, técnica base previa al ejercicio táctico grupal \"Chiquita y avance en grupo\" (Manual de entrenador, p.52).",
    diagrama: { tipo: "feed", lado: "centro" },
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" },
    material: "Pelotas",
    varianteFacil: "El alumno practica el gesto sin pelota primero, solo el movimiento de pala.",
    varianteDificil: "Se exige disfrazar el golpe: armar igual que un drive normal y recién al final suavizar el impacto.",
    errorFrecuente: "El alumno le pega con el mismo swing de un golpe normal, por lo que la pelota llega con demasiada velocidad y no \"muere\".",
    correccion: "Recuerda que el gesto es corto y casi sin swing — la pala casi no se mueve hacia atrás, solo acompaña hacia adelante.",
    preguntaCierre: "¿Tu chiquita picó dos veces antes de la línea de saque, o llegó de un solo bote?"
  }
];
