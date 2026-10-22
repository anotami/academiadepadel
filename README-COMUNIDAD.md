# Comunidad — directorio de jugadores, "falta el cuarto" y leads

Módulo nuevo sobre la misma base del sitio (HTML/CSS/JS sin build, Firebase ya
configurado). No agrega backend ni dependencias nuevas.

## Qué es cada cosa

- **`comunidad-anotate.html`** (pública) — formulario de alta. Guarda en
  `jugadores_comunidad`, con el id del documento = WhatsApp normalizado
  (+51XXXXXXXXX), así que volver a enviar el mismo teléfono actualiza el
  registro en vez de duplicarlo.
- **Tab "Comunidad" en `profesor.html`** (solo admin) — 4 secciones:
  - **Jugadores**: directorio con contadores por categoría, filtros, teléfono
    enmascarado, verificar/editar/dar de baja/borrar, exportar CSV.
  - **Falta el cuarto**: arma el mensaje y abre `wa.me` por jugador — nada se
    envía solo. Guarda cada convocatoria en `convocatorias` para no repetir
    siempre a los mismos.
  - **Leads**: inscritos con interés en clases, con WhatsApp prellenado
    invitando a la jornada gratuita "¡Conociendo el Pádel!" (sin precio
    hardcodeado).
  - **Importar desde WhatsApp**: sube el .txt exportado de un grupo, detecta
    teléfonos/categoría/género de forma aproximada y te deja revisar/corregir
    cada fila en una tabla antes de guardar nada.

## Variables de entorno

Ninguna nueva. El sitio no usa variables de entorno — la config de Firebase
(`assets/js/firebase-config.js`) ya está en el repo, igual que para el resto
del portal (alumno/profesor/árbitro). Si en algún momento rotas la API key o
cambias de proyecto Firebase, ver `README-PORTAL.md`.

## Cómo crear/usar el usuario admin

No hay un usuario "admin" separado: el gate de Comunidad es el mismo que ya
protege todo `profesor.html` — tu cuenta con `usuarios/{uid}.rol == "profesor"`
en Firestore. Si ya entras al panel del profesor hoy, ya tienes acceso a
Comunidad; no hay que crear nada nuevo.

## Reglas de Firestore

`firestore.rules` tiene las colecciones `jugadores_comunidad` y
`convocatorias` nuevas. Como el resto de las reglas del repo, **no se aplican
solas** — hay que pegar el archivo completo en Firebase Console → Firestore
Database → Reglas → Publicar (ver `README-seguridad.md`).

Puntos clave de esas reglas (para que no te sorprenda si algo falla):
- Nadie público puede **leer** `jugadores_comunidad` — solo el profesor. El
  alta pública escribe a ciegas (sin leer antes) al documento cuyo id es su
  propio WhatsApp.
- Toda alta/reenvío público fuerza `categoriaEstado: "a_verificar"` — incluso
  si ya estaba verificado, un reenvío del mismo jugador lo vuelve a poner en
  revisión. Es intencional: cualquier cambio pasa por vos.
- `convocatorias` es 100% interno (solo profesor lee y escribe).

## Datos de prueba

`scripts/seed-jugadores-comunidad.js` — mismo patrón que los otros scripts de
`scripts/` (corre local, junto a tu `clave.json` de admin):

```bash
node seed-jugadores-comunidad.js          # vista previa, no toca nada
node seed-jugadores-comunidad.js --confirmo
```

Crea 10 jugadores con "(prueba)" en el nombre para que los ubiques fácil y
los borres desde el panel cuando termines de probar.

## Desplegar

Igual que siempre: push a la rama principal → GitHub Pages lo sirve solo (ver
`README.md`). Lo único que **no** se despliega solo son las reglas de
Firestore (paso manual de arriba) — si olvidas publicarlas, el alta pública y
el directorio van a fallar con error de permisos aunque el código ya esté en
producción.

## Importante: el importador de WhatsApp no es "consentimiento explícito"

Los jugadores que suban por "Importar desde WhatsApp" quedan con
`origen: "import_whatsapp"` y una nota indicando de dónde salió el dato — es
gente de un grupo que ya administrás, no alguien que llenó el formulario y
aceptó el checkbox. Es una base legal distinta (relación preexistente, no
consentimiento explícito vía web). Si alguno te pide que lo saques, dalo de
baja desde "Jugadores" → esa acción sí queda registrada igual que cualquier
otra baja.
