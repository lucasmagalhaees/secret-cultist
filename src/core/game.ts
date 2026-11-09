/* The rules of the game. Pure: a game comes in and a new one goes out; chance comes in as a function (`rand`), so the
   same seed always plays the same game. An action that is not allowed where the game is returns the same game,
   untouched: the page only offers what is allowed, and a stray tap changes nothing. */
import type { Event, Game, Law, Level, Pack, Party, Persona, Player, Region, Role } from './types';
import { words } from './words';

export const MIN_PLAYERS = 5, MAX_PLAYERS = 10, NAME_MAX = 20;
/** The deck: 17 laws, 11 cultist and 6 liberal, as in the original game. */
export const DECK_F = 11, DECK_L = 6;
/** Laws of its own kind each side needs to win, as in the original game. */
export const WIN: Record<Law, number> = { L: 5, F: 6 };
/** Governments rejected in a row before the top law is enacted by itself. */
export const TRACKER_MAX = 3;
/** Cultist laws on the table from which electing Leader chancellor wins the game for the cultists. */
export const LEADER_ZONE = 3;
/** Cultist laws on the table from which the chancellor may ask to veto the two laws in hand. */
export const VETO_FROM = 5;
/** Players alive at or under which only the last chancellor (not the last president) is barred from being chancellor. */
export const SMALL_TABLE = 5;
/** Cultists (Leader included) for each size of table. */
export const CULTISTS: Record<number, number> = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 4 };
/** Tables up to this size use the small cultist board, and Leader knows who the cultist is. */
export const LEADER_KNOWS_UPTO = 6;
export type Power = 'investigate' | 'peek' | 'special' | 'execute';
/** What the president of the round gets to do when the Nth cultist law is enacted, by board, as in the original game:
 *  5 or 6 players, 7 or 8, and 9 or 10. */
export const POWERS: Record<'small' | 'medium' | 'large', Record<number, Power>> = {
  small: { 3: 'peek', 4: 'execute', 5: 'execute' },
  medium: { 2: 'investigate', 3: 'special', 4: 'execute', 5: 'execute' },
  large: { 1: 'investigate', 2: 'investigate', 3: 'special', 4: 'execute', 5: 'execute' }
};
/** The board a table plays on, by how many sat down (not how many are still alive). */
export const boardOf = (players: number): keyof typeof POWERS => (players <= LEADER_KNOWS_UPTO ? 'small' : players <= 8 ? 'medium' : 'large');
/** The power the Nth cultist law gives on this game's board, if any. */
export const powerAt = (g: Game, n: number): Power | undefined => POWERS[boardOf(g.players.length)][n];

/** The levels of the players run by the app, easiest first (D10). */
export const LEVELS: Level[] = ['facil', 'medio', 'dificil', 'extremo'];
/** Names for the players run by the app (D11, D12): well-known politicians of each theme, the two sides mixed. The name
 *  says nothing about the role: roles are dealt at random, so Churchill may well be the cultist. The leader of the
 *  hidden side (Leader, Red Leader) is not among them: it is a role. */
/* D117: the names of Secret Cultist, the world's list; the expansion's names arrive with the key (src/core/dlc.ts). */
export const CULT_NAMES: string[] = ['Churchill', 'Roosevelt', 'Gandhi', 'Truman', 'Júlio César', 'Lincoln', 'Kennedy', 'Gengis Khan', 'Napoleão', 'Mandela', 'Cleópatra', 'Thatcher', 'Obama', 'Reagan'];
export const BOT_NAMES: Record<Pack, string[]> = { classico: CULT_NAMES, vermelho: CULT_NAMES, culto: CULT_NAMES };
/** A name for one more player run by the app: one of the theme's names not yet at the table, at random (`rand`) or the
 *  first. */
/** Where the names of the app players come from (D24): the whole world (BOT_NAMES), or one continent. In each list,
 *  the two sides of the theme mixed, well-known names only. The name says nothing of the role, which is dealt. */
export const REGIONS: Region[] = ['mundo', 'americas', 'europa', 'asia', 'africa', 'oceania', 'brasil'];
/** The password that unlocks the Brazil expansion (D27). Written in the page on purpose: a joke among friends, not a lock. */
export const DLC_KEY = 'unlockresenha';
export const REGION_NAMES: Record<Region, string> = { mundo: 'Mundo', americas: 'Américas', europa: 'Europa', asia: 'Ásia', africa: 'África', oceania: 'Oceania', brasil: 'Brasil' };
/* D112, D117: in Secret Cultist the app's players are named after well-known statesmen of each continent, the two sides
   mixed (no dictators: those stay in the expansion); the name says nothing of the role. Brazil is the expansion's. */
