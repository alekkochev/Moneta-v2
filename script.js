// ========================================
// AOS INIT & FAILSAFE FALLBACK
// ========================================
function revealAllAosElements() {
    document.querySelectorAll('[data-aos]').forEach(el => {
        el.classList.add('aos-animate');
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
}

function initAOS() {
    if (window.AOS) {
        AOS.init({
            duration: 700,
            once: true,
            offset: 40,
            easing: 'ease-out-cubic'
        });
    } else {
        revealAllAosElements();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAOS, { passive: true });
} else {
    initAOS();
}
window.addEventListener('load', initAOS, { passive: true });
// Failsafe timeout to guarantee elements are visible even if CDN fails
setTimeout(() => {
    if (!window.AOS) revealAllAosElements();
}, 500);

// ========================================
// MOBILE MENU
// ========================================
const toggle = document.getElementById('navToggle');
const nav = document.getElementById('navLinks');

if (toggle && nav) {
    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-active');
        toggle.setAttribute('aria-expanded', open);
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
    }));
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar__inner') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
    }
});

// ========================================
// LANGUAGE SWITCHER (MK <-> EN)
// ========================================
(function() {
    const langBtns = document.querySelectorAll('.lang-btn');
    if (!langBtns.length) return;

    let currentLang = localStorage.getItem('moneta_lang') || 'mk';

    const setLanguage = (lang) => {
        currentLang = lang;
        localStorage.setItem('moneta_lang', lang);

        langBtns.forEach((btn) => {
            const btnLang = btn.dataset.lang;
            if (btnLang === lang) {
                btn.classList.add('is-active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('is-active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });

        document.documentElement.lang = lang;

        // Update elements with textContent translation
        const translatableElements = document.querySelectorAll('[data-mk][data-en]');
        translatableElements.forEach((el) => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                if (el.hasAttribute('data-lang-html')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Update input placeholders
        const placeholderElements = document.querySelectorAll('[data-mk-placeholder][data-en-placeholder]');
        placeholderElements.forEach((el) => {
            const phText = el.getAttribute(`data-${lang}-placeholder`);
            if (phText) {
                el.placeholder = phText;
            }
        });

        // Update aria-labels and titles
        const ariaElements = document.querySelectorAll('[data-mk-aria][data-en-aria]');
        ariaElements.forEach((el) => {
            const ariaText = el.getAttribute(`data-${lang}-aria`);
            if (ariaText) {
                el.setAttribute('aria-label', ariaText);
                if (el.hasAttribute('title')) {
                    el.setAttribute('title', ariaText);
                }
            }
        });

        // Ажурирај ги free-ship текстовте по промена на јазик
        if (window.MonetaCart && window.MonetaCart.renderFreeShip) {
            window.MonetaCart.renderFreeShip(window.MonetaCart.getCart());
        }

        // Глобален hook — секој модул што треба да се освежи на промена на јазик
        (window.MonetaLangCallbacks || []).forEach((cb) => {
            try { cb(lang); } catch (err) { /* ignore */ }
        });
    };

    window.MonetaLangCallbacks = window.MonetaLangCallbacks || [];
    window.MonetaOnLangChange = (cb) => {
        if (typeof cb === 'function') window.MonetaLangCallbacks.push(cb);
    };

    langBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetLang = btn.dataset.lang;
            if (targetLang && targetLang !== currentLang) {
                setLanguage(targetLang);
            }
        });
    });

    if (currentLang !== 'mk') {
        setLanguage(currentLang);
    }

    // Изложи ги за паѓачкиот јазичен прекинувач (initLangDropdown)
    window.MonetaSetLang = setLanguage;
    window.MonetaGetLang = () => currentLang;
})();

// ========================================
// LANGUAGE DROPDOWN (паѓачко мени MK / EN / SQ)
// ========================================
(function initLangDropdown() {
    const LANG_NAMES = {
        mk: { code: 'MK', nameNative: 'Македонски' },
        en: { code: 'EN', nameNative: 'English' },
        sq: { code: 'SQ', nameNative: 'Shqip' }
    };

    const enhance = (switcher) => {
        if (!switcher || switcher.classList.contains('lang-dropdown-ready')) return;
        const btns = [...switcher.querySelectorAll('.lang-btn')];
        if (!btns.length) return;
        switcher.classList.add('lang-dropdown-ready');

        const stored = window.MonetaGetLang ? window.MonetaGetLang() : (localStorage.getItem('moneta_lang') || 'mk');
        const active = LANG_NAMES[stored] ? stored : 'mk';

        const dd = document.createElement('div');
        dd.className = 'lang-dropdown';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'lang-dropdown__trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.innerHTML = `<span class="lang-dropdown__code">${LANG_NAMES[active].code}</span>`
            + `<span class="lang-dropdown__chevron"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>`;

        const menu = document.createElement('div');
        menu.className = 'lang-dropdown__menu';
        menu.setAttribute('role', 'listbox');

        // Секогаш ги прикажува сите 3 јазици (MK / EN / SQ) — SQ се полни со превод подоцна
        Object.keys(LANG_NAMES).forEach((lang) => {
            const opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'lang-dropdown__option' + (lang === active ? ' is-active' : '');
            opt.dataset.lang = lang;
            opt.setAttribute('role', 'option');
            opt.setAttribute('aria-selected', lang === active ? 'true' : 'false');
            opt.innerHTML = `<span class="lang-dropdown__opt-code">${LANG_NAMES[lang].code}</span><span class="lang-dropdown__opt-name">${LANG_NAMES[lang].nameNative}</span>`;
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.MonetaSetLang) window.MonetaSetLang(lang);
                const codeEl = trigger.querySelector('.lang-dropdown__code');
                if (codeEl) codeEl.textContent = LANG_NAMES[lang].code;
                menu.querySelectorAll('.lang-dropdown__option').forEach((o) => {
                    const isAct = o.dataset.lang === lang;
                    o.classList.toggle('is-active', isAct);
                    o.setAttribute('aria-selected', isAct ? 'true' : 'false');
                });
                dd.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            });
            menu.appendChild(opt);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dd.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        dd.appendChild(trigger);
        dd.appendChild(menu);
        switcher.innerHTML = '';
        switcher.appendChild(dd);
    };

    document.querySelectorAll('.lang-switcher').forEach(enhance);

    // Затвори го менито при клик на друго место / Escape
    document.addEventListener('click', () => {
        document.querySelectorAll('.lang-dropdown.is-open').forEach((dd) => {
            dd.classList.remove('is-open');
            const tr = dd.querySelector('.lang-dropdown__trigger');
            if (tr) tr.setAttribute('aria-expanded', 'false');
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.lang-dropdown.is-open').forEach((dd) => dd.classList.remove('is-open'));
        }
    });
})();

// ========================================
// MODEL АКОРДЕОН: само една картичка отворена во исто време
// ========================================
(function initModelAccordion() {
    document.querySelectorAll('.model-acc').forEach((acc) => {
        const items = acc.querySelectorAll('details.model-acc__item');
        items.forEach((item) => {
            item.addEventListener('toggle', () => {
                if (item.open) {
                    items.forEach((other) => {
                        if (other !== item && other.open) other.open = false;
                    });
                }
            });
            // Спречи „скок/фрлање" при отворање — држи го summary-то на истата
            // позиција во viewport-от. Нативниот details-скрол се исклучува со
            // preventDefault (рачно го префрламе open), па останува само
            // поместувањето од затворањето на претходната секција, кое го коригираме.
            const head = item.querySelector('summary');
            if (head) {
                head.addEventListener('click', (e) => {
                    const details = head.closest('details');
                    if (!details) return;
                    // Спречи нативен toggle + нативен scroll-into-view
                    e.preventDefault();
                    details.open = !details.open;

                    const origTop = head.getBoundingClientRect().top;
                    const root = document.documentElement;
                    const prevBehavior = root.style.scrollBehavior;
                    const prevAnchor = root.style.overflowAnchor;
                    root.style.scrollBehavior = 'auto';
                    root.style.overflowAnchor = 'none';
                    let cleaned = false;
                    const cleanup = () => {
                        if (!cleaned) { cleaned = true; root.style.scrollBehavior = prevBehavior; root.style.overflowAnchor = prevAnchor; }
                    };
                    // Континуирано држи го summary-то на истата визуелна позиција
                    // додека layout-от (затворање на претходната секција) не се стабилизира.
                    const start = performance.now();
                    const stabilize = () => {
                        const delta = Math.round(head.getBoundingClientRect().top - origTop);
                        if (Math.abs(delta) > 1) window.scrollBy(0, delta);
                        const elapsed = performance.now() - start;
                        // Работи барем 350ms (да го фати асинхрониот toggle), а најмногу 1200ms
                        if (elapsed < 350 || (Math.abs(delta) > 1 && elapsed < 1200)) {
                            requestAnimationFrame(stabilize);
                        } else {
                            cleanup();
                        }
                    };
                    requestAnimationFrame(stabilize);
                });
            }
        });
    });
})();

// ========================================
// GSAP INIT (DEFERRED FOR NON-BLOCKING INITIAL PAINT)
// ========================================
function initGSAP() {
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);

        // Category Cards GSAP Stagger Animation
        const categoryCards = document.querySelectorAll('.categories__grid .card');
        if (categoryCards.length > 0) {
            gsap.from(categoryCards, {
                scrollTrigger: {
                    trigger: '.categories__grid',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 0,
                y: 35,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power2.out',
                clearProps: 'transform,opacity'
            });
        }
    }
}

if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(initGSAP, { timeout: 2000 });
} else {
    window.addEventListener('load', () => setTimeout(initGSAP, 200), { passive: true });
}

// ========================================
// KONTAKT FORMA HANDLER (RESEND преку Supabase edge function)
// ========================================
const kontaktForm = document.getElementById('kontaktForm');
const kontaktFeedback = document.getElementById('kontaktFeedback');

if (kontaktForm) {
    kontaktForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const messageInput = document.getElementById('message');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        if (!name || !email || !message || !email.includes('@') || !email.includes('.')) {
            if (kontaktFeedback) {
                kontaktFeedback.className = 'form__feedback is-error';
                kontaktFeedback.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Ве молиме пополнете ги задолжителните полиња (име, валидна е-пошта и порака).</span>
                `;
            }
            return;
        }

        if (kontaktFeedback) {
            kontaktFeedback.className = 'form__feedback is-success';
            kontaktFeedback.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                <span>Се испраќа вашата порака...</span>
            `;
        }

        const showSuccess = () => {
            if (kontaktFeedback) {
                kontaktFeedback.className = 'form__feedback is-success';
                kontaktFeedback.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Ви благодариме ${name}! Вашата порака е успешно испратена. Ќе ве контактираме на ${email} во најкраток рок.</span>
                `;
            }
            kontaktForm.reset();
        };

        // Испраќање преку Resend (Supabase edge function contact-notify)
        const sbUrl = String(window.MONETA_SUPABASE_URL || '').replace(/\/+$/, '');
        try {
            const res = await fetch(sbUrl + '/functions/v1/contact-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, phone: phone, message: message })
            });
            if (res.ok) {
                showSuccess();
            } else {
                throw new Error('contact-notify status ' + res.status);
            }
        } catch (err) {
            console.warn('Contact notify error:', err);
            if (kontaktFeedback) {
                kontaktFeedback.className = 'form__feedback is-error';
                kontaktFeedback.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Настана грешка при испраќањето на пораката. Ве молиме обидете се повторно.</span>
                `;
            }
        }
    });
}

// ========================================
// BACK TO TOP BUTTON
// ========================================
const backToTopBtn = document.getElementById('backToTop');
const heroSection = document.querySelector('.hero');

