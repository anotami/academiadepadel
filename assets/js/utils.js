// Utilidades compartidas por los módulos del sitio y del portal.

const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

// Escapa texto antes de insertarlo vía innerHTML — usar siempre que el dato
// venga de un usuario (formulario, Firestore) y no sea un literal fijo del código.
export function escapeHtml(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}
