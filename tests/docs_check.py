"""Docs-versus-code check: what the documentation states must be true of the repository.

Usage: python3 tests/docs_check.py
Documentation written from memory drifts. This script pins the claims that can be checked mechanically: links, listed
files, modules, constants, storage keys, versions and rules of the code. No browser, no network. A number quoted in
CLAUDE.md gets a line in CONSTANTS; a rule of the code that can be read off the source gets a check().
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
read = lambda rel: (ROOT / rel).read_text(encoding='utf-8')
fails, n = [], 0

def check(name, cond, detail=''):
    global n
    n += 1
    if not cond:
        fails.append(f'{name}{": " + str(detail) if detail else ""}')

SRC = sorted((ROOT / 'src').rglob('*.ts'))
CORE = [p for p in SRC if '/src/core/' in p.as_posix()]
code = '\n'.join(p.read_text(encoding='utf-8') for p in SRC)
spec, readme, contributing = read('CLAUDE.md') + '\n' + read('docs/requisitos.md'), read('README.md'), read('CONTRIBUTING.md')   # D143: the requirements live in their own file
MD = [p for p in ROOT.rglob('*.md') if not any(x in p.as_posix() for x in ('.git/', 'node_modules'))]

# 1. every relative link in every markdown file points at something that exists
for md in MD:
    for target in re.findall(r'\]\(([^)\s]+)\)', md.read_text(encoding='utf-8')):
        if re.match(r'^(https?:|mailto:|#)', target):
            continue
        check(f'link in {md.relative_to(ROOT)}', (md.parent / target.split('#')[0]).resolve().exists(), target)

# 2. every path in the README "Estrutura" block exists
block = re.search(r'## Estrutura\s+```\n(.*?)```', readme, re.S)
check('README has an "Estrutura" block', bool(block))
for line in (block.group(1).splitlines() if block else []):
    if line.strip():
        check('README lists a path that exists', (ROOT / line.split()[0]).exists(), line.split()[0])

# 3. files the docs name in backticks exist
for rel in set(re.findall(r'`((?:src|tests|docs|scripts|\.github|\.claude)/[\w./-]+)`', spec + readme + contributing)):
    if rel.endswith('...') or rel.startswith(('tests/shots', 'tests/.build', 'tests/.coverage')):
        continue                      # branch-name patterns, and output that only exists after a test run
    check('documented path exists', (ROOT / rel).exists(), rel)

# 4. numbers quoted in the spec are the numbers in the code: (regex over src/, text that must be in CLAUDE.md)
CONSTANTS = [
    (r'const CHECK_EVERY = 30 \* 60e3;', 'a cada 30 min com ele aberto (`CHECK_EVERY`)'),
    (r'MIN_PLAYERS = 5, MAX_PLAYERS = 10', 'Mesa de 5 a 10 jogadores (`MIN_PLAYERS`, `MAX_PLAYERS`)'),
    (r'DECK_F = 11, DECK_L = 6', 'Baralho de 17 leis: 11 cultistas (`DECK_F`) e 6 liberais (`DECK_L`)'),
    (r"WIN: Record<Law, number> = \{ L: 5, F: 6 \};", 'Vitória: 5 leis liberais ou 6 cultistas (`WIN`)'),
    (r'LEADER_KNOWS_UPTO = 6;', 'com 5 ou 6 jogadores (`LEADER_KNOWS_UPTO`) o Líder também vê o cultista'),
    (r'TRACKER_MAX = 3;', '3 governos seguidos sem lei (`TRACKER_MAX`'),
    (r'LEADER_ZONE = 3;', '3 ou mais leis cultistas (`LEADER_ZONE`)'),
    (r'VETO_FROM = 5;', 'Veto a partir da 5ª lei cultista (`VETO_FROM`)'),
    (r'SMALL_TABLE = 5;', 'com 5 vivos ou menos (`SMALL_TABLE`)'),
    (r'export const THINK = 1200;', 'A IA age 1,2 s depois (`THINK`)'),
    (r'export const TALKS = 2;', 'até 2 IAs (`TALKS`)'),
    (r"SPEEDS: Record<Speed, number> = \{ lenta: 2400, normal: THINK, rapida: 500 \}", '(`SPEEDS`: 2,4 s, 1,2 s e 0,5 s)'),
    (r"CLAIM_HOLD: Record<Speed, number> = \{ lenta: 4000, normal: 2500, rapida: 1500 \}", '(`CLAIM_HOLD`: 4 s, 2,5 s e 1,5 s a mais)'),
    (r"export const HISTORY_MAX = 30;", 'as últimas 30 (`HISTORY_MAX`)'),
    (r"LEVELS: Level\[\] = \['facil', 'medio', 'dificil', 'extremo'\]", 'fácil, médio, difícil e extremo (`LEVELS`'),
    (r"CULTISTS: Record<number, number> = \{ 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 4 \}", '(`CULTISTS`: 2 com 5 ou 6, 3 com 7 ou 8, 4 com 9 ou 10)'),
    (r"small: \{ 3: 'peek', 4: 'execute', 5: 'execute' \}", 'com 5 ou 6 jogadores, na 3ª olha as próximas 3 leis'),
    (r"medium: \{ 2: 'investigate', 3: 'special', 4: 'execute', 5: 'execute' \}", 'com 7 ou 8, na 2ª investiga o partido de alguém e na 3ª convoca eleição especial'),
    (r"large: \{ 1: 'investigate', 2: 'investigate', 3: 'special', 4: 'execute', 5: 'execute' \}", 'com 9 ou 10, na 1ª e na 2ª investiga e na 3ª convoca eleição especial'),
]
for pattern, phrase in CONSTANTS:
    check(f'code has {pattern}', re.search(pattern, code + read('src/sw.js')) is not None)
    check(f'spec says "{phrase}"', phrase in spec)
verify = read('scripts/verify.sh')
check('the coverage minimums are the ones the spec gives', '--min-functions 93 --min-chars 95' in verify and '93% das funções e 95% do código' in spec)

# 5. every module is in the architecture tables of the spec
for p in SRC:
    rel = p.relative_to(ROOT).as_posix()
    check('module is documented in CLAUDE.md', f'`{rel}`' in spec, rel)
check('the service worker is documented', '`src/sw.js`' in spec)

# 6. the core is pure: no page, no network, no storage
for p in CORE:
    src = p.read_text(encoding='utf-8')
    for token in ('document.', 'window.', 'localStorage', 'sessionStorage', 'fetch(', 'navigator.', 'XMLHttpRequest', "from '../app"):
        check(f'{p.name} does not touch {token}', token not in src)

# 6b. the app players are blind: the code that decides gets the view of one seat, never the game, and asks no one
ai = read('src/core/ai.ts')
check('src/core/ai.ts never sees the game: no Game in it, nothing from the judge', not re.search(r'\bGame\b', ai) and "from './judge'" not in ai and 'View' in ai)
check('only the judge asks the app players', [p.name for p in CORE if re.search(r'\bdecide(Why)?\(', p.read_text(encoding='utf-8')) and p.name not in ('ai.ts', 'index.ts')] == ['judge.ts'])
# D16: the reasons the app players gave are written down for people to look at, never handed back to an app player
view = re.search(r'export interface View \{.*?\n\}', read('src/core/types.ts'), re.S)
check('the record of reasons (Game.trace) never reaches an app player: not in View, not read in ai.ts', bool(view) and 'trace' not in view.group(0) and not re.search(r'\btrace\b', ai))

# 7. TypeScript as the spec says: strict, no unused names, nothing switched off
ts = json.loads(read('tsconfig.json'))['compilerOptions']
check('tsconfig is strict', ts.get('strict') is True and ts.get('noUnusedLocals') is True)
check('no @ts-ignore or @ts-nocheck anywhere', '@ts-ignore' not in code and '@ts-nocheck' not in code)

# 8. exact versions of the build, and the spec names them
dev = json.loads(read('package.json'))['devDependencies']
check('build tools pinned to exact versions', all(re.fullmatch(r'\d+\.\d+\.\d+', v) for v in dev.values()), dev)
check('the spec names the versions in package.json', f"Vite {dev.get('vite')} com TypeScript {dev.get('typescript')}" in spec, dev)

# 9. the dark palette is the same where the device asks for it and where the person chooses it
css = read('src/styles.css')
a = re.search(r':root:not\(\[data-theme="light"\]\)\{(.*?)\}', css, re.S); b = re.search(r':root\[data-theme="dark"\]\{(.*?)\}', css, re.S)
norm = lambda m: re.sub(r'\s+', '', m.group(1)) if m else None
check('the two copies of the dark palette are identical', a and b and norm(a) == norm(b))
c = re.search(r':root\[data-look="deco"\]:not\(\[data-theme="light"\]\)\{(.*?)\}', css, re.S); e = re.search(r':root\[data-look="deco"\]\[data-theme="dark"\]\{(.*?)\}', css, re.S)
check('the two copies of the art deco dark palette are identical', c and e and norm(c) == norm(e))

# 10. the commit stamp: put in the page by the build, read by the production check
check('the page has the commit stamp the build fills in', '<meta name="app-commit" content="__APP_COMMIT__">' in read('index.html') and "replace('__APP_COMMIT__', commit())" in read('vite.config.js') and 'VERCEL_GIT_COMMIT_SHA' in read('vite.config.js'))
prod = read('scripts/check_production.py')
check('the production check reads that stamp', 'app-commit' in prod)
url = re.search(r"DEFAULT_URL = '([^']+)'", prod)
check('the production address is the same in the check and in the spec', url and url.group(1).rstrip('/') in spec, url and url.group(1))

# 11. what the app keeps on the device is documented
for key in set(re.findall(r"LS\.(?:get|set)\('([^']+)'", code)):
    check('localStorage key is documented', f'`{key}`' in spec, key)

# 12. no select of the system: its list is drawn by the device, with colours of its own
check('no <select> in the app', '<select' not in code and '<select' not in read('index.html') and 'Nenhum seletor do sistema' in spec)

# 13. the service worker: the version the build stamps, the cache the spec names, and nothing kept from elsewhere by default
sw = read('src/sw.js')
check('the worker carries the version placeholder the build replaces', sw.count("'__APP_VERSION__'") == 1 and "replace('__APP_VERSION__', version)" in read('vite.config.js'))
check('the cache of the page is the one the spec names', "'secret-cultist-page-'" in sw and '`secret-cultist-page-<versão>`' in spec)
check('a new version waits for the tap', "event.data === 'activate'" in sw and 'skipWaiting' in sw and sw.count('skipWaiting') == 1)

# 14. the test handle, and the checks the branch protection asks for
main = read('src/main.ts')
check('window.__APP is what the spec says', 'window.__APP = { Core, ui, get S() { return S; } };' in main and '`{Core, ui, S}`' in spec)
ci = read('.github/workflows/ci.yml')
check('the checks the main branch requires exist in CI', 'name: checks' in ci and "name: e2e (${{ matrix.theme }})" in ci and 'theme: [dark]' in ci and '`checks` e `e2e (dark)`' in spec)

for f in fails:
    print('FAIL', f)
print(f'{n - len(fails)}/{n} documentation claims hold')
sys.exit(1 if fails else 0)
