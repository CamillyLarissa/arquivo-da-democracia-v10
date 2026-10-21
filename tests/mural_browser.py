"""Optional visual/interaction audit: python tests/mural_browser.py.

Requires Python Playwright and local Chrome, Vite on 5174 and API on 8001.
Uses an isolated headless Chrome session. No personal browser profile.
"""
import json
import statistics
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/mural'
OUT.mkdir(parents=True,exist_ok=True)
REPORT={}


def open_wall(browser,width,height,live=False,reduce=False):
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce' if reduce else 'no-preference')
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    def api(route):
        if live:
            response=route.fetch(url=route.request.url.replace('127.0.0.1:5174','127.0.0.1:8001'),timeout=90000)
            route.fulfill(response=response)
        else:route.fulfill(status=503,content_type='application/json',body='{}')
    page.route('**/api/**',api)
    page.goto('http://127.0.0.1:5174/',wait_until='networkidle')
    if width<901:page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('navigation').get_by_role('button',name='Partidos',exact=True).click()
    page.locator('.mw-poster').first.wait_for(state='visible',timeout=60000)
    if live:expect(page.locator('.mw-source')).to_have_text('CONSULTA AO ACERVO',timeout=30000)
    page.wait_for_timeout(1000)
    return page,errors


with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--disable-webgl'])
    for label,w,h in [('desktop',1440,1000),('mobile',390,844)]:
        page,errors=open_wall(browser,w,h)
        expect(page.locator('.mw-poster')).to_have_count(18)
        expect(page.locator('.mw-count')).to_contain_text('24 CANDIDATURAS')
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(OUT/f'after-{label}.png'),full_page=True)
        page.locator('.mw-layout').screenshot(path=str(OUT/f'after-{label}-wall.png'))
        durations=[]
        for order in ['gastos','votos']*4:
            durations.append(page.evaluate('''async(order)=>{const start=performance.now();const select=document.querySelector('[aria-label="Ordenar cartazes"]');select.value=order;select.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-start}''',order))
        metrics=page.evaluate('() => ({elements:document.querySelectorAll("*").length,posters:document.querySelectorAll(".mw-poster").length,overflow:document.documentElement.scrollWidth>innerWidth})')
        metrics.update(reorderTwoFramesMs=durations,reorder_two_frames_median_ms=round(statistics.median(durations),1))
        # Pointer selection, visible highlighting, reverse, partial expense ledger.
        page.locator('.mw-poster-open').first.click()
        expect(page.locator('.mw-poster.is-selected')).to_have_count(1)
        page.get_by_role('button',name='VIRAR O PAPEL').click()
        expect(page.locator('.mw-dossier')).to_contain_text('Gasto por voto')
        page.get_by_role('button',name='VER LANÇAMENTOS',exact=True).click()
        expect(page.locator('.mw-ledger')).to_contain_text('Amostra parcial')
        page.locator('.mw-dossier').screenshot(path=str(OUT/f'after-{label}-reverse.png'))
        # Keyboard can select a poster and scroll the wall.
        page.locator('.mw-poster-open').nth(1).focus()
        page.keyboard.press('Enter')
        expect(page.locator('.mw-dossier h3')).to_have_text(page.locator('.mw-poster-name').nth(1).inner_text())
        page.locator('.mw-viewport').focus()
        previous=page.locator('.mw-viewport').evaluate('(el)=>el.scrollTop')
        page.keyboard.press('PageDown')
        assert page.locator('.mw-viewport').evaluate('(el)=>el.scrollTop')>previous
        page.get_by_role('button',name='Restaurar posição e zoom do mural').click()
        # Three selected candidates, cap at three, existing graph and table.
        for index in range(3):page.locator('.mw-poster-compare').nth(index).click()
        expect(page.locator('.mw-comparison-cards article')).to_have_count(3)
        page.locator('.mw-poster-compare').nth(3).click()
        expect(page.locator('.mw-comparison-cards article')).to_have_count(3)
        expect(page.locator('.mw-announcement')).to_contain_text('até três')
        expect(page.locator('.mw-comparison .compare-document')).to_have_count(1)
        page.locator('.mw-comparison').screenshot(path=str(OUT/f'after-{label}-comparison.png'))
        # Grouping changes layout; zoom, grid and exact values remain usable.
        page.get_by_role('button',name='03 Eleitos e não eleitos').click()
        expect(page.locator('.mw-group-label').first).to_contain_text('Eleitos')
        page.get_by_role('button',name='04 Partidos').click()
        assert page.locator('.mw-group-label').count()>1
        page.get_by_role('button',name='05 Materiais de propaganda').click()
        expect(page.locator('.mw-method').last).to_contain_text('parciais')
        page.get_by_role('button',name='Aumentar zoom do mural').click()
        expect(page.get_by_label('Zoom do mural',exact=True)).to_have_text('110%')
        page.get_by_role('button',name='GRADE',exact=True).click()
        expect(page.locator('.mw-grid .mw-poster')).to_have_count(18)
        page.locator('.mw-table summary').click()
        expect(page.locator('.mw-table tbody tr')).to_have_count(18)
        # Page 2 does not recalculate full-filter findings from its six posters.
        before=page.locator('.mw-findings').inner_text()
        page.get_by_role('button',name='MAIS CARTAZES').click()
        expect(page.locator('.mw-poster')).to_have_count(6)
        assert page.locator('.mw-findings').inner_text()==before
        # Real sample filters and empty historical scope.
        page.get_by_label('Estado',exact=True).select_option('CE')
        assert page.locator('.mw-poster').count()<=4
        page.get_by_label('Pesquisar candidaturas').fill('22222')
        expect(page.locator('.mw-poster')).to_have_count(1)
        page.get_by_label('Pesquisar candidaturas').fill('')
        page.get_by_label('Ano eleitoral').select_option('2022')
        expect(page.locator('.mw-poster')).to_have_count(0)
        expect(page.locator('.mw-empty')).to_contain_text('Ausência de dados')
        assert not errors,errors
        metrics.update(errors=errors,checks='selection, reverse, ledger, keyboard, 3-way comparison, grouping, zoom, grid, exact table, pagination, filters, missing data, WebGL disabled')
        (OUT/f'after-{label}.json').write_text(json.dumps(metrics,indent=2),encoding='utf8')
        REPORT[label]=metrics
        page.close()
    page,errors=open_wall(browser,390,844,reduce=True)
    expect(page.locator('.mw-motion input')).to_be_disabled()
    expect(page.locator('.mw-motion input')).not_to_be_checked()
    page.get_by_role('button',name='02 Maiores despesas').click()
    expect(page.locator('.mw-poster')).to_have_count(18)
    page.locator('.mw-layout').screenshot(path=str(OUT/'after-reduced-motion.png'))
    assert not errors,errors
    REPORT['reduced_motion']={'passed':True,'webgl':'disabled'}
    page.close()
    page,errors=open_wall(browser,1440,1000,live=True)
    expect(page.locator('.mw-findings-grid article').first).to_be_visible(timeout=60000)
    expect(page.locator('.mw-count')).to_contain_text('84.953 CANDIDATURAS',timeout=60000)
    page.get_by_label('Estado',exact=True).select_option('CE')
    expect(page.locator('[aria-label="Município"] option')).to_have_count(185,timeout=30000)
    page.get_by_label('Município',exact=True).select_option('2304400')
    expect(page.locator('.mw-count')).not_to_contain_text('CONSULTANDO',timeout=60000)
    page.get_by_label('Resultado',exact=True).select_option('NÃO ELEITO')
    expect(page.locator('.mw-count')).not_to_contain_text('CONSULTANDO',timeout=60000)
    expect(page.locator('.mw-findings-grid article').first).to_be_visible(timeout=60000)
    assert page.locator('.mw-poster').count()==18
    assert all('Não eleitos' in text for text in page.locator('.mw-poster-result').all_text_contents())
    page.get_by_role('button',name='05 Materiais de propaganda').click()
    expect(page.locator('.mw-count')).not_to_contain_text('CONSULTANDO',timeout=60000)
    expect(page.locator('.mw-method').last).to_contain_text('Materiais reconhecidos nos lançamentos',timeout=60000)
    page.locator('.mw-layout').screenshot(path=str(OUT/'after-live-materials.png'))
    page.locator('.mw-findings').screenshot(path=str(OUT/'after-live-findings.png'))
    assert not errors,errors
    REPORT['live']={'passed':True,'scope':'2024 VEREADOR, CE/Fortaleza, NÃO ELEITO','municipalities_CE':184,'count':page.locator('.mw-count').inner_text(),'errors':errors}
    page.route('**/api/candidates?**',lambda route:route.fulfill(status=503,content_type='application/json',body='{}'))
    page.route('**/api/mural/**',lambda route:route.fulfill(status=503,content_type='application/json',body='{}'))
    page.get_by_label('Estado',exact=True).select_option('MA')
    expect(page.locator('.mw-empty')).to_contain_text('Não foi possível consultar',timeout=30000)
    expect(page.locator('.mw-source')).to_have_text('CONSULTA AO ACERVO')
    page.get_by_role('button',name='EXPLORAR AMOSTRA',exact=True).click()
    page.get_by_label('Estado',exact=True).select_option('')
    page.get_by_label('Resultado',exact=True).select_option('')
    expect(page.locator('.mw-source')).to_contain_text('AMOSTRA OFFLINE')
    expect(page.locator('.mw-poster')).to_have_count(18)
    expect(page.locator('.mural-workshop canvas')).to_have_count(0)
    REPORT['error_and_explicit_sample_fallback']={'passed':True}
    browser.close()
(OUT/'browser-validation.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(REPORT,ensure_ascii=True,indent=2))
