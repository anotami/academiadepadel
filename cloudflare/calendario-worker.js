// Cloudflare Worker: feed iCal de solo lectura de las clases de la academia.
//   https://academiadepadel.pe/calendario/clases.ics?token=<FEED_TOKEN>
// Se genera en CADA pedido leyendo la colección `reservas` de Firestore (no hay copia de los datos).
// Secretos del Worker (Settings → Variables and Secrets, tipo "Secret"; NO van en el repo):
//   FEED_TOKEN  token largo y aleatorio que va en la URL
//   SA_JSON     JSON de una cuenta de servicio con el rol "Cloud Datastore Viewer" (solo lectura)
// El feed solo lleva: tipo de clase, primer nombre, sede, horario. Nunca teléfonos, mails, montos ni feedback.
const PROYECTO = "academiadepadel-e5441";
const DOMINIO = "academiadepadel.pe";
const ZONA = "America/Lima";
const DIAS_ATRAS = 60;

let cacheToken = { valor: null, vence: 0 };

// ---------- Acceso a Firestore con cuenta de servicio (JWT RS256 con WebCrypto) ----------
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlTexto = (t) => b64url(new TextEncoder().encode(t));

async function tokenGoogle(sa) {
  if (cacheToken.valor && Date.now() < cacheToken.vence) return cacheToken.valor;
  const ahora = Math.floor(Date.now() / 1000);
  const cab = b64urlTexto(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cuerpo = b64urlTexto(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: ahora, exp: ahora + 3600 }));
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const clave = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const firma = b64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", clave, new TextEncoder().encode(`${cab}.${cuerpo}`)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${cab}.${cuerpo}.${firma}` })
  });
  if (!r.ok) throw new Error("oauth " + r.status);
  const j = await r.json();
  cacheToken = { valor: j.access_token, vence: Date.now() + (j.expires_in - 300) * 1000 };
  return cacheToken.valor;
}

const valor = (v) => v == null ? undefined : v.stringValue ?? (v.integerValue != null ? Number(v.integerValue) : v.doubleValue ?? v.booleanValue ?? (v.mapValue ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, valor(x)])) : undefined));
const hoyLima = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
const sumarDias = (f, n) => { const d = new Date(f + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

async function leerReservas(sa) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents:runQuery`, {
    method: "POST",
    headers: { authorization: "Bearer " + await tokenGoogle(sa), "content-type": "application/json" },
    // Solo un filtro de rango (no requiere índice compuesto); el estado se filtra aquí.
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: "reservas" }],
      where: { fieldFilter: { field: { fieldPath: "fecha" }, op: "GREATER_THAN_OR_EQUAL", value: { stringValue: sumarDias(hoyLima(), -DIAS_ATRAS) } } },
      orderBy: [{ field: { fieldPath: "fecha" }, direction: "ASCENDING" }], limit: 3000 } })
  });
  if (!r.ok) throw new Error("firestore " + r.status);
  return (await r.json()).filter((x) => x.document).map((x) => Object.fromEntries(Object.entries(x.document.fields || {}).map(([k, v]) => [k, valor(v)])));
}

// ---------- iCalendar ----------
const esc = (t) => String(t ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const limpio = (t) => String(t ?? "").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "").replace(/\+?\d[\d\s().-]{6,}\d/g, "").trim(); // sin mails ni teléfonos
function plegar(linea) {
  const enc = new TextEncoder(); const partes = []; let actual = "";
  for (const ch of linea) { if (enc.encode(actual + ch).length > (partes.length ? 74 : 75)) { partes.push(actual); actual = ch; } else actual += ch; }
  partes.push(actual);
  return partes.map((p, i) => (i ? " " + p : p)).join("\r\n");
}
function rango(r) {
  const [h, m] = (r.hora || "00:00").split(":").map(Number);
  const fin = h * 60 + m + (Number(r.duracionMin) > 0 ? Number(r.duracionMin) : 90);
  const fechaFin = fin >= 1440 ? sumarDias(r.fecha, Math.floor(fin / 1440)) : r.fecha;
  const f = (fecha, hh, mm) => `${fecha.replace(/-/g, "")}T${String(hh).padStart(2, "0")}${String(mm).padStart(2, "0")}00`;
  return { ini: f(r.fecha, h, m), fin: f(fechaFin, Math.floor((fin % 1440) / 60), fin % 60) };
}
const primerNombre = (n) => String(n || "").trim().split(/\s+/)[0];

export function construirIcs(reservas, ahora = new Date()) {
  // Una clase = una sesión (sede + fecha + hora); un grupo con varios alumnos es UN evento. Las canceladas no entran.
  const sesiones = new Map();
  reservas.filter((r) => r.estado === "confirmada" && r.fecha && r.hora).forEach((r) => {
    const k = `${r.pistaId || r.pistaNombre || "sede"}|${r.fecha}|${r.hora}`;
    (sesiones.get(k) || sesiones.set(k, []).get(k)).push(r);
  });
  const sello = ahora.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const L = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Academia de Padel GP//Clases//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Clases Academia Pádel GP", `X-WR-TIMEZONE:${ZONA}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
    "BEGIN:VTIMEZONE", `TZID:${ZONA}`, "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0500", "TZNAME:-05", "END:STANDARD", "END:VTIMEZONE"
  ];
  [...sesiones.entries()].sort((a, b) => a[0].split("|").slice(1).join().localeCompare(b[0].split("|").slice(1).join())).forEach(([k, rs]) => {
    const r = rs[0], { ini, fin } = rango(r);
    const nombres = [...new Set(rs.map((x) => primerNombre(x.alumnoNombre)).filter(Boolean))];
    const quien = nombres.length > 3 ? `${nombres.length} alumnos` : nombres.join(", ");
    const tipo = r.tipoClase || "Clase";
    const desc = [`Tipo: ${tipo}`, r.modalidad && `Modalidad: ${r.modalidad}`, r.nivel && `Nivel: ${limpio(r.nivel)}`, r.notas && `Notas: ${limpio(r.notas)}`].filter(Boolean).join("\n");
    L.push("BEGIN:VEVENT", `UID:clase-${k.replace(/[^A-Za-z0-9]+/g, "-")}@${DOMINIO}`, `DTSTAMP:${sello}`,
      `DTSTART;TZID=${ZONA}:${ini}`, `DTEND;TZID=${ZONA}:${fin}`, `SUMMARY:${esc("🎾 Pádel · " + tipo + (quien ? " · " + quien : ""))}`);
    if (r.pistaNombre) L.push(`LOCATION:${esc(r.pistaNombre)}`);
    L.push(`DESCRIPTION:${esc(desc)}`, "STATUS:CONFIRMED", "END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.map(plegar).join("\r\n") + "\r\n";
}

// ---------- Worker ----------
function iguales(a, b) { // comparación en tiempo constante
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/calendario/clases.ics" || !["GET", "HEAD"].includes(request.method)) return new Response("No encontrado", { status: 404 });
    if (!env.FEED_TOKEN || env.FEED_TOKEN.length < 32 || !iguales(url.searchParams.get("token") || "", env.FEED_TOKEN)) return new Response("No encontrado", { status: 404 });
    try {
      const ics = construirIcs(await leerReservas(JSON.parse(env.SA_JSON)));
      return new Response(request.method === "HEAD" ? null : ics, { headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": 'inline; filename="clases.ics"',
        "cache-control": "private, max-age=300",
        "x-robots-tag": "noindex, nofollow"
      } });
    } catch (e) {
      return new Response("Calendario no disponible por ahora", { status: 502 });
    }
  }
};
