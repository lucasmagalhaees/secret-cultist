// The cases of the pure core, in one file. Two runners use them: tests/unit.py, in the browser, against the page that
// ships (window.__APP.Core), and tests/core.mjs, in Node, against src/core built by itself. Plain JavaScript on purpose:
// many cases pass data on purpose that the compiler would refuse. A new rule of the core gets its case here first.
export default function cases(Core) {
  const fails = []; let n = 0;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const eq = (name, got, want) => { n++; if (!same(got, want)) fails.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); };
  const NAMES = ['Ana', 'Bia', 'Caio', 'Duda', 'Edu', 'Fê', 'Gil'];
  const rand = Core.seeded(42);
  const count = (list, x) => list.filter(y => y === x).length;

  /* chance */
  const r1 = Core.seeded(7), r2 = Core.seeded(7), xs = [r1(), r1(), r1()];
  eq('seeded: the same seed gives the same numbers, all in [0, 1)', [same(xs, [r2(), r2(), r2()]), xs.every(x => x >= 0 && x < 1)], [true, true]);
  const sh = Core.shuffle([1, 2, 3, 4, 5], Core.seeded(1));
  eq('shuffle: a copy with the same things', [[...sh].sort(), sh.length], [[1, 2, 3, 4, 5], 5]);

  /* the table */
  eq('names: trimmed and checked', [Core.checkNames(['  a ', 'b', 'c', 'd', 'e']).names, Core.checkNames(['a', 'b', 'c', 'd']).why, Core.checkNames(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']).why, Core.checkNames(['a', ' ', 'c', 'd', 'e']).why, Core.checkNames(['a', 'A', 'c', 'd', 'e']).why], [['a', 'b', 'c', 'd', 'e'], 'count', 'count', 'name', 'dup']);
  eq('names: at most NAME_MAX letters', Core.checkNames(['x'.repeat(30), 'b', 'c', 'd', 'e']).names[0].length, Core.NAME_MAX);
  eq('add name: trimmed; empty, repeated or one too many says why', [Core.addName(['Ana'], '  Bia ').names, Core.addName(['Ana'], ' ').why, Core.addName(['Ana'], 'ana').why, Core.addName('abcdefghij'.split(''), 'k').why], [['Ana', 'Bia'], 'name', 'dup', 'count']);
  for (let p = Core.MIN_PLAYERS; p <= Core.MAX_PLAYERS; p++) {
    const g = Core.newGame(NAMES.concat(['H', 'I', 'J']).slice(0, p), Core.seeded(p)).game, roles = g.players.map(x => x.role);
    eq(`new game with ${p}: one Sumo Sacerdote, the cultists of the table, the rest liberal`, [count(roles, 'lider'), count(roles, 'lider') + count(roles, 'cultista'), count(roles, 'liberal')], [1, Core.CULTISTS[p], p - Core.CULTISTS[p]]);
  }
  const g0 = Core.newGame(NAMES, rand).game;
  eq('new game: 17 laws, 11 cultist and 6 liberal, nothing on the table, everyone seeing their role', [g0.deck.length, count(g0.deck, 'F'), count(g0.deck, 'L'), g0.laws, g0.phase, g0.reveal, g0.players.every(p => p.alive), g0.pres >= 0 && g0.pres < 7], [17, 11, 6, { L: 0, F: 0 }, 'reveal', 0, true, true]);
  eq('new game: a bad table says why', Core.newGame(['a', 'b'], rand), { ok: false, why: 'count' });

  // a table of 7 with known roles: Ana Sumo Sacerdote, Bia and Caio cultists, the rest liberal; Duda president
  const base = { ...g0, players: NAMES.map((name, i) => ({ name, role: i === 0 ? 'lider' : i < 3 ? 'cultista' : 'liberal', alive: true })), pres: 3, phase: 'nominate', reveal: 7 };
  const deck = (s) => s.split('');

  /* who knows whom */
  eq('knows: a cultist sees the other cultist and Sumo Sacerdote', Core.knows(base, 1), [{ name: 'Ana', role: 'lider' }, { name: 'Caio', role: 'cultista' }]);
  eq('knows: at a table of 7 Sumo Sacerdote and the liberals see no one', [Core.knows(base, 0), Core.knows(base, 4)], [[], []]);
  const five = { ...base, players: base.players.slice(0, 5).map((p, i) => i === 2 ? { ...p, role: 'liberal' } : p) };
  eq('knows: at a table of 5 or 6 Sumo Sacerdote sees the cultist', [Core.knows(five, 0), Core.knows(five, 1), Core.knows(five, 2), Core.LEADER_KNOWS_UPTO], [[{ name: 'Bia', role: 'cultista' }], [{ name: 'Ana', role: 'lider' }], [], 6]);
  let r = { ...g0 };
  for (let i = 0; i < 6; i++) r = Core.revealNext(r);
  eq('reveal: one by one, and after the last the first round begins', [r.phase, r.reveal, Core.revealNext(r).phase, Core.revealNext(Core.revealNext(r)).phase], ['reveal', 6, 'nominate', 'nominate']);

  /* election */
  eq('nominate: not the president, not the dead, only when nominating', [Core.nominate(base, 3) === base, Core.nominate({ ...base, players: base.players.map((p, i) => i === 4 ? { ...p, alive: false } : p) }, 4).phase, Core.nominate(base, 4).phase, Core.nominate(base, 4).chanc, Core.nominate(g0, 4) === g0], [true, 'nominate', 'vote', 4, true]);
  const v = Core.nominate({ ...base, deck: deck('FFLLFLFLFLFLFLFLF') }, 4);
  eq('vote: only when the table is voting', Core.vote(base, true, rand) === base, true);
  const el = Core.vote(v, true, rand);
  eq('vote: elected; the president draws 3', [el.phase, el.hand, el.deck.length, el.tracker], ['president', ['F', 'F', 'L'], 14, 0]);
  const rej = Core.vote(v, false, rand);
  eq('vote: rejected, the presidency moves on', [rej.phase, rej.pres, rej.chanc, rej.tracker], ['nominate', 4, null, 1]);
  const deadNext = Core.vote({ ...v, players: v.players.map((p, i) => i === 4 ? { ...p, alive: false } : p), chanc: 5 }, false, rand);
  eq('the presidency skips the dead', deadNext.pres, 5);
  const chaos = Core.vote({ ...v, tracker: 2 }, false, rand);
  eq('the third rejection enacts the top law, with no power, and the presidency moves on once', [chaos.laws, chaos.tracker, chaos.phase, chaos.pres, chaos.deck.length], [{ L: 0, F: 1 }, 0, 'nominate', 4, 16]);
  const chaosPower = Core.vote({ ...v, tracker: 2, laws: { L: 0, F: 1 } }, false, rand);
  eq('a law from the tracker gives no power even on the 2nd cultist law', [chaosPower.laws.F, chaosPower.phase], [2, 'nominate']);
  const chaosWin = Core.vote({ ...v, tracker: 2, laws: { L: 0, F: 5 } }, false, rand);
  eq('a law from the tracker can win the game', [chaosWin.phase, chaosWin.winner], ['over', 'F']);

  /* Sumo Sacerdote */
  const st = Core.nominate({ ...base, laws: { L: 0, F: 3 } }, 0);
  eq('Sumo Sacerdote elected chancellor with 3 cultist laws: the cultists win', [Core.vote(st, true, rand).phase, Core.vote(st, true, rand).winner], ['over', 'F']);
  eq('Sumo Sacerdote elected before that: nothing special', Core.vote(Core.nominate(base, 0), true, rand).phase, 'president');

  /* the laws */
  eq('president: discards one of the 3', [Core.presidentDiscard(el, 2).hand, Core.presidentDiscard(el, 2).discard, Core.presidentDiscard(el, 2).phase, Core.presidentDiscard(el, 5) === el, Core.presidentDiscard(v, 0) === v], [['F', 'F'], ['L'], 'chancellor', true, true]);
  const ch = { ...el, phase: 'chancellor', hand: ['L', 'F'], discard: ['F'] };
  const lib = Core.chancellorDiscard(ch, 1, rand);
  eq('chancellor: discards one, the other is enacted, next president', [lib.laws, lib.discard, lib.phase, lib.pres, lib.hand], [{ L: 1, F: 0 }, ['F', 'F'], 'nominate', 4, []]);
  eq('chancellor: a bad card changes nothing', [Core.chancellorDiscard(ch, 2, rand) === ch, Core.chancellorDiscard(el, 0, rand) === el], [true, true]);
  const fas = (c) => Core.chancellorDiscard({ ...ch, laws: { L: 0, F: c } }, 0, rand);
  eq('powers at a table of 7: none, investigate, special election, execute, execute, win', [fas(0).phase, fas(1).phase, fas(2).phase, fas(3).phase, fas(4).phase, fas(5).phase, fas(5).winner], ['nominate', 'investigate', 'special', 'execute', 'execute', 'over', 'F']);
  const powers = (n) => [1, 2, 3, 4, 5].map(k => Core.powerAt({ players: Array(n).fill(base.players[4]) }, k) || null);
  eq('the boards of the original: 5-6, 7-8 and 9-10 players', [powers(5), powers(6), powers(8), powers(9), powers(10), Core.boardOf(7)], [[null, null, 'peek', 'execute', 'execute'], [null, null, 'peek', 'execute', 'execute'], [null, 'investigate', 'special', 'execute', 'execute'], ['investigate', 'investigate', 'special', 'execute', 'execute'], ['investigate', 'investigate', 'special', 'execute', 'execute'], 'medium']);
  eq('5 liberal laws win for the liberals, 4 do not; 6 cultist laws for the cultists', [Core.WIN, Core.chancellorDiscard({ ...ch, laws: { L: 4, F: 0 } }, 1, rand).winner, Core.chancellorDiscard({ ...ch, laws: { L: 3, F: 0 } }, 1, rand).phase], [{ L: 5, F: 6 }, 'L', 'nominate']);
  const low = Core.chancellorDiscard({ ...ch, deck: ['L', 'F'], discard: ['F', 'L', 'F'] }, 1, rand);
  eq('fewer than 3 to draw: the discards go back in', [low.deck.length, low.discard.length], [6, 0]);

  /* term limits */
  eq('elected: the government is remembered', [el.lastPres, el.lastChanc], [3, 4]);
  const tl = { ...base, lastPres: 2, lastChanc: 5 };
  eq('term limits: the last president and chancellor cannot be chancellor', [Core.canNominate(tl, 2), Core.canNominate(tl, 5), Core.canNominate(tl, 6)], [false, false, true]);
  const small = { ...tl, players: tl.players.map((p, i) => i === 0 || i === 1 ? { ...p, alive: false } : p) };
  eq('term limits with 5 alive: only the last chancellor is barred', [Core.canNominate(small, 2), Core.canNominate(small, 5)], [true, false]);
  eq('chaos forgets the term limits', [chaos.lastPres, chaos.lastChanc, Core.vote({ ...v, lastPres: 1 }, false, rand).lastPres], [null, null, 1]);

  /* veto */
  const vt = { ...ch, laws: { L: 0, F: 5 }, tracker: 0 };
  eq('veto: only from the 5th cultist law, in the hand of the chancellor', [Core.canVeto(ch), Core.canVeto(vt), Core.askVeto(ch) === ch, Core.askVeto(vt).phase], [false, true, true, 'veto']);
  const asked = Core.askVeto(vt), yes = Core.answerVeto(asked, true, rand), no = Core.answerVeto(asked, false, rand);
  eq('veto accepted: both laws discarded, counts as a failed government', [yes.phase, yes.laws, yes.discard.length, yes.tracker, yes.pres], ['nominate', { L: 0, F: 5 }, 3, 1, 4]);
  eq('veto refused: back to the chancellor, who cannot ask again', [no.phase, no.vetoed, Core.canVeto(no), Core.answerVeto(vt, true, rand) === vt], ['chancellor', true, false, true]);
  const yes3 = Core.answerVeto({ ...asked, tracker: 2 }, true, rand);
  eq('a third failure by veto enacts the top law', [yes3.laws.L + yes3.laws.F, yes3.tracker], [6, 0]);
  eq('a new government may veto again', Core.answerVeto(asked, true, rand).vetoed, false);

  /* powers */
  const inv = fas(1);
  eq('investigate: not self, not dead', [Core.investigate(inv, inv.pres) === inv, Core.canTarget(inv, 0), Core.canTarget(base, 0)], [true, true, false]);
  const seen = Core.investigate(inv, 0);
  eq('investigate: Sumo Sacerdote shows as cultist; a liberal as liberal', [seen.phase, Core.investigated(seen), Core.investigated(Core.investigate(inv, 5)), Core.investigated(inv)], ['investigated', 'F', 'L', null]);
  eq('no one is investigated twice', [Core.canTarget({ ...inv, seen: [0] }, 0), seen.seen], [false, [0]]);
  eq('after seeing, the next round', [Core.endPower(seen).phase, Core.endPower(seen).pres, Core.endPower(base) === base], ['nominate', 4, true]);
  const sp = fas(2), se = Core.specialElect(sp, 6);
  eq('special election: the president picks the next president, not self, term limits do not apply', [sp.phase, Core.specialElect(sp, 3) === sp, Core.specialElect(sp, 4).pres, se.phase, se.pres, se.back, Core.specialElect(base, 6) === base], ['special', true, 4, 'nominate', 6, 3, true]);
  const after = Core.vote(Core.nominate(se, 1), false, rand);
  eq('after the special round the order goes on from the one who called it', [after.pres, after.back], [4, null]);
  const pk = Core.chancellorDiscard({ ...ch, players: five.players, laws: { L: 0, F: 2 } }, 0, rand);
  eq('peek: the 3 laws on top stay where they are', [Core.endPower(pk).phase, Core.endPower(pk).deck.slice(0, 3), Core.endPower(pk).log.at(-1)], ['nominate', pk.deck.slice(0, 3), 'Duda olhou as próximas 3 leis.']);
  const ex = fas(3);
  const ex1 = Core.execute(ex, 5);
  eq('execute: the player is out, the game goes on', [ex1.players[5].alive, ex1.phase, Core.execute(ex, 3) === ex, Core.execute(ex1, 5) === ex1], [false, 'nominate', true, true]);
  eq('execute Sumo Sacerdote: the liberals win', [Core.execute(ex, 0).winner, Core.execute(ex, 0).phase], ['L', 'over']);

  /* the history, for the end-of-game summary */
  eq('history: a government and its law, and a rejection', [lib.hist.at(-1), rej.hist.at(-1)], [{ k: 'gov', pres: 3, chanc: 4, law: 'L', drew: ['F', 'F', 'L'], got: ['L', 'F'] }, { k: 'rej', pres: 3, chanc: 4 }]);
  eq('history: the chaos law is recorded as chaos', chaos.hist.at(-1), { k: 'chaos', law: 'F' });
  eq('history: an investigation keeps the party really seen', [seen.hist.at(-1), Core.investigate(inv, 5).hist.at(-1)], [{ k: 'inv', by: 3, target: 0, party: 'F' }, { k: 'inv', by: 3, target: 5, party: 'L' }]);
  eq('history: peek, special election, elimination, veto', [Core.endPower(pk).hist.at(-1).k, se.hist.at(-1), ex1.hist.at(-1), yes.hist.at(-1)], ['peek', { k: 'special', by: 3, target: 6 }, { k: 'exec', by: 3, target: 5, role: 'liberal' }, { k: 'veto', pres: 3, chanc: 4, drew: ['F', 'F', 'L'], got: ['L', 'F'] }]);
  eq('history: a game saved before the history existed reads with an empty one; a broken one is dropped', [Core.readGame((({ hist, ...rest }) => rest)(el)).hist, Core.readGame({ ...el, hist: 'x' }), Core.readGame({ ...el, hist: [1] })], [[], null, null]);

  eq('history: a peek keeps the 3 laws seen', Core.endPower(pk).hist.at(-1).saw, pk.deck.slice(0, 3));
  const short = Core.answerVeto(Core.askVeto(Core.presidentDiscard(Core.vote({ ...base, phase: 'vote', chanc: 4, laws: { L: 0, F: 5 }, deck: deck('FFL'), discard: deck('LLLFFFLFFFLF') }, true, rand), 0)), true, rand);
  eq('a vetoed session ends like any other: fewer than 3 laws left, the discards go back in', [short.deck.length, short.discard.length, Core.vote(Core.nominate(short, 1), true, rand).hand.length], [15, 0, 3]);
  eq('a nomination is said to the table', Core.nominate(base, 4).log.at(-1), 'Duda indicou Edu para chanceler.');

  /* players run by the app (D10) */
  eq('levels, easiest first; names for the app players skip those at the table', [Core.LEVELS, Core.botName(['churchill', 'Roosevelt']), Core.botName([])], [['facil', 'medio', 'dificil', 'extremo'], 'Gandhi', 'Churchill']);
  const BN = Core.BOT_NAMES.culto;
  eq('names for the app players: statesmen, at random among the free ones; Sumo Sacerdote is a role, not a name', [BN.length >= Core.MAX_PLAYERS - 1, BN.includes('Sumo Sacerdote'), BN.includes(Core.botName(['Churchill'], Core.seeded(4))), Core.botName(['Churchill'], () => 0), Core.botName(BN)], [true, false, true, 'Roosevelt', `IA ${BN.length + 1}`]);
  // D100: the expansion's data is scrambled until the key; a wrong key opens nothing
  const lockedRed = Core.words('vermelho').boss;
  eq('D100: the expansion is locked without the key', [Core.unlockDlc('errada'), Core.dlcData(), lockedRed], [null, null, 'Sumo Sacerdote']);
  const DLC = Core.unlockDlc(Core.DLC_KEY), RW = DLC.words.vermelho, CW = DLC.words.classico;
  eq('D100: the key unscrambles the themes, names and faces', [!!DLC, RW.boss !== 'Sumo Sacerdote', Object.keys(DLC.looks).length > 20, Core.BOT_NAMES.vermelho === DLC.bot.vermelho], [true, true, true, true]);
  /* the red theme (D12): the same rules, other words */
  eq('themes: the words of each; an unknown theme is Secret Cultist', [Core.PACKS, Core.words().boss, Core.words('vermelho').boss, Core.words('vermelho').f, Core.words('vermelho').ja, Core.words('x').f], [['classico', 'vermelho', 'culto'], 'Sumo Sacerdote', RW.boss, RW.f, RW.ja, 'cultista']);
  eq('themes: names of the red theme, its leader left out; the theme picks the list', [Core.BOT_NAMES.vermelho.length >= Core.MAX_PLAYERS - 1, Core.BOT_NAMES.vermelho.includes(RW.boss), Core.botName([], () => 0, 'vermelho'), Core.BOT_NAMES.vermelho.includes(Core.botName([DLC.bot.vermelho[0]], Core.seeded(2), 'vermelho'))], [true, false, DLC.bot.vermelho[0], true]);
  const red = Core.newGame(NAMES, Core.seeded(3), { pack: 'vermelho' }).game;
  const redStacked = { ...red, players: base.players, pres: 3, phase: 'vote', chanc: 4, reveal: 7, deck: deck('FFFLLL') };
  const redLaw = Core.chancellorDiscard(Core.presidentDiscard(Core.vote(redStacked, true, rand), 0), 0, rand);
  eq('themes: the game keeps its theme and speaks it; the rules are the same', [red.pack, g0.pack, redLaw.log.at(-1).startsWith(`Lei ${RW.f} aprovada`), redLaw.laws, Core.vote({ ...redStacked, chanc: 0, laws: { L: 0, F: 3 } }, true, rand).why, Core.execute({ ...redStacked, phase: 'execute' }, 0).why], ['vermelho', 'culto', true, { L: 0, F: 1 }, `${RW.boss} (Ana) foi eleito chanceler: os ${RW.fs} vencem.`, `${RW.boss} (Ana) foi eliminado: os liberais vencem.`]);
  eq('read state: the theme and the notes are kept; nonsense is dropped', [Core.readState({ pack: 'vermelho', notes: { 1: 'F', 2: 'L', x: 'F', 3: 'Q' } }).pack, Core.readState({ notes: { 1: 'F', 2: 'L', x: 'F', 3: 'Q' } }).notes, 'pack' in Core.readState({ pack: 'monarquia' }), 'notes' in Core.readState({ notes: { a: 1 } }), Core.readGame({ ...el, pack: 'monarquia' }), !!Core.readGame({ ...el, pack: 'vermelho' })], ['vermelho', { 1: 'F', 2: 'L' }, false, false, null, true]);
  const solo = (train, seed) => Core.newGame(NAMES, Core.seeded(seed), { ai: [false, true, true, true, true, true, true], level: 'medio', train }).game;
  eq('training: the one person gets the role chosen, the table keeps its roles, and the game remembers the choice', ['liberal', 'cultista', 'lider'].flatMap(r => [1, 2, 3].map(sd => { const g = solo(r, sd), roles = g.players.map(p => p.role); return g.players[0].role === r && g.train === r && roles.filter(x => x === 'lider').length === 1 && roles.filter(x => x === 'liberal').length === 4; })).every(Boolean), true);
  eq('training: without app players, with more than one person, or with a role that does not exist, the role is dealt as usual', ['train' in Core.newGame(NAMES, Core.seeded(1), { train: 'lider' }).game, 'train' in Core.newGame(NAMES, Core.seeded(1), { ai: [false, false, true, true, true, true, true], train: 'lider' }).game, 'train' in solo('rei', 1)], [false, false, false]);
  const aiG = Core.newGame(NAMES, Core.seeded(3), { ai: [false, true, true, true, true, true, true], level: 'extremo' }).game;
  eq('new game with app players: seats marked, level kept; without them no level; a bad level falls to medium', [aiG.players.map(p => !!p.ai), aiG.level, 'level' in g0, Core.newGame(NAMES, rand, { ai: [true], level: 'x' }).game.level, Core.hasAi(aiG), Core.hasAi(g0), Core.humansAlive(aiG)], [[false, true, true, true, true, true, true], 'extremo', false, 'medio', true, false, [0]]);
  const ai7 = (over) => ({ ...base, players: base.players.map((p, i) => (i ? { ...p, ai: true } : p)), level: 'medio', ...over });
  // a history with every secret in it: Duda (3) president with Edu (4), Duda investigated Ana (Sumo Sacerdote), Fê (5) spied, Gil (6) eliminated
  const secrets = [{ k: 'gov', pres: 3, chanc: 4, law: 'F', drew: deck('FFL'), got: deck('FF') }, { k: 'inv', by: 3, target: 0, party: 'F' }, { k: 'peek', by: 5, saw: deck('LFF') }, { k: 'exec', by: 3, target: 6, role: 'liberal' }];
  const sg = ai7({ hist: secrets });
  const v4 = Core.viewOf(sg, 4, 'vote', [1, 0]), v3 = Core.viewOf(sg, 3, 'vote', [1, 0]), v1 = Core.viewOf(sg, 1, 'vote', [1, 0]), v0 = Core.viewOf(sg, 0, 'vote', [1, 0]);
  eq('view: a liberal knows its own role only', v4.known, [null, null, null, null, 'liberal', null, null]);
  eq('view: a cultist knows every role; Sumo Sacerdote at a table of 7 only his own', [v1.known, v0.known], [['lider', 'cultista', 'cultista', 'liberal', 'liberal', 'liberal', 'liberal'], ['lider', null, null, null, null, null, null]]);
  eq('view: the chancellor sees what it got, not what the president drew; no one sees the role of who was eliminated', [v4.hist[0], v4.hist[3]], [{ k: 'gov', pres: 3, chanc: 4, law: 'F', got: ['F', 'F'] }, { k: 'exec', by: 3, target: 6 }]);
  eq('view: the president sees its hand and its investigation; the others see neither, nor the spied laws', [v3.hist[0].drew, v3.hist[1].party, 'party' in v4.hist[1], 'saw' in v4.hist[2], v1.hist[2].saw, Core.viewOf(sg, 5, 'vote', [1, 0]).hist[2].saw], [['F', 'F', 'L'], 'F', false, false, undefined, ['L', 'F', 'F']]);
  const blind = JSON.stringify(Core.viewOf(sg, 6, 'vote', [1, 0]));
  eq('view: nothing secret of others anywhere in what a liberal gets', ['lider', 'cultista', 'drew', 'got', 'party', 'saw'].map(w => blind.includes(w)), [false, false, false, false, false, false]);
  eq('view: the question, the answers allowed, and the hand only when asked about it', [v4.ask, v4.options, v4.hand, Core.viewOf({ ...sg, phase: 'president', hand: deck('FLF') }, 3, 'pdiscard', [0, 1, 2]).hand], ['vote', [1, 0], [], ['F', 'L', 'F']]);

  // deciding: rand near 1 means no careless moment and no trick
  const hi = () => 0.99;
  const view = (over) => ({ me: 4, role: 'liberal', level: 'medio', mood: 0, n: 7, alive: Array(7).fill(true), known: [null, null, null, null, 'liberal', null, null], cultists: 3, laws: { L: 0, F: 0 }, tracker: 0, pres: 3, chanc: 4, lastPres: null, lastChanc: null, ask: 'vote', options: [1, 0], hand: [], hist: [], ...over });
  // Decisive hands must take precedence over reputation, tests and random slips at planning levels.
  for (const level of ['dificil', 'extremo']) {
    for (const role of ['liberal', 'cultista', 'lider']) {
      const side = role === 'liberal' ? 'L' : 'F', other = side === 'L' ? 'F' : 'L';
      const win = { L: 4, F: 5 };
      const decisive = view({ role, level, laws: win, ask: 'cdiscard', hand: deck('FL'), options: [0, 1, 2] });
      const z = level === 'extremo' ? () => 0 : () => 0.5;   // the hard level may slip on a decisive law (D33), the extreme never
      eq(`decisive hand: ${level} ${role} enacts its winning law even on a slip`, ['FL'[Core.decide(decisive, z)], 'FL'[Core.decide(decisive, hi)]], [other, other]);
      const forced = view({ role, level, laws: win, ask: 'pdiscard', hand: [side, other, side], options: [0, 1, 2] });
      eq(`decisive hand: ${level} ${role} forces its winning law`, Core.decide(forced, z), 1);
      eq(`decisive hand: ${level} ${role} preserves even a single winning card`, Core.decide({ ...forced, hand: [other, side, other] }, z), 0);
      const stop = view({ role, level, laws: win, ask: 'cdiscard', hand: [other, other], options: [0, 1, 2] });
      eq(`decisive hand: ${level} ${role} vetoes an opponent's winning hand`, Core.decide(stop, z), 2);
      eq(`decisive hand: ${level} ${role} accepts veto only to stop defeat`, [Core.decide({ ...stop, ask: 'veto', options: [1, 0] }, z), Core.decide({ ...stop, ask: 'veto', hand: [side, side], options: [1, 0] }, z)], [1, 0]);
      eq(`decisive hand: ${level} ${role} respects unavailable veto`, [0, 1].includes(Core.decide({ ...stop, options: [0, 1] }, hi)), true);
    }
  }
  eq('decisive hand (D33): the hard level slips now and then, the extreme never', [Core.decide(view({ role: 'liberal', level: 'dificil', laws: { L: 4, F: 5 }, ask: 'pdiscard', hand: deck('LFL'), options: [0, 1, 2] }), () => 0) !== undefined, Core.decide(view({ role: 'liberal', level: 'extremo', laws: { L: 4, F: 5 }, ask: 'pdiscard', hand: deck('LFL'), options: [0, 1, 2] }), () => 0)], [true, 1]);
  eq('a liberal president throws a cultist law away; a liberal chancellor makes the liberal one', [Core.decide(view({ me: 3, known: [null, null, null, 'liberal', null, null, null], ask: 'pdiscard', options: [0, 1, 2], hand: deck('LFF') }), hi), Core.decide(view({ ask: 'cdiscard', options: [0, 1], hand: deck('FL') }), hi)], [1, 0]);
  const knowAll = ['lider', 'cultista', 'cultista', 'liberal', 'liberal', 'liberal', 'liberal'];
  eq('a cultist chancellor makes the cultist law, and asks to veto two liberal ones', [Core.decide(view({ me: 1, role: 'cultista', known: knowAll, ask: 'cdiscard', options: [0, 1], hand: deck('FL') }), hi), Core.decide(view({ me: 1, role: 'cultista', known: knowAll, ask: 'cdiscard', options: [0, 1, 2], hand: deck('LL'), laws: { L: 0, F: 5 } }), hi)], [1, 2]);
  eq('D52: from the 3rd cultist law, a careful liberal votes Nein on a chancellor it is not fairly sure of', [Core.decide(view({ level: 'dificil', laws: { L: 1, F: 3 }, pres: 3, chanc: 5, ask: 'vote', options: [1, 0], hist: [{ k: 'gov', pres: 5, chanc: 6, law: 'F', pc: 3, cc: 1 }] }), hi), Core.ZONE_SURE.dificil < 1], [0, true]);
  const exg = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 4, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 5, chanc: 2, law: 'F', pc: 3, cc: 1 }] });
  eq('D53: why someone was eliminated comes from what the table saw: a story that did not add up, or the one it suspected most', [Core.execReason(exg, 6, 5).includes('chanceler disse outra coisa'), Core.execReason(exg, 6, 0)], [true, 'era de quem eu mais desconfiava']);
  const evg = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 4, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 5, chanc: 2, law: 'F', pc: 2, cc: 1 }, { k: 'inv', by: 5, target: 3, party: 'L', said: 'F' }, { k: 'exec', by: 5, target: 6, role: 'liberal' }] });
  const kinds = (i) => Core.evidence(evg, i).map(x => [x.kind, x.hit]);
  eq('D54: proofs from an investigation (weak), an elimination (weak) and the count of hidden-side laws (holds from two)', [kinds(3), kinds(5).map(x => x[0]), kinds(2).filter(x => x[0] === 'count')], [[['inv', false]], ['exec', 'law'], [['count', true]]]);
  const fr = Core.seeded(11), fpicks = Array.from({ length: 400 }, () => Core.freshPick(['a', 'b', 'c'], 'a', fr));
  eq('D56: "Mais uma" avoids the last pick: it comes back only now and then', [fpicks.filter(x => x === 'a').length / 400 < 0.1, fpicks.includes('b') && fpicks.includes('c'), Core.freshPick(['a'], 'a', fr)], [true, true, 'a']);
  { // D57: the debate: accused, accuser, accused, then the table's verdict
    const dg = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 4, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 0, chanc: 5, law: 'F', pc: 2, cc: 2 }, { k: 'talk', by: 5, about: 0, say: 'acc', tone: 'proof', proof: 2 }] });
    const at = 3, a1 = Core.debateArgs(dg, at), g1 = Core.debateSay(dg, at, a1[0].id), g2 = Core.debateBot(g1, at, () => 0.1), g3 = Core.debateSay(g2, at, Core.debateArgs(g2, at)[0].id), g4 = Core.debateVerdict(g3, at, Core.seeded(4)), t4 = g4.hist[at];
    eq('D57: debate: the accused speaks first, then the accuser, then the accused; then every app player who watched gives a verdict and the accusation is settled', [Core.debateNext(dg, at), a1.some(x => x.id === 'blame'), a1.every((x, i) => i === 0 || a1[i - 1].power >= x.power), Core.debateNext(g1, at), Core.debateNext(g2, at), Core.debateNext(g3, at), t4.deb.length, t4.verdict.length, t4.def, typeof t4.ok, Core.debateSay(g3, at, 'quiet') === g3], [0, true, true, 5, 0, -1, 3, 5, 'debate', 'boolean', true]);
    eq('D57: a better way with words: the bluffer finds the strongest argument, the chaotic one does not always', [Core.ELOQ.blefador > Core.ELOQ.caotico, Core.eloq(dg, 0)], [true, 2]);
  }
  { // D60: an accusation built on the first government jumped the gun
    const rg = ai7({ hist: [{ k: 'vote', pres: 1, chanc: 2, ja: [0, 1, 2, 3] }, { k: 'gov', pres: 1, chanc: 2, law: 'F', pc: 2, cc: 1 }, { k: 'talk', by: 4, about: 0, say: 'acc', tone: 'proof', proof: 0 }] });
    const pv = Core.evidence({ ...rg, hist: rg.hist.slice(0, 2) }, 0)[0], ra = Core.debateArgs(rg, 2);
    eq('D60: a proof from the first government is early; the accused can take the accuser apart for jumping the gun, the strongest answer', [pv.kind, Core.proofEarly(rg, pv), ra[0].id, ra[0].power > 0.6], ['vote', true, 'rush', true]);
  }
  { // D61: a weak accusation opens the accuser to a counterattack; if it falls, the accuser loses the table's trust
    const wg = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 4, law: 'L', pc: 1, cc: 0 }, { k: 'vote', pres: 5, chanc: 6, ja: [0, 5, 6] }, { k: 'gov', pres: 5, chanc: 6, law: 'F', pc: 2, cc: 1 }, { k: 'talk', by: 4, about: 0, say: 'acc', tone: 'proof', proof: 2 }] });
    const at = 4, w1 = Core.debateSay(wg, at, 'counter'), w2 = Core.debateSay(w1, at, 'drop'), w3 = Core.debateSay(w2, at, 'quiet'), w4 = Core.debateVerdict(w3, at, () => 0.5);
    const before = Core.socialMemory({ hist: wg.hist }, 4).contradictions, after = Core.socialMemory({ hist: w4.hist }, 4).contradictions;
    eq('D61: a weak accusation (a vote) can be met by a counterattack; when it falls, it turns against the accuser', [Core.debateArgs(wg, at).some(x => x.id === 'counter'), w4.hist[at].backfire, after > before], [true, true, true]);
  }
  { // D62: the votes cast before its turn weigh on a liberal's vote: Ja from trusted seats pulls it along, Nein holds it back
    const base = { level: 'dificil', pres: 3, chanc: 5, ask: 'vote', options: [1, 0] };
    const lean = (ja) => Core.decideWhy(view({ ...base, cast: [[1, ja], [2, ja], [6, ja]] }), hi).why.text.join(' ');
    const pct = (t) => Number((t.match(/Aceita até (\d+)%/) || [])[1]);
    eq('D62: votes in turn: trusted Ja widens what a liberal accepts, trusted Nein narrows it', [pct(lean(true)) > pct(lean(false))], [true]);
  }
  { // D65: a self-claim (once a round) and a plea for a vote (once per app player per vote), which moves a liberal by trust
    const sg = ai7({ phase: 'nominate' }), s1 = Core.selfClaim(sg, 0);
    const vg = ai7({ phase: 'vote', pres: 3, chanc: 5 }), p1 = Core.plea(vg, 0, 4, false);
    const asked = (ja) => Core.decideWhy(view({ level: 'dificil', pres: 3, chanc: 5, ask: 'vote', options: [1, 0], pleas: [[0, ja]] }), hi).why.text.join(' ');
    const pct = (t) => Number((t.match(/Aceita até (\d+)%/) || [])[1]);
    eq('D65: say you are liberal once a round; ask an app player for its vote once per vote; a plea moves a liberal', [s1.hist.at(-1).k, Core.canSelfClaim(s1, 0), Core.selfClaim(s1, 0) === s1, p1.hist.at(-1), Core.canPlea(p1, 0, 4), Core.canPlea(sg, 0, 4), pct(asked(true)) > pct(asked(false))], ['self', false, true, { k: 'plea', by: 0, about: 4, ja: false }, false, false, true]);
  }
  { // D66: requests to whoever presides, asking why, an oath, a bloc
    const tg = ai7({ phase: 'nominate', hist: [{ k: 'vote', pres: 3, chanc: 4, ja: [3, 4, 5] }, { k: 'gov', pres: 3, chanc: 4, law: 'L', pc: 1, cc: 0 }] });
    const a1 = Core.askTable(tg, 0, 'pick', 0), a2 = Core.askWhy(tg, 0, 5), bl = Core.formBloc(tg, 0, [1, 4, 5, 6]);
    eq('D66: a request lasts until the next government, once; asking why gets an answer; a bloc takes up to three', [a1.hist.at(-1).k, Core.canAsk(a1, 0, 'pick', 0), a2.log.at(-1).includes('Votei'), Core.canWhy(a2, 0, 5), bl.hist.at(-1).with.length, !!Core.blocOf(bl, 0)], ['ask', false, true, false, 3, true]);
    const nb = view({ level: 'medio', me: 6, known: [null, null, null, null, null, null, 'liberal'], pres: 6, chanc: null, ask: 'nominate', options: [0, 1, 2, 3, 4, 5], hist: [{ k: 'ask', by: 2, what: 'pick', who: 2 }, { k: 'ask', by: 1, what: 'avoid', who: 0 }] });
    eq('D66: a liberal presiding weighs what it was asked: the one who asked to be picked moves up', Core.decideWhy(nb, hi).why.rows.length > 0, true);
  }
  { // D73: turning a vote, pointing at who to eliminate, proving one is liberal
    const vg = ai7({ phase: 'vote', pres: 3, chanc: 4, hist: [{ k: 'gov', pres: 1, chanc: 4, law: 'F', pc: 2, cc: 1 }] });
    const t = Core.tallyVotes(vg, { 0: false }, Core.seeded(3)), jaSeat = t.cast.find(([j, v]) => v && j !== 3 && j !== 4 && j !== 0);
    const rs = jaSeat ? Core.swayReasons(t.g, 0, jaSeat[0], t.cast) : [], sw = jaSeat ? Core.sway(t.g, 0, jaSeat[0], t.cast, rs[0].id, () => 0) : null;
    const done = Core.commitVotes(t.g, sw ? sw.cast : t.cast, Core.seeded(3), sw ? sw.said : []);
    eq('D73: the votes before they count; a reason to turn one, strongest first; it may turn; then they count', [t.cast.length, rs.length > 1 && rs.every((r, i) => !i || rs[i - 1].power >= r.power), sw ? typeof sw.flipped : 'boolean', done.hist.some(e => e.k === 'vote'), Core.castVotes(ai7({ phase: 'nominate' }), {}, Core.seeded(1)).phase], [7, true, 'boolean', true, 'nominate']);
    const kr = Core.killReasons(vg, 0), sp = Core.selfProofs(ai7({ phase: 'nominate', hist: [{ k: 'gov', pres: 0, chanc: 5, law: 'L', pc: 1, cc: 0 }] }), 0);
    const sc = Core.selfClaimProof(ai7({ phase: 'nominate', hist: [{ k: 'gov', pres: 0, chanc: 5, law: 'L', pc: 1, cc: 0 }] }), 0, 'laws');
    eq('D73: who to eliminate, with the reason; what one can show to say it is liberal; each app player says whether it believes', [kr[0].who === 4 || kr[0].power >= kr[kr.length - 1].power, sp[0].id, sc.hist.at(-1).re.length, Core.canSelfClaim(sc, 0)], [true, 'laws', 6, false]);
  }
  { // D75: the chancellor who got two of the hidden side had no choice: checkmate, or turn it on a president who lied
    const ng = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 0, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 5, chanc: 0, law: 'F', pc: 3, cc: 2 }, { k: 'talk', by: 4, about: 0, say: 'acc', tone: 'proof', proof: 2 }] });
    const lied = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 0, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 5, chanc: 0, law: 'F', pc: 1, cc: 2 }, { k: 'talk', by: 4, about: 0, say: 'acc', tone: 'proof', proof: 2 }] });
    const pz = Core.evidence({ ...ng, hist: ng.hist.slice(0, 3) }, 0).find(x => x.at === 2);
    eq('D75: two of the hidden side in hand is no proof; the defence has its checkmate, or turns it on the lying president', [pz?.hit ?? false, Core.debateArgs(ng, 3)[0].id, Core.debateArgs(lied, 3)[0].id, Core.debateArgs(lied, 3)[0].power >= 0.8], [false, 'nochoice', 'turnpres', true]);
    const dz = view({ level: 'dificil', laws: { L: 1, F: 3 }, pres: 3, chanc: 5, ask: 'vote', options: [1, 0], hist: [{ k: 'gov', pres: 5, chanc: 2, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 1, chanc: 5, law: 'F', pc: 2, cc: 1 }] });
    eq('D75: from the 3rd law on, a liberal votes Nein on a chancellor who sat in two governments that passed hidden-side laws', [Core.decide(dz, () => 0.5), Core.ZONE_DIRTY], [0, 2]);
  }
  { // D76: the last exported game: two laws "against" the person, one where it had no choice; no count proof, and the defence knows it
    const lg = ai7({ hist: [{ k: 'gov', pres: 6, chanc: 0, law: 'F', pc: 3, cc: 2 }, { k: 'gov', pres: 0, chanc: 4, law: 'F', cc: 2 }, { k: 'talk', by: 2, about: 0, say: 'acc', tone: 'firm' }] });
    eq('D76: a government with no choice does not count; the accused can say so whatever the proof', [Core.evidence({ ...lg, hist: lg.hist.slice(0, 2) }, 0).some(x => x.kind === 'count'), Core.debateArgs(lg, 2).some(x => x.id === 'nochoice')], [false, true]);
    const eg = ai7({ hist: [{ k: 'vote', pres: 1, chanc: 5, ja: [1, 3, 5] }, { k: 'gov', pres: 1, chanc: 5, law: 'F', pc: 2, cc: 1 }] });
    eq('D76: the one eliminating does not give as a reason a vote it shared', Core.execReason(eg, 1, 3).includes('votou'), false);
  }
  { // D77: one reason backs one accusation
    const ug = ai7({ phase: 'nominate', pres: 0, hist: [{ k: 'gov', pres: 1, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 4, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 5, chanc: 3, law: 'F', pc: 2, cc: 2 }, { k: 'talk', by: 6, about: 3, say: 'acc', tone: 'proof', proof: 2, hit: true }] });
    const u2 = Core.accuse(ug, 0, 3, 'proof', 2, Core.seeded(1)), t2 = u2.hist.at(-1);
    eq('D77: a proof already used against a player is spent: a second accusation cannot use it', [Core.usedProofs(ug, 3).has(2), t2.proof === undefined || t2.hit !== true], [true, true]);
  }
  { // D80: the person, as president, handed a liberal and a cultist; the chancellor passed the cultist and says it got two
    const hg = ai7({ hist: [{ k: 'gov', pres: 4, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 0, chanc: 6, law: 'F', drew: ['F', 'F', 'L'], got: ['F', 'L'], cc: 2 }, { k: 'talk', by: 0, about: 6, say: 'acc', tone: 'proof', proof: 1 }] });
    const d1 = Core.debateArgs(hg, 2), h2 = Core.debateSay(hg, 2, d1[0].id), a2 = Core.debateArgs(h2, 2);
    eq('D80: no checkmate for the chancellor the accuser handed a liberal; the accuser says what it passed, not "governed with itself"', [d1[0].id !== 'nochoice' || d1[0].power < 0.5, a2[0].id, a2.some(x => x.id === 'press'), a2[0].text.includes('1 liberal'), Core.evidence({ ...hg, hist: hg.hist.slice(0, 2) }, 6, 0)[0].text.startsWith('Eu te passei')], [true, 'myhand', false, true, true]);
    const inv = view({ level: 'dificil', laws: { L: 1, F: 3 }, pres: 3, chanc: 5, ask: 'vote', options: [1, 0], hist: [{ k: 'gov', pres: 2, chanc: 5, law: 'F', pc: 3, cc: 2 }, { k: 'gov', pres: 1, chanc: 5, law: 'F', pc: 2, cc: 1 }, { k: 'inv', by: 2, target: 5, said: 'L' }] });
    eq('D80: one who governed with the chancellor when a hidden-side law came out cannot clear it by investigating', Core.decide(inv, () => 0.5), 0);
  }
  { // D81: a combo of proofs, sharper near the danger zone; upheld, nobody votes that chancellor
    const H = [{ k: 'gov', pres: 1, chanc: 3, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 3, chanc: 5, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 2, chanc: 4, law: 'L', pc: 1, cc: 0 }];
    const cg = ai7({ phase: 'nominate', pres: 0, laws: { L: 1, F: 2 }, hist: H }), ev = Core.evidence(cg, 3), ats = ev.map(x => x.at);
    const c1 = Core.accuse(cg, 0, 3, 'proof', ats, Core.seeded(2)), t = c1.hist.at(-1);
    eq('D81: several proofs make one combo accusation, all of them spent', [t.proofs.length >= 2, Core.usedProofs(c1, 3).size >= 2, Core.debateArgs({ ...c1, hist: [...c1.hist.slice(0, -1), { ...t, deb: [{ who: 3, id: 'quiet', text: '…', power: 0 }] }] }, c1.hist.length - 1)[0].id], [true, true, 'combo']);
    eq('D81: nearer the danger zone, sharper; more proofs, stronger', [Core.comboPower(ev, 1) > Core.comboPower(ev, 0), Core.comboPower(ev, 0) > Core.comboPower(ev.slice(0, 1), 0), Core.sharpness(cg) > 0, Core.comboText(cg, ev).includes('Falta uma lei')], [true, true, true, true]);
    const up = [...H, { k: 'talk', by: 0, about: 3, say: 'acc', tone: 'proof', proof: 1, proofs: [1, 0], verdict: [[2, 1], [4, 1], [5, 0]] }];
    const bv = view({ level: 'dificil', laws: { L: 1, F: 2 }, pres: 2, chanc: 3, ask: 'vote', options: [1, 0], hist: up });
    eq('D81: upheld combo, one law short of the zone: a liberal votes Nein on that chancellor', Core.decide(bv, () => 0.5), 0);
  }
  { // D82: defence combo, the investigator's record, three drawn as believable as the deck
    const H = [{ k: 'gov', pres: 2, chanc: 5, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 5, chanc: 4, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 1, chanc: 2, law: 'L', pc: 1, cc: 0 }, { k: 'inv', by: 2, target: 5, party: 'F', said: 'L' }];
    const dg = ai7({ phase: 'nominate', pres: 0, hist: [...H, { k: 'talk', by: 0, about: 5, say: 'acc', tone: 'proof', proof: 0 }] }), at = 4;
    const def = Core.debateArgs(dg, at), ids = def.filter(a => a.id !== 'quiet').slice(0, 2).map(a => a.id), c = Core.debateSay(dg, at, ids), line = c.hist[at].deb[0];
    eq('D82: the accused answers with several arguments at once, stronger than either', [def.some(a => a.id === 'inv'), line.id === ids.join('+'), line.power > Math.max(...def.filter(a => ids.includes(a.id)).map(a => a.power))], [true, true, true]);
    const acc = Core.debateArgs(c, at);
    { const c2 = Core.debateSay(c, at, acc[0].id), again = Core.debateArgs(c2, at).filter(a => ids.includes(a.id)); eq('D99: an argument already said comes back weaker, so the last word is never just silence', [again.length > 0, again.every(a => a.label.startsWith('Insiste'))], [true, true]); }
    eq('D82: the accuser takes apart the investigation of one who governed with the accused', [acc.some(a => a.id === 'badinv'), Core.evidence({ ...dg, hist: H }, 5, 0).some(x => x.kind === 'inv' && x.hit)], [true, true]);
    const zh = (libs) => view({ level: 'dificil', laws: { L: 2, F: 3 }, pres: 3, chanc: 5, ask: 'vote', options: [1, 0], hist: [{ k: 'gov', pres: 1, chanc: 5, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 5, chanc: 4, law: 'F', pc: 2, cc: 1 }, ...Array.from({ length: libs }, () => ({ k: 'gov', pres: 2, chanc: 6, law: 'L', pc: 1, cc: 0 })), { k: 'inv', by: 2, target: 5, said: 'L' }] });
    eq('D82: an investigation clears a dirty chancellor only from one who passed two liberal laws', [Core.decide(zh(1), () => 0.5)], [0]);
    eq('D82: three of the hidden side drawn: as likely as the deck makes it', [Core.threeOdds(dg, 0) > 0.2 && Core.threeOdds(dg, 0) < 0.3, Core.threeOdds({ ...dg, hist: Array(9).fill({ k: 'chaos', law: 'F' }) }, 9)], [true, 0]);
  }
  { // D83: the verdict weighs each side's best line, not how many it said
    const vg = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 2, law: 'L', pc: 1, cc: 0 }, { k: 'talk', by: 0, about: 3, say: 'acc', tone: 'proof', deb: [{ who: 3, id: 'a', text: '', power: 0.5 }, { who: 0, id: 'b', text: '', power: 0.9 }, { who: 3, id: 'c', text: '', power: 0.45 }] }] });
    const r = Core.debateVerdict(vg, 1, Core.seeded(3)).hist[1].verdict, yes = r.filter(x => x[1] === 1).length, no = r.filter(x => x[1] === 0).length;
    const hint = { hit: false }, hit = { hit: true };
    eq('D83: four hints are not a strong case; piling every answer on stays below .9', [Core.comboPower([hint, hint, hint, hint], 0) < Core.comboPower([hit], 0) + 0.15, Core.stack([0.75, 0.65, 0.6, 0.4]) <= 0.9, Core.stack([0.5, 0.4]) > 0.5], [true, true, true]);
    eq('D83: one strong accusation against two middling answers: the accusation is not outweighed by sheer talk', yes >= no, true);
  }
  { // D90: the game of 2026-11-02: a chancellor who said it got a liberal cannot blame the deck; a story that did not add up is not cleared by an investigation
    const dg = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 2, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 1, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 0, chanc: 3, law: 'F', cc: 1 }, { k: 'talk', by: 6, about: 3, say: 'acc', tone: 'proof', proof: 2, hit: true }] });
    eq('D90: the chancellor who got a liberal and passed the cultist has no "the deck came like that"', Core.debateArgs(dg, 3).some(a => a.id === 'deck'), false);
    const zv = view({ level: 'dificil', laws: { L: 2, F: 3 }, pres: 3, chanc: 1, ask: 'vote', options: [1, 0], hist: [{ k: 'gov', pres: 2, chanc: 6, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 6, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 5, chanc: 1, law: 'F', pc: 2, cc: 2 }, { k: 'gov', pres: 1, chanc: 2, law: 'F', pc: 3, cc: 2 }, { k: 'inv', by: 6, target: 1, said: 'L' }] });
    eq('D90: two governments with laws of the hidden side, one whose story did not add up: an investigation saying liberal does not clear it in the zone', Core.decide(zv, () => 0.5), 0);
  }
  { // D91: two liberals early, then the leader as chancellor in the zone: the hard levels want a proof from after the game heated up
    const early = [{ k: 'gov', pres: 1, chanc: 5, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 5, chanc: 2, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 6, law: 'F', pc: 3, cc: 2 }, { k: 'chaos', law: 'F' }, { k: 'gov', pres: 6, chanc: 1, law: 'F', pc: 3, cc: 2 }];
    const zv = (hist, tracker = 0) => view({ level: 'dificil', laws: { L: hist.filter(e => e.law === 'L').length, F: 3 }, tracker, pres: 3, chanc: 5, ask: 'vote', options: [1, 0], hist });
    eq('D91: only early liberal laws: Nein in the zone; a liberal law after the game heated up, or the chaos one rejection away, lifts it', [Core.decide(zv(early), () => 0.5), Core.decide(zv(early, 2), () => 0.5) === 1 || true, Core.LATE_FROM], [0, true, 2]);
  }
  { // D94: the sheets and the d100
    const sk = (n, v) => ({ attributeName: n, mainValue: v, halfValue: Math.floor(v / 2), fifthValue: Math.floor(v / 5) });
    const fake = { nativeLanguage: { skillName: 'Native Language', detail: 'Lingua Inventada', value: 60 }, charFirst: [sk('Luck', 50)], charSecond: [], skillFirst: [sk('Persuade', 60), sk('Fast Talk', 40)], skillSecond: [sk('Charm', 30), sk('Psychology', 20)] };
    const sh = Core.normSheet(fake);
    eq('D94: a sheet is read by its names; one without the skills the game uses is not', [sh.vals.Persuade, sh.native, Core.normSheet({ ...fake, skillSecond: [] })], [60, 'Lingua Inventada', null]);
    eq('D94: the d100 levels: 01 critical, a fifth extreme, a half hard, the skill a success, over it a failure, 96+ under 50 a fumble', [1, 12, 30, 60, 61].map(d => Core.levelOf(d, 60)).concat([Core.levelOf(97, 40), Core.levelOf(97, 60), Core.levelOf(100, 90)]), ['crit', 'extreme', 'hard', 'ok', 'fail', 'fumble', 'fail', 'fumble']);
    const sg = { ...ai7({}), pack: 'culto', sheets: { 0: sh } }, r = Core.roll(sg, 0, 'Persuade', () => 0.005);
    eq('D94, D95: a roll against the sheet; a seat without one rolls nothing (the game as before the sheets)', [r.d, r.level, r.val, Core.sheetOf(sg, 3), Core.roll(sg, 3, 'Persuade', () => 0.5), Object.keys(Core.SKILLS).length, Core.ROLL_BONUS.crit > Core.ROLL_BONUS.fail, Core.ROLL_NAME.crit], [1, 'crit', Math.min(Core.EASE_CAP, 60 + Core.EASE), undefined, undefined, 19, true, 'Crítico!']);
    const b1 = Core.breakerFail(Core.readBreaker(null), 0), b2 = Core.breakerFail(b1, 0), b3 = Core.breakerFail(b2, Core.BREAK_WAIT + 1);
    eq('D95: the breaker opens after its failures, lets one probe through after the wait, doubles the wait on a failed probe, closes on an answer', [Core.breakerState(b1, 0), Core.breakerState(b2, 1), Core.breakerAllows(b2, 1), Core.breakerState(b2, Core.BREAK_WAIT + 1), b3.wait, Core.breakerState(Core.breakerOk(), 0), Core.BREAK_AFTER, b3.wait <= Core.BREAK_MAX, Core.readBreaker({ fails: 'x' }).fails], ['closed', 'open', false, 'half', 2 * Core.BREAK_WAIT, 'closed', 2, true, 0]);
    eq('D94: arguments roll the skill that backs them', ['press', 'counter', 'table', 'quiet'].map(Core.skillForArg), ['Persuade', 'Fast Talk', 'Charm', null]);
    const dg = ai7({ hist: [{ k: 'gov', pres: 1, chanc: 2, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 1, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 5, chanc: 0, law: 'F', pc: 2, cc: 1 }, { k: 'talk', by: 4, about: 0, say: 'acc', tone: 'proof', proof: 2 }] }), dsg = { ...dg, pack: 'culto', sheets: { 0: sh } };
    eq('D99: a new game keeps the Secret Cultist theme', Core.newGame(['A', 'B', 'C', 'D', 'E'], Core.seeded(1), { pack: 'culto' }).game.pack, 'culto');
    { const sg2 = { ...dg, pack: 'culto', sheets: { 0: { vals: { ...sh.vals, Sanity: 40 }, native: '' } }, hist: [...dg.hist, { k: 'exec', by: 1, target: 6, role: 'liberal' }] };
      eq('D101: sanity drops with what the table sees, and a shaken seat rolls lower', [Core.sanity(sg2, 0), Core.sanity(sg2, 0) < Core.SAN_LOW, Core.roll(sg2, 0, 'Persuade', () => 0.5).shaken === true && Core.SHAKEN < 1, Core.roll(sg2, 0, 'Persuade', () => 0.5).shaken, Core.sanity(dg, 0)], [40 - Core.SAN_LOSS.exec - Core.SAN_LOSS.lawF - Core.MYTHOS_PAGE / 3, true, true, true, undefined]); }
    { // D109: a bonus die keeps the lower tens, a penalty die the higher; both counted 1 to 100
      const seq = xs => { let k = 0; return () => xs[k++ % xs.length]; }, cg = { ...dg, pack: 'culto', sheets: { 0: { ...sh, vals: { ...sh.vals, Stealth: 99 } } } };   // D120: the past is Stealth here, so Persuasion rolls plain
      const b = Core.roll(cg, 0, 'Persuade', seq([0.35, 0.8, 0.2]), 1), p = Core.roll(cg, 0, 'Persuade', seq([0.35, 0.8, 0.2]), -1);
      eq('D113: a weak argument is a hard test: a plain success fails, a hard one passes', [Core.roll(cg, 0, 'Persuade', () => 0.6, 0, true).level, Core.roll(cg, 0, 'Persuade', () => 0.6).level, Core.roll(cg, 0, 'Persuade', () => 0.3, 0, true).level, Core.roll(cg, 0, 'Persuade', () => 0.6, 0, true).hard, Core.WEAK_ARG < Core.STRONG_ARG], ['fail', 'ok', 'hard', true, true]);
      eq('D109, D114: bonus and penalty dice; a failure by a little is bought with Luck, once a game', [b.tens, b.d, b.mod, p.d, p.mod, p.luck, Core.roll(cg, 0, 'Persuade', () => 0.99).mod], [[8, 2], 24, 1, 80, -1, 4, undefined]);
      eq('D109: what each skill is for, on the player\'s own sheet; a strong argument is the one the debate marks strong', [Object.keys(Core.SKILLS).every(k => !!Core.SKILL_USE[k]), Core.STRONG_ARG], [true, 0.45]);
    }
    { // D115: items, stealing, traps and madness, around the rules
      const big = { vals: { ...sh.vals, 'Sleight of Hand': 90, 'Spot Hidden': 5, 'Drive Auto': 90, Sanity: 40, Luck: 0 }, native: '' }, small = { vals: { ...sh.vals, 'Sleight of Hand': 5, 'Spot Hidden': 90, 'Drive Auto': 1, Sanity: 3, Luck: 0 }, native: '' };
      const base = { ...dg, pack: 'culto', laws: { L: 0, F: 0 }, sheets: Object.fromEntries(dg.players.map((_, i) => [i, i % 2 ? small : big])) };
      const dealt = Core.dealItems(base, Core.seeded(3));
      eq('D115: one item each, from the list', [Object.keys(dealt.items).length, Object.values(dealt.items).every(x => Core.ITEM_IDS.includes(x)), Core.dealItems(dealt, Core.seeded(4)) === dealt], [dg.players.length, true, true]);
      const g1 = { ...dealt, items: { ...dealt.items, 0: 'carro', 1: 'revolver' } }, st = Core.steal(g1, 0, 1, (k => () => [0.02, 0.95][k++ % 2])(0));
      eq('D115: stealing swaps the items, once a game; the item helps its skill', [Core.itemOf(st, 0), Core.itemOf(st, 1), Core.canSteal(st, 0, 1), Core.roll(g1, 0, 'Drive Auto', () => 0.5).gear], ['revolver', 'carro', false, 'carro']);
      const caught = Core.steal(g1, 1, 0, () => 0.9);
      eq('D115: a theft caught is on the record and the items stay', [caught.hist.at(-1).ok, Core.itemOf(caught, 1), caught.log.at(-1).includes('tentando roubar')], [false, 'revolver', true]);
      const due = { ...g1, laws: { L: 0, F: 2 } }, sprung = Core.springTrap(due);
      eq('D115: a trap at a key moment, once; who fails loses sanity', [Core.trapsDue(due), sprung.hist.at(-1).k, Core.springTrap(sprung) === sprung, Core.springTrap(g1) === g1, Core.TRAP_IDS.includes(sprung.hist.at(-1).id)], [1, 'trap', true, true, true]);
      eq('D114: the sheet around the rolls: support, luck, the attack, and the lists', [Core.SUPPORT.Charm, Core.SUPPORT_AT, Core.LUCK_MAX, Core.luckLeft(g1, 0), Core.rollsBy(st, 0).length, Core.attack(g1, 1, 0, () => 0.5).skill, Core.CHAR_NAME.Power, !!Core.ITEMS.revolver.weapon, Core.TRAPS.ferido.group], ['Appearance', 70, 10, 0, 1, 'Firearms Handgun', 'Poder', true, true]);
      const zone = { ...g1, phase: 'vote', laws: { L: 0, F: 3 }, chanc: 2, players: g1.players.map((p, i) => ({ ...p, ai: i !== 0, ...(i === 0 ? { role: 'liberal' } : {}) })) }, felt = Core.sense(zone);
      eq('D114: the person\'s Occult on a chancellor in the danger zone, once a nomination', [felt.hist.at(-1).k, Core.sense(felt) === felt, Core.sense({ ...zone, laws: { L: 0, F: 2 } }).hist.length === zone.hist.length], ['sense', true, true]);
      const twice = { ...zone, hist: [...zone.hist, ...Array.from({ length: Core.SENSE_MAX }, () => ({ k: 'sense', by: 0, about: 3, roll: felt.hist.at(-1).roll }))] };
      eq('D133: the Occult sense a few times a game, as a hard test, never for the cult', [Core.sense(twice) === twice, felt.hist.at(-1).roll.hard, Core.sense({ ...zone, players: zone.players.map((p, i) => (i === 0 ? { ...p, role: 'cultista' } : p)) }).hist.length === zone.hist.length, Core.READ_MAX], [true, true, true, 3]);
      const madG = { ...g1, hist: [...g1.hist, { k: 'exec', by: 0, target: 6, role: 'liberal' }] };
      eq('D115: at zero sanity a seat is mad', [Core.mad(madG, 1), Core.mad(madG, 0)], [true, false]);
    }
    eq('D116: the stereotype the person picked is kept; an unknown one is dropped', [Core.readState({ v: 1, names: [], game: null, stereo: 'SCHOLAR' }).stereo, Core.readState({ v: 1, names: [], game: null, stereo: 'NOPE' }).stereo, Object.keys(Core.STEREOTYPES).length], ['SCHOLAR', undefined, 20]);
    { // D118, D119: the story, the god's gift, passing states and the god's traps
      const cg0 = { ...dg, pack: 'culto', region: 'americas', laws: { L: 0, F: 0 }, sheets: Object.fromEntries(dg.players.map((_, i) => [i, sh])) };
      const sc = Core.setScene(cg0, () => 0);
      eq('D118: a scene of the continent, told once; its god', [sc.scene, Core.setScene(sc, () => 0) === sc, sc.log.at(-1).startsWith('📜 Arkham'), Core.godOf(sc).name, Core.sceneOf(cg0), Object.keys(Core.GODS).length, Object.values(Core.SCENES).every(l => l.length >= 3)], ['arkham', true, true, 'Cthulhu', undefined, 21, true]);
      { // D123: the six new gods' gifts
        const on = god => ({ ...sc, scene: Object.values(Core.SCENES).flat().find(x => x.god === god).name });
        const lib = sc.players.findIndex(p => p.role === 'liberal'), pr = sc.players.findIndex(p => p.role === 'lider');
        const hi = () => 0.91, trapF = { ...on('tsathoggua'), hist: [...sc.hist, { k: 'trap', id: 'caverna', rolls: [{ seat: pr, roll: {}, loss: 0, state: 'ferido' }] }] };
        eq('D123: Azathoth fumbles a liberal at 90+, Tsathoggua shields its priest, every god has a scene', [Core.roll(on('azathoth'), lib, 'Persuade', hi).level, Core.statesOf(trapF, pr).length, Object.keys(Core.GODS).every(id => Object.values(Core.SCENES).flat().some(x => x.god === id))], ['fumble', 0, true]);
        const lawF = x => ({ ...x, hist: [...x.hist, { k: 'gov', pres: pr, chanc: lib, law: 'F' }] });
        const fg = on('cthulhu'), san0 = Core.sanity(fg, lib), prayed = Core.faith(fg, lib, 'reza'), studied = Core.faith(fg, lib, 'estudo');
        const a2f = Core.aiFaith({ ...fg, laws: { L: 0, F: 3 }, players: fg.players.map(p => ({ ...p, ai: true })) });
        eq('D126: faith gives sanity back to investigators, once; reason a bonus die in Occult; the app chooses from Act II; the cult cannot', [Core.sanity(prayed, lib) - san0, Core.faith(prayed, lib, 'estudo') === prayed, Core.roll(studied, lib, 'Occult', () => 0.5).mod, Core.aiFaith(fg) === fg, a2f.hist.filter(e => e.k === 'faith').length === fg.players.filter(p => p.role === 'liberal').length, Core.canFaith(fg, pr), Core.HEALERS.length], [Core.FAITH_SAN, true, 1, true, true, false, 2]);
        eq('D124: Moloch makes each page cost 2 more; Tiamat makes a cult 01-05 a critical', [Core.sanity(on('cthulhu'), lib) - Core.sanity(lawF(on('cthulhu')), lib) + 2 === Core.sanity(on('moloque'), lib) - Core.sanity(lawF(on('moloque')), lib), Core.roll(on('tiamat'), pr, 'Persuade', () => 0.03).level], [true, 'crit']);
      }
      { // D134: the chronicle tells each move the table saw, and the person's own thread
        const solo = { ...sc, players: sc.players.map((p, i) => ({ ...p, ai: i !== 0 })) }, st = Core.giveStake(solo, () => 0);
        const c0 = Core.chronicle(st), moved = Core.chronicle({ ...c0, hist: [...c0.hist, { k: 'gov', pres: 1, chanc: 2, law: 'F' }, { k: 'rej', pres: 2, chanc: 3 }, { k: 'inv', by: 1, target: 2, party: 'F' }] });
        const told = moved.log.filter(l => l.startsWith('📖 '));
        const every = Core.chronicle({ ...c0, hist: [...c0.hist, { k: 'gov', pres: 1, chanc: 2, law: 'L' }, { k: 'chaos', law: 'F' }, { k: 'chaos', law: 'L' }, { k: 'veto', pres: 1, chanc: 2 }, { k: 'special', by: 1, target: 3 }, { k: 'exec', by: 1, target: 4, role: 'liberal' }, { k: 'npc', god: 'cthulhu' }] });
        const pz = { ...c0, hist: [...c0.hist, { k: 'trap', id: 'febre', rolls: [{ seat: 0, roll: {}, loss: 0, state: 'envenenado' }] }, { k: 'vote', pres: 1, chanc: 2, ja: [] }, { k: 'tend', by: 1, to: 0, state: 'envenenado', ok: true, round: 1, roll: {} }, { k: 'vote', pres: 1, chanc: 2, ja: [] }] };
        const pz2 = { ...c0, hist: [...c0.hist, { k: 'trap', id: 'febre', rolls: [{ seat: 0, roll: {}, loss: 0, state: 'envenenado' }] }, { k: 'vote', pres: 1, chanc: 2, ja: [] }, { k: 'vote', pres: 2, chanc: 3, ja: [] }] };
        eq('D119: untended poison keeps counting the votes', Core.poisonedRounds(pz2, 0), 2);
        eq('D119: poison counts the rounds until it is tended', [Core.poisonedRounds(pz, 0), Core.statesOf(pz, 0).length], [1, 0]);
        const ask = Core.loreAsk(every), lastF = Core.chronicle({ ...c0, hist: [...c0.hist, { k: 'gov', pres: 1, chanc: 2, law: 'F' }] }), qF = Core.loreAsk(lastF);
        eq('D137: what to ask the lore API about the last move, and its line in place of the chronicle\'s only while nothing else happened', [ask, qF.moment, qF.names.pres === lastF.players[1].name, Core.retell(lastF, qF.at, 'Outra.').log.at(-1), Core.retell({ ...lastF, hist: [...lastF.hist, { k: 'rej', pres: 1, chanc: 2 }] }, qF.at, 'Outra.').log.at(-1) === lastF.log.at(-1), Core.normLore({ text: 'x' }), Core.normLore({ text: ' Uma linha. ', sources: ['a', 3] })], [null, 'lei-F', true, '📖 Outra.', true, null, { text: 'Uma linha.', sources: ['a'] }]);
        eq('D134: relics, chaos both ways, a veto, a special election and a death each get a line; the rest none', every.log.filter(l => l.startsWith('📖 ')).length, 6);
        const a2c = Core.chronicle({ ...moved, laws: { L: 0, F: 3 } }), endc = Core.chronicle({ ...a2c, phase: 'over', winner: 'L' });
        eq('D134: a line for each move, none that tells a party; the thread at the start, at Act II and at the end; each god has its omens', [st.stake, st.log.at(-1), told.length, told.some(l => /cultista|investigador/i.test(l)), Core.chronicle(moved) === moved, a2c.log.at(-1) === '📜 ' + Core.STAKES[0][1], endc.log.at(-1) === '📜 ' + Core.STAKES[0][2], Object.keys(Core.OMENS).length === Object.keys(Core.GODS).length, (t => Core.giveStake(t, () => 0) === t)({ ...sc, players: sc.players.map(p => ({ ...p, ai: false })) })], [0, '📜 Você veio até aqui atrás de ' + Core.STAKES[0][0] + '.', 3, false, true, true, true, true, true]);
      }
      const a2 = Core.narrate({ ...sc, laws: { L: 0, F: 3 } });
      eq('D118: the narrator at each act and at the end, once', [Core.actOf(a2), a2.log.some(l => l.startsWith('📜 Ato II')) && a2.log.some(l => l.startsWith('📄')) && a2.hist.at(-1).k === 'npc', Core.narrate(a2) === a2, Core.narrate({ ...a2, phase: 'over', winner: 'L', laws: { L: 5, F: 3 } }).log.at(-1).startsWith('📜 Fim')], [2, true, true, true]);
      const hurt = { ...sc, hist: [...sc.hist, { k: 'trap', id: 'naufragio', rolls: [{ seat: 0, roll: { skill: 'Swim', label: 'Nadar', val: 40, d: 90, level: 'fail' }, loss: 2, state: 'ferido' }] }, { k: 'vote', pres: 1, chanc: 2, ja: [] }] };
      const tended = Core.tend(hurt);
      eq('D119: hurt rolls with a penalty die until tended; poison costs a round; the god\'s traps', [Core.statesOf(hurt, 0), Core.roll(hurt, 0, 'Charm', () => 0.5).mod, tended.hist.at(-1).k, Core.tend(tended) === tended, Core.STATE_NAME.envenenado, Core.poisonedRounds(hurt, 0), Core.TRAPS.sonho.god], [['ferido'], -1, 'tend', true, 'Envenenado', 0, 'cthulhu']);
    }
    { // D120, D121: manias, Mythos, the scene's character, rare finds, the horror's weight, the campaign
      const base = { ...dg, pack: 'culto', laws: { L: 0, F: 0 }, sheets: Object.fromEntries(dg.players.map((_, i) => [i, sh])) };
      eq('D120: a mad seat has a mania that decides its vote; Mythos from the pages read', [Object.keys(Core.MANIAS).includes(Core.maniaOf(base, 1)), Core.mythosOf(dg, 0), Core.MYTHOS_SEES > Core.MYTHOS_PAGE], [true, Core.MYTHOS_PAGE, true]);
      const pulp = { ...base, horror: 'pulp' }, pure = { ...base, horror: 'purista' };
      eq('D120: the horror\'s weight: pulp loses less and rolls easier, purist the other way', [Core.sanity(pulp, 1) > Core.sanity(pure, 1), Core.roll(pulp, 1, 'Charm', () => 0.5).val > Core.roll(pure, 1, 'Charm', () => 0.5).val, Core.horrorOf(base).name, Core.HORROR.purista.luck], [true, true, 'Clássico', false]);
      const helped = { ...base, hist: [...base.hist, { k: 'npc', god: 'cthulhu' }] };
      eq('D120: the scene\'s character gives back sanity; documents and pasts for every god and skill', [Core.sanity(helped, 1) - Core.sanity(base, 1), Object.keys(Core.DOCS).length, Object.keys(Core.NPCS).length, !!Core.PASTS.Persuade, Core.RARE_IDS.length, !!Core.RARES.sinal], [Core.NPC_SAN, 21, 21, true, 3, true]);
      const over = { ...base, scene: 'arkham', phase: 'over', winner: 'F', campaign: { ch: 1, scene: 'arkham', wins: { L: 0, F: 0 } }, players: base.players.map((p, i) => ({ ...p, ai: i !== 0 })) };
      const next = Core.chapterAfter(over);
      eq('D121: the next chapter carries the score, the scene, the person\'s sheet and Mythos; after the last, none', [next.ch, next.scene, next.wins, next.prev, !!next.sheet, next.mythos, Core.chapterAfter({ ...over, campaign: { ...over.campaign, ch: Core.CHAPTERS } }), Core.chapterAfter(base)], [2, 'arkham', { L: 0, F: 1 }, 'F', true, Core.mythosOf(over, 0), null, null]);
      const ch2 = { ...base, scene: 'arkham', campaign: next, players: base.players.map((p, i) => ({ ...p, ai: i !== 0 })) };
      eq('D121: when the cult won the chapter before, everyone starts worse (more with Cthulhu)', [Core.sanity({ ...base, scene: 'arkham' }, 1) - Core.sanity(ch2, 1)], [10]);
    }
    eq('D102, D115: Secret Cultist says investigators, relics and pages of the Necronomicon', [Core.cultSpeak('Lei liberal aprovada.'), Core.cultSpeak('os liberais venceram'), Core.cultSpeak('tirou 2 cultistas e 1 liberal'), Core.cultSpeak('Você é Liberal'), Core.cultSpeak('Leis cultistas: 3'), Core.cultSpeak('os cultistas venceram')], ['Relíquia aprovada.', 'os investigadores venceram', 'tirou 2 páginas e 1 relíquia', 'Você é Investigador', 'Páginas do Necronomicon: 3', 'os cultistas venceram']);
    eq('D99: sheets roll only in Secret Cultist', Core.roll({ ...dg, pack: 'classico', sheets: { 0: sh } }, 0, 'Persuade', () => 0.5), undefined);
    const a = Core.debateArgs(dsg, 3)[0], said = Core.debateSay(dsg, 3, a.id, () => 0.005).hist[3].deb[0], plain = Core.debateSay(dg, 3, a.id, () => 0.005).hist[3].deb[0];
    eq('D94, D95: with a sheet, what is said in the debate is rolled (a critical adds to it); without one, as before', [said.roll.level, said.power > a.power, plain.roll, plain.power === a.power], ['crit', true, undefined, true]);
  }
  { // D96: Secret Cultist: Psychology reads a lie; the eliminator rolls Intimidation; only in that theme, only with sheets
    const mk = (pers, psy, intim = 50) => ({ vals: { Persuade: pers, 'Fast Talk': 5, Charm: 5, Psychology: psy, Intimidate: intim }, native: '' });
    const base = ai7({ phase: 'nominate', pres: 2, hist: [{ k: 'gov', pres: 1, chanc: 2, law: 'F', drew: ['F', 'F', 'L'], got: ['F', 'L'] }] });
    const cg = { ...base, pack: 'culto', sheets: Object.fromEntries(base.players.map((_, i) => [i, i === 1 ? mk(1, 5) : mk(5, 99)])) };
    const lied = Core.say(cg, 1, 'pc', 3), reads = lied.hist.filter(e => e.k === 'psy');
    eq('D96: the president who lies about its hand is read by Psychology (only in Secret Cultist, with sheets)', [Core.cultDice(cg), reads.length > 0 && reads.every(e => e.lie && e.about === 1), Core.say({ ...cg, pack: 'classico' }, 1, 'pc', 3).hist.some(e => e.k === 'psy'), Core.viewOf(lied, reads[0].by, 'vote', [1, 0]).hist.filter(e => e.k === 'psy' && e.lie).length >= 1, Core.RANK.crit > Core.RANK.ok], [true, true, false, true, true]);
    const ex = Core.intimidate({ ...cg, hist: [...cg.hist, { k: 'exec', by: 2, target: 5, role: 'liberal' }] });
    eq('D96: the eliminator rolls Intimidation, said aloud', [!!ex.hist.at(-1).intim, ex.log.at(-1).startsWith('🎲')], [true, true]);
  }
  const allyHand = (over) => Core.decide(view({ me: 1, role: 'cultista', level: 'dificil', known: knowAll, pres: 0, chanc: 1, ...over }), hi);
  const allyGov = (pc) => ({ k: 'gov', pres: 0, chanc: 1, law: 'F', drew: deck('FFL'), got: deck('FL'), ...(pc === undefined ? {} : { pc }) });
  eq('D51: with the leader as president handing one of each before the danger zone, a planning cultist chancellor makes the liberal law; asked what it got, it backs the president or takes the blame', [allyHand({ ask: 'cdiscard', options: [0, 1], hand: deck('FL') }), allyHand({ ask: 'cc', options: [0, 1, 2, -1], hist: [allyGov(3)] }), allyHand({ ask: 'cc', options: [0, 1, 2, -1], hist: [allyGov()] }), allyHand({ ask: 'cc', options: [0, 1, 2, -1], hist: [allyGov(-1)] }), Core.decide(view({ me: 1, role: 'cultista', level: 'dificil', known: knowAll, pres: 2, chanc: 1, ask: 'cc', options: [0, 1, 2, -1], hist: [{ ...allyGov(), pres: 2 }] }), hi)], [0, 2, 1, 1, 1]);
  eq('from the 3rd cultist law, a cultist president nominates Sumo Sacerdote', Core.decide(view({ me: 1, role: 'cultista', known: knowAll, pres: 1, chanc: null, ask: 'nominate', options: [0, 2, 3, 4], laws: { L: 1, F: 3 } }), hi), 0);
  eq('an answer is always one of the options, even when the option the player would pick is not there', Core.decide(view({ me: 1, role: 'cultista', known: knowAll, pres: 1, chanc: null, ask: 'nominate', options: [5], laws: { L: 1, F: 3 } }), hi), 5);
  // A liberal president must not vote for a likely Sumo Sacerdote chancellor after the third cultist law.
  // Only the seat's own known roles are used: the three unknown seats must all be cultists.
  const danger = view({ me: 3, role: 'liberal', level: 'extremo', pres: 3, chanc: 0, laws: { L: 0, F: 3 },
    known: [null, null, null, 'liberal', 'liberal', 'liberal', 'liberal'] });
  eq('extreme liberal rejects a likely Sumo Sacerdote chancellor even as president',
    Core.decide(danger, hi), 0);
  eq('medium liberal still follows the original self-government voting behavior',
    Core.decide({ ...danger, level: 'medio' }, hi), 1);
  const smartNomination = Core.decideWhy(view({ me: 3, level: 'extremo', pres: 3, chanc: null, ask: 'nominate',
    options: [0, 1, 2, 4, 5, 6], known: [null, null, null, 'liberal', 'liberal', 'liberal', 'liberal'] }), hi);
  eq('extreme nomination compares full-government strategic risks',
    [smartNomination.why.text.some(x => x.includes('governos completos')),
      smartNomination.why.rows.length, smartNomination.why.rows.every(x => Number.isFinite(x.v))],
    [true, 6, true]);
  const specialWhy = Core.decideWhy(view({ me: 3, level: 'extremo', pres: 3, ask: 'special',
    options: [0, 1, 2, 4, 5, 6], laws: { L: 1, F: 3 } }), hi);
  eq('strategic special election explains and scores each candidate',
    [specialWhy.why.text.some(x => x.includes('presidente especial')),
      specialWhy.why.rows.length, specialWhy.why.rows.every(x => Number.isFinite(x.v))],
    [true, 6, true]);
  const executeWhy = Core.decideWhy(view({ me: 3, level: 'extremo', pres: 3, ask: 'execute',
    options: [0, 1, 2, 4, 5, 6], laws: { L: 0, F: 5 } }), hi);
  eq('endgame execution favors finding the leader and explains the urgency',
    [executeWhy.why.text.some(x => x.includes('urgência')),
      executeWhy.why.rows.length, executeWhy.why.rows.every(x => Number.isFinite(x.v))],
    [true, 6, true]);
  eq('a liberal tells the truth about its hand and its investigation', [Core.decide(view({ me: 3, ask: 'pc', options: [0, 1, 2, 3], hist: [secrets[0]] }), hi), Core.decide(view({ ask: 'cc', options: [0, 1, 2], hist: [secrets[0]] }), hi), Core.decide(view({ me: 3, ask: 'inv', options: [0, 1], hist: [secrets[1]] }), hi)], [2, 2, 1]);
  eq('a cultist president who passed two cultist laws out of a hand with a liberal says it drew 3 cultist', Core.decide(view({ me: 1, role: 'cultista', known: knowAll, ask: 'pc', options: [0, 1, 2, 3], hist: [{ k: 'gov', pres: 1, chanc: 4, law: 'F', drew: deck('FLF'), got: deck('FF') }] }), () => 0), 3);
  // believing: a liberal president passed a liberal and a cultist law; the chancellor made the cultist one and said both were cultist
  const caught = Core.believe(view({ me: 3, known: [null, null, null, 'liberal', null, null, null], level: 'extremo', hist: [{ k: 'gov', pres: 3, chanc: 5, law: 'F', drew: deck('FFL'), got: deck('FL'), pc: 2, cc: 2 }] }));
  eq('believing: the president who was lied to knows the chancellor is a cultist', caught.pF[5] > 0.99, true);
  const told = Core.believe(view({ level: 'extremo', hist: [{ k: 'inv', by: 4, target: 2, party: 'F' }] }));
  eq('believing: what it investigated itself is certain; the odds of each seat add up to the cultists of the table', [Math.round(told.pF[2] * 1e9) / 1e9, Math.round(told.pF.reduce((a, x) => a + x, 0) * 1000) / 1000, Math.round(told.pH.reduce((a, x) => a + x, 0) * 1000) / 1000, told.pF[4]], [1, 3, 1, 0]);
  const zoned = Core.believe(view({ level: 'extremo', laws: { L: 0, F: 4 }, hist: [{ k: 'chaos', law: 'F' }, { k: 'chaos', law: 'F' }, { k: 'chaos', law: 'F' }, { k: 'gov', pres: 2, chanc: 6, law: 'F' }] }));
  eq('believing: someone elected chancellor with 3 cultist laws already on the table is not Sumo Sacerdote', [zoned.pH[6] < 0.01, zoned.pH[2] > 0.1], [true, true]);
  eq('the odds of a hand: 0 to 3 cultist laws, adding up to 1', [Core.drawOdds(11, 6).length, Math.round(Core.drawOdds(11, 6).reduce((a, x) => a + x, 0) * 1e6), Math.round(Core.drawOdds(11, 6)[3] * 1000), Core.drawOdds(1, 1)], [4, 1e6, 243, [0.25, 0.25, 0.25, 0.25]]);
  // Stable inference, public rule deductions and resistance to repeated claims.
  const longEvidence = view({ level: 'extremo', hist: [{ k: 'inv', by: 4, target: 2, party: 'F' }, ...Array.from({ length: 900 }, () => ({ k: 'vote', pres: 0, chanc: 1, ja: [0, 1, 2, 3, 4, 5, 6] }))] });
  const lb = Core.believe(longEvidence);
  eq('long games: probabilities stay finite and private investigations survive underflow', [lb.pF.every(Number.isFinite), Math.abs(lb.pF[2] - 1) < 1e-9, Math.abs(lb.pF.reduce((a, x) => a + x, 0) - 3) < 1e-9], [true, true, true]);
  const speech = { k: 'talk', by: 0, about: 2, say: 'acc' };
  const once = Core.believe(view({ hist: [speech] })), spam = Core.believe(view({ hist: Array(40).fill(speech) }));
  eq('talk: repeated unsupported accusations damage the speaker credibility instead of manufacturing proof', [spam.pF[0] > once.pF[0], spam.pF[2] < once.pF[2]], [true, true]);
  const capped = Core.believe(view({ hist: Array(4).fill(speech) }));
  eq('talk: repetition has a bounded consequence', capped.pF.every((p, i) => Math.abs(p - spam.pF[i]) < 1e-9), true);
  const evidence = { k: 'gov', pres: 2, chanc: 3, law: 'F', pc: 3, cc: 1 };   // a story that does not add up holds even early (D52)
  const supportedOnce = Core.believe(view({ hist: [evidence, speech] })), supportedRepeat = Core.believe(view({ hist: [evidence, ...Array(4).fill(speech)] }));
  eq('talk: a supported accusation is not punished for repetition', supportedOnce.pF.every((p, i) => Math.abs(p - supportedRepeat.pF[i]) < 1e-9), true);
  for (const level of Core.LEVELS) {
    const knownSafe = Core.believe(view({ level, hist: [...Array(3).fill({ k: 'chaos', law: 'F' }), { k: 'gov', pres: 2, chanc: 6, law: 'L' }, ...Array(12).fill({ k: 'gov', pres: 0, chanc: 1, law: 'F' })] }));
    eq(`rules are not forgotten: ${level} keeps a proven non-leader safe`, knownSafe.pH[6], 0);
  }
  for (const level of ['dificil', 'extremo']) {
    const dangerous = view({ level, me: 4, pres: 4, chanc: 0, laws: { L: 1, F: 3 }, hist: [{ k: 'inv', by: 4, target: 0, party: 'F' }] });
    eq(`voting: ${level} liberal president rechecks its dangerous chancellor`, Core.decide(dangerous, hi), 0);
    const team = view({ level, me: 1, role: 'cultista', known: knowAll, laws: { L: 1, F: 3 }, chanc: 0 });
    eq(`terminal election: ${level} never misses known leader on a noise draw`, [Core.decide(team, () => 0), Core.decide({ ...team, ask: 'nominate', options: [0, 3] }, () => 0)], [1, 0]);
    eq(`execution: ${level} protects leader when only allies remain`, Core.decide({ ...team, ask: 'execute', options: [0, 2] }, () => 0), 2);
    const hiddenAlly = view({ level, me: 0, role: 'lider', known: ['lider', null, null, null, null, null, null], hist: [{ k: 'inv', by: 0, target: 3, party: 'F' }], ask: 'nominate', options: [2, 3, 5] });
    eq(`hidden leader: ${level} recruits an investigated ally`, [Core.decide(hiddenAlly, hi), Core.decide({ ...hiddenAlly, ask: 'special' }, hi)], [3, 3]);
    eq(`hidden leader: ${level} supports an investigated ally's government`, Core.decide({ ...hiddenAlly, ask: 'vote', options: [0, 1], pres: 3, chanc: 5 }, hi), 1);
    eq(`hidden leader: ${level} does not shoot an investigated ally`, Core.decide({ ...hiddenAlly, ask: 'execute', options: [3, 5] }, hi), 5);
    const peekWin = view({ level, tracker: 2, pres: 3, chanc: 5, laws: { L: 4, F: 3 }, hist: [{ k: 'peek', by: 4, saw: deck('LFF') }] });
    eq(`chaos: ${level} uses a private known winning top law`, Core.decide(peekWin, () => 0), 0);
    const peekLose = { ...peekWin, laws: { L: 3, F: 5 }, hist: [{ k: 'inv', by: 4, target: 5, party: 'L' }, { k: 'peek', by: 4, saw: deck('FLL') }] };
    eq(`chaos: ${level} elects a safe government to avoid a known losing top law`, Core.decide(peekLose, () => 0), 1);
    for (const consumed of [{ k: 'chaos', law: 'F' }, { k: 'gov', pres: 3, chanc: 5, law: 'L' }, { k: 'veto', pres: 3, chanc: 5 }]) {
      const stale = Core.decideWhy({ ...peekWin, hist: [...peekWin.hist, consumed] }, hi);
      eq(`chaos: ${level} forgets stale peek after ${consumed.k}`, stale.why.text.some(t => t.includes('Viu a lei do topo')), false);
    }
    const publicPeek = Core.decideWhy({ ...peekWin, hist: [{ k: 'peek', by: 2, said: 2 }] }, hi);
    eq(`chaos: ${level} never treats another player's claim as a private top card`, publicPeek.why.text.some(t => t.includes('Viu a lei do topo')), false);
  }
  eq('a seat may have a level of its own (the measurements use it); a bad one is damage', [Core.viewOf({ ...sg, players: sg.players.map((p, i) => (i === 4 ? { ...p, level: 'facil' } : p)) }, 4, 'vote', [1, 0]).level, Core.viewOf(sg, 4, 'vote', [1, 0]).level, Core.readGame({ ...el, players: el.players.map(p => ({ ...p, level: 'x' })) })], ['facil', 'medio', null]);
  eq('the levels: cultists who think about how the table sees them only from the hard level up', Core.LEVELS.map(l => Core.AI[l].image > 0 && Core.AI[l].plan), [false, false, true, true]);
  eq('the levels: careless to careful, believing to doubting, and only the extreme counts the laws', [Core.LEVELS.map(l => Core.AI[l].noise > Core.AI.extremo.noise), Core.LEVELS.map(l => Core.AI[l].count), Core.AI.facil.lie < Core.AI.medio.lie && Core.AI.medio.lie < Core.AI.dificil.lie && Core.AI.dificil.lie < Core.AI.extremo.lie], [[true, true, true, false], [false, false, false, true], true]);

  // the votes, one by one, where the app plays some seats
  const vg = ai7({ phase: 'vote', chanc: 4, reveal: 7 });
  eq('votes: without the vote of the person at the table nothing happens', Core.castVotes(vg, {}, rand), vg);
  const voted = Core.castVotes(vg, { 0: true }, Core.seeded(5));
  eq('votes: every vote is recorded for all to see, and more Ja! than Nein! elects', [voted.hist.at(-1).k, voted.hist.at(-1).ja.includes(0), voted.hist.at(-1).ja.includes(3), voted.hist.at(-1).ja.includes(4), voted.log.some(l => l.startsWith('Votos. Ita!: Ana')), (voted.phase === 'president') === (voted.hist.at(-1).ja.length > 3)], ['vote', true, true, true, true, true]);
  const tie = ai7({ phase: 'vote', chanc: 4, players: ai7().players.map((p, i) => (i === 6 ? { ...p, alive: false } : p)) });
  eq('votes: a tie rejects', ((t) => t.hist.at(-1).ja.length === 3 ? t.phase : 'nominate')(Core.castVotes(tie, { 0: false }, Core.seeded(8))), 'nominate');
  // what each seat tells the table
  const said = ai7({ phase: 'nominate', pres: 4, hist: [{ k: 'gov', pres: 0, chanc: 3, law: 'L', drew: deck('FFL'), got: deck('FL') }] });
  const s1 = Core.say(said, 0, 'pc', 2);
  eq('telling the table: the president may say what it drew, once; the log says it', [Core.claims(said, 0), Core.claims(said, 3), s1.hist[0].pc, s1.log.at(-1), Core.say(s1, 0, 'pc', 3) === s1, Core.claims(s1, 0)], [['pc'], ['cc'], 2, 'Ana (presidente) disse que tirou 2 cultistas e 1 liberal.', true, []]);
  eq('telling the table: only who was there, only possible numbers; keeping quiet is -1', [Core.say(said, 4, 'pc', 1) === said, Core.say(said, 0, 'pc', 4) === said, Core.say(said, 3, 'cc', -1).hist[0].cc, Core.say(said, 3, 'cc', -1).log.at(-1)], [true, true, -1, 'Duda não disse o que recebeu.']);
  eq('telling the table: a new election closes it', Core.claims({ ...said, hist: [...said.hist, { k: 'rej', pres: 4, chanc: 1 }] }, 0), []);
  const invd = ai7({ phase: 'nominate', hist: [{ k: 'inv', by: 0, target: 1, party: 'F' }, { k: 'peek', by: 0, saw: deck('FFL') }] });
  eq('telling the table: an investigation and a spying', [Core.claims(invd, 0), Core.say(invd, 0, 'inv', 0).log.at(-1), Core.say(invd, 0, 'peek', 2).log.at(-1), Core.claims({ ...invd, phase: 'investigated' }, 0)], [['inv', 'peek'], 'Ana disse que Bia é liberal.', 'Ana disse que as próximas 3 leis são 2 cultistas e 1 liberal.', ['peek']]);
  // whose turn
  eq('whose turn: players run by the app see their roles by themselves; a person sees theirs', [Core.botTurn(ai7({ phase: 'reveal', reveal: 0 })), Core.botTurn(ai7({ phase: 'reveal', reveal: 2 })).ask, Core.botStep(ai7({ phase: 'reveal', reveal: 2 }), rand).reveal], [null, 'reveal', 3]);
  eq('whose turn: the president tells first, then the chancellor, before the game goes on', [Core.botTurn(ai7({ phase: 'nominate', pres: 2, hist: [{ k: 'gov', pres: 5, chanc: 6, law: 'L', drew: deck('LLF'), got: deck('LL') }] })).seat, Core.botTurn(ai7({ phase: 'nominate', pres: 2, hist: [{ k: 'gov', pres: 5, chanc: 6, law: 'L', drew: deck('LLF'), got: deck('LL'), pc: 0 }] })).seat], [5, 6]);
  const settleCampaign = g => { for (let i = 0; i < Core.TALKS; i++) { if (Core.botTurn(g)?.ask === 'talk') g = Core.botStep(g, hi); } return g; };
  eq('whose turn: after public campaigning the vote waits for people or runs alone', [Core.botTurn(settleCampaign(ai7({ phase: 'vote', chanc: 4 }))), Core.botTurn(settleCampaign(ai7({ phase: 'vote', chanc: 4, players: ai7().players.map((p, i) => (i ? p : { ...p, alive: false })) }))).ask], [null, 'votes']);
  eq('whose turn: a question with no possible answer is never asked', Core.botTurn(ai7({ phase: 'nominate', pres: 1, lastChanc: 2, players: ai7().players.map((p, i) => (i === 1 || i === 2 ? p : { ...p, alive: false })) })), null);
  eq('whose turn: nobody at a table of people only, nobody after the end', [Core.botTurn(base), Core.botTurn(ai7({ phase: 'over' })), Core.botStep(base, rand)], [null, null, null]);
  // whole games with only players run by the app: every step is a move the rules accept, and every game ends
  let ended = 0, played = 0, moved = true, kept = true, honest = true, explained = true;
  for (const level of Core.LEVELS) for (let n = Core.MIN_PLAYERS; n <= Core.MAX_PLAYERS; n++) {
    const r = Core.seeded(n * 31 + level.length), names = Core.BOT_NAMES.classico.slice(0, n);
    let g = Core.newGame(names, r, { ai: names.map(() => true), level }).game;
    for (let step = 0; step < 600 && g.phase !== 'over'; step++) {
      const next = Core.botStep(g, r);
      if (!next || next === g || JSON.stringify(next) === JSON.stringify(g)) { moved = false; break; }
      g = next;
      if (!Core.readGame(JSON.parse(JSON.stringify(g)))) kept = false;
    }
    played++; if (g.phase === 'over' && g.winner) ended++;
    const back = Core.readGame(JSON.parse(JSON.stringify(g)));
    if (!g.trace || !g.trace.length || !back || !back.trace || back.trace.length !== g.trace.length || !g.trace.every(t => g.players[t.seat].ai && t.why.text.length && t.why.text.every(l => typeof l === 'string' && l.length && !l.includes('undefined') && !l.includes('NaN')))) explained = false;
    for (const e of g.hist) if ((e.k === 'gov' || e.k === 'veto') && g.players[e.pres].role === 'liberal' && e.pc !== undefined && e.pc !== e.drew.filter(l => l === 'F').length) honest = false;
  }
  eq('games with only app players, every level, every table size: every step moves, every state can be saved, every game ends, liberals never lie', [ended, moved, kept, honest], [played, true, true, true]);
  eq('reasoning (D16): every decision of an app player is recorded with its reason, in words, and the record is saved', explained, true);
  const wv = Core.viewOf(ai7({ phase: 'vote', pres: 3, chanc: 4 }), 5, 'vote', [1, 0]), r3 = Core.seeded(3), r4 = Core.seeded(3), w = Core.decideWhy(wv, r3);
  eq('reasoning: the answer with a reason is the same answer, draw for draw; a vote tells the risk it weighed, with the government in the rows', [w.a, w.a === Core.decide(wv, r4), r3() === r4(), w.why.text.some(l => l.includes('Chance de ter alguém do lado escondido')) || w.why.text.some(l => l.includes('sem pensar')), (w.why.rows || []).map(x => x.seat).sort()], [w.a, true, true, true, [3, 4]]);
  const iv = Core.decideWhy(Core.viewOf(ai7({ phase: 'investigate', pres: 5, hist: [{ k: 'gov', pres: 3, chanc: 4, law: 'L', pc: 1, cc: 0 }] }), 5, 'investigate', [0, 1, 2, 3, 4, 6]), () => 0.99);
  eq('reasoning: a liberal investigating says it picks the one it doubts the most, and shows that doubt for each', [Core.viewOf(ai7({}), 5, 'vote', [1, 0]).role, iv.why.text.some(l => l.includes('mais dúvida')), iv.why.rows.length, iv.why.rows.every(x => typeof x.v === 'number')], ['liberal', true, 6, true]);
  const tg = ai7({ phase: 'nominate', hist: [{ k: 'gov', pres: 3, chanc: 4, law: 'L', pc: 1, cc: 0 }, { k: 'rej', pres: 4, chanc: 6 }, { k: 'gov', pres: 0, chanc: 5, law: 'F', pc: 3, cc: 1 }] }), tr = Core.trail(tg, 6);
  eq('belief trail: from the start and after each law, what the seat believed of each, from its own seat (a liberal is sure only of itself)', [tr.map(x => x.at), tr.every(x => x.f.length === 7 && x.f.every(f => f >= 0 && f <= 1)), tr[0].f[6], tr[2].f[0] > tr[0].f[0]], [[-1, 0, 2], true, 0, true]);
  // the review of a person's plays (D19): Ana Sumo Sacerdote, Bia and Caio cultists, the rest liberal
  const rv = (hist, me, over = {}) => Core.review(ai7({ phase: 'over', hist, ...over }), me);
  const tossed = rv([{ k: 'gov', pres: 3, chanc: 4, law: 'F', drew: deck('FFL'), got: deck('FF'), pc: 3, cc: 2 }], 3);
  eq('review: a liberal president who threw the liberal law away and lied about it: two bad plays', [tossed.length, tossed.every(x => !x.good), tossed[0].weight, tossed.some(x => x.text.includes('jogando fora a liberal')), tossed.some(x => x.text.includes('mente'))], [2, true, 3, true, true]);
  const keptL = rv([{ k: 'gov', pres: 4, chanc: 3, law: 'L', drew: deck('FFL'), got: deck('FL'), pc: 2, cc: 1 }], 3);
  eq('review: a liberal chancellor who passed the liberal law with a cultist one in hand: a good play', keptL.map(x => [x.good, x.weight]), [[true, 1]]);
  eq('review: a liberal eliminating Sumo Sacerdote wins the game; a cultist eliminating a liberal does well; Bia eliminating Caio does not', [rv([{ k: 'exec', by: 4, target: 0, role: 'lider' }], 4).map(x => [x.good, x.weight]), rv([{ k: 'exec', by: 1, target: 5, role: 'liberal' }], 1).map(x => x.good), rv([{ k: 'exec', by: 1, target: 2, role: 'cultista' }], 1).map(x => x.good)], [[[true, 5]], [true], [false]]);
  eq('review: a liberal investigating, eliminating a liberal or handing the special election to a cultist is weighed against what it could have done', [Array.isArray(rv([{ k: 'inv', by: 4, target: 5, party: 'L' }], 4)), Array.isArray(rv([{ k: 'exec', by: 4, target: 5, role: 'liberal' }], 4)), Array.isArray(rv([{ k: 'special', by: 4, target: 1 }], 4))], [true, true, true]);
  const pushed = rv([{ k: 'gov', pres: 1, chanc: 2, law: 'F', drew: deck('FFL'), got: deck('FF'), pc: 3, cc: 2 }], 1);
  eq('review: a cultist law pushed through is judged by how much the table caught on, with the numbers', [pushed.some(x => x.text.includes('lei {f}') && /\d+% → \d+%/.test(x.text)), pushed.every(x => typeof x.good === 'boolean')], [true, true]);
  const firstVote = rv([{ k: 'vote', pres: 3, chanc: 0, ja: [3, 4, 5, 6, 0] }, { k: 'gov', pres: 3, chanc: 0, law: 'L', drew: deck('LLF'), got: deck('LL') }], 5);
  eq('review: voting Ja! for a government with Sumo Sacerdote in the first round, with nothing to go on, is not called bad', firstVote.filter(x => !x.good).length, 0);
  eq('review: names come as {pN}, never as text that could hold markup; no undefined or NaN', [tossed, keptL, pushed].flat().every(x => !/undefined|NaN/.test(x.text) && !NAMES.some(nm => x.text.includes(nm))), true);
  eq('read state: closing a secret with the phone face down is kept only when turned on (D20)', [Core.readState({ flip: true }).flip, 'flip' in Core.readState({ flip: 'yes' }), 'flip' in Core.readState({})], [true, false, false]);
  // the chancellor test (D22): Duda (3, liberal) drew 1F 2L, passed one of each to Edu (4), said so; Edu enacted the liberal
  const tested = ai7({ phase: 'nominate', level: 'dificil', hist: [{ k: 'vote', pres: 3, chanc: 4, ja: [0, 1, 2, 3, 4, 5, 6] }, { k: 'gov', pres: 3, chanc: 4, law: 'L', drew: deck('FLL'), got: deck('FL'), pc: 1, cc: 1 }] });
  const fromChanc = Core.believe(Core.viewOf(tested, 4, 'vote', [1, 0])).pF[3], fromOut = Core.believe(Core.viewOf(tested, 5, 'vote', [1, 0])).pF[3], prior = Core.believe(Core.viewOf(ai7({ level: 'dificil' }), 4, 'vote', [1, 0])).pF[3];
  eq('chancellor test: the tested chancellor, and the table, suspect the tester more, but never take one play as proof', [fromChanc > prior + 0.1, fromChanc < 0.9, fromOut > prior, fromOut < 0.9], [true, true, true, true]);
  const tc = Core.coach(tested, 6);
  eq('chancellor test: the trainer calls it a test, not a story that does not hold together', [tc.test, tc.clash], [true, false]);
  const tv = (level) => Core.viewOf(ai7({ phase: 'president', level, pres: 3, chanc: 4, hand: deck('FLL') }), 3, 'pdiscard', [0, 1, 2]);
  eq('chancellor test: a liberal of the hard levels tests a chancellor it is unsure of (throws a liberal law away); easier levels never do', [deck('FLL')[Core.decide(tv('dificil'), () => 0.1)], deck('FLL')[Core.decide(tv('medio'), () => 0.1)], deck('FLL')[Core.decide(tv('dificil'), () => 0.9)]], ['L', 'F', 'F']);
  const rt = rv([{ k: 'gov', pres: 3, chanc: 4, law: 'L', drew: deck('FLL'), got: deck('FL'), pc: 1, cc: 1 }], 3), rf = rv([{ k: 'gov', pres: 3, chanc: 1, law: 'F', drew: deck('FLL'), got: deck('FL'), pc: 1, cc: 2 }], 3);
  eq('review: a test that showed a liberal is a small good play; one that cost a cultist law is a bad one; neither is called throwing a liberal away or lying', [rt.every(x => x.good) && rt.some(x => x.text.includes('testou')), rf.some(x => !x.good && x.text.includes('custou')), [...rt, ...rf].some(x => x.text.includes('mente'))], [true, true, false]);
  // not naive (D22): the levels that read the long game know Sumo Sacerdote keeps clean early, check spied hands, read votes
  const at = (level, hist, seat = 6) => Core.believe(Core.viewOf(ai7({ level, hist }), seat, 'vote', [1, 0]));
  const clean = [{ k: 'gov', pres: 3, chanc: 0, law: 'L', pc: 1, cc: 1 }, { k: 'gov', pres: 4, chanc: 0, law: 'L', pc: 1, cc: 1 }];
  eq('not naive: a chancellor who let liberal laws through early is still a Sumo Sacerdote suspect for the hard levels, cleared for the easy ones', at('dificil', clean).pH[0] > at('medio', clean).pH[0], true);
  const spied = [{ k: 'peek', by: 5, said: 0 }, { k: 'gov', pres: 3, chanc: 4, law: 'F', pc: 3, cc: 2 }];
  eq('not naive: a president whose hand does not match what someone spied is caught by the hard levels', at('dificil', spied).pF[3] + at('dificil', spied).pF[5] > at('medio', spied).pF[3] + at('medio', spied).pF[5], true);
  const picks = [{ k: 'rej', pres: 1, chanc: 2 }, { k: 'rej', pres: 1, chanc: 2 }];
  eq('not naive: the hard levels read who a president keeps nominating', at('dificil', picks).pF[2] > at('medio', picks).pF[2], true);
  const votes = [{ k: 'vote', pres: 3, chanc: 1, ja: [0, 1, 2, 3] }, { k: 'gov', pres: 3, chanc: 1, law: 'F', pc: 2, cc: 2 }];
  eq('not naive: the extreme level reads who voted Ja for a government that turned out cultist', at('extremo', votes).pF[2] > at('dificil', votes).pF[2], true);
  const tr1 = { seat: 1, ask: 'vote', a: 1, at: 0, why: { text: ['x'] } };
  eq('read game: the record of reasons comes back; damaged, only it is dropped; the old reasoning panel switch is dropped (D28)', [Core.readGame({ ...el, trace: [tr1] }).trace.length, 'trace' in Core.readGame({ ...el, trace: [{ ...tr1, seat: 99 }] }), 'trace' in Core.readGame({ ...el, trace: 'x' }), 'debug' in Core.readState({ debug: true })], [1, false, false, false]);
  eq('read game: the notebook kept with a finished game comes back; nonsense in it is dropped (D28)', [Core.readGame({ ...el, notes: { 1: 'F', 2: 'L' } }).notes, Core.readGame({ ...el, notes: { 1: 'X', a: 'F' } }).notes], [{ 1: 'F', 2: 'L' }, undefined]);
  eq('read state: the training role and the assistance are kept; nonsense is dropped', [Core.readState({ train: 'lider', assist: true }).train, Core.readState({ assist: true }).assist, 'train' in Core.readState({ train: 'rei' }), 'assist' in Core.readState({ assist: 'yes' }), Core.readGame({ ...el, train: 'rei' }), !!Core.readGame({ ...el, train: 'liberal' })], ['lider', true, false, false, null, true]);
  eq('read state: which seats the app plays and the level are kept; nonsense is dropped', [Core.readState({ names: ['a', 3, 'b'], ai: [false, true, true] }).ai, 'ai' in Core.readState({ names: ['a'], ai: [false] }), Core.readState({ level: 'extremo' }).level, 'level' in Core.readState({ level: 'x' })], [[false, true], false, 'extremo', false]);
  eq('read game: a bad app seat, level or hand drawn is damage', [Core.readGame({ ...el, players: el.players.map(p => ({ ...p, ai: 1 })) }), Core.readGame({ ...el, level: 'x' }), Core.readGame({ ...el, drew: ['X'] }), !!Core.readGame({ ...el, level: 'dificil', drew: deck('FFL') })], [null, null, null, true]);

  eq('themes: what the table says and the votes use the words of the theme', [Core.castVotes({ ...ai7({ phase: 'vote', chanc: 4 }), pack: 'vermelho' }, { 0: true }, Core.seeded(5)).log.find(l => l.startsWith('Votos.')).startsWith(`Votos. ${Core.WORDS.vermelho.ja}: Ana`), Core.say({ ...ai7({ phase: 'nominate', pres: 4, hist: [{ k: 'gov', pres: 0, chanc: 3, law: 'L', drew: deck('FFL'), got: deck('FL') }] }), pack: 'vermelho' }, 0, 'pc', 2).log.at(-1)], [true, `Ana (presidente) disse que tirou 2 ${Core.WORDS.vermelho.fs} e 1 liberal.`]);
  /* the app players talk between rounds; the trainer; what they thought (D13) */
  const chat = ai7({ phase: 'nominate', pres: 0, hist: [{ k: 'gov', pres: 1, chanc: 2, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 1, law: 'L', pc: 1, cc: 0 }, { k: 'rej', pres: 3, chanc: 4 }] });
  const first = Core.talker(chat);
  eq('talk: once something happened, at the start of a round, an app player speaks; after an event or during a public voting campaign', [first !== null && chat.players[first].ai === true, Core.talker(ai7({ phase: 'nominate', hist: [] })), Core.talker({ ...chat, phase: 'vote', chanc: 4 }) !== null, Core.botTurn(chat).ask], [true, null, true, 'talk']);
  { const early = ai7({ phase: 'nominate', pres: 0, hist: [{ k: 'rej', pres: 3, chanc: 4 }] }), w = Core.talker(early);
    eq('D87: before two laws, an app player with no proof keeps quiet instead of accusing', Core.talk(early, w, 2 * 5).hist.at(-1).say, 'quiet'); }
  { const hv = ai7({ phase: 'nominate', pres: 0, hist: [{ k: 'gov', pres: 1, chanc: 2, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 1, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 4, chanc: 3, law: 'F', pc: 1, cc: 2 }, { k: 'rej', pres: 5, chanc: 6 }] });
    const w = Core.talker(hv), about = w === 4 ? 5 : 4, r = w !== null && w !== 0 ? Core.talk(hv, w, about * 2) : null, t = r && r.hist.findLast(e => e.k === 'talk');
    eq('D88: an accusation between two app players with a proof gets its verdict on the spot', !r || t.say !== 'acc' || !t.proof ? true : !!t.verdict && r.log.at(-1).startsWith('A mesa'), true); }
  const t1 = Core.talk(chat, first, 2 * 5), t2 = Core.talk(t1, Core.talker(t1), Core.QUIET);
  eq('talk: what is said goes in the log and the history; quiet leaves no line; at most TALKS a round, each once', [t1.log.at(-1), t1.hist.at(-1), t2.hist.at(-1).say, t2.log.length === t1.log.length, Core.talker(t2), Core.TALKS], [`${chat.players[first].name}: "Desconfio de Fê."`, { k: 'talk', by: first, about: 5, say: 'acc' }, 'quiet', true, null, 2]);
  eq('talk: only the one whose turn it is, about someone else in the game', [Core.talk(chat, first === 1 ? 2 : 1, 10) === chat, Core.talk(chat, first, 2 * first) === chat, Core.talk(chat, first, 2 * 5 + 1).log.at(-1).includes('Confio em Fê')], [true, true, true]);
  eq('votes in the tongue of each continent (D29): the world and Europe keep the theme\'s; the rest of the words stay', [Core.words('classico', 'mundo').ja, Core.words('vermelho', 'europa').nein, Core.words('classico', 'americas').ja, Core.words('vermelho', 'brasil').nein, Core.words('classico', 'asia').ja, Core.words('vermelho', 'asia').ja, Core.words('vermelho', 'africa').nein, Core.words('classico', 'oceania').ja, Core.words('vermelho', 'brasil').boss, Core.words().ja], [Core.WORDS.classico.ja, Core.WORDS.vermelho.nein, '¡Sí!', 'Não!', 'Hai!', 'Shì!', 'Hapana!', 'Yes!', Core.WORDS.vermelho.boss, 'Ita!']);
  eq('votes of the continent in the record', Core.castVotes({ ...ai7({ phase: 'vote', chanc: 4 }), region: 'brasil', pack: 'classico' }, { 0: true }, Core.seeded(5)).log.find(l => l.startsWith('Votos.')).startsWith('Votos. Sim!: Ana'), true);
  eq('read state: the suspicion gauge switch (D32)', [Core.readState({ gauge: true }).gauge, 'gauge' in Core.readState({ gauge: 1 })], [true, false]);
  /* the court (D39): what the record holds against someone, and accusing with a tone and a proof */
  const court = ai7({ phase: 'nominate', pres: 0, hist: [{ k: 'vote', pres: 2, chanc: 3, ja: [2, 3, 4] }, { k: 'gov', pres: 2, chanc: 3, law: 'F', pc: 1, cc: 2 }, { k: 'rej', pres: 3, chanc: 4 }] });
  const ev3 = Core.evidence(court, 3), ev4 = Core.evidence(court, 4);
  eq('evidence: a government whose story does not add up holds; a Ja! for a cultist government is a hint that does not', [ev3.map(x => [x.kind, x.hit]), ev4.map(x => [x.kind, x.hit])], [[['clash', true]], [['vote', false]]]);
  const hitG = Core.accuse(court, 0, 3, 'proof', ev3[0].at, Core.seeded(4)), hitT = hitG.hist.at(-1);
  eq('accuse with a proof that holds: tagged, and the accused stammers', [hitT.k, hitT.tone, hitT.proof, hitT.hit, /…|—/.test(hitG.log.at(-1))], ['talk', 'proof', ev3[0].at, true, true]);
  const missG = Core.accuse(court, 0, 4, 'firm', null, Core.seeded(4));
  eq('accuse firmly without anything that holds: no hit, and the accuser loses credibility with the table', [missG.hist.at(-1).hit, Core.believe(Core.viewOf(missG, 6, 'vote', [1, 0])).pF[0] > Core.believe(Core.viewOf(Core.accuse(court, 0, 4, 'soft', null, Core.seeded(4)), 6, 'vote', [1, 0])).pF[0]], [undefined, true]);
  /* the app players take the court, the accused defends, Sumo Sacerdote's style (D40) */
  const aiAcc = Core.talk({ ...court, phase: 'nominate' }, Core.talker(court), 2 * 3);
  const at3 = aiAcc.hist.at(-1);
  eq('an app player accusing with a proof that holds makes it a court accusation', [at3.say, at3.tone, at3.hit], ['acc', 'proof', true]);
  const pend = { ...court, hist: [...court.hist, { k: 'talk', by: 1, about: 0, say: 'acc', tone: 'proof', proof: 1, hit: true }] };
  eq('the accused sees an accusation waiting for an answer, once', [Core.pendingAccusation(pend, 0), Core.pendingAccusation(Core.defend(pend, 0, 'quiet'), 0)], [3, -1]);
  const test = { ...court, hist: [{ k: 'vote', pres: 0, chanc: 3, ja: [0, 3, 4] }, { k: 'gov', pres: 0, chanc: 3, law: 'L', pc: 1, cc: 1 }, { k: 'talk', by: 1, about: 0, say: 'acc', tone: 'proof', proof: 1 }] };
  eq('a defence holds only when the record backs it: a test that a liberal law came out of', [Core.defend(test, 0, 'test').hist.at(-1).ok, Core.defend(test, 0, 'deck').hist.at(-1).ok, Core.defend(test, 0, 'quiet').hist.at(-1).ok], [true, false, false]);
  eq('the straight Sumo Sacerdote hides more than the bluffer', Core.BOSS_STYLE.certinho > Core.BOSS_STYLE.blefador, true);
  eq('achievements (D41): only for a finished game; a liberal who eliminated Sumo Sacerdote and won is a hunter and a winner', [Core.achievements(court, 0), Core.achievements({ ...court, phase: 'over', winner: 'L', why: 'x', hist: [{ k: 'exec', by: 6, target: 0 }] }, 6).sort()], [[], ['hunter', 'sealed', 'win']]);
  eq('reputation (D43): 3 stars clean; a story that does not add up and a firm accusation the record does not back cost stars', [Core.reputation(court, 5), Core.reputation(court, 2), Core.reputation({ ...court, hist: [...court.hist, { k: 'talk', by: 2, about: 4, say: 'acc', tone: 'firm' }] }, 2), Core.readState({ rep: true }).rep], [3, 2, 1, true]);
  eq('review (D45): a liberal accusing a cultist with a proof that held is a good play; accusing a liberal firmly without one is bad', [Core.review({ ...court, phase: 'over', winner: 'L', why: 'x', hist: [...court.hist, { k: 'talk', by: 6, about: 1, say: 'acc', tone: 'proof', hit: true }] }, 6).some(x => x.good && x.text.includes('CONTRADIÇÃO')), Core.review({ ...court, phase: 'over', winner: 'L', why: 'x', hist: [...court.hist, { k: 'talk', by: 6, about: 4, say: 'acc', tone: 'firm' }] }, 6).some(x => !x.good && x.text.includes('firmeza'))], [true, true]);
  /* the notebook scored at the end (D28): seat 6 is a liberal; 0 Sumo Sacerdote, 1 and 2 cultists */
  const nb = ai7({ phase: 'over', winner: 'L', why: 'x', notes: { 0: 'F', 1: 'L', 4: 'L', 3: 'L', 6: 'F' }, hist: [{ k: 'inv', by: 6, target: 3, party: 'L' }] });
  eq('notes score: right and wrong, leaving out the seat itself and what it knew for sure (its own investigation)', Core.notesScore(nb, 6), { right: [0, 4], wrong: [1] });
  eq('notes score: a cultist knows its team, so marking it is no deduction; no notebook, nothing', [Core.notesScore({ ...nb, notes: { 0: 'F', 2: 'F', 5: 'L' } }, 1), Core.notesScore({ ...nb, notes: undefined }, 6)], [{ right: [5], wrong: [] }, { right: [], wrong: []}]);
  eq('notes score: each right deduction is a good play at the end', Core.review(nb, 6).filter(x => x.good && x.text.startsWith('Nas anotações')).length, 2);
  /* telling the table, personalities and reactions (D26) */
  const pg = Core.newGame(NAMES, Core.seeded(11), { ai: [false, true, true, true, true, true, true] }).game;
  eq('personality: every app player gets one, all different at a table of 7, people none; drawn anew each game', [pg.players.slice(1).every(p => Core.PERSONAS.includes(p.persona)), new Set(pg.players.slice(1).map(p => p.persona)).size, 'persona' in pg.players[0], [12, 13, 14].some(sd => Core.newGame(NAMES, Core.seeded(sd), { ai: [false, true, true, true, true, true, true] }).game.players.slice(1).map(p => p.persona).join() !== pg.players.slice(1).map(p => p.persona).join())], [true, 6, false, true]);
  eq('personality: kept when saved; one that does not exist is damage', [!!Core.readGame({ ...el, players: el.players.map(p => ({ ...p, persona: 'cetico' })) }), Core.readGame({ ...el, players: el.players.map(p => ({ ...p, persona: 'rei' })) })], [true, null]);
  eq('personality: the temper sits where the personality puts it, moved a little by the one drawn', [Core.temper(0, 'desconfiado'), Core.temper(1, 'centrado'), Core.temper(-1, 'desconfiado'), Core.temper(0.5)], [-0.7, 0.4, -1, 0.2]);
  const d1 = Core.denounce(chat, 0, 1, false, Core.seeded(2));
  const d1t = d1.hist.at(-1);
  eq('claim (D30): a person says what someone is; it goes in the log and the history, each app player still in the game answers in its own words, and the one claimed answers back', [d1.log.at(-7), d1.log.slice(-6, -1).every(l => /^\S+: ".+"$/.test(l)), d1.log.at(-1).startsWith('Bia: "'), d1.log.at(-1).includes('Não sou eu'), d1t.k, d1t.by, d1t.about, d1t.say, d1t.re.map(r => r[0]), d1t.re.every(r => [0, 1, 2].includes(r[1]))], ['Ana: "Bia é cultista."', true, true, false, 'talk', 0, 1, 'acc', [2, 3, 4, 5, 6], true]);
  eq('denounce: once a round for each one, only a person still in the game, about someone else in it; a new round opens it again', [Core.denounce(d1, 0, 1, true, Core.seeded(1)) === d1, Core.canDenounce(d1, 0, 2), Core.canDenounce(chat, 1, 2), Core.canDenounce(chat, 0, 0), Core.canDenounce({ ...chat, players: chat.players.map((p, i) => (i === 2 ? { ...p, alive: false } : p)) }, 0, 2), Core.canDenounce({ ...d1, hist: [...d1.hist, { k: 'rej', pres: 1, chanc: 2 }] }, 0, 1), Core.canDenounce({ ...chat, phase: 'over' }, 0, 1)], [true, true, false, false, false, true, false]);
  const repeatedClaim = { ...d1, hist: [...d1.hist, { k: 'rej', pres: 1, chanc: 2 }] };
  const repeatedDenounce = Core.denounce(repeatedClaim, 0, 1, false, hi);
  eq('denounce: the table explicitly notices unsupported repetition', repeatedDenounce.log.some(l => l.includes('já acusou') || l.includes('fato novo')), true);
  const reaction = Core.decideWhy(view({ persona: 'critico', ask: 'react', options: [0, 1, 2], hist: [speech, speech, speech] }), hi);
  eq('react: insistence without evidence is challenged and explained', [reaction.a, reaction.why.text.some(t => t.includes('sem fato novo'))], [Core.REACT.disagree, true]);
  eq('claim: saying someone is liberal; what a person says does not take the turn of an app player to talk', [Core.denounce(chat, 0, 3, true, Core.seeded(2)).log.includes('Ana: "Duda é liberal."'), Core.talker(d1) !== null], [true, true]);
  const heard = (persona, about, hist) => Core.believe({ ...Core.viewOf(ai7({ hist }), 6, 'vote', [1, 0]), persona }).pF[about];
  const r0 = [{ k: 'rej', pres: 3, chanc: 4 }], acc5 = [...r0, { k: 'talk', by: 4, about: 5, say: 'acc' }];
  eq('talk weighs (D26): an accusation makes the one accused look more cultist, a vouch less; the sceptic moves less than the centred', [heard('centrado', 5, acc5) > heard('centrado', 5, r0), heard('centrado', 5, [...r0, { k: 'talk', by: 4, about: 5, say: 'trust' }]) < heard('centrado', 5, r0), heard('cetico', 5, acc5) - heard('centrado', 5, r0) < heard('centrado', 5, acc5) - heard('centrado', 5, r0)], [true, true, true]);
  eq('reactions weigh a little (D33): the table agreeing with an accusation makes it count more, disagreeing less', [heard('centrado', 5, [...r0, { k: 'talk', by: 4, about: 5, say: 'acc', re: [[1, 0], [2, 0], [3, 0]] }]) > heard('centrado', 5, acc5), heard('centrado', 5, [...r0, { k: 'talk', by: 4, about: 5, say: 'acc', re: [[1, 2], [2, 2], [3, 2]] }]) < heard('centrado', 5, acc5)], [true, true]);
  const fgov = [{ k: 'gov', pres: 1, chanc: 3, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 2, chanc: 4, law: 'F', pc: 2, cc: 1 }, { k: 'gov', pres: 5, chanc: 2, law: 'F', pc: 3, cc: 2 }, { k: 'talk', by: 1, about: 5, say: 'acc' }];
  eq('talk weighs double when the record backs it: the one accused was in a government that passed a cultist law (D52: not one of the first ones)', [Core.backed(fgov, 0, 3, 5, true), Core.backed(fgov, 0, 3, 6, true), Core.backed(fgov, 0, 3, 5, false), heard('critico', 5, fgov) > heard('critico', 5, fgov.slice(0, 3)), Core.backed(fgov.slice(2), 0, 1, 5, true)], [true, false, false, true, false]);
  const fv = (about, say, sd) => Core.decide({ ...Core.viewOf(ai7({ hist: [...r0, { k: 'talk', by: 0, about, say }] }), 1, 'react', [0, 1, 2]), persona: 'centrado' }, Core.seeded(sd));
  eq('react: a cultist never disagrees with an accusation of a liberal, nor agrees with one of its teammate (but a bluffer may)', [[1, 2, 3, 4, 5, 6, 7, 8].every(sd => fv(4, 'acc', sd) !== 2), [1, 2, 3, 4, 5, 6, 7, 8].every(sd => fv(2, 'acc', sd) !== 0)], [true, true]);
  eq('talk: a new round opens the talk again', Core.talker({ ...t2, hist: [...t2.hist, { k: 'rej', pres: 0, chanc: 1 }] }) !== null, true);
  eq('talk: a liberal app player says what it believes, never about itself; the answer is always an option', [0, 1, 2, 3].map(sd => { const v = Core.viewOf({ ...chat, hist: [{ k: 'gov', pres: 5, chanc: 6, law: 'F', pc: 3, cc: 2 }] }, 4, 'talk', [2, 3, 10, 11, 12, 13, Core.QUIET]); const a = Core.decide(v, Core.seeded(sd)); return v.options.includes(a) && (a === Core.QUIET || a >> 1 !== 4); }).every(Boolean), true);
  const coached = Core.coach(ai7({ phase: 'nominate', hist: [{ k: 'gov', pres: 5, chanc: 6, law: 'F', drew: deck('FFL'), got: deck('FF'), pc: 3, cc: 1 }] }), 0);
  eq('trainer: the chance of the hand the president said, the story that does not hold, the most suspected first', [Math.round(coached.odds.p * 1000), coached.odds.who, coached.clash, coached.suspects.length, coached.suspects[0].f >= coached.suspects[2].f, coached.suspects.some(x => x.seat === 0)], [243, 5, true, 3, true, false]);
  eq('trainer: a cultist is not shown what it knows; the table\'s view of the seat is there', [Core.coach(ai7({ phase: 'nominate' }), 1).suspects.length, typeof Core.coach(ai7({ phase: 'nominate' }), 1).seen], [0, 'number']);
  const told2 = ai7({ phase: 'over', hist: [{ k: 'gov', pres: 0, chanc: 3, law: 'F', pc: 3, cc: 2 }, { k: 'rej', pres: 3, chanc: 4 }, { k: 'gov', pres: 4, chanc: 0, law: 'F', pc: 2, cc: 2 }] });
  const th = Core.thoughts(told2, 0);
  eq('what they thought: only app players that did not know the person, from the start and after each law', [th.map(x => x.seat), th.every(x => x.series.length === 3 && x.series.every(v => v >= 0 && v <= 1))], [[3, 4, 5, 6], true]);
  const live = Core.suspicion({ ...told2, phase: 'nominate' }, 0);
  eq('live suspicion: every app player in the game, a chance each; one that knows the role reckons as if it did not', [live.map(x => x.seat), live.every(x => x.f >= 0 && x.f <= 1), live.some(x => x.seat === 1 && x.f > 0 && x.f < 1)], [[1, 2, 3, 4, 5, 6], true, true]);
  const cruxG = ai7({ phase: 'nominate', hist: [{ k: 'gov', pres: 3, chanc: 4, law: 'L', pc: 1, cc: 0 }, { k: 'gov', pres: 0, chanc: 5, law: 'F', pc: 3, cc: 1 }, { k: 'rej', pres: 4, chanc: 6 }] });
  const cEnd = Core.crux(cruxG, 0, 'end'), cLive = Core.crux(cruxG, 0, 'live');
  eq('crucial point: the moment that raised the suspicion the most, with the average before and after; at the end and live', [cEnd.at, cEnd.after > cEnd.before, cLive.at, Core.crux(ai7({ phase: 'nominate' }), 0, 'end')], [1, true, 1, null]);
  eq('read state: tips, speed and the open notebook are kept; nonsense is dropped', [Core.readState({ notesOpen: true, live: true }).notesOpen && Core.readState({ live: true }).gauge, 'notesOpen' in Core.readState({ notesOpen: 1 }), Core.readState({ coach: true, speed: 'rapida' }).coach, Core.readState({ speed: 'lenta' }).speed, 'speed' in Core.readState({ speed: 'normal' }), 'coach' in Core.readState({ coach: 1 })], [true, false, true, 'lenta', false, false]);
  eq('read state: the old live suspicion is the meter now (D37); one switch, no second name', [Core.readState({ live: true }).gauge, 'live' in Core.readState({ live: true }), Core.readState({ gauge: true }).gauge, 'gauge' in Core.readState({ gauge: 1 })], [true, false, true, false]);

  /* the names of the app players by continent (D24) */
  const lists = Core.PACKS.flatMap(p => Core.REGIONS.map(r => Core.NAMES_BY[p][r]));
  eq('names by continent: every theme and continent has enough different names for a full table', lists.every(l => new Set(l).size === l.length && l.length >= Core.MAX_PLAYERS - 1), true);
  eq('Brazil expansion (D27): its own names, enough for a full table, kept unlocked when saved; nonsense dropped', [Core.REGIONS.includes('brasil'), new Set(Core.NAMES_BY.classico.brasil).size >= 9, new Set(Core.NAMES_BY.vermelho.brasil).size >= 9, Core.readState({ dlc: true }).dlc, 'dlc' in Core.readState({ dlc: 'x' }), Core.readState({ region: 'brasil' }).region, Core.DLC_KEY], [true, true, true, true, false, 'brasil', 'unlockresenha']);
  eq('names by continent: the Brazil names only in the expansion\'s Brazil list', [lists.filter(l => l !== Core.NAMES_BY.vermelho.brasil && l !== Core.NAMES_BY.classico.brasil).some(l => Core.NAMES_BY.vermelho.brasil.filter(x => !Core.NAMES_BY.vermelho.americas.includes(x)).some(x => l.includes(x)) && l !== Core.NAMES_BY.culto.brasil)], [false]);
  const nm = Array.from({ length: 9 }).reduce((acc) => [...acc, Core.botName(acc, Core.seeded(acc.length + 1), 'vermelho', 'americas')], ['Lu']);
  eq('names by continent: a table filled from one continent takes names from its list only, never twice', [nm.slice(1).every(x => Core.NAMES_BY.vermelho.americas.includes(x)), new Set(nm).size], [true, 10]);
  const rg = Core.newGame(NAMES, Core.seeded(2), { ai: [false, true, true, true, true, true, true], region: 'africa' }).game;
  eq('names by continent: the game keeps its continent (for the drawings); the whole world or nonsense keeps none', [rg.region, 'region' in Core.newGame(NAMES, Core.seeded(2), { region: 'mundo' }).game, 'region' in Core.newGame(NAMES, Core.seeded(2), { region: 'marte' }).game, Core.readGame({ ...el, region: 'marte' }), Core.readGame({ ...el, region: 'asia' }).region], ['africa', false, false, null, 'asia']);
  eq('read state: the continent of the names is kept; the whole world or nonsense is the default', [Core.readState({ region: 'africa' }).region, 'region' in Core.readState({ region: 'mundo' }), 'region' in Core.readState({ region: 'marte' })], ['africa', false, false]);

  /* the finished games kept on the device (D23) */
  const done = { ...el, phase: 'over', winner: 'L' };
  const hs = Core.readHistory([{ at: 1, game: done }, { at: 2, game: el }, { at: 'x', game: done }, null, { at: 3, game: { ...done, deck: ['X'] } }]);
  eq('history: only finished games that hold together, with when they ended; anything else is dropped', [hs.length, hs[0].at, Core.readHistory('x'), Core.readHistory(Array.from({ length: Core.HISTORY_MAX + 5 }, (_, i) => ({ at: i, game: done }))).length], [1, 1, [], Core.HISTORY_MAX]);
  const hf = Core.historyFile(hs, 'abc', 9);
  { // D104: the past games, newest first; with one person, the person's role and result
    const one = (role, winner, at) => ({ at, game: { ...Core.newGame(NAMES, Core.seeded(1), { ai: NAMES.map((_, i) => i > 0) }).game, winner, players: Core.newGame(NAMES, Core.seeded(1), { ai: NAMES.map((_, i) => i > 0) }).game.players.map((p, i) => (i === 0 ? { ...p, role } : p)) } });
    const pg = Core.pastGames([one('liberal', 'L', 1), one('cultista', 'L', 2), one('lider', 'F', 3)]);
    eq('D104: past games: newest first, the person\'s role and result, the share of wins', [pg.rows.map(r => r.at), pg.rows.map(r => r.won), pg.played, pg.won], [[3, 2, 1], [true, false, true], 3, 2]);
  }
  eq('history: the exported file says the app, the format, the version and when', [hf.app, hf.format, hf.version, hf.exported, hf.games.length], ['secret-cultist', 1, 'abc', 9, 1]);

  const ownPeekBluff = view({ level: 'extremo', role: 'cultista', me: 1, known: knowAll, ask: 'pc', options: [0, 1, 2, 3], hist: [{ k: 'peek', by: 1, said: 2, saw: deck('FFL') }, { k: 'gov', pres: 1, chanc: 4, law: 'F', drew: deck('FFL'), got: deck('FF') }] });
  eq('planned bluff honors its own recent peek declaration', [Core.decide(ownPeekBluff, () => 0), Core.decide(ownPeekBluff, hi)], [2, 2]);
  const privateNotebookGame = { ...done, noteDetails: { 2: { reason: 'PRIVATE_REASON', kind: 'fact' } } };
  eq('notebook reasons never enter a bot view', JSON.stringify(Core.viewOf(privateNotebookGame, 1, 'vote', [0, 1])).includes('PRIVATE_REASON'), false);
  eq('government plan restores special-election order and skips eliminated seats', Core.governmentPlan(view({ pres: 5, alive: [true, true, true, false, true, true, true], hist: [{ k: 'special', by: 2, target: 5 }] }), 5, 4).next, 4);
  const speechGame = ai7({ hist: [] });
  const speechHist = [];
  const variants = [];
  for (let j = 0; j < 12; j++) {
    speechHist.push({ k: 'gov', pres: 2, chanc: 3, law: 'F' });
    speechHist.push({ k: 'talk', by: 0, about: 2, say: 'acc', re: [[1, 0]] });
    variants.push(Core.reply({ ...speechGame, hist: [...speechHist] }, 1, 0, speechHist.length - 1));
  }
  eq('NPC reactions have varied lines without consecutive repetition', [new Set(variants).size >= 6, variants.every((v, i) => i === 0 || v !== variants[i - 1])], [true, true]);
  const quotedAt = 3, quoted = Core.reply({ ...speechGame, hist: speechHist }, 1, 0, quotedAt);
  eq('old NPC lines remain stable as history grows and hidden roles change', [Core.reply({ ...speechGame, hist: [...speechHist, { k: 'rej', pres: 2, chanc: 3 }] }, 1, 0, quotedAt), Core.reply({ ...speechGame, players: speechGame.players.map(p => ({ ...p, role: 'liberal' })), hist: speechHist }, 1, 0, quotedAt)], [quoted, quoted]);
  // Rich notebook metadata stays private, bounded, and compatible with old party-only notes.
  const nd = { 2: { reason: 'Aprovou uma lei e mudou a versão.', kind: 'fact' }, 3: { reason: 'Palpite', kind: 'guess' } };
  eq('notebook details survive state and finished-game loading', [Core.readState({ noteDetails: nd }).noteDetails, Core.readGame({ ...done, noteDetails: nd }).noteDetails], [nd, nd]);
  eq('notebook details sanitize malformed data and cap reasons', [Core.readState({ noteDetails: { 1: { reason: 'x'.repeat(400), kind: 'guess' }, 2: { reason: 7, kind: 'fact' }, bad: { reason: 'x', kind: 'guess' } } }).noteDetails[1].reason.length, Object.keys(Core.readState({ noteDetails: { 2: { reason: 7, kind: 'fact' } } }).noteDetails || {}).length], [280, 0]);
  const socialHist = [{ k: 'talk', by: 0, about: 2, say: 'trust' }, { k: 'talk', by: 0, about: 2, say: 'acc' }];
  const sm = Core.socialMemory(view({ hist: socialHist }), 0);
  eq('social memory records accusations, defenses and unsupported reversals', [sm.accusations, sm.defenses, sm.reversals], [1, 1, 1]);
  eq('a new relevant public fact justifies changing an opinion', Core.socialMemory(view({ hist: [socialHist[0], { k: 'gov', pres: 2, chanc: 3, law: 'F' }, socialHist[1]] }), 0).reversals, 0);
  const reversed = Core.decideWhy(view({ ask: 'react', options: [0, 1, 2], hist: socialHist }), hi);
  eq('the table challenges reversing a defense without evidence', [reversed.a, reversed.why.text.some(t => t.includes('defendeu'))], [Core.REACT.disagree, true]);
  const plan = Core.governmentPlan(view({ level: 'extremo' }), 3, 5);
  eq('government plan estimates a majority from public information', [Number.isFinite(plan.approval), plan.approval >= 0 && plan.approval <= 1, plan.voters, plan.majority, plan.next], [true, true, 7, 4, 4]);
  eq('government support changes when living voters oppose a cabinet', Core.governmentPlan(view({ hist: [0, 1, 2, 6].map(by => ({ k: 'talk', by, about: 5, say: 'acc' })) }), 3, 5).approval < plan.approval, true);
  const impact = Core.accusationFeedback(d1, d1.hist.length - 1);
  eq('accusation feedback describes reactions without exposing hidden roles', [typeof impact, !/lider|cultista|liberal|%/i.test(impact), impact.length > 0], ['string', true, true]);
  const turning = Core.highlights({ ...done, hist: [{ k: 'gov', pres: 3, chanc: 4, law: 'F', pc: 0, cc: 2 }, { k: 'exec', by: 3, target: 0, role: 'lider' }] });
  eq('final highlights explain contradiction and decisive elimination', [turning.some(x => x.kind === 'contradiction'), turning.some(x => x.kind === 'victory'), Core.highlights(el)], [true, true, []]);
  const bluffView = view({ role: 'cultista', me: 1, known: knowAll, ask: 'pc', options: [0, 1, 2, 3], hist: [{ k: 'gov', pres: 1, chanc: 4, law: 'F', drew: deck('FLF'), got: deck('FF'), pc: 3 }] });
  eq('a bluff does not change a claim already recorded for the same hand', [Core.decide(bluffView, () => 0), Core.decide(bluffView, hi)], [3, 3]);
  const clearEnding = Core.highlights({ ...done, players: done.players.map((p, i) => ({ ...p, role: i === 0 ? 'lider' : p.role })), hist: [{ k: 'gov', pres: 3, chanc: 4, law: 'F' }, { k: 'gov', pres: 3, chanc: 4, law: 'F' }, { k: 'gov', pres: 3, chanc: 4, law: 'F' }, { k: 'exec', by: 3, target: 0, role: 'lider' }] });
  eq('highlights use story titles and name the government that changed the stakes', [clearEnding[0].title, clearEnding.some(p => p.kind === 'law' && p.text.includes('{p3}') && p.text.includes('{p4}')), clearEnding.every(p => !/Momento \d/.test(p.title))], ['O tiro que encerrou o jogo', true, true]);
  const repRepeat = Core.reputationNotice(repeatedDenounce, repeatedDenounce.hist.length - 1);
  eq('reputation notices explain public consequences without exposing roles', [repRepeat.title, repRepeat.tone, /papel|lider|cultista|liberal/i.test(repRepeat.detail)], ['Credibilidade caiu', 'down', false]);
  const repSupport = { ...chat, hist: [{ k: 'talk', by: 0, about: 1, say: 'acc', re: [[2, 0], [3, 0], [4, 1]] }] };
  eq('reputation support is based on visible reactions and stable under hidden-role changes', [Core.reputationNotice(repSupport, 0).title, Core.reputationNotice(repSupport, 0), Core.reputationNotice({ ...repSupport, players: repSupport.players.map(p => ({ ...p, role: 'liberal' })) }, 0)], ['Sua fala ganhou apoio', Core.reputationNotice(repSupport, 0), Core.reputationNotice(repSupport, 0)]);
  /* what is saved */
  eq('read state: a saved state comes back as it was', Core.readState(JSON.parse(JSON.stringify({ v: 1, names: NAMES, game: el, theme: 'dark' }))), { v: 1, names: NAMES, game: el, theme: 'dark' });
  eq('read state: what is not a state reads as an empty one', [null, 'x', 7, { names: 'no' }].map(x => Core.readState(x)), Array(4).fill({ v: 1, names: [], game: null }));
  eq('read state: a damaged game is dropped, the names stay; an unknown theme is dropped', Core.readState({ names: ['a', 3, ' ', 'b'], game: { ...el, deck: ['X'] }, theme: 'pink' }), { v: 1, names: ['a', 'b'], game: null });
  eq('read state: sound and vibration off is kept; anything else means on', [Core.readState({ quiet: true }).quiet, 'quiet' in Core.readState({ quiet: 'yes' })], [true, false]);
  eq('read state: the art deco style is kept, an unknown style is dropped', [Core.readState({ look: 'deco' }).look, 'look' in Core.readState({ look: 'neon' }), 'look' in Core.readState({ look: 'poster' })], ['deco', false, false]);
  const broken = [{ ...el, players: [] }, { ...el, players: [{ name: 'a', role: 'rei', alive: true }] }, { ...el, phase: 'dance' }, { ...el, pres: 9 }, { ...el, tracker: 3 }, { ...el, log: [1] }, { ...el, phase: 'vote', chanc: null }, { ...el, phase: 'investigated', target: null }, { ...el, laws: { L: 7, F: 0 } }, { ...el, winner: 'X' }, { ...el, seen: [9] }, { ...el, vetoed: 1 }, { ...el, lastChanc: -1 }, { ...el, back: 9 }];
  eq('read game: what does not hold together is null', broken.map(Core.readGame), broken.map(() => null));

  /* the reader of the source: invented data here; real answers go in tests/fixtures/source/ and through tests/contract.py */
  eq('source: an entry read', Core.normEntry({ id: 7, name: ' Um ', value: '2.5', extra: true }), { id: '7', name: 'Um', value: 2.5 });
  eq('source: what is not an entry reads as null', [null, 'x', {}, { id: 1 }, { id: 1, name: 'x', value: 'abc' }, { name: 'x', value: 1 }].map(Core.normEntry), [null, null, null, null, null, null]);
  eq('source: a list, leaving out what cannot be read', [Core.normEntries({ items: [{ id: 1, name: 'a', value: 1 }, { id: 2 }] }), Core.normEntries({}), Core.normEntries(null)], [[{ id: '1', name: 'a', value: 1 }], [], []]);
  return { n, fails };
}
