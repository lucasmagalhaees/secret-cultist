#!/usr/bin/env python3
"""Test guard (D68): nothing new goes in without a test that touches it.

Two checks, both against a baseline of what was already uncovered when the guard came in (tests/guard_baseline.json):
  - every key of the Core object (src/core/index.ts) is used by a test (Core.<key> in a test file);
  - every tap target in the page (data-act="..." in src/app/render.ts) is clicked or looked up by a test.
A new Core function or a new button without a test fails here, in seconds, long before the coverage run finds it.
`--update` rewrites the baseline (only to shrink it: a name that gets a test leaves the list for good)."""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = ROOT / 'tests' / 'guard_baseline.json'
TESTS = ''.join((ROOT / 'tests' / f).read_text() for f in ('unit.cases.mjs', 'e2e.py', 'iphone.py', 'pwa.py', 'core.mjs', 'social.py'))

index = (ROOT / 'src/core/index.ts').read_text()
body = index[index.index('export const Core = {') :]
body = body[: body.index('};')]
core = sorted({k for k in re.findall(r'\b([A-Za-z_][A-Za-z0-9_]*)\b', body.split('{', 1)[1]) if not k.isupper() or len(k) > 1})
core = [k for k in core if re.search(rf'\b{re.escape(k)}\b', body)]
acts = sorted(set(re.findall(r'data-act="([a-z0-9-]+)"', (ROOT / 'src/app/render.ts').read_text())))

untested_core = [k for k in core if not re.search(rf'Core\.{re.escape(k)}\b', TESTS)]
untested_acts = [a for a in acts if not re.search(rf'data-act[=~]?["\']?{re.escape(a)}\b|\[data-act={re.escape(a)}\]|data-act="{re.escape(a)}"', TESTS)]

if '--update' in sys.argv:
    old = json.loads(BASE.read_text()) if BASE.exists() else {'core': untested_core, 'acts': untested_acts}
    new = {'core': sorted(set(old['core']) & set(untested_core)), 'acts': sorted(set(old['acts']) & set(untested_acts))}
    if not BASE.exists(): new = {'core': untested_core, 'acts': untested_acts}
    BASE.write_text(json.dumps(new, indent=1, ensure_ascii=False) + '\n')
    print(f'baseline: {len(new["core"])} Core names, {len(new["acts"])} buttons without a test')
    sys.exit(0)

base = json.loads(BASE.read_text())
new_core = [k for k in untested_core if k not in base['core']]
new_acts = [a for a in untested_acts if a not in base['acts']]
if new_core or new_acts:
    if new_core: print('Core sem teste (use Core.<nome> em tests/unit.cases.mjs):', ', '.join(new_core))
    if new_acts: print('Botões sem teste (data-act que nenhum teste toca):', ', '.join(new_acts))
    sys.exit(1)
print(f'{len(core) - len(untested_core)}/{len(core)} nomes do Core e {len(acts) - len(untested_acts)}/{len(acts)} botões com teste; nada novo sem teste')
