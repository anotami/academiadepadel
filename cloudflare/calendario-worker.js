// Cloudflare Worker: sirve el calendario de clases como https://calendario.academiadepadel.pe/<token>.ics
// Lee el documento calendario_feed/<token> de Firestore (regla: lectura por token exacto, sin listar) y lo
// devuelve como text/calendar para que Google Calendar lo suscriba. No guarda ni necesita ningún secreto.
const PROYECTO = "academiadepadel-e5441";

export default {
  async fetch(request) {
    const m = new URL(request.url).pathname.match(/^\/([a-f0-9]{32})\.ics$/);
    if (!m || request.method !== "GET") return new Response("No encontrado", { status: 404 });
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents/calendario_feed/${m[1]}`);
    if (!r.ok) return new Response("No encontrado", { status: 404 });
    const ics = (await r.json())?.fields?.ics?.stringValue;
    if (!ics) return new Response("No encontrado", { status: 404 });
    return new Response(ics, { headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex"
    } });
  }
};
