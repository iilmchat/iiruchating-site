/* IIRuChating — согласие на cookie и загрузка Яндекс.Метрики. */
(function () {
  'use strict';

  var KEY = 'iiru-cookie-consent';
  var COUNTER_ID = 114015204;
  var bannerId = 'cookie-banner';
  var metrikaLoaded = false;

  function readConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function saveConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* приватный режим */ }
  }

  function loadMetrika() {
    if (metrikaLoaded) return;
    metrikaLoaded = true;

    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + COUNTER_ID, 'ym');

    window.ym(COUNTER_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  function removeBanner() {
    var banner = document.getElementById(bannerId);
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  }

  function addBannerStyles() {
    if (document.getElementById('cookie-banner-style')) return;
    var style = document.createElement('style');
    style.id = 'cookie-banner-style';
    style.textContent = [
      '.cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:1000;',
      'display:flex;gap:18px;align-items:center;justify-content:space-between;',
      'padding:16px 18px;border-radius:16px;',
      'border:1px solid var(--md-sys-color-outline-variant,#d0c8d8);',
      'background:var(--md-sys-color-surface-container-lowest,#fff);',
      'color:var(--md-sys-color-on-surface,#1b1b1f);',
      'box-shadow:0 12px 40px rgba(0,0,0,.18);font-size:.92rem;line-height:1.45}',
      '.cookie-banner__text{max-width:70ch}',
      '.cookie-banner a{color:var(--md-sys-color-primary,#6750a4);text-decoration:underline}',
      '.cookie-banner__actions{display:flex;gap:8px;flex:none}',
      '.cookie-banner button{font:inherit;font-weight:600;padding:9px 14px;border-radius:999px;',
      'border:1px solid var(--md-sys-color-outline-variant,#d0c8d8);background:transparent;',
      'color:inherit;cursor:pointer}',
      '.cookie-banner button[data-consent="accepted"]{background:var(--md-sys-color-primary,#6750a4);',
      'color:var(--md-sys-color-on-primary,#fff);border-color:transparent}',
      '@media(max-width:700px){.cookie-banner{flex-direction:column;align-items:stretch}',
      '.cookie-banner__actions{justify-content:flex-end}}'
    ].join('');
    document.head.appendChild(style);
  }

  function showBanner() {
    if (document.getElementById(bannerId)) return;
    addBannerStyles();

    var banner = document.createElement('div');
    banner.id = bannerId;
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Уведомление о cookie');
    banner.innerHTML = [
      '<div class="cookie-banner__text">Мы используем cookie для аналитики и улучшения сайта. ',
      'Подробнее — в <a href="https://iiruchating.ru/privacy/">политике конфиденциальности</a>.</div>',
      '<div class="cookie-banner__actions">',
      '<button type="button" data-consent="declined">Только необходимые</button>',
      '<button type="button" data-consent="accepted">Принять</button>',
      '</div>'
    ].join('');
    document.body.appendChild(banner);

    banner.addEventListener('click', function (e) {
      var button = e.target.closest('[data-consent]');
      if (!button) return;
      var value = button.getAttribute('data-consent');
      saveConsent(value);
      removeBanner();
      if (value === 'accepted') loadMetrika();
    });
  }

  window.iiruCookieSettings = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    removeBanner();
    showBanner();
  };

  var consent = readConsent();
  if (consent === 'accepted') {
    loadMetrika();
  } else if (!consent) {
    showBanner();
  }
})();
