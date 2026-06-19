#!/usr/bin/env python3
"""
Mappt die generierten Bilder (assets/genimages) auf die Landingpage-Slots,
optimiert sie (Resize + WebP) und legt sie unter assets/img/ ab.

Hochformat-Bilder werden NICHT vorab beschnitten — das Seitenverhältnis der
Slots regelt das CSS (object-fit: cover). Nur die quadratischen Thumbnails
werden mittig auf 1:1 zugeschnitten.

Aufruf (aus dem Projektordner):
    python tools/build_images.py
"""
import glob
import os
import sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "genimages")
OUT = os.path.join(ROOT, "assets", "img")
FRAMES = os.path.join(ROOT, "assets", "server", "frames")


def human(n):
    return f"{n/1048576:.1f}MB" if n > 1048576 else f"{n/1024:.0f}KB"


def find(pattern):
    hits = glob.glob(os.path.join(SRC, pattern))
    return hits[0] if hits else None


def resize_cap(im, cap):
    w, h = im.size
    if max(w, h) > cap:
        if w >= h:
            im = im.resize((cap, round(h * cap / w)), Image.LANCZOS)
        else:
            im = im.resize((round(w * cap / h), cap), Image.LANCZOS)
    return im


def center_square(im):
    w, h = im.size
    s = min(w, h)
    l, t = (w - s) // 2, (h - s) // 2
    return im.crop((l, t, l + s, t + s))


# (Quell-Glob, Zielname, Modus, Cap-Pixel, Qualitaet)
#   Modus: 'fit' = nur skalieren · 'square' = mittig quadratisch zuschneiden
JOBS = [
    # Feature-Reihen (A1/A2/A3 = Reihe 1/2/3, alle Querformat 4:3)
    ("*home_server_tidy*",      "feature-privatsphaere.webp",   "fit",    1280, 82),
    ("*box_assembly*",          "feature-aufbau.webp",          "fit",    1280, 82),
    ("*A3_expansion_module*",   "feature-kosten.webp",          "fit",    1280, 82),
    # Community-Feed (3:4) — die "Instagram_*"-Aufnahmen
    ("*wooden_desk*",           "community-1.webp",             "fit",    1080, 80),
    ("*post_living_room*",      "community-2.webp",             "fit",    1080, 80),
    ("*Hobbyroom*",             "community-3.webp",             "fit",    1080, 80),
    ("*Instagram_Use_of_product*", "community-4.webp",          "fit",    1080, 80),
    ("*post_imperfec*",         "community-5.webp",             "fit",    1080, 80),
    ("*people_of_color*",       "community-6.webp",             "fit",    1080, 80),
    # Produkt-Thumbnails (1:1, Weiß-Freisteller)
    ("*home_server_on_white*",  "produkt-basis.webp",           "square",  512, 82),
    ("*expansion_kit_on_white*","produkt-modul.webp",           "square",  512, 82),
    ("*Allen_key*",             "produkt-fixa.webp",            "square",  512, 82),
    # Aufbauanleitung (Doku, größer + höhere Qualität → Text lesbar)
    #   Muster eindeutig halten: "_2…" = Desktop (quer), "_mobile" = Hochformat
    ("*Instructions_2*",        "aufbauanleitung.webp",         "fit",    1800, 86),
    ("*Instructions_mobile*",   "aufbauanleitung-mobile.webp",  "fit",    1200, 86),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    src_total = dst_total = 0
    missing = []

    for pat, name, mode, cap, q in JOBS:
        f = find(pat)
        if not f:
            missing.append((name, pat))
            continue
        src_total += os.path.getsize(f)
        im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        if mode == "square":
            im = center_square(im)
        im = resize_cap(im, cap)
        dst = os.path.join(OUT, name)
        im.save(dst, "WEBP", quality=q, method=6)
        dst_total += os.path.getsize(dst)
        print(f"  {name:<28} {im.width}x{im.height:<5} {human(os.path.getsize(dst))}")

    print("-" * 50)
    print(f"Quellen gesamt: {human(src_total)}   ->   WebP gesamt: {human(dst_total)}")
    if missing:
        print("\nFEHLT (kein passendes Quellbild gefunden):")
        for name, pat in missing:
            print(f"  - {name}   (Suchmuster {pat})")


if __name__ == "__main__":
    main()
