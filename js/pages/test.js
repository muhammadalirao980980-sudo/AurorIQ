(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  const utils = AurorIQ.utils;
  const state = AurorIQ.state;
  const engine = AurorIQ.testEngine && AurorIQ.testEngine.engine;
  const domains = AurorIQ.testEngine && AurorIQ.testEngine.domains;

  let questionStartTime = 0;
  let accepting = false;

  function bindElements() {
    return {
      screens: {
        intro: utils.$('[data-screen="intro"]'),
        intake: utils.$('[data-screen="intake"]'),
        test: utils.$('[data-screen="test"]'),
        synthesis: utils.$('[data-screen="synthesis"]')
      },
      toIntakeBtn: utils.$('[data-action="to-intake"]'),
      intakeForm: utils.$('[data-intake-form]'),
      startBtn: utils.$('[data-action="start"]'),
      skipIntakeBtn: utils.$('[data-action="skip-intake"]'),
      resumeBanner: utils.$('[data-resume-banner]'),
      resumeMeta: utils.$('[data-resume-meta]'),
      resumeBtn: utils.$('[data-action="resume"]'),
      discardResumeBtn: utils.$('[data-action="discard-resume"]'),
      progressCount: utils.$('[data-progress-count]'),
      domainChip: utils.$('[data-domain-chip]'),
      progressFill: utils.$('[data-progress-fill]'),
      progressBar: utils.$('[data-progress-bar]'),
      sequenceEl: utils.$('[data-sequence]'),
      promptEl: utils.$('[data-prompt]'),
      optionsEl: utils.$('[data-options]'),
      transitionEl: utils.$('[data-domain-transition]'),
      transitionNameEl: utils.$('[data-transition-name]'),
      synthesisSteps: utils.$all('[data-synthesis-steps] [data-step]')
    };
  }

  function showScreen(els, name) {
    Object.keys(els.screens).forEach((key) => {
      const el = els.screens[key];
      if (el) el.hidden = key !== name;
    });
  }

  function updateProgress(els) {
    const progress = engine.getProgress();
    const displayIndex = Math.min(progress.currentIndex + 1, progress.total);
    els.progressCount.textContent = 'Question ' + displayIndex + ' of ' + progress.total;
    els.progressFill.style.setProperty('--p', progress.percent + '%');
    els.progressBar.setAttribute('aria-valuenow', String(progress.percent));
    if (progress.domain) {
      const d = domains.get(progress.domain);
      els.domainChip.textContent = d ? d.name : progress.domain;
    }
  }

  function renderOptions(els, item, onSelect) {
    els.optionsEl.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    item.options.forEach((optionText, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'question__option';
      btn.setAttribute('data-index', String(index));

      const key = document.createElement('span');
      key.className = 'question__option-key';
      key.textContent = letters[index] || String(index + 1);

      const text = document.createElement('span');
      text.className = 'question__option-text';
      text.textContent = optionText;

      btn.appendChild(key);
      btn.appendChild(text);
      btn.addEventListener('click', () => onSelect(index, btn));
      els.optionsEl.appendChild(btn);
    });
  }

  function showRecallScreen(els, item, onSelect) {
    els.promptEl.textContent = item.prompt;
    renderOptions(els, item, onSelect);
    els.sequenceEl.hidden = true;
    els.sequenceEl.innerHTML = '';
    accepting = true;
    questionStartTime = performance.now();
  }

  function showSequenceThenRecall(els, item, onSelect) {
    accepting = false;
    els.promptEl.textContent = '';
    els.optionsEl.innerHTML = '';
    els.sequenceEl.hidden = false;
    els.sequenceEl.innerHTML = '';

    item.sequence.forEach((char, index) => {
      const span = document.createElement('span');
      span.className = 'question__sequence-item';
      span.style.animationDelay = (index * 160) + 'ms';
      span.textContent = char;
      els.sequenceEl.appendChild(span);
    });

    const displayTime = 900 + item.sequence.length * 650;
    global.setTimeout(() => {
      showRecallScreen(els, item, onSelect);
    }, displayTime);
  }

  function renderQuestion(els, item, onSelect) {
    updateProgress(els);
    if (item.type === 'span-recall' && item.sequence) {
      showSequenceThenRecall(els, item, onSelect);
    } else {
      showRecallScreen(els, item, onSelect);
    }
  }

  function showDomainTransition(els, domainId) {
    const d = domains.get(domainId);
    els.transitionNameEl.textContent = d ? d.name : domainId;
    els.transitionEl.hidden = false;
    global.setTimeout(() => {
      els.transitionEl.hidden = true;
    }, 1600);
  }

  function runSynthesis(els) {
    showScreen(els, 'synthesis');
    els.synthesisSteps.forEach((li) => li.classList.remove('is-active', 'is-done'));

    let i = 0;
    const stepDelay = 650;

    function activateNext() {
      if (i > 0) {
        els.synthesisSteps[i - 1].classList.remove('is-active');
        els.synthesisSteps[i - 1].classList.add('is-done');
      }
      if (i >= els.synthesisSteps.length) {
        global.setTimeout(finishAndRedirect, 500);
        return;
      }
      els.synthesisSteps[i].classList.add('is-active');
      i++;
      global.setTimeout(activateNext, stepDelay);
    }

    activateNext();
  }

  function finishAndRedirect() {
    const result = engine.finish();
    if (result) {
      global.location.href = '/iq-test/results/';
    } else {
      global.location.href = '/iq-test/';
    }
  }

  function init() {
    if (!utils || !engine || !domains) return;

    const els = bindElements();
    if (!els.screens.intro || !els.screens.test || !els.screens.synthesis) return;

    function onSelect(index, btnEl) {
      if (!accepting) return;
      accepting = false;

      const buttons = utils.$all('.question__option', els.optionsEl);
      buttons.forEach((b) => { b.disabled = true; });
      btnEl.classList.add('is-selected');

      const rt = Math.round(performance.now() - questionStartTime);

      global.setTimeout(() => {
        const nextItem = engine.submitAnswer(index, rt);
        if (nextItem) {
          renderQuestion(els, nextItem, onSelect);
        } else {
          runSynthesis(els);
        }
      }, 360);
    }

    if (state) {
      state.on('engine:domain-enter', (payload) => {
        if (payload && !payload.isFirst) showDomainTransition(els, payload.domain);
      });
    }

    const intake = AurorIQ.intake;

    function beginTest() {
      showScreen(els, 'test');
      const firstItem = engine.start();
      if (firstItem) renderQuestion(els, firstItem, onSelect);
    }

    function resumeTest() {
      const item = engine.resume();
      if (!item) { beginTest(); return; }
      showScreen(els, 'test');
      renderQuestion(els, item, onSelect);
    }

    function formatResumeMeta(info) {
      let s = 'Question ' + (info.currentIndex + 1) + ' of ' + info.total;
      if (info.startedAt) {
        const days = Math.floor((Date.now() - info.startedAt) / 86400000);
        if (days >= 1) s += ' \u00b7 started ' + (days === 1 ? 'yesterday' : days + ' days ago');
      }
      return s;
    }

    // Resume banner: offer to continue an in-progress test (v5.4).
    let resumeInfo = engine.hasResumableSession ? engine.getResumeInfo() : null;
    if (resumeInfo && els.resumeBanner) {
      if (els.resumeMeta) els.resumeMeta.textContent = formatResumeMeta(resumeInfo);
      els.resumeBanner.hidden = false;
    }

    if (els.resumeBtn) {
      els.resumeBtn.addEventListener('click', resumeTest);
    }
    if (els.discardResumeBtn) {
      els.discardResumeBtn.addEventListener('click', () => {
        engine.abandon();
        if (els.resumeBanner) els.resumeBanner.hidden = true;
      });
    }

    // Step 1: intro "Begin" -> intake (or straight to test if intake screen absent)
    if (els.toIntakeBtn) {
      els.toIntakeBtn.addEventListener('click', () => {
        if (els.screens.intake) {
          showScreen(els, 'intake');
          if (intake && intake.init) intake.init();
          const firstField = els.screens.intake.querySelector('[data-intake-name]');
          if (firstField) firstField.focus();
        } else {
          beginTest();
        }
      });
    }

    // Step 2a: intake submit -> save profile, start test
    if (els.intakeForm) {
      els.intakeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (intake && intake.commit) intake.commit();
        beginTest();
      });
    }

    // Step 2b: skip -> save blank profile, start test
    if (els.skipIntakeBtn) {
      els.skipIntakeBtn.addEventListener('click', () => {
        if (intake && intake.commit) intake.commit({ skip: true });
        beginTest();
      });
    }

    // Back-compat: if any legacy [data-action="start"] outside the form exists.
    if (els.startBtn && (!els.intakeForm || !els.intakeForm.contains(els.startBtn))) {
      els.startBtn.addEventListener('click', beginTest);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
