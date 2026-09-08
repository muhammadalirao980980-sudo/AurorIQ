(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.identity = AurorIQ.identity || {};

  const ARCHETYPES = {
    architect: {
      id: 'architect',
      name: 'The Architect',
      domains: ['spatial', 'pattern'],
      tagline: 'Builds mental structures and sees systems whole.',
      description: 'You move fluidly between abstract rules and concrete form, spotting the structure beneath a problem before others see the pieces.',
      complement: 'sage',
      rival: 'oracle'
    },
    cartographer: {
      id: 'cartographer',
      name: 'The Cartographer',
      domains: ['spatial'],
      tagline: 'Navigates and maps complex space.',
      description: 'Where others get lost in complexity, you build a clear mental map quickly and find your bearings fast.',
      complement: 'oracle',
      rival: 'visionary'
    },
    cipher: {
      id: 'cipher',
      name: 'The Cipher',
      domains: ['numeric'],
      tagline: 'Breaks quantitative patterns others miss.',
      description: 'Numbers reveal their structure to you quickly. You find the rule hiding inside the data.',
      complement: 'sage',
      rival: 'catalyst'
    },
    visionary: {
      id: 'visionary',
      name: 'The Visionary',
      domains: ['pattern'],
      tagline: 'Sees the next move before it forms.',
      description: 'You read sequences and rules instinctively, often anticipating where a pattern is headed.',
      complement: 'oracle',
      rival: 'cartographer'
    },
    sage: {
      id: 'sage',
      name: 'The Sage',
      domains: ['verbal'],
      tagline: 'Deep retained knowledge and command of language.',
      description: 'Words and their relationships are your terrain: precise, nuanced, and well held in memory.',
      complement: 'architect',
      rival: 'cipher'
    },
    oracle: {
      id: 'oracle',
      name: 'The Oracle',
      domains: ['memory'],
      tagline: 'Holds and recalls vast structure.',
      description: 'You retain detail with unusual fidelity, carrying more of the picture in mind at once than most.',
      complement: 'cartographer',
      rival: 'sage'
    },
    catalyst: {
      id: 'catalyst',
      name: 'The Catalyst',
      domains: ['numeric', 'verbal'],
      tagline: 'Bridges logic and language.',
      description: 'You translate fluently between precise numbers and persuasive words, equally at home in either register.',
      complement: 'cipher',
      rival: 'sage'
    },
    synthesist: {
      id: 'synthesist',
      name: 'The Synthesist',
      domains: [],
      tagline: 'Connects everything, favors no single lane.',
      description: 'No single domain dominates. Your strength is in how evenly your reasoning holds together across very different kinds of problems.',
      complement: 'polymath',
      rival: 'visionary'
    },
    polymath: {
      id: 'polymath',
      name: 'The Polymath',
      domains: [],
      tagline: 'Rare, balanced, and high across the board.',
      description: 'A genuinely uncommon profile: strong and even across every domain measured, with no clear weak point.',
      complement: 'synthesist',
      rival: null,
      rare: true
    }
  };

  const SINGLE_DOMINANT = {
    pattern: 'visionary',
    spatial: 'cartographer',
    memory: 'oracle',
    numeric: 'cipher',
    verbal: 'sage'
  };

  const THRESHOLDS = {
    highStrength: 65,
    balanceSpread: 8,
    pairGap: 6
  };

  function getById(id) {
    return ARCHETYPES[id] || null;
  }

  function all() {
    return Object.values(ARCHETYPES);
  }

  function resolve(result) {
    if (!result || !result.domainRanking || result.domainRanking.length < 5) {
      return getById('synthesist');
    }

    const ranking = result.domainRanking;
    const domains = result.domains;
    const values = ranking.map((d) => domains[d].strengthIndex);

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const spread = Math.sqrt(variance);
    const allHigh = values.every((v) => v >= THRESHOLDS.highStrength);

    if (spread <= THRESHOLDS.balanceSpread && allHigh) {
      return getById('polymath');
    }

    if (spread <= THRESHOLDS.balanceSpread) {
      return getById('synthesist');
    }

    const top1 = ranking[0];
    const top2 = ranking[1];
    const gapTop = domains[top1].strengthIndex - domains[top2].strengthIndex;

    if (gapTop <= THRESHOLDS.pairGap) {
      const pairKey = [top1, top2].slice().sort().join('-');
      if (pairKey === 'pattern-spatial') return getById('architect');
      if (pairKey === 'numeric-verbal') return getById('catalyst');
    }

    return getById(SINGLE_DOMINANT[top1]) || getById('synthesist');
  }

  AurorIQ.identity.archetypes = {
    list: ARCHETYPES,
    thresholds: THRESHOLDS,
    getById: getById,
    all: all,
    resolve: resolve
  };

})(window);
