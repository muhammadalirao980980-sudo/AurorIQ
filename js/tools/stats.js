/* stats.js — shared statistics helpers for platform tools (v6.1).
 * Authored for the Memory Test; percentiles derive from approximate published
 * adult norms, and every consumer MUST present them as approximations —
 * that honesty is part of the brand (BRAND.md §4-5).
 */
(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});

  /* Abramowitz & Stegun 7.1.26 rational approximation of erf.
   * Max absolute error ~1.5e-7 — far below anything visible in a
   * whole-number percentile. Verified numerically against a reference
   * implementation across [-4, 4]. */
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
      - 0.284496736) * t + 0.254829592) * t;
    return sign * (1 - poly * Math.exp(-ax * ax));
  }

  function normalCdf(x, mean, sd) {
    if (![x, mean, sd].every(Number.isFinite) || sd <= 0) return null;
    return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
  }

  /* Percentile (1-99, clamped) of value under N(mean, sd).
   * Clamping is deliberate: reporting 0 or 100 would overstate certainty.
   * Pass lowerIsBetter=true for measures like reaction time, where the
   * better tail is the low one. */
  function percentile(value, mean, sd, lowerIsBetter) {
    const cdf = normalCdf(value, mean, sd);
    if (cdf === null) return null;
    let p = Math.round(cdf * 100);
    if (lowerIsBetter) p = 100 - p;
    return Math.min(99, Math.max(1, p));
  }

  function median(values) {
    if (!Array.isArray(values)) return null;
    const a = values.filter(Number.isFinite).slice().sort(function (x, y) { return x - y; });
    if (!a.length) return null;
    const m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  /* Words per minute from a word count and elapsed milliseconds. */
  function wpm(words, elapsedMs) {
    if (elapsedMs <= 0) return 0;
    return Math.round(words / (elapsedMs / 60000));
  }

  /* z-score of a value under N(mean, sd). */
  function zScore(value, mean, sd) {
    if (![value, mean, sd].every(Number.isFinite) || sd <= 0) return null;
    return (value - mean) / sd;
  }

  /* Percentile of an average of z-scores (for composites across sub-tasks). */
  function compositePercentile(zScores) {
    if (!Array.isArray(zScores)) return null;
    const valid = zScores.filter(Number.isFinite);
    if (!valid.length) return null;
    const mean = valid.reduce(function (a, b) { return a + b; }, 0) / valid.length;
    const cdf = normalCdf(mean, 0, 1);
    if (cdf === null) return null;
    const p = Math.round(cdf * 100);
    return Math.min(99, Math.max(1, p));
  }

  AurorIQ.stats = {
    erf: erf,
    normalCdf: normalCdf,
    percentile: percentile,
    median: median,
    wpm: wpm,
    zScore: zScore,
    compositePercentile: compositePercentile
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AurorIQ.stats;
  }
})(typeof window !== 'undefined' ? window : globalThis);
