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

## Árbitro de pádel (`arbitro.html` + 4 páginas más)

Suite aparte del portal de reservas: una PWA instalable (enlazada como "🎾 Árbitro"
en el menú principal) para arbitrar un partido completo, verificada contra las
Reglas del Pádel FIP (revisión 01.01.2026) y el manual de la clínica de arbitraje.
El marcador en sí es **100% local/offline por diseño** — funciona sin internet en
pista aunque Firebase no esté configurado o se corte la señal — y usa Firebase
solo como capa opcional cuando el árbitro está logueado y hay conexión.

| Página | Para quién | Qué hace |
|---|---|---|
| `arbitro.html` | El árbitro | Checklist pre-partido, marcador con reglas FIP, timers, código de conducta, infracciones de tiempo, interrupciones, historial punto a punto, acta final. |
| `arbitro-vivo.html?id=...` | Público (sin login) | Visor de solo lectura del marcador en vivo de un partido, por link. |
| `arbitro-pistas.html` | Cualquiera (sin login) | "Multipista": arbitraje pasivo — ve en vivo todas las pistas que se están arbitrando ahora, y el ranking interno acumulado. |
| `arbitro-historial.html` | El árbitro | Historial de partidos: local en este dispositivo (siempre) y en la nube (si se compartieron en vivo, con acta completa recuperable desde cualquier dispositivo). |
| `arbitro-torneo.html` | El organizador | Torneo Americano/Mexicano: genera rondas con parejas rotativas (o por nivel), registra resultados por pista y arma la tabla de posiciones. 100% local, no usa Firebase. |
| `arbitro-login.html` | El árbitro | Login/registro propio de árbitros (rol `arbitro`), separado del de alumnos — sin edad, apoderado ni disponibilidad; solo nombre, teléfono y club opcional. |
| `arbitro-entrenador.html?id=...&equipo=A/B` | El entrenador de cada pareja (sin login) | Ventana aparte por pareja: marcador en vivo + alertas de conducta/demora de sus jugadores, y registro de feedback táctico punto a punto (golpe, resultado, zona, nota) con estadísticas e informe de devolución exportable. |
| `arbitro-ayuda.html` | Cualquiera (sin login) | Guía de uso para quien nunca usó la app: setup, marcador, pestañas de herramientas, acta, las demás páginas del sistema, cuenta de árbitro y modo offline/instalación. Puramente estática, sin JS propio. |

`faq-padel.html` (112 preguntas sobre reglas de pádel y arbitraje, con evaluación de 10 al azar) vive fuera de la sección del árbitro — es una página general del sitio, enlazada desde el menú principal, igual que `categorias-padel.html` o `test.html`. `arbitro-ayuda.html` solo le apunta como referencia cruzada.

Funciones del marcador (`arbitro.html`):

- Checklist pre-partido (pista, pelotas, equipamiento, entrenadores acreditados).
- Marcador con los 3 métodos de puntuación FIP, elegibles antes de empezar:
  **Método 1** (con ventajas, sin límite), **Método 2** (Star Point: dos rondas de
  ventaja y a la tercera igualada el siguiente punto decide) y **Método 3** (punto
  de oro: decide el primer 40-40). Sets a mejor de 3, tie-break a 7, tercer set
  configurable (set completo o super tie-break a 10), deshacer último punto e
  historial punto a punto.
- Temporizadores reglamentarios con un toque (peloteo, entre puntos, cambio de
  lado, descanso entre sets, cambio de lado en tie-break, atención médica), con
  sonido y vibración al terminar.
- Aviso automático de cambio de pelotas (cada 9 juegos, contando el peloteo como 2)
  y de cambio de lado.
- **Código de Conducta con la escalera real de la FIP** (por pareja): 1ra
  infracción = advertencia, 2da = advertencia + pérdida de punto, 3ra =
  advertencia + descalificación — el sistema cuenta solo las infracciones previas
  de cada pareja y aplica la consecuencia que corresponde. "Descalificación
  directa" queda aparte para faltas muy graves (agresión física o verbal).
- **Infracciones de tiempo (demora)**, tabla independiente de la de conducta: 1ra
  = advertencia, 2da en adelante = pérdida de punto.
