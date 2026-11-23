#!/usr/bin/env python3
"""Pasa el texto visible de las páginas HTML a voseo rioplatense y "cancha" -> "pista".
Solo toca texto, atributos de texto (alt, title, placeholder, aria-label, meta description/og/twitter) y las cadenas
del JSON-LD. No toca URLs, ids, clases ni código.
Uso:  python3 scripts/sitio/voseo.py ARCHIVO.html [...]          (simulación: muestra los cambios)
      python3 scripts/sitio/voseo.py --aplicar ARCHIVO.html [...] (escribe los archivos)
      python3 scripts/sitio/voseo.py --resto ARCHIVO.html [...]   (lista lo que podría seguir en "tú")"""
import re, sys, json

# presente de indicativo tú -> vos (formas inequívocas)
VERBOS = {
 "eres":"sos","tienes":"tenés","quieres":"querés","puedes":"podés","sabes":"sabés","necesitas":"necesitás","vives":"vivís",
 "prefieres":"preferís","trabajas":"trabajás","buscas":"buscás","haces":"hacés","juegas":"jugás","aprendes":"aprendés",
 "llevas":"llevás","empiezas":"empezás","decides":"decidís","pides":"pedís","sientes":"sentís",
 "piensas":"pensás","conoces":"conocés","comienzas":"comenzás","deseas":"deseás","recibes":"recibís",
 "olvidas":"olvidás","sigues":"seguís","entiendes":"entendés","dices":"decís",
 "vienes":"venís","pones":"ponés","traes":"traés","escribes":"escribís","lees":"leés","ves":"ves","vas":"vas",
 "eliges":"elegís","participas":"participás","practicas":"practicás","disfrutas":"disfrutás","das":"das",
 "dejas":"dejás","cambias":"cambiás","logras":"lográs","consigues":"conseguís","debes":"debés",
 "sostienes":"sostenés","reprogramas":"reprogramás","escuchas":"escuchás","avisas":"avisás","cancelas":"cancelás","llegas":"llegás","inscribes":"inscribís","ingresas":"ingresás","confirmas":"confirmás","recuerdas":"recordás","encuentras":"encontrás","pierdes":"perdés","vuelves":"volvés","compartes":"compartís","terminas":"terminás","empiezas":"empezás","miras":"mirás","acompañas":"acompañás","aprovechas":"aprovechás","sumas":"sumás","pruebas":"probás","atiendes":"atendés","apuntas":"apuntás","llamas":"llamás","avanzas":"avanzás","entrenas":"entrenás","usas":"usás","pagas":"pagás","tardas":"tardás","corres":"corrés",
}
# imperativo tú -> vos (solo al empezar una frase o botón)
IMPER = {
 "agenda":"agendá","elige":"elegí","escribe":"escribí","mira":"mirá","cuéntanos":"contanos","escríbenos":"escribinos",
 "déjanos":"dejanos","pregúntanos":"preguntanos","reserva":"reservá","pide":"pedí","consulta":"consultá","ven":"vení",
 "aprende":"aprendé","descubre":"descubrí","conoce":"conocé","únete":"unite","anótate":"anotate","empieza":"empezá",
 "mejora":"mejorá","retoma":"retomá","recarga":"recargá","vuelve":"volvé","intenta":"intentá","revisa":"revisá","perfecciona":"perfeccioná","deja":"dejá","encuentra":"encontrá","comparte":"compartí",
 "completa":"completá","revisa":"revisá","descarga":"descargá","haz":"hacé","ten":"tené","pon":"poné","sigue":"seguí",
 "usa":"usá","compra":"comprá","lee":"leé","ve":"mirá","inscríbete":"inscribite","regístrate":"registrate",
 "ingresa":"ingresá","entra":"entrá","selecciona":"seleccioná","indica":"indicá","confirma":"confirmá","avísanos":"avisanos",
 "llámanos":"llamanos","contáctanos":"contactanos","visítanos":"visitanos","pruébalo":"probalo","cuéntame":"contame","dime":"decime",
 "sube":"subí","elígelo":"elegilo","mide":"medí","dale":"dale","sé":"sé","di":"decí","toma":"tomá","juega":"jugá","practica":"practicá",
 "disfruta":"disfrutá","actualiza":"actualizá","contacta":"contactá","agrega":"agregá","visita":"visitá","accede":"accedé","aprovecha":"aprovechá","carga":"cargá","corrige":"corregí","evita":"evitá","olvida":"olvidá","recuerda":"recordá","piensa":"pensá","trabaja":"trabajá","entrena":"entrená","sube":"subí","descúbrelo":"descubrilo","descúbrela":"descubrila","pruébala":"probala","consúltanos":"consultanos","encuéntralo":"encontralo","conócelo":"conocelo","míralo":"miralo","elígela":"elegila","reservalo":"reservalo","súmate":"sumate","apúntate":"apuntate","pregunta":"preguntá","busca":"buscá","abre":"abrí","vuelve":"volvé",
}
IMPER_B = {"crea":"creá","marca":"marcá","publica":"publicá","coordina":"coordiná","envía":"enviá","inicia":"iniciá","guarda":"guardá","cancela":"cancelá","copia":"copiá","cambia":"cambiá","borra":"borrá","cierra":"cerrá","invita":"invitá","anota":"anotá","vincula":"vinculá","ordena":"ordená","filtra":"filtrá","carga":"cargá","pega":"pegá","toca":"tocá","espera":"esperá","verifica":"verificá","cuéntale":"contale","inténtalo":"intentalo","avísale":"avisale","pídele":"pedile","escríbele":"escribile","llámalo":"llamalo"}
PALABRAS = {"tú ganas":"vos ganás","Tú ganas":"Vos ganás","contigo":"con vos","tú":"vos","Tú":"Vos","si faltas":"si faltás","lo que ganas":"lo que ganás","si reservas":"si reservás","no reservas":"no reservás"}
CANCHA = [("canchas","pistas"),("Canchas","Pistas"),("cancha","pista"),("Cancha","Pista"),("CANCHAS","PISTAS"),("CANCHA","PISTA")]
L = r"A-Za-zÁÉÍÓÚáéíóúÑñÜü"
from collections import Counter
CAMBIOS = Counter()
def caso(orig, nuevo): return nuevo.capitalize() if orig[:1].isupper() else nuevo

