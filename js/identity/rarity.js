(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.identity = AurorIQ.identity || {};

  const SIMULATION_SIZE = 20000;
  const SIM_MEAN = 60;
  const SIM_SD = 15;

  let cachedRates = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function gaussianRandom(mean, sd) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * sd + mean;
  }

  function simulateArchetypeRates(n) {
    const archetypes = AurorIQ.identity.archetypes;
    const domainOrder = AurorIQ.testEngine.domains.order;
    const counts = {};

    archetypes.all().forEach((a) => { counts[a.id] = 0; });

    for (let i = 0; i < n; i++) {
      const domains = {};
      domainOrder.forEach((d) => {
        const v = clamp(Math.round(gaussianRandom(SIM_MEAN, SIM_SD)), 5, 95);
        domains[d] = { strengthIndex: v };
      });

      const ranking = domainOrder.slice().sort((a, b) => domains[b].strengthIndex - domains[a].strengthIndex);
      const archetype = archetypes.resolve({ domains: domains, domainRanking: ranking });
      counts[archetype.id] = (counts[archetype.id] || 0) + 1;
    }

    const rates = {};
    Object.keys(counts).forEach((id) => { rates[id] = counts[id] / n; });
    return rates;
  }

  function getArchetypeRates() {
    if (!cachedRates) {
      cachedRates = simulateArchetypeRates(SIMULATION_SIZE);
    }
    return cachedRates;
  }

  function getArchetypeRarityPercent(archetypeId) {
    const rates = getArchetypeRates();
    const raw = (rates[archetypeId] || 0) * 100;
    return Math.max(0.1, Math.round(raw * 10) / 10);
  }

  function getTierRarityPercent(tierId) {
    const TIERS = AurorIQ.testEngine.scoring.TIERS;
    const idx = TIERS.findIndex((t) => t.id === tierId);
    if (idx === -1) return null;
    const lower = TIERS[idx].minPercentile;
    const upper = idx > 0 ? TIERS[idx - 1].minPercentile : 100;
    return Math.round((upper - lower) * 10) / 10;
  }

  function getCombinedRarityPercent(tierId, archetypeId) {
    const tierShare = getTierRarityPercent(tierId);
    const archShare = getArchetypeRarityPercent(archetypeId);
    if (tierShare === null || archShare === null) return null;
    const combined = (tierShare / 100) * (archShare / 100) * 100;
    return Math.max(0.05, Math.round(combined * 100) / 100);
  }

  function formatRarityLabel(percent) {
    if (percent === null || percent === undefined) return null;
    if (percent >= 1) return 'Top ' + Math.round(percent) + '%';
    return 'Top ' + (Math.round(percent * 10) / 10) + '%';
  }

  AurorIQ.identity.rarity = {
    meta: {
      method: 'monte-carlo-independent-domains',
      note: 'Archetype rarity is a model-based estimate under a simplified independent-domains assumption, not measured from real AurorIQ population data. It will be replaced by empirical population statistics once sufficient response data is collected.'
    },
    getArchetypeRarityPercent: getArchetypeRarityPercent,
    getTierRarityPercent: getTierRarityPercent,
    getCombinedRarityPercent: getCombinedRarityPercent,
    formatRarityLabel: formatRarityLabel
  };

})(window);
