// D159: the bunker's room, in Node: random full games through handle(), checking that no seat ever sees a secret it
// should not, and the password. Builds room.ts and key.ts with Vite, like tests/core.mjs does for the core.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { build } from 'vite';
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '.build');
await build({ logLevel: 'silent', configFile: false, build: { outDir: out, emptyOutDir: true, minify: false, target: 'node22', lib: { entry: { room: path.join(here, 'room.ts'), key: path.join(here, 'key.ts') }, formats: ['es'], fileName: (_, n) => `${n}.mjs` } } });
const R = await import(pathToFileURL(path.join(out, 'room.mjs')));
const K = await import(pathToFileURL(path.join(out, 'key.mjs')));

assert.equal(await K.enterBunker('senha errada'), false);
assert.equal(await K.enterBunker(' Bunker '), true);

let seed = 7; const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const step = (room, tok, msg) => R.handle(room, tok, msg, rand, true).room;
let games = 0, wins = { L: 0, F: 0 };
for (const pack of ['classico', 'vermelho']) for (let n = 5; n <= 10; n++) for (let rep = 0; rep < 15; rep++) {
  let room = R.newRoom('ABCDE');
  assert.ok(R.handle(room, 't0', { t: 'join', token: 't0', name: 'A', pw: '' }, rand, false).error);
  for (let i = 0; i < n; i++) room = step(room, 't' + i, { t: 'join', token: 't' + i, name: 'P' + i, pw: 'bunker' });
  assert.ok(R.handle(room, 't9', { t: 'join', token: 'x', name: 'P1', pw: '' }, rand, true).error || n === 10);
  room = step(room, 't0', { t: 'pack', v: pack });
  room = step(room, 't0', { t: 'start' });
  for (let guard = 0; room.game.phase !== 'over' && guard < 2000; guard++) {
    const g = room.game;
    for (let s = 0; s < n; s++) {   // what every seat sees
      const v = R.seatView(room, 't' + s);
      const r = g.players[s].role, knows = r === 'cultista' || (r === 'lider' && n <= 6);
      v.roles.forEach((x, i) => assert.ok(x === null || i === s || knows, 'papel vazou'));
      v.game.players.forEach(p => assert.equal(p.role, 'liberal'));
      assert.equal(v.game.deck.length, 0);
      if (v.game.hand.length) assert.ok(s === g.pres || s === g.chanc);
      if (v.peek || v.party) assert.equal(s, g.pres);
      assert.equal(v.game.hist.length, 0);
      assert.ok(!JSON.stringify(v).includes('"drew":["'));
    }
    const alive = g.players.map((p, i) => (p.alive ? i : -1)).filter(i => i >= 0), pick = a => a[Math.floor(rand() * a.length)];
    const P = 't' + g.pres, C = 't' + g.chanc;
    if (g.phase === 'nominate') room = step(room, P, { t: 'act', a: 'nominate', i: pick(alive.filter(i => i !== g.pres && i !== g.lastChanc && (alive.length <= 5 || i !== g.lastPres))) });
    else if (g.phase === 'vote') for (const i of alive) room = step(room, 't' + i, { t: 'vote', v: rand() < 0.6 });
    else if (g.phase === 'president') room = step(room, P, { t: 'act', a: 'pdiscard', i: 0 });
    else if (g.phase === 'chancellor') room = rand() < 0.3 && g.laws.F >= 5 && !g.vetoed ? step(room, C, { t: 'act', a: 'veto' }) : step(room, C, { t: 'act', a: 'cdiscard', i: Math.floor(rand() * 2) });
    else if (g.phase === 'veto') room = step(room, P, { t: 'act', a: 'answer', v: rand() < 0.5 });
    else if (['investigate', 'special', 'execute'].includes(g.phase)) room = step(room, P, { t: 'act', a: 'target', i: pick(alive.filter(i => i !== g.pres && !(g.phase === 'investigate' && g.seen.includes(i)))) });
    else room = step(room, P, { t: 'act', a: 'done' });
    assert.ok(room.game !== g || g.phase === 'vote', 'jogada não andou: ' + g.phase);
  }
  assert.equal(room.game.phase, 'over'); games++; wins[room.game.winner]++;
  const end = R.seatView(room, 't1'); assert.ok(end.roles.every(x => x));
  assert.ok(R.handle(room, 't1', { t: 'start' }, rand, true).error);
  assert.equal(step(room, 't0', { t: 'start' }).game.phase, 'nominate');
}
console.log(`bunker: ${games} partidas inteiras pela sala, nenhum segredo vazou (liberais ${wins.L}, ${wins.F} do outro lado)`);
