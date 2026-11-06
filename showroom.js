// ===== Шоурум: ряд станков → станок выходит на передний план =====
// Координаты box — в пикселях исходного фото assets/showroom.jpg (1774 × 887).
// Вырезки станков лежат в assets/machines/ и совпадают с box один в один.
// Тексты ниже — временные заглушки, заменяются реальными данными.
(function () {
  const IMG_W = 1774, IMG_H = 887;

  const MACHINES = [
    {
      box: [25, 400, 290, 240], img: 'assets/machines/m1.jpg',
      type: 'Шлифовальные станки', title: 'Шлифовальный станок',
      text: 'Описание станка: назначение, класс точности, для каких деталей подходит.',
      specs: { 'Страна': '—', 'Наличие': 'уточняется', 'Рабочая зона': '—', 'Мощность': '—' },
      catalog: 'Шлифовальные станки'
    },
    {
      box: [280, 320, 250, 340], img: 'assets/machines/m2.jpg',
      type: 'Хонинговальные станки', title: 'Хонинговальный станок',
      text: 'Описание станка: назначение, класс точности, для каких деталей подходит.',
      specs: { 'Страна': '—', 'Наличие': 'уточняется', 'Ø обработки': '—', 'Длина хода': '—' },
      catalog: ''
    },
    {
      box: [515, 310, 360, 380], img: 'assets/machines/m3.jpg',
      type: 'Фрезерные станки', title: 'Фрезерный обрабатывающий центр',
      text: 'Описание станка: назначение, класс точности, для каких деталей подходит.',
      specs: { 'Страна': '—', 'Наличие': 'уточняется', 'Ход X / Y / Z': '—', 'Шпиндель': '—' },
      catalog: 'Фрезерные станки'
    },
    {
      box: [830, 390, 390, 340], img: 'assets/machines/m4.jpg',
      type: 'Токарные станки', title: 'Токарный станок с ЧПУ',
      text: 'Описание станка: назначение, класс точности, для каких деталей подходит.',
      specs: { 'Страна': '—', 'Наличие': 'уточняется', 'Ø над станиной': '—', 'РМЦ': '—' },
      catalog: 'Токарные станки'
    },
    {
      box: [1220, 270, 550, 520], img: 'assets/machines/m5.jpg',
      type: 'Обрабатывающие центры', title: '5-осевой обрабатывающий центр',
      text: 'Описание станка: назначение, класс точности, для каких деталей подходит.',
      specs: { 'Страна': '—', 'Наличие': 'уточняется', 'Оси': '5', 'Стол': '—' },
      catalog: 'Обрабатывающие центры'
    }
  ];

  const scene = document.getElementById('scene');
  if (!scene) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');

  // --- Зоны-станки поверх фото ---
  const spots = MACHINES.map((m, i) => {
    const [x, y, w, h] = m.box;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'spot';
    b.setAttribute('aria-label', `${m.title} — подробнее`);
    b.style.left = (x / IMG_W * 100) + '%';
    b.style.top = (y / IMG_H * 100) + '%';
    b.style.width = (w / IMG_W * 100) + '%';
    b.style.height = (h / IMG_H * 100) + '%';
    b.style.backgroundImage = `url("${m.img}")`;
    b.innerHTML = `<span class="spot__pin"><b>${pad(i + 1)}</b><span>${m.title}</span></span>`;
    b.addEventListener('mouseenter', () => {
      scene.classList.add('has-hot');
      const f = document.activeElement;
      if (f && f !== b && f.classList.contains('spot')) f.blur();
    });
    b.addEventListener('mouseleave', () => scene.classList.remove('has-hot'));
    b.addEventListener('focus', () => scene.classList.add('has-hot'));
    b.addEventListener('blur', () => scene.classList.remove('has-hot'));
    b.addEventListener('click', () => open(i));
    scene.appendChild(b);
    return b;
  });

  // --- Модальное окно ---
  const modal = document.createElement('div');
  modal.className = 'sr-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'sr-title');
  modal.innerHTML = `
    <div class="sr-modal__backdrop"></div>
    <button class="sr-modal__close" type="button" aria-label="Закрыть">
      Закрыть <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>
    </button>
    <div class="sr-modal__grid">
      <div class="sr-stage">
        <div class="sr-figure"><img alt=""></div>
        <div class="sr-floor"></div>
      </div>
      <div class="sr-info">
        <p class="sr-info__num"></p>
        <span class="eyebrow sr-info__type"></span>
        <h3 class="sr-info__title" id="sr-title"></h3>
        <p class="ph sr-info__text"></p>
        <ul class="sr-specs"></ul>
        <div class="sr-info__btns">
          <a class="btn btn--primary" data-act="request" href="#contacts">Запросить цену</a>
          <a class="btn btn--ghost" data-act="catalog" href="catalog.html">В каталог</a>
        </div>
        <div class="sr-nav">
          <button type="button" data-nav="-1" aria-label="Предыдущий станок"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg></button>
          <span class="sr-nav__dots"></span>
          <button type="button" data-nav="1" aria-label="Следующий станок"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const $ = sel => modal.querySelector(sel);
  const figure = $('.sr-figure'), figImg = $('.sr-figure img'), info = $('.sr-info');
  const dots = $('.sr-nav__dots');
  dots.innerHTML = MACHINES.map(() => '<i></i>').join('');

  let current = -1, busy = false, scrollY = 0;

  function fill(i) {
    const m = MACHINES[i];
    figImg.src = m.img;
    figImg.alt = m.title;
    figure.style.aspectRatio = `${m.box[2]} / ${m.box[3]}`;
    $('.sr-info__num').textContent = `${pad(i + 1)} / ${pad(MACHINES.length)}`;
    $('.sr-info__type').textContent = m.type;
    $('.sr-info__title').textContent = m.title;
    $('.sr-info__text').textContent = m.text;
    $('.sr-specs').innerHTML = Object.entries(m.specs).map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('');
    $('[data-act="catalog"]').href = m.catalog ? `catalog.html?type=${encodeURIComponent(m.catalog)}` : 'catalog.html';
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    size();
  }

  // Вписываем станок в сцену окна, сохраняя пропорции вырезки
  function size() {
    if (current < 0) return;
    const [, , w, h] = MACHINES[current].box;
    const stage = $('.sr-stage');
    const maxW = stage.clientWidth;
    const maxH = window.innerHeight * (window.innerWidth <= 860 ? 0.4 : 0.64);
    figure.style.width = Math.min(maxW, maxH * w / h) + 'px';
  }
  window.addEventListener('resize', size);

  // Анимация «вылета» из ряда: из прямоугольника станка в фото — в центр экрана
  function flight(from, to, back) {
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    const s = from.height / to.height;
    const lift = Math.min(90, Math.abs(dy) * 0.25 + 40);
    const turn = dx > 0 ? 22 : -22;
    const start = `translate(${dx}px, ${dy}px) scale(${s}) rotateY(0deg)`;
    const mid = `translate(${dx * 0.4}px, ${dy * 0.4 - lift}px) scale(${(s + 1) / 2 * 1.04}) rotateY(${turn}deg)`;
    const end = 'none';
    const frames = back
      ? [{ transform: end }, { transform: mid, offset: 0.5 }, { transform: start }]
      : [{ transform: start }, { transform: mid, offset: 0.5 }, { transform: end }];
    return figure.animate(frames, {
      duration: back ? 560 : 720,
      easing: back ? 'cubic-bezier(.45,0,.55,1)' : 'cubic-bezier(.22,.85,.3,1)',
      fill: 'forwards'
    });
  }

  function open(i) {
    if (busy) return;
    busy = true;
    current = i;
    scrollY = window.scrollY;
    document.documentElement.classList.add('sr-lock');
    modal.classList.add('is-open');
    fill(i);
    spots[i].classList.add('is-lifted');
    scene.classList.remove('has-hot');
    requestAnimationFrame(() => {
      modal.classList.add('is-shown');
      $('.sr-modal__close').focus({ preventScroll: true });
      if (reduce) { busy = false; return; }
      const a = flight(spots[i].getBoundingClientRect(), figure.getBoundingClientRect(), false);
      a.onfinish = () => { a.cancel(); busy = false; };
    });
  }

  function close() {
    if (busy || current < 0) return;
    busy = true;
    const i = current;
    modal.classList.remove('is-shown');
    const done = () => {
      modal.classList.remove('is-open');
      spots[i].classList.remove('is-lifted');
      document.documentElement.classList.remove('sr-lock');
      window.scrollTo(0, scrollY);
      spots[i].focus({ preventScroll: true });
      current = -1; busy = false;
    };
    if (reduce) return done();
    const a = flight(spots[i].getBoundingClientRect(), figure.getBoundingClientRect(), true);
    a.onfinish = () => { done(); a.cancel(); };
  }

  // Переключение станков внутри окна
  function go(step) {
    if (busy || current < 0) return;
    const next = (current + step + MACHINES.length) % MACHINES.length;
    spots[current].classList.remove('is-lifted');
    spots[next].classList.add('is-lifted');
    if (reduce) { current = next; fill(next); return; }
    busy = true;
    const out = [figure, info].map(el => el.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-step * 40}px)` }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' }));
    out[0].onfinish = () => {
      current = next; fill(next);
      out.forEach(a => a.cancel());
      [figure, info].forEach(el => el.animate(
        [{ opacity: 0, transform: `translateX(${step * 40}px) rotateY(${step * -14}deg)` }, { opacity: 1, transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(.22,.85,.3,1)' }));
      busy = false;
    };
  }

  $('.sr-modal__close').addEventListener('click', close);
  $('.sr-modal__backdrop').addEventListener('click', close);
  modal.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => go(+b.dataset.nav)));
  $('[data-act="request"]').addEventListener('click', e => {
    e.preventDefault();
    close();
    setTimeout(() => document.getElementById('contacts').scrollIntoView({ behavior: 'smooth' }), 600);
  });

  document.addEventListener('keydown', e => {
    if (current < 0) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') { // держим фокус внутри окна
      const f = [...modal.querySelectorAll('button, a')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Свайп в окне на телефоне
  let sx = null;
  modal.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });
})();
