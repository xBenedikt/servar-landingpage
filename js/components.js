'use strict';

/* ============================================================
   COMPONENTS.JS — Interaktivität für die Komponentenbibliothek
   ============================================================ */


/* ----------------------------------------------------------
   QUANTITY STEPPER
   ---------------------------------------------------------- */

function initSteppers() {
    // Standalone-Stepper (direkte IDs)
    const standaloneValue = document.getElementById('qty-value');
    const standaloneMinus = document.getElementById('qty-minus');
    const standalonePlus  = document.getElementById('qty-plus');

    if (standaloneValue && standaloneMinus && standalonePlus) {
        let count = 1;

        function updateStandalone() {
            standaloneValue.textContent = count;
            standaloneMinus.disabled = count <= 1;
        }

        standalonePlus.addEventListener('click', () => {
            count++;
            updateStandalone();
        });

        standaloneMinus.addEventListener('click', () => {
            if (count > 1) {
                count--;
                updateStandalone();
            }
        });

        updateStandalone();
    }

    // Kombinierter Stepper mit CTA-Button
    const rows = document.querySelectorAll('.add-to-cart-row');

    rows.forEach(row => {
        const display  = row.querySelector('[data-qty-display]');
        const minusBtn = row.querySelector('[data-action="minus"]');
        const plusBtn  = row.querySelector('[data-action="plus"]');
        const ctaBtn   = row.querySelector('[data-qty-ref]') ?? row.querySelector('.btn--primary');

        if (!display || !minusBtn || !plusBtn || !ctaBtn) return;

        let qty = 1;
        let resetTimer = null;

        function updateLabel() {
            display.textContent = qty;
            minusBtn.disabled = qty <= 1;
            if (qty === 1) {
                ctaBtn.textContent = 'In den Warenkorb';
            } else {
                ctaBtn.textContent = `${qty} Artikel in den Warenkorb`;
            }
        }

        plusBtn.addEventListener('click', () => {
            qty++;
            updateLabel();
        });

        minusBtn.addEventListener('click', () => {
            if (qty > 1) {
                qty--;
                updateLabel();
            }
        });

        updateLabel();

        ctaBtn.addEventListener('click', () => {
            clearTimeout(resetTimer);
            const original = ctaBtn.textContent;

            ctaBtn.textContent = '✓ Hinzugefügt!';
            ctaBtn.classList.add('btn--success');
            ctaBtn.disabled = true;

            resetTimer = setTimeout(() => {
                ctaBtn.classList.remove('btn--success');
                ctaBtn.disabled = false;
                updateLabel();
            }, 1500);
        });
    });
}


/* ----------------------------------------------------------
   SIZE SELECTOR
   ---------------------------------------------------------- */

function initSizeSelectors() {
    document.querySelectorAll('.size-selector__options').forEach(group => {
        const options = group.querySelectorAll('.size-option');

        options.forEach(btn => {
            btn.addEventListener('click', () => {
                options.forEach(o => {
                    o.classList.remove('size-option--selected');
                    o.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('size-option--selected');
                btn.setAttribute('aria-pressed', 'true');
            });
        });
    });
}


/* ----------------------------------------------------------
   WISHLIST TOGGLE
   ---------------------------------------------------------- */

function bindWishlist(btn) {
    btn.addEventListener('click', () => {
        const active = btn.classList.toggle('is-active');
        btn.setAttribute('aria-pressed', String(active));
        btn.setAttribute('aria-label', active ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen');
    });
}

function initWishlistButtons() {
    document.querySelectorAll('.btn-icon--wishlist').forEach(bindWishlist);
}


/* ----------------------------------------------------------
   FAB + CHAT MODAL
   ---------------------------------------------------------- */

function initChatFab() {
    const fabBtn    = document.getElementById('fab-btn');
    const chatModal = document.getElementById('chat-modal');
    const closeBtn  = document.getElementById('chat-close');
    const startBtn  = document.getElementById('chat-start');

    if (!fabBtn || !chatModal) return;

    function openModal() {
        chatModal.classList.add('chat-modal--open');
        fabBtn.setAttribute('aria-expanded', 'true');
        closeBtn?.focus();
    }

    function closeModal() {
        chatModal.classList.remove('chat-modal--open');
        fabBtn.setAttribute('aria-expanded', 'false');
        fabBtn.focus();
    }

    fabBtn.addEventListener('click', () => {
        const isOpen = chatModal.classList.contains('chat-modal--open');
        isOpen ? closeModal() : openModal();
    });

    closeBtn?.addEventListener('click', closeModal);

    startBtn?.addEventListener('click', () => {
        startBtn.textContent = 'Verbinde…';
        startBtn.disabled = true;
        setTimeout(() => {
            startBtn.textContent = 'Chat starten';
            startBtn.disabled = false;
        }, 2000);
    });

    // Schließen via Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && chatModal.classList.contains('chat-modal--open')) {
            closeModal();
        }
    });

    // Schließen bei Klick außerhalb
    document.addEventListener('click', e => {
        if (
            chatModal.classList.contains('chat-modal--open') &&
            !chatModal.contains(e.target) &&
            !fabBtn.contains(e.target)
        ) {
            closeModal();
        }
    });
}


