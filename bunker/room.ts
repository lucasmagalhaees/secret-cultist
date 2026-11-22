/* D159: an online room of the bunker: only the two historical themes, people only (no AI, no sheets, no lore), each on
   their own phone. Pure: the rules are the core's (src/core/game.ts); this file keeps who is in the room, collects the
   votes and tells each seat only what that seat may see. The server (worker.ts) moves the messages. */
import { MAX_PLAYERS, MIN_PLAYERS, NAME_MAX, LEADER_KNOWS_UPTO, answerVeto, askVeto, canNominate, canTarget, canVeto, chancellorDiscard, endPower, execute, investigate, newGame, nominate, partyOf, presidentDiscard, revealNext, specialElect, vote } from '../src/core/game';
import type { Event, Game, Law, Party, Role } from '../src/core/types';

export type BunkerPack = 'classico' | 'vermelho';
export const BUNKER_PACKS: BunkerPack[] = ['classico', 'vermelho'];
export const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', CODE_LEN = 5, MSG_MAX = 1024, CONN_MAX = 20;

export interface Member { name: string; token: string; online: boolean }
export interface Room { code: string; pack: BunkerPack; members: Member[]; game: Game | null; votes: (boolean | null)[]; last: (boolean | null)[] | null }

export type ClientMsg =
  | { t: 'join'; token: string; name: string; pw: string }
  | { t: 'pack'; v: BunkerPack }
  | { t: 'start' }
  | { t: 'vote'; v: boolean }
  | { t: 'act'; a: 'nominate' | 'pdiscard' | 'cdiscard' | 'veto' | 'answer' | 'target' | 'done'; i?: number; v?: boolean }
  | { t: 'drop' };

/** What one seat sees: the game with everything secret taken out (roles, the pile, hands, what others saw). */
export interface SeatView {
  t: 'room'; code: string; pack: BunkerPack; host: boolean; me: number; started: boolean;
  members: { name: string; online: boolean }[];
  game: Game | null; roles: (Role | null)[]; deckN: number; discardN: number;
  peek: Law[] | null; party: Party | null; voted: boolean[]; last: (boolean | null)[] | null;
}

export const newRoom = (code: string): Room => ({ code, pack: 'classico', members: [], game: null, votes: [], last: null });
export const roomCode = (rand: () => number): string => Array.from({ length: CODE_LEN }, () => CODE_ABC[Math.floor(rand() * CODE_ABC.length)]).join('');
export const isCode = (x: unknown): x is string => typeof x === 'string' && new RegExp(`^[${CODE_ABC}]{${CODE_LEN}}$`).test(x);
const seatOf = (room: Room, token: string): number => room.members.findIndex(m => m.token === token);

/** What one seat may see of the game. */
export function seatView(room: Room, token: string): SeatView | null {
  const me = seatOf(room, token);
  if (me < 0) return null;
  const g = room.game, base = { t: 'room' as const, code: room.code, pack: room.pack, host: me === 0, me, started: !!g, members: room.members.map(m => ({ name: m.name, online: m.online })), last: room.last };
  if (!g) return { ...base, game: null, roles: [], deckN: 0, discardN: 0, peek: null, party: null, voted: [] };
  const done = g.phase === 'over', mine = g.players[me].role;
  const all = done || mine === 'cultista' || (mine === 'lider' && g.players.length <= LEADER_KNOWS_UPTO);
  const roles = g.players.map((p, i) => (all || i === me ? p.role : null));
  const holds = (g.phase === 'president' && me === g.pres) || (g.phase === 'chancellor' && me === g.chanc) || (g.phase === 'veto' && (me === g.pres || me === g.chanc));
  const hist: Event[] = done ? g.hist : [];   // the table's story is in the log; the history keeps secrets
  const game: Game = { players: g.players.map(p => ({ name: p.name, alive: p.alive, role: 'liberal' as Role })), deck: [], discard: [], laws: g.laws, phase: g.phase, pres: g.pres, chanc: g.chanc, back: g.back, lastPres: g.lastPres, lastChanc: g.lastChanc, tracker: g.tracker, vetoed: g.vetoed, seen: g.seen, reveal: g.reveal, hand: holds ? g.hand : [], log: g.log, hist, pack: g.pack, target: g.target, winner: g.winner, why: g.why } as Game;
  return { ...base, game, roles, deckN: g.deck.length, discardN: g.discard.length,
    peek: g.phase === 'peek' && me === g.pres ? g.deck.slice(0, 3) : null,
    party: g.phase === 'investigated' && me === g.pres && g.target !== null ? partyOf(g.players[g.target].role) : null,
    voted: room.votes.map(v => v !== null) };
}

