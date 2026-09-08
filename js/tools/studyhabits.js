/* studyhabits.js — Study Habits assessment (v6.12).
 * Measures how well your current study habits align with the techniques that
 * cognitive science actually supports — retrieval practice, spaced practice,
 * interleaving, elaboration, and self-regulation (Dunlosky et al.; Bjork's
 * "desirable difficulties"). Ineffective-but-popular habits (rereading,
 * cramming, highlighting as "studying") are REVERSE-scored, so relying on them
 * lowers your alignment.
 *
 * This deliberately does NOT measure "learning style" — the styles theory
 * (visual/auditory/kinesthetic) has repeatedly failed testing, a point the
 * Learning hub makes directly. What helps isn't matching a style; it's using
 * techniques that work for everyone. That's what this scores.
 *
 * HONESTY NOTE (BRAND.md §5): habits predict outcomes but aren't destiny, and
 * effort and prior knowledge matter too. This scores alignment with research,
 * not intelligence or worth. Results are guidance, not a grade.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const DIMS = ['RET', 'SPA', 'INT', 'ELA', 'REG'];
  const DIM_INFO = {
    RET: { name: 'Retrieval Practice', blurb: 'Testing yourself from memory instead of passively rereading. The single most powerful study technique in the research.',
           improve: 'After reading, close the book and write down everything you remember. Use flashcards or practice questions instead of re-reading notes.' },
    SPA: { name: 'Spaced Practice', blurb: 'Spreading study across days instead of cramming. The same total time works far better distributed than massed.',
           improve: 'Break study into short sessions across several days, and revisit material after a gap of days or weeks rather than once before the exam.' },
    INT: { name: 'Interleaving', blurb: 'Mixing topics and problem types in a session rather than drilling one to exhaustion. It builds the skill of choosing the right approach.',
           improve: 'Shuffle problem types and switch between subjects within a session, and practice telling apart concepts that look similar.' },
    ELA: { name: 'Elaboration', blurb: 'Processing meaning deeply \u2014 asking why and how, and connecting new ideas to what you already know.',
           improve: 'Ask yourself "why is this true?" and "how does this connect?", and explain concepts in your own words rather than memorizing them flat.' },
    REG: { name: 'Self-Regulation', blurb: 'Planning study, monitoring real understanding, and not mistaking familiarity for mastery.',
           improve: 'Plan what and when you\u2019ll study, and test whether you truly understand \u2014 feeling familiar with material is not the same as knowing it.' }
  };

  const SCALE_MIN = 1;   /* never */
  const SCALE_MAX = 5;   /* always */
  const ITEMS_PER_DIM = 4;

  /* reverse:true items describe INEFFECTIVE habits — higher frequency = worse. */
  const BANK = [
    { dim: 'RET', reverse: false, text: 'After reading something, I close it and try to recall the key points from memory.' },
    { dim: 'RET', reverse: false, text: 'I quiz myself or use flashcards to test what I actually know.' },
    { dim: 'RET', reverse: true,  text: 'I mostly study by rereading my notes or the textbook.' },
    { dim: 'RET', reverse: false, text: 'I check my understanding by explaining things without looking at the material.' },

    { dim: 'SPA', reverse: false, text: 'I spread my studying across several days rather than one long session.' },
    { dim: 'SPA', reverse: false, text: 'I review material again days or weeks after first learning it.' },
    { dim: 'SPA', reverse: true,  text: 'I do most of my studying in one big session right before a deadline.' },
    { dim: 'SPA', reverse: false, text: 'I plan short study sessions over time instead of marathons.' },

    { dim: 'INT', reverse: false, text: 'I mix different topics or problem types within a single study session.' },
    { dim: 'INT', reverse: false, text: 'I switch between subjects rather than finishing one completely first.' },
    { dim: 'INT', reverse: true,  text: 'I prefer to drill one type of problem over and over before moving on.' },
    { dim: 'INT', reverse: false, text: 'I practice telling apart problems that look similar but need different approaches.' },

    { dim: 'ELA', reverse: false, text: 'I ask myself "why" and "how" questions about what I\u2019m learning.' },
    { dim: 'ELA', reverse: false, text: 'I connect new ideas to things I already know.' },
    { dim: 'ELA', reverse: true,  text: 'I try to memorize facts without worrying about how they fit together.' },
    { dim: 'ELA', reverse: false, text: 'I explain concepts in my own words rather than copying them down.' },

    { dim: 'REG', reverse: false, text: 'I plan what and when I\u2019ll study before I start.' },
    { dim: 'REG', reverse: false, text: 'I notice when I don\u2019t really understand something and go back to it.' },
    { dim: 'REG', reverse: true,  text: 'I highlight or reread a lot and feel that means I\u2019ve learned it.' },
    { dim: 'REG', reverse: true,  text: 'If material feels familiar, I consider it learned.' }
  ];

  const BANDS = [
    { key: 'low', label: 'Lots of room to level up', min: 0, max: 40,
      summary: 'Your current habits lean on techniques that feel productive but the research shows are weak. The good news: the highest-impact changes are also the simplest to start.' },
    { key: 'mid', label: 'Some solid habits, some quick wins', min: 41, max: 60,
      summary: 'You already do some of what works. Targeting your one or two weakest areas below will likely give you the biggest return for the least effort.' },
    { key: 'good', label: 'Strong, evidence-aligned habits', min: 61, max: 80,
      summary: 'Your habits line up well with what the science supports. Tightening your lowest area would push good study into excellent.' },
    { key: 'excellent', label: 'You study like the research says', min: 81, max: 100,
      summary: 'Your habits strongly match evidence-based practice. Keep it up, and remember that even great technique still rests on consistent effort and prior knowledge.' }
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
    return shuffle(BANK, rand).map(function (it) {
      return { dim: it.dim, reverse: it.reverse, text: it.text };
    });
  }

  /* aligned value: for reverse items, high frequency counts against you */
  function aligned(rating, reverse) {
    return reverse ? (SCALE_MIN + SCALE_MAX - rating) : rating;
  }

  function bandFor(pct) {
    for (let i = 0; i < BANDS.length; i++) {
      if (pct >= BANDS[i].min && pct <= BANDS[i].max) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
  }

  function scoreTest(items, ratings) {
    const sums = { RET: 0, SPA: 0, INT: 0, ELA: 0, REG: 0 };
    const counts = { RET: 0, SPA: 0, INT: 0, ELA: 0, REG: 0 };
    items.forEach(function (item, i) {
      let v = ratings[i];
      if (typeof v !== 'number' || v < SCALE_MIN || v > SCALE_MAX) {
        v = (SCALE_MIN + SCALE_MAX) / 2;
      }
      sums[item.dim] += aligned(v, item.reverse);
      counts[item.dim] += 1;
    });
    const scores = {};
    DIMS.forEach(function (d) {
      const n = counts[d] || ITEMS_PER_DIM;
      const min = n * SCALE_MIN, max = n * SCALE_MAX;
      scores[d] = Math.round(((sums[d] - min) / (max - min)) * 100);
    });
    const overall = Math.round(DIMS.reduce(function (a, d) { return a + scores[d]; }, 0) / DIMS.length);
    const band = bandFor(overall);
    /* rank dims ascending to surface the weakest for guidance */
    const weakest = DIMS.slice().sort(function (a, b) {
      if (scores[a] !== scores[b]) return scores[a] - scores[b];
      return DIMS.indexOf(a) - DIMS.indexOf(b);
    });
    /* rank desc for display */
    const ranked = DIMS.slice().sort(function (a, b) {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return DIMS.indexOf(a) - DIMS.indexOf(b);
    });
    return {
      scores: scores,
      overall: overall,
      band: band.label,
      key: band.key,
      summary: band.summary,
      ranked: ranked,
      focus: weakest.slice(0, 2).map(function (d) {
        return { dim: d, name: DIM_INFO[d].name, score: scores[d],
                 blurb: DIM_INFO[d].blurb, improve: DIM_INFO[d].improve };
      })
    };
  }

  AurorIQ.studyHabitsEngine = {
    DIMS: DIMS,
    DIM_INFO: DIM_INFO,
    BANK: BANK,
    BANDS: BANDS,
    SCALE_MIN: SCALE_MIN,
    SCALE_MAX: SCALE_MAX,
    ITEMS_PER_DIM: ITEMS_PER_DIM,
    shuffle: shuffle,
    buildTest: buildTest,
    aligned: aligned,
    bandFor: bandFor,
    scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.studyHabitsEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller (reuses ca-* styles) ---------------- */

  const root = document.querySelector('[data-studyhabits-app]');
  if (!root) return;

  const els = {
    screens: {},
    form: root.querySelector('[data-sh-form]'),
    progress: root.querySelector('[data-sh-progress]'),
    submit: root.querySelector('[data-sh-submit]'),
    results: {
      band: root.querySelector('[data-res-band]'),
      overall: root.querySelector('[data-res-overall]'),
      summary: root.querySelector('[data-res-summary]'),
      bars: root.querySelector('[data-res-bars]'),
      focus: root.querySelector('[data-res-focus]')
    }
  };
  root.querySelectorAll('[data-sh-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-sh-screen')] = el;
  });

  let items = [];
  const SCALE_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

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
    els.results.band.textContent = r.band;
    els.results.overall.textContent = r.overall + '/100 aligned';
    els.results.summary.textContent = r.summary;
    els.results.bars.innerHTML = '';
    r.ranked.forEach(function (d) {
      const row = document.createElement('div');
      row.className = 'ca-bar';
      const label = document.createElement('span');
      label.className = 'ca-bar__label';
      label.textContent = AurorIQ.studyHabitsEngine.DIM_INFO[d].name;
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
    els.results.focus.innerHTML = '';
    r.focus.forEach(function (t) {
      const card = document.createElement('div');
      card.className = 'ca-top';
      const h = document.createElement('h3');
      h.className = 'ca-top__name';
      h.textContent = t.name + ' \u00b7 ' + t.score + '%';
      const p = document.createElement('p');
      p.className = 'ca-top__blurb';
      p.textContent = t.blurb;
      const imp = document.createElement('p');
      imp.className = 'ca-top__careers';
      imp.textContent = 'Try this: ' + t.improve;
      card.appendChild(h); card.appendChild(p); card.appendChild(imp);
      els.results.focus.appendChild(card);
    });
  }

  function submit() {
    const r = AurorIQ.studyHabitsEngine.scoreTest(items, collectRatings());
    renderResults(r);
    show('results');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function start() {
    items = AurorIQ.studyHabitsEngine.buildTest();
    renderForm();
    updateProgress();
    show('play');
  }

  root.querySelectorAll('[data-sh-start]').forEach(function (b) { b.addEventListener('click', start); });
  if (els.submit) els.submit.addEventListener('click', submit);
  root.querySelectorAll('[data-sh-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