def convertir(t):
    for a, b in CANCHA: t = re.sub(rf"(?<![{L}0-9_-]){a}(?![{L}0-9_-])", b, t)
    for a, b in PALABRAS.items(): t = re.sub(rf"(?<![{L}]){a}(?![{L}])", b, t)
    t = re.sub(rf"(?<![{L}])({'|'.join(VERBOS)})(?![{L}])", lambda m: (CAMBIOS.update([(m.group(1), caso(m.group(1), VERBOS[m.group(1).lower()]))]) or caso(m.group(1), VERBOS[m.group(1).lower()])), t, flags=re.I)
    # imperativos: inicio de texto o después de . ! ? : — ¿ ¡ y seguidos de un artículo/posesivo/preposición (no "tu agenda")
    imp = "|".join(sorted(IMPER, key=len, reverse=True))
    t = re.sub(rf"(^\s*|(?<=>)|[.!?:—–¡¿(]\s*|\n\s*|,\s+(?=(?:escribe|elige|avísanos|contáctanos|llámanos|escríbenos|consulta|mira|pide|haz|ven|prueba|retoma|aprende)\b))((?:[^{L}\s]\s*)?)({imp})(?=\s+(?:tu|tus|el|la|los|las|un|una|con|por|a|en|de|y|o|que|si|mi|nuestro|nuestra|ya|ahora|hoy|más|para|su|al|pista|pistas|horario|programa|día|nivel|sede|clase|pádel|cómo|qué|dónde|cuánto|aquí|desde|cuando|cuándo|lo|nuestros|estas|este|esta|disponibilidad|vos|también|primero)\b|\s*[.!?→»(]|\s*$)",
               lambda m: (CAMBIOS.update([(m.group(3), caso(m.group(3), IMPER[m.group(3).lower()]))]) or m.group(1) + m.group(2) + caso(m.group(3), IMPER[m.group(3).lower()])), t, flags=re.I)
    impb = "|".join(sorted(IMPER_B, key=len, reverse=True))
    t = re.sub(rf"(^\s*|(?<=>)|[!?¡¿]\s+)(?:([^{L}\s])\s*)?({impb})(?=\s+(?:tu|tus|los|las|el|la|un|una|con|cuándo|cuando|sesión|en|a|que|su|nuestro)\b|\s*[.!?→»(]|\s*$)",
               lambda m: (CAMBIOS.update([(m.group(3), caso(m.group(3), IMPER_B[m.group(3).lower()]))]) or m.group(1) + (m.group(2) or "") + caso(m.group(3), IMPER_B[m.group(3).lower()])) if m.group(3).lower() != "marca" or True else m.group(0), t, flags=re.I)
    t = re.sub(rf"(?<=[\s(][yo]\s)(retoma|aprende|elige|escribe|mira|pide|haz|ven|descubre|conoce|recarga|vuelve|revisa|intenta)(?=\s+(?:la|el|los|las|tu|tus|un|una|con|que|desde|más|a|de|vos)\b)",
               lambda m: IMPER[m.group(1).lower()], t)
    return t

