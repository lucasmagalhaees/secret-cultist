// The cases of the pure core, run in Node: no page, no browser.
//   node tests/core.mjs
// Builds src/core by itself with the same tool that builds the app (Vite), imports the result and runs the cases of
// tests/unit.cases.mjs against it. That the core loads and passes here is what shows it needs no DOM, network or
// storage. tests/unit.py runs the same cases in the browser, against the page that ships.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'vite';
import cases from './unit.cases.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests', '.build');

try {
  await build({
    root, configFile: false, logLevel: 'silent',
    build: { outDir, emptyOutDir: true, minify: false, target: 'node22', lib: { entry: path.join(root, 'src', 'core', 'index.ts'), formats: ['es'], fileName: () => 'core.mjs' } }
  });
} catch (e) {
  console.error('core: o build do núcleo falhou:', e && e.message ? e.message : e);
  process.exit(1);
}

// anything the core reaches for that only a page has throws here instead of passing unnoticed
for (const name of ['window', 'document', 'localStorage', 'fetch']) {
  Object.defineProperty(globalThis, name, { configurable: true, get() { throw new Error(`the core touched ${name}`); } });
}
const { Core } = await import(pathToFileURL(path.join(outDir, 'core.mjs')).href);
const res = cases(Core);
for (const f of res.fails) console.log('FAIL', f);
console.log(`${res.n - res.fails.length}/${res.n} checks passed without a browser`);
process.exit(res.fails.length ? 1 : 0);
