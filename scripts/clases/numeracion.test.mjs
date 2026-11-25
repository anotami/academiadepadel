// Pruebas sin conexión de la numeración de clases: node scripts/clases/numeracion.test.mjs
import { planNumerar, auditarClases, formatoCodigo, agruparSesiones } from "../../assets/js/numeracion-calculo.js";
let fallos = 0; const ok = (c, n, d = "") => { console.log(`${c ? "PASS" : "FAIL"}  ${n}${c ? "" : "  → " + d}`); if (!c) fallos++; };
const R = (id, o = {}) => ({ id, alumnoId: "a" + id, alumnoNombre: "Alumno " + id, pistaId: "p1", pistaNombre: "Club adidas X3", fecha: "2026-11-20", hora: "07:00", tipoClase: "Adultos", estado: "confirmada", montoCobrado: 120, ...o });

ok(formatoCodigo(7) === "C-0007" && formatoCodigo(1234) === "C-1234" && formatoCodigo(12345) === "C-12345", "formato C-0001 (rellena a 4 y no corta)");

// orden cronológico y grupal = 1 número
let rs = [R("1", { fecha: "2026-11-22" }), R("2", { fecha: "2026-11-20", hora: "09:00" }), R("3", { fecha: "2026-11-20", hora: "09:00" }), R("4", { fecha: "2026-11-20", hora: "07:00" })];
let p = planNumerar(rs, 1);
ok(p.asignaciones.length === 3 && p.cantidadNuevos === 3, "3 clases distintas (el grupo de 2 cuenta una)", JSON.stringify(p.asignaciones.map((a) => a.claseNum)));
ok(p.asignaciones.map((a) => a.claseNum).join() === "1,2,3" && p.asignaciones[0].sesion[0].id === "4", "numera de la más vieja a la más nueva", p.asignaciones.map((a) => a.sesion[0].id).join());
ok(p.asignaciones[1].reservasSinNumero.length === 2, "el grupo comparte el mismo número entre sus 2 alumnos");
ok(planNumerar(rs, 153).asignaciones[0].claseNum === 153 && planNumerar(rs, 153).siguiente === 156, "respeta desde qué número empezar");

// no numera canceladas, pendientes ni rechazadas; no pisa las que ya tienen
rs = [R("1", { estado: "cancelada" }), R("2", { estado: "pendiente", hora: "08:00" }), R("3", { estado: "rechazada", hora: "09:00" }), R("4", { hora: "10:00", claseNum: 5, claseCodigo: "C-0005" }), R("5", { hora: "11:00" })];
p = planNumerar(rs, 6);
ok(p.asignaciones.length === 1 && p.asignaciones[0].sesion[0].id === "5" && p.asignaciones[0].claseNum === 6, "solo numera confirmadas sin número y no pisa las numeradas", JSON.stringify(p.asignaciones.map((a) => a.sesion[0].id)));

// alumno nuevo en clase ya numerada: hereda
rs = [R("1", { claseNum: 9, claseCodigo: "C-0009" }), R("2")];
p = planNumerar(rs, 20);
ok(p.asignaciones.length === 1 && p.asignaciones[0].claseNum === 9 && !p.asignaciones[0].nueva && p.cantidadNuevos === 0, "un alumno agregado a una clase ya numerada hereda su número", JSON.stringify(p.asignaciones));
ok(planNumerar([], 1).asignaciones.length === 0, "sin clases no hace nada");
ok(planNumerar([R("1", { claseNum: 1 })], 2).asignaciones.length === 0, "idempotente: si todo está numerado, no hay cambios");

// auditoría
rs = [
  R("1", { claseNum: 1 }), R("2", { claseNum: 3, hora: "08:00" }),                                  // hueco: falta el 2
  R("3", { claseNum: 4, hora: "09:00", pistaNombre: "" }),                                          // sin sede
  R("4", { hora: "10:00", montoCobrado: undefined }),                                               // sin número y sin pago
  R("5", { claseNum: 5, hora: "11:00" }), R("6", { claseNum: 5, hora: "12:00" }),                    // número repetido
  R("7", { claseNum: 6, hora: "13:00" }), R("8", { claseNum: 7, hora: "13:00" }),                    // dos números en la misma clase
  R("9", { claseNum: 10, hora: "14:00", paqueteId: "pq1", montoCobrado: null })                       // paquete
];
const a = auditarClases(rs, { pq1: "4 clases" });
const f = (h) => a.filas.find((x) => x.hora === h);
ok(a.huecos.join() === "2,8,9", "detecta los números que faltan en la secuencia", a.huecos.join());
ok(f("09:00").problemas.includes("Sin sede"), "marca clase sin sede");
ok(f("10:00").problemas.includes("Sin número") && f("10:00").problemas.includes("Sin pago cargado"), "marca clase sin número y sin pago");
ok(f("11:00").problemas.includes("Número repetido en otra clase"), "marca número repetido en otra clase");
ok(f("13:00").problemas.includes("Dos números en la misma clase"), "marca dos números en una misma clase");
ok(f("14:00").alumnos[0].pago === "Paquete 4 clases" && !f("14:00").problemas.length, "una clase con paquete cuenta como pagada y sin problemas");
ok(f("07:00").problemas.length === 0 && a.minimo === 1 && a.maximo === 10, "una clase completa no tiene problemas; rango 1 a 10");
ok(agruparSesiones([R("1"), R("2")]).length === 1, "mismo pista+fecha+hora = misma clase");
console.log(fallos ? `\n${fallos} FALLO(S)` : "\nTodas las pruebas pasan"); process.exit(fallos ? 1 : 0);
