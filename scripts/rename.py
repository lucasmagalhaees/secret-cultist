#!/usr/bin/env python3
"""Gives the template its name: replaces "Meu App", "meu-app" and "meuapp" everywhere in the repository.

Usage: python3 scripts/rename.py "Nome do App" nome-do-app
The second argument is the slug: lower case, letters, digits and hyphens. It names the package, the address on Vercel
(https://<slug>.vercel.app), the caches of the service worker and, without the hyphens, the key in localStorage.
Run it once, right after copying the template, before the first deploy.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {'.git', 'node_modules', 'dist', 'tests/.build', 'tests/.coverage', 'tests/shots'}

def main(name, slug):
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', slug):
        sys.exit('o slug é em minúsculas, com letras, números e hífens: nome-do-app')
    pairs = [('Meu App', name), ('meu-app', slug), ('meuapp', slug.replace('-', ''))]
    changed = []
    for p in sorted(ROOT.rglob('*')):
        rel = p.relative_to(ROOT).as_posix()
        if not p.is_file() or any(rel == s or rel.startswith(s + '/') for s in SKIP) or rel == 'scripts/rename.py':
            continue
        try:
            text = p.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        new = text
        for a, b in pairs:
            new = new.replace(a, b)
        if new != text:
            p.write_text(new, encoding='utf-8'); changed.append(rel)
    print(f'{len(changed)} arquivos com o nome novo:', ', '.join(changed))
    print('Depois: npm install (para o package-lock.json levar o nome novo) e scripts/verify.sh')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
