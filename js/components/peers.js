(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.components = AurorIQ.components || {};

  const WIDTH = 600;
  const PAD_LEFT = 10;
  const PAD_RIGHT = 10;
  const BASELINE_Y = 150;
  const PEAK_Y = 20;
  const THETA_MIN = -4;
  const THETA_MAX = 4;
  const SAMPLES = 120;

  function pdf(theta) {
    return Math.exp(-0.5 * theta * theta) / Math.sqrt(2 * Math.PI);
  }

  function mapX(theta) {
    const usable = WIDTH - PAD_LEFT - PAD_RIGHT;
    const t = Math.min(Math.max(theta, THETA_MIN), THETA_MAX);
    return PAD_LEFT + ((t - THETA_MIN) / (THETA_MAX - THETA_MIN)) * usable;
  }

  function mapY(theta) {
    const scale = (BASELINE_Y - PEAK_Y) / pdf(0);
    return BASELINE_Y - pdf(theta) * scale;
  }

  function curvePath() {
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const theta = THETA_MIN + (THETA_MAX - THETA_MIN) * (i / SAMPLES);
      pts.push([mapX(theta), mapY(theta)]);
    }
    return 'M ' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L ');
  }

  /* Render two markers on one shared distribution:
     - "everyone": raw theta vs the young-adult reference
     - "peers": age-adjusted theta vs same-age group
     When there's no age view, only the single marker is drawn. */
  function render(svgEl, opts) {
    if (!svgEl) return;
    const utils = AurorIQ.utils;
    const reduced = utils ? utils.prefersReducedMotion() : false;

    const line = svgEl.querySelector('[data-peers-line]');
    const everyoneG = svgEl.querySelector('[data-peers-everyone]');
    const peersG = svgEl.querySelector('[data-peers-peers]');
    if (!line) return;

    line.setAttribute('d', curvePath());

    function placeMarker(g, theta) {
      if (!g) return;
      const x = mapX(theta);
      const y = mapY(theta);
      const dot = g.querySelector('circle');
      const stem = g.querySelector('line');
      if (dot) { dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1)); }
      if (stem) {
        stem.setAttribute('x1', x.toFixed(1));
        stem.setAttribute('x2', x.toFixed(1));
        stem.setAttribute('y1', y.toFixed(1));
        stem.setAttribute('y2', String(BASELINE_Y + 6));
      }
    }

    placeMarker(everyoneG, opts.everyoneTheta);

    if (opts.hasPeers && peersG) {
      peersG.hidden = false;
      placeMarker(peersG, opts.peersTheta);
    } else if (peersG) {
      peersG.hidden = true;
    }

    if (reduced || typeof line.getTotalLength !== 'function') {
      if (everyoneG) everyoneG.style.opacity = '1';
      if (peersG && opts.hasPeers) peersG.style.opacity = '1';
      return;
    }

    let length = 1000;
    try { length = line.getTotalLength(); } catch (e) {}
    line.style.strokeDasharray = String(length);
    line.style.strokeDashoffset = String(length);
    if (everyoneG) everyoneG.style.opacity = '0';
    if (peersG) peersG.style.opacity = '0';

    requestAnimationFrame(() => {
      line.style.transition = 'stroke-dashoffset 1200ms cubic-bezier(0.19,1,0.22,1)';
      line.style.strokeDashoffset = '0';
      global.setTimeout(() => {
        if (everyoneG) { everyoneG.style.transition = 'opacity 400ms ease'; everyoneG.style.opacity = '1'; }
      }, 900);
      global.setTimeout(() => {
        if (peersG && opts.hasPeers) { peersG.style.transition = 'opacity 400ms ease'; peersG.style.opacity = '1'; }
      }, 1250);
    });
  }

  AurorIQ.components.peers = { render: render };

})(window, document);
