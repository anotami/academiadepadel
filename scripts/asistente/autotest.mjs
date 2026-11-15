// Pruebas sin conexión: node autotest.mjs
import { planificar } from "./logica.mjs";

const base = () => ({
  profesor: { id: "prof", nombre: "Gabriel" },
  alumnos: [
    { id: "a1", nombre: "Karla Pereda", telefono: "999111222" }, { id: "a2", nombre: "Nicolás Danilo Iglesias Parra", telefono: "987051137" },
    { id: "a3", nombre: "Bryan Yataco" }, { id: "a4", nombre: "José Alfonso Jara" }, { id: "a5", nombre: "José Luis Ramos" }
  ],
  pistas: [
    { id: "p1", nombre: "Club Pádel Lima (La Once)", distrito: "Surquillo", estadoPista: "Habilitada" },
    { id: "p2", nombre: "Club adidas X3", distrito: "Miraflores", estadoPista: "Habilitada" },
    { id: "p3", nombre: "Bohemia Pádel Club", distrito: "San Borja", estadoPista: "Bloqueada" }
  ],
  paquetes: [
    { id: "pq1", alumnoId: "a1", tipo: "4 clases", clasesTotales: 4, clasesUsadas: 2, creadoEnSeg: 1 },
    { id: "pq2", alumnoId: "a2", tipo: "4 clases", clasesTotales: 4, clasesUsadas: 4, creadoEnSeg: 1 }
  ],
  reservas: [
    { id: "r1", alumnoId: "a1", alumnoNombre: "Karla Pereda", pistaId: "p1", pistaNombre: "Club Pádel Lima (La Once) — Surquillo", fecha: "2026-11-10", hora: "16:00", estado: "confirmada", tipoClase: "Clase grupal", paqueteId: "pq1", montoCobrado: null },
    { id: "r2", alumnoId: "a3", alumnoNombre: "Bryan Yataco", pistaId: "p1", pistaNombre: "Club Pádel Lima (La Once) — Surquillo", fecha: "2026-11-10", hora: "16:00", estado: "confirmada", tipoClase: "Clase grupal", montoCobrado: 75, grupoId: "g1" }
  ]
});

