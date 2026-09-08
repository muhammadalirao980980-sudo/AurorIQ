/* reaction.js — Reaction Time instrument (v6.2).
 * Simple visual reaction time — the classic processing-speed index.
 * One practice trial (discarded) + five scored trials. Each trial: a random
 * 1.5–3.5 s wait, then the arena flips to GO; time from flip to press is the
 * trial's RT. Pressing during the wait is a false start: the trial is
 * discarded and repeated.
 *
 * Score = MEDIAN of the five trials (robust to one bad tap), placed against
 * approximate computer-administered adult norms ≈ N(284 ms, 60 ms), lower is
 * better. Absolute values include device/display latency, so percentiles are
 * ALWAYS presented as approximations (BRAND.md §4-5).
 *
 * Everything runs on-device. Nothing is transmitted or stored.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const NORMS = { mean: 284, sd: 60 };
  const SCORED_TRIALS = 5;
  const PRACTICE_TRIALS = 1;
  const WAIT_MIN_MS = 1500;
  const WAIT_MAX_MS = 3500;
  const MIN_VALID_RT = 90;   /* below human simple-RT floor => anticipatory, discard */

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function createSession(rand) {
    return {
      trial: 0,                 /* completed scored trials */
      practiceLeft: PRACTICE_TRIALS,
      times: [],
      falseStarts: 0,
      done: false,
      rand: rand || Math.random
    };
  }

  function nextWait(session, minMs, maxMs) {
    const lo = typeof minMs === 'number' ? minMs : WAIT_MIN_MS;
    const hi = typeof maxMs === 'number' ? maxMs : WAIT_MAX_MS;
    return Math.round(lo + session.rand() * (hi - lo));
  }

  /* Press during the wait phase. Trial repeats; nothing is recorded. */
  function recordFalseStart(session) {
    if (!session.done) session.falseStarts += 1;
    return session;
  }

  /* Press after GO. Returns 'practice' | 'anticipatory' | 'scored'. */
  function recordReaction(session, ms) {
    if (session.done) return 'done';
    if (ms < MIN_VALID_RT) return 'anticipatory'; /* repeat trial, record nothing */
    if (session.practiceLeft > 0) {
      session.practiceLeft -= 1;
      return 'practice';
    }
    session.times.push(Math.round(ms));
    session.trial += 1;
    if (session.trial >= SCORED_TRIALS) session.done = true;
    return 'scored';
  }

  function scoreSession(session) {
    const stats = AurorIQ.stats;
    const med = stats.median(session.times);
    return {
      times: session.times.slice(),
      median: Math.round(med),
      best: Math.min.apply(null, session.times),
      percentile: stats.percentile(med, NORMS.mean, NORMS.sd, true),
      falseStarts: session.falseStarts
    };
  }

  AurorIQ.reactionEngine = {
    NORMS: NORMS,
    SCORED_TRIALS: SCORED_TRIALS,
    PRACTICE_TRIALS: PRACTICE_TRIALS,
    WAIT_MIN_MS: WAIT_MIN_MS,
    WAIT_MAX_MS: WAIT_MAX_MS,
    MIN_VALID_RT: MIN_VALID_RT,
    createSession: createSession,
    nextWait: nextWait,
    recordFalseStart: recordFalseStart,
    recordReaction: recordReaction,
    scoreSession: scoreSession
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.reactionEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-reaction-app]');
  if (!root) return;

  const waitMin = parseInt(root.getAttribute('data-wait-min-ms'), 10) || WAIT_MIN_MS;
  const waitMax = parseInt(root.getAttribute('data-wait-max-ms'), 10) || WAIT_MAX_MS;

  const els = {
    screens: {},
    arena: root.querySelector('[data-rt-arena]'),
    arenaText: root.querySelector('[data-rt-arena-text]'),
    status: root.querySelector('[data-rt-status]'),
    progress: root.querySelector('[data-rt-progress]'),
    results: {
      median: root.querySelector('[data-res-median]'),
      best: root.querySelector('[data-res-best]'),
      pct: root.querySelector('[data-res-pct]'),
      trials: root.querySelector('[data-res-trials]'),
      falseStarts: root.querySelector('[data-res-false-starts]')
    }
  };
  root.querySelectorAll('[data-rt-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-rt-screen')] = el;
  });

  let session = null;
  let phase = 'idle';           /* idle | waiting | go */
  let waitTimer = null;
  let goAt = 0;

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) {
      els.screens[k].hidden = k !== screen;
    });
  }

  function setArena(state, text) {
    els.arena.setAttribute('data-state', state);
    els.arenaText.textContent = text;
  }

  function progressLabel() {
    if (session.practiceLeft > 0) return 'Practice trial';
    return 'Trial ' + (session.trial + 1) + ' of ' + SCORED_TRIALS;
  }

  function beginTrial() {
    phase = 'waiting';
    els.progress.textContent = progressLabel();
    els.status.textContent = 'Wait for GO\u2026';
    setArena('wait', 'Wait\u2026');
    clearTimeout(waitTimer);
    waitTimer = setTimeout(function () {
      phase = 'go';
      goAt = performance.now();
      setArena('go', 'GO!');
      els.status.textContent = 'Press now!';
    }, AurorIQ.reactionEngine.nextWait(session, waitMin, waitMax));
  }

  function handlePress() {
    if (phase === 'waiting') {
      clearTimeout(waitTimer);
      AurorIQ.reactionEngine.recordFalseStart(session);
      phase = 'idle';
      setArena('false', 'Too soon');
      els.status.textContent = 'That was a false start \u2014 it doesn\u2019t count. Get ready\u2026';
      waitTimer = setTimeout(beginTrial, 1200);
      return;
    }
    if (phase !== 'go') return;
    const rt = performance.now() - goAt;
    phase = 'idle';
    const kind = AurorIQ.reactionEngine.recordReaction(session, rt);

    if (kind === 'anticipatory') {
      setArena('false', 'Too fast');
      els.status.textContent = 'Under ' + MIN_VALID_RT + ' ms reads as a guess \u2014 trial repeats.';
      waitTimer = setTimeout(beginTrial, 1200);
      return;
    }
    if (kind === 'practice') {
      setArena('done', Math.round(rt) + ' ms');
      els.status.textContent = 'Practice done \u2014 now for real.';
      waitTimer = setTimeout(beginTrial, 1200);
      return;
    }
    /* scored */
    setArena('done', Math.round(rt) + ' ms');
    if (session.done) {
      waitTimer = setTimeout(finish, 900);
    } else {
      els.status.textContent = 'Logged. Next one\u2026';
      waitTimer = setTimeout(beginTrial, 1200);
    }
  }

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  function finish() {
    const r = AurorIQ.reactionEngine.scoreSession(session);
    els.results.median.textContent = r.median + ' ms';
    els.results.best.textContent = r.best + ' ms';
    els.results.pct.textContent = '~' + r.percentile + ordinal(r.percentile);
    els.results.trials.textContent = r.times.join(' \u00b7 ') + ' ms';
    els.results.falseStarts.textContent = r.falseStarts === 0
      ? 'No false starts.'
      : r.falseStarts + (r.falseStarts === 1 ? ' false start' : ' false starts') + ' (discarded).';
    show('results');
  }

  root.querySelectorAll('[data-rt-start]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      session = AurorIQ.reactionEngine.createSession();
      show('play');
      beginTrial();
    });
  });
  root.querySelectorAll('[data-rt-retry]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearTimeout(waitTimer);
      phase = 'idle';
      show('intro');
    });
  });

  els.arena.addEventListener('pointerdown', handlePress);
  els.arena.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handlePress(); }
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
