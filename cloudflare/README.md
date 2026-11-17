# Feed de calendario (Cloudflare Worker)

URL final: `https://academiadepadel.pe/calendario/clases.ics?token=<FEED_TOKEN>`

El Worker arma el `.ics` en cada pedido leyendo `reservas` en Firestore. No guarda copias. El token y la clave de lectura
son secretos del Worker: **no van en este repo**.

## Puesta en marcha (una vez)
1. **Cuenta de servicio de solo lectura.** Google Cloud Console → proyecto `academiadepadel-e5441` → IAM y administración →
   Cuentas de servicio → Crear (nombre: `lector-calendario`) → rol **Cloud Datastore Viewer** (solo lectura).
   Luego Claves → Agregar clave → JSON. Se descarga un archivo; es un secreto.
2. **Worker.** Cloudflare → Workers & Pages → Create → Create Worker → pega `calendario-worker.js` → Deploy.
3. **Secretos.** En el Worker: Settings → Variables and Secrets → Add → tipo **Secret**:
   - `FEED_TOKEN` = token largo aleatorio (mín. 32 caracteres).
   - `SA_JSON` = contenido completo del archivo JSON de la cuenta de servicio.
4. **Ruta.** Worker → Settings → Domains & Routes → Add → Route: `academiadepadel.pe/calendario/*` (zona academiadepadel.pe).
   El registro DNS de `academiadepadel.pe` debe estar **proxied** (nube naranja); si está en "DNS only", la ruta no se ejecuta.
5. **Google Calendar** (en computadora): Otros calendarios → + → Desde URL → pega la URL final.

## Notas
- Sin token válido responde 404 (no revela que existe).
- Google Calendar refresca cada varias horas; no es instantáneo.
- Si el token se filtra: cambia `FEED_TOKEN` y vuelve a suscribir.
- Una clase = una sesión (sede + fecha + hora); un grupo con varios alumnos es un solo evento.
- Las clases canceladas no aparecen. Cada fecha es su propia reserva, por eso no se usa RRULE (duplicaría eventos).
