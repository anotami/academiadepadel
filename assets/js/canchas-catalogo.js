import { CANCHAS, DISTRITOS } from "./canchas-data.js?v=5";

const grid = document.getElementById("catalogoGrid");
const buscarInput = document.getElementById("catalogoBuscar");
const distritoSelect = document.getElementById("catalogoDistrito");
const contador = document.getElementById("catalogoContador");

DISTRITOS.forEach((d) => {
  const opt = document.createElement("option");
  opt.value = d;
  opt.textContent = d;
  distritoSelect.appendChild(opt);
});

const ESTADO_BADGE = {
  Habilitada: "badge-confirmada",
  Reservada: "badge-pendiente",
  Bloqueada: "badge-rechazada"
};

// Reseñas en memoria: clubId -> [{estrellas, comentario, nombre, creadoEn}]
let resenasPorClub = {};
let fb = null;

function promedio(lista) {
  if (!lista || !lista.length) return null;
  return lista.reduce((s, r) => s + r.estrellas, 0) / lista.length;
}

function estrellasHTML(valor, interactivo, clubId) {
  let html = `<span class="estrellas${interactivo ? " estrellas-input" : ""}" data-club="${clubId || ""}">`;
  for (let i = 1; i <= 5; i++) {
    const llena = valor && i <= Math.round(valor);
    if (interactivo) {
      html += `<button type="button" class="estrella-btn" data-valor="${i}" aria-label="${i} estrella${i > 1 ? "s" : ""}">${llena ? "★" : "☆"}</button>`;
    } else {
      html += `<span class="estrella-fija">${llena ? "★" : "☆"}</span>`;
    }
  }
  html += "</span>";
  return html;
}

function resumenRating(clubId) {
  const lista = resenasPorClub[clubId] || [];
  const prom = promedio(lista);
  const wrap = document.createElement("div");
  wrap.className = "rating-resumen";
  if (prom === null) {
    wrap.innerHTML = `${estrellasHTML(0, false)} <span class="rating-count">Sé el primero en calificar</span>`;
  } else {
    wrap.innerHTML = `${estrellasHTML(prom, false)} <span class="rating-count">${prom.toFixed(1)} · ${lista.length} reseña${lista.length === 1 ? "" : "s"}</span>`;
  }
  return wrap;
}

