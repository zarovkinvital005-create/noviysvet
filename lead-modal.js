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

  window.NSLead = { open: open, close: close };
})();
