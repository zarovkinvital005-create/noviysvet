/* Всплывающая форма заявки: любая кнопка «Оставить заявку / Запросить / Забронировать…» открывает окно на месте. */
(function () {
  'use strict';
  var FORM = 'https://forms.yandex.ru/u/6aeeb2a52c4f89f8d07e1257';
  var PHONE = '+78312141495', PHONE_TXT = '+7 (831) 214-14-95';
  var box, frameHost, chip, lastFocus, curKey = null, embedLoaded = false;

  function build() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'nsl';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Заявка');
    box.hidden = true;
    box.innerHTML =
      '<div class="nsl__bg" data-close></div>' +
      '<div class="nsl__box">' +
        '<button type="button" class="nsl__x" data-close aria-label="Закрыть"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<h2 class="nsl__h">Оставить заявку</h2>' +
        '<p class="nsl__p">Перезвоним в рабочее время и подберём станок под вашу задачу.</p>' +
        '<div class="nsl__chip" hidden></div>' +
        '<div class="nsl__frame"></div>' +
        '<p class="nsl__alt">Быстрее — позвоните: <a href="tel:' + PHONE + '">' + PHONE_TXT + '</a></p>' +
      '</div>';
    document.body.appendChild(box);
    frameHost = box.querySelector('.nsl__frame');
    chip = box.querySelector('.nsl__chip');
    box.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
  }

  function setForm(model, book) {
    var key = (book ? 'b:' : 'q:') + (model || '');
    if (key === curKey && frameHost.firstChild) return;
    curKey = key;
    frameHost.innerHTML = '';
    var q = new URLSearchParams({ iframe: '1' });
    if (model) q.set('model', (book ? 'БРОНЬ: ' : '') + model);
    var fr = document.createElement('iframe');
    fr.src = FORM + '?' + q.toString();
    fr.title = 'Заявка'; fr.setAttribute('frameborder', '0');
    frameHost.appendChild(fr);
    if (!embedLoaded) {
      embedLoaded = true;
      var sc = document.createElement('script'); sc.src = 'https://yastatic.net/s3/frontend/forms/_/embed.js'; sc.async = true; document.body.appendChild(sc);
    }
    if (model) {
      chip.hidden = false;
      chip.innerHTML = '<b></b><span></span>';
      chip.firstChild.textContent = book ? 'Бронь станка' : 'Запрос по станку';
      chip.lastChild.textContent = model;
    } else { chip.hidden = true; chip.innerHTML = ''; }
  }

  function open(model, book) {
    build(); setForm(model, book);
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('nsl-open');
    requestAnimationFrame(function () { box.classList.add('is-on'); });
    var x = box.querySelector('.nsl__x'); if (x) x.focus();
  }
  function close() {
    if (!box || box.hidden) return;
    box.classList.remove('is-on');
    document.documentElement.classList.remove('nsl-open');
    setTimeout(function () { box.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href*="#contacts"]');
    if (!a || a.hasAttribute('data-scroll')) return;
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (u.hash !== '#contacts') return;
    var p = u.pathname.replace(/\/+$/, '');
    var here = location.pathname.replace(/\/+$/, '');
    var isIndex = /(^|\/)index\.html$/.test(p) || p === '' || p === here.replace(/\/[^\/]*$/, '') || p === here;
    if (!isIndex) return;
    var txt = (a.textContent || '').replace(/\s+/g, ' ').trim();
    var model = u.searchParams.get('m'), book = u.searchParams.get('b') === '1';
    // пункты навигации «Контакты» по-прежнему прокручивают к контактам
    if (!model && /^контакты$/i.test(txt)) return;
    e.preventDefault();
    open(model, book);
  });


  /* Нижняя панель связи на телефоне: звонок и мессенджеры */
  (function () {
    var BAR = [
      ['call', 'tel:+78312141495', 'Позвонить', "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z\"/></svg>"],
      ['wa', 'https://wa.me/79202533655', 'WhatsApp', "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z\"/></svg>"],
      ['tg', 'https://t.me/+79202533655', 'Telegram', "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z\"/></svg>"],
      ['max', 'https://max.ru/u/f9LHodD0cOI8SsbL9I9vqXVjg8vl4qCBLKuvCouhfAgyILT3RL8zuoehD-c', 'MAX', '<b>MAX</b>']
    ];

    /* Шапка на компьютере: мессенджеры рядом с телефоном */
    var hc = document.querySelector('.header__cta'), ph = hc && hc.querySelector('.phone');
    if (hc && ph) {
      var hm = document.createElement('div'); hm.className = 'nsl-hm';
      hm.innerHTML = BAR.slice(1).map(function (b) {
        return '<a class="nsl-hm__a nsl-bar__a--' + b[0] + '" href="' + b[1] + '" target="_blank" rel="noopener" title="' + b[2] + '" aria-label="' + b[2] + '"><i>' + b[3] + '</i></a>';
      }).join('');
      hc.insertBefore(hm, ph);
    }
    var bar = document.createElement('nav');
    bar.className = 'nsl-bar'; bar.setAttribute('aria-label', 'Быстрая связь');
    bar.innerHTML = BAR.map(function (b) {
      var ext = b[0] === 'call' ? '' : ' target="_blank" rel="noopener"';
      return '<a class="nsl-bar__a nsl-bar__a--' + b[0] + '" href="' + b[1] + '"' + ext + '><i>' + b[3] + '</i><span>' + b[2] + '</span></a>';
    }).join('');
    document.body.appendChild(bar);
    var first = document.getElementById('slide1');
    function upd() {
      var y = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var show = !first || y > 160;
      var c = document.getElementById('contacts');
      if (c) { var r = c.getBoundingClientRect(); if (r.top < window.innerHeight * 0.5 && r.bottom > 0) show = false; }
      bar.classList.toggle('is-on', show);
    }
    addEventListener('scroll', upd, { passive: true }); addEventListener('touchmove', upd, { passive: true }); addEventListener('resize', upd); addEventListener('pageshow', upd); setInterval(upd, 700); upd();
  })();

  /* Плавающая кнопка «Получить консультацию» (компьютер) */
  (function () {
    var fab = document.createElement('a');
    fab.className = 'nsl-fab'; fab.href = '#contacts';
    fab.innerHTML = '<i><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg></i><span>Получить консультацию</span>';
    document.body.appendChild(fab);
    var first = document.getElementById('slide1');
    function upd() {
      var show = true;
      var c = document.getElementById('contacts');
      if (c) { var r = c.getBoundingClientRect(); if (r.top < window.innerHeight * 0.6 && r.bottom > 0) show = false; }
      fab.classList.toggle('is-on', show);
    }
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); addEventListener('pageshow', upd); setInterval(upd, 700); upd();
  })();

  window.NSLead = { open: open, close: close };
})();
