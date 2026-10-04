(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.testEngine = AurorIQ.testEngine || {};

  function buildDomainTargets(domainOrder, perDomain) {
    const targets = {};
    domainOrder.forEach((d) => { targets[d] = perDomain; });
    return targets;
  }

  function createEngine() {
    const state = AurorIQ.state;
    const questions = AurorIQ.testEngine.questions;
    const domains = AurorIQ.testEngine.domains;
    const adaptive = AurorIQ.testEngine.adaptive;
    const scoring = AurorIQ.testEngine.scoring;
    const utils = AurorIQ.utils;

    function getCurrentItem() {
      const id = state.get('session.currentItemId', null);
      return id ? questions.getById(id) : null;
    }

    function start() {
      const bank = questions.all();
      const domainOrder = domains.order;
      const domainTargets = buildDomainTargets(domainOrder, questions.meta.itemsPerDomain);

      state.reset('session');

      const firstItem = adaptive.selectNextItem({
        theta: 0,
        bank: bank,
        answeredIds: [],
        domainTargets: domainTargets,
        domainOrder: domainOrder
      });

      state.set('session.testId', utils ? utils.uid('test') : String(Date.now()));
      state.set('session.phase', 'active');
      state.set('session.theta', 0);
      state.set('session.se', 1);
      state.set('session.currentIndex', 0);
      state.set('session.totalQuestions', bank.length);
      state.set('session.responses', []);
      state.set('session.startedAt', Date.now());
      state.set('session.currentItemId', firstItem ? firstItem.id : null);
      state.set('session.domain', firstItem ? firstItem.domain : null);

      state.emit('engine:start', { totalQuestions: bank.length });
      if (firstItem) {
        state.emit('engine:domain-enter', { domain: firstItem.domain, isFirst: true });
      }

      return firstItem;
    }

    function submitAnswer(optionIndex, responseTimeMs) {
      const item = getCurrentItem();
      if (!item || state.get('session.phase') !== 'active' || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= item.options.length) return null;

      const correct = optionIndex === item.answer;
      const responses = state.get('session.responses', []).slice();
      const prevTheta = state.get('session.theta', 0);
      const prevDomain = item.domain;

      responses.push({
        itemId: item.id,
        domain: item.domain,
        irt: item.irt,
        correct: correct,
        selected: optionIndex,
        rt: responseTimeMs || null,
        thetaBefore: prevTheta
      });

      const estimate = adaptive.estimateTheta(responses, 0);
      const se = adaptive.standardError(estimate.theta, responses);

      state.set('session.responses', responses);
      state.set('session.theta', estimate.theta);
      state.set('session.se', se);

      const nextIndex = state.get('session.currentIndex', 0) + 1;
      state.set('session.currentIndex', nextIndex);

      state.emit('engine:answered', {
        item: item,
        correct: correct,
        theta: estimate.theta,
        se: se,
        index: nextIndex
      });

      const bank = questions.all();
      const total = state.get('session.totalQuestions', bank.length);

      if (nextIndex >= total) {
        state.set('session.phase', 'synthesis');
        state.set('session.currentItemId', null);
        state.emit('engine:complete', { responseCount: responses.length });
        return null;
      }

      const domainOrder = domains.order;
      const domainTargets = buildDomainTargets(domainOrder, questions.meta.itemsPerDomain);
      const answeredIds = responses.map((r) => r.itemId);

      const nextItem = adaptive.selectNextItem({
        theta: estimate.theta,
        bank: bank,
        answeredIds: answeredIds,
        domainTargets: domainTargets,
        domainOrder: domainOrder
      });

      if (!nextItem) {
        state.set('session.phase', 'synthesis');
        state.set('session.currentItemId', null);
        state.emit('engine:complete', { responseCount: responses.length });
        return null;
      }

      state.set('session.currentItemId', nextItem.id);
      state.set('session.domain', nextItem.domain);

      if (nextItem.domain !== prevDomain) {
        state.emit('engine:domain-enter', { domain: nextItem.domain, isFirst: false });
      }

      return nextItem;
    }

    function getProgress() {
      const total = state.get('session.totalQuestions', questions.meta.itemCount);
      const index = state.get('session.currentIndex', 0);
      return {
        currentIndex: index,
        total: total,
        percent: total ? Math.round((index / total) * 100) : 0,
        domain: state.get('session.domain', null),
        theta: state.get('session.theta', 0),
        se: state.get('session.se', 1)
      };
    }

    function isComplete() {
      const phase = state.get('session.phase', 'idle');
      return phase === 'synthesis' || phase === 'complete';
    }

    function finish() {
      if (!isComplete()) return null;
      if (state.get('session.phase') === 'complete') return state.get('profile.lastResult', null);
      const responses = state.get('session.responses', []);
      const result = scoring.computeResult(responses, domains.order);
      if (!result) return null;

      // Attach the pre-test intake snapshot + age-normed view (v5.4).
      const intake = state.get('profile.intake', null);
      if (intake) {
        result.intake = {
          name: intake.name || '',
          age: intake.age != null ? intake.age : null,
          ageBand: intake.ageBand || '',
          gender: intake.gender || '',
          education: intake.education || ''
        };
        const ageNorms = AurorIQ.identity && AurorIQ.identity.ageNorms;
        if (ageNorms && intake.age != null) {
          const adjusted = ageNorms.adjust(result, intake);
          if (adjusted) result.ageNormed = adjusted;
        }
      }

      state.set('profile.lastResult', result);
      state.push('profile.history', {
        id: state.get('session.testId', null),
        completedAt: result.generatedAt,
        displayIQ: result.overall.displayIQ,
        tier: result.tier.id
      });
      state.set('session.phase', 'complete');

      state.emit('engine:result', result);
      return result;
    }

    function abandon() {
      state.reset('session');
      state.emit('engine:abandon', {});
    }

    /* ── Resume support (v5.4) ──
       A session persists across reloads/visits. If the user left with an
       active, partially-answered test, we can restore the exact current
       item — the adaptive path is deterministic from the stored responses,
       so nothing needs recomputing beyond re-rendering where they were. */
    function hasResumableSession() {
      const phase = state.get('session.phase', 'idle');
      const currentItemId = state.get('session.currentItemId', null);
      const responses = state.get('session.responses', []);
      const index = state.get('session.currentIndex', 0);
      const total = state.get('session.totalQuestions', questions.meta.itemCount);
      return phase === 'active' &&
        !!currentItemId &&
        !!questions.getById(currentItemId) &&
        index > 0 &&
        index < total &&
        responses.length === index;
    }

    function getResumeInfo() {
      if (!hasResumableSession()) return null;
      return {
        currentIndex: state.get('session.currentIndex', 0),
        total: state.get('session.totalQuestions', questions.meta.itemCount),
        startedAt: state.get('session.startedAt', null),
        domain: state.get('session.domain', null)
      };
    }

    function resume() {
      if (!hasResumableSession()) return null;
      const item = getCurrentItem();
      if (!item) return null;
      state.emit('engine:resume', {
        index: state.get('session.currentIndex', 0),
        total: state.get('session.totalQuestions', questions.meta.itemCount)
      });
      return item;
    }

    return {
      start: start,
      getCurrentItem: getCurrentItem,
      submitAnswer: submitAnswer,
      getProgress: getProgress,
      isComplete: isComplete,
      finish: finish,
      abandon: abandon,
      hasResumableSession: hasResumableSession,
      getResumeInfo: getResumeInfo,
      resume: resume
    };
  }

  AurorIQ.testEngine.engine = createEngine();

})(window);
