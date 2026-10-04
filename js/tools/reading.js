/* reading.js — Reading Speed instrument (v6.3).
 * Timed reading of a passage, then a short comprehension check. Raw WPM is
 * only credited if comprehension is adequate (>= 60%, i.e. 3 of 5) — skimming
 * can't game an honest reading-speed score. Effective WPM scales raw speed by
 * comprehension so that fast-but-shallow reading is penalised proportionally.
 *
 * Norms: adult silent reading of general prose averages ~238 WPM with wide
 * spread; we use N(238, 68). Presented as approximations (BRAND.md §4-5).
 *
 * On-device only. Passages are original, written for this tool.
 */
(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const NORMS = { mean: 238, sd: 68 };
  const PASS_THRESHOLD = 0.6;         /* comprehension needed to credit speed */
  const MIN_PLAUSIBLE_MS = 3000;      /* faster than this = didn't read */

  /* Original passages (~230-260 words) with 5 comprehension items each.
   * answer = index into options. */
  const PASSAGES = [
    {
      id: 'tides',
      title: 'What Moves the Tides',
      text: "For most of human history, the daily rise and fall of the sea looked like breathing — steady, reliable, and completely mysterious. Ancient observers noticed that the tides kept pace with the moon, but the reason stayed hidden until the idea of gravity arrived. The moon pulls on the ocean, and because the near side of the Earth is closer to the moon than the far side, it feels a slightly stronger tug. That difference in pull, not the pull itself, is what stretches the oceans into two bulges: one facing the moon and one on the opposite side. As the Earth turns beneath these bulges, each coastline passes through them, producing roughly two high tides and two low tides a day. The sun adds its own smaller pull. When the sun and moon line up, their forces combine into the especially large spring tides; when they sit at right angles, they partly cancel, giving the gentler neap tides. Local geography complicates this tidy picture enormously. A wide bay can funnel and amplify the water until the tidal range towers many metres, while an enclosed sea may barely register a change at all. The timing shifts too, because water sloshes with a rhythm set by the shape of each basin. So the tide you see is never the pure astronomical signal — it is that signal filtered through the particular coastline in front of you.",
      questions: [
        { q: "According to the passage, what actually creates the tidal bulges?", options: ["The moon's total gravitational pull", "The difference in the moon's pull across the Earth", "The Earth's rotation alone", "The sun's heat on the ocean"], answer: 1 },
        { q: "How many high tides does a coastline typically pass through per day?", options: ["One", "Roughly two", "Four", "It varies with no pattern"], answer: 1 },
        { q: "Spring tides occur when:", options: ["The sun and moon are at right angles", "The sun and moon line up", "The moon is farthest away", "It is the spring season"], answer: 1 },
        { q: "Why can a wide bay show an especially large tidal range?", options: ["It is closer to the moon", "It funnels and amplifies the water", "It has warmer water", "It faces the sun directly"], answer: 1 },
        { q: "The passage concludes that the observed tide is:", options: ["Identical everywhere on Earth", "The astronomical signal filtered through local coastline", "Caused mainly by wind", "Impossible to predict"], answer: 1 }
      ]
    },
    {
      id: 'memory-forest',
      title: 'How Forests Remember Fire',
      text: "A forest does not have a brain, yet in a strange sense it keeps a memory of the fires it has survived. That memory is written into the trees themselves. Many pine species have evolved cones sealed shut with resin that melts only in intense heat, so their seeds are released precisely when a fire has cleared the ground and opened the canopy to light. The blackened soil left behind is rich in nutrients, giving the freed seeds an unusually good start. Bark tells a similar story. Species that live where fire is common tend to grow thick, insulating bark that shields the living tissue beneath from the passing flames, much as a heavy coat protects against cold. Some trees even shed their lower branches as they mature, removing the ladder that fire would otherwise climb into the crown. None of this is planning; it is the slow accumulation of traits that happened to help ancestors survive and reproduce in a burning landscape. Where fire has been suppressed for decades, that inherited wisdom can backfire. Undergrowth builds up, fuel accumulates, and when a fire finally comes it burns hotter and higher than the trees are built to endure. The forest's memory, in other words, assumes a certain rhythm of fire — and grows dangerously out of tune when that rhythm is broken.",
      questions: [
        { q: "How do some pine cones time their seed release?", options: ["By the season", "By melting resin in intense heat", "By rainfall", "Randomly"], answer: 1 },
        { q: "Why is the soil after a fire beneficial to new seeds?", options: ["It is cooler", "It is rich in nutrients", "It holds more water", "It repels insects"], answer: 1 },
        { q: "Thick bark helps fire-adapted trees by:", options: ["Attracting pollinators", "Insulating living tissue from flames", "Storing extra water", "Making them taller"], answer: 1 },
        { q: "Shedding lower branches helps by:", options: ["Saving energy", "Removing the ladder fire climbs to the crown", "Improving the view", "Feeding animals"], answer: 1 },
        { q: "What happens when fire is suppressed for decades?", options: ["Trees grow thinner bark", "Fuel builds up and later fires burn hotter", "Seeds stop forming", "The forest becomes fireproof"], answer: 1 }
      ]
    },
    {
      id: 'glass',
      title: 'The Slow Puzzle of Glass',
      text: "Glass is one of the most familiar materials in the world and also one of the strangest. Look through a window and you are looking through something that behaves like a solid but is arranged like a liquid. In a normal solid, atoms lock into a repeating crystal pattern, neat as bricks in a wall. In a liquid, they tumble past one another in disorder. Glass is caught between the two: its atoms are frozen in the jumbled arrangement of a liquid, held rigid without ever settling into a crystal. This happens because glass is cooled so quickly that its atoms run out of time to organise. As the temperature drops, the material grows thicker and slower until motion effectively stops, trapping the disorder in place. A persistent myth claims that old windowpanes are thicker at the bottom because glass slowly flows over centuries. In truth, medieval glass was simply uneven when it was made, and installers often set the heavier edge down. At room temperature the flow of glass is so unimaginably slow that it would take vastly longer than the age of the universe to notice. What makes glass scientifically fascinating is precisely this frozen-liquid nature: understanding exactly how a cooling liquid locks into a rigid disordered state remains one of the genuinely unsolved problems in physics.",
      questions: [
        { q: "How are the atoms in glass arranged?", options: ["In a neat repeating crystal", "In the jumbled arrangement of a liquid, held rigid", "In perfect rows like a solid metal", "Constantly flowing like water"], answer: 1 },
        { q: "Why do glass atoms fail to form a crystal?", options: ["They are the wrong element", "The glass is cooled too quickly for them to organise", "There is too much heat", "Gravity prevents it"], answer: 1 },
        { q: "The passage says old windowpanes are thicker at the bottom because:", options: ["Glass flowed over centuries", "They were uneven when made and set heavy-edge down", "They absorbed water", "They were poorly cleaned"], answer: 1 },
        { q: "At room temperature, the flow of glass is:", options: ["Fast enough to see in a year", "Unimaginably slow — longer than the age of the universe to notice", "Moderate", "Impossible to measure at all"], answer: 1 },
        { q: "What does the passage call an unsolved problem in physics?", options: ["Why glass is transparent", "How a cooling liquid locks into a rigid disordered state", "Why glass breaks", "How to colour glass"], answer: 1 }
      ]
    }
  ];

  /* ---------------- pure engine (unit-tested in Node) ---------------- */

  function countWords(text) {
    const m = String(text == null ? '' : text).trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  function pickPassage(rand) {
    const r = rand || Math.random;
    return PASSAGES[Math.floor(r() * PASSAGES.length)];
  }

  function gradeComprehension(passage, answers) {
    const questions = passage && Array.isArray(passage.questions) ? passage.questions : [];
    answers = Array.isArray(answers) ? answers : [];
    let correct = 0;
    questions.forEach(function (item, i) {
      if (item && answers[i] === item.answer) correct += 1;
    });
    return { correct: correct, total: questions.length };
  }

  function scoreReading(passage, elapsedMs, answers) {
    const stats = AurorIQ.stats;
    const validPassage = passage && typeof passage.text === 'string' && Array.isArray(passage.questions) && passage.questions.length > 0;
    const validElapsed = Number.isFinite(elapsedMs) && elapsedMs > 0;
    if (!validPassage || !validElapsed) {
      return { valid: false, words: 0, rawWpm: 0, effectiveWpm: 0, comprehension: { correct: 0, total: 0 }, comprehensionPct: 0, passed: false, tooFast: false, percentile: null };
    }
    const words = countWords(passage.text);
    const rawWpm = stats.wpm(words, elapsedMs);
    const grade = gradeComprehension(passage, answers);
    const comprehension = grade.total ? grade.correct / grade.total : 0;
    const passed = comprehension >= PASS_THRESHOLD;
    const tooFast = elapsedMs < MIN_PLAUSIBLE_MS;
    const effectiveWpm = Math.round(rawWpm * comprehension);
    return {
      valid: true,
      words: words,
      rawWpm: rawWpm,
      effectiveWpm: effectiveWpm,
      comprehension: grade,
      comprehensionPct: Math.round(comprehension * 100),
      passed: passed && !tooFast,
      tooFast: tooFast,
      percentile: passed && !tooFast ? stats.percentile(effectiveWpm, NORMS.mean, NORMS.sd) : null
    };
  }

  AurorIQ.readingEngine = {
    NORMS: NORMS,
    PASS_THRESHOLD: PASS_THRESHOLD,
    MIN_PLAUSIBLE_MS: MIN_PLAUSIBLE_MS,
    PASSAGES: PASSAGES,
    countWords: countWords,
    pickPassage: pickPassage,
    gradeComprehension: gradeComprehension,
    scoreReading: scoreReading
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.readingEngine;
  }
  if (!document || !document.getElementById) return; /* Node test mode stops here */

  /* ---------------- page controller ---------------- */

  const root = document.querySelector('[data-reading-app]');
  if (!root) return;

  const els = {
    screens: {},
    title: root.querySelector('[data-rd-title]'),
    passage: root.querySelector('[data-rd-passage]'),
    quiz: root.querySelector('[data-rd-quiz]'),
    results: {
      raw: root.querySelector('[data-res-raw]'),
      effective: root.querySelector('[data-res-effective]'),
      comp: root.querySelector('[data-res-comp]'),
      pct: root.querySelector('[data-res-pct]'),
      verdict: root.querySelector('[data-res-verdict]')
    }
  };
  root.querySelectorAll('[data-rd-screen]').forEach(function (el) {
    els.screens[el.getAttribute('data-rd-screen')] = el;
  });

  let passage = null;
  let startedAt = 0;

  function show(screen) {
    Object.keys(els.screens).forEach(function (k) {
      els.screens[k].hidden = k !== screen;
    });
  }

  function beginReading() {
    passage = AurorIQ.readingEngine.pickPassage();
    els.title.textContent = passage.title;
    els.passage.textContent = passage.text;
    show('read');
    startedAt = performance.now();
  }

  function buildQuiz() {
    els.quiz.innerHTML = '';
    passage.questions.forEach(function (item, qi) {
      const fs = document.createElement('fieldset');
      fs.className = 'rd-q';
      const legend = document.createElement('legend');
      legend.className = 'rd-q__legend';
      legend.textContent = (qi + 1) + '. ' + item.q;
      fs.appendChild(legend);
      item.options.forEach(function (opt, oi) {
        const id = 'q' + qi + 'o' + oi;
        const label = document.createElement('label');
        label.className = 'rd-opt';
        label.setAttribute('for', id);
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'q' + qi;
        input.id = id;
        input.value = String(oi);
        const span = document.createElement('span');
        span.textContent = opt;
        label.appendChild(input);
        label.appendChild(span);
        fs.appendChild(label);
      });
      els.quiz.appendChild(fs);
    });
  }

  function collectAnswers() {
    return passage.questions.map(function (_, qi) {
      const checked = els.quiz.querySelector('input[name="q' + qi + '"]:checked');
      return checked ? parseInt(checked.value, 10) : -1;
    });
  }

  function finish() {
    const elapsed = performance.now() - startedAt;
    const answers = collectAnswers();
    const r = AurorIQ.readingEngine.scoreReading(passage, elapsed, answers);

    els.results.raw.textContent = r.rawWpm + ' WPM';
    els.results.effective.textContent = r.effectiveWpm + ' WPM';
    els.results.comp.textContent = r.comprehension.correct + '/' + r.comprehension.total
      + ' (' + r.comprehensionPct + '%)';

    if (r.tooFast) {
      els.results.pct.textContent = '—';
      els.results.verdict.textContent = 'That was faster than the passage can honestly be read, so we didn\u2019t score a percentile. Give it a real read and try again.';
    } else if (!r.passed) {
      els.results.pct.textContent = '—';
      els.results.verdict.textContent = 'Speed only counts with comprehension. You scored below 60% on the questions, so the reading-speed percentile is withheld — reading faster than you understand isn\u2019t reading faster.';
    } else {
      const p = r.percentile;
      els.results.pct.textContent = '~' + p + ordinal(p);
      els.results.verdict.textContent = 'Percentile reflects your effective speed \u2014 raw pace scaled by comprehension \u2014 against an illustrative internal reference, not a validated population sample.';
    }
    if (AurorIQ.reports) AurorIQ.reports.render('reading', r, els.screens.results);
    show('results');
  }

  function ordinal(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  }

  root.querySelectorAll('[data-rd-start]').forEach(function (b) {
    b.addEventListener('click', beginReading);
  });
  root.querySelectorAll('[data-rd-done-reading]').forEach(function (b) {
    b.addEventListener('click', function () { buildQuiz(); show('quiz'); });
  });
  root.querySelectorAll('[data-rd-submit]').forEach(function (b) {
    b.addEventListener('click', finish);
  });
  root.querySelectorAll('[data-rd-retry]').forEach(function (b) {
    b.addEventListener('click', function () { show('intro'); });
  });

  show('intro');
})(typeof window !== 'undefined' ? window : globalThis,
   typeof document !== 'undefined' ? document : null);
