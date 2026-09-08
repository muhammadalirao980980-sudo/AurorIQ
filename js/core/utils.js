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
