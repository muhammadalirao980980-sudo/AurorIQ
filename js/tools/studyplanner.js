/* studyplanner.js — Spaced Study Planner (v6.14).
 * Turns the two best-supported study techniques into an actual schedule: spaced
 * practice (expanding review intervals) and retrieval practice (every review
 * after the first is active recall, not rereading). Topics are interleaved
 * across days rather than blocked, and each topic ends with a final review near
 * the exam.
 *
 * This is the applied companion to the Study Habits test: that one measures
 * whether you use these techniques; this one builds them into a plan.
 *
 * HONESTY NOTE (BRAND.md §5): a schedule is a scaffold, not a guarantee.
 * Consistency matters far more than hitting exact dates, real life will disrupt
 * it, and reviews only work if you actually recall from memory rather than
 * reread. The plan says so.
 *
 * On-device only.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const INTERVALS = [0, 1, 3, 7, 14];   /* expanding spacing offsets (days) */
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------------- date helpers (UTC to avoid TZ drift) ---------------- */

  function toUTC(iso) {
    const p = String(iso).split('-').map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2]);
  }
  function daysBetween(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }
  function addDays(iso, n) {
    const dt = new Date(toUTC(iso) + n * 86400000);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  function weekdayOf(iso) { return WEEKDAYS[new Date(toUTC(iso)).getUTCDay()]; }
  function prettyDate(iso) {
    const dt = new Date(toUTC(iso));
    return WEEKDAYS[dt.getUTCDay()] + ', ' + MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCDate();
  }

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function cleanTopics(topics) {
    const seen = {};
    const out = [];
    (topics || []).forEach(function (t) {
      const s = String(t == null ? '' : t).trim().replace(/\s+/g, ' ');
      const key = s.toLowerCase();
      if (s && !seen[key]) { seen[key] = 1; out.push(s); }
    });
    return out;
  }

  function startOffsets(count, window) {
    if (count <= 1) return [0];
    const span = Math.max(0, Math.floor(window * 0.5));
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(Math.min(window - 1, Math.round((i * span) / (count - 1))));
    }
    return arr;
  }

  function generatePlan(opts) {
    opts = opts || {};
    const topics = cleanTopics(opts.topics);
    const today = opts.today;
    const examDate = opts.examDate;

    if (!topics.length) return { valid: false, reason: 'no-topics' };
    const window = daysBetween(today, examDate);
    if (!(window > 0)) return { valid: false, reason: 'bad-date' };

    const starts = startOffsets(topics.length, window);
    const dayMap = {};            /* offset -> [{topic, type}] */
    const perTopic = {};

    topics.forEach(function (topic, ti) {
      const start = starts[ti];
      const offsets = [];
      INTERVALS.forEach(function (iv) {
        const off = start + iv;
        if (off <= window - 1 && offsets.indexOf(off) === -1) offsets.push(off);
      });
      if (!offsets.length) offsets.push(Math.min(start, window - 1));
      offsets.sort(function (a, b) { return a - b; });
      perTopic[topic] = offsets.length;
      offsets.forEach(function (off, si) {
        let type;
        if (si === 0) type = 'Learn';
        else if (si === offsets.length - 1 && offsets.length >= 2) type = 'Final review';
        else type = 'Recall';
        (dayMap[off] || (dayMap[off] = [])).push({ topic: topic, type: type });
      });
    });

    const days = Object.keys(dayMap)
      .map(Number)
      .sort(function (a, b) { return a - b; })
      .map(function (off) {
        const date = addDays(today, off);
        return {
          offset: off,
          date: date,
          weekday: weekdayOf(date),
          label: prettyDate(date),
          sessions: dayMap[off],
          load: dayMap[off].length
        };
      });

    const totalSessions = days.reduce(function (a, d) { return a + d.load; }, 0);

    return {
      valid: true,
      window: window,
      examDate: examDate,
      topics: topics,
      days: days,
      perTopic: perTopic,
      summary: {
        topics: topics.length,
        sessions: totalSessions,
        studyDays: days.length,
        heaviestDay: days.reduce(function (m, d) { return d.load > m ? d.load : m; }, 0)
      }
    };
  }

  AurorIQ.studyPlannerEngine = {
    INTERVALS: INTERVALS,
    toUTC: toUTC,
    daysBetween: daysBetween,
    addDays: addDays,
    weekdayOf: weekdayOf,
    prettyDate: prettyDate,
    cleanTopics: cleanTopics,
    startOffsets: startOffsets,
    generatePlan: generatePlan
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.studyPlannerEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-studyplanner-app]');
  if (!root) return;

  const ENG = AurorIQ.studyPlannerEngine;
  const els = {
    screens: {},
    date: root.querySelector('[data-sp-date]'),
    topics: root.querySelector('[data-sp-topics]'),
    addBtn: root.querySelector('[data-sp-add]'),
    generate: root.querySelector('[data-sp-generate]'),
    error: root.querySelector('[data-sp-error]'),
    summary: root.querySelector('[data-sp-summary]'),
    schedule: root.querySelector('[data-sp-schedule]')
  };
  root.querySelectorAll('[data-sp-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-sp-screen')] = el;
  });

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) { els.screens[k].hidden = k !== screen; });
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function addTopicRow(value) {
    const row = document.createElement('div');
    row.className = 'sp-topic';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sp-topic__field';
    input.placeholder = 'e.g. Cell biology';
    if (value) input.value = value;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'sp-topic__rm';
    rm.setAttribute('aria-label', 'Remove topic');
    rm.textContent = '\u00d7';
    rm.addEventListener('click', function () { row.remove(); });
    row.appendChild(input);
    row.appendChild(rm);
    els.topics.appendChild(row);
  }

  function readTopics() {
    return [].slice.call(els.topics.querySelectorAll('input')).map(function (i) { return i.value; });
  }

  const TYPE_CLASS = { 'Learn': 'sp-chip--learn', 'Recall': 'sp-chip--recall', 'Final review': 'sp-chip--final' };

  function generate() {
    const plan = ENG.generatePlan({ today: todayISO(), examDate: els.date.value, topics: readTopics() });
    if (!plan.valid) {
      els.error.hidden = false;
      els.error.textContent = plan.reason === 'no-topics'
        ? 'Add at least one topic to build a plan.'
        : 'Choose an exam date in the future to build a plan.';
      els.summary.hidden = true;
      els.schedule.innerHTML = '';
      return;
    }
    els.error.hidden = true;
    els.summary.hidden = false;
    els.summary.textContent = plan.summary.sessions + ' review sessions across ' + plan.summary.studyDays +
      ' days for ' + plan.summary.topics + ' topic' + (plan.summary.topics > 1 ? 's' : '') +
      ', spaced over the ' + plan.window + ' days until your exam.';

    els.schedule.innerHTML = '';
    plan.days.forEach(function (day) {
      const card = document.createElement('div');
      card.className = 'sp-day';
      const head = document.createElement('div');
      head.className = 'sp-day__head';
      const dLabel = document.createElement('span');
      dLabel.className = 'sp-day__date';
      dLabel.textContent = day.label;
      const dLoad = document.createElement('span');
      dLoad.className = 'sp-day__load';
      dLoad.textContent = day.load + ' session' + (day.load > 1 ? 's' : '');
      head.appendChild(dLabel); head.appendChild(dLoad);
      card.appendChild(head);
      const list = document.createElement('div');
      list.className = 'sp-day__sessions';
      day.sessions.forEach(function (s) {
        const chip = document.createElement('span');
        chip.className = 'sp-chip ' + (TYPE_CLASS[s.type] || '');
        chip.innerHTML = '<strong>' + s.type + '</strong> ' + s.topic;
        list.appendChild(chip);
      });
      card.appendChild(list);
      els.schedule.appendChild(card);
    });
    show('plan');
  }

  els.addBtn.addEventListener('click', function () { addTopicRow(''); });
  els.generate.addEventListener('click', generate);
  root.querySelectorAll('[data-sp-restart]').forEach(function (b) {
    b.addEventListener('click', function () { show('setup'); });
  });

  /* seed setup */
  if (els.date) els.date.min = todayISO();
  addTopicRow(''); addTopicRow(''); addTopicRow('');
  show('setup');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
