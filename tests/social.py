#!/usr/bin/env python3
"""The person's moves at a table with app players, with motion on (D73): turning a vote in the window after the votes
open, pointing at who an app player should eliminate, and saying "I am liberal" with a proof. The same game every run
(window.__SEED). Opens dist/index.html from the disk, like the other screen tests."""
import json, os, pathlib
from playwright.sync_api import sync_playwright
import cov

ROOT = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, color_scheme='dark')
    ctx.add_init_script("new MutationObserver(() => { if (!window.__KEEP_STORY) document.getElementById('storyok')?.click(); if (!window.__KEEP_ROLL) document.getElementById('rollok')?.click(); }).observe(document, { childList: true, subtree: true })")   # D129, D130: the story and the rolls are closed at once, except where they are tested
    ctx.add_init_script('window.__SEED = 11')
    ctx.add_init_script("window.__AUTH = {email: 'teste@exemplo.com', role: 'driver'}; window.__DLC = " + json.dumps(os.environ['DLC_KEY']))   # D98, D138: logged in as a driver, with the expansion's key
    # D94: the sheets API answers with the recorded sample (no network in tests): every seat gets a sheet and the debate rolls
    SHEET = (ROOT / 'tests/fixtures/source/random-char_eastern-europe_2026-11-03.json').read_text()
    ctx.route('https://cthulhu-char-golang.vercel.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body=SHEET, headers={'access-control-allow-origin': '*'}))
    LORE = (ROOT / 'tests/fixtures/source/lore_abertura_hastur_2026-11-09.json').read_text()
    ctx.route('https://lore-enhancer.vercel.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body=LORE, headers={'access-control-allow-origin': '*'}))   # D137
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    cov.start(pg)
    pg.goto((ROOT / 'dist/index.html').as_uri()); pg.wait_for_function('window.__APP')
    G = lambda: pg.evaluate('window.__APP.S.game')
    # the tutorial (D89): a game with tips, the first one on the roles; reading it moves to the next
    pg.click('[data-act=tutorial]'); pg.wait_for_selector('#tut'); assert G()['tut'] == [] and G()['players'][0]['role'] == 'liberal'
    pg.locator('#tut [data-act=tutok]').click(); assert G()['tut'] == ['role']; pg.screenshot(path=str(ROOT / 'tests/shots/social-tutorial.png'))
    pg.evaluate('window.__APP.S.game = null; localStorage.clear()'); cov.reload(pg); pg.wait_for_function('window.__APP')
    # D116: the person picks the stereotype of their own investigator; only their sheet is asked with it
    asked = []; pg.on('request', lambda q: asked.append(q.url) if 'random-char' in q.url else None)
    pg.click('[data-act=stereoopen]'); pg.click('[data-act=stereo][data-v=HARLEQUIN]')
    assert pg.evaluate('window.__APP.S.stereo') == 'HARLEQUIN' and 'arlequim' in pg.locator('#stereo').inner_text().lower()
    # D120: the horror's weight is picked at home
    pg.click('[data-act=horror][data-v=pulp]'); assert pg.evaluate('window.__APP.S.horror') == 'pulp'
    pg.click('[data-act=horror][data-v=classico]'); assert pg.evaluate('window.__APP.S.horror') is None
    pg.click('[data-act=quickgame]'); pg.wait_for_timeout(200)
    setup = lambda extra: pg.evaluate("(x) => { const A = window.__APP, g = A.S.game; A.ui.think = 600000; g.reveal = g.players.length; for (const p of g.players) p.alive = true; Object.assign(g, x); document.querySelector('#view [data-act]').click(); }", extra)
    me = [i for i, q in enumerate(G()['players']) if not q.get('ai')][0]
    assert sum('stereotype=HARLEQUIN' in u for u in asked) == 1, asked
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
    pg.locator('#phase [data-act=myvote]').first.click(); pg.locator('#phase [data-act=myvote]').first.click()   # D147: the second tap confirms
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
    # D115: each one carries an item, seen on the sheet; stealing one, once a game
    pg.evaluate("(() => { const g = window.__APP.S.game; if (!g.items) { g.items = {}; g.players.forEach((_, i) => g.items[i] = i % 2 ? 'revolver' : 'faca'); } })()")
    j = pg.evaluate('window.__APP.S.game.players.findIndex((p, i) => p.ai && p.alive)')
    pg.locator(f"#players [data-act=sheet][data-i='{j}']").first.dispatch_event('click'); pg.wait_for_selector('#item')
    assert pg.locator('#stealbtn').count() == 1, 'a steal button on another player sheet'
    pg.locator('#sheet [data-act=steal]').dispatch_event('click'); pg.wait_for_timeout(300)
    assert any(e['k'] == 'steal' for e in G()['hist']) and pg.locator('#sheet').count() == 0
    pg.locator(f"#players [data-act=sheet][data-i='{j}']").first.dispatch_event('click'); pg.wait_for_selector('#item')
    assert pg.locator('#stealbtn').count() == 0, 'once a game'
    pg.locator('#sheet [data-act=sheetclose]').dispatch_event('click')
    # D109: "Minha ficha" in the dock: your own sheet, what each skill is for, the strongest marked
    assert pg.locator('#myrole').count() == 1 and 'você' in pg.locator('#myrole').inner_text().lower(), 'D131: your role always on top'
    pg.locator('#mysheet').dispatch_event('click'); pg.wait_for_selector('#myskills')
    assert pg.locator('#myskills li').count() >= 4 and pg.locator('#myskills li.best').count() == 1 and 'mais forte' in pg.locator('#myskills li.best').inner_text().lower()
    pg.screenshot(path=str(ROOT / 'tests/shots/social-mysheet.png'))
    pg.locator('#sheet [data-act=sheetclose]').dispatch_event('click')
    # D126: faith or reason, once a game, on your own sheet as an investigator
    pg.evaluate("(() => { const g = window.__APP.S.game, me = g.players.findIndex(p => !p.ai); g.players[me].role = 'liberal'; g.pack = 'culto'; })()")
    pg.locator('#mysheet').dispatch_event('click'); pg.wait_for_selector('#faith')
    assert pg.locator('#faith [data-act=faith]').count() == 2
    pg.locator('#pray').dispatch_event('click'); pg.wait_for_timeout(300)
    assert any(e['k'] == 'faith' and e['kind'] == 'reza' for e in G()['hist']), 'praying goes on the record'
    pg.locator('#mysheet').dispatch_event('click'); pg.wait_for_selector('#myskills')
    assert pg.locator('#faith').count() == 0, 'once a game'
    pg.locator('#sheet [data-act=sheetclose]').dispatch_event('click')
    pg.evaluate('window.__KEEP_ROLL = true')
    # D132: the person's automatic Psychology on what an app player said is a short note, never a roll that holds the game
    pg.evaluate("(() => { const A = window.__APP, g = A.S.game, me = g.players.findIndex(p => !p.ai), j = g.players.findIndex(p => p.ai), r = { skill: 'Psychology', label: 'Psicologia', val: 60, d: 12, level: 'hard' }; A.ui.frozen = 0; g.hist.push({ k: 'psy', by: me, about: j, roll: r, vs: { ...r, label: 'Persuasão', d: 50, level: 'ok' }, read: true, lie: true }); document.querySelector('#view [data-act]').click(); })()")
    pg.wait_for_function("document.getElementById('toast') && !document.getElementById('toast').hidden && document.getElementById('toast').textContent.includes('Psicologia')", timeout=8000)
    assert not pg.evaluate("[...document.querySelectorAll('.big-roll')].some(e => e.textContent.includes('Psicologia'))"), 'an automatic reading is not shown big'
    # D109, D130: a roll done to the person (an app player tries to steal from them) is shown big, with why, and waits for Seguir
    pg.evaluate("(() => { const A = window.__APP, g = A.S.game, me = g.players.findIndex(p => !p.ai), j = g.players.findIndex(p => p.ai), r = { skill: 'Spot Hidden', label: 'Encontrar', val: 60, d: 12, level: 'hard', mod: 1, tens: [1, 5] }; g.hist.push({ k: 'steal', by: j, from: me, ok: false, got: 'faca', roll: { ...r, label: 'Prestidigitação', d: 70, level: 'fail' }, vs: r }); document.querySelector('#view [data-act]').click(); })()")
    for _ in range(12):   # D117: the rolls before it wait in line; a tap moves on
        if pg.locator('.big-roll .br-tens i.kept').count() == 1: break
        pg.evaluate("document.getElementById('rollok')?.click()"); pg.wait_for_timeout(600)
    assert pg.locator('.big-roll .br-tens i.kept').count() == 1
    assert pg.locator('.big-roll .br-why').count() == 1 and pg.locator('.big-roll #rollok').count() == 1, 'D130: the roll says why it is rolled and waits for Seguir'
    pg.screenshot(path=str(ROOT / 'tests/shots/social-bigroll.png'))
    pg.wait_for_function("(() => { const r = document.querySelector('.big-roll'); if (r) r.querySelector('#rollok').click(); return !r; })()", timeout=15000, polling=300)   # D117: a tap moves on, until the line is done
    pg.evaluate('window.__KEEP_ROLL = false')
    # "Responder depois" (D88): the accused closes the debate and the accusation waits on its card
    pg.evaluate("(a) => { const A = window.__APP, g = A.S.game, me = g.players.findIndex(p => !p.ai); A.ui.frozen = 0; g.hist.push({ k: 'talk', by: a, about: me, say: 'acc', tone: 'firm' }); document.querySelector('#view [data-act]').click(); }", others[1])
    pg.wait_for_selector('[data-act=dopen]'); pg.locator('[data-act=dopen]').first.dispatch_event('click'); pg.wait_for_selector('#debate [data-act=dlater]')
    pg.locator('#debate [data-act=dlater]').dispatch_event('click'); assert pg.locator('#debate').count() == 0 and pg.locator('#defense').count() == 1
    # D99: with the API down, a Secret Cultist game draws its sheets from the ones kept on the device
    assert pg.evaluate("Object.values(JSON.parse(localStorage.getItem('secretcultist.sheets.pool.v1'))).flat().length") >= 1, 'the sheets are kept'
    ctx.unroute('https://cthulhu-char-golang.vercel.app/**'); ctx.route('https://cthulhu-char-golang.vercel.app/**', lambda r: r.fulfill(status=503, body='down'))
    pg.evaluate("(() => { const k = 'secretcultist.v1', v = JSON.parse(localStorage.getItem(k)); v.game = null; localStorage.setItem(k, JSON.stringify(v)); })()"); cov.reload(pg); pg.wait_for_function('window.__APP'); pg.evaluate('window.__DLC = false')
    pg.click('[data-act=quickgame]'); pg.wait_for_function("window.__APP.S.game && window.__APP.S.game.pack === 'culto' && !!window.__APP.S.game.sheets", timeout=15000)
    # D121: a campaign: chapter 1 in a scene, the next chapter keeps the scene and the table
    pg.evaluate("(() => { const k = 'secretcultist.v1', v = JSON.parse(localStorage.getItem(k)); v.game = null; localStorage.setItem(k, JSON.stringify(v)); })()"); cov.reload(pg); pg.wait_for_function('window.__APP'); pg.evaluate('window.__DLC = false')
    pg.evaluate('window.__KEEP_STORY = true')
    pg.click('[data-act=playmode][data-v=campanha]'); pg.click('#quickgame'); pg.wait_for_function('window.__APP.S.game && window.__APP.S.game.campaign && window.__APP.S.game.scene', timeout=10000)
    c1 = G(); assert c1['campaign']['ch'] == 1 and c1['campaign']['scene'] == c1['scene'] and c1['log'][-1].startswith('📜') or any(l.startswith('📜 Capítulo 1') for l in c1['log'])
    pg.wait_for_selector('.narrator', timeout=5000)   # D118: the narrator tells the opening
    assert pg.locator('.narrator .nar-page p').count() >= 1, 'D129: the story takes the whole screen and the game waits'
    assert pg.locator('.narrator .nar-head .nar-title').count() == 1 and pg.locator('.narrator .nar-s').count() >= 2, 'D159: the head of the act, and the lines a sentence at a time'
    pg.locator('.narrator .nar-page').click(position={'x': 5, 'y': 5}); assert pg.locator('.narrator.all').count() == 1, 'D159: a tap shows the whole page, and it stays open'
    pg.click('#storyok'); pg.evaluate('window.__KEEP_STORY = false'); pg.wait_for_selector('.narrator', state='detached', timeout=2000)   # D159: Seguir closes it once the page has left (this suite runs with motion), and the game goes on
    pg.evaluate("(() => { const A = window.__APP, g = A.S.game; A.S.game = A.Core.chronicle({ ...A.Core.chronicle(g), hist: [...g.hist, { k: 'rej', pres: 1, chanc: 2 }] }); document.querySelector('#view [data-act]').click(); })()"); pg.wait_for_timeout(300)
    assert pg.locator('#chron').count() == 1, 'D134: the narrator tells the last move under the seats'
    pg.evaluate('window.__APP.ui.think = 50')
    for _ in range(80):   # D137: the game goes on by itself; at the next move the lore API's line takes the chronicle's place
        if pg.evaluate("(document.getElementById('chron')?.textContent || '').startsWith('Vocês chegam a um teatro')"): break
        pg.evaluate("for (const s of ['#storyok', '#rollok', '#tut [data-act=tutok]', '[data-act=open]', '[data-act=hiderole]', '[data-act=myvote]', '#phase [data-act=nominate]', '[data-act=pdiscard]:not([disabled])', '[data-act=cdiscard]:not([disabled])', '[data-act=say]', '#debate [data-act=dclose]']) { const b = document.querySelector(s); if (b) { b.click(); break; } }")
        pg.wait_for_timeout(250)
    assert pg.evaluate("(document.getElementById('chron')?.textContent || '').startsWith('Vocês chegam a um teatro')"), pg.evaluate("JSON.stringify([window.__APP.S.game.phase, window.__APP.S.game.hist.slice(-3).map(e => e.k), window.__APP.S.game.log.slice(-3), localStorage.getItem('secretcultist.lore.v1')])")
    pg.evaluate("(() => { const g = window.__APP.S.game; g.phase = 'over'; g.winner = 'F'; document.querySelector('#view [data-act]').click(); })()"); pg.wait_for_timeout(300)
    pg.evaluate("(() => { const g = window.__APP.S.game; g.hist.push({ k: 'trap', id: 'febre', rolls: [{ seat: 1, roll: {}, loss: 2, state: 'envenenado' }] }, { k: 'tend', by: 2, to: 1, state: 'envenenado', ok: false, round: 1, roll: {} }, { k: 'npc', god: 'cthulhu' }, { k: 'find', seat: 1, id: 'sinal' }); })()")
    pg.locator('#tab-jogo').dispatch_event('click'); pg.wait_for_timeout(300)
    assert pg.locator('#summary .timeline li.trap').count() >= 1, 'the summary tells the traps, the care and the finds'
    pg.locator('[data-act=nextch]').dispatch_event('click'); pg.wait_for_timeout(500)
    c2 = G(); assert c2['campaign']['ch'] == 2 and c2['scene'] == c1['scene'] and [p['name'] for p in c2['players']] == [p['name'] for p in c1['players']] and c2['campaign']['prev'] == 'F'
    cov.stop(pg, 'social')
    assert not errs, errs
    b.close()
print('social ok: sou liberal com prova, sugerir eliminação com motivo, virar um voto, acusação e réplica em combo, ficha do jogador, responder depois, tutorial')
