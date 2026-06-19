'use strict';

/* ============================================================
   LANDING.JS — Scroll-Animationen & seiten-spezifische Logik
   Die Komponenten-Interaktivität (Stepper, Slider, Modal, Chat,
   Wishlist) kommt aus components.js und initialisiert sich selbst.
   ============================================================ */

const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ----------------------------------------------------------
   SCROLL REVEAL — Elemente beim Eintritt ins Viewport einblenden
   ---------------------------------------------------------- */

function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // Fallback: ohne IntersectionObserver oder bei Reduced-Motion
    // alles direkt sichtbar schalten.
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        els.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px',
    });

    els.forEach(el => observer.observe(el));
}


/* ----------------------------------------------------------
   STICKY HEADER — Schatten beim Scrollen
   ---------------------------------------------------------- */

function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let ticking = false;

    const update = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    update();
}


/* ----------------------------------------------------------
   HERO PARALLAX — Iso-Server neigt sich mit der Maus,
   Spec-Chips bewegen sich leicht versetzt (Tiefe)
   ---------------------------------------------------------- */

function initHeroParallax() {
    const stage = document.querySelector('.hero__stage');
    const scene = document.getElementById('iso-scene');
    if (!stage || !scene || prefersReducedMotion) return;

    const chips = stage.querySelectorAll('.spec-chip');
    let raf = null;

    function onMove(e) {
        const rect = stage.getBoundingClientRect();
        // -0.5 … 0.5 relativ zur Bühnenmitte
        const px = (e.clientX - rect.left) / rect.width  - 0.5;
        const py = (e.clientY - rect.top)  / rect.height - 0.5;

        if (raf) return;
        raf = requestAnimationFrame(() => {
            scene.style.transform =
                `rotateX(${-py * 8}deg) rotateY(${px * 10}deg) translateZ(0)`;
            chips.forEach((chip, i) => {
                const depth = (i % 2 === 0) ? 16 : 26;
                chip.style.translate = `${-px * depth}px ${-py * depth}px`;
            });
            raf = null;
        });
    }

    function reset() {
        scene.style.transform = '';
        chips.forEach(chip => { chip.style.translate = ''; });
    }

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', reset);
}


/* ----------------------------------------------------------
   COUNT-UP — Trust-/Stat-Zahlen beim Sichtbarwerden hochzählen
   Markup: <span data-countup="2413">0</span>
   ---------------------------------------------------------- */

function animateCount(el, target) {
    const duration = 1400;
    const decimals = (String(target).split('.')[1] || '').length;
    const start = performance.now();

    function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = value.toLocaleString('de-DE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        if (progress < 1) requestAnimationFrame(frame);
        else el.textContent = target.toLocaleString('de-DE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }
    requestAnimationFrame(frame);
}

function initCountUp() {
    const els = document.querySelectorAll('[data-countup]');
    if (!els.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        els.forEach(el => {
            const t = parseFloat(el.dataset.countup);
            el.textContent = t.toLocaleString('de-DE');
        });
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target, parseFloat(entry.target.dataset.countup));
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });

    els.forEach(el => observer.observe(el));
}


/* ----------------------------------------------------------
   ASSEMBLY — gepinnte Scroll-Montage (Canvas-Frame-Scrubber)
   Scroll-Fortschritt (0–1) durch die hohe Sektion steuert:
     · welcher Render-Frame auf dem Canvas gezeichnet wird
     · die aktive Anleitungs-Stufe (.assembly__step)
     · die Fortschritts-Schiene
   Frames: assets/server/frames/frame-0001..NNNN.webp (exportiert
   mit tools/optimize_frames.py). Reihenfolge = explodiert → fertig.
   ---------------------------------------------------------- */

const ASSEMBLY_FRAME_COUNT = 96;

