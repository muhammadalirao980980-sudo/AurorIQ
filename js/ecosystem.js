(function (global, document) {
  'use strict';
  const KEY = 'auroriq_recent_tools_v1';
  const A = global.AurorIQ || (global.AurorIQ = {});

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function normalizedPath() {
    let p = global.location.pathname || '/';
    if (!p.endsWith('/') && !p.endsWith('.html')) p += '/';
    return p;
  }

  function currentTool() {
    const reg = A.registry;
    if (!reg || !reg.tools) return null;
    let path = normalizedPath();
    if (path === '/iq-test/results/') path = '/iq-test/';
    return reg.tools.find(t => t.url === path && (t.status === 'live' || t.status === 'external')) || null;
  }

  function activeSection() {
    const path = normalizedPath();
    const tool = currentTool();
    if (tool) return tool.category;
    if (path.startsWith('/cognition/') || path.startsWith('/iq-scores/')) return 'cognition';
    if (path.startsWith('/career/')) return 'career';
    if (path.startsWith('/learning/')) return 'learning';
    if (path.startsWith('/productivity/')) return 'productivity';
    if (path.startsWith('/blog/')) return 'learn';
    if (path === '/' || path === '/tests/') return 'suite';
    return null;
  }

  function markNavigation() {
    const section = activeSection();
    if (!section) return;
    document.querySelectorAll('[data-nav-section]').forEach(a => {
      if (a.getAttribute('data-nav-section') === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function readRecent() {
    try {
      const v = JSON.parse(global.localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter(x => x && typeof x.url === 'string' && x.url.startsWith('/') && x.name).slice(0, 4) : [];
    } catch (e) { return []; }
  }

  function recordTool() {
    const tool = currentTool();
    if (!tool || tool.external) return;
    try {
      const recent = readRecent().filter(x => x.url !== tool.url);
      recent.unshift({ id: tool.id, name: tool.name, url: tool.url, category: tool.category, description: tool.tagline || tool.description || '' });
      global.localStorage.setItem(KEY, JSON.stringify(recent.slice(0, 4)));
    } catch (e) {}
  }

  function titleCase(s) { return String(s || '').replace(/(^|[-_\s])\w/g, m => m.toUpperCase()).replace(/[-_]/g, ' '); }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderRecent404() {
    const mount = document.querySelector('[data-recent-tools]');
    if (!mount) return;
    const recent = readRecent();
    if (!recent.length) return; // preserve useful static fallback
    mount.innerHTML = recent.slice(0, 3).map(item =>
      '<a class="recovery-card" href="' + escapeHtml(item.url) + '">' +
      '<span>' + escapeHtml(titleCase(item.category)) + '</span>' +
      '<strong>' + escapeHtml(item.name) + '</strong>' +
      '<small>' + escapeHtml(item.description || 'Continue this AurorIQ instrument.') + '</small></a>'
    ).join('');
  }

  function searchCatalog() {
    const reg = A.registry;
    if (!reg) return [];
    const rows = [];
    Object.keys(reg.categories || {}).forEach(k => {
      const c = reg.categories[k];
      if (c.status !== 'live') return;
      rows.push({ name: c.name + ' Hub', url: c.url, kind: 'Hub', category: c.name, text: [c.name, c.tagline, k, 'hub suite'].join(' ').toLowerCase() });
    });
    (reg.tools || []).forEach(t => {
      if ((t.status !== 'live' && t.status !== 'external') || !t.url) return;
      rows.push({ name: t.name, url: t.url, kind: 'Assessment', category: titleCase(t.category), text: [t.name, t.tagline, t.description, t.category].join(' ').toLowerCase() });
    });
    rows.push({ name:'AurorIQ Methodology', url:'/about-our-test/', kind:'Guide', category:'Trust', text:'methodology scoring validity reliability psychometric how test works' });
    return rows;
  }

  function rank(row, q) {
    const name = row.name.toLowerCase();
    if (name === q) return 100;
    if (name.startsWith(q)) return 70;
    if (name.includes(q)) return 50;
    if (row.text.includes(q)) return 25;
    return 0;
  }

  function init404Search() {
    const form = document.querySelector('[data-suite-search]');
    const input = document.querySelector('[data-suite-search-input]');
    const out = document.querySelector('[data-suite-search-results]');
    if (!form || !input || !out) return;
    const catalog = searchCatalog();
    let results = [];

    function update() {
      const q = input.value.trim().toLowerCase();
      if (!q) { out.innerHTML = ''; results = []; return; }
      results = catalog.map(row => ({ row, score: rank(row, q) })).filter(x => x.score > 0).sort((a,b) => b.score-a.score || a.row.name.localeCompare(b.row.name)).slice(0, 6).map(x => x.row);
      out.innerHTML = results.length ? results.map(r => '<a class="error-search__result" href="' + r.url + '"><span><strong>' + r.name + '</strong><br><small>' + r.kind + ' · ' + r.category + '</small></span><span aria-hidden="true">→</span></a>').join('') : '<p class="error-search__result">No close match. Try “career”, “IQ”, “focus”, or “chronotype”.</p>';
    }
    input.addEventListener('input', update);
    form.addEventListener('submit', e => {
      e.preventDefault();
      update();
      if (results[0]) global.location.href = results[0].url;
    });
  }

  ready(function () {
    markNavigation();
    recordTool();
    renderRecent404();
    init404Search();
  });
})(window, document);
