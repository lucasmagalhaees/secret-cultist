#!/usr/bin/env python3
"""Is production serving this commit?

Usage: python3 scripts/check_production.py            strict: wait for production to be this commit and to stay on it
       python3 scripts/check_production.py --report   only say which commit production is serving
       python3 scripts/check_production.py --selftest check this script against a local server (no internet)

The build writes the commit it was made from into the page (<meta name="app-commit">, see vite.config.js). This script
reads that stamp from the production address and compares it with the commit checked out here.

Why this exists: in the project this was taken from, four pull requests were merged within a minute. The host built one
deployment per merge and the oldest one finished last, so the production address went back to the oldest version while
every check was green.
Strict mode therefore does not stop at the first match: it keeps looking for a while, because the wrong deployment can
arrive after the right one.

Exit codes: 0 production is this commit (or --report); 1 it is not; 3 inconclusive (production could not be reached).
Environment: APP_PROD_URL (empty means the default below; on GitHub it comes from the repository variable of the same
name), APP_PROD_WAIT (seconds to wait for the first match), APP_PROD_HOLD (seconds it must stay matched).

Two mistakes this script names instead of just timing out: an address that serves some other site (a page without the
stamp: the default once pointed at a stranger's app with a similar name), and an address behind Vercel's login.
"""
import os, pathlib, re, subprocess, sys, time, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_URL = 'https://secret-game-gamma.vercel.app/'
URL = os.environ.get('APP_PROD_URL') or DEFAULT_URL
AGENT = 'secret-cultist-production-check/1.0'
STAMP = re.compile(r'<meta name="app-commit" content="([^"]*)"')
NO_STAMP = '(sem carimbo)'
LOGIN = '(login da Vercel)'


