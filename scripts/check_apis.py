#!/usr/bin/env python3
"""D149: are the game's two optional APIs up? The sheets (cthulhu-char-golang) and the lore (lore-enhancer).

The game never needs them (it falls back to the code), so a fallen API is silent for the players: this is where it
shows. The workflow `Produção` runs it after every merge to main and every day; on a pull request it only reports.

  python3 scripts/check_apis.py            # exit 1 if any is down (annotations for GitHub)
  python3 scripts/check_apis.py --report   # says, never fails
  python3 scripts/check_apis.py --selftest # against a local server, in verify.sh
"""
import json, sys, threading, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

APIS = {
    'fichas (cthulhu-char-golang)': ('https://cthulhu-char-golang.vercel.app/char-generator/health', lambda d: d.get('status') == 'UP'),
    'lore (lore-enhancer)': ('https://lore-enhancer.vercel.app/health', lambda d: d.get('ok') is True and d.get('store') != 'MemoryStore'),
}


def probe(url, good, timeout=20):
    """'ok', or why not, in words."""
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': 'secret-cultist-check'}), timeout=timeout) as r:
            body = json.loads(r.read().decode() or 'null')
    except Exception as e:   # unreachable, an HTTP error, or not JSON
        return f'não respondeu ({type(e).__name__}: {e})'
    if not isinstance(body, dict) or not good(body):
        return f'respondeu, mas fora do esperado: {json.dumps(body)[:200]}'
    return 'ok'


def run(apis, report=False, say=print):
    bad = 0
    for name, (url, good) in apis.items():
        got = probe(url, good)
        if got == 'ok':
            say(f'ok    {name}: {url}')
        else:
            bad += 1
            say(f'{"::notice::" if report else "::error::"}{name} {got} ({url}). O jogo segue sem ela, sem avisar ninguém.')
    return 0 if report or not bad else 1


def selftest():
    state = {}

    class H(BaseHTTPRequestHandler):
        def do_GET(self):
            code, body = state.get(self.path, (404, b'{}'))
            self.send_response(code); self.send_header('content-type', 'application/json'); self.end_headers(); self.wfile.write(body)
        def log_message(self, *a):
            pass

    srv = HTTPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_port}'
    apis = {name: (base + '/' + str(k), good) for k, (name, (_, good)) in enumerate(APIS.items())}
    quiet = lambda *_: None
    cases = [
        ('both up', {'/0': (200, b'{"status":"UP"}'), '/1': (200, b'{"ok":true,"store":"SupabaseStore"}')}, False, 0),
        ('sheets down', {'/1': (200, b'{"ok":true,"store":"SupabaseStore"}')}, False, 1),
        ('lore without the database', {'/0': (200, b'{"status":"UP"}'), '/1': (200, b'{"ok":true,"store":"MemoryStore"}')}, False, 1),
        ('not JSON', {'/0': (200, b'<html>'), '/1': (200, b'{"ok":true,"store":"SupabaseStore"}')}, False, 1),
        ('a report never fails', {}, True, 0),
    ]
    fails = [n for n, st, rep, want in cases if (state.clear() or state.update(st) or run(apis, rep, quiet)) != want]
    srv.shutdown()
    print(f'{len(cases) - len(fails)}/{len(cases)} API-check cases behave' + (f'; failed: {fails}' if fails else ''))
    return 1 if fails else 0


if __name__ == '__main__':
    if '--selftest' in sys.argv:
        sys.exit(selftest())
    sys.exit(run(APIS, report='--report' in sys.argv))
