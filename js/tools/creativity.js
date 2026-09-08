/* creativity.js — Divergent Thinking instrument (v6.8).
 * The Alternate Uses Task: given a common object, list as many different uses
 * as you can before time runs out. It's the classic measure of divergent
 * thinking — one facet of creativity.
 *
 * HONESTY NOTE (BRAND.md §4-5): true creativity scoring needs originality —
 * how unusual each idea is versus everyone else's — which requires a large
 * normative dataset or human judgement. This tool runs entirely on-device, so
 * it CANNOT compute originality honestly and does not pretend to. It measures
 * two things it CAN measure objectively:
 *   - Fluency: how many valid, distinct ideas you produced.
 *   - Variety: how many different starting approaches those ideas took (a rough
 *     flexibility proxy, labelled as such).
 * Fluency is placed against approximate adult norms; originality is discussed,
 * never scored. Saying "we can't measure this part" is the honest move.
 *
 * On-device only. Prompts are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const TIME_MS = 120000;                 /* two minutes */
  const NORMS = { mean: 10, sd: 4 };      /* approx adult AUT fluency in ~2 min */

  const PROMPTS = [
    { object: 'a paperclip', hint: 'Think past holding paper together.' },
    { object: 'a brick', hint: 'It doesn\u2019t have to be a wall.' },
    { object: 'an empty glass bottle', hint: 'Whole, broken, filled, or repurposed.' },
    { object: 'a wooden spoon', hint: 'Kitchens are only the start.' },
    { object: 'a newspaper', hint: 'Reading is the obvious one \u2014 skip it.' },
    { object: 'a bicycle tire', hint: 'On or off the bike.' }
  ];

  /* words too generic to count as a distinct "approach" head */
  const STOPWORDS = { 'a': 1, 'an': 1, 'the': 1, 'to': 1, 'as': 1, 'for': 1, 'use': 1, 'used': 1, 'using': 1, 'it': 1, 'something': 1, 'make': 1, 'makes': 1, 'making': 1 };

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function normalize(text) {
    return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function isValid(text) {
    const t = normalize(text);
    return t.length >= 2 && /[a-z]/.test(t);
  }

  function tokenKey(text) {
    /* order-independent token set, so "cut a rope" == "rope cut" as duplicates */
    return normalize(text)
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .sort()
      .join(' ');
  }

  /* Return the distinct, valid ideas from raw lines. */
  function dedupe(lines) {
    const seen = {};
    const out = [];
    lines.forEach(function (line) {
      if (!isValid(line)) return;
      const key = tokenKey(line);
      if (key && !seen[key]) { seen[key] = 1; out.push(normalize(line)); }
    });
    return out;
  }

  /* First meaningful (non-stopword) token of an idea — a rough "approach" head. */
  function headWord(text) {
    const toks = normalize(text).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
    for (let i = 0; i < toks.length; i++) {
      if (!STOPWORDS[toks[i]]) return toks[i];
    }
    return toks[0] || '';
  }

  function scoreSession(lines) {
    const stats = AurorIQ.stats;
    const ideas = dedupe(lines);
    const fluency = ideas.length;
    const heads = {};
    ideas.forEach(function (i) { const h = headWord(i); if (h) heads[h] = 1; });
    const variety = Object.keys(heads).length;
    const percentile = fluency > 0 ? stats.percentile(fluency, NORMS.mean, NORMS.sd) : 1;
    return {
      ideas: ideas,
      fluency: fluency,
      variety: variety,
      percentile: percentile
    };
  }

  AurorIQ.creativityEngine = {
    TIME_MS: TIME_MS,
    NORMS: NORMS,
    PROMPTS: PROMPTS,
    normalize: normalize,
    isValid: isValid,
    tokenKey: tokenKey,
    dedupe: dedupe,
    headWord: headWord,
    scoreSession: scoreSession,
    pickPrompt: function (rand) {
      const r = rand || Math.random;
      return PROMPTS[Math.floor(r() * PROMPTS.length)];
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.creativityEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-creativity-app]');
  if (!root) return;

  const timeMs = parseInt(root.getAttribute('data-time-ms'), 10) || TIME_MS;

  const els = {
    screens: {},
    object: root.querySelector('[data-cr-object]'),
    hint: root.querySelector('[data-cr-hint]'),
    input: root.querySelector('[data-cr-input]'),
    timer: root.querySelector('[data-cr-timer]'),
    count: root.querySelector('[data-cr-count]'),
    results: {
      fluency: root.querySelector('[data-res-fluency]'),
      variety: root.querySelector('[data-res-variety]'),
      pct: root.querySelector('[data-res-pct]'),
      list: root.querySelector('[data-res-list]')
    }
  };
  root.querySelectorAll('[data-cr-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-cr-screen')] = el;
  });

  let prompt = null;
  let endsAt = 0;
  let tick = null;

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

  function liveCount() {
    const lines = els.input.value.split('\n');
    const ideas = AurorIQ.creativityEngine.dedupe(lines);
    els.count.textContent = ideas.length + (ideas.length === 1 ? ' idea' : ' ideas');
  }

  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function updateTimer() {
    const left = endsAt - Date.now();
    els.timer.textContent = fmt(left);
    if (left <= 0) { finish(); return; }
    els.timer.classList.toggle('cr-timer--low', left <= 15000);
  }

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  function finish() {
    clearInterval(tick);
    els.input.setAttribute('disabled', 'disabled');
    const r = AurorIQ.creativityEngine.scoreSession(els.input.value.split('\n'));
    els.results.fluency.textContent = String(r.fluency);
    els.results.variety.textContent = String(r.variety);
    els.results.pct.textContent = r.fluency > 0 ? '~' + r.percentile + ordinal(r.percentile) : '\u2014';
    els.results.list.innerHTML = '';
    r.ideas.forEach(function (idea) {
      const li = document.createElement('li');
      li.textContent = idea;
      els.results.list.appendChild(li);
    });
    show('results');
  }

  function start() {
    prompt = AurorIQ.creativityEngine.pickPrompt();
    els.object.textContent = prompt.object;
    els.hint.textContent = prompt.hint;
    els.input.value = '';
    els.input.removeAttribute('disabled');
    els.count.textContent = '0 ideas';
    show('play');
    els.input.focus();
    endsAt = Date.now() + timeMs;
    updateTimer();
    clearInterval(tick);
    tick = setInterval(updateTimer, 250);
  }

  els.input.addEventListener('input', liveCount);
  root.querySelectorAll('[data-cr-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-cr-done]').forEach(function (b) { b.addEventListener('click', finish); });
  root.querySelectorAll('[data-cr-retry]').forEach(function (b) {
    b.addEventListener('click', function () { clearInterval(tick); show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
