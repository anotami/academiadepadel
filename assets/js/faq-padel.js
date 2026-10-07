// Preguntas frecuentes de pádel y arbitraje + evaluación de 10 preguntas al
// azar. 100% local: no depende de Firebase, solo del banco de datos estático
// (faq-padel-data.js). Página general del sitio, independiente del árbitro.
import { FAQ_CATEGORIAS, FAQ_ITEMS } from "./faq-padel-data.js?v=1";

function $(id) { return document.getElementById(id); }

// ---------------- Pestañas principales ----------------
document.querySelectorAll(".faq-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".faq-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".faq-view").forEach((v) => v.classList.remove("active"));
    tab.classList.add("active");
    $(tab.dataset.vista === "faq" ? "vistaFaq" : "vistaEvaluacion").classList.add("active");
  });
});

// ---------------- Vista: Preguntas frecuentes ----------------
let filtroCategoria = "todas";
let filtroTexto = "";

function construirChipsCategoria() {
  const cont = $("faqCategoriaChips");
  cont.innerHTML = "";
  const todas = document.createElement("button");
  todas.type = "button";
  todas.className = "faq-chip active";
  todas.textContent = `Todas (${FAQ_ITEMS.length})`;
  todas.addEventListener("click", () => { filtroCategoria = "todas"; marcarChipActivo(todas); renderFaqLista(); });
  cont.appendChild(todas);

  FAQ_CATEGORIAS.forEach((cat) => {
    const n = FAQ_ITEMS.filter((i) => i.categoria === cat.id).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "faq-chip";
    btn.textContent = `${cat.nombre} (${n})`;
    btn.addEventListener("click", () => { filtroCategoria = cat.id; marcarChipActivo(btn); renderFaqLista(); });
    cont.appendChild(btn);
  });
}

