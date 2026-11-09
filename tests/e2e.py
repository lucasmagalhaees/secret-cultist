"""End to end, through the screen, in the browser: a whole game played the way a table would, on a phone-sized window.

Usage: python3 tests/e2e.py [dark|light]   (needs dist/ built: npm run build)
Opens dist/index.html from the disk, with the network blocked: the page must not need anything from outside to work.
Chance is taken out of the way by stacking the roles and the deck through window.__APP.S (invented test data); every
action is still a tap on the screen. Screenshots go to tests/shots/.
"""
import json, os
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cov
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'tests' / 'shots'; SHOTS.mkdir(exist_ok=True)
THEME = sys.argv[1] if len(sys.argv) > 1 else 'dark'
assert THEME in ('dark', 'light'), THEME
KEY = 'secretcultist.v1'
NAMES = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fê', '<b>Gil</b>']

with sync_playwright() as p:
    b = p.chromium.launch()
    # the main run asks for less motion, as a device can: nothing waits for an animation, so every tap acts at once.
    # A short run with motion on, at the end, checks the animations themselves.
    ctx = b.new_context(viewport=dict(width=393, height=852), device_scale_factor=2, color_scheme=THEME, locale='pt-BR', timezone_id='America/Sao_Paulo', has_touch=True, is_mobile=True, reduced_motion='reduce')
    ctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    ctx.add_init_script("new MutationObserver(() => { if (!window.__KEEP_STORY) document.getElementById('storyok')?.click(); if (!window.__KEEP_ROLL) document.getElementById('rollok')?.click(); }).observe(document, { childList: true, subtree: true })")   # D129, D130: the story and the rolls are closed at once, except where they are tested
    ctx.add_init_script('window.__SEED = 7')   # D68: the same game every run, here and in CI
    ctx.add_init_script("window.__AUTH = {email: 'teste@exemplo.com', role: 'driver'}; window.__DLC = " + json.dumps(os.environ['DLC_KEY']))   # D98, D138: logged in as a driver, with the expansion's key
    pg = ctx.new_page(); errs = []
    # D57/D60: an app player may accuse the person at any step, and the debate covers the screen until it is answered;
    # a scripted click answers it first (with the first argument each time) and closes it
    _click = pg.click
    def _settle():
        for _ in range(80):
            if not pg.locator('#debate').count(): return
            if pg.locator('#debate [data-act=dclose]').count(): _click('#debate [data-act=dclose]'); return
            if pg.locator('#debate [data-act=darg]').count(): _click('#debate [data-act=darg] >> nth=0')
            else: pg.wait_for_timeout(100)
    def _safe_click(sel, **kw):
        if '#debate' not in sel: _settle()
        return _click(sel, **kw)
    pg.click = _safe_click
    pg.on('pageerror', lambda e: errs.append(str(e)))
    # D95: the sheets API is unreachable here (no network): its failed calls are the breaker's business, not a script error
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and not any(h in (m.location or {}).get('url', '') for h in ('cthulhu-char-golang', 'lore-enhancer')) else None)
    cov.start(pg)
    pg.goto((ROOT / 'dist' / 'index.html').as_uri()); pg.wait_for_function('window.__APP && window.__APP.S')
    txt = lambda sel: pg.text_content(sel).replace('\xa0', ' ')      # the words in the page; CSS may show them in capitals
    overflow = lambda: pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    # D17: what pops up over the screen lands on the strip under the header, never on the card of the phase
    over_phase = lambda sel: pg.evaluate('''sel => { scrollTo(0, 0); const o = document.querySelector(sel).getBoundingClientRect(), p = document.querySelector('#phase').getBoundingClientRect();
        return !(o.bottom <= p.top || o.top >= p.bottom || o.right <= p.left || o.left >= p.right); }''', sel)
    # the contrast of each vote button, its text against its own background (WCAG: at least 4.5 to 1)
    vote_contrast = lambda: pg.evaluate('''() => [...document.querySelectorAll('.btn.vote')].map(b => {
        const rgb = c => c.match(/[\\d.]+/g).slice(0, 3).map(Number), lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
        const st = getComputedStyle(b), a = lum(st.color), z = lum(st.backgroundColor); return (Math.max(a, z) + .05) / (Math.min(a, z) + .05); })''')
    shot = lambda name: pg.screenshot(path=str(SHOTS / name), full_page=True)
    G = lambda: pg.evaluate('window.__APP.S.game')
    wait = lambda: pg.wait_for_function('window.__APP && window.__APP.S')

    # ---------- the table ----------
    assert pg.locator('#empty').count() == 1 and pg.locator('[data-act=start]').is_disabled(), txt('#view')
    # D18: the home screen is short; the start button says what is missing, and with a name the app fills the table there
    assert 'Faltam 5 para começar' in txt('[data-act=start]') and pg.locator('#fillmin').count() == 0
    assert pg.locator('#ruleslist').count() == 0 and pg.locator('#moreopts').count() == 0 and 'sorteado' in txt('#moresum'), 'the rules and the other choices start closed'
    pg.click('#rulestoggle'); assert pg.locator('#ruleslist li').count() >= 5; pg.click('#rulestoggle'); assert pg.locator('#ruleslist').count() == 0
    # D25: every drawing, in a gallery: each continent, both themes, liberal, member and leader, with the animal's name
    pg.click('#gallerytoggle'); assert pg.locator('.cast figure').count() == 7 * 3 * 3 and pg.locator('#table').count() == 0, 'the gallery has every drawing (3 themes since D96; Brazil too, for a driver, D138)'
    gal = txt('#view'); assert 'aranha' in gal and pg.evaluate('window.__APP.Core.WORDS.vermelho.boss') in gal and 'coala' in gal and 'condor' in gal and 'onça' in gal and overflow() == 0, gal[:300]
    shot(f's0-galeria-{THEME}.png'); pg.click('#galleryback'); assert pg.locator('#table').count() == 1 and pg.locator('.cast').count() == 0
    pg.fill('#name', 'Xu'); pg.press('#name', 'Enter'); assert 'Faltam 4' in txt('[data-act=start]') and 'Completar com 4 da IA' in txt('#fillmin')
    pg.click('#fillmin'); assert pg.locator('#names li').count() == 5 and not pg.locator('[data-act=start]').is_disabled() and 'Começar com 5 jogadores' in txt('[data-act=start]')
    pg.click('#clear'); assert pg.locator('#names li').count() == 5 and 'Toque de novo' in txt('#clear'), 'clearing the table takes two taps'
    pg.click('#clear'); assert pg.locator('#names li').count() == 0 and pg.locator('#clear').count() == 0
    assert pg.locator('#empty').count() == 1
    assert pg.locator('select').count() == 0, 'no select of the system: its list is drawn by the device, with colours of its own'
    pg.click('[data-act=addname]'); assert 'Escreve um nome' in txt('#msg')
    for i, n in enumerate(NAMES):
        pg.fill('#name', n)
        if i % 2: pg.press('#name', 'Enter')
        else: pg.click('[data-act=addname]')
    assert pg.locator('#names li').count() == 7 and pg.locator('#names b b').count() == 0 and '<b>Gil</b>' in txt('#names'), 'names, and markup shown as text'
    pg.fill('#name', 'ana'); pg.click('[data-act=addname]'); assert 'já está na mesa' in txt('#msg')
    pg.locator('#names li', has_text='Fê').locator('[data-act=rmname]').click()
    assert pg.locator('#names li').count() == 6 and 'Começar com 6' in txt('[data-act=start]')
    pg.fill('#name', 'Fê'); pg.click('[data-act=addname]')
    for extra in ('H', 'I', 'J'): pg.fill('#name', extra); pg.click('[data-act=addname]')
    pg.fill('#name', 'K'); pg.click('[data-act=addname]'); assert 'de 5 a 10' in txt('#msg')
    for extra in ('H', 'I', 'J'): pg.click(f'[aria-label="Tirar {extra}"]')
    assert overflow() == 0, 'nothing wider than the phone'
    shot(f's1-mesa-{THEME}.png')

    # the theme: the device's by default, or the one chosen, which stays
    rgb = lambda: [int(v) for v in re.findall(r'\d+', pg.evaluate('getComputedStyle(document.body).backgroundColor'))[:3]]
    dark = lambda: max(rgb()) < 60
    assert dark() == (THEME == 'dark') and pg.locator('[data-act=theme][data-t=auto]').get_attribute('aria-pressed') == 'true', rgb()
    other = 'light' if THEME == 'dark' else 'dark'
    pg.click(f'[data-act=theme][data-t={other}]'); assert dark() == (other == 'dark') and pg.evaluate('document.documentElement.dataset.theme') == other
    cov.reload(pg); wait(); assert dark() == (other == 'dark'), 'the chosen theme stays'
    assert pg.locator('#names li').count() == 7, 'the table is kept on the device'
    pg.click('[data-act=theme][data-t=auto]'); assert dark() == (THEME == 'dark') and pg.evaluate('document.documentElement.dataset.theme') is None
    # the style: the poster by default, or art deco, which stays
    look = lambda: pg.evaluate('document.documentElement.dataset.look')
    assert look() == 'poster' and pg.locator('[data-act=look][data-l=poster]').get_attribute('aria-pressed') == 'true'
    pg.click('[data-act=look][data-l=deco]'); assert look() == 'deco' and dark() == (THEME == 'dark')
    cov.reload(pg); wait(); assert look() == 'deco', 'the chosen style stays'
    shot(f's0-deco-{THEME}.png')
    pg.click('[data-act=look][data-l=poster]'); assert look() == 'poster' and 'look' not in json.loads(pg.evaluate(f'localStorage.getItem("{KEY}")'))
    # sound and vibration: on by default, off when chosen, and that stays
    saved = lambda: json.loads(pg.evaluate(f'localStorage.getItem("{KEY}")'))
    assert pg.locator('[data-act=fx][data-v=on]').get_attribute('aria-pressed') == 'true'
    pg.click('[data-act=fx][data-v=off]'); assert saved().get('quiet') is True and pg.locator('[data-act=fx][data-v=off]').get_attribute('aria-pressed') == 'true'
    pg.click('[data-act=fx][data-v=on]'); assert 'quiet' not in saved()
    # D20: closing a secret when the phone is face down is off unless the person turns it on (lying down fools the sensor)
    assert pg.locator('[data-act=flip][data-v=off]').get_attribute('aria-pressed') == 'true' and 'flip' not in saved()
    pg.click('[data-act=flip][data-v=on]'); assert saved().get('flip') is True and 'tela para baixo' in txt('#fliptext')
    # opened from the disk there is no service worker, and the screen says so
    assert 'não fica guardado' in txt('#version') and pg.locator('[data-act=checkupdate]').count() == 0, txt('#version')

    # ---------- roles, each behind the gate ----------
    pg.click('[data-act=start]')
    g = G(); assert g['phase'] == 'reveal' and len(g['players']) == 7
    for i in range(7):
        assert 'Passe o celular para' in txt('#phase') and pg.locator('#role').count() == 0, 'the role is not on screen before the tap'
        pg.click('[data-act=open]')
        me = G()['players'][i]
        assert pg.locator('#role svg.art').count() == 1, 'the role card shows its illustration'
        assert pg.locator('#role').count() == 1 and {'liberal': 'INVESTIGADOR', 'cultista': 'CULTISTA', 'lider': 'SUMO SACERDOTE'}[me['role']] in txt('#role').upper(), txt('#phase')
        if me['role'] == 'cultista':
            lider = next(p['name'] for p in G()['players'] if p['role'] == 'lider')
            assert lider in txt('#allies .ally.H'), txt('#phase')
            others = [p['name'] for j, p in enumerate(G()['players']) if p['role'] == 'cultista' and j != i]
            assert all(o in txt('#allies .ally.F') for o in others) and lider not in txt('#allies .ally.F'), txt('#allies')
        if i == 0: shot(f's2-papel-{THEME}.png')
        pg.click('[data-act=hiderole]')
    assert G()['phase'] == 'nominate'

    # stack the table so the game below is the same every time: Ana is Sumo Sacerdote, Bia and Caio cultists; Duda presides
    pg.evaluate('''() => { const g = window.__APP.S.game; g.players.forEach((p, i) => { p.role = i === 0 ? 'lider' : i < 3 ? 'cultista' : 'liberal'; }); g.pres = 3; }''')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))')
    cov.reload(pg); wait()
    assert G()['pres'] == 3 and 'Duda' in txt('#phase') and 'Duda' in txt('#status'), 'the game in course comes back after a reload'
    assert pg.locator('#board .slot.new').count() == 0, 'a reload stamps nothing'
    stack = lambda deck: pg.evaluate('(d) => { window.__APP.S.game.deck = d.split(""); }', deck)

    def nominate(i):
        pg.click(f'#phase [data-act=nominate][data-i="{i}"]'); assert G()['phase'] == 'vote'
    def votes(elected):
        pg.click(f'[data-act=elect][data-v="{1 if elected else 0}"]')
    def hand(role, keep):
        """Through the gate, the president or the chancellor throws away a law that is not `keep` if there is one."""
        assert pg.locator('#phase .law').count() == 0 and 'Passe o celular para' in txt('#phase'), 'the laws are not on screen before the tap'
        pg.click('[data-act=open]')
        h = G()['hand']; k = next((j for j, l in enumerate(h) if l != keep), 0)
        assert pg.locator('#phase .law').count() == len(h) and pg.locator(f'[data-act={role}discard]').is_disabled()
        pg.click(f'#phase [data-act=pick][data-k="{k}"]')
    def govern(chanc, law):
        nominate(chanc); votes(True); assert G()['phase'] == 'president', G()['log'][-1]
        hand('p', law); pg.click('[data-act=pdiscard]'); assert G()['phase'] == 'chancellor'
        g0 = G(); hand('c', law); pg.click('[data-act=cdiscard]')
        assert pg.locator('#board .slot.new').count() == (0 if G()['phase'] == 'over' else 1), 'the new law stamps onto the board'
        made = 'relíquia' if G()['laws']['L'] > g0['laws']['L'] else 'página do Necronomicon'   # D115: the laws of Secret Cultist
        who = f"{g0['players'][g0['pres']]['name']} e {g0['players'][g0['chanc']]['name']}"
        assert pg.locator('#decree:not([hidden])').count() == 1 and who in txt('#decree') and made.lower() in txt('#decree').lower(), ('who approved the law, over the screen', txt('#decree'))
        if G()['phase'] != 'over': assert not over_phase('#decree .decree-card'), 'the law that passed shows over the strip at the top, not over the phase'

    # three governments rejected: the top law goes in by itself
    # help for the phase, open and closed
    pg.click('[data-act=help]'); assert 'escolhe quem vai ser o chanceler' in txt('#helptext')
    pg.click('[data-act=help]'); assert pg.locator('#helptext').count() == 0
    # D34: there is no undo button any more
    nominate(4); votes(False)
    assert pg.evaluate('document.getElementById("stamp").hidden') is False and 'Rejeitado' in txt('#stamp'), 'the vote result is stamped on the screen'
    assert not over_phase('#stamp'), 'the stamp lands on the strip at the top, not on the phase'
    assert G()['tracker'] == 1 and pg.locator('#tracker.bump').count() == 1, 'the tracker shakes when it moves'
    assert G()['tracker'] == 1 and G()['pres'] == 4 and 'rejeitado' in txt('#toast')
    nominate(5); votes(False)
    stack('LFFLFFLL')
    nominate(6); votes(False)
    g = G(); assert g['laws'] == {'L': 1, 'F': 0} and g['tracker'] == 0 and g['pres'] == 6 and 'Relíquia aprovada' in txt('#toast'), g['log'][-3:]
    # a government: 3 laws, 2, one enacted
    stack('FFLFFLFFL'); govern(0, 'F')
    assert G()['laws']['F'] == 1 and G()['pres'] == 0 and 'Página do Necronomicon aprovada' in txt('#toast')
    # term limits: the last government cannot come back as chancellor
    assert pg.locator('#phase [data-act=nominate][data-i="0"]').count() == 0 and pg.locator('#phase [data-act=nominate][data-i="6"]').count() == 0 and 'último governo' in txt('#phase')
    assert overflow() == 0; shot(f's3-mesa-de-jogo-{THEME}.png')

    # 2nd cultist law: Ana sees Caio's party
    stack('FFLFFL'); govern(1, 'F'); assert G()['phase'] == 'investigate'
    pg.click('#phase [data-act=investigate][data-i="2"]')
    assert pg.locator('#power-effect.investigate').is_visible() and 'Caio' in txt('#power-effect') and 'cultista' not in txt('#power-effect').lower(), 'public investigation effect keeps the party secret'
    assert pg.locator('#party').count() == 0; pg.click('[data-act=open]'); assert pg.locator('#party svg.art').count() == 1 and 'CULTISTA' in txt('#party').upper() and 'Caio' in txt('#party')
    pg.click('[data-act=endpower]'); assert G()['phase'] == 'nominate' and G()['pres'] == 1
    # 3rd, at a table of 7: Bia calls a special election and makes Edu president; then the order goes on after Bia
    stack('FFLFFL'); govern(3, 'F'); assert G()['phase'] == 'special' and 'eleição especial' in txt('#phase')
    assert pg.locator('#phase [data-act=special][data-i="1"]').count() == 0, 'not the president herself'
    pg.click('#phase [data-act=special][data-i="4"]'); assert G()['pres'] == 4 and G()['back'] == 1 and 'Edu é o próximo presidente' in txt('#toast')
    nominate(6); votes(False); assert G()['pres'] == 2 and G()['back'] is None
    # 4th: Caio eliminates Gil (Fê went back in at the end of the table)
    stack('FFLFFL'); govern(4, 'F'); assert G()['phase'] == 'execute'
    assert pg.locator('[data-act=execute]').is_disabled()
    pg.click('#phase [data-act=pickp][data-i="5"]'); assert 'Eliminar <b>Gil</b>' in txt('[data-act=execute]')
    pg.click('[data-act=execute]'); assert 'Gil' in pg.text_content('#flash') and 'Eliminado' in pg.text_content('#flash') and pg.locator('#flash b b').count() == 0 and pg.locator('#power-effect.execute').count() == 0, 'one elimination screen, not two (D42)'
    assert G()['players'][5]['alive'] is False and '<b>Gil</b> foi eliminado' in txt('#toast') and pg.locator('#players li.dead').count() == 1
    # 5th: Duda eliminates Bia
    stack('FFLFFL'); govern(6, 'F'); assert G()['phase'] == 'execute' and G()['laws']['F'] == 5
    # D46: the border glows from the danger zone on, by law; the new phase comes in under its headline
    assert pg.evaluate('document.documentElement.dataset.tension') == '5' and pg.locator('#phase[data-head="Poder"]').count() == 1
    pg.click('#phase [data-act=pickp][data-i="1"]'); pg.click('[data-act=execute]'); assert G()['pres'] == 4

    # veto: refused, then the chancellor must enact one
    stack('LLFLLF'); nominate(2); votes(True)
    hand('p', 'L'); pg.click('[data-act=pdiscard]')
    pg.click('[data-act=open]'); pg.click('[data-act=askveto]'); assert G()['phase'] == 'veto' and 'quer vetar' in txt('#phase')
    pg.click('[data-act=veto][data-v="0"]'); assert G()['phase'] == 'chancellor' and 'Veto recusado' in txt('#toast')
    hand('c', 'L'); assert pg.locator('[data-act=askveto]').count() == 0 and 'recusou o veto' in txt('#phase')
    pg.click('[data-act=cdiscard]'); assert G()['laws'] == {'L': 2, 'F': 5} and G()['pres'] == 6
    # veto: accepted, and it counts as a failed government
    stack('LLFLLF'); nominate(3); votes(True)
    hand('p', 'L'); pg.click('[data-act=pdiscard]'); pg.click('[data-act=open]'); pg.click('[data-act=askveto]')
    pg.click('[data-act=veto][data-v="1"]'); assert G()['tracker'] == 1 and G()['laws'] == {'L': 2, 'F': 5} and 'Veto aceito' in txt('#toast')

    # Sumo Sacerdote elected chancellor with 3 or more cultist laws: the cultists win
    assert G()['pres'] == 0; nominate(2); votes(False); assert G()['pres'] == 2
    nominate(0); votes(True)
    g = G(); assert g['phase'] == 'over' and g['winner'] == 'F' and 'cultistas venceram' in txt('#phase')
    # D85: the end waits for the elimination screen, so the confetti comes a beat later: wait for it, do not race it
    pg.wait_for_function("document.querySelectorAll('#confetti i').length > 0", timeout=8000)
    assert pg.locator('#confetti i').count() > 0 and pg.locator('#phase .cheer svg.art').count() == 1, 'confetti and the winners cheering'
    assert pg.locator('#players .role').count() == 7 and 'Sumo Sacerdote' in txt('#players'), 'the roles are shown at the end'
    # D18: the end in tabs: the result first, the whole game and the record one tap away
    assert pg.get_attribute('#tab-res', 'aria-selected') == 'true' and pg.locator('#summary').count() == 0 and pg.locator('#log').count() == 0
    pg.click('#tab-jogo'); assert pg.locator('#summary').count() == 1 and pg.locator('#players').count() == 0
    assert 'Ana investigou Caio: era cultista' in ' '.join(txt('#summary').split()), txt('#summary')
    assert 'eliminou' in txt('#summary') and 'rejeitados' in txt('#summary') and 'Caos' in txt('#summary') and 'vetaram' in txt('#summary'), txt('#summary')
    pg.click('#tab-log'); assert pg.locator('#log li').count() > 10 and pg.locator('#log .round h4').count() > 2 and 'Rodada' in txt('#log .round h4'); pg.click('#tab-res')
    # D19: the good and bad plays of each person, only with the assistance on
    assert pg.locator('.card.review').count() == 0 and pg.locator('#reviewon').count() == 1, 'assistance off: a button, not the review'
    pg.click('#reviewon'); assert pg.locator('.card.review').count() == 7 and pg.locator('.plays li').count() > 0, 'one review per person at the table'
    rv = txt('#view'); assert '{p' not in rv and '{f' not in rv and 'undefined' not in rv and 'NaN' not in rv
    pg.evaluate('(() => { delete window.__APP.S.assist; })()'); pg.click('#tab-res')
    assert overflow() == 0; shot(f's4-fim-{THEME}.png')

    # again with the same table, then ending a game halfway
    pg.click('[data-act=again]'); assert G()['phase'] == 'reveal' and G()['laws'] == {'L': 0, 'F': 0}
    pg.click('[data-act=end]'); assert G() is not None and 'Toque de novo' in txt('[data-act=end]')
    pg.click('[data-act=end]'); assert G() is None and pg.locator('#table').count() == 1 and pg.locator('#names li').count() == 7
    saved = json.loads(pg.evaluate(f'localStorage.getItem("{KEY}")')); assert saved['game'] is None and len(saved['names']) == 7

    # the liberals win by eliminating Sumo Sacerdote
    pg.click('[data-act=start]')
    pg.evaluate('''() => { const g = window.__APP.S.game; g.players.forEach((p, i) => { p.role = i === 0 ? 'lider' : i < 3 ? 'cultista' : 'liberal'; }); g.phase = 'nominate'; g.pres = 3; g.laws = { L: 0, F: 3 }; }''')
    # D100: what the app kept under its old name is read once, with the old words turned into the new ones (the old
    # words written scrambled here too)
    pg.evaluate('''() => { const old = (k) => atob(k), S = JSON.stringify(window.__APP.S).split('"lider"').join('"' + old('aGl0bGVy') + '"').split('"cultista"').join('"' + old('ZmFzY2lzdGE=') + '"');
      const v = JSON.parse(S); delete v.game.pack; localStorage.setItem(old('c2VjcmV0aGl0bGVyLnYx'), JSON.stringify(v)); localStorage.removeItem('secretcultist.v1');
      localStorage.setItem(old('c2VjcmV0aGl0bGVyLmhpc3RvcnkudjE='), JSON.stringify([{ at: 1, game: v.game }])); localStorage.removeItem('secretcultist.history.v1'); }''')
    cov.reload(pg); wait()
    g = G(); assert g['players'][0]['role'] == 'lider' and g['pack'] == 'classico', 'the old save comes back in the new words'
    pg.evaluate('() => { const g = window.__APP.S.game; g.pack = undefined; }')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))'); cov.reload(pg); wait()
    stack('FFLFFL')
    nominate(4); votes(True); hand('p', 'F'); pg.click('[data-act=pdiscard]'); hand('c', 'F'); pg.click('[data-act=cdiscard]')
    assert G()['phase'] == 'execute'
    pg.click('#phase [data-act=pickp][data-i="0"]'); pg.click('[data-act=execute]')
    assert G()['winner'] == 'L' and 'investigadores venceram' in txt('#phase')
    pg.click('[data-act=table]'); assert G() is None and pg.locator('#table').count() == 1
    # D35: the quick game: 7 seats, the hard level, no assistance, theme and continent at random
    pg.click('#quickgame'); g = G(); assert len(g['players']) == 7 and sum(1 for p in g['players'] if p.get('ai')) == 6 and g['level'] == 'dificil' and not pg.evaluate('window.__APP.S.assist'), 'quick game'
    pg.click('[data-act=end]'); pg.click('[data-act=end]'); assert G() is None

    # a table of 5: Sumo Sacerdote knows the cultist, and the 3rd cultist law lets the president see the next 3 laws
    pg.locator('#names li', has_text='Fê').locator('[data-act=rmname]').click()
    pg.locator('#names li', has_text='Gil').locator('[data-act=rmname]').click()
    pg.click('[data-act=start]'); assert len(G()['players']) == 5
    pg.evaluate('''() => { window.__APP.S.game.players.forEach((p, i) => { p.role = i === 0 ? 'lider' : i === 1 ? 'cultista' : 'liberal'; }); }''')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))'); cov.reload(pg); wait()
    pg.click('[data-act=open]'); assert 'Seu cultista' in txt('#allies') and 'Bia' in txt('#allies .ally.F'), txt('#phase')
    # a secret closes by itself when the app leaves the screen, or when the phone is put face down
    pg.evaluate('''() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; }''')
    assert pg.locator('#role').count() == 0 and 'saiu da tela' in txt('#toast'), 'hidden when the app goes away'
    pg.click('[data-act=open]'); pg.evaluate("window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 175 }))")
    assert pg.locator('#role').count() == 0 and 'virado para baixo' in txt('#toast'), 'hidden when the phone is face down, with that turned on'
    pg.evaluate('(() => { delete window.__APP.S.flip; })()')
    pg.click('[data-act=open]'); pg.evaluate("window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 175 }))")
    assert pg.locator('#role').count() == 1, 'with it off (the default), a phone face down, or a person lying down, keeps the secret open'
    for i in range(5):
        if i: pg.click('[data-act=open]')
        pg.click('[data-act=hiderole]')
    tags = pg.evaluate("[...document.querySelectorAll('#board .slot[aria-label]')].map(e => e.getAttribute('aria-label')).join(' ')")   # D86: the power is an icon; its word is the label
    assert 'espia' in tags and 'investiga' not in tags and 'eleição' not in tags, tags
    pg.evaluate('''() => { const g = window.__APP.S.game; g.pres = 3; g.laws = { L: 0, F: 2 }; }''')
    pg.evaluate(f'localStorage.setItem("{KEY}", JSON.stringify(window.__APP.S))'); cov.reload(pg); wait()
    stack('FFLFFL'); govern(4, 'F'); assert G()['phase'] == 'peek'
    pg.click('[data-act=open]'); top = G()['deck'][:3]
    assert [('L' if 'RELÍQUIA' in t.upper() else 'F') for t in pg.locator('#peek .law').all_inner_texts()] == top
    pg.click('[data-act=endpower]'); assert G()['pres'] == 4

    # ---------- against the app (D10): one person and the app's players ----------
    pg.evaluate(f"localStorage.setItem('{KEY}', JSON.stringify({{v: 1, names: []}}))"); cov.reload(pg); wait()
    pg.click('[data-act=fill][data-n="7"]'); assert 'Ponha o seu nome' in txt('#msg'), 'the app completes a table that has a person'
    pg.fill('#name', 'Lu'); pg.click('[data-act=fill][data-n="7"]')
    assert pg.locator('#names li').count() == 7 and pg.locator('#names small.ai').count() == 6 and '6 lugares são da IA' in txt('#solo')
    pg.click('[data-act=addbot]'); assert pg.locator('#names li').count() == 8
    pg.locator('#names li').nth(7).locator('[data-act=rmname]').click(); assert pg.locator('#names li').count() == 7
    # D20: the size of the table goes down as fast as it goes up: the last seats of the app go away, never a person
    pg.click('[data-act=fill][data-n="5"]'); assert pg.locator('#names li').count() == 5 and pg.locator('#names small.ai').count() == 4 and 'Lu' in txt('#names') and pg.get_attribute('[data-act=fill][data-n="5"]', 'aria-pressed') == 'true'
    pg.click('[data-act=fill][data-n="7"]'); assert pg.locator('#names li').count() == 7 and pg.locator('#names small.ai').count() == 6
    pg.click('[data-act=level][data-v=extremo]')
    assert pg.locator('[data-act=level][data-v=extremo]').get_attribute('aria-pressed') == 'true' and 'Conta as cartas' in txt('#leveltext')
    assert sum(1 for x in pg.locator('#names li b').all_text_contents() if x in pg.evaluate('window.__APP.Core.BOT_NAMES.culto')) == 6, 'the app players get names of the theme'
    pg.click('#moretoggle'); assert pg.locator('#moreopts').count() == 1
    pg.click('[data-act=train][data-v=cultista]'); assert 'Você vai ser cultista' in txt('#traintext')
    pg.click('[data-act=assist][data-v=on]'); assert pg.locator('[data-act=assist][data-v=on]').get_attribute('aria-pressed') == 'true'
    pg.click('[data-act=coach][data-v=on]'); assert 'treinador faz as contas' in txt('#solo')
    pg.click('[data-act=speed][data-v=rapida]'); assert pg.evaluate('window.__APP.S.speed') == 'rapida'
    pg.click('[data-act=speed][data-v=normal]'); assert pg.evaluate('window.__APP.S.speed') is None
    pg.locator('#names li').nth(0).locator('[data-act=rmname]').click(); pg.click('[data-act=start]')
    assert 'pelo menos uma pessoa' in txt('#msg') and G() is None, 'a table of the app alone does not start'
    pg.fill('#name', 'Lu'); pg.press('#name', 'Enter')                     # Lu sits last: seat 6
    assert overflow() == 0; shot(f's5-contra-ia-mesa-{THEME}.png')
    pg.evaluate('window.__APP.ui.think = 60000')                              # slow, to see the app player thinking
    pg.click('[data-act=start]')
    pg.wait_for_function('window.__APP.S.game.reveal === 6')
    assert G()['level'] == 'extremo' and sum(1 for x in G()['players'] if x.get('ai')) == 6
    assert G()['players'][6]['role'] == 'cultista' and G()['train'] == 'cultista', 'training: the role chosen'
    assert 'Só para os seus olhos' in txt('#phase') and 'Passe o celular' not in txt('#phase') and txt('#phase .who') == 'Lu', 'alone, nobody to pass the phone to'
    pg.click('[data-act=open]'); assert pg.locator('#role').count() == 1 and 'Cultista' in txt('#role') and 'escolheu ser cultista' in txt('#trained'); pg.click('[data-act=hiderole]')
    assert pg.locator('#ata').count() == 1 and 'Nenhuma lei ainda' in txt('#ata')
    # the notebook: a cultist at a table of 7 knows Sumo Sacerdote and the other cultist; the rest is marked by hand, and kept
    assert pg.locator('#players .sure-tag').count() == 2 and not pg.locator('#drawer').is_visible(), 'the notebook starts closed; what is known shows in the list of players'
    pg.click('#notestoggle'); assert pg.locator('#drawer').is_visible() and pg.locator('#notes [data-act=note]').count() == 6 * 2 and pg.get_attribute('#notestoggle', 'aria-expanded') == 'true', 'the side panel opens from the tab'
    assert pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth") == 0
    first = str(next(i for i, x in enumerate(G()['players']) if i != 6 and x['role'] == 'liberal'))
    assert 'onerror' not in str(pg.evaluate('window.__APP.Core.viewOf(window.__APP.S.game, 0, "vote", [1, 0])'))
    assert overflow() == 0
    shot(f'notebook-rich-{THEME}.png')
    pg.locator(f'#notes [data-act=note][data-i="{first}"][data-v=L]').click(); assert G() and pg.evaluate('window.__APP.S.notes') == {first: 'L'}
    pg.locator(f'#notes [data-act=note][data-i="{first}"][data-v=""]').click(); assert pg.evaluate('window.__APP.S.notes') is None
    pg.locator(f'#notes [data-act=note][data-i="{first}"][data-v=F]').click()
    # D26: telling the table from the notebook; each app player reacts, by its personality, which the table knows
    assert pg.locator('#notes .persona').count() == 0 and pg.locator('#notes [data-act=denounce]').count() + pg.locator('#notes [data-act=court]').count() == 12, 'a claim for each side of each one'
    # D39: accusing opens the court: a proof from the record (if any), a tone, then the accusation
    # D70: "I am liberal" floats over the game; asking why and the bloc live at the end of the notebook
    assert pg.locator('#talktoggle').count() == 0, 'no Mesa button: two-item bar'
    pg.locator('#selfclaim').dispatch_event('click'); pg.locator('#proofs [data-act=tproof]').first.dispatch_event('click')   # D73: with a proof
    assert G()['hist'][-1]['k'] == 'self' and any('Eu sou liberal' in l for l in G()['log'][-8:]) and pg.locator('#selfclaim[disabled]').count() == 1
    if not pg.locator('#drawer').is_visible(): pg.click('#notestoggle')
    if pg.locator('#drawer #talk [data-act=twhy]').count(): pg.locator('#drawer #talk [data-act=twhy]').first.click(); assert G()['hist'][-1]['k'] == 'why'
    if pg.locator('#diary.open').count(): pg.click('#diary .diary-close')
    if not pg.locator('#drawer').is_visible(): pg.click('#notestoggle')
    if pg.locator('#drawer #talk [data-act=tbloc]').count() >= 2:
        pg.locator('#drawer #talk [data-act=tbloc]').first.click(); pg.locator('#drawer #talk [data-act=tbloc]').nth(1).click(); pg.click('#blocgo')
        assert G()['hist'][-1]['k'] == 'bloc' and len(G()['hist'][-1]['with']) == 2
    if pg.locator('#diary.open').count(): pg.click('#diary .diary-close')
    # D67: while an app player presides and chooses, the person asks it right there, in its turn
    if pg.locator('#drawer').is_visible(): pg.click('#notestoggle')
    kept67 = pg.evaluate('JSON.stringify(window.__APP.S.game)'); think67 = pg.evaluate('window.__APP.ui.think')
    pg.evaluate("(() => { const A = window.__APP, g = A.S.game, me = g.players.findIndex(p => !p.ai), p = g.players.findIndex((x, i) => x.ai && x.alive && i !== me); A.ui.think = 600000; g.pres = p; g.chanc = null; g.phase = 'nominate'; g.hist.push({ k: 'gov', pres: p, chanc: me, law: 'L', pc: 1, cc: 0 }); })()")
    pg.click('[data-act=help]'); pg.click('[data-act=help]')
    assert pg.locator('#asknow').count() == 1 and pg.locator('.dock #diarytoggle').count() == 0, 'the request box in the app player\'s turn; the dock keeps two buttons'
    pg.click('#asknow #askpick'); assert any('me indica' in l for l in G()['log'][-3:]) and pg.locator('#asknow #askpick').count() == 0
    pg.evaluate(f'(() => {{ window.__APP.S.game = JSON.parse({kept67!r}); window.__APP.ui.think = {json.dumps(think67)}; }})()'); pg.click('[data-act=help]'); pg.click('[data-act=help]')
    if not pg.locator('#notes').is_visible(): pg.click('#notestoggle')
    pg.locator(f'#notes [data-act=court][data-i="{first}"]').click(); assert pg.locator('#court').is_visible() and overflow() == 0, 'the court opens'
    shot(f's5-tribunal-{THEME}.png'); pg.click('#accuse'); assert pg.locator('#court').count() == 0
    if pg.locator('#contra').count(): pg.click('#contra')
    # D57: the accusation turns into a debate on three pages; the person answers, then the table gives its verdict
    pg.wait_for_selector('#debate'); assert pg.locator('#debate .dpage').count() == 3 and overflow() == 0
    for _ in range(80):
        if pg.locator('#debate [data-act=dclose]').count(): break
        if pg.locator('#debate [data-act=darg]').count(): pg.locator('#debate [data-act=darg]').first.click()
        else: pg.wait_for_timeout(100)
    assert pg.locator('#debate .dvotes li').count() >= 1, 'the verdict of the table'
    shot(f's5-debate-{THEME}.png'); pg.click('#debate [data-act=dclose]'); assert pg.locator('#debate').count() == 0
    name = G()['players'][int(first)]['name']
    assert f'Lu: "{name} é cultista."' in G()['log'] and pg.locator('#heard li').count() == 6 and pg.locator(f'#notes [data-act=court][data-i="{first}"]').count() == 0, 'claimed: five answer in their own words, the one claimed answers back, once a round'
    assert pg.locator('#heard .claim-impact').is_visible() and len(txt('#heard .claim-impact')) > 10
    assert pg.locator('#tellF, #tellL').count() == 0, 'one claim at a time (D30)'; shot(f's5-denunciar-{THEME}.png')
    pg.click('#notestoggle'); assert not pg.locator('#drawer').is_visible() and pg.locator('#players .tag.mark.F').count() == 1 and '· 1' in txt('#notestoggle'), 'closed, the marks stay in view'
    # the suspicion meter (D32, D37): one switch for the needle and the bars, off by default, on with a tap in the game
    assert pg.locator('#players .meter').count() == 0 and pg.locator('#gauge').count() == 0
    pg.click('#gaugetoggle'); assert pg.locator('#players .meter').count() == 6 and all(0 <= int(t.rstrip('%')) <= 100 for t in pg.locator('#players .meter b').all_text_contents()), 'live: how much each app player suspects the person'
    assert pg.locator('#gauge').count() == 1 and 0 <= int(pg.get_attribute('#gauge', 'aria-valuenow')) <= 100 and overflow() == 0, 'the needle comes with the bars: one meter'
    pg.click('#gaugetoggle'); assert pg.locator('#players .meter').count() == 0 and pg.locator('#gauge').count() == 0, 'one tap turns the whole meter off'
    pg.locator('#seats [data-act=seatnote]').first.click(); assert pg.locator('#drawer').is_visible(), 'a seat opens the notebook (D34)'; pg.click('#notestoggle')
    assert pg.locator('#phase.mine').count() + pg.locator('#thinking').count() >= 1, 'your turn glows, or an app player is deciding (D34)'
    # D43: reputation stars beside each name
    pg.click('#reptoggle'); assert pg.locator('#seats .rep').count() >= 5, 'the reputation stars turn on in the game (D43, D37)'; pg.click('#reptoggle'); assert pg.locator('#seats .rep').count() == 0
    # D37: switched on in the settings, the meter is already on in the game
    pg.evaluate('window.__APP.S.gauge = true'); pg.click('#gaugetoggle')   # the button still says "on": it repaints with the meter on
    assert pg.locator('#gauge').count() == 1 and pg.get_attribute('#gaugetoggle', 'aria-pressed') == 'true', 'on in the settings, on in the game'
    pg.click('#gaugetoggle'); assert pg.locator('#gauge').count() == 0
    # D17: the panels open from a bar at the bottom that has its own room: scrolled to the end, nothing is under it
    pg.evaluate('scrollTo(0, document.documentElement.scrollHeight)')
    assert pg.evaluate("Math.max(...[...document.querySelectorAll('main .card, #app .card')].map(c => c.getBoundingClientRect().bottom)) <= document.querySelector('.dock').getBoundingClientRect().top"), 'nothing is under the bar at the bottom'
    pg.click('#notestoggle'); assert pg.locator('#drawer').is_visible() and pg.locator('#mindtoggle').count() == 0, 'the reasoning panel is gone (D28)'
    pg.click('#notestoggle'); pg.evaluate('scrollTo(0, 0)')
    if G()['pres'] != 6:
        assert pg.locator('#thinking').count() == 1 and 'está escolhendo o chanceler' in txt('#thinking') and 'IA' in txt('#thinking'), txt('#phase')
    # D21: while an app player tells the table about its hand, the phase it holds still shows it deciding: never the gate
    # of its secret, as if the person should open it
    kept = pg.evaluate('JSON.stringify(window.__APP.S.game)')
    pg.evaluate('''(() => { const g = window.__APP.S.game, a = g.players.findIndex(p => p.ai);
      g.hist.push({ k: 'gov', pres: a, chanc: 6, law: 'L', drew: ['F', 'L', 'L'], got: ['L', 'L'] });
      g.pres = a; g.chanc = null; g.phase = 'investigated'; g.target = 6; })()''')
    pg.click('[data-act=help]'); pg.click('[data-act=help]')
    assert pg.locator('.handoff').count() == 0 and pg.locator('#thinking').count() == 1, ('an app player\'s secret never shows a gate', txt('#phase'))
    pg.evaluate(f'window.__APP.S.game = JSON.parse({kept!r})'); pg.click('[data-act=help]'); pg.click('[data-act=help]')
    pg.evaluate('window.__APP.ui.think = 0')
    pg.click('[data-act=help]'); assert 'IA no nível extremo' in txt('#helptext'); pg.click('[data-act=help]')
    me, seen, reloaded = 6, set(), False
    ORDER = ['#debate [data-act=darg]', '#debate [data-act=dclose]', '[data-act=open]', '[data-act=hiderole]', '[data-act=say]', '#phase [data-act=nominate]', '[data-act=myvote]', '[data-act=pdiscard]:not([disabled])', '[data-act=cdiscard]:not([disabled])', '#phase [data-act=pick]', '[data-act=veto]', '#phase [data-act=investigate]', '#phase [data-act=special]', '[data-act=execute]:not([disabled])', '#phase [data-act=pickp]', '[data-act=endpower]']
    for step in range(900):
        g = G()
        if g['phase'] == 'over': break
        holder = g['pres'] if g['phase'] in ('president', 'veto', 'investigated', 'peek') else g['chanc'] if g['phase'] == 'chancellor' else None
        if holder is not None and holder != me:
            assert pg.locator('#phase .law').count() == 0 and pg.locator('#party').count() == 0, f'nothing secret of an app player on screen ({g["phase"]})'
        if pg.locator('.handoff').count():
            assert txt('#phase .who') == 'Lu', 'the phone only ever opens for the person'
        if g['phase'] == 'vote' and g['players'][me]['alive']:
            assert pg.locator('#phase [data-act=elect]').count() == 0 and pg.locator('#phase [data-act=myvote]').count() == 2; seen.add('vote')
            assert min(vote_contrast()) >= 4.5, ('Ja! and Nein! readable', vote_contrast())
        if pg.locator('.claim').count():
            seen.add('claim'); assert 'Pode mentir' in txt('.claim')
        if pg.locator('#decree:not([hidden])').count(): seen.add('decree')
        body = pg.evaluate('document.body.innerText')
        assert 'undefined' not in body and 'NaN' not in body, [l for l in body.split('\n') if 'undefined' in l or 'NaN' in l]
        if g['phase'] in ('nominate', 'vote') and 'seats' not in seen:
            seen.add('seats'); assert pg.locator('#seats li').count() == 7 and 'você' in txt('#seats').lower() and pg.locator('#seats li.F').count() >= 2, ('the table at the top, with what the person knows', txt('#seats'))
            assert 'Como funciona esta fase' in txt('[data-act=help]'), 'the help button says what it is'
        if pg.locator('#said').count(): seen.add('said'); assert any(w in txt('#said') for w in ('Presidente', 'investig')), txt('#said')
        if pg.locator('#coach').count():
            seen.add('coach'); assert 'Como a mesa te vê' in txt('#coach'), txt('#coach')
            assert pg.evaluate("!!(document.querySelector('#phase').compareDocumentPosition(document.querySelector('#coach')) & Node.DOCUMENT_POSITION_FOLLOWING)"), 'what the person has to do comes before the trainer'
        if step == 40 and not reloaded:
            cov.reload(pg); wait(); pg.evaluate('window.__APP.ui.think = 0'); reloaded = True; continue   # the game comes back and the app goes on by itself
        for sel in ORDER:
            if pg.locator(sel).count():
                if sel == '[data-act=myvote]':
                    if 'plea' not in seen and pg.locator('#plea [data-act=pleato]').count():   # D65: ask an app player for its vote
                        seen.add('plea'); pg.locator('#plea [data-act=pleato]').first.click(); pg.locator('#plea [data-act=plea][data-v="1"]').click()
                        assert any('vota' in l for l in G()['log'][-3:]) and G()['hist'][-1]['k'] == 'plea'
                    seen.add('vote')
                    assert pg.locator('#phase [data-act=myvote]').count() == 2
                    assert min(vote_contrast()) >= 4.5, 'the human vote is readable at the point of interaction'
                try: pg.locator(sel).first.click(timeout=2000)
                except Exception: pass
                break
        else:
            pg.wait_for_timeout(20)
    g = G(); log = '\n'.join(g['log'])
    assert g['phase'] == 'over' and g['winner'] in ('L', 'F'), g['log'][-5:]
    laws = sum(1 for e in g['hist'] if e['k'] in ('gov', 'chaos'))
    pg.click('#tab-jogo')
    assert pg.locator('#ata .timeline li.gov').count() == laws and 'Ita!:' in txt('#ata') and pg.locator('#ata .tally li').count() > 0, 'the minutes: every law, and who voted Ja! for it'
    assert pg.evaluate("getComputedStyle(document.querySelector('#ata .timeline')).listStyleType") == 'none', 'the minutes number the laws once (1ª, 2ª), not twice'
    pg.click('#ata [data-act=assist]'); assert pg.locator('#ata').count() == 0; pg.click('#tab-log'); pg.click('#showata'); pg.click('#tab-jogo'); assert pg.locator('#ata').count() == 1
    assert pg.locator('#summary').count() == 1; pg.click('#tab-res')
    assert {'vote', 'decree', 'coach', 'seats', 'said'} <= seen and 'Votos. Ita!' in log and ('disse que tirou' in log or 'disse que recebeu' in log), (seen, g['log'][-8:])
    spoken = [e for e in g['hist'] if e['k'] == 'talk' and e['say'] != 'quiet' and g['players'][e['by']].get('ai')]
    assert spoken and any(g['players'][e['by']]['name'] + ': \"' in log for e in spoken), 'NPC statements are recorded with a speaker; wording varies with context'
    assert pg.locator('#thoughts li').count() >= 1 and '→' in txt('#thoughts') and pg.locator('#thoughts svg.spark').count() >= 1, 'at the end, what the app players thought of the person'
    crux = pg.evaluate('window.__APP.Core.crux(window.__APP.S.game, 6, "end")')
    assert (pg.locator('#crux-end').count() == 1) == (crux is not None), 'a cultist sees the moment that raised the suspicion the most'
    if crux: assert 'ponto crucial' in txt('#crux-end').lower() and f"{round(crux['after'] * 100)}%" in txt('#crux-end')
    assert pg.locator('#players small.ai').count() == 6 and pg.locator('#players .role').count() == 7
    plays = pg.evaluate('window.__APP.Core.review(window.__APP.S.game, 6)')
    assert pg.locator('#review').count() == 1 and 'Suas jogadas' in txt('#review') and pg.locator('#review .plays li').count() == min(4, sum(1 for x in plays if x['good'])) + min(4, sum(1 for x in plays if not x['good'])), ('the review of the person, the main plays of each kind', plays)
    if pg.locator('#review [data-act=allplays]').count(): pg.click('#review [data-act=allplays]'); assert pg.locator('#review .plays li').count() == len(plays); pg.click('#review [data-act=allplays]')
    assert overflow() == 0; shot(f's6-contra-ia-fim-{THEME}.png')
    pg.click('[data-act=endtab][data-v=log]'); pg.click('#log [data-act=logfilter][data-v=talk]'); assert all(': "' in t for t in pg.locator('#log .log li').all_text_contents()), 'the record shows only what was said (D34)'; pg.click('#log [data-act=logfilter][data-v=all]'); pg.click('[data-act=endtab][data-v=res]')
    assert pg.locator('#badges').count() == 1 and pg.locator('#share').count() == 1, 'achievements and sharing at the end (D41)'
    with pg.expect_download() as shot_dl: pg.click('#share')
    assert shot_dl.value.suggested_filename.endswith('.png'), 'the result is a picture (D41)'
    assert pg.locator('#yours').count() == 1 and ('venceu' in txt('#yours') or 'perdeu' in txt('#yours')), 'your game at a glance (D34)'
    assert pg.locator('#notescore').count() == 1 and ('certas' in txt('#notescore') or 'Nada para contar' in txt('#notescore')) and G()['notes'], 'the notebook scored at the end, and kept with the game (D28)'
    assert pg.locator('#highlights').count() == 1 and 1 <= pg.locator('#highlights article').count() <= 3
    # the reasons are still recorded with the game, for the export (D23), though no panel shows them (D28)
    assert pg.evaluate('window.__APP.S.game.trace.length') > 0 and pg.locator('#mindtoggle').count() == 0

    # two people and three app players: the people vote one by one, then the votes open; and if both are out, the app plays on
    pg.click('[data-act=table]')
    for x in list(range(pg.locator('#names li').count())): pg.locator('#names li').nth(0).locator('[data-act=rmname]').click()
    for n in ('Ana', 'Bia'): pg.fill('#name', n); pg.press('#name', 'Enter')
    pg.click('[data-act=fill][data-n="7"]'); pg.click('[data-act=level][data-v=facil]')
    pg.evaluate('window.__APP.ui.think = 60000'); pg.click('[data-act=start]')
    assert pg.evaluate('window.__APP.S.notes') is None, 'a new game starts a clean notebook'
    for who in ('Ana', 'Bia'):
        assert 'Passe o celular para' in txt('#phase') and txt('#phase .who') == who
        pg.click('[data-act=open]'); pg.click('[data-act=hiderole]')
    pg.wait_for_function("window.__APP.S.game.phase === 'nominate'")
    pg.evaluate("(() => { const g = window.__APP.S.game; g.pres = 2; g.chanc = 3; g.phase = 'vote'; })()")
    pg.click('[data-act=help]'); pg.click('[data-act=help]')
    assert pg.locator('#voter-0').count() == 1 and pg.locator('#voter-1').count() == 1 and pg.locator('[data-act=countvotes]').is_disabled()
    pg.click('#voter-0 [data-act=myvote][data-v="1"]'); assert pg.locator('[data-act=countvotes]').is_disabled()
    pg.click('#voter-1 [data-act=myvote][data-v="0"]'); pg.click('[data-act=countvotes]')
    v = [e for e in G()['hist'] if e['k'] == 'vote'][-1]
    assert 0 in v['ja'] and 1 not in v['ja'] and 'Votos. Ita!: Ana' in '\n'.join(G()['log']), v
    pg.evaluate("(() => { const g = window.__APP.S.game; g.players[0].alive = false; g.players[1].alive = false; window.__APP.ui.think = 0; })()")
    if pg.locator('[data-act=undo]').count(): pg.click('[data-act=undo]')                   # taking the count back and playing it through again
    else: pg.click('[data-act=help]')
    pg.wait_for_function("window.__APP.S.game.phase === 'over'", timeout=20000)
    assert G()['winner'] in ('L', 'F')
    pg.evaluate("(() => { const g = window.__APP.S.game; g.phase = 'nominate'; g.winner = null; window.__APP.ui.think = 60000; })()"); pg.click('#tab-res')   # any tap repaints; the end screen has no help button
    assert pg.locator('#watching').count() == 1, 'with no person left, the screen says the app plays on'
    assert pg.locator('#notes').count() == 0, 'with two people at the table there is no notebook: the other one would see it'

    # the red theme (D12): liberals against reds, Red Leader, Da! and Niet!, the wolf and the bear
    pg.click('[data-act=end]'); pg.click('[data-act=end]')
    # D23: every finished game is kept on the device, and exported as a file
    kept = pg.evaluate("JSON.parse(localStorage.getItem('secretcultist.history.v1') || '[]')")
    assert len(kept) >= 2 and all(x['game']['phase'] == 'over' for x in kept) and f'{len(kept)} partidas terminadas' in txt('#historytext'), (len(kept), txt('#history'))
    with pg.expect_download() as dl: pg.click('#exportgames')
    f = json.loads(open(dl.value.path(), encoding='utf-8').read())
    assert f['app'] == 'secret-cultist' and f['format'] == 1 and len(f['games']) == len(kept) and dl.value.suggested_filename.endswith('.json') and 'trace' in f['games'][-1]['game'], 'the export holds every kept game, with the reasoning of the app players'
    # D104: the past games, newest first, five at a time
    assert pg.locator('#past li').count() == len(kept)
    pg.evaluate("(() => { const k = 'secretcultist.history.v1', v = JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify([...v, ...v, ...v, ...v])); })()")
    pg.click('[data-act=pack][data-v=classico]'); assert pg.locator('#past li').count() == 5 and pg.locator('#pastall').count() == 1
    pg.click('[data-act=pastall]'); assert pg.locator('#past li').count() > 5 and pg.locator('#pastall').count() == 0
    pg.click('#wipe'); assert 'Toque de novo' in txt('#wipe'); pg.click('#wipe')
    assert 'Nenhuma partida terminada' in txt('#historytext') and pg.locator('#exportgames').count() == 0
    pg.click('[data-act=pack][data-v=vermelho]')
    reds = pg.evaluate('window.__APP.Core.BOT_NAMES.vermelho')
    assert txt('#boss') == pg.evaluate('window.__APP.Core.WORDS.vermelho.boss') and sum(1 for x in pg.locator('#names li b').all_text_contents() if x in reds) == 5, 'the app seats take names of the theme'
    # D24: names by continent: the app seats change to names of the Americas
    world_art = pg.inner_html('#pack .packart')
    pg.click('[data-act=region][data-v=americas]'); ams = pg.evaluate('window.__APP.Core.NAMES_BY.vermelho.americas')
    assert pg.inner_html('#pack .packart') != world_art and pg.locator('#pack .packart svg').count() == 9, 'the drawings change with the continent (3 themes since D96)'
    assert pg.evaluate('window.__APP.S.region') == 'americas' and all(x in ams for x in pg.locator('#names li').filter(has=pg.locator('small.ai')).locator('b').all_text_contents()) and overflow() == 0, 'the app seats take names of the Americas'
    # D27, D138: a driver has the expansion's key, so Brazil is there
    assert pg.locator('[data-act=region][data-v=brasil]').count() == 1 and pg.locator('#dlcon').count() == 1
    pg.click('#gallerytoggle'); assert pg.locator('.cast figure').count() == 7 * 3 * 3 and 'polvo' in txt('#gallery-brasil') and 'tucano' in txt('#gallery-brasil'), 'unlocked, the gallery shows Brazil too'; pg.click('#galleryback')
    pg.click('[data-act=region][data-v=brasil]'); br = pg.evaluate('window.__APP.Core.NAMES_BY.vermelho.brasil')
    assert pg.evaluate('document.documentElement.dataset.region') == 'brasil', 'the continent is set on the page (D29)'
    assert all(x in br for x in pg.locator('#names li').filter(has=pg.locator('small.ai')).locator('b').all_text_contents()) and pg.locator('#pack .packart svg').count() == 9 and overflow() == 0, 'the app seats take names of Brazil'
    # every continent shows its cast (liberal, member, leader) on both themes, and none of them overflows the screen
    for pack in ('classico', 'culto', 'vermelho'):
        pg.click(f'[data-act=pack][data-v={pack}]')
        for r in pg.evaluate('window.__APP.Core.REGIONS'):
            pg.click(f'[data-act=region][data-v={r}]'); assert pg.locator('#pack .packart svg').count() == 9 and overflow() == 0, (pack, r)
    pg.click('[data-act=region][data-v=mundo]'); assert pg.evaluate('window.__APP.S.region') is None
    RW, CW = pg.evaluate('window.__APP.Core.WORDS.vermelho'), pg.evaluate('window.__APP.Core.WORDS.classico')
    assert pg.locator('#pack .packs button').last.bounding_box()['width'] > 1.8 * pg.locator('#pack .packs button').first.bounding_box()['width'], 'the odd theme out takes the whole row'
    assert CW['theme'] in txt('#pack'), 'the other themes keep their own words on the Cthulhu screen'
    assert RW['theme'] in txt('#pack') and RW['fs'] in txt('#rules') and RW['boss'] in txt('#rules') and CW['f'] not in (txt('#table') + txt('#solo') + txt('#rules')).lower()
    for x in list(range(pg.locator('#names li').count())):
        if pg.locator('#names li').nth(0).locator('small.ai').count() == 0: pg.locator('#names li').nth(0).locator('[data-act=rmname]').click()
        else: break
    pg.locator('#names li').nth(0).locator('[data-act=rmname]').click()
    pg.fill('#name', 'Lu'); pg.press('#name', 'Enter')
    if pg.locator('#moreopts').count() == 0: pg.click('#moretoggle')
    pg.click('[data-act=train][data-v=lider]'); assert pg.evaluate('window.__APP.Core.WORDS.vermelho.boss') in txt('#solo')
    pg.evaluate('window.__APP.ui.think = 0')
    pg.click('[data-act=start]'); pg.wait_for_selector('[data-act=open]'); pg.click('[data-act=open]')
    assert pg.evaluate('window.__APP.Core.WORDS.vermelho.boss') in txt('#role') and pg.locator('#role svg.art').count() == 1 and G()['pack'] == 'vermelho'; pg.click('[data-act=hiderole]')
    for step in range(600):
        g = G()
        if g['laws']['L'] + g['laws']['F'] >= 1 or g['phase'] == 'over': break
        for sel in ORDER:
            if pg.locator(sel).count():
                if sel == '[data-act=myvote]':
                    seen.add('vote')
                    assert pg.locator('#phase [data-act=myvote]').count() == 2
                    assert min(vote_contrast()) >= 4.5, 'the human vote is readable at the point of interaction'
                try: pg.locator(sel).first.click(timeout=2000)
                except Exception: pass
                break
        else:
            pg.wait_for_timeout(20)
    body = pg.evaluate('document.body.innerText')
    RW, CW = pg.evaluate('window.__APP.Core.WORDS.vermelho'), pg.evaluate('window.__APP.Core.WORDS.classico')
    assert CW['f'] not in body.lower() and 'Sumo Sacerdote' not in body and CW['ja'].lower() not in body.lower() and (RW['ja'].lower() in body.lower() or RW['nein'].lower() in body.lower()), [l for l in body.split('\n') if CW['f'] in l.lower() or 'Sumo Sacerdote' in l][:5]
    assert f"lei {RW['f']}" in txt('#decree').lower() or 'lei liberal' in txt('#decree').lower()
    assert overflow() == 0; shot(f's7-vermelhos-{THEME}.png')
    pg.click('[data-act=end]'); pg.click('[data-act=end]'); pg.click('[data-act=pack][data-v=classico]'); assert txt('#boss') == pg.evaluate('window.__APP.Core.WORDS.classico.boss'), (txt('#boss'), pg.evaluate('[window.__APP.S.pack, !!window.__APP.S.game]'))
    assert pg.locator('[data-act=quickmode][data-v=culto][aria-selected=true]').count() == 1, 'the quick game starts on Cthulhu (D110)'
    pg.click('[data-act=quickmode][data-v=mix]'); assert pg.locator('[data-act=quickmode][data-v=mix][aria-selected=true]').count() == 1
    pg.click('[data-act=quickmode][data-v=culto]'); pg.click('#quickgame'); assert G()['pack'] == 'culto' and len(G()['players']) == 7, 'the quick game of Cthulhu (D108, D110)'

    cov.stop(pg, f'e2e-{THEME}')
    assert not errs, errs

    # ---------- with motion on: the animations play, and taps wait for the falling card ----------
    mctx = b.new_context(viewport=dict(width=393, height=852), color_scheme=THEME, locale='pt-BR', reduced_motion='no-preference')
    mctx.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    mctx.add_init_script('window.__SEED = 7')
    mctx.add_init_script("new MutationObserver(() => { if (!window.__KEEP_STORY) document.getElementById('storyok')?.click(); if (!window.__KEEP_ROLL) document.getElementById('rollok')?.click(); }).observe(document, { childList: true, subtree: true })")   # D129, D130: the story and the rolls are closed at once, except where they are tested
    mctx.add_init_script("window.__AUTH = {email: 'teste@exemplo.com', role: 'driver'}; window.__DLC = " + json.dumps(os.environ['DLC_KEY']))   # D98, D138: logged in as a driver, with the expansion's key
    mp = mctx.new_page(); merrs = []
    # D63: while an animation plays, taps wait; a scripted click waits for it to end first
    _mclick = mp.click
    def _mwait(): mp.wait_for_function('!(window.__APP && window.__APP.ui.frozen > Date.now())', timeout=10000)
    def _msafe(sel, **kw): _mwait(); return _mclick(sel, **kw)
    mp.click = _msafe
    mp.on('pageerror', lambda e: merrs.append(str(e)))
    cov.start(mp)
    mp.goto((ROOT / 'dist' / 'index.html').as_uri()); mp.wait_for_function('window.__APP && window.__APP.S')
    for n in NAMES[:5]: mp.fill('#name', n); mp.press('#name', 'Enter')
    mp.click('[data-act=start]')
    mp.click('[data-act=open]'); assert mp.locator('.turn.go .back').count() == 1, 'the role card turns over'
    mp.click('[data-act=hiderole]')
    for _ in range(4): mp.click('[data-act=open]'); mp.click('[data-act=hiderole]')
    mp.locator('#phase [data-act=nominate]').first.click(); mp.click('[data-act=elect][data-v="1"]')
    assert mp.locator('#stamp.go').count() == 1 and 'Eleito' in mp.text_content('#stamp')
    mp.click('[data-act=open]'); assert mp.locator('.flip .hand .law').count() == 3, 'the laws are dealt'
    mp.click('#phase [data-act=pick][data-k="0"]'); mp.click('[data-act=pdiscard]')
    assert mp.locator('#phase .law.toss').count() == 1 and mp.evaluate('window.__APP.S.game.phase') == 'president', 'the card falls before the game moves on'
    mp.click('[data-act=pdiscard]')                                                   # a tap while it falls changes nothing
    mp.wait_for_function("window.__APP.S.game.phase === 'chancellor'", timeout=3000)
    assert mp.evaluate('window.__APP.S.game.discard.length') == 1, 'one discard, not two'
    # Public power effects animate without holding up play or revealing a party or role.
    mp.evaluate("""() => { const g = window.__APP.S.game; g.phase = 'investigate'; g.target = null; g.pres = 0; g.seen = []; localStorage.setItem('secretcultist.v1', JSON.stringify(window.__APP.S)); }""")
    cov.reload(mp); mp.wait_for_function('window.__APP && window.__APP.S.game.phase === "investigate"')
    mp.click('#phase [data-act=investigate][data-i="2"]')
    assert mp.locator('#power-effect.investigate.go').is_visible() and mp.locator('#party').count() == 0
    # D58: the detective with the magnifier pulls the name out of the envelope
    assert mp.locator('#power-effect .hand').count() == 1 and mp.evaluate("getComputedStyle(document.querySelector('#power-effect .slip')).animationName") == 'slipUp'
    assert 'cultista' not in mp.text_content('#power-effect').lower() and 'investigador' not in mp.text_content('#power-effect').lower()
    mp.wait_for_function("Number(getComputedStyle(document.querySelector('#power-effect')).opacity) > .9")
    mp.screenshot(path=str(SHOTS / f'power-investigate-{THEME}.png'))
    mp.evaluate("""() => { const g = window.__APP.S.game; g.phase = 'execute'; g.target = null; localStorage.setItem('secretcultist.v1', JSON.stringify(window.__APP.S)); }""")
    cov.reload(mp); mp.wait_for_function('window.__APP && window.__APP.S.game.phase === "execute"')
    mp.click('#phase [data-act=pickp][data-i="2"]'); mp.click('[data-act=execute]')
    # D42: the elimination has one screen of its own, with motion: the name, the stamp, the card
    mp.wait_for_function("Number(getComputedStyle(document.querySelector('#flash')).opacity) > .9"); assert 'Eliminado' in mp.text_content('#flash') and mp.locator('#power-effect.execute').count() == 0
    mp.screenshot(path=str(SHOTS / f'power-execute-{THEME}.png'))
    # D46: chaos, a veto accepted and a special election each get their effect, over the screen and never taking a tap;
    # the enacted law flies to its slot and lands with a thud
    _mwait()
    mp.evaluate("""() => { const g = window.__APP.S.game; g.phase = 'nominate'; delete g.winner; g.players.forEach(p => { p.alive = true; }); g.laws.F += 1; g.hist.push({ k: 'chaos', law: 'F' }, { k: 'veto', pres: 0, chanc: 1 }, { k: 'special', by: 0, target: g.pres }); (document.querySelector('[data-act=help]') || document.querySelector('[data-act=endtab]')).click(); }""")
    assert mp.locator('.fxl.chaos').count() == 1 and mp.locator('.fxl.veto-fx .tear').count() == 2 and mp.locator('.fxl.ribbon').count() == 1 and mp.locator('.fly .law').count() == 1
    assert mp.evaluate("getComputedStyle(document.querySelector('.fxl')).pointerEvents") == 'none' and mp.locator('#seats .seat.pres-sash.sash').count() == 1
    mp.wait_for_selector('#board .slot.lit.thud', state='attached', timeout=3000)
    mp.screenshot(path=str(SHOTS / f'fx-{THEME}.png'))
    cov.stop(mp, f'e2e-motion-{THEME}')
    assert not merrs, merrs
    b.close()
print(f'e2e ok ({THEME}): mesa, papéis atrás do portão, eleição, caos, leis, limite de mandato, poderes, veto, eleição especial, mesa de 5 (Sumo Sacerdote conhece o cultista, espiar), desfazer, ajuda, segredo que se esconde sozinho, resumo da partida, contra a IA (sozinho e com duas pessoas, treino, nomes, ata, anotações, conversa, treinador, o que pensavam de você, velocidade, painel lateral de anotações, desconfiança ao vivo, ponto crucial, denunciar e reações, acerto das anotações), tema liberais x vermelhos, anúncio de quem aprovou cada lei, animações, fim de jogo pelos dois lados, guardado no aparelho, tema, sem estouro de largura e sem erro de script')
