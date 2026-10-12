// Bootstrap de Google Analytics (gtag.js). Antes estaba inline en cada
// página — se movió acá porque la Content Security Policy no permite
// scripts inline sin 'unsafe-inline' (que anularía buena parte de la
// protección contra XSS que da la CSP).
//
// Consent Mode: por defecto, GA4 arranca SIN permiso para guardar nada
// de analítica (analytics_storage: "denied") — no se guarda ninguna
// cookie de analítica hasta que el visitante acepte el banner de
// cookies (assets/js/cookie-banner.js). Si ya había aceptado antes
// (guardado en localStorage), se aplica ese consentimiento de una vez,
// para no mostrar "denegado" un instante y "concedido" al siguiente.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

let consentimientoGuardado = null;
try { consentimientoGuardado = localStorage.getItem("cookie_consent"); } catch (e) {}

gtag("consent", "default", {
  analytics_storage: consentimientoGuardado === "granted" ? "granted" : "denied",
  ad_storage: "denied"
});

gtag("js", new Date());
gtag("config", "G-C2DJ9V0L4Z");
