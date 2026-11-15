# Seguridad — academiadepadel.pe

Guía corta de lo que hay que hacer a mano en Firebase para que las correcciones de seguridad del código tomen efecto, más las 2 desviaciones que se hicieron respecto al pedido original para no romper funciones que ya están en uso.

## 1. Aplicar `firestore.rules`

1. Abre [Firebase Console](https://console.firebase.google.com) → tu proyecto (`academiadepadel-e5441`) → **Firestore Database** → pestaña **Reglas**.
2. Borra todo el contenido actual del editor.
3. Copia y pega el contenido completo de [`firestore.rules`](./firestore.rules) (el archivo en la raíz de este repo).
4. Clic en **Publicar**.
5. Prueba de inmediato: entra al sitio, reserva una clase, deja una reseña en el catálogo de canchas, y abre el árbitro — si algo deja de funcionar, revisa la sección "Qué puede romperse" abajo antes de asumir que es un bug.

`README-PORTAL.md` tenía las reglas anteriores pegadas directamente en el texto — a partir de ahora `firestore.rules` es la única fuente de verdad; `README-PORTAL.md` solo referencia este archivo.

## 2. Qué puede romperse — y por qué se dejó así

El pedido original tenía 2 puntos más estrictos que lo que el sitio usa hoy en producción. Se decidió **no** aplicarlos literalmente porque rompen funciones reales que ya existen, y se documentaron como desvíos explícitos (con comentarios en el propio `firestore.rules`). Si después de leer esto prefieres la versión estricta, dímelo y la aplico.

### a) `pistas`: escritura solo para admin (custom claim)

Tal como se pidió: `allow write: if request.auth.token.admin == true`. El problema es que **ningún usuario tiene ese claim todavía** — hay que crearlo a mano, no se puede hacer desde el código del sitio (un custom claim se asigna con el SDK de administración de Firebase, que corre en un backend, no en el navegador). Hasta que lo configures, **nadie puede editar pistas** — ni tú — ni en `pistas.html` ni en el formulario de "nueva pista" del panel de profesor.

Para activarlo (una sola vez):

1. Instala Node si no lo tienes, y en una carpeta aparte (no en este repo):
   ```
   npm install firebase-admin
   ```
2. En Firebase Console → **Configuración del proyecto** → **Cuentas de servicio** → **Generar nueva clave privada**. Descarga el JSON (es secreto — no lo subas a ningún repo).
3. Crea un archivo `set-admin.js`:
   ```js
   const admin = require("firebase-admin");
   admin.initializeApp({ credential: admin.credential.cert(require("./TU-CLAVE.json")) });

   const uid = "EL_UID_DE_TU_CUENTA"; // lo ves en Authentication → Users
   admin.auth().setCustomUserClaims(uid, { admin: true })
     .then(() => { console.log("Listo"); process.exit(0); });
   ```
4. Ejecuta `node set-admin.js` una vez.
5. Cierra sesión y vuelve a entrar en el sitio (el claim solo se aplica en un token nuevo).

Si mientras tanto prefieres que `pistas` siga aceptando escritura de cualquier usuario logueado (como está hoy), dímelo y cambio esa línea en `firestore.rules` — es una palabra.

### b) `arbitrajes`: lectura pública, no solo para usuarios logueados

El pedido original era `lectura... solo si request.auth != null`. Pero `arbitrajes` es la única colección con lectura 100% pública **a propósito**: es lo que permite que el marcador en vivo (`arbitro-vivo.html`) y la Multipista (`arbitro-pistas.html`) funcionen solo con el link, sin que quien lo abre tenga que crear cuenta. Exigir login ahí rompe esa función por completo — nadie podría ver un marcador compartido sin loguearse primero.

Se mantuvo la lectura pública (como está hoy) y se aplicó la parte de escritura que sí pedías: antes cualquier usuario logueado podía escribir en el partido de **otro** árbitro; ahora solo quien lo creó (`creadoPor == auth.uid`) puede actualizarlo o borrarlo.

### c) `usuarios`, `reservas`, `paquetes` y `grupos`: cerrados (ya NO son de lectura abierta)

Antes cualquier persona con sesión (incluidos los visitantes anónimos de los formularios) podía leer todos los alumnos, todas las reservas y editar paquetes. Ahora:

- **usuarios**: se puede leer UN documento si se conoce su id (ids aleatorios: lo usan el link "actualiza tu disponibilidad" y la activación de cuenta), pero solo el profesor puede **listar** alumnos; cualquiera puede listar profesores (selector y agenda pública). Tu costo por hora ya no vive en tu perfil: está en `costos_profesor` (solo tú).
- **reservas**: cada alumno lee solo las suyas; solo puede cancelarlas, dejar NPS o encuesta. El profesor lee y edita todas. El costo de cancha de cada clase está en `costos_reservas` (solo tú).
- **paquetes**: cada alumno ve solo los suyos; solo el profesor los crea/edita. Al cancelar con anticipación el alumno se devuelve 1 clase, y la regla exige que sea por una reserva suya ya cancelada, una sola vez.
- **grupos, esperas**: del profesor (el alumno solo se anota en espera a su nombre).
- Consecuencia: el aviso "ese horario ya está confirmado" que veía el alumno al pedir una clase ya no puede leer reservas ajenas: se omite y tú ves el choque al confirmar.
- El autocompletar de alumnos del árbitro solo funciona si entras con tu cuenta de profesor.

Las reglas tienen pruebas automáticas contra el emulador de Firestore: `scripts/reglas/` (ver su README).

## 3. Activar App Check (reCAPTCHA v3)

App Check verifica que las peticiones a Firestore vengan de verdad desde tu sitio (y no de un script que copió tu `firebaseConfig`, que es pública por diseño — eso es normal en apps web, pero App Check agrega una capa extra).

1. **Consigue una clave reCAPTCHA v3**: [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) → registra un sitio nuevo, tipo "reCAPTCHA v3", dominio `academiadepadel.pe`. Copia la **clave del sitio** (site key, no la secreta).
2. **Firebase Console** → tu proyecto → **App Check** → selecciona la app web → proveedor **reCAPTCHA v3** → pega la site key → Guardar.
3. **En el código**, en `assets/js/firebase-app.js`, agrega (después de `initializeApp`):
   ```js
   import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";

   initializeAppCheck(app, {
     provider: new ReCaptchaV3Provider("TU_SITE_KEY_AQUI"),
     isTokenAutoRefreshEnabled: true
   });
   ```
4. En Firebase Console → App Check → Firestore → empieza en modo **"Monitorear"** (no bloquea nada, solo registra qué pasa) unos días; cuando confirmes que el sitio real sigue funcionando normal, cambia a **"Exigir"**.

No se agregó este código todavía porque necesita la site key, que solo se consigue desde tu cuenta de Google — avísame cuando la tengas y lo conecto.

## 4. Resumen de lo que sí se aplicó literalmente, sin desvíos

- `resenas_canchas`: validación completa de campos (tipos, tamaños, rango de estrellas, sin campos extra), nada de update/delete.
- `arbitrajes`: escritura/actualización/borrado restringidos al creador del partido.
- `pistas`: lectura requiere login (ya era así).
- `interesados_grupo`: lectura SOLO admin (acá sí hay datos personales — teléfono y correo — de gente que no tiene cuenta en el portal); cualquiera puede crear su propio registro, con validación completa de campos igual que `resenas_canchas`.
- `turnos_grupales`: mismo patrón que `pistas` — lectura para cualquier logueado (incluye anónimos), escritura solo admin.
- Deny-all explícito para cualquier colección no listada.