function tarjeta(c) {
  const art = document.createElement("article");
  art.className = "cancha-card" + (c.featured ? " cancha-card-featured" : "");
  art.dataset.nombre = c.nombre.toLowerCase();
  art.dataset.distrito = c.distrito.toLowerCase();

  const redesHtml = c.redesLinks.map((r) => `<a href="${r.url}" target="_blank" rel="noopener">${r.label}</a>`).join(" · ");
  const waTexto = encodeURIComponent(`Hola, vi ${c.nombre.replace(" (nuestra academia)", "")} en el directorio de academiadepadel.pe y quisiera consultar disponibilidad.`);
  const contacto = !c.telefono
    ? ""
    : /^519\d{8}$/.test(c.telefono)
      ? `<a class="btn btn-whatsapp btn-small" target="_blank" rel="noopener" href="https://wa.me/${c.telefono}?text=${waTexto}">WhatsApp</a>`
      : `<a class="btn btn-outline btn-small" href="tel:+${c.telefono}">Llamar</a>`;
  const nombreMostrar = c.nombre.replace(" (nuestra academia)", "");
  const mapaQuery = encodeURIComponent(`${nombreMostrar}, ${c.direccion}`);

  let media;
  if (c.logo && !c.foto) {
    media = `<div class="cancha-media-logo-wrap"><img class="cancha-media-logo" src="${c.logo.src}" alt="${c.logo.alt}" loading="lazy"></div>`;
  } else if (c.foto) {
    media = `<img class="cancha-media-foto" src="${c.foto.src}" alt="${c.foto.alt}" loading="lazy" width="300" height="180">`;
  } else {
    media = `<svg viewBox="0 0 120 80" class="cancha-media-svg" aria-hidden="true">
        <rect width="120" height="80" rx="10" fill="#14495a"/>
        <rect x="14" y="10" width="92" height="60" rx="4" fill="none" stroke="#c8e94c" stroke-width="2"/>
        <line x1="60" y1="10" x2="60" y2="70" stroke="#c8e94c" stroke-width="2"/>
        <circle cx="60" cy="40" r="5" fill="#c8e94c"/>
      </svg>`;
  }

  art.innerHTML = `
    <div class="cancha-media">
      ${media}
      ${c.featured ? '<span class="cancha-ribbon">Nuestra academia</span>' : ""}
    </div>
    <div class="cancha-body">
      <div class="cancha-head">
        <h3>${nombreMostrar}</h3>
        <span class="badge ${ESTADO_BADGE[c.estado] || ""}">${c.estado}</span>
      </div>
      <p class="cancha-distrito">${c.distrito}</p>
      <div class="rating-slot"></div>
      <ul class="cancha-meta">
        <li><strong>Dirección:</strong> ${c.direccion}</li>
        <li><strong>Cancha:</strong> ${c.cancha}</li>
        <li><strong>Horario:</strong> ${c.dias}, ${c.horario}</li>
        <li><strong>Tarifa estimada:</strong> ${c.tarifa}</li>
      </ul>
      <p class="cancha-redes">${redesHtml}</p>
      <div class="cancha-acciones">
        ${contacto}
        <button type="button" class="btn btn-outline btn-small cancha-toggle-mapa">Ver mapa</button>
        <button type="button" class="btn btn-outline btn-small cancha-toggle-resena">Dejar reseña</button>
      </div>
      <div class="cancha-mapa-wrap" hidden>
        <iframe class="cancha-mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${mapaQuery}&output=embed" title="Mapa de ${nombreMostrar}"></iframe>
      </div>
      <div class="cancha-resenas-wrap" hidden>
        <div class="cancha-resenas-lista"></div>
        <form class="cancha-resena-form">
          <p class="field-hint">Califica tu experiencia en esta cancha.</p>
          ${estrellasHTML(0, true, c.id)}
          <input type="text" class="resena-nombre" placeholder="Tu nombre (opcional)" maxlength="40">
          <textarea class="resena-comentario" placeholder="Cuéntanos cómo estuvo la cancha, el horario, la atención..." maxlength="300" rows="2"></textarea>
          <button class="btn btn-primary btn-small" type="submit">Publicar reseña</button>
          <p class="form-msg resena-msg"></p>
        </form>
      </div>
    </div>
  `;

  art.querySelector(".rating-slot").appendChild(resumenRating(c.id));

  const btnMapa = art.querySelector(".cancha-toggle-mapa");
  const mapaWrap = art.querySelector(".cancha-mapa-wrap");
  btnMapa.addEventListener("click", () => {
    mapaWrap.hidden = !mapaWrap.hidden;
    btnMapa.textContent = mapaWrap.hidden ? "Ver mapa" : "Ocultar mapa";
  });

  const btnResena = art.querySelector(".cancha-toggle-resena");
  const resenaWrap = art.querySelector(".cancha-resenas-wrap");
  btnResena.addEventListener("click", () => {
    resenaWrap.hidden = !resenaWrap.hidden;
    btnResena.textContent = resenaWrap.hidden ? "Dejar reseña" : "Ocultar reseñas";
    if (!resenaWrap.hidden) pintarListaResenas(c.id, art.querySelector(".cancha-resenas-lista"));
  });

  const form = art.querySelector(".cancha-resena-form");
  const estrellasInput = form.querySelector(".estrellas-input");
  let estrellaElegida = 0;
  estrellasInput.querySelectorAll(".estrella-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      estrellaElegida = Number(btn.dataset.valor);
      estrellasInput.querySelectorAll(".estrella-btn").forEach((b, i) => {
        b.textContent = i < estrellaElegida ? "★" : "☆";
      });
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = form.querySelector(".resena-msg");
    if (!estrellaElegida) {
      msg.textContent = "Elige de 1 a 5 estrellas.";
      msg.className = "form-msg resena-msg error";
      return;
    }
    msg.textContent = "Publicando...";
    msg.className = "form-msg resena-msg";
    try {
      if (!fb) fb = await import("./firebase-app.js?v=13");
      if (fb.CONFIG_IS_PLACEHOLDER) throw new Error("placeholder");
      if (!fb.auth.currentUser) await fb.signInAnonymously(fb.auth);
      const nombre = form.querySelector(".resena-nombre").value.trim() || "Anónimo";
      const comentario = form.querySelector(".resena-comentario").value.trim();
      await fb.addDoc(fb.collection(fb.db, "resenas_canchas"), {
        clubId: c.id,
        nombre,
        estrellas: estrellaElegida,
        comentario,
        creadoEn: fb.serverTimestamp()
      });
      resenasPorClub[c.id] = resenasPorClub[c.id] || [];
      resenasPorClub[c.id].push({ nombre, estrellas: estrellaElegida, comentario, creadoEn: new Date() });
      art.querySelector(".rating-slot").innerHTML = "";
      art.querySelector(".rating-slot").appendChild(resumenRating(c.id));
      pintarListaResenas(c.id, art.querySelector(".cancha-resenas-lista"));
      msg.textContent = "¡Gracias por tu reseña!";
      msg.className = "form-msg resena-msg ok";
      form.reset();
      estrellaElegida = 0;
      estrellasInput.querySelectorAll(".estrella-btn").forEach((b) => { b.textContent = "☆"; });
    } catch (err) {
      msg.textContent = "No pudimos publicar tu reseña ahora. Intenta de nuevo en un momento.";
      msg.className = "form-msg resena-msg error";
    }
  });

  return art;
}

