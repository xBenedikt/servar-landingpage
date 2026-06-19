#!/usr/bin/env python3
"""
Batch-Optimierung der SERVÅR-Aufbau-Frames: PNG -> WebP.

Drei Hebel: Format (WebP lossy), Auflösung (max-width) und Anzahl (step).
Braucht nur Pillow (schon installiert).

Beispiele:
    # Standard: PNGs aus ./src, Ausgabe nach ./optimized, 900px, Q80
    python optimize_frames.py "C:/pfad/zu/png-frames"

    # Nur jeden 2. Frame, etwas kleiner/leichter
    python optimize_frames.py "C:/pfad/zu/png-frames" --step 2 --max-width 800 --quality 78

    # Direkt in den Asset-Ordner schreiben
    python optimize_frames.py "C:/pfad/zu/png-frames" -o "../assets/server"
"""
import sys
import os
import glob
import argparse
from PIL import Image


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def main():
    ap = argparse.ArgumentParser(description="PNG-Frames -> optimierte WebP-Sequenz")
    ap.add_argument("src", help="Ordner mit den PNG-Frames")
    ap.add_argument("-o", "--out", default=None,
                    help="Zielordner (Default: <src>/../optimized)")
    ap.add_argument("--max-width", type=int, default=900,
                    help="Frames auf diese Breite herunterskalieren (Default 900)")
    ap.add_argument("--quality", type=int, default=80,
                    help="WebP-Qualität 0-100 (Default 80)")
    ap.add_argument("--step", type=int, default=1,
                    help="jeden N-ten Frame nehmen (Default 1 = alle)")
    ap.add_argument("--prefix", default="frame-",
                    help="Dateiname-Präfix der Ausgabe (Default 'frame-')")
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.src, "*.png")))
    if not files:
        print("Keine PNGs gefunden in:", args.src)
        sys.exit(1)

    files = files[::args.step]
    out = args.out or os.path.join(os.path.dirname(os.path.abspath(args.src.rstrip("/\\"))), "optimized")
    os.makedirs(out, exist_ok=True)

    src_total = dst_total = 0
    for i, f in enumerate(files, 1):
        src_total += os.path.getsize(f)
        im = Image.open(f)
        im = im.convert("RGBA") if "A" in im.getbands() else im.convert("RGB")
        if im.width > args.max_width:
            h = round(im.height * args.max_width / im.width)
            im = im.resize((args.max_width, h), Image.LANCZOS)
        dst = os.path.join(out, f"{args.prefix}{i:04d}.webp")
        im.save(dst, "WEBP", quality=args.quality, method=6)
        dst_total += os.path.getsize(dst)

    saved = (1 - dst_total / src_total) * 100 if src_total else 0
    print(f"{len(files)} Frames  ->  {out}")
    print(f"Vorher: {human(src_total)}   Nachher: {human(dst_total)}   (-{saved:.0f} %)")
    print(f"Durchschnitt/Frame: {human(dst_total / max(1, len(files)))}")


if __name__ == "__main__":
    main()
