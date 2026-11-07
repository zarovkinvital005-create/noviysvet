// ===== Слайд 3: «Почему Новый Свет» — живые диаграммы =====
// Все цифры ниже — ПРИМЕРНЫЕ. Замените их реальными данными компании.
(function () {
  const DATA = {
    // Цена «Нового Света» относительно средней цены рынка (1 = цена рынка)
    price: [
      { k: 'Токарные станки', v: 0.84 },
      { k: 'Фрезерные станки', v: 0.87 },
      { k: 'Обрабатывающие центры', v: 0.82 },
      { k: 'Шлифовальные станки', v: 0.88 }
    ],
    // Сроки, месяцев. Шкала индикатора — от 0 до max
    time: { max: 8, our: 3, market: [4, 7],
      rows: [
        { k: 'Из наличия', v: 'до 1 месяца', c: '#E8FF1F' },
        { k: 'Под заказ', v: '1–5 месяцев', c: '#C9D2FF' },
        { k: 'В среднем по рынку', v: '3–7 месяцев', c: '#FFB37A' }
      ] },
    partners: 27,      // заводов-партнёров
    categories: 12,    // категорий оборудования (шкала до 20)
    // Моделей в каталоге по категориям + среднее у конкурентов
    choice: { avg: 5, cols: [
      { k: 'Ток.', full: 'Токарные и многозадачные центры', v: 34 },
      { k: 'Фрез.', full: 'Вертикальные фрезерные центры', v: 24 },
      { k: 'Гор.', full: 'Горизонтальные фрезерные центры', v: 9 },
      { k: '5 осей', full: '5-осевые центры', v: 4 },
      { k: 'Порт.', full: 'Портальные и расточно-фрезерные', v: 7 }
    ] },
    // Станки на складе
    stock: { total: 34,
      split: [ { k: 'CN', v: .55 }, { k: 'KR', v: .45 } ],
      rows: [
        { k: 'Токарные', v: 14, trend: [6, 8, 9, 11, 13, 14] },
        { k: 'Фрезерные', v: 12, trend: [8, 8, 10, 10, 11, 12] },
        { k: 'Обрабатывающие центры', v: 8, trend: [3, 4, 5, 6, 7, 8] }
      ] }
  };

  const root = document.getElementById('bento');
  if (!root) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const ease = t => 1 - Math.pow(1 - t, 3);
  const q = s => root.querySelector(s);
  const chart = n => root.querySelector(`[data-chart="${n}"]`);

  // ---------- подсказка ----------
  const tip = document.getElementById('btip');
  function showTip(x, y, title, rows) {
    tip.innerHTML = `<div class="t">${title}</div>` + rows.map(([k, v]) => `<div class="r"><span>${k}</span><b>${v}</b></div>`).join('');
    tip.classList.add('on');
    const r = tip.getBoundingClientRect();
    let L = x + 16, T = y - r.height - 12;
    if (L + r.width > innerWidth - 8) L = x - r.width - 16;
    if (T < 8) T = y + 16;
    tip.style.left = L + 'px'; tip.style.top = T + 'px';
  }
  const hideTip = () => tip.classList.remove('on');

  // ---------- точечное число (как на табло) ----------
  const GL = {
    '0': ['01110','10001','10011','10101','11001','10001','01110'], '1': ['00100','01100','00100','00100','00100','00100','01110'],
    '2': ['01110','10001','00001','00010','00100','01000','11111'], '3': ['11111','00010','00100','00010','00001','10001','01110'],
    '4': ['00010','00110','01010','10010','11111','00010','00010'], '5': ['11111','10000','11110','00001','00001','10001','01110'],
    '6': ['00110','01000','10000','11110','10001','10001','01110'], '7': ['11111','00001','00010','00100','01000','01000','01000'],
    '8': ['01110','10001','10001','01110','10001','10001','01110'], '9': ['01110','10001','10001','01111','00001','00010','01100'],
    '%': ['11000','11001','00010','00100','01000','10011','00011'], '−': ['000','000','000','111','000','000','000']
  };
  function dotNumber(host, pitch) {
    const cols = 30, svg = document.createElementNS(NS, 'svg'), cells = [];
    host.appendChild(svg);
    for (let c = 0; c < cols; c++) for (let r = 0; r < 7; r++) {
      const ci = document.createElementNS(NS, 'circle');
      ci.setAttribute('cx', c * pitch + pitch / 2); ci.setAttribute('cy', r * pitch + pitch / 2);
      ci.setAttribute('r', pitch * .36); ci.setAttribute('fill', '#fff'); ci.setAttribute('opacity', 0);
      ci.style.transitionDelay = (c * 8) + 'ms';
      svg.appendChild(ci); cells.push([c, r, ci]);
    }
    const set = t => {
      const on = new Set(); let x = 0;
      for (const ch of t) { const g = GL[ch]; if (!g) continue; const w = g[0].length;
        for (let r = 0; r < 7; r++) for (let k = 0; k < w; k++) if (g[r][k] === '1') on.add((x + k) * 8 + r);
        x += w + 1; }
      const used = Math.max(1, x - 1);
      for (const [c, r, ci] of cells) { const v = on.has(c * 8 + r);
        ci.setAttribute('opacity', v ? 1 : (c < used ? .1 : 0)); ci.style.transform = v ? 'none' : 'scale(.55)'; }
      svg.setAttribute('width', used * pitch); svg.setAttribute('height', 7 * pitch);
      svg.setAttribute('viewBox', `0 0 ${used * pitch} ${7 * pitch}`);
    };
    set('−0%');
    return { count(to, dur = 1100) {
      const t0 = performance.now(); let last = '';
      const f = now => { const t = reduce ? 1 : Math.min(1, (now - t0) / dur);
        const s = '−' + Math.round(to * ease(t)) + '%'; if (s !== last) { set(s); last = s; }
        if (t < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    } };
  }

  function countUp(node, to, dur = 1100) {
    const suf = node.dataset.suffix || '', t0 = performance.now();
    const f = now => { const t = reduce ? 1 : Math.min(1, (now - t0) / dur);
      node.textContent = Math.round(to * ease(t)) + suf; if (t < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }

  // ---------- 1. Цены ----------
  const avgCut = Math.round(DATA.price.reduce((a, p) => a + (1 - p.v), 0) / DATA.price.length * 100);
  const dn = dotNumber(q('[data-dot="price"]'), innerWidth < 520 ? 5.6 : 8);
  const pb = chart('price');
  pb.innerHTML = DATA.price.map((p, i) => `
    <div class="pb" data-i="${i}">
      <span class="pb__k">${p.k}</span>
      <div class="pb__track"><i class="pb__mkt" style="transition-delay:${i * 90}ms"></i><i class="pb__our" style="--w:${p.v * 100}%;transition-delay:${200 + i * 110}ms"></i></div>
      <span class="bchip"><b>−${Math.round((1 - p.v) * 100)}%</b></span>
    </div>`).join('');
  pb.querySelectorAll('.pb').forEach(row => {
    const p = DATA.price[+row.dataset.i];
    row.addEventListener('pointermove', e => showTip(e.clientX, e.clientY, p.k,
      [['Средняя цена рынка', '100%'], ['Новый Свет', Math.round(p.v * 100) + '%'], ['Экономия', '−' + Math.round((1 - p.v) * 100) + '%']]));
    row.addEventListener('pointerleave', hideTip);
  });

  // ---------- 2. Сроки: полукруглая шкала ----------
  function drawGauge() {
    const T = DATA.time, svg = chart('gauge'), n = 56;
    const P = (r, a) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];
    let s = '';
    for (let i = 0; i <= n; i++) {
      const f = i / n, d = f * T.max, a = 180 + f * 180;
      const our = d <= T.our, mkt = d >= T.market[0] && d <= T.market[1];
      const col = our ? '#C9D2FF' : mkt ? '#FFB37A' : 'rgba(255,255,255,.22)';
      const [x1, y1] = P(136, a), [x2, y2] = P(i % 7 === 0 ? 110 : 118, a);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="3.2" stroke-linecap="round" style="--d:${i * 12}ms"/>`;
    }
    s += `<text y="-26" text-anchor="middle" font-family="Urbanist" font-weight="200" font-size="58" fill="#fff" letter-spacing="-2" class="g-num">0</text>
          <text y="-2" text-anchor="middle" font-size="12.5" font-weight="500" fill="rgba(255,255,255,.45)" font-family="Urbanist">мес. · под заказ</text>`;
    svg.innerHTML = s;
    chart('glist').innerHTML = T.rows.map(r => `<div class="gr"><i style="background:${r.c}"></i><span>${r.k}</span><b>${r.v}</b></div>`).join('');
  }
  drawGauge();

  // ---------- KPI: шкала-тики ----------
  function drawTicks(svg, frac, n = 36) {
    const W = svg.getBoundingClientRect().width || 220;
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = 1 + i * (W - 2) / (n - 1), on = i / (n - 1) <= frac;
      s += `<line x1="${x}" x2="${x}" y1="${i % 6 === 0 ? 2 : 8}" y2="20" stroke="${on ? '#E8FF1F' : 'rgba(255,255,255,.25)'}" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    svg.innerHTML = s;
  }

  // ---------- 3. Выбор: колонки-капсулы ----------
  function drawCols(animate) {
    const C = DATA.choice, card = root.querySelector('.b-choice'), svg = chart('cols');
    const head = card.querySelector('.bc__row');
    const W = card.clientWidth - 36, H = card.clientHeight - head.offsetHeight - 62, pb = 22, n = C.cols.length;
    const max = Math.ceil(Math.max(...C.cols.map(c => c.v)) / 10) * 10 + 10;
    const L = 30, bw = Math.min(40, (W - L) / n * 0.5), gap = (W - L - bw * n) / (n - 1 || 1);
    const Y = v => (H - pb) * (1 - v / max);
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let s = '';
    [0, max / 2, max].forEach(t => s += `<text x="0" y="${Y(t) + 4}" font-size="10" fill="rgba(255,255,255,.45)" font-family="Geist Mono">${t}</text>`);
    C.cols.forEach((c, i) => {
      const X = L + i * (bw + gap), top = i === 0;
      s += `<rect x="${X}" y="${Y(max)}" width="${bw}" height="${H - pb - Y(max)}" rx="${bw / 2}" fill="rgba(0,0,0,.24)"/>
        <rect class="cb" x="${X}" y="${animate ? H - pb : Y(c.v)}" width="${bw}" height="${animate ? 0 : H - pb - Y(c.v)}" rx="${bw / 2}" fill="${top ? '#E8FF1F' : '#fff'}" data-y="${Y(c.v)}" data-h="${H - pb - Y(c.v)}" style="transition-delay:${i * 80}ms"/>
        <text x="${X + bw / 2}" y="${H - 4}" text-anchor="middle" font-size="10.5" fill="rgba(255,255,255,.75)" font-family="Geist Mono">${c.k}</text>
        <rect class="hitc" x="${X - gap / 2}" y="0" width="${bw + gap}" height="${H}" fill="transparent" data-i="${i}"/>`;
    });
    const ya = Y(C.avg);
    s += `<line x1="${L - 6}" x2="${W}" y1="${ya}" y2="${ya}" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 5" opacity=".85"/>`;
    const lg = card.querySelector('[data-avg]'); if (lg) lg.textContent = '~' + C.avg;
    svg.innerHTML = s;
    svg.querySelectorAll('.hitc').forEach(h => {
      const c = C.cols[+h.dataset.i];
      h.addEventListener('pointermove', e => showTip(e.clientX, e.clientY, c.full, [['Линеек у нас', c.v], ['В среднем у конкурентов', '~' + C.avg], ['Выбор больше', '×' + (c.v / C.avg).toFixed(1)]]));
      h.addEventListener('pointerleave', hideTip);
    });
    if (animate) requestAnimationFrame(() => requestAnimationFrame(() =>
      svg.querySelectorAll('.cb').forEach(b => { b.setAttribute('y', b.dataset.y); b.setAttribute('height', b.dataset.h); })));
  }

  // ---------- 4. Наличие ----------
  function drawStock() {
    const S = DATA.stock, tones = ['rgba(255,255,255,.95)', 'rgba(255,255,255,.65)', 'rgba(255,255,255,.4)', 'rgba(255,255,255,.22)'];
    chart('segbar').innerHTML = `<div class="sb">${S.split.map((p, i) => `<div style="flex:0 0 calc(${p.v * 100}% - 2px);background:${tones[i]};transition-delay:${.1 + i * .1}s"></div>`).join('')}</div>
      <div class="sl">${S.split.map(p => `<span style="flex:0 0 calc(${p.v * 100}% - 2px)">${p.k} ${Math.round(p.v * 100)}%</span>`).join('')}</div>`;
    const spark = t => { const W = 92, H = 28, lo = Math.min(...t), hi = Math.max(...t), Yv = v => H - 4 - (v - lo) / (hi - lo || 1) * (H - 8);
      const pts = t.map((v, i) => [2 + i / (t.length - 1) * (W - 8), Yv(v)]), e = pts[pts.length - 1];
      const d = 'M' + pts.map(p => p.join(',')).join(' L');
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="ln" d="${d}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${e[0]}" cy="${e[1]}" r="3" fill="#E8FF1F" stroke="rgba(0,0,0,.35)"/></svg>`; };
    chart('slist').innerHTML = S.rows.map(r => `<div class="sr"><div><b>${r.k}</b><small>за 6 мес.</small></div>${spark(r.trend)}<span class="cnt">${r.v} шт.</span></div>`).join('');
  }
  drawStock();

  // ---------- запуск при появлении на экране ----------
  let started = false;
  function start() {
    if (started) return; started = true;
    root.classList.add('in');
    root.querySelectorAll('.bc').forEach((c, i) => c.style.transitionDelay = (i * 70) + 'ms');
    dn.count(avgCut);
    countUp(root.querySelector('.g-num'), DATA.time.our);
    countUp(q('[data-count="partners"]'), DATA.partners);
    countUp(q('[data-count="categories"]'), DATA.categories);
    countUp(q('[data-count="stock"]'), DATA.stock.total);
    drawTicks(chart('ticks-cat'), DATA.categories / 20);
    drawCols(true);
  }
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { start(); o.disconnect(); } }, { threshold: 0.15 }).observe(root);

  let rz;
  new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => {
    if (!started) return; drawCols(false); drawTicks(chart('ticks-cat'), DATA.categories / 20);
  }, 120); }).observe(root);
})();
