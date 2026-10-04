/* workstyle.js — Work Style Profiler (v6.15).
 * Maps working PREFERENCES across six bipolar spectrums drawn from organizational
 * psychology: how you prefer to collaborate, structure work, focus, decide, pace
 * yourself, and what environment suits you. Every spectrum is a preference, not an
 * ability — no end is better, and "balanced" is a genuine result, not a fence-sit.
 *
 * Items are balanced toward both poles (half reverse-keyed) to blunt the tendency
 * to just agree with everything.
 *
 * HONESTY NOTE (BRAND.md §5): preferences aren't skills or destiny. They shift with
 * context (a role, a team, a deadline), and self-report captures how you see
 * yourself, not how you always behave. This is a mirror for self-awareness and for
 * talking about fit — never a label, a type, or a hiring signal.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  /* Each dimension: a spectrum from pole A (score 0) to pole B (score 100).
   * items 'toward' A or B; a 1-5 agreement maps to the B-ward contribution. */
  const DIMS = [
    {
      key: 'collab',
      a: { name: 'Independent', helps: 'Protect solo focus time and let people know when you\u2019re heads-down. Your clearest thinking happens alone.' },
      b: { name: 'Collaborative', helps: 'Seek out sounding boards and shared work. You sharpen ideas by talking them through with others.' },
      mid: 'You move comfortably between solo and shared work, picking whichever the task calls for.',
      items: [
        { text: 'I do my best work bouncing ideas off other people.', toward: 'b' },
        { text: 'I\u2019d rather solve a hard problem as a team than alone.', toward: 'b' },
        { text: 'I focus best when I can work on my own for long stretches.', toward: 'a' },
        { text: 'Too much collaboration tends to slow me down.', toward: 'a' }
      ]
    },
    {
      key: 'structure',
      a: { name: 'Flexible', helps: 'Keep your options open and lean into improvising. Over-planning will feel like a straitjacket to you.' },
      b: { name: 'Structured', helps: 'Build the plan and the checklist up front. Clear scaffolding is what frees you to do good work.' },
      mid: 'You like enough of a plan to feel oriented, but keep room to adapt as things change.',
      items: [
        { text: 'I like having a clear plan before I start.', toward: 'b' },
        { text: 'Detailed schedules help me do my best work.', toward: 'b' },
        { text: 'I work best when I can improvise and adapt as I go.', toward: 'a' },
        { text: 'Rigid plans tend to feel constraining to me.', toward: 'a' }
      ]
    },
    {
      key: 'focus',
      a: { name: 'Deep focus', helps: 'Batch similar work and defend long, uninterrupted blocks. Context-switching is expensive for you.' },
      b: { name: 'Variety', helps: 'Mix your tasks and let yourself switch gears. Variety is what keeps your energy up.' },
      mid: 'You can settle into deep work or juggle several things, depending on the day.',
      items: [
        { text: 'I like juggling several different tasks in a day.', toward: 'b' },
        { text: 'Switching between tasks keeps me energized.', toward: 'b' },
        { text: 'I do my best work with long, uninterrupted focus.', toward: 'a' },
        { text: 'Frequent task-switching drains me.', toward: 'a' }
      ]
    },
    {
      key: 'decisions',
      a: { name: 'Analytical', helps: 'Give yourself time to gather evidence before committing. You trust a decision you can explain.' },
      b: { name: 'Intuitive', helps: 'Trust your read of a situation and act on it. You often sense the right call before the data catches up.' },
      mid: 'You blend evidence and instinct, weighting whichever the decision seems to need.',
      items: [
        { text: 'I often trust my gut when making decisions.', toward: 'b' },
        { text: 'I can sense the right call before I can fully explain it.', toward: 'b' },
        { text: 'I like to gather data before I decide.', toward: 'a' },
        { text: 'I trust careful analysis over instinct.', toward: 'a' }
      ]
    },
    {
      key: 'energy',
      a: { name: 'Steady', helps: 'Spread work evenly and start early. A consistent pace, not a final push, is where you shine.' },
      b: { name: 'Sprint', helps: 'Use focused bursts and real deadlines to your advantage \u2014 just build in the recovery afterward.' },
      mid: 'You can keep a steady rhythm or shift into a sprint when something calls for it.',
      items: [
        { text: 'I work best in intense bursts followed by rest.', toward: 'b' },
        { text: 'Deadlines tend to bring out my best work.', toward: 'b' },
        { text: 'I prefer a steady, consistent pace.', toward: 'a' },
        { text: 'I\u2019d rather spread work out evenly than sprint at the end.', toward: 'a' }
      ]
    },
    {
      key: 'environment',
      a: { name: 'Calm', helps: 'Seek quiet, low-stimulation spaces for your real work. Noise costs you more than it costs most people.' },
      b: { name: 'Stimulating', helps: 'Put yourself where there\u2019s energy and activity. A little buzz helps you switch on.' },
      mid: 'You can work in quiet or in a livelier space without much trouble either way.',
      items: [
        { text: 'A lively, buzzy environment energizes me.', toward: 'b' },
        { text: 'I like some background activity while I work.', toward: 'b' },
        { text: 'I concentrate best in quiet, calm spaces.', toward: 'a' },
        { text: 'Noise and activity around me are distracting.', toward: 'a' }
      ]
    }
  ];

  const SCALE_MIN = 1;   /* strongly disagree */
  const SCALE_MAX = 5;   /* strongly agree */
  const LEAN_LOW = 40;   /* <= leans A */
  const LEAN_HIGH = 60;  /* >= leans B */

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function shuffle(arr, rand) {
    const r = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Build a flat, shuffled item list carrying dimension + polarity. */
  function buildTest(rand) {
    const flat = [];
    DIMS.forEach(function (d) {
      d.items.forEach(function (it) {
        flat.push({ dim: d.key, toward: it.toward, text: it.text });
      });
    });
    return shuffle(flat, rand);
  }

  /* contribution toward pole B: a B-ward item contributes the raw rating;
   * an A-ward item contributes the reflected rating. */
  function bward(rating, toward) {
    return toward === 'b' ? rating : (SCALE_MIN + SCALE_MAX - rating);
  }

  function leanOf(pct) {
    if (pct <= LEAN_LOW) return 'a';
    if (pct >= LEAN_HIGH) return 'b';
    return 'mid';
  }

  function scoreTest(items, ratings) {
    items = Array.isArray(items) ? items : [];
    ratings = Array.isArray(ratings) ? ratings : [];
    const sums = {}, counts = {};
    DIMS.forEach(function (d) { sums[d.key] = 0; counts[d.key] = 0; });
    let answered = 0;
    items.forEach(function (item, i) {
      if (!item || !Object.prototype.hasOwnProperty.call(counts, item.dim)) return;
      let v = ratings[i];
      if (typeof v === 'number' && Number.isFinite(v) && v >= SCALE_MIN && v <= SCALE_MAX) {
        answered += 1;
      } else {
        v = (SCALE_MIN + SCALE_MAX) / 2;
      }
      sums[item.dim] += bward(v, item.toward);
      counts[item.dim] += 1;
    });
    const results = DIMS.map(function (d) {
      const n = counts[d.key];
      const avg = n ? sums[d.key] / n : (SCALE_MIN + SCALE_MAX) / 2;
      const pct = Math.round(((avg - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100);
      const lean = leanOf(pct);
      const descriptor = lean === 'a' ? d.a.name : lean === 'b' ? d.b.name : 'Balanced';
      const helps = lean === 'a' ? d.a.helps : lean === 'b' ? d.b.helps : d.mid;
      return { key: d.key, poleA: d.a.name, poleB: d.b.name, pct: pct, lean: lean, descriptor: descriptor, helps: helps };
    });
    return { valid: items.length > 0 && answered === items.length, answered: answered, total: items.length, dimensions: results };
  }

  AurorIQ.workStyleEngine = {
    DIMS: DIMS,
    SCALE_MIN: SCALE_MIN,
    SCALE_MAX: SCALE_MAX,
    LEAN_LOW: LEAN_LOW,
    LEAN_HIGH: LEAN_HIGH,
    shuffle: shuffle,
    buildTest: buildTest,
    bward: bward,
    leanOf: leanOf,
    scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.workStyleEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller (reuses ca-* + ws-* styles) ---------------- */

  const root = document.querySelector('[data-workstyle-app]');
  if (!root) return;

  const els = {
    screens: {},
    form: root.querySelector('[data-ws-form]'),
    progress: root.querySelector('[data-ws-progress]'),
    submit: root.querySelector('[data-ws-submit]'),
    spectrums: root.querySelector('[data-res-spectrums]')
  };
  root.querySelectorAll('[data-ws-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-ws-screen')] = el;
  });

  let items = [];
  const SCALE_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

  function renderForm() {
    els.form.innerHTML = '';
    items.forEach(function (item, qi) {
      const fs = document.createElement('fieldset');
      fs.className = 'ca-item';
      const legend = document.createElement('legend');
      legend.className = 'ca-item__legend';
      legend.textContent = (qi + 1) + '. ' + item.text;
      fs.appendChild(legend);
      const scale = document.createElement('div');
      scale.className = 'ca-scale';
      for (let v = 1; v <= 5; v++) {
        const id = 'q' + qi + 'v' + v;
        const label = document.createElement('label');
        label.className = 'ca-scale__opt';
        label.setAttribute('for', id);
        label.setAttribute('title', SCALE_LABELS[v - 1]);
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'q' + qi;
        input.id = id;
        input.value = String(v);
        input.addEventListener('change', updateProgress);
        const dot = document.createElement('span');
        dot.className = 'ca-scale__dot';
        dot.textContent = String(v);
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = SCALE_LABELS[v - 1];
        label.appendChild(input); label.appendChild(dot); label.appendChild(sr);
        scale.appendChild(label);
      }
      fs.appendChild(scale);
      els.form.appendChild(fs);
    });
  }

  function collectRatings() {
    return items.map(function (_, qi) {
      const c = els.form.querySelector('input[name="q' + qi + '"]:checked');
      return c ? parseInt(c.value, 10) : 0;
    });
  }
  function answeredCount() { return collectRatings().filter(function (v) { return v >= 1; }).length; }
  function updateProgress() {
    const done = answeredCount();
    els.progress.textContent = done + ' of ' + items.length + ' answered';
    if (done === items.length) els.submit.removeAttribute('disabled');
    else els.submit.setAttribute('disabled', 'disabled');
  }

  function renderResults(r) {
    if (AurorIQ.reports) AurorIQ.reports.render('workstyle', r, els.screens.results);
    els.spectrums.innerHTML = '';
    r.dimensions.forEach(function (d) {
      const row = document.createElement('div');
      row.className = 'ws-dim';

      const poles = document.createElement('div');
      poles.className = 'ws-dim__poles';
      const pa = document.createElement('span');
      pa.className = 'ws-dim__pole' + (d.lean === 'a' ? ' ws-dim__pole--on' : '');
      pa.textContent = d.poleA;
      const pb = document.createElement('span');
      pb.className = 'ws-dim__pole' + (d.lean === 'b' ? ' ws-dim__pole--on' : '');
      pb.textContent = d.poleB;
      poles.appendChild(pa); poles.appendChild(pb);

      const track = document.createElement('div');
      track.className = 'ws-dim__track';
      const marker = document.createElement('span');
      marker.className = 'ws-dim__marker';
      marker.style.left = d.pct + '%';
      track.appendChild(marker);

      const desc = document.createElement('p');
      desc.className = 'ws-dim__desc';
      const strong = document.createElement('strong');
      strong.textContent = d.descriptor + ' \u00b7 ';
      desc.appendChild(strong);
      desc.appendChild(document.createTextNode(d.helps));

      row.appendChild(poles); row.appendChild(track); row.appendChild(desc);
      els.spectrums.appendChild(row);
    });
  }

  function submit() {
    renderResults(AurorIQ.workStyleEngine.scoreTest(items, collectRatings()));
    show('results');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function start() {
    items = AurorIQ.workStyleEngine.buildTest();
    renderForm(); updateProgress(); show('play');
  }

  root.querySelectorAll('[data-ws-start]').forEach(function (b) { b.addEventListener('click', start); });
  if (els.submit) els.submit.addEventListener('click', submit);
  root.querySelectorAll('[data-ws-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
