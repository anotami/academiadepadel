// Pestañas para profesor.html y alumno.html: agrupan las mismas tarjetas de
// siempre en un flujo por pestaña en vez de un solo scroll largo. No
// depende de Firebase — corre apenas carga la página, para que la
// navegación se sienta instantánea incluso antes de que lleguen los datos.
//
// Se autoejecuta al importarse (en vez de recibir un <script> inline con la
// llamada) porque el CSP del sitio es script-src 'self' sin 'unsafe-inline':
// cualquier <script> con código pegado directo en el HTML queda bloqueado.
// La pestaña por defecto es simplemente la primera que aparece en el HTML.
function initPortalTabs() {
  const tabs = Array.from(document.querySelectorAll(".portal-tab"));
  const panels = Array.from(document.querySelectorAll("[data-tabpanel]"));
  if (!tabs.length) return;

  function activar(nombre) {
    tabs.forEach((t) => {
      const activo = t.dataset.tab === nombre;
      t.classList.toggle("activo", activo);
      t.setAttribute("aria-selected", activo ? "true" : "false");
    });
    panels.forEach((p) => { p.hidden = p.dataset.tabpanel !== nombre; });
    if (location.hash.slice(1) !== nombre) history.replaceState(null, "", "#" + nombre);
  }

  tabs.forEach((t) => t.addEventListener("click", () => activar(t.dataset.tab)));

  const porDefecto = tabs[0].dataset.tab;
  const deHash = location.hash.slice(1);
  const valido = tabs.some((t) => t.dataset.tab === deHash);
  activar(valido ? deHash : porDefecto);
}

initPortalTabs();
