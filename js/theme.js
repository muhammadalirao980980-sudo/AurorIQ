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
