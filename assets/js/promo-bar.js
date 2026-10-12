(function () {
  var STORAGE_KEY = "promo_bar_closed";

  var MENSAJES = [
    { href: "test.html", html: "🎯 ¿No sabes tu nivel de pádel? <strong>Descúbrelo en 30 segundos</strong> y te decimos tu plan ideal →" },
    { href: "index.html#contacto", html: "🎾 ¿No tienes pala? <strong>Te la prestamos sin costo</strong> en tus primeras clases." },
    { href: "index.html#ofertas", html: "👥 <strong>Cupo Fundador:</strong> 1 clase de regalo en tu paquete, solo para los primeros 10 alumnos." }
  ];

  var bar = document.getElementById("promoBar");
  var msgLink = document.getElementById("promoBarMsg");
  var closeBtn = document.getElementById("promoBarClose");
  if (!bar || !msgLink || !closeBtn) return;

  var yaDescartado = false;
  try {
    yaDescartado = sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {
    // Sin acceso a sessionStorage (modo privado estricto, etc.): mostramos el aviso igual.
  }
  if (yaDescartado) return;

  bar.hidden = false;

  var indice = 0;
  function pintar() {
    var m = MENSAJES[indice];
    msgLink.href = m.href;
    msgLink.innerHTML = m.html;
  }
  pintar();

  var intervalo = null;
  if (MENSAJES.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    intervalo = setInterval(function () {
      indice = (indice + 1) % MENSAJES.length;
      pintar();
    }, 6000);
  }

  closeBtn.addEventListener("click", function () {
    if (intervalo) clearInterval(intervalo);
    bar.hidden = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {
      // Sin sessionStorage: el aviso simplemente no persiste el cierre entre páginas.
    }
  });
})();
