/* The judge between the game and the players run by the app (D10). It is the only code that holds the whole game and
   asks them anything: for the seat whose turn it is, it builds what that seat may know (`viewOf`: its own role, its
   team if it knows it, the laws that passed through its hands, what it saw with its own powers, and what everyone saw
   and heard), asks one question with the answers allowed, and plays the answer through the rules. An answer outside
   what was offered is not played: the first allowed option is. So no player run by the app sees more than its seat or
   does more than its turn. It also takes the votes, one by one, where the app plays some of the seats, and what each
   player tells the table about its hand. */
import { backed, earlyGov, believe, claimRepeats, socialMemory, decideWhy, QUIET, REACT, temper } from './ai';
import { mad, canSteal, steal, itemOf, ITEMS } from './items';
import { maniaOf } from './horror';

import { attack, cultDice, RANK, roll, ROLL_NAME } from './dice';
import { WIN, seeded, answerVeto, askVeto, canNominate, canTarget, canVeto, chancellorDiscard, endPower, execute, CULTISTS, LEADER_KNOWS_UPTO, LEADER_ZONE, investigate, nominate, partyOf, presidentDiscard, revealNext, specialElect, vote } from './game';
import { words } from './words';
import type { Ask, Defense, Event, Game, Gov, Law, Level, Persona, Role, Seen, Talk, Trace, View } from './types';
import { debateNext, debateBot, debateVerdict, dirtyOf, sat, clashOf, sinceRound, blocOf } from './debate';

export const hasAi = (g: Game): boolean => g.players.some(p => p.ai);
const isAi = (g: Game, i: number): boolean => !!g.players[i]?.ai;
/** The people at the table still in the game (not run by the app). */
export const humansAlive = (g: Game): number[] => g.players.map((p, i) => (p.alive && !p.ai ? i : -1)).filter(i => i >= 0);
const seats = (g: Game, ok: (i: number) => boolean): number[] => g.players.map((_, i) => i).filter(ok);

/* ---------- what each seat tells the table ---------- */
const talkKinds: Ask[] = ['pc', 'cc', 'inv', 'peek'];
/** A new election closes what could still be said about the last one. */
const settled = (g: Game, i: number): boolean => g.hist.slice(i + 1).some(e => e.k === 'vote' || e.k === 'rej' || e.k === 'gov' || e.k === 'veto');
export function lastIndex(g: Game, kinds: Event['k'][]): number {
  for (let i = g.hist.length - 1; i >= 0; i--) if (kinds.includes(g.hist[i].k)) return i;
  return -1;
}
/** What this seat may still tell the table: what it drew as president ('pc'), got as chancellor ('cc'), saw in an
 *  investigation ('inv') or spying ('peek'). Each once, and only until the next election. */
export function claims(g: Game, seat: number): Ask[] {
  if (g.phase === 'over' || !g.players[seat]?.alive) return [];
  const out: Ask[] = [], i = lastIndex(g, ['gov', 'veto']), j = lastIndex(g, ['inv']), k = lastIndex(g, ['peek']);
  if (i >= 0 && !settled(g, i)) {
    const e = g.hist[i] as Gov;
    if (e.pres === seat && e.pc === undefined) out.push('pc');
    if (e.chanc === seat && e.cc === undefined) out.push('cc');
  }
  const inv = g.hist[j];
  if (inv && inv.k === 'inv' && inv.by === seat && inv.said === undefined && !settled(g, j) && g.phase !== 'investigated') out.push('inv');
  const pk = g.hist[k];
  if (pk && pk.k === 'peek' && pk.by === seat && pk.said === undefined && !settled(g, k)) out.push('peek');
  return out;
}
const MAX_SAY: Record<string, number> = { pc: 3, cc: 2, inv: 1, peek: 3 };
/** First letter down, to go on after a comma or a colon, unless the text starts with a name. */
export const lower = (g: Game, t: string): string => g.players.some(p => t.startsWith(p.name)) ? t : t.replace(/^./, c => c.toLowerCase());
const fN = (n: number, of: number, a: string, b: string): string => {
  const l = of - n, part = (x: number, w: string): string => `${x} ${x === 1 ? w : w.endsWith('l') ? `${w.slice(0, -1)}is` : `${w}s`}`;
  return n && l ? `${part(n, a)} e ${part(l, b)}` : n ? part(n, a) : part(l, b);
};
/** One seat tells the table what it saw (`v`: cultist laws, or for 'inv' 0 liberal / 1 cultist; -1 keeps quiet). */
export function say(g: Game, seat: number, what: Ask, v: number): Game {
  const out = say0(g, seat, what, v);
  return out === g || v < 0 || !cultDice(g) || what === 'peek' ? out : readLies(out, seat, what, v);
}
/** D96: in Secret Cultist, each app player listening rolls Psychology against the speaker's Persuasion: the better
 *  roll reads the claim right (a lie as a lie, the truth as the truth); an extreme reading is sure. Nothing at the
 *  table changes; only the reader knows. A person who lied and was read is told someone noticed. */
function readLies(g: Game, seat: number, what: Ask, v: number): Game {
  const i = lastIndex(g, what === 'inv' ? ['inv'] : ['gov', 'veto']), e = g.hist[i];
  let truth: number;
  if (e.k === 'inv') truth = partyOf(g.players[e.target].role) === 'F' ? 1 : 0;
  else if ((e.k === 'gov' || e.k === 'veto') && what === 'pc' && e.drew) truth = e.drew.filter(x => x === 'F').length;
  else if ((e.k === 'gov' || e.k === 'veto') && what === 'cc' && e.got) truth = e.got.filter(x => x === 'F').length;
  else return g;
  const lie: boolean = truth !== v, r = seeded(g.hist.length * 131 + seat * 7 + v);
  // D114: who tells what it investigated rolls Spot Hidden: a detail seen makes the story more believable (a bonus die)
  const spot = e.k === 'inv' ? roll(g, seat, 'Spot Hidden', r) : undefined, sp = roll(g, seat, 'Persuade', r, spot && RANK[spot.level] >= RANK.ok ? 1 : 0);
  // D114: a listener who hears the hesitation reads better (Listen, then Psychology with a bonus die)
  const ear = (j: number): 0 | 1 => { const l = roll(g, j, 'Listen', r); return l && RANK[l.level] >= RANK.ok ? 1 : 0; };
  if (!sp) return g;
  const reads: Event[] = [];
  for (const j of seats(g, j => j !== seat && g.players[j].alive && !!g.players[j].ai && readsBy(g, j) < READ_MAX)) {
    const ps = roll(g, j, 'Psychology', r, ear(j));
    if (ps && RANK[ps.level] > RANK[sp.level] && ps.level !== 'fail' && ps.level !== 'fumble') reads.push({ k: 'psy', by: j, about: seat, lie, sure: RANK[ps.level] >= RANK.extreme });
  }
  // D109: the one person at the table reads too, with the Psychology of their own sheet; what it shows is only theirs,
  // and the table sees just that a roll was made
  const people = g.players.map((p, j) => (p.ai ? -1 : j)).filter(j => j >= 0), me = people.length === 1 ? people[0] : -1;
  const mine: Event[] = [];
  if (me >= 0 && me !== seat && g.players[me].alive && readsBy(g, me) < READ_MAX) {
    const ps = roll(g, me, 'Psychology', r, ear(me));
    if (ps) {
      const read = RANK[ps.level] > RANK[sp.level] && ps.level !== 'fail' && ps.level !== 'fumble';
      mine.push({ k: 'psy', by: me, about: seat, roll: ps, vs: sp, read, ...(read ? { lie, sure: RANK[ps.level] >= RANK.extreme } : {}) });
    }
  }
  if (!reads.length && !mine.length) return g;
  const caught = lie && !g.players[seat].ai && reads.some(x => x.k === 'psy' && x.lie);
  return { ...g, hist: [...g.hist, ...reads, ...mine], log: caught ? [...g.log, `🎲 Alguém na mesa franziu a testa com o que você disse.`] : g.log };
}
/** D96: in Secret Cultist the eliminator rolls Intimidation: the shot never misses (the rule); the roll says whether
 *  its reason convinced the table. Said aloud, and every app player takes it into account. */
