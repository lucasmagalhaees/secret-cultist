#!/usr/bin/env python3
"""The pictures of the README (docs/img/): a Secret Cultist game against the app, on a phone, from the page that
ships (dist/index.html), with the recorded sheet sample standing in for the sheets API. Not part of verify.sh.
    npm run build && python3 scripts/readme_shots.py"""
import pathlib, subprocess, shutil
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/img'; OUT.mkdir(parents=True, exist_ok=True)
FRAMES = ROOT / 'tests/.frames'; shutil.rmtree(FRAMES, ignore_errors=True); FRAMES.mkdir(parents=True)
SHEET = (ROOT / 'tests/fixtures/source/random-char_eastern-europe_2026-11-03.json').read_text()
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2, color_scheme='dark')
    ctx.add_init_script('window.__SEED = 7')
    ctx.route('https://cthulhu-char-golang.vercel.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body=SHEET, headers={'access-control-allow-origin': '*'}))
    pg = ctx.new_page()
    pg.goto((ROOT / 'dist/index.html').as_uri()); pg.wait_for_function('window.__APP')
    pg.screenshot(path=str(OUT / 'inicio.png'))
    pg.click('[data-act=quickgame]'); pg.wait_for_function('window.__APP.S.game && !!window.__APP.S.game.sheets', timeout=15000)
    n = 0
    def frame():
        global n
        pg.screenshot(path=str(FRAMES / f'{n:03d}.png')); n += 1
    # the person's role, then the app plays on by itself; a frame every so often
    pg.locator('[data-act=open]').first.click(); pg.wait_for_timeout(900); frame(); pg.screenshot(path=str(OUT / 'papel.png'))
    pg.locator('[data-act=hiderole]').first.click()
    pg.evaluate('window.__APP.ui.think = 300')
    for k in range(60):
        g = pg.evaluate('window.__APP.S.game')
        if g['phase'] == 'over': break
        for sel in ['#tut [data-act=tutok]', '#debate [data-act=darg]', '#debate [data-act=dclose]', '[data-act=open]', '[data-act=hiderole]', '[data-act=say]', '#phase [data-act=nominate]', '[data-act=myvote]', '[data-act=pdiscard]:not([disabled])', '[data-act=cdiscard]:not([disabled])', '#phase [data-act=pick]', '[data-act=veto]', '#phase [data-act=investigate]', '#phase [data-act=special]', '[data-act=execute]:not([disabled])', '#phase [data-act=pickp]', '[data-act=endpower]']:
            loc = pg.locator(sel)
            if loc.count():
                if sel == '#debate [data-act=darg]' and not (OUT / 'debate.png').exists(): pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / 'debate.png'))
                try: loc.first.click(timeout=2000)
                except Exception: pass
                break
        pg.wait_for_timeout(700)
        if k % 3 == 0: frame()
        if k == 12: pg.screenshot(path=str(OUT / 'mesa.png'))
    if pg.locator('#players [data-act=sheet]').count():
        pg.evaluate("document.getElementById('debate')?.remove(); window.__APP.ui.debate = null")
        pg.locator('#players [data-act=sheet]').nth(1).dispatch_event('click'); pg.wait_for_timeout(500); pg.screenshot(path=str(OUT / 'ficha.png'))
    b.close()
# a short animation of the game for the README
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '2', '-i', str(FRAMES / '%03d.png'), '-vf', 'scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse', str(OUT / 'partida.gif')], check=True)
shutil.rmtree(FRAMES, ignore_errors=True)
print('README pictures in docs/img/:', ', '.join(sorted(x.name for x in OUT.iterdir())))
