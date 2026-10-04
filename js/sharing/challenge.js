(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.sharing = AurorIQ.sharing || {};

  const STYLE_ID = 'aiq-h2h-style';

  const STYLE = '' +
    '.head-to-head{display:flex;align-items:center;justify-content:center;gap:1.25rem;max-width:28rem;margin:0 auto;}' +
    '.head-to-head__side{flex:1;display:flex;flex-direction:column;align-items:center;gap:0.4rem;padding:1.25rem 0.75rem;background:var(--color-surface-2,#161625);border:1px solid var(--color-border,rgba(255,255,255,0.07));border-radius:1rem;}' +
    '.head-to-head__side--you{border-color:var(--color-border-primary,rgba(124,58,237,0.35));box-shadow:var(--glow-ambient-primary,none);}' +
    '.head-to-head__label{font-family:var(--font-mono,monospace);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.09em;color:var(--color-text-muted,#6b6685);}' +
    '.head-to-head__archetype{font-family:var(--font-display,sans-serif);font-size:1rem;font-weight:700;color:var(--color-text-primary,#fff);text-align:center;}' +
    '.head-to-head__score{font-family:var(--font-display,sans-serif);font-size:2.25rem;font-weight:800;background:var(--gradient-aurora,linear-gradient(90deg,#9269f3,#22d3ee));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}' +
    '.head-to-head__vs{font-family:var(--font-mono,monospace);font-size:0.8rem;font-weight:700;color:var(--color-text-disabled,#3d3a52);flex-shrink:0;}' +
    '.head-to-head__verdict{max-width:30rem;margin:1.5rem auto 0;font-size:1.05rem;color:var(--color-text-primary,#fff);text-align:center;line-height:1.5;}' +
    '.head-to-head__actions{display:flex;justify-content:center;margin-top:1.5rem;}';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function decodeToken(token) {
    try {
      const json = decodeURIComponent(global.atob(token));
      const payload = JSON.parse(json);
      if (Number.isFinite(payload.s) && payload.s >= 40 && payload.s <= 160 && typeof payload.a === 'string' && payload.a.length <= 64 && typeof payload.t === 'string' && payload.t.length <= 64) return payload;
    } catch (e) {}
    return null;
  }

  function captureFromUrl() {
    const utils = AurorIQ.utils;
    const state = AurorIQ.state;
    if (!utils || !state) return;

    const token = utils.qsParam('c');
    if (!token) return;

    const payload = decodeToken(token);
    if (!payload) return;

    state.set('profile.pendingChallenge', {
      score: payload.s,
      archetypeId: payload.a,
      tierId: payload.t,
      capturedAt: Date.now()
    });
  }

  function buildVerdict(yourScore, theirScore, yourArchetypeName, theirArchetypeName) {
    const diff = yourScore - theirScore;
    if (diff > 0) {
      return 'You beat them by ' + diff + ' point' + (diff === 1 ? '' : 's') + '. Send them a rematch?';
    }
    if (diff < 0) {
      return 'They edged ahead by ' + Math.abs(diff) + ' point' + (Math.abs(diff) === 1 ? '' : 's') + ', but you\u2019re a different kind of mind: ' + yourArchetypeName + ' vs ' + theirArchetypeName + '.';
    }
    return 'Dead even. Two minds, one score.';
  }

  function recordOutcome(state, diff) {
    if (diff > 0) {
      const wins = state.get('profile.challenges.wins', 0);
      state.update('profile.challenges', { wins: wins + 1 });
    } else if (diff < 0) {
      const losses = state.get('profile.challenges.losses', 0);
      state.update('profile.challenges', { losses: losses + 1 });
    }
  }

  function buildStage(yourArchetypeName, yourScore, theirArchetypeName, theirScore, verdict) {
    const section = document.createElement('section');
    section.className = 'reveal-stage reveal-stage--challenge';
    section.setAttribute('data-stage', 'challenge-result');

    section.innerHTML =
      '<h2 class="reveal-heading">Head to head</h2>' +
      '<div class="head-to-head">' +
        '<div class="head-to-head__side">' +
          '<p class="head-to-head__label">Them</p>' +
          '<p class="head-to-head__archetype">' + theirArchetypeName + '</p>' +
          '<p class="head-to-head__score">' + theirScore + '</p>' +
        '</div>' +
        '<span class="head-to-head__vs">VS</span>' +
        '<div class="head-to-head__side head-to-head__side--you">' +
          '<p class="head-to-head__label">You</p>' +
          '<p class="head-to-head__archetype">' + yourArchetypeName + '</p>' +
          '<p class="head-to-head__score">' + yourScore + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="head-to-head__verdict">' + verdict + '</p>' +
      '<div class="head-to-head__actions">' +
        '<button type="button" class="btn btn--primary btn--lg" data-action="challenge">Send a rematch</button>' +
      '</div>';

    return section;
  }

  function renderHeadToHead() {
    const utils = AurorIQ.utils;
    const state = AurorIQ.state;
    if (!utils || !state || !AurorIQ.identity) return;

    const revealRoot = utils.$('[data-reveal-root]');
    const actionsStage = utils.$('[data-stage="actions"]');
    if (!revealRoot || !actionsStage || revealRoot.hidden) return;

    const pending = state.get('profile.pendingChallenge', null);
    const result = state.get('profile.lastResult', null);
    if (!pending || !result) return;

    injectStyle();

    const yourArchetype = AurorIQ.identity.archetypes.resolve(result);
    const theirArchetype = AurorIQ.identity.archetypes.getById(pending.archetypeId);
    const theirArchetypeName = theirArchetype ? theirArchetype.name : 'Challenger';

    const yourScore = result.overall.displayIQ;
    const theirScore = pending.score;
    const diff = yourScore - theirScore;

    const verdict = buildVerdict(yourScore, theirScore, yourArchetype.name, theirArchetypeName);
    const stage = buildStage(yourArchetype.name, yourScore, theirArchetypeName, theirScore, verdict);

    actionsStage.insertAdjacentElement('afterend', stage);
    requestAnimationFrame(() => {
      global.setTimeout(() => stage.classList.add('is-visible'), 200);
    });

    recordOutcome(state, diff);
    state.set('profile.pendingChallenge', null);
  }

  function init() {
    captureFromUrl();

    if (document.querySelector('[data-reveal-root]')) {
      const utils = AurorIQ.utils;
      if (utils) {
        global.setTimeout(renderHeadToHead, 4200);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  AurorIQ.sharing.challenge = {
    decodeToken: decodeToken,
    captureFromUrl: captureFromUrl,
    renderHeadToHead: renderHeadToHead
  };

})(window, document);
