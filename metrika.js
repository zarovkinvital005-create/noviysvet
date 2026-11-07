/* Яндекс.Метрика + плашка cookie.
   Счётчик загружается ТОЛЬКО после согласия посетителя.
   Номер счётчика впишите в METRIKA_ID (например 98765432). Пока 0 — плашка показывается, но ничего не грузится. */
(function () {
  var METRIKA_ID = 0;
  var KEY = 'ns_cookie_choice';
  var me = document.currentScript, base = me && me.src ? me.src : location.href;
  var privacy = new URL('privacy.html', base).href;

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function goal(name) { if (METRIKA_ID && window.ym) { try { window.ym(METRIKA_ID, 'reachGoal', name); } catch (e) {} } }

  function loadMetrika() {
    if (!METRIKA_ID || window.__nsYm) return; window.__nsYm = true;
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })
      (window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(METRIKA_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
    track();
  }

  /* цели: клики по контактам, заявке и паспорту станка */
  function track() {
    if (window.__nsGoals) return; window.__nsGoals = true;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a'); if (!a) return;
      var h = (a.getAttribute('href') || '').toLowerCase();
      if (h.indexOf('tel:') === 0) goal('click_phone');
      else if (h.indexOf('mailto:') === 0) goal('click_email');
      else if (h.indexOf('wa.me') > -1 || h.indexOf('whatsapp') > -1) goal('click_whatsapp');
      else if (h.indexOf('t.me') > -1 || h.indexOf('telegram') > -1) goal('click_telegram');
      else if (h.indexOf('max.ru') > -1) goal('click_max');
      else if (h.slice(-4) === '.pdf') goal('download_passport');
      else if (a.classList.contains('ihb') && /Запросить|Оставить заявку|Подобрать/i.test(a.textContent)) goal('click_request');
    }, true);
  }

  function banner() {
    var b = document.createElement('div');
    b.className = 'cookie'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Файлы cookie');
    b.innerHTML = '<p>Мы используем файлы cookie и сервис Яндекс.Метрика, чтобы понимать, как работает сайт, и улучшать его. ' +
      'Подробнее — в <a href="' + privacy + '">политике конфиденциальности</a>.</p>' +
      '<div class="cookie__btns"><button type="button" class="cookie__ok">Принять</button><button type="button" class="cookie__no">Отклонить</button></div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('on'); });
    function close(v) { set(v); b.classList.remove('on'); setTimeout(function () { b.remove(); }, 400); if (v === 'yes') loadMetrika(); }
    b.querySelector('.cookie__ok').onclick = function () { close('yes'); };
    b.querySelector('.cookie__no').onclick = function () { close('no'); };
  }

  function init() { var c = get(); if (c === 'yes') loadMetrika(); else if (c !== 'no') banner(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
