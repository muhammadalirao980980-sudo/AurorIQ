/* memory.js — Working-Memory Span instrument (v6.1).
 * Classic digit-span paradigm: digits are presented one at a time, then
 * recalled — forward first, then in reverse. Two trials per length; a length
 * is passed with at least one correct trial; the phase ends after both trials
 * at a length fail. Span = longest passed length.
 *
 * Percentiles use internal illustrative references, not verified population norms and are ALWAYS presented
 * as approximations (BRAND.md §4-5):
 *   forward  span ≈ N(6.6, 1.1)
 *   backward span ≈ N(4.9, 1.2)
 * Composite = percentile of the mean z-score of the two phases.
 *
 * Everything runs on-device. Nothing is transmitted or stored.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const NORMS = {
    forward:  { mean: 6.6, sd: 1.1, start: 3 },
    backward: { mean: 4.9, sd: 1.2, start: 2 }
  };
  const TRIALS_PER_LENGTH = 2;
  const MAX_LENGTH = 11;

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function makeSequence(length, rand) {
    const r = rand || Math.random;
    const seq = [];
    for (let i = 0; i < length; i++) {
      let d;
      do { d = Math.floor(r() * 10); }
      while (i > 0 && d === seq[i - 1]); /* no immediate repeats — standard practice */
      seq.push(d);
    }
    return seq;
  }

  function expectedAnswer(seq, phase) {
    return (phase === 'backward' ? seq.slice().reverse() : seq).join('');
  }

  function createPhase(phase, rand) {
    return {
      phase: phase,
      length: NORMS[phase].start,
      trial: 0,             /* 0 or 1 within current length */
      failsAtLength: 0,
      bestSpan: 0,
      done: false,
      rand: rand || Math.random
    };
  }

  /* Record one trial result; mutates and returns state. */
  function recordTrial(state, correct) {
    if (state.done) return state;
    if (correct) {
      state.bestSpan = Math.max(state.bestSpan, state.length);
      state.length += 1;
      state.trial = 0;
      state.failsAtLength = 0;
      if (state.length > MAX_LENGTH) state.done = true;
    } else {
      state.failsAtLength += 1;
      state.trial += 1;
      if (state.failsAtLength >= TRIALS_PER_LENGTH) {
        state.done = true;
      }
    }
    return state;
  }

  function scoreResult(forwardSpan, backwardSpan) {
    const stats = AurorIQ.stats;
    const forwardValid = Number.isFinite(forwardSpan) && forwardSpan >= 0;
    const backwardValid = Number.isFinite(backwardSpan) && backwardSpan >= 0;
    const f = NORMS.forward, b = NORMS.backward;
    const zs = [stats.zScore(forwardSpan, f.mean, f.sd), stats.zScore(backwardSpan, b.mean, b.sd)];
    return {
      valid: forwardValid && backwardValid,
      forward: { span: forwardValid ? forwardSpan : null, percentile: forwardValid ? stats.percentile(forwardSpan, f.mean, f.sd) : null },
      backward: { span: backwardValid ? backwardSpan : null, percentile: backwardValid ? stats.percentile(backwardSpan, b.mean, b.sd) : null },
      composite: forwardValid && backwardValid ? stats.compositePercentile(zs) : null
    };
  }

  AurorIQ.memoryEngine = {
    NORMS: NORMS,
    TRIALS_PER_LENGTH: TRIALS_PER_LENGTH,
    MAX_LENGTH: MAX_LENGTH,
    makeSequence: makeSequence,
    expectedAnswer: expectedAnswer,
    createPhase: createPhase,
    recordTrial: recordTrial,
    scoreResult: scoreResult
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.memoryEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-memory-app]');
  if (!root) return;

  const DIGIT_MS = parseInt(root.getAttribute('data-digit-ms'), 10) || 900;
  const GAP_MS = Math.max(120, Math.round(DIGIT_MS / 4));

  const els = {
    screens: {},
    digit: root.querySelector('[data-mem-digit]'),
    phaseLabel: root.querySelector('[data-mem-phase]'),
    lengthLabel: root.querySelector('[data-mem-length]'),
    input: root.querySelector('[data-mem-input]'),
    form: root.querySelector('[data-mem-form]'),
    feedback: root.querySelector('[data-mem-feedback]'),
    keypad: root.querySelector('[data-mem-keypad]'),
    results: {
      fSpan: root.querySelector('[data-res-forward-span]'),
      fPct: root.querySelector('[data-res-forward-pct]'),
      bSpan: root.querySelector('[data-res-backward-span]'),
      bPct: root.querySelector('[data-res-backward-pct]'),
      comp: root.querySelector('[data-res-composite]')
    }
  };
  root.querySelectorAll('[data-mem-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-mem-screen')] = el;
  });

  let state = null;
  let currentSeq = [];
  let timers = [];

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) {
      els.screens[k].hidden = k !== screen;
    });
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function presentSequence(seq, thenFn) {
    clearTimers();
    show('present');
    els.phaseLabel.textContent = state.phase === 'forward' ? 'Forward' : 'Backward';
    els.lengthLabel.textContent = seq.length + ' digits';
    let t = 300;
    seq.forEach(function (d) {
      timers.push(setTimeout(function () {
        els.digit.textContent = String(d);
      }, t));
      t += DIGIT_MS;
      timers.push(setTimeout(function () {
        els.digit.textContent = '';
      }, t - GAP_MS));
    });
    timers.push(setTimeout(function () {
      els.digit.textContent = '';
      thenFn();
    }, t + 100));
  }

  function askRecall() {
    show('recall');
    els.feedback.textContent = state.phase === 'backward'
      ? 'Type the digits in REVERSE order.'
      : 'Type the digits in the order shown.';
    els.input.value = '';
    els.input.setAttribute('maxlength', String(currentSeq.length));
    els.input.focus();
  }

  function nextTrial() {
    currentSeq = AurorIQ.memoryEngine.makeSequence(state.length, state.rand);
    presentSequence(currentSeq, askRecall);
  }

  let forwardSpan = null;

  function handleAnswer(value) {
    const correct = value.replace(/\D/g, '') ===
      AurorIQ.memoryEngine.expectedAnswer(currentSeq, state.phase);
    AurorIQ.memoryEngine.recordTrial(state, correct);

    if (!state.done) { nextTrial(); return; }

    if (state.phase === 'forward') {
      forwardSpan = state.bestSpan;
      state = AurorIQ.memoryEngine.createPhase('backward');
      show('interlude');
      return;
    }
    finish(forwardSpan, state.bestSpan);
  }

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  function finish(fSpan, bSpan) {
    const r = AurorIQ.memoryEngine.scoreResult(fSpan, bSpan);
    els.results.fSpan.textContent = String(r.forward.span);
    els.results.fPct.textContent = '~' + r.forward.percentile + ordinal(r.forward.percentile) + ' percentile';
    els.results.bSpan.textContent = String(r.backward.span);
    els.results.bPct.textContent = '~' + r.backward.percentile + ordinal(r.backward.percentile) + ' percentile';
    els.results.comp.textContent = '~' + r.composite;
    if (AurorIQ.reports) AurorIQ.reports.render('memory', r, els.screens.results);
    show('results');
  }

  /* wire-up */
  root.querySelectorAll('[data-mem-start]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state = AurorIQ.memoryEngine.createPhase('forward');
      forwardSpan = null;
      nextTrial();
    });
  });
  root.querySelectorAll('[data-mem-continue]').forEach(function (btn) {
    btn.addEventListener('click', function () { nextTrial(); });
  });
  root.querySelectorAll('[data-mem-retry]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state = AurorIQ.memoryEngine.createPhase('forward');
      forwardSpan = null;
      show('intro');
    });
  });
  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!els.input.value.trim()) return;
    handleAnswer(els.input.value);
  });
  if (els.keypad) {
    els.keypad.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-key]');
      if (!b) return;
      const k = b.getAttribute('data-key');
      if (k === 'back') els.input.value = els.input.value.slice(0, -1);
      else if (k === 'go') { if (els.input.value.trim()) handleAnswer(els.input.value); }
      else if (els.input.value.length < currentSeq.length) els.input.value += k;
      els.input.focus();
    });
  }

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
