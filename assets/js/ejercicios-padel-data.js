// Banco de ejercicios de clase, basado en el manual de entrenador de
// academiadepadel.pe (progresiones de golpes, tablas de corrección de
// errores y estructura de clases individuales/grupales).
//
// Cada ejercicio indica: modalidad (individual/grupal), nivel (iniciacion/
// intermedio/consolidacion), tema, objetivo, duración orientativa, pasos y
// la página del manual de la que viene (o la base conceptual, cuando es una
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
    foto: { src: "assets/img/court/grip-detail.jpg", alt: "Primer plano de la empuñadura de una pala de pádel" } },
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
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" } },
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
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" } },
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
    foto: { src: "assets/img/gabriel/gabriel-3.jpg", alt: "Jugador de la academia en posición de espera con la pala" } },
  {
    id: 5, modalidad: "individual", nivel: "iniciacion", tema: "Saque",
    titulo: "Saque: fijar el punto de impacto",
    objetivo: "Aprender la posición de armado del saque, sin preocuparse aún por la potencia.",
    duracion: "6 min",
    pasos: [
      "El alumno se coloca de lado, con la cara de la pala por encima de la pelota, piernas separadas al ancho de los hombros.",
      "Suelta la pelota con la mano libre y practica encontrar el punto de impacto antes de golpear con intención."
    ],
    fuente: "Manual de entrenador, p.19-20 (El saque, armado)",
    diagrama: { tipo: "saque" },
    foto: { src: "assets/img/court/paddles-court.jpg", alt: "Palas de pádel y pelotas sobre la cancha" } },
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
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" } },

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
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" } },
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
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" } },
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
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },

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
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" } },
  {
    id: 14, modalidad: "individual", nivel: "consolidacion", tema: "Smash",
    titulo: "Smash en 3 pasos de potencia",
    objetivo: "Construir el remate de definición de forma segura y progresiva.",
    duracion: "10 min",
    pasos: [
      "De frente, agarrar la pelota con la mano en el punto más alto.",
      "De perfil, dejar picar y agarrar en el punto más alto.",
      "De perfil, hacer \"arco y flecha\" con la pala y golpear."
    ],
    fuente: "Manual de entrenador, p.22 (Smash x3, progresión, adaptado al smash de definición)",
    diagrama: { tipo: "smash" },
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/court/grip-detail.jpg", alt: "Primer plano de la empuñadura de una pala de pádel" } },

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
    foto: { src: "assets/img/gabriel/gabriel-4.jpg", alt: "Jugador de la academia golpeando de derecha con extensión completa" } },
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
    foto: { src: "assets/img/gabriel/gabriel-1.jpg", alt: "Jugador de la academia desplazándose para llegar a una bola baja" } },
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
    foto: { src: "assets/img/court/paddles-court.jpg", alt: "Palas de pádel y pelotas sobre la cancha" } },
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
    foto: { src: "assets/img/gabriel/gabriel-3.jpg", alt: "Jugador de la academia en posición de espera con la pala" } },
  {
    id: 23, modalidad: "grupal", nivel: "iniciacion", tema: "Posiciones",
    titulo: "Defensa vs. ataque: siente la posición",
    objetivo: "Diferenciar físicamente la posición de defensa y la de ataque.",
    duracion: "6 min",
    pasos: [
      "Dos alumnos se ubican en zona de defensa (50 cm detrás de la línea de saque) y dos en zona de ataque (2 metros de la red).",
      "Rotan de zona cada 2 minutos, sintiendo el cambio de peso del cuerpo y de altura de pala."
    ],
    fuente: "Manual de entrenador, p.5 (Posiciones de juego: Defensa/Ataque)",
    diagrama: { tipo: "defensaAtaque" },
    foto: { src: "assets/img/gabriel/gabriel-3.jpg", alt: "Jugador de la academia en posición de espera con la pala" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },

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
    foto: { src: "assets/img/gabriel/gabriel-2.jpg", alt: "Jugador de la academia con la pala, antes de empezar la clase" } },
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
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/court/net-ball.jpg", alt: "Pelota de pádel golpeando la red en plena jugada" } },

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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" } },
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
    foto: { src: "assets/img/court/aerial-court.jpg", alt: "Vista aérea de una cancha de pádel con dos jugadores" } },
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
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" } },
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
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" } },
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
    foto: { src: "assets/img/court/paddle-bouquet.jpg", alt: "Varias palas de pádel y pelotas sobre la cancha" }
  }
];
