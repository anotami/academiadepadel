# Tienda Academia de Pádel GP

Sitio estático (HTML + CSS + JS simple). Sin carrito, sin pagos online, sin base de datos: cada producto termina en un chat de WhatsApp con el mensaje armado.

## Estructura

```
tienda/
├── index.html      Página (portada, recomendadas, catálogo, cómo comprar, ficha)
├── tienda.css      Estilos (primero celular)
├── tienda.js       Lee productos.csv, filtros, búsqueda, orden y ficha de producto
├── config.js       WHATSAPP, SALUDO y otros ajustes
├── productos.csv   LOS PRODUCTOS (esto es lo que actualizás)
└── img/            Fotos: una por producto, con el nombre del código (GP-PAL-001.jpg)
```

## Cómo actualizar los productos

1. Editá `productos.csv` (Excel o Google Sheets → Descargar como CSV UTF-8) y reemplazá el archivo.
2. Columnas, en cualquier orden: `codigo, categoria, marca, nombre, precio_venta_PEN, nivel, mas_vendido, disponible, imagen_url, descripcion`.
   - `categoria`: Zapatillas, Ropa, Palas o Accesorios.
   - `nivel`: inicial, medio, avanzado, todos o sin_dato.
   - `mas_vendido`: sí / no / sin_dato. Los "sí" salen primero y en "Recomendadas para empezar".
   - `disponible`: no → el botón dice "Consultar por WhatsApp" y se avisa "Consultar stock". Cualquier otro valor = disponible.
   - `imagen_url`: ruta relativa (`img/GP-PAL-001.jpg`) o un link `https://…`. Si falta o no carga, se muestra una imagen de relleno.
   - `descripcion`: opcional; se ve en la ficha del producto.
3. Para una foto nueva, subila a `img/` con el código del producto como nombre.
4. Publicá el cambio (ver abajo). La página lee el CSV cada vez que se abre.

## Cambiar tu WhatsApp

En `config.js`: `export const WHATSAPP = "51XXXXXXXXX";` (con código de país, sin `+`).

## Publicar

Esta carpeta ya vive dentro del repositorio de academiadepadel.pe, que se publica con GitHub Pages: al subir los cambios a la rama de producción, la tienda queda en `https://academiadepadel.pe/tienda/`.

Para publicarla sola (sin la academia), en cualquiera de estos servicios gratis:

- **Netlify**: netlify.com → "Add new site" → "Deploy manually" → arrastrá la carpeta `tienda/` (con `productos.csv` e `img/`). Cada vez que cambies el CSV, arrastrala de nuevo.
- **Cloudflare Pages**: "Create a project" → "Direct Upload" → subí la carpeta `tienda/`.
- **Vercel**: `vercel` dentro de `tienda/` (o importá el repo con "Root Directory" = `tienda`). No hay build: "Framework Preset: Other".
- **GitHub Pages en otro repo**: copiá la carpeta a un repo nuevo, Settings → Pages → Deploy from a branch → `main` / root.

Si la publicás sola, en `index.html` cambiá los links `../assets/img/…` y `../` (logo y "La academia") por los tuyos.

## Que Google la indexe

Hoy tiene `<meta name="robots" content="noindex">` en `index.html` (para revisarla antes). Borrá esa línea cuando quieras que aparezca en Google, y enlazala desde la home.