/* ----------------------------------------------------------
   GENERIC SLIDER — wiederverwendbar für Reviews + Insta-Feed
   Übergib die vier IDs als Konfiguration.
   ---------------------------------------------------------- */

function createSlider({ trackId, thumbId, scrollbarTrackId, prevId, nextId, cardScroll = 256 }) {
    const track   = document.getElementById(trackId);
    const thumbEl = document.getElementById(thumbId);
    const trackEl = document.getElementById(scrollbarTrackId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);

    if (!track || !thumbEl || !trackEl) return;

    function updateThumb() {
        const trackW    = trackEl.offsetWidth;
        const thumbW    = Math.max(40, (track.clientWidth / track.scrollWidth) * trackW);
        const maxScroll = track.scrollWidth - track.clientWidth;
        const maxLeft   = trackW - thumbW;
        const ratio     = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
        thumbEl.style.width = thumbW + 'px';
        thumbEl.style.left  = (ratio * maxLeft) + 'px';
    }

    function updateNavBtns() {
        const maxScroll = track.scrollWidth - track.clientWidth;
        prevBtn?.classList.toggle('is-hidden', track.scrollLeft <= 1);
        nextBtn?.classList.toggle('is-hidden', track.scrollLeft >= maxScroll - 1);
    }

    track.addEventListener('scroll', updateThumb,   { passive: true });
    track.addEventListener('scroll', updateNavBtns, { passive: true });
    requestAnimationFrame(() => { updateThumb(); updateNavBtns(); });
    window.addEventListener('resize', () => { updateThumb(); updateNavBtns(); });

    prevBtn?.addEventListener('click', () => track.scrollBy({ left: -cardScroll, behavior: 'smooth' }));
    nextBtn?.addEventListener('click', () => track.scrollBy({ left:  cardScroll, behavior: 'smooth' }));

    let isDragging  = false;
    let startX      = 0;
    let startScroll = 0;

    thumbEl.addEventListener('pointerdown', e => {
        isDragging  = true;
        startX      = e.clientX;
        startScroll = track.scrollLeft;
        thumbEl.setPointerCapture(e.pointerId);
        thumbEl.classList.add('is-dragging');
        e.preventDefault();
    });

    thumbEl.addEventListener('pointermove', e => {
        if (!isDragging) return;
        const trackW    = trackEl.offsetWidth;
        const thumbW    = thumbEl.offsetWidth;
        const maxLeft   = trackW - thumbW;
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxLeft <= 0) return;
        const dx = e.clientX - startX;
        track.scrollLeft = Math.max(0, Math.min(maxScroll, startScroll + (dx / maxLeft) * maxScroll));
    });

    const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        thumbEl.classList.remove('is-dragging');
    };
    thumbEl.addEventListener('pointerup',     stopDrag);
    thumbEl.addEventListener('pointercancel', stopDrag);
}


/* ----------------------------------------------------------
   REVIEWS SLIDER — delegiert an createSlider
   ---------------------------------------------------------- */

function initReviewsSlider() {
    createSlider({
        trackId:         'reviews-track',
        thumbId:         'reviews-scrollbar-thumb',
        scrollbarTrackId:'reviews-scrollbar-track',
        prevId:          'reviews-prev',
        nextId:          'reviews-next',
        cardScroll:       256,
    });
}


/* ----------------------------------------------------------
   INSTAGRAM DISCOVER SLIDER + MODAL
   ---------------------------------------------------------- */

