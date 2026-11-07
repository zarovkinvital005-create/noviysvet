function whenEta(eta){if(!eta||!eta.length)return '';const m={январь:'январе',февраль:'феврале',март:'марте',апрель:'апреле',май:'мае',июнь:'июне',июль:'июле',август:'августе',сентябрь:'сентябре',октябрь:'октябре',ноябрь:'ноябре',декабрь:'декабре'};const g=[];eta.forEach(e=>{const r=/^(.*?)\s+(\d{4})$/.exec(e[0])||[0,e[0],''];const mon=r[1].replace(/[а-я]+/g,w=>m[w]||w);const last=g[g.length-1];if(last&&last.y===r[2])last.m.push(mon);else g.push({y:r[2],m:[mon]});});return 'в '+g.map(x=>x.m.join(', ')+(x.y?' '+x.y:'')).join(', ');}
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
  const page = (window.SERIES_PAGES || []).includes(p.id) ? `series/${p.id}.html` : '';
  return `
    <article class="card">
      <div class="card__img ${p.img ? 'card__img--photo' : 'card__img--empty'}">
        ${img || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>`}
        <span class="badge ${p.status === 'stock' || (p.status === 'transit' && !(p.eta && p.eta.length)) ? '' : 'badge--order'}">${p.status === 'order' ? 'Под заказ' : p.status === 'transit' ? 'В наличии' + (whenEta(p.eta) ? ' ' + whenEta(p.eta) : '') : 'В наличии'}${p.cond === 'used' ? ' · б/у' : ''}</span>
        ${p.country ? `<span class="flag">${codes[p.country] || p.country}</span>` : ''}
      </div>
      <div class="card__body">
        <div class="card__type">${p.type}${p.brand ? ` · ${p.brand}` : ''}</div>
        <h3 class="card__title">${page ? `<a href="${page}">${name}</a>` : name}</h3>
        <p class="card__sub">${p.model ? p.title : ''}</p>
        ${nVar > 1 ? `<p class="card__vars" title="${p.variants}">${nVar} модификаци${nVar % 10 >= 2 && nVar % 10 <= 4 && (nVar < 12 || nVar > 14) ? 'и' : 'й'}: ${p.variants}</p>` : ''}
        <ul class="specs">${specs}${p.status === 'transit' && p.eta && p.eta.length ? `${p.eta.map(e => `<li><span>${e[0].charAt(0).toUpperCase() + e[0].slice(1)}</span><span>${e[1] ? e[1] + ' шт.' : 'оплачен'}</span></li>`).join('')}${p.eta.some(e => e[1]) ? `<li><span>Всего ожидается</span><span>${p.eta.reduce((s, e) => s + (e[1] || 0), 0)} шт.</span></li>` : ''}` : `<li><span>${p.status === 'transit' ? 'Статус' : 'Срок поставки'}</span><span>${p.status === 'order' ? 'от 1 до 5 мес.' : p.status === 'transit' ? 'в наличии' : 'до 1 месяца'}</span></li>`}</ul>
        ${page ? `<a class="card__more" href="${page}">Все характеристики <span aria-hidden="true">→</span></a>` : ''}
        <div class="card__foot">
          <div class="price"><small>${p.priceOld ? 'Цена по акции' : 'Цена'}${p.priceNote ? ` · ${p.priceNote}` : ''}</small>${p.priceOld ? `<s class="price__old">${p.priceOld}</s> ` : ''}${p.price}</div>
          <a class="ihb ihb--cobalt ihb--sm" href="${ask}"><span class="ihb__text">Запросить</span><span class="ihb__hover" aria-hidden="true"><span>Запросить</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><i class="ihb__dot" aria-hidden="true"></i></a>
        </div>
      </div>
    </article>`;
}

/* Фото не на белом фоне (цех, студия, градиент) — растягиваем на всю карточку */
(function () {
  function check(img) {
    const box = img.closest && img.closest('.card__img--photo');
    if (!box || box.dataset.fillChecked || !img.naturalWidth) return;
    box.dataset.fillChecked = '1';
    try {
      const c = document.createElement('canvas'); c.width = c.height = 40;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, 40, 40);
      const spots = [[0, 0], [32, 0]];
      let tot = 0;
      spots.forEach(([sx, sy]) => {
        const d = x.getImageData(sx, sy, 8, 8).data; let s = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
        tot += s / n;
      });
      if (tot / 2 < 205) box.classList.add('card__img--fill');
    } catch (e) {}
  }
  function scan(root) { (root || document).querySelectorAll('.card__img--photo img').forEach(i => { if (i.complete) check(i); else i.addEventListener('load', () => check(i), { once: true }); }); }
  document.addEventListener('DOMContentLoaded', () => {
    scan();
    new MutationObserver(() => scan()).observe(document.body, { childList: true, subtree: true });
  });
})();
