(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.testEngine = AurorIQ.testEngine || {};

  const IQ_MEAN = 100;
  const IQ_SD = 15;
  const IQ_DISPLAY_MIN = 55;
  const IQ_DISPLAY_MAX = 145;

  const TIERS = [
    { id: 'aurora', label: 'Aurora', minPercentile: 99 },
    { id: 'ascendant', label: 'Ascendant', minPercentile: 96 },
    { id: 'radiant', label: 'Radiant', minPercentile: 85 },
    { id: 'luminous', label: 'Luminous', minPercentile: 60 },
    { id: 'lucid', label: 'Lucid', minPercentile: 25 },
    { id: 'emergent', label: 'Emergent', minPercentile: 0 }
  ];

  const BANDS = [
    { max: 69, label: 'Low' },
    { max: 79, label: 'Below Average' },
    { max: 89, label: 'Low Average' },
    { max: 109, label: 'Average' },
    { max: 119, label: 'High Average' },
    { max: 129, label: 'Superior' },
    { max: 139, label: 'Very Superior' },
    { max: Infinity, label: 'Exceptional' }
  ];

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
          a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.SQRT2));
  }

  function thetaToIQ(theta) {
    return Math.round(IQ_MEAN + theta * IQ_SD);
  }

  function thetaToPercentile(theta) {
    return clamp(normalCDF(theta) * 100, 0.1, 99.9);
  }

  function resolveTier(percentile) {
    for (let i = 0; i < TIERS.length; i++) {
      if (percentile >= TIERS[i].minPercentile) return TIERS[i];
    }
    return TIERS[TIERS.length - 1];
  }

  function getBandLabel(iq) {
    for (let i = 0; i < BANDS.length; i++) {
      if (iq <= BANDS[i].max) return BANDS[i].label;
    }
    return BANDS[BANDS.length - 1].label;
  }

  function domainStrengthIndex(domainTheta) {
    return clamp(Math.round(50 + domainTheta * 15), 5, 95);
  }

  function computeResult(responses, domainOrder) {
    const adaptive = AurorIQ.testEngine.adaptive;

    if (!responses || !responses.length) {
      return null;
    }

    const overall = adaptive.estimateTheta(responses);
    const overallTheta = overall.theta;
    const overallSE = adaptive.standardError(overallTheta, responses);

    const rawIQ = thetaToIQ(overallTheta);
    const displayIQ = clamp(rawIQ, IQ_DISPLAY_MIN, IQ_DISPLAY_MAX);

    const marginOfError = Math.round(1.96 * overallSE * IQ_SD);
    const confidenceInterval = {
      low: clamp(rawIQ - marginOfError, 40, 170),
      high: clamp(rawIQ + marginOfError, 40, 170)
    };

    const percentile = thetaToPercentile(overallTheta);
    const tier = resolveTier(percentile);
    const bandLabel = getBandLabel(displayIQ);

    const domains = {};
    (domainOrder || []).forEach((domainId) => {
      const domainResponses = responses.filter((r) => r.domain === domainId);
      if (!domainResponses.length) {
        domains[domainId] = {
          domain: domainId,
          itemCount: 0,
          theta: null,
          strengthIndex: 50,
          precision: 'none'
        };
        return;
      }

      const domainEstimate = adaptive.estimateTheta(domainResponses, overallTheta);
      const domainSE = adaptive.standardError(domainEstimate.theta, domainResponses);

      domains[domainId] = {
        domain: domainId,
        itemCount: domainResponses.length,
        theta: domainEstimate.theta,
        se: domainSE,
        strengthIndex: domainStrengthIndex(domainEstimate.theta),
        precision: domainResponses.length < 8 ? 'low' : 'moderate'
      };
    });

    const domainRanking = Object.values(domains)
      .filter((d) => d.theta !== null)
      .sort((a, b) => b.theta - a.theta)
      .map((d) => d.domain);

    return {
      generatedAt: Date.now(),
      itemsAnswered: responses.length,
      overall: {
        theta: overallTheta,
        se: overallSE,
        converged: overall.converged,
        rawIQ: rawIQ,
        displayIQ: displayIQ,
        confidenceInterval: confidenceInterval,
        percentile: percentile,
        bandLabel: bandLabel
      },
      tier: tier,
      domains: domains,
      domainRanking: domainRanking,
      strongestDomain: domainRanking[0] || null,
      weakestDomain: domainRanking[domainRanking.length - 1] || null,
      scoringMethod: {
        overall: 'single-pass-mle-full-response-set',
        domain: 'per-domain-mle-seeded-by-overall-theta',
        note: 'Per-domain estimates are based on roughly five items each and carry high uncertainty. They are reported as relative strength indicators, not precise sub-scores.'
      }
    };
  }

  AurorIQ.testEngine.scoring = {
    IQ_MEAN: IQ_MEAN,
    IQ_SD: IQ_SD,
    TIERS: TIERS,
    normalCDF: normalCDF,
    thetaToIQ: thetaToIQ,
    thetaToPercentile: thetaToPercentile,
    resolveTier: resolveTier,
    getBandLabel: getBandLabel,
    computeResult: computeResult
  };

})(window);