if (backToTopBtn) {
    const handleScroll = () => {
        const triggerPoint = heroSection ? heroSection.offsetHeight : 300;
        if (window.scrollY > triggerPoint) {
            backToTopBtn.classList.add('is-visible');
        } else {
            backToTopBtn.classList.remove('is-visible');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ========================================
// FAQ ACCORDION INTERACTION WITH GSAP ANIMATION
// ========================================
const faqAccordion = document.getElementById('faqAccordion');
if (faqAccordion) {
    const faqItems = faqAccordion.querySelectorAll('.faq__item');

    faqItems.forEach((item) => {
        const questionBtn = item.querySelector('.faq__question');
        const answer = item.querySelector('.faq__answer');
        const answerContent = item.querySelector('.faq__answer-content');
        if (!questionBtn || !answer) return;

        const isCurrentlyOpen = item.classList.contains('is-open');
        if (typeof gsap !== 'undefined') {
            gsap.set(answer, {
                height: isCurrentlyOpen ? 'auto' : 0,
                opacity: isCurrentlyOpen ? 1 : 0,
                display: isCurrentlyOpen ? 'block' : 'none'
            });
            if (answerContent) {
                gsap.set(answerContent, {
                    opacity: isCurrentlyOpen ? 1 : 0,
                    y: isCurrentlyOpen ? 0 : -10
                });
            }
        }

        questionBtn.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');

            // — Анти-„скок" стабилизација (исто правило како кај модел accordion-ите):
            // држи го кликнатото прашање на истата позиција во viewport-от додека
            // GSAP ги затвора/отвора одговорите (layout shift од високата секција горе).
            const origTop = questionBtn.getBoundingClientRect().top;
            const rootEl = document.documentElement;
            const prevBehavior = rootEl.style.scrollBehavior;
            const prevAnchor = rootEl.style.overflowAnchor;
            rootEl.style.scrollBehavior = 'auto';
            rootEl.style.overflowAnchor = 'none';
            let cleaned = false;
            const cleanupStab = () => {
                if (!cleaned) { cleaned = true; rootEl.style.scrollBehavior = prevBehavior; rootEl.style.overflowAnchor = prevAnchor; }
            };
            const startStab = performance.now();
            const stabilizeFaq = () => {
                const delta = Math.round(questionBtn.getBoundingClientRect().top - origTop);
                if (Math.abs(delta) > 1) window.scrollBy(0, delta);
                const elapsed = performance.now() - startStab;
                // Работи барем 700ms (покрива 0.38s GSAP анимации + маргина), најмногу 1500ms
                if (elapsed < 700 || (Math.abs(delta) > 1 && elapsed < 1500)) {
                    requestAnimationFrame(stabilizeFaq);
                } else {
                    cleanupStab();
                }
            };
            requestAnimationFrame(stabilizeFaq);

            // Close all items first for a clean single-open accordion experience
            faqItems.forEach((otherItem) => {
                const otherBtn = otherItem.querySelector('.faq__question');
                const otherAnswer = otherItem.querySelector('.faq__answer');
                const otherContent = otherItem.querySelector('.faq__answer-content');

                if (otherItem.classList.contains('is-open')) {
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');

                    if (typeof gsap !== 'undefined' && otherAnswer) {
                        gsap.killTweensOf([otherAnswer, otherContent]);
                        if (otherContent) {
                            gsap.to(otherContent, {
                                opacity: 0,
                                y: -10,
                                duration: 0.25,
                                ease: 'power2.in'
                            });
                        }
                        gsap.to(otherAnswer, {
                            height: 0,
                            opacity: 0,
                            duration: 0.35,
                            ease: 'power2.inOut',
                            onComplete: () => {
                                otherItem.classList.remove('is-open');
                                gsap.set(otherAnswer, { display: 'none' });
                            }
                        });
                    } else {
                        otherItem.classList.remove('is-open');
                    }
                }
            });

            // Toggle clicked item if it wasn't open
            if (!isOpen) {
                item.classList.add('is-open');
                questionBtn.setAttribute('aria-expanded', 'true');

                if (typeof gsap !== 'undefined' && answer) {
                    gsap.killTweensOf([answer, answerContent]);
                    gsap.set(answer, { display: 'block' });

                    gsap.fromTo(answer,
                        { height: 0, opacity: 0 },
                        { height: 'auto', opacity: 1, duration: 0.38, ease: 'power2.out' }
                    );

                    if (answerContent) {
                        gsap.fromTo(answerContent,
                            { opacity: 0, y: -12 },
                            { opacity: 1, y: 0, duration: 0.35, delay: 0.05, ease: 'power2.out' }
                        );
                    }
                }
            }
        });
    });
}

// ========================================
// REVIEWS CAROUSEL SCROLL
// ========================================
const reviewsCarousel = document.getElementById('reviewsCarousel');
const reviewsPrev = document.getElementById('reviewsPrev');
const reviewsNext = document.getElementById('reviewsNext');

if (reviewsCarousel && reviewsPrev && reviewsNext) {
    const getScrollAmount = () => {
        const firstCard = reviewsCarousel.querySelector('.review-card');
        return firstCard ? firstCard.offsetWidth + 24 : 350;
    };

    reviewsPrev.addEventListener('click', () => {
        reviewsCarousel.scrollBy({
            left: -getScrollAmount(),
            behavior: 'smooth'
        });
    });

    reviewsNext.addEventListener('click', () => {
        reviewsCarousel.scrollBy({
            left: getScrollAmount(),
            behavior: 'smooth'
        });
    });
}

// ========================================
// SIZE FINDER MODAL & RECOMMENDATION LOGIC
// ========================================
const sizeModal = document.getElementById('sizeModal');
const openModalTriggers = document.querySelectorAll('[data-open-size-modal]');
const closeModalTriggers = document.querySelectorAll('[data-close-modal]');

if (sizeModal) {
    const openModal = () => {
        sizeModal.classList.add('is-open');
        sizeModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        sizeModal.classList.remove('is-open');
        sizeModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    openModalTriggers.forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    closeModalTriggers.forEach((trigger) => {
        trigger.addEventListener('click', closeModal);
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sizeModal.classList.contains('is-open')) {
            closeModal();
        }
    });

    // Recommendation Engine & Dynamic Size Calculator
    const sizePills = document.querySelectorAll('#sizePills .size-pill');
    const activityPills = document.querySelectorAll('#activityOptions .activity-pill');
    const resultContainer = document.getElementById('sizeResult');
    const customSizeInput = document.getElementById('customSizeInput');
    const customSizeBadge = document.getElementById('customSizeBadge');
    const customLenInput = document.getElementById('customLenInput');
    const lenUnitBtns = document.querySelectorAll('.size-finder__unit');
    let lenUnit = 'mm';

    const sizeRangeMap = {
        '28-34': { minCm: 18.0, maxCm: 22.0, defaultCm: 20.0, labelMk: 'Детска големина 28-34 EU', labelEn: 'Kids Size 28-34 EU', trimLineMk: 'Подсечете по означената линија за соодветниот детски број', trimLineEn: 'Trim along marked line for child size' },
        '35-36': { minCm: 22.5, maxCm: 23.5, defaultCm: 23.0, labelMk: 'Број EU 35 - 36', labelEn: 'Shoe Size EU 35 - 36', trimLineMk: 'Подсечете по линијата за број 35 или 36', trimLineEn: 'Trim along guide line for size 35 or 36' },
        '37-38': { minCm: 23.8, maxCm: 24.8, defaultCm: 24.3, labelMk: 'Број EU 37 - 38', labelEn: 'Shoe Size EU 37 - 38', trimLineMk: 'Подсечете по линијата за број 37 или 38', trimLineEn: 'Trim along guide line for size 37 or 38' },
        '39-40': { minCm: 25.0, maxCm: 26.0, defaultCm: 25.5, labelMk: 'Број EU 39 - 40', labelEn: 'Shoe Size EU 39 - 40', trimLineMk: 'Подсечете по линијата за број 39 или 40', trimLineEn: 'Trim along guide line for size 39 or 40' },
        '41-42': { minCm: 26.3, maxCm: 27.3, defaultCm: 26.8, labelMk: 'Број EU 41 - 42', labelEn: 'Shoe Size EU 41 - 42', trimLineMk: 'Подсечете по линијата за број 41 или 42', trimLineEn: 'Trim along guide line for size 41 or 42' },
        '43-44': { minCm: 27.5, maxCm: 28.5, defaultCm: 28.0, labelMk: 'Број EU 43 - 44', labelEn: 'Shoe Size EU 43 - 44', trimLineMk: 'Подсечете по линијата за број 43 или 44', trimLineEn: 'Trim along guide line for size 43 or 44' },
        '45-46': { minCm: 28.8, maxCm: 29.8, defaultCm: 29.3, labelMk: 'Број EU 45 - 46', labelEn: 'Shoe Size EU 45 - 46', trimLineMk: 'Подсечете по линијата за број 45 или 46', trimLineEn: 'Trim along guide line for size 45 or 46' }
    };

    const insoleModels = {
        sport: {
            title_mk: 'МОНЕТА Спортски анатомски влошки',
            title_en: 'MONETA Sports Anatomical Insoles',
            tag_mk: '98% Совпаѓање • Спорт & Трчање',
            tag_en: '98% Match • Sports & Running',
            image: './images/cards/Sportski.webp',
            link: '#kategorii',
            desc_mk: 'Напредна амортизација со ергономски силиконски гел перничиња на петицата за ублажување на удари и редукција на замор при трчање и спорт.',
            desc_en: 'Advanced cushioning with ergonomic silicone gel heel pads, engineered for impact absorption and fatigue reduction during athletic activities.',
            arch_mk: 'Ергономски 3D свод (Висока поддршка)',
            arch_en: 'Ergonomic 3D Arch (High Support)',
            tech_mk: ['Силиконски гел', 'Absorb & Breathable', 'Шок амортизација'],
            tech_en: ['Silicone Gel', 'Absorb & Breathable', 'Shock Cushioning']
        },
        leather: {
            canTrim: false,
            title_mk: 'МОНЕТА Елегантни кожни влошки',
            title_en: 'MONETA Elegant Leather Insoles',
            tag_mk: '96% Совпаѓање • Деловни & Кожни чевли',
            tag_en: '96% Match • Leather & Dress Shoes',
            image: './images/cards/Kozni.webp',
            link: '#kategorii',
            desc_mk: 'Ултра-тенка изработка од 100% природна кожа со вграден слој од активен јаглен кој овозможува непрекинато свежина и спречува непријатни мириси.',
            desc_en: 'Ultra-slim 100% genuine leather construction with active charcoal layer continuously keeping feet fresh and odor-free.',
            arch_mk: 'Анатомски тенок профил',
            arch_en: 'Anatomic Slim Profile',
            tech_mk: ['100% Природна кожа', 'Активен јаглен', 'Антибактериски'],
            tech_en: ['100% Genuine Leather', 'Active Charcoal', 'Antibacterial']
        },
        summer: {
            title_mk: 'МОНЕТА Летни дишечки влошки',
            title_en: 'MONETA Summer Breathable Insoles',
            tag_mk: '97% Совпаѓање • Топло време & Свежина',
            tag_en: '97% Match • Warm Weather & Airflow',
            image: './images/cards/Letni.webp',
            link: '#kategorii',
            desc_mk: 'Микро-перфорирана олеснивачка структура што овозможува максимален проток на воздух, одржувајќи ги стапалата суви и свежи во тек на целиот ден.',
            desc_en: 'Micro-perforated lightweight structure providing maximum airflow to keep your feet dry and cool all day long.',
            arch_mk: 'Анатомски дишечки свод',
            arch_en: 'Anatomic Airflow Arch',
            tech_mk: ['Микро-перфорација', 'Анти-влага систем', 'Лесен флекс'],
            tech_en: ['Micro-perforated', 'Anti-moisture System', 'Lightweight Flex']
        },
        winter: {
            title_mk: 'МОНЕТА Зимски термо влошки',
            title_en: 'MONETA Winter Thermo Insoles',
            tag_mk: '99% Совпаѓање • Термо заштита & Зима',
            tag_en: '99% Match • Thermal Shield & Winter',
            image: './images/cards/thermo_alu.webp',
            link: '#kategorii',
            desc_mk: 'Специјален трислоен термо систем со топлотна алуминиумска фолија и волнена површина кои ја задржуваат топлината и го рефлектираат студот.',
            desc_en: 'Special 3-layer thermal system with cold-reflecting aluminum foil barrier and natural wool layer for extreme warmth.',
            arch_mk: 'Термо-изолациски свод',
            arch_en: 'Thermo-Insulating Arch',
            tech_mk: ['Алуминиумска фолија', 'Топла волна', 'Мраз бариера'],
            tech_en: ['Aluminum Shield', 'Warm Wool', 'Frost Barrier']
        },
        hunter: {
            title_mk: 'МОНЕТА HUNTER професионални влошки',
            title_en: 'MONETA HUNTER Heavy-Duty Insoles',
            tag_mk: '99% Совпаѓање • Терен & Работни чевли',
            tag_en: '99% Match • Extreme Field & Heavy Duty',
            image: './images/cards/hunter_vloski.webp',
            link: '#kategorii',
            desc_mk: 'Индустриски зајакната конструкција наменета за екстремни оптоварувања, лов, планинарење и тешки работни обувки.',
            desc_en: 'Industrial-grade reinforced structure designed for heavy-duty loads, hunting, trekking, and safety work boots.',
            arch_mk: 'Heavy-Duty Ortho поддршка',
            arch_en: 'Heavy-Duty Ortho Support',
            tech_mk: ['Ortho-Stabilizer', 'Екстремна издржливост', 'Анти-вибрација'],
            tech_en: ['Ortho-Stabilizer', 'Extreme Durability', 'Anti-Vibration']
        },
        kids: {
            canTrim: false,
            title_mk: 'МОНЕТА Детски анатомски влошки',
            title_en: 'MONETA Kids Anatomical Insoles',
            tag_mk: '100% Совпаѓање • Правилен детски развој',
            tag_en: '100% Match • Healthy Growth Support',
            image: './images/cards/detski.webp',
            link: '#kategorii',
            desc_mk: 'Ергономски обликувани влошки за мека поддршка на правилниот развој на стапалата и превенција од рамни стапала кај деца.',
            desc_en: 'Ergonomically contoured insoles providing gentle support for healthy foot arch development and play comfort.',
            arch_mk: 'Нежен детски анатомски профил',
            arch_en: 'Gentle Pediatric Anatomic Profile',
            tech_mk: ['Превенција рамни стапала', 'Мека поддршка', 'Хипоалергени'],
            tech_en: ['Flat Foot Prevention', 'Gentle Support', 'Hypoallergenic']
        }
    };

    let selectedSize = '39-40';
    let selectedActivity = 'sport';

    const euToCm = (eu) => (eu * 0.667) - 1.2;
    const cmToEu = (cm) => Math.round((cm + 1.5) / 0.667);

    const highlightPillForVal = (eu) => {
        let matchedPillKey = '39-40';
        if (eu <= 34) matchedPillKey = '28-34';
        else if (eu <= 36) matchedPillKey = '35-36';
        else if (eu <= 38) matchedPillKey = '37-38';
        else if (eu <= 40) matchedPillKey = '39-40';
        else if (eu <= 42) matchedPillKey = '41-42';
        else if (eu <= 44) matchedPillKey = '43-44';
        else matchedPillKey = '45-46';
        selectedSize = matchedPillKey;
        sizePills.forEach((p) => p.classList.toggle('is-active', p.dataset.size === matchedPillKey));
    };

    const setLenField = (cmLen) => {
        if (!customLenInput) return;
        customLenInput.value = lenUnit === 'mm' ? Math.round(cmLen * 10) : parseFloat(cmLen.toFixed(1));
    };

    const getInsoleLengthInfo = (sizeKey, customVal) => {
        if (customVal && !isNaN(customVal) && customVal > 0) {
            // ЕУ број внесен во полето (customSizeInput е секогаш EU)
            const euSize = parseFloat(customVal);
            let cmLen = euToCm(euSize);
            cmLen = Math.max(16, Math.min(32, cmLen));
            const mmLen = Math.round(cmLen * 10);
            return {
                cmText: `~ ${cmLen.toFixed(1)} cm (${mmLen} mm)`,
                sizeLabelMk: `Точен број EU ${euSize} (${cmLen.toFixed(1)} cm)`,
                sizeLabelEn: `Exact EU ${euSize} (${cmLen.toFixed(1)} cm)`,
                trimLineMk: `Прилагодете со ножици по ознаката за EU ${Math.round(euSize)}`,
                trimLineEn: `Trim with scissors along line for EU ${Math.round(euSize)}`
            };
        }

        const info = sizeRangeMap[sizeKey] || sizeRangeMap['39-40'];
        const mmMin = Math.round(info.minCm * 10);
        const mmMax = Math.round(info.maxCm * 10);
        return {
            cmText: `${info.minCm.toFixed(1)} cm - ${info.maxCm.toFixed(1)} cm (${mmMin}-${mmMax} mm)`,
            sizeLabelMk: info.labelMk,
            sizeLabelEn: info.labelEn,
            trimLineMk: info.trimLineMk,
            trimLineEn: info.trimLineEn
        };
    };

    const updateRecommendation = () => {
        if (!resultContainer) return;
        const currentLang = document.documentElement.lang || localStorage.getItem('moneta_lang') || 'mk';
        const isEn = currentLang === 'en';

        // Auto-select kids activity if kids size selected
        if (selectedSize === '28-34') {
            selectedActivity = 'kids';
            activityPills.forEach((p) => {
                p.classList.toggle('is-active', p.dataset.activity === 'kids');
            });
        } else if (selectedActivity === 'kids' && selectedSize !== '28-34') {
            selectedActivity = 'sport';
            activityPills.forEach((p) => {
                p.classList.toggle('is-active', p.dataset.activity === 'sport');
            });
        }

        const model = insoleModels[selectedActivity] || insoleModels.sport;
        const customVal = customSizeInput ? parseFloat(customSizeInput.value) : NaN;
        const lengthInfo = getInsoleLengthInfo(selectedSize, customVal);

        // Update badge text if custom size input exists
        if (customSizeBadge) {
            customSizeBadge.textContent = lengthInfo.cmText;
        }

        const titleText = isEn ? model.title_en : model.title_mk;
        const tagText = isEn ? model.tag_en : model.tag_mk;
        const descText = isEn ? model.desc_en : model.desc_mk;
        const archText = isEn ? model.arch_en : model.arch_mk;
        const sizeLabel = isEn ? lengthInfo.sizeLabelEn : lengthInfo.sizeLabelMk;
        const trimAdvice = isEn ? lengthInfo.trimLineEn : lengthInfo.trimLineMk;
        const techList = isEn ? model.tech_en : model.tech_mk;

        const sizeHeading = isEn ? 'Recommended Size:' : 'Препорачан број:';
        const lengthHeading = isEn ? 'Insole Length:' : 'Должина на влошка:';
        const trimHeading = isEn ? 'Trimming Advice:' : 'Совет за кастрење:';
        const archHeading = isEn ? 'Arch Profile:' : 'Профил на свод:';

        const techChipsHtml = techList.map(t => `<span class="result-card__tech-chip">${t}</span>`).join('');

        const trimRow = model.canTrim === false
            ? `<p class="result-card__spec-item"><strong>${trimHeading}</strong> ${isEn ? 'Fixed sizes — not for trimming' : 'Фиксни големини — не се поткаструваат'}</p>`
            : `<p class="result-card__spec-item"><strong>${trimHeading}</strong> ${trimAdvice}</p>`;

        resultContainer.innerHTML = `
            <div class="result-card__image">
                <img src="${model.image}" alt="${titleText}" width="400" height="300" loading="lazy" decoding="async">
            </div>
            <div class="result-card__content">
                <div class="result-card__header-row">
                    <span class="result-card__tag">${tagText}</span>
                    <span class="result-card__cm-pill">${lengthInfo.cmText.split(' ')[0]} ${lengthInfo.cmText.split(' ')[1] || 'cm'}</span>
                </div>
                <h4 class="result-card__title">${titleText}</h4>
                <div class="result-card__specs-grid">
                    <p class="result-card__spec-item">
                        <strong>${sizeHeading}</strong> ${sizeLabel}
                    </p>
                    <p class="result-card__spec-item">
                        <strong>${lengthHeading}</strong> ${lengthInfo.cmText}
                    </p>
                    <p class="result-card__spec-item">
                        <strong>${archHeading}</strong> ${archText}
                    </p>
                    ${trimRow}
                </div>
                <p class="result-card__desc">${descText}</p>
                <div class="result-card__tech-row">
                    ${techChipsHtml}
                </div>
            </div>
        `;
    };

    sizePills.forEach((pill) => {
        pill.addEventListener('click', () => {
            sizePills.forEach((p) => p.classList.remove('is-active'));
            pill.classList.add('is-active');
            selectedSize = pill.dataset.size;
            if (customSizeInput) customSizeInput.value = '';
            if (customLenInput) customLenInput.value = '';
            updateRecommendation();
        });
    });

    activityPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            activityPills.forEach((p) => p.classList.remove('is-active'));
            pill.classList.add('is-active');
            selectedActivity = pill.dataset.activity;
            updateRecommendation();
        });
    });

    if (customSizeInput) {
        customSizeInput.addEventListener('input', () => {
            const val = parseFloat(customSizeInput.value);
            if (!isNaN(val) && val > 0) {
                highlightPillForVal(val);
                setLenField(euToCm(val));
            }
            updateRecommendation();
        });
    }

    if (customLenInput) {
        customLenInput.addEventListener('input', () => {
            const val = parseFloat(customLenInput.value);
            if (!isNaN(val) && val > 0) {
                const cmLen = lenUnit === 'mm' ? val / 10 : val;
                const eu = cmToEu(cmLen);
                if (customSizeInput) customSizeInput.value = eu;
                highlightPillForVal(eu);
            }
            updateRecommendation();
        });
    }

    lenUnitBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            lenUnitBtns.forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            lenUnit = btn.dataset.unit;
            const euVal = parseFloat(customSizeInput ? customSizeInput.value : '');
            if (!isNaN(euVal) && euVal > 0) {
                setLenField(euToCm(euVal));
            } else {
                const lenVal = parseFloat(customLenInput ? customLenInput.value : '');
                if (!isNaN(lenVal) && lenVal > 0) {
                    setLenField(lenUnit === 'mm' ? lenVal / 10 : lenVal);
                }
            }
            updateRecommendation();
        });
    });

    // Re-render recommendation when language changes (dropdown-switcher safe)
    if (window.MonetaOnLangChange) {
        window.MonetaOnLangChange(() => setTimeout(updateRecommendation, 50));
    }

    // Initial calculation
    updateRecommendation();
}

// ========================================
// ORDER TRACKER — Точка 6 (2026-08-05)
// Следeњето е директен линк до Карго Експрес
// (https://www.kargoekspres.mk/ProverkaPratka.aspx) во index.html —
// броевите за следење клиентот ги добива по email од Карго.
// Демо логиката (knownOrders/trackOrder) е отстранета.
// ========================================

// ========================================
// NEWSLETTER SUBSCRIPTION LOGIC
// ========================================
const newsletterForm = document.getElementById('newsletterForm');
const newsletterEmailInput = document.getElementById('newsletterEmailInput');
const newsletterFeedback = document.getElementById('newsletterFeedback');

if (newsletterForm && newsletterEmailInput && newsletterFeedback) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const validateEmail = (email) => {
        if (!email) return { valid: false, reason: 'empty' };
        if (!emailRegex.test(email)) return { valid: false, reason: 'format' };
        return { valid: true };
    };

    const clearValidationState = () => {
        newsletterEmailInput.classList.remove('is-invalid');
        newsletterFeedback.className = 'newsletter__feedback';
        newsletterFeedback.innerHTML = '';
    };

    newsletterEmailInput.addEventListener('input', () => {
        if (newsletterEmailInput.classList.contains('is-invalid')) {
            const result = validateEmail(newsletterEmailInput.value.trim());
            if (result.valid) {
                clearValidationState();
            }
        }
    });

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterEmailInput.value.trim();
        const lang = document.documentElement.lang === 'en' ? 'en' : 'mk';
        const validation = validateEmail(email);

        if (!validation.valid) {
            newsletterEmailInput.classList.add('is-invalid');
            newsletterFeedback.className = 'newsletter__feedback is-error';

            let errorMsg = '';
            if (validation.reason === 'empty') {
                errorMsg = lang === 'en' 
                    ? 'Please enter your email address.' 
                    : 'Ве молиме внесете ја вашата е-пошта адреса.';
            } else {
                errorMsg = lang === 'en' 
                    ? 'Please enter a valid email address (e.g., name@domain.com).' 
                    : 'Ве молиме внесете валиден формат на е-пошта (на пр. ime@domen.mk).';
            }

            newsletterFeedback.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>${errorMsg}</span>
            `;
            newsletterEmailInput.focus();
            return;
        }

        newsletterEmailInput.classList.remove('is-invalid');
        newsletterFeedback.className = 'newsletter__feedback is-success';
        const successMsg = lang === 'en'
            ? 'Thank you! You have successfully subscribed to our foot health newsletter.'
            : 'Ви благодариме! Успешно се пријавивте за нашиот билтен со совети за здравје на стапалата.';

        newsletterFeedback.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${successMsg}</span>
        `;
        newsletterEmailInput.value = '';
    });
}

// ========================================
// CATEGORY CARDS 3D TILT — ОТСТРАНЕТ (2026-08-03, барање на клиент)
// Картичките повеќе не се „нишаат" на hover. Иконката горе со светлото останува.
// ========================================

// ========================================
// COMPARE MODELS TOGGLE INTERACTION
// ========================================
const compareToggleBtn = document.getElementById('compareToggleBtn');
const compareCloseBtn = document.getElementById('compareCloseBtn');
const compareModelsSection = document.getElementById('compareModelsSection');

