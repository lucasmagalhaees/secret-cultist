#!/usr/bin/env python3
"""The person's moves at a table with app players, with motion on (D73): turning a vote in the window after the votes
open, pointing at who an app player should eliminate, and saying "I am liberal" with a proof. The same game every run
(window.__SEED). Opens dist/index.html from the disk, like the other screen tests."""
import json, pathlib
from playwright.sync_api import sync_playwright
import cov

ROOT = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, color_scheme='dark')
    ctx.add_init_script('window.__SEED = 11')
    ctx.add_init_script('window.__DLC = true')   # D98: these tests play the historical themes too
    # D94: the sheets API answers with the recorded sample (no network in tests): every seat gets a sheet and the debate rolls
    SHEET = (ROOT / 'tests/fixtures/source/random-char_eastern-europe_2026-11-03.json').read_text()
    ctx.route('https://cthulhu-char-golang.vercel.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body=SHEET, headers={'access-control-allow-origin': '*'}))
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    cov.start(pg)
    pg.goto((ROOT / 'dist/index.html').as_uri()); pg.wait_for_function('window.__APP')
    G = lambda: pg.evaluate('window.__APP.S.game')
    # the tutorial (D89): a game with tips, the first one on the roles; reading it moves to the next
    pg.click('[data-act=tutorial]'); pg.wait_for_selector('#tut'); assert G()['tut'] == [] and G()['players'][0]['role'] == 'liberal'
    pg.locator('#tut [data-act=tutok]').click(); assert G()['tut'] == ['role']; pg.screenshot(path=str(ROOT / 'tests/shots/social-tutorial.png'))
    pg.evaluate('window.__APP.S.game = null; localStorage.clear()'); cov.reload(pg); pg.wait_for_function('window.__APP')
    pg.evaluate('window.__DLC = false')   # D99: the sheets and the dice are only Secret Cultist's, the quick game's theme without the key
    pg.click('[data-act=quickgame]'); pg.wait_for_timeout(200); pg.evaluate('window.__DLC = true')
    setup = lambda extra: pg.evaluate("(x) => { const A = window.__APP, g = A.S.game; A.ui.think = 600000; g.reveal = g.players.length; for (const p of g.players) p.alive = true; Object.assign(g, x); document.querySelector('[data-act]').click(); }", extra)
    me = [i for i, q in enumerate(G()['players']) if not q.get('ai')][0]
    others = [i for i, q in enumerate(G()['players']) if q.get('ai')]

    # "I am liberal" opens the proofs; one proof, and each app player says whether it believes
    setup({'phase': 'nominate', 'pres': others[0], 'chanc': None})
    pg.locator('#selfclaim').dispatch_event('click'); assert pg.locator('#proofs .krow').count() >= 1, 'the proofs open'
    pg.locator('#proofs [data-act=tproof]').first.click()
    h = G()['hist'][-1]; assert h['k'] == 'self' and len(h['re']) == len(others) and pg.locator('#selfclaim[disabled]').count() == 1

    # an app player about to eliminate: the person points at someone, with the reason the record gives
    setup({'phase': 'execute', 'pres': others[0], 'target': None})
    H = pg.locator('[data-act=help]').first; H.dispatch_event('click'); H.dispatch_event('click')
    assert pg.locator('#asknow .krow').count() >= 1, 'who to eliminate, each with its reason'
    pg.locator('#asknow [data-act=tkill]').first.click(); assert G()['hist'][-1]['k'] == 'ask' and G()['hist'][-1]['what'] == 'kill'

    # turning a vote: the votes open, then the window; tap an app player's vote, pick a reason, the count follows
    setup({'phase': 'vote', 'pres': others[0], 'chanc': others[1]})
    pg.evaluate('window.__APP.ui.think = 600000')
    H = pg.locator('[data-act=help]').first; H.dispatch_event('click'); H.dispatch_event('click')
    pg.locator('#phase [data-act=myvote]').first.click()
    pg.wait_for_selector('#sway', timeout=8000); pg.screenshot(path=str(ROOT / 'tests/shots/social-sway.png'))
    assert pg.locator('#sway [data-act=swayskip]').count() == 1, 'the window can be skipped (D74)'
    pg.locator('#ballot .b-seat.tap').first.dispatch_event('click'); pg.wait_for_selector('#swayopts [data-act=swaysay]'); pg.screenshot(path=str(ROOT / 'tests/shots/social-sway-reasons.png'))
    assert pg.locator('#ballot.sway-paused').count() == 1, 'the clock stops once a vote is picked (D93)'
    pg.locator('#swayopts [data-act=swaysay]').first.dispatch_event('click'); pg.wait_for_selector('.sway-res')
    pg.wait_for_function("!document.getElementById('ballot')", timeout=8000)
    log = G()['log']; assert any('mudo meu voto' in l or 'mantenho meu voto' in l for l in log[-6:]) and any(l.startswith('Votos.') for l in log[-6:]), log[-6:]
    # a combo accusation (D81): tap two proofs, the meter shows, "Acusar com tudo" throws both at once
    t3 = others[2]
    setup({'phase': 'nominate', 'pres': others[0], 'chanc': None, 'laws': {'L': 1, 'F': 2}, 'hist': [{'k': 'gov', 'pres': others[1], 'chanc': t3, 'law': 'F', 'pc': 2, 'cc': 1}, {'k': 'gov', 'pres': t3, 'chanc': others[3], 'law': 'F', 'pc': 2, 'cc': 1}]})
    pg.evaluate('window.__APP.ui.frozen = 0'); pg.locator(f'[data-act=court][data-i="{t3}"]').first.dispatch_event('click'); pg.wait_for_selector('#court')
    if pg.locator('#court [data-act=evmore]').count(): pg.locator('#court [data-act=evmore]').click()   # D84: the hints fold away
    for k in range(2): pg.locator('#court [data-act=courtproof]').nth(k).click()
    assert pg.locator('#combo').count() == 1 and 'tudo' in pg.locator('#accuse').inner_text().lower(); pg.screenshot(path=str(ROOT / 'tests/shots/social-combo.png'))
    pg.locator('#accuse').click(); h = [e for e in G()['hist'] if e['k'] == 'talk'][-1]; assert len(h.get('proofs', [])) == 2, h

    # the reply as a combo (D82): mark two arguments with +, answer with all of them
    pg.wait_for_selector('#debate [data-act=dcombo]', timeout=15000)
    if pg.locator('#debate [data-act=dmore]').count(): n0 = pg.locator('#debate .darg-row').count(); pg.locator('#debate [data-act=dmore]').dispatch_event('click'); assert pg.locator('#debate .darg-row').count() > n0, 'the weaker arguments open (D103)'
    pg.locator('#debate [data-act=dcombo]').nth(0).dispatch_event('click'); assert 'com isso' in pg.locator('#dall').inner_text().lower(), 'one marked argument can be said (D99)'
    pg.locator('#debate [data-act=dcombo]').nth(1).dispatch_event('click')
    pg.locator('[data-act=dall]').dispatch_event('click'); pg.wait_for_function("(() => { const t = window.__APP.S.game.hist.filter(e => e.k === 'talk').at(-1); return (t.deb || []).some(l => l.id.includes('+')); })()")
    pg.wait_for_timeout(300); pg.screenshot(path=str(ROOT / 'tests/shots/social-debate-force.png'))
    assert G().get('sheets') and pg.locator('#debate .dice').count() >= 1, 'with the sheets, what is said in the debate is rolled (D94)'
    # a player's sheet (D84): a tap on a name in the players list
    pg.evaluate("document.getElementById('debate')?.remove(); window.__APP.ui.debate = null; window.__APP.ui.frozen = 0")
    pg.evaluate("(() => { const g = window.__APP.S.game, i = g.players.findIndex(p => p.ai); g.hist.push({ k: 'gov', pres: i, chanc: (i + 1) % g.players.length, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: (i + 2) % g.players.length, chanc: i, law: 'L', pc: 1, cc: 0 }, { k: 'inv', by: i, target: (i + 3) % g.players.length, party: 'L', said: 'L' }); })()")
    pg.locator(f"#players [data-act=sheet][data-i='{pg.evaluate('window.__APP.S.game.players.findIndex(p => p.ai)')}']").first.dispatch_event('click'); pg.wait_for_selector('#sheet')
    assert pg.locator('#sheet .sheet-list li').count() >= 3 and pg.locator('#san').count() == 1, 'the sheet lists the governments, the investigation and sanity (D101)'
    assert pg.locator('#sheet .sheet-stats span').count() == 3; pg.screenshot(path=str(ROOT / 'tests/shots/social-sheet.png'))
    pg.locator('#sheet [data-act=sheetclose]').dispatch_event('click'); assert pg.locator('#sheet').count() == 0
    # "Responder depois" (D88): the accused closes the debate and the accusation waits on its card
    pg.evaluate("(a) => { const A = window.__APP, g = A.S.game, me = g.players.findIndex(p => !p.ai); A.ui.frozen = 0; g.hist.push({ k: 'talk', by: a, about: me, say: 'acc', tone: 'firm' }); document.querySelector('[data-act]').click(); }", others[1])
    pg.wait_for_selector('[data-act=dopen]'); pg.locator('[data-act=dopen]').first.dispatch_event('click'); pg.wait_for_selector('#debate [data-act=dlater]')
    pg.locator('#debate [data-act=dlater]').dispatch_event('click'); assert pg.locator('#debate').count() == 0 and pg.locator('#defense').count() == 1
    # D99: with the API down, a Secret Cultist game draws its sheets from the ones kept on the device
    assert pg.evaluate("Object.values(JSON.parse(localStorage.getItem('secretcultist.sheets.pool.v1'))).flat().length") >= 1, 'the sheets are kept'
    ctx.unroute('https://cthulhu-char-golang.vercel.app/**'); ctx.route('https://cthulhu-char-golang.vercel.app/**', lambda r: r.fulfill(status=503, body='down'))
    pg.evaluate("(() => { const k = 'secretcultist.v1', v = JSON.parse(localStorage.getItem(k)); v.game = null; localStorage.setItem(k, JSON.stringify(v)); })()"); cov.reload(pg); pg.wait_for_function('window.__APP'); pg.evaluate('window.__DLC = false')
    pg.click('[data-act=quickgame]'); pg.wait_for_function("window.__APP.S.game && window.__APP.S.game.pack === 'culto' && !!window.__APP.S.game.sheets", timeout=15000)
    cov.stop(pg, 'social')
    assert not errs, errs
    b.close()
print('social ok: sou liberal com prova, sugerir eliminação com motivo, virar um voto, acusação e réplica em combo, ficha do jogador, responder depois, tutorial')
