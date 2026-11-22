#!/usr/bin/env python3
"""Convierte las imágenes JPG/PNG de assets/img a WebP (calidad 80, máx. 1600 px de ancho).
Deja los originales como respaldo (<picture> usa el WebP y cae al JPG/PNG). Uso: python3 scripts/sitio/webp.py [--forzar]
No convierte íconos de la app (arbitro-icon-*, favicon), que deben seguir en PNG."""
import sys
from pathlib import Path
from PIL import Image

raiz = Path(__file__).resolve().parents[2] / "assets" / "img"
forzar = "--forzar" in sys.argv
antes = despues = n = 0
omitidas = []
for p in sorted(raiz.rglob("*")):
    if p.suffix.lower() not in (".jpg", ".jpeg", ".png") or p.stem.startswith(("arbitro-icon", "favicon", "icon")):
        continue
    destino = p.with_suffix(".webp")
    if destino.exists() and not forzar and destino.stat().st_mtime >= p.stat().st_mtime:
        continue
    with Image.open(p) as im:
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        im.save(destino, "WEBP", quality=80, method=6)
    if destino.stat().st_size >= p.stat().st_size:  # no conviene: se queda el original
        destino.unlink(); omitidas.append(p.name); continue
    antes += p.stat().st_size; despues += destino.stat().st_size; n += 1
print(f"{n} imágenes convertidas · {antes/1024:.0f} KB → {despues/1024:.0f} KB" + (f" ({100-100*despues/antes:.0f}% menos)" if antes else ""))
if omitidas:
    print(f"{len(omitidas)} sin WebP (el original ya pesa menos): " + ", ".join(omitidas[:6]) + ("…" if len(omitidas) > 6 else ""))