export function intimidate(g: Game): Game {
  const i = lastIndex(g, ['exec']), e = g.hist[i];
  if (!cultDice(g) || i < 0 || e.k !== 'exec' || e.intim) return g;
  const rr = seeded(g.hist.length * 977 + e.target), atk = attack(g, e.by, e.target, rr), r = roll(g, e.by, 'Intimidate', rr);
  if (!r) return g;
  const ok = RANK[r.level] >= RANK.ok, clean = !atk || RANK[atk.level] >= RANK.ok, who = g.players[e.by].name, tgt = g.players[e.target].name;
  // D114: how it was done, for the table to see (the target is gone either way)
  const how = atk ? `${atk.skill === 'Firearms Handgun' ? '🔫' : '👊'} ${who} ${atk.skill === 'Firearms Handgun' ? 'atirou em' : 'partiu para cima de'} ${tgt} (${atk.label} ${atk.d}/${atk.val}${atk.mod === 1 ? ', com vantagem' : atk.mod === -1 ? ', em desvantagem' : ''}): ${clean ? 'foi rápido e limpo.' : 'foi feio, e a mesa toda sentiu (mais sanidade perdida).'}` : '';
  return { ...g, hist: g.hist.map((x, j) => (j === i ? { ...e, intim: r.level, ...(atk ? { atk } : {}) } : x)), log: [...g.log, ...(how ? [how] : []), `🎲 ${g.players[e.by].name} rolou Intimidação (${r.d}/${r.val}): ${ROLL_NAME[r.level]}. ${ok ? 'A mesa engoliu a justificativa.' : 'Pegou mal na mesa.'}`] };
}
/** D114: the person's Occult when a chancellor in the danger zone is up for a vote: a success tells the truth about
 *  the high priest (it is or it is not), a failure tells nothing. Once a nomination, only theirs. */
/** D133: how often the senses work: the Occult sense a few times a game, and each seat reads a few lies a game. */
export const SENSE_MAX = 2, READ_MAX = 3;
const readsBy = (g: Game, j: number): number => g.hist.filter(e => e.k === 'psy' && e.by === j && (e.read || (e.roll === undefined && e.lie !== undefined))).length;
export function sense(g: Game): Game {
  if (!cultDice(g) || g.phase !== 'vote' || g.chanc === null || g.laws.F < LEADER_ZONE) return g;
  const people = g.players.map((p, j) => (p.ai ? -1 : j)).filter(j => j >= 0), me = people.length === 1 ? people[0] : -1;
  if (me < 0 || me === g.chanc || !g.players[me].alive || g.players[me].role !== 'liberal') return g;
  if (g.hist.filter(e => e.k === 'sense' && e.by === me).length >= SENSE_MAX) return g;   // D133: a few times a game, not at every election
  const at = lastIndex(g, ['gov', 'veto', 'rej', 'chaos']);
  if (g.hist.some((e, k) => k > at && e.k === 'sense' && e.about === g.chanc)) return g;
  const r = roll(g, me, 'Occult', seeded(g.hist.length * 613 + g.chanc), 0, true);   // D133: a hard test
  if (!r) return g;
  const ok = RANK[r.level] >= RANK.ok;
  return { ...g, hist: [...g.hist, { k: 'sense', by: me, about: g.chanc, roll: r, ...(ok ? { boss: g.players[g.chanc].role === 'lider' } : {}) }] };
}
function say0(g: Game, seat: number, what: Ask, v: number): Game {
  if (!claims(g, seat).includes(what) || !(Number.isInteger(v) && v >= -1 && v <= MAX_SAY[what])) return g;
  const who = g.players[seat].name, quiet = v < 0;
  const set = (i: number, patch: object, line: string): Game => ({ ...g, hist: g.hist.map((e, j) => (j === i ? ({ ...e, ...patch } as Event) : e)), log: [...g.log, line] });
  if (what === 'pc' || what === 'cc') {
    const i = lastIndex(g, ['gov', 'veto']);
    const line = quiet ? `${who} não disse o que ${what === 'pc' ? 'tirou' : 'recebeu'}.`
      : what === 'pc' ? `${who} (presidente) disse que tirou ${fN(v, 3, words(g.pack).f, 'liberal')}.` : `${who} (chanceler) disse que recebeu ${fN(v, 2, words(g.pack).f, 'liberal')}.`;
    return set(i, what === 'pc' ? { pc: v } : { cc: v }, line);
  }
  if (what === 'inv') {
    const i = lastIndex(g, ['inv']), e = g.hist[i] as Extract<Event, { k: 'inv' }>;
    const told = set(i, { said: quiet ? '-' : v ? 'F' : 'L' }, quiet ? `${who} não disse o que viu na investigação.` : `${who} disse que ${g.players[e.target].name} é ${v ? words(g.pack).f : 'liberal'}.`);
    // D66: a person who calls someone the hidden side may be doubted: a liberal app player that is fairly sure the
    // one named is clean says so, which is an accusation against the person (and opens the debate)
    if (quiet || !v || g.players[seat].ai) return told;
    const doubter = g.players.map((_, j) => j).find(j => j !== seat && j !== e.target && g.players[j].ai && g.players[j].alive && partyOf(g.players[j].role) === 'L' && believe(viewOf(told, j, 'vote', [1, 0]), true).pF[e.target] < 0.2);
    if (doubter === undefined) return told;
    return { ...told, hist: [...told.hist, { k: 'talk', by: doubter, about: seat, say: 'acc', tone: 'soft' }], log: [...told.log, `${g.players[doubter].name}: "Duvido. ${g.players[e.target].name} parece limpo para mim. ${who}, essa investigação está mal contada."`] };
  }
  const i = lastIndex(g, ['peek']);
  return set(i, { said: v }, quiet ? `${who} não disse o que espiou.` : `${who} disse que as próximas 3 leis são ${fN(v, 3, words(g.pack).f, 'liberal')}.`);
}

/* ---------- what the players run by the app say between rounds (D13) ---------- */
/** How many of them speak each round, at most. */
export const TALKS = 2;
/** What ends a round of talk: anything that happened at the table that is not talk. */
const roundMark = (g: Game): number => lastIndex(g, ['vote', 'rej', 'gov', 'veto', 'chaos', 'inv', 'peek', 'special', 'exec']);
/** Who speaks next, if anyone: once something happened, at the start of a round (before the president nominates),
 *  up to TALKS players run by the app, each once, in an order that turns with the rounds. */
export function talker(g: Game): number | null {
  const campaigning = g.phase === 'vote';
  if ((!campaigning && g.phase !== 'nominate') || (!campaigning && !g.hist.some(e => e.k === 'gov' || e.k === 'rej' || e.k === 'chaos' || e.k === 'veto'))) return null;
  // what a person said (D26) does not take the turn of an app player
  const mark = roundMark(g), said = g.hist.slice(mark + 1).filter((e): e is Talk => e.k === 'talk' && isAi(g, e.by) && (campaigning ? e.stage === 'campaign' : e.stage !== 'campaign'));
  if (said.length >= TALKS) return null;
  const n = g.players.length, start = (g.hist.filter(e => e.k === 'vote' || e.k === 'rej').length * 3) % n;
  for (let j = 0; j < n; j++) {
    const i = (start + j) % n;
    if (isAi(g, i) && g.players[i].alive && !said.some(t => t.by === i)) return i;
  }
  return null;
}
/** The options of a player who may speak: suspect or trust any other seat still in the game, or keep quiet. */
const talkOptions = (g: Game, me: number): number[] => [...g.players.flatMap((p, i) => (p.alive && i !== me ? [2 * i, 2 * i + 1] : [])), QUIET];
/** Plays what it said: a line in the log, and the talk in the history. */
/** D115: now and then an app player, at its turn to talk, tries to steal a weapon it does not have (once a game). */
export function talk(g: Game, by: number, a: number): Game {
  // D120: a catatonic seat says nothing
  const n = talk0(g, by, mad(g, by) && maniaOf(g, by) === 'catatonia' && talkOptions(g, by).includes(QUIET) ? QUIET : a);
  if (n === g || !isAi(g, by)) return n;
  const r = seeded(g.hist.length * 271 + by);
  if (r() > 0.2) return n;
  const mine = itemOf(n, by), want = n.players.map((_, j) => j).filter(j => canSteal(n, by, j) && !!ITEMS[itemOf(n, j) as keyof typeof ITEMS]?.weapon && !(mine && ITEMS[mine].weapon));
  return want.length ? steal(n, by, want[Math.floor(r() * want.length)], r) : n;
}
/** D145: an app player who says the opposite of what it said before about the same player owns it, from what the
 *  whole table saw since: a decree of the hidden side with that player in the government, or a liberal one. Nothing
 *  of its private reckoning goes into the words. */
