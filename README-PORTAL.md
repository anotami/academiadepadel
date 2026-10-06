# Portal de reservas (alumnos / profesor / pistas)

Módulo separado del sitio público para que los alumnos pidan clase, el profesor
confirme según cancha disponible, y se lleve el seguimiento de paquetes,
asistencia y progreso. Vive en 6 páginas + Firebase como backend (el sitio
sigue siendo estático, apto para GitHub Pages).

## Páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `login.html` | Todos | Iniciar sesión o crear cuenta de alumno. Enlazado desde el botón "ACCESO PORTAL" del header. |
| `alumno.html` | Alumno | Ver su paquete de clases, pedir una clase (tipo + pista + fecha + hora, con aviso si el horario no calza con la disponibilidad habitual), ver estado/feedback/encuesta de sus reservas, editar sus datos. |
| `profesor.html` | Profesor | Resumen de métricas, solicitudes pendientes (con validación de disponibilidad), clases por registrar (asistencia + feedback), próximas clases confirmadas (con recordatorio por WhatsApp), paquetes de clases, disponibilidad de alumnos, sus propios datos. |
| `pistas.html` | Alumno y profesor | Directorio de canchas; el profesor además puede crear pistas nuevas y editar disponibilidad/estado de las existentes. |
| `setup.html` | Solo tú, una vez | Crea las 3 cuentas de ejemplo y siembra/reemplaza la lista de pistas. No está enlazado desde ningún menú. |

Datos ya precargados en `assets/js/seed-data.js`:
- **Profesor:** tus datos (`anotami@gmail.com`).
- **2 alumnos genéricos:** Valeria Ramos y Diego Fernández (datos de ejemplo, reemplázalos o bórralos cuando tengas alumnos reales).
- **34 pistas reales de Lima** (cancha, estado Habilitada/Reservada/Bloqueada, precio por hora, web/redes) — usa "Reemplazar la lista de pistas" en `setup.html` si editas esa lista y quieres que el sitio en vivo la refleje.

## Cómo funciona, de punta a punta

1. **Disponibilidad:** el profesor carga su disponibilidad semanal (día + franja) en su panel; cada pista tiene la suya propia, editable en `pistas.html`; cada alumno carga la suya al registrarse o desde su panel.
2. **Solicitud:** el alumno elige tipo de clase (tomado de `index.html`: programas, clínicas, ofertas), pista, fecha y hora. Si el horario no calza con la disponibilidad habitual del profesor o de la pista, se lo avisa (no lo bloquea). Queda en estado `pendiente`.
3. **Validación y confirmación:** el profesor ve la solicitud con dos indicadores (✓/⚠ tu disponibilidad, ✓/⚠ disponibilidad de la pista). Al **Confirmar**, el sistema revisa que no haya otra clase ya `confirmada` en esa misma pista/fecha/hora. Si la clase es de un programa regular (Junior/Adultos) y el alumno tiene un paquete activo, se le descuenta una clase automáticamente.
4. **Después de la clase:** en "Clases por registrar", el profesor marca asistencia y deja nivel trabajado / comentario / próximo objetivo — el alumno lo ve en su panel como bitácora de progreso.
5. **Feedback del alumno:** una vez pasada la fecha de una clase confirmada, el alumno ve una pregunta de NPS (0–10) una sola vez.
6. **Recordatorio:** en "Próximas clases confirmadas", el profesor tiene un botón "Recordar" que abre WhatsApp con el mensaje ya armado (no se envía solo).
7. **Paquetes:** el profesor activa un paquete (4 u 8 clases) por alumno cuando este paga, con monto y estado de pago. El alumno ve cuántas clases le quedan.

## Puesta en marcha (una sola vez, ~10 minutos)

