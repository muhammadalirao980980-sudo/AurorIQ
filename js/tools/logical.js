/* logical.js — Logical Reasoning instrument (v6.7).
 * A fluid-reasoning measure: number and letter series, syllogisms, deductive
 * inferences, and odd-one-out. Every item has one defensible answer. A run
 * samples a fixed spread across difficulty tiers and is difficulty-weighted,
 * so harder items count for more.
 *
 * Unlike the verbal test, logical reasoning leans less on vocabulary and more
 * on pattern extraction and valid inference — closer to fluid intelligence.
 * Percentiles remain approximations (BRAND.md §4-5): a 15-item test is a
 * snapshot, not a normed instrument.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  /* difficulty: 1 easy, 2 medium, 3 hard. answer = index into options. */
  const BANK = [
    /* ---- number / letter series ---- */
    { type: 'series', difficulty: 1, prompt: 'What comes next? 2, 4, 6, 8, ___', options: ['9', '10', '11', '12'], answer: 1 },
    { type: 'series', difficulty: 1, prompt: 'What comes next? 5, 10, 15, 20, ___', options: ['22', '24', '25', '30'], answer: 2 },
    { type: 'series', difficulty: 1, prompt: 'What comes next? A, C, E, G, ___', options: ['H', 'I', 'J', 'K'], answer: 1 },
    { type: 'series', difficulty: 2, prompt: 'What comes next? 3, 6, 12, 24, ___', options: ['30', '36', '48', '60'], answer: 2 },
    { type: 'series', difficulty: 2, prompt: 'What comes next? 1, 4, 9, 16, ___', options: ['20', '23', '25', '30'], answer: 2 },
    { type: 'series', difficulty: 2, prompt: 'What comes next? 1, 1, 2, 3, 5, ___', options: ['6', '7', '8', '9'], answer: 2 },
    { type: 'series', difficulty: 2, prompt: 'What comes next? Z, X, V, T, ___', options: ['S', 'R', 'Q', 'P'], answer: 1 },
    { type: 'series', difficulty: 3, prompt: 'What comes next? 1, 2, 4, 7, 11, ___', options: ['14', '15', '16', '18'], answer: 2 },
    { type: 'series', difficulty: 3, prompt: 'What comes next? 2, 6, 12, 20, 30, ___', options: ['38', '40', '42', '44'], answer: 2 },
    { type: 'series', difficulty: 3, prompt: 'What comes next? A, B, D, G, K, ___', options: ['N', 'O', 'P', 'Q'], answer: 2 },

    /* ---- syllogisms ---- */
    { type: 'syllogism', difficulty: 1, prompt: 'All roses are flowers. All flowers need water. Therefore:', options: ['No roses need water', 'All roses need water', 'Some roses are not flowers', 'Water is a flower'], answer: 1 },
    { type: 'syllogism', difficulty: 1, prompt: 'All dogs are animals. Rex is a dog. Therefore:', options: ['Rex is not an animal', 'Rex is an animal', 'All animals are dogs', 'Rex is a cat'], answer: 1 },
    { type: 'syllogism', difficulty: 2, prompt: 'No fish are mammals. All whales are mammals. Therefore:', options: ['All whales are fish', 'Some whales are fish', 'No whales are fish', 'Some fish are whales'], answer: 2 },
    { type: 'syllogism', difficulty: 2, prompt: 'Some cats are black. All black things here absorb heat. Therefore:', options: ['All cats absorb heat', 'Some cats absorb heat', 'No cats absorb heat', 'All heat absorbers are cats'], answer: 1 },
    { type: 'syllogism', difficulty: 3, prompt: 'All squares are rectangles. Some rectangles are red. Which must be true?', options: ['All squares are red', 'Some squares are red', 'No squares are red', 'None of these must be true'], answer: 3 },
    { type: 'syllogism', difficulty: 3, prompt: 'All experts are certified. Some certified people are new. Which must be true?', options: ['Some experts are new', 'All new people are experts', 'No experts are new', 'None of these must be true'], answer: 3 },

    /* ---- deduction ---- */
    { type: 'deduction', difficulty: 1, prompt: 'Tom is taller than Sam. Sam is taller than Bill. Who is shortest?', options: ['Tom', 'Sam', 'Bill', 'Cannot tell'], answer: 2 },
    { type: 'deduction', difficulty: 2, prompt: 'If it rains, the ground gets wet. The ground is not wet. Therefore:', options: ['It rained', 'It did not rain', 'It might have rained', 'The ground is dry from heat'], answer: 1 },
    { type: 'deduction', difficulty: 2, prompt: 'Anna sits directly left of Ben. Ben sits directly left of Cara. Who is in the middle?', options: ['Anna', 'Ben', 'Cara', 'Cannot tell'], answer: 1 },
    { type: 'deduction', difficulty: 3, prompt: 'Every book on the shelf is either red or blue. This book is not blue. Therefore:', options: ['It is red', 'It is green', 'It is not on the shelf', 'Cannot tell'], answer: 0 },
    { type: 'deduction', difficulty: 3, prompt: 'If all P are Q, and no Q are R, what follows about P and R?', options: ['All P are R', 'Some P are R', 'No P are R', 'Cannot tell'], answer: 2 },

    /* ---- odd one out ---- */
    { type: 'oddoneout', difficulty: 1, prompt: 'Which does NOT belong? apple, banana, carrot, grape', options: ['apple', 'banana', 'carrot', 'grape'], answer: 2 },
    { type: 'oddoneout', difficulty: 1, prompt: 'Which does NOT belong? circle, square, triangle, red', options: ['circle', 'square', 'triangle', 'red'], answer: 3 },
    { type: 'oddoneout', difficulty: 2, prompt: 'Which does NOT belong? 3, 5, 7, 9', options: ['3', '5', '7', '9'], answer: 3 },
    { type: 'oddoneout', difficulty: 2, prompt: 'Which does NOT belong? violin, flute, guitar, harp', options: ['violin', 'flute', 'guitar', 'harp'], answer: 1 },
    { type: 'oddoneout', difficulty: 3, prompt: 'Which does NOT belong? 8, 27, 64, 100', options: ['8', '27', '64', '100'], answer: 3 },
    { type: 'oddoneout', difficulty: 3, prompt: 'Which does NOT belong? square, cube, triangle, pentagon', options: ['square', 'cube', 'triangle', 'pentagon'], answer: 1 }
  ];

  const TEST_PLAN = { 1: 5, 2: 5, 3: 5 };
  const DIFFICULTY_WEIGHT = { 1: 1, 2: 2, 3: 3 };

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function byDifficulty(d) {
    return BANK.filter(function (i) { return i.difficulty === d; });
  }

  function shuffle(arr, rand) {
    const r = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Options for series/oddoneout are already distinct answer-bearing values, so
   * shuffling them is safe. For all types we track the answer to its new index. */
  function buildTest(rand) {
    const r = rand || Math.random;
    const items = [];
    [1, 2, 3].forEach(function (d) {
      const pool = shuffle(byDifficulty(d), r).slice(0, TEST_PLAN[d]);
      pool.forEach(function (item) {
        const order = shuffle(item.options.map(function (_, i) { return i; }), r);
        const options = order.map(function (i) { return item.options[i]; });
        const answer = order.indexOf(item.answer);
        items.push({
          type: item.type,
          difficulty: item.difficulty,
          prompt: item.prompt,
          options: options,
          answer: answer
        });
      });
    });
    return items;
  }

  function scoreTest(items, answers) {
    items = Array.isArray(items) ? items : [];
    answers = Array.isArray(answers) ? answers : [];
    const total = items.length;
    let correct = 0, weighted = 0, maxWeighted = 0;
    const byTier = { 1: { c: 0, n: 0 }, 2: { c: 0, n: 0 }, 3: { c: 0, n: 0 } };
    items.forEach(function (item, i) {
      const w = DIFFICULTY_WEIGHT[item.difficulty];
      maxWeighted += w;
      byTier[item.difficulty].n += 1;
      if (answers[i] === item.answer) {
        correct += 1;
        weighted += w;
        byTier[item.difficulty].c += 1;
      }
    });
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const weightedPct = maxWeighted ? weighted / maxWeighted : 0;
    const aboveChance = Math.max(0, (weightedPct - 0.25) / 0.75);
    let composite = total ? Math.round(aboveChance * 98) + 1 : null;
    if (composite !== null) composite = Math.min(99, Math.max(1, composite));
    return {
      valid: total > 0,
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
      atChance: total > 0 && accuracy <= 30
    };
  }

  AurorIQ.logicalEngine = {
    BANK: BANK,
    TEST_PLAN: TEST_PLAN,
    DIFFICULTY_WEIGHT: DIFFICULTY_WEIGHT,
    byDifficulty: byDifficulty,
    shuffle: shuffle,
    buildTest: buildTest,
    scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.logicalEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-logical-app]');
  if (!root) return;

  const els = {
    screens: {},
    type: root.querySelector('[data-lg-type]'),
    prompt: root.querySelector('[data-lg-prompt]'),
    options: root.querySelector('[data-lg-options]'),
    progress: root.querySelector('[data-lg-progress]'),
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
  root.querySelectorAll('[data-lg-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-lg-screen')] = el;
  });

  let items = [];
  let idx = 0;
  const answers = [];
  const TYPE_LABEL = { series: 'Series', syllogism: 'Syllogism', deduction: 'Deduction', oddoneout: 'Odd one out' };

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

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
    const r = AurorIQ.logicalEngine.scoreTest(items, answers);
    els.results.composite.textContent = r.atChance ? '\u2014' : r.composite + '/100';
    els.results.accuracy.textContent = r.accuracy + '%';
    els.results.correct.textContent = r.correct + ' / ' + r.total;
    els.results.easy.textContent = r.tiers.easy;
    els.results.medium.textContent = r.tiers.medium;
    els.results.hard.textContent = r.tiers.hard;
    els.results.verdict.textContent = r.atChance
      ? 'Your accuracy is near chance for four-choice questions (25%), so the score is withheld as unreliable. Try again when you can give each item your full attention.'
      : 'The composite is an internal index, not a population percentile: a fifteen-item test is a genuine snapshot of logical reasoning, weighted so harder items count for more. Unlike vocabulary, this kind of pattern reasoning depends little on background or language.';
    if (AurorIQ.reports) AurorIQ.reports.render('logical', r, els.screens.results, {items: items, answers: answers});
    show('results');
  }

  function start() {
    items = AurorIQ.logicalEngine.buildTest();
    idx = 0;
    answers.length = 0;
    show('play');
    renderItem();
  }

  root.querySelectorAll('[data-lg-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-lg-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