export const CULT_BY: Record<Region, string[]> = {
  mundo: CULT_NAMES,
  americas: ['Roosevelt', 'Kennedy', 'Lincoln', 'Obama', 'Washington', 'JK', 'Getúlio', 'Perón', 'Trump', 'Nixon', 'Bush', 'Reagan', 'Allende', 'Evo Morales', 'Biden', 'Clinton'],
  europa: ['Churchill', 'Napoleão', 'Merkel', 'Thatcher', 'Rainha Vitória', 'Macron', 'Rainha Elizabeth', 'Adenauer', 'Gorbachev', 'Júlio César', 'De Gaulle'],
  asia: ['Gandhi', 'Nehru', 'Confúcio', 'Gengis Khan', 'Imperador Meiji', 'Tiglate-Pileser', 'Sun Yat-sen', 'Lee Kuan Yew', 'Indira Gandhi', 'Ciro'],
  africa: ['Mandela', 'Nasser', 'Haile Selassie', 'Cleópatra', 'Ramsés', 'Tutancâmon', 'Aníbal', 'Nefertiti', 'Kofi Annan', 'Nkrumah', 'Kenyatta'],
  oceania: CULT_NAMES,
  brasil: CULT_NAMES   // the expansion's region: its names arrive with the key (src/core/dlc.ts)
};
export const NAMES_BY: Record<Pack, Record<Region, string[]>> = { ...Object.fromEntries((['classico', 'vermelho'] as Pack[]).map(k => [k, Object.fromEntries(REGIONS.map(r => [r, CULT_NAMES]))])), culto: CULT_BY } as Record<Pack, Record<Region, string[]>>;
export function botName(names: string[], rand?: () => number, pack: Pack = 'culto', region: Region = 'mundo'): string {
  const free = ((NAMES_BY[pack] || NAMES_BY.culto)[region] || BOT_NAMES[pack] || BOT_NAMES.culto).filter(b => !names.some(x => x.toLocaleLowerCase('pt-BR') === b.toLocaleLowerCase('pt-BR')));
  return free.length ? free[rand ? Math.floor(rand() * free.length) : 0] : `IA ${names.length + 1}`;
}

/** D56: a draw that avoids the last pick: the same one comes back only REPEAT_KEEP of the time. */
export const REPEAT_KEEP = 0.15;
export function freshPick<T>(items: T[], last: T | undefined, rand: () => number): T {
  const pool = last !== undefined && items.length > 1 && rand() >= REPEAT_KEEP ? items.filter(x => x !== last) : items;
  return pool[Math.floor(rand() * pool.length)];
}
/** A small seeded generator (mulberry32): numbers in [0, 1). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A shuffled copy (Fisher-Yates). */
export function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const partyOf = (r: Role): Party => (r === 'liberal' ? 'L' : 'F');
export const lawName = (l: Law, pack?: Pack): string => (l === 'L' ? 'liberal' : words(pack).f);

/** The names of a table, checked: trimmed, none empty, none repeated, between MIN_PLAYERS and MAX_PLAYERS. */
export function checkNames(names: string[]): { ok: true; names: string[] } | { ok: false; why: 'count' | 'name' | 'dup' } {
  const n = names.map(x => String(x || '').trim().slice(0, NAME_MAX));
  if (n.some(x => !x)) return { ok: false, why: 'name' };
  if (new Set(n.map(x => x.toLocaleLowerCase('pt-BR'))).size !== n.length) return { ok: false, why: 'dup' };
  if (n.length < MIN_PLAYERS || n.length > MAX_PLAYERS) return { ok: false, why: 'count' };
  return { ok: true, names: n };
}

/** One more name at the table, or why not: empty, already there, or the table is full. */
export function addName(names: string[], name: string): { ok: true; names: string[] } | { ok: false; why: 'name' | 'dup' | 'count' } {
  const n = String(name || '').trim().slice(0, NAME_MAX);
  if (!n) return { ok: false, why: 'name' };
  if (names.some(x => x.toLocaleLowerCase('pt-BR') === n.toLocaleLowerCase('pt-BR'))) return { ok: false, why: 'dup' };
  if (names.length >= MAX_PLAYERS) return { ok: false, why: 'count' };
  return { ok: true, names: [...names, n] };
}