function initAssemblyScroll() {
    const section = document.getElementById('assembly');
    if (!section) return;

    const sticky = section.querySelector('.assembly__sticky');
    const canvas = document.getElementById('assembly-canvas');
    const steps  = Array.from(section.querySelectorAll('.assembly__step'));
    const rail   = document.getElementById('assembly-rail');
    if (!canvas) return;

    const ctx     = canvas.getContext('2d');
    const N       = ASSEMBLY_FRAME_COUNT;
    const images  = new Array(N);
    let   sized   = false;
    let   currentIdx = -1;
    let   lastP   = 0;

    const framePath = n => `assets/server/frames/frame-${String(n).padStart(4, '0')}.webp`;

    function sizeFrom(img) {
        if (sized || !img.naturalWidth) return;
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        sized = true;
    }

    function draw(idx) {
        const img = images[idx];
        if (!img || !img.complete || !img.naturalWidth) return;
        sizeFrom(img);
        if (idx === currentIdx) return;
        currentIdx = idx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    function setStep(idx) {
        steps.forEach((s, i) => {
            s.classList.toggle('is-active', i === idx);
            // alle bis zum aktuellen Schritt sind „eingeblendet" → nacheinander
            s.classList.toggle('is-shown', i <= idx);
        });
    }

    function render(p) {
        p = Math.max(0, Math.min(1, p));
        lastP = p;
        if (rail) rail.style.height = (p * 100) + '%';
        // Fortschritt als CSS-Variable → mobile horizontale Schiene (width)
        section.style.setProperty('--assembly-p', p.toFixed(4));
        setStep(Math.max(0, Math.min(steps.length - 1, Math.floor(p * steps.length))));
        draw(Math.round(p * (N - 1)));
    }

    // Frames vorladen; sobald der aktuell gewünschte Frame da ist, zeichnen
    for (let i = 0; i < N; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            if (!sized) sizeFrom(img);
            if (Math.round(lastP * (N - 1)) === i) { currentIdx = -1; draw(i); }
        };
        img.src = framePath(i + 1);
        images[i] = img;
    }

    // Debug-Hook für Screenshots: ?p=0.5 friert einen Fortschritt ein
    const fixed = new URLSearchParams(location.search).get('p');
    if (fixed !== null) { render(parseFloat(fixed)); return; }

    // Reduced-Motion: statisch den fertigen Server zeigen.
    // Sonst läuft der Scrubber auf ALLEN Breiten — auch mobil/Tablet, wo
    // ein einspaltiges gepinntes Layout greift (Canvas + aktiver Schritt
    // als Caption, siehe < 1024px-Regeln in landing.css).
    if (prefersReducedMotion) {
        render(1);
        steps.forEach(s => s.classList.add('is-shown', 'is-active'));
        return;
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const rect  = section.getBoundingClientRect();
            const total = section.offsetHeight - sticky.offsetHeight;
            const scrolled = Math.min(Math.max(-rect.top, 0), total);
            render(total > 0 ? scrolled / total : 0);
            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
}


/* ----------------------------------------------------------
   MOBILE NAV — Hamburger-Menü auf-/zuklappen
   Unter 768px wird .site-nav zu einem Dropdown-Panel (CSS).
   Hier nur das Umschalten + Schließen-Verhalten + ARIA.
   ---------------------------------------------------------- */

function initMobileNav() {
    const header = document.querySelector('.site-header');
    const toggle = document.getElementById('nav-toggle');
    const nav    = document.getElementById('primary-nav');
    if (!header || !toggle || !nav) return;

    function setOpen(open) {
        header.classList.toggle('nav-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    }

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!header.classList.contains('nav-open'));
    });

    // Klick auf einen Menüpunkt schließt das Panel
    nav.addEventListener('click', (e) => {
        if (e.target.closest('.site-nav__link')) setOpen(false);
    });

    // Klick außerhalb des Headers schließt
    document.addEventListener('click', (e) => {
        if (header.classList.contains('nav-open') && !e.target.closest('.site-header')) {
            setOpen(false);
        }
    });

    // Escape schließt
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });

    // Beim Wechsel auf echte Desktop-Breite (Inline-Nav) zurücksetzen
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onChange = (ev) => { if (ev.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
}


/* ----------------------------------------------------------
   HERO VIDEO — Autoplay absichern / bei Reduced-Motion stoppen
   ---------------------------------------------------------- */

function initHeroVideo() {
    const video = document.getElementById('hero-video');
    if (!video) return;

    if (prefersReducedMotion) {
        video.removeAttribute('autoplay');
        video.pause();
        return;
    }
    // Manche Browser starten muted-Autoplay erst nach einem play()-Aufruf
    const tryPlay = () => video.play().catch(() => {});
    if (video.readyState >= 2) tryPlay();
    video.addEventListener('canplay', tryPlay, { once: true });
}


/* ----------------------------------------------------------
   PREISSCHILD — Beträge dynamisch einsetzen
   Liest mainPrice / cents / currency aus data-Attributen und
   baut die feste Struktur (große Zahl + kleiner Bruch). So lässt
   sich jeder Preis befüllen, ohne dass das Layout verrutscht.
     <span class="price-tag__price"
           data-main="299" data-cents="–" data-currency="€"></span>
   ---------------------------------------------------------- */

function initPriceTags() {
    document.querySelectorAll('.price-tag__price[data-main]').forEach(el => {
        const mainPrice = el.dataset.main     ?? '';
        const cents     = el.dataset.cents    ?? '';
        const currency  = el.dataset.currency ?? '';

        el.innerHTML =
            `<span class="price-tag__main">${mainPrice}</span>` +
            `<span class="price-tag__frac">` +
                (cents    ? `<span class="price-tag__cents">${cents}</span>` : '') +
                (currency ? `<span class="price-tag__currency">${currency}</span>` : '') +
            `</span>`;
    });
}


/* ----------------------------------------------------------
   TECHNISCHE DATEN — Spec-Gruppen als Akkordeon
   Native <details>: auf Desktop alle offen (statisches Datenblatt),
   auf Mobile eingeklappt + antippbar. Nur der Default-Zustand wird
   hier je Breakpoint gesetzt; das Auf-/Zuklappen macht <details> selbst.
   ---------------------------------------------------------- */

function initSpecsAccordion() {
    const groups = document.querySelectorAll('.specs__group');
    if (!groups.length) return;

    const mobile = window.matchMedia('(max-width: 767px)');
    const apply = () => { groups.forEach(g => { g.open = !mobile.matches; }); };

    apply();
    if (mobile.addEventListener) mobile.addEventListener('change', apply);
    else if (mobile.addListener) mobile.addListener(apply);
}


/* ----------------------------------------------------------
   AUFBAUANLEITUNG MODAL — Pop-up mit der Anleitung
   Wird von allen [data-open-manual]-Triggern geöffnet
   (CTA-Button, Chat-Link, Footer-Link).
   ---------------------------------------------------------- */

function initManualModal() {
    const modal = document.getElementById('manual-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('manual-modal-close');
    const triggers = document.querySelectorAll('[data-open-manual]');

    function openModal(e) {
        if (e) e.preventDefault();
        // ggf. offenen Chat schließen, damit nichts überlappt
        document.getElementById('chat-modal')?.classList.remove('chat-modal--open');
        document.getElementById('fab-btn')?.setAttribute('aria-expanded', 'false');

        modal.classList.add('manual-modal--open');
        document.body.style.overflow = 'hidden';
        closeBtn?.focus();
    }

    function closeModal() {
        modal.classList.remove('manual-modal--open');
        document.body.style.overflow = '';
    }

    triggers.forEach(t => t.addEventListener('click', openModal));
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('manual-modal--open')) closeModal();
    });
}


