#!/usr/bin/env python3
"""Which tests a change may break (D68), before running them.

Reads the diff against the base branch (origin/main by default) and indexes what the tests hold on to in the page:
ids, data-act values, classes and words shown. Every such handle that a change removed or rewrote in src/app/ or
src/styles.css is looked up in the tests, and each test line that uses it is listed, so the test can be moved along
with the screen in the same commit. A precise index of selectors, not a guess: a test only breaks through a handle.

  python3 scripts/affected.py [base]      # prints the handles and the test lines that use them; never fails"""
import pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
base = sys.argv[1] if len(sys.argv) > 1 else 'origin/main'
try:
    diff = subprocess.run(['git', 'diff', '-U0', base, '--', 'src/app', 'src/styles.css'], cwd=ROOT, capture_output=True, text=True, check=True).stdout
except subprocess.CalledProcessError:
    print(f'sem diff contra {base}'); sys.exit(0)
removed = '\n'.join(l[1:] for l in diff.splitlines() if l.startswith('-') and not l.startswith('---'))
added = '\n'.join(l[1:] for l in diff.splitlines() if l.startswith('+') and not l.startswith('+++'))
handles = set()
for pat in (r'id="([A-Za-z][\w-]*)"', r'data-act="([\w-]+)"', r'class="([\w -]+)"', r'^\.([a-z][\w-]+)[{ ,:.]', r'#([a-z][\w-]+)[{ ,:.]', r'@keyframes ([\w-]+)'):
    for m in re.findall(pat, removed, flags=re.M):
        handles.update(x for x in m.split() if len(x) > 2)
gone = sorted(h for h in handles if not re.search(rf'\b{re.escape(h)}\b', added))
changed = sorted(handles - set(gone))
tests = {f: (ROOT / 'tests' / f).read_text().splitlines() for f in ('e2e.py', 'iphone.py', 'pwa.py')}
hits = []
for h in gone + changed:
    for f, lines in tests.items():
        for n, line in enumerate(lines, 1):
            if re.search(rf'(#|\.|data-act=|\[data-act=|"){re.escape(h)}\b', line):
                hits.append((h, h in gone, f, n, line.strip()[:140]))
if not hits:
    print(f'nenhum teste de tela usa o que mudou ({len(handles)} marcas conferidas)'); sys.exit(0)
for h, g, f, n, line in hits:
    print(f'{"SUMIU " if g else "mudou "} {h:<18} tests/{f}:{n}  {line}')
print(f'{len({x[0] for x in hits})} marcas mudadas aparecem em {len(hits)} linhas de teste: confira antes de rodar o e2e')
