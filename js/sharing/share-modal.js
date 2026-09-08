(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.sharing = AurorIQ.sharing || {};

  const STYLE_ID = 'aiq-share-modal-style';

  const STYLE = '' +
    '.aiq-modal{position:fixed;inset:0;z-index:var(--z-modal,1000);display:flex;align-items:center;justify-content:center;padding:1.25rem;opacity:0;pointer-events:none;transition:opacity 220ms ease;}' +
    '.aiq-modal.is-open{opacity:1;pointer-events:auto;}' +
    '.aiq-modal__backdrop{position:absolute;inset:0;background:rgba(8,8,15,0.82);backdrop-filter:blur(6px);}' +
    '.aiq-modal__panel{position:relative;width:100%;max-width:26rem;max-height:90vh;overflow-y:auto;background:var(--color-surface,#0f0f1a);border:1px solid var(--color-border-medium,rgba(255,255,255,0.12));border-radius:1.25rem;padding:1.5rem;box-shadow:0 24px 64px rgba(0,0,0,0.6);transform:translateY(12px) scale(0.98);transition:transform 260ms cubic-bezier(0.19,1,0.22,1);}' +
    '.aiq-modal.is-open .aiq-modal__panel{transform:translateY(0) scale(1);}' +
    '.aiq-modal__close{position:absolute;top:0.9rem;right:0.9rem;width:2.25rem;height:2.25rem;border-radius:9999px;background:var(--color-surface-2,#161625);color:var(--color-text-secondary,#a8a4c0);font-size:1.1rem;line-height:1;display:flex;align-items:center;justify-content:center;}' +
    '.aiq-modal__title{font-family:var(--font-display,sans-serif);font-size:1.15rem;font-weight:700;color:var(--color-text-primary,#fff);margin-bottom:1rem;padding-right:2rem;}' +
    '.aiq-modal__preview{width:100%;display:flex;justify-content:center;margin-bottom:1.25rem;border-radius:0.75rem;overflow:hidden;background:var(--color-surface-2,#161625);min-height:200px;align-items:center;}' +
    '.aiq-modal__preview img{width:100%;max-width:220px;height:auto;display:block;}' +
    '.aiq-modal__loading{color:var(--color-text-muted,#6b6685);font-size:0.85rem;font-family:var(--font-mono,monospace);}' +
    '.aiq-modal__channels{display:grid;grid-template-columns:repeat(2,1fr);gap:0.65rem;}' +
    '.aiq-modal__channel{display:flex;align-items:center;justify-content:center;gap:0.5rem;min-height:3rem;border-radius:0.75rem;background:var(--color-surface-2,#161625);border:1px solid var(--color-border,rgba(255,255,255,0.07));color:var(--color-text-primary,#fff);font-size:0.875rem;font-weight:600;transition:background-color 160ms ease,border-color 160ms ease;}' +
    '.aiq-modal__channel:hover{background:var(--color-surface-3,#1e1e30);border-color:var(--color-border-medium,rgba(255,255,255,0.12));}' +
    '.aiq-modal__channel--wide{grid-column:1 / -1;background:var(--gradient-primary,linear-gradient(135deg,#3b82f6,#06b6d4));border:none;color:#fff;}' +
    '.aiq-modal__hint{margin-top:0.9rem;font-size:0.75rem;color:var(--color-text-disabled,#3d3a52);text-align:center;}';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function buildModal() {
    const overlay = document.createElement('div');
    overlay.className = 'aiq-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Share your result');
    overlay.hidden = true;

    overlay.innerHTML =
      '<div class="aiq-modal__backdrop" data-modal-backdrop></div>' +
      '<div class="aiq-modal__panel">' +
        '<button type="button" class="aiq-modal__close" data-modal-close aria-label="Close">&times;</button>' +
        '<p class="aiq-modal__title" data-modal-title>Share your result</p>' +
        '<div class="aiq-modal__preview" data-modal-preview><span class="aiq-modal__loading">Rendering your card&hellip;</span></div>' +
        '<div class="aiq-modal__channels" data-modal-channels></div>' +
        '<p class="aiq-modal__hint">Your card image is generated in your browser. Nothing is uploaded.</p>' +
      '</div>';

    document.body.appendChild(overlay);
    return overlay;
  }

  function getModal() {
    let modal = document.querySelector('.aiq-modal');
    if (!modal) modal = buildModal();
    return modal;
  }

  let releaseFocusTrap = null;
  let lastTrigger = null;

  function openModal(triggerEl) {
    const utils = AurorIQ.utils;
    const modal = getModal();
    lastTrigger = triggerEl || null;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    if (utils) releaseFocusTrap = utils.trapFocus(modal);

    const backdrop = modal.querySelector('[data-modal-backdrop]');
    const closeBtn = modal.querySelector('[data-modal-close]');
    backdrop.onclick = closeModal;
    closeBtn.onclick = closeModal;

    return modal;
  }

  function closeModal() {
    const modal = document.querySelector('.aiq-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    global.setTimeout(() => { modal.hidden = true; }, 220);
    if (lastTrigger) lastTrigger.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.aiq-modal');
      if (modal && !modal.hidden) closeModal();
    }
  }

  function buildChallengeToken(result, archetype, tier) {
    const payload = { s: result.overall.displayIQ, a: archetype.id, t: tier.id };
    try {
      return global.btoa(encodeURIComponent(JSON.stringify(payload))).replace(/=+$/, '');
    } catch (e) {
      return '';
    }
  }

  function gatherShareContext() {
    const state = AurorIQ.state;
    const result = state ? state.get('profile.lastResult', null) : null;
    if (!result) return null;

    const archetype = AurorIQ.identity.archetypes.resolve(result);
    const tier = result.tier;
    const rarity = AurorIQ.identity.rarity;
    const combined = rarity.getCombinedRarityPercent(tier.id, archetype.id);
    const rarityLabel = rarity.formatRarityLabel(combined);

    // v5.4: prefer the age-normed headline when available.
    const aged = result.ageNormed && result.ageNormed.applied ? result.ageNormed : null;
    const headlineScore = aged ? aged.displayIQ : result.overall.displayIQ;
    const headlineBand = aged ? aged.bandLabel : result.overall.bandLabel;
    const headlinePct = aged ? aged.percentile : result.overall.percentile;
    const name = result.intake && result.intake.name ? result.intake.name : '';

    return {
      result: result,
      archetype: archetype,
      tier: tier,
      cardData: {
        archetypeName: archetype.name,
        tagline: archetype.tagline,
        tierLabel: tier.label,
        score: headlineScore,
        bandLabel: headlineBand,
        percentile: headlinePct,
        rarityLabel: rarityLabel ? rarityLabel + ' of test-takers' : '',
        name: name,
        ageGroup: aged ? aged.ageGroup : '',
        isAgeNormed: !!aged
      }
    };
  }

  function buildShareText(ctx) {
    return "I'm a " + ctx.archetype.name + ' on AurorIQ (' + ctx.result.overall.displayIQ + ') \u2014 ' + ctx.tier.label + ' tier.';
  }

  function renderChannels(modal, ctx, variant, cardResult) {
    var utils = AurorIQ.utils;
    var container = modal.querySelector('[data-modal-channels]');
    container.innerHTML = '';

    var baseUrl = global.location.origin;
    var shareUrl = baseUrl + '/iq-test/';
    if (variant === 'challenge') {
      var token = buildChallengeToken(ctx.result, ctx.archetype, ctx.tier);
      shareUrl = baseUrl + '/iq-test/?c=' + token;
    }

    var text = buildShareText(ctx);

    function addButton(label, wide, onClick) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'aiq-modal__channel' + (wide ? ' aiq-modal__channel--wide' : '');
      btn.textContent = label;
      btn.addEventListener('click', onClick);
      container.appendChild(btn);
      return btn;
    }

    if (utils && utils.canNativeShare()) {
      addButton('Share', true, async function () {
        var shareData = { title: 'AurorIQ', text: text, url: shareUrl };
        try {
          if (cardResult && cardResult.blob && navigator.canShare && navigator.canShare({ files: [new File([cardResult.blob], 'auroriq.png', { type: 'image/png' })] })) {
            shareData.files = [new File([cardResult.blob], 'auroriq.png', { type: 'image/png' })];
          }
        } catch (e) {}
        await utils.nativeShare(shareData);
      });
    }

    addButton('WhatsApp', false, function () {
      var url = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + shareUrl);
      global.open(url, '_blank', 'noopener');
    });

    addButton('X', false, function () {
      var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(shareUrl);
      global.open(url, '_blank', 'noopener');
    });

    addButton('Facebook', false, function () {
      var url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl) + '&quote=' + encodeURIComponent(text);
      global.open(url, '_blank', 'noopener,width=600,height=400');
    });

    addButton('LinkedIn', false, function () {
      var url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(shareUrl);
      global.open(url, '_blank', 'noopener,width=600,height=400');
    });

    addButton('Reddit', false, function () {
      var url = 'https://www.reddit.com/submit?url=' + encodeURIComponent(shareUrl) + '&title=' + encodeURIComponent(text);
      global.open(url, '_blank', 'noopener');
    });

    addButton('Telegram', false, function () {
      var url = 'https://t.me/share/url?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(text);
      global.open(url, '_blank', 'noopener');
    });

    addButton('Email', false, function () {
      var subject = encodeURIComponent("My AurorIQ Result \u2014 " + ctx.archetype.name);
      var body = encodeURIComponent(text + "\n\nTake the test yourself: " + shareUrl);
      global.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    });

    var copyBtn = addButton('Copy link', false, async function () {
      var ok = utils ? await utils.copyToClipboard(shareUrl) : false;
      copyBtn.textContent = ok ? 'Copied!' : 'Copy link';
      global.setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 1800);
    });

    addButton('Download image', false, function () {
      if (!cardResult) return;
      var a = document.createElement('a');
      a.href = cardResult.dataUrl;
      a.download = 'auroriq-' + variant + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  async function open(variant, triggerEl) {
    injectStyle();
    const ctx = gatherShareContext();
    const modal = openModal(triggerEl);
    const titleEl = modal.querySelector('[data-modal-title]');
    const previewEl = modal.querySelector('[data-modal-preview]');

    titleEl.textContent = variant === 'challenge' ? 'Challenge a friend' : 'Share your result';
    previewEl.innerHTML = '<span class="aiq-modal__loading">Rendering your card&hellip;</span>';
    modal.querySelector('[data-modal-channels]').innerHTML = '';

    if (!ctx) {
      previewEl.innerHTML = '<span class="aiq-modal__loading">Take the assessment first.</span>';
      return;
    }

    const cards = AurorIQ.sharing.cards;
    let cardResult = null;

    if (cards) {
      try {
        cardResult = await cards.generate(variant === 'challenge' ? 'challenge' : 'identity', ctx.cardData);
      } catch (e) {}
    }

    if (cardResult) {
      const img = document.createElement('img');
      img.src = cardResult.dataUrl;
      img.alt = 'Your AurorIQ share card';
      previewEl.innerHTML = '';
      previewEl.appendChild(img);
    } else {
      previewEl.innerHTML = '<span class="aiq-modal__loading">Preview unavailable</span>';
    }

    renderChannels(modal, ctx, variant, cardResult);
  }

  function init() {
    const utils = AurorIQ.utils;
    if (!utils) return;

    document.addEventListener('keydown', onKeydown);

    utils.on(document, 'click', (e) => {
      const shareBtn = e.target.closest('[data-action="share"]');
      const challengeBtn = e.target.closest('[data-action="challenge"]');
      if (shareBtn) open('identity', shareBtn);
      if (challengeBtn) open('challenge', challengeBtn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  AurorIQ.sharing.modal = {
    open: open,
    close: closeModal,
    buildChallengeToken: buildChallengeToken
  };

})(window, document);