export function mindChange(g: Game, by: number, about: number, kind: Talk['say']): string {
  if (kind === 'quiet' || about < 0) return '';
  let k = g.hist.length - 1;
  for (; k >= 0; k--) { const e = g.hist[k]; if (e.k === 'talk' && e.by === by && e.about === about && e.say !== 'quiet') break; }
  const prev = k >= 0 ? (g.hist[k] as Talk) : undefined;
  if (!prev || prev.say === kind) return '';
  const w = words(g.pack, g.region), who = g.players[about].name;
  const gov = g.hist.slice(k + 1).filter(e => e.k === 'gov' && (e.pres === about || e.chanc === about)).pop() as Gov | undefined;
  if (kind === 'acc') return gov && gov.law === 'F' ? `Eu defendi ${who}, e errei: depois daquela lei ${w.f} com ${who} no governo, não dá mais.` : `Eu defendi ${who} antes. Olhei de novo o que aconteceu, e não fecha mais.`;
  return gov && gov.law === 'L' ? `Retiro o que disse de ${who}: com ${who} no governo saiu lei liberal. Posso ter me enganado.` : `Retiro o que disse de ${who}. Não tenho mais certeza.`;
}
function talk0(g: Game, by: number, a: number): Game {
  if (talker(g) !== by || !talkOptions(g, by).includes(a)) return g;
  const quiet = a === QUIET, about = quiet ? -1 : a >> 1, kind: Talk['say'] = quiet ? 'quiet' : a % 2 ? 'trust' : 'acc';
  // the app players take the court too (D40): an accusation with a proof that holds is made as one; a cultist who has
  // only a weak hint against a liberal may wave it as a proof all the same (a bluff that costs it if the table looks)
  // D60: a proof from the first governments says nothing yet: an app player does not wave one; and it does not repeat
  // an accusation someone already made this round with the same proof: it backs it in a word instead
  const ev = kind === 'acc' ? evidence(g, about).filter(x => !proofEarly(g, x)) : [];
  const since = lastIndex(g, ['vote', 'rej', 'gov', 'veto', 'chaos', 'inv', 'peek', 'special', 'exec']);
  const made = kind === 'acc' ? g.hist.slice(since + 1).find(e => e.k === 'talk' && e.say === 'acc' && e.about === about && e.by !== by) as Talk | undefined : undefined;
  // D77: one reason backs one accusation: a proof already used against this player (by anyone) is spent
  const spent = usedProofs(g, about), fresh = ev.filter(x => !spent.has(x.at) && (!made || x.at !== made.proof)), strong = fresh.find(x => x.hit), weak = fresh[0];
  const bluff = !strong && !!weak && g.players[by].role !== 'liberal' && g.players[about].role === 'liberal';
  const court = strong ? { tone: 'proof' as const, proof: strong.at, hit: true } : bluff ? { tone: 'proof' as const, proof: weak.at } : {};
  // D87: nothing to go on yet (fewer than two governments passed a law): an app player does not accuse without a proof
  // that holds; the table found the first-round accusations artificial
  const early = g.hist.filter(e => e.k === 'gov' || e.k === 'chaos').length < 2;
  if (kind === 'acc' && !strong && early) return { ...g, hist: [...g.hist, { k: 'talk', by, about: -1, say: 'quiet', ...(g.phase === 'vote' ? { stage: 'campaign' as const } : {}) }] };
  // D77: without a new reason, an app player does not accuse someone already accused: it keeps quiet instead
  if (kind === 'acc' && !strong && !bluff && g.hist.some(e => e.k === 'talk' && e.say === 'acc' && e.about === about)) return { ...g, hist: [...g.hist, { k: 'talk', by, about: -1, say: 'quiet', ...(g.phase === 'vote' ? { stage: 'campaign' as const } : {}) }] };
  const echo = quiet ? '' : mindChange(g, by, about, kind);   // D145: an app player who changes its mind says so
  const line = quiet ? [] : [`${g.players[by].name}: "${strong || bluff ? `${(strong || weak).text}. ${g.players[about].name}, explica isso.` : echo || npcStatement(g, by, about, kind === 'trust')}"`];
  const said_: Game = { ...g, log: [...g.log, ...line], hist: [...g.hist, { k: 'talk', by, about, say: kind, ...(g.phase === 'vote' ? { stage: 'campaign' as const } : {}), ...court }] };
  // D88: between two app players with a proof, the table settles it on the spot: the debate runs in the background and
  // only the verdict is said (it used to stay open for ever)
  if (kind !== 'acc' || !(strong || bluff) || !isAi(g, by) || !isAi(g, about)) return said_;
  const at = said_.hist.length - 1, r = seeded(g.hist.length * 7919 + by * 31 + about);
  let d = said_;
  for (let k = 0; k < 3 && debateNext(d, at) >= 0; k++) d = debateBot(d, at, r);
  d = debateVerdict(d, at, r);
  const v = (d.hist[at] as Talk).verdict;
  if (!v) return said_;
  const yes = v.filter(x => x[1] === 1).length, no = v.filter(x => x[1] === 0).length;
  return { ...d, log: [...said_.log, `A mesa ${yes > no ? `comprou a acusação de ${g.players[by].name}` : `não comprou a acusação de ${g.players[by].name}`} (${yes} a ${no}).`] };
}
/** D77: the proofs already used in an accusation against `about`, by anyone: each reason backs one accusation only. */
export function usedProofs(g: Game, about: number): Set<number> {
  return new Set(g.hist.flatMap(e => (e.k === 'talk' && e.say === 'acc' && e.about === about && e.proof !== undefined ? [e.proof, ...(e.proofs || [])] : [])));
}
/** The accusation against `me` still waiting for an answer this round (D40), if any: its index in the history. */
export function pendingAccusation(g: Game, me: number): number {
  const mark = lastIndex(g, ['vote', 'rej', 'gov', 'veto', 'chaos', 'inv', 'peek', 'special', 'exec']);
  for (let i = g.hist.length - 1; i > mark; i--) { const e = g.hist[i]; if (e.k === 'talk' && e.about === me && e.say === 'acc' && e.by !== me && !e.def) return i; }
  return -1;
}
/** The accused answers (D40). Whether the answer holds is worked out from the record the whole table saw: "the deck
 *  came like that" holds when the government passed a law of the hidden side and the stories add up; "it was a test"
 *  holds when, as president, one said 1 of each and a liberal law came out; "they lie" holds when the accusation had no
 *  proof that holds; silence never does. A defence that holds takes the weight off the accusation for the app players. */
export function defend(g: Game, me: number, kind: Defense): Game {
  const at = pendingAccusation(g, me);
  if (at < 0) return g;
  const t = g.hist[at] as Talk, gov = t.proof !== undefined ? g.hist[t.proof] : undefined;
  const isGov = !!gov && (gov.k === 'gov' || gov.k === 'veto');
  const clash = isGov && gov.pc !== undefined && gov.cc !== undefined && gov.pc >= 0 && gov.cc >= 0 && Math.max(0, gov.pc - 1) !== gov.cc && !(gov.pc === 1 && gov.cc === 1);
  const ok = kind === 'deck' ? isGov && !clash && gov.k === 'gov' && gov.law === 'F'
    : kind === 'test' ? isGov && gov.pres === me && gov.pc === 1 && gov.k === 'gov' && gov.law === 'L'
    : kind === 'lie' ? !t.hit : false;
  const words_: Record<Defense, string> = { deck: 'O baralho veio assim, não tive escolha.', test: 'Foi teste do chanceler, e eu contei.', lie: `${g.players[t.by].name} está mentindo.`, quiet: '…', debate: '' };
  const hist = [...g.hist]; hist[at] = { ...t, def: kind, ok };
  return { ...g, hist, log: [...g.log, `${g.players[me].name}: "${words_[kind]}"`, ...(ok ? [] : kind === 'quiet' ? [] : ['A mesa não comprou a defesa.'])] };
}

/** D90: each personality has its own way of opening a line, now and then, so they read apart in the log. */
const TIC: Record<Persona, string[]> = { certinho: ['', 'Com todo respeito: '], desconfiado: ['Hmm. ', '', 'Sei não… '], cetico: ['', 'Prova? Então: '], critico: ['Pela ata: ', ''], centrado: ['', ''], blefador: ['Confia em mim: ', 'Pode escrever: ', ''], caotico: ['Sei lá, ', 'Vai na fé: ', 'Olha só: '] };
function npcStatement(g: Game, by: number, about: number, trust: boolean): string {
  const t = TIC[g.players[by].persona || 'centrado'], tic = t[(by * 5 + g.hist.length) % t.length], line = npcLine(g, by, about, trust);
  return tic ? tic + lower(g, line) : line;
}
/** NPC statements use a public target and recorded context, never a private party or hand. */
function npcLine(g: Game, by: number, about: number, trust: boolean): string {
  const n = g.players[about].name, prior = g.hist.filter(e => e.k === 'talk' && e.by === by && e.say !== 'quiet');
  if (g.phase === 'vote') return speech(trust ? [`Eu daria uma chance a ${n} nesse governo. Quem vem comigo?`, `Antes de rejeitar, considerem ${n}. Esse governo pode ajudar a mesa.`, `Estou com ${n} nessa.`, `${n} até aqui jogou limpo. Vou de ${words(g.pack, g.region).ja}`, `Melhor ${n} do que arriscar outra rodada.`, ...((g.hist.filter(e => e.k === 'gov' && e.law === 'L' && (e.pres === about || e.chanc === about)).length) ? [`${n} já aprovou lei liberal. Tá valendo.`] : [])] : [`Não aprovem só por pressa. Ainda desconfio de ${n} nesse governo.`, `Quero que ${n} explique melhor antes de ganhar nosso voto.`, `Com ${n} aí eu não voto.`, `${n} no governo? Passo.`, `Tem coisa mal contada com ${n}.`], g, by, g.hist.length, 'talk');
  const vote = [...g.hist].reverse().find(e => e.k === 'vote');
  if (vote?.k === 'vote' && !trust && vote.ja.includes(about) && ![vote.pres, vote.chanc].includes(about)) return speech([`${n} apoiou aquele governo. Quero ouvir o motivo desse voto.`, `Guardei o voto de ${n} a favor. Isso ainda precisa de explicação.`, `Não é prova de papel, mas o voto de ${n} me chamou atenção.`], g, by, g.hist.length, 'talk');
  if (!prior.length) return `${trust ? 'Confio em' : 'Desconfio de'} ${n}.`;
  const tone: Record<Persona, [string, string]> = {
    certinho: [`Quero entender melhor as escolhas de ${n}.`, `Por enquanto, a leitura de ${n} me parece razoável.`],
    desconfiado: [`Estou de olho em ${n}. Essa história ainda não me convenceu.`, `De todos aqui, ${n} me deixa menos desconfiado por enquanto.`],
    cetico: [`Não compro a versão de ${n} tão fácil.`, `Ainda não vi motivo suficiente para ir contra ${n}.`],
    critico: [`Vamos cobrar de ${n} uma explicação para as escolhas.`, `Quero comparar as próximas jogadas com o que ${n} está dizendo.`],
    centrado: [`Minha maior dúvida agora é sobre ${n}.`, `Hoje eu daria um voto de confiança a ${n}.`],
    blefador: [`Estou falando: prestem atenção em ${n}!`, `Eu ficaria do lado de ${n} nessa discussão.`],
    caotico: [`Meu radar apitou em ${n} de novo!`, `Minha aposta da rodada é confiar em ${n}.`]
  };
  const options = [tone[persona(g, by)][trust ? 1 : 0], trust ? `${n} ainda me parece uma escolha melhor. Vou conferir as próximas decisões.` : `Quero ouvir ${n} antes de deixar essa suspeita de lado.`, trust ? `Não vou acusar ${n} sem algo mais concreto.` : `Não consigo tirar ${n} da minha lista de suspeitos.`];
  const relevant = [...g.hist].reverse().find(e => e.k === 'gov' && (e.pres === about || e.chanc === about));
  if (relevant?.k === 'gov' && relevant.law === (trust ? 'L' : 'F')) options.push(trust ? `${n} participou de um governo que aprovou liberal. Isso conta a favor, mas não prova o papel.` : `${n} estava naquele governo que aprovou lei do lado escondido. Quero uma explicação, não uma condenação automática.`);
  return speech(options, g, by, g.hist.length, 'talk');
}

