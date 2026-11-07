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
  const name = p.model || p.title;
  const img = p.img
    ? `<img src="${p.img}" alt="${name}" loading="lazy">`
    : '';
  const codes = { 'Тайвань': 'TW', 'Китай': 'CN', 'Европа': 'EU', 'Корея': 'KR' };
  const nVar = p.variants ? p.variants.split(',').length : 0;
  const ask = `index.html?m=${encodeURIComponent(name)}#contacts`;
  return `
    <article class="card">
      <div class="card__img ${p.img ? 'card__img--photo' : 'card__img--empty'}">
        ${img || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>`}
        <span class="badge ${p.status === 'order' ? 'badge--order' : ''}">${p.status === 'order' ? 'Под заказ' : 'В наличии'}</span>
        <span class="flag">${codes[p.country] || p.country}</span>
      </div>
      <div class="card__body">
        <div class="card__type">${p.type}${p.brand ? ` · ${p.brand}` : ''}</div>
        <h3 class="card__title">${name}</h3>
        <p class="card__sub">${p.model ? p.title : ''}</p>
        ${nVar > 1 ? `<p class="card__vars" title="${p.variants}">${nVar} модификаци${nVar % 10 >= 2 && nVar % 10 <= 4 && (nVar < 12 || nVar > 14) ? 'и' : 'й'}: ${p.variants}</p>` : ''}
        <ul class="specs">${specs}</ul>
        <div class="card__foot">
          <div class="price"><small>Цена</small>${p.price}</div>
          <a class="ihb ihb--cobalt ihb--sm" href="${ask}"><span class="ihb__text">Запросить</span><span class="ihb__hover" aria-hidden="true"><span>Запросить</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><i class="ihb__dot" aria-hidden="true"></i></a>
        </div>
      </div>
    </article>`;
}
