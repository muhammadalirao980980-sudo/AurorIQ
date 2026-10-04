/* interviewreadiness.js — Interview Readiness (v6.19).
 * Scores how PREPARED you are for an upcoming interview, across five practical
 * factors the hiring-and-careers literature consistently links to interview
 * performance:
 *   - Research      (you understand the role, company, and why you're a fit)
 *   - Stories        (you have concrete examples ready, not vague generalities)
 *   - Questions       (you have real questions prepared for them)
 *   - Logistics       (the practical setup is handled, nothing left to chance)
 *   - Rehearsal       (you've practiced out loud, not just thought it through)
 *
 * IMPORTANT DISTINCTION FROM OUR OTHER CAREER TOOLS: this is deliberately NOT a
 * psychometric instrument or a "type". It doesn't claim to measure a trait about
 * you — it's a practical checklist-style self-assessment of PREPARATION, closer
 * in spirit to the habit analyzer or time audit than to the interest/values/style
 * profilers. Preparation is something you can change this week.
 *
 * HONESTY NOTE (BRAND.md §5): a high score means you're well prepared, not that
 * you'll get the job — outcomes depend on fit, competition, and factors outside
 * your control. Low scores are common and fixable, not a judgment of your
 * candidacy. Items are reverse-scored where they describe a weak state.
 *
 * On-device only. Items are original to AurorIQ.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const DIMS = ['RESEARCH', 'STORIES', 'QUESTIONS', 'LOGISTICS', 'REHEARSAL'];
  const DIM_INFO = {
    RESEARCH:  { name: 'Research', blurb: 'Knowing the role, the company, and why you specifically fit is what lets you answer "why us?" with something real instead of a guess.',
                 fix: 'Spend thirty focused minutes on the company\u2019s recent news, product, and the exact responsibilities in the posting. Write one sentence connecting your background to what they actually need.' },
    STORIES:   { name: 'Stories', blurb: 'Vague claims ("I\u2019m a good problem-solver") don\u2019t land. Specific, structured examples of what you did and what happened do.',
                 fix: 'Pick three to five past situations and outline each in Situation-Task-Action-Result form. Having the shape ready means you\u2019re not building it live under pressure.' },
    QUESTIONS: { name: 'Questions', blurb: 'Having no questions reads as low genuine interest, and it wastes a real chance to evaluate whether the role fits you too.',
                 fix: 'Prepare two or three specific questions about the role, team, or how success is measured \u2014 not ones the posting already answered.' },
    LOGISTICS: { name: 'Logistics', blurb: 'A shaky tech setup or an uncertain arrival plan adds avoidable stress right when you need to be sharpest.',
                 fix: 'Confirm the format, test your video/audio setup or plan your route the day before, and know exactly when and where you need to be.' },
    REHEARSAL: { name: 'Rehearsal', blurb: 'Thinking through an answer and saying it out loud are different skills \u2014 rehearsal is what makes it come out smoothly under pressure.',
                 fix: 'Say your key stories and your answer to "tell me about yourself" out loud at least once, ideally to another person or recorded. The gap between thinking and speaking is where nerves live.' }
  };

  const SCALE_MIN = 1;
  const SCALE_MAX = 5;
  const ITEMS_PER_DIM = 4;

  /* reverse:true items describe a WEAK state of preparation \u2014 agreeing lowers the score. */
  const BANK = [
    { dim: 'RESEARCH', reverse: false, text: 'I understand what this specific role is responsible for day to day.' },
    { dim: 'RESEARCH', reverse: false, text: 'I know something current about the company beyond its homepage.' },
    { dim: 'RESEARCH', reverse: true,  text: 'I\u2019m going in mostly blind about what the company actually does right now.' },
    { dim: 'RESEARCH', reverse: true,  text: 'I haven\u2019t really thought through why I specifically fit this role.' },

    { dim: 'STORIES', reverse: false, text: 'I have specific past examples ready for common questions, not just general claims.' },
    { dim: 'STORIES', reverse: false, text: 'I can describe a concrete situation, what I did, and what happened.' },
    { dim: 'STORIES', reverse: true,  text: 'My answers would mostly be improvised in the moment.' },
    { dim: 'STORIES', reverse: true,  text: 'I tend to speak in generalities rather than specific examples.' },

    { dim: 'QUESTIONS', reverse: false, text: 'I have specific questions prepared to ask them.' },
    { dim: 'QUESTIONS', reverse: false, text: 'My questions go beyond what\u2019s already in the job posting.' },
    { dim: 'QUESTIONS', reverse: true,  text: 'I haven\u2019t thought about what I\u2019d ask them.' },
    { dim: 'QUESTIONS', reverse: true,  text: 'If asked \u201cany questions for us?\u201d I\u2019d be caught off guard.' },

    { dim: 'LOGISTICS', reverse: false, text: 'I know the exact time, format, and platform or location for the interview.' },
    { dim: 'LOGISTICS', reverse: false, text: 'My tech setup or travel plan is already confirmed to work.' },
    { dim: 'LOGISTICS', reverse: true,  text: 'I haven\u2019t tested my video call setup, or I\u2019m unsure how I\u2019ll get there.' },
    { dim: 'LOGISTICS', reverse: true,  text: 'There are practical details I\u2019m still leaving until the last minute.' },

    { dim: 'REHEARSAL', reverse: false, text: 'I\u2019ve said my key answers out loud, not just thought them through.' },
    { dim: 'REHEARSAL', reverse: false, text: 'I\u2019ve practiced my answer to \u201ctell me about yourself\u201d at least once.' },
    { dim: 'REHEARSAL', reverse: true,  text: 'This would be the first time I say any of this out loud.' },
    { dim: 'REHEARSAL', reverse: true,  text: 'I haven\u2019t rehearsed with another person or recorded myself.' }
  ];

  const BANDS = [
    { key: 'low', label: 'Early stage', min: 0, max: 40,
      summary: 'There\u2019s real groundwork left to do \u2014 which is good news, because preparation is entirely within your control. Start with your single lowest factor below; it\u2019ll move the needle more than polishing what\u2019s already solid.' },
    { key: 'mid', label: 'Getting there', min: 41, max: 60,
      summary: 'You\u2019ve made real progress with some clear gaps left. Closing your weakest factor below is likely to help more than further polishing your strongest one.' },
    { key: 'good', label: 'Well prepared', min: 61, max: 80,
      summary: 'You\u2019re in solid shape. Tightening the lowest factor below would take a good level of preparation into a strong one.' },
    { key: 'excellent', label: 'Fully ready', min: 81, max: 100,
      summary: 'Strong preparation across every factor. From here, staying calm and being yourself does the rest \u2014 the groundwork is done.' }
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
    const sums = { RESEARCH: 0, STORIES: 0, QUESTIONS: 0, LOGISTICS: 0, REHEARSAL: 0 };
    const counts = { RESEARCH: 0, STORIES: 0, QUESTIONS: 0, LOGISTICS: 0, REHEARSAL: 0 };
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

  AurorIQ.interviewReadinessEngine = {
    DIMS: DIMS, DIM_INFO: DIM_INFO, BANK: BANK, BANDS: BANDS,
    SCALE_MIN: SCALE_MIN, SCALE_MAX: SCALE_MAX, ITEMS_PER_DIM: ITEMS_PER_DIM,
    shuffle: shuffle, buildTest: buildTest, aligned: aligned, bandFor: bandFor, scoreTest: scoreTest
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AurorIQ.interviewReadinessEngine;
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller (reuses ca-* + ch-band styles) ---------------- */

  const root = document.querySelector('[data-interviewreadiness-app]');
  if (!root) return;

  const els = {
    screens: {},
    form: root.querySelector('[data-ir-form]'),
    progress: root.querySelector('[data-ir-progress]'),
    submit: root.querySelector('[data-ir-submit]'),
    results: {
      band: root.querySelector('[data-res-band]'),
      overall: root.querySelector('[data-res-overall]'),
      summary: root.querySelector('[data-res-summary]'),
      bars: root.querySelector('[data-res-bars]'),
      fixes: root.querySelector('[data-res-fixes]')
    }
  };
  root.querySelectorAll('[data-ir-screen]').forEach(function (el) { els.screens[el.getAttribute('data-ir-screen')] = el; });

  let items = [];
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
        const id = 'irq' + qi + 'v' + v;
        const label = document.createElement('label');
        label.className = 'ca-scale__opt';
        label.setAttribute('for', id);
        label.setAttribute('title', SCALE_LABELS[v - 1]);
        const input = document.createElement('input');
        input.type = 'radio'; input.name = 'irq' + qi; input.id = id; input.value = String(v);
        input.addEventListener('change', updateProgress);
        const dot = document.createElement('span'); dot.className = 'ca-scale__dot'; dot.textContent = String(v);
        const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = SCALE_LABELS[v - 1];
        label.appendChild(input); label.appendChild(dot); label.appendChild(sr);
        scale.appendChild(label);
      }
      fs.appendChild(scale);
      els.form.appendChild(fs);
    });
    updateProgress();
  }

  function collectRatings() {
    return items.map(function (_, qi) {
      const c = els.form.querySelector('input[name="irq' + qi + '"]:checked');
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
    if (AurorIQ.reports) AurorIQ.reports.render('interviewreadiness', r, els.screens.results);
    els.results.band.textContent = r.band;
    els.results.band.setAttribute('data-band', r.key);
    els.results.overall.textContent = r.overall + '/100 readiness';
    els.results.summary.textContent = r.summary;
    els.results.bars.innerHTML = '';
    r.ranked.forEach(function (d) {
      const row = document.createElement('div'); row.className = 'ca-bar';
      const label = document.createElement('span'); label.className = 'ca-bar__label';
      label.textContent = AurorIQ.interviewReadinessEngine.DIM_INFO[d].name;
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
    const ratings = collectRatings();
    const r = AurorIQ.interviewReadinessEngine.scoreTest(items, ratings);
    renderResults(r);
    show('results');
  }

  function start() {
    items = AurorIQ.interviewReadinessEngine.buildTest();
    show('play');
    renderForm();
  }

  els.submit && els.submit.addEventListener('click', submit);
  root.querySelectorAll('[data-ir-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-ir-retry]').forEach(function (b) { b.addEventListener('click', function () { show('intro'); }); });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