/* ----------------------------------------------------------
   IN DEN WARENKORB — kurzes Erfolgs-Feedback direkt am Button
   Gleiches Muster wie die Mini-Buttons (components.js): Text wird kurz
   zu „✓ Hinzugefügt!", Button grün (.btn--success), danach zurück.
   ---------------------------------------------------------- */

function initAddToCart() {
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
        let timer = null;
        const original = btn.textContent;

        btn.addEventListener('click', () => {
            if (btn.classList.contains('btn--success')) return;  // läuft bereits
            clearTimeout(timer);
            btn.textContent = '✓ Hinzugefügt!';
            btn.classList.add('btn--success');
            btn.disabled = true;

            timer = setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove('btn--success');
                btn.disabled = false;
            }, 1600);
        });
    });
}


/* ----------------------------------------------------------
   MARQUEE — nahtloser Werte-Ticker (JS-gesteuert)
   Per requestAnimationFrame statt CSS-Keyframes, damit beim Hover ein
   weiches Ausrollen/Anfahren möglich ist (animation-play-state würde
   hart umschalten). Das Basis-Set wird so oft geklont, dass eine Sequenz
   ≥ Viewport ist (zwei identische Hälften → nahtloser Wrap). Tempo bleibt
   wie zuvor (Referenz: 28 s fürs Basis-Set).
   ---------------------------------------------------------- */

