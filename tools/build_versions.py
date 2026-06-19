#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Erzeugt die zwei Zielgruppen-Versionen aus index.html (= Original / Trä):
    mork.html   → SERVÅR „Mörk / Pro"   (dunkel, edel, leistungsstark)
    nomad.html  → SERVÅR „Säker / Nomad" (robust, off-grid, krisensicher)

Eine Codebasis: Struktur, SVGs, CSS und JS bleiben identisch. Pro Version
werden nur Theme-Klasse (<body>), Umschalter-Status, <title>/Meta und die
Texte (Copy) ausgetauscht. Jede Ersetzung wird geprüft – fehlt ein Muster,
bricht der Build mit Hinweis ab (kein stilles Daneben-Ersetzen).

Aufruf:  python tools/build_versions.py
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "index.html")


def build(src_text, repls, out_name):
    text = src_text
    misses = []
    for old, new in repls:
        if old not in text:
            misses.append(old)
            continue
        text = text.replace(old, new)
    if misses:
        print(f"\n[{out_name}] WARNUNG – {len(misses)} Muster nicht gefunden:")
        for m in misses:
            print("   ·", (m[:80] + "…") if len(m) > 80 else m)
    with open(os.path.join(ROOT, out_name), "w", encoding="utf-8") as f:
        f.write(text)
    print(f"[{out_name}] geschrieben ({len(text)} Zeichen, {len(repls)-len(misses)}/{len(repls)} Ersetzungen).")


def mq(term):
    """Marquee-Item als ganzes Element (eindeutig, trifft beide Hälften)."""
    return f'<span class="marquee__item">{term}</span>'


