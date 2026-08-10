/* =========================================================
   MORO — site behaviour: i18n, header, slider, catalogue, forms
   ========================================================= */
(function () {
  'use strict';

  var LANGS   = window.MORO_LANGS;
  var DICT    = window.MORO_I18N;
  var STORE   = 'moro.lang';
  var DEFAULT = 'ru';
  var lang;

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function meta(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }
  function t(key) {
    var d = DICT[lang];
    if (d && d[key] != null) return d[key];
    if (DICT.en && DICT.en[key] != null) return DICT.en[key];
    return key;
  }
  function plain(key) { return t(key).replace(/<[^>]+>/g, ''); }

  /* ── 1. Language resolution ───────────────────────────── */
  function pickLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && meta(q)) return q;
    var saved;
    try { saved = localStorage.getItem(STORE); } catch (e) {}
    if (saved && meta(saved)) return saved;
    var navs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < navs.length; i++) {
      var code = String(navs[i]).slice(0, 2).toLowerCase();
      if (code === 'uz' || code === 'ru' || code === 'it' || code === 'fr' || code === 'ar' || code === 'en') return code;
    }
    return DEFAULT;
  }

  function applyLang(code, remember) {
    lang = meta(code) ? code : DEFAULT;
    var m = meta(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = m.rtl ? 'rtl' : 'ltr';
    if (remember !== false) { try { localStorage.setItem(STORE, lang); } catch (e) {} }
    translate(document);
    syncLangUI();
    setTitle();
    document.dispatchEvent(new CustomEvent('moro:lang', { detail: { lang: lang } }));
  }

  function translate(root) {
    $$('[data-i18n]', root).forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-html]', root).forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-ph]', root).forEach(function (el) { el.placeholder = plain(t(el.getAttribute('data-i18n-ph'))); });
    $$('[data-i18n-aria]', root).forEach(function (el) { el.setAttribute('aria-label', plain(el.getAttribute('data-i18n-aria') ? t(el.getAttribute('data-i18n-aria')) : '')); });
  }

  function setTitle() {
    var key = document.body.getAttribute('data-title');
    document.title = key ? plain(t(key)) + ' — MORO' : 'MORO — Sartoria Italiana · Tashkent';
  }

  function syncLangUI() {
    var m = meta(lang);
    $$('[data-lang-short]').forEach(function (el) { el.textContent = m.short; });
    $$('[data-lang-full]').forEach(function (el) { el.textContent = m.native; });
    $$('[data-set-lang]').forEach(function (btn) {
      btn.setAttribute('aria-selected', btn.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
  }

  /* ── 2. Shared chrome (topbar / drawer / lang menus) ──── */
  function buildLangMenus() {
    $$('[data-lang-list]').forEach(function (box) {
      box.innerHTML = LANGS.map(function (l) {
        return '<button type="button" data-set-lang="' + l.code + '" role="option">' +
               '<span>' + l.native + '</span><span>' + l.short + '</span></button>';
      }).join('');
    });
    $$('[data-lang-chips]').forEach(function (box) {
      box.innerHTML = LANGS.map(function (l) {
        return '<button type="button" data-set-lang="' + l.code + '">' + l.short + '</button>';
      }).join('');
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set-lang]');
      if (!b) return;
      applyLang(b.getAttribute('data-set-lang'));
      var d = b.closest('.lang'); if (d) d.classList.remove('open');
      closeDrawer();
    });
  }

  function initLangDropdown() {
    $$('.lang').forEach(function (box) {
      var btn = $('.lang__btn', box);
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = box.classList.contains('open');
        $$('.lang').forEach(function (o) { o.classList.remove('open'); });
        box.classList.toggle('open', !wasOpen);
        btn.setAttribute('aria-expanded', String(!wasOpen));
      });
    });
    document.addEventListener('click', function () {
      $$('.lang').forEach(function (o) { o.classList.remove('open'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $$('.lang').forEach(function (o) { o.classList.remove('open'); });
    });
  }

  function openDrawer() {
    var d = $('#drawer'); if (!d) return;
    d.classList.add('open'); document.body.classList.add('is-locked');
  }
  function closeDrawer() {
    var d = $('#drawer'); if (!d) return;
    d.classList.remove('open'); document.body.classList.remove('is-locked');
  }
  function initDrawer() {
    $$('[data-drawer-open]').forEach(function (b) { b.addEventListener('click', openDrawer); });
    $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', closeDrawer); });
    var d = $('#drawer');
    if (d) $$('a', d).forEach(function (a) { a.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  }

  /* ── 3. Header scroll state + back to top ─────────────── */
  function initHeader() {
    var hdr = $('.hdr');
    var top = $('.to-top');
    if (!hdr && !top) return;
    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      if (hdr) hdr.classList.toggle('is-stuck', y > 30);
      if (top) top.classList.toggle('on', y > 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ── 4. Reveal on scroll ──────────────────────────────── */
  var io;
  function observe(root) {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal', root).forEach(function (el) { el.classList.add('in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    }
    $$('.reveal:not(.in)', root).forEach(function (el) { io.observe(el); });
  }

  /* Safety net: probe the observer with a sentinel. If it never reports back,
     the page is not being observed at all — show everything rather than
     leaving the visitor with a blank page. */
  function revealFallback() {
    if (!('IntersectionObserver' in window)) return;
    var alive = false;
    var probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;pointer-events:none;opacity:0';
    document.body.appendChild(probe);
    var pio = new IntersectionObserver(function () { alive = true; pio.disconnect(); probe.remove(); });
    pio.observe(probe);
    setTimeout(function () {
      if (alive) return;
      try { pio.disconnect(); probe.remove(); } catch (e) {}
      $$('.reveal').forEach(function (el) { el.classList.add('in'); });
    }, 1600);
  }

  /* ── 5. Hero slider ───────────────────────────────────── */
  function initHero() {
    var hero = $('.hero'); if (!hero) return;
    var slides = $$('.hero__slide', hero);
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add('on'); return; }

    var dotsBox = $('.hero__dots', hero);
    var counter = $('.hero__count', hero);
    var i = 0, timer = null, DUR = 7000;

    dotsBox.innerHTML = slides.map(function (_, n) {
      return '<button type="button" aria-label="' + (n + 1) + '"><i></i></button>';
    }).join('');
    var dots = $$('button', dotsBox);

    function pad(n) { return (n < 9 ? '0' : '') + (n + 1); }

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      dots.forEach(function (d, k) {
        d.setAttribute('aria-current', k === i ? 'true' : 'false');
        var bar = d.firstElementChild;
        bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      });
      if (counter) counter.textContent = pad(i) + ' / ' + pad(slides.length - 1);
    }
    function next() { show(i + 1); }
    function start() { stop(); timer = setInterval(next, DUR); }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); start(); }); });
    var pv = $('[data-hero-prev]', hero), nx = $('[data-hero-next]', hero);
    if (pv) pv.addEventListener('click', function () { show(i - 1); start(); });
    if (nx) nx.addEventListener('click', function () { show(i + 1); start(); });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    var x0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(i + (dx < 0 ? 1 : -1));
      x0 = null; start();
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(i + 1); start(); }
      if (e.key === 'ArrowLeft')  { show(i - 1); start(); }
    });

    show(0); start();
  }

  /* ── 6. Catalogue ─────────────────────────────────────── */
  function cardHTML(p, base, delay) {
    var img = base + 'assets/img/product/' + p.img + '.jpg';
    return '' +
      '<a class="card reveal" href="#" data-product="' + p.id + '"' + (delay ? ' data-d="' + delay + '"' : '') + '>' +
        '<span class="card__media">' +
          (p.tag === 'new' ? '<span class="card__tag card__tag--brass" data-i18n="tag.new"></span>' : '') +
          '<img src="' + img + '" alt="" loading="lazy" decoding="async" width="900" height="1200">' +
          '<span class="card__quick" data-i18n="cta.quick"></span>' +
        '</span>' +
        '<span class="card__body">' +
          '<span class="card__cat" data-i18n="cat.' + p.cat + '"></span>' +
          '<span class="card__name" data-i18n="p.' + p.id + '"></span>' +
          '<span class="card__price" data-i18n="price.request"></span>' +
        '</span>' +
      '</a>';
  }

  function initCatalogue() {
    var grid = $('[data-grid]'); if (!grid) return;
    var base = document.body.getAttribute('data-base') || '';
    var all = window.MORO_PRODUCTS;
    var only = grid.getAttribute('data-featured');
    var list = only ? window.MORO_FEATURED.map(function (id) {
      return all.filter(function (p) { return p.id === id; })[0];
    }).filter(Boolean) : all;

    function paint(items) {
      grid.innerHTML = items.map(function (p, n) { return cardHTML(p, base, (n % 4) + 1); }).join('');
      translate(grid);
      observe(grid);
      var c = $('[data-count]');
      if (c) c.textContent = items.length;
    }
    paint(list);

    var filters = $('[data-filters]');
    if (filters) {
      filters.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-filter]'); if (!b) return;
        $$('button[data-filter]', filters).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        var f = b.getAttribute('data-filter');
        paint(f === 'all' ? list : list.filter(function (p) { return p.cat === f; }));
      });
    }

    document.addEventListener('moro:lang', function () { translate(grid); });

    /* quick view */
    grid.addEventListener('click', function (e) {
      var a = e.target.closest('[data-product]'); if (!a) return;
      e.preventDefault();
      openModal(parseInt(a.getAttribute('data-product'), 10), base);
    });
  }

  function openModal(id, base) {
    var modal = $('#qv'); if (!modal) return;
    var p = window.MORO_PRODUCTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    $('[data-qv-img]', modal).src = base + 'assets/img/product/' + p.img + '.jpg';
    $('[data-qv-name]', modal).setAttribute('data-i18n', 'p.' + p.id);
    $('[data-qv-cat]', modal).setAttribute('data-i18n', 'cat.' + p.cat);
    $('[data-qv-material]', modal).textContent = p.material;
    translate(modal);
    modal.classList.add('open');
    document.body.classList.add('is-locked');
  }
  function initModal() {
    var modal = $('#qv'); if (!modal) return;
    function close() { modal.classList.remove('open'); document.body.classList.remove('is-locked'); }
    $$('[data-qv-close]', modal).forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('moro:lang', function () { translate(modal); });
  }

  /* ── 7. Forms ─────────────────────────────────────────── */
  function toast(msg) {
    var el = $('#toast'); if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('on'); }, 4200);
  }

  function initForms() {
    var nf = $('[data-newsletter]');
    if (nf) nf.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('input[type="email"]', nf);
      var out = $('[data-news-msg]', nf);
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      if (out) out.textContent = ok ? t('news.ok') : t('news.err');
      if (ok) { nf.reset(); toast(t('news.ok')); }
    });

    var cf = $('[data-contact]');
    if (cf) cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#f-name', cf), mail = $('#f-email', cf), msg = $('#f-msg', cf);
      var valid = name.value.trim() && msg.value.trim() &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim());
      if (!valid) { toast(t('form.err')); return; }
      cf.reset();
      toast(t('form.ok'));
    });
  }

  /* ── 8. Boot ──────────────────────────────────────────── */
  function boot() {
    buildLangMenus();
    initLangDropdown();
    initDrawer();
    applyLang(pickLang(), false);
    initHeader();
    initHero();
    initCatalogue();
    initModal();
    initForms();
    observe(document);
    revealFallback();

    var page = document.body.getAttribute('data-page');
    $$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === page) a.setAttribute('aria-current', 'page');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
