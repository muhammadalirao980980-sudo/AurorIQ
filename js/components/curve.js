(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.components = AurorIQ.components || {};

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const WIDTH = 600;
  const PAD_LEFT = 10;
  const PAD_RIGHT = 10;
  const BASELINE_Y = 195;
  const PEAK_Y = 18;
  const THETA_MIN = -4;
  const THETA_MAX = 4;
  const SAMPLES = 120;
  const GRADIENT_ID = 'curveFillGradient';

  function pdf(theta) {
    return Math.exp(-0.5 * theta * theta) / Math.sqrt(2 * Math.PI);
  }

  function buildPaths(userTheta) {
    const usableWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
    const scale = (BASELINE_Y - PEAK_Y) / pdf(0);

    function mapX(theta) {
      return PAD_LEFT + ((theta - THETA_MIN) / (THETA_MAX - THETA_MIN)) * usableWidth;
    }

    function mapY(theta) {
      return BASELINE_Y - pdf(theta) * scale;
    }

    const points = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const theta = THETA_MIN + (THETA_MAX - THETA_MIN) * (i / SAMPLES);
      points.push([mapX(theta), mapY(theta)]);
    }

    const linePath = 'M ' + points.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' L ');

    const clampedTheta = Math.min(Math.max(userTheta, THETA_MIN), THETA_MAX);
    const userX = mapX(clampedTheta);
    const userY = mapY(clampedTheta);
    const fillPoints = points.filter((p) => p[0] <= userX);

    const fillPath = 'M ' + PAD_LEFT + ',' + BASELINE_Y + ' L ' +
      fillPoints.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' L ') +
      ' L ' + userX.toFixed(2) + ',' + userY.toFixed(2) +
      ' L ' + userX.toFixed(2) + ',' + BASELINE_Y + ' Z';

    return {
      linePath: linePath,
      fillPath: fillPath,
      markerX: userX,
      markerY: userY,
      baselineY: BASELINE_Y
    };
  }

  function ensureGradientDefs(svgEl) {
    if (svgEl.querySelector('#' + GRADIENT_ID)) return;

    const defs = document.createElementNS(SVG_NS, 'defs');
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    gradient.setAttribute('id', GRADIENT_ID);
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('x2', '1');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('y2', '0');

    const stops = [
      { offset: '0%', color: '#7c3aed' },
      { offset: '55%', color: '#06b6d4' },
      { offset: '100%', color: '#fde68a' }
    ];

    stops.forEach((s) => {
      const stop = document.createElementNS(SVG_NS, 'stop');
      stop.setAttribute('offset', s.offset);
      stop.setAttribute('stop-color', s.color);
      gradient.appendChild(stop);
    });

    defs.appendChild(gradient);
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  function render(svgEl, theta) {
    if (!svgEl) return;
    const utils = AurorIQ.utils;

    ensureGradientDefs(svgEl);

    const lineEl = svgEl.querySelector('[data-curve-line]');
    const fillEl = svgEl.querySelector('[data-curve-fill]');
    const markerLineEl = svgEl.querySelector('[data-curve-marker-line]');
    const markerEl = svgEl.querySelector('[data-curve-marker]');
    if (!lineEl || !fillEl || !markerEl) return;

    const paths = buildPaths(theta);

    lineEl.setAttribute('d', paths.linePath);
    fillEl.setAttribute('d', paths.fillPath);
    markerEl.setAttribute('cx', paths.markerX.toFixed(2));
    markerEl.setAttribute('cy', paths.markerY.toFixed(2));

    if (markerLineEl) {
      markerLineEl.setAttribute('x1', paths.markerX.toFixed(2));
      markerLineEl.setAttribute('x2', paths.markerX.toFixed(2));
      markerLineEl.setAttribute('y1', paths.markerY.toFixed(2));
      markerLineEl.setAttribute('y2', String(paths.baselineY + 8));
    }

    const reduced = utils ? utils.prefersReducedMotion() : false;

    if (reduced || typeof lineEl.getTotalLength !== 'function') {
      fillEl.style.opacity = '0.55';
      markerEl.style.opacity = '1';
      if (markerLineEl) markerLineEl.style.opacity = '0.7';
      return;
    }

    let length = 1000;
    try {
      length = lineEl.getTotalLength();
    } catch (e) {}

    fillEl.style.opacity = '0';
    markerEl.style.opacity = '0';
    if (markerLineEl) markerLineEl.style.opacity = '0';

    lineEl.style.strokeDasharray = String(length);
    lineEl.style.strokeDashoffset = String(length);

    requestAnimationFrame(() => {
      lineEl.style.transition = 'stroke-dashoffset 1400ms cubic-bezier(0.19, 1, 0.22, 1)';
      lineEl.style.strokeDashoffset = '0';

      global.setTimeout(() => {
        fillEl.style.transition = 'opacity 600ms ease';
        fillEl.style.opacity = '0.55';
        if (markerLineEl) {
          markerLineEl.style.transition = 'opacity 400ms ease';
          markerLineEl.style.opacity = '0.7';
        }
        markerEl.style.transition = 'opacity 400ms ease';
        markerEl.style.opacity = '1';
      }, 1100);
    });
  }

  AurorIQ.components.curve = {
    buildPaths: buildPaths,
    render: render
  };

})(window, document);