/** A new game: roles dealt at random, the deck shuffled, the first president drawn. `ai` marks the seats the app plays,
 *  at `level`. `train` (D11, training against the app): the role the one person at the table wants; the roles are
 *  still dealt at random, and then that seat swaps with one that got it. */
export function newGame(names: string[], rand: () => number, opts: { ai?: boolean[]; level?: Level; train?: Role; pack?: Pack; region?: Region } = {}): { ok: true; game: Game } | { ok: false; why: 'count' | 'name' | 'dup' } {
  const c = checkNames(names);
  if (!c.ok) return c;
  const k = CULTISTS[c.names.length];
  const roles = shuffle<Role>(['lider', ...Array(k - 1).fill('cultista'), ...Array(c.names.length - k).fill('liberal')], rand);
  const people = c.names.map((_, i) => i).filter(i => !opts.ai?.[i]), train = opts.train && people.length === 1 && opts.ai?.some(Boolean) && ['liberal', 'cultista', 'lider'].includes(opts.train) ? opts.train : undefined;
  if (train && roles[people[0]] !== train) {
    const other = roles.indexOf(train);
    [roles[people[0]], roles[other]] = [roles[other], roles[people[0]]];
  }
  const players: Player[] = c.names.map((name, i) => ({ name, role: roles[i], alive: true, ...(opts.ai?.[i] ? { ai: true as const } : {}) }));
  const level = players.some(p => p.ai) ? { level: opts.level && LEVELS.includes(opts.level) ? opts.level : 'medio' as Level, ...(train ? { train } : {}) } : {};
  const deck = shuffle<Law>([...Array(DECK_F).fill('F'), ...Array(DECK_L).fill('L')], rand);
  const pres = Math.floor(rand() * players.length);
  players.forEach(p => { if (p.ai) p.mood = Math.round((rand() * 2 - 1) * 100) / 100; });   // drawn last: the deal stays as it was
  // a personality for each, drawn anew every game (D26): as many different ones as there are seats for them
  const kinds = shuffle<Persona>([...PERSONAS], rand);
  players.filter(p => p.ai).forEach((p, j) => { p.persona = kinds[j % kinds.length]; });
  return { ok: true, game: { players, deck, discard: [], laws: { L: 0, F: 0 }, phase: 'reveal', pres, back: null, chanc: null, lastPres: null, lastChanc: null, tracker: 0, vetoed: false, seen: [], reveal: 0, hand: [], target: null, winner: null, why: '', log: [`Jogo começou com ${players.length} jogadores.`], hist: [], ...level, pack: opts.pack || 'culto', ...(opts.region && opts.region !== 'mundo' && REGIONS.includes(opts.region) ? { region: opts.region } : {}) } };
}

/** The personalities of the players run by the app (D26), in the order they are shown. */
export const PERSONAS: Persona[] = ['certinho', 'desconfiado', 'cetico', 'critico', 'centrado', 'blefador', 'caotico'];

/** What player i is told at the start: the cultists see each other and Leader; Leader sees the cultist only at a table
 *  of LEADER_KNOWS_UPTO or fewer; the liberals see no one. */
export function knows(g: Game, i: number): { name: string; role: Role }[] {
  const r = g.players[i]?.role;
  if (r !== 'cultista' && !(r === 'lider' && g.players.length <= LEADER_KNOWS_UPTO)) return [];
  return g.players.filter((p, j) => j !== i && p.role !== 'liberal').map(p => ({ name: p.name, role: p.role }));
}

/** The player who has just seen their role hides it; after the last one, the first round begins. */
export function revealNext(g: Game): Game {
  if (g.phase !== 'reveal') return g;
  const reveal = g.reveal + 1;
  return reveal < g.players.length ? { ...g, reveal } : { ...g, reveal, phase: 'nominate' };
}

const aliveCount = (g: Game): number => g.players.filter(p => p.alive).length;

/** Who the president can nominate: anyone else still in the game, except the last government elected (term limits:
 *  with SMALL_TABLE or fewer alive, only the last chancellor is barred). */
export const canNominate = (g: Game, i: number): boolean => g.phase === 'nominate' && i !== g.pres && !!g.players[i]?.alive
  && i !== g.lastChanc && (aliveCount(g) <= SMALL_TABLE || i !== g.lastPres);

export function nominate(g: Game, i: number): Game {
  return canNominate(g, i) ? { ...g, chanc: i, phase: 'vote', log: [...g.log, `${g.players[g.pres].name} indicou ${g.players[i].name} para chanceler.`] } : g;
}