export type Outcome = { room: Room; error?: string };
const err = (room: Room, error: string): Outcome => ({ room, error });

/** One message from one phone. `ok` says the server already checked the bunker's password on this connection. */
export function handle(room: Room, token: string, msg: ClientMsg, rand: () => number, ok = false): Outcome {
  const me = seatOf(room, token), g = room.game;
  if (msg.t === 'join') {
    if (!ok) return err(room, 'Senha errada.');
    if (me >= 0) return { room: { ...room, members: room.members.map((m, i) => (i === me ? { ...m, online: true } : m)) } };
    const name = String(msg.name || '').trim().slice(0, NAME_MAX);
    if (!name) return err(room, 'Escreva um nome.');
    if (g) return err(room, 'A partida já começou.');
    if (room.members.length >= MAX_PLAYERS) return err(room, `A sala já tem ${MAX_PLAYERS} pessoas.`);
    if (room.members.some(m => m.name.toLowerCase() === name.toLowerCase())) return err(room, 'Esse nome já está na sala.');
    return { room: { ...room, members: [...room.members, { name, token, online: true }] } };
  }
  if (me < 0) return err(room, 'Entre na sala primeiro.');
  if (msg.t === 'drop') return { room: { ...room, members: room.members.map((m, i) => (i === me ? { ...m, online: false } : m)) } };
  if (msg.t === 'pack') return me === 0 && BUNKER_PACKS.includes(msg.v) && (!g || g.phase === 'over') ? { room: { ...room, pack: msg.v } } : { room };
  if (msg.t === 'start') {
    if (me !== 0) return err(room, 'Só quem criou a sala começa.');
    if (g && g.phase !== 'over') return { room };
    if (room.members.length < MIN_PLAYERS) return err(room, `Precisa de pelo menos ${MIN_PLAYERS} pessoas.`);
    const made = newGame(room.members.map(m => m.name), rand, { pack: room.pack });
    if (!made.ok) return err(room, 'Não deu para começar com esses nomes.');
    let n = made.game;   // online, each one sees their own role on their own phone: no passing round
    while (n.phase === 'reveal') n = revealNext(n);
    return { room: { ...room, game: n, votes: n.players.map(() => null), last: null } };
  }
  if (!g || g.phase === 'over') return { room };
  if (!g.players[me].alive) return err(room, 'Quem saiu só assiste.');
  if (msg.t === 'vote') {
    if (g.phase !== 'vote') return { room };
    const votes = room.votes.map((v, i) => (i === me ? !!msg.v : v));
    const alive = g.players.map((p, i) => (p.alive ? i : -1)).filter(i => i >= 0);
    if (alive.some(i => votes[i] === null)) return { room: { ...room, votes } };
    const ja = alive.filter(i => votes[i]).length, n = vote(g, ja > alive.length - ja, rand);
    const said = alive.map(i => `${g.players[i].name}: ${votes[i] ? 'Ja' : 'Nein'}`).join(', ');
    return { room: { ...room, game: { ...n, log: [...n.log, `Votos — ${said}.`] }, votes: g.players.map(() => null), last: votes } };
  }
  const i = msg.i ?? -1, pres = me === g.pres, chanc = me === g.chanc;
  let n: Game = g;
  switch (msg.a) {
    case 'nominate': if (pres && canNominate(g, i)) n = nominate(g, i); break;
    case 'pdiscard': if (pres && g.phase === 'president') n = presidentDiscard(g, i); break;
    case 'cdiscard': if (chanc && g.phase === 'chancellor') n = chancellorDiscard(g, i, rand); break;
    case 'veto': if (chanc && canVeto(g)) n = askVeto(g); break;
    case 'answer': if (pres && g.phase === 'veto') n = answerVeto(g, !!msg.v, rand); break;
    case 'target':
      if (pres && canTarget(g, i)) n = g.phase === 'investigate' ? investigate(g, i) : g.phase === 'special' ? specialElect(g, i) : execute(g, i);
      break;
    case 'done': if (pres) n = endPower(g); break;
  }
  if (n === g) return err(room, 'Não é a sua vez.');
  return { room: { ...room, game: n, votes: n.players.map(() => null) } };
}

export function readMsg(raw: string): ClientMsg | null {
  try {
    const m = JSON.parse(raw);
    return m && typeof m === 'object' && ['join', 'pack', 'start', 'vote', 'act', 'drop'].includes(m.t) ? m as ClientMsg : null;
  } catch { return null; }
}
export function readRoom(x: unknown): Room | null {
  const r = x as Room;
  return r && typeof r === 'object' && isCode(r.code) && Array.isArray(r.members) ? r : null;
}
