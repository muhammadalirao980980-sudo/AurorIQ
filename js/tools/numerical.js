/* numerical.js — Numerical Reasoning instrument (v6.17).
 * The third leg of the reasoning trio alongside verbal and logical: quantitative
 * reasoning across number series, arithmetic word problems, ratios/percentages,
 * and simple data interpretation. Every item has one defensible, computable
 * answer. A run samples a fixed spread across difficulty tiers and is
 * difficulty-weighted, so harder items count for more.
 *
 * HONESTY NOTE (BRAND.md §4-5): unlike the logical test, numerical reasoning
 * leans on schooling and math familiarity, so it is NOT culture- or education-
 * fair the way pattern logic is. Percentiles are approximations — a 15-item test
 * is a snapshot, not a normed instrument — and are withheld when near chance.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  /* difficulty: 1 easy, 2 medium, 3 hard. answer = index into options. */
  const BANK = [
    /* ---- easy ---- */
    { type: 'series', difficulty: 1, prompt: 'What comes next? 3, 6, 9, 12, ___', options: ['13', '14', '15', '18'], answer: 2 },
    { type: 'series', difficulty: 1, prompt: 'What comes next? 10, 20, 30, 40, ___', options: ['45', '50', '55', '60'], answer: 1 },
    { type: 'arithmetic', difficulty: 1, prompt: 'A pack has 12 pens. How many pens are in 4 packs?', options: ['36', '44', '48', '52'], answer: 2 },
    { type: 'arithmetic', difficulty: 1, prompt: 'You buy 3 items at $5 each. What is the total?', options: ['$12', '$15', '$18', '$20'], answer: 1 },
    { type: 'ratio', difficulty: 1, prompt: 'What is 10% of 200?', options: ['2', '20', '40', '100'], answer: 1 },
    { type: 'ratio', difficulty: 1, prompt: 'A recipe uses 2 cups of flour for 4 servings. How many cups for 8 servings?', options: ['3', '4', '6', '8'], answer: 1 },
    { type: 'data', difficulty: 1, prompt: 'A shop sold 5, 8, and 7 units over three days. What is the total?', options: ['18', '19', '20', '21'], answer: 2 },
    { type: 'series', difficulty: 1, prompt: 'What comes next? 2, 4, 6, 8, ___', options: ['9', '10', '11', '12'], answer: 1 },

    /* ---- medium ---- */
    { type: 'series', difficulty: 2, prompt: 'What comes next? 2, 4, 8, 16, ___', options: ['24', '30', '32', '36'], answer: 2 },
    { type: 'series', difficulty: 2, prompt: 'What comes next? 1, 3, 6, 10, ___', options: ['13', '14', '15', '16'], answer: 2 },
    { type: 'arithmetic', difficulty: 2, prompt: 'A train travels 60 km in 1.5 hours. What is its speed in km/h?', options: ['30', '40', '45', '90'], answer: 1 },
    { type: 'arithmetic', difficulty: 2, prompt: 'A shirt costs $40 after a 20% discount. What was the original price?', options: ['$48', '$50', '$52', '$60'], answer: 1 },
    { type: 'ratio', difficulty: 2, prompt: 'The ratio of boys to girls is 3:2. If there are 15 boys, how many girls are there?', options: ['8', '9', '10', '12'], answer: 2 },
    { type: 'ratio', difficulty: 2, prompt: '25% of a number is 30. What is the number?', options: ['90', '100', '120', '150'], answer: 2 },
    { type: 'data', difficulty: 2, prompt: 'Four prices are $12, $15, $9, and $16. What is their average?', options: ['$12', '$13', '$14', '$15'], answer: 1 },
    { type: 'arithmetic', difficulty: 2, prompt: 'If 5 workers build a wall in 6 days, how many worker-days is that?', options: ['11', '25', '30', '36'], answer: 2 },

    /* ---- hard ---- */
    { type: 'series', difficulty: 3, prompt: 'What comes next? 1, 2, 4, 7, 11, ___', options: ['14', '15', '16', '18'], answer: 2 },
    { type: 'series', difficulty: 3, prompt: 'What comes next? 2, 6, 18, 54, ___', options: ['108', '144', '162', '216'], answer: 2 },
    { type: 'series', difficulty: 3, prompt: 'What comes next? 1, 8, 27, 64, ___', options: ['81', '100', '125', '216'], answer: 2 },
    { type: 'arithmetic', difficulty: 3, prompt: 'A car uses 8 litres of fuel per 100 km. How many litres for 250 km?', options: ['16', '18', '20', '25'], answer: 2 },
    { type: 'ratio', difficulty: 3, prompt: 'Increase 80 by 15%. What is the result?', options: ['88', '90', '92', '95'], answer: 2 },
    { type: 'ratio', difficulty: 3, prompt: 'If 3 machines make 3 widgets in 3 minutes, how long do 100 machines take to make 100 widgets?', options: ['3 minutes', '33 minutes', '100 minutes', '300 minutes'], answer: 0 },
    { type: 'data', difficulty: 3, prompt: 'Revenue was $200 in Q1, rose 50% in Q2, then fell 20% in Q3. What was Q3 revenue?', options: ['$220', '$240', '$250', '$280'], answer: 1 },
    { type: 'arithmetic', difficulty: 3, prompt: 'Two pipes fill a tank in 4 and 6 hours. Working together, how long to fill it?', options: ['2.4 hours', '2.5 hours', '3 hours', '5 hours'], answer: 0 }
  ];

  const TEST_PLAN = { 1: 5, 2: 5, 3: 5 };
  const DIFFICULTY_WEIGHT = { 1: 1, 2: 2, 3: 3 };

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function byDifficulty(d) { return BANK.filter(function (i) { return i.difficulty === d; }); }

  function shuffle(arr, rand) {
    const r = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildTest(rand) {
    const r = rand || Math.random;
    const items = [];
    [1, 2, 3].forEach(function (d) {
      const pool = shuffle(byDifficulty(d), r).slice(0, TEST_PLAN[d]);
      pool.forEach(function (item) {
        const order = shuffle(item.options.map(function (_, i) { return i; }), r);
        const options = order.map(function (i) { return item.options[i]; });
        const answer = order.indexOf(item.answer);
        items.push({ type: item.type, difficulty: item.difficulty, prompt: item.prompt, options: options, answer: answer });
      });
    });
    return items;
  }

  function scoreTest(items, answers) {
    const total = items.length;
    let correct = 0, weighted = 0, maxWeighted = 0;
    const byTier = { 1: { c: 0, n: 0 }, 2: { c: 0, n: 0 }, 3: { c: 0, n: 0 } };
    items.forEach(function (item, i) {
      const w = DIFFICULTY_WEIGHT[item.difficulty];
      maxWeighted += w;
      byTier[item.difficulty].n += 1;
      if (answers[i] === item.answer) {
        correct += 1; weighted += w; byTier[item.difficulty].c += 1;
      }
    });
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const weightedPct = maxWeighted ? weighted / maxWeighted : 0;
    const aboveChance = Math.max(0, (weightedPct - 0.25) / 0.75);
    let composite = Math.round(aboveChance * 98) + 1;
    composite = Math.min(99, Math.max(1, composite));
    return {
      correct: correct,
      total: total,
      accuracy: accuracy,
      weightedPct: Math.round(weightedPct * 100),
      composite: composite,
      tiers: {
        easy: byTier[1].c + '/' + byTier[1].n,
        medium: byTier[2].c + '/' + byTier[2].n,
        hard: byTier[3].c + '/' + byTier[3].n
      },
      atChance: accuracy <= 30
    };
  }

  AurorIQ.numericalEngine = {
    BANK: BANK,
    TEST_PLAN: TEST_PLAN,
    DIFFICULTY_WEIGHT: DIFFICULTY_WEIGHT,
    byDifficulty: byDifficulty,
    shuffle: shuffle,
    buildTest: buildTest,
    scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AurorIQ.numericalEngine;
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller (reuses vb-* styles) ---------------- */

  const root = document.querySelector('[data-numerical-app]');
  if (!root) return;

  const els = {
    screens: {},
    type: root.querySelector('[data-nm-type]'),
    prompt: root.querySelector('[data-nm-prompt]'),
    options: root.querySelector('[data-nm-options]'),
    progress: root.querySelector('[data-nm-progress]'),
    results: {
      composite: root.querySelector('[data-res-composite]'),
      accuracy: root.querySelector('[data-res-accuracy]'),
      correct: root.querySelector('[data-res-correct]'),
      easy: root.querySelector('[data-res-easy]'),
      medium: root.querySelector('[data-res-medium]'),
      hard: root.querySelector('[data-res-hard]'),
      verdict: root.querySelector('[data-res-verdict]')
    }
  };
  root.querySelectorAll('[data-nm-screen]').forEach(function (el) { els.screens[el.getAttribute('data-nm-screen')] = el; });

  let items = [];
  let idx = 0;
  const answers = [];
  const TYPE_LABEL = { series: 'Number series', arithmetic: 'Arithmetic', ratio: 'Ratios & %', data: 'Data' };

  function show(screen) { Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; }); }

  function renderItem() {
    const item = items[idx];
    els.type.textContent = TYPE_LABEL[item.type] || '';
    els.prompt.textContent = item.prompt;
    els.progress.textContent = 'Question ' + (idx + 1) + ' of ' + items.length;
    els.options.innerHTML = '';
    item.options.forEach(function (opt, oi) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vb-option';
      b.textContent = opt;
      b.addEventListener('click', function () { answer(oi); });
      els.options.appendChild(b);
    });
    els.options.querySelector('button').focus();
  }

  function answer(choice) {
    answers[idx] = choice;
    idx += 1;
    if (idx >= items.length) finish();
    else renderItem();
  }

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  function finish() {
    const r = AurorIQ.numericalEngine.scoreTest(items, answers);
    els.results.composite.textContent = r.atChance ? '\u2014' : '~' + r.composite + ordinal(r.composite);
    els.results.accuracy.textContent = r.accuracy + '%';
    els.results.correct.textContent = r.correct + ' / ' + r.total;
    els.results.easy.textContent = r.tiers.easy;
    els.results.medium.textContent = r.tiers.medium;
    els.results.hard.textContent = r.tiers.hard;
    els.results.verdict.textContent = r.atChance
      ? 'Your accuracy is near chance for four-choice questions (25%), so the score is withheld as unreliable. Try again when you can give each item your full attention.'
      : 'The percentile is approximate: a fifteen-item test is a genuine snapshot of numerical reasoning, weighted so harder items count for more. Note that this draws on math schooling, so unlike pattern logic it isn\u2019t education-fair.';
    show('results');
  }

  function start() {
    items = AurorIQ.numericalEngine.buildTest();
    idx = 0;
    answers.length = 0;
    show('play');
    renderItem();
  }

  root.querySelectorAll('[data-nm-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-nm-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
