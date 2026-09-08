(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.testEngine = AurorIQ.testEngine || {};

  const META = {
    version: '1.0.0',
    itemCount: 25,
    domains: ['pattern', 'numeric', 'verbal', 'spatial', 'memory'],
    itemsPerDomain: 5,
    model: '3PL',
    calibrationStatus: 'expert-seeded',
    calibrated: false,
    calibrationNote: 'Item parameters are expert-seeded starting estimates, not derived from empirical response data. They will be replaced by parameters estimated from anonymized response data once sufficient volume is collected.'
  };

  const ITEMS = [
    {
      id: 'pa1', domain: 'pattern', type: 'multiple-choice',
      prompt: 'Which letter continues the sequence: A, C, E, G, ?',
      options: ['H', 'I', 'J', 'F'], answer: 1,
      irt: { a: 0.92, b: -1.87, c: 0.21 }
    },
    {
      id: 'pa2', domain: 'pattern', type: 'multiple-choice',
      prompt: 'Which pair continues the sequence: AB, BC, CD, ?',
      options: ['DE', 'EF', 'CE', 'DF'], answer: 0,
      irt: { a: 1.18, b: -1.04, c: 0.24 }
    },
    {
      id: 'pa3', domain: 'pattern', type: 'multiple-choice',
      prompt: 'Which letter continues the sequence: Z, Y, X, ?, V',
      options: ['U', 'W', 'T', 'S'], answer: 1,
      irt: { a: 0.81, b: -0.13, c: 0.19 }
    },
    {
      id: 'pa4', domain: 'pattern', type: 'multiple-choice',
      prompt: 'A pattern repeats as star, dot, star, dot. If it continues, what is the 9th symbol?',
      options: ['Star', 'Dot', 'Both', 'Neither'], answer: 0,
      irt: { a: 1.41, b: 0.92, c: 0.16 }
    },
    {
      id: 'pa5', domain: 'pattern', type: 'multiple-choice',
      prompt: 'Which letter continues the sequence: B, D, G, K, ?',
      options: ['P', 'O', 'Q', 'N'], answer: 0,
      irt: { a: 1.07, b: 1.98, c: 0.27 }
    },
    {
      id: 'nu1', domain: 'numeric', type: 'multiple-choice',
      prompt: 'If 3 apples cost $6, how much do 5 apples cost?',
      options: ['$10', '$12', '$9', '$15'], answer: 0,
      irt: { a: 0.88, b: -1.79, c: 0.23 }
    },
    {
      id: 'nu2', domain: 'numeric', type: 'multiple-choice',
      prompt: 'What number is missing: 5, 10, 20, 40, ?',
      options: ['80', '60', '70', '90'], answer: 0,
      irt: { a: 1.26, b: -0.91, c: 0.18 }
    },
    {
      id: 'nu3', domain: 'numeric', type: 'multiple-choice',
      prompt: 'A train travels 60 miles in 1.5 hours at a constant speed. How far does it travel in 4 hours?',
      options: ['160 miles', '150 miles', '180 miles', '140 miles'], answer: 0,
      irt: { a: 0.95, b: -0.07, c: 0.22 }
    },
    {
      id: 'nu4', domain: 'numeric', type: 'multiple-choice',
      prompt: 'The sum of three consecutive integers is 72. What is the largest of the three?',
      options: ['25', '24', '26', '23'], answer: 0,
      irt: { a: 1.52, b: 1.14, c: 0.15 }
    },
    {
      id: 'nu5', domain: 'numeric', type: 'multiple-choice',
      prompt: 'Pipe A fills a tank in 6 hours, pipe B fills it in 4 hours. Working together, how many hours to fill it?',
      options: ['2.4', '2.5', '2', '3'], answer: 0,
      irt: { a: 1.11, b: 2.06, c: 0.20 }
    },
    {
      id: 've1', domain: 'verbal', type: 'multiple-choice',
      prompt: 'Which word does not belong: Whisper, Shout, Mumble, Table',
      options: ['Whisper', 'Shout', 'Mumble', 'Table'], answer: 3,
      irt: { a: 0.84, b: -1.72, c: 0.25 }
    },
    {
      id: 've2', domain: 'verbal', type: 'multiple-choice',
      prompt: 'Hot is to Cold as Up is to ___',
      options: ['Down', 'Sideways', 'Top', 'Left'], answer: 0,
      irt: { a: 1.33, b: -0.88, c: 0.19 }
    },
    {
      id: 've3', domain: 'verbal', type: 'multiple-choice',
      prompt: "Which word means the opposite of 'Reluctant'?",
      options: ['Eager', 'Hesitant', 'Unwilling', 'Shy'], answer: 0,
      irt: { a: 0.97, b: 0.04, c: 0.21 }
    },
    {
      id: 've4', domain: 'verbal', type: 'multiple-choice',
      prompt: 'Author is to Book as Composer is to ___',
      options: ['Symphony', 'Paintbrush', 'Theater', 'Audience'], answer: 0,
      irt: { a: 1.19, b: 1.02, c: 0.17 }
    },
    {
      id: 've5', domain: 'verbal', type: 'multiple-choice',
      prompt: 'Which word is the odd one out: Frugal, Thrifty, Prudent, Lavish',
      options: ['Frugal', 'Thrifty', 'Prudent', 'Lavish'], answer: 3,
      irt: { a: 1.46, b: 1.91, c: 0.24 }
    },
    {
      id: 'sp1', domain: 'spatial', type: 'multiple-choice',
      prompt: 'If you fold a square piece of paper in half once, how many layers of paper are there?',
      options: ['2', '1', '3', '4'], answer: 0,
      irt: { a: 0.79, b: -1.61, c: 0.22 }
    },
    {
      id: 'sp2', domain: 'spatial', type: 'multiple-choice',
      prompt: 'A cube is painted red on all faces, then cut into 27 equal smaller cubes. How many small cubes have exactly 2 red faces?',
      options: ['12', '8', '6', '24'], answer: 0,
      irt: { a: 1.22, b: -0.79, c: 0.20 }
    },
    {
      id: 'sp3', domain: 'spatial', type: 'multiple-choice',
      prompt: 'You face North, turn 90° clockwise, then turn 180°. Which direction do you now face?',
      options: ['West', 'East', 'South', 'North'], answer: 0,
      irt: { a: 1.03, b: 0.16, c: 0.18 }
    },
    {
      id: 'sp4', domain: 'spatial', type: 'multiple-choice',
      prompt: 'A rectangular block is 4 units long, 3 wide, and 2 tall. Viewed directly from above, what shape do you see?',
      options: ['A 4 by 3 rectangle', 'A square', 'A 4 by 2 rectangle', 'A triangle'], answer: 0,
      irt: { a: 1.37, b: 1.18, c: 0.23 }
    },
    {
      id: 'sp5', domain: 'spatial', type: 'multiple-choice',
      prompt: 'A cube is cut into 27 small cubes and all outer faces are painted. How many small cubes have no painted faces at all?',
      options: ['1', '0', '6', '8'], answer: 0,
      irt: { a: 1.15, b: 2.09, c: 0.26 }
    },
    {
      id: 'me1', domain: 'memory', type: 'span-recall',
      sequence: ['4', '9', '2'],
      prompt: 'Which number appeared first?',
      options: ['4', '9', '2', '7'], answer: 0,
      irt: { a: 0.86, b: -1.66, c: 0.20 }
    },
    {
      id: 'me2', domain: 'memory', type: 'span-recall',
      sequence: ['K', 'R', 'T', 'F'],
      prompt: 'Which letter appeared second?',
      options: ['F', 'R', 'K', 'T'], answer: 1,
      irt: { a: 1.29, b: -0.84, c: 0.23 }
    },
    {
      id: 'me3', domain: 'memory', type: 'span-recall',
      sequence: ['8', '3', '6', '1', '5'],
      prompt: 'Which number appeared last?',
      options: ['1', '5', '8', '3'], answer: 1,
      irt: { a: 0.93, b: -0.06, c: 0.17 }
    },
    {
      id: 'me4', domain: 'memory', type: 'span-recall',
      sequence: ['Q', 'J', 'M', 'X', 'B', 'N'],
      prompt: 'Which letter appeared fourth?',
      options: ['M', 'X', 'B', 'N'], answer: 1,
      irt: { a: 1.44, b: 1.07, c: 0.21 }
    },
    {
      id: 'me5', domain: 'memory', type: 'span-recall',
      sequence: ['7', '1', '9', '4', '2', '8', '5'],
      prompt: 'Which number appeared fifth?',
      options: ['2', '4', '9', '8'], answer: 0,
      irt: { a: 1.09, b: 1.97, c: 0.25 }
    }
  ];

  function getById(id) {
    return ITEMS.find((item) => item.id === id) || null;
  }

  function getByDomain(domain) {
    return ITEMS.filter((item) => item.domain === domain);
  }

  function all() {
    return ITEMS.slice();
  }

  AurorIQ.testEngine.questions = {
    meta: META,
    items: ITEMS,
    getById: getById,
    getByDomain: getByDomain,
    all: all
  };

})(window);
