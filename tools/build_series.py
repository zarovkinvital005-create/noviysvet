#!/usr/bin/env python3
"""Генерирует страницы серий (series/<id>.html), список series-pages.js и sitemap.xml.
Запуск из корня сайта:  python3 tools/build_series.py"""
import re, os, sys, html, json

def when(eta):
    if not eta: return ''
    m={'январь':'январе','февраль':'феврале','март':'марте','апрель':'апреле','май':'мае','июнь':'июне','июль':'июле','август':'августе','сентябрь':'сентябре','октябрь':'октябре','ноябрь':'ноябре','декабрь':'декабре'}
    g=[]
    for per,_q in eta:
        r=re.match(r'^(.*?)\s+(\d{4})$', per); mon,y=(r.group(1),r.group(2)) if r else (per,'')
        mon=re.sub(r'[а-я]+', lambda x: m.get(x.group(0), x.group(0)), mon)
        if g and g[-1][0]==y: g[-1][1].append(mon)
        else: g.append((y,[mon]))
    return 'в ' + ', '.join(', '.join(ms)+(' '+y if y else '') for y,ms in g)


sys.path.insert(0, os.path.dirname(__file__))
from series_data import SERIES
from stock_items import STOCK_ITEMS

BASE = 'https://zarovkinvital005-create.github.io/noviysvet/'
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)

# --- читаем каталог ---
src = open('catalog-data.js', encoding='utf-8').read()
T = dict(re.findall(r"(\w+) = '([^']+)'", src.split('const rows')[0]))
STOCK = set(re.findall(r"'([\w-]+)'", (re.search(r"const STOCK = new Set\(\[(.*?)\]\)", src) or [None, ''])[1]))
items = {}
for m in re.finditer(r"\['([\w-]+)', (\w+), (\w+), '([^']*)', '([^']*)', '([^']*)',\s*\{(.*?)\}\]", src, re.S):
    i, typ, ctry, model, title, variants, specs = m.groups()
    sp = re.findall(r"'([^']+)': '([^']+)'", specs)
    items[i] = dict(id=i, type=T[typ], country=T[ctry], model=model, title=title, variants=variants, specs=sp)

# --- позиции из списка склада (tools/stock_items.py) ---
TRANSIT = set()
for x in STOCK_ITEMS:
    items[x['id']] = dict(id=x['id'], type=x['type'], country=x['country'], model=x['model'], title=x['title'], variants='', specs=x['specs'],
                          brand=x['brand'], img=x['img'], see=x['see'], cond=x['cond'], status=x['status'], eta=x['eta'])
    if x['status'] == 'stock': STOCK.add(x['id'])
    else: TRANSIT.add(x['id'])
def photo_of(i):
    p = items[i].get('img') or f'assets/catalog/{i}.jpg'
    return p if os.path.exists(p) else ''

def parse_price(s):
    """'133 580 USD, акция 119 000 USD' -> (текущая, старая, примечание)"""
    nums = re.findall(r'(\d[\d ]*\d)\s*(USD|руб\.)', s or '')
    if not nums: return 'По запросу', '', ''
    fmt = lambda n: f"{n[0].strip()} {n[1]}"
    cur, old = (fmt(nums[-1]), fmt(nums[0]) if len(nums) > 1 else '')
    return cur, old, ('с НДС 22%' if nums[-1][1] == 'USD' else '')
for x in STOCK_ITEMS:
    x['price'], x['price_old'], x['price_note'] = parse_price(x['_price'])
    items[x['id']]['price'], items[x['id']]['price_old'], items[x['id']]['price_note'] = x['price'], x['price_old'], x['price_note']

