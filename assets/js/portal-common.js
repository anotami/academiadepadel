// Constantes compartidas por todo el portal (login, alumno, profesor, setup).

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DIAS_CORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Nombre/cancha de una pista -> prioridad de sede (0 Club adidas X3, 1 La
// Once, 2 Padel Center Benavides, 3 el resto). Son las 3 sedes donde
// Gabriel realmente dicta clase hoy (ver masthead de index.html) — se usa
// para mostrarlas primero/destacadas en selectores de pista (pistas-page.js,
// disponibilidad-page.js) en vez de orden alfabético plano.
export function prioridadNombreSede(nombre, cancha) {
  const n = (nombre || "").toLowerCase();
  const c = (cancha || "").toLowerCase();
  if (n.includes("x3")) return 0;
  if (n.includes("once") || c.includes("11")) return 1;
  if (n.includes("benavides")) return 2;
  return 3;
}

// Bloques de disponibilidad de 2 horas, de 6:00 a 22:00 (8 bloques/día).
// Generados en vez de escritos a mano para que horaAFranja() siempre calce
// con la lista real, sin importar si se ajusta el rango o el paso.
const FRANJA_INICIO = 6;
const FRANJA_FIN = 22;
const FRANJA_PASO = 2;

export const FRANJAS = [];
for (let h = FRANJA_INICIO; h < FRANJA_FIN; h += FRANJA_PASO) {
  FRANJAS.push(`${h}:00–${h + FRANJA_PASO}:00`);
}

// Horas sueltas para agendar una clase puntual (reserva con fecha exacta).
export const HORAS_RESERVA = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00"
];

