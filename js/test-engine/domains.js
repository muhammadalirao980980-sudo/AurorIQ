(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.testEngine = AurorIQ.testEngine || {};

  const ORDER = ['pattern', 'numeric', 'verbal', 'spatial', 'memory'];

  const CONFIG = {
    pattern: {
      id: 'pattern',
      name: 'Pattern',
      description: 'Sequences, rules, and what comes next.',
      colorVar: '--domain-pattern',
      weight: 0.2
    },
    numeric: {
      id: 'numeric',
      name: 'Numeric',
      description: 'Quantitative and arithmetic reasoning.',
      colorVar: '--domain-numeric',
      weight: 0.2
    },
    verbal: {
      id: 'verbal',
      name: 'Verbal',
      description: 'Language, meaning, and relationships between words.',
      colorVar: '--domain-verbal',
      weight: 0.2
    },
    spatial: {
      id: 'spatial',
      name: 'Spatial',
      description: 'Mental rotation, form, and spatial structure.',
      colorVar: '--domain-spatial',
      weight: 0.2
    },
    memory: {
      id: 'memory',
      name: 'Memory',
      description: 'Working-memory span and recall.',
      colorVar: '--domain-memory',
      weight: 0.2
    }
  };

  function get(domainId) {
    return CONFIG[domainId] || null;
  }

  function all() {
    return ORDER.map((id) => CONFIG[id]);
  }

  function getWeight(domainId) {
    const d = CONFIG[domainId];
    return d ? d.weight : 0;
  }

  function getColor(domainId) {
    const d = CONFIG[domainId];
    if (!d) return null;
    if (typeof global.getComputedStyle !== 'function') return null;
    const value = global.getComputedStyle(document.documentElement).getPropertyValue(d.colorVar);
    return value ? value.trim() : null;
  }

  function emptyDomainMap(fill) {
    const map = {};
    ORDER.forEach((id) => {
      map[id] = typeof fill === 'function' ? fill(id) : fill;
    });
    return map;
  }

  AurorIQ.testEngine.domains = {
    order: ORDER.slice(),
    config: CONFIG,
    get: get,
    all: all,
    getWeight: getWeight,
    getColor: getColor,
    emptyDomainMap: emptyDomainMap
  };

})(window);
