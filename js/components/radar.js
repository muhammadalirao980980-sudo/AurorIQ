(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.components = AurorIQ.components || {};

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SIZE = 280;
  const CX = 140;
  const CY = 140;
  const MAX_RADIUS = 95;
  const RING_COUNT = 4;
  const GRADIENT_ID = 'radarFillGradient';

  function polarPoint(cx, cy, radius, angleDeg) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }

  function pointsToAttr(pts) {
    return pts.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');
  }

  function buildGridRings(count) {
    const rings = [];
    for (let r = 1; r <= RING_COUNT; r++) {
      const radius = MAX_RADIUS * (r / RING_COUNT);
      const pts = [];
      for (let i = 0; i < count; i++) {
        pts.push(polarPoint(CX, CY, radius, i * (360 / count)));
      }
      rings.push(pts);
    }
    return rings;
  }

  function buildAxisPoints(count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push(polarPoint(CX, CY, MAX_RADIUS, i * (360 / count)));
    }
    return pts;
  }

  function buildDataPoints(values) {
    const count = values.length;
    return values.map((v, i) => {
      const clamped = Math.max(0, Math.min(100, v));
      const radius = MAX_RADIUS * (clamped / 100);
      return polarPoint(CX, CY, radius, i * (360 / count));
    });
  }

  function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
    return node;
  }

  function ensureGradientDefs(svgEl) {
    if (svgEl.querySelector('#' + GRADIENT_ID)) return;
    const defs = el('defs');
    const gradient = el('radialGradient', { id: GRADIENT_ID, cx: '50%', cy: '50%', r: '65%' });
    gradient.appendChild(el('stop', { offset: '0%', 'stop-color': '#22d3ee', 'stop-opacity': '0.55' }));
    gradient.appendChild(el('stop', { offset: '100%', 'stop-color': '#7c3aed', 'stop-opacity': '0.25' }));
    defs.appendChild(gradient);
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  function setGroupScale(groupEl, scale) {
    groupEl.setAttribute('transform', 'translate(' + CX + ',' + CY + ') scale(' + scale + ') translate(' + (-CX) + ',' + (-CY) + ')');
  }

  function labelAnchor(angleDeg) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    let anchor = 'middle';
    if (dx > 0.3) anchor = 'start';
    else if (dx < -0.3) anchor = 'end';
    let dyOffset = 0;
    if (dy < -0.3) dyOffset = -4;
    else if (dy > 0.3) dyOffset = 12;
    return { anchor: anchor, dyOffset: dyOffset };
  }

  function render(svgEl, dataset, opts) {
    if (!svgEl || !dataset || !dataset.length) return;
    const options = opts || {};
    const utils = AurorIQ.utils;

    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    svgEl.setAttribute('viewBox', '0 0 ' + SIZE + ' ' + SIZE);
    ensureGradientDefs(svgEl);

    const count = dataset.length;
    const values = dataset.map((d) => d.value);

    const gridGroup = el('g', { class: 'radar-grid' });
    buildGridRings(count).forEach((ringPts, idx) => {
      gridGroup.appendChild(el('polygon', {
        points: pointsToAttr(ringPts),
        fill: 'none',
        stroke: 'rgba(255,255,255,0.08)',
        'stroke-width': idx === RING_COUNT - 1 ? '1.2' : '1'
      }));
    });

    const axisPts = buildAxisPoints(count);
    axisPts.forEach((p) => {
      gridGroup.appendChild(el('line', {
        x1: CX, y1: CY, x2: p[0].toFixed(2), y2: p[1].toFixed(2),
        stroke: 'rgba(255,255,255,0.08)', 'stroke-width': '1'
      }));
    });
    svgEl.appendChild(gridGroup);

    if (options.prototype && options.prototype.length === count) {
      const protoPts = buildDataPoints(options.prototype);
      svgEl.appendChild(el('polygon', {
        points: pointsToAttr(protoPts),
        fill: 'none',
        stroke: 'rgba(255,255,255,0.35)',
        'stroke-width': '1.5',
        'stroke-dasharray': '4 4'
      }));
    }

    const labelGroup = el('g', { class: 'radar-labels' });
    dataset.forEach((d, i) => {
      const angle = i * (360 / count);
      const pos = polarPoint(CX, CY, MAX_RADIUS + 20, angle);
      const a = labelAnchor(angle);
      const text = el('text', {
        x: pos[0].toFixed(2),
        y: (pos[1] + a.dyOffset).toFixed(2),
        'text-anchor': a.anchor,
        fill: d.color || '#a8a4c0',
        'font-size': '11',
        'font-family': 'DM Sans, sans-serif',
        'font-weight': '600'
      });
      text.textContent = d.label || d.domain || '';
      labelGroup.appendChild(text);
    });
    svgEl.appendChild(labelGroup);

    const dataGroup = el('g', { class: 'radar-data' });
    const dataPts = buildDataPoints(values);

    dataGroup.appendChild(el('polygon', {
      points: pointsToAttr(dataPts),
      fill: 'url(#' + GRADIENT_ID + ')',
      stroke: '#67e8f9',
      'stroke-width': '2',
      'stroke-linejoin': 'round'
    }));

    dataPts.forEach((p, i) => {
      dataGroup.appendChild(el('circle', {
        cx: p[0].toFixed(2), cy: p[1].toFixed(2), r: '3.5',
        fill: dataset[i].color || '#22d3ee',
        stroke: '#08080f',
        'stroke-width': '1.5'
      }));
    });

    svgEl.appendChild(dataGroup);

    const reduced = utils ? utils.prefersReducedMotion() : false;

    if (reduced) {
      setGroupScale(dataGroup, 1);
      dataGroup.style.opacity = '1';
      return;
    }

    dataGroup.style.opacity = '0';
    setGroupScale(dataGroup, 0.25);

    requestAnimationFrame(() => {
      dataGroup.style.transition = 'opacity 700ms ease';
      dataGroup.style.opacity = '1';

      if (utils && utils.animateValue) {
        utils.animateValue({
          from: 0.25,
          to: 1,
          duration: 900,
          onUpdate: (v) => setGroupScale(dataGroup, v)
        });
      } else {
        setGroupScale(dataGroup, 1);
      }
    });
  }

  AurorIQ.components.radar = {
    buildDataPoints: buildDataPoints,
    render: render
  };

})(window, document);
