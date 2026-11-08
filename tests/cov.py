"""Code coverage of the built page's script (dist/index.html), measured by the browser itself (V8 precise coverage over CDP).

The test scripts call start(page) before loading the app and stop(page, name) when done; both do nothing unless
APP_COVERAGE=1. Each run leaves tests/.coverage/<name>.json, and `python3 tests/cov.py` merges them and reports:
functions called at least once, and characters of script executed at least once. `--min-functions N` and
`--min-chars N` turn the report into a check.
"""
import json, os, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / '.coverage'
ON = os.environ.get('APP_COVERAGE') == '1'
_sessions = {}

def start(page):
    if not ON:
        return
    cdp = page.context.new_cdp_session(page)
    cdp.send('Profiler.enable')
    cdp.send('Profiler.startPreciseCoverage', {'callCount': True, 'detailed': True})
    _sessions[id(page)] = cdp

_kept = {}
_ours = lambda result: [s for s in result if s['url'].endswith('/index.html')]

def keep(page):
    """Read out the counters now. For a page that is about to reload by itself (see reload below for why)."""
    cdp = _sessions.get(id(page))
    if cdp:
        _kept.setdefault(id(page), []).extend(_ours(cdp.send('Profiler.takePreciseCoverage')['result']))

def reload(page):
    """Reload the page without losing what was measured before the reload.

    A reload throws the page's script away, and the browser may drop that script's counters with it. On GitHub's runners
    it did: everything exercised before the last reload came back as "never called" and coverage read 91.7% for code
    that measures 97.2% here. It could not be reproduced on this machine (an older Chromium), so the cause is inferred
    from which functions went missing. Reading the counters out before each reload does not depend on that guess."""
    keep(page)
    page.reload()

def stop(page, name):
    cdp = _sessions.pop(id(page), None)
    if not cdp:
        return
    scripts = _kept.pop(id(page), []) + _ours(cdp.send('Profiler.takePreciseCoverage')['result'])
    # Stop measuring and let go of the page. A page closed with the profiler still attached lingered as a client of the
    # service worker: reopening the app right after found the old version, or never finished loading, in 7 of 140 tries,
    # against 0 of 240 without the profiler or with it detached first (tests/pwa.py closes and reopens the app).
    cdp.send('Profiler.stopPreciseCoverage'); cdp.detach()
    OUT.mkdir(exist_ok=True)
    (OUT / f'{name}.json').write_text(json.dumps(scripts))

def report(min_functions=None, min_chars=None, show=40):
    html = (ROOT / 'dist' / 'index.html').read_text(encoding='utf-8')         # the built page: what the tests load and what ships
    a = html.index('<script type="module">') + len('<script type="module">'); b = html.index('</script>', a)
    src = html[a:b]                                 # V8 reports offsets inside the inline script, not inside the page
    # ...and counts them in UTF-16 units, as JavaScript strings do: a character outside the basic plane (an emoji) is two
    # units for V8 and one character for Python. `units` maps each unit to its character, so the offsets line up.
    units = [i for i, ch in enumerate(src) for _ in range(2 if ord(ch) > 0xFFFF else 1)]
    N = len(units)
    runs = sorted(OUT.glob('*.json')) if OUT.exists() else []
    if not runs:
        print('cobertura: nenhuma medição encontrada (rode os testes com APP_COVERAGE=1)'); return 1
    covered = bytearray(N + 1)
    functions = {}
    for run in runs:
        for script in json.loads(run.read_text()):
            layer = bytearray(N + 1)
            for fn in sorted(script['functions'], key=lambda f: (f['ranges'][0]['startOffset'], -f['ranges'][0]['endOffset'])):
                first = fn['ranges'][0]
                if first['endOffset'] > N + 1:
                    print(f'cobertura: {run.name} foi medido com outro build de dist/index.html; apague tests/.coverage e rode de novo'); return 1
                if fn['functionName'] or first['startOffset'] > 0:      # the script's own top-level wrapper is not a function to cover
                    key = (fn['functionName'], first['startOffset'], first['endOffset'])
                    functions[key] = functions.get(key, False) or first['count'] > 0
                for r in fn['ranges']:                                  # outer range first, inner blocks then refine it
                    n = r['endOffset'] - r['startOffset']
                    layer[r['startOffset']:r['endOffset']] = (b'\x01' if r['count'] > 0 else b'\x00') * n
            covered = bytearray(x | y for x, y in zip(covered, layer))   # executed in any run counts
    code = [u for u, i in enumerate(units) if not src[i].isspace()]
    hit = sum(1 for i in code if covered[i])
    called = sum(1 for v in functions.values() if v)
    pf, pc = 100 * called / max(1, len(functions)), 100 * hit / max(1, len(code))
    line = lambda off: html.count('\n', 0, a + units[min(off, N - 1)]) + 1
    print(f'cobertura de dist/index.html ({len(runs)} execuções: {", ".join(r.stem for r in runs)})')
    print(f'  funções chamadas: {called}/{len(functions)} ({pf:.1f}%)')
    print(f'  código executado: {pc:.1f}% dos caracteres do script')
    never = sorted((k for k, v in functions.items() if not v), key=lambda k: k[1])
    if never and show:
        print('  nunca chamadas (nome:linha): ' + ', '.join(f"{k[0] or '(anônima)'}:{line(k[1])}" for k in never[:show]) + (' …' if len(never) > show else ''))
    bad = []
    if min_functions is not None and pf < min_functions: bad.append(f'funções {pf:.1f}% < {min_functions}%')
    if min_chars is not None and pc < min_chars: bad.append(f'código {pc:.1f}% < {min_chars}%')
    print('cobertura: ' + ('ABAIXO DO MÍNIMO: ' + '; '.join(bad) if bad else f'ok ({pf:.1f}% das funções, {pc:.1f}% do código)'))
    return 1 if bad else 0

if __name__ == '__main__':
    arg = lambda name: (float(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else None)
    sys.exit(report(arg('--min-functions'), arg('--min-chars')))
