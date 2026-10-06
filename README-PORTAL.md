# Portal de reservas (alumnos / profesor / pistas)

Módulo separado del sitio público: los alumnos piden clase, el profesor confirma
según cancha disponible, se lleva el seguimiento de paquetes, asistencia,
progreso, rentabilidad y retención. Vive en 6 páginas + Firebase como backend
(el sitio sigue siendo estático, apto para GitHub Pages).

## Páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `login.html` | Todos | Iniciar sesión o crear cuenta de alumno (con datos de apoderado si es menor de edad, y "quién te invitó"). Enlazado desde el botón "ACCESO PORTAL" del header. |
| `alumno.html` | Alumno | Paquete de clases, pedir una clase (con selector de profesor si hay más de uno), lista de espera si no hay cupo, cancelar/ver estado de sus reservas, "Mi progreso" (línea de tiempo del feedback), NPS post-clase, tablero "busco con quién jugar", editar sus datos. |
| `profesor.html` | Profesor | Resumen + rentabilidad real, seguimiento (alumnos en riesgo, paquetes por renovar, cobros pendientes, leads de la jornada gratis), solicitudes pendientes (con validación de disponibilidad), clases por registrar (asistencia + feedback), próximas clases (recordatorio + reprogramar), lista de espera, paquetes, disponibilidad de alumnos, exportar a CSV, sus propios datos (incluye costo por hora). |
| `pistas.html` | Alumno y profesor | Directorio de canchas; el profesor puede crear pistas nuevas y editar disponibilidad/estado/costo real de las existentes. |
| `setup.html` | Solo tú, una vez | Crea las 3 cuentas de ejemplo, siembra/reemplaza la lista de pistas, y una herramienta de prueba (reserva confirmada de ayer). No está enlazado desde ningún menú. |

Datos ya precargados en `assets/js/seed-data.js`: tu perfil de profesor, 2 alumnos
genéricos (Valeria Ramos y Diego Fernández — reemplázalos cuando tengas alumnos
reales) y 34 pistas reales de Lima.

## Cómo funciona, de punta a punta

1. **Disponibilidad:** profesor, cada pista y cada alumno tienen su propia disponibilidad semanal (día + franja), editable en sus respectivos paneles.
2. **Solicitud:** el alumno elige tipo de clase, profesor (si hay más de uno), pista, fecha y hora. Si el horario no calza con la disponibilidad habitual, se avisa (no bloquea). Si el horario ya está confirmado por otro alumno, puede anotarse en lista de espera. Queda `pendiente`.
3. **Validación y confirmación:** el profesor ve ✓/⚠ de disponibilidad propia y de la pista. Al confirmar, se revisa que no haya choque de horario. Si es un programa regular (Junior/Adultos) y el alumno tiene paquete activo, se descuenta una clase.
4. **Cancelación/reprogramación:** el alumno puede cancelar una clase confirmada futura (si cancela con ≥24h de anticipación y estaba ligada a un paquete, se le devuelve la clase). El profesor puede reprogramar fecha/hora de una clase confirmada.
5. **Después de la clase:** el profesor marca asistencia y deja nivel trabajado / comentario / próximo objetivo en "Clases por registrar" — el alumno lo ve en "Mi progreso".
6. **Feedback del alumno:** NPS (0–10) una sola vez por clase ya pasada.
7. **Recordatorio:** botón "Recordar" por WhatsApp en cada clase confirmada futura (manual, no automático).
8. **Paquetes:** el profesor activa 4/8 clases por alumno con monto y estado de pago. El alumno ve cuántas le quedan.
9. **Rentabilidad:** con el costo real de cada pista y tu costo por hora (ambos privados), el dashboard calcula margen neto real sobre los paquetes ya pagados, usando las reservas efectivamente vinculadas a cada paquete.
10. **Seguimiento proactivo:** el dashboard marca alumnos sin actividad en 14+ días, paquetes por agotarse, cobros pendientes y leads de la jornada gratis sin convertir — cada uno con su link de WhatsApp.
11. **Comunidad:** tablero "busco con quién jugar" para partidos recreativos fuera de clase.

