(function (global, document) {
  'use strict';

  var AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  var utils = AurorIQ.utils;
  var state = AurorIQ.state;

  function bindElements() {
    return {
      emptyState: utils.$('[data-empty-state]'),
      revealRoot: utils.$('[data-reveal-root]'),
      stages: {
        score: utils.$('[data-stage="score"]'),
        identity: utils.$('[data-stage="identity"]'),
        curve: utils.$('[data-stage="curve"]'),
        peers: utils.$('[data-stage="peers"]'),
        breakdown: utils.$('[data-stage="breakdown"]'),
        report: utils.$('[data-stage="report"]'),
        personica: utils.$('[data-stage="personica"]'),
        actions: utils.$('[data-stage="actions"]')
      },
      band: utils.$('[data-band]'),
      greeting: utils.$('[data-greeting]'),
      ageNote: utils.$('[data-age-note]'),
      scoreNum: utils.$('[data-score-num]'),
      ci: utils.$('[data-ci]'),
      tier: utils.$('[data-tier]'),
      archetypeName: utils.$('[data-archetype-name]'),
      tagline: utils.$('[data-archetype-tagline]'),
      rarity: utils.$('[data-rarity]'),
      description: utils.$('[data-archetype-desc]'),
      curveSvg: utils.$('[data-curve] svg'),
      curveCaption: utils.$('[data-curve-caption]'),
      peersSvg: utils.$('[data-peers-svg]'),
      peersEveryoneValue: utils.$('[data-peers-everyone-value]'),
      peersEveryoneLabel: utils.$('[data-peers-everyone-label]'),
      peersPeerRow: utils.$('[data-peers-peer-row]'),
      peersPeersValue: utils.$('[data-peers-peers-value]'),
      peersPeersLabel: utils.$('[data-peers-peers-label]'),
      peersCaption: utils.$('[data-peers-caption]'),
      radarSvg: utils.$('[data-radar-svg]'),
      bars: utils.$('[data-breakdown-bars]'),
      reportGrid: utils.$('[data-report-grid]'),
      lastResultBanner: utils.$('[data-last-result-banner]')
    };
  }

  /* Choose which score figures to headline. When an age-normed view is
     present we lead with it (that's the whole point of the intake), while
     always keeping the raw reference figures available for the note. */
  function effectiveView(result) {
    var raw = result.overall;
    if (result.ageNormed && result.ageNormed.applied) {
      var a = result.ageNormed;
      return {
        isAgeNormed: true,
        displayIQ: a.displayIQ,
        bandLabel: a.bandLabel,
        percentile: a.percentile,
        theta: a.theta,
        confidenceInterval: a.confidenceInterval,
        ageGroup: a.ageGroup,
        referenceGroup: a.referenceGroup,
        deltaIQ: a.deltaIQ,
        raw: raw
      };
    }
    return {
      isAgeNormed: false,
      displayIQ: raw.displayIQ,
      bandLabel: raw.bandLabel,
      percentile: raw.percentile,
      theta: raw.theta,
      confidenceInterval: raw.confidenceInterval,
      raw: raw
    };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function preparePersonalization(els, result, view) {
    var intake = result.intake || null;

    if (els.greeting) {
      var name = intake && intake.name ? String(intake.name).trim() : '';
      if (name) {
        els.greeting.innerHTML = 'Here\u2019s your result, <span class="reveal-greeting__name">' +
          escapeHtml(name) + '</span>.';
        els.greeting.hidden = false;
      } else {
        els.greeting.hidden = true;
      }
    }

    if (els.ageNote) {
      if (view.isAgeNormed) {
        var sign = view.deltaIQ > 0 ? '+' + view.deltaIQ : String(view.deltaIQ);
        var deltaText = view.deltaIQ !== 0
          ? ' (' + sign + ' vs. the ' + view.referenceGroup + ' reference)'
          : '';
        els.ageNote.innerHTML = 'Age-adjusted for the <strong>' + escapeHtml(view.ageGroup) +
          '</strong> group' + deltaText;
        els.ageNote.hidden = false;
      } else {
        els.ageNote.hidden = true;
      }
    }
  }

  function prepareScore(els, result, view) {
    els.band.textContent = view.bandLabel;
    var ci = view.confidenceInterval;
    els.ci.textContent = '95% range: ' + ci.low + '\u2013' + ci.high;
    els.scoreNum.textContent = '0';
  }

  function triggerScoreNumber(els, result, view) {
    var target = view.displayIQ;
    if (!utils || utils.prefersReducedMotion()) {
      els.scoreNum.textContent = String(target);
      return;
    }
    var start = Math.max(40, target - 45);
    utils.animateValue({
      from: start,
      to: target,
      duration: 1300,
      onUpdate: function (v) {
        els.scoreNum.textContent = String(Math.round(v));
      }
    });
  }

  function prepareIdentity(els, ctx) {
    els.tier.textContent = ctx.tier.label;
    els.archetypeName.textContent = ctx.archetype.name;
    els.tagline.textContent = ctx.archetype.tagline;
    els.description.textContent = ctx.archetype.description;

    var rarityModule = AurorIQ.identity.rarity;
    var combined = rarityModule.getCombinedRarityPercent(ctx.tier.id, ctx.archetype.id);
    var label = rarityModule.formatRarityLabel(combined);
    els.rarity.textContent = label ? label + ' of test-takers' : '';
  }

  function prepareCurve(els, result, view) {
    var pct = Math.round(view.percentile);
    els.curveCaption.textContent = 'Brighter than ' + pct + '% of people who take this test.';
  }

  function triggerCurve(els, result, view) {
    if (els.curveSvg && AurorIQ.components && AurorIQ.components.curve) {
      AurorIQ.components.curve.render(els.curveSvg, view.theta);
    }
  }

  function pctLabel(pct) {
    return 'Top ' + Math.max(1, Math.round(100 - pct)) + '%';
  }

  /* Peer comparison: shows the raw percentile (vs. the young-adult
     reference "everyone") and, when age is known, the age-adjusted
     percentile (vs. same-age peers). Both are figures we already
     compute — this stage just makes the comparison visible. */
  function preparePeers(els, result, view) {
    if (!els.stages.peers) return false;

    var hasPeers = view.isAgeNormed;
    var everyonePct = Math.round(result.overall.percentile);

    // Keep the second marker's visibility in sync synchronously (the
    // component also sets this, but reveal timing shouldn't matter).
    var peersMarker = els.peersSvg ? els.peersSvg.querySelector('[data-peers-peers]') : null;
    if (peersMarker) peersMarker.hidden = !hasPeers;

    // "vs everyone" always present
    if (els.peersEveryoneValue) {
      els.peersEveryoneValue.textContent = everyonePct + 'th pct · ' + pctLabel(everyonePct);
    }

    if (hasPeers) {
      var peersPct = Math.round(view.percentile);
      if (els.peersPeersLabel) els.peersPeersLabel.textContent = 'vs. your age group (' + view.ageGroup + ')';
      if (els.peersPeersValue) els.peersPeersValue.textContent = peersPct + 'th pct · ' + pctLabel(peersPct);
      if (els.peersPeerRow) els.peersPeerRow.hidden = false;

      var delta = peersPct - everyonePct;
      var caption;
      if (delta > 1) {
        caption = 'Compared with people your own age, you rank higher \u2014 fluid reasoning naturally shifts across the lifespan, so your ' +
          view.ageGroup + ' percentile (' + peersPct + 'th) sits above your all-ages percentile (' + everyonePct + 'th).';
      } else if (delta < -1) {
        caption = 'Your age group is, on average, a strong-performing cohort here, so your same-age percentile (' + peersPct +
          'th) sits a little below your all-ages figure (' + everyonePct + 'th).';
      } else {
        caption = 'Your standing is essentially the same whether compared against everyone or against your own age group.';
      }
      if (els.peersCaption) els.peersCaption.textContent = caption;
    } else {
      if (els.peersPeerRow) els.peersPeerRow.hidden = true;
      if (els.peersCaption) {
        els.peersCaption.textContent = 'Add your age when you take the test to also see how you compare against people your own age.';
      }
    }

    return true;
  }

  function triggerPeers(els, result, view) {
    if (els.peersSvg && AurorIQ.components && AurorIQ.components.peers) {
      AurorIQ.components.peers.render(els.peersSvg, {
        everyoneTheta: result.overall.theta,
        peersTheta: view.theta,
        hasPeers: view.isAgeNormed
      });
    }
  }

  function buildBreakdownDataset(result) {
    var domains = AurorIQ.testEngine.domains;
    return domains.order.map(function (id) {
      var conf = domains.get(id);
      return {
        domain: id,
        label: conf ? conf.name : id,
        value: result.domains[id] ? result.domains[id].strengthIndex : 50,
        color: domains.getColor(id) || '#9269f3'
      };
    });
  }

  function prepareBreakdown(els, result) {
    var dataset = buildBreakdownDataset(result);

    els.bars.innerHTML = '';
    dataset.forEach(function (d) {
      var li = document.createElement('li');
      li.style.setProperty('--accent', d.color);

      var label = document.createElement('span');
      label.className = 'bar-label';
      label.textContent = d.label;

      var track = document.createElement('span');
      track.className = 'bar-track';
      track.style.setProperty('--v', '0%');
      track.setAttribute('data-final-v', d.value + '%');

      var value = document.createElement('span');
      value.className = 'bar-value';
      value.textContent = d.domain === result.strongestDomain ? '\u2605' : '';

      li.appendChild(label);
      li.appendChild(track);
      li.appendChild(value);
      els.bars.appendChild(li);
    });

    return dataset;
  }

  function triggerBreakdown(els, result, dataset) {
    if (els.radarSvg && AurorIQ.components && AurorIQ.components.radar) {
      AurorIQ.components.radar.render(els.radarSvg, dataset);
    }

    var reduced = utils.prefersReducedMotion();
    var tracks = utils.$all('.bar-track', els.bars);

    tracks.forEach(function (track, index) {
      var finalV = track.getAttribute('data-final-v');
      if (reduced) {
        track.style.setProperty('--v', finalV);
        return;
      }
      track.style.transition = 'background ' + (650 + index * 110) + 'ms cubic-bezier(0.19, 1, 0.22, 1)';
      global.setTimeout(function () {
        track.style.setProperty('--v', finalV);
      }, 150 + index * 90);
    });
  }

  /* ── Detailed Report Builder ── */

  function getPercentileDescription(pct) {
    if (pct >= 99) return 'Your score places you in the top 1% \u2014 an exceptionally rare result.';
    if (pct >= 95) return 'You score higher than roughly ' + Math.round(pct) + '% of the general population. This is a notably high result.';
    if (pct >= 85) return 'You score higher than roughly ' + Math.round(pct) + '% of people. This indicates above-average cognitive ability.';
    if (pct >= 60) return 'You score higher than roughly ' + Math.round(pct) + '% of people. This is a solid, healthy result within the normal range.';
    if (pct >= 40) return 'You score near the middle of the distribution \u2014 squarely within the average range.';
    if (pct >= 15) return 'Your score falls in the lower portion of the normal range. This is one snapshot and may not reflect your full ability.';
    return 'Your score falls below the typical range. Environmental factors like fatigue or distraction may have played a role.';
  }

  function getStrengthInsight(domainId) {
    var map = {
      pattern: 'You excel at recognising sequences, abstract rules, and predicting what comes next \u2014 a hallmark of fluid reasoning.',
      numeric: 'Quantitative reasoning is a strong suit. You process numerical relationships efficiently.',
      verbal: 'Language and meaning come naturally to you. You parse relationships between words and ideas with precision.',
      spatial: 'You have strong spatial-visual processing \u2014 you manipulate forms and orientations in your mind effectively.',
      memory: 'Your working memory is a standout. You hold and manipulate more information in mind at once than most.'
    };
    return map[domainId] || 'This domain showed relative strength in your profile.';
  }

  function getGrowthInsight(domainId) {
    var map = {
      pattern: 'Pattern recognition can be sharpened with logic puzzles, sequence exercises, and abstract reasoning practice.',
      numeric: 'Strengthening quantitative reasoning through mental math, estimation drills, and number-pattern exercises can help.',
      verbal: 'Reading widely and practising vocabulary-in-context exercises can strengthen verbal reasoning over time.',
      spatial: 'Spatial skills respond well to mental rotation practice, 3D puzzles, and drawing or modelling activities.',
      memory: 'Working memory improves with dual-task training, chunking strategies, and deliberate recall exercises.'
    };
    return map[domainId] || 'Targeted practice in this area could yield improvement.';
  }

  function getConsistencyLabel(spread) {
    if (spread <= 6) return { text: 'Highly balanced', level: 'high' };
    if (spread <= 12) return { text: 'Moderately balanced', level: 'medium' };
    return { text: 'Specialised', level: 'low' };
  }

  function buildDetailedReport(els, result, view) {
    if (!els.reportGrid) return;
    els.reportGrid.innerHTML = '';

    var domains = AurorIQ.testEngine.domains;
    var pct = Math.round(view.percentile);
    var iq = view.displayIQ;
    var strongest = result.strongestDomain;
    var weakest = result.weakestDomain;

    // 1. Percentile Interpretation
    var card1 = makeReportCard(
      '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
      'Percentile interpretation',
      getPercentileDescription(pct),
      'Percentile: ' + pct + '%',
      true
    );
    els.reportGrid.appendChild(card1);

    // 2. Strongest Domain
    if (strongest && result.domains[strongest]) {
      var sConf = domains.get(strongest);
      var sVal = result.domains[strongest].strengthIndex;
      var card2 = makeReportCard(
        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>',
        'Primary strength: ' + (sConf ? sConf.name : strongest),
        getStrengthInsight(strongest),
        null,
        false,
        sVal
      );
      els.reportGrid.appendChild(card2);
    }

    // 3. Growth Area
    if (weakest && result.domains[weakest] && weakest !== strongest) {
      var wConf = domains.get(weakest);
      var wVal = result.domains[weakest].strengthIndex;
      var card3 = makeReportCard(
        '<path d="M22 12h-4l-3 8-4-16-3 8H4"/>',
        'Growth area: ' + (wConf ? wConf.name : weakest),
        getGrowthInsight(weakest),
        null,
        false,
        wVal
      );
      els.reportGrid.appendChild(card3);
    }

    // 4. Profile Consistency
    var values = domains.order.map(function (id) {
      return result.domains[id] ? result.domains[id].strengthIndex : 50;
    });
    var mean = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
    var variance = values.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / values.length;
    var spread = Math.sqrt(variance);
    var consistency = getConsistencyLabel(spread);

    var card4 = makeReportCard(
      '<circle cx="12" cy="12" r="9"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
      'Profile consistency',
      consistency.level === 'high'
        ? 'Your reasoning abilities are remarkably even across all five domains \u2014 no single area dominates or drags. This balanced profile is relatively uncommon.'
        : consistency.level === 'medium'
        ? 'Your profile shows moderate variation between domains. You have clear relative strengths, but no extreme gaps.'
        : 'Your profile is distinctly specialised \u2014 some domains are significantly stronger than others. This creates your unique cognitive shape.',
      consistency.text
    );
    els.reportGrid.appendChild(card4);

    // 5. Confidence & Precision
    var ci = view.confidenceInterval;
    var margin = ci.high - ci.low;
    var precisionLabel = margin <= 12 ? 'High precision' : margin <= 20 ? 'Moderate precision' : 'Broad estimate';
    var card5 = makeReportCard(
      '<path d="M12 3l8 4v6c0 5-8 8-8 8s-8-3-8-8V7z"/>',
      'Measurement precision',
      'Your 95% confidence interval spans ' + ci.low + '\u2013' + ci.high + ' (' + margin + ' points). ' +
      (margin <= 12
        ? 'This is a tight range, suggesting your responses were internally consistent.'
        : margin <= 20
        ? 'This is a reasonable range for a 25-item adaptive test.'
        : 'The wider range suggests some response inconsistency. A retest under calm conditions may sharpen the estimate.'),
      precisionLabel
    );
    els.reportGrid.appendChild(card5);

    // 6. Session Stats
    var itemCount = result.itemsAnswered || 25;
    var card6 = makeReportCard(
      '<rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M8 13l2 2 4-4"/>',
      'Session summary',
      'You answered ' + itemCount + ' adaptive questions across all five reasoning domains. ' +
      'The engine selected each question live based on your running ability estimate, maintaining maximum information yield throughout.',
      null
    );
    els.reportGrid.appendChild(card6);
  }

  function makeReportCard(iconPath, title, body, highlight, full, meterValue) {
    var card = document.createElement('div');
    card.className = 'report-card' + (full ? ' report-card--full' : '');

    var html = '';
    html += '<div class="report-card__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + iconPath + '</svg></div>';
    html += '<div class="report-card__title">' + title + '</div>';
    html += '<div class="report-card__body">' + body + '</div>';

    if (meterValue !== undefined) {
      html += '<div class="report-card__meter">';
      html += '<div class="report-card__meter-track"><div class="report-card__meter-fill" style="width:0%" data-meter-v="' + meterValue + '"></div></div>';
      html += '<span class="report-card__meter-label">' + meterValue + '%</span>';
      html += '</div>';
    }

    if (highlight) {
      html += '<div class="report-card__highlight">' + highlight + '</div>';
    }

    card.innerHTML = html;
    return card;
  }

  function triggerReportMeters() {
    var meters = utils.$all('.report-card__meter-fill');
    meters.forEach(function (el, i) {
      var v = el.getAttribute('data-meter-v');
      global.setTimeout(function () {
        el.style.width = v + '%';
      }, 200 + i * 120);
    });
  }

  /* ── Last Result Banner ── */

  function showLastResultBanner(els, result) {
    if (!els.lastResultBanner) return;
    var history = state.get('profile.history', []);
    if (history.length < 2) return; // only show if they've taken it before

    var prev = history[history.length - 2];
    if (!prev) return;

    var date = new Date(prev.completedAt);
    var dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    els.lastResultBanner.innerHTML =
      'Previous result: <strong>' + prev.displayIQ + '</strong> on ' + dateStr +
      ' · <a href="/iq-test/">Take again</a>';
    els.lastResultBanner.hidden = false;
  }

  /* ── Reveal Sequence ── */

  function runReveal(els, ctx) {
    var reduced = utils.prefersReducedMotion();
    var stageDelay = reduced ? 80 : 900;

    var view = effectiveView(ctx.result);

    preparePersonalization(els, ctx.result, view);
    prepareScore(els, ctx.result, view);
    prepareIdentity(els, ctx);
    prepareCurve(els, ctx.result, view);
    var peersShown = preparePeers(els, ctx.result, view);
    var dataset = prepareBreakdown(els, ctx.result);
    buildDetailedReport(els, ctx.result, view);
    showLastResultBanner(els, ctx.result);

    var t = 0;

    global.setTimeout(function () {
      els.stages.score.classList.add('is-visible');
      triggerScoreNumber(els, ctx.result, view);
    }, t);
    t += stageDelay + (reduced ? 0 : 500);

    global.setTimeout(function () {
      els.stages.identity.classList.add('is-visible');
    }, t);
    t += stageDelay;

    global.setTimeout(function () {
      els.stages.curve.classList.add('is-visible');
      triggerCurve(els, ctx.result, view);
    }, t);
    t += stageDelay;

    if (peersShown) {
      els.stages.peers.hidden = false;
      global.setTimeout(function () {
        els.stages.peers.classList.add('is-visible');
        triggerPeers(els, ctx.result, view);
      }, t);
      t += stageDelay;
    }

    global.setTimeout(function () {
      els.stages.breakdown.classList.add('is-visible');
      triggerBreakdown(els, ctx.result, dataset);
    }, t);
    t += stageDelay;

    global.setTimeout(function () {
      if (els.stages.report) els.stages.report.classList.add('is-visible');
      triggerReportMeters();
    }, t);
    t += stageDelay;

    global.setTimeout(function () {
      if (els.stages.personica) els.stages.personica.classList.add('is-visible');
    }, t);
    t += reduced ? 80 : 600;

    global.setTimeout(function () {
      els.stages.actions.classList.add('is-visible');
    }, t);
  }

  function init() {
    if (!utils || !state || !AurorIQ.testEngine || !AurorIQ.identity) return;

    var els = bindElements();
    if (!els.revealRoot || !els.emptyState) return;

    var result = state.get('profile.lastResult', null);

    if (!result) {
      els.emptyState.hidden = false;
      els.revealRoot.hidden = true;
      return;
    }

    els.emptyState.hidden = true;
    els.revealRoot.hidden = false;

    var archetype = AurorIQ.identity.archetypes.resolve(result);
    var tier = result.tier;

    runReveal(els, { result: result, archetype: archetype, tier: tier });

    wirePdfDownload(result, archetype, tier);
  }

  function buildPdfData(result, archetype, tier) {
    var view = effectiveView(result);
    var domains = AurorIQ.testEngine.domains;
    var rarity = AurorIQ.identity.rarity;
    var rarityShort = '';
    try {
      var combined = rarity.getCombinedRarityPercent(tier.id, archetype.id);
      rarityShort = rarity.formatRarityLabel(combined) || '';
    } catch (e) {}

    return {
      name: result.intake && result.intake.name ? result.intake.name : '',
      archetypeName: archetype.name,
      tagline: archetype.tagline,
      tierLabel: tier.label,
      score: view.displayIQ,
      bandLabel: view.bandLabel,
      percentile: view.percentile,
      rawPercentile: result.overall.percentile,
      confidenceInterval: view.confidenceInterval,
      isAgeNormed: view.isAgeNormed,
      ageGroup: view.isAgeNormed ? view.ageGroup : '',
      rarityShort: rarityShort,
      domains: result.domains,
      domainOrder: domains.order,
      domainMeta: domains
    };
  }

  function wirePdfDownload(result, archetype, tier) {
    var btn = utils.$('[data-pdf-btn]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var pdf = AurorIQ.sharing && AurorIQ.sharing.pdf;
      if (!pdf) return;

      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Preparing PDF\u2026';

      var data = buildPdfData(result, archetype, tier);
      pdf.generate(data).then(function (out) {
        var namePart = data.name ? '-' + data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
        pdf.download(out.blob, 'auroriq-result' + namePart + '.pdf');
        btn.disabled = false;
        btn.textContent = original;
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Try again';
        global.setTimeout(function () { btn.textContent = original; }, 2000);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