/** What a person may tell the table now (D26), from the notebook: whether `by` may say this about `about`. A person
 *  still in the game, about someone else still in it, once a round for each one. */
export function canDenounce(g: Game, by: number, about: number): boolean {
  const p = g.players[by], q = g.players[about];
  if (!p || !q || p.ai || !p.alive || !q.alive || by === about || g.phase === 'over' || g.phase === 'reveal') return false;
  return !g.hist.slice(roundMark(g) + 1).some(e => e.k === 'talk' && e.by === by && e.about === about);
}
/** A person tells the table whom they suspect or trust (D26): a line in the log and a talk in the history, which the
 *  app players weigh like any other talk. Each app player still in the game, but the one talked about, says how it
 *  takes it (agrees, is unsure, disagrees), by its side, what it believes and its personality; the one talked about,
 *  if accused, denies it. The reactions go with the talk and in the log; they are words, nobody weighs them. */
export function denounce(g: Game, by: number, about: number, trust: boolean, rand: () => number, as?: Talk): Game {
  if (!canDenounce(g, by, about)) return g;
  const said: Talk = as ?? { k: 'talk', by, about, say: trust ? 'trust' : 'acc' };
  // a claim (D30): what the person says someone is, true or a bluff
  const line = `${g.players[by].name}: "${g.players[about].name} é ${trust ? 'liberal' : words(g.pack).f}."`;
  const heard: Game = { ...g, hist: [...g.hist, said] }, ts: Trace[] = [], re: [number, number][] = [];
  for (let i = 0; i < g.players.length; i++) {
    if (!isAi(g, i) || !g.players[i].alive || i === about) continue;
    const r = ask(heard, i, 'react', [REACT.agree, REACT.unsure, REACT.disagree], rand);
    ts.push(r.t); re.push([i, r.a]);
  }
  const at = g.hist.length, lines = [line, ...re.map(([i, a]) => `${g.players[i].name}: "${reply(heard, i, a, at)}"`), ...(isAi(g, about) ? [`${g.players[about].name}: "${answer(g, about, !trust, at)}"`] : [])];
  return { ...traced(g, ts), log: [...g.log, ...lines], hist: [...g.hist, { ...said, ...(re.length ? { re } : {}) }] };
}

/** What the record holds against a seat (D39), for an accusation with a proof: only what the whole table saw. A
 *  government it sat in whose story did not add up, or that passed a law of the hidden side, holds ("hit"); a Ja!
 *  vote for such a government is a weaker hint and does not hold by itself. Newest first. */
export interface Proof { at: number; kind: 'clash' | 'law' | 'vote' | 'inv' | 'exec' | 'count'; hit: boolean; title: string; text: string; pc?: number; cc?: number; law?: Law }
/** D60: whether a proof comes from the first governments (or the first law of the hidden side), when nobody knows anything yet. */
export function proofEarly(g: Game, x: Proof): boolean {
  if (x.at >= 100000 || x.kind === 'clash') return false;   // a story that does not add up holds at any time (D52)
  return earlyGov(g.hist as Seen[], x.kind === 'vote' ? x.at + 1 : x.at);
}
/** D80: the president who handed `chanc` a liberal and the chancellor passed the hidden side's law: what it passed, in words. */
export function handedText(g: Game, e: Event): string {
  if (e.k !== 'gov' || !e.got) return '';
  const W = words(g.pack), f = e.got.filter(x => x === 'F').length, l = e.got.length - f;
  return `Eu te passei ${[f ? `${f} ${f === 1 ? W.f : W.fs}` : '', l ? `${l} liberal${l > 1 ? 'is' : ''}` : ''].filter(Boolean).join(' e ')}${e.cc === 2 ? ' e você diz que recebeu 2' : ''}: quem escolheu a lei ${W.f} foi você`;
}
export const handedBy = (e: Event, by: number | undefined, about: number): boolean => by !== undefined && e.k === 'gov' && e.law === 'F' && e.pres === by && e.chanc === about && !!e.got && e.got.length === 2 && e.got.includes('L');
export function evidence(g: Game, about: number, by?: number): Proof[] {
  const out: Proof[] = [], f = words(g.pack).f, nm = (i: number): string => g.players[i]?.name ?? '?';
  let n = 0;
  g.hist.forEach((e, at) => {
    if (e.k === 'gov' || e.k === 'chaos') n++;
    if ((e.k === 'gov' || e.k === 'veto') && (e.pres === about || e.chanc === about)) {
      const pres = e.pres === about, clash = e.pc !== undefined && e.cc !== undefined && e.pc >= 0 && e.cc >= 0 && Math.max(0, e.pc - 1) !== e.cc && !(e.pc === 1 && e.cc === 1);
      const lawF = e.k === 'gov' && e.law === 'F', said = pres ? e.pc : e.cc;
      if (handedBy(e, by, about)) out.push({ at, kind: 'clash', hit: true, title: `${n}º governo · você presidente`, text: handedText(g, e), cc: e.cc, law: 'F' });
      else if (clash) out.push({ at, kind: 'clash', hit: true, title: `${n}º governo · ${pres ? 'presidente' : 'chanceler'}`, text: pres ? `Disse que tirou ${said} ${f}${said === 1 ? '' : 's'}, e o chanceler disse outra coisa` : `Disse que recebeu ${said} ${f}${said === 1 ? '' : 's'}, e não bate com o presidente`, pc: e.pc, cc: e.cc, law: e.k === 'gov' ? e.law : undefined });
      // D75: who said it had no choice (3 drawn, 2 got), with the stories adding up, is no proof
      // D83: a government where it had no choice, and the stories add up, is not offered as a proof at all
      else if (lawF && !(pres ? said === 3 : said === 2)) out.push({ at, kind: 'law', hit: !earlyGov(g.hist as Seen[], at), title: `${n}º governo · ${pres ? 'presidente' : 'chanceler'}`, text: `Governou com ${nm(pres ? e.chanc : e.pres)} e saiu lei ${f}${earlyGov(g.hist as Seen[], at) ? ' (no começo do jogo: prova fraca)' : ''}`, pc: e.pc, cc: e.cc, law: 'F' });
    }
    if (e.k === 'vote' && e.ja.includes(about) && e.pres !== about && e.chanc !== about) {
      const next = g.hist[at + 1];
      if (next && next.k === 'gov' && next.law === 'F') out.push({ at, kind: 'vote', hit: false, title: `Votação · ${n + 1}º governo`, text: `Votou ${words(g.pack, g.region).ja} em ${nm(e.pres)} + ${nm(e.chanc)}, e saiu lei ${f}` });
    }
    // D54: what an investigation was said to show, and who someone eliminated. Both are words or choices the table saw,
    // not facts: the investigator may lie, the one who eliminated may have guessed. They back an accusation, weakly.
    // D82: a "liberal" from an investigator who sat in governments that passed laws of the hidden side, or with it
    if (e.k === 'inv' && e.target === about && e.said === 'L' && e.by !== by) { const d = dirtyOf(g, e.by, at), both = sat(g, e.by, about, at); if (d || both) out.push({ at, kind: 'inv', hit: d >= 2 || both, title: `Investigação · ${nm(e.by)}`, text: `${nm(e.by)} disse que é liberal, mas esteve em ${d} governo${d === 1 ? ' que aprovou' : 's que aprovaram'} lei ${f}${both ? `, um deles com ele` : ''}` }); }
    if (e.k === 'inv' && e.target === about && e.said === 'F') out.push({ at, kind: 'inv', hit: false, title: `Investigação · ${nm(e.by)}`, text: `${nm(e.by)} investigou e disse que é ${f}` });
    if (e.k === 'exec' && e.by === about) out.push({ at, kind: 'exec', hit: false, title: `Eliminação · ${n}º governo`, text: `Eliminou ${nm(e.target)}, que não era o ${words(g.pack).boss}` });
  });
  // D54: how many laws of the hidden side came out of the governments it sat in; two or more hold
  // D76: a government where it had no choice (2 got as chancellor, 3 drawn as president, the stories adding up) does
  // not count against it
  const noChoice = (e: Event): boolean => e.k === 'gov' && !clashOf(e) && (e.chanc === about ? e.cc === 2 : e.pc === 3);
  const govF = g.hist.map((e, i) => (e.k === 'gov' && e.law === 'F' && (e.pres === about || e.chanc === about) && !noChoice(e) ? i : -1)).filter(i => i >= 0);
  if (govF.length >= 2) out.push({ at: 100000 + govF[govF.length - 1], kind: 'count', hit: true, title: 'Na conta', text: `Esteve em ${govF.length} governos que aprovaram lei ${f}` });
  out.sort((a, b) => (a.at % 100000) - (b.at % 100000) || a.at - b.at);
  return out.reverse();
}
/** D81: how close the table is to the danger zone (0 to 1): the nearer the 3rd law of the hidden side, the sharper an
 *  accusation; from it on, a chancellor of the hidden side may be its leader and end the game. */
