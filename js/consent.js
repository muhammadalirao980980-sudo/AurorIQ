/* consent.js — GDPR/CCPA cookie consent with Google Consent Mode v2
 * Basic consent mode: Google tags load only after explicit consent.
 * Consent defaults are pushed to the dataLayer before any tag loads,
 * so gtag.js picks them up whenever it is injected. */
(function () {
  'use strict';
  var CONSENT_KEY = 'auroriq_consent';
  var GA_ID = 'G-50T6XM1Z3P';
  var ADSENSE_PUB = 'ca-pub-2335913078491957';

  /* ---- Consent Mode v2 plumbing ---- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // v2 defaults: everything denied until the visitor decides.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('js', new Date());

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* silent */ }
  }

  function grantSignals() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted'
    });
  }

  function denySignals() {
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied'
    });
  }

  /* ---- Conditional script loading ---- */
  function loadGA() {
    if (document.querySelector('script[src*="googletagmanager"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function loadAdSense() {
    if (document.querySelector('script[src*="adsbygoogle"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUB;
    document.head.appendChild(s);
  }

  /* ---- Banner actions ---- */
  function accept() {
    setConsent('granted');
    grantSignals();
    loadGA();
    loadAdSense();
    hideBanner();
  }

  function reject() {
    setConsent('denied');
    denySignals();
    hideBanner();
  }

  function hideBanner() {
    var b = document.getElementById('consentBanner');
    if (b) { b.classList.remove('is-visible'); setTimeout(function () { b.remove(); }, 400); }
  }

  function showBanner() {
    var b = document.getElementById('consentBanner');
    if (b) requestAnimationFrame(function () { b.classList.add('is-visible'); });
  }

  /* Re-open banner (consent withdrawal / change) — rebuilds it if it was removed. */
  function reopenBanner() {
    var b = document.getElementById('consentBanner');
    if (!b) {
      b = document.createElement('div');
      b.className = 'consent-banner';
      b.id = 'consentBanner';
      b.setAttribute('role', 'dialog');
      b.setAttribute('aria-label', 'Cookie consent');
      b.innerHTML =
        '<p>We use cookies for analytics and advertising to keep AurorIQ free. ' +
        'You can accept or decline non-essential cookies. ' +
        '<a href="/privacy-policy/">Learn more</a></p>' +
        '<div class="consent-banner__actions">' +
        '<button class="consent-banner__btn consent-banner__btn--reject" id="consentReject" type="button">Decline</button>' +
        '<button class="consent-banner__btn consent-banner__btn--accept" id="consentAccept" type="button">Accept</button>' +
        '</div>';
      document.body.appendChild(b);
      wireButtons();
    }
    showBanner();
  }

  function wireButtons() {
    var acceptBtn = document.getElementById('consentAccept');
    var rejectBtn = document.getElementById('consentReject');
    if (acceptBtn) acceptBtn.addEventListener('click', accept);
    if (rejectBtn) rejectBtn.addEventListener('click', reject);
  }

  function init() {
    var consent = getConsent();
    if (consent === 'granted') {
      grantSignals();
      loadGA();
      loadAdSense();
      var b = document.getElementById('consentBanner');
      if (b) b.remove();
      return;
    }
    if (consent === 'denied') {
      var b2 = document.getElementById('consentBanner');
      if (b2) b2.remove();
      return;
    }
    showBanner();
  }

  // Public API + withdrawal links: any element with [data-consent-open]
  window.AurorConsent = { open: reopenBanner };

  document.addEventListener('DOMContentLoaded', function () {
    wireButtons();
    var openers = document.querySelectorAll('[data-consent-open]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].addEventListener('click', function (e) {
        e.preventDefault();
        reopenBanner();
      });
    }
    init();
  });
})();
