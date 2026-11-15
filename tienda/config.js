// Configuración de la tienda. Esto es lo único que tocás para cambiar datos básicos.
// Para actualizar productos NO hace falta tocar código: reemplazá productos.csv.

// Tu WhatsApp, con código de país y sin "+" ni espacios.
export const WHATSAPP = "51957085531";

// De dónde se leen los productos (CSV con las columnas de README.md).
export const CSV_URL = "productos.csv";

// Cómo empieza el mensaje que te llega por WhatsApp.
export const SALUDO = "Hola Gabo";

// Cuántos productos se muestran por tanda en el listado.
export const POR_PAGINA = 24;

// Cuántas tarjetas tiene "Recomendadas para empezar".
export const MAX_RECOMENDADAS = 10;

// Talles que se ofrecen cuando el CSV no trae la columna "tallas" del producto.
export const TALLES_ZAPATILLAS = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
export const TALLES_ROPA = ["Única", "S", "M", "L", "XL", "XXL"];

// REFERENCIA PRIVADA DE TIENDA. Cada pedido de WhatsApp termina con "Ref: T1", "Ref: T2"…
// El cliente solo ve un código sin sentido; vos sabés a qué tienda corresponde (apuntalo en tu
// propia libreta, NO lo escribas acá). Se toma de la columna "ref_tienda" del CSV si existe;
// si no, del servidor de la foto, según esta tabla. Cambiá o agregá códigos como quieras.
export const REF_POR_DOMINIO = {
  "www.bullpadel.com.pe": "T1",
  "cms.limapadel.pe": "T2",
  "padelhouse.pe": "T3",
  "www.mercadopadelperu.com": "T4",
  "cdn.shopify.com": "T5",
  "static.wixstatic.com": "T6",
  "nizmaeaiphwrtxtsowpq.supabase.co": "T7"
};
