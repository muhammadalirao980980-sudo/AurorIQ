/* focus.js — Sustained-Attention instrument (v6.4).
 * A Go/No-Go continuous-performance task: stimuli appear one after another;
 * respond to GO stimuli (the common case), withhold on NO-GO stimuli (rare).
 * This measures vigilance and response inhibition — the core of sustained
 * attention. Because NO-GO trials are rare, the habit to respond builds up,
 * so withholding is genuinely hard: commission errors are the key signal.
 *
 * Metrics (all honest, all approximate — BRAND.md §4-5):
 *   - accuracy: correct responses over all trials
 *   - commission errors: pressed on NO-GO (failure of inhibition)
 *   - omission errors: missed a GO (lapse of attention)
 *   - mean GO reaction time and its variability (SD) — high variability is
 *     itself a marker of wandering attention
 *   - a composite 1-99 "focus score" combining accuracy and consistency,
 *     presented as an approximation, never a diagnosis.
 *
 * On-device only. Nothing transmitted or stored.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const TOTAL_TRIALS = 40;
  const NOGO_RATE = 0.25;             /* ~10 of 40 are NO-GO */
  const STIMULUS_MS = 1000;           /* window to respond before it advances */
  const ISI_MS = 550;                 /* blank inter-stimulus interval */
  const MIN_VALID_RT = 120;           /* faster = anticipatory, not a true hit */

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  /* Build a randomized trial list with the target NO-GO rate, never starting
   * on a NO-GO (so the "go habit" has a chance to form first). */
  function buildTrials(rand, total, nogoRate) {
    const r = rand || Math.random;
    const n = total || TOTAL_TRIALS;
    const rate = typeof nogoRate === 'number' ? nogoRate : NOGO_RATE;
    const nogoCount = Math.round(n * rate);
    const trials = [];
    for (let i = 0; i < n; i++) trials.push({ nogo: i < nogoCount });
    /* Fisher-Yates */
    for (let i = trials.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = trials[i]; trials[i] = trials[j]; trials[j] = t;
    }
    /* ensure first two are GO */
    for (let k = 0; k < 2 && k < trials.length; k++) {
      if (trials[k].nogo) {
        const swap = trials.findIndex(function (t, idx) { return idx >= 2 && !t.nogo; });
        if (swap !== -1) { const tmp = trials[k]; trials[k] = trials[swap]; trials[swap] = tmp; }
      }
    }
    return trials;
  }

  function createSession(trials) {
    return {
      trials: trials,
      index: 0,
      responses: [],   /* { nogo, responded, rt|null, correct } */
      done: false
    };
  }

  /* Record the outcome of the current trial.
   * responded=true means a press happened during the stimulus window.
   * rt is ms from stimulus onset (null if no press). */
  function recordTrial(session, responded, rt) {
    if (session.done) return session;
    const trial = session.trials[session.index];
    const valid = responded && rt !== null && rt >= MIN_VALID_RT;
    let correct;
    if (trial.nogo) correct = !responded;               /* correct = withheld */
    else correct = valid;                               /* correct = valid hit */
    session.responses.push({
      nogo: trial.nogo,
      responded: !!responded,
      rt: responded ? rt : null,
      valid: valid,
      correct: correct
    });
    session.index += 1;
    if (session.index >= session.trials.length) session.done = true;
    return session;
  }

  function scoreSession(session) {
    const stats = AurorIQ.stats;
    const res = session && Array.isArray(session.responses) ? session.responses : [];
    const total = res.length;
    let commission = 0, omission = 0, correctCount = 0;
    const goRts = [];
    res.forEach(function (r) {
      if (!r) return;
      if (r.correct) correctCount += 1;
      if (r.nogo && r.responded) commission += 1;
      if (!r.nogo && !r.valid) omission += 1;
      if (!r.nogo && r.valid && Number.isFinite(r.rt) && r.rt >= 0) goRts.push(r.rt);
    });
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const meanRt = goRts.length ? Math.round(goRts.reduce(function (a, b) { return a + b; }, 0) / goRts.length) : null;
    let rtSd = null;
    if (goRts.length > 1) {
      const m = goRts.reduce(function (a, b) { return a + b; }, 0) / goRts.length;
      const v = goRts.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / goRts.length;
      rtSd = Math.round(Math.sqrt(v));
    }
    if (!total) {
      return { valid: false, total: 0, accuracy: 0, commissionErrors: 0, omissionErrors: 0, meanRt: null, rtSd: null, focusScore: null };
    }
    let focus = accuracy;
    if (meanRt && rtSd) {
      const cv = rtSd / meanRt;
      const penalty = Math.max(0, Math.min(25, Math.round((cv - 0.15) * 100)));
      focus = accuracy - penalty;
    }
    focus = Math.min(99, Math.max(1, focus));
    return { valid: true, total: total, accuracy: accuracy, commissionErrors: commission, omissionErrors: omission, meanRt: meanRt, rtSd: rtSd, focusScore: focus };
  }

  AurorIQ.focusEngine = {
    TOTAL_TRIALS: TOTAL_TRIALS,
    NOGO_RATE: NOGO_RATE,
    STIMULUS_MS: STIMULUS_MS,
    ISI_MS: ISI_MS,
    MIN_VALID_RT: MIN_VALID_RT,
    buildTrials: buildTrials,
    createSession: createSession,
    recordTrial: recordTrial,
    scoreSession: scoreSession
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.focusEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-focus-app]');
  if (!root) return;

  const stimMs = parseInt(root.getAttribute('data-stimulus-ms'), 10) || STIMULUS_MS;
  const isiMs = parseInt(root.getAttribute('data-isi-ms'), 10) || ISI_MS;

  const els = {
    screens: {},
    arena: root.querySelector('[data-fc-arena]'),
    glyph: root.querySelector('[data-fc-glyph]'),
    progress: root.querySelector('[data-fc-progress]'),
    status: root.querySelector('[data-fc-status]'),
    results: {
      focus: root.querySelector('[data-res-focus]'),
      accuracy: root.querySelector('[data-res-accuracy]'),
      commission: root.querySelector('[data-res-commission]'),
      omission: root.querySelector('[data-res-omission]'),
      rt: root.querySelector('[data-res-rt]'),
      consistency: root.querySelector('[data-res-consistency]')
    }
  };
  root.querySelectorAll('[data-fc-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-fc-screen')] = el;
  });

  let session = null;
  let phase = 'idle';        /* idle | stimulus */
  let shownAt = 0;
  let responded = false;
  let respondedRt = null;
  let stimTimer = null;
  let isiTimer = null;

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) {
      els.screens[k].hidden = k !== screen;
    });
  }

  function clearTimers() {
    clearTimeout(stimTimer);
    clearTimeout(isiTimer);
  }

  function nextTrial() {
    if (session.done) { finish(); return; }
    const trial = session.trials[session.index];
    els.progress.textContent = 'Trial ' + (session.index + 1) + ' of ' + session.trials.length;
    els.arena.setAttribute('data-state', trial.nogo ? 'nogo' : 'go');
    els.glyph.textContent = trial.nogo ? '\u25A0' : '\u25CF';   /* square = NO-GO, circle = GO */
    els.status.textContent = trial.nogo ? 'Square \u2014 do NOT press' : 'Circle \u2014 press!';
    phase = 'stimulus';
    responded = false;
    respondedRt = null;
    shownAt = performance.now();
    stimTimer = setTimeout(endStimulus, stimMs);
  }

  function endStimulus() {
    if (phase !== 'stimulus') return;
    phase = 'idle';
    AurorIQ.focusEngine.recordTrial(session, responded, respondedRt);
    els.arena.setAttribute('data-state', 'blank');
    els.glyph.textContent = '';
    els.status.textContent = '';
    isiTimer = setTimeout(nextTrial, isiMs);
  }

  function handlePress() {
    if (phase !== 'stimulus' || responded) return;
    responded = true;
    respondedRt = performance.now() - shownAt;
    /* GO: end immediately on valid press for snappier feel; NO-GO: let the
       window elapse so the error is recorded, but flag it now. */
    const trial = session.trials[session.index];
    els.arena.setAttribute('data-state', trial.nogo ? 'error' : 'hit');
  }

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  function finish() {
    clearTimers();
    const r = AurorIQ.focusEngine.scoreSession(session);
    els.results.focus.textContent = r.focusScore + '/100';
    els.results.accuracy.textContent = r.accuracy + '%';
    els.results.commission.textContent = String(r.commissionErrors);
    els.results.omission.textContent = String(r.omissionErrors);
    els.results.rt.textContent = r.meanRt !== null ? r.meanRt + ' ms' : '\u2014';
    els.results.consistency.textContent = r.rtSd !== null ? '\u00b1' + r.rtSd + ' ms' : '\u2014';
    if (AurorIQ.reports) AurorIQ.reports.render('focus', r, els.screens.results);
    show('results');
  }

  function start() {
    const trials = AurorIQ.focusEngine.buildTrials(null, AurorIQ.focusEngine.TOTAL_TRIALS, AurorIQ.focusEngine.NOGO_RATE);
    session = AurorIQ.focusEngine.createSession(trials);
    show('play');
    isiTimer = setTimeout(nextTrial, 600);
  }

  root.querySelectorAll('[data-fc-start]').forEach(function (b) {
    b.addEventListener('click', start);
  });
  root.querySelectorAll('[data-fc-retry]').forEach(function (b) {
    b.addEventListener('click', function () { clearTimers(); phase = 'idle'; show('intro'); });
  });
  els.arena.addEventListener('pointerdown', handlePress);
  els.arena.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handlePress(); }
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
