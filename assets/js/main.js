/* IIRuChating — лендинг iiruchating.ru
   Без зависимостей. Тема, навигация, появление блоков, форма заявки. */

(function () {
  'use strict';

  var THEME_KEY = 'iiru-theme';
  var root = document.documentElement;

  // Сообщаем инлайн-скрипту в <head>, что основной скрипт загрузился:
  // иначе он снимет класс js-reveal и анимация появления не сработает.
  root.setAttribute('data-iiru-ready', '');

  /* ---------------- Тема ---------------- */
  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* приватный режим */ }
  }

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function currentTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------------- Мобильная навигация ---------------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------------- Шапка: тень при скролле ---------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- Появление блоков ----------------
     Используем проверку по геометрии, а не IntersectionObserver:
     IO не срабатывает в ряде окружений (фоновые вкладки, headless-режим),
     и тогда контент мог бы навсегда остаться невидимым.
     Проверка дешёвая — 19 элементов, вызов по rAF/таймеру при прокрутке. */
  var pendingReveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var revealScheduled = false;

  function revealInView() {
    revealScheduled = false;
    if (!pendingReveals.length) return;

    var vh = window.innerHeight || document.documentElement.clientHeight;
    pendingReveals = pendingReveals.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add('is-visible');
        return false;
      }
      return true;
    });
  }

  function scheduleReveal() {
    if (revealScheduled) return;
    revealScheduled = true;
    window.requestAnimationFrame
      ? window.requestAnimationFrame(revealInView)
      : window.setTimeout(revealInView, 60);
    // Страховка: если кадр не пришёл (фоновая вкладка), проверяем по таймеру.
    window.setTimeout(function () {
      if (revealScheduled) revealInView();
    }, 200);
  }

  var reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (pendingReveals.length && reduceMotion) {
    pendingReveals.forEach(function (el) { el.classList.add('is-visible'); });
    pendingReveals = [];
  } else if (pendingReveals.length) {
    window.addEventListener('scroll', scheduleReveal, { passive: true });
    window.addEventListener('resize', scheduleReveal, { passive: true });
    window.addEventListener('load', scheduleReveal);
    window.addEventListener('pageshow', scheduleReveal);
    revealInView();

    // Страховка: через 8 с показываем всё, что ещё не показано.
    // Если событие прокрутки почему-то не пришло — контент всё равно виден.
    window.setTimeout(function () {
      pendingReveals.forEach(function (el) { el.classList.add('is-visible'); });
      pendingReveals = [];
    }, 8000);
  }

  /* ---------------- Подсветка активного раздела ---------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var activeSection = '';

  function updateActiveSection() {
    if (!sections.length || !navLinks.length) return;
    var pos = (window.scrollY || window.pageYOffset) + (window.innerHeight * 0.35);
    var current = '';
    sections.forEach(function (s) {
      if (s.offsetTop <= pos) current = s.id;
    });
    if (current === activeSection) return;
    activeSection = current;
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + current);
    });
  }

  updateActiveSection();
  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection, { passive: true });

  /* ---------------- Копирование e-mail ---------------- */
  document.querySelectorAll('[data-copy]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var value = el.getAttribute('data-copy');
      if (!value || !navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(value).then(function () {
        var original = el.textContent;
        el.textContent = 'Скопировано';
        setTimeout(function () { el.textContent = original; }, 1800);
      }).catch(function () { /* игнорируем */ });
    });
  });

  /* ---------------- Форма заявки ---------------- */
  var form = document.getElementById('lead-form');
  var note = document.getElementById('form-note');

  if (form) {
    var DEFAULT_NOTE = note ? note.textContent.trim() : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('is-invalid'); });
      note.classList.remove('is-ok', 'is-error');

      if (!name || !emailOk || !message) {
        if (!name) form.elements.name.closest('.field').classList.add('is-invalid');
        if (!emailOk) form.elements.email.closest('.field').classList.add('is-invalid');
        if (!message) form.elements.message.closest('.field').classList.add('is-invalid');
        note.textContent = 'Заполните имя, корректный e-mail и коротко опишите задачу.';
        note.classList.add('is-error');
        return;
      }

      var subject = 'Заявка на демо AI Ru Chating — ' + name;
      var body = [
        'Имя: ' + name,
        'E-mail: ' + email,
        '',
        'Компания и задача:',
        message
      ].join('\n');

      window.location.href = 'mailto:hello@iiruchating.ru'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      note.textContent = 'Письмо сформировано — отправьте его из почтового клиента.';
      note.classList.add('is-ok');
      setTimeout(function () {
        note.textContent = DEFAULT_NOTE;
        note.classList.remove('is-ok');
      }, 8000);
    });
  }
})();
