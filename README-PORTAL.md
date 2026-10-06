# Portal de reservas (alumnos / profesor / pistas)

Módulo nuevo, separado del sitio público, para que los alumnos pidan clase y el
profesor confirme según la cancha disponible. Vive en 6 páginas nuevas + Firebase
como backend (el sitio sigue siendo estático, apto para GitHub Pages).

## Páginas

| Página | Para quién | Qué hace |
|---|---|---|
| `login.html` | Todos | Iniciar sesión o crear cuenta de alumno. Enlazado desde el menú ("Portal alumnos"). |
| `alumno.html` | Alumno | Editar sus datos y disponibilidad, pedir una clase (pista + fecha + hora), ver el estado de sus reservas. |
| `profesor.html` | Profesor | Ver solicitudes pendientes y confirmar/rechazar, ver próximas clases confirmadas, editar sus datos. |
| `pistas.html` | Alumno y profesor | Directorio de canchas (dirección, teléfono, horario). |
| `setup.html` | Solo tú, una vez | Crea las 3 cuentas de ejemplo y las 6 pistas. No está enlazado desde ningún menú. |

Datos ya precargados en `assets/js/seed-data.js`:
- **Profesor:** tus datos (`anotami@gmail.com`).
- **2 alumnos genéricos:** Valeria Ramos y Diego Fernández (datos de ejemplo, reemplázalos o bórralos cuando tengas alumnos reales).
- **6 pistas reales de Lima:** La Once (tu sede, Surquillo), Peru Padel Center (Miraflores), One Padel (Surco), Bohemia Padel Club (San Borja), Top Padel (La Molina) y Club X3 (Miraflores) — direcciones y teléfonos verificados por búsqueda web en oct. 2026; confirma precio/disponibilidad real con cada club antes de agendar ahí, y dos de ellas (Top Padel, Club X3) no tenían teléfono público, dice "confirmar al reservar".

## Cómo funciona la reserva

1. El alumno entra a `alumno.html`, elige pista + fecha + hora y envía la solicitud (queda `pendiente`).
2. El profesor entra a `profesor.html` y ve la solicitud. Al presionar **Confirmar**, el sistema revisa que no haya otra clase ya `confirmada` en esa misma pista/fecha/hora — si hay choque, avisa y no confirma.
3. El alumno ve el cambio de estado (pendiente → confirmada/rechazada) en tiempo real en su panel.

No hay recordatorios automáticos por WhatsApp/email todavía — ver "Sugerencias" abajo.

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
         allow create: if request.auth != null && request.resource.data.alumnoId == request.auth.uid;
         allow update: if request.auth != null;
       }
       match /paquetes/{id} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

   Estas reglas son intencionalmente simples: cualquier usuario logueado puede leer todo y actualizar reservas (lo necesita el profesor para confirmar). Es razonable para una academia chica sin datos de pago; no lo uses así si algún día guardas tarjetas o datos sensibles.

5. **Registra la app web:** *Configuración del proyecto* (ícono de engranaje) → *Tus apps* → ícono `</>` → dale un nombre → copia el objeto `firebaseConfig` que te muestra.
6. **Pégalo en** `assets/js/firebase-config.js`, reemplazando los valores `"TU_..."`.
7. **Sube los cambios** (commit + push) para que `login.html` quede en línea con la configuración real.
8. **Visita `tusitio.com/setup.html` una sola vez.** Ahí eliges tú mismo una contraseña (mínimo 6 caracteres) para cada una de las 3 cuentas de ejemplo — no quedan guardadas en ningún archivo del repo, solo se usan en el momento de crear la cuenta en Firebase. Anótalas en un gestor de contraseñas, no en el código. Presiona "Crear datos de ejemplo": crea el profesor (`anotami@gmail.com`), los 2 alumnos y las 6 pistas.
9. **Primer inicio de sesión:** entra en `login.html` con `anotami@gmail.com` y la contraseña que elegiste en el paso anterior. Hoy no hay pantalla de "olvidé mi contraseña" (ver sugerencia #1 abajo); si la pierdes, resetéala manualmente desde la consola de Firebase (*Authentication → usuarios → ⋮ → restablecer contraseña*).

### Sobre los índices de Firestore

Las primeras veces que cargues `alumno.html` o `profesor.html`, Firestore puede mostrar en la consola del navegador un error de tipo "The query requires an index" con un enlace. Es normal la primera vez: haz clic en el enlace, confirma la creación del índice (tarda ~1 minuto) y recarga la página. Solo pasa una vez por tipo de consulta.

## Sugerencias de implementación (orden de prioridad)

1. **Recuperar contraseña:** agregar `sendPasswordResetEmail` de Firebase Auth en `login.html` — 15 minutos de trabajo, alto impacto en soporte.
2. **Aviso automático al confirmar/rechazar:** hoy el alumno solo lo ve si vuelve a entrar al portal. Lo más simple sin backend propio: un link de WhatsApp pre-llenado que el profesor dispara manualmente al confirmar (como ya hace el resto del sitio); lo más robusto: una Cloud Function de Firebase que mande el WhatsApp/email automático al cambiar `estado` (requiere plan "Blaze" de pago por uso, igual muy barato a este volumen).
3. **Varios profesores:** el modelo de datos ya lo soporta (`profesorId` en cada reserva); falta un selector de profesor en el formulario de reserva del alumno en vez de asumir que hay uno solo.
4. **Administrar pistas desde la web:** hoy se cargan una vez con `setup.html` y se editan a mano en la consola de Firestore. Si vas a sumar/quitar canchas seguido, vale la pena un `admin.html` simple (mismo patrón que `alumno.html`) en vez de tocar la consola.
5. **Protección de datos personales:** el formulario de alta de alumno pide teléfono y edad de un posible menor (programa Junior 8–15 años). Antes de abrir el registro al público, agrega una casilla de consentimiento/autorización de un adulto responsable y revisa qué exige la Ley de Protección de Datos Personales del Perú para datos de menores.
6. **Validación de cupos/duración:** hoy toda clase se asume de 1 hora y no hay límite de cuántas reservas puede pedir un alumno. Si vas a cobrar por paquete de clases (como ya ofrece el sitio en `#precios`), conviene enlazar cada reserva a un paquete contratado y descontar cupos.
7. **Costo:** con Firebase plan gratuito ("Spark") tienes 50,000 lecturas y 20,000 escrituras diarias — muy por encima de lo que usará una academia chica. Si algún día lo superas, el salto a "Blaze" (pago por uso) sigue siendo centavos a este volumen.
