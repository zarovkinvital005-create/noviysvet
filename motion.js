// ===== Слайд 1: бесшовный цикл «наезд → отъезд → наезд …» =====
// video-in.mp4  — камера приближается к рабочей зоне
// video-out.mp4 — камера отъезжает обратно
// Стык in→out почти совпадает по кадру — переключаем быстро.
// Стык out→in (возврат к началу цикла) — мягкий кроссфейд.
(function () {
  const root = document.querySelector('.slide1');
  if (!root) return;
  const vids = [...root.querySelectorAll('.slide1__video')];
  if (vids.length < 2) return;

  // Сколько секунд длится переход ПОСЛЕ каждого ролика
  const FADE = [0.12, 0.9]; // после in → out, после out → in

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // остаётся статичный постер

  let cur = 0, switching = false, visible = true, raf = 0;

  vids.forEach(v => { v.muted = true; v.playsInline = true; });

  function show(v, fade) {
    vids.forEach(x => { x.style.zIndex = x === v ? 3 : 2; });
    v.style.transition = `opacity ${fade}s ease`;
    v.classList.add('is-on');
  }

  function next() {
    switching = true;
    const prev = vids[cur];
    const fade = FADE[cur];
    cur = (cur + 1) % vids.length;
    const v = vids[cur];
    v.currentTime = 0;
    const p = v.play();
    (p && p.then ? p : Promise.resolve()).then(() => {
      show(v, fade);
      setTimeout(() => {
        prev.style.transition = 'none';
        prev.classList.remove('is-on');
        prev.pause();
        switching = false;
      }, fade * 1000 + 60);
    }).catch(() => { switching = false; });
  }

  function check() {
    const v = vids[cur];
    if (!switching && v.duration && v.currentTime >= v.duration - FADE[cur]) next();
  }
  function tick() { check(); raf = requestAnimationFrame(tick); }

  // запасные триггеры, если rAF притормаживается браузером
  vids.forEach((v, i) => {
    v.addEventListener('timeupdate', () => { if (i === cur) check(); });
    v.addEventListener('ended', () => { if (i === cur && !switching) next(); });
  });

  function start() {
    const v = vids[cur];
    const p = v.play();
    if (p && p.then) {
      p.then(() => {
        root.classList.add('is-playing');
        cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
      }).catch(() => { /* автозапуск запрещён — остаётся постер */ });
    }
  }

  // Ставим на паузу, когда слайд не виден — экономим батарею и CPU
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
    else { cancelAnimationFrame(raf); vids.forEach(v => v.pause()); }
  }, { threshold: 0.05 }).observe(root);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); vids.forEach(v => v.pause()); }
    else if (visible) start();
  });
})();