if (compareToggleBtn && compareModelsSection) {
    const compareCard = compareModelsSection.querySelector('.compare-models__card');

    const toggleCompareSection = (forceClose = false) => {
        const isOpen = compareToggleBtn.classList.contains('is-active');
        const shouldClose = forceClose || isOpen;

        if (shouldClose) {
            compareToggleBtn.classList.remove('is-active');
            compareToggleBtn.setAttribute('aria-expanded', 'false');
            compareModelsSection.setAttribute('aria-hidden', 'true');

            if (typeof gsap !== 'undefined') {
                gsap.to(compareCard, {
                    opacity: 0,
                    y: -20,
                    duration: 0.25,
                    ease: 'power2.in',
                    onComplete: () => {
                        // Точка 10: без transform на картата (transform на предок го крши sticky)
                        gsap.set(compareCard, { clearProps: 'transform' });
                    }
                });
                gsap.to(compareModelsSection, {
                    height: 0,
                    duration: 0.4,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        gsap.set(compareModelsSection, { display: 'none' });
                    }
                });
            } else {
                compareModelsSection.style.display = 'none';
            }
        } else {
            compareToggleBtn.classList.add('is-active');
            compareToggleBtn.setAttribute('aria-expanded', 'true');
            compareModelsSection.setAttribute('aria-hidden', 'false');

            if (typeof gsap !== 'undefined') {
                gsap.set(compareModelsSection, { display: 'block', height: 0 });
                gsap.set(compareCard, { opacity: 0, y: -20 });

                gsap.to(compareModelsSection, {
                    height: 'auto',
                    duration: 0.45,
                    ease: 'power2.out'
                });
                gsap.to(compareCard, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    delay: 0.08,
                    ease: 'power2.out',
                    onComplete: () => {
                        // Точка 10: без transform на картата (transform на предок го крши sticky)
                        gsap.set(compareCard, { clearProps: 'transform' });
                        compareModelsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            } else {
                compareModelsSection.style.display = 'block';
            }
        }
    };

    compareToggleBtn.addEventListener('click', () => toggleCompareSection());
    if (compareCloseBtn) {
        compareCloseBtn.addEventListener('click', () => toggleCompareSection(true));
    }

    // Auto-close the compare section when the toggle button loses focus
    compareToggleBtn.addEventListener('blur', (e) => {
        const nextTarget = e.relatedTarget;
        // Keep it open if focus moved inside the open section (selects, buttons, etc.)
        if (nextTarget && compareModelsSection.contains(nextTarget)) {
            return;
        }
        if (compareToggleBtn.classList.contains('is-active')) {
            toggleCompareSection(true);
        }
    });
}

// ========================================
// INTERACTIVE 1:1 MODEL COMPARISON TOOL ENGINE
// ========================================
(function initInteractiveCompareTool() {
    const compareSelect1 = document.getElementById('compareSelect1');
    const compareSelect2 = document.getElementById('compareSelect2');
    const compareSwapBtn = document.getElementById('compareSwapBtn');
    const compareDiffOnlyToggle = document.getElementById('compareDiffOnlyToggle');
    const compareDiffCountBadge = document.getElementById('compareDiffCountBadge');
    const compareInteractiveContainer = document.getElementById('compareInteractiveContainer');
    const compareTabInteractive = document.getElementById('compareTabInteractive');
    const compareTabOverview = document.getElementById('compareTabOverview');
    const compareInteractiveView = document.getElementById('compareInteractiveView');
    const compareOverviewView = document.getElementById('compareOverviewView');
    const presetChips = document.querySelectorAll('.compare-preset-chip');

    if (!compareSelect1 || !compareSelect2 || !compareInteractiveContainer) return;

    // Full Specs Data Matrix
                const COMPARE_PRODUCTS = {
        'active-gel': {
            id: "active-gel",
            category: "sportski",
            name: { mk: "Active Gel", en: "Active Gel" },
            shortName: { mk: "Спортски", en: "Sports" },
            image: "./images/cards/active-gel.webp",
            link: "./modeli/active-gel.html",
            price: "620 ден.",
            specs: {
                material: { mk: "Мек плиш & Активен гел", en: "Soft plush & active gel" },
                purpose: { mk: "Спорт, трчање, фитнес, рекреативен спорт", en: "Sports, running, fitness, recreational sport" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 60, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★★☆", score: "4/5", mk: "Висока (4/5)", en: "High (4/5)" },
                thickness: { mk: "3–4 mm", en: "3–4 mm" },
                keyFeature: { mk: "Активен гел за амортизација, се сече по големина", en: "Active gel cushioning, cut to size" },
                footwear: { mk: "Спортски патики, обувки за трчање, фитнес обувки", en: "Sports sneakers, running & fitness shoes" },
                odorControl: { mk: "Перфорирана дишлива површина", en: "Breathable perforated surface" },
                care: { mk: "Влажна крпа, природно сушење", en: "Wipe with damp cloth, air dry" },
                fatigue: { mk: "Намалува замор при трчање и стоење", en: "Reduces fatigue when running & standing" }
            }
        },
        'anatomiX': {
            id: "anatomiX",
            category: "sportski",
            name: { mk: "AnatomiX", en: "AnatomiX" },
            shortName: { mk: "Спортски", en: "Sports" },
            image: "./images/cards/anatomiX.webp",
            link: "./modeli/anatomiX.html",
            price: "430 ден.",
            specs: {
                material: { mk: "Текстил со активен јаглен, рециклирана антибактериска пена, карбосан пена", en: "Textile with activated carbon, recycled antibacterial foam, dual-density carbosan" },
                purpose: { mk: "Трчање, trail running, планинарење, trekking", en: "Running, trail running, hiking, trekking" },
                archSupport: { mk: "Висока", en: "High", levelPercent: 85, badgeClass: "compare-badge--high" },
                shockAbsorption: { stars: "★★★★★", score: "5/5", mk: "Максимална (5/5)", en: "Maximum (5/5)" },
                thickness: { mk: "4–5 mm", en: "4–5 mm" },
                keyFeature: { mk: "Премиум RUN & HIKING, перење до 30°C", en: "Premium RUN & HIKING, washable up to 30°C" },
                footwear: { mk: "Спортски, trail, планинарски, trekking обувки", en: "Sports, trail, hiking, trekking shoes" },
                odorControl: { mk: "Текстил со активен јаглен", en: "Activated carbon textile" },
                care: { mk: "Перење до 30°C, природно сушење", en: "Machine/hand wash up to 30°C, air dry" },
                fatigue: { mk: "Поддршка при долги трки и искачувања", en: "Support for long runs & climbs" }
            }
        },
        'memosole': {
            id: "memosole",
            category: "sportski",
            name: { mk: "MEMOSOLE", en: "MEMOSOLE" },
            shortName: { mk: "Спортски", en: "Sports" },
            image: "./images/cards/memosole.webp",
            link: "./modeli/memosole.html",
            price: "400 ден.",
            specs: {
                material: { mk: "Текстилен слој, мемориска пена, латекс со активен јаглен", en: "Textile layer, memory foam, latex with active carbon" },
                purpose: { mk: "Пешачење, трчање, секојдневни активности", en: "Walking, running, daily activities" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 70, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★★☆", score: "4/5", mk: "Висока (4/5)", en: "High (4/5)" },
                thickness: { mk: "4–6 mm", en: "4–6 mm" },
                keyFeature: { mk: "Мемориска пена што се прилагодува на стапалото", en: "Memory foam that adapts to the foot" },
                footwear: { mk: "Спортски патики, обувки за трчање, работни обувки", en: "Sports sneakers, running shoes, work shoes" },
                odorControl: { mk: "Латекс со активен јаглен", en: "Latex with active carbon" },
                care: { mk: "Влажна крпа, природно сушење", en: "Wipe with damp cloth, air dry" },
                fatigue: { mk: "Адаптација кон формата на стапалото", en: "Adapts to the shape of the foot" }
            }
        },
        'sport-style': {
            id: "sport-style",
            category: "sportski",
            name: { mk: "Sport Style", en: "Sport Style" },
            shortName: { mk: "Спортски", en: "Sports" },
            image: "./images/cards/sport-style.webp",
            link: "./modeli/sport-style.html",
            price: "300 ден.",
            specs: {
                material: { mk: "100% памучен фротир, ароматизирана латекс пена, пластичен носач, карбосан", en: "100% cotton terry, aromatic latex foam, plastic arch support, carbosan" },
                purpose: { mk: "Трчање, фитнес, рекреативен спорт, секојдневно", en: "Running, fitness, recreational sport, daily use" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 65, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★☆☆", score: "3/5", mk: "Умерена (3/5)", en: "Moderate (3/5)" },
                thickness: { mk: "4–5 mm", en: "4–5 mm" },
                keyFeature: { mk: "Памучен фротир + пластичен носач за стабилност", en: "Cotton terry + plastic arch support for stability" },
                footwear: { mk: "Спортски патики, фитнес, секојдневни спортски обувки", en: "Sports sneakers, fitness, everyday sports shoes" },
                odorControl: { mk: "Ароматизирана латекс пена", en: "Aromatic latex foam" },
                care: { mk: "Влажна крпа, природно сушење", en: "Wipe with damp cloth, air dry" },
                fatigue: { mk: "Стабилност при секојдневно носење", en: "Stability for daily wear" }
            }
        },
        'sportex': {
            id: "sportex",
            category: "sportski",
            name: { mk: "Sportex", en: "Sportex" },
            shortName: { mk: "Спортски", en: "Sports" },
            image: "./images/cards/sportex.webp",
            link: "./modeli/sportex.html",
            price: "230 ден.",
            specs: {
                material: { mk: "PES текстил, полиуретанска антибактериска карбосан пена, воздушно перниче", en: "PES textile, polyurethane antibacterial carbosan foam, air cushion" },
                purpose: { mk: "Трчање, пешачење, фитнес, рекреација", en: "Running, walking, fitness, recreation" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 60, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★★☆", score: "4/5", mk: "Висока (4/5)", en: "High (4/5)" },
                thickness: { mk: "4–5 mm", en: "4–5 mm" },
                keyFeature: { mk: "Воздушно перниче во петата + алое вера", en: "Heel air cushion + aloe vera" },
                footwear: { mk: "Спортски патики, тренинг, рекреативни обувки", en: "Sports sneakers, training, recreational shoes" },
                odorControl: { mk: "Антибактериски + свеж мирис на алое вера", en: "Antibacterial + fresh aloe vera scent" },
                care: { mk: "Влажна крпа, природно сушење", en: "Wipe with damp cloth, air dry" },
                fatigue: { mk: "Амортизација при движење", en: "Shock absorption during movement" }
            }
        },
        'x-treme': {
            id: "x-treme",
            category: "sportski",
            name: { mk: "X-TREME", en: "X-TREME" },
            shortName: { mk: "Спортски", en: "Sports" },
            image: "./images/cards/x-treme.webp",
            link: "./modeli/x-treme.html",
            price: "420 ден.",
            specs: {
                material: { mk: "WAP високоапсорбирачки материјал, латекс со термо-филц, пластичен носач, карбосан", en: "WAP high-absorption material, latex with thermo-felt, plastic arch support, carbosan" },
                purpose: { mk: "Планинарење, trekking, trail running, outdoor", en: "Hiking, trekking, trail running, outdoor" },
                archSupport: { mk: "Максимална", en: "Maximum", levelPercent: 95, badgeClass: "compare-badge--max" },
                shockAbsorption: { stars: "★★★★★", score: "5/5", mk: "Максимална (5/5)", en: "Maximum (5/5)" },
                thickness: { mk: "5–7 mm", en: "5–7 mm" },
                keyFeature: { mk: "4-слојна конструкција со WAP амортизирачка зона", en: "4-layer construction with WAP cushioning zone" },
                footwear: { mk: "Планинарски, trekking, trail, работни обувки", en: "Hiking, trekking, trail, work boots" },
                odorControl: { mk: "Хидрофобна антибактериска површина", en: "Hydrophobic antibacterial layer" },
                care: { mk: "Проветрување, влажна крпа, природно сушење", en: "Air out, wipe with damp cloth, air dry" },
                fatigue: { mk: "Стабилност на нерамен терен", en: "Stability on rugged terrain" }
            }
        },
        'topas': {
            id: "topas",
            category: "kozni",
            name: { mk: "Topas", en: "Topas" },
            shortName: { mk: "Кожни", en: "Leather" },
            image: "./images/cards/topas.webp",
            link: "./modeli/topas.html",
            price: "490 ден.",
            specs: {
                material: { mk: "Мека перфорирана јагнешка кожа, пластичен носач, карбосан перниче", en: "Soft perforated lambskin, plastic arch support, carbosan heel cushion" },
                purpose: { mk: "Работа, деловни обврски, секојдневно носење", en: "Work, business, everyday wear" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 60, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★☆☆", score: "3/5", mk: "Умерена (3/5)", en: "Moderate (3/5)" },
                thickness: { mk: "3–4 mm", en: "3–4 mm" },
                keyFeature: { mk: "3/4 дизајн за елегантни чевли со ограничен простор", en: "3/4 design for elegant shoes with limited space" },
                footwear: { mk: "Елегантни чевли, мокасини, кожни чевли", en: "Elegant shoes, loafers, leather shoes" },
                odorControl: { mk: "Природна кожа со макропори", en: "Natural leather with macropores" },
                care: { mk: "Мека влажна крпа, не потопувај во вода", en: "Wipe with soft damp cloth, do not soak" },
                fatigue: { mk: "Комфор во обувки со ограничен простор", en: "Comfort in shoes with limited space" }
            }
        },
        'soft-gel': {
            id: "soft-gel",
            category: "kozni",
            name: { mk: "Soft Gel", en: "Soft Gel" },
            shortName: { mk: "Кожни", en: "Leather" },
            image: "./images/cards/soft-gel.webp",
            link: "./modeli/soft-gel.html",
            price: "820 ден.",
            specs: {
                material: { mk: "Мека јагнешка кожа, две гел перничиња, латекс со активен јаглен, пластичен носач, карбосан", en: "Soft lambskin, two gel cushions, latex with active carbon, plastic arch support, carbosan" },
                purpose: { mk: "Секојдневно, работа, подолг престој на нозе", en: "Daily use, work, long hours on feet" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 65, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★★☆", score: "4/5", mk: "Висока (4/5)", en: "High (4/5)" },
                thickness: { mk: "3–4 mm", en: "3–4 mm" },
                keyFeature: { mk: "Кожа + гел перничиња во зоните на најголем контакт", en: "Leather + gel cushions in high-contact zones" },
                footwear: { mk: "Кожни чевли, спортско-елегантни, работни обувки", en: "Leather shoes, smart-casual, work shoes" },
                odorControl: { mk: "Латекс со активен јаглен", en: "Latex with active carbon" },
                care: { mk: "Мека влажна крпа, природно сушење", en: "Wipe with soft damp cloth, air dry" },
                fatigue: { mk: "Удобност при долг престој на нозе", en: "Comfort during long hours on feet" }
            }
        },
        'vital': {
            id: "vital",
            category: "kozni",
            name: { mk: "Vital", en: "Vital" },
            shortName: { mk: "Кожни", en: "Leather" },
            image: "./images/cards/vital.webp",
            link: "./modeli/vital.html",
            price: "450 ден.",
            specs: {
                material: { mk: "Мека перфорирана јагнешка кожа, карбосан перниче, латекс со активен јаглен", en: "Soft perforated lambskin, carbosan heel cushion, latex with active carbon" },
                purpose: { mk: "Работа, пешачење, секојдневни активности, деловни обврски", en: "Work, walking, daily activities, business" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 65, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★☆☆", score: "3/5", mk: "Умерена (3/5)", en: "Moderate (3/5)" },
                thickness: { mk: "3–4 mm", en: "3–4 mm" },
                keyFeature: { mk: "Карбосан перниче за дополнителен комфор на петата", en: "Carbosan cushion for extra heel comfort" },
                footwear: { mk: "Кожни, секојдневни, спортско-елегантни, работни обувки", en: "Leather, everyday, smart-casual, work shoes" },
                odorControl: { mk: "Латекс со активен јаглен", en: "Latex with active carbon" },
                care: { mk: "Мека влажна крпа, природно сушење", en: "Wipe with soft damp cloth, air dry" },
                fatigue: { mk: "Поддршка при долго стоење", en: "Support during prolonged standing" }
            }
        },
        'relax': {
            id: "relax",
            category: "kozni",
            name: { mk: "Relax", en: "Relax" },
            shortName: { mk: "Кожни", en: "Leather" },
            image: "./images/cards/relax.webp",
            link: "./modeli/relax.html",
            price: "570 ден.",
            specs: {
                material: { mk: "Мека перфорирана јагнешка кожа, латекс со активен јаглен, пластичен носач, карбосан", en: "Soft perforated lambskin, latex with active carbon, plastic arch support, carbosan" },
                purpose: { mk: "Секојдневно, канцеларија, работа, пешачење", en: "Daily use, office, work, walking" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 65, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★☆☆", score: "3/5", mk: "Умерена (3/5)", en: "Moderate (3/5)" },
                thickness: { mk: "3–4 mm", en: "3–4 mm" },
                keyFeature: { mk: "Перфорирана кожа + пластичен носач", en: "Perforated leather + plastic arch support" },
                footwear: { mk: "Кожни, работни обувки, чизми, секојдневни", en: "Leather, work shoes, boots, everyday" },
                odorControl: { mk: "Перфорирана кожа за циркулација", en: "Perforated leather for air circulation" },
                care: { mk: "Мека влажна крпа, природно сушење", en: "Wipe with soft damp cloth, air dry" },
                fatigue: { mk: "Комфор при подолго стоење и работа", en: "Comfort during long standing & work" }
            }
        },
        'heel-pad': {
            id: "heel-pad",
            category: "heelpad",
            name: { mk: "Heel Pad", en: "Heel Pad" },
            shortName: { mk: "Heel Pad", en: "Heel Pad" },
            image: "./images/cards/heel-pad.webp",
            link: "./modeli/heel-pad.html",
            price: "250 ден.",
            specs: {
                material: { mk: "Мека јагнешка кожа, карбосан перниче, самолеплив слој", en: "Soft lambskin, carbosan cushion, self-adhesive layer" },
                purpose: { mk: "Перниче за пета, секојдневно носење", en: "Heel cushion, everyday wear" },
                archSupport: { mk: "Лесна", en: "Light", levelPercent: 30, badgeClass: "compare-badge--light" },
                shockAbsorption: { stars: "★★★☆☆", score: "3/5", mk: "Умерена (3/5)", en: "Moderate (3/5)" },
                thickness: { mk: "2–3 mm", en: "2–3 mm" },
                keyFeature: { mk: "Самолепливо перниче за амортизација на петата", en: "Self-adhesive cushion for heel shock absorption" },
                footwear: { mk: "Кожни чевли, патики, работни, обувки со ниска пета", en: "Leather shoes, sneakers, work shoes, low heels" },
                odorControl: { mk: "Природна кожа", en: "Natural leather" },
                care: { mk: "Мека влажна крпа, не потопувај во вода", en: "Wipe with soft damp cloth, do not soak" },
                fatigue: { mk: "Амортизација на петата при одење", en: "Heel cushioning while walking" }
            }
        },
        'heel-pad-fix': {
            id: "heel-pad-fix",
            category: "heelpad",
            name: { mk: "Heel Pad Fix", en: "Heel Pad Fix" },
            shortName: { mk: "Heel Pad", en: "Heel Pad" },
            image: "./images/cards/heel-pad-fix.webp",
            link: "./modeli/heel-pad-fix.html",
            price: "210 ден.",
            specs: {
                material: { mk: "Мека јагнешка кожа, карбосан перниче, самолеплив слој", en: "Soft lambskin, carbosan cushion, self-adhesive layer" },
                purpose: { mk: "Формирачко перниче за пета", en: "Forming heel cushion" },
                archSupport: { mk: "Лесна", en: "Light", levelPercent: 30, badgeClass: "compare-badge--light" },
                shockAbsorption: { stars: "★★★☆☆", score: "3/5", mk: "Умерена (3/5)", en: "Moderate (3/5)" },
                thickness: { mk: "2–3 mm", en: "2–3 mm" },
                keyFeature: { mk: "Формирачко перниче за стабилно позиционирање на петата", en: "Forming cushion for stable heel positioning" },
                footwear: { mk: "Секојдневни, патики, кожни, обувки со рамна пета", en: "Everyday, sneakers, leather, flat-heel shoes" },
                odorControl: { mk: "Природна кожа", en: "Natural leather" },
                care: { mk: "Мека влажна крпа, природно сушење", en: "Wipe with soft damp cloth, air dry" },
                fatigue: { mk: "Стабилност на петата", en: "Heel stability" }
            }
        },
        'heel-pad-grip': {
            id: "heel-pad-grip",
            category: "heelpad",
            name: { mk: "Heel Pad Grip", en: "Heel Pad Grip" },
            shortName: { mk: "Heel Pad", en: "Heel Pad" },
            image: "./images/cards/heel-pad-grip.webp",
            link: "./modeli/heel-pad-grip.html",
            price: "100 ден.",
            specs: {
                material: { mk: "Мека јагнешка кожа, карбосан пена, самолеплив слој", en: "Soft lambskin, carbosan foam, self-adhesive layer" },
                purpose: { mk: "Grip за пета, спречува лизгање", en: "Heel grip, prevents slipping" },
                archSupport: { mk: "Лесна", en: "Light", levelPercent: 20, badgeClass: "compare-badge--light" },
                shockAbsorption: { stars: "★★☆☆☆", score: "2/5", mk: "Лесна (2/5)", en: "Light (2/5)" },
                thickness: { mk: "2–3 mm", en: "2–3 mm" },
                keyFeature: { mk: "Универзален самолеплив grip против лизгање", en: "Universal self-adhesive anti-slip grip" },
                footwear: { mk: "Машки и женски обувки (универзален)", en: "Men's and women's shoes (universal)" },
                odorControl: { mk: "Природна кожа", en: "Natural leather" },
                care: { mk: "Мека влажна крпа, не перење со вода", en: "Wipe with soft damp cloth, no water washing" },
                fatigue: { mk: "Помага петата да остане стабилна", en: "Keeps the heel stable" }
            }
        },
        'carbon': {
            id: "carbon",
            category: "letni",
            name: { mk: "Carbon", en: "Carbon" },
            shortName: { mk: "Летни", en: "Summer" },
            image: "./images/cards/carbon.webp",
            link: "./modeli/carbon.html",
            price: "170 ден.",
            specs: {
                material: { mk: "Памук/Лен со активен јаглен", en: "Cotton/Linen with activated carbon" },
                purpose: { mk: "Летни обувки, носење на босо стапало", en: "Summer shoes, barefoot wear" },
                archSupport: { mk: "Лесна", en: "Light", levelPercent: 40, badgeClass: "compare-badge--light" },
                shockAbsorption: { stars: "★★☆☆☆", score: "2/5", mk: "Лесна (2/5)", en: "Light (2/5)" },
                thickness: { mk: "2–3 mm", en: "2–3 mm" },
                keyFeature: { mk: "Активен јаглен, универзална — се сече по големина", en: "Activated carbon, universal — cut to size" },
                footwear: { mk: "Спортски, патики, платнени, лесни летни обувки", en: "Sports shoes, sneakers, canvas, light summer shoes" },
                odorControl: { mk: "Максимална заштита со активен јаглен", en: "Maximum activated carbon protection" },
                care: { mk: "Влажна крпа, сушење на собна температура", en: "Wipe with damp cloth, dry at room temperature" },
                fatigue: { mk: "Свежина и сувост во топли денови", en: "Freshness and dryness on hot days" }
            }
        },
        'simona': {
            id: "simona",
            category: "letni",
            name: { mk: "Simona", en: "Simona" },
            shortName: { mk: "Летни", en: "Summer" },
            image: "./images/cards/simona.webp",
            link: "./modeli/simona.html",
            price: "120 ден.",
            specs: {
                material: { mk: "100% памучна ткаенина, латекс со активен јаглен, ароматична карбосан пена", en: "100% cotton fabric, latex with active carbon, aromatic carbosan foam" },
                purpose: { mk: "Летни обувки, секојдневно носење", en: "Summer shoes, everyday wear" },
                archSupport: { mk: "Лесна", en: "Light", levelPercent: 40, badgeClass: "compare-badge--light" },
                shockAbsorption: { stars: "★★☆☆☆", score: "2/5", mk: "Лесна (2/5)", en: "Light (2/5)" },
                thickness: { mk: "2–3 mm", en: "2–3 mm" },
                keyFeature: { mk: "100% памук + ароматична пена", en: "100% cotton + aromatic foam" },
                footwear: { mk: "Патики, летни обувки, мокасини, платнени", en: "Sneakers, summer shoes, loafers, canvas" },
                odorControl: { mk: "Ароматична карбосан пена", en: "Aromatic carbosan foam" },
                care: { mk: "Мека влажна крпа, природно сушење", en: "Wipe with soft damp cloth, air dry" },
                fatigue: { mk: "Лесност и удобност во лето", en: "Lightness and comfort in summer" }
            }
        },
        'thermo-alu': {
            id: "thermo-alu",
            category: "zimski",
            name: { mk: "Thermo Alu", en: "Thermo Alu" },
            shortName: { mk: "Зимски", en: "Winter" },
            image: "./images/cards/thermo-alu.webp",
            link: "./modeli/thermo-alu.html",
            price: "210 ден.",
            specs: {
                material: { mk: "100% природна волна, латекс пена, алуминиумска фолија", en: "100% natural wool, latex foam, aluminium foil" },
                purpose: { mk: "Зимски услови, топлотна изолација", en: "Winter conditions, thermal insulation" },
                archSupport: { mk: "Средна", en: "Medium", levelPercent: 60, badgeClass: "compare-badge--medium" },
                shockAbsorption: { stars: "★★★★☆", score: "4/5", mk: "Висока (4/5)", en: "High (4/5)" },
                thickness: { mk: "5–7 mm", en: "5–7 mm" },
                keyFeature: { mk: "Волна + алуминиумска изолација од ладен под", en: "Wool + aluminium cold-ground insulation" },
                footwear: { mk: "Зимски чизми, планинарски, работни, гумени чизми", en: "Winter boots, hiking, work, rubber boots" },
                odorControl: { mk: "Природна волнена саморегулација", en: "Natural self-regulating wool" },
                care: { mk: "Мека четка/влажна крпа, без радијатор", en: "Soft brush/damp cloth, no radiator drying" },
                fatigue: { mk: "Топлина во екстремен студ", en: "Warmth in extreme cold" }
            }
        },
        'hunter-camo': {
            id: "hunter-camo",
            category: "hunter",
            name: { mk: "Hunter CAMO", en: "Hunter CAMO" },
            shortName: { mk: "HUNTER", en: "HUNTER" },
            image: "./images/cards/hunter-camo.webp",
            link: "./modeli/hunter-camo.html",
            price: "330 ден.",
            specs: {
                material: { mk: "100% PES Atlas текстил, латекс пена со активен јаглен", en: "100% PES Atlas textile, latex foam with active carbon" },
                purpose: { mk: "Лов, планинарење, trekking, outdoor", en: "Hunting, hiking, trekking, outdoor" },
                archSupport: { mk: "Максимална", en: "Maximum", levelPercent: 100, badgeClass: "compare-badge--max" },
                shockAbsorption: { stars: "★★★★★", score: "5/5", mk: "Максимална (5/5)", en: "Maximum (5/5)" },
                thickness: { mk: "6–8 mm", en: "6–8 mm" },
                keyFeature: { mk: "Камуфлажен дизајн + латекс со активен јаглен", en: "Camouflage design + latex with active carbon" },
                footwear: { mk: "Ловечки, планинарски, trekking, работни чизми", en: "Hunting, hiking, trekking, work boots" },
                odorControl: { mk: "Латекс со активен јаглен", en: "Latex with active carbon" },
                care: { mk: "Влажна крпа, природно сушење", en: "Wipe with damp cloth, air dry" },
                fatigue: { mk: "Комфор при долги outdoor активности", en: "Comfort during long outdoor activities" }
            }
        },
        'hunter-flex': {
            id: "hunter-flex",
            category: "hunter",
            name: { mk: "Hunter FLEX", en: "Hunter FLEX" },
            shortName: { mk: "HUNTER", en: "HUNTER" },
            image: "./images/cards/hunter-flex.webp",
            link: "./modeli/hunter-flex.html",
            price: "330 ден.",
            specs: {
                material: { mk: "100% Cambrella текстил, алуминиумска фолија, висококвалитетен филц", en: "100% Cambrella textile, aluminium foil, high-quality felt" },
                purpose: { mk: "Лов, планинарење, риболов, постудени услови", en: "Hunting, hiking, fishing, colder conditions" },
                archSupport: { mk: "Максимална", en: "Maximum", levelPercent: 100, badgeClass: "compare-badge--max" },
                shockAbsorption: { stars: "★★★★★", score: "5/5", mk: "Максимална (5/5)", en: "Maximum (5/5)" },
                thickness: { mk: "6–8 mm", en: "6–8 mm" },
                keyFeature: { mk: "3-слојна: Cambrella + алуминиум + филц (топлина)", en: "3-layer: Cambrella + aluminium + felt (warmth)" },
                footwear: { mk: "Планинарски, ловечки, зимски, работни чизми", en: "Hiking, hunting, winter, work boots" },
                odorControl: { mk: "Текстил со висока отпорност на абење", en: "Abrasion-resistant textile" },
                care: { mk: "Влажна крпа, природно сушење", en: "Wipe with damp cloth, air dry" },
                fatigue: { mk: "Изолација во постудени услови", en: "Insulation in colder conditions" }
            }
        },
        'hunter-outdoor': {
            id: "hunter-outdoor",
            category: "hunter",
            name: { mk: "Hunter OUTDOOR", en: "Hunter OUTDOOR" },
            shortName: { mk: "HUNTER", en: "HUNTER" },
            image: "./images/cards/hunter-outdoor.webp",
            link: "./modeli/hunter-outdoor.html",
            price: "330 ден.",
            specs: {
                material: { mk: "PES перфорирана ткаенина, Viscolat мемориска пена, PES филц, алуминиумска фолија", en: "PES perforated fabric, Viscolat memory foam, PES felt, aluminium foil" },
                purpose: { mk: "Планинарење, лов, trekking", en: "Hiking, hunting, trekking" },
                archSupport: { mk: "Максимална", en: "Maximum", levelPercent: 100, badgeClass: "compare-badge--max" },
                shockAbsorption: { stars: "★★★★★", score: "5/5", mk: "Максимална (5/5)", en: "Maximum (5/5)" },
                thickness: { mk: "6–8 mm", en: "6–8 mm" },
                keyFeature: { mk: "4-слојна со Viscolat мемориска пена", en: "4-layer with Viscolat memory foam" },
                footwear: { mk: "Планинарски, ловечки, outdoor, работни чизми", en: "Hiking, hunting, outdoor, work boots" },
                odorControl: { mk: "Перфорирана PES за циркулација", en: "Perforated PES for air circulation" },
                care: { mk: "Влажна крпа, природно сушење", en: "Wipe with damp cloth, air dry" },
                fatigue: { mk: "Адаптација кон обликот на стапалото", en: "Adapts to the shape of the foot" }
            }
        },
        'duck': {
            id: "duck",
            category: "detski",
            name: { mk: "Duck", en: "Duck" },
            shortName: { mk: "Детски", en: "Kids" },
            image: "./images/cards/duck.webp",
            link: "./modeli/duck.html",
            price: "490 ден.",
            specs: {
                material: { mk: "100% памучен фротир, ароматизирана латекс пена, пластичен + карбосан калап", en: "100% cotton terry, aromatic latex foam, plastic + carbosan mold" },
                purpose: { mk: "Детски обувки, училиште, игра, спорт", en: "Kids' shoes, school, play, sports" },
                archSupport: { mk: "Деликатна", en: "Gentle", levelPercent: 50, badgeClass: "compare-badge--gentle" },
                shockAbsorption: { stars: "★★★☆☆", score: "3/5", mk: "Средна (3/5)", en: "Medium (3/5)" },
                thickness: { mk: "3–4 mm", en: "3–4 mm" },
                keyFeature: { mk: "Анатомски обликувана за правилен развој", en: "Anatomically shaped for healthy growth" },
                footwear: { mk: "Детски патики, училишни чевли, лесни чизми", en: "Kids' sneakers, school shoes, light boots" },
                odorControl: { mk: "Благ антибактериски слој", en: "Gentle antibacterial layer" },
                care: { mk: "Влажна крпа, сушење на собна температура", en: "Wipe with damp cloth, dry at room temperature" },
                fatigue: { mk: "Поддржува правилен раст на стапалото", en: "Supports healthy foot development" }
            }
        },
    };

    const SPEC_DEFINITIONS = [
        { key: 'material', label: { mk: 'Материјал и Состав', en: 'Material & Composition' } },
        { key: 'purpose', label: { mk: 'Главна намена', en: 'Primary Use' } },
        { key: 'archSupport', label: { mk: 'Поддршка за свод', en: 'Arch Support' }, type: 'arch' },
        { key: 'shockAbsorption', label: { mk: 'Апсорпција на шок', en: 'Shock Absorption' }, type: 'stars' },
        { key: 'thickness', label: { mk: 'Дебелина', en: 'Thickness' } },
        { key: 'keyFeature', label: { mk: 'Клучна одлика', en: 'Key Advantage' } },
        { key: 'footwear', label: { mk: 'Препорачани обувки', en: 'Recommended Footwear' } },
        { key: 'odorControl', label: { mk: 'Заштита од мириси', en: 'Odor & Sweat Protection' } },
        { key: 'care', label: { mk: 'Одржување и миење', en: 'Care & Cleaning' } },
        { key: 'fatigue', label: { mk: 'Редукција на замор', en: 'Fatigue Benefit' } }
    ];

    const getLang = () => document.documentElement.lang === 'en' ? 'en' : 'mk';

    const renderSideBySideTable = () => {
        const lang = getLang();
        const p1Id = compareSelect1.value;
        const p2Id = compareSelect2.value;
        const p1 = COMPARE_PRODUCTS[p1Id] || COMPARE_PRODUCTS.sportski;
        const p2 = COMPARE_PRODUCTS[p2Id] || COMPARE_PRODUCTS.kozhni;

        const showDiffOnly = compareDiffOnlyToggle ? compareDiffOnlyToggle.checked : false;
        let totalDiffs = 0;

        let html = '';

        // Product Header Grid
        html += `
            <div class="compare-product-header-grid">
                <div class="compare-header-label-cell">
                    <span>${lang === 'en' ? 'SPECIFICATIONS' : 'СПЕЦИФИКАЦИИ'}</span>
                </div>
                <div class="compare-product-card-head">
                    <img src="${p1.image}" alt="${p1.name[lang]}" class="compare-phead-img">
                    <div class="compare-phead-info">
                        <h4 class="compare-phead-title">${p1.name[lang]}</h4>
                        <span class="compare-phead-price">${p1.price}</span>
                        <a href="${p1.link}" class="compare-phead-link">${lang === 'en' ? 'View Details' : 'Погледни модел'}</a>
                    </div>
                </div>
                <div class="compare-product-card-head">
                    <img src="${p2.image}" alt="${p2.name[lang]}" class="compare-phead-img">
                    <div class="compare-phead-info">
                        <h4 class="compare-phead-title">${p2.name[lang]}</h4>
                        <span class="compare-phead-price">${p2.price}</span>
                        <a href="${p2.link}" class="compare-phead-link">${lang === 'en' ? 'View Details' : 'Погледни модел'}</a>
                    </div>
                </div>
            </div>
        `;

        // Spec Rows
        SPEC_DEFINITIONS.forEach(specDef => {
            const val1Obj = p1.specs[specDef.key];
            const val2Obj = p2.specs[specDef.key];

            const str1 = val1Obj ? (val1Obj[lang] || val1Obj.mk || '') : '';
            const str2 = val2Obj ? (val2Obj[lang] || val2Obj.mk || '') : '';

            const isDifferent = str1 !== str2;
            if (isDifferent) totalDiffs++;

            const hiddenClass = (showDiffOnly && !isDifferent) ? 'is-hidden-diff' : '';
            const diffClass = isDifferent ? 'is-different' : '';

            let content1Html = '';
            let content2Html = '';

            if (specDef.type === 'arch') {
                content1Html = `
                    <div class="compare-meter-container">
                        <div class="compare-meter-header">
                            <span class="compare-badge ${val1Obj.badgeClass}">${val1Obj[lang]}</span>
                        </div>
                        <div class="compare-meter-bg">
                            <div class="compare-meter-fill" style="width: ${val1Obj.levelPercent}%"></div>
                        </div>
                    </div>
                `;
                content2Html = `
                    <div class="compare-meter-container">
                        <div class="compare-meter-header">
                            <span class="compare-badge ${val2Obj.badgeClass}">${val2Obj[lang]}</span>
                        </div>
                        <div class="compare-meter-bg">
                            <div class="compare-meter-fill" style="width: ${val2Obj.levelPercent}%"></div>
                        </div>
                    </div>
                `;
            } else if (specDef.type === 'stars') {
                content1Html = `
                    <div>
                        <span class="compare-stars">${val1Obj.stars}</span>
                        <strong style="margin-left: 6px; font-size: 13px;">${val1Obj.score}</strong>
                    </div>
                `;
                content2Html = `
                    <div>
                        <span class="compare-stars">${val2Obj.stars}</span>
                        <strong style="margin-left: 6px; font-size: 13px;">${val2Obj.score}</strong>
                    </div>
                `;
            } else {
                content1Html = `<div class="compare-spec-val">${str1}</div>`;
                content2Html = `<div class="compare-spec-val">${str2}</div>`;
            }

            html += `
                <div class="compare-spec-row ${diffClass} ${hiddenClass}">
                    <div class="compare-spec-label">
                        <span>${specDef.label[lang]}</span>
                        ${isDifferent ? `<span class="compare-diff-tag">${lang === 'en' ? 'Difference' : 'Различно'}</span>` : ''}
                    </div>
                    <div>${content1Html}</div>
                    <div>${content2Html}</div>
                </div>
            `;
        });

        compareInteractiveContainer.innerHTML = html;

        if (compareDiffCountBadge) {
            compareDiffCountBadge.textContent = lang === 'en'
                ? `Differences: ${totalDiffs}`
                : `Разлики: ${totalDiffs}`;
        }
    };

    // Event Listeners
    compareSelect1.addEventListener('change', () => {
        if (compareSelect1.value === compareSelect2.value) {
            const options = Array.from(compareSelect2.options).map(o => o.value);
            const other = options.find(val => val !== compareSelect1.value);
            if (other) compareSelect2.value = other;
        }
        renderSideBySideTable();
    });

    compareSelect2.addEventListener('change', () => {
        if (compareSelect1.value === compareSelect2.value) {
            const options = Array.from(compareSelect1.options).map(o => o.value);
            const other = options.find(val => val !== compareSelect2.value);
            if (other) compareSelect1.value = other;
        }
        renderSideBySideTable();
    });

    if (compareSwapBtn) {
        compareSwapBtn.addEventListener('click', () => {
            const temp = compareSelect1.value;
            compareSelect1.value = compareSelect2.value;
            compareSelect2.value = temp;

            if (typeof gsap !== 'undefined') {
                gsap.fromTo(compareInteractiveContainer,
                    { opacity: 0.4, scale: 0.98 },
                    { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
                );
            }
            renderSideBySideTable();
        });
    }

    if (compareDiffOnlyToggle) {
        compareDiffOnlyToggle.addEventListener('change', renderSideBySideTable);
    }

    // Preset Chips
    presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const p1 = chip.getAttribute('data-p1');
            const p2 = chip.getAttribute('data-p2');
            if (p1 && p2 && COMPARE_PRODUCTS[p1] && COMPARE_PRODUCTS[p2]) {
                compareSelect1.value = p1;
                compareSelect2.value = p2;
                renderSideBySideTable();

                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(compareInteractiveContainer,
                        { opacity: 0.3, y: 10 },
                        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
                    );
                }
            }
        });
    });

    // View Tabs Switcher (Interactive vs Overview)
    if (compareTabInteractive && compareTabOverview && compareInteractiveView && compareOverviewView) {
        compareTabInteractive.addEventListener('click', () => {
            compareTabInteractive.classList.add('is-active');
            compareTabInteractive.setAttribute('aria-selected', 'true');
            compareTabOverview.classList.remove('is-active');
            compareTabOverview.setAttribute('aria-selected', 'false');

            compareInteractiveView.style.display = 'block';
            compareOverviewView.style.display = 'none';
            // Точка 2: врати padding на картата за интерактивниот таб
            const cardEl = compareOverviewView.closest('.compare-models__card');
            if (cardEl) cardEl.classList.remove('compare--overview');
        });

        compareTabOverview.addEventListener('click', () => {
            compareTabOverview.classList.add('is-active');
            compareTabOverview.setAttribute('aria-selected', 'true');
            compareTabInteractive.classList.remove('is-active');
            compareTabInteractive.setAttribute('aria-selected', 'false');

            compareInteractiveView.style.display = 'none';
            compareOverviewView.style.display = 'block';
            // Точка 2: табелата е flush со картата (без заостанат padding)
            const cardEl = compareOverviewView.closest('.compare-models__card');
            if (cardEl) cardEl.classList.add('compare--overview');
            // Точка 10: пресметај ги ширините на колоните и sticky slider-от кога табелата е видлива
            syncCompareHeadWidths();
            syncCompareStrip();
        });
    }

    // ==== Точка 2: Прегледна табела „Сите 20 модели (Табела)“ ====
    // Динамички се рендерира од COMPARE_PRODUCTS (поединечни модели)
    const renderOverviewTable = () => {
        if (!compareOverviewView) return;
        const lang = getLang();
        const models = Object.values(COMPARE_PRODUCTS);
        const rows = [
            { key: 'material', label: { mk: 'Материјали', en: 'Materials' } },
            { key: 'purpose', label: { mk: 'Главна намена', en: 'Primary Use' } },
            { key: 'archSupport', label: { mk: 'Поддршка за свод', en: 'Arch Support' }, type: 'arch' },
            { key: 'shockAbsorption', label: { mk: 'Апсорпција на шок', en: 'Shock Absorption' }, type: 'stars' },
            { key: 'thickness', label: { mk: 'Дебелина', en: 'Thickness' } },
            { key: 'keyFeature', label: { mk: 'Клучна одлика', en: 'Key Advantage' } },
            { key: 'footwear', label: { mk: 'Препорачани обувки', en: 'Recommended Footwear' } }
        ];

        // Заглавие (thead) — се користи во sticky head-табелата
        let theadHtml = '<thead><tr><th class="compare-table__feature-col">' + (lang === 'en' ? 'Model / Feature' : 'Модел / Особини') + '</th>';
        models.forEach((m) => {
            theadHtml += '<th><div class="compare-th-item">' +
                '<img src="' + m.image + '" alt="' + m.name[lang] + '" class="compare-th-img" width="60" height="60" loading="lazy" decoding="async">' +
                '<strong>' + m.name[lang] + '</strong>' +
                '<span class="compare-th-price">' + m.price + '</span></div></th>';
        });
        theadHtml += '</tr></thead>';

        // Точка 10: sticky заглавие — посебна табела што се лепи под навигацијата (top:90)
        let html = '<div class="compare-table__sticky-head" aria-hidden="true"><table class="compare-table compare-table--head">' + theadHtml + '</table></div>';

        // Телото — хоризонтално скрола ВО СВОЈОТ контејнер (не на ниво на страница)
        html += '<div class="compare-models__table-scroll"><table class="compare-table compare-table--body"><tbody>';

        rows.forEach((r) => {
            html += '<tr><td class="compare-table__label">' + r.label[lang] + '</td>';
            models.forEach((m) => {
                const spec = m.specs[r.key];
                if (r.type === 'arch') {
                    html += '<td><span class="compare-badge ' + spec.badgeClass + '">' + spec[lang] + '</span></td>';
                } else if (r.type === 'stars') {
                    html += '<td><span class="compare-stars">' + spec.stars + '</span></td>';
                } else {
                    html += '<td>' + spec[lang] + '</td>';
                }
            });
            html += '</tr>';
        });

        html += '<tr><td class="compare-table__label">' + (lang === 'en' ? 'Price' : 'Цена') + '</td>';
        models.forEach((m) => { html += '<td>' + m.price + '</td>'; });
        html += '</tr>';

        html += '<tr><td class="compare-table__label">' + (lang === 'en' ? 'Details' : 'Детали') + '</td>';
        models.forEach((m) => { html += '<td><a href="' + m.link + '" class="compare-link-btn">' + (lang === 'en' ? 'View Model' : 'Види модел') + '</a></td>'; });
        html += '</tr>';

        html += '</tbody></table></div>';
        html += '<div class="compare-sticky-scroll" aria-hidden="true"><div class="compare-sticky-scroll__spacer"></div></div>';
        compareOverviewView.innerHTML = html;

        // Точка 10: синхронизација на sticky заглавието + слајдерот со хоризонталниот скрол на телото
        const bodyScroller = compareOverviewView.querySelector('.compare-models__table-scroll');
        const headEl = compareOverviewView.querySelector('.compare-table__sticky-head');
        const strip = compareOverviewView.querySelector('.compare-sticky-scroll');
        if (bodyScroller && headEl) {
            // Изедначи ги ширините на колоните на head-табелата со тие на телото
            syncCompareHeadWidths();
            // body → head (1:1) и body → strip (сооднос)
            bodyScroller.addEventListener('scroll', () => {
                if (Math.abs(headEl.scrollLeft - bodyScroller.scrollLeft) > 0.5) headEl.scrollLeft = bodyScroller.scrollLeft;
                const extent = bodyScroller.scrollWidth - bodyScroller.clientWidth;
                const sm = strip ? strip.scrollWidth - strip.clientWidth : 0;
                if (strip && extent > 0 && sm > 0) {
                    const target = (bodyScroller.scrollLeft / extent) * sm;
                    if (Math.abs(strip.scrollLeft - target) > 0.5) strip.scrollLeft = target;
                }
            }, { passive: true });
            // strip → body (влечење на слајдерот ја движи табелата)
            if (strip) {
                strip.addEventListener('scroll', () => {
                    const extent = bodyScroller.scrollWidth - bodyScroller.clientWidth;
                    const sm = strip.scrollWidth - strip.clientWidth;
                    if (!(extent > 0 && sm > 0)) return;
                    const target = (strip.scrollLeft / sm) * extent;
                    if (Math.abs(bodyScroller.scrollLeft - target) > 0.5) bodyScroller.scrollLeft = target;
                });
            }
            // head → body (ако некој скрола над заглавието со shift+wheel)
            headEl.addEventListener('scroll', () => {
                if (Math.abs(bodyScroller.scrollLeft - headEl.scrollLeft) > 0.5) bodyScroller.scrollLeft = headEl.scrollLeft;
            });
        }
        syncCompareStrip();
    };

    // Точка 10: синхронизација на sticky slider-от со хоризонталниот скрол на телото на табелата
    const syncCompareStrip = () => {
        const strip = compareOverviewView?.querySelector('.compare-sticky-scroll');
        if (!strip) return;
        // Слајдерот се појавува само кога табелата го исполнува екранот (header е залепен),
        // а исчезнува кога се скрола нагоре кон другите категории
        // (100 = толерантна граница; точната 90 може да откаже при фракциони позиции)
        const show = compareOverviewView.getBoundingClientRect().top <= 100;
        strip.style.opacity = show ? '1' : '0';
        strip.style.pointerEvents = show ? 'auto' : 'none';
        const bodyScroller = compareOverviewView.querySelector('.compare-models__table-scroll');
        const spacer = strip.querySelector('.compare-sticky-scroll__spacer');
        const extent = bodyScroller ? Math.max(bodyScroller.scrollWidth - bodyScroller.clientWidth, 0) : 0;
        spacer.style.width = (extent + strip.clientWidth + 2) + 'px';
        const sm = strip.scrollWidth - strip.clientWidth;
        if (bodyScroller && extent > 0 && sm > 0) {
            const target = (bodyScroller.scrollLeft / extent) * sm;
            if (Math.abs(strip.scrollLeft - target) > 0.5) strip.scrollLeft = target;
        }
    };
    window.addEventListener('scroll', syncCompareStrip, { passive: true });
    window.addEventListener('resize', syncCompareStrip);

    // Точка 10: изедначување на ширините на колоните на sticky заглавието со телото
    // (мора да се повика кога табелата е ВИДЛИВА — при скриена view мерењата се 0)
    const syncCompareHeadWidths = () => {
        const headEl = compareOverviewView?.querySelector('.compare-table__sticky-head');
        const bodyScroller = compareOverviewView?.querySelector('.compare-models__table-scroll');
        if (!headEl || !bodyScroller) return;
        const headTable = headEl.querySelector('table');
        const bodyTable = bodyScroller.querySelector('table');
        if (!headTable || !bodyTable || !bodyTable.rows.length) return;
        const cells = Array.from(bodyTable.rows[0].cells);
        cells.forEach((c, i) => {
            const hc = headTable.rows[0].cells[i];
            if (hc) {
                const w = c.getBoundingClientRect().width;
                hc.style.minWidth = w + 'px';
                hc.style.width = w + 'px';
                hc.style.maxWidth = w + 'px';
            }
        });
    };

    // Listen for language changes across the app (dropdown-switcher safe)
    if (window.MonetaOnLangChange) {
        window.MonetaOnLangChange(() => setTimeout(() => { renderSideBySideTable(); renderOverviewTable(); }, 50));
    }

    // Initial render
    renderSideBySideTable();
    renderOverviewTable();
})();

// ========================================
// LIVE NAVBAR SEARCH SYSTEM
// ========================================
// Шаблон за search-маската — автоматски се креира на под-страниците каде што ја нема
const SEARCH_MODAL_HTML = `
    <div class="search-modal" id="searchModal" aria-hidden="true">
        <div class="search-modal__backdrop" id="searchBackdrop"></div>
        <div class="search-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="searchInput">
            <div class="search-modal__header">
                <div class="search-modal__input-wrapper">
                    <svg class="search-modal__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="searchInput" class="search-modal__input" placeholder="Пребарај модели на влошки, броеви или совети..." autocomplete="off" spellcheck="false" data-mk-placeholder="Пребарај модели на влошки, броеви или совети..." data-en-placeholder="Search insole models, sizes, or advice...">
                </div>
                <button type="button" class="search-modal__close" id="searchClose" aria-label="Затвори" title="Затвори (ESC)"><kbd>ESC</kbd></button>
            </div>
            <div class="search-modal__quick-tags">
                <span class="quick-tags__title" data-mk="Брзи категории:" data-en="Quick categories:">Брзи категории:</span>
                <button type="button" class="search-tag" data-query="спортски" data-mk="Спортски" data-en="Sports">Спортски</button>
                <button type="button" class="search-tag" data-query="кожни" data-mk="Кожни" data-en="Leather">Кожни</button>
                <button type="button" class="search-tag" data-query="летни" data-mk="Летни" data-en="Summer">Летни</button>
                <button type="button" class="search-tag" data-query="зимски" data-mk="Зимски" data-en="Winter">Зимски</button>
                <button type="button" class="search-tag" data-query="hunter" data-mk="HUNTER" data-en="HUNTER">HUNTER</button>
                <button type="button" class="search-tag" data-query="детски" data-mk="Детски" data-en="Kids">Детски</button>
                <button type="button" class="search-tag" data-query="големина" data-mk="Водич за броеви" data-en="Size guide">Водич за броеви</button>
            </div>
            <div class="search-modal__body" id="searchResultsContainer"></div>
            <div class="search-modal__footer">
                <div class="search-modal__shortcuts">
                    <span><kbd>↑</kbd><kbd>↓</kbd> <span data-mk="Навигација" data-en="Navigate">Навигација</span></span>
                    <span><kbd>↵</kbd> <span data-mk="Отвори" data-en="Open">Отвори</span></span>
                    <span><kbd>ESC</kbd> <span data-mk="Затвори" data-en="Close">Затвори</span></span>
                </div>
                <div class="search-modal__brand" data-mk="МОНЕТА Пребарување" data-en="MONETA Search">МОНЕТА Пребарување</div>
            </div>
        </div>
    </div>`;

(function initNavbarSearch() {
    const searchTrigger = document.getElementById('searchTrigger');
    if (!searchTrigger) return;

    // Базна патека: под-страниците (modeli/) се еден чекор подлабоко
    const IS_MODELI = /\/modeli\//.test(window.location.pathname);
    const BASE = IS_MODELI ? '../' : './';
    const resolveUrl = (p) => {
        if (!p) return '#';
        if (/^(#|\.\.\/|https?:|\/)/.test(p)) return p;
        return BASE + p.replace(/^\.\//, '');
    };
    const resolveImg = (p) => {
        if (!p) return '';
        if (/^(\.\.\/|https?:|\/)/.test(p)) return p;
        return BASE + p.replace(/^\.\//, '');
    };

    // Автоматско креирање на search-маската ако ја нема (под-страници)
    if (!document.getElementById('searchModal')) {
        const holder = document.createElement('div');
        holder.innerHTML = SEARCH_MODAL_HTML.trim();
        document.body.appendChild(holder.firstElementChild);
    }
    const searchModal = document.getElementById('searchModal');
    const searchBackdrop = document.getElementById('searchBackdrop');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const quickTags = document.querySelectorAll('.search-tag');

    if (!searchModal || !searchInput || !searchResultsContainer) return;

    // Search Database
    const searchItems = [
        {
            type: 'product',
            titleMk: 'Спортски анатомски влошки',
            titleEn: 'Sports Anatomical Insoles',
            descMk: 'Гел-зони за максимална апсорпција на удари при трчање и активност',
            descEn: 'Gel zones for maximum shock absorption during running & fitness',
            url: './index.html#kategorii',
            image: './images/cards/Sportski.webp',
            badgeMk: 'Гел-зони',
            badgeEn: 'Gel zones',
            keywords: 'спортски sport гел гел-зони омекнување патики трчање фитнес 35-46 gel running fitness sneakers'
        },
        {
            type: 'product',
            titleMk: 'Кожни анатомски влошки',
            titleEn: 'Leather Anatomical Insoles',
            descMk: 'Премиум природна кожа за елегантни и деловни обувки со суптилен амортизер',
            descEn: 'Premium natural leather for dress shoes with subtle heel cushioning',
            url: './index.html#kategorii',
            image: './images/cards/Kozni.webp',
            badgeMk: 'Природна кожа',
            badgeEn: 'Natural leather',
            keywords: 'кожни leather природна кожа деловни чевли елегантни омекнувачки dress shoes business elegant'
        },
        {
            type: 'product',
            titleMk: 'Летни дишечки влошки',
            titleEn: 'Summer Breathable Insoles',
            descMk: 'Прозрачна 3D мрежа против потење и непријатни мириси при носење боси',
            descEn: 'Breathable 3D mesh prevents sweat and odor for bare-foot summer comfort',
            url: './index.html#kategorii',
            image: './images/cards/Letni.webp',
            badgeMk: 'Дишечка мрежа',
            badgeEn: 'Breathable mesh',
            keywords: 'летни summer дишечки прозрачни потење мирис отворени обувки боси mesh barefoot odor sweat'
        },
        {
            type: 'product',
            titleMk: 'Зимски термо влошки',
            titleEn: 'Winter Thermal Insoles',
            descMk: 'Природна волна со слој од алуминиумска фолија за заштита од најсилен студ',
            descEn: 'Natural wool with aluminium foil layer for insulation in harsh winter conditions',
            url: './index.html#kategorii',
            image: './images/cards/thermo_alu.webp',
            badgeMk: 'Алу-изолација',
            badgeEn: 'Alu insulation',
            keywords: 'зимски winter термо волна алуминиум топлина волна чизми снег студ wool alu cold boots'
        },
        {
            type: 'product',
            titleMk: 'HUNTER заштитни влошки',
            titleEn: 'HUNTER Heavy Duty Insoles',
            descMk: 'Засилена конструкција за работни обувки, лов, риболов и тешки терени',
            descEn: 'Reinforced design for work boots, hunting, fishing, and tough terrains',
            url: './index.html#kategorii',
            image: './images/cards/hunter_vloski.webp',
            badgeMk: 'Тешки услови',
            badgeEn: 'Heavy duty',
            keywords: 'hunter работни заштитни тешки обувки издржливи лов риболов boots work heavy duty hunting'
        },
        {
            type: 'product',
            titleMk: 'Детски анатомски влошки',
            titleEn: "Children's Anatomical Insoles",
            descMk: 'Анатомска потпора на сводот за правилен раст и развој на детското стапало',
            descEn: 'Arch support for healthy foot growth and postural development in kids',
            url: './index.html#kategorii',
            image: './images/cards/detski.webp',
            badgeMk: 'Правилен развој',
            badgeEn: 'Healthy growth',
            keywords: 'детски kids деца развој стапало 28-34 училиште игра children school growth'
        },
        // ===== СИТЕ 20 МОДЕЛИ (modeli/) =====
        {
            type: 'product',
            titleMk: 'MEMOSOLE',
            titleEn: 'MEMOSOLE',
            descMk: 'Влошки со мемориска пена што се прилагодува на стапалото и латекс со активен јаглен за свежина.',
            descEn: 'Memory foam insoles that adapt to your foot, with latex and activated charcoal for freshness.',
            url: './modeli/memosole.html',
            image: './images/cards/memosole.webp',
            badgeMk: 'Спортски',
            badgeEn: 'Sports',
            keywords: 'memosole мемосол мемориска пена memory foam латекс спортски патики трчање 16012'
        },
        {
            type: 'product',
            titleMk: 'Active Gel',
            titleEn: 'Active Gel',
            descMk: 'Спортска влошка од активен гел и мек плиш за дополнителна амортизација, се сече по големина.',
            descEn: 'Sports insole made of active gel and soft plush for extra cushioning, cut-to-size.',
            url: './modeli/active-gel.html',
            image: './images/cards/active-gel.webp',
            badgeMk: 'Спортски',
            badgeEn: 'Sports',
            keywords: 'active gel активен гел гел плиш спортски сечење амортизација 281111'
        },
        {
            type: 'product',
            titleMk: 'AnatomiX',
            titleEn: 'AnatomiX',
            descMk: 'Премиум спортска влошка од серијата RUN & HIKING со рециклирана антибактериска пена.',
            descEn: 'Premium sports insole from the RUN & HIKING line with recycled antibacterial foam.',
            url: './modeli/anatomiX.html',
            image: './images/cards/anatomiX.webp',
            badgeMk: 'Спортски',
            badgeEn: 'Sports',
            keywords: 'anatomix анатомикс run hiking рециклирана антибактериска пена спортски трчање планинарење 20002'
        },
        {
            type: 'product',
            titleMk: 'Sport Style',
            titleEn: 'Sport Style',
            descMk: 'Анатомска влошка од 100% памучен фротир со латекс пена и пластичен носач за стабилност.',
            descEn: 'Anatomical insole made of 100% cotton terry with latex foam and a plastic arch support.',
            url: './modeli/sport-style.html',
            image: './images/cards/sport-style.webp',
            badgeMk: 'Спортски',
            badgeEn: 'Sports',
            keywords: 'sport style спорт стил памучен фротир латекс пластичен носач карбосан 221069'
        },
        {
            type: 'product',
            titleMk: 'Sportex',
            titleEn: 'Sportex',
            descMk: 'Спортска влошка со воздушно перниче во петата и освежувачки ефект на алое вера.',
            descEn: 'Sports insole with an air cushion in the heel and a fresh aloe vera effect.',
            url: './modeli/sportex.html',
            image: './images/cards/sportex.webp',
            badgeMk: 'Спортски',
            badgeEn: 'Sports',
            keywords: 'sportex спортекс воздушно перниче алое вера антибактериска карбосан 951010'
        },
        {
            type: 'product',
            titleMk: 'X-TREME',
            titleEn: 'X-TREME',
            descMk: 'Премиум 4-слојна спортска влошка со WAP материјал за outdoor активности и планинарење.',
            descEn: 'Premium 4-layer sports insole with WAP material for outdoor activities and hiking.',
            url: './modeli/x-treme.html',
            image: './images/cards/x-treme.webp',
            badgeMk: 'Спортски',
            badgeEn: 'Sports',
            keywords: 'x-treme x treme xтрем wap спортска outdoor планинарење термо филц карбосан 21005'
        },
        {
            type: 'product',
            titleMk: 'Heel Pad',
            titleEn: 'Heel Pad',
            descMk: 'Кожна влошка за пета со карбосан перниче и самолеплив слој за стабилно прилегање.',
            descEn: 'Leather heel pad with a carbosan cushion and self-adhesive layer for a stable fit.',
            url: './modeli/heel-pad.html',
            image: './images/cards/heel-pad.webp',
            badgeMk: 'Кожни',
            badgeEn: 'Leather',
            keywords: 'heel pad хил пад влошка за пета кожа карбосан самолеплива удобност 971031'
        },
        {
            type: 'product',
            titleMk: 'Heel Pad FIX',
            titleEn: 'Heel Pad FIX',
            descMk: 'Кожна влошка за пета со карбосан перниче и зајакнат самолеплив слој.',
            descEn: 'Leather heel pad with a carbosan cushion and reinforced self-adhesive layer.',
            url: './modeli/heel-pad-fix.html',
            image: './images/cards/heel-pad-fix.webp',
            badgeMk: 'Кожни',
            badgeEn: 'Leather',
            keywords: 'heel pad fix хил пад фикс пета кожа карбосан самолеплива зајакнат 291117'
        },
        {
            type: 'product',
            titleMk: 'Heel Pad Grip',
            titleEn: 'Heel Pad Grip',
            descMk: 'Самолепливо кожно перниче за пета за подобро прилегање и стабилност.',
            descEn: 'Self-adhesive leather heel pad for a better fit and stability.',
            url: './modeli/heel-pad-grip.html',
            image: './images/cards/heel-pad-grip.webp',
            badgeMk: 'Кожни',
            badgeEn: 'Leather',
            keywords: 'heel pad grip хил пад грип пета кожа прилегање универзална самолеплива 951013'
        },
        {
            type: 'product',
            titleMk: 'Topas',
            titleEn: 'Topas',
            descMk: '3/4 анатомска кожна влошка за елегантни и деловни обувки со пластичен носач.',
            descEn: '3/4 anatomical leather insole for dress and business shoes with a plastic arch support.',
            url: './modeli/topas.html',
            image: './images/cards/topas.webp',
            badgeMk: 'Кожни',
            badgeEn: 'Leather',
            keywords: 'topas топас 3/4 кратка кожна елегантни чевли мокасини носач 281044'
        },
        {
            type: 'product',
            titleMk: 'Soft Gel',
            titleEn: 'Soft Gel',
            descMk: 'Премиум кожна влошка со гел перничиња, латекс со активен јаглен и пластичен носач.',
            descEn: 'Premium leather insole with gel cushions, latex with activated charcoal and plastic support.',
            url: './modeli/soft-gel.html',
            image: './images/cards/soft-gel.webp',
            badgeMk: 'Кожни',
            badgeEn: 'Leather',
            keywords: 'soft gel софт гел кожна гел перничиња премиум латекс носач 281108'
        },
        {
            type: 'product',
            titleMk: 'Vital',
            titleEn: 'Vital',
            descMk: 'Анатомска кожна влошка од перфорирана кожа со латекс и карбосан перниче.',
            descEn: 'Anatomical leather insole made of perforated leather with latex and a carbosan heel pad.',
            url: './modeli/vital.html',
            image: './images/cards/vital.webp',
            badgeMk: 'Кожни',
            badgeEn: 'Leather',
            keywords: 'vital витал кожна перфорирана латекс карбосан анатомска 271104'
        },
        {
            type: 'product',
            titleMk: 'Relax',
            titleEn: 'Relax',
            descMk: 'Анатомска кожна влошка од перфорирана јагнешка кожа со латекс и пластичен носач.',
            descEn: 'Anatomical leather insole made of perforated lambskin with latex and a plastic arch support.',
            url: './modeli/relax.html',
            image: './images/cards/relax.webp',
            badgeMk: 'Кожни',
            badgeEn: 'Leather',
            keywords: 'relax релакс кожна јагнешка кожа перфорирана латекс носач 251090'
        },
        {
            type: 'product',
            titleMk: 'Simona',
            titleEn: 'Simona',
            descMk: 'Летни памучни влошки со латекс со активен јаглен и ароматична карбосан пена.',
            descEn: 'Summer cotton insoles with latex and activated charcoal, plus aromatic carbosan foam.',
            url: './modeli/simona.html',
            image: './images/cards/simona.webp',
            badgeMk: 'Летни',
            badgeEn: 'Summer',
            keywords: 'simona симона летни памучни активен јаглен ароматична свежина 981034'
        },
        {
            type: 'product',
            titleMk: 'Carbon',
            titleEn: 'Carbon',
            descMk: 'Летни влошки со активен јаглен, анти-габични и перфорирани за вентилација.',
            descEn: 'Summer insoles with activated charcoal, anti-fungal and perforated for ventilation.',
            url: './modeli/carbon.html',
            image: './images/cards/carbon.webp',
            badgeMk: 'Летни',
            badgeEn: 'Summer',
            keywords: 'carbon карбон летни активен јаглен анти-габични перфорирани универзална 201063'
        },
        {
            type: 'product',
            titleMk: 'Thermo Alu',
            titleEn: 'Thermo Alu',
            descMk: 'Зимска влошка од 100% волна со латекс пена и алуминиумска фолија за топлинска изолација.',
            descEn: 'Winter insole made of 100% wool with latex foam and aluminium foil for thermal insulation.',
            url: './modeli/thermo-alu.html',
            image: './images/cards/thermo_alu.webp',
            badgeMk: 'Зимски',
            badgeEn: 'Winter',
            keywords: 'thermo alu термо алу зимска волна алуминиум топлина чизми студ 201062'
        },
        {
            type: 'product',
            titleMk: 'Hunter Outdoor',
            titleEn: 'Hunter Outdoor',
            descMk: 'Анатомска влошка со Viscolat мемориска пена, PES филц и алуминиумска фолија за пролет/есен.',
            descEn: 'Anatomical insole with Viscolat memory foam, PES felt and aluminium foil for spring/autumn.',
            url: './modeli/hunter-outdoor.html',
            image: './images/cards/hunter-outdoor.webp',
            badgeMk: 'HUNTER',
            badgeEn: 'HUNTER',
            keywords: 'hunter outdoor хантер аутдор viscolat мемориска пена филц алуминиум лов планинарење 140402'
        },
        {
            type: 'product',
            titleMk: 'Hunter Flex',
            titleEn: 'Hunter Flex',
            descMk: 'Термо влошка со Cambrella ткаенина, алуминиумска фолија и филц за зимски активности.',
            descEn: 'Thermal insole with Cambrella fabric, aluminium foil and felt for winter activities.',
            url: './modeli/hunter-flex.html',
            image: './images/cards/hunter-flex.webp',
            badgeMk: 'HUNTER',
            badgeEn: 'HUNTER',
            keywords: 'hunter flex хантер флекс термо cambrella алуминиум филц зимски лов риболов 140406'
        },
        {
            type: 'product',
            titleMk: 'Hunter CAMO',
            titleEn: 'Hunter CAMO',
            descMk: 'Камуфлажна влошка со перфорирана PES ткаенина и латекс пена со активен јаглен.',
            descEn: 'Camouflage insole with perforated PES fabric and latex foam with activated charcoal.',
            url: './modeli/hunter-camo.html',
            image: './images/cards/hunter-camo.webp',
            badgeMk: 'HUNTER',
            badgeEn: 'HUNTER',
            keywords: 'hunter camo хантер камо камуфлажна pes ткаенина латекс активен јаглен лов 140405'
        },
        {
            type: 'product',
            titleMk: 'Duck',
            titleEn: 'Duck',
            descMk: 'Детски анатомски влошки од 100% памук со латекс, пластичен и карбосан калап за правилен развој.',
            descEn: 'Kids anatomical insoles made of 100% cotton with latex, plastic and carbosan mold for healthy growth.',
            url: './modeli/duck.html',
            image: './images/cards/duck.webp',
            badgeMk: 'Детски',
            badgeEn: 'Kids',
            keywords: 'duck дак детски памук латекс карбосан анатомски развој училиште 201068'
        },
        {
            type: 'info',
            titleMk: 'Водич за броеви и избор на модел',
            titleEn: 'Size Chart & Model Finder',
            descMk: 'Пресметајте го точниот број според должината на стапалото и видот обувки',
            descEn: 'Calculate exact size based on foot length in cm and shoe type',
            action: 'sizeModal',
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L3.3 9.3a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0l12 12z"/><line x1="14.5" y1="7.5" x2="12" y2="10"/><line x1="11.5" y1="10.5" x2="9" y2="13"/><line x1="8.5" y1="13.5" x2="6" y2="16"/></svg>',
            badgeMk: 'Калкулатор',
            badgeEn: 'Calculator',
            keywords: 'големина број одредување водич мерење калкулатор 35 36 37 38 39 40 41 42 43 44 45 46 size guide measure chart cm'
        },
        {
            type: 'info',
            titleMk: 'Скратување на влошки со ножици',
            titleEn: 'Trimming Insoles with Scissors',
            descMk: 'Инструкции како правилно да ги поткастрите спортските, летните и зимските влошки',
            descEn: 'Instructions on how to safely trim forefoot guides using standard scissors',
            url: '#faq',
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.47" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
            badgeMk: 'Совет / ЧПП',
            badgeEn: 'Tip / FAQ',
            keywords: 'скратување ножици прилагодување димензија исечи trim adjust scissors cut size'
        },
        {
            type: 'info',
            titleMk: 'Чистење и правилно одржување',
            titleEn: 'Cleaning and Care Guide',
            descMk: 'Совети за одржување на кожни, текстилни и гел влошки за максимална долготрајност',
            descEn: 'Maintenance tips for leather, textile, and gel insoles for maximum lifespan',
            url: '#faq',
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
            badgeMk: 'Одржување',
            badgeEn: 'Care',
            keywords: 'чистење одржување перење заштита сапун вода clean maintain care wash leather'
        },
        {
            type: 'info',
            titleMk: 'Анатомска потпора за рамни стапала & шип во пета',
            titleEn: 'Anatomical Support for Flat Feet & Heel Spurs',
            descMk: 'Превенција и олеснување на болки во петата, наддолжниот и попречниот свод',
            descEn: 'Prevention and relief for plantar fasciitis, arch fatigue, and flat feet',
            url: '#faq',
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
            badgeMk: 'Анатомска',
            badgeEn: 'Anatomical',
            keywords: 'рамни стапала анатомски свод шип во пета болка пета зглобови pes planus plantar fasciitis arch support heel spur pain'
        },
        {
            type: 'info',
            titleMk: 'Слој од активен јаглен против мириси',
            titleEn: 'Active Carbon Anti-Odor Layer',
            descMk: 'Ефикасно ја апсорбира влагата и ги неутрализира бактериите и мирисите од обувките',
            descEn: 'Absorbs moisture and neutralizes bacteria and foot odor inside footwear',
            url: '#faq',
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
            badgeMk: 'Активен јаглен',
            badgeEn: 'Active Carbon',
            keywords: 'активен јаглен мирис потење пот бактерии хигиена свежина active carbon odor sweat moisture'
        },
        {
            type: 'info',
            titleMk: 'Достава и плаќање при преземање',
            titleEn: 'Fast Delivery & Cash on Delivery',
            descMk: 'Експресна достава за 24-48 часа низ цела Македонија со плаќање на курирот',
            descEn: 'Express delivery in 24-48 hours across North Macedonia with Cash on Delivery',
            url: '#sledenje-pratka',
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
            badgeMk: 'Курир 24-48h',
            badgeEn: 'Courier 24-48h',
            keywords: 'достава плаќање карго брзина рокови дена македонија скопје битола охрид куманово delivery courier payment cod'
        },
        {
            type: 'info',
            titleMk: 'МОНЕТА® Технолошки Системи',
            titleEn: 'MONETA® Technological Systems',
            descMk: 'Пет иновативни анатомски технологии: Anatomic, Absorb, Memory, Ortho и Thermo',
            descEn: 'Five innovative anatomical technologies: Anatomic, Absorb, Memory, Ortho & Thermo',
            url: './sistem.html',
            icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EC1752" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
            badgeMk: 'МОНЕТА Систем',
            badgeEn: 'MONETA System',
            keywords: 'монета систем moneta sistem анатомски технологии anatomic absorb memory ortho thermo замор болка свод пета'
        }
    ];

    let focusedIndex = -1;

    // ==== Паметно пребарување: кирилица ↔ латиница + азбучен редослед ====
    const CYR_TO_LAT = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','ѓ':'gj','е':'e','ж':'z','з':'z','ѕ':'dz','и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m','н':'n','њ':'nj','о':'o','п':'p','р':'r','с':'s','т':'t','ќ':'k','у':'u','ф':'f','х':'h','ц':'c','ч':'c','џ':'dz','ш':'s',
        'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Ѓ':'Gj','Е':'E','Ж':'Z','З':'Z','Ѕ':'Dz','И':'I','Ј':'J','К':'K','Л':'L','Љ':'Lj','М':'M','Н':'N','Њ':'Nj','О':'O','П':'P','Р':'R','С':'S','Т':'T','Ќ':'K','У':'U','Ф':'F','Х':'H','Ц':'C','Ч':'C','Џ':'Dz','Ш':'S'
    };
    const transliterate = (s) => String(s || '').replace(/[\u0400-\u04FF]/g, (ch) => CYR_TO_LAT[ch] || ch);
    const searchNormalize = (s) => transliterate(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Подготви пребарувачка основа за секој резултат (оригинал + транслитерација)
    searchItems.forEach((item) => {
        const parts = [item.titleMk, item.titleEn, item.descMk, item.descEn, item.keywords || '', item.badgeMk || '', item.badgeEn || ''];
        item._search = searchNormalize(parts.join(' '));
    });

    function getCurrentLang() {
        return document.documentElement.lang === 'en' ? 'en' : 'mk';
    }

    function openSearch() {
        searchModal.classList.add('is-open');
        searchModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            searchInput.focus();
            renderResults(searchInput.value.trim());
        }, 50);
    }

    function closeSearch() {
        searchModal.classList.remove('is-open');
        searchModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        searchInput.value = '';
        focusedIndex = -1;
    }

    // Event Listeners for Open/Close
    searchTrigger.addEventListener('click', openSearch);
    if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);

    // Keyboard shortcuts: Cmd+K / Ctrl+K or /
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (searchModal.classList.contains('is-open')) {
                closeSearch();
            } else {
                openSearch();
            }
        } else if (e.key === 'Escape' && searchModal.classList.contains('is-open')) {
            closeSearch();
        } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !searchModal.classList.contains('is-open')) {
            e.preventDefault();
            openSearch();
        }
    });

    // Input event
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        focusedIndex = -1;
        renderResults(query.trim());
    });

    // Quick tag clicks
    quickTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.dataset.query;
            searchInput.value = query;
            searchInput.focus();
            renderResults(query);
        });
    });

    // Key navigation inside search body
    searchInput.addEventListener('keydown', (e) => {
        const items = searchResultsContainer.querySelectorAll('.search-result-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusedIndex = (focusedIndex + 1) % items.length;
            updateFocusedItem(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusedIndex = (focusedIndex - 1 + items.length) % items.length;
            updateFocusedItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && items[focusedIndex]) {
                items[focusedIndex].click();
            } else if (items[0]) {
                items[0].click();
            }
        }
    });

    function updateFocusedItem(items) {
        items.forEach((item, idx) => {
            if (idx === focusedIndex) {
                item.classList.add('is-focused');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('is-focused');
            }
        });
    }

    // Render Logic
    function renderResults(query) {
        const lang = getCurrentLang();
        const q = searchNormalize(query);

        let filtered = searchItems;
        if (q) {
            filtered = searchItems.filter(item => (item._search || '').includes(q));
        }

        if (filtered.length === 0) {
            searchResultsContainer.innerHTML = `
                <div class="search-empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    <h4>${lang === 'en' ? 'No results found' : 'Нема пронајдено резултати'}</h4>
                    <p>${lang === 'en' ? 'Try searching for "sports", "leather", "winter", or "size"' : 'Обидете се со "спортски", "кожни", "зимски" или "големина"'}</p>
                </div>
            `;
            return;
        }

        const products = filtered.filter(i => i.type === 'product');
        const infos = filtered.filter(i => i.type === 'info');

        // Азбучен редослед на производите (по јазикот на приказ)
        products.sort((a, b) => {
            const ta = lang === 'en' ? a.titleEn : a.titleMk;
            const tb = lang === 'en' ? b.titleEn : b.titleMk;
            return ta.localeCompare(tb, lang === 'en' ? 'en' : 'mk');
        });

        let html = '';

        if (products.length > 0) {
            html += `
                <div class="search-section">
                    <div class="search-section__header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        <span>${lang === 'en' ? 'Insole Models' : 'Модели на влошки'} (${products.length})</span>
                    </div>
                    <div class="search-results-list">
            `;

            products.forEach((item) => {
                const title = lang === 'en' ? item.titleEn : item.titleMk;
                const desc = lang === 'en' ? item.descEn : item.descMk;
                const badge = lang === 'en' ? item.badgeEn : item.badgeMk;

                html += `
                    <a href="${resolveUrl(item.url)}" class="search-result-item" data-search-link>
                        <div class="search-result-item__thumb">
                            <img src="${resolveImg(item.image)}" alt="${title}" loading="lazy">
                        </div>
                        <div class="search-result-item__info">
                            <div class="search-result-item__title">
                                <span>${title}</span>
                                <span class="search-result-item__badge">${badge}</span>
                            </div>
                            <div class="search-result-item__desc">${desc}</div>
                        </div>
                        <div class="search-result-item__arrow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </div>
                    </a>
                `;
            });

            html += `</div></div>`;
        }

        if (infos.length > 0) {
            html += `
                <div class="search-section">
                    <div class="search-section__header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <span>${lang === 'en' ? 'Guides & Information' : 'Информации и Совети'} (${infos.length})</span>
                    </div>
                    <div class="search-results-list">
            `;

            infos.forEach((item) => {
                const title = lang === 'en' ? item.titleEn : item.titleMk;
                const desc = lang === 'en' ? item.descEn : item.descMk;
                const badge = lang === 'en' ? item.badgeEn : item.badgeMk;
                const isAction = !!item.action;

                html += `
                    <a href="${resolveUrl(item.url)}" class="search-result-item" ${isAction ? `data-search-action="${item.action}"` : ''} data-search-link>
                        <div class="search-result-item__thumb" style="color: var(--pink);">
                            ${item.icon}
                        </div>
                        <div class="search-result-item__info">
                            <div class="search-result-item__title">
                                <span>${title}</span>
                                <span class="search-result-item__badge" style="background: rgba(32, 31, 38, 0.07); color: var(--ink);">${badge}</span>
                            </div>
                            <div class="search-result-item__desc">${desc}</div>
                        </div>
                        <div class="search-result-item__arrow">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </div>
                    </a>
                `;
            });

            html += `</div></div>`;
        }

        searchResultsContainer.innerHTML = html;

        // Attach click handlers to result links
        searchResultsContainer.querySelectorAll('.search-result-item').forEach(link => {
            link.addEventListener('click', (e) => {
                const action = link.dataset.searchAction;
                if (action === 'sizeModal') {
                    e.preventDefault();
                    closeSearch();
                    const sizeModalBtn = document.querySelector('[data-open-size-modal]');
                    if (sizeModalBtn) sizeModalBtn.click();
                } else {
                    closeSearch();
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const targetEl = document.querySelector(href);
                        if (targetEl) {
                            targetEl.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            });
        });
    }
})();

