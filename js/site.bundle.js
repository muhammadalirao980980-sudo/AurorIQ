/* AurorIQ v6.23 shared bundle */
/* --- js/core/utils.js --- */
(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  function on(el, event, handler, options) {
    if (!el) return;
    el.addEventListener(event, handler, options);
  }

  function off(el, event, handler, options) {
    if (!el) return;
    el.removeEventListener(event, handler, options);
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function throttle(fn, wait) {
    let last = 0;
    let timer = null;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        clearTimeout(timer);
        last = now;
        fn.apply(this, args);
      } else {
        clearTimeout(timer);
        timer = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, remaining);
      }
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function roundTo(value, decimals) {
    const f = Math.pow(10, decimals || 0);
    return Math.round(value * f) / f;
  }

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function isTouchDevice() {
    return 'ontouchstart' in global || navigator.maxTouchPoints > 0;
  }

  function mq(query) {
    return global.matchMedia ? global.matchMedia(query).matches : false;
  }

  const breakpoints = { xs: 360, sm: 480, md: 768, lg: 1024, xl: 1280, xxl: 1536 };

  function breakpoint() {
    const w = global.innerWidth;
    if (w < breakpoints.sm) return 'xs';
    if (w < breakpoints.md) return 'sm';
    if (w < breakpoints.lg) return 'md';
    if (w < breakpoints.xl) return 'lg';
    if (w < breakpoints.xxl) return 'xl';
    return 'xxl';
  }

  function safeStorage(area) {
    return {
      get(key, fallback) {
        try {
          const raw = global[area].getItem(key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
          return fallback;
        }
      },
      set(key, value) {
        try {
          global[area].setItem(key, JSON.stringify(value));
          return true;
        } catch (e) {
          return false;
        }
      },
      remove(key) {
        try {
          global[area].removeItem(key);
          return true;
        } catch (e) {
          return false;
        }
      }
    };
  }

  const storage = safeStorage('localStorage');
  const session = safeStorage('sessionStorage');

  function qsParam(name, url) {
    try {
      const params = new URL(url || global.location.href).searchParams;
      return params.get(name);
    } catch (e) {
      return null;
    }
  }

  function uid(prefix) {
    const rand = Math.random().toString(36).slice(2, 9);
    return (prefix ? prefix + '_' : '') + Date.now().toString(36) + rand;
  }

  function formatNumber(n) {
    return new Intl.NumberFormat('en-US').format(n);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && global.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }

  function canNativeShare(data) {
    return typeof navigator.share === 'function' && (!data || !navigator.canShare || navigator.canShare(data));
  }

  async function nativeShare(data) {
    try {
      await navigator.share(data);
      return true;
    } catch (e) {
      return false;
    }
  }

  function animateValue(opts) {
    const from = opts.from;
    const to = opts.to;
    const duration = opts.duration;
    const ease = opts.ease || ((t) => 1 - Math.pow(1 - t, 4));
    const onUpdate = opts.onUpdate;
    const onComplete = opts.onComplete;

    if (prefersReducedMotion() || !duration) {
      onUpdate && onUpdate(to);
      onComplete && onComplete();
      return () => {};
    }

    const start = performance.now();
    let raf;

    function tick(now) {
      const elapsed = now - start;
      const t = clamp(elapsed / duration, 0, 1);
      const eased = ease(t);
      const value = lerp(from, to, eased);
      onUpdate && onUpdate(value);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete && onComplete();
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  function onIntersect(el, callback, options) {
    if (!('IntersectionObserver' in global) || !el) {
      callback();
      return () => {};
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) callback(entry);
      });
    }, options || { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }

  function trapFocus(container) {
    const focusable = $all('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container);
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  }

  AurorIQ.utils = {
    $: $,
    $all: $all,
    on: on,
    off: off,
    debounce: debounce,
    throttle: throttle,
    clamp: clamp,
    lerp: lerp,
    roundTo: roundTo,
    prefersReducedMotion: prefersReducedMotion,
    isTouchDevice: isTouchDevice,
    mq: mq,
    breakpoint: breakpoint,
    breakpoints: breakpoints,
    storage: storage,
    session: session,
    qsParam: qsParam,
    uid: uid,
    formatNumber: formatNumber,
    copyToClipboard: copyToClipboard,
    canNativeShare: canNativeShare,
    nativeShare: nativeShare,
    animateValue: animateValue,
    onIntersect: onIntersect,
    trapFocus: trapFocus
  };

})(window);

/* --- js/core/registry.js --- */
/* registry.js — the platform tool registry (v6).
 * Single source of truth for every instrument and category.
 *
 * Static-first rule: SEO-critical content is always written into HTML by hand
 * (search engines and AI crawlers must see it without JS). This registry powers
 * non-indexed dynamic surfaces (results-page cross-promotion, future dashboards)
 * and serves as the canonical checklist when adding pages.
 *
 * Adding a tool = one entry here + one page from docs/templates/tool-page.html.
 * See docs/ARCHITECTURE.md for the full 4-step procedure.
 */
(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const CATEGORIES = {
    cognition: {
      slug: 'cognition',
      name: 'Cognition',
      url: '/cognition/',
      tagline: 'Measure the shape of your mind',
      status: 'live'
    },
    psychology: {
      slug: 'psychology',
      name: 'Psychology',
      url: 'https://personica.net/?ref=auroriq',
      external: true,
      tagline: 'Understand the machinery behind the mind',
      status: 'live'
    },
    learning: {
      slug: 'learning',
      name: 'Learning',
      url: '/learning/',
      tagline: 'Learn the way your brain actually works',
      status: 'live'
    },
    career: {
      slug: 'career',
      name: 'Career',
      url: '/career/',
      tagline: 'Point your mind at the right problems',
      status: 'live'
    },
    productivity: {
      slug: 'productivity',
      name: 'Productivity',
      url: '/productivity/',
      tagline: 'Turn insight into output',
      status: 'live'
    }
  };

  /* status: 'live' (on this site) | 'external' (sister instrument) | 'dev' */
  const TOOLS = [
    {
      id: 'iq-test',
      name: 'Adaptive IQ Test',
      url: '/iq-test/',
      category: 'cognition',
      status: 'live',
      duration: '~15 min',
      tagline: 'The flagship instrument',
      description: '25 adaptive questions across five reasoning domains — a model-based estimate, an uncertainty range, and a cognitive archetype.'
    },
    {
      id: 'personality',
      name: 'Personality (Big Five)',
      url: 'https://personica.net/?ref=auroriq',
      category: 'psychology',
      status: 'external',
      duration: '~12 min',
      tagline: 'On Personica, our sister instrument',
      description: 'The OCEAN model across sixteen archetypes, with career signals.'
    },
    {
      id: 'memory-test',
      name: 'Memory Test',
      url: '/memory-test/',
      category: 'cognition',
      status: 'live',
      duration: '~5 min',
      tagline: 'Working-memory span',
      description: 'The classic digit-span task, forward and backward, scored against approximate adult norms.'
    },
    {
      id: 'processing-speed',
      name: 'Reaction Time Test',
      url: '/reaction-time-test/',
      category: 'cognition',
      status: 'live',
      duration: '~2 min',
      tagline: 'Simple visual reaction time',
      description: 'Simple visual reaction time — five scored trials, median result against approximate adult norms.'
    },
    {
      id: 'perceptual-speed',
      name: 'Processing Speed Test',
      url: '/processing-speed-test/',
      category: 'cognition',
      status: 'live',
      duration: '~2 min',
      tagline: 'Same/different throughput, timed',
      description: 'A timed same/different comparison task measuring processing speed — cognitive throughput, not just reaction time.'
    },
    {
      id: 'logical-reasoning',
      name: 'Logical Reasoning Test',
      url: '/logical-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~5 min',
      tagline: 'Series, syllogisms, deduction',
      description: 'A difficulty-weighted fluid-reasoning test spanning series, syllogisms, deduction, and odd-one-out.'
    },
    {
      id: 'spatial-test',
      name: 'Spatial Reasoning Test',
      url: '/spatial-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~4 min',
      tagline: 'Mental rotation, measured exactly',
      description: 'A same-or-mirror mental-rotation task with procedurally generated shapes and exact ground truth.'
    },
    {
      id: 'verbal-test',
      name: 'Verbal Reasoning Test',
      url: '/verbal-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~5 min',
      tagline: 'Analogies, synonyms, antonyms',
      description: 'A difficulty-weighted verbal reasoning test drawn from an authored item bank.'
    },
    {
      id: 'numerical-reasoning',
      name: 'Numerical Reasoning Test',
      url: '/numerical-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~6 min',
      tagline: 'Series, ratios, word problems',
      description: 'A difficulty-weighted quantitative reasoning test — number series, arithmetic, ratios, and data.'
    },
    {
      id: 'creativity-test',
      name: 'Creativity Test',
      url: '/creativity-test/',
      category: 'cognition',
      status: 'live',
      duration: '2 min',
      tagline: 'Divergent thinking, honestly scored',
      description: 'The Alternate Uses Task — timed divergent-thinking fluency, with originality openly not faked.'
    },
    {
      id: 'study-habits',
      name: 'Study Habits Test',
      url: '/study-habits-test/',
      category: 'learning',
      status: 'live',
      duration: '~4 min',
      tagline: 'How you study vs what works',
      description: 'A 20-item check of your study habits against evidence-based learning techniques.'
    },
    {
      id: 'study-planner',
      name: 'Study Planner',
      url: '/study-planner/',
      category: 'learning',
      status: 'live',
      duration: '~2 min',
      tagline: 'A spaced-repetition schedule',
      description: 'Turns your topics and exam date into an expanding-interval review schedule.'
    },
    { id: 'learning-style',     name: 'Learning Style',         url: null, category: 'learning',     status: 'dev', description: 'How you actually absorb new material.' },
    {
      id: 'reading-speed',
      name: 'Reading Speed Test',
      url: '/reading-speed-test/',
      category: 'learning',
      status: 'live',
      duration: '~4 min',
      tagline: 'Words per minute, comprehension-checked',
      description: 'Timed reading of an original passage, gated by a five-question comprehension check.'
    },
    {
      id: 'focus-assessment',
      name: 'Focus Test',
      url: '/focus-test/',
      category: 'learning',
      status: 'live',
      duration: '~3 min',
      tagline: 'Sustained attention, measured not guessed',
      description: 'A Go/No-Go continuous-performance task measuring vigilance, impulse control, and response consistency.'
    },
    {
      id: 'career-match',
      name: 'Career Interest Profiler',
      url: '/career-interest-test/',
      category: 'career',
      status: 'live',
      duration: '~5 min',
      tagline: 'RIASEC interests, Holland Code',
      description: 'A 30-item RIASEC interest inventory — maps what work draws you and gives your Holland Code.'
    },
    {
      id: 'work-values',
      name: 'Work Values Profiler',
      url: '/work-values-test/',
      category: 'career',
      status: 'live',
      duration: '~5 min',
      tagline: 'What you need from work',
      description: 'A 30-item work-values inventory — ranks the six needs that drive your job satisfaction.'
    },
    {
      id: 'work-style',
      name: 'Work Style Profiler',
      url: '/work-style-test/',
      category: 'career',
      status: 'live',
      duration: '~4 min',
      tagline: 'How you prefer to work',
      description: 'A 24-item bipolar profiler across six working-preference spectrums — no type, no good or bad.'
    },
    {
      id: 'interview-readiness',
      name: 'Interview Readiness Check',
      url: '/interview-readiness-test/',
      category: 'career',
      status: 'live',
      duration: '~4 min',
      tagline: 'Preparation, honestly scored',
      description: 'A practical readiness check across research, stories, questions, logistics, and rehearsal — not a personality test.'
    },
    {
      id: 'chronotype',
      name: 'Chronotype Test',
      url: '/chronotype-test/',
      category: 'productivity',
      status: 'live',
      duration: '~2 min',
      tagline: 'Night owl or early bird',
      description: 'A 9-item morningness–eveningness test — finds your chronotype and peak-focus window.'
    },
    {
      id: 'habit-analyzer',
      name: 'Habit Analyzer',
      url: '/habit-analyzer/',
      category: 'productivity',
      status: 'live',
      duration: '~3 min',
      tagline: 'Will your habit stick?',
      description: 'A 20-item check of how well a habit is designed to stick, across five evidence-based factors.'
    },
    {
      id: 'time-audit',
      name: 'Time Audit',
      url: '/time-audit/',
      category: 'productivity',
      status: 'live',
      duration: '~3 min',
      tagline: 'Where your 168 hours go',
      description: 'An interactive weekly time allocator — see the real shape of your week, honestly.'
    }
  ];

  function byCategory(slug) {
    return TOOLS.filter(function (t) { return t.category === slug; });
  }
  function live() {
    return TOOLS.filter(function (t) { return t.status === 'live' || t.status === 'external'; });
  }
  function get(id) {
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i];
    return null;
  }

  AurorIQ.registry = {
    categories: CATEGORIES,
    tools: TOOLS,
    byCategory: byCategory,
    live: live,
    get: get
  };

  /* Node/test export without affecting the browser IIFE */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.registry;
  }
})(typeof window !== 'undefined' ? window : globalThis);

