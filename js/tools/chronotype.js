/* chronotype.js — Chronotype (morningness–eveningness) instrument (v6.10).
 * Circadian preference is real, partly heritable science: some people are
 * genuinely sharper in the morning, others at night, and matching demanding
 * work to your peak window is one of the few evidence-backed productivity levers.
 *
 * This is an ORIGINAL questionnaire inspired by the morningness–eveningness
 * literature — it does not reproduce the MEQ or rMEQ. Nine items score toward
 * "morningness"; the total maps to a chronotype band with peak-window guidance.
 *
 * HONESTY NOTE (BRAND.md §5): this is a self-report snapshot, not a sleep-
 * disorder screen or a clinical circadian assessment. Chronotype shifts with
 * age, season, and habit. Guidance is general, and results say so.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  /* Each option carries m = morningness points (0 = strong evening … 4 = strong morning). */
  const BANK = [
    { q: 'If you were completely free to plan your day, when would you naturally wake up?',
      options: [
        { label: 'Before 6:00 am', m: 4 },
        { label: '6:00 – 7:30 am', m: 3 },
        { label: '7:30 – 9:30 am', m: 2 },
        { label: '9:30 – 11:00 am', m: 1 },
        { label: 'After 11:00 am', m: 0 }
      ] },
    { q: 'And when would you naturally choose to go to sleep?',
      options: [
        { label: 'Before 9:30 pm', m: 4 },
        { label: '9:30 – 10:45 pm', m: 3 },
        { label: '10:45 pm – 12:30 am', m: 2 },
        { label: '12:30 – 2:00 am', m: 1 },
        { label: 'After 2:00 am', m: 0 }
      ] },
    { q: 'In the first half hour after waking, how alert do you feel?',
      options: [
        { label: 'Very alert', m: 4 },
        { label: 'Fairly alert', m: 3 },
        { label: 'A bit foggy', m: 2 },
        { label: 'Quite groggy', m: 1 },
        { label: 'Barely functional', m: 0 }
      ] },
    { q: 'When do you feel at your mental peak?',
      options: [
        { label: 'Early morning', m: 4 },
        { label: 'Late morning', m: 3 },
        { label: 'Afternoon', m: 2 },
        { label: 'Evening', m: 1 },
        { label: 'Late night', m: 0 }
      ] },
    { q: 'You must do two hours of demanding mental work. When would you choose?',
      options: [
        { label: '6 – 9 am', m: 4 },
        { label: '9 am – 12 pm', m: 3 },
        { label: '1 – 4 pm', m: 2 },
        { label: '5 – 8 pm', m: 1 },
        { label: '9 pm – midnight', m: 0 }
      ] },
    { q: 'How hard is it to get out of bed on a normal morning?',
      options: [
        { label: 'Very easy', m: 4 },
        { label: 'Fairly easy', m: 3 },
        { label: 'Neither easy nor hard', m: 2 },
        { label: 'Fairly hard', m: 1 },
        { label: 'Very hard', m: 0 }
      ] },
    { q: 'By late evening (after 10 pm), how do you usually feel?',
      options: [
        { label: 'Already tired, ready for bed', m: 4 },
        { label: 'Winding down', m: 3 },
        { label: 'Neither tired nor energized', m: 2 },
        { label: 'Getting a second wind', m: 1 },
        { label: 'The most energized part of my day', m: 0 }
      ] },
    { q: 'With no obligations tomorrow, your sleep schedule would…',
      options: [
        { label: 'Stay about the same', m: 4 },
        { label: 'Shift a little later', m: 3 },
        { label: 'Shift moderately later', m: 2 },
        { label: 'Shift a lot later', m: 1 },
        { label: 'Become almost nocturnal', m: 0 }
      ] },
    { q: 'When would you prefer to do a hard workout?',
      options: [
        { label: 'Early morning', m: 4 },
        { label: 'Mid-morning', m: 3 },
        { label: 'Afternoon', m: 2 },
        { label: 'Early evening', m: 1 },
        { label: 'Late evening', m: 0 }
      ] }
  ];

  /* bands by morningness percentage (0 = strong evening … 100 = strong morning) */
  const BANDS = [
    { key: 'def-eve', label: 'Definite Evening Type', nickname: 'Night Owl', min: 0, max: 24,
      peak: 'late afternoon into the evening',
      guidance: 'Your sharpest hours come late. Protect the evening for demanding work, defend your mornings with a gentle start, and resist scheduling anything that needs peak focus before mid-morning.' },
    { key: 'mod-eve', label: 'Moderate Evening Type', nickname: 'Leaning Owl', min: 25, max: 41,
      peak: 'afternoon and early evening',
      guidance: 'You lean toward the evening but aren\u2019t extreme. Put creative or deep work after lunch, keep mornings for routine tasks, and avoid judging your early-day slowness as laziness \u2014 it\u2019s biology.' },
    { key: 'inter', label: 'Intermediate Type', nickname: 'Flexible', min: 42, max: 58,
      peak: 'late morning through mid-afternoon',
      guidance: 'You have no strong pull either way, which is a real advantage: you can schedule demanding work across a wide midday window. Watch your own energy for a week to find your personal sweet spot.' },
    { key: 'mod-morn', label: 'Moderate Morning Type', nickname: 'Leaning Lark', min: 59, max: 75,
      peak: 'mid-morning',
      guidance: 'You come alive earlier than most. Front-load your hardest work into the morning, guard that window from meetings, and let the late afternoon carry lighter, more routine tasks.' },
    { key: 'def-morn', label: 'Definite Morning Type', nickname: 'Early Bird', min: 76, max: 100,
      peak: 'the early morning',
      guidance: 'Your peak is early and clear. The first few hours after waking are your most valuable of the day \u2014 spend them on your single most important task, and don\u2019t save hard thinking for an evening that won\u2019t deliver.' }
  ];

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function buildTest() {
    /* fixed order — times read naturally ascending; no shuffle needed */
    return BANK.map(function (it) {
      return { q: it.q, options: it.options.map(function (o) { return { label: o.label, m: o.m }; }) };
    });
  }

  function maxScore(items) {
    items = Array.isArray(items) ? items : [];
    return items.reduce(function (sum, it) {
      if (!it || !Array.isArray(it.options) || !it.options.length) return sum;
      return sum + Math.max.apply(null, it.options.map(function (o) { return Number.isFinite(o.m) ? o.m : 0; }));
    }, 0);
  }
  function minScore(items) {
    items = Array.isArray(items) ? items : [];
    return items.reduce(function (sum, it) {
      if (!it || !Array.isArray(it.options) || !it.options.length) return sum;
      return sum + Math.min.apply(null, it.options.map(function (o) { return Number.isFinite(o.m) ? o.m : 0; }));
    }, 0);
  }

  function bandFor(pct) {
    for (let i = 0; i < BANDS.length; i++) {
      if (pct >= BANDS[i].min && pct <= BANDS[i].max) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
  }

  /* choices: array of chosen option index per item */
  function scoreTest(items, choices) {
    items = Array.isArray(items) ? items : [];
    choices = Array.isArray(choices) ? choices : [];
    let total = 0, answered = 0;
    items.forEach(function (it, i) {
      if (!it || !Array.isArray(it.options)) return;
      const idx = choices[i];
      if (Number.isInteger(idx) && it.options[idx] && Number.isFinite(it.options[idx].m)) {
        total += it.options[idx].m;
        answered += 1;
      }
    });
    const valid = items.length > 0 && answered === items.length;
    if (!valid) {
      return { valid: false, total: total, answered: answered, morningness: null, band: 'Incomplete', nickname: '', key: 'incomplete', peak: '', guidance: 'Complete every item before interpreting your chronotype.' };
    }
    const min = minScore(items), max = maxScore(items);
    const pct = max > min ? Math.round(((total - min) / (max - min)) * 100) : 50;
    const band = bandFor(pct);
    return { valid: true, total: total, answered: answered, morningness: pct, band: band.label, nickname: band.nickname, key: band.key, peak: band.peak, guidance: band.guidance };
  }

  AurorIQ.chronotypeEngine = {
    BANK: BANK,
    BANDS: BANDS,
    buildTest: buildTest,
    maxScore: maxScore,
    minScore: minScore,
    bandFor: bandFor,
    scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.chronotypeEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-chronotype-app]');
  if (!root) return;

  const els = {
    screens: {},
    progress: root.querySelector('[data-ch-progress]'),
    question: root.querySelector('[data-ch-question]'),
    options: root.querySelector('[data-ch-options]'),
    results: {
      band: root.querySelector('[data-res-band]'),
      nick: root.querySelector('[data-res-nick]'),
      marker: root.querySelector('[data-res-marker]'),
      pct: root.querySelector('[data-res-pct]'),
      peak: root.querySelector('[data-res-peak]'),
      guidance: root.querySelector('[data-res-guidance]')
    }
  };
  root.querySelectorAll('[data-ch-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-ch-screen')] = el;
  });

  let items = [];
  let idx = 0;
  const choices = [];

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

  function renderItem() {
    const item = items[idx];
    els.progress.textContent = 'Question ' + (idx + 1) + ' of ' + items.length;
    els.question.textContent = item.q;
    els.options.innerHTML = '';
    item.options.forEach(function (opt, oi) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vb-option';
      b.textContent = opt.label;
      b.addEventListener('click', function () { choose(oi); });
      els.options.appendChild(b);
    });
    els.options.querySelector('button').focus();
  }

  function choose(oi) {
    choices[idx] = oi;
    idx += 1;
    if (idx >= items.length) finish();
    else renderItem();
  }

  function finish() {
    const r = AurorIQ.chronotypeEngine.scoreTest(items, choices);
    els.results.band.textContent = r.band;
    els.results.nick.textContent = '\u201c' + r.nickname + '\u201d';
    els.results.pct.textContent = r.morningness + '/100 morningness';
    if (els.results.marker) els.results.marker.style.left = r.morningness + '%';
    els.results.peak.textContent = r.peak;
    els.results.guidance.textContent = r.guidance;
    if (AurorIQ.reports) AurorIQ.reports.render('chronotype', r, els.screens.results);
    show('results');
  }

  function start() {
    items = AurorIQ.chronotypeEngine.buildTest();
    idx = 0;
    choices.length = 0;
    show('play');
    renderItem();
  }

  root.querySelectorAll('[data-ch-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-ch-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