// ========================================
// HERO BACKGROUND LAZY LOAD CROSSFADE
// ========================================
(function initHeroCrossfade() {
    const heroBgImg = document.querySelector('.hero__bg-img');
    if (!heroBgImg) return;

    function revealHeroImage() {
        heroBgImg.classList.add('is-loaded');
    }

    if (heroBgImg.complete && heroBgImg.naturalWidth > 0) {
        revealHeroImage();
    } else {
        heroBgImg.addEventListener('load', revealHeroImage, { once: true });
        // Fallback safety timeout if load event fired earlier or fails
        setTimeout(revealHeroImage, 400);
    }
})();

// ========================================
// HERO CTA SMOOTH SCROLL & MOBILE CATEGORIES FOCUS
// ========================================
(function initCategoryScrollEffects() {
    // 1. Smooth scroll for anchor links (e.g. #kategorii)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 2. Sequential Magnetic Card Focus Tracking (Mobile Only; Desktop uses hover)
    function updateCategoryCardsSequentialFocus() {
        const categoryCards = document.querySelectorAll('.categories__grid .card');
        if (!categoryCards.length) return;
        // Поврзани производи на модел-страниците — без фокус/скок ефект на картичките
        if (document.querySelector('.model-layout')) return;

        const isMobile = window.innerWidth <= 860 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        // Clear auto-focus on desktop so hover handles animation cleanly
        if (!isMobile) {
            categoryCards.forEach((card) => {
                card.classList.remove('is-scroll-focused');
                card.classList.remove('is-active');
            });
            return;
        }

        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight * 0.50;

        let closestCard = null;
        let minDistance = Infinity;

        categoryCards.forEach((card) => {
            const img = card.querySelector('.card__image img');
            if (img) {
                img.style.removeProperty('--card-blur');
                img.style.filter = 'none';
            }

            const rect = card.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < viewportHeight) {
                const cardCenter = rect.top + (rect.height * 0.5);
                const dist = Math.abs(cardCenter - viewportCenter);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestCard = card;
                }
            }
        });

        categoryCards.forEach((card) => {
            if (card === closestCard && minDistance < viewportHeight * 0.42) {
                if (!card.classList.contains('is-scroll-focused')) {
                    card.classList.add('is-scroll-focused');
                    card.classList.add('is-active');
                }
            } else {
                card.classList.remove('is-scroll-focused');
                card.classList.remove('is-active');
            }
        });
    }

    let isTicking = false;
    function onScroll() {
        if (!isTicking) {
            requestAnimationFrame(() => {
                updateCategoryCardsSequentialFocus();
                isTicking = false;
            });
            isTicking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateCategoryCardsSequentialFocus, { passive: true });
    
    // Initial calculation on load
    setTimeout(updateCategoryCardsSequentialFocus, 100);
    setTimeout(updateCategoryCardsSequentialFocus, 500);
})();