1. **Crea el proyecto Firebase** (gratis): [console.firebase.google.com](https://console.firebase.google.com) → "Agregar proyecto".
2. **Activa el login:** dentro del proyecto → *Authentication* → *Sign-in method* → habilita **Correo/contraseña**.
3. **Crea la base de datos:** *Firestore Database* → *Crear base de datos* → modo producción → elige una región cercana (ej. `us-central` o `southamerica-east1`).
4. **Pega las reglas de seguridad** en *Firestore Database → Reglas*, reemplazando el contenido por:

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

   Estas reglas son intencionalmente simples: cualquier usuario logueado puede leer todo y escribir en reservas/paquetes/pistas (lo necesita el profesor para confirmar, activar paquetes y administrar pistas). Es razonable para una academia chica sin datos de pago; no lo uses así si algún día guardas tarjetas o datos sensibles.

5. **Registra la app web:** *Configuración del proyecto* (ícono de engranaje) → *Tus apps* → ícono `</>` → dale un nombre → copia el objeto `firebaseConfig` que te muestra.
6. **Pégalo en** `assets/js/firebase-config.js`, reemplazando los valores `"TU_..."`.
7. **Sube los cambios** (commit + push) para que `login.html` quede en línea con la configuración real.
8. **Visita `tusitio.com/setup.html` una sola vez.** Ahí eliges tú mismo una contraseña (mínimo 6 caracteres) para cada una de las 3 cuentas de ejemplo — no quedan guardadas en ningún archivo del repo, solo se usan en el momento de crear la cuenta en Firebase. Anótalas en un gestor de contraseñas, no en el código. Presiona "Crear datos de ejemplo": crea el profesor (`anotami@gmail.com`), los 2 alumnos y las 34 pistas.
9. **Primer inicio de sesión:** entra en `login.html` con `anotami@gmail.com` y la contraseña que elegiste en el paso anterior. Hoy no hay pantalla de "olvidé mi contraseña" (ver sugerencia #1 abajo); si la pierdes, resetéala manualmente desde la consola de Firebase (*Authentication → usuarios → ⋮ → restablecer contraseña*).

### Sobre los índices de Firestore

Las primeras veces que cargues `alumno.html` o `profesor.html`, Firestore puede mostrar en la consola del navegador un error de tipo "The query requires an index" con un enlace, o directamente aparecer en pantalla (ya se muestra el error con el link, no se queda en "Cargando..." sin explicación). Es normal la primera vez: haz clic en el enlace, confirma la creación del índice (puede tardar unos minutos la primera vez de un proyecto nuevo) y recarga la página. Solo pasa una vez por tipo de consulta.

### Sobre el caché del navegador

Todos los `<script>` y el `<link>` de estilos llevan `?v=N` al final. Cada vez que yo cambie un archivo JS o CSS, subo también un número de versión más alto en los archivos que lo usan — así el navegador pide la copia nueva en vez de servir una vieja en caché. Si algo se ve o se comporta raro justo después de un cambio, probá primero con Ctrl+Shift+R (recarga forzada) antes de asumir que hay un bug.

## Sugerencias pendientes (ya no incluye lo ya construido)

1. **Recuperar contraseña:** agregar `sendPasswordResetEmail` de Firebase Auth en `login.html` — 15 minutos de trabajo, alto impacto en soporte.
2. **Recordatorio/confirmación automática:** hoy el link de WhatsApp al alumno lo dispara el profesor a mano. Lo más robusto sería una Cloud Function de Firebase que lo mande solo al confirmar o 24h antes (requiere plan "Blaze" de pago por uso, igual muy barato a este volumen).
3. **Varios profesores:** el modelo de datos ya lo soporta (`profesorId` en cada reserva); falta un selector de profesor en el formulario de reserva del alumno en vez de asumir que hay uno solo.
4. **Protección de datos personales:** el formulario de alta de alumno pide teléfono y edad de un posible menor (programa Junior 8–15 años). Antes de abrir el registro al público, agrega una casilla de consentimiento/autorización de un adulto responsable y revisa qué exige la Ley de Protección de Datos Personales del Perú para datos de menores.
5. **Renovación de paquete:** hoy cuando un paquete se agota, el alumno solo ve un aviso de "coordina con tu profesor" — no hay un botón de "pedir renovación" que le avise directamente.
6. **Costo:** con Firebase plan gratuito ("Spark") tienes 50,000 lecturas y 20,000 escrituras diarias — muy por encima de lo que usará una academia chica. Si algún día lo superas, el salto a "Blaze" (pago por uso) sigue siendo centavos a este volumen.
