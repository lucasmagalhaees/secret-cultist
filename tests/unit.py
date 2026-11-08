"""Unit tests for the pure core, run in the browser against
the built page: what is tested here is what ships. The cases are in tests/unit.cases.mjs; tests/core.mjs runs the same
ones in Node, against the core alone.

Usage: python3 tests/unit.py   (needs: pip install -r tests/requirements.txt && playwright install chromium)
Loads the page with the network blocked and exercises window.__APP.Core directly. Exits non-zero on any failure.
"""
import pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cov

ROOT = pathlib.Path(__file__).resolve().parent.parent

# the cases live in one file, shared with the Node runner; here they run against window.__APP.Core of the built page
CASES = (ROOT / 'tests' / 'unit.cases.mjs').read_text(encoding='utf-8').replace('export default function cases(', 'function cases(')
JS = '() => {\n' + CASES + '\nreturn cases(window.__APP.Core);\n}'

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    cov.start(page)
    page.goto((ROOT / 'dist' / 'index.html').as_uri())
    page.wait_for_function('window.__APP && window.__APP.Core')
    res = page.evaluate(JS)
    cov.stop(page, 'unit')
    browser.close()

for f in res['fails']:
    print('FAIL', f)
print(f"{res['n'] - len(res['fails'])}/{res['n']} checks passed")
sys.exit(1 if res['fails'] else 0)