// ========================================
// CONSOLE WELCOME
// ========================================
console.log('%c MONETA Macedonia 🦶 ', 'background:#EC1752;color:#fff;font-size:20px;font-weight:bold;padding:10px 20px;border-radius:8px;');
console.log('%c Анатомски вложки - Подобар чекор, помал замор', 'color:#201F26;font-size:14px;');
console.log('%c Вебсајт во развој 💪', 'color:#6B6B76;font-size:12px;');

// ========================================
// CART SYSTEM (localStorage) — 2026-08-03
// ========================================
(function initCartSystem() {
    const KEY = 'moneta_cart';

    const getCart = () => {
        try {
            const c = JSON.parse(localStorage.getItem(KEY));
            if (!c || typeof c !== 'object') return {};
            // Нормализација: legacy артикли (qty без sizes) → sizes по големина
            Object.keys(c).forEach((k) => {
                const it = c[k];
                if (!it || typeof it !== 'object') { delete c[k]; return; }
                if (!it.sizes) {
                    it.sizes = (it.qty || 0) > 0 ? (it.size ? { [it.size]: it.qty } : { '': it.qty }) : {};
                }
                // Нормализација на име/код — никогаш да не се прикажува „undefined"
                if (!it.nameMk) it.nameMk = it.titleMk || k;
                if (!it.nameEn) it.nameEn = it.titleEn || it.nameMk;
                if (!it.code) it.code = '';
                it.qty = Object.values(it.sizes).reduce((a, b) => a + (b || 0), 0);
                if (it.qty === 0) delete c[k];
            });
            return c;
        } catch (e) {
            return {};
        }
    };
    const setCart = (cart) => {
        try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
    };
    const totalQty = (cart) => Object.keys(cart).reduce((sum, k) => sum + (cart[k].qty || 0), 0);

    // ==== Бесплатна достава (1000+ ден.) + Достава за 48ч ====
    const FREE_SHIP_THRESHOLD = 1000;
    const subtotal = (cart) => Object.keys(cart).reduce((s, k) => s + (cart[k].qty || 0) * (cart[k].price || 0), 0);

    const renderFreeShip = (cart) => {
        const subt = subtotal(cart);
        const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subt);
        const pct = Math.min(100, Math.round((subt / FREE_SHIP_THRESHOLD) * 100));
        const isEn = document.documentElement.lang === 'en';

        document.querySelectorAll('[data-free-ship]').forEach((block) => {
            const textEl = block.querySelector('[data-free-ship-text]');
            const fillEl = block.querySelector('[data-free-ship-fill]');
            if (remaining > 0) {
                block.classList.remove('is-reached');
                if (textEl) {
                    textEl.textContent = isEn
                        ? `Free shipping for orders over ${FREE_SHIP_THRESHOLD} MKD — add ${remaining.toLocaleString('mk-MK')} MKD more.`
                        : `Бесплатна достава за нарачки над ${FREE_SHIP_THRESHOLD.toLocaleString('mk-MK')} ден. — додадете уште ${remaining.toLocaleString('mk-MK')} ден.`;
                }
            } else {
                block.classList.add('is-reached');
                if (textEl) {
                    textEl.textContent = isEn
                        ? '🎉 You have FREE shipping!'
                        : '🎉 Имате БЕСПЛАТНА достава!';
                }
            }
            if (fillEl) fillEl.style.width = pct + '%';
        });
    };

    // Мотивациски popup — ИСКЛУЧИВО на cart.html, кога сметката е НАД 500 ден. (а под 1000)
    const maybeShowFreeShipPopup = (cart) => {
        if (!/cart\.html/.test(window.location.pathname)) return;
        if (window.__freeshipPopupShown) return;
        const subt = subtotal(cart);
        if (subt <= 500 || subt >= FREE_SHIP_THRESHOLD) return;
        window.__freeshipPopupShown = true;
        const remaining = FREE_SHIP_THRESHOLD - subt;
        const isEn = document.documentElement.lang === 'en';
        const IS_MODELI = /\/modeli\//.test(window.location.pathname);
        const base = IS_MODELI ? '../' : './';

        let popup = document.getElementById('freeshipPopup');
        if (popup) popup.remove();
        popup = document.createElement('div');
        popup.id = 'freeshipPopup';
        popup.className = 'freeship-popup';
        popup.innerHTML = `
            <div class="freeship-popup__content">
                <div class="freeship-popup__icon">🎁</div>
                <div class="freeship-popup__text">
                    <strong>${isEn ? 'Only ' + remaining.toLocaleString('mk-MK') + ' MKD to FREE delivery!' : 'Само уште ' + remaining.toLocaleString('mk-MK') + ' ден. до БЕСПЛАТНА достава!'}</strong>
                    <span>${isEn ? 'Add one more insole and the delivery is on us.' : 'Додадете уште една влошка и доставата е на нас.'}</span>
                    <a href="${base}index.html#kategorii" class="freeship-popup__btn">${isEn ? 'See insoles' : 'Види ги влошките'}</a>
                </div>
                <button type="button" class="freeship-popup__close" aria-label="Затвори">×</button>
            </div>`;
        document.body.appendChild(popup);
        const closeBtn = popup.querySelector('.freeship-popup__close');
        if (closeBtn) closeBtn.addEventListener('click', () => popup.remove());
        setTimeout(() => { if (popup.parentNode) popup.remove(); }, 12000);
    };

    // Нав-бар баџ — вкупен број на сите артикли во кошничката
    const renderNavBadges = () => {
        // Мобилен: автоматски додади баџ на бургер-копчето (ако недостасува)
        const toggle = document.querySelector('.navbar__toggle');
        if (toggle && !toggle.querySelector('[data-cart-badge]')) {
            const b = document.createElement('span');
            b.className = 'navbar__toggle-badge';
            b.setAttribute('data-cart-badge', '0');
            toggle.appendChild(b);
        }
        const cart = getCart();
        const total = totalQty(cart);
        document.querySelectorAll('[data-cart-badge]').forEach((badge) => {
            badge.textContent = total;
            badge.style.display = total > 0 ? 'flex' : 'none';
        });
    };

    // Бројач на модел-страница — само за овој модел
    // ===== Варијанта 2: Локален избор (pending) на продукт-страница =====
    // Клиентот поставува големини+количини, па „Додади" ги префрла во кошничката
    const pending = {}; // { slug: { size: qty } }

    // ===== Историја на пазарење (мали thumbnails во кошничката) =====
    const HISTORY_KEYS = { viewed: 'moneta_viewed', added: 'moneta_added' };
    const HISTORY_MAX = 8;
    const readHistory = (key) => {
        try {
            const h = JSON.parse(localStorage.getItem(key));
            return Array.isArray(h) ? h : [];
        } catch (e) { return []; }
    };
    const pushHistory = (key, slug, name) => {
        try {
            const list = readHistory(key).filter((it) => it.slug !== slug);
            list.unshift({ slug: slug, name: name, ts: Date.now() });
            localStorage.setItem(key, JSON.stringify(list.slice(0, HISTORY_MAX)));
        } catch (e) { /* ignore */ }
    };
    // Неодамна разгледани — се снима при отворање на модел-страница
    const trackViewed = () => {
        if (!/\/modeli\//.test(window.location.pathname)) return;
        const ctl = document.querySelector('.model-cart[data-model], .size-selector[data-model]');
        if (!ctl) return;
        const slug = ctl.getAttribute('data-model');
        const name = ctl.getAttribute('data-name-mk') || slug;
        if (slug) pushHistory(HISTORY_KEYS.viewed, slug, name);
    };
    trackViewed();
    // Неодамна додадени — се снима при „Додади"
    const trackAdded = (slug, name) => {
        if (slug) pushHistory(HISTORY_KEYS.added, slug, name);
    };
    const getViewed = () => readHistory(HISTORY_KEYS.viewed);
    const getRecentlyAdded = () => readHistory(HISTORY_KEYS.added);

    const renderModelQty = () => {
        const cart = getCart();
        const isModelPage = !!document.querySelector('[data-size-grid]');
        document.querySelectorAll('[data-model]').forEach((ctl) => {
            const slug = ctl.getAttribute('data-model');
            const item = cart[slug];
            const qtyEl = ctl.querySelector('[data-cart-qty]');
            const minusEl = ctl.querySelector('[data-cart-minus]');
            const plusEl = ctl.querySelector('[data-cart-plus]');
            let qty = 0;
            let showQty = false;
            if (isModelPage) {
                // Модел-страница: количината е за ИЗБРАНАТА големина (pending),
                // почетна вредност 1 — покажува колку ќе се додаде
                const sz = ctl.getAttribute('data-size');
                if (sz) {
                    const p = pending[slug] || {};
                    qty = (typeof p[sz] === 'number') ? p[sz] : 1;
                    showQty = true;
                }
            } else {
                // cart.html: вкупна количина (сите големини)
                qty = (item && item.qty) || 0;
                showQty = qty > 0;
            }
            if (qtyEl) {
                qtyEl.textContent = qty;
                qtyEl.style.display = showQty ? 'block' : 'none';
            }
            // минус се појавува дури на количина >= 2; плус секогаш кога има избрана големина
            if (minusEl) minusEl.style.display = (showQty && qty >= 2) ? 'flex' : 'none';
            if (plusEl) plusEl.style.display = showQty ? 'flex' : 'none';

            // Точка 4: цена × количина — клиентот ја гледа вкупната сума за избраната количина
            if (isModelPage) {
                const priceEl = ctl.closest('.order-bar__top')?.querySelector('.model-price');
                if (priceEl) {
                    const unit = parseInt(ctl.dataset.price, 10) || 0;
                    if (unit > 0) {
                        const lang = document.documentElement.lang || 'mk';
                        const fmt = (n) => n.toLocaleString('mk-MK');
                        const total = unit * (qty >= 1 ? qty : 1);
                        let mk, sq, en;
                        if (qty >= 2) {
                            mk = 'Цена: ' + fmt(unit) + ' × ' + qty + ' = ' + fmt(total) + ' ден.';
                            sq = 'Çmimi: ' + fmt(unit) + ' × ' + qty + ' = ' + fmt(total) + ' den.';
                            en = 'Price: ' + fmt(unit) + ' × ' + qty + ' = ' + fmt(total) + ' MKD';
                        } else {
                            mk = 'Цена: ' + fmt(unit) + ' ден.';
                            sq = 'Çmimi: ' + fmt(unit) + ' den.';
                            en = 'Price: ' + fmt(unit) + ' MKD';
                        }
                        priceEl.setAttribute('data-mk', mk);
                        priceEl.setAttribute('data-sq', sq);
                        priceEl.setAttribute('data-en', en);
                        priceEl.textContent = lang === 'en' ? en : lang === 'sq' ? sq : mk;
                    }
                }
            }
        });
    };

    const updateModel = (ctl, delta) => {
        const slug = ctl.getAttribute('data-model');
        if (!slug) return;
        const cart = getCart();
        const stripSuffix = (s) => (s || '').replace(/\s*\(.*\)$/, '');
        const item = cart[slug] || {
            slug: slug,
            code: ctl.getAttribute('data-code') || slug,
            price: parseFloat(ctl.getAttribute('data-price')) || 0,
            nameMk: stripSuffix(ctl.getAttribute('data-name-mk')) || slug,
            nameEn: stripSuffix(ctl.getAttribute('data-name-en')) || slug,
            sizes: {},
            size: '',
            qty: 0
        };
        item.sizes = item.sizes || {};
        // cart.html нема data-size → користи ја последната активна големина
        const sizeKey = ctl.getAttribute('data-size') || item.size || '';
        const cur = item.sizes[sizeKey] || 0;
        const next = Math.max(0, cur + delta);
        if (next === 0) {
            delete item.sizes[sizeKey];
        } else {
            item.sizes[sizeKey] = next;
            item.size = sizeKey;
        }
        // Вкупна количина (нав-баџ / subtotal / cart.html)
        item.qty = Object.values(item.sizes).reduce((a, b) => a + (b || 0), 0);
        if (item.qty === 0) {
            delete cart[slug];
        } else {
            cart[slug] = item;
        }
        setCart(cart);
        renderModelQty();
        renderNavBadges();
        renderFreeShip(cart);
        maybeShowFreeShipPopup(cart);
        if (window.MonetaCartOnChange) window.MonetaCartOnChange(cart);
    };

    const removeItem = (slug) => {
        const cart = getCart();
        delete cart[slug];
        setCart(cart);
        renderModelQty();
        renderNavBadges();
        renderFreeShip(cart);
        maybeShowFreeShipPopup(cart);
        if (window.MonetaCartOnChange) window.MonetaCartOnChange(cart);
    };

    // Варијанта 2: „Додади" — ја префрла целата pending структура во кошничката
    const addPendingToCart = (ctl) => {
        const slug = ctl.getAttribute('data-model');
        if (!slug) return;
        const p = pending[slug] || {};
        const toAdd = {};
        Object.entries(p).forEach(([sz, q]) => { if (q > 0) toAdd[sz] = q; });
        if (Object.keys(toAdd).length === 0) return;
        const stripSuffix = (s) => (s || '').replace(/\s*\(.*\)$/, '');
        const cart = getCart();
        const item = cart[slug] || {
            slug: slug,
            code: ctl.getAttribute('data-code') || slug,
            price: parseFloat(ctl.getAttribute('data-price')) || 0,
            nameMk: stripSuffix(ctl.getAttribute('data-name-mk')) || slug,
            nameEn: stripSuffix(ctl.getAttribute('data-name-en')) || slug,
            sizes: {},
            size: '',
            qty: 0
        };
        item.sizes = item.sizes || {};
        Object.entries(toAdd).forEach(([sz, q]) => {
            item.sizes[sz] = (item.sizes[sz] || 0) + q;
            item.size = sz;
        });
        item.qty = Object.values(item.sizes).reduce((a, b) => a + (b || 0), 0);
        if (item.qty === 0) {
            delete cart[slug];
        } else {
            cart[slug] = item;
        }
        delete pending[slug];
        trackAdded(slug, item.nameMk);
        setCart(cart);
        renderModelQty();
        renderNavBadges();
        renderFreeShip(cart);
        maybeShowFreeShipPopup(cart);
        if (window.MonetaCartOnChange) window.MonetaCartOnChange(cart);
    };

    // Отстрани само една големина од кошничката
    const removeSize = (slug, size) => {
        const cart = getCart();
        const item = cart[slug];
        if (!item) return;
        delete item.sizes[size];
        item.qty = Object.values(item.sizes || {}).reduce((a, b) => a + (b || 0), 0);
        if (item.qty === 0) {
            delete cart[slug];
        } else {
            cart[slug] = item;
        }
        setCart(cart);
        renderModelQty();
        renderNavBadges();
        renderFreeShip(cart);
        maybeShowFreeShipPopup(cart);
        if (window.MonetaCartOnChange) window.MonetaCartOnChange(cart);
    };

    // Врзување преку делегација
    // Варијанта 2: на модел-страници +/− ја прилагодуваат ЛОКАЛНАТА количина
    // (pending) за избраната големина; „Додади" ја префрла целата структура во кошничката
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-cart-add]');
        const plusBtn = e.target.closest('[data-cart-plus]');
        const minusBtn = e.target.closest('[data-cart-minus]');
        const sizeBtn = e.target.closest('.size-btn');
        const removeBtn = e.target.closest('[data-cart-remove]');
        if (removeBtn) {
            const itemEl = removeBtn.closest('[data-cart-item]');
            const sz = removeBtn.getAttribute('data-size');
            if (itemEl) {
                if (sz) removeSize(itemEl.getAttribute('data-cart-item'), sz);
                else removeItem(itemEl.getAttribute('data-cart-item'));
            }
            return;
        }
        // Локален избор на големина (pending) — после inline скриптата (bubble)
        if (sizeBtn && !sizeBtn.classList.contains('size-btn--disabled')) {
            const ctl = sizeBtn.closest('[data-model]');
            // Големината ја читаме од самото копче; „селектирано" значи нов избор
            const sz = sizeBtn.textContent.trim();
            if (sizeBtn.classList.contains('size-btn--selected') && ctl && sz) {
                const slug = ctl.getAttribute('data-model');
                const p = pending[slug] || (pending[slug] = {});
                if (typeof p[sz] !== 'number') p[sz] = 1;
                renderModelQty();
            }
            return;
        }
        if (addBtn) {
            const ctl = addBtn.closest('[data-model]');
            if (ctl) addPendingToCart(ctl);
            return;
        }
        if (plusBtn) {
            const ctl = plusBtn.closest('[data-model]');
            if (ctl) {
                const slug = ctl.getAttribute('data-model');
                const sz = ctl.getAttribute('data-size');
                if (sz) {
                    const p = pending[slug] || (pending[slug] = {});
                    p[sz] = (typeof p[sz] === 'number' ? p[sz] : 1) + 1;
                    renderModelQty();
                }
            }
            return;
        }
        if (minusBtn) {
            const ctl = minusBtn.closest('[data-model]');
            if (ctl) {
                const slug = ctl.getAttribute('data-model');
                const sz = ctl.getAttribute('data-size');
                if (sz) {
                    const p = pending[slug] || (pending[slug] = {});
                    const cur = (typeof p[sz] === 'number') ? p[sz] : 1;
                    p[sz] = Math.max(0, cur - 1);
                    renderModelQty();
                }
            }
        }
    });

    // ===== Точка 3: Синхронизација на бројачите =====
    // При враќање назад (bfcache) и при промена од друг таб —
    // бројачите на модел-страниците/кошничката секогаш се освежуваат
    const refreshCartUI = () => {
        renderModelQty();
        renderNavBadges();
        renderFreeShip(getCart());
    };
    window.addEventListener('pageshow', refreshCartUI);
    window.addEventListener('storage', (e) => {
        if (e.key === KEY) {
            refreshCartUI();
            if (window.MonetaCartOnChange) window.MonetaCartOnChange(getCart());
        }
    });

    renderModelQty();
    renderNavBadges();
    renderFreeShip(getCart());
    maybeShowFreeShipPopup(getCart());

    // Јавно API за cart.html
    window.MonetaCart = { getCart: getCart, setCart: setCart, totalQty: totalQty, subtotal: subtotal, updateModel: updateModel, removeItem: removeItem, removeSize: removeSize, renderModelQty: renderModelQty, renderNavBadges: renderNavBadges, renderFreeShip: renderFreeShip, getViewed: getViewed, getRecentlyAdded: getRecentlyAdded, FREE_SHIP_THRESHOLD: FREE_SHIP_THRESHOLD };
})();

