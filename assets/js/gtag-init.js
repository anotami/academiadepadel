// Bootstrap de Google Analytics (gtag.js). Antes estaba inline en cada
// página — se movió acá porque la Content Security Policy no permite
// scripts inline sin 'unsafe-inline' (que anularía buena parte de la
// protección contra XSS que da la CSP).
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-C2DJ9V0L4Z");
