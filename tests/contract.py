"""Contract check: the readers of src/core/source.ts against real answers of the source, recorded in tests/fixtures/source/.

Usage: python3 tests/contract.py   (needs dist/ built)
The readers are written for answers that were seen, not imagined. Before the app reads a new field: record a real answer
with it in tests/fixtures/source/ (never edited by hand), add what must hold of it to EXPECT below, and only then write
the code. With no answer recorded yet there is nothing to check, and the script says so.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIX = ROOT / 'tests' / 'fixtures' / 'source'
# one entry per recorded file: the reader it goes through, and what must be true of what comes out (a JS expression of `r`)
EXPECT = {
    'random-char_eastern-europe_2026-11-03.json': ('normSheet', "r && r.native === 'Russian' && r.vals['Persuade'] === 10 && r.vals['Fast Talk'] === 5 && r.vals['Charm'] === 15 && r.vals['Psychology'] === 10 && r.vals['Luck'] === 65"),
    # 'entries_2026-01-01.json': ('normEntries', 'r.length > 0 && r.every(e => e.id && e.name && Number.isFinite(e.value))'),
}
files = sorted(p.name for p in FIX.glob('*.json'))
missing = [f for f in files if f not in EXPECT]
if missing:
    print('FAIL amostra gravada sem checagem em EXPECT:', ', '.join(missing)); sys.exit(1)
if not files:
    print('0/0 contract checks: nenhuma resposta real gravada ainda (grave uma antes de ler um campo novo da fonte)'); sys.exit(0)
fails, n = [], 0
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    pg.goto((ROOT / 'dist' / 'index.html').as_uri()); pg.wait_for_function('window.__APP && window.__APP.Core')
    for name, (reader, cond) in EXPECT.items():
        n += 1
        data = json.loads((FIX / name).read_text(encoding='utf-8'))
        if not pg.evaluate(f'(j) => {{ const r = window.__APP.Core.{reader}(j); return !!({cond}); }}', data):
            fails.append(f'{name}: {reader} -> {cond}')
    b.close()
for f in fails:
    print('FAIL', f)
print(f'{n - len(fails)}/{n} contract checks passed against {len(files)} recorded responses')
sys.exit(1 if fails else 0)
