// Measures the players run by the app (D10): whole games with only them at the table, in Node, with the core alone.
//   node scripts/ai_bench.mjs [games per cell, default 200]
// For every level, the liberals at that level against cultists at each level (each seat decides at its own level,
// `Player.level`, votes included).
// Prints how often the liberals win and how the games end; then, for each level, how a player of medium level sitting
// in one seat (standing in for a person) does against a table of that level, as a liberal and as a cultist.
// Not part of verify.sh: it takes a few minutes, and its numbers go to docs/decisoes.md (D10) with the date.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests', '.build-bench');
await build({ root, configFile: false, logLevel: 'silent', build: { outDir, emptyOutDir: true, minify: false, target: 'node22', lib: { entry: path.join(root, 'src', 'core', 'index.ts'), formats: ['es'], fileName: () => 'core.mjs' } } });
const { Core } = await import(pathToFileURL(path.join(outDir, 'core.mjs')).href);

const DIAG = process.env.BENCH_DIAG === '1', GAMES = Number(process.argv[2]) || 200, SIZES = [5, 6, 7, 8, 9, 10];
/** One game with every seat run by the app, each seat at the level `levelOf` gives it. */
function play(n, seed, levelOf) {
  const rand = Core.seeded(seed), names = Core.BOT_NAMES.classico.slice(0, n);
  let g = Core.newGame(names, rand, { ai: names.map(() => true) }).game, steps = 0;
  g = { ...g, players: g.players.map((p, i) => ({ ...p, level: levelOf(p, i) })) };
  while (g.phase !== 'over' && steps < 2000) {
    const next = Core.botStep(g, rand);
    if (!next) break;
    g = next; steps++;
  }
  return g;
}
const pct = x => `${Math.round(x * 100)}%`.padStart(4);
console.log(`${GAMES} partidas por célula, mesas de ${SIZES[0]} a ${SIZES[SIZES.length - 1]} (rodízio). Liberais (linha) contra cultistas (coluna): vitórias liberais.`);
console.log('liberais \\ cultistas'.padEnd(22) + Core.LEVELS.map(l => l.padStart(9)).join(''));
let stuck = 0;
const ends = {};
for (const lib of Core.LEVELS) {
  let row = lib.padEnd(22);
  for (const fas of Core.LEVELS) {
    if (DIAG && fas !== lib) { row += '-'.padStart(9); continue; }   // BENCH_DIAG=1: only the same level on both sides, faster
    let won = 0;
    for (let i = 0; i < GAMES; i++) {
      const g = play(SIZES[i % SIZES.length], 7000 * i + 3, p => (p.role === 'liberal' ? lib : fas));
      if (g.phase !== 'over') { stuck++; continue; }
      if (g.winner === 'L') won++;
      if (lib === fas) { const k = `${lib}: ${g.why.replace(/\(.*?\)/, '()')}`; ends[k] = (ends[k] || 0) + 1; }
    }
    row += pct(won / GAMES).padStart(9);
  }
  console.log(row);
}
console.log('\nComo terminam (mesmo nível dos dois lados):');
for (const [k, v] of Object.entries(ends).sort()) console.log(`  ${k}: ${v}`);
console.log(stuck ? `\n${stuck} partidas não terminaram` : '\nTodas as partidas terminaram.');

if (DIAG) process.exit(0);
console.log(`\n"Você" (uma IA média num lugar) contra a mesa de cada nível, ${3 * GAMES} partidas por nível:`);
for (const X of Core.LEVELS) {
  const w = { L: [0, 0], F: [0, 0] };
  for (let i = 0; i < 3 * GAMES; i++) {
    const n = SIZES[i % SIZES.length], me = i % n, g = play(n, 9100 * i + 5, (p, j) => (j === me ? 'medio' : X));
    const p = Core.partyOf(g.players[me].role); w[p][1]++; if (g.winner === p) w[p][0]++;
  }
  console.log(`  mesa ${X.padEnd(8)} você liberal vence ${pct(w.L[0] / w.L[1])}, cultista vence ${pct(w.F[0] / w.F[1])}`);
}
