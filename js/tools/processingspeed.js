/* processingspeed.js — Processing Speed instrument (v6.18).
 * A perceptual/processing-speed task in the digit-symbol / number-comparison
 * tradition: two short character strings appear and you decide, as fast as you
 * can, whether they are the SAME or DIFFERENT. A fixed block of items measures
 * cognitive throughput — how quickly and accurately you can compare, which is a
 * core cognitive index (Gs in CHC theory) distinct from simple reaction time.
 *
 * Metrics (all honest, all approximate — BRAND.md §4-5):
 *   - accuracy: correct same/different judgments over the block
 *   - throughput: correct responses per minute (speed AND accuracy together —
 *     errors reduce the correct count, slowness reduces the rate)
 *   - a 1-99 composite mapped from throughput, shown as an approximation
 *   - near-chance responding (accuracy at/near 50% for a two-choice task) is
 *     withheld: fast random pressing must not read as fast processing.
 *
 * On-device only. Nothing transmitted or stored.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const ITEMS = 30;
  const MIN_LEN = 5, MAX_LEN = 7;
  /* confusable-free alphabet (no I/O/0/1) so a "different" pair is genuinely legible */
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const MIN_ITEM_MS = 180;      /* faster than this is anticipatory, not real discrimination */
  const LOW_TPM = 10, HIGH_TPM = 70;  /* throughput anchors for the 1-99 map (approximate) */
  const CHANCE_ACC = 60;        /* two-choice chance is 50%; at/under 60% we withhold */

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function randStr(rand, len) {
    let s = '';
    for (let i = 0; i < len; i++) s += CHARS[Math.floor(rand() * CHARS.length)];
    return s;
  }

  /* Change exactly one position to a genuinely different character. */
  function mutate(str, rand) {
    const pos = Math.floor(rand() * str.length);
    let c = str[pos];
    while (c === str[pos]) c = CHARS[Math.floor(rand() * CHARS.length)];
    return str.slice(0, pos) + c + str.slice(pos + 1);
  }

  function generatePair(rand) {
    const r = rand || Math.random;
    const len = MIN_LEN + Math.floor(r() * (MAX_LEN - MIN_LEN + 1));
    const a = randStr(r, len);
    const same = r() < 0.5;
    const b = same ? a : mutate(a, r);
    return { a: a, b: b, same: same };
  }

  function buildBlock(rand, n) {
    const r = rand || Math.random;
    const count = n || ITEMS;
    const pairs = [];
    for (let i = 0; i < count; i++) pairs.push(generatePair(r));
    return pairs;
  }

  function createSession(pairs) {
    return { pairs: pairs, index: 0, answers: [], done: false };
  }

  /* choiceSame: the user's judgment (true = "same"). ms: time on this item. */
  function recordAnswer(session, choiceSame, ms) {
    if (session.done) return session;
    const pair = session.pairs[session.index];
    session.answers.push({
      same: pair.same,
      choice: !!choiceSame,
      correct: (!!choiceSame) === pair.same,
      ms: (typeof ms === 'number' && ms >= 0) ? ms : 0
    });
    session.index += 1;
    if (session.index >= session.pairs.length) session.done = true;
    return session;
  }

  function scoreSession(session) {
    const a = session && Array.isArray(session.answers) ? session.answers.filter(function (x) { return x && typeof x === 'object'; }) : [];
    const attempted = a.length;
    let correct = 0, totalMs = 0;
    a.forEach(function (x) {
      if (x.correct) correct += 1;
      const ms = Number.isFinite(x.ms) && x.ms >= 0 ? x.ms : 0;
      totalMs += Math.max(ms, MIN_ITEM_MS);
    });
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    const minutes = totalMs / 60000;
    const throughput = minutes > 0 ? correct / minutes : 0;
    let composite = attempted ? Math.round((throughput - LOW_TPM) / (HIGH_TPM - LOW_TPM) * 98) + 1 : null;
    if (composite !== null) composite = Math.min(99, Math.max(1, composite));
    return { valid: attempted > 0, attempted: attempted, correct: correct, accuracy: accuracy, throughput: Math.round(throughput), meanMs: attempted ? Math.round(totalMs / attempted) : 0, composite: composite, atChance: attempted > 0 && accuracy <= CHANCE_ACC };
  }

  AurorIQ.processingSpeedEngine = {
    ITEMS: ITEMS,
    MIN_ITEM_MS: MIN_ITEM_MS,
    CHANCE_ACC: CHANCE_ACC,
    generatePair: generatePair,
    mutate: mutate,
    buildBlock: buildBlock,
    createSession: createSession,
    recordAnswer: recordAnswer,
    scoreSession: scoreSession
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AurorIQ.processingSpeedEngine;
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-processing-app]');
  if (!root) return;

  const now = (typeof performance !== 'undefined' && performance.now)
    ? function () { return performance.now(); }
    : function () { return Date.now(); };

  const els = {
    screens: {},
    a: root.querySelector('[data-ps-a]'),
    b: root.querySelector('[data-ps-b]'),
    progress: root.querySelector('[data-ps-progress]'),
    options: root.querySelector('[data-ps-options]'),
    results: {
      composite: root.querySelector('[data-res-composite]'),
      throughput: root.querySelector('[data-res-throughput]'),
      accuracy: root.querySelector('[data-res-accuracy]'),
      correct: root.querySelector('[data-res-correct]'),
      mean: root.querySelector('[data-res-mean]'),
      verdict: root.querySelector('[data-res-verdict]')
    }
  };
  root.querySelectorAll('[data-ps-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-ps-screen')] = el;
  });

  let session = null;
  let shownAt = 0;

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

  function renderPair() {
    const pair = session.pairs[session.index];
    els.a.textContent = pair.a;
    els.b.textContent = pair.b;
    els.progress.textContent = (session.index + 1) + ' / ' + session.pairs.length;
    shownAt = now();
  }

  function answer(choiceSame) {
    if (!session || session.done) return;
    AurorIQ.processingSpeedEngine.recordAnswer(session, choiceSame, now() - shownAt);
    if (session.done) finish();
    else renderPair();
  }

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  function finish() {
    const r = AurorIQ.processingSpeedEngine.scoreSession(session);
    els.results.composite.textContent = r.atChance ? '\u2014' : r.composite + '/100';
    els.results.throughput.textContent = r.throughput + ' / min';
    els.results.accuracy.textContent = r.accuracy + '%';
    els.results.correct.textContent = r.correct + ' / ' + r.attempted;
    els.results.mean.textContent = r.meanMs + ' ms';
    els.results.verdict.textContent = r.atChance
      ? 'Your accuracy is near chance for a two-choice task (50%), so the speed score is withheld — fast guessing isn\u2019t fast processing. Try again and prioritise getting each judgment right.'
      : 'Processing speed is throughput: correct judgments per minute, so both errors and slowness pull it down. The composite is an internal index, not a population percentile — a thirty-item block is a genuine snapshot of comparison speed, not a normed clinical measure.';
    if (AurorIQ.reports) AurorIQ.reports.render('processingspeed', r, els.screens.results);
    show('results');
  }

  function start() {
    session = AurorIQ.processingSpeedEngine.createSession(AurorIQ.processingSpeedEngine.buildBlock());
    show('play');
    renderPair();
  }

  els.options.querySelectorAll('[data-ps-choice]').forEach(function (b) {
    b.addEventListener('click', function () { answer(b.getAttribute('data-ps-choice') === 'same'); });
  });
  document.addEventListener('keydown', function (e) {
    if (!session || session.done || els.screens.play.hidden) return;
    if (e.key === 'ArrowLeft' || e.key === 's' || e.key === 'S') { e.preventDefault(); answer(true); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); answer(false); }
  });
  root.querySelectorAll('[data-ps-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-ps-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
