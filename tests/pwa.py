"""The service worker, end to end: the app opens without a connection and offers a new version when one is published.

Usage: python3 tests/pwa.py   (needs dist/ built: npm run build)
Service workers only run over http(s), so this is the one test that serves dist/ from a local web server instead of
opening the file. Two "publications" are served in turn: the build as it is, and a copy that stands for a later one
(another page, another sw.js).
"""
import http.server, pathlib, re, sys, threading, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cov
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
if not (DIST / 'sw.js').exists():
    sys.exit('falta dist/sw.js: rode  npm run build')

page_a, sw_a = (DIST / 'index.html').read_text(encoding='utf-8'), (DIST / 'sw.js').read_text(encoding='utf-8')
version_a = re.search(r"const VERSION = '([0-9a-f]{12})';", sw_a).group(1)
# a later publication: a page that says so, with another commit stamp, and the sw.js the build would emit for it
page_b = re.sub(r'<meta name="app-commit" content="[^"]*">', '<meta name="app-commit" content="bbbbbbb000000000000000000000000000000000"><meta name="app-test" content="b">', page_a)
sw_b = sw_a.replace(version_a, 'bbbbbbbbbbbb')
page_c, sw_c = page_b.replace('bbbbbbb0', 'ddddddd0'), sw_b.replace('bbbbbbbbbbbb', 'dddddddddddd')        # and one more after that
assert page_b != page_a and sw_b != sw_a and page_c != page_b and sw_c != sw_b
site = {'page': page_a, 'sw': sw_a, 'down': False, 'hits': []}
class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]; site['hits'].append(path)
        if site['down']:
            self.send_response(503); self.end_headers(); return
        body, kind = (site['sw'], 'text/javascript') if path == '/sw.js' else (site['page'], 'text/html; charset=utf-8') if path in ('/', '/index.html') else (None, None)
        if body is None:
            self.send_response(404); self.end_headers(); return
        data = body.encode('utf-8')
        self.send_response(200); self.send_header('Content-Type', kind); self.send_header('Cache-Control', 'public, max-age=0, must-revalidate')
        self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)
    def log_message(self, *a):
        pass

srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}'

fails, n = [], 0

