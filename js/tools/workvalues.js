/* workvalues.js — Work Values Profiler (v6.11).
 * Based on the six work values from the Theory of Work Adjustment (the basis of
 * O*NET's Work Importance framework): Achievement, Independence, Recognition,
 * Relationships, Support, and Working Conditions. These describe what a person
 * needs from work to feel satisfied — a public-domain, well-established model.
 *
 * Where the interest profiler asks what work DRAWS you, this asks what work must
 * PROVIDE for you to be content in it. The two are complementary inputs.
 *
 * HONESTY NOTE (BRAND.md §5): values often conflict, and no single job maxes all
 * six — a high-independence, high-security role is rare, for instance. Results are
 * a ranked map of your priorities for reflection and trade-off, not a job verdict.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const DIMS = ['ACH', 'IND', 'REC', 'REL', 'SUP', 'CON'];
  const DIM_INFO = {
    ACH: { name: 'Achievement', blurb: 'You need to use your abilities fully and see real results \u2014 a sense of accomplishment matters more than comfort.',
           lookFor: 'Roles with clear outcomes, room to master a craft, and visible impact from your effort.' },
    IND: { name: 'Independence', blurb: 'You need autonomy \u2014 to make your own decisions, set your own pace, and work with little oversight.',
           lookFor: 'Self-directed roles, flexible structures, and managers who delegate rather than supervise closely.' },
    REC: { name: 'Recognition', blurb: 'You need status and advancement \u2014 to be respected, to climb, and to have your contributions seen.',
           lookFor: 'Clear promotion paths, visible ownership, and cultures that reward and publicly credit strong work.' },
    REL: { name: 'Relationships', blurb: 'You need positive human connection \u2014 friendly colleagues, a chance to help others, and low conflict.',
           lookFor: 'Collaborative teams, service-oriented work, and workplaces with a warm, supportive social climate.' },
    SUP: { name: 'Support', blurb: 'You need to be backed \u2014 by fair management, good training, and leadership you can actually trust.',
           lookFor: 'Strong onboarding, consistent and fair policies, and managers who advocate for their people.' },
    CON: { name: 'Working Conditions', blurb: 'You need solid practical footing \u2014 security, fair pay, comfort, and variety in the day-to-day.',
           lookFor: 'Stable employers, competitive pay, safe conditions, and roles with enough variety to stay engaged.' }
  };

  /* 5 items per value. text completes "How important is it that your work…" */
  const BANK = [
    { dim: 'ACH', text: 'lets you use your skills to their fullest' },
    { dim: 'ACH', text: 'gives you a clear sense of accomplishment' },
    { dim: 'ACH', text: 'lets you see concrete results from your effort' },
    { dim: 'ACH', text: 'challenges you to keep improving' },
    { dim: 'ACH', text: 'rewards competence and mastery' },

    { dim: 'IND', text: 'lets you make your own decisions' },
    { dim: 'IND', text: 'allows you to work with little supervision' },
    { dim: 'IND', text: 'gives you freedom in how you do your tasks' },
    { dim: 'IND', text: 'lets you set your own pace' },
    { dim: 'IND', text: 'allows you to work independently rather than in a group' },

    { dim: 'REC', text: 'offers real opportunities for advancement' },
    { dim: 'REC', text: 'comes with status or prestige' },
    { dim: 'REC', text: 'is respected by people outside it' },
    { dim: 'REC', text: 'recognizes your contributions openly' },
    { dim: 'REC', text: 'positions you as a leader or authority' },

    { dim: 'REL', text: 'surrounds you with friendly coworkers' },
    { dim: 'REL', text: 'lets you help or serve other people' },
    { dim: 'REL', text: 'is free of conflict and hostility' },
    { dim: 'REL', text: 'gives you a sense of belonging' },
    { dim: 'REL', text: 'lets you build genuine connections' },

    { dim: 'SUP', text: 'has supportive, fair management' },
    { dim: 'SUP', text: 'provides clear guidance and training' },
    { dim: 'SUP', text: 'backs you up when problems arise' },
    { dim: 'SUP', text: 'treats employees fairly and consistently' },
    { dim: 'SUP', text: 'has leadership you can trust' },

    { dim: 'CON', text: 'offers strong job security' },
    { dim: 'CON', text: 'pays well' },
    { dim: 'CON', text: 'has comfortable, safe conditions' },
    { dim: 'CON', text: 'provides variety rather than monotony' },
    { dim: 'CON', text: 'keeps you busy and active' }
  ];

  const ITEMS_PER_DIM = 5;
  const SCALE_MIN = 1;   /* not important */
  const SCALE_MAX = 5;   /* essential */

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

  function buildTest(rand) {
    return shuffle(BANK, rand).map(function (it) {
      return { dim: it.dim, text: it.text };
    });
  }

  function scoreTest(items, ratings) {
    items = Array.isArray(items) ? items : [];
    ratings = Array.isArray(ratings) ? ratings : [];
    const sums = { ACH: 0, IND: 0, REC: 0, REL: 0, SUP: 0, CON: 0 };
    const counts = { ACH: 0, IND: 0, REC: 0, REL: 0, SUP: 0, CON: 0 };
    let answered = 0;
    items.forEach(function (item, i) {
      if (!item || !Object.prototype.hasOwnProperty.call(counts, item.dim)) return;
      let v = ratings[i];
      if (typeof v === 'number' && Number.isFinite(v) && v >= SCALE_MIN && v <= SCALE_MAX) {
        answered += 1;
      } else {
        v = (SCALE_MIN + SCALE_MAX) / 2;
      }
      sums[item.dim] += v;
      counts[item.dim] += 1;
    });
    const scores = {};
    DIMS.forEach(function (d) {
      const n = counts[d];
      if (!n) { scores[d] = 50; return; }
      const min = n * SCALE_MIN, max = n * SCALE_MAX;
      scores[d] = Math.round(((sums[d] - min) / (max - min)) * 100);
    });
    const ranked = DIMS.slice().sort(function (a, b) {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return DIMS.indexOf(a) - DIMS.indexOf(b);
    });
    const valid = items.length > 0 && answered === items.length;
    return {
      valid: valid,
      answered: answered,
      total: items.length,
      scores: scores,
      ranked: ranked,
      top: valid ? ranked.slice(0, 3).map(function (d) {
        return { dim: d, name: DIM_INFO[d].name, score: scores[d],
                 blurb: DIM_INFO[d].blurb, lookFor: DIM_INFO[d].lookFor };
      }) : []
    };
  }

  AurorIQ.workValuesEngine = {
    DIMS: DIMS,
    DIM_INFO: DIM_INFO,
    BANK: BANK,
    ITEMS_PER_DIM: ITEMS_PER_DIM,
    SCALE_MIN: SCALE_MIN,
    SCALE_MAX: SCALE_MAX,
    shuffle: shuffle,
    buildTest: buildTest,
    scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.workValuesEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller (reuses ca-* styles) ---------------- */

  const root = document.querySelector('[data-workvalues-app]');
  if (!root) return;

  const els = {
    screens: {},
    form: root.querySelector('[data-wv-form]'),
    progress: root.querySelector('[data-wv-progress]'),
    submit: root.querySelector('[data-wv-submit]'),
    results: {
      bars: root.querySelector('[data-res-bars]'),
      top: root.querySelector('[data-res-top]')
    }
  };
  root.querySelectorAll('[data-wv-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-wv-screen')] = el;
  });

  let items = [];
  const SCALE_LABELS = ['Not important', 'Slightly', 'Moderately', 'Very', 'Essential'];

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
      legend.textContent = (qi + 1) + '. That your work ' + item.text;
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
        label.appendChild(input);
        label.appendChild(dot);
        label.appendChild(sr);
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

  function answeredCount() {
    return collectRatings().filter(function (v) { return v >= 1; }).length;
  }

  function updateProgress() {
    const done = answeredCount();
    els.progress.textContent = done + ' of ' + items.length + ' answered';
    if (done === items.length) els.submit.removeAttribute('disabled');
    else els.submit.setAttribute('disabled', 'disabled');
  }

  function renderResults(r) {
    if (AurorIQ.reports) AurorIQ.reports.render('workvalues', r, els.screens.results);
    els.results.bars.innerHTML = '';
    r.ranked.forEach(function (d) {
      const row = document.createElement('div');
      row.className = 'ca-bar';
      const label = document.createElement('span');
      label.className = 'ca-bar__label';
      label.textContent = AurorIQ.workValuesEngine.DIM_INFO[d].name;
      const track = document.createElement('span');
      track.className = 'ca-bar__track';
      const fill = document.createElement('span');
      fill.className = 'ca-bar__fill';
      fill.style.width = r.scores[d] + '%';
      const val = document.createElement('span');
      val.className = 'ca-bar__val';
      val.textContent = r.scores[d] + '%';
      track.appendChild(fill);
      row.appendChild(label); row.appendChild(track); row.appendChild(val);
      els.results.bars.appendChild(row);
    });
    els.results.top.innerHTML = '';
    r.top.forEach(function (t) {
      const card = document.createElement('div');
      card.className = 'ca-top';
      const h = document.createElement('h3');
      h.className = 'ca-top__name';
      h.textContent = t.name + ' \u00b7 ' + t.score + '%';
      const p = document.createElement('p');
      p.className = 'ca-top__blurb';
      p.textContent = t.blurb;
      const look = document.createElement('p');
      look.className = 'ca-top__careers';
      look.textContent = 'Look for: ' + t.lookFor;
      card.appendChild(h); card.appendChild(p); card.appendChild(look);
      els.results.top.appendChild(card);
    });
  }

  function submit() {
    const r = AurorIQ.workValuesEngine.scoreTest(items, collectRatings());
    renderResults(r);
    show('results');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function start() {
    items = AurorIQ.workValuesEngine.buildTest();
    renderForm();
    updateProgress();
    show('play');
  }

  root.querySelectorAll('[data-wv-start]').forEach(function (b) { b.addEventListener('click', start); });
  if (els.submit) els.submit.addEventListener('click', submit);
  root.querySelectorAll('[data-wv-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
