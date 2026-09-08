(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  const utils = AurorIQ.utils;

  function initScorePreviewReveal() {
    const card = utils.$('.score-preview');
    if (!card || !utils) return;

    const numEl = utils.$('.score-preview__num', card);
    const bars = utils.$all('.score-preview__bars i', card);
    let played = false;

    function play() {
      if (played) return;
      played = true;

      if (numEl) {
        const target = parseInt(numEl.textContent, 10) || 0;
        utils.animateValue({
          from: 0,
          to: target,
          duration: 1300,
          onUpdate: (v) => {
            numEl.textContent = Math.round(v);
          }
        });
      }

      const reduced = utils.prefersReducedMotion();

      bars.forEach((bar, index) => {
        const finalValue = bar.style.getPropertyValue('--v');
        if (reduced) {
          bar.style.setProperty('--v', finalValue);
          return;
        }
        bar.style.setProperty('--v', '0%');
        bar.style.transition = 'background ' + (650 + index * 110) + 'ms cubic-bezier(0.19, 1, 0.22, 1)';
        global.setTimeout(() => {
          bar.style.setProperty('--v', finalValue);
        }, 400 + index * 90);
      });
    }

    utils.onIntersect(card, play, { threshold: 0.4 });
  }

  function initFeatureTileStagger() {
    const tiles = utils.$all('.bento .tile');
    tiles.forEach((tile, index) => {
      tile.setAttribute('data-reveal', '');
      tile.style.setProperty('--reveal-delay', Math.min(index, 5) * 70 + 'ms');
    });
  }

  function init() {
    if (!utils) return;
    initScorePreviewReveal();
    initFeatureTileStagger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
