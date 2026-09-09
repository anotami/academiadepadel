# Conectar los 5 dominios a la misma web

Tienes 5 dominios activos:

| Dominio | Rol |
|---|---|
| `academiadepadel.pe` | **Canónico** — el que se ve en la barra del navegador |
| `academiadepadel.com.pe` | Redirige 301 → canónico |
| `academiapadelperu.com.pe` | Redirige 301 → canónico |
| `padelacademia.com.pe` | Redirige 301 → canónico |
| `padelacademia.pe` | Redirige 301 → canónico |

GitHub Pages solo sirve **un** dominio propio por repo (más su `www`). Los otros 4 no se
"cuelgan" del mismo hosting — se configuran para redirigir (301) al canónico. Es la práctica
estándar (así funciona cualquier marca con varios dominios) y evita contenido duplicado ante Google.

---

## Paso 1 — Publicar el sitio en GitHub Pages

En el repo: **Settings → Pages → Source → Deploy from a branch → main / (root)**.
El archivo `CNAME` en la raíz ya está configurado con `academiadepadel.pe`, así que GitHub
Pages va a esperar tráfico en ese dominio.

## Paso 2 — DNS del dominio canónico: `academiadepadel.pe`

En el panel DNS de donde administras el dominio (NIC.PE o el reseller donde lo compraste),
crea estos registros:

**Registro A (apex `academiadepadel.pe`) → 4 registros A:**
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Registro AAAA (opcional, IPv6):**
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**Registro CNAME para `www`:**
```
www.academiadepadel.pe → <tu-usuario-de-github>.github.io.
```

Espera la propagación (minutos a horas) y luego en GitHub → Settings → Pages activa
**Enforce HTTPS** (aparece disponible una vez que el DNS resuelve correctamente).

## Paso 3 — Redirección 301 de los otros 4 dominios

Objetivo: que quien escriba cualquiera de los 4 dominios termine en
`https://academiadepadel.pe` con redirección real (no un iframe / "masking"), para que
el navegador muestre la URL final y Google no penalice por contenido duplicado.

**Opción A — si tu registrar ofrece "reenvío de dominio" / "domain forwarding":**
Actívalo en cada uno de los 4 dominios apuntando a `https://academiadepadel.pe`,
tipo **301 (permanente)**, sin "masking"/"cloaking".

**Opción B — si el registrar NO ofrece forwarding (frecuente con `.pe`):**
Usa Cloudflare (plan gratuito) para cada dominio secundario:
1. Agrega el dominio a Cloudflare (gratis) y cambia los nameservers en tu registrar
   a los que te indique Cloudflare.
2. En Cloudflare → **Rules → Redirect Rules**, crea una regla:
   - Si la URL coincide con `*` (todo el tráfico de ese dominio)
   - Redirige (301) a `https://academiadepadel.pe`
3. Repite para los 3 dominios restantes.

Esto es gratis, confiable, y funciona igual sin importar qué registrar uses.

## Paso 4 — Verifica

Después de la propagación DNS (usa https://dnschecker.org para confirmar):

- `https://academiadepadel.pe` → carga el sitio directamente.
- Los otros 4 → deben redirigir automáticamente a `academiadepadel.pe`.

## Nota sobre SEO local

Una vez el sitio esté en vivo, vale la pena crear un perfil de **Google Business Profile**
para la sede de Lima (usa el dominio canónico como sitio web) — mejora mucho el
posicionamiento local frente a "academia de pádel Lima" sin costo adicional.