// ========================================
// PRODUCT FINDER QUIZ (2026-08-03) — „Најди го твојот совршен пар“
// ========================================
(function initProductFinder() {
    const section = document.getElementById('productFinder');
    if (!section) return;

    const steps = [...section.querySelectorAll('.quiz-step')];
    const bar = section.querySelector('#quizBar');
    const stepLabel = section.querySelector('#quizStepLabel');
    const result = section.querySelector('#quizResult');
    const grid = section.querySelector('#quizResultGrid');
    const prevBtn = section.querySelector('#quizPrev');
    const nextBtn = section.querySelector('#quizNext');
    const restartBtn = section.querySelector('#quizRestart');

    const answers = {};
    let current = 1;

    const QUIZ_ICONS = {
        anatomska:   ['anatomska%20vloska.webp', 'Анатомска', 'Anatomical', 'Anatomike'],
        pritisok:    ['apsorpcija%20na%20pritisok.webp', 'Апсорпција на удари', 'Shock absorb', 'Thithje goditjesh'],
        apsorpcija:  ['apsorpcija.webp', 'Апсорпција', 'Absorption', 'Thithje'],
        gel:         ['gel%20vloska.webp', 'Гел', 'Gel', 'Xhel'],
        higienski:   ['higienski.webp', 'Хигиенски', 'Hygienic', 'Higjienik'],
        koza:        ['koza.webp', 'Кожа', 'Leather', 'Lëkurë'],
        medicinski:  ['medicinski_svojstva.webp', 'Здравје', 'Health', 'Shëndet'],
        perenje:     ['moznost%20za%20perenje.webp', 'Перење', 'Washable', 'Larëse'],
        polar:       ['polar%28ultra%20zimski%29.webp', 'Полар', 'Polar', 'Polar'],
        prirodni:    ['prirodni%20materijali.webp', 'Природни', 'Natural', 'Natyral'],
        mirisi:      ['protiv%20losi%20mirisi.webp', 'Анти-мирис', 'Anti-odor', 'Kundër erës'],
        aroma:       ['so%20aroma.webp', 'Арома', 'Aroma', 'Aromë'],
        univerzalen: ['univerzalen%20broj.webp', 'Универзален', 'Universal', 'Universal'],
        zimski:      ['zimski.webp', 'Зимски', 'Winter', 'Dimëror']
    };

    const MODELS = {
        'memosole':       { cat: ['sport'],  pain: ['celo', 'nema'], prio: ['amort', 'prirodni'], job: ['sportist', 'nastavnik', 'zdravstvo'], icons: ['anatomska', 'pritisok', 'mirisi', 'univerzalen'], price: 400, sys: 'memory', nameMk: 'MEMOSOLE', nameEn: 'MEMOSOLE' },
        'active-gel':     { cat: ['sport'],  pain: ['peta', 'nema'], prio: ['amort'], job: ['sportist', 'zdravstvo'], icons: ['gel', 'pritisok', 'univerzalen', 'anatomska'], price: 620, sys: 'absorb', nameMk: 'Active Gel', nameEn: 'Active Gel' },
        'anatomiX':       { cat: ['sport'],  pain: ['lac', 'nema'], prio: ['poddrshka'], job: ['sportist', 'zdravstvo', 'rabotnik'], icons: ['pritisok', 'higienski', 'anatomska'], price: 430, sys: 'anatomic', nameMk: 'AnatomiX', nameEn: 'AnatomiX' },
        'sport-style':    { cat: ['sport'],  pain: ['nema'], prio: ['cena', 'prirodni'], job: ['sportist', 'nastavnik'], icons: ['prirodni', 'anatomska', 'apsorpcija'], price: 300, sys: 'anatomic', nameMk: 'Sport Style', nameEn: 'Sport Style' },
        'sportex':        { cat: ['sport'],  pain: ['nema'], prio: ['cena', 'fresina'], job: ['sportist', 'rabotnik', 'nastavnik'], icons: ['pritisok', 'higienski', 'anatomska'], price: 230, sys: 'absorb', nameMk: 'Sportex', nameEn: 'Sportex' },
        'x-treme':        { cat: ['sport'],  pain: ['peta', 'celo'], prio: ['amort', 'poddrshka'], job: ['sportist', 'rabotnik'], icons: ['pritisok', 'anatomska', 'apsorpcija', 'higienski'], price: 420, sys: 'anatomic', nameMk: 'X-TREME', nameEn: 'X-TREME' },
        'heel-pad':       { cat: ['kozni'],  pain: ['peta'], prio: ['poddrshka'], job: ['kancelarija', 'zdravstvo', 'nastavnik'], icons: ['koza', 'pritisok', 'anatomska'], price: 250, sys: 'ortho', nameMk: 'Heel Pad', nameEn: 'Heel Pad' },
        'heel-pad-fix':   { cat: ['kozni'],  pain: ['peta'], prio: ['poddrshka'], job: ['kancelarija', 'zdravstvo'], icons: ['koza', 'pritisok'], price: 210, sys: 'ortho', nameMk: 'Heel Pad FIX', nameEn: 'Heel Pad FIX' },
        'heel-pad-grip':  { cat: ['kozni'],  pain: ['peta'], prio: ['cena', 'poddrshka'], job: ['kancelarija', 'nastavnik'], icons: ['koza', 'univerzalen', 'pritisok'], price: 100, sys: 'ortho', nameMk: 'Heel Pad Grip', nameEn: 'Heel Pad Grip' },
        'topas':          { cat: ['kozni'],  pain: ['lac', 'peta'], prio: ['poddrshka', 'prirodni'], job: ['kancelarija', 'nastavnik', 'zdravstvo'], icons: ['koza', 'anatomska', 'medicinski'], price: 490, sys: 'ortho', nameMk: 'Topas', nameEn: 'Topas' },
        'soft-gel':       { cat: ['kozni'],  pain: ['celo', 'peta'], prio: ['amort', 'fresina'], job: ['zdravstvo', 'nastavnik'], icons: ['koza', 'gel', 'mirisi', 'anatomska'], price: 820, sys: 'memory', nameMk: 'Soft Gel', nameEn: 'Soft Gel' },
        'vital':          { cat: ['kozni'],  pain: ['lac'], prio: ['poddrshka'], job: ['kancelarija', 'nastavnik'], icons: ['koza', 'apsorpcija', 'anatomska'], price: 450, sys: 'anatomic', nameMk: 'Vital', nameEn: 'Vital' },
        'relax':          { cat: ['kozni'],  pain: ['celo', 'lac'], prio: ['prirodni', 'amort'], job: ['kancelarija', 'zdravstvo', 'nastavnik'], icons: ['koza', 'prirodni', 'anatomska'], price: 570, sys: 'anatomic', nameMk: 'Relax', nameEn: 'Relax' },
        'simona':         { cat: ['letni'],  pain: ['nema', 'celo'], prio: ['fresina', 'prirodni', 'cena'], job: ['kancelarija', 'nastavnik'], icons: ['aroma', 'mirisi', 'prirodni', 'apsorpcija'], price: 120, sys: 'absorb', nameMk: 'Simona', nameEn: 'Simona' },
        'carbon':         { cat: ['letni'],  pain: ['celo', 'nema'], prio: ['fresina', 'cena'], job: ['kancelarija', 'nastavnik'], icons: ['mirisi', 'higienski', 'univerzalen', 'apsorpcija'], price: 170, sys: 'absorb', nameMk: 'Carbon', nameEn: 'Carbon' },
        'thermo-alu':     { cat: ['zimski'], pain: ['nema', 'celo'], prio: ['prirodni'], job: ['rabotnik', 'nastavnik'], icons: ['zimski', 'polar', 'prirodni', 'anatomska'], price: 210, sys: 'thermo', nameMk: 'Thermo Alu', nameEn: 'Thermo Alu' },
        'hunter-outdoor': { cat: ['hunter'], pain: ['lac', 'peta'], prio: ['poddrshka'], job: ['rabotnik', 'sportist'], icons: ['pritisok', 'anatomska', 'apsorpcija'], price: 330, sys: 'ortho', nameMk: 'Hunter Outdoor', nameEn: 'Hunter Outdoor' },
        'hunter-flex':    { cat: ['hunter'], pain: ['celo'], prio: ['amort'], job: ['rabotnik', 'sportist'], icons: ['zimski', 'pritisok', 'anatomska'], price: 330, sys: 'thermo', nameMk: 'Hunter Flex', nameEn: 'Hunter Flex' },
        'hunter-camo':    { cat: ['hunter'], pain: ['peta', 'lac'], prio: ['poddrshka'], job: ['rabotnik', 'sportist'], icons: ['mirisi', 'apsorpcija', 'anatomska'], price: 330, sys: 'absorb', nameMk: 'Hunter CAMO', nameEn: 'Hunter CAMO' },
        'duck':           { cat: ['detski'], pain: ['nema', 'celo'], prio: ['prirodni', 'cena'], job: [], icons: ['prirodni', 'anatomska', 'medicinski'], price: 490, sys: 'anatomic', nameMk: 'Duck', nameEn: 'Duck' },
    };

    function lang() {
        return document.documentElement.lang === 'en' ? 'en' : (document.documentElement.lang === 'sq' ? 'sq' : 'mk');
    }

    function showStep(n) {
        current = Math.min(Math.max(1, n), steps.length);
        steps.forEach((s) => s.classList.toggle('is-active', +s.dataset.step === current));
        if (result) result.style.display = 'none';
        if (bar) bar.style.width = (current / steps.length * 100) + '%';
        if (stepLabel) stepLabel.textContent = current + ' / ' + steps.length;
        if (prevBtn) prevBtn.style.visibility = current === 1 ? 'hidden' : 'visible';
        if (nextBtn) {
            nextBtn.style.visibility = 'visible';
            nextBtn.dataset.mk = 'Следно';
            nextBtn.dataset.en = 'Next';
            nextBtn.dataset.sq = 'Tjetra';
            nextBtn.textContent = lang() === 'en' ? 'Next' : (lang() === 'sq' ? 'Tjetra' : 'Следно');
        }
        steps.forEach((s) => {
            const val = answers[s.dataset.step];
            s.querySelectorAll('.quiz-option').forEach((o) => o.classList.toggle('is-selected', o.dataset.val === val));
        });
    }

    function scoreModels() {
        const q1 = answers['1'] || 'jas';          // за кого
        const q2 = answers['2'] || 'drugo';        // занимање
        const q3 = answers['3'] || 'nema';         // непријатност
        const q4 = answers['4'] || '4-8';          // часови на нозе
        const q5 = answers['5'] || 'sport';        // обувки
        const q6 = answers['6'] || 'poddrshka';    // приоритет
        const scored = Object.entries(MODELS).map(([slug, m]) => {
            let score = 0;
            if (m.cat.includes(q5)) score += 3;
            if (m.pain.includes(q3)) score += 2;
            if (m.prio.includes(q6)) score += 2;
            if (m.job && m.job.includes(q2)) score += 2;
            if (q1 === 'dete' && slug === 'duck') score += 5;
            if (q4 === '8+' && (m.pain.includes('celo') || q3 === 'peta' || q3 === 'lac')) score += 1;
            return { slug, ...m, score };
        });
        scored.sort((a, b) => b.score - a.score || a.price - b.price);
        return scored;
    }

    function showResult() {
        const isEn = lang() === 'en';
        const isSq = lang() === 'sq';
        const isDuckMode = answers['1'] === 'dete';
        const top = isDuckMode ? [] : scoreModels().slice(0, 3);
        if (grid) {
            if (isDuckMode) {
                // За деца има само еден модел (DUCK) — нема квиз прашања, само инфо + линк
                const duckNote = isEn ? '🎒 For kids there is only one insole — meet <strong>MONETA Duck</strong>!' : (isSq ? '🎒 Për fëmijë ekziston vetëm një taban — njihuni me <strong>MONETA Duck</strong>!' : '🎒 За деца постои само една влошка — запознајте ја <strong>МОНЕТА Duck</strong>!');
                const duckView = isEn ? 'View' : (isSq ? 'Shiko' : 'Види');
                const duckIcn = (sq, en, mk) => isEn ? en : (isSq ? sq : mk);
                grid.innerHTML = `
                    <p class="quiz-result__note">${duckNote}</p>
                    <a href="modeli/duck.html" class="quiz-result__card quiz-result__card--duck">
                        <img src="images/cards/duck.webp" alt="Duck" width="200" height="150" loading="lazy">
                        <strong>Duck</strong>
                        <span>490 ${isEn ? 'MKD' : 'ден.'}</span>
                        <div class="quiz-result__icons">
                            <img src="images/icons/prirodni%20materijali.webp" alt="${duckIcn('Natyral', 'Natural', 'Природни')}" title="${duckIcn('Natyral', 'Natural', 'Природни')}" width="22" height="22" loading="lazy">
                            <img src="images/icons/anatomska%20vloska.webp" alt="${duckIcn('Anatomike', 'Anatomical', 'Анатомска')}" title="${duckIcn('Anatomike', 'Anatomical', 'Анатомска')}" width="22" height="22" loading="lazy">
                            <img src="images/icons/medicinski_svojstva.webp" alt="${duckIcn('Shëndet', 'Health', 'Здравје')}" title="${duckIcn('Shëndet', 'Health', 'Здравје')}" width="22" height="22" loading="lazy">
                        </div>
                        <em>${duckView}</em>
                    </a>`;
            } else {
                grid.innerHTML = top.map((m) => `
                <a href="modeli/${m.slug}.html" class="quiz-result__card">
                    <img src="images/cards/${m.slug}.webp" alt="${isEn ? m.nameEn : m.nameMk}" width="200" height="150" loading="lazy">
                    <strong>${isEn ? m.nameEn : m.nameMk}</strong>
                    <span>${m.price} ${isEn ? 'MKD' : 'ден.'}</span>
                    ${m.sys ? `<span class="quiz-result__sys">🔬 ${m.sys.toUpperCase()}</span>` : ''}
                    <div class="quiz-result__icons">${(m.icons || []).map((k) => {
                        const ic = QUIZ_ICONS[k];
                        if (!ic) return '';
                        const [file, mk, en, sq] = ic;
                        const label = isEn ? en : (isSq ? sq : mk);
                        return `<img src="images/icons/${file}" alt="${label}" title="${label}" width="22" height="22" loading="lazy">`;
                    }).join('')}</div>
                    <em>${isEn ? 'View' : (isSq ? 'Shiko' : 'Види')}</em>
                </a>`).join('');
            }
        }
        steps.forEach((s) => s.classList.remove('is-active'));
        if (result) result.style.display = 'block';
        if (bar) bar.style.width = '100%';
        if (stepLabel) stepLabel.textContent = '✓';
        if (prevBtn) prevBtn.style.visibility = 'hidden';
        if (nextBtn) {
            nextBtn.style.visibility = 'visible';
            nextBtn.dataset.mk = '🏠 Почетна';
            nextBtn.dataset.en = '🏠 Home';
            nextBtn.dataset.sq = '🏠 Kryefaqja';
            nextBtn.textContent = isEn ? '🏠 Home' : (isSq ? '🏠 Kryefaqja' : '🏠 Почетна');
        }
    }

    section.addEventListener('click', (e) => {
        const opt = e.target.closest('.quiz-option');
        if (opt) {
            const stepEl = opt.closest('.quiz-step');
            answers[stepEl.dataset.step] = opt.dataset.val;
            stepEl.querySelectorAll('.quiz-option').forEach((o) => o.classList.toggle('is-selected', o === opt));
            if (current === 1 && opt.dataset.val === 'dete') {
                // За „За дете“ → нема квиз прашања (постои само DUCK), директно резултат
                showResult();
            } else if (current < steps.length) {
                setTimeout(() => showStep(current + 1), 260);
            } else {
                showResult();
            }
            return;
        }
        if (e.target.closest('#quizPrev')) { showStep(current - 1); return; }
        if (e.target.closest('#quizNext')) {
            const resultShown = result && result.style.display === 'block';
            if (resultShown) {
                window.location.href = 'index.html';
                return;
            }
            if (current < steps.length) showStep(current + 1);
            return;
        }
        if (e.target.closest('#quizRestart')) {
            Object.keys(answers).forEach((k) => delete answers[k]);
            showStep(1);
        }
    });

    // CTA копче „Најди го твојот совршен пар“ → квиз
    const trigger = document.getElementById('quizFinderTrigger');
    if (trigger) {
        trigger.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }

    // Кога ќе се смени јазикот — прикажи го тековниот чекор со новите преводи
    if (window.MonetaOnLangChange) {
        window.MonetaOnLangChange(() => {
            const wasResult = result && result.style.display === 'block';
            if (wasResult) {
                showResult();
            } else {
                steps.forEach((s) => s.classList.toggle('is-active', +s.dataset.step === current));
            }
        });
    }

    showStep(1);
})();

