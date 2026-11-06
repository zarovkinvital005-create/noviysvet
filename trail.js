// ===== Дымный след за курсором — как полоса от самолёта =====
// След рисуется ПО ФОНУ блока: холст лежит внутри секции между её фоном и содержимым,
// поэтому текст, кнопки и карточки-«островки» всегда остаются поверх дыма.
// Включается атрибутом data-trail на светлой секции.
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !fine) return;
  const els = [...document.querySelectorAll('[data-trail]')];
  if (!els.length) return;

  // Палитра: фирменный кобальт → небесный → голубая дымка
  const TINTS = [[0, 64, 193], [58, 120, 235], [140, 182, 255], [196, 218, 255]];

  // ---- Спрайты: «пышное облачко» из нескольких размытых пятен ----
  function makeSprite(rgb) {
    const S = 192, c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.7) * S * 0.3;
      const x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d;
      const r = S * (0.09 + Math.random() * 0.17);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${rgb},0.30)`);
      gr.addColorStop(0.5, `rgba(${rgb},0.11)`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    return c;
  }
  const sprites = TINTS.map(t => [makeSprite(t.join(',')), makeSprite(t.join(','))]);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const easeOut = t => 1 - Math.pow(1 - t, 2.2);
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const MAX = 420;

  // ---- По холсту на каждую светлую секцию — позади её содержимого ----
  const zones = els.map(el => {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.isolation = 'isolate'; // z-index:-1 остаётся над фоном секции, но под её содержимым
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:-1;';
    el.insertBefore(cv, el.firstChild);
    const z = { el, cv, ctx: cv.getContext('2d'), w: 0, h: 0, parts: [], last: null, dirty: false };
    const size = () => {
      const r = el.getBoundingClientRect(), k = dpr();
      z.w = r.width; z.h = r.height;
      cv.width = Math.max(1, Math.round(z.w * k)); cv.height = Math.max(1, Math.round(z.h * k));
    };
    size();
    new ResizeObserver(size).observe(el);
    return z;
  });

  function spawn(z, x, y, speed) {
    if (z.parts.length >= MAX) z.parts.shift();
    const q = Math.random(), ti = q < 0.1 ? 0 : q < 0.36 ? 1 : q < 0.72 ? 2 : 3;
    const ang = Math.random() * Math.PI * 2;
    const v = rnd(18, 64) + Math.min(speed, 2200) * 0.016;
    z.parts.push({
      x: x + rnd(-8, 8), y: y + rnd(-8, 8),
      vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - rnd(0, 8),
      s0: rnd(14, 28), s1: rnd(130, 240),
      life: rnd(1.8, 3.2), age: 0, a0: rnd(0.55, 0.95) * (ti === 0 ? 0.55 : 1),
      rot: rnd(0, Math.PI * 2), vr: rnd(-0.5, 0.5), seed: Math.random() * 100,
      sp: sprites[ti][Math.random() < 0.5 ? 0 : 1]
    });
    z.dirty = true;
  }

  // ---- Курсор ----
  let running = false, raf = 0, prevT = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const hit = e.target && e.target.closest ? e.target.closest('[data-trail]') : null;
    const z = hit && zones.find(q => q.el === hit);
    zones.forEach(q => { if (q !== z) q.last = null; });
    if (!z) return;
    const r = z.el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (z.last) {
      const dx = x - z.last.x, dy = y - z.last.y;
      const dist = Math.hypot(dx, dy), speed = dist / Math.max(1, now - z.last.t) * 1000;
      const n = Math.min(14, Math.floor(dist / 9)); // облачко через каждые ~9px пути — лента без разрывов
      for (let i = 1; i <= n; i++) { const k = i / (n + 1); spawn(z, z.last.x + dx * k, z.last.y + dy * k, speed); }
      if (n >= 1) { z.last.x = x; z.last.y = y; z.last.t = now; } // медленное движение копится до 9px
    } else {
      z.last = { x, y, t: now };
      spawn(z, x, y, 0);
    }
    kick();
  }, { passive: true });
  document.addEventListener('pointerleave', () => zones.forEach(q => { q.last = null; }));

  function kick() { if (!running) { running = true; prevT = performance.now(); raf = requestAnimationFrame(frame); } }

  function frame(now) {
    const dt = Math.min(0.05, (now - prevT) / 1000); prevT = now;
    const k = dpr();
    let alive = false;
    for (const z of zones) {
      if (!z.dirty) continue;
      const { ctx, parts } = z;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, z.w, z.h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        const t = p.age / p.life;
        if (t >= 1) { parts.splice(i, 1); continue; }
        // дрейф, турбулентность и затухание скорости
        p.vx += Math.sin(p.age * 2.1 + p.seed) * 16 * dt;
        p.vy += Math.cos(p.age * 1.7 + p.seed) * 16 * dt - 5 * dt;
        const drag = 1 - 1.6 * dt;
        p.vx *= drag; p.vy *= drag;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const size = p.s0 + (p.s1 - p.s0) * easeOut(t);
        ctx.globalAlpha = p.a0 * Math.min(1, t * 7) * Math.pow(1 - t, 1.6);
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.drawImage(p.sp, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (parts.length) alive = true; else z.dirty = false; // последний кадр уже очистил холст
    }
    if (alive) raf = requestAnimationFrame(frame); else running = false;
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    cancelAnimationFrame(raf); running = false;
    zones.forEach(q => { q.parts.length = 0; q.ctx.setTransform(1, 0, 0, 1, 0, 0); q.ctx.clearRect(0, 0, q.cv.width, q.cv.height); q.dirty = false; });
  });
})();