/** The next president: the next player still alive, going round the table. After a special election it goes on from
 *  the president who called it (`back`), not from the one who was elected. */
function nextPres(g: Game): number {
  let i = g.back ?? g.pres;
  do i = (i + 1) % g.players.length; while (!g.players[i].alive);
  return i;
}
const newRound = (g: Game): Game => ({ ...g, phase: 'nominate', pres: nextPres(g), back: null, chanc: null, hand: [], drew: [], target: null, vetoed: false });
const note = (g: Game, e: Event): Event[] => [...g.hist, e];
const over = (g: Game, winner: Party, why: string): Game => ({ ...g, phase: 'over', winner, why, hand: [], log: [...g.log, why] });

/** With fewer than 3 laws left to draw, the discarded ones go back in and the pile is shuffled. */
function refill(g: Game, rand: () => number): Game {
  return g.deck.length >= 3 ? g : { ...g, deck: shuffle([...g.deck, ...g.discard], rand), discard: [] };
}

/** One law goes on the table. From a government it may give the president a power; from the tracker it never does. */
function enact(g: Game, law: Law, rand: () => number, fromGov: boolean): Game {
  const laws = { ...g.laws, [law]: g.laws[law] + 1 };
  const who = fromGov ? `por ${g.players[g.pres].name} (presidente) e ${g.players[g.chanc as number].name} (chanceler)` : `pelo caos (${TRACKER_MAX} governos seguidos sem lei)`;
  const e: Event = fromGov ? { k: 'gov', pres: g.pres, chanc: g.chanc as number, law, drew: g.drew || [], got: g.hand } : { k: 'chaos', law };
  const n: Game = refill({ ...g, laws, hand: [], log: [...g.log, `Lei ${lawName(law, g.pack)} aprovada ${who}.`], hist: note(g, e) }, rand);
  if (laws.L >= WIN.L) return over(n, 'L', `${WIN.L} leis liberais aprovadas: os liberais vencem.`);
  if (laws.F >= WIN.F) return over(n, 'F', `${WIN.F} leis ${words(g.pack).fs} aprovadas: os ${words(g.pack).fs} vencem.`);
  const power = law === 'F' && fromGov ? powerAt(n, laws.F) : undefined;
  if (power) return { ...n, phase: power, target: null };
  return newRound(n);
}

/** The table voted out loud (Ja! or Nein!) and the phone records the result: more Ja! than Nein! elects the government. */
export function vote(g: Game, elected: boolean, rand: () => number): Game {
  if (g.phase !== 'vote' || g.chanc === null) return g;
  const pres = g.players[g.pres].name, chanc = g.players[g.chanc];
  if (elected) {
    const n: Game = { ...g, tracker: 0, lastPres: g.pres, lastChanc: g.chanc, log: [...g.log, `Governo ${pres} + ${chanc.name} eleito.`] };
    if (chanc.role === 'lider' && g.laws.F >= LEADER_ZONE) return over(n, 'F', `${words(g.pack).boss} (${chanc.name}) foi eleito chanceler: os ${words(g.pack).fs} vencem.`);
    return { ...n, phase: 'president', hand: n.deck.slice(0, 3), drew: n.deck.slice(0, 3), deck: n.deck.slice(3) };
  }
  return failed({ ...g, log: [...g.log, `Governo ${pres} + ${chanc.name} rejeitado.`], hist: note(g, { k: 'rej', pres: g.pres, chanc: g.chanc }) }, rand);
}


/** A government that did not make a law (rejected, or vetoed). At the third in a row, the top law is enacted by itself
 *  and the term limits are forgotten. Like any session, it ends with the pile refilled if fewer than 3 laws are left. */
function failed(g: Game, rand: () => number): Game {
  const n: Game = refill({ ...g, tracker: g.tracker + 1, hand: [] }, rand);      // a veto ends the session too: the pile may be short
  if (n.tracker < TRACKER_MAX) return newRound(n);
  const r = refill(n, rand), top = r.deck[0];
  return enact({ ...r, tracker: 0, lastPres: null, lastChanc: null, deck: r.deck.slice(1) }, top, rand, false);     // the presidency moves on inside enact
}

/** The president throws one of the 3 laws away and passes the other 2 on. */
export function presidentDiscard(g: Game, k: number): Game {
  if (g.phase !== 'president' || !(k >= 0 && k < g.hand.length)) return g;
  return { ...g, phase: 'chancellor', discard: [...g.discard, g.hand[k]], hand: g.hand.filter((_, j) => j !== k) };
}

