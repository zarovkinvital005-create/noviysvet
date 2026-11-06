// ===== Моушн-слайды: бесшовный цикл видео =====
// Любая секция с атрибутом data-motion. Внутри — 2+ <video>, они играют по очереди.
//   data-fade="0.12,0.9"  — длительность перехода (сек) ПОСЛЕ каждого ролика
//   data-hold="0,900"     — пауза на последнем кадре (мс) перед переходом
// Слайд 1: наезд → отъезд (быстрая склейка, затем мягкий кроссфейд).
// Слайд 2: один ролик в двух копиях — пауза на финальном кадре и кроссфейд к началу.
// Каждый кадр секция получает событие «motion:time» с долей проигранного ролика.
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // остаются статичные постеры

  document.querySelectorAll('[data-motion]').forEach(root => {
    const vids = [...root.querySelectorAll('video')];
    if (vids.length < 2) return;
    const nums = attr => (root.dataset[attr] || '').split(',').filter(Boolean).map(Number);
    const fadeList = nums('fade'), holdList = nums('hold');
    const FADE = vids.map((_, i) => fadeList[i] ?? 0.6);
    const HOLD = vids.map((_, i) => holdList[i] ?? 0);

    let cur = 0, switching = false, holding = false, pending = false, visible = false, raf = 0, holdTimer = 0;
    vids.forEach(v => { v.muted = true; v.playsInline = true; });

    const emit = t => root.dispatchEvent(new CustomEvent('motion:time', { detail: { t, index: cur } }));

    function show(v, fade) {
      vids.forEach(x => { x.style.zIndex = x === v ? 3 : 2; });
      v.style.transition = `opacity ${fade}s ease`;
      v.classList.add('is-on');
    }

    function next() {
      switching = true; holding = false; pending = false;
      const prev = vids[cur], fade = FADE[cur];
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
      if (switching || holding || !v.duration) return;
      emit(v.currentTime / v.duration);
      if (HOLD[cur] > 0) return; // ждём конца ролика (событие ended)
      if (v.currentTime >= v.duration - FADE[cur]) next();
    }
    function tick() { check(); raf = requestAnimationFrame(tick); }

    vids.forEach((v, i) => {
      v.addEventListener('timeupdate', () => { if (i === cur) check(); });
      v.addEventListener('ended', () => {
        if (i !== cur || switching || holding) return;
        emit(1);
        if (HOLD[cur] > 0) { holding = true; holdTimer = setTimeout(next, HOLD[cur]); }
        else next();
      });
    });

    function start() {
      if (pending) next(); // слайд скрылся во время паузы на последнем кадре
      const p = vids[cur].play();
      if (p && p.then) p.then(() => {
        root.classList.add('is-playing');
        cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
      }).catch(() => { /* автозапуск запрещён — остаётся постер */ });
    }
    function stop() {
      cancelAnimationFrame(raf);
      if (holding) { clearTimeout(holdTimer); holding = false; pending = true; }
      vids.forEach(v => v.pause());
    }

    // Пауза, когда слайд не виден, — экономим батарею и CPU
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0.05 }).observe(root);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (visible) start();
    });
  });
})();