# ============================================================
#  MÖRK / PRO
# ============================================================
MORK = [
    # --- Theme + Umschalter ---
    ('<body>', '<body class="theme-mork">'),
    ('<a href="index.html" class="version-switch__link is-active" aria-current="page">Original</a>',
     '<a href="index.html" class="version-switch__link">Original</a>'),
    ('<a href="mork.html"  class="version-switch__link">Mörk · Pro</a>',
     '<a href="mork.html"  class="version-switch__link is-active" aria-current="page">Mörk · Pro</a>'),

    # --- <head> ---
    ('<title>SERVÅR – Dein eigener Server. Ohne Cloud, ohne Abo.</title>',
     '<title>SERVÅR Mörk – Dark-Aluminium Home-Server für Pros</title>'),
    ('<meta name="description" content="SERVÅR – der Flat-Pack Home Server. Einmalpreis statt Cloud-Abo, deine Daten bleiben zu Hause. Aufbau wie ein Möbelstück, Inbusschlüssel liegt bei.">',
     '<meta name="description" content="SERVÅR Mörk – die Pro-Edition: geräucherte Eiche, mattschwarzes Aluminium, 10-GbE-Speed und Stealth-LED. Für Gamer, Creator und IT-Enthusiasten.">'),

    # --- Hero ---
    ('<span class="hero__kicker-dot"></span>Flat-Pack Home Server',
     '<span class="hero__kicker-dot"></span>Pro-Edition · Dark Aluminium'),
    ('Dein eigener Server.<br>Ohne Cloud. <strong>Ohne Abo.</strong>',
     'Maximale Leistung.<br>Edles <strong>Dark Design.</strong>'),
    ('Schluss mit Cloud-Abos und fremden Rechenzentren. SERVÅR steht bei dir zu Hause –',
     'Geräucherte Eiche, mattschwarzes Aluminium und 10-GbE-Speed –'),
    ('deine Daten auch.', 'lüfterlos, flüsterleise, kompromisslos.'),
    ('class="btn btn--yellow btn--lg">Jetzt entdecken</a>',
     'class="btn btn--yellow btn--lg">Pro entdecken</a>'),
    # Art-Nr. (überall: Hero-Meta, Footer, Specs)
    ('503.847.62', '503.847.63'),

    # --- Marquee ---
    (mq('Kein Abo'),         mq('10 Gbit/s')),
    (mq('Deine Daten'),      mq('Geräucherte Eiche')),
    (mq('Kein Cloud-Zwang'), mq('Mattes Aluminium')),
    (mq('Offline-Zugriff'),  mq('RGB-Statusring')),
    (mq('Open Source'),      mq('Lüfterlos')),
    (mq('Werkzeug liegt bei'), mq('Stealth-Modus')),

    # --- Trust ---
    ('<span class="trust__eyebrow">Warum SERVÅR?</span>',
     '<span class="trust__eyebrow">Warum Mörk?</span>'),
    ('<h2 class="trust__title">Die Cloud war gestern.</h2>',
     '<h2 class="trust__title">Performance trifft Design.</h2>'),
    ('<span class="trust__item-title">Einmalpreis statt Abo</span>',
     '<span class="trust__item-title">Roh-Performance</span>'),
    ('Einmal kaufen, für immer nutzen. Keine monatlichen Gebühren für Dinge, die du nie nutzt.',
     'Acht Kerne, 16 GB RAM und NVMe-Speed – Streaming, Schnitt und VMs laufen parallel.'),
    ('<span class="trust__item-title">Daten bleiben zu Hause</span>',
     '<span class="trust__item-title">Edles Material</span>'),
    ('Fotos, Dokumente und Backups liegen auf deinem Gerät – nicht in fremden Rechenzentren.',
     'Geräucherte Eiche und eloxiertes Aluminium in Anthrazit – ein Objekt, das auf dem Schreibtisch bleiben darf.'),
    ('<span class="trust__item-title">Funktioniert offline</span>',
     '<span class="trust__item-title">Stealth-Modus</span>'),
    ('Voller Zugriff auf deine Daten – selbst wenn das Internet mal komplett weg ist.',
     'Der Statusring leuchtet kühl-blau – oder verschwindet auf Knopfdruck komplett im Dunkeln.'),
    ('<span class="trust__item-title">Aufbau wie ein Möbelstück</span>',
     '<span class="trust__item-title">Lüfterlos leise</span>'),
    ('Werkzeug liegt bei. Schritt für Schritt aufgebaut – ganz wie ein KALLAX-Regal.',
     'Passiv gekühlt, unter 20 dB. Du hörst dein Game, nicht deinen Server.'),

    # --- Assembly ---
    ('Vom Karton zum<br>eigenen Server.', 'Vom Karton zum<br>Power-Server.'),

    # --- Feature-Reihen ---
    ('<p class="feature__eyebrow">Privatsphäre</p>', '<p class="feature__eyebrow">Performance</p>'),
    ('<h2 class="feature__title">Deine Daten. Dein Gerät. Dein Zuhause.</h2>',
     '<h2 class="feature__title">Gebaut für echte Last.</h2>'),
    ('Kein Konzern liest mit. SERVÅR speichert alles lokal und verschlüsselt – du allein hältst den Schlüssel in der Hand.',
     'Octa-Core, 16 GB RAM und NVMe-SSD. Genug Reserven für 4K-Schnitt, Game-Streaming und virtuelle Maschinen – gleichzeitig.'),
    ('<p class="feature__eyebrow">Aufbau</p>', '<p class="feature__eyebrow">Design</p>'),
    ('<h2 class="feature__title">Aufbau wie ein KALLAX-Regal.</h2>',
     '<h2 class="feature__title">Dark Aluminium &amp; Eiche.</h2>'),
    ('Auspacken, zusammenstecken, einschalten. Die bebilderte Anleitung führt dich Schritt für Schritt – ganz ohne IT-Studium.',
     'Mattschwarz eloxiertes Aluminium, Deckel aus geräucherter Eiche. Ein Stück, das neben Mac und Monitor bestehen will.'),
    ('<p class="feature__eyebrow">Kosten</p>', '<p class="feature__eyebrow">Kontrolle</p>'),
    ('<h2 class="feature__title">Einmalpreis. Kein Abo. Nie wieder.</h2>',
     '<h2 class="feature__title">Dein Dashboard. Dark Mode.</h2>'),
    ('Du zahlst einmal – und dann nie wieder. Keine versteckten Gebühren, keine Preiserhöhung im dritten Jahr.',
     'Upload-Raten, Speicherbalken, Netzwerkauslastung – live im dunklen Dashboard. Volle Kontrolle, null Cloud.'),

    # --- Specs ---
    ('<h2 class="specs__title">Das steckt im Karton.</h2>',
     '<h2 class="specs__title">Das steckt im Dark-Gehäuse.</h2>'),
    ('Kompakte Leistung, die leise im Regal verschwindet – und mit dir mitwächst.',
     'Kompromisslose Hardware in eloxiertem Aluminium – flüsterleise und endlos erweiterbar.'),
    ('<span data-countup="2">0</span>&nbsp;TB', '<span data-countup="8">0</span>&nbsp;TB'),
    ('<dd>Quad-Core ARM</dd>', '<dd>Octa-Core ARM</dd>'),
    ('<dd>4 GB LPDDR5</dd>', '<dd>16 GB LPDDR5</dd>'),
    ('<dd>2 TB SSD</dd>', '<dd>8 TB NVMe</dd>'),
    ('<dd>2,5 Gbit/s LAN</dd>', '<dd>10 Gbit/s LAN</dd>'),
    ('<dd>Wi-Fi 6E · BT 5.3</dd>', '<dd>Wi-Fi 7 · BT 5.4</dd>'),
    ('<dd>Kunststoff · Birkenholz</dd>', '<dd>Alu · Geräucherte Eiche</dd>'),

    # --- CTA-Band + Footer ---
    ('Bereit für deinen<br>eigenen Server?', 'Bereit für deinen<br>Power-Server?'),
    ('<span class="price-tag__name">SERVÅR · 2 TB</span>',
     '<span class="price-tag__name">SERVÅR Mörk · 8 TB</span>'),
    ('data-main="499"', 'data-main="1299"'),
    ('Mehr Power. Weniger Schrauben. Dein eigener Server – designed in Schweden.',
     'Mehr Power. Edles Dark Design. Dein Pro-Server – designed in Schweden.'),

    # Hero-Badge zuletzt: Marquee/Trust-Treffer sind dann schon ersetzt → trifft nur das Hero-Badge
    ('Werkzeug liegt bei', 'Stealth-LED inklusive'),
]