ATTR = re.compile(r'(\b(?:alt|title|placeholder|aria-label)=")([^"]*)(")', re.I)
META = re.compile(r'(<meta\b[^>]*?\b(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"[^>]*?\bcontent=")([^"]*)(")', re.I)
META2 = re.compile(r'(<meta\b[^>]*?\bcontent=")([^"]*)("[^>]*?\b(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)")', re.I)

def _valor_json(m):
    lit = m.group(0)
    if re.match(r'"\s*:', m.string[m.end():m.end()+3]) or re.match(r'^"(https?:|/|[\w.-]+\.(?:jpg|png|webp|svg)"$|@)', lit): return lit
    return '"' + convertir(lit[1:-1]) + '"'

def en_json_texto(t): return re.sub(r'"(?:[^"\\]|\\.)*"', _valor_json, t)

def procesar(html):
    partes = re.split(r"(<script\b[\s\S]*?</script>|<style\b[\s\S]*?</style>|<!--[\s\S]*?-->|<[^>]+>)", html)
    sal = []
    for p in partes:
        if p.startswith("<script"):
            m = re.match(r'(<script[^>]*application/ld\+json[^>]*>)([\s\S]*?)(</script>)', p)
            if m:
                p = m.group(1) + en_json_texto(m.group(2)) + m.group(3)
            sal.append(p)
        elif p.startswith(("<style", "<!--")): sal.append(p)
        elif p.startswith("<"):
            p = META.sub(lambda m: m.group(1) + convertir(m.group(2)) + m.group(3), p)
            p = META2.sub(lambda m: m.group(1) + convertir(m.group(2)) + m.group(3), p)
            sal.append(ATTR.sub(lambda m: m.group(1) + convertir(m.group(2)) + m.group(3), p))
        else: sal.append(convertir(p))
    return "".join(sal)

if __name__ == "__main__":
    args = sys.argv[1:]; resumen = "--resumen" in args; aplicar = "--aplicar" in args; resto = "--resto" in args
    for f in [a for a in args if not a.startswith("--")]:
        h = open(f, encoding="utf-8").read(); n = procesar(h)
        if resumen: continue
        if resto:
            txt = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", n); txt = re.sub(r"<[^>]+>", "\n", txt)
            pat = re.compile(r"\b(tú|tienes|quieres|puedes|sabes|necesitas|contigo|elige|escribe|mira|reserva|agenda|consulta|pide|aprende|haz|cuéntanos|escríbenos)\b", re.I)
            for l in [x.strip() for x in txt.split("\n") if x.strip() and pat.search(x)]: print(f"{f}: {l[:170]}")
            continue
        if n == h: print(f"{f}: sin cambios"); continue
        if aplicar: open(f, "w", encoding="utf-8", newline="").write(n); print(f"{f}: escrito")
        else:
            import difflib
            a, b = h.split("\n"), n.split("\n"); c = 0
            for l in difflib.unified_diff(a, b, lineterm="", n=0):
                if l[:1] in "+-" and l[:3] not in ("+++", "---"):
                    c += l[0] == "+"; print(f"{l[0]} {l[1:].strip()[:210]}")
            print(f"== {f}: {c} líneas cambian")

    if resumen:
        for (a, b), c in sorted(CAMBIOS.items(), key=lambda x: (x[0][0].lower(), x[0][1])): print(f"{c:4d}  {a} -> {b}")
