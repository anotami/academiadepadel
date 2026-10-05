(function () {
  var WHATSAPP_NUMBER = "51932900134";

  var QUESTIONS = [
    {
      text: "¿Cuántas veces has jugado pádel en tu vida?",
      image: "assets/img/court/paddles-court.jpg",
      alt: "Palas de pádel sobre la cancha",
      options: [
        { label: "Nunca", points: 0 },
        { label: "Entre 1 y 10 veces", points: 1 },
        { label: "Más de 10 veces, juego seguido", points: 2 }
      ]
    },
    {
      text: "¿Has tomado clases de pádel antes?",
      image: "assets/img/court/grip-detail.jpg",
      alt: "Jugador ajustando el agarre de la pala antes de una clase",
      options: [
        { label: "Nunca tomé una clase", points: 0 },
        { label: "Alguna clase suelta o de prueba", points: 1 },
        { label: "Clases regulares por varios meses", points: 2 }
      ]
    },
    {
      text: "¿Conoces golpes como la bandeja, la víbora o el remate?",
      image: "assets/img/court/paddle-bouquet.jpg",
      alt: "Varias palas de pádel de distintos modelos",
      options: [
        { label: "No, ni idea de qué son", points: 0 },
        { label: "Los he escuchado pero no los domino", points: 1 },
        { label: "Los conozco y los uso al jugar", points: 2 }
      ]
    },
    {
      text: "Cuando juegas un partido recreativo...",
      image: "assets/img/court/aerial-court.jpg",
      alt: "Vista aérea de dos jugadores en un partido de pádel",
      options: [
        { label: "Me cuesta hasta devolver la pelota", points: 0 },
        { label: "Sostengo el peloteo pero fallo seguido", points: 1 },
        { label: "Juego puntos largos y pienso la táctica", points: 2 }
      ]
    }
  ];

  var RESULTS = [
    {
      min: 0,
      max: 2,
      badge: "🌱",
      image: "assets/img/court/grip-detail.jpg",
      alt: "Jugador ajustando el agarre de la pala",
      level: "Nivel Inicial",
      desc: "Recién vas a empezar, o casi no tienes experiencia en cancha — es el punto de partida perfecto para aprender bien desde el primer golpe.",
      plans: [
        { tag: "Recomendado", title: "¡Conociendo el Pádel!", text: "Jornada grupal gratuita para probar el pádel desde cero, sin compromiso.", link: "index.html#ofertas" },
        { tag: "Siguiente paso", title: "Clínicas · Nivel inicial", text: "Sesiones temáticas de S/70 para afirmar tus primeros golpes.", link: "index.html#clinicas" }
      ],
      waText: "Hola, hice el test de nivel en la web y me salió Nivel Inicial ({score}/8). Quiero información sobre la jornada gratuita ¡Conociendo el Pádel!"
    },
    {
      min: 3,
      max: 5,
      badge: "📈",
      image: "assets/img/court/paddle-bouquet.jpg",
      alt: "Varias palas de pádel de distintos modelos",
      level: "Nivel Inicial-Intermedio",
      desc: "Ya tienes algo de cancha, pero te conviene afirmar fundamentos antes de jugar con más soltura y consistencia.",
      plans: [
        { tag: "Recomendado", title: "Clínicas · Nivel inicial", text: "Sesiones temáticas puntuales (derecha, saque, volea, revés) para cerrar tus vacíos técnicos.", link: "index.html#clinicas" },
        { tag: "Para progresar", title: "Programa regular", text: "Junior o Adultos — clases por nivel con metodología progresiva.", link: "index.html#programas" }
      ],
      waText: "Hola, hice el test de nivel en la web y me salió Nivel Inicial-Intermedio ({score}/8). Quiero información sobre las clínicas de nivel inicial."
    },
    {
      min: 6,
      max: 8,
      badge: "🏆",
      image: "assets/img/court/net-ball.jpg",
      alt: "Pelota de pádel golpeando la red en plena jugada",
      level: "Nivel Intermedio",
      desc: "Ya sostienes peloteos y piensas la táctica del punto. Te conviene pulir golpes específicos y consolidar con clases regulares.",
      plans: [
        { tag: "Recomendado", title: "Clínicas · Nivel intermedio", text: "Salida de pared, posicionamiento en pareja y bandeja, S/70 por sesión.", link: "index.html#clinicas" },
        { tag: "Para consolidar", title: "Paquete 8 clases", text: "El mejor precio por clase para seguir subiendo de nivel.", link: "index.html#precios" }
      ],
      waText: "Hola, hice el test de nivel en la web y me salió Nivel Intermedio ({score}/8). Quiero información sobre las clínicas de nivel intermedio y el paquete de 8 clases."
    }
  ];

  var currentQuestion = 0;
  var totalScore = 0;

  var progressBar = document.getElementById("quizProgressBar");
  var progressPct = document.getElementById("quizProgressPct");
  var stepLabel = document.getElementById("quizStep");
  var questionText = document.getElementById("quizQuestionText");
  var optionsWrap = document.getElementById("quizOptions");
  var quizImage = document.getElementById("quizImage");
  var quizEl = document.getElementById("quiz");
  var resultEl = document.getElementById("quizResult");

  function renderQuestion() {
    var q = QUESTIONS[currentQuestion];
    var pct = Math.round((currentQuestion / QUESTIONS.length) * 100);
    stepLabel.textContent = "Pregunta " + (currentQuestion + 1) + " de " + QUESTIONS.length;
    progressBar.style.width = pct + "%";
    progressPct.textContent = pct + "%";
    questionText.textContent = q.text;
    quizImage.src = q.image;
    quizImage.alt = q.alt;
    optionsWrap.innerHTML = "";

    q.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = opt.label;
      btn.addEventListener("click", function () {
        totalScore += opt.points;
        btn.classList.add("selected");
        setTimeout(nextQuestion, 220);
      });
      optionsWrap.appendChild(btn);
    });
  }

  function nextQuestion() {
    currentQuestion++;
    if (currentQuestion < QUESTIONS.length) {
      renderQuestion();
    } else {
      progressBar.style.width = "100%";
      progressPct.textContent = "100%";
      setTimeout(showResult, 200);
    }
  }

  function showResult() {
    var result = RESULTS.find(function (r) { return totalScore >= r.min && totalScore <= r.max; }) || RESULTS[0];

    var resultImage = document.getElementById("quizResultImage");
    resultImage.src = result.image;
    resultImage.alt = result.alt;

    document.getElementById("quizResultBadge").textContent = result.badge;
    document.getElementById("quizResultTitle").textContent = result.level;
    document.getElementById("quizResultDesc").textContent = result.desc;

    var plansWrap = document.getElementById("quizResultPlans");
    plansWrap.innerHTML = "";
    result.plans.forEach(function (plan) {
      var card = document.createElement("a");
      card.className = "quiz-plan-card";
      card.href = plan.link;
      card.innerHTML =
        '<span class="quiz-plan-tag">' + plan.tag + '</span>' +
        '<h3>' + plan.title + '</h3>' +
        '<p>' + plan.text + '</p>';
      plansWrap.appendChild(card);
    });

    var waLink = document.getElementById("quizWhatsapp");
    var message = result.waText.replace("{score}", totalScore);
    waLink.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

    if (typeof gtag === "function") {
      gtag("event", "nivel_test_completado", { nivel: result.level, puntaje: totalScore });
    }

    quizEl.hidden = true;
    resultEl.hidden = false;
  }

  document.getElementById("quizRetry").addEventListener("click", function () {
    currentQuestion = 0;
    totalScore = 0;
    resultEl.hidden = true;
    quizEl.hidden = false;
    renderQuestion();
  });

  renderQuestion();
})();