# ============================================================
#  SÄKER / NOMAD
# ============================================================
NOMAD = [
    # --- Theme + Umschalter ---
    ('<body>', '<body class="theme-nomad">'),
    ('<a href="index.html" class="version-switch__link is-active" aria-current="page">Original</a>',
     '<a href="index.html" class="version-switch__link">Original</a>'),
    ('<a href="nomad.html" class="version-switch__link">Säker · Nomad</a>',
     '<a href="nomad.html" class="version-switch__link is-active" aria-current="page">Säker · Nomad</a>'),

    # --- <head> ---
    ('<title>SERVÅR – Dein eigener Server. Ohne Cloud, ohne Abo.</title>',
     '<title>SERVÅR Säker – Robuster Off-Grid Home-Server (IP54)</title>'),
    ('<meta name="description" content="SERVÅR – der Flat-Pack Home Server. Einmalpreis statt Cloud-Abo, deine Daten bleiben zu Hause. Aufbau wie ein Möbelstück, Inbusschlüssel liegt bei.">',
     '<meta name="description" content="SERVÅR Säker – die Outdoor-Edition: spritzwassergeschützt (IP54), mit Akku, Solar-Anschluss und Tragegriff. Für Tiny-House, Van-Life und Krisenvorsorge.">'),

    # --- Hero ---
    ('<span class="hero__kicker-dot"></span>Flat-Pack Home Server',
     '<span class="hero__kicker-dot"></span>Outdoor-Edition · IP54 · Solar-ready'),
    ('Dein eigener Server.<br>Ohne Cloud. <strong>Ohne Abo.</strong>',
     'Unabhängig.<br>Überall. <strong>Krisensicher.</strong>'),
    ('Schluss mit Cloud-Abos und fremden Rechenzentren. SERVÅR steht bei dir zu Hause –',
     'Spritzwassergeschützt, mit Tragegriff und Solar-Anschluss. Deine Daten laufen weiter –',
    ),
    ('deine Daten auch.', 'im Van, im Tiny House oder wenn das Netz ausfällt.'),
    ('class="btn btn--yellow btn--lg">Jetzt entdecken</a>',
     'class="btn btn--yellow btn--lg">Nomad entdecken</a>'),
    ('503.847.62', '503.847.64'),

    # --- Marquee ---
    (mq('Kein Abo'),         mq('IP54 geschützt')),
    (mq('Deine Daten'),      mq('Solar-ready')),
    (mq('Kein Cloud-Zwang'), mq('Offline-first')),
    (mq('Offline-Zugriff'),  mq('Akku 12 h')),
    (mq('Open Source'),      mq('Stoßfest')),
    (mq('Werkzeug liegt bei'), mq('Tragegriff')),

    # --- Trust ---
    ('<span class="trust__eyebrow">Warum SERVÅR?</span>',
     '<span class="trust__eyebrow">Warum Säker?</span>'),
    ('<h2 class="trust__title">Die Cloud war gestern.</h2>',
     '<h2 class="trust__title">Unabhängig von allem.</h2>'),
    ('<span class="trust__item-title">Einmalpreis statt Abo</span>',
     '<span class="trust__item-title">Läuft offline</span>'),
    ('Einmal kaufen, für immer nutzen. Keine monatlichen Gebühren für Dinge, die du nie nutzt.',
     'Voller Zugriff auf deine Daten – ganz ohne Internet. Perfekt für Funklöcher und unterwegs.'),
    ('<span class="trust__item-title">Daten bleiben zu Hause</span>',
     '<span class="trust__item-title">Robust &amp; wetterfest</span>'),
    ('Fotos, Dokumente und Backups liegen auf deinem Gerät – nicht in fremden Rechenzentren.',
     'Gummierte Stoßkante, IP54-Spritzwasserschutz. Hält Staub, Spritzer und Transport locker aus.'),
    ('<span class="trust__item-title">Funktioniert offline</span>',
     '<span class="trust__item-title">Solar &amp; Akku</span>'),
    ('Voller Zugriff auf deine Daten – selbst wenn das Internet mal komplett weg ist.',
     'Integrierter Akku für 12 Stunden, optionales Mini-Solarpanel. Strom aus der Steckdose ist kein Muss.'),
    ('<span class="trust__item-title">Aufbau wie ein Möbelstück</span>',
     '<span class="trust__item-title">Tragbar</span>'),
    ('Werkzeug liegt bei. Schritt für Schritt aufgebaut – ganz wie ein KALLAX-Regal.',
     'Tragegriff und Befestigungsösen. Vom Flur in den Van in unter einer Minute.'),

    # --- Assembly ---
    ('Vom Karton zum<br>eigenen Server.', 'Vom Karton zum<br>Off-Grid-Server.'),

    # --- Feature-Reihen ---
    ('<p class="feature__eyebrow">Privatsphäre</p>', '<p class="feature__eyebrow">Unabhängigkeit</p>'),
    ('<h2 class="feature__title">Deine Daten. Dein Gerät. Dein Zuhause.</h2>',
     '<h2 class="feature__title">Dein Netz – auch ohne Netz.</h2>'),
    ('Kein Konzern liest mit. SERVÅR speichert alles lokal und verschlüsselt – du allein hältst den Schlüssel in der Hand.',
     'Alle Daten liegen lokal und verschlüsselt auf dem Gerät. Voller Zugriff im Funkloch, im Van oder beim Stromausfall.'),
    ('<p class="feature__eyebrow">Aufbau</p>', '<p class="feature__eyebrow">Robustheit</p>'),
    ('<h2 class="feature__title">Aufbau wie ein KALLAX-Regal.</h2>',
     '<h2 class="feature__title">Gebaut für unterwegs.</h2>'),
    ('Auspacken, zusammenstecken, einschalten. Die bebilderte Anleitung führt dich Schritt für Schritt – ganz ohne IT-Studium.',
     'Gummierte Stoßkante, IP54-Schutz und Tragegriff. Übersteht Transport, Staub und Spritzwasser im Van wie im Hauswirtschaftsraum.'),
    ('<p class="feature__eyebrow">Kosten</p>', '<p class="feature__eyebrow">Energie</p>'),
    ('<h2 class="feature__title">Einmalpreis. Kein Abo. Nie wieder.</h2>',
     '<h2 class="feature__title">Solar rein, Daten sicher.</h2>'),
    ('Du zahlst einmal – und dann nie wieder. Keine versteckten Gebühren, keine Preiserhöhung im dritten Jahr.',
     'Integrierter Akku und optionales Mini-Solarpanel halten dich am Laufen – auch wenn tagelang kein Strom kommt.'),

    # --- Specs ---
    ('<h2 class="specs__title">Das steckt im Karton.</h2>',
     '<h2 class="specs__title">Das steckt im robusten Gehäuse.</h2>'),
    ('Kompakte Leistung, die leise im Regal verschwindet – und mit dir mitwächst.',
     'Robuste Technik für unterwegs – spritzwassergeschützt, akkubetrieben und solar-ready.'),
    ('<span data-countup="2">0</span>&nbsp;TB', '<span data-countup="4">0</span>&nbsp;TB'),
    ('<dd>2 TB SSD</dd>', '<dd>4 TB SSD</dd>'),
    ('<dd>2,5 Gbit/s LAN</dd>', '<dd>1 Gbit/s LAN + LTE</dd>'),
    ('<dd>Wi-Fi 6E · BT 5.3</dd>', '<dd>Wi-Fi 6 · LTE-ready</dd>'),
    ('<dd>Kunststoff · Birkenholz</dd>', '<dd>Kork-Verbund · Olivgrün</dd>'),
    ('<dd>werkzeugarm</dd>', '<dd>IP54 · stoßfest</dd>'),

    # --- CTA-Band + Footer ---
    ('Bereit für deinen<br>eigenen Server?', 'Bereit für den<br>Off-Grid-Server?'),
    ('<span class="price-tag__name">SERVÅR · 2 TB</span>',
     '<span class="price-tag__name">SERVÅR Säker · 4 TB</span>'),
    ('data-main="499"', 'data-main="699"'),
    ('Mehr Power. Weniger Schrauben. Dein eigener Server – designed in Schweden.',
     'Robust. Autark. Überall einsatzbereit. Dein Off-Grid-Server – designed in Schweden.'),

    # Hero-Badge zuletzt: trifft jetzt nur noch das Hero-Badge
    ('Werkzeug liegt bei', 'IP54 · stoßfest'),
]


def main():
    with open(SRC, encoding="utf-8") as f:
        src = f.read()
    build(src, MORK,  "mork.html")
    build(src, NOMAD, "nomad.html")


if __name__ == "__main__":
    main()