def fetch(url):
    """The commit stamped in the page the address serves; NO_STAMP for a page without one; LOGIN when the address sends
    to Vercel's login (deployment protection); None when it cannot be read."""
    req = urllib.request.Request(url, headers={'User-Agent': AGENT, 'Cache-Control': 'no-cache', 'Accept': 'text/html'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            if is_login(r.geturl()):
                return LOGIN
            m = STAMP.search(r.read().decode('utf-8', 'replace'))
            return m.group(1) if m and m.group(1) else NO_STAMP
    except (urllib.error.URLError, OSError, ValueError):
        return None


def is_login(final_url):
    """Where a protected Vercel deployment sends a visitor who is not signed in."""
    return bool(re.match(r'https?://(www\.)?vercel\.com/(login|sso)', final_url or ''))


def why(served):
    """What to do when production is not this commit, by what the address served."""
    if served == LOGIN:
        return (f'{URL} pede login da Vercel (proteção de deploy). Desligue a proteção para o domínio de produção, '
                'ou use outro endereço público em APP_PROD_URL.')
    if served == NO_STAMP:
        return (f'{URL} não parece ser este app: a página não tem o carimbo de commit. Confira o domínio de produção na '
                'Vercel (Settings → Domains) e a variável APP_PROD_URL do repositório.')
    return 'A produção não está servindo o commit mais recente da main. Na Vercel, promova o deploy desse commit (ou faça um novo merge). Veja "Publicação" no CLAUDE.md.'


def annotate(level, text):
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        print(f'::{level} title=Produção::' + ' '.join(str(text).split()))


def head():
    if os.environ.get('GITHUB_SHA'):
        return os.environ['GITHUB_SHA']
    try:
        return subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    except (subprocess.CalledProcessError, OSError):
        return ''


def describe(served):
    """Where the commit production serves sits relative to the one checked out here."""
    if served == NO_STAMP:
        return 'uma página sem carimbo de commit (outro site, ou um build que não recebeu o commit)'
    if served == LOGIN:
        return 'a tela de login da Vercel (o endereço está protegido)'
    try:
        behind = subprocess.run(['git', 'rev-list', '--count', f'{served}..HEAD'], cwd=ROOT, capture_output=True, text=True)
        if behind.returncode == 0:
            n = int(behind.stdout.strip() or 0)
            return f'o commit {served[:7]}' + (f', {n} commit(s) atrás deste' if n else '')
    except (OSError, ValueError):
        pass
    return f'o commit {served[:7]} (fora do histórico baixado aqui)'


def strict(url, want, wait, hold, step, say=print):
    """0 when production is `want` and stays so for `hold` seconds; 1 when it never gets there or goes back; 3 unreachable."""
    start, seen, got = time.time(), False, None
    while time.time() - start < wait:
        got = fetch(url)
        seen = seen or got is not None
        if got == want:
            break
        time.sleep(step)
    else:
        if not seen:
            say(f'inconclusivo: não consegui ler {url}')
            return 3
        last = fetch(url) or got
        say(f'produção não chegou a este commit em {int(wait)} s. Está servindo {describe(last) if last else "algo que não consegui ler"}.')
        return 1
    say(f'produção está no commit {want[:7]}. Conferindo se continua assim por {int(hold)} s.')
    end = time.time() + hold
    while time.time() < end:
        time.sleep(min(step, max(0.0, end - time.time())))
        got = fetch(url)
        if got is not None and got != want:
            say(f'produção VOLTOU para outra versão: {describe(got)}. Um deploy mais antigo terminou depois do mais novo.')
            return 1
    say('produção continua neste commit.')
    return 0


def selftest():
    import http.server, threading
    page = lambda commit: ('<!doctype html><meta name="app-commit" content="%s"><title>x</title>' % commit).encode()
    state = {'body': page('aaa'), 'down': False}

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if state['down']:
                self.send_response(503); self.end_headers(); return
            self.send_response(200); self.send_header('Content-Length', str(len(state['body']))); self.end_headers(); self.wfile.write(state['body'])
        def log_message(self, *a):
            pass

    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url, quiet, fails, n = f'http://127.0.0.1:{srv.server_address[1]}/', (lambda *_: None), [], 0

    def check(name, got, want):
        nonlocal n
        n += 1
        if got != want:
            fails.append(f'{name}: got {got}, want {want}')

    def later(delay, **change):
        threading.Timer(delay, lambda: state.update(change)).start()

    new, old = page('new1234'), page('old9999')
    state.update(body=new, down=False)
    check('reads the stamp', fetch(url), 'new1234')
    check('matches and stays', strict(url, 'new1234', 1, 0.4, 0.05, quiet), 0)
    state.update(body=old); later(0.2, body=new)
    check('the new version arrives a little later', strict(url, 'new1234', 2, 0.3, 0.05, quiet), 0)
    state.update(body=new); later(0.3, body=old)
    check('an older deployment takes over after the match', strict(url, 'new1234', 1, 1.0, 0.05, quiet), 1)
    state.update(body=old)
    check('never reaches the new version', strict(url, 'new1234', 0.3, 0.3, 0.05, quiet), 1)
    state.update(body=b'<!doctype html><title>the page before the stamp existed</title>')
    check('a page without a stamp is read as such', fetch(url), NO_STAMP)
    check('a page without a stamp never matches', strict(url, 'new1234', 0.3, 0.3, 0.05, quiet), 1)
    state.update(body=page(''))
    check('an empty stamp counts as no stamp', fetch(url), NO_STAMP)
    state.update(down=True)
    check('unreachable is inconclusive, not a failure', strict(url, 'new1234', 0.3, 0.3, 0.05, quiet), 3)
    check('unreachable address reads as None', fetch(url), None)
    state.update(down=False, body=new); later(0.15, down=True); later(0.35, down=False)
    check('a blip while holding does not fail the check', strict(url, 'new1234', 1, 0.6, 0.05, quiet), 0)
    check('the login page of Vercel is recognised', [is_login('https://vercel.com/login?next=x'), is_login('https://vercel.com/sso-api?url=x'), is_login('https://vercel.com/docs'), is_login(url)], [True, True, False, False])
    check('a page from some other site says to check the address', 'não parece ser este app' in why(NO_STAMP) and 'APP_PROD_URL' in why(NO_STAMP), True)
    check('a protected address says so', 'login da Vercel' in why(LOGIN), True)
    check('an empty variable falls back to the default address', (os.environ.get('APP_PROD_URL_UNSET_FOR_TEST') or DEFAULT_URL) == DEFAULT_URL, True)
    check('describing a commit outside the history does not crash', 'fora do histórico' in describe('0' * 40) or 'commit 0000000' in describe('0' * 40), True)
    srv.shutdown()
    for f in fails:
        print('FAIL', f)
    print(f'{n - len(fails)}/{n} production-check cases behave')
    return 1 if fails else 0


if __name__ == '__main__':
    if '--selftest' in sys.argv:
        sys.exit(selftest())
    want = head()
    if '--report' in sys.argv:
        got = fetch(URL)
        if got is None:
            msg = f'inconclusivo: não consegui ler {URL}'
        elif got == want:
            msg = 'produção já está neste commit.'
        else:
            msg = f'produção serve {describe(got)}. Este commit ainda não está no ar (normal num PR).'
        print(msg); annotate('notice', msg)
        sys.exit(0)

    def say(text):
        print(text, flush=True)
    if not want:
        say('inconclusivo: não sei qual é o commit daqui (sem GITHUB_SHA e sem git).'); sys.exit(3)
    code = strict(URL, want, float(os.environ.get('APP_PROD_WAIT', 420)), float(os.environ.get('APP_PROD_HOLD', 300)), 20, say)
    if code == 1:
        annotate('error', why(fetch(URL)))
    elif code == 3:
        annotate('warning', f'Inconclusivo: não consegui ler {URL} daqui.')
    sys.exit(code)