# catalog-stock.js — позиции склада для каталога (цены не публикуем)
def js(v): return json.dumps(v, ensure_ascii=False)
CARD_ETA = {'kr-dvf5000': [['январь', 2]]}
HITS = {'kr-dvf5000'}
DOCS = {'kr-dvf5000': 'assets/docs/dvf5000-passport.pdf'}
rows_js = []
for x in STOCK_ITEMS:
    rows_js.append('  ' + js(dict(id=x['id'], status=x['status'], cond=x['cond'], type=x['type'], country=x['country'], brand=x['brand'], model=x['model'], title=x['title'],
                                   variants='', img=x['img'] if (x['img'] and os.path.exists(x['img'])) else '', price=x['price'], priceOld=x['price_old'], priceNote=x['price_note'], used=x['used'], eta=x['eta'], hit=(x['id'] in HITS), etaCard=CARD_ETA.get(x['id'], []), doc=DOCS.get(x['id'], ''), specs=dict(x['specs']))))
open('catalog-stock.js', 'w', encoding='utf-8').write('/* Станки на складе, в пути и с наработкой (генерируется tools/build_series.py из tools/stock_items.py). Цены на сайте не показываются. */\n(window.CATALOG = window.CATALOG || []).push(\n' + ',\n'.join(rows_js) + '\n);\n')

e = html.escape
def page(i, s):
    it = items[i]
    url = f'{BASE}series/{i}.html'
    desc = f"{it['model']} — {it['title'].lower()}. Технические характеристики, модификации, подбор и поставка под заказ. {it.get('brand') or 'DN Solutions'}, {it['country'] or 'импорт'}. ООО «Новый Свет», Нижний Новгород."
    def table(cols, rows):
        head = ''.join(f'<th scope="col">{e(c)}</th>' for c in cols)
        body = ''.join('<tr>' + ''.join((f'<th scope="row">{e(x)}</th>' if k == 0 else f'<td>{e(x)}</td>') for k, x in enumerate(r)) + '</tr>' for r in rows)
        return f'<div class="sp-table"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'
    if 'sections' in s:
        tables = ''.join(f'<h3 class="sp-h3">{e(sec["title"])}</h3>' + table(sec['columns'], sec['rows']) + (f'<p class="sp-note sp-note--sec">{e(sec["note"])}</p>' if sec.get('note') else '') for sec in s['sections'])
    else:
        tables = table(s['columns'], s['rows'])
    in_stock = i in STOCK
    facts = ''.join(f'<li><span>{e(k)}</span><b>{e(v)}</b></li>' for k, v in it['specs'])
    in_transit = i in TRANSIT
    eta = items[i].get('eta') or []
    if in_transit and eta:
        tot = sum(q for _, q in eta if q)
        facts += '<li class="sp-term"><span>Ближайшее прибытие</span><b>' + e(eta[0][0]) + '</b></li>'
        if tot: facts += '<li><span>Всего ожидается</span><b>' + str(tot) + ' шт.</b></li>'
    if in_transit: facts += '<li><span>Пока оформляем договор</span><b>доставим станок на склад в России — к подписанию он уже будет на месте</b></li>'
    elif in_transit: facts += '<li class="sp-term"><span>Статус</span><b>в наличии</b></li>'
    elif in_stock: facts += '<li class="sp-term"><span>Срок поставки из наличия</span><b>до 1 месяца</b></li>'
    else: facts += '<li class="sp-term"><span>Срок поставки под заказ</span><b>от 1 до 5 месяцев</b></li>'
    used = items[i].get('cond') == 'used'
    pr = items[i].get('price', 'По запросу')
    if pr != 'По запросу':
        old = items[i].get('price_old', ''); note = items[i].get('price_note', '')
        facts += '<li class="sp-price"><span>Цена' + (' (акция)' if old else '') + '</span><b>' + (('<s>' + e(old) + '</s> ') if old else '') + e(pr) + (('<small>' + e(note) + '</small>') if note else '') + '</b></li>'
    nv = len([v for v in it['variants'].split(',') if v.strip()])
    ph = photo_of(i)
    has_photo = bool(ph)
    og_img = f'{BASE}assets/og/{i}.jpg?v=2' if has_photo else f'{BASE}assets/og-image.jpg?v=2'
    ld = {"@context": "https://schema.org", "@type": "Product", "name": it['model'], "description": it['title'],
          "brand": {"@type": "Brand", "name": it.get('brand') or "DN Solutions"}, "category": it['type'], "image": og_img, "url": url}
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
<meta property="og:url" content="{url}"><meta property="og:image" content="{og_img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
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
    <figure class="sp-photo">{('<img src="../' + ph + '" alt="' + e(it['model']) + '">') if has_photo else '<span class="sp-nophoto">Фото уточняйте у менеджера</span>'}<span class="badge{' badge--order' if ((in_transit and eta) or (not in_transit and not in_stock)) else ''}">{('В наличии' + (' ' + when(CARD_ETA.get(i) or eta) if eta else '')) if in_transit else ('В наличии' if in_stock else 'Под заказ')}{' · б/у' if used else ''}</span></figure>
    <div class="sp-info">
      <ul class="specs sp-facts">{facts}</ul>
      {('<p class="sp-vars"><b>' + str(nv) + ' модификаци' + ('я' if nv == 1 else ('и' if nv in (2,3,4) else 'й')) + ':</b> ' + e(it['variants']) + '</p>') if it['variants'] else ''}
      {('<p class="sp-vars">Полные характеристики серии: <a href="' + it['see'] + '.html">открыть страницу серии →</a></p>') if it.get('see') else ''}
      <div class="sp-cta">
        {ihb(ask, 'Запросить цену и сроки', 'ihb--cobalt ihb--solid')}
        <a class="sp-tel" href="tel:+78312141495">или позвоните: +7 (831) 214-14-95</a>
      </div>
    </div>
  </div>
  <div class="wrap">
    <h2 class="sp-h2"><b class="w8">Технические</b> <span class="w2">характеристики</span></h2>
    {tables}
    <p class="sp-note">{e(s['note'])} Характеристики приведены по данным производителя; точную конфигурацию, цену и срок поставки уточняйте у менеджера.</p>
    {('<a class="sp-doc" href="../' + DOCS[i] + '" download target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14"/></svg><span>Паспорт станка (PDF)<small>Спецификация производителя DN Solutions · 9 стр.</small></span></a>') if i in DOCS else ''}
    <div class="sp-more">{ihb('../catalog.html', 'Весь каталог', 'ihb--dark')}</div>
  </div>
