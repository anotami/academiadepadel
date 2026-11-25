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