function pintarListaResenas(clubId, contenedor) {
  const lista = (resenasPorClub[clubId] || []).slice().sort((a, b) => (b.creadoEn?.seconds || b.creadoEn?.getTime?.() / 1000 || 0) - (a.creadoEn?.seconds || a.creadoEn?.getTime?.() / 1000 || 0));
  if (!lista.length) {
    contenedor.innerHTML = `<p class="empty-state">Todavía no hay reseñas de esta cancha.</p>`;
    return;
  }
  contenedor.innerHTML = lista.slice(0, 5).map((r) => `
    <div class="cancha-resena-item">
      ${estrellasHTML(r.estrellas, false)}
      <strong>${r.nombre}</strong>
      ${r.comentario ? `<p>${r.comentario}</p>` : ""}
    </div>
  `).join("");
}

function render() {
  const texto = buscarInput.value.trim().toLowerCase();
  const distrito = distritoSelect.value.toLowerCase();
  const visibles = CANCHAS.filter((c) => {
    const matchTexto = !texto || c.nombre.toLowerCase().includes(texto) || c.distrito.toLowerCase().includes(texto);
    const matchDistrito = !distrito || c.distrito.toLowerCase() === distrito;
    return matchTexto && matchDistrito;
  });
  grid.innerHTML = "";
  if (!visibles.length) {
    grid.innerHTML = `<p class="empty-state">No encontramos canchas con ese filtro.</p>`;
  } else {
    visibles.forEach((c) => grid.appendChild(tarjeta(c)));
  }
  contador.textContent = `${visibles.length} cancha${visibles.length === 1 ? "" : "s"} encontrada${visibles.length === 1 ? "" : "s"}`;
}

buscarInput.addEventListener("input", render);
distritoSelect.addEventListener("change", render);

render();

// Trae todas las reseñas en una sola consulta (catálogo chico, no hace falta
// paginar) y vuelve a pintar las estrellas de cada tarjeta ya visible.
(async () => {
  try {
    const mod = await import("./firebase-app.js?v=13");
    fb = mod;
    if (fb.CONFIG_IS_PLACEHOLDER) return;
    const snap = await fb.getDocs(fb.collection(fb.db, "resenas_canchas"));
    resenasPorClub = {};
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (!d.clubId) return;
      resenasPorClub[d.clubId] = resenasPorClub[d.clubId] || [];
      resenasPorClub[d.clubId].push(d);
    });
    render();
  } catch (err) {
    // Sin conexión o reglas aún no configuradas: el catálogo sigue
    // funcionando, solo sin calificaciones.
  }
})();
