#!/usr/bin/env python3
"""Генерирует страницы серий (series/<id>.html), список series-pages.js и sitemap.xml.
Запуск из корня сайта:  python3 tools/build_series.py"""
import re, os, sys, html, json
sys.path.insert(0, os.path.dirname(__file__))
from series_data import SERIES

BASE = 'https://zarovkinvital005-create.github.io/noviysvet/'
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)

# --- читаем каталог ---
src = open('catalog-data.js', encoding='utf-8').read()
T = dict(re.findall(r"(\w+) = '([^']+)'", src.split('const rows')[0]))
items = {}
for m in re.finditer(r"\['([\w-]+)', (\w+), (\w+), '([^']*)', '([^']*)', '([^']*)',\s*\{(.*?)\}\]", src, re.S):
    i, typ, ctry, model, title, variants, specs = m.groups()
    sp = re.findall(r"'([^']+)': '([^']+)'", specs)
    items[i] = dict(id=i, type=T[typ], country=T[ctry], model=model, title=title, variants=variants, specs=sp)

e = html.escape
def page(i, s):
    it = items[i]
    url = f'{BASE}series/{i}.html'
    desc = f"{it['model']} — {it['title'].lower()}. Технические характеристики, модификации, подбор и поставка под заказ. DN Solutions, {it['country']}. ООО «Новый Свет», Нижний Новгород."
    head = ''.join(f'<th scope="col">{e(c)}</th>' for c in s['columns'])
    body = ''.join('<tr>' + ''.join((f'<th scope="row">{e(c)}</th>' if k == 0 else f'<td>{e(c)}</td>') for k, c in enumerate(r)) + '</tr>' for r in s['rows'])
    facts = ''.join(f'<li><span>{e(k)}</span><b>{e(v)}</b></li>' for k, v in it['specs'])
    nv = len([v for v in it['variants'].split(',') if v.strip()])
    ld = {"@context": "https://schema.org", "@type": "Product", "name": it['model'], "description": it['title'],
          "brand": {"@type": "Brand", "name": "DN Solutions"}, "category": it['type'], "image": f'{BASE}assets/catalog/{i}.jpg', "url": url}
    arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
    def ihb(href, text, cls):
        return f'<a class="ihb {cls}" href="{href}"><span class="ihb__text">{text}</span><span class="ihb__hover" aria-hidden="true"><span>{text}</span>{arrow}</span><i class="ihb__dot" aria-hidden="true"></i></a>'
    ask = '../index.html?m=' + __import__('urllib.parse').parse.quote(it['model']) + '#contacts'
    hdr = re.search(r'<header class="header[^"]*">.*?</header>', open('catalog.html', encoding='utf-8').read(), re.S).group(0)
    hdr = re.sub(r'href="(index|catalog)\.html', r'href="../\1.html', hdr)
    hdr = hdr.replace('src="assets/', 'src="../assets/')
    ft = re.search(r'<footer class="footer">.*?</footer>', open('catalog.html', encoding='utf-8').read(), re.S).group(0)
    ft = re.sub(r'href="(index|catalog|privacy|consent)\.html', r'href="../\1.html', ft)
    ft = ft.replace('src="assets/', 'src="../assets/')
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(it['model'])} — характеристики и цена — Новый Свет</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0A0D12">
<link rel="icon" href="../assets/favicon-48.png" sizes="48x48" type="image/png">
<link rel="icon" href="../assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
<link rel="manifest" href="../manifest.webmanifest">
<meta property="og:type" content="website"><meta property="og:site_name" content="Новый Свет"><meta property="og:locale" content="ru_RU">
<meta property="og:title" content="{e(it['model'])} — Новый Свет"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{BASE}assets/og/{i}.jpg?v=2"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<link rel="preload" href="../assets/fonts/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../fonts.css">
<link rel="stylesheet" href="../styles.css">
</head>
<body class="series-body">

{hdr}

<section class="page-head sp-head">
  <div class="wrap">
    <nav class="crumbs" aria-label="Навигация"><a href="../index.html">Главная</a><span>/</span><a href="../catalog.html">Каталог</a><span>/</span><span>{e(it['model'])}</span></nav>
    <span class="eyebrow">{e(it['type'])} · DN Solutions</span>
    <h1 class="sp-title">{e(it['model'])}</h1>
    <p class="sp-sub">{e(it['title'])}</p>
  </div>
</section>

<main class="section sp-main">
  <div class="wrap sp-grid">
    <figure class="sp-photo"><img src="../assets/catalog/{i}.jpg" alt="{e(it['model'])}"><span class="badge badge--order">Под заказ</span></figure>
    <div class="sp-info">
      <ul class="specs sp-facts">{facts}</ul>
      <p class="sp-vars"><b>{nv} модификаци{'я' if nv == 1 else ('и' if nv in (2,3,4) else 'й')}:</b> {e(it['variants'])}</p>
      <div class="sp-cta">
        {ihb(ask, 'Запросить цену и сроки', 'ihb--cobalt ihb--solid')}
        <a class="sp-tel" href="tel:+78312141495">или позвоните: +7 (831) 214-14-95</a>
      </div>
    </div>
  </div>
  <div class="wrap">
    <h2 class="sp-h2"><b class="w8">Технические</b> <span class="w2">характеристики</span></h2>
    <div class="sp-table"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>
    <p class="sp-note">{e(s['note'])} Характеристики приведены по данным производителя; точную конфигурацию, цену и срок поставки уточняйте у менеджера.</p>
    <div class="sp-more">{ihb('../catalog.html', 'Весь каталог', 'ihb--dark')}</div>
  </div>
</main>

{ft}
<script src="../main.js"></script>
</body>
</html>
'''

os.makedirs('series', exist_ok=True)
for i, s in SERIES.items():
    assert i in items, i
    open(f'series/{i}.html', 'w', encoding='utf-8').write(page(i, s))
open('series-pages.js', 'w', encoding='utf-8').write('/* Список серий с отдельной страницей (генерируется tools/build_series.py) */\nwindow.SERIES_PAGES = ' + json.dumps(list(SERIES), ensure_ascii=False) + ';\n')

pages = ['', 'catalog.html', 'privacy.html', 'consent.html'] + [f'series/{i}.html' for i in SERIES]
x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for p in pages:
    x += f'  <url><loc>{BASE}{p}</loc><lastmod>2026-11-07</lastmod></url>\n'
open('sitemap.xml', 'w', encoding='utf-8').write(x + '</urlset>\n')
print('страниц серий:', len(SERIES), '| в каталоге позиций:', len(items))