function marcarChipActivo(btn) {
  document.querySelectorAll("#faqCategoriaChips .faq-chip").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function coincide(item, texto) {
  if (!texto) return true;
  const t = texto.toLowerCase();
  return [item.pregunta, item.hechos, item.regla, item.decision].join(" ").toLowerCase().includes(t);
}

function renderFaqLista() {
  const lista = $("faqLista");
  lista.innerHTML = "";
  const categoriasAMostrar = filtroCategoria === "todas" ? FAQ_CATEGORIAS : FAQ_CATEGORIAS.filter((c) => c.id === filtroCategoria);
  let totalMostrado = 0;

  categoriasAMostrar.forEach((cat) => {
    const items = FAQ_ITEMS.filter((i) => i.categoria === cat.id && coincide(i, filtroTexto));
    if (!items.length) return;
    totalMostrado += items.length;

    const bloque = document.createElement("div");
    bloque.className = "faq-categoria";
    bloque.innerHTML = `<p class="faq-categoria-titulo">${cat.nombre} <span class="faq-conteo">(${items.length})</span></p>`;

    items.forEach((item) => {
      const det = document.createElement("details");
      det.className = "faq-item";
      det.innerHTML = `
        <summary>${item.pregunta}</summary>
        <div class="faq-item-body">
          <div class="faq-campo"><span class="faq-campo-label">Hechos comprobables</span>${item.hechos}</div>
          <div class="faq-campo"><span class="faq-campo-label">Regla o procedimiento</span>${item.regla}</div>
          <div class="faq-campo"><span class="faq-campo-label">Decisión y comunicación</span>${item.decision}</div>
          <p class="faq-fuente">Fuente: ${item.fuente}</p>
        </div>`;
      bloque.appendChild(det);
    });
    lista.appendChild(bloque);
  });

  $("faqContador").textContent = `${totalMostrado} pregunta(s) encontrada(s) de ${FAQ_ITEMS.length} en total.`;
  if (!totalMostrado) lista.innerHTML = '<p class="empty-state">No hay preguntas que coincidan con la búsqueda.</p>';
}

$("faqBuscar").addEventListener("input", (e) => { filtroTexto = e.target.value.trim(); renderFaqLista(); });

// ---------------- Vista: Evaluación ----------------
function barajar(array) {
  const copia = array.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Genera las 4 opciones de una pregunta: la respuesta correcta (su propia
// "decisión") más 3 distractores tomados de la "decisión" de otras
// preguntas — preferentemente de la misma categoría, para que sean
// plausibles, sin tener que redactar opciones a mano para cada una de las 112.
function generarOpciones(item) {
  const mismaCategoria = FAQ_ITEMS.filter((i) => i.id !== item.id && i.categoria === item.categoria);
  const otras = FAQ_ITEMS.filter((i) => i.id !== item.id && i.categoria !== item.categoria);
  const candidatos = barajar(mismaCategoria).concat(barajar(otras));
  const distractores = [];
  for (const c of candidatos) {
    if (distractores.length >= 3) break;
    if (c.decision !== item.decision && !distractores.includes(c.decision)) distractores.push(c.decision);
  }
  const opciones = barajar([item.decision, ...distractores]);
  return { opciones, indiceCorrecto: opciones.indexOf(item.decision) };
}

let preguntasEvaluacion = [];

function iniciarEvaluacion() {
  preguntasEvaluacion = barajar(FAQ_ITEMS).slice(0, 10).map((item) => {
    const { opciones, indiceCorrecto } = generarOpciones(item);
    return { item, opciones, indiceCorrecto };
  });

  $("evalIntro").hidden = true;
  $("evalResultado").hidden = true;
  const form = $("evalForm");
  form.hidden = false;
  form.innerHTML = "";

  preguntasEvaluacion.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "eval-pregunta";
    div.innerHTML = `
      <h4>${idx + 1}. ${p.item.pregunta}</h4>
      <p class="field-hint">${p.item.hechos}</p>
      <div class="eval-opciones" data-idx="${idx}"></div>
    `;
    const cont = div.querySelector(".eval-opciones");
    p.opciones.forEach((op, opIdx) => {
      const label = document.createElement("label");
      label.className = "eval-opcion";
      label.innerHTML = `<input type="radio" name="p${idx}" value="${opIdx}" required> <span>${op}</span>`;
      cont.appendChild(label);
    });
    form.appendChild(div);
  });

  const btnEnviar = document.createElement("button");
  btnEnviar.type = "submit";
  btnEnviar.className = "btn btn-primary btn-large";
  btnEnviar.textContent = "Corregir evaluación";
  form.appendChild(btnEnviar);
}

function corregirEvaluacion(e) {
  e.preventDefault();
  const form = $("evalForm");
  let aciertos = 0;

  preguntasEvaluacion.forEach((p, idx) => {
    const seleccion = form.querySelector(`input[name="p${idx}"]:checked`);
    const seleccionIdx = seleccion ? Number(seleccion.value) : -1;
    const correcto = seleccionIdx === p.indiceCorrecto;
    if (correcto) aciertos++;

    const cont = form.querySelector(`.eval-opciones[data-idx="${idx}"]`);
    cont.querySelectorAll(".eval-opcion").forEach((label, opIdx) => {
      label.querySelector("input").disabled = true;
      if (opIdx === p.indiceCorrecto) label.classList.add("correcta");
      else if (opIdx === seleccionIdx) label.classList.add("incorrecta");
    });

    const resultado = document.createElement("p");
    resultado.className = `eval-pregunta-resultado ${correcto ? "ok" : "fail"}`;
    resultado.textContent = correcto ? "✓ Correcto" : "✗ Incorrecto";
    const explicacion = document.createElement("p");
    explicacion.className = "eval-explicacion";
    explicacion.innerHTML = `<strong>Regla:</strong> ${p.item.regla} <br><small>Fuente: ${p.item.fuente}</small>`;
    cont.after(resultado, explicacion);
  });

  form.querySelector('button[type="submit"]').disabled = true;

  const resultadoBox = $("evalResultado");
  resultadoBox.hidden = false;
  resultadoBox.innerHTML = `
    <div class="portal-card">
      <p class="eval-puntaje">${aciertos} / 10</p>
      <p>${aciertos >= 8 ? "¡Muy bien! Dominas el material." : aciertos >= 5 ? "Vas bien, repasa las que fallaste." : "Conviene repasar el banco de preguntas antes de arbitrar un torneo."}</p>
      <button class="btn btn-outline" id="btnRepetirEval">Repetir con 10 preguntas nuevas</button>
    </div>`;
  $("btnRepetirEval").addEventListener("click", iniciarEvaluacion);
  resultadoBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

$("btnEmpezarEval").addEventListener("click", iniciarEvaluacion);
$("evalForm").addEventListener("submit", corregirEvaluacion);

// ---------------- Inicialización ----------------
construirChipsCategoria();
renderFaqLista();
