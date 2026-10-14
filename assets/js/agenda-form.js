(function () {
  var WHATSAPP_NUMBER = "51957085531";
  var form = document.getElementById("agendaForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var nombre = form.nombre.value.trim();
    var programa = form.programa.value;
    var dia = form.dia.value;
    var horario = form.horario.value;
    var cancha = form.cancha.value;

    var mensaje = "Hola, quiero agendar una clase.\n" +
      "Nombre: " + nombre + "\n" +
      "Programa: " + programa + "\n" +
      "Día preferido: " + dia + "\n" +
      "Horario preferido: " + horario + "\n" +
      "Cancha preferida: " + cancha;

    if (typeof gtag === "function") {
      gtag("event", "agenda_solicitud", { programa: programa, cancha: cancha });
    }

    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mensaje), "_blank", "noopener");
  });
})();