/* --- js/main.js --- */
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

/* --- js/ecosystem.js --- */
(function (global, document) {
  'use strict';
  const KEY = 'auroriq_recent_tools_v1';
  const A = global.AurorIQ || (global.AurorIQ = {});

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function normalizedPath() {
    let p = global.location.pathname || '/';
    if (!p.endsWith('/') && !p.endsWith('.html')) p += '/';
    return p;
  }

  function currentTool() {
    const reg = A.registry;
    if (!reg || !reg.tools) return null;
    let path = normalizedPath();
    if (path === '/iq-test/results/') path = '/iq-test/';
    return reg.tools.find(t => t.url === path && (t.status === 'live' || t.status === 'external')) || null;
  }

  function activeSection() {
    const path = normalizedPath();
    const tool = currentTool();
    if (tool) return tool.category;
    if (path.startsWith('/cognition/') || path.startsWith('/iq-scores/')) return 'cognition';
    if (path.startsWith('/career/')) return 'career';
    if (path.startsWith('/learning/')) return 'learning';
    if (path.startsWith('/productivity/')) return 'productivity';
    if (path.startsWith('/blog/')) return 'learn';
    if (path === '/' || path === '/tests/') return 'suite';
    return null;
  }

  function markNavigation() {
    const section = activeSection();
    if (!section) return;
    document.querySelectorAll('[data-nav-section]').forEach(a => {
      if (a.getAttribute('data-nav-section') === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function readRecent() {
    try {
      const v = JSON.parse(global.localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter(x => x && typeof x.url === 'string' && x.url.startsWith('/') && x.name).slice(0, 4) : [];
    } catch (e) { return []; }
  }

  function recordTool() {
    const tool = currentTool();
    if (!tool || tool.external) return;
    try {
      const recent = readRecent().filter(x => x.url !== tool.url);
      recent.unshift({ id: tool.id, name: tool.name, url: tool.url, category: tool.category, description: tool.tagline || tool.description || '' });
      global.localStorage.setItem(KEY, JSON.stringify(recent.slice(0, 4)));
    } catch (e) {}
  }

  function titleCase(s) { return String(s || '').replace(/(^|[-_\s])\w/g, m => m.toUpperCase()).replace(/[-_]/g, ' '); }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderRecent404() {
    const mount = document.querySelector('[data-recent-tools]');
    if (!mount) return;
    const recent = readRecent();
    if (!recent.length) return; // preserve useful static fallback
    mount.innerHTML = recent.slice(0, 3).map(item =>
      '<a class="recovery-card" href="' + escapeHtml(item.url) + '">' +
      '<span>' + escapeHtml(titleCase(item.category)) + '</span>' +
      '<strong>' + escapeHtml(item.name) + '</strong>' +
      '<small>' + escapeHtml(item.description || 'Continue this AurorIQ instrument.') + '</small></a>'
    ).join('');
  }

  function searchCatalog() {
    const reg = A.registry;
    if (!reg) return [];
    const rows = [];
    Object.keys(reg.categories || {}).forEach(k => {
      const c = reg.categories[k];
      if (c.status !== 'live') return;
      rows.push({ name: c.name + ' Hub', url: c.url, kind: 'Hub', category: c.name, text: [c.name, c.tagline, k, 'hub suite'].join(' ').toLowerCase() });
    });
    (reg.tools || []).forEach(t => {
      if ((t.status !== 'live' && t.status !== 'external') || !t.url) return;
      rows.push({ name: t.name, url: t.url, kind: 'Assessment', category: titleCase(t.category), text: [t.name, t.tagline, t.description, t.category].join(' ').toLowerCase() });
    });
    rows.push({ name:'AurorIQ Methodology', url:'/about-our-test/', kind:'Guide', category:'Trust', text:'methodology scoring validity reliability psychometric how test works' });
    return rows;
  }

  function rank(row, q) {
    const name = row.name.toLowerCase();
    if (name === q) return 100;
    if (name.startsWith(q)) return 70;
    if (name.includes(q)) return 50;
    if (row.text.includes(q)) return 25;
    return 0;
  }

  function init404Search() {
    const form = document.querySelector('[data-suite-search]');
    const input = document.querySelector('[data-suite-search-input]');
    const out = document.querySelector('[data-suite-search-results]');
    if (!form || !input || !out) return;
    const catalog = searchCatalog();
    let results = [];

    function update() {
      const q = input.value.trim().toLowerCase();
      if (!q) { out.innerHTML = ''; results = []; return; }
      results = catalog.map(row => ({ row, score: rank(row, q) })).filter(x => x.score > 0).sort((a,b) => b.score-a.score || a.row.name.localeCompare(b.row.name)).slice(0, 6).map(x => x.row);
      out.innerHTML = results.length ? results.map(r => '<a class="error-search__result" href="' + r.url + '"><span><strong>' + r.name + '</strong><br><small>' + r.kind + ' · ' + r.category + '</small></span><span aria-hidden="true">→</span></a>').join('') : '<p class="error-search__result">No close match. Try “career”, “IQ”, “focus”, or “chronotype”.</p>';
    }
    input.addEventListener('input', update);
    form.addEventListener('submit', e => {
      e.preventDefault();
      update();
      if (results[0]) global.location.href = results[0].url;
    });
  }

  ready(function () {
    markNavigation();
    recordTool();
    renderRecent404();
    init404Search();
  });
})(window, document);

/* --- js/consent.js --- */
/* consent.js — site-level consent UI with Google Consent Mode v2
 * IMPORTANT: this custom banner is NOT a Google-certified TCF CMP. Configure
 * Google Privacy & Messaging or another Google-certified CMP for personalized
 * AdSense traffic in the EEA, UK, and Switzerland.
 *
 * Legacy note: GDPR/CCPA cookie consent with Google Consent Mode v2
 * Analytics loads after consent. Public releases include a static AdSense tag
 * with ad requests paused until consent.
 * Consent defaults are pushed to the dataLayer before any tag loads,
 * so gtag.js picks them up whenever it is injected. */
(function () {
  'use strict';
  var CONSENT_KEY = 'auroriq_consent';
  var GA_ID = 'G-50T6XM1Z3P';
  var ADSENSE_PUB = 'ca-pub-2335913078491957';

  /* ---- Consent Mode v2 plumbing ---- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  var PUBLIC_HOSTS = ['auroriq.com', 'www.auroriq.com'];
  function isPublicHost() { return PUBLIC_HOSTS.indexOf(window.location.hostname) !== -1; }

  // v2 defaults: everything denied until the visitor decides.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('js', new Date());

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* silent */ }
  }

  function grantSignals() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      // Personalization remains denied in this custom UI. A Google-certified
      // TCF CMP should control these signals where personalized ads are used.
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
      functionality_storage: 'granted'
    });
  }

  function denySignals() {
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied'
    });
  }

  /* ---- Conditional script loading ---- */
  function loadGA() {
    if (!isPublicHost()) return;
    window['ga-disable-' + GA_ID] = false;
    if (document.querySelector('script[src*="googletagmanager"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function initManualAds() {
    var units = document.querySelectorAll('.ad-slot[data-ad-state="live"] ins.adsbygoogle');
    for (var i = 0; i < units.length; i++) {
      if (units[i].getAttribute('data-ad-initialized') === 'true') continue;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        units[i].setAttribute('data-ad-initialized', 'true');
      } catch (e) { /* AdSense may not be ready yet; script load will retry on next page view. */ }
    }
  }

  function loadAdSense() {
    if (!isPublicHost()) return;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = 1;
    window.adsbygoogle.pauseAdRequests = 0;
    // Load the site-wide publisher script after consent, even without manual slots.
    if (document.querySelector('script[src*="adsbygoogle"]')) { initManualAds(); return; }
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUB;
    s.onload = initManualAds;
    document.head.appendChild(s);
  }

  /* ---- Banner actions ---- */
  function accept() {
    setConsent('granted');
    grantSignals();
    loadGA();
    loadAdSense();
    hideBanner();
  }

  function reject() {
    var wasLoaded = !!document.querySelector('script[src*="googletagmanager"]') || !!document.querySelector('script[src*="adsbygoogle"]');
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.pauseAdRequests = 1;
    setConsent('denied');
    window['ga-disable-' + GA_ID] = true;
    denySignals();
    document.cookie.split(';').forEach(function (entry) {
      var name = entry.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat)/.test(name)) return;
      var parts = window.location.hostname.split('.');
      document.cookie = name + '=; Max-Age=0; path=/';
      while (parts.length > 1) {
        var domain = parts.join('.');
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + domain;
        parts.shift();
      }
    });
    hideBanner();
    if (wasLoaded) window.location.reload();
  }

  function hideBanner() {
    var b = document.getElementById('consentBanner');
    if (b) { b.classList.remove('is-visible'); setTimeout(function () { b.remove(); }, 400); }
  }

  function showBanner() {
    var b = document.getElementById('consentBanner');
    if (b) requestAnimationFrame(function () { b.classList.add('is-visible'); });
  }

  /* Re-open banner (consent withdrawal / change) — rebuilds it if it was removed. */
  function reopenBanner() {
    var b = document.getElementById('consentBanner');
    if (!b) {
      b = document.createElement('div');
      b.className = 'consent-banner';
      b.id = 'consentBanner';
      b.setAttribute('role', 'dialog');
      b.setAttribute('aria-label', 'Cookie consent');
      b.innerHTML =
        '<p>We use cookies for analytics and advertising to keep AurorIQ free. ' +
        'You can accept or decline non-essential cookies. ' +
        '<a href="/privacy-policy/">Learn more</a></p>' +
        '<div class="consent-banner__actions">' +
        '<button class="consent-banner__btn consent-banner__btn--reject" id="consentReject" type="button">Decline</button>' +
        '<button class="consent-banner__btn consent-banner__btn--accept" id="consentAccept" type="button">Accept</button>' +
        '</div>';
      document.body.appendChild(b);
      wireButtons();
    }
    showBanner();
  }

  function wireButtons() {
    var acceptBtn = document.getElementById('consentAccept');
    var rejectBtn = document.getElementById('consentReject');
    if (acceptBtn) acceptBtn.addEventListener('click', accept);
    if (rejectBtn) rejectBtn.addEventListener('click', reject);
  }

  function init() {
    var consent = getConsent();
    if (consent === 'granted') {
      grantSignals();
      loadGA();
      loadAdSense();
      var b = document.getElementById('consentBanner');
      if (b) b.remove();
      return;
    }
    if (consent === 'denied') {
      var b2 = document.getElementById('consentBanner');
      if (b2) b2.remove();
      return;
    }
    showBanner();
  }

  // Public API + withdrawal links: any element with [data-consent-open]
  window.AurorConsent = { open: reopenBanner };

  document.addEventListener('DOMContentLoaded', function () {
    wireButtons();
    var openers = document.querySelectorAll('[data-consent-open]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].addEventListener('click', function (e) {
        e.preventDefault();
        reopenBanner();
      });
    }
    init();
  });
})();

/* --- js/theme.js --- */
/* theme.js — theme toggle wiring (the no-flash setter runs inline in <head>) */
(function () {
  'use strict';
  var KEY = 'auroriq_theme';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* silent */ }
  }

  // Effective current theme, accounting for "no explicit choice = follow system".
  function effective() {
    var pref = stored();
    if (pref === 'light' || pref === 'dark') return pref;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var color = theme === 'light' ? '#f7f7fb' : '#08080f';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute('content', color);
    }
  }

  function labelFor(theme) {
    return theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  }

  function syncButtons(theme) {
    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-label', labelFor(theme));
      btns[i].setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }
  }

  function toggle() {
    var next = effective() === 'light' ? 'dark' : 'light';
    store(next);
    apply(next);
    syncButtons(next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var current = effective();
    apply(current);
    syncButtons(current);

    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', toggle);
    }

    // If following system (no explicit choice), react to OS theme changes live.
    try {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
        if (!stored()) {
          var t = effective();
          apply(t);
          syncButtons(t);
        }
      });
    } catch (e) { /* older browsers: ignore */ }
  });
})();
