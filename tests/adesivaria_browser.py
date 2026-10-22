"""Optional browser audit. Run Vite on 5174 with this branch's API proxied.
Requires Python Playwright and local Chrome; uses a temporary browser profile.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

OUT=Path(__file__).resolve().parents[1]/'artifacts/adesivaria'
OUT.mkdir(parents=True,exist_ok=True)
REPORT={}


def open_page(browser,width,height,live=False,reduced=False):
    page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference')
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    if not live:page.route('**/api/**',lambda route:route.fulfill(status=503,content_type='application/json',body='{}'))
    page.goto('http://127.0.0.1:5174/',wait_until='networkidle')
    if width<901:page.get_by_role('button',name='Abrir menu',exact=True).click()
    page.get_by_role('navigation').get_by_role('button',name='Adesivaria',exact=True).click()
    if live:expect(page.locator('.ar-provenance>span')).to_have_text('ACERVO CONSULTADO',timeout=45000)
    page.locator('.candidate-round-sticker').first.wait_for(state='visible',timeout=45000)
    expect(page.locator('.ar-coverage')).to_be_visible(timeout=45000)
    return page,errors


with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--disable-webgl'])
    for label,w,h in [('desktop',1440,1000),('mobile',390,844)]:
        page,errors=open_page(browser,w,h)
        expect(page.locator('.sticker-real')).to_have_count(3)
        expect(page.locator('.candidate-round-sticker')).to_have_count(2)
        assert page.locator('.sticker-real').first.evaluate('(e)=>getComputedStyle(e).borderRadius')=='50%'
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(OUT/f'after-{label}.png'),full_page=True)
        page.locator('.ar-sticker-materials').screenshot(path=str(OUT/f'after-{label}-materials.png'))
        page.locator('.ar-podium').screenshot(path=str(OUT/f'after-{label}-podium.png'))
        # Original sticker reverse works with pointer and keyboard.
        sticker=page.locator('.candidate-round-sticker').first
        sticker.focus();page.keyboard.press('Enter')
        expect(sticker).to_have_attribute('aria-pressed','true')
        page.wait_for_timeout(700)
        page.locator('.ar-podium').screenshot(path=str(OUT/f'after-{label}-reverse.png'))
        # Modal focus, exact classified vs campaign-total amounts, original ledger.
        page.locator('.ar-sticker-entry .candidate-sticker-open').first.click()
        expect(page.locator('.ar-dialog')).to_be_visible()
        expect(page.locator('.ar-candidate-totals>div').first).to_contain_text('42.500,00')
        expect(page.locator('.ar-candidate-totals>div').last).to_contain_text('500.637,00')
        expect(page.locator('.ar-ledger li')).to_have_count(1)
        page.locator('.ar-dialog').screenshot(path=str(OUT/f'after-{label}-candidate.png'))
        page.keyboard.press('Escape');expect(page.locator('.ar-dialog')).to_have_count(0)
        # Rankings have independent page controls and global leaders stay stable.
        first_podium=page.locator('.ar-sticker-caption').all_text_contents()
        page.get_by_role('navigation',name='Páginas de votos',exact=True).get_by_role('button',name='PRÓXIMOS').click()
        expect(page.locator('.ar-votes .ar-rank-position').first).to_have_text('13')
        assert page.locator('.ar-sticker-caption').all_text_contents()==first_podium
        # Filters: code-based municipality, state, party, material and year.
        page.get_by_label('Abrangência',exact=True).select_option('municipio')
        expect(page.locator('.ar-state')).to_contain_text('ESCOLHA UM MUNICÍPIO')
        page.get_by_label('Buscar município',exact=True).fill('2304400')
        page.get_by_label('Município',exact=True).select_option('2304400')
        expect(page.locator('.ar-provenance')).to_contain_text('Fortaleza / CE')
        expect(page.locator('.ar-votes .ar-rank-row')).to_have_count(4)
        page.get_by_role('button',name='Selecionar Santinhos',exact=True).click()
        expect(page.get_by_role('button',name='Selecionar Santinhos',exact=True)).to_have_attribute('aria-pressed','true')
        page.get_by_role('button',name='Selecionar Bandeiras',exact=True).click()
        expect(page.locator('.ar-podium')).to_contain_text('Nenhuma candidatura com valor')
        page.get_by_role('button',name='VER O CONJUNTO CLASSIFICADO',exact=True).click()
        page.get_by_label('Partido',exact=True).fill('INEXISTENTE')
        expect(page.locator('.ar-coverage')).to_contain_text('Não informado')
        page.get_by_label('Partido',exact=True).fill('')
        page.get_by_label('Ano eleitoral',exact=True).select_option('2020')
        expect(page.locator('.ar-votes .ar-rank-row')).to_have_count(0)
        # Existing archive and finance links receive the right candidacy.
        page.get_by_label('Ano eleitoral',exact=True).select_option('2024')
        page.locator('.ar-sticker-entry .candidate-sticker-open').first.click()
        page.get_by_role('button',name='FICHA NO ARQUIVO',exact=False).click()
        expect(page.get_by_label('Procurar candidatura, município, sigla ou número')).to_have_value('PRISCILA COSTA')
        expect(page.locator('.site-header nav button.active')).to_have_text('Arquivo')
        if w<901:page.get_by_role('button',name='Abrir menu',exact=True).click()
        page.get_by_role('navigation').get_by_role('button',name='Adesivaria',exact=True).click()
        page.locator('.ar-sticker-entry .candidate-sticker-open').first.click()
        page.get_by_role('button',name='PRESTAÇÃO DE CONTAS',exact=False).click()
        expect(page.locator('.site-header nav button.active')).to_have_text('Campanhas')
        assert not errors,errors
        REPORT[label]={'passed':True,'errors':errors,'horizontal_overflow':False,'checks':['original circular stickers','reverse by keyboard','modal and Escape','exact expenses vs campaign total','ledger','independent pagination','municipality code','party','material','year','archive link','finance link']}
        page.close()
    page,errors=open_page(browser,390,844,reduced=True)
    expect(page.locator('.ar-motion input')).to_be_disabled()
    expect(page.locator('.ar-motion input')).not_to_be_checked()
    page.locator('.candidate-round-sticker').first.click()
    assert page.locator('.candidate-sticker-front').first.evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
    REPORT['reduced_motion']={'passed':True,'webgl':'disabled'};page.close()
    # Connected integration: no mocked electoral data.
    page,errors=open_page(browser,1440,1000,live=True)
    expect(page.locator('.ar-coverage>div').first).to_contain_text('84.953',timeout=45000)
    page.locator('.ar-sticker-materials').screenshot(path=str(OUT/'after-live-materials.png'))
    page.locator('.ar-podium').screenshot(path=str(OUT/'after-live-podium.png'))
    page.get_by_label('Abrangência',exact=True).select_option('estado')
    expect(page.locator('.ar-coverage>div').first).to_contain_text('12.223',timeout=45000)
    page.get_by_label('Abrangência',exact=True).select_option('municipio')
    expect(page.locator('[aria-label="Município"] option')).to_have_count(185,timeout=30000)
    page.get_by_label('Buscar município',exact=True).fill('Fortaleza')
    page.get_by_label('Município',exact=True).select_option('2304400')
    expect(page.locator('.ar-coverage>div').first).to_contain_text('771',timeout=45000)
    page.locator('.ar-versus').screenshot(path=str(OUT/'after-live-rankings.png'))
    page.locator('.ar-sticker-entry .candidate-sticker-open').first.click()
    expect(page.locator('.ar-ledger li').first).to_be_visible(timeout=45000)
    page.locator('.ar-dialog').screenshot(path=str(OUT/'after-live-candidate.png'))
    page.keyboard.press('Escape')
    page.get_by_role('button',name='Selecionar Santinhos',exact=True).click()
    expect(page.locator('.ar-coverage>div').last).to_contain_text('Santinhos',timeout=45000)
    page.locator('.ar-method summary').click()
    expect(page.locator('.ar-categories-table tbody tr')).to_have_count(25,timeout=45000)
    previous=page.locator('.ar-categories-table tbody tr').first.inner_text()
    page.get_by_role('navigation',name='Páginas de descrições incluídas',exact=True).get_by_role('button',name='PRÓXIMOS').click()
    expect(page.locator('.ar-categories-table tbody tr').first).not_to_have_text(previous,timeout=45000)
    page.get_by_label('Abrangência',exact=True).select_option('estado')
    page.get_by_label('Ano eleitoral',exact=True).select_option('2022')
    page.get_by_label('Cargo',exact=True).select_option('DEPUTADO FEDERAL')
    expect(page.locator('.ar-coverage>div').first).to_contain_text('414',timeout=45000)
    assert all('Fortaleza' not in text for text in page.locator('.ar-sticker-caption').all_text_contents())
    # Failure never silently becomes an offline ranking.
    page.route('**/api/adesivaria?**',lambda route:route.fulfill(status=503,content_type='application/json',body='{}'))
    page.get_by_label('Estado',exact=True).select_option('RJ')
    expect(page.locator('.ar-state')).to_contain_text('NÃO FOI POSSÍVEL',timeout=30000)
    expect(page.locator('.ar-provenance>span')).to_have_text('ACERVO CONSULTADO')
    page.get_by_role('button',name='USAR AMOSTRA OFFLINE',exact=True).click()
    expect(page.locator('.ar-provenance>span')).to_contain_text('AMOSTRA OFFLINE')
    assert not errors,errors
    REPORT['live']={'passed':True,'errors':errors,'checks':['six states 84953','CE 12223','CE municipalities 184','Fortaleza 771','candidate ledger','category pagination','2022 federal CE 414','no federal municipal attribution','error state','explicit offline fallback']}
    browser.close()
(OUT/'browser-validation.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(REPORT,ensure_ascii=True,indent=2))
