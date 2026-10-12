// Banner de cookies simple, sin librerías externas. GA4 arranca en
// "denied" por defecto (ver gtag-init.js) — este banner es lo único que
// puede cambiarlo a "granted", y solo si el visitante hace clic en
// "Aceptar". La decisión queda guardada en localStorage para no volver
// a preguntar.
(function () {
  let guardado = null;
  try { guardado = localStorage.getItem("cookie_consent"); } catch (e) {}
  if (guardado) return;

  const banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.innerHTML = `
    <p>Usamos cookies de analítica para entender cómo se usa el sitio. Puedes aceptarlas o seguir solo con lo esencial. <a href="privacidad.html">Más info</a>.</p>
    <div class="cookie-banner-acciones">
      <button type="button" class="btn btn-outline btn-small" id="cookieRechazar">Solo esenciales</button>
      <button type="button" class="btn btn-primary btn-small" id="cookieAceptar">Aceptar</button>
    </div>
  `;
  document.body.appendChild(banner);

  function decidir(valor) {
    try { localStorage.setItem("cookie_consent", valor); } catch (e) {}
    if (window.gtag) {
      window.gtag("consent", "update", { analytics_storage: valor === "granted" ? "granted" : "denied" });
    }
    banner.remove();
  }

  document.getElementById("cookieAceptar").addEventListener("click", () => decidir("granted"));
  document.getElementById("cookieRechazar").addEventListener("click", () => decidir("denied"));
})();
