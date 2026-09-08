(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  AurorIQ.sharing = AurorIQ.sharing || {};

  /* A4 at 150 DPI — portrait document, not a social card. */
  const DPI = 150;
  const PAGE_W = Math.round(8.27 * DPI);   // 1240
  const PAGE_H = Math.round(11.69 * DPI);  // 1754

  const C = {
    bg: '#ffffff',
    ink: '#12121c',
    sub: '#4a4866',
    muted: '#78748f',
    line: '#e6e4f0',
    violet: '#7c3aed',
    cyan: '#0891b2',
    gold: '#b7791f',
    surface: '#f7f6fb'
  };

  function px(pt) { return pt * (DPI / 72); }

  async function ensureFonts() {
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function gradText(ctx, text, x, y, font, colors, align) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(text).width;
    const x0 = align === 'center' ? x - w / 2 : x;
    const grad = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillText(text, x, y);
    ctx.restore();
    return w;
  }

  function drawBars(ctx, x, y, w, domains, order, domainMeta) {
    const rowH = px(30);
    const gap = px(14);
    let cy = y;
    order.forEach((id) => {
      const d = domains[id];
      const val = d ? d.strengthIndex : 50;
      const meta = domainMeta.get(id);
      const label = meta ? meta.name : id;
      const color = domainMeta.getColor(id) || C.violet;

      ctx.fillStyle = C.sub;
      ctx.font = '600 ' + px(11) + 'px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, cy + rowH / 2);

      const trackX = x + px(140);
      const trackW = w - px(190);
      ctx.fillStyle = C.surface;
      roundRect(ctx, trackX, cy + rowH / 2 - px(5), trackW, px(10), px(5));
      ctx.fill();

      ctx.fillStyle = color;
      roundRect(ctx, trackX, cy + rowH / 2 - px(5), trackW * (val / 100), px(10), px(5));
      ctx.fill();

      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + px(10) + 'px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(val), x + w, cy + rowH / 2);

      cy += rowH + gap;
    });
    return cy;
  }

  async function renderDocument(ctx, ctxData) {
    const cx = PAGE_W / 2;
    const M = px(54); // margin

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Top accent bar
    const topGrad = ctx.createLinearGradient(0, 0, PAGE_W, 0);
    topGrad.addColorStop(0, C.violet);
    topGrad.addColorStop(0.55, '#06b6d4');
    topGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, PAGE_W, px(8));

    // Header
    ctx.fillStyle = C.ink;
    ctx.font = '800 ' + px(20) + 'px "Syne", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('AurorIQ', M, px(70));

    ctx.fillStyle = C.muted;
    ctx.font = '600 ' + px(10) + 'px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('COGNITIVE ASSESSMENT REPORT', PAGE_W - M, px(66));

    // Personalised line
    let headY = px(150);
    ctx.textAlign = 'left';
    if (ctxData.name) {
      ctx.fillStyle = C.sub;
      ctx.font = '500 ' + px(15) + 'px "DM Sans", sans-serif';
      ctx.fillText('Prepared for ' + ctxData.name, M, px(120));
    }

    ctx.fillStyle = C.ink;
    ctx.font = '800 ' + px(30) + 'px "Syne", sans-serif';
    ctx.fillText(ctxData.archetypeName, M, headY);

    ctx.fillStyle = C.sub;
    ctx.font = 'italic ' + px(14) + 'px "DM Sans", sans-serif';
    ctx.fillText(ctxData.tagline || '', M, headY + px(26));

    // Score block
    const scoreY = px(310);
    gradText(ctx, String(ctxData.score), M, scoreY, '800 ' + px(90) + 'px "Syne", sans-serif',
      [C.violet, C.cyan, C.gold], 'left');

    const scoreW = ctx.measureText(String(ctxData.score)).width;
    ctx.fillStyle = C.muted;
    ctx.font = '600 ' + px(11) + 'px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText((ctxData.bandLabel || '').toUpperCase(), M + px(90) + px(20), scoreY - px(42));
    ctx.fillStyle = C.sub;
    ctx.font = '500 ' + px(13) + 'px "DM Sans", sans-serif';
    ctx.fillText(ctxData.tierLabel + ' tier', M + px(90) + px(20), scoreY - px(20));

    if (ctxData.isAgeNormed) {
      ctx.fillStyle = C.gold;
      ctx.font = '600 ' + px(11) + 'px "JetBrains Mono", monospace';
      ctx.fillText('Age-adjusted \u00b7 ' + ctxData.ageGroup, M + px(90) + px(20), scoreY + px(4));
    }

    // 95% CI + percentile summary card
    const cardY = px(360);
    const cardH = px(120);
    ctx.fillStyle = C.surface;
    roundRect(ctx, M, cardY, PAGE_W - M * 2, cardH, px(14));
    ctx.fill();

    const ci = ctxData.confidenceInterval;
    const colW = (PAGE_W - M * 2) / 3;
    const cells = [
      { k: 'Percentile', v: Math.round(ctxData.percentile) + 'th' },
      { k: '95% range', v: ci.low + '\u2013' + ci.high },
      { k: 'Rarity', v: ctxData.rarityShort || '\u2014' }
    ];
    cells.forEach((cell, i) => {
      const colCx = M + colW * i + colW / 2;
      ctx.fillStyle = C.ink;
      ctx.font = '800 ' + px(22) + 'px "Syne", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cell.v, colCx, cardY + px(52));
      ctx.fillStyle = C.muted;
      ctx.font = '600 ' + px(10) + 'px "JetBrains Mono", monospace';
      ctx.fillText(cell.k.toUpperCase(), colCx, cardY + px(82));
    });

    // Peer comparison line (age-normed only)
    let sectionY = cardY + cardH + px(50);
    if (ctxData.isAgeNormed && ctxData.rawPercentile != null) {
      ctx.fillStyle = C.ink;
      ctx.font = '700 ' + px(14) + 'px "Syne", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('How you compare', M, sectionY);
      ctx.fillStyle = C.sub;
      ctx.font = '400 ' + px(12) + 'px "DM Sans", sans-serif';
      ctx.fillText('vs. everyone: ' + Math.round(ctxData.rawPercentile) + 'th percentile \u00b7 vs. your age group ('
        + ctxData.ageGroup + '): ' + Math.round(ctxData.percentile) + 'th percentile',
        M, sectionY + px(22));
      sectionY += px(60);
    }

    // Domain breakdown
    ctx.fillStyle = C.ink;
    ctx.font = '700 ' + px(14) + 'px "Syne", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Reasoning domains', M, sectionY);
    sectionY += px(28);
    sectionY = drawBars(ctx, M, sectionY, PAGE_W - M * 2, ctxData.domains, ctxData.domainOrder, ctxData.domainMeta);

    ctx.fillStyle = C.muted;
    ctx.font = '400 ' + px(9.5) + 'px "DM Sans", sans-serif';
    ctx.fillText('Domain estimates are based on roughly five questions each and are shown as relative strengths, not precise sub-scores.', M, sectionY + px(6));

    // Footer / disclaimer
    const footY = PAGE_H - px(90);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, footY);
    ctx.lineTo(PAGE_W - M, footY);
    ctx.stroke();

    ctx.fillStyle = C.muted;
    ctx.font = '400 ' + px(9.5) + 'px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('AurorIQ is an educational self-reflection tool, not a clinical assessment. Generated ' +
      new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) + '.', M, footY + px(24));
    ctx.textAlign = 'right';
    ctx.fillStyle = C.cyan;
    ctx.font = '600 ' + px(10) + 'px "JetBrains Mono", monospace';
    ctx.fillText('auroriq.com', PAGE_W - M, footY + px(24));
  }

  /* ---- Minimal PDF wrapper around a single JPEG image (no library) ---- */

  function buildPdfFromJpeg(jpegBytes, wPx, hPx) {
    // PDF points: 72 per inch. Our canvas is 150 DPI, so scale down.
    const wPt = (wPx / DPI) * 72;
    const hPt = (hPx / DPI) * 72;

    const enc = new TextEncoder();
    const chunks = [];
    const offsets = [];
    let length = 0;
    function push(bytes) {
      const arr = typeof bytes === 'string' ? enc.encode(bytes) : bytes;
      chunks.push(arr);
      length += arr.length;
      return arr.length;
    }
    function markObj() { offsets.push(length); }

    push('%PDF-1.4\n');

    // 1: Catalog
    markObj();
    push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    // 2: Pages
    markObj();
    push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    // 3: Page
    markObj();
    push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + wPt.toFixed(2) + ' ' + hPt.toFixed(2) +
      '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
    // 4: Image XObject
    markObj();
    push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + wPx + ' /Height ' + hPx +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\nstream\n');
    push(jpegBytes);
    push('\nendstream\nendobj\n');
    // 5: Content stream (draw image to fill page)
    const content = 'q\n' + wPt.toFixed(2) + ' 0 0 ' + hPt.toFixed(2) + ' 0 0 cm\n/Im0 Do\nQ\n';
    markObj();
    push('5 0 obj\n<< /Length ' + enc.encode(content).length + ' >>\nstream\n' + content + 'endstream\nendobj\n');

    // xref
    const xrefStart = length;
    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    offsets.forEach((off) => {
      xref += String(off).padStart(10, '0') + ' 00000 n \n';
    });
    push(xref);
    push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF');

    const out = new Uint8Array(length);
    let pos = 0;
    chunks.forEach((c) => { out.set(c, pos); pos += c.length; });
    return new Blob([out], { type: 'application/pdf' });
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const bin = global.atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function generate(data) {
    await ensureFonts();
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    await renderDocument(ctx, data);

    // JPEG keeps the PDF small; white document background compresses well.
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const jpegBytes = dataUrlToBytes(jpegDataUrl);
    const blob = buildPdfFromJpeg(jpegBytes, PAGE_W, PAGE_H);
    return { blob: blob, canvas: canvas };
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'auroriq-result.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    global.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  AurorIQ.sharing.pdf = {
    generate: generate,
    download: download,
    buildPdfFromJpeg: buildPdfFromJpeg
  };

})(window, document);
