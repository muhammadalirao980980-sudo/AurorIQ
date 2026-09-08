(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.sharing = AurorIQ.sharing || {};

  const CARD_W = 1080;
  const CARD_H = 1920;

  const PALETTE = {
    violet: '#9269f3',
    cyan: '#22d3ee',
    gold: '#fde68a',
    textPrimary: '#f1f0ff',
    textSecondary: '#a8a4c0',
    textMuted: '#6b6685'
  };

  function createCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  async function ensureFontsReady() {
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch (e) {}
  }

  function drawBlob(ctx, cx, cy, radius, color) {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackground(ctx, w, h) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#13131f');
    bg.addColorStop(1, '#08080f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    drawBlob(ctx, w * 0.18, h * 0.1, w * 0.6, 'rgba(124,58,237,0.32)');
    drawBlob(ctx, w * 0.85, h * 0.92, w * 0.55, 'rgba(6,182,212,0.22)');
    drawBlob(ctx, w * 0.5, h * 0.5, w * 0.7, 'rgba(124,58,237,0.06)');
  }

  function drawWordmark(ctx, cx, y) {
    ctx.save();
    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 34, y + 14);
    ctx.bezierCurveTo(cx - 18, y - 26, cx + 18, y - 26, cx + 34, y + 14);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = PALETTE.textPrimary;
    ctx.font = '700 34px "Syne", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('AurorIQ', cx + 52, y);
  }

  function gradientFill(ctx, x0, x1, colors) {
    const gradient = ctx.createLinearGradient(x0, 0, x1, 0);
    colors.forEach((c, i) => gradient.addColorStop(i / (colors.length - 1), c));
    return gradient;
  }

  function drawGradientText(ctx, text, cx, y, font, colors) {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const width = ctx.measureText(text).width;
    ctx.fillStyle = gradientFill(ctx, cx - width / 2, cx + width / 2, colors);
    ctx.fillText(text, cx, y);
    return width;
  }

  function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
    const words = String(text || '').split(' ');
    let line = '';
    let cursorY = y;
    const lines = [];

    words.forEach((word) => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);

    lines.forEach((l) => {
      ctx.fillText(l, cx, cursorY);
      cursorY += lineHeight;
    });

    return cursorY;
  }

  function drawPill(ctx, text, cx, y, opts) {
    ctx.font = opts.font;
    const textW = ctx.measureText(text).width;
    const padX = 36;
    const h = opts.height || 64;
    const w = textW + padX * 2;
    const x = cx - w / 2;
    const r = h / 2;

    ctx.fillStyle = opts.bg;
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y - h / 2);
    ctx.arcTo(x + w, y - h / 2, x + w, y + h / 2, r);
    ctx.arcTo(x + w, y + h / 2, x, y + h / 2, r);
    ctx.arcTo(x, y + h / 2, x, y - h / 2, r);
    ctx.arcTo(x, y - h / 2, x + w, y - h / 2, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = opts.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, y + 2);

    return h;
  }

  function drawFooter(ctx, w, h) {
    ctx.fillStyle = PALETTE.textMuted;
    ctx.font = '600 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('auroriq.com', w / 2, h - 90);
  }

  function svgToDataUri(svgEl) {
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const xml = new XMLSerializer().serializeToString(clone);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function drawSvgToCanvas(ctx, svgEl, x, y, w, h) {
    if (!svgEl) return;
    try {
      const uri = svgToDataUri(svgEl);
      const img = await loadImage(uri);
      ctx.drawImage(img, x, y, w, h);
    } catch (e) {}
  }

  async function renderIdentityCard(data) {
    await ensureFontsReady();
    const canvas = createCanvas(CARD_W, CARD_H);
    const ctx = canvas.getContext('2d');
    const cx = CARD_W / 2;

    drawBackground(ctx, CARD_W, CARD_H);
    drawWordmark(ctx, cx - 70, 130);

    drawPill(ctx, (data.tierLabel || '').toUpperCase(), cx, 290, {
      fg: PALETTE.cyan, bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.35)',
      font: '600 28px "DM Sans", sans-serif'
    });

    ctx.font = '800 92px "Syne", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    let nameWidth = ctx.measureText(data.archetypeName).width;

    if (nameWidth > 940) {
      ctx.font = '800 68px "Syne", sans-serif';
    }

    ctx.fillStyle = gradientFill(ctx, cx - 470, cx + 470, [PALETTE.violet, PALETTE.cyan, PALETTE.gold]);
    ctx.fillText(data.archetypeName, cx, 470);

    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = 'italic 38px "DM Sans", sans-serif';
    wrapText(ctx, data.tagline || '', cx, 560, 820, 50);

    ctx.font = '800 240px "Syne", sans-serif';
    drawGradientText(ctx, String(data.score), cx, 980, '800 240px "Syne", sans-serif', [PALETTE.violet, PALETTE.cyan, PALETTE.gold]);

    ctx.fillStyle = PALETTE.textMuted;
    ctx.font = '600 32px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText((data.bandLabel || '').toUpperCase() + ' \u00B7 COMPOSITE ESTIMATE', cx, 1040);

    drawPill(ctx, data.rarityLabel || '', cx, 1170, {
      fg: PALETTE.gold, bg: 'rgba(253,230,138,0.1)', border: 'rgba(253,230,138,0.4)',
      font: '600 30px "JetBrains Mono", monospace'
    });

    ctx.fillStyle = PALETTE.textPrimary;
    ctx.font = '500 36px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Brighter than ' + Math.round(data.percentile) + '% of people', cx, 1280);

    drawFooter(ctx, CARD_W, CARD_H);
    return canvas;
  }

  async function renderProfileCard(data) {
    await ensureFontsReady();
    const canvas = createCanvas(CARD_W, CARD_H);
    const ctx = canvas.getContext('2d');
    const cx = CARD_W / 2;

    drawBackground(ctx, CARD_W, CARD_H);
    drawWordmark(ctx, cx - 70, 120);

    ctx.fillStyle = PALETTE.textPrimary;
    ctx.font = '700 56px "Syne", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.archetypeName, cx, 250);

    drawGradientText(ctx, String(data.score), cx, 430, '800 150px "Syne", sans-serif', [PALETTE.violet, PALETTE.cyan, PALETTE.gold]);

    if (data.radarSvgEl) {
      await drawSvgToCanvas(ctx, data.radarSvgEl, cx - 380, 520, 760, 760);
    }

    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '500 36px "DM Sans", sans-serif';
    ctx.fillText('Brighter than ' + Math.round(data.percentile) + '% of people', cx, 1380);

    drawPill(ctx, data.rarityLabel || '', cx, 1470, {
      fg: PALETTE.gold, bg: 'rgba(253,230,138,0.1)', border: 'rgba(253,230,138,0.4)',
      font: '600 30px "JetBrains Mono", monospace'
    });

    drawFooter(ctx, CARD_W, CARD_H);
    return canvas;
  }

  async function renderChallengeCard(data) {
    await ensureFontsReady();
    const canvas = createCanvas(CARD_W, CARD_H);
    const ctx = canvas.getContext('2d');
    const cx = CARD_W / 2;

    drawBackground(ctx, CARD_W, CARD_H);
    drawWordmark(ctx, cx - 90, 130);

    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '600 34px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("I'm a", cx, 360);

    ctx.font = '800 84px "Syne", sans-serif';
    drawGradientText(ctx, data.archetypeName, cx, 460, '800 84px "Syne", sans-serif', [PALETTE.violet, PALETTE.cyan, PALETTE.gold]);

    drawGradientText(ctx, String(data.score), cx, 760, '800 220px "Syne", sans-serif', [PALETTE.violet, PALETTE.cyan, PALETTE.gold]);

    ctx.fillStyle = PALETTE.textMuted;
    ctx.font = '600 30px "JetBrains Mono", monospace';
    ctx.fillText('COMPOSITE ESTIMATE', cx, 815);

    ctx.fillStyle = PALETTE.textPrimary;
    ctx.font = '700 56px "Syne", sans-serif';
    ctx.fillText('Beat me.', cx, 1020);

    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '500 32px "DM Sans", sans-serif';
    wrapText(ctx, 'Take the same adaptive test and see how your mind compares.', cx, 1100, 760, 44);

    drawPill(ctx, 'auroriq.com/iq-test', cx, 1300, {
      fg: PALETTE.cyan, bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.3)',
      font: '600 30px "JetBrains Mono", monospace'
    });

    drawFooter(ctx, CARD_W, CARD_H);
    return canvas;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type || 'image/png', quality);
    });
  }

  async function generate(variant, data) {
    let canvas;
    if (variant === 'profile') canvas = await renderProfileCard(data);
    else if (variant === 'challenge') canvas = await renderChallengeCard(data);
    else canvas = await renderIdentityCard(data);

    const blob = await canvasToBlob(canvas, 'image/png');
    return {
      canvas: canvas,
      blob: blob,
      dataUrl: canvas.toDataURL('image/png')
    };
  }

  AurorIQ.sharing.cards = {
    CARD_W: CARD_W,
    CARD_H: CARD_H,
    generate: generate,
    renderIdentityCard: renderIdentityCard,
    renderProfileCard: renderProfileCard,
    renderChallengeCard: renderChallengeCard,
    canvasToBlob: canvasToBlob
  };

})(window, document);
