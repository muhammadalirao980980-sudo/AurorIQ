/* habitanalyzer.js — Habit Analyzer (v6.16).
 * Scores how well a habit you're building is DESIGNED to stick, across five
 * factors the research links to habit formation:
 *   - Cue consistency   (a reliable, specific trigger; Lally; Wood & Neal)
 *   - Low friction      (easy to start; Fogg; Clear)
 *   - Repetition        (frequent, consistent practice drives automaticity)
 *   - Immediate reward   (in-the-moment payoff reinforces behavior)
 *   - Identity fit       (habits tied to who you want to be outlast pressure)
 *
 * It scores the SETUP, not your willpower or worth. Ineffective setups (vague
 * timing, high friction, sporadic practice) are reverse-scored.
 *
 * HONESTY NOTE (BRAND.md §5): good design raises the odds; it doesn't guarantee.
 * Even a well-built habit takes time — Lally et al. found a median around 66 days
 * to automaticity, ranging from roughly 18 to 250+. This is a design check and a
 * mirror, not a prediction or a verdict on you.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const DIMS = ['CUE', 'EASE', 'FREQ', 'REWARD', 'FIT'];
  const DIM_INFO = {
    CUE:    { name: 'Cue consistency', blurb: 'A reliable, specific trigger is what turns a deliberate act into autopilot. Vague timing keeps a habit effortful forever.',
              fix: 'Anchor it to something you already do daily \u2014 "after I pour my morning coffee, I will\u2026" A consistent, specific cue does the remembering for you.' },
    EASE:   { name: 'Low friction', blurb: 'The easier a habit is to start, the more it survives low-motivation days. Friction is where good intentions quietly die.',
              fix: 'Shrink it until it\u2019s almost too easy to skip, and remove one obstacle \u2014 lay out the gear, keep it visible. Make starting the path of least resistance.' },
    FREQ:   { name: 'Repetition', blurb: 'Automaticity is built by frequency, not intensity. A small daily rep beats an occasional heroic effort.',
              fix: 'Aim for daily, even a tiny version, over big occasional pushes. Repetition is the engine; consistency matters more than size.' },
    REWARD: { name: 'Immediate reward', blurb: 'The brain repeats what feels good now, not later. Habits whose payoff is distant struggle to take hold.',
              fix: 'Give yourself an instant marker of success \u2014 tick a box, say "done", pair it with something you enjoy. Make the reward land in the moment.' },
    FIT:    { name: 'Identity fit', blurb: 'Habits rooted in who you want to be outlast habits rooted in pressure. Alignment is what carries you when novelty fades.',
              fix: 'Reconnect it to an identity or value you actually hold \u2014 "I\u2019m someone who\u2026" A habit that expresses who you are needs far less willpower.' }
  };

  const SCALE_MIN = 1;   /* strongly disagree */
  const SCALE_MAX = 5;   /* strongly agree */
  const ITEMS_PER_DIM = 4;

  /* reverse:true items describe a WEAK setup — agreeing lowers the score. */
  const BANK = [
    { dim: 'CUE', reverse: false, text: 'I do this habit at the same time, or right after the same trigger, each day.' },
    { dim: 'CUE', reverse: false, text: 'There\u2019s a specific moment that reliably reminds me to do it.' },
    { dim: 'CUE', reverse: true,  text: 'I do it whenever I happen to remember.' },
    { dim: 'CUE', reverse: true,  text: 'The timing of this habit is different from day to day.' },

    { dim: 'EASE', reverse: false, text: 'Starting this habit takes very little effort or setup.' },
    { dim: 'EASE', reverse: false, text: 'I\u2019ve removed the obstacles that used to get in the way.' },
    { dim: 'EASE', reverse: true,  text: 'There\u2019s a lot of friction between deciding to do it and actually starting.' },
    { dim: 'EASE', reverse: true,  text: 'I often have to go out of my way to make it happen.' },

    { dim: 'FREQ', reverse: false, text: 'I do this habit consistently, most days.' },
    { dim: 'FREQ', reverse: false, text: 'I rarely skip it more than a day.' },
    { dim: 'FREQ', reverse: true,  text: 'Whole weeks can go by without me doing it.' },
    { dim: 'FREQ', reverse: true,  text: 'My practice of it is sporadic and on-and-off.' },

    { dim: 'REWARD', reverse: false, text: 'I feel a small sense of reward right after doing it.' },
    { dim: 'REWARD', reverse: false, text: 'There\u2019s an immediate payoff I actually enjoy.' },
    { dim: 'REWARD', reverse: true,  text: 'In the moment it just feels like a chore; any benefit is far off.' },
    { dim: 'REWARD', reverse: true,  text: 'I don\u2019t get any satisfying feedback from doing it.' },

    { dim: 'FIT', reverse: false, text: 'This habit fits the kind of person I want to be.' },
    { dim: 'FIT', reverse: false, text: 'I genuinely value what it\u2019s for, beyond outside pressure.' },
    { dim: 'FIT', reverse: true,  text: 'I\u2019m mostly doing it because I feel I should.' },
    { dim: 'FIT', reverse: true,  text: 'It doesn\u2019t really connect to anything I care about.' }
  ];

  const BANDS = [
    { key: 'low', label: 'Set up to struggle', min: 0, max: 40,
      summary: 'Right now the design is working against you \u2014 which is good news, because design is fixable in a way that willpower isn\u2019t. The levers below are the highest-leverage changes.' },
    { key: 'mid', label: 'A workable start', min: 41, max: 60,
      summary: 'You\u2019ve got some solid foundations and some real gaps. Strengthening your weakest factor below will likely do more than trying harder ever could.' },
    { key: 'good', label: 'Well designed', min: 61, max: 80,
      summary: 'This habit is set up to stick. Tightening the lowest factor below would push a good design into a durable one.' },
    { key: 'excellent', label: 'Built to last', min: 81, max: 100,
      summary: 'Strong design across every factor. From here, consistency does the rest \u2014 the structure is already on your side.' }
  ];

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
    return shuffle(BANK, rand).map(function (it) { return { dim: it.dim, reverse: it.reverse, text: it.text }; });
  }
  function aligned(rating, reverse) {
    return reverse ? (SCALE_MIN + SCALE_MAX - rating) : rating;
  }
  function bandFor(pct) {
    for (let i = 0; i < BANDS.length; i++) if (pct >= BANDS[i].min && pct <= BANDS[i].max) return BANDS[i];
    return BANDS[BANDS.length - 1];
  }
  function scoreTest(items, ratings) {
    items = Array.isArray(items) ? items : [];
    ratings = Array.isArray(ratings) ? ratings : [];
    const sums = { CUE: 0, EASE: 0, FREQ: 0, REWARD: 0, FIT: 0 };
    const counts = { CUE: 0, EASE: 0, FREQ: 0, REWARD: 0, FIT: 0 };
    let answered = 0;
    items.forEach(function (item, i) {
      if (!item || !Object.prototype.hasOwnProperty.call(counts, item.dim)) return;
      let v = ratings[i];
      if (typeof v === 'number' && Number.isFinite(v) && v >= SCALE_MIN && v <= SCALE_MAX) {
        answered += 1;
      } else {
        v = (SCALE_MIN + SCALE_MAX) / 2;
      }
      sums[item.dim] += aligned(v, item.reverse);
      counts[item.dim] += 1;
    });
    const scores = {};
    DIMS.forEach(function (d) {
      const n = counts[d];
      if (!n) { scores[d] = 50; return; }
      const min = n * SCALE_MIN, max = n * SCALE_MAX;
      scores[d] = Math.round(((sums[d] - min) / (max - min)) * 100);
    });
    const valid = items.length > 0 && answered === items.length;
    const overall = Math.round(DIMS.reduce(function (a, d) { return a + scores[d]; }, 0) / DIMS.length);
    const band = bandFor(overall);
    const weakest = DIMS.slice().sort(function (a, b) {
      if (scores[a] !== scores[b]) return scores[a] - scores[b];
      return DIMS.indexOf(a) - DIMS.indexOf(b);
    });
    const ranked = DIMS.slice().sort(function (a, b) {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return DIMS.indexOf(a) - DIMS.indexOf(b);
    });
    return {
      valid: valid, answered: answered, total: items.length,
      scores: scores,
      overall: valid ? overall : null,
      band: valid ? band.label : 'Incomplete',
      key: valid ? band.key : 'incomplete',
      summary: valid ? band.summary : 'Complete every item before interpreting this result.',
      ranked: ranked,
      fixes: valid ? weakest.slice(0, 2).map(function (d) {
        return { dim: d, name: DIM_INFO[d].name, score: scores[d], blurb: DIM_INFO[d].blurb, fix: DIM_INFO[d].fix };
      }) : []
    };
  }

  AurorIQ.habitAnalyzerEngine = {
    DIMS: DIMS, DIM_INFO: DIM_INFO, BANK: BANK, BANDS: BANDS,
    SCALE_MIN: SCALE_MIN, SCALE_MAX: SCALE_MAX, ITEMS_PER_DIM: ITEMS_PER_DIM,
    shuffle: shuffle, buildTest: buildTest, aligned: aligned, bandFor: bandFor, scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AurorIQ.habitAnalyzerEngine;
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller (reuses ca-* + ch-band styles) ---------------- */

  const root = document.querySelector('[data-habitanalyzer-app]');
  if (!root) return;

  const els = {
    screens: {},
    name: root.querySelector('[data-hb-name]'),
    form: root.querySelector('[data-hb-form]'),
    progress: root.querySelector('[data-hb-progress]'),
    submit: root.querySelector('[data-hb-submit]'),
    results: {
      title: root.querySelector('[data-res-title]'),
      band: root.querySelector('[data-res-band]'),
      overall: root.querySelector('[data-res-overall]'),
      summary: root.querySelector('[data-res-summary]'),
      bars: root.querySelector('[data-res-bars]'),
      fixes: root.querySelector('[data-res-fixes]')
    }
  };
  root.querySelectorAll('[data-hb-screen]').forEach(function (el) { els.screens[el.getAttribute('data-hb-screen')] = el; });

  let items = [];
  let habitName = '';
  const SCALE_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

  function show(screen) { Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; }); }

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
        input.type = 'radio'; input.name = 'q' + qi; input.id = id; input.value = String(v);
        input.addEventListener('change', updateProgress);
        const dot = document.createElement('span'); dot.className = 'ca-scale__dot'; dot.textContent = String(v);
        const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = SCALE_LABELS[v - 1];
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
    if (AurorIQ.reports) AurorIQ.reports.render('habitanalyzer', r, els.screens.results);
    els.results.title.textContent = habitName ? ('\u201c' + habitName + '\u201d') : 'Your habit';
    els.results.band.textContent = r.band;
    els.results.overall.textContent = r.overall + '/100 design strength';
    els.results.summary.textContent = r.summary;
    els.results.bars.innerHTML = '';
    r.ranked.forEach(function (d) {
      const row = document.createElement('div'); row.className = 'ca-bar';
      const label = document.createElement('span'); label.className = 'ca-bar__label';
      label.textContent = AurorIQ.habitAnalyzerEngine.DIM_INFO[d].name;
      const track = document.createElement('span'); track.className = 'ca-bar__track';
      const fill = document.createElement('span'); fill.className = 'ca-bar__fill'; fill.style.width = r.scores[d] + '%';
      const val = document.createElement('span'); val.className = 'ca-bar__val'; val.textContent = r.scores[d] + '%';
      track.appendChild(fill);
      row.appendChild(label); row.appendChild(track); row.appendChild(val);
      els.results.bars.appendChild(row);
    });
    els.results.fixes.innerHTML = '';
    r.fixes.forEach(function (t) {
      const card = document.createElement('div'); card.className = 'ca-top';
      const h = document.createElement('h3'); h.className = 'ca-top__name'; h.textContent = t.name + ' \u00b7 ' + t.score + '%';
      const p = document.createElement('p'); p.className = 'ca-top__blurb'; p.textContent = t.blurb;
      const fix = document.createElement('p'); fix.className = 'ca-top__careers'; fix.textContent = 'Fix: ' + t.fix;
      card.appendChild(h); card.appendChild(p); card.appendChild(fix);
      els.results.fixes.appendChild(card);
    });
  }

  function submit() {
    renderResults(AurorIQ.habitAnalyzerEngine.scoreTest(items, collectRatings()));
    show('results');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function start() {
    habitName = (els.name && els.name.value ? els.name.value : '').trim().slice(0, 60);
    items = AurorIQ.habitAnalyzerEngine.buildTest();
    renderForm(); updateProgress(); show('play');
  }

  root.querySelectorAll('[data-hb-start]').forEach(function (b) { b.addEventListener('click', start); });
  if (els.submit) els.submit.addEventListener('click', submit);
  root.querySelectorAll('[data-hb-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