let fallos = 0;
const ok = (cond, nombre, detalle = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${nombre}${cond ? "" : "  → " + detalle}`); if (!cond) fallos++; };
const plan = (lote, e = base()) => planificar(e, lote);
const acc = (p, col, tipo) => p.acciones.filter((a) => a.col === col && a.tipo === tipo);

// alumnos
let p = plan([{ op: "alumno.crear", nombre: "María López", telefono: "987654321", nivel: "Inicial", programa: "Clase individual" }]);
ok(!p.errores.length && acc(p, "usuarios", "crear").length === 1, "alumno.crear crea 1 alumno", p.errores.join());
p = plan([{ op: "alumno.crear", nombre: "karla pereda" }]);
ok(p.errores.length === 1 && /ya existe/i.test(p.errores[0]), "alumno.crear rechaza duplicado por nombre", p.errores.join());
p = plan([{ op: "alumno.crear", nombre: "Otro", telefono: "999 111 222" }]);
ok(p.errores.length === 1, "alumno.crear rechaza duplicado por teléfono", p.errores.join());
p = plan([{ op: "alumno.crear", nombre: "Pepe", nivel: "Avanzado" }]);
ok(p.errores.length === 1, "alumno.crear rechaza nivel inválido");
p = plan([{ op: "alumno.modificar", alumno: "Karla", cambios: { telefono: "999000111", nivel: "Intermedio" } }]);
ok(!p.errores.length && p.acciones[0].antes.telefono === "999111222", "alumno.modificar cambia y guarda el valor anterior", p.errores.join());
p = plan([{ op: "alumno.modificar", alumno: "Karla", cambios: { rol: "profesor" } }]);
ok(p.errores.length === 1, "alumno.modificar no deja cambiar el rol");
p = plan([{ op: "alumno.modificar", alumno: "José", cambios: { nivel: "Inicial" } }]);
ok(p.errores.length === 1 && /ambiguo/i.test(p.errores[0]), "nombre ambiguo se rechaza, no se adivina", p.errores.join());

// clases
p = plan([{ op: "clase.crear", alumnos: ["Karla"], pista: "La Once", fecha: "2026-11-15", hora: "07:00", tipoClase: "Clase individual", modalidad: "Particular" }]);
let r = acc(p, "reservas", "crear")[0];
ok(!p.errores.length && r && r.datos.paqueteId === "pq1" && r.datos.montoCobrado === null && r.datos.canchaBeelup === "2", "clase.crear usa el paquete activo y marca cancha Beelup", p.errores.join());
ok(acc(p, "paquetes", "actualizar")[0]?.cambios.clasesUsadas === 3, "…y sube el contador del paquete (2→3)");
p = plan([{ op: "clase.crear", alumnos: ["Nicolás", "Bryan"], pista: "X3", fecha: "2026-11-16", hora: "08:00", tipoClase: "Clase grupal", costoCanchaTotal: 80 }]);
const rs = acc(p, "reservas", "crear");
ok(!p.errores.length && rs.length === 2 && rs.every((x) => x.datos.costoCanchaPagado === undefined) && acc(p, "costos_reservas", "crear").length === 2 && acc(p, "costos_reservas", "crear").every((x) => x.datos.costoCanchaPagado === 40), "clase grupal reparte la cancha (80 → 40 c/u) y la guarda PRIVADA, no en la reserva", p.errores.join());
ok(rs.every((x) => x.datos.montoCobrado === 75 && x.datos.modalidad === "Grupal (2-4 personas)"), "…cobro suelto de grupal (S/75) si el paquete está agotado");
p = plan([{ op: "clase.crear", alumnos: ["Bryan"], pista: "La Once", fecha: "2026-11-10", hora: "16:00", tipoClase: "Clase grupal" }]);
ok(p.errores.length === 1 && /ya tiene esa clase/i.test(p.errores[0]), "clase.crear no duplica una clase existente", p.errores.join());
p = plan([
  { op: "clase.crear", alumnos: ["Bryan"], pista: "X3", fecha: "2026-11-20", hora: "09:00", tipoClase: "Clase individual" },
  { op: "clase.crear", alumnos: ["Bryan"], pista: "X3", fecha: "2026-11-20", hora: "09:00", tipoClase: "Clase individual" }]);
ok(p.errores.length === 1 && acc(p, "reservas", "crear").length === 1, "duplicado dentro del mismo lote: la segunda falla y la primera queda");
// error a mitad no deja medias acciones (Karla usa paquete, Bryan duplicado)
p = plan([{ op: "clase.crear", alumnos: ["Karla", "Bryan"], pista: "La Once", fecha: "2026-11-10", hora: "16:00", tipoClase: "Clase grupal" }]);
ok(p.errores.length === 1 && p.acciones.length === 0, "una operación que falla no deja acciones a medias", JSON.stringify(p.acciones));
p = plan([
  { op: "clase.crear", alumnos: ["Karla", "Bryan"], pista: "La Once", fecha: "2026-11-10", hora: "16:00", tipoClase: "Clase grupal" },
  { op: "clase.crear", alumnos: ["Karla"], pista: "X3", fecha: "2026-11-18", hora: "07:00", tipoClase: "Clase individual" }]);
ok(acc(p, "paquetes", "actualizar").length === 1 && acc(p, "paquetes", "actualizar")[0].cambios.clasesUsadas === 3, "…y la operación siguiente parte del estado correcto (paquete 2→3, no 2→4)", JSON.stringify(acc(p, "paquetes", "actualizar")));
p = plan([{ op: "clase.crear", alumnos: ["Karla"], pista: "X3", fecha: "2026-11-20", hora: "25:00", tipoClase: "Clase individual" }]);
ok(p.errores.length === 1, "clase.crear valida la hora");
p = plan([{ op: "clase.crear", alumnos: ["Karla"], pista: "Bohemia", fecha: "2026-11-20", hora: "07:00", tipoClase: "Clase individual" }]);
ok(!p.errores.length && /Bloqueada/.test(p.lineas[0]), "pista bloqueada: avisa pero deja decidir");

// modificar / borrar / cerrar
p = plan([{ op: "clase.modificar", alumno: "Bryan", fecha: "2026-11-10", cambios: { fecha: "2026-11-11", hora: "17:00" } }]);
ok(!p.errores.length && p.acciones[0].cambios.fecha === "2026-11-11" && /Grupo fijo/.test(p.lineas[0]), "clase.modificar mueve de día y avisa si viene de un Grupo fijo", p.errores.join());
p = plan([{ op: "clase.modificar", alumno: "Karla", fecha: "2026-11-10", cambios: { estado: "cancelada" } }]);
ok(acc(p, "paquetes", "actualizar")[0]?.cambios.clasesUsadas === 1, "cancelar una clase de paquete devuelve la clase (2→1)", JSON.stringify(p.acciones));
p = plan([{ op: "clase.modificar", alumno: "Karla", fecha: "2026-11-10", cambios: { montoCobrado: 50 } }]);
ok(p.errores.length === 1, "no se puede poner monto a una clase ya cobrada en paquete");
p = plan([{ op: "clase.borrar", alumno: "Karla", fecha: "2026-11-10" }]);
ok(p.borra && acc(p, "reservas", "borrar").length === 1 && acc(p, "paquetes", "actualizar")[0]?.cambios.clasesUsadas === 1, "clase.borrar devuelve la clase al paquete y se marca como borrado", JSON.stringify(p.acciones));
p = plan([{ op: "clase.borrar", alumno: "Karla", fecha: "2026-12-31" }]);
ok(p.errores.length === 1, "borrar una clase que no existe da error");
p = plan([{ op: "clase.cerrar", alumno: "Bryan", fecha: "2026-11-10", asistio: true, comentario: "Buen saque", nivelTrabajado: "Intermedio" }]);
ok(!p.errores.length && p.acciones[0].cambios.registrada === true, "clase.cerrar marca asistencia y feedback", p.errores.join());
const e2 = base(); e2.paquetes.push({ id: "pq3", alumnoId: "a3", tipo: "4 clases", clasesTotales: 4, clasesUsadas: 0, creadoEnSeg: 1 });
p = plan([{ op: "clase.cerrar", alumno: "Bryan", fecha: "2026-11-10", asistio: true }], e2);
ok(acc(p, "paquetes", "actualizar")[0]?.cambios.clasesUsadas === 1, "cerrar una clase de Grupo fijo descuenta del paquete (como el panel)");
p = plan([{ op: "clase.cerrar", alumno: "Bryan", fecha: "2026-11-10", asistio: false }], e2);
ok(acc(p, "paquetes", "actualizar").length === 0, "si no asistió, no descuenta del paquete");
p = plan([{ op: "clase.cerrar", alumno: "Karla", fecha: "2026-11-10", asistio: false }]);
ok(acc(p, "paquetes", "actualizar")[0]?.cambios.clasesUsadas === 1 && acc(p, "reservas", "actualizar").some((a) => a.cambios.paqueteId === null && a.cambios.paqueteDevuelto === "pq1"), "no asistió: devuelve la clase del paquete y lo anota", JSON.stringify(p.acciones));
p = plan([{ op: "alumno.crear", nombre: "Pedro Nuevo", telefono: "123", pendiente: "Pedirle su DNI" }]);
ok(p.pendientes.length === 2 && p.pendientes[0].titulo === "Pedirle su DNI" && p.pendientes[1].titulo.startsWith("Revisar:") && p.pendientes[0].destino === "alumnos", "pendientes: los explícitos y los avisos ⚠ quedan listos para el panel", JSON.stringify(p.pendientes));
p = plan([{ op: "clase.modificar", alumno: "Karla", fecha: "2026-11-10", cambios: { costoCanchaPagado: 55 } }]);
ok(!p.errores.length && acc(p, "costos_reservas", "crear")[0]?.datos.costoCanchaPagado === 55 && !acc(p, "reservas", "actualizar").some((a) => "costoCanchaPagado" in a.cambios && a.cambios.costoCanchaPagado !== null), "modificar el costo de cancha va a la colección privada", p.errores.join());
p = plan([{ op: "inventada" }]);
ok(p.errores.length === 1, "operación desconocida se rechaza");

console.log(fallos ? `\n${fallos} FALLOS` : "\nTodas las pruebas pasan.");
process.exit(fallos ? 1 : 0);
