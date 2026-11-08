// Compare a previous core entry point with this revision, swapping factions on the same seeds and table sizes.
// Usage: node scripts/ai_compare.mjs /absolute/path/to/baseline/src/core/index.ts [games per faction, default 60]
// A sample is descriptive, not proof of a universal ordering of difficulty levels. No part of verify.sh.
import { build } from 'vite';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = process.argv[2];
const games = Number(process.argv[3] ?? 60);
if (!baseline || !Number.isInteger(games) || games < 1) {
  console.error('Usage: node scripts/ai_compare.mjs <baseline core entry.ts> [positive integer games per faction]');
  process.exit(1);
}
async function load(entry, name) {
  const outDir = path.join(root, 'tests', '.build-bench', name);
  await build({ root, configFile: false, logLevel: 'silent', build: { outDir, emptyOutDir: true, minify: false, target: 'node22', lib: { entry, formats: ['es'], fileName: () => 'core.mjs' } } });
  return (await import(pathToFileURL(path.join(outDir, 'core.mjs')).href)).Core;
}
const previous = await load(path.resolve(baseline), 'previous');
const current = await load(path.join(root, 'src/core/index.ts'), 'current');
// A 95% Wilson interval for the observed fraction, accounting for sample size.
function interval(w, n) {
  const z = 1.96, p = w / n, d = 1 + z * z / n;
  const mid = (p + z * z / (2 * n)) / d;
  const radius = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [mid - radius, mid + radius].map(x => `${Math.round(x * 100)}%`).join('–');
}
let stuck = 0;
for (const level of current.LEVELS) {
  const row = { level, gamesPerFaction: games };
  for (const faction of ['L', 'F']) {
    let won = 0, finished = 0;
    const start = performance.now();
    for (let i = 0; i < games; i++) {
      const n = 5 + i % 6, rand = current.seeded(7000 * i + 3);
      const names = current.BOT_NAMES.classico.slice(0, n);
      let g = current.newGame(names, rand, { ai: names.map(() => true), level }).game;
      for (let step = 0; step < 2000 && g.phase !== 'over'; step++) {
        const actor = current.botTurn(g);
        if (!actor) break;
        // Keep the judge, rules and explanations identical: swap only the AI's decision function by actor faction.
        if (actor.ask === 'votes') {
          const ballots = {};
          for (let seat = 0; seat < g.players.length; seat++) {
            const p = g.players[seat];
            if (!p.alive) continue;
            const engine = current.partyOf(p.role) === faction ? current : previous;
            ballots[seat] = engine.decide(current.viewOf(g, seat, 'vote', [1, 0]), rand) === 1;
          }
          // castVotes rolls AI votes internally: temporarily treat each seat as a person, then restore its metadata.
          const players = g.players;
          g = current.castVotes({ ...g, players: players.map(p => ({ ...p, ai: undefined })) }, ballots, rand);
          g = { ...g, players: g.players.map((p, j) => ({ ...p, ai: players[j].ai })) };
        } else if (actor.ask === 'reveal' || actor.ask === 'see') {
          g = current.botStep(g, rand);
        } else {
          const engine = current.partyOf(g.players[actor.seat].role) === faction ? current : previous;
          const v = current.viewOf(g, actor.seat, actor.ask, actor.options);
          const a = engine.decide(v, rand);
          switch (actor.ask) {
            case 'pc': case 'cc': case 'inv': case 'peek': g = current.say(g, actor.seat, actor.ask, a); break;
            case 'talk': g = current.talk(g, actor.seat, a); break;
            case 'nominate': g = current.nominate(g, a); break;
            case 'pdiscard': g = current.presidentDiscard(g, a); break;
            case 'cdiscard': g = a === 2 ? current.askVeto(g) : current.chancellorDiscard(g, a, rand); break;
            case 'veto': g = current.answerVeto(g, a === 1, rand); break;
            case 'investigate': g = current.investigate(g, a); break;
            case 'special': g = current.specialElect(g, a); break;
            case 'execute': g = current.execute(g, a); break;
            default: throw new Error(`Unexpected question: ${actor.ask}`);
          }
        }
      }
      if (g.phase === 'over') { finished++; if (g.winner === faction) won++; }
      else stuck++;
    }
    row[faction] = { won, finished, winRate: `${Math.round(100 * won / games)}%`, interval95: interval(won, games), ms: Math.round(performance.now() - start) };
  }
  console.log(JSON.stringify(row));
}
console.log(JSON.stringify({ stuck }));
process.exitCode = stuck ? 1 : 0;