// ========================================
// DEALER MAP (2026-08-04) — Leaflet + OpenStreetMap
// Мапа на дилери во секцијата Контакт (index.html), двојазично MK/EN.
// ========================================
(function initDealerMap() {
    const mapEl = document.getElementById('dealerMap');
    if (!mapEl) return;

    const DEALERS = [
        { nameMk: 'МЕДИКА ПРО — Скопје', nameEn: 'MEDIKA PRO — Skopje', addrMk: 'бул. Кочо Рацин бр.75, Центар', addrEn: '75 Koco Racin Blvd, Centar', tel: ['+389 72 225 505', '+389 2 3111 404'], lat: 41.99133928123531, lng: 21.436732260905845 },
        { nameMk: 'МЕДИКА ПРО — Прилеп', nameEn: 'MEDIKA PRO — Prilep', addrMk: 'ул. Мице Козар бр.10', addrEn: '10 Mice Kozar St.', tel: ['+389 70 22 55 99', '+389 48 450 231'], lat: 41.3458, lng: 21.5565 },
        { nameMk: 'МЕДИКА ПРО — Тетово', nameEn: 'MEDIKA PRO — Tetovo', addrMk: 'ул. Маршал Тито бр.36', addrEn: '36 Marshal Tito St.', tel: ['+389 71 26 20 48', '+389 44 349 050'], lat: 42.0086, lng: 20.9710 },
        { nameMk: 'МЕДИКА ПРО — Битола', nameEn: 'MEDIKA PRO — Bitola', addrMk: 'бул. 1-ви Мај бр.202/7', addrEn: '202/7 1st May Blvd', tel: ['+389 72 30 37 82', '+389 47 29 21 10'], lat: 41.0297, lng: 21.3332 },
        { nameMk: 'МЕДИКА ПРО — Куманово', nameEn: 'MEDIKA PRO — Kumanovo', addrMk: 'ул. Христијан Тодоровски Карпош бр.7', addrEn: '7 Hristijan Todorovski Karpos St.', tel: ['+389 70 322 611', '+389 31 461 990'], lat: 42.1322, lng: 21.7150 },
        { nameMk: 'МЕДИКА ПРО — Струмица', nameEn: 'MEDIKA PRO — Strumica', addrMk: 'ул. Младинска бр.37', addrEn: '37 Mladinska St.', tel: ['+389 70 223 100', '+389 34 348 256'], lat: 41.3183, lng: 22.6410 },
        { nameMk: 'МАК-ФИТ (Calivita) — Скопје', nameEn: 'MAK-FIT (Calivita) — Skopje', addrMk: 'ул. св. Кирил и Методиј бр.20', addrEn: '20 Sv. Kiril i Metodij St.', tel: ['+389 76 454 957', '+389 2 323 00 88'], isMain: true, lat: 41.9907481, lng: 21.4311922 }
    ];

    const isEn = () => document.documentElement.lang === 'en';

    function popupHtml(d) {
        const phones = d.tel.map((t) => `<a href="tel:${t.replace(/\s/g, '')}">${t}</a>`).join(' · ');
        return `<div class="dealer-popup">
            <strong>${isEn() ? d.nameEn : d.nameMk}</strong>
            <span>${isEn() ? d.addrEn : d.addrMk}</span>
            <span class="dealer-popup__tel">${phones}</span>
        </div>`;
    }

    function renderMap() {
    if (typeof L === 'undefined' || mapEl.dataset.loaded) return;
    mapEl.dataset.loaded = 'true';

    const pinIcon = L.divIcon({
        className: 'dealer-pin-wrap',
        html: '<div class="dealer-pin"></div>',
        iconSize: [26, 36],
        iconAnchor: [13, 36],
        popupAnchor: [0, -34]
    });
    // Главната продавница (МАК-ФИТ) → син пин
    const pinIconBlue = L.divIcon({
        className: 'dealer-pin-wrap',
        html: '<div class="dealer-pin dealer-pin--blue"></div>',
        iconSize: [26, 36],
        iconAnchor: [13, 36],
        popupAnchor: [0, -34]
    });

    const map = L.map(mapEl, { scrollWheelZoom: false, attributionControl: true }).setView([41.9907481, 21.4311922], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markers = DEALERS.map((d) =>
        L.marker([d.lat, d.lng], { icon: d.isMain ? pinIconBlue : pinIcon }).addTo(map).bindPopup(popupHtml(d))
    );

    // Јазична промена → освежи ги попup-содржините
    if (window.MonetaOnLangChange) {
        window.MonetaOnLangChange(() => {
            markers.forEach((m, i) => m.setPopupContent(popupHtml(DEALERS[i])));
        });
    }
    }

    function loadMapAssets() {
        if (document.querySelector('script[data-leaflet]')) return;
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = './vendor/leaflet.css';
        document.head.appendChild(stylesheet);

        const script = document.createElement('script');
        script.src = './vendor/leaflet.js';
        script.async = true;
        script.dataset.leaflet = 'true';
        script.onload = renderMap;
        document.head.appendChild(script);
    }

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                loadMapAssets();
            }
        }, { rootMargin: '300px 0px' });
        observer.observe(mapEl);
    } else {
        window.addEventListener('load', loadMapAssets, { once: true, passive: true });
    }
})();

