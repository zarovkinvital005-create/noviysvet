// ===== Общие скрипты =====
(function () {
  const header = document.querySelector('.header');
  if (header && !header.classList.contains('light')) {
    const onScroll = () => header.classList.toggle('solid', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('open');
      header.classList.add('solid');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Карточка станка
function productCard(p) {
  const specs = Object.entries(p.specs || {}).map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('');
  const img = p.img
    ? `<img src="${p.img}" alt="${p.title}" loading="lazy">`
    : '';
  const codes = { 'Тайвань': 'TW', 'Китай': 'CN', 'Европа': 'EU', 'Корея': 'KR' };
  return `
    <article class="card">
      <div class="card__img ${p.img ? '' : 'card__img--empty'}">
        ${img || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>`}
        <span class="badge ${p.status === 'order' ? 'badge--order' : ''}">${p.status === 'order' ? 'Под заказ' : 'В наличии'}</span>
        <span class="flag">${codes[p.country] || p.country}</span>
      </div>
      <div class="card__body">
        <div class="card__type">${p.type}</div>
        <h3 class="card__title">${p.title}</h3>
        <div style="font-size:14px;color:var(--muted);margin-top:2px">${p.model || ''}</div>
        <ul class="specs">${specs}</ul>
        <div class="card__foot">
          <div class="price"><small>Цена</small>${p.price}</div>
          <a class="btn btn--primary" href="index.html#contacts">Запросить</a>
        </div>
      </div>
    </article>`;
}
