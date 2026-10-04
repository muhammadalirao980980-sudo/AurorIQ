/* registry.js — the platform tool registry (v6).
 * Single source of truth for every instrument and category.
 *
 * Static-first rule: SEO-critical content is always written into HTML by hand
 * (search engines and AI crawlers must see it without JS). This registry powers
 * non-indexed dynamic surfaces (results-page cross-promotion, future dashboards)
 * and serves as the canonical checklist when adding pages.
 *
 * Adding a tool = one entry here + one page from docs/templates/tool-page.html.
 * See docs/ARCHITECTURE.md for the full 4-step procedure.
 */
(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  const CATEGORIES = {
    cognition: {
      slug: 'cognition',
      name: 'Cognition',
      url: '/cognition/',
      tagline: 'Measure the shape of your mind',
      status: 'live'
    },
    psychology: {
      slug: 'psychology',
      name: 'Psychology',
      url: 'https://personica.net/?ref=auroriq',
      external: true,
      tagline: 'Understand the machinery behind the mind',
      status: 'live'
    },
    learning: {
      slug: 'learning',
      name: 'Learning',
      url: '/learning/',
      tagline: 'Learn the way your brain actually works',
      status: 'live'
    },
    career: {
      slug: 'career',
      name: 'Career',
      url: '/career/',
      tagline: 'Point your mind at the right problems',
      status: 'live'
    },
    productivity: {
      slug: 'productivity',
      name: 'Productivity',
      url: '/productivity/',
      tagline: 'Turn insight into output',
      status: 'live'
    }
  };

  /* status: 'live' (on this site) | 'external' (sister instrument) | 'dev' */
  const TOOLS = [
    {
      id: 'iq-test',
      name: 'Adaptive IQ Test',
      url: '/iq-test/',
      category: 'cognition',
      status: 'live',
      duration: '~15 min',
      tagline: 'The flagship instrument',
      description: '25 adaptive questions across five reasoning domains — a model-based estimate, an uncertainty range, and a cognitive archetype.'
    },
    {
      id: 'personality',
      name: 'Personality (Big Five)',
      url: 'https://personica.net/?ref=auroriq',
      category: 'psychology',
      status: 'external',
      duration: '~12 min',
      tagline: 'On Personica, our sister instrument',
      description: 'The OCEAN model across sixteen archetypes, with career signals.'
    },
    {
      id: 'memory-test',
      name: 'Memory Test',
      url: '/memory-test/',
      category: 'cognition',
      status: 'live',
      duration: '~5 min',
      tagline: 'Working-memory span',
      description: 'The classic digit-span task, forward and backward, scored against approximate adult norms.'
    },
    {
      id: 'processing-speed',
      name: 'Reaction Time Test',
      url: '/reaction-time-test/',
      category: 'cognition',
      status: 'live',
      duration: '~2 min',
      tagline: 'Simple visual reaction time',
      description: 'Simple visual reaction time — five scored trials, median result against approximate adult norms.'
    },
    {
      id: 'perceptual-speed',
      name: 'Processing Speed Test',
      url: '/processing-speed-test/',
      category: 'cognition',
      status: 'live',
      duration: '~2 min',
      tagline: 'Same/different throughput, timed',
      description: 'A timed same/different comparison task measuring processing speed — cognitive throughput, not just reaction time.'
    },
    {
      id: 'logical-reasoning',
      name: 'Logical Reasoning Test',
      url: '/logical-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~5 min',
      tagline: 'Series, syllogisms, deduction',
      description: 'A difficulty-weighted fluid-reasoning test spanning series, syllogisms, deduction, and odd-one-out.'
    },
    {
      id: 'spatial-test',
      name: 'Spatial Reasoning Test',
      url: '/spatial-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~4 min',
      tagline: 'Mental rotation, measured exactly',
      description: 'A same-or-mirror mental-rotation task with procedurally generated shapes and exact ground truth.'
    },
    {
      id: 'verbal-test',
      name: 'Verbal Reasoning Test',
      url: '/verbal-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~5 min',
      tagline: 'Analogies, synonyms, antonyms',
      description: 'A difficulty-weighted verbal reasoning test drawn from an authored item bank.'
    },
    {
      id: 'numerical-reasoning',
      name: 'Numerical Reasoning Test',
      url: '/numerical-reasoning-test/',
      category: 'cognition',
      status: 'live',
      duration: '~6 min',
      tagline: 'Series, ratios, word problems',
      description: 'A difficulty-weighted quantitative reasoning test — number series, arithmetic, ratios, and data.'
    },
    {
      id: 'creativity-test',
      name: 'Creativity Test',
      url: '/creativity-test/',
      category: 'cognition',
      status: 'live',
      duration: '2 min',
      tagline: 'Divergent thinking, honestly scored',
      description: 'The Alternate Uses Task — timed divergent-thinking fluency, with originality openly not faked.'
    },
    {
      id: 'study-habits',
      name: 'Study Habits Test',
      url: '/study-habits-test/',
      category: 'learning',
      status: 'live',
      duration: '~4 min',
      tagline: 'How you study vs what works',
      description: 'A 20-item check of your study habits against evidence-based learning techniques.'
    },
    {
      id: 'study-planner',
      name: 'Study Planner',
      url: '/study-planner/',
      category: 'learning',
      status: 'live',
      duration: '~2 min',
      tagline: 'A spaced-repetition schedule',
      description: 'Turns your topics and exam date into an expanding-interval review schedule.'
    },
    { id: 'learning-style',     name: 'Learning Style',         url: null, category: 'learning',     status: 'dev', description: 'How you actually absorb new material.' },
    {
      id: 'reading-speed',
      name: 'Reading Speed Test',
      url: '/reading-speed-test/',
      category: 'learning',
      status: 'live',
      duration: '~4 min',
      tagline: 'Words per minute, comprehension-checked',
      description: 'Timed reading of an original passage, gated by a five-question comprehension check.'
    },
    {
      id: 'focus-assessment',
      name: 'Focus Test',
      url: '/focus-test/',
      category: 'learning',
      status: 'live',
      duration: '~3 min',
      tagline: 'Sustained attention, measured not guessed',
      description: 'A Go/No-Go continuous-performance task measuring vigilance, impulse control, and response consistency.'
    },
    {
      id: 'career-match',
      name: 'Career Interest Profiler',
      url: '/career-interest-test/',
      category: 'career',
      status: 'live',
      duration: '~5 min',
      tagline: 'RIASEC interests, Holland Code',
      description: 'A 30-item RIASEC interest inventory — maps what work draws you and gives your Holland Code.'
    },
    {
      id: 'work-values',
      name: 'Work Values Profiler',
      url: '/work-values-test/',
      category: 'career',
      status: 'live',
      duration: '~5 min',
      tagline: 'What you need from work',
      description: 'A 30-item work-values inventory — ranks the six needs that drive your job satisfaction.'
    },
    {
      id: 'work-style',
      name: 'Work Style Profiler',
      url: '/work-style-test/',
      category: 'career',
      status: 'live',
      duration: '~4 min',
      tagline: 'How you prefer to work',
      description: 'A 24-item bipolar profiler across six working-preference spectrums — no type, no good or bad.'
    },
    {
      id: 'interview-readiness',
      name: 'Interview Readiness Check',
      url: '/interview-readiness-test/',
      category: 'career',
      status: 'live',
      duration: '~4 min',
      tagline: 'Preparation, honestly scored',
      description: 'A practical readiness check across research, stories, questions, logistics, and rehearsal — not a personality test.'
    },
    {
      id: 'chronotype',
      name: 'Chronotype Test',
      url: '/chronotype-test/',
      category: 'productivity',
      status: 'live',
      duration: '~2 min',
      tagline: 'Night owl or early bird',
      description: 'A 9-item morningness–eveningness test — finds your chronotype and peak-focus window.'
    },
    {
      id: 'habit-analyzer',
      name: 'Habit Analyzer',
      url: '/habit-analyzer/',
      category: 'productivity',
      status: 'live',
      duration: '~3 min',
      tagline: 'Will your habit stick?',
      description: 'A 20-item check of how well a habit is designed to stick, across five evidence-based factors.'
    },
    {
      id: 'time-audit',
      name: 'Time Audit',
      url: '/time-audit/',
      category: 'productivity',
      status: 'live',
      duration: '~3 min',
      tagline: 'Where your 168 hours go',
      description: 'An interactive weekly time allocator — see the real shape of your week, honestly.'
    }
  ];

  function byCategory(slug) {
    return TOOLS.filter(function (t) { return t.category === slug; });
  }
  function live() {
    return TOOLS.filter(function (t) { return t.status === 'live' || t.status === 'external'; });
  }
  function get(id) {
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i];
    return null;
  }

  AurorIQ.registry = {
    categories: CATEGORIES,
    tools: TOOLS,
    byCategory: byCategory,
    live: live,
    get: get
  };

  /* Node/test export without affecting the browser IIFE */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.registry;
  }
})(typeof window !== 'undefined' ? window : globalThis);
