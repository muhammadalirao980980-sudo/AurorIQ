/* verbal.js — Verbal Reasoning instrument (v6.6).
 * A crystallized-ability measure: analogies, synonyms, and antonyms drawn from
 * an authored, difficulty-graded item bank. Each item has one unambiguous
 * answer. A run samples a fixed spread across difficulty tiers, and the score
 * is difficulty-weighted — getting a hard item right counts for more than an
 * easy one, which is closer to how ability actually maps to performance.
 *
 * Percentiles are approximations (BRAND.md §4-5): a 15-item test is a real
 * snapshot of verbal reasoning, not a normed clinical instrument. Verbal
 * ability also tracks vocabulary exposure and first-language background, which
 * the results state plainly.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  /* difficulty: 1 easy, 2 medium, 3 hard. answer = index into options. */
  const BANK = [
    /* ---- analogies ---- */
    { type: 'analogy', difficulty: 1, prompt: 'Kitten is to cat as puppy is to ___', options: ['dog', 'bird', 'kitten', 'cub'], answer: 0 },
    { type: 'analogy', difficulty: 1, prompt: 'Hot is to cold as up is to ___', options: ['high', 'down', 'over', 'top'], answer: 1 },
    { type: 'analogy', difficulty: 1, prompt: 'Finger is to hand as toe is to ___', options: ['leg', 'arm', 'foot', 'knee'], answer: 2 },
    { type: 'analogy', difficulty: 1, prompt: 'Author is to book as composer is to ___', options: ['orchestra', 'symphony', 'piano', 'stage'], answer: 1 },
    { type: 'analogy', difficulty: 2, prompt: 'Petal is to flower as ___ is to book', options: ['cover', 'page', 'word', 'story'], answer: 1 },
    { type: 'analogy', difficulty: 2, prompt: 'Thermometer is to temperature as ___ is to time', options: ['ruler', 'scale', 'clock', 'compass'], answer: 2 },
    { type: 'analogy', difficulty: 2, prompt: 'Drought is to water as famine is to ___', options: ['land', 'food', 'rain', 'money'], answer: 1 },
    { type: 'analogy', difficulty: 2, prompt: 'Whisper is to shout as ___ is to sprint', options: ['stroll', 'jog', 'race', 'leap'], answer: 0 },
    { type: 'analogy', difficulty: 3, prompt: 'Cartographer is to map as ___ is to census', options: ['historian', 'demographer', 'geologist', 'archivist'], answer: 1 },
    { type: 'analogy', difficulty: 3, prompt: 'Ephemeral is to permanent as fleeting is to ___', options: ['brief', 'sudden', 'lasting', 'rare'], answer: 2 },
    { type: 'analogy', difficulty: 3, prompt: 'Sculptor is to marble as ___ is to argument', options: ['orator', 'critic', 'logician', 'poet'], answer: 2 },
    { type: 'analogy', difficulty: 3, prompt: 'Prologue is to novel as overture is to ___', options: ['opera', 'poem', 'painting', 'lecture'], answer: 0 },

    /* ---- synonyms ---- */
    { type: 'synonym', difficulty: 1, prompt: 'Which word means most nearly the same as BRAVE?', options: ['timid', 'courageous', 'clever', 'calm'], answer: 1 },
    { type: 'synonym', difficulty: 1, prompt: 'Which word means most nearly the same as HAPPY?', options: ['angry', 'tired', 'joyful', 'quiet'], answer: 2 },
    { type: 'synonym', difficulty: 2, prompt: 'Which word means most nearly the same as METICULOUS?', options: ['careless', 'thorough', 'hasty', 'generous'], answer: 1 },
    { type: 'synonym', difficulty: 2, prompt: 'Which word means most nearly the same as CANDID?', options: ['secretive', 'frank', 'cheerful', 'nervous'], answer: 1 },
    { type: 'synonym', difficulty: 2, prompt: 'Which word means most nearly the same as ABUNDANT?', options: ['scarce', 'plentiful', 'costly', 'hidden'], answer: 1 },
    { type: 'synonym', difficulty: 3, prompt: 'Which word means most nearly the same as LACONIC?', options: ['talkative', 'terse', 'lazy', 'confused'], answer: 1 },
    { type: 'synonym', difficulty: 3, prompt: 'Which word means most nearly the same as EPHEMERAL?', options: ['eternal', 'fleeting', 'colossal', 'radiant'], answer: 1 },
    { type: 'synonym', difficulty: 3, prompt: 'Which word means most nearly the same as OBDURATE?', options: ['flexible', 'stubborn', 'joyful', 'weary'], answer: 1 },

    /* ---- antonyms ---- */
    { type: 'antonym', difficulty: 1, prompt: 'Which word is most nearly OPPOSITE to FULL?', options: ['whole', 'empty', 'heavy', 'wide'], answer: 1 },
    { type: 'antonym', difficulty: 1, prompt: 'Which word is most nearly OPPOSITE to ANCIENT?', options: ['old', 'modern', 'distant', 'quiet'], answer: 1 },
    { type: 'antonym', difficulty: 2, prompt: 'Which word is most nearly OPPOSITE to GENEROUS?', options: ['kind', 'stingy', 'wealthy', 'gentle'], answer: 1 },
    { type: 'antonym', difficulty: 2, prompt: 'Which word is most nearly OPPOSITE to TRANSPARENT?', options: ['clear', 'opaque', 'fragile', 'smooth'], answer: 1 },
    { type: 'antonym', difficulty: 2, prompt: 'Which word is most nearly OPPOSITE to EXPAND?', options: ['grow', 'contract', 'stretch', 'divide'], answer: 1 },
    { type: 'antonym', difficulty: 3, prompt: 'Which word is most nearly OPPOSITE to GARRULOUS?', options: ['talkative', 'reticent', 'cheerful', 'anxious'], answer: 1 },
    { type: 'antonym', difficulty: 3, prompt: 'Which word is most nearly OPPOSITE to MAGNANIMOUS?', options: ['generous', 'petty', 'brave', 'humble'], answer: 1 },
    { type: 'antonym', difficulty: 3, prompt: 'Which word is most nearly OPPOSITE to NASCENT?', options: ['emerging', 'declining', 'hidden', 'rapid'], answer: 1 }
  ];

  const TEST_PLAN = { 1: 5, 2: 5, 3: 5 };  /* items sampled per difficulty tier */
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

  /* Build a test: sample TEST_PLAN[d] items from each tier, in ascending
   * difficulty order (easy first — a gentle ramp). Options within each item
   * are shuffled, with the answer index tracked to the moved position. */
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

    /* Composite 1-99, approximate. Weighted proportion maps roughly onto a
     * percentile: chance on 4-choice items is 25%, so a weighted score at or
     * below chance floors the composite; strong hard-item performance lifts it. */
    const aboveChance = Math.max(0, (weightedPct - 0.25) / 0.75); /* 0..1 */
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

  AurorIQ.verbalEngine = {
    BANK: BANK,
    TEST_PLAN: TEST_PLAN,
    DIFFICULTY_WEIGHT: DIFFICULTY_WEIGHT,
    byDifficulty: byDifficulty,
    shuffle: shuffle,
    buildTest: buildTest,
    scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.verbalEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-verbal-app]');
  if (!root) return;

  const els = {
    screens: {},
    type: root.querySelector('[data-vb-type]'),
    prompt: root.querySelector('[data-vb-prompt]'),
    options: root.querySelector('[data-vb-options]'),
    progress: root.querySelector('[data-vb-progress]'),
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
  root.querySelectorAll('[data-vb-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-vb-screen')] = el;
  });

  let items = [];
  let idx = 0;
  const answers = [];
  const TYPE_LABEL = { analogy: 'Analogy', synonym: 'Synonym', antonym: 'Antonym' };

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
    const r = AurorIQ.verbalEngine.scoreTest(items, answers);
    els.results.composite.textContent = r.atChance ? '\u2014' : '~' + r.composite + ordinal(r.composite);
    els.results.accuracy.textContent = r.accuracy + '%';
    els.results.correct.textContent = r.correct + ' / ' + r.total;
    els.results.easy.textContent = r.tiers.easy;
    els.results.medium.textContent = r.tiers.medium;
    els.results.hard.textContent = r.tiers.hard;
    els.results.verdict.textContent = r.atChance
      ? 'Your accuracy is near chance for four-choice questions (25%), so the score is withheld as unreliable. Verbal tests lean on vocabulary — if English isn\u2019t your first language, that alone can explain a low run.'
      : 'The percentile is approximate: a fifteen-item test is a genuine snapshot of verbal reasoning, weighted so harder items count for more. Verbal ability tracks reading and vocabulary exposure, which grow throughout life.';
    show('results');
  }

  function start() {
    items = AurorIQ.verbalEngine.buildTest();
    idx = 0;
    answers.length = 0;
    show('play');
    renderItem();
  }

  root.querySelectorAll('[data-vb-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-vb-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