// ========================================
// КОПЧЕ НА ПЕРИМЕТАР — прекин на магентата линија (5px празнина)
// Ширината на прекинот (--btnw) = ширина на копчето + 10px
// ========================================
function syncCardLinkGap() {
    document.querySelectorAll('.categories__grid .card--sport, .categories__grid .card--image').forEach((card) => {
        const link = card.querySelector('.card__link');
        if (!link) return;
        const w = Math.ceil(link.getBoundingClientRect().width);
        card.style.setProperty('--btnw', (w + 10) + 'px');
    });
}
if (window.MonetaOnLangChange) {
    window.MonetaOnLangChange(() => setTimeout(syncCardLinkGap, 60));
}
document.addEventListener('DOMContentLoaded', syncCardLinkGap, { passive: true });
window.addEventListener('load', () => setTimeout(syncCardLinkGap, 400), { passive: true });
window.addEventListener('resize', syncCardLinkGap, { passive: true });

// ========================================
// НАВБАР — „Влошки" брзо бирање на категории (dropdown)
// ========================================
(function initNavbarCategoryDropdown() {
    document.querySelectorAll('.navbar__dd').forEach((dd) => {
        const trigger = dd.querySelector('.navbar__dd-trigger');
        const menu = dd.querySelector('.navbar__dd-menu');
        if (!trigger || !menu) return;
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dd.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        menu.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', () => {
                dd.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            });
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.navbar__dd.is-open').forEach((dd) => dd.classList.remove('is-open'));
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.navbar__dd.is-open').forEach((dd) => dd.classList.remove('is-open'));
        }
    });
})();

// ========================================
// МОНЕТА — Supabase конфигурација
// Пополнете го URL-то на Supabase проектот
// (Supabase Dashboard → Settings → API → Project URL)
// ========================================
window.MONETA_SUPABASE_URL = 'https://wkpkrnjrtpywuzemirbw.supabase.co';
// Е-пошта на продавницата (за mailto fallback) — за тестирање стави nudalsmudals@gmail.com
window.MONETA_SHOP_EMAIL = 'nudalsmudals@gmail.com';
// Е-пошта за НАРАЧКИ — тестова фаза, подоцна ќе се смени со клиентска е-пошта
window.MONETA_ORDER_EMAIL = 'nudalsmudals@gmail.com';
// Анон (јавен) клуч од Supabase — за читање производи/залиха/нарачки
window.MONETA_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcGtybmpydHB5d3V6ZW1pcmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjkwOTksImV4cCI6MjEwMTU0NTA5OX0.nkeKFm2qQYXEsHY6kkJxqfsOxiSEEQJzLOmnrdMMg8I';

// ========================================
// МОНЕТА — Supabase податоци (цени, залиха, попусти) — ЖИВО читање
// Клиентот менува во Supabase Studio → страницата се ажурира сама
// ========================================
window.MonetaData = {
    products: {}, // slug -> product
    sizes: {},    // slug -> { size: qty }
    ready: null
};

(function initMonetaData() {
    const url = String(window.MONETA_SUPABASE_URL || '').replace(/\/+$/, '');
    const key = window.MONETA_ANON_KEY || '';
    if (!url || !key) return;
    const headers = { apikey: key, Authorization: 'Bearer ' + key };

    const discountOf = (prod) => {
        const price = Number(prod.price) || 0;
        const old = prod.old_price ? Number(prod.old_price) : 0;
        return (old > price && old > 0) ? Math.round((old - price) / old * 100) : 0;
    };

    const apply = () => {
        // ---- Модел-страници: цена, стара цена, значка, залиха ----
        document.querySelectorAll('.size-selector[data-model]').forEach((sel) => {
            const slug = sel.getAttribute('data-model');
            const prod = window.MonetaData.products[slug];
            if (!prod) return;
            const sizes = window.MonetaData.sizes[slug] || {};
            const layout = sel.closest('.model-layout') || document;
            const priceEl = layout.querySelector('.model-price');
            const cart = layout.querySelector('.model-cart');
            const price = Number(prod.price) || 0;
            const oldRaw = prod.old_price ? Number(prod.old_price) : 0;
            const discRaw = Number(prod.discount) || 0;
            // discount колона: < 100 → %, ≥ 100 → денари (backward compat)
            const discPct = discRaw > 0 ? (discRaw < 100 ? discRaw : Math.round(discRaw / price * 100)) : 0;
            const old = oldRaw > price ? oldRaw : (discPct > 0 ? Math.round(price / (1 - discPct / 100)) : 0);
            const pct = old > price ? Math.round((old - price) / old * 100) : 0;
            const isEn = document.documentElement.lang === 'en';

            if (priceEl) {
                const mk = 'Цена: ' + price + ' ден.';
                const sq = 'Çmimi: ' + price + ' den.';
                const en = 'Price: ' + price + ' MKD';
                priceEl.setAttribute('data-mk', mk);
                priceEl.setAttribute('data-sq', sq);
                priceEl.setAttribute('data-en', en);
                priceEl.textContent = mk;

                // стара цена (прецртана)
                let oldEl = priceEl.nextElementSibling && priceEl.nextElementSibling.classList.contains('price-old')
                    ? priceEl.nextElementSibling : null;
                if (old > price) {
                    if (!oldEl) {
                        oldEl = document.createElement('span');
                        oldEl.className = 'price-old';
                        priceEl.insertAdjacentElement('afterend', oldEl);
                    }
                    oldEl.textContent = old + (isEn ? ' MKD' : ' ден.');
                    oldEl.style.display = '';
                } else if (oldEl) {
                    oldEl.style.display = 'none';
                }

                // значка за попуст — секогаш во %
                let badge = null;
                if (priceEl.parentElement) {
                    badge = priceEl.parentElement.querySelector(':scope > .promo-badge');
                }
                const showPct = discPct || pct;
                if (showPct > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'promo-badge';
                        priceEl.insertAdjacentElement('afterend', badge);
                    }
                    badge.textContent = '−' + showPct + '%';
                    badge.style.display = '';
                } else if (badge) {
                    badge.style.display = 'none';
                }
            }

            if (cart) {
                cart.dataset.price = price;
                if (prod.code) cart.dataset.code = prod.code;
            }

            // залиха: оневозможи големини со 0 (само ако има податоци од Supabase)
            sel.querySelectorAll('.size-btn').forEach((btn) => {
                const qty = sizes[btn.dataset.size];
                if (qty === undefined) return;
                if (qty <= 0) {
                    btn.classList.add('size-btn--disabled');
                    btn.setAttribute('aria-disabled', 'true');
                    btn.tabIndex = -1;
                } else {
                    btn.classList.remove('size-btn--disabled');
                    btn.removeAttribute('aria-disabled');
                    btn.tabIndex = 0;
                }
            });
        });

        // ---- Картички: значка за попуст ----
        document.querySelectorAll('.card').forEach((card) => {
            const link = card.matches('a[href*="modeli/"]') ? card : card.querySelector('a[href*="modeli/"]');
            if (!link) return;
            const m = (link.getAttribute('href') || '').match(/modeli\/([^\/]+)\.html/);
            if (!m) return;
            const prod = window.MonetaData.products[m[1]];
            if (!prod) return;
            const price = Number(prod.price) || 0;
            const oldRaw = prod.old_price ? Number(prod.old_price) : 0;
            const discRaw = Number(prod.discount) || 0;
            const discPct = discRaw > 0 ? (discRaw < 100 ? discRaw : Math.round(discRaw / price * 100)) : 0;
            const old = oldRaw > price ? oldRaw : (discPct > 0 ? Math.round(price / (1 - discPct / 100)) : 0);
            const pct = old > price ? Math.round((old - price) / old * 100) : 0;
            // ВАЖНО: значката мора на .card (overflow:visible), НЕ на .card__image (overflow:hidden) — инаку долниот дел што виси надвор е отсечен
            const imgWrap = card;
            let badge = imgWrap.querySelector('.promo-badge--card');
            const showPct = discPct || pct;
            if (showPct > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'promo-badge promo-badge--card';
                    imgWrap.appendChild(badge);
                }
                badge.textContent = showPct + '%';
            } else if (badge) {
                badge.remove();
            }
        });
    };

    window.MonetaData.ready = (async () => {
        try {
            const [prods, sizes] = await Promise.all([
                fetch(url + '/rest/v1/products?select=*&order=sort_order', { headers }).then(r => r.json()),
                fetch(url + '/rest/v1/product_sizes?select=product_id,size,qty', { headers }).then(r => r.json())
            ]);
            const idToSlug = {};
            (prods || []).forEach(p => { window.MonetaData.products[p.slug] = p; idToSlug[p.id] = p.slug; });
            (sizes || []).forEach(s => {
                const slug = idToSlug[s.product_id];
                if (slug) (window.MonetaData.sizes[slug] = window.MonetaData.sizes[slug] || {})[s.size] = s.qty;
            });
            apply();
        } catch (e) {
            console.warn('Supabase data load error', e);
        }
    })();

    if (window.MonetaOnLangChange) window.MonetaOnLangChange(() => setTimeout(apply, 60));
    window.addEventListener('pageshow', () => { if (window.MonetaData.ready) window.MonetaData.ready.then(apply); });
    window.addEventListener('resize', () => { if (window.MonetaData.ready) window.MonetaData.ready.then(apply); });
})();

// ========================================
// СЛЕДЕЊЕ НА НАРАЧКА — форма за барање код за следење
// Клиентот внесува е-пошта → барањето оди до
// Supabase Edge Function (track-order) → се испраќа мејл до
// продавницата (info@calivita.mk), а продавачот рачно му го
// враќа кодот за следење на клиентскиот мејл.
// ========================================
(function initOrderTrackerForm() {
    const form = document.getElementById('orderTrackerForm');
    if (!form) return;

    const SUPABASE_URL = String(window.MONETA_SUPABASE_URL || '').replace(/\/+$/, '');
    const SHOP_EMAIL = window.MONETA_SHOP_EMAIL || 'nudalsmudals@gmail.com';
    const emailInput = document.getElementById('trackEmail');
    const feedback = document.getElementById('orderTrackerFeedback');

    const getLang = () => document.documentElement.lang === 'en' ? 'en' : 'mk';
    const KARGO_URL = 'https://www.kargoekspres.mk/ProverkaPratka.aspx';

    const setFeedback = (type, mkText, enText) => {
        if (!feedback) return;
        feedback.className = 'order-tracker__feedback is-' + type;
        feedback.innerHTML = '<span>' + (getLang() === 'en' ? enText : mkText) + '</span>';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const isEn = getLang() === 'en';

        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            setFeedback('error',
                'Ве молиме внесете валидна е-пошта адреса.',
                'Please enter a valid email address.');
            emailInput.focus();
            return;
        }

        if (!SUPABASE_URL) {
            // Fallback: отвори го мејл клиентот со готово барање до продавницата
            // (додека Supabase + Resend не се конфигурирани)
            const subject = encodeURIComponent('Барање за код за следење на нарачка');
            const body = encodeURIComponent(
                'Испратете ми код за следење на нарачката на мојот мејл.\n\n' +
                'Мојата е-пошта: ' + email + '\n\n' +
                'Линк за следење (залепете го кодот): ' + KARGO_URL
            );
            window.location.href = 'mailto:' + SHOP_EMAIL + '?subject=' + subject + '&body=' + body;
            setFeedback('success',
                'Вашата е-пошта програма се отвори со готово барање до ' + SHOP_EMAIL + '.',
                'Your email app opened with a ready request to ' + SHOP_EMAIL + '.');
            return;
        }

        const submitBtn = form.querySelector('.order-tracker__form-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
        }

        try {
            const res = await fetch(SUPABASE_URL + '/functions/v1/track-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                const link = '<a href="' + KARGO_URL + '" target="_blank" rel="noopener" style="color:#7ce38b;text-decoration:underline;font-weight:700;">' +
                    (isEn ? 'Track on Kargo Express' : 'Следете ја пратката на Карго Експрес') + '</a>';
                setFeedback('success',
                    'Вашето барање е испратено! Кодот за следење ќе го добиете на вашата е-пошта. ' + link,
                    'Your request has been sent! You will receive the tracking code on your email. ' + link);
                form.reset();
            } else {
                setFeedback('error',
                    'Настана грешка при испраќањето. Ве молиме обидете се повторно.',
                    'Something went wrong. Please try again.');
            }
        } catch (err) {
            setFeedback('error',
                'Настана грешка при испраќањето. Ве молиме обидете се повторно.',
                'Something went wrong. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '';
            }
        }
    });
})();

// ========================================
// МАРКЕТИНГ ИЗВЕСТУВАЊА (попупи) — социјален доказ + exit-intent + промо лента
// Конфигурација: CONFIG = { sales, exitIntent, promoBar } — true/false
// ========================================
(function initMarketingPopups() {
    const CONFIG = {
        sales: true,        // 🔔 Sales popup (социјален доказ)
        exitIntent: false,  // 🚪 Exit-intent popup (ТРГНАТ - барање на клиентот)
        promoBar: false,    // 🎀 Промо лента горе (ТРГНАТА - барање на клиентот)
    };
    const BASE = /\/modeli\//.test(window.location.pathname) ? '../' : './';
    const isEn = () => document.documentElement.lang === 'en';
    const isSq = () => document.documentElement.lang === 'sq';
    const t = (mk, sq, en) => (isEn() ? en : (isSq() ? sq : mk));

    // ---------- 1) Промо лента (горе, отстранлива) ----------
    function initPromoBar() {
        if (sessionStorage.getItem('moneta_promo_closed')) return;
        const bar = document.createElement('div');
        bar.id = 'monetaPromoBar';
        bar.className = 'moneta-promo-bar';
        bar.innerHTML =
            '<span class="moneta-promo-bar__text">' +
            t(
                '🎉 Попусти до −20% на избрани модели · Бесплатна достава над 1.000 ден.',
                '🎉 Zbritje deri −20% te modelet e zgjedhura · Transport falas mbi 1.000 den.',
                '🎉 Up to −20% off selected models · Free delivery over 1,000 MKD'
            ) +
            '</span>' +
            '<button type="button" class="moneta-promo-bar__close" aria-label="Затвори">×</button>';
        document.body.insertBefore(bar, document.body.firstChild);
        bar.querySelector('.moneta-promo-bar__close').addEventListener('click', () => {
            sessionStorage.setItem('moneta_promo_closed', '1');
            bar.remove();
        });
    }

    // ---------- 2) Sales popup (социјален доказ) ----------
    // Користи реални податоци од Supabase (MonetaData) — без фејк имиња.
    // Подоцна ќе се поврзе со реални нарачки од базата.
    const CITIES = ['Скопје', 'Битола', 'Охрид', 'Тетово', 'Куманово', 'Прилеп', 'Велес', 'Штип', 'Струмица', 'Гостивар'];
    let salesShown = 0;
    let salesTimer = null;

    function productPool() {
        const pool = [];
        if (window.MonetaData && Object.keys(window.MonetaData.products).length) {
            Object.values(window.MonetaData.products).forEach((p) => {
                if (p.active === false) return;
                pool.push({
                    name: isEn() ? (p.name_en || p.slug) : (p.name_mk || p.slug),
                    price: p.price || 0,
                    slug: p.slug,
                });
            });
        }
        if (pool.length >= 3) return pool;
        return [
            { name: 'Simona', price: 120, slug: 'simona' },
            { name: 'Carbon', price: 170, slug: 'carbon' },
            { name: 'Duck', price: 490, slug: 'duck' },
            { name: 'MEMOSOLE', price: 400, slug: 'memosole' },
            { name: 'Vital', price: 450, slug: 'vital' },
        ];
    }

    function showSalesToast() {
        if (!CONFIG.sales || salesShown >= 3) return;
        const pool = productPool();
        if (!pool.length) return;
        const prod = pool[Math.floor(Math.random() * pool.length)];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];

        const old = document.getElementById('monetaSalesToast');
        if (old) old.remove();
        const toast = document.createElement('div');
        toast.id = 'monetaSalesToast';
        toast.className = 'moneta-sales-toast';
        toast.innerHTML =
            '<img class="moneta-sales-toast__img" src="' + BASE + 'images/cards/' + prod.slug + '.webp" alt="" loading="lazy">' +
            '<div class="moneta-sales-toast__body">' +
                '<p class="moneta-sales-toast__title">' + t('⭐ Популарно', '⭐ Popullor', '⭐ Popular') + ' — ' + city + '</p>' +
                '<p class="moneta-sales-toast__text">' + prod.name + ' · ' + prod.price + ' ' + t('ден.', 'den.', 'MKD') + '</p>' +
            '</div>' +
            '<button type="button" class="moneta-sales-toast__close" aria-label="Затвори">×</button>';
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('is-visible'));
        const close = () => { toast.classList.remove('is-visible'); setTimeout(() => toast.remove(), 400); };
        toast.querySelector('.moneta-sales-toast__close').addEventListener('click', close);
        toast.addEventListener('click', (e) => {
            if (e.target.closest('.moneta-sales-toast__close')) return;
            window.location.href = BASE + 'modeli/' + prod.slug + '.html';
        });
        salesShown++;
        setTimeout(close, 7000);
        salesTimer = setTimeout(showSalesToast, 35000 + Math.random() * 15000);
    }

    // ---------- 3) Exit-intent popup ----------
    function showExitPopup() {
        const wrap = document.createElement('div');
        wrap.id = 'monetaExitPopup';
        wrap.className = 'moneta-exit';
        wrap.innerHTML =
            '<div class="moneta-exit__backdrop"></div>' +
            '<div class="moneta-exit__card">' +
                '<button type="button" class="moneta-exit__close" aria-label="Затвори">×</button>' +
                '<div class="moneta-exit__emoji">🦶</div>' +
                '<h3>' + t('Чекајте!', 'Prisni!', 'Wait!') + '</h3>' +
                '<p class="moneta-exit__title">' + t('Бесплатна достава', 'Transport falas', 'Free delivery') + '</p>' +
                '<p class="moneta-exit__sub">' + t('За нарачки над 1.000 ден. — низ цела Македонија.', 'Për porosi mbi 1.000 den. — në të gjithë Maqedoninë.', 'For orders over 1,000 MKD — across North Macedonia.') + '</p>' +
                '<a href="' + BASE + 'index.html#kategorii" class="moneta-exit__btn">' + t('Види ги влошките', 'Shiko tabanat', 'See the insoles') + '</a>' +
            '</div>';
        document.body.appendChild(wrap);
        requestAnimationFrame(() => wrap.classList.add('is-open'));
        const close = () => { wrap.classList.remove('is-open'); setTimeout(() => wrap.remove(), 300); };
        wrap.querySelector('.moneta-exit__close').addEventListener('click', close);
        wrap.querySelector('.moneta-exit__backdrop').addEventListener('click', close);
    }

    function initExitIntent() {
        let shown = false;
        document.addEventListener('mouseout', (e) => {
            if (shown || salesShown > 0) return;
            if (!e.relatedTarget && e.clientY < 10) {
                shown = true;
                showExitPopup();
            }
        });
        // fallback за мобилни: по 60 секунди, ако сè уште не е прикажан
        setTimeout(() => {
            if (!shown) { shown = true; showExitPopup(); }
        }, 60000);
    }

    // ---------- старт ----------
    function start() {
        if (CONFIG.promoBar) initPromoBar();
        if (CONFIG.sales) setTimeout(showSalesToast, 12000);
        if (CONFIG.exitIntent) setTimeout(initExitIntent, 5000);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();