/** The chancellor throws one of the 2 laws away; the other is enacted. */
export function chancellorDiscard(g: Game, k: number, rand: () => number): Game {
  if (g.phase !== 'chancellor' || !(k >= 0 && k < g.hand.length)) return g;
  const law = g.hand[1 - k];
  return enact({ ...g, discard: [...g.discard, g.hand[k]] }, law, rand, true);
}

/** The chancellor may ask to veto when VETO_FROM cultist laws are on the table, once per government. */
export const canVeto = (g: Game): boolean => g.phase === 'chancellor' && g.laws.F >= VETO_FROM && !g.vetoed;

export function askVeto(g: Game): Game {
  return canVeto(g) ? { ...g, phase: 'veto', log: [...g.log, `${g.players[g.chanc as number].name} (chanceler) pediu veto.`] } : g;
}
/** The president answers the veto. Yes: both laws go to the discards and the government counts as failed. No: the
 *  chancellor must enact one of them. */
export function answerVeto(g: Game, yes: boolean, rand: () => number): Game {
  if (g.phase !== 'veto') return g;
  const who = g.players[g.pres].name;
  if (!yes) return { ...g, phase: 'chancellor', vetoed: true, log: [...g.log, `${who} (presidente) recusou o veto.`] };
  return failed({ ...g, discard: [...g.discard, ...g.hand], log: [...g.log, `${who} (presidente) aceitou o veto: nenhuma lei aprovada.`], hist: note(g, { k: 'veto', pres: g.pres, chanc: g.chanc as number, drew: g.drew || [], got: g.hand }) }, rand);
}

/** Who the president can use a power on: anyone else still in the game, and for an investigation, not someone already
 *  investigated. */
export const canTarget = (g: Game, i: number): boolean => (g.phase === 'investigate' || g.phase === 'execute' || g.phase === 'special') && i !== g.pres && !!g.players[i]?.alive
  && !(g.phase === 'investigate' && g.seen.includes(i));

/** The president picks whose party to see. Leader shows as cultist. */
export function investigate(g: Game, i: number): Game {
  if (g.phase !== 'investigate' || !canTarget(g, i)) return g;
  return { ...g, phase: 'investigated', target: i, seen: [...g.seen, i], log: [...g.log, `${g.players[g.pres].name} investigou ${g.players[i].name}.`], hist: note(g, { k: 'inv', by: g.pres, target: i, party: partyOf(g.players[i].role) }) };
}

/** Special election: the president picks the next president, anyone else alive (term limits do not apply to it). After
 *  that round the presidency goes back to its order, from the player after the one who called it. */
export function specialElect(g: Game, i: number): Game {
  if (g.phase !== 'special' || !canTarget(g, i)) return g;
  return { ...g, phase: 'nominate', back: g.pres, pres: i, chanc: null, hand: [], target: null, vetoed: false, log: [...g.log, `${g.players[g.pres].name} convocou eleição especial: ${g.players[i].name} é o próximo presidente.`], hist: note(g, { k: 'special', by: g.pres, target: i }) };
}

/** The party the president sees, once a player has been investigated. */
export const investigated = (g: Game): Party | null => (g.phase === 'investigated' && g.target !== null ? partyOf(g.players[g.target].role) : null);

/** The president has seen what the power showed (a party, or the next 3 laws): the next round begins. */
export function endPower(g: Game): Game {
  if (g.phase === 'peek') return newRound({ ...g, log: [...g.log, `${g.players[g.pres].name} olhou as próximas 3 leis.`], hist: note(g, { k: 'peek', by: g.pres, saw: g.deck.slice(0, 3) }) });
  return g.phase === 'investigated' ? newRound(g) : g;
}

/** The president eliminates a player. Eliminating Leader wins the game for the liberals. */
export function execute(g: Game, i: number): Game {
  if (g.phase !== 'execute' || !canTarget(g, i)) return g;
  const players = g.players.map((p, j) => (j === i ? { ...p, alive: false } : p));
  const n: Game = { ...g, players, log: [...g.log, `${g.players[g.pres].name} eliminou ${g.players[i].name}.`], hist: note(g, { k: 'exec', by: g.pres, target: i, role: g.players[i].role }) };
  if (g.players[i].role === 'lider') return over(n, 'L', `${words(g.pack).boss} (${g.players[i].name}) foi eliminado: os liberais vencem.`);
  return newRound(n);
}
