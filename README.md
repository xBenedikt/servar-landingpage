# SERVÅR – Flat-Pack Home Server

Fiktive IKEA-Produkt-Landingpage · Semesterarbeit HFU Furtwangen ·
Kurs *Responsive Design*, SoSe 2026 · Benedikt Mohr.

Vanilla HTML/CSS/JS (kein Build-Step). Eine Codebasis, **drei Editionen** mit
je eigener Zielgruppe – umschaltbar über die Leiste ganz oben:

| Seite | Edition | Zielgruppe |
|-------|---------|------------|
| [`index.html`](index.html) | **Trä / Original** – hell, IKEA-Blau/Gelb, Birkenholz | Einsteiger, Datenschutz-Bewusste |
| [`mork.html`](mork.html)   | **Mörk / Pro** – dunkel, eloxiertes Aluminium, geräucherte Eiche, kühl-blaue Stealth-LED | Gamer, IT-Spezialisten, Content Creator |
| [`nomad.html`](nomad.html) | **Säker / Nomad** – robust, oliv/terrakotta, IP54, Akku & Solar | Krisenvorsorger, Tiny-House, Van-Life |

Die Themes liegen in [`css/themes.css`](css/themes.css) (Klasse am `<body>`).
Die beiden Varianten werden aus `index.html` generiert:

```bash
python tools/build_versions.py   # erzeugt mork.html + nomad.html neu
```

> Bilder/Videos der Pro- und Nomad-Edition werden noch ausgetauscht; aktuell
> dienen die Original-Medien als Platzhalter (bei *Mörk* per CSS abgedunkelt).

## Struktur
- `css/` – `tokens.css`, `reset.css`, `layout.css`, `main.css`, `components.css`, `landing.css`, `themes.css`
- `js/` – `components.js` (Komponenten), `landing.js` (Scroll-Animationen, Marquee, Modals …)
- `assets/` – `hero/` (Video + Poster), `img/` (optimierte WebP), `server/frames/` (Canvas-Bildsequenz)
- `tools/` – Build-Skripte (Bild-Optimierung, Versions-Generator)
