#!/usr/bin/env python3
"""D138: the login. Nobody plays without it; the demo account (a pedestrian) sees only Secret Cultist; a driver gets the
expansion's key from Supabase and sees everything; "Sair" forgets both. Supabase is answered by invented samples (no
network in tests): the token in tests/fixtures/source/auth_token_inventado.json, and the key from the DLC_KEY env."""
import json, os, pathlib
from playwright.sync_api import sync_playwright
import cov

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOKEN = json.loads((ROOT / 'tests/fixtures/source/auth_token_inventado.json').read_text())
KEY = os.environ['DLC_KEY']
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*'}
calls = []


def supabase(r):
    url, body = r.request.url, r.request.post_data or ''
    calls.append(url)
    if r.request.method == 'OPTIONS':
        return r.fulfill(status=200, headers={**CORS, 'access-control-allow-methods': 'GET,POST'})
    if '/auth/v1/token' in url:
        d = json.loads(body)
        if d['password'] == 'caiu':
            return r.abort()
        if d['password'] == 'quebrou':
            return r.fulfill(status=500, content_type='application/json', body='{}', headers=CORS)
        if d['password'] == 'estranho':
            return r.fulfill(status=200, content_type='application/json', body='{"ok": true}', headers=CORS)
        if d['password'] == 'errada':
            return r.fulfill(status=400, content_type='application/json', body='{"error":"invalid_grant"}', headers=CORS)
        role = 'pedestrian' if d['email'].startswith('visitante') else 'driver'
        t = {**TOKEN, 'user': {**TOKEN['user'], 'email': d['email'], 'app_metadata': {**TOKEN['user']['app_metadata'], 'role': role}}}
        return r.fulfill(status=200, content_type='application/json', body=json.dumps(t), headers=CORS)
    if '/rest/v1/game_secrets' in url:
        if sum('game_secrets' in c for c in calls) == 1:
            return r.fulfill(status=500, content_type='application/json', body='{}', headers=CORS)   # the first ask fails: logged in, no expansion
        ok = r.request.headers.get('authorization') == 'Bearer ' + TOKEN['access_token']
        return r.fulfill(status=200, content_type='application/json', body=json.dumps([{'value': KEY}] if ok else []), headers=CORS)
    if '/auth/v1/logout' in url:
        if sum('/auth/v1/logout' in c for c in calls) == 1:
            return r.abort()   # the first time Supabase is out: leaving works anyway
        return r.fulfill(status=204, headers=CORS)
    r.fulfill(status=404, headers=CORS)


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, color_scheme='dark')
    ctx.route('https://ydzqrfkcsrochzwegrig.supabase.co/**', supabase)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    cov.start(pg)
    pg.goto((ROOT / 'dist/index.html').as_uri()); pg.wait_for_function('window.__APP')
    assert pg.locator('#login').count() == 1 and pg.locator('[data-act=quickgame]').count() == 0, 'no game before logging in'
    assert pg.locator('#user .who').count() == 0
    pg.click('[data-act=login]'); assert 'Preencha' in pg.inner_text('#loginerr')
    pg.fill('#loginemail', 'motorista@exemplo.com'); pg.fill('#loginpass', 'errada'); pg.click('#logingo')
    pg.wait_for_selector('#loginerr'); assert 'errados' in pg.inner_text('#loginerr'), pg.inner_text('#loginerr')
    for pw, says in (('caiu', 'Sem conexão'), ('quebrou', 'respondeu 500'), ('estranho', 'não entende')):
        pg.fill('#loginpass', pw); pg.click('#logingo'); pg.wait_for_timeout(1500); assert says in (pg.text_content('#loginerr') or ''), (pw, pg.text_content('#loginerr'))
    # the demo account: a pedestrian, only Secret Cultist
    pg.click('[data-act=demo]'); pg.wait_for_selector('[data-act=quickgame]')
    assert 'pedestrian' in pg.inner_text('#user').lower() and pg.evaluate('window.__APP.Core.dlcData()') is None
    assert pg.locator('[data-act=region][data-v=brasil]').count() == 0 and not any('game_secrets' in c for c in calls), 'a pedestrian does not even ask for the key'
    pg.screenshot(path=str(ROOT / 'tests/shots/auth-pedestrian.png'))
    cov.reload(pg); pg.wait_for_function('window.__APP'); assert pg.locator('[data-act=quickgame]').count() == 1, 'the session stays on the device'
    pg.click('#user [data-act=logout]'); pg.wait_for_selector('#login'); assert any('/auth/v1/logout' in c for c in calls)
    # a driver: the key comes from Supabase and opens the expansion (when Supabase fails to give it, the game still opens)
    pg.fill('#loginemail', 'motorista@exemplo.com'); pg.fill('#loginpass', 'certa'); pg.click('#logingo'); pg.wait_for_selector('[data-act=quickgame]')
    assert pg.evaluate('window.__APP.Core.dlcData()') is None, 'no key, no expansion'
    pg.click('#user [data-act=logout]'); pg.wait_for_selector('#login')
    pg.fill('#loginemail', 'motorista@exemplo.com'); pg.fill('#loginpass', 'certa'); pg.click('#logingo'); pg.wait_for_selector('[data-act=quickgame]')
    pg.wait_for_function('window.__APP.Core.dlcData() !== null')
    assert 'driver' in pg.inner_text('#user').lower() and pg.locator('[data-act=region][data-v=brasil]').count() == 1 and pg.locator('#dlcon').count() == 1
    cov.reload(pg); pg.wait_for_function('window.__APP'); pg.wait_for_function('window.__APP.Core.dlcData() !== null')   # kept for offline, opened at start
    pg.screenshot(path=str(ROOT / 'tests/shots/auth-driver.png'))
    pg.click('[data-act=logout]'); pg.wait_for_selector('#login')
    assert pg.evaluate("localStorage.getItem('secretcultist.dlc.v1')") is None and pg.evaluate('window.__APP.Core.dlcData()') is None, 'leaving forgets the key'
    assert not errs, errs
    cov.stop(pg, 'auth')
    b.close()
print('auth ok: login obrigatório, erro de senha, visitante pedestrian sem a expansão, driver com a chave do Supabase, sessão guardada, sair')
