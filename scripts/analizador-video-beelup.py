#!/usr/bin/env python3
"""
Analizador de video (IA) -- academiadepadel.pe

Qué hace: busca en Firestore los pedidos de análisis que el profesor creó
desde "Mis clases" -> "Analizador de video (IA)" (colección `analisisVideo`,
estado "pendiente"), descarga el video correspondiente de Beelup, lo manda
a una IA multimodal para que lo analice, y escribe el resultado de vuelta
en el mismo documento. El sitio web (estático, sin backend propio) solo
crea el pedido y muestra el resultado -- todo el trabajo pesado pasa acá,
fuera de la web, igual que el script nocturno que ya escribe videoUrl en
las reservas.

Se corre como un job periódico (cron), NO queda corriendo: procesa los
pedidos pendientes que encuentre y termina.

---------------------------------------------------------------------------
PENDIENTE antes de poder usar esto en serio -- dos huecos reales:

1. obtener_video_beelup(): no sé cómo Beelup expone sus videos por
   cancha/fecha/hora sin que exista una reserva ya vinculada. Confirmar
   con ellos (API REST, portal propio, carpeta de Drive con estructura
   predecible...) y reemplazar el cuerpo de esa función. Hoy lanza
   NotImplementedError a propósito para no fingir que funciona.

2. API key de la IA (Gemini): crear una en https://aistudio.google.com/
   y ponerla en la variable de entorno GEMINI_API_KEY. Se eligió Gemini
   porque acepta video nativo (no hay que recortar en fotogramas) y ya
   estás en el ecosistema de Google (Firebase/Drive) -- si prefieres otro
   proveedor, avisa y se cambia analizar_video_con_ia().

Dependencias: pip install firebase-admin google-generativeai
Variables de entorno:
  GOOGLE_APPLICATION_CREDENTIALS = ruta al JSON de la cuenta de servicio
                                    (la misma que usa el sync nocturno)
  GEMINI_API_KEY                 = API key de Gemini
---------------------------------------------------------------------------
"""

import os
import tempfile
import traceback

import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai

PROYECTO_FIRESTORE = "academiadepadel-e5441"

PROMPT_ANALISIS = """Eres un analista táctico de pádel. Mira este video de
una clase o partido y da un análisis claro y práctico, en español, para el
profesor. Estructura la respuesta así:

1. Resumen general (2-3 líneas): nivel de juego, ritmo del punto.
2. Lo que funcionó bien (golpes, posicionamiento, decisiones).
3. Errores o patrones a corregir, con el momento aproximado si lo puedes
   ubicar (ej. "minuto 2:30, remate que sale largo").
4. 2-3 sugerencias concretas para la próxima clase con este/estos jugadores.

No inventes datos que no puedas ver en el video (no digas velocidades
exactas de pelota ni estadísticas que no se puedan observar a simple
vista). Si el video no muestra pádel o no se puede analizar, dilo
directamente en vez de inventar un análisis.
"""


def init_firestore():
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {"projectId": PROYECTO_FIRESTORE})
    return firestore.client()


def obtener_video_beelup(cancha: str, fecha: str, hora: str) -> str:
    """Debe devolver la ruta local a un archivo de video ya descargado.

    PENDIENTE -- ver cabecera del archivo. Reemplazar este cuerpo en cuanto
    se confirme cómo Beelup permite ubicar un video por cancha/fecha/hora
    sin una reserva ya vinculada.
    """
    raise NotImplementedError(
        "obtener_video_beelup() no está implementado todavía -- falta "
        "confirmar cómo Beelup expone sus videos por cancha/fecha/hora "
        "(API, portal, carpeta de Drive con estructura fija, etc.). "
        f"Pedido: cancha={cancha!r} fecha={fecha!r} hora={hora!r}."
    )


def analizar_video_con_ia(ruta_video: str) -> str:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    archivo = genai.upload_file(ruta_video)
    modelo = genai.GenerativeModel("gemini-2.5-pro")
    respuesta = modelo.generate_content([archivo, PROMPT_ANALISIS])
    genai.delete_file(archivo.name)
    return respuesta.text


def procesar_pedido(db, doc_ref, datos):
    cancha, fecha, hora = datos["cancha"], datos["fecha"], datos["hora"]
    doc_ref.update({"estado": "procesando"})
    try:
        with tempfile.TemporaryDirectory() as tmp:
            ruta_video = obtener_video_beelup(cancha, fecha, hora)
            resultado = analizar_video_con_ia(ruta_video)
        doc_ref.update({"estado": "listo", "resultado": resultado})
        print(f"[ok] {doc_ref.id}: cancha {cancha} {fecha} {hora}")
    except Exception as err:
        doc_ref.update({"estado": "error", "error": str(err)})
        print(f"[error] {doc_ref.id}: {err}")
        traceback.print_exc()


def main():
    db = init_firestore()
    pendientes = db.collection("analisisVideo").where("estado", "==", "pendiente").stream()
    pedidos = [(doc.reference, doc.to_dict()) for doc in pendientes]
    if not pedidos:
        print("Sin pedidos pendientes.")
        return
    for doc_ref, datos in pedidos:
        procesar_pedido(db, doc_ref, datos)


if __name__ == "__main__":
    main()