export function sharpness(g: Game): number { return Math.min(1, (g.laws.F || 0) / LEADER_ZONE); }
/** D81: the strength of a combo of proofs: each adds what the others left (a proof that holds .45, a hint .2), and the
 *  table's danger sharpens it, up to half again. */
export function comboPower(ps: Proof[], sharp: number): number {
  return Math.min(0.9, stack(ps.map(x => (x.hit ? 0.45 : 0.2))) * (1 + 0.5 * sharp));
}
/** D83: several arguments together: the strongest counts whole, each other a quarter; never above .9. Many weak hints
 *  do not add up to a strong case, and piling every answer on does not make an unbeatable defence. */
export function stack(ps: number[]): number {
  if (!ps.length) return 0;
  const top = Math.max(...ps);
  return Math.min(0.9, top + 0.25 * (ps.reduce((a, x) => a + x, 0) - top));
}
/** D81: the accusation that throws everything at once, said aloud: the proofs and what the table's danger makes of them. */
export function comboText(g: Game, ps: Proof[]): string {
  const W = words(g.pack), f = g.laws.F || 0, s = sharpness(g);
  const tail = s >= 1 ? `Já são ${f} leis ${W.fs}: se ele for chanceler e for o ${W.boss}, acabou. Ninguém vota nele.`
    : f === LEADER_ZONE - 1 ? `Falta uma lei ${W.f} para o ${W.boss} poder ganhar como chanceler. Ninguém vota nele.`
    : f ? `Já saíram ${f === 1 ? `uma lei ${W.f}` : `${f} leis ${W.fs}`}. Não dá para confiar nele.` : 'Fiquem de olho nele.';
  return `${ps.map(x => x.text).join('; ')}. ${tail}`;
}
/** An accusation with a tone and maybe a proof (D39): the claim is made as usual, and it carries how firmly it was made
 *  and whether the proof holds; the accused, when the proof holds, stammers. */
export function accuse(g: Game, by: number, about: number, tone: 'soft' | 'firm' | 'proof', proof: number | number[] | null, rand: () => number): Game {
  // D77: a spent reason is no proof; D81: several proofs at once make a combo, the strongest one leading
  const spent = usedProofs(g, about), asked = proof === null ? [] : Array.isArray(proof) ? proof : [proof];
  const ps = evidence(g, about, by).filter(x => asked.includes(x.at) && !spent.has(x.at)).sort((a, b) => Number(b.hit) - Number(a.hit));
  const p = ps[0], hit = tone === 'proof' && ps.some(x => x.hit), combo = tone === 'proof' && ps.length > 1;
  const tagged = (x: Game): Game => {
    const i = x.hist.length - 1, e = x.hist[i];
    if (!e || e.k !== 'talk') return x;
    const hist = [...x.hist]; hist[i] = { ...e, tone, ...(p ? { proof: p.at } : {}), ...(hit ? { hit: true } : {}), ...(combo ? { proofs: ps.map(x => x.at), sharp: sharpness(g) } : {}) };
    return { ...x, hist };
  };
  const pre = tagged({ ...g, hist: [...g.hist, { k: 'talk', by, about, say: 'acc' }] });
  const t = pre.hist[pre.hist.length - 1] as Talk;
  // the reactions are asked with the tone and proof already known to the table
  const next = denounce({ ...g, hist: g.hist }, by, about, false, rand, t);
  if (next === g) return g;
  const out = tagged(next);
  if (hit && isAi(g, about)) { const log = [...out.log]; log[log.length - 1] = `${g.players[about].name}: "${STAMMER[(about * 7 + g.hist.length) % STAMMER.length]}"`; return { ...out, log }; }
  return out;
}
const STAMMER = ['Eu… devo ter contado errado. Não, espera—', 'Isso… isso foi um mal-entendido!', 'Tá, mas… o baralho, sabe como é…', 'Eu ia explicar isso… depois.'];

/** Explain only visible reactions: this feedback never uses actual roles or secret investigations. */
export function accusationFeedback(g: Game, at: number): string {
  const e = g.hist[at];
  if (!e || e.k !== 'talk' || e.say === 'quiet') return '';
  const v = viewOf({ ...g, hist: g.hist.slice(0, at + 1) }, e.by, 'react', [0, 1, 2]);
  const prior = socialMemory({ ...v, hist: v.hist.slice(0, -1) }, e.by), now = socialMemory(v, e.by);
  if (now.reversals > prior.reversals || e.say === 'acc' && claimRepeats(v.hist, at) > 1 && !backed(v.hist, 0, at, e.about, true)) return 'A insistência sem fatos novos prejudicou sua credibilidade.';
  const agree = (e.re || []).filter(([, a]) => a === REACT.agree).length, disagree = (e.re || []).filter(([, a]) => a === REACT.disagree).length;
  return agree > disagree ? 'Sua fala convenceu mais gente do que recebeu oposição.' : disagree > agree ? 'Sua fala recebeu mais oposição do que apoio.' : 'A mesa ainda não se convenceu: as reações ficaram divididas.';
}

/** A short, public reputation notice. No universal score and no access to actual hidden roles. */
export function reputationNotice(g: Game, at: number): { title: string; detail: string; tone: 'up' | 'down' | 'neutral' } | null {
  const e = g.hist[at];
  if (!e || e.k !== 'talk' || e.say === 'quiet' || !e.re?.length) return null;
  const detail = accusationFeedback(g, at);
  if (detail.startsWith('A insistência')) return { title: 'Credibilidade caiu', detail, tone: 'down' };
  const yes = e.re.filter(([, a]) => a === REACT.agree).length, no = e.re.filter(([, a]) => a === REACT.disagree).length;
  return yes > no ? { title: 'Sua fala ganhou apoio', detail, tone: 'up' }
    : no > yes ? { title: 'Sua fala encontrou resistência', detail, tone: 'down' }
    : { title: 'A mesa está dividida', detail, tone: 'neutral' };
}

