(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  const utils = AurorIQ.utils;

  function initTouchDetection() {
    if (utils.isTouchDevice()) {
      document.documentElement.setAttribute('data-touch', '');
    }
  }

  function initNavScroll() {
    const nav = utils.$('[data-nav]');
    if (!nav) return;

    const onScroll = utils.throttle(() => {
      if (global.scrollY > 12) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    }, 100);

    onScroll();
    utils.on(global, 'scroll', onScroll, { passive: true });
  }

  function initMobileMenu() {
    const toggle = utils.$('[data-nav-toggle]');
    const menu = utils.$('[data-nav-menu]');
    if (!toggle || !menu) return;

    let releaseFocusTrap = null;

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      releaseFocusTrap = utils.trapFocus(menu);
    }

    function closeMenu(returnFocus) {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (releaseFocusTrap) {
        releaseFocusTrap();
        releaseFocusTrap = null;
      }
      if (returnFocus) toggle.focus();
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    utils.on(toggle, 'click', () => {
      isOpen() ? closeMenu(false) : openMenu();
    });

    utils.on(menu, 'click', (e) => {
      if (e.target.tagName === 'A') closeMenu(false);
    });

    utils.on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) closeMenu(true);
    });

    utils.on(global, 'resize', utils.debounce(() => {
      if (global.innerWidth >= utils.breakpoints.lg && isOpen()) closeMenu(false);
    }, 150));
  }

  function initAnchorScroll() {
    const nav = utils.$('[data-nav]');

    utils.on(document, 'click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = utils.$(id);
      if (!target) return;

      e.preventDefault();
      const offset = nav ? nav.offsetHeight + 12 : 0;
      const top = target.getBoundingClientRect().top + global.scrollY - offset;

      global.scrollTo({
        top: top,
        behavior: utils.prefersReducedMotion() ? 'auto' : 'smooth'
      });

      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  function initFaqAccordion() {
    const items = utils.$all('.faq__item');
    if (!items.length) return;

    items.forEach((item) => {
      utils.on(item, 'toggle', () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  function initScrollReveal() {
    const targets = utils.$all('[data-reveal]');
    if (!targets.length) return;

    targets.forEach((el, index) => {
      el.style.setProperty('--reveal-delay', (index % 6) * 60 + 'ms');
      utils.onIntersect(el, () => {
        el.classList.add('is-inview');
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    });
  }

  function init() {
    if (!utils) return;
    initTouchDetection();
    initNavScroll();
    initMobileMenu();
    initAnchorScroll();
    initFaqAccordion();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
