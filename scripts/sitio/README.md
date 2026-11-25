# Herramientas del sitio

Todo es estático: estas herramientas generan o revisan archivos que luego se publican tal cual.

| Archivo | Qué hace |
|---|---|
| `datos.mjs` | Fuente única: nombre, WhatsApp, redes, las 4 sedes y los tipos de clase. Lo que falta queda como `[COMPLETAR: ...]`. |
| `chequeos.mjs` | Auditoría de las páginas públicas: título y descripción únicos, un solo H1, canonical, Open Graph, JSON-LD válido, enlaces rotos, imágenes sin alt o sin ancho/alto, WhatsApp distinto al de la academia. Cuenta también los restos de "cancha" y de formas en "tú" para la conversión a voseo. |
| `webp.py` | Convierte JPG/PNG de `assets/img` a WebP (calidad 80, máx. 1600 px). Deja los originales. |

```
node scripts/sitio/chequeos.mjs          # informe
node scripts/sitio/chequeos.mjs --json   # para scripts
python3 scripts/sitio/webp.py            # necesita Pillow
```

## Páginas de sede
`node scripts/sitio/generar-sedes.mjs` genera `sedes/<sede>/index.html` desde `datos.mjs` (4 sedes), con schema `SportsActivityLocation`,
`BreadcrumbList` y `FAQPage`. Si una sede tiene algún `[COMPLETAR]` en los datos, su página sale con `noindex` y no entra al sitemap.
Para completar una sede, editá su entrada en `datos.mjs` y volvé a correr el generador.

## Páginas de clases
`node scripts/sitio/generar-clases.mjs` genera `clases/<inicial|intermedio|particulares|mujeres|ninos>/index.html` desde `datos.mjs` (`CLASES`),
con schema `Service`, `BreadcrumbList` y `FAQPage`. El contenido sale de lo ya publicado en la home; no se copian precios (se enlaza a las tarifas).

## Sobre Gabriel y Preguntas frecuentes
`node scripts/sitio/generar-info.mjs` genera `sobre-gabriel/` y `preguntas-frecuentes/`. Todo sale de lo ya publicado en la home
(`#quien-soy` y `#faq`): si cambiás esos textos en `index.html`, volvé a correr el generador.
