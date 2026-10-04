/* spatial.js — Mental Rotation instrument (v6.5).
 * The classic spatial paradigm: a reference shape is shown beside a candidate.
 * The candidate is EITHER the reference rotated (answer: "same") OR the
 * reference reflected and then rotated (answer: "mirror"). The task is to
 * decide which — the core operation psychologists call mental rotation.
 *
 * Shapes are procedurally generated polyominoes, filtered to be CHIRAL (a shape
 * whose mirror image cannot be reached by rotation), so "same" vs "mirror" is
 * always unambiguous. Ground truth is exact: the candidate shown is literally
 * the transformed cell set, computed here, not a CSS trick — so what you see is
 * what is scored.
 *
 * Score = accuracy over 12 items (2-choice, chance = 50%) plus median decision
 * time on correct trials. The composite is presented as an approximation
 * (BRAND.md §4-5); a 2-choice score is noisier than a full battery.
 *
 * On-device only. Nothing transmitted or stored.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const ITEMS = 12;
  const SHAPE_CELLS = 6;   /* hexominoes: complex enough to require real rotation */

  /* ---------------- pure geometry (unit-tested in Node) ---------------- */

  function normalize(cells) {
    let minX = Infinity, minY = Infinity;
    cells.forEach(function (c) { if (c[0] < minX) minX = c[0]; if (c[1] < minY) minY = c[1]; });
    return cells.map(function (c) { return [c[0] - minX, c[1] - minY]; })
      .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  }

  function key(cells) {
    return normalize(cells).map(function (c) { return c[0] + ',' + c[1]; }).join(';');
  }

  function rotate90(cells) {              /* (x,y) -> (y, -x) */
    return normalize(cells.map(function (c) { return [c[1], -c[0]]; }));
  }

  function reflect(cells) {               /* (x,y) -> (-x, y) */
    return normalize(cells.map(function (c) { return [-c[0], c[1]]; }));
  }

  function rotations(cells) {             /* all 4 orientations, as keys */
    const out = [];
    let cur = normalize(cells);
    for (let i = 0; i < 4; i++) { out.push(key(cur)); cur = rotate90(cur); }
    return out;
  }

  function rotateN(cells, n) {
    let cur = normalize(cells);
    for (let i = 0; i < ((n % 4) + 4) % 4; i++) cur = rotate90(cur);
    return cur;
  }

  /* Chiral = mirror image shares no orientation with the original. */
  function isChiral(cells) {
    const orig = rotations(cells);
    const mir = rotations(reflect(cells));
    for (let i = 0; i < orig.length; i++) {
      if (mir.indexOf(orig[i]) !== -1) return false;
    }
    return true;
  }

  /* Random connected polyomino via growth from origin. */
  function randomPolyomino(rand, size) {
    const r = rand || Math.random;
    const n = size || SHAPE_CELLS;
    const cells = [[0, 0]];
    const has = { '0,0': true };
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let guard = 0;
    while (cells.length < n && guard++ < 500) {
      const base = cells[Math.floor(r() * cells.length)];
      const d = dirs[Math.floor(r() * 4)];
      const nx = base[0] + d[0], ny = base[1] + d[1];
      const k = nx + ',' + ny;
      if (!has[k]) { has[k] = true; cells.push([nx, ny]); }
    }
    return normalize(cells);
  }

  function chiralPolyomino(rand, size) {
    let guard = 0;
    while (guard++ < 200) {
      const p = randomPolyomino(rand, size);
      if (isChiral(p)) return p;
    }
    return null; /* extremely unlikely; caller retries */
  }

  /* Build one item. answer is 'same' or 'mirror'. The candidate is the
   * reference (optionally reflected) rotated by `rot` quarter-turns. */
  function makeItem(rand) {
    const r = rand || Math.random;
    let ref = null;
    for (let g = 0; g < 50 && !ref; g++) ref = chiralPolyomino(r, SHAPE_CELLS);
    if (!ref) ref = randomPolyomino(r, SHAPE_CELLS); /* fallback, still valid geometry */
    const mirror = r() < 0.5;
    const rot = 1 + Math.floor(r() * 3);   /* 1-3 quarter turns (never 0, so it's non-trivial) */
    let cand = mirror ? reflect(ref) : ref.slice();
    cand = rotateN(cand, rot);
    return {
      reference: normalize(ref),
      candidate: cand,
      answer: mirror ? 'mirror' : 'same',
      rotation: rot * 90
    };
  }

  function buildTest(rand, count) {
    const n = count || ITEMS;
    const items = [];
    for (let i = 0; i < n; i++) items.push(makeItem(rand));
    return items;
  }

  function scoreTest(items, answers, times) {
    const stats = AurorIQ.stats;
    items = Array.isArray(items) ? items : [];
    answers = Array.isArray(answers) ? answers : [];
    times = Array.isArray(times) ? times : [];
    let correct = 0;
    const correctTimes = [];
    items.forEach(function (item, i) {
      if (!item) return;
      if (answers[i] === item.answer) {
        correct += 1;
        if (Number.isFinite(times[i]) && times[i] >= 0) correctTimes.push(times[i]);
      }
    });
    const total = items.length;
    if (!total) {
      return { valid: false, correct: 0, total: 0, accuracy: 0, medianMs: null, composite: null, atChance: false };
    }
    const accuracy = Math.round((correct / total) * 100);
    const median = correctTimes.length ? stats.median(correctTimes) : null;
    const medianMs = median === null ? null : Math.round(median);
    const aboveChance = Math.max(0, (correct / total - 0.5) / 0.5);
    let composite = Math.round(aboveChance * 98) + 1;
    if (medianMs !== null && accuracy >= 75) {
      if (medianMs < 3000) composite = Math.min(99, composite + 6);
      else if (medianMs > 8000) composite = Math.max(1, composite - 6);
    }
    composite = Math.min(99, Math.max(1, composite));
    return { valid: true, correct: correct, total: total, accuracy: accuracy, medianMs: medianMs, composite: composite, atChance: accuracy <= 58 };
  }

  /* Render a cell set as an SVG string (pure; testable for structure). */
  function toSvg(cells, px) {
    const unit = px || 26;
    const gap = 2;
    let maxX = 0, maxY = 0;
    cells.forEach(function (c) { if (c[0] > maxX) maxX = c[0]; if (c[1] > maxY) maxY = c[1]; });
    const w = (maxX + 1) * unit;
    const h = (maxY + 1) * unit;
    let rects = '';
    cells.forEach(function (c) {
      rects += '<rect x="' + (c[0] * unit + gap) + '" y="' + (c[1] * unit + gap) +
        '" width="' + (unit - gap * 2) + '" height="' + (unit - gap * 2) +
        '" rx="3" fill="url(#spatialFill)"/>';
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h +
      '" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="spatialFill" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#5aa2f7"/><stop offset="1" stop-color="#22d3ee"/>' +
      '</linearGradient></defs>' + rects + '</svg>';
  }

  AurorIQ.spatialEngine = {
    ITEMS: ITEMS,
    SHAPE_CELLS: SHAPE_CELLS,
    normalize: normalize,
    key: key,
    rotate90: rotate90,
    reflect: reflect,
    rotations: rotations,
    rotateN: rotateN,
    isChiral: isChiral,
    randomPolyomino: randomPolyomino,
    chiralPolyomino: chiralPolyomino,
    makeItem: makeItem,
    buildTest: buildTest,
    scoreTest: scoreTest,
    toSvg: toSvg
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.spatialEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-spatial-app]');
  if (!root) return;

  const els = {
    screens: {},
    reference: root.querySelector('[data-sp-reference]'),
    candidate: root.querySelector('[data-sp-candidate]'),
    progress: root.querySelector('[data-sp-progress]'),
    feedback: root.querySelector('[data-sp-feedback]'),
    results: {
      composite: root.querySelector('[data-res-composite]'),
      accuracy: root.querySelector('[data-res-accuracy]'),
      correct: root.querySelector('[data-res-correct]'),
      speed: root.querySelector('[data-res-speed]'),
      verdict: root.querySelector('[data-res-verdict]')
    }
  };
  root.querySelectorAll('[data-sp-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-sp-screen')] = el;
  });

  let items = [];
  let idx = 0;
  const answers = [];
  const times = [];
  let shownAt = 0;

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

  function renderItem() {
    const item = items[idx];
    els.reference.innerHTML = AurorIQ.spatialEngine.toSvg(item.reference);
    els.candidate.innerHTML = AurorIQ.spatialEngine.toSvg(item.candidate);
    els.progress.textContent = 'Shape ' + (idx + 1) + ' of ' + items.length;
    els.feedback.textContent = '';
    shownAt = performance.now();
  }

  function answer(choice) {
    times[idx] = performance.now() - shownAt;
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
    const r = AurorIQ.spatialEngine.scoreTest(items, answers, times);
    els.results.composite.textContent = r.composite + '/100';
    els.results.accuracy.textContent = r.accuracy + '%';
    els.results.correct.textContent = r.correct + ' / ' + r.total;
    els.results.speed.textContent = r.medianMs !== null
      ? (r.medianMs / 1000).toFixed(1) + ' s' : '\u2014';
    els.results.verdict.textContent = r.atChance
      ? 'Your accuracy is close to guessing (50% is chance on a two-choice task), so the score is withheld as unreliable \u2014 try again when you can give it full attention.'
      : 'The composite is an internal index, not a population percentile: a twelve-item, two-choice test is a rough snapshot of spatial ability, not a precise measurement.';
    if (r.atChance) els.results.composite.textContent = '\u2014';
    if (AurorIQ.reports) AurorIQ.reports.render('spatial', r, els.screens.results);
    show('results');
  }

  function start() {
    items = AurorIQ.spatialEngine.buildTest(null, AurorIQ.spatialEngine.ITEMS);
    idx = 0;
    answers.length = 0;
    times.length = 0;
    show('play');
    renderItem();
  }

  root.querySelectorAll('[data-sp-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-sp-answer]').forEach(function (b) {
    b.addEventListener('click', function () { answer(b.getAttribute('data-sp-answer')); });
  });
  root.querySelectorAll('[data-sp-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
