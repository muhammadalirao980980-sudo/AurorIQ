(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.identity = AurorIQ.identity || {};

  /* ============================================================
     AGE NORMING (v5.4)

     The adaptive engine measures fluid-reasoning performance as a
     theta value on a young-adult reference scale (mean 100, SD 15).
     Fluid reasoning is not flat across the lifespan: it rises through
     adolescence, peaks in the early-to-mid 20s, then declines slowly.
     Children and teens are conventionally scored against same-age
     peers rather than the adult reference.

     So the SAME raw performance means something different depending on
     age. Age norming expresses the result relative to a person's own
     age group instead of the raw young-adult reference.

     This is a transparent, modest adjustment — NOT a flattery device.
     We always keep the raw (reference-scale) score available and label
     the age-adjusted figure clearly. The offsets below are expressed
     in theta units (1 theta = 15 IQ points) and reflect the general
     shape reported in the psychometric literature (e.g. the fluid
     component of Wechsler-family age norms), rounded to conservative,
     honest values rather than any single dataset.
     ============================================================ */

  // Reference group = the scale's baseline (young adults, ~18-24).
  // offsetTheta = how much to add to raw theta to express performance
  // relative to that age group. Positive offset => the age group
  // performs below the young-adult peak on raw fluid tasks, so an equal
  // raw performance is comparatively stronger for that age.
  const AGE_NORMS = [
    { min: 5,  max: 8,   label: '5–8 years',   offsetTheta: 0.95 },
    { min: 9,  max: 12,  label: '9–12 years',  offsetTheta: 0.70 },
    { min: 13, max: 15,  label: '13–15 years', offsetTheta: 0.40 },
    { min: 16, max: 17,  label: '16–17 years', offsetTheta: 0.15 },
    { min: 18, max: 24,  label: '18–24 years', offsetTheta: 0.00 },
    { min: 25, max: 34,  label: '25–34 years', offsetTheta: 0.05 },
    { min: 35, max: 44,  label: '35–44 years', offsetTheta: 0.15 },
    { min: 45, max: 54,  label: '45–54 years', offsetTheta: 0.28 },
    { min: 55, max: 64,  label: '55–64 years', offsetTheta: 0.45 },
    { min: 65, max: 120, label: '65+ years',   offsetTheta: 0.65 }
  ];

  const REFERENCE_LABEL = '18–24 years';

  function normFor(age) {
    if (age == null || isNaN(age)) return null;
    for (let i = 0; i < AGE_NORMS.length; i++) {
      if (age >= AGE_NORMS[i].min && age <= AGE_NORMS[i].max) return AGE_NORMS[i];
    }
    return null;
  }

  /* Given a raw result (from scoring.computeResult) and an intake
     profile, return an age-adjusted view. Returns null when no usable
     age is present, so callers can fall back to the raw result. */
  function adjust(result, intake) {
    if (!result || !intake || intake.age == null) return null;
    const scoring = AurorIQ.testEngine && AurorIQ.testEngine.scoring;
    if (!scoring) return null;

    const norm = normFor(intake.age);
    if (!norm) return null;

    const rawTheta = result.overall.theta;
    const adjTheta = rawTheta + norm.offsetTheta;

    const adjIQ = scoring.thetaToIQ(adjTheta);
    const displayAdjIQ = Math.min(Math.max(adjIQ, 55), 145);
    const adjPercentile = scoring.thetaToPercentile(adjTheta);
    const adjBand = scoring.getBandLabel(displayAdjIQ);
    const adjTier = scoring.resolveTier(adjPercentile);

    // Confidence interval keeps the same margin as the raw estimate.
    const rawCI = result.overall.confidenceInterval;
    const margin = Math.round((rawCI.high - rawCI.low) / 2);

    return {
      applied: true,
      ageGroup: norm.label,
      referenceGroup: REFERENCE_LABEL,
      offsetTheta: norm.offsetTheta,
      theta: adjTheta,
      rawIQ: adjIQ,
      displayIQ: displayAdjIQ,
      percentile: adjPercentile,
      bandLabel: adjBand,
      tier: adjTier,
      confidenceInterval: {
        low: Math.max(40, adjIQ - margin),
        high: Math.min(170, adjIQ + margin)
      },
      // How much the age adjustment moved the headline number, for copy.
      deltaIQ: displayAdjIQ - result.overall.displayIQ
    };
  }

  AurorIQ.identity.ageNorms = {
    AGE_NORMS: AGE_NORMS,
    REFERENCE_LABEL: REFERENCE_LABEL,
    normFor: normFor,
    adjust: adjust
  };

})(window);