/** End-only turning points, supported by recorded events rather than invented counterfactuals. */
export function highlights(g: Game): { at: number; kind: string; weight: number; title: string; text: string }[] {
  if (g.phase !== 'over') return [];
  const out: { at: number; kind: string; weight: number; title: string; text: string }[] = [];
  const laws = { L: 0, F: 0 };
  const count = (n: number): string => n === 0 ? 'nenhuma lei {f}' : n === 1 ? 'uma lei {f}' : `${n} leis {fs}`;
  g.hist.forEach((e, at) => {
    if ((e.k === 'gov' || e.k === 'veto') && e.pc !== undefined && e.cc !== undefined && e.pc >= 0 && e.cc >= 0 && (e.cc > e.pc || e.cc < e.pc - 1)) {
      out.push({ at, kind: 'contradiction', weight: 3, title: 'Duas versões para a mesma mão', text: `{p${e.pres}} disse que comprou ${count(e.pc)}, mas {p${e.chanc}} afirmou ter recebido ${count(e.cc)}. As duas versões não cabem na mesma compra.` });
    }
    if ((e.k === 'gov' || e.k === 'chaos') && e.law) {
      laws[e.law]++;
      const won = laws[e.law] === WIN[e.law], side = e.law === 'L' ? 'os liberais' : 'os {fs}';
      if (won) out.push({ at, kind: 'victory', weight: 6, title: e.k === 'chaos' ? 'O caos decidiu' : 'A lei que fechou o placar', text: e.k === 'chaos' ? `A mesa chegou ao limite de rejeições e perdeu a escolha da lei. O topo do baralho deu a vitória para ${side}.` : `{p${e.pres}} e {p${e.chanc}} aprovaram a última lei que faltava. Com o placar em ${laws.L} a ${laws.F}, ${side} venceram.` });
      else if (e.k === 'chaos') out.push({ at, kind: 'chaos', weight: 2, title: 'O baralho tomou a decisão', text: `As rejeições deixaram a lei nas mãos do baralho. Saiu uma lei ${e.law === 'L' ? 'liberal' : '{f}'}, e o placar foi para ${laws.L} a ${laws.F}.` });
      else if (e.law === 'F' && laws.F === LEADER_ZONE) out.push({ at, kind: 'law', weight: 2, title: 'A votação ficou perigosa', text: `{p${e.pres}} e {p${e.chanc}} aprovaram a ${LEADER_ZONE}ª lei {f}. Dali em diante, eleger o {boss} chanceler já bastava para dar a vitória aos {fs}.` });
    }
    if (e.k === 'exec') {
      const leader = g.players[e.target].role === 'lider', liberal = g.players[e.target].role === 'liberal';
      out.push({ at, kind: leader ? 'victory' : 'power', weight: leader ? 6 : 1, title: leader ? 'O tiro que encerrou o jogo' : 'A saída de {p' + e.target + '}', text: leader ? `{p${e.by}} acertou o alvo: {p${e.target}} era o {boss}. A eliminação deu a vitória aos liberais.` : `{p${e.by}} eliminou {p${e.target}}. ${liberal ? 'Os liberais perderam' : 'O lado escondido perdeu'} um voto para as próximas decisões.` });
    }
    if (e.k === 'vote' && at === g.hist.length - 1 && g.winner === 'F' && g.players[e.chanc].role === 'lider' && laws.F >= LEADER_ZONE && e.ja.length > g.players.filter(p => p.alive).length / 2) out.push({ at, kind: 'victory', weight: 6, title: 'A confiança no jogador errado', text: `{p${e.chanc}} recebeu ${e.ja.length} votos e virou chanceler. Era o {boss}: a eleição encerrou o jogo antes mesmo de comprar leis.` });
  });
  return out.sort((a, b) => b.weight - a.weight || a.at - b.at).slice(0, 3);
}

/** How each personality takes a claim (D30), in its own words: agreeing, unsure, disagreeing. Words only. */
const REPLY: Record<Persona, [string[], string[], string[]]> = {
  certinho: [['Faz sentido, eu também acho.', 'Concordo, as jogadas batem.'], ['Ainda não dá para dizer.', 'Prefiro esperar mais uma lei.'], ['Acho que não, viu.', 'Não foi isso que eu vi.']],
  desconfiado: [['Eu sabia!', 'Tava na cara.'], ['Hmm, de você eu também desconfio.', 'Todo mundo aqui é suspeito.'], ['Por que tanta certeza?', 'Estranho você dizer isso.']],
  cetico: [['Pode ser.', 'Tá, pode ser.'], ['Fala é fácil.', 'Mostra que eu acredito.'], ['Duvido.', 'Não me convenceu.']],
  critico: [['Dá para conferir essa hipótese na ata.', 'Quero comparar isso com os governos dele.'], ['Sem prova na ata, não sei.', 'Cadê a lei que mostra isso?'], ['Não cheguei a essa conclusão pela ata.', 'Quero conferir os votos antes de aceitar isso.']],
  centrado: [['Concordo.', 'É o que parece.'], ['Pode ser, pode não ser.', 'Ainda tô no meio.'], ['Não concordo.', 'Acho que é o contrário.']],
  blefador: [['Óbvio! Eu falei isso antes.', 'Finalmente alguém viu.'], ['Sei lá, tô de olho em todo mundo.', 'Eu confio mais em mim.'], ['Nada a ver!', 'Que viagem.']],
  caotico: [['Bora!', 'Elimina logo!'], ['Cara ou coroa?', '¯\\_(ツ)_/¯'], ['Mentira!', 'Você é que é!']]
};
// Extra lines are selected by public speaking history, without drawing randomness or changing a decision.
const MORE_REPLY: Record<Persona, [string[], string[], string[]]> = {
  "certinho": [
    [
      "Estou com você nessa.",
      "Essa leitura combina com o que vi.",
      "Faz sentido olhar para esse jogador.",
      "Também fiquei com essa impressão."
    ],
    [
      "Vou esperar a próxima jogada.",
      "Não quero acusar sem entender.",
      "Ainda falta uma peça nessa história.",
      "Prefiro conferir antes de tomar partido."
    ],
    [
      "Essa acusação me parece apressada.",
      "Eu não cheguei à mesma conclusão.",
      "Não vi motivo suficiente para isso.",
      "Precisa de mais do que essa fala."
    ]
  ],
  "desconfiado": [
    [
      "Também estou de olho.",
      "Essa história nunca me convenceu.",
      "Você percebeu isso também?",
      "Tem coisa aí que merece atenção."
    ],
    [
      "Quero ouvir a resposta primeiro.",
      "Não sei se confio na acusação ou na defesa.",
      "Vou guardar essa fala.",
      "Deixa eu ver quem aparece defendendo."
    ],
    [
      "Você está tentando desviar de quê?",
      "Essa certeza toda me incomoda.",
      "Explica melhor antes de apontar o dedo.",
      "Por que esse alvo agora?"
    ]
  ],
  "cetico": [
    [
      "É uma hipótese razoável.",
      "Dessa vez eu consigo acompanhar.",
      "Isso merece ser levado a sério.",
      "Concordo com a dúvida, sem cravar o papel."
    ],
    [
      "Uma fala não resolve isso.",
      "Vou olhar as próximas decisões.",
      "Por enquanto é só uma hipótese.",
      "Quero algo além de impressão."
    ],
    [
      "A conclusão foi longe demais.",
      "Ainda não compro essa história.",
      "Tem outra explicação possível.",
      "Você pulou umas etapas aí."
    ]
  ],
  "critico": [
    [
      "Essa leitura merece uma conferida na ata.",
      "O argumento tem fundamento.",
      "Dá para acompanhar esse raciocínio.",
      "Vale comparar isso com os próximos governos."
    ],
    [
      "Qual jogada sustenta essa conclusão?",
      "Quero separar o fato do palpite.",
      "Diz exatamente o que você observou.",
      "Vamos conferir a sequência antes."
    ],
    [
      "A explicação não fecha para mim.",
      "Isso ainda não sustenta a acusação.",
      "Uma suspeita não resolve quem mentiu.",
      "Mostra o passo que levou a essa conclusão."
    ]
  ],
  "centrado": [
    [
      "Também acho que vale investigar.",
      "Estou mais para concordar.",
      "Entendi seu ponto.",
      "Essa leitura parece razoável."
    ],
    [
      "Ainda quero ouvir os dois lados.",
      "Não tenho certeza suficiente.",
      "Vou esperar mais um governo.",
      "Pode haver mais de uma explicação."
    ],
    [
      "Não cheguei lá ainda.",
      "Para mim falta uma peça.",
      "Estou vendo de outro jeito.",
      "Eu teria mais cuidado com essa certeza."
    ]
  ],
  "blefador": [
    [
      "Finalmente alguém prestando atenção!",
      "Eu sabia que você ia perceber.",
      "Agora estamos falando a mesma língua.",
      "Pois é, não sou só eu pensando isso."
    ],
    [
      "Quero ver a resposta antes de apostar.",
      "Essa mesa está escondendo jogo.",
      "Vou deixar essa no ar por enquanto.",
      "Não vou entregar minha leitura tão fácil."
    ],
    [
      "Você quer que a gente acredite nisso?",
      "Essa história está conveniente demais.",
      "Vai precisar caprichar mais no argumento.",
      "Eu não cairia nessa tão rápido."
    ]
  ],
  "caotico": [
    [
      "Agora a mesa acordou!",
      "Ih, também senti esse cheiro.",
      "Essa eu quero ver desenrolar.",
      "Pronto, começou o interrogatório!"
    ],
    [
      "Minha teoria muda a cada governo.",
      "Tenho três suspeitos e duas certezas erradas.",
      "Vou esperar alguém se enrolar.",
      "Essa mesa está um quebra-cabeça."
    ],
    [
      "Opa, essa conclusão veio voando!",
      "Calma com esse dedo apontado!",
      "Você soltou essa e saiu correndo?",
      "Quero a versão com explicação agora."
    ]
  ]
};
/** What the one claimed says back (D30): denying it when accused, in its own way; thanking when vouched for. */
const DENY: Record<Persona, string[]> = {
  certinho: ['Pode olhar meus governos, joguei limpo.', 'Eu passei liberal quando pude.'],
  desconfiado: ['Engraçado você me acusar logo agora…', 'Quem acusa primeiro é que costuma ser.'],
  cetico: ['Prova.', 'E de onde você tirou isso?'],
  critico: ['Mostra na ata onde eu errei.', 'Minhas leis estão aí, confere.'],
  centrado: ['Entendo a dúvida, mas não sou.', 'Tá enganado, mas tudo bem.'],
  blefador: ['Eu? Sou o mais liberal dessa mesa!', 'Isso é desespero seu.'],
  caotico: ['Talvez eu seja, talvez não.', 'Me elege e descobre.']
};
const MORE_DENY: Record<Persona, string[]> = {
  "certinho": [
    "Não fiz o que você está insinuando.",
    "Me pergunta sobre a jogada, eu explico.",
    "Olha a sequência antes de decidir.",
    "Não quero ser condenado por impressão."
  ],
  "desconfiado": [
    "Você está desviando a conversa para mim?",
    "Quem ganha com essa acusação agora?",
    "Não vou aceitar esse rótulo de graça.",
    "Quero entender por que virou para mim."
  ],
  "cetico": [
    "Acusar é fácil. Sustenta isso.",
    "Qual parte foi prova e qual foi chute?",
    "Essa conclusão ainda precisa de argumento.",
    "Eu quero ouvir um motivo concreto."
  ],
  "critico": [
    "Vamos comparar as duas versões.",
    "Uma lei sozinha não conta a história toda.",
    "Diz qual jogada minha você quer discutir.",
    "Você está falando da ata ou do seu palpite?"
  ],
  "centrado": [
    "Pode perguntar, eu respondo.",
    "Eu entendo a suspeita, mas discordo.",
    "Não precisa decidir meu papel agora.",
    "Vamos olhar o que aconteceu de fato."
  ],
  "blefador": [
    "Me acusar assim está fácil demais!",
    "Essa tentativa de me queimar foi fraca.",
    "Você está apostando alto nessa história.",
    "Não vai me tirar da mesa só no grito."
  ],
  "caotico": [
    "Olha a perseguição!",
    "Fui promovido a suspeito oficial?",
    "Calma que eu também estou tentando entender.",
    "Quero meu direito a uma teoria absurda também."
  ]
};
const THANKS = ['Valeu pela confiança.', 'Obrigado, finalmente alguém.', 'É isso aí.', 'Viu? Eu falei.', 'Bom saber que alguém acompanhou meu raciocínio.', 'Vamos ver o que o próximo governo mostra.', 'Quero manter essa confiança nas próximas jogadas.', 'Pode me cobrar coerência depois.'];
function speech(xs: string[], g: Game, seat: number, at: number, mode: 'reply' | 'answer' | 'talk'): string {
  const prior = g.hist.slice(0, at).filter(e => e.k === 'talk' && (mode === 'talk' ? e.by === seat : mode === 'answer' ? e.about === seat : e.re?.some(([i]) => i === seat))).length;
  return xs[(seat * 7 + prior) % xs.length];
}
const persona = (g: Game, i: number): Persona => g.players[i].persona || 'centrado';
export const reply = (g: Game, i: number, a: number, at: number): string => {
  const t = g.hist[at];
  if (t?.k === 'talk' && t.about >= 0 && t.say !== 'quiet') {
    const v = viewOf({ ...g, hist: g.hist.slice(0, at + 1) }, i, 'react', [0, 1, 2]);
    if (socialMemory(v, t.by).reversals > socialMemory({ ...v, hist: v.hist.slice(0, -1) }, t.by).reversals) return speech(['Antes você dizia o contrário. Qual fato fez você mudar de ideia?', 'Você estava defendendo essa pessoa. O que mudou?', 'Quero entender essa troca de lado antes de concordar.', 'Você mudou de versão sem um fato novo. Explica isso.'], g, i, at, 'reply');
  }
  if (t?.k === 'talk' && t.say === 'acc' && claimRepeats(g.hist, at) > 1 && !backed(g.hist, 0, at, t.about, true)) {
    return speech(['Você já acusou essa pessoa. Qual é o fato novo?', 'Repetir não é prova. Essa insistência me faz desconfiar de você.', 'Essa acusação eu já ouvi. O que você descobriu desde então?', 'Você voltou no mesmo alvo, mas ainda falta um fato novo.', 'A insistência não está me convencendo. Quero uma jogada concreta.', 'Sem fato novo, repetir só enfraquece seu argumento.'], g, i, at, 'reply');
  }
  if (t?.k === 'talk' && t.about >= 0 && a === REACT.agree) {
    const event = [...g.hist.slice(0, at)].reverse().find(e => (e.k === 'gov' || e.k === 'veto') && (e.pres === t.about || e.chanc === t.about));
    if (event && (event.k === 'gov' || event.k === 'veto') && event.pc !== undefined && event.cc !== undefined && event.pc >= 0 && event.cc >= 0 && (event.cc > event.pc || event.cc < event.pc - 1) && t.say === 'acc') return speech(['As duas versões daquele governo não cabem na mesma mão. Vamos cobrar explicação.', 'Também quero saber qual das duas histórias daquele governo é verdadeira.', 'Essa contradição da ata merece uma resposta.'], g, i, at, 'reply');
  }
  return speech([...(REPLY[persona(g, i)][a] || ['Ainda não sei.']), ...(MORE_REPLY[persona(g, i)][a] || [])], g, i, at, 'reply');
};
export const answer = (g: Game, i: number, accused: boolean, at: number): string => speech(accused ? [...DENY[persona(g, i)], ...MORE_DENY[persona(g, i)]] : THANKS, g, i, at, 'answer');

