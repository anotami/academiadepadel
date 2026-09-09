# Academia de Pádel — sitio web

Landing page estática (HTML/CSS/JS puro, sin build) para la Academia de Pádel en Lima.
Pensada para dos públicos: **Junior (8–15 años)** y **Adultos (mujeres y ejecutivos)**,
con foco en aprendizaje y no en competencia.

## Estructura

```
index.html              → toda la página (una sola vista, secciones ancladas)
assets/css/style.css    → estilos
assets/js/main.js       → menú móvil + año del footer
assets/img/logo.svg     → logo / favicon
CNAME                   → dominio canónico para GitHub Pages
DOMINIOS.md             → cómo conectar los 5 dominios
```

## Editar contenido

Todo el copy está en `index.html`, en español, en texto plano — no hay CMS ni build step.
Los puntos marcados como referenciales (que debes confirmar y actualizar tú mismo) son:

- **Sede / dirección exacta** — sección `#horarios`, bloque `.location-card`.
- **Horarios** — tabla en `#horarios`.
- **Precios** — tarjetas en `#precios` (hoy usan rangos de mercado de Lima, no precios reales).
- **Número de WhatsApp** — actualmente `+51 932 900 134`, aparece en 6 lugares
  (busca `51932900134` en `index.html` y reemplaza en todos a la vez).

## Cómo correr el sitio en local

No requiere instalación. Basta abrir `index.html` en el navegador, o servir la carpeta:

```bash
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

## Publicar en GitHub Pages

1. Push a la rama principal del repo (`main` o la que uses como default).
2. En GitHub → **Settings → Pages** → Source: `Deploy from a branch` → rama `main`, carpeta `/ (root)`.
3. Espera 1–2 minutos a que Pages construya el sitio.
4. Sigue `DOMINIOS.md` para conectar tus 5 dominios `.pe`.

## Pendientes de negocio (no técnicos)

- Fotos reales de la sede/canchas (hoy el sitio usa solo ilustración vectorial, sin fotos de stock).
- Testimonios reales de alumnos (no se incluyeron testimonios inventados a propósito).
- Confirmar dirección, horarios y precios finales.
