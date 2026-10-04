/* timeaudit.js — Weekly Time Audit (v6.13).
 * An allocation tool, not a scored test: you distribute the 168 hours in a week
 * across ten categories and see where your time actually goes, plus a few honest
 * observations. The one evidence-based nudge is sleep (most adults need ~7–9h a
 * night); everything else is descriptive, not prescriptive.
 *
 * HONESTY NOTE (BRAND.md §5): people are famously bad at estimating their own
 * time, so this reflects your perception, not a tracked log. Its value is
 * awareness — seeing the shape of your week — not a productivity score or a
 * verdict on how you "should" live. There is no good or bad allocation here.
 *
 * On-device only.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const WEEK_HOURS = 168;
  const SLEEP_MIN_PER_NIGHT = 7;
  const SLEEP_MAX_PER_NIGHT = 9;

  const CATEGORIES = [
    { key: 'sleep',    name: 'Sleep' },
    { key: 'work',     name: 'Work or study' },
    { key: 'commute',  name: 'Commute & travel' },
    { key: 'chores',   name: 'Chores, errands & admin' },
    { key: 'meals',    name: 'Meals & cooking' },
    { key: 'exercise', name: 'Exercise & movement' },
    { key: 'social',   name: 'Family & friends' },
    { key: 'leisure',  name: 'Screens & entertainment' },
    { key: 'hobbies',  name: 'Hobbies & personal projects' },
    { key: 'other',    name: 'Everything else' }
  ];
  const DISCRETIONARY = ['social', 'leisure', 'hobbies'];

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function clampHours(v) {
    const n = Number(v);
    if (!isFinite(n) || n < 0) return 0;
    if (n > WEEK_HOURS) return WEEK_HOURS;
    return n;
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  function analyze(alloc) {
    alloc = alloc || {};
    const cats = CATEGORIES.map(function (c) {
      const hours = clampHours(alloc[c.key]);
      return { key: c.key, name: c.name, hours: hours, pct: Math.round((hours / WEEK_HOURS) * 100) };
    });
    const total = round1(cats.reduce(function (a, c) { return a + c.hours; }, 0));
    const remaining = round1(WEEK_HOURS - total);
    const by = {};
    cats.forEach(function (c) { by[c.key] = c.hours; });

    const sleepPerNight = round1(by.sleep / 7);
    const discretionary = round1(DISCRETIONARY.reduce(function (a, k) { return a + by[k]; }, 0));
    const wakingHours = round1(WEEK_HOURS - by.sleep);
    const workShare = wakingHours > 0 ? Math.round((by.work / wakingHours) * 100) : 0;

    const ranked = cats.slice().filter(function (c) { return c.hours > 0; })
      .sort(function (a, b) { return b.hours - a.hours; });

    const observations = [];

    /* validation first */
    if (Math.abs(total - WEEK_HOURS) >= 0.5) {
      if (total < WEEK_HOURS) {
        observations.push({ type: 'validation', tone: 'warn',
          text: 'Your hours add up to ' + total + ' of 168 \u2014 there are ' + remaining + ' unassigned. Fill in the rest for an accurate picture.' });
      } else {
        observations.push({ type: 'validation', tone: 'warn',
          text: 'Your hours add up to ' + total + ', which is ' + round1(total - WEEK_HOURS) + ' over the 168 in a week. Trim somewhere to balance it.' });
      }
    }

    /* sleep — the one evidence-based nudge, framed gently */
    if (by.sleep > 0) {
      if (sleepPerNight < SLEEP_MIN_PER_NIGHT) {
        observations.push({ type: 'sleep', tone: 'note',
          text: 'You\u2019re averaging about ' + sleepPerNight + ' hours of sleep a night, below the ~7\u20139 most adults need. If anything here has room to give, sleep is usually the highest-leverage thing to protect.' });
      } else if (sleepPerNight <= SLEEP_MAX_PER_NIGHT) {
        observations.push({ type: 'sleep', tone: 'good',
          text: 'Your sleep works out to about ' + sleepPerNight + ' hours a night \u2014 right in the range most adults need. That\u2019s the foundation everything else rests on.' });
      } else {
        observations.push({ type: 'sleep', tone: 'note',
          text: 'You\u2019ve got about ' + sleepPerNight + ' hours of sleep a night, a bit above the typical range. That can be exactly right for some people; worth noticing if daytime energy still lags.' });
      }
    }

    /* largest non-sleep category */
    const topNonSleep = ranked.filter(function (c) { return c.key !== 'sleep'; })[0];
    if (topNonSleep) {
      observations.push({ type: 'top', tone: 'note',
        text: 'Outside sleep, your biggest block is ' + topNonSleep.name.toLowerCase() + ' at ' + topNonSleep.hours + ' hours \u2014 about ' + topNonSleep.pct + '% of your week.' });
    }

    /* discretionary time */
    if (total > 0) {
      observations.push({ type: 'discretionary', tone: 'note',
        text: 'You have roughly ' + discretionary + ' hours a week of discretionary time \u2014 family, friends, screens, and hobbies \u2014 or about ' + round1(discretionary / 7) + ' hours a day to spend as you choose.' });
    }

    return {
      total: total,
      remaining: remaining,
      balanced: Math.abs(total - WEEK_HOURS) < 0.5,
      categories: cats,
      ranked: ranked,
      metrics: {
        sleepPerNight: sleepPerNight,
        discretionaryPerWeek: discretionary,
        wakingHours: wakingHours,
        workShare: workShare
      },
      observations: observations
    };
  }

  AurorIQ.timeAuditEngine = {
    WEEK_HOURS: WEEK_HOURS,
    CATEGORIES: CATEGORIES,
    DISCRETIONARY: DISCRETIONARY,
    clampHours: clampHours,
    analyze: analyze
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.timeAuditEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-timeaudit-app]');
  if (!root) return;

  const els = {
    screens: {},
    inputs: root.querySelector('[data-ta-inputs]'),
    total: root.querySelector('[data-ta-total]'),
    remaining: root.querySelector('[data-ta-remaining]'),
    bars: root.querySelector('[data-ta-bars]'),
    obs: root.querySelector('[data-ta-obs]')
  };
  root.querySelectorAll('[data-ta-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-ta-screen')] = el;
  });

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

  const ENG = AurorIQ.timeAuditEngine;

  function readAlloc() {
    const alloc = {};
    ENG.CATEGORIES.forEach(function (c) {
      const input = els.inputs.querySelector('input[data-cat="' + c.key + '"]');
      alloc[c.key] = input ? input.value : 0;
    });
    return alloc;
  }

  function render() {
    const r = ENG.analyze(readAlloc());
    if (AurorIQ.reports) AurorIQ.reports.render('timeaudit', r, els.screens.play);
    els.total.textContent = r.total;
    els.remaining.textContent = (r.remaining >= 0 ? r.remaining + ' left' : Math.abs(r.remaining) + ' over');
    els.remaining.className = 'ta-remaining' + (r.balanced ? ' ta-remaining--ok' : (r.remaining < 0 ? ' ta-remaining--over' : ''));

    els.bars.innerHTML = '';
    r.ranked.forEach(function (c) {
      const row = document.createElement('div');
      row.className = 'ca-bar';
      const label = document.createElement('span');
      label.className = 'ca-bar__label';
      label.textContent = c.name;
      const track = document.createElement('span');
      track.className = 'ca-bar__track';
      const fill = document.createElement('span');
      fill.className = 'ca-bar__fill';
      fill.style.width = Math.min(100, c.pct) + '%';
      const val = document.createElement('span');
      val.className = 'ca-bar__val';
      val.textContent = c.hours + 'h';
      track.appendChild(fill);
      row.appendChild(label); row.appendChild(track); row.appendChild(val);
      els.bars.appendChild(row);
    });
    if (!r.ranked.length) {
      const p = document.createElement('p');
      p.className = 'ta-empty';
      p.textContent = 'Enter your hours above to see your week take shape.';
      els.bars.appendChild(p);
    }

    els.obs.innerHTML = '';
    r.observations.forEach(function (o) {
      const li = document.createElement('li');
      li.className = 'ta-obs ta-obs--' + o.tone;
      li.textContent = o.text;
      els.obs.appendChild(li);
    });
  }

  function buildInputs() {
    els.inputs.innerHTML = '';
    ENG.CATEGORIES.forEach(function (c) {
      const row = document.createElement('div');
      row.className = 'ta-input';
      const label = document.createElement('label');
      label.className = 'ta-input__label';
      label.setAttribute('for', 'ta-' + c.key);
      label.textContent = c.name;
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'ta-input__field';
      input.id = 'ta-' + c.key;
      input.setAttribute('data-cat', c.key);
      input.min = '0';
      input.max = String(ENG.WEEK_HOURS);
      input.step = '1';
      input.inputMode = 'numeric';
      input.placeholder = '0';
      input.addEventListener('input', render);
      const unit = document.createElement('span');
      unit.className = 'ta-input__unit';
      unit.textContent = 'h / week';
      row.appendChild(label); row.appendChild(input); row.appendChild(unit);
      els.inputs.appendChild(row);
    });
  }

  function start() {
    buildInputs();
    render();
    show('play');
  }

  root.querySelectorAll('[data-ta-start]').forEach(function (b) { b.addEventListener('click', start); });
  root.querySelectorAll('[data-ta-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      els.inputs.querySelectorAll('input').forEach(function (i) { i.value = ''; });
      render();
    });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