</main>

{ft}
<script src="../main.js"></script>
<script src="../metrika.js" defer></script>
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


# --- превью для ссылок (macOS: swift + sips) ---
import subprocess, shutil
if sys.platform == 'darwin' and '--no-og' not in sys.argv:
    jobs = [{"out": "assets/og/catalog.jpg", "title": "Каталог станков", "sub": f"{len(items) - len(STOCK_ITEMS)} серий и станки в наличии: токарные, фрезерные, 5-осевые, портальные центры", "label": "",
             "foot": "Подбор и поставка под заказ из любой страны мира",
             "photos": ["assets/catalog/cn-puma2450.jpg", "assets/catalog/kr-dvf.jpg", "assets/catalog/kr-nhp.jpg", "assets/catalog/cn-dnm4505.jpg"]}]
    for i in SERIES:
        if photo_of(i):
            jobs.append({"out": f"assets/og/{i}.jpg", "title": items[i]['model'], "sub": items[i]['title'], "label": items[i]['type'], "photos": [photo_of(i)]})
    os.makedirs('assets/og', exist_ok=True)
    json.dump(jobs, open('tools/og-jobs.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    subprocess.run(['swift', 'tools/og.swift', 'tools/og-jobs.json', 'assets/logo-white.png'], check=True)
    for j in jobs:
        subprocess.run(['sips', '-z', '630', '1200', j['out']], check=True, stdout=subprocess.DEVNULL)
    print('превью:', len(jobs))