export function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}/${y}`;
}

// Tipos de clase ofrecidos, tomados directamente de index.html (secciones
// #programas, #clinicas y #ofertas) para que el portal no invente oferta nueva.
export const TIPOS_CLASE = [
  {
    grupo: "Programas regulares",
    opciones: ["Junior (8-15 años)", "Adultos — Mujeres", "Adultos — Ejecutivos", "Clase individual"]
  },
  {
    grupo: "Clínicas de Un Solo Golpe · Nivel inicial",
    opciones: ["Mejora tu derecha", "Domina el saque", "Perfecciona tu volea", "Suma el revés"]
  },
  {
    grupo: "Clínicas de Un Solo Golpe · Nivel intermedio",
    opciones: ["Domina la salida de pared", "Deja de chocar con tu compañero", "La bandeja en 1 hora"]
  },
  {
    grupo: "Otros",
    opciones: ["Jornada gratuita ¡Conociendo el Pádel!", "Tour de Pádel"]
  }
];

// Precios de "Clase suelta" (sin paquete), tal como están en index.html
// #precios — el monto es por persona. Si cambian ahí, actualizar acá también.
export const PRECIOS_CLASE_SUELTA = {
  "Particular": 120,
  "Grupal (2-4 personas)": 75
};

// Día de la semana (en español, como en DIAS) a partir de una fecha "YYYY-MM-DD".
export function diaDeSemana(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay(); // 0 = domingo ... 6 = sábado
  return DIAS[(jsDay + 6) % 7]; // reordena para que 0 = Lunes ... 6 = Domingo
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// "2026-11-07" -> "sábado 7 de noviembre" — para eventos puntuales con fecha
// concreta (ej. la clínica gratuita mensual), a diferencia de un turno
// recurrente semanal que solo tiene un horario en texto libre.
export function formatearFechaLarga(fechaStr) {
  const [, m, d] = fechaStr.split("-").map(Number);
  return `${diaDeSemana(fechaStr).toLowerCase()} ${d} de ${MESES[m - 1]}`;
}

// Convierte una hora suelta ("06:00".."21:00") en su franja de disponibilidad.
export function horaAFranja(hora) {
  const h = Number(hora.split(":")[0]);
  const idx = Math.floor((h - FRANJA_INICIO) / FRANJA_PASO);
  return FRANJAS[Math.max(0, Math.min(idx, FRANJAS.length - 1))];
}

export function estaDisponible(disponibilidad, dia, franja) {
  return (disponibilidad || []).some((d) => d.dia === dia && d.franja === franja);
}

// Grilla compacta día×franja para elegir disponibilidad (reemplaza la lista
// larga de checkboxes de "Lunes · Mañana (6:00–10:00)" uno debajo del otro).
// Franjas en filas, días en columnas, con la columna de franja fija (sticky)
// para poder desplazar horizontal en pantallas angostas sin perder la fila.
//
// container: el elemento donde se arma la grilla.
// opciones.editable: si es false, las celdas quedan solo de lectura.
// opciones.marcadas: array [{dia, franja}] ya seleccionado (al editar un perfil existente).
//
// Devuelve { obtenerSeleccion(), seleccionarTodo(valor) } para que cada
// pantalla lea la selección al guardar y arme sus propios botones de
// "Marcar todo" / "Limpiar todo" si quiere.
export function construirGrillaDisponibilidad(container, { editable = true, marcadas = [] } = {}) {
  const marcadasSet = new Set((marcadas || []).map((d) => `${d.dia}|${d.franja}`));
  container.classList.add("disp-grid");
  container.innerHTML = "";

  const headRow = document.createElement("div");
  headRow.className = "disp-row disp-row-head";
  headRow.innerHTML = `<span class="disp-cell disp-cell-corner"></span>` +
    DIAS.map((dia, i) => `<span class="disp-cell disp-cell-head" title="${dia}">${DIAS_CORTO[i]}</span>`).join("");
  container.appendChild(headRow);

  FRANJAS.forEach((franja) => {
    const row = document.createElement("div");
    row.className = "disp-row";
    row.innerHTML = `<span class="disp-cell disp-cell-label">${franja}</span>`;
    DIAS.forEach((dia) => {
      const checked = marcadasSet.has(`${dia}|${franja}`);
      const cell = document.createElement(editable ? "button" : "span");
      if (editable) cell.type = "button";
      cell.className = "disp-cell disp-toggle" + (checked ? " on" : "");
      cell.dataset.dia = dia;
      cell.dataset.franja = franja;
      cell.setAttribute("aria-pressed", checked ? "true" : "false");
      cell.setAttribute("aria-label", `${dia}, ${franja}`);
      if (editable) {
        cell.addEventListener("click", () => {
          const on = !cell.classList.contains("on");
          cell.classList.toggle("on", on);
          cell.setAttribute("aria-pressed", on ? "true" : "false");
        });
      } else if (!checked) {
        cell.classList.add("disp-off");
      }
      row.appendChild(cell);
    });
    container.appendChild(row);
  });

  return {
    obtenerSeleccion() {
      return Array.from(container.querySelectorAll(".disp-toggle.on")).map((el) => ({
        dia: el.dataset.dia,
        franja: el.dataset.franja
      }));
    },
    seleccionarTodo(valor) {
      container.querySelectorAll(".disp-toggle").forEach((el) => {
        el.classList.toggle("on", valor);
        el.setAttribute("aria-pressed", valor ? "true" : "false");
      });
    }
  };
}

// Grilla franja×día para el horario de UNA PISTA, con 2 niveles de tarifa
// (sin luz / con luz) en vez de un simple sí/no: muchas canchas cobran más
// de noche porque prenden reflectores. Un clic va rotando cada celda entre
// 3 estados: libre -> sin luz -> con luz -> libre.
//
// El resultado de obtenerSeleccion() es [{dia, franja, tarifa}], con
// tarifa "sin-luz" o "con-luz" — estaDisponible() sigue funcionando igual
// sobre este array (solo mira dia/franja, ignora el campo tarifa de más).
export function construirGrillaTarifaPista(container, { editable = true, marcadas = [] } = {}) {
  const mapaMarcadas = new Map((marcadas || []).map((d) => [`${d.dia}|${d.franja}`, d.tarifa || "sin-luz"]));
  container.classList.add("disp-grid");
  container.innerHTML = "";

  const headRow = document.createElement("div");
  headRow.className = "disp-row disp-row-head";
  headRow.innerHTML = `<span class="disp-cell disp-cell-corner"></span>` +
    DIAS.map((dia, i) => `<span class="disp-cell disp-cell-head" title="${dia}">${DIAS_CORTO[i]}</span>`).join("");
  container.appendChild(headRow);

  function etiqueta(estado) {
    return estado === "con-luz" ? "con luz" : estado === "sin-luz" ? "sin luz" : "no disponible";
  }
  function pintar(cell, estado) {
    cell.dataset.estado = estado || "";
    cell.className = "disp-cell disp-toggle" + (estado ? ` tarifa-${estado}` : " disp-off");
    cell.setAttribute("aria-label", `${cell.dataset.dia}, ${cell.dataset.franja}: ${etiqueta(estado)}`);
  }

  FRANJAS.forEach((franja) => {
    const row = document.createElement("div");
    row.className = "disp-row";
    row.innerHTML = `<span class="disp-cell disp-cell-label">${franja}</span>`;
    DIAS.forEach((dia) => {
      const estado = mapaMarcadas.get(`${dia}|${franja}`) || null;
      const cell = document.createElement(editable ? "button" : "span");
      if (editable) cell.type = "button";
      cell.dataset.dia = dia;
      cell.dataset.franja = franja;
      pintar(cell, estado);
      if (editable) {
        cell.addEventListener("click", () => {
          const actual = cell.dataset.estado || "";
          const siguiente = actual === "" ? "sin-luz" : actual === "sin-luz" ? "con-luz" : "";
          pintar(cell, siguiente || null);
        });
      }
      row.appendChild(cell);
    });
    container.appendChild(row);
  });

  return {
    obtenerSeleccion() {
      return Array.from(container.querySelectorAll(".disp-toggle"))
        .filter((el) => el.dataset.estado)
        .map((el) => ({ dia: el.dataset.dia, franja: el.dataset.franja, tarifa: el.dataset.estado }));
    },
    marcarTodoComo(tarifa) {
      container.querySelectorAll(".disp-toggle").forEach((el) => pintar(el, tarifa || null));
    }
  };
}

// Niveles de la metodología del sitio (sección #metodologia de index.html).
export const NIVELES = ["Iniciación", "Intermedio", "Consolidación"];

// ¿La fecha "YYYY-MM-DD" ya pasó (antes de hoy, no cuenta hoy)?
export function fechaYaPaso(fechaStr) {
  return fechaStr < new Date().toISOString().slice(0, 10);
}

// Solo los programas regulares (Junior / Adultos) se pagan por paquete de clases;
// las clínicas y ofertas de index.html se cobran aparte, por sesión.
export function esProgramaRegular(tipoClase) {
  return TIPOS_CLASE[0].opciones.includes(tipoClase);
}

// 1 a 12 clases — antes solo dejaba elegir 4 u 8, pero Gabriel arma
// paquetes a medida con cualquier cantidad.
export const TIPOS_PAQUETE = Array.from({ length: 12 }, (_, i) => i + 1)
  .map((n) => `${n} ${n === 1 ? "clase" : "clases"}`);

// Deja solo dígitos para armar un link wa.me a partir de un teléfono guardado
// con formato "+51 999 111 222".
export function soloDigitos(telefono) {
  return (telefono || "").replace(/\D/g, "");
}

// ---- Comunidad (directorio de jugadores, "falta el cuarto") ----

// Categorías de pádel estilo Argentina (1ra = nivel más alto), la misma
// convención que ya explica categorias-padel.html.
export const CATEGORIAS_COMUNIDAD = ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "7ma", "8va", "No sé / empezando"];
export const DISTRITOS_COMUNIDAD = ["Miraflores", "San Isidro", "Surco", "La Molina", "San Borja", "Barranco", "Otro"];
export const HORARIOS_COMUNIDAD = ["Mañana", "Tarde", "Noche"];
export const POSICIONES_COMUNIDAD = ["Drive", "Revés", "Indistinto"];

// Valida y normaliza un celular peruano a E.164 ("+51987654321"). Acepta con
// o sin 51/+51 adelante, con espacios/guiones/puntos. Devuelve null si no
// calza con un celular peruano real (9 dígitos, empieza con 9).
export function normalizarTelefonoPeru(valor) {
  let digitos = (valor || "").replace(/\D/g, "");
  if (digitos.startsWith("51") && digitos.length === 11) digitos = digitos.slice(2);
  if (digitos.length !== 9 || !digitos.startsWith("9")) return null;
  return "+51" + digitos;
}

// Compara una categoría de jugador contra una categoría objetivo, con
// margen opcional de ±1 (para "Falta el cuarto": buscar también un nivel
// arriba/abajo cuando falta gente exacta).
export function categoriaEnRango(categoria, objetivo, margen) {
  const idx = CATEGORIAS_COMUNIDAD.indexOf(categoria);
  const idxObjetivo = CATEGORIAS_COMUNIDAD.indexOf(objetivo);
  if (idx === -1 || idxObjetivo === -1) return categoria === objetivo;
  return Math.abs(idx - idxObjetivo) <= (margen || 0);
}

// ---- Heurísticas para el importador de un chat de WhatsApp exportado ----
// Ninguna de estas es infalible -- el admin siempre revisa/corrige cada fila
// en una tabla editable antes de guardar nada (ver "Importar desde WhatsApp").

// Busca un celular peruano suelto dentro de un texto libre (típico cuando el
// contacto no estaba guardado y WhatsApp exporta el número como remitente).
export function detectarTelefonoPeruEnTexto(texto) {
  const match = (texto || "").match(/(?:\+?51[\s.-]?)?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/);
  return match ? normalizarTelefonoPeru(match[0]) : null;
}

// Busca una categoría (1ra..8va) mencionada en el nombre o el mensaje -- ej.
// apodos de grupo tipo "Juan Pérez 4ta M" o mensajes "soy de 5ta".
export function detectarCategoriaEnTexto(texto) {
  const t = (texto || "").toLowerCase();
  const porSufijo = t.match(/\b([1-8])\s*(?:ra|da|ta|ma|va)\b/);
  if (porSufijo) {
    const candidata = CATEGORIAS_COMUNIDAD.find((c) => c.startsWith(porSufijo[1]));
    if (candidata) return candidata;
  }
  const porPalabra = t.match(/\bcat(?:egor[ií]a)?\.?\s*([1-8])\b/);
  if (porPalabra) {
    const candidata = CATEGORIAS_COMUNIDAD.find((c) => c.startsWith(porPalabra[1]));
    if (candidata) return candidata;
  }
  return "";
}

// Busca género mencionado como palabra completa -- deliberadamente NO
// detecta una "M"/"F" suelta (demasiados falsos positivos con iniciales de
// nombre), así que el admin suele tener que completarlo a mano.
export function detectarGeneroEnTexto(texto) {
  const t = (texto || "").toLowerCase();
  if (/\b(femenino|mujer|dama|fem\.?)\b/.test(t)) return "Femenino";
  if (/\b(masculino|var[oó]n|hombre|masc\.?)\b/.test(t)) return "Masculino";
  return "";
}