function initInstaSlider() {
    createSlider({
        trackId:         'insta-track',
        thumbId:         'insta-scrollbar-thumb',
        scrollbarTrackId:'insta-scrollbar-track',
        prevId:          'insta-prev',
        nextId:          'insta-next',
        cardScroll:       330,
    });

    // Modal
    const modal     = document.getElementById('insta-modal');
    const closeBtn  = document.getElementById('insta-modal-close');
    const imgEl     = document.getElementById('insta-modal-img');
    const usernameEl = document.getElementById('insta-modal-username');
    const productsCol = document.getElementById('insta-modal-products');

    if (!modal) return;

    // Produkt-Katalog für die getaggten Posts. Jede Insta-Karte wählt ihre
    // Produkte per data-products="key,key" (Default: Original-Set).
    const PRODUCTS = {
        basis: { img: 'assets/img/produkt-basis.webp', alt: 'SERVÅR Basis-Einheit',      name: 'SERVÅR',       desc: 'Basis-Einheit, 2 TB',         price: '499'   },
        modul: { img: 'assets/img/produkt-modul.webp', alt: 'SERVÅR Erweiterungs-Modul', name: 'SERVÅR',       desc: 'Erweiterungs-Modul, +12 TB',  price: '299'   },
        fixa:  { img: 'assets/img/produkt-fixa.webp',  alt: 'FIXA Inbusschlüssel',        name: 'FIXA',         desc: 'Ersatz-Inbusschlüssel, 4 mm',  price: '2'     },
        pro:   { img: 'assets/img/produkt-pro.webp',   alt: 'SERVÅR Mörk Pro-Edition',    name: 'SERVÅR Mörk',  desc: 'Pro-Edition, 8 TB NVMe',      price: '1.299' },
        nomad: { img: 'assets/img/produkt-nomad.webp', alt: 'SERVÅR Säker Off-Grid',      name: 'SERVÅR Säker', desc: 'Off-Grid-Edition, 4 TB',      price: '699'   },
    };
    const CART_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>';
    const HEART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/></svg>';

    function renderProducts(keys) {
        if (!productsCol) return;
        const list = (keys || 'basis,modul,fixa').split(',')
            .map(k => k.trim()).filter(k => PRODUCTS[k]);
        productsCol.innerHTML = list.map(k => {
            const p = PRODUCTS[k];
            return `<div class="insta-product">
                <div class="insta-product__thumb"><img src="${p.img}" alt="${p.alt}"></div>
                <div class="insta-product__info">
                    <span class="insta-product__name">${p.name}</span>
                    <span class="insta-product__desc">${p.desc}</span>
                    <span class="insta-product__price">${p.price},<sup>–</sup>&nbsp;€</span>
                </div>
                <div class="insta-product__actions">
                    <button class="btn-icon btn-icon--primary" aria-label="In den Warenkorb">${CART_SVG}</button>
                    <button class="btn-icon btn-icon--wishlist" aria-label="Zu Favoriten" aria-pressed="false">${HEART_SVG}</button>
                </div>
            </div>`;
        }).join('');
        productsCol.querySelectorAll('.btn-icon--wishlist').forEach(bindWishlist);
    }

    function openModal(card) {
        const handle = card.dataset.handle ?? '–';
        const imgSrc = card.querySelector('.insta-card__img')?.getAttribute('src') ?? '';
        renderProducts(card.dataset.products);

        if (imgEl) {
            imgEl.style.backgroundImage    = imgSrc ? `url("${imgSrc}")` : '';
            imgEl.style.backgroundSize     = 'cover';
            imgEl.style.backgroundPosition = 'center';
            imgEl.style.width  = '100%';
            imgEl.style.height = '100%';
        }
        if (usernameEl) { usernameEl.textContent = '@' + handle; }

        modal.classList.add('insta-modal--open');
        document.body.style.overflow = 'hidden';
        closeBtn?.focus();
    }

    function closeModal() {
        modal.classList.remove('insta-modal--open');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.insta-card').forEach(card => {
        card.addEventListener('click', () => openModal(card));
        // Count-Badge = tatsächliche Produktanzahl im Post (aus data-products)
        const countEl = card.querySelector('.insta-card__count');
        if (countEl) {
            const n = (card.dataset.products || 'basis,modul,fixa')
                .split(',').map(k => k.trim()).filter(k => PRODUCTS[k]).length;
            const svg = countEl.querySelector('svg');
            countEl.innerHTML = '';
            if (svg) countEl.appendChild(svg);
            countEl.appendChild(document.createTextNode(' ' + n));
        }
    });

    closeBtn?.addEventListener('click', closeModal);

    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('insta-modal--open')) closeModal();
    });

}


/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */

initSteppers();
initSizeSelectors();
initWishlistButtons();
initChatFab();
initReviewsSlider();
initInstaSlider();