- **Interrupciones** con la referencia de tiempo de la Regla 2 FIP visible al
  elegir el tipo (condición médica tratable hasta 3 min repetible, sangrado hasta
  15 min, calambres solo en cambio de lado, urgencia ajena al juego hasta 15 min,
  clima, falta de luz, disputa de tanteo, equipamiento, etc.): pausan el marcador
  (no se puede sumar puntos mientras hay una activa) y, al reanudar, el sistema
  sugiere el peloteo de cortesía que corresponde según cuánto duró la suspensión
  (Regla 2.11: ≤5 min nada, 5-20 min 1 min, +20 min 3 min).
- Narración por voz del puntaje (Web Speech API, se activa/desactiva con un botón)
  y modo pantalla grande para dejar el celular/tablet junto a la pista o conectado
  a un TV.
- Acta final con estadísticas básicas (puntos y juegos por pareja, duración,
  infracciones de conducta, de tiempo e interrupciones), exportable a PDF
  (imprimir desde el navegador), a WhatsApp, o como tarjeta de resultado en imagen
  (botón "Descargar tarjeta de resultado").
- **Marcador en vivo** (opcional): si el árbitro inicia sesión antes de empezar,
  puede activar "Compartir este partido en vivo" — genera un link público
  (`arbitro-vivo.html?id=...`) para que cualquiera siga el partido sin instalar
  nada, y el partido aparece automáticamente en `arbitro-pistas.html`.
- **Historial de partidos**: cada partido finalizado queda guardado solo con
  marcador y ganador en este dispositivo (`arbitro-historial.html`), y además con
  acta completa en la nube si se compartió en vivo.
- Autocompletar los 4 nombres de jugadores con los alumnos ya registrados
  (requiere sesión iniciada).

Para instalarla en el celular: abre `arbitro.html`, usa el botón "Instalar app"
(Android/desktop) o "Compartir → Añadir a pantalla de inicio" (iPhone). Si no
inicias sesión, todo funciona igual salvo el marcador en vivo y la multipista.

### Varios árbitros, varias pistas, al mismo tiempo

Cada dispositivo guarda su propio partido en memoria local, y cada partido
compartido en vivo crea su propio documento en Firestore — no hay nada
compartido entre pistas que pueda chocar. En la práctica: cada árbitro abre
`arbitro.html` en su propio celular, inicia sesión con su propia cuenta de
árbitro (se crea en `arbitro-login.html`, separada de la de alumnos), activa
"Compartir en vivo" y arbitra su pista con total independencia de las demás.
Quien esté coordinando el torneo abre `arbitro-pistas.html` y ve todas las
pistas activas en una sola pantalla, en tiempo real.

### Vista de entrenadores: feedback táctico por pareja

Pensada para que cada entrenador tenga su propia ventana, separada de la del
árbitro y de la del otro entrenador. Desde el marcador en vivo (`arbitro.html`,
cuando el partido se comparte en vivo) aparecen dos links listos para copiar
o mandar por WhatsApp: uno para el entrenador de la Pareja A y otro para el de
la Pareja B (`arbitro-entrenador.html?id=...&equipo=A` / `...&equipo=B`). No
requiere cuenta — con el link entra directo.

Qué usa del árbitro: el marcador en vivo completo (sets, juego, quién saca,
estado del partido) y las advertencias de código de conducta/demora que ya
tenga registradas su pareja, para que el entrenador sepa si sus jugadores
están a una infracción de perder un punto o quedar descalificados.

Qué registra el entrenador, punto a punto:
- **Jugador** (de su propia pareja — no puede taggear a la pareja rival).
- **Tipo de golpe**: derecha, revés, bandeja, víbora, remate/smash, globo,
  bajada de pared, saque, resto, volea, contrapared, gancho, otro.
- **Resultado**: punto ganador, ace, punto por error del rival, error forzado
  (por presión del rival) o error no forzado, doble falta.
- **Zona de la cancha** donde terminó el punto (red/fondo × izquierda/
  centro/derecha), en una mini-cancha clickeable.
- **Nota libre** con el feedback para el jugador.