def check(name, cond, detail=''):
    global n
    n += 1
    if not cond:
        fails.append(f'{name}{": " + str(detail) if detail != "" else ""}')

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport=dict(width=393, height=852), locale='pt-BR', timezone_id='America/Sao_Paulo', service_workers='allow')
    ctx.add_init_script("try { localStorage.setItem('secretcultist.sheets.v1', JSON.stringify({ fails: 9, until: 9e15, wait: 3600000 })) } catch (e) {}")   # D95: no call to the sheets API from this test
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())      # the site is real; nothing else is reached
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    cov.start(pg)
    pg.goto(BASE + '/index.html'); pg.wait_for_function('window.__APP && window.__APP.S')
    # D98: without the expansion's key, the public face is Secret Cultist: no Sumo Sacerdote, no Red Leader, no historical themes
    check('the public face is Secret Cultist', pg.locator('.brand').inner_text().strip().lower() == 'secret cultist' and pg.locator('[data-act=pack]').count() <= 1 and not any(w in pg.locator('#view').inner_text() for w in ('Líder Vermelho', 'Liberais x')), pg.locator('.brand').inner_text())

    # first visit: the worker installs, takes the page, and there is nothing to update from
    pg.wait_for_function('navigator.serviceWorker.controller !== null', timeout=15000)
    keys = pg.evaluate('caches.keys()')
    check('the page is kept on the device under this version', f'secret-cultist-page-{version_a}' in keys, keys)
    check('a first install does not announce an update', pg.evaluate('document.getElementById("update").hidden') is True)
    version = pg.inner_text('#version')
    check('the screen says which version this is', re.search(r'Versão [0-9a-f]{7}\.', version) and 'também sem internet' in version, version)
    pg.click('[data-act=checkupdate]'); pg.wait_for_function('!document.getElementById("toast").hidden')
    check('asked by hand with nothing new: says so', 'já está na versão mais recente' in pg.inner_text('#toast'), pg.inner_text('#toast'))

    # no connection at all: the page still opens, from the device
    site['down'] = True; before = len(site['hits'])
    cov.reload(pg); pg.wait_for_function('window.__APP && window.__APP.S')
    check('opens with the site unreachable', pg.title() == 'Secret Cultist' and pg.evaluate('!!document.getElementById("view").textContent'), pg.title())
    check('the page did not come from the network', '/index.html' not in site['hits'][before:] and '/' not in site['hits'][before:], site['hits'][before:])
    stored = pg.evaluate('caches.keys().then(ks => Promise.all(ks.map(k => caches.open(k).then(c => c.keys())))).then(all => all.flat().map(r => r.url))')
    check('the worker keeps the page and nothing else', stored == [BASE + '/'], stored)
    pg.click('[data-act=checkupdate]')
    pg.wait_for_function('document.getElementById("toast").textContent.includes("Sem conexão")')
    check('asked by hand with no connection: says so, and offers nothing', pg.evaluate('document.getElementById("update").hidden') is True)

    # a new version is published while the app is open
    site.update(down=False, page=page_b, sw=sw_b)
    pg.evaluate('document.dispatchEvent(new Event("visibilitychange"))')            # coming back to the app is when it looks for one
    pg.wait_for_function('!document.getElementById("update").hidden', timeout=15000)
    check('the update is announced', 'Saiu uma versão nova' in pg.inner_text('#update'), pg.inner_text('#update'))
    check('and the app in use is still the old one until the person decides', pg.evaluate('document.querySelector("meta[name=app-test]")') is None)
    shot = ROOT / 'tests' / 'shots'; shot.mkdir(exist_ok=True); pg.evaluate('document.getElementById("toast").hidden = true; window.scrollTo(0, 0)'); pg.screenshot(path=str(shot / 's2-versao-nova.png'))
    cov.keep(pg)                                                                     # the page reloads by itself next
    pg.click('[data-act=update]')
    pg.wait_for_function('document.querySelector("meta[name=app-test]") !== null && window.__APP && window.__APP.S', timeout=15000)
    check('after the tap the page is the new version', pg.evaluate('document.querySelector("meta[name=app-commit]").content').startswith('bbbbbbb'))
    check('and the notice is gone', pg.evaluate('document.getElementById("update").hidden') is True)
    pg.wait_for_function('caches.keys().then(k => k.filter(x => x.startsWith("secret-cultist-page-")).length === 1)', timeout=15000)
    keys = pg.evaluate('caches.keys()')
    check('the old copy of the page was thrown away', 'secret-cultist-page-bbbbbbbbbbbb' in keys and f'secret-cultist-page-{version_a}' not in keys, keys)
    check('the screen shows the new version', 'Versão bbbbbbb.' in pg.inner_text('#version'), pg.inner_text('#version'))

    # publishing again without changing the app (same sw.js) asks nothing of anyone
    site['page'] = page_b.replace('bbbbbbb0', 'ccccccc0')
    pg.evaluate('document.dispatchEvent(new Event("visibilitychange"))'); pg.wait_for_timeout(1500)
    check('a publication that does not change the app is not announced', pg.evaluate('document.getElementById("update").hidden') is True)
    cov.stop(pg, 'pwa')

    # a version that was announced and never accepted takes over by itself once the app is closed and opened again
    site.update(page=page_c, sw=sw_c)
    pg.evaluate('document.dispatchEvent(new Event("visibilitychange"))')
    pg.wait_for_function('!document.getElementById("update").hidden', timeout=15000)
    pg.close()
    time.sleep(1)                # nobody reopens an app in the same instant; the browser hands over once the closed page is gone
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/'); pg.wait_for_function('window.__APP && window.__APP.S')
    check('closing the app and opening it again lands on the new version', pg.evaluate('document.querySelector("meta[name=app-commit]").content').startswith('ddddddd'), pg.evaluate('document.querySelector("meta[name=app-commit]").content'))
    check('with nothing left to announce', pg.evaluate('document.getElementById("update").hidden') is True)
    check('no script errors', not errs, errs)
    browser.close()
srv.shutdown()

for f in fails:
    print('FAIL', f)
print(f'{n - len(fails)}/{n} offline and update checks passed')
sys.exit(1 if fails else 0)
