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
        ecosystem: utils.$('[data-stage="ecosystem"]'),
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
    els.ci.textContent = 'Model-based 95% range: ' + ci.low + '\u2013' + ci.high;
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
    els.rarity.textContent = 'Descriptive archetype · not a validated personality type';
  }

  function prepareCurve(els, result, view) {
    var pct = Math.round(view.percentile);
    els.curveCaption.textContent = 'Position on the assumed model curve: ' + pct + 'th percentile. This is not an observed rank among test-takers.';
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
    // Population and age comparisons need representative norms, which are not available.
    if (els.stages.peers) els.stages.peers.hidden = true;
    return false;
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

  function buildDetailedReport(els, result, view) {
    if (!els.reportGrid) return;
    els.reportGrid.innerHTML = '';
    if (AurorIQ.reports) AurorIQ.reports.render('iq', result, els.reportGrid);
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
      if (els.stages.ecosystem) els.stages.ecosystem.classList.add('is-visible');
    }, t);
    t += reduced ? 80 : 500;

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
