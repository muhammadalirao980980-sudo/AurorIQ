/* career.js — Career Interest Profiler (v6.9).
 * Based on the RIASEC model (Holland Codes): a public-domain, well-validated
 * framework describing vocational INTERESTS across six themes — Realistic,
 * Investigative, Artistic, Social, Enterprising, Conventional.
 *
 * HONESTY NOTE (BRAND.md §5): this measures what kinds of work you're drawn to,
 * NOT how good you'd be at them. Interests are one useful input to career fit,
 * alongside skills, values, and circumstances. The results say this plainly and
 * frame suggestions as directions to explore, never as verdicts.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const DIMS = ['R', 'I', 'A', 'S', 'E', 'C'];
  const DIM_INFO = {
    R: { name: 'Realistic', blurb: 'Hands-on, practical, physical — building, fixing, working with tools, machines, plants, or animals.',
         careers: ['Electrician', 'Mechanical engineer', 'Carpenter', 'Pilot', 'Landscape designer', 'Paramedic'] },
    I: { name: 'Investigative', blurb: 'Analytical and curious — researching, experimenting, and solving abstract or technical problems.',
         careers: ['Data scientist', 'Research scientist', 'Software developer', 'Physician', 'Economist', 'Lab analyst'] },
    A: { name: 'Artistic', blurb: 'Creative and expressive — designing, writing, performing, and working without rigid structure.',
         careers: ['Graphic designer', 'Writer', 'Architect', 'Musician', 'UX designer', 'Film editor'] },
    S: { name: 'Social', blurb: 'People-centered — helping, teaching, advising, and caring for others.',
         careers: ['Teacher', 'Nurse', 'Counselor', 'Social worker', 'HR specialist', 'Physical therapist'] },
    E: { name: 'Enterprising', blurb: 'Persuasive and driven — leading, selling, pitching, and taking charge of projects and people.',
         careers: ['Entrepreneur', 'Sales manager', 'Lawyer', 'Marketing director', 'Real-estate agent', 'Product manager'] },
    C: { name: 'Conventional', blurb: 'Organized and detail-oriented — structuring data, records, and processes with accuracy.',
         careers: ['Accountant', 'Financial analyst', 'Operations manager', 'Auditor', 'Database administrator', 'Logistics planner'] }
  };

  /* 5 items per dimension. text completes "How much would you enjoy…" */
  const BANK = [
    { dim: 'R', text: 'Repairing an engine or a piece of machinery' },
    { dim: 'R', text: 'Building furniture or a structure with your hands' },
    { dim: 'R', text: 'Working outdoors with plants, animals, or the land' },
    { dim: 'R', text: 'Operating tools, vehicles, or heavy equipment' },
    { dim: 'R', text: 'Installing or wiring electronic equipment' },

    { dim: 'I', text: 'Analyzing data to uncover a hidden pattern' },
    { dim: 'I', text: 'Running an experiment to test an idea' },
    { dim: 'I', text: 'Solving a difficult mathematical or logical problem' },
    { dim: 'I', text: 'Researching a scientific or technical question in depth' },
    { dim: 'I', text: 'Figuring out how a complex system actually works' },

    { dim: 'A', text: 'Designing a poster, logo, or visual layout' },
    { dim: 'A', text: 'Writing a story, script, or piece of music' },
    { dim: 'A', text: 'Performing, acting, or presenting to an audience' },
    { dim: 'A', text: 'Coming up with original ideas without set rules' },
    { dim: 'A', text: 'Decorating a space or styling an image' },

    { dim: 'S', text: 'Teaching someone a skill until it clicks' },
    { dim: 'S', text: 'Listening to and advising someone with a problem' },
    { dim: 'S', text: 'Caring for people who are sick or in need' },
    { dim: 'S', text: 'Organizing a group activity that helps others' },
    { dim: 'S', text: 'Volunteering for a community or social cause' },

    { dim: 'E', text: 'Persuading people to support your idea or plan' },
    { dim: 'E', text: 'Leading a team toward an ambitious goal' },
    { dim: 'E', text: 'Selling a product or pitching to investors' },
    { dim: 'E', text: 'Starting your own business or venture' },
    { dim: 'E', text: 'Negotiating a deal or a contract' },

    { dim: 'C', text: 'Keeping detailed records accurate and up to date' },
    { dim: 'C', text: 'Organizing information into a clear system' },
    { dim: 'C', text: 'Following a precise procedure without errors' },
    { dim: 'C', text: 'Balancing budgets or managing accounts' },
    { dim: 'C', text: 'Scheduling and coordinating logistics' }
  ];

  const ITEMS_PER_DIM = 5;
  const SCALE_MIN = 1;   /* strongly dislike */
  const SCALE_MAX = 5;   /* strongly like */

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

  /* Items carry their dimension, so order can be shuffled freely. */
  function buildTest(rand) {
    return shuffle(BANK, rand).map(function (it) {
      return { dim: it.dim, text: it.text };
    });
  }

  /* ratings: array aligned to items, each SCALE_MIN..SCALE_MAX (or 0/undefined
   * = unanswered, treated as neutral midpoint for robustness). */
  function scoreTest(items, ratings) {
    const sums = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    items.forEach(function (item, i) {
      let v = ratings[i];
      if (typeof v !== 'number' || v < SCALE_MIN || v > SCALE_MAX) {
        v = (SCALE_MIN + SCALE_MAX) / 2; /* neutral fallback */
      }
      sums[item.dim] += v;
      counts[item.dim] += 1;
    });
    const scores = {};
    DIMS.forEach(function (d) {
      const n = counts[d] || ITEMS_PER_DIM;
      const min = n * SCALE_MIN, max = n * SCALE_MAX;
      scores[d] = Math.round(((sums[d] - min) / (max - min)) * 100);
    });
    /* rank dims by score desc, stable tie-break by DIMS order */
    const ranked = DIMS.slice().sort(function (a, b) {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return DIMS.indexOf(a) - DIMS.indexOf(b);
    });
    const code = ranked.slice(0, 3).join('');
    return {
      scores: scores,
      ranked: ranked,
      code: code,
      top: ranked.slice(0, 3).map(function (d) {
        return { dim: d, name: DIM_INFO[d].name, score: scores[d],
                 blurb: DIM_INFO[d].blurb, careers: DIM_INFO[d].careers };
      })
    };
  }

  AurorIQ.careerEngine = {
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
    module.exports = AurorIQ.careerEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-career-app]');
  if (!root) return;

  const els = {
    screens: {},
    form: root.querySelector('[data-ca-form]'),
    progress: root.querySelector('[data-ca-progress]'),
    submit: root.querySelector('[data-ca-submit]'),
    results: {
      code: root.querySelector('[data-res-code]'),
      bars: root.querySelector('[data-res-bars]'),
      top: root.querySelector('[data-res-top]')
    }
  };
  root.querySelectorAll('[data-ca-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-ca-screen')] = el;
  });

  let items = [];
  const SCALE_LABELS = ['Strongly dislike', 'Dislike', 'Neutral', 'Like', 'Strongly like'];

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
    els.results.code.textContent = r.code;
    els.results.bars.innerHTML = '';
    r.ranked.forEach(function (d) {
      const row = document.createElement('div');
      row.className = 'ca-bar';
      const label = document.createElement('span');
      label.className = 'ca-bar__label';
      label.textContent = AurorIQ.careerEngine.DIM_INFO[d].name;
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
      const list = document.createElement('p');
      list.className = 'ca-top__careers';
      list.textContent = 'Explore: ' + t.careers.join(', ');
      card.appendChild(h); card.appendChild(p); card.appendChild(list);
      els.results.top.appendChild(card);
    });
  }

  function submit() {
    const r = AurorIQ.careerEngine.scoreTest(items, collectRatings());
    renderResults(r);
    show('results');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function start() {
    items = AurorIQ.careerEngine.buildTest();
    renderForm();
    updateProgress();
    show('play');
  }

  root.querySelectorAll('[data-ca-start]').forEach(function (b) { b.addEventListener('click', start); });
  if (els.submit) els.submit.addEventListener('click', submit);
  root.querySelectorAll('[data-ca-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
