// Recalcula precio_venta_PEN de tienda/productos.csv desde el CSV interno de proveedores.
// Uso: node scripts/tienda-precios.mjs RUTA/interno_proveedores_web_v1.csv [--aplicar]
// Regla: costo >= 400 -> costo x 1.10 ; costo < 400 -> costo x 1.15 ; redondeo al sol entero.
// El archivo interno (costos y proveedores) NO debe vivir en este repo: la web es pública.
import fs from "node:fs";
function parse(txt) {
  const rows = []; let f = "", r = [], q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { r.push(f); f = ""; }
    else if (c === "\n") { r.push(f); rows.push(r); r = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}
const esc = (v) => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
const [interno, flag] = process.argv.slice(2);
if (!interno) { console.error("Falta la ruta del CSV interno"); process.exit(1); }
const int = parse(fs.readFileSync(interno, "utf8")); const ih = int.shift();
const costo = {}; for (const r of int) if (r[0]) costo[r[0]] = parseFloat(r[ih.indexOf("precio_costo")]);
const url = new URL("../tienda/productos.csv", import.meta.url);
const web = parse(fs.readFileSync(url, "utf8")); const wh = web.shift();
const ip = wh.indexOf("precio_venta_PEN"); let cambios = 0, sinCosto = [];
for (const r of web) {
  if (!r[0]) continue;
  const c = costo[r[0]]; if (!(c > 0)) { sinCosto.push(r[0]); continue; }
  const nuevo = String(Math.round(c * (c >= 400 ? 1.10 : 1.15)));
  if (r[ip] !== nuevo) { cambios++; r[ip] = nuevo; }
}
const nuevos = Object.keys(costo).filter((c) => !web.some((r) => r[0] === c));
console.log(`Cambian ${cambios} precios · sin costo: ${sinCosto.length} · en el archivo y no en la tienda: ${nuevos.length}`);
if (flag === "--aplicar") fs.writeFileSync(url, [wh, ...web].map((r) => r.map(esc).join(",")).join("\n") + "\n");
else console.log("Simulación. Agrega --aplicar para escribir tienda/productos.csv");