/* ---------- the votes, where the app plays some seats ---------- */
/** Everyone alive votes: the people with `votes` (seat → Ja!), the players run by the app by themselves. The votes are
 *  recorded for all to see, and more Ja! than Nein! elects. Missing a person's vote, nothing happens. */
export function castVotes(g: Game, votes: Record<number, boolean>, rand: () => number): Game {
  const t = tallyVotes(g, votes, rand);
  return t ? commitVotes(t.g, t.cast, rand) : g;
}
/** D73: the votes of the table, in turn, before they count: the person may still try to turn one (`sway`). */
export function tallyVotes(g: Game, votes: Record<number, boolean>, rand: () => number): { g: Game; cast: [number, boolean][] } | null {
  if (g.phase !== 'vote' || g.chanc === null) return null;
  const alive = seats(g, i => g.players[i].alive);
  if (alive.some(i => !isAi(g, i) && typeof votes[i] !== 'boolean')) return null;
  const ts: Trace[] = [];
  // D62: the table votes in turn, from the seat after the president around: each one hears the votes before it, as at
  // a real table, and may follow those it trusts (a person's vote included)
  const order = alive.map((_, k) => alive[(Math.max(0, alive.findIndex(i => i > g.pres)) + k) % alive.length]).filter((x, k, xs) => xs.indexOf(x) === k);
  const cast: [number, boolean][] = [];
  for (const i of order.length === alive.length ? order : alive) {
    // D115: a mad seat's vote goes out blind
    if (mad(g, i)) { const m = maniaOf(g, i); cast.push([i, m === 'fanatismo' ? true : m === 'paranoia' ? false : seeded(g.hist.length * 389 + i)() < 0.5]); continue; }   // D120: the mania decides
    if (!isAi(g, i)) { cast.push([i, votes[i]]); continue; }
    const asked = g.hist.slice(sinceRound(g) + 1).flatMap(e => (e.k === 'plea' && e.about === i ? [[e.by, e.ja] as [number, boolean]] : []));
    // D66: a bloc member hears its leader's vote as a strong plea
    for (const p of g.players.map((_, j) => j)) { const bl = !isAi(g, p) ? blocOf(g, p) : null; if (bl && bl.yes.includes(i) && typeof votes[p] === 'boolean') asked.push([p, votes[p]], [p, votes[p]]); }
    const r = ask(g, i, 'vote', [1, 0], rand, [...cast], asked); ts.push(r.t); cast.push([i, r.a === 1]);
  }
  return { g: traced(g, ts), cast };
}
/** The votes count: the record of the vote, and the government elected or not. `said` are lines of talk at the table
 *  (a vote someone tried to turn) that go in the log before the count. */
export function commitVotes(g: Game, cast: [number, boolean][], rand: () => number, said: string[] = []): Game {
  if (g.phase !== 'vote' || g.chanc === null) return g;
  const alive = seats(g, i => g.players[i].alive);
  const ja = alive.filter(i => cast.some(([j, v]) => j === i && v));
  const nein = alive.filter(i => !ja.includes(i)), list = (xs: number[]): string => xs.map(i => g.players[i].name).join(', ') || 'ninguém';
  const n: Game = { ...g, log: [...g.log, ...said, `Votos. ${words(g.pack, g.region).ja}: ${list(ja)}. ${words(g.pack, g.region).nein}: ${list(nein)}.`], hist: [...g.hist, { k: 'vote', pres: g.pres, chanc: g.chanc, ja }] };
  return vote(n, ja.length > nein.length, rand);
}