function initMarquee() {
    const marquee = document.querySelector('.marquee');
    const track   = marquee?.querySelector('.marquee__track');
    if (!marquee || !track || prefersReducedMotion) return;

    const baseHTML = track.innerHTML;   // Original-Begriffe als Basis-Set
    const BASE_DURATION = 28;           // s – bisheriges Tempo als Referenz
    const TAU = 0.4;                     // Glättungs-Zeitkonstante (soft stop/start)

    track.style.animation = 'none';      // CSS-Animation aus → JS übernimmt
    track.style.willChange = 'transform';

    let seqWidth  = 0;   // Breite einer Sequenz = nahtlose Wrap-Strecke
    let fullSpeed = 0;   // px/s bei voller Fahrt
    let pos       = 0;   // aktuelle X-Position (negativ)
    let curSpeed  = 0;   // aktuelle, geglättete px/s
    let target    = 1;   // Zielfaktor: 1 = läuft, 0 = gestoppt (Hover)
    let last      = 0;

    function build() {
        track.innerHTML = baseHTML;
        const baseWidth = track.scrollWidth;
        if (!baseWidth) return;
        fullSpeed = (baseWidth / 2) / BASE_DURATION;   // wie bisher: baseWidth/2 in 28s

        // so viele Basis-Kopien, dass eine Sequenz ≥ Viewport ist (Sicherheits-Cap)
        const reps = Math.min(12, Math.max(1, Math.ceil(marquee.offsetWidth / baseWidth)));
        track.innerHTML = baseHTML.repeat(reps * 2);   // zwei identische Hälften
        seqWidth = baseWidth * reps;
        if (seqWidth) pos = pos % seqWidth;            // Sprung beim Rebuild vermeiden
    }

    function frame(now) {
        if (!last) last = now;
        let dt = (now - last) / 1000;
        last = now;
        if (dt > 0.05) dt = 0.05;                      // Sprünge nach Tab-Wechsel kappen

        // weiche Annäherung an die Zielgeschwindigkeit (framerate-unabhängig)
        const desired = fullSpeed * target;
        curSpeed += (desired - curSpeed) * (1 - Math.exp(-dt / TAU));

        pos -= curSpeed * dt;
        if (seqWidth && pos <= -seqWidth) pos += seqWidth;   // nahtloser Wrap
        track.style.transform = `translate3d(${pos.toFixed(2)}px,0,0)`;

        requestAnimationFrame(frame);
    }

    build();
    requestAnimationFrame(frame);

    // Hover → sanft stoppen, Verlassen → sanft wieder anfahren
    marquee.addEventListener('mouseenter', () => { target = 0; });
    marquee.addEventListener('mouseleave', () => { target = 1; });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 200);
    });
}


/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */

initScrollReveal();
initHeaderScroll();
initHeroParallax();
initCountUp();
initAssemblyScroll();
initHeroVideo();
initMobileNav();
initPriceTags();
initSpecsAccordion();
initManualModal();
initAddToCart();
initMarquee();