## Puesta en marcha (una sola vez, ~10 minutos)

1. **Crea el proyecto Firebase** (gratis): [console.firebase.google.com](https://console.firebase.google.com) → "Agregar proyecto".
2. **Activa el login:** *Authentication* → *Sign-in method* → habilita **Correo/contraseña**.
3. **Crea la base de datos:** *Firestore Database* → *Crear base de datos* → modo producción → región cercana (ej. `southamerica-east1`).
4. **Pega las reglas de seguridad** en *Firestore Database → Reglas*, reemplazando todo por:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /usuarios/{uid} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == uid;
       }
       match /pistas/{id} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /reservas/{id} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && (
           request.resource.data.alumnoId == request.auth.uid ||
           get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'profesor'
         );
         allow update: if request.auth != null;
       }
       match /paquetes/{id} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /esperas/{id} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /partidos/{id} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

   Reglas intencionalmente simples: cualquier usuario logueado puede leer todo y escribir en la mayoría de colecciones (lo necesita el profesor para confirmar, activar paquetes, administrar pistas, etc.). Razonable para una academia chica sin datos de pago en el sistema; no lo uses así si algún día guardas tarjetas o datos sensibles.

5. **Registra la app web:** *Configuración del proyecto* → *Tus apps* → ícono `</>` → copia el `firebaseConfig`.
6. **Pégalo en** `assets/js/firebase-config.js`.
7. **Sube los cambios** (commit + push).
8. **Visita `tusitio.com/setup.html` una sola vez.** Crea las 3 cuentas (eliges tú las contraseñas, no quedan en el código) y las 34 pistas.
9. **Primer inicio de sesión:** `anotami@gmail.com` + la contraseña que elegiste. No hay "olvidé mi contraseña" todavía (sugerencia #1 abajo); resetéala manualmente desde Firebase si la pierdes.
10. **Carga tus costos reales** en `pistas.html` (costo por hora de cada cancha) y en "Mis datos" de `profesor.html` (tu costo por hora) para que el cálculo de rentabilidad sea exacto — si no los cargas, el dashboard te avisa que el costo estimado es S/0.

### Sobre los índices de Firestore

Algunas consultas (ej. "Clases por registrar") pueden pedir crear un índice la primera vez — Firestore muestra el error con un link directo en pantalla. Haz clic, confirma, espera (puede tardar unos minutos en un proyecto nuevo) y recarga. Solo pasa una vez por tipo de consulta.

### Sobre el caché del navegador

Todos los `<script>` y el `<link>` de estilos llevan `?v=N`. Cada vez que cambio un archivo JS o CSS, subo el número en los archivos que lo usan para que el navegador pida la copia nueva. Si algo se ve raro justo después de un cambio, probá Ctrl+Shift+R antes de asumir que hay un bug.

## Sugerencias pendientes (lo que no está construido todavía)

1. **Recuperar contraseña:** `sendPasswordResetEmail` de Firebase Auth en `login.html`.
2. **Automatizar recordatorios:** hoy el link de WhatsApp lo dispara el profesor a mano. Una Cloud Function (plan Blaze, centavos a este volumen) podría mandarlo solo.
3. **Protección de datos de menores:** ya se pide apoderado + autorización al registrarse; falta revisar qué más exige la Ley de Protección de Datos Personales del Perú antes de abrir el registro al público masivamente.
4. **Códigos de referido formales:** hoy "quién te invitó" es texto libre sin recompensa automática — si quieres trackear conversión y premiar, habría que formalizarlo.
5. **Costo:** con Firebase plan gratuito ("Spark") tienes 50,000 lecturas y 20,000 escrituras diarias — muy por encima de lo que usará una academia chica. El salto a "Blaze" (pago por uso) sigue siendo centavos a este volumen si algún día lo superas.
