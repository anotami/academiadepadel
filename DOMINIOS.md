# Dominios del proyecto

Hay dos sitios reales y el resto solo redirige. Estado verificado el 26-11-2026.

| Dominio | Qué es | Dónde corre |
|---|---|---|
| `academiadepadel.pe` | **Academia** (clases, sedes, disponibilidad, portal) | GitHub Pages (este repo, archivo `CNAME`) |
| `www.academiadepadel.pe` | Redirige a `academiadepadel.pe` | GitHub Pages |
| `padelacademia.pe` | **Tienda** (palas, zapatillas, ropa, accesorios; pedido por WhatsApp) | Cloudflare Pages, proyecto `padelacademia-tienda` (fuera de este repo) |
| `www.padelacademia.pe` | Muestra la tienda | Cloudflare Pages |

## Redirecciones 301 (Cloudflare, conservan ruta y parámetros)

- `academiadepadel.com.pe`, `academiapadelperu.com`, `academiapadelperu.com.pe` (y sus `www`) → `https://academiadepadel.pe`
- `padelacademia.com.pe` (y `www`) → `https://padelacademia.pe`

`gabrielpizarro.com` es el sitio personal; no se toca.

## Qué NO se hace desde este repo

- No se cambia DNS ni nameservers desde acá. El DNS de los `.pe` apunta a Cloudflare; no hace falta tocarlo en Punto.pe para que el sitio funcione.
- GitHub Pages no hace 301 reales. Las redirecciones de dominio las hace Cloudflare.

## La tienda vieja (`/tienda/`)

`academiadepadel.pe/tienda/` ahora es solo un aviso ("la tienda se mudó") con enlace a `padelacademia.pe`. Los archivos `tienda/productos.csv` y compañía **se quedan**: la pestaña privada "Tienda" del panel del profesor los lee (`assets/js/tienda-interno.js`).

## Pendientes de Gabo

- Confirmar si `academiadepadel.com` (Register SPA, desde 2021) es suyo; si lo es, redirigirlo a `academiadepadel.pe`.
- Revisar los vencimientos de los `.pe` en Punto.pe.
