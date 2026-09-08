(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.testEngine = AurorIQ.testEngine || {};

  const D = 1.7;
  const THETA_MIN = -4;
  const THETA_MAX = 4;
  const MAX_ITER = 25;
  const TOLERANCE = 0.001;
  const MAX_STEP = 1;
  const INFO_FLOOR = 1e-6;
  const DEFAULT_SE = 1.0;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function probability(theta, a, b, c) {
    const z = -D * a * (theta - b);
    const logistic = 1 / (1 + Math.exp(z));
    return c + (1 - c) * logistic;
  }

  function information(theta, a, b, c) {
    const p = probability(theta, a, b, c);
    if (p <= 0 || p >= 1 || c >= 1) return 0;
    const ratio = (p - c) / (1 - c);
    const q = 1 - p;
    return D * D * a * a * ratio * ratio * (q / p);
  }

  function scoreFunction(theta, responses) {
    let score = 0;
    responses.forEach((r) => {
      const a = r.irt.a, b = r.irt.b, c = r.irt.c;
      const p = probability(theta, a, b, c);
      if (p <= 0 || p >= 1) return;
      const u = r.correct ? 1 : 0;
      score += (D * a * (p - c) * (u - p)) / (p * (1 - c));
    });
    return score;
  }

  function totalInformation(theta, responses) {
    let total = 0;
    responses.forEach((r) => {
      total += information(theta, r.irt.a, r.irt.b, r.irt.c);
    });
    return total;
  }

  function estimateTheta(responses, startTheta) {
    if (!responses || !responses.length) {
      return { theta: typeof startTheta === 'number' ? startTheta : 0, iterations: 0, converged: false, method: 'prior' };
    }

    let theta = typeof startTheta === 'number' ? startTheta : 0;
    let converged = false;
    let iterations = 0;

    for (let i = 0; i < MAX_ITER; i++) {
      iterations = i + 1;
      const score = scoreFunction(theta, responses);
      const info = totalInformation(theta, responses);

      if (info < INFO_FLOOR) break;

      let step = score / info;
      step = clamp(step, -MAX_STEP, MAX_STEP);

      const nextTheta = clamp(theta + step, THETA_MIN, THETA_MAX);

      if (Math.abs(nextTheta - theta) < TOLERANCE) {
        theta = nextTheta;
        converged = true;
        break;
      }

      theta = nextTheta;
    }

    return { theta: theta, iterations: iterations, converged: converged, method: 'newton-raphson-bounded-step' };
  }

  function standardError(theta, responses) {
    if (!responses || !responses.length) return DEFAULT_SE;
    const info = totalInformation(theta, responses);
    if (info < INFO_FLOOR) return DEFAULT_SE;
    return 1 / Math.sqrt(info);
  }

  function domainCounts(answeredItems, domainOrder) {
    const counts = {};
    domainOrder.forEach((d) => { counts[d] = 0; });
    answeredItems.forEach((item) => {
      if (counts[item.domain] !== undefined) counts[item.domain] += 1;
    });
    return counts;
  }

  function selectNextItem(opts) {
    const theta = opts.theta;
    const bank = opts.bank;
    const answeredIds = opts.answeredIds || [];
    const domainTargets = opts.domainTargets || {};
    const domainOrder = opts.domainOrder || Object.keys(domainTargets);

    const answeredItems = answeredIds
      .map((id) => bank.find((item) => item.id === id))
      .filter(Boolean);

    const counts = domainCounts(answeredItems, domainOrder);

    const deficits = domainOrder.map((d) => ({
      domain: d,
      deficit: (domainTargets[d] || 0) - counts[d]
    }));

    const maxDeficit = deficits.reduce((m, d) => Math.max(m, d.deficit), -Infinity);
    const neededDomains = maxDeficit > 0
      ? deficits.filter((d) => d.deficit === maxDeficit).map((d) => d.domain)
      : domainOrder;

    let pool = bank.filter((item) => answeredIds.indexOf(item.id) === -1 && neededDomains.indexOf(item.domain) !== -1);

    if (!pool.length) {
      pool = bank.filter((item) => answeredIds.indexOf(item.id) === -1);
    }

    if (!pool.length) return null;

    let best = null;
    let bestInfo = -Infinity;

    pool.forEach((item) => {
      const info = information(theta, item.irt.a, item.irt.b, item.irt.c);
      if (info > bestInfo) {
        bestInfo = info;
        best = item;
      }
    });

    return best;
  }

  AurorIQ.testEngine.adaptive = {
    D: D,
    thetaBounds: { min: THETA_MIN, max: THETA_MAX },
    probability: probability,
    information: information,
    estimateTheta: estimateTheta,
    standardError: standardError,
    selectNextItem: selectNextItem
  };

})(window);