/* ---------- what a seat may know ---------- */
/** The history as this seat knows it: the secrets of others taken out. */
function seenBy(e: Event, me: number): Seen {
  switch (e.k) {
    case 'gov': case 'veto': {
      const { drew, got, ...rest } = e;
      return { ...rest, ...(e.pres === me && drew ? { drew } : {}), ...((e.pres === me || e.chanc === me) && got ? { got } : {}) };
    }
    case 'inv': { const { party, ...rest } = e; return e.by === me ? { ...rest, party } : rest; }
    case 'peek': { const { saw, ...rest } = e; return e.by === me && saw ? { ...rest, saw } : rest; }
    case 'exec': return { k: 'exec', by: e.by, target: e.target, ...(e.why ? { why: e.why } : {}), ...(e.intim ? { intim: e.intim } : {}) };
    case 'psy': return e.by === me ? e : { k: 'psy', by: e.by, about: e.about };   // D96: a reading is only its reader's
    case 'sense': return e.by === me ? e : { k: 'sense', by: e.by, about: e.about, roll: { ...e.roll, d: 0, level: 'fail' } };   // D114: only the sensing seat knows
    default: return e;
  }
}
/** What seat `me` may know when asked `q` with these answers allowed. */
export function viewOf(g: Game, me: number, q: Ask, options: number[]): View {
  const role = g.players[me].role, all = role === 'cultista' || (role === 'lider' && g.players.length <= LEADER_KNOWS_UPTO);
  const known: (Role | null)[] = g.players.map((p, i) => (i === me || all ? p.role : null));
  const hand: Law[] = (q === 'pdiscard' || q === 'cdiscard' || q === 'veto') ? [...g.hand] : [];
  return {
    me, role, level: (g.players[me].level || g.level || 'medio') as Level, mood: temper(g.players[me].mood ?? 0, g.players[me].persona), persona: g.players[me].persona || 'centrado', n: g.players.length, alive: g.players.map(p => p.alive), known, cultists: CULTISTS[g.players.length],
    laws: { ...g.laws }, tracker: g.tracker, pres: g.pres, chanc: g.chanc, lastPres: g.lastPres, lastChanc: g.lastChanc,
    phase: g.phase, ask: q, options: [...options], hand, hist: g.hist.map(e => seenBy(e, me))
  };
}
/** Asks one seat one question, through its view; an answer outside the options is taken as the first option. Comes
 *  back with the answer and the record of it, with the reason the seat gave (D16). */
function ask(g: Game, seat: number, q: Ask, options: number[], rand: () => number, cast?: [number, boolean][], pleas?: [number, boolean][]): { a: number; t: Trace } {
  const v = { ...viewOf(g, seat, q, options), ...(cast && cast.length ? { cast } : {}), ...(pleas && pleas.length ? { pleas } : {}) }, d = decideWhy(v, rand), a = options.includes(d.a) ? d.a : options[0];
  return { a, t: { seat, ask: q, a, at: g.hist.length, ...(v.hand.length ? { hand: v.hand } : {}), why: d.why } };
}
/** The game with these decisions added to the record of them. */
const traced = (g: Game, ts: Trace[]): Game => (ts.length ? { ...g, trace: [...(g.trace ?? []), ...ts] } : g);

/** What one player run by the app believed of everyone (D16), from the start and after each law, veto, chaos,
 *  investigation, peek or elimination: the chance of each seat being on the hidden side (f) and of being its leader (h),
 *  reckoned from its own seat with what it knew then. `at` is the index in the history (-1, the start). */
export function trail(g: Game, seat: number): { at: number; f: number[]; h: number[] }[] {
  const marks = g.hist.map((e, i) => (e.k === 'gov' || e.k === 'veto' || e.k === 'chaos' || e.k === 'inv' || e.k === 'peek' || e.k === 'exec' ? i : -1)).filter(i => i >= 0);
  return [-1, ...marks].map(at => { const b = believe(viewOf({ ...g, hist: g.hist.slice(0, at + 1) }, seat, 'vote', [1, 0])); return { at, f: b.pF, h: b.pH }; });
}

/* ---------- whose turn ---------- */
/** The question the game puts now, to whom, with the answers allowed; null when nobody has to decide anything (or
 *  only the people at the table, voting). */
export function turn(g: Game): { seat: number; ask: Ask | 'reveal' | 'see' | 'votes'; options: number[] } | null {
  const all = (ok: (i: number) => boolean): number[] => seats(g, ok);
  switch (g.phase) {
    case 'reveal': return { seat: g.reveal, ask: 'reveal', options: [] };
    case 'nominate': return { seat: g.pres, ask: 'nominate', options: all(i => canNominate(g, i)) };
    case 'vote': return humansAlive(g).length ? null : { seat: g.pres, ask: 'votes', options: [] };
    case 'president': return { seat: g.pres, ask: 'pdiscard', options: g.hand.map((_, k) => k) };
    case 'chancellor': return { seat: g.chanc as number, ask: 'cdiscard', options: [...g.hand.map((_, k) => k), ...(canVeto(g) ? [2] : [])] };
    case 'veto': return { seat: g.pres, ask: 'veto', options: [1, 0] };
    case 'investigate': case 'special': case 'execute': return { seat: g.pres, ask: g.phase, options: all(i => canTarget(g, i)) };
    case 'investigated': case 'peek': return { seat: g.pres, ask: 'see', options: [] };
    default: return null;
  }
}
/** The player run by the app who acts next: one with something to tell the table first (the president before the
 *  chancellor), then whoever the game is waiting for. Null when it waits for a person, or for nobody. */
export function botTurn(g: Game): { seat: number; ask: Ask | 'reveal' | 'see' | 'votes'; options: number[] } | null {
  if (!hasAi(g) || g.phase === 'over') return null;
  for (const kind of talkKinds) {
    const s = seats(g, i => isAi(g, i) && claims(g, i).includes(kind))[0];
    if (s !== undefined) return { seat: s, ask: kind, options: kind === 'inv' ? [0, 1] : Array.from({ length: MAX_SAY[kind] + 1 }, (_, i) => i) };
  }
  const who = talker(g);
  if (who !== null) return { seat: who, ask: 'talk', options: talkOptions(g, who) };
  const t = turn(g), choice = t && !['reveal', 'see', 'votes'].includes(t.ask);
  if (!t || (choice && !t.options.length)) return null;                     // nothing it could answer: never asked
  return isAi(g, t.seat) || t.ask === 'votes' ? t : null;
}
/** The next step of a player run by the app, played through the rules; null when it is not their turn. */
export function botStep(g: Game, rand: () => number): Game | null {
  const t = botTurn(g);
  if (!t) return null;
  if (t.ask === 'reveal') return revealNext(g);
  if (t.ask === 'see') return endPower(g);
  if (t.ask === 'votes') return castVotes(g, {}, rand);
  const r = ask(g, t.seat, t.ask, t.options, rand), a = r.a;
  g = traced(g, [r.t]);
  switch (t.ask) {
    case 'pc': case 'cc': case 'inv': case 'peek': return say(g, t.seat, t.ask, a);
    case 'talk': return talk(g, t.seat, a);
    case 'nominate': return nominate(g, a);
    case 'pdiscard': return presidentDiscard(g, a);
    case 'cdiscard': return a === 2 ? askVeto(g) : chancellorDiscard(g, a, rand);
    case 'veto': return answerVeto(g, a === 1, rand);
    case 'investigate': return investigate(g, a);
    case 'special': return specialElect(g, a);
    default: return intimidate(justify(g, execute(g, a)));
  }
}
/** D53: an app player says why it eliminated someone, from what the whole table saw: the strongest proof in the record,
 *  an accusation it had made, or that it was the one it suspected most. A hidden-side player gives a reason the same way:
 *  the reason is public, never its private reckoning. */
export function execReason(g: Game, by: number, t: number): string {
  // D76: not a reason it shares (a vote for a government it sat in or voted for too)
  const p = evidence(g, t).filter(x => { if (x.kind !== 'vote') return true; const v = g.hist[x.at]; return !(v && v.k === 'vote' && (v.ja.includes(by) || v.pres === by || v.chanc === by)); }), hit = p.find(x => x.hit) ?? p[0];
  if (hit) return lower(g, hit.text);
  if (g.hist.some(e => e.k === 'talk' && e.by === by && e.about === t && e.say === 'acc')) return 'eu já tinha dito que não confiava';
  return 'era de quem eu mais desconfiava';
}
function justify(before: Game, g: Game): Game {
  const i = g.hist.length - 1, e = g.hist[i];
  if (g === before || !e || e.k !== 'exec') return g;
  const why = execReason(before, e.by, e.target);
  return { ...g, hist: g.hist.map((x, j) => (j === i ? { ...e, why } : x)), log: [...g.log, `${g.players[e.by].name}: "Eliminei ${g.players[e.target].name}: ${why}."`] };
}

export * from './review';
export * from './debate';