Con eso arma solo: estadísticas por jugador (ganadores, errores forzados/no
forzados, aces, % de efectividad, desglose por tipo de golpe), un mapa simple
de cuántos puntos se definen en cada zona de la cancha, filtro por set, un
historial editable de cada punto registrado (se puede borrar), y un "informe
de devolución" con fortalezas/a mejorar por jugador + las notas, exportable
por WhatsApp, como CSV o para imprimir.

Los datos quedan en Firestore, en `arbitrajes/{id}/feedback` — una
subcolección aparte del documento del partido, así el entrenador puede
guardar sin pisarle la escritura al árbitro (que reescribe todo el documento
del partido en cada punto).

### Preguntas frecuentes de pádel y arbitraje + evaluación (fuera de la sección del árbitro)

`faq-padel.html` es, a propósito, una página general del sitio — no vive bajo
el prefijo `arbitro-` ni usa `arbitro.css`, aunque su contenido sea sobre
reglas de arbitraje; se llega a ella desde el menú principal, igual que
`categorias-padel.html`. `arbitro-ayuda.html` solo le apunta como referencia
cruzada para quien tiene una duda de reglamento, no de cómo usar la app.

Es un banco de 112 preguntas (`assets/js/faq-padel-data.js`), armado a partir
de las Reglas del Pádel FIP y el Manual del Alumno de la
Clínica de Arbitraje Perú 2026 que compartiste (incluye sus ~35 casos reales,
más casos propios elaborados en el mismo formato). Cada pregunta sigue la
misma estructura que usa el manual para sus casos:

- **Pregunta** — la situación o consulta.
- **Hechos comprobables** — lo que el árbitro puede verificar.
- **Regla o procedimiento** — la norma aplicable, citando la regla FIP cuando corresponde.
- **Decisión y comunicación** — la respuesta/consecuencia correcta.

Están agrupadas en 13 categorías (rol del árbitro, puntuación, tiempos,
posición/sorteo, saque, net/let/interferencia, punto perdido, juego
exterior/pelotas, Código de Conducta, condiciones médicas, supervisión de
varias canchas, juez de silla/anuncios, hechos/reglamento/apelaciones), con
buscador por palabra clave y filtro por categoría.

La pestaña "Evaluación" elige 10 preguntas al azar de todo el banco y genera
4 opciones por pregunta: la respuesta correcta más 3 distractores tomados de
las "decisiones" de otras preguntas (preferentemente de la misma categoría),
así que no hace falta redactar opciones a mano para las 112. Corrige al
instante, muestra la regla aplicable de cada una como retroalimentación y
permite repetir con una selección nueva. Todo funciona 100% local, sin Firebase.

### Login de árbitros, separado del de alumnos

`arbitro-login.html` es una cuenta independiente de `login.html`: mismo
Firebase Auth por debajo, pero guarda `usuarios/{uid}.rol = "arbitro"` y
el formulario de registro solo pide nombre, correo, teléfono y club
(nada de edad, apoderado, nivel o disponibilidad — eso es de alumnos).
Un árbitro nunca necesita pasar por el registro de alumnos. Si alguien
inicia sesión con una cuenta de árbitro desde `login.html` por error, el
sistema lo redirige igual a `arbitro.html`.

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
       match /arbitrajes/{id} {
         allow read: if true;
         allow write: if request.auth != null;

         match /feedback/{feedbackId} {
           allow read: if true;
           allow create: if true;
           allow delete: if true;
         }
       }
     }
   }
   ```

   Reglas intencionalmente simples: cualquier usuario logueado puede leer todo y escribir en la mayoría de colecciones (lo necesita el profesor para confirmar, activar paquetes, administrar pistas, etc.). Razonable para una academia chica sin datos de pago en el sistema; no lo uses así si algún día guardas tarjetas o datos sensibles.

   `arbitrajes` es la única colección de lectura pública (`allow read: if true`), a propósito: son partidos de pádel (nombres y marcador, nada sensible) pensados para que cualquiera con el link los vea sin crear cuenta — eso es lo que hace posible el marcador en vivo y la multipista.

   `arbitrajes/{id}/feedback` (la devolución táctica de la vista de entrenadores) es abierta a propósito, igual que `arbitrajes`: los entrenadores entran solo con el link del partido, sin cuenta, así que no hay `request.auth` que exigir. Es la misma decisión de "nada sensible, abierto por simplicidad" que ya se tomó para `arbitrajes`.

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
