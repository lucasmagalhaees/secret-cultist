import { STEREOTYPES } from './dice';
/* What was saved on the device, read back. A saved game that does not hold together is dropped, so a damaged state
   never breaks the page: the names and the theme still come back. */
import { LEVELS, MAX_PLAYERS, NAME_MAX, PERSONAS, REGIONS, WIN } from './game';
import type { AppState, Event, Game, Law, Level, Pack, NoteDetail, Phase, Player, Region, Role, Saved, Trace } from './types';
import { PACKS } from './words';

const ROLES: Role[] = ['liberal', 'cultista', 'lider'];
const PHASES: Phase[] = ['reveal', 'nominate', 'vote', 'president', 'chancellor', 'veto', 'investigate', 'investigated', 'peek', 'special', 'execute', 'over'];
const isLaw = (x: unknown): x is Law => x === 'L' || x === 'F';
const isLaws = (x: unknown): x is Law[] => Array.isArray(x) && x.every(isLaw);
const isInt = (x: unknown, max: number): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= max;
const isIdx = (x: unknown, n: number): x is number => isInt(x, n - 1);
const isPlayer = (p: unknown): p is Player => {
  const o = p as Player;
  return !!o && typeof o === 'object' && typeof o.name === 'string' && ['liberal', 'cultista', 'lider'].includes(o.role) && typeof o.alive === 'boolean' && (o.ai === undefined || o.ai === true) && (o.level === undefined || LEVELS.includes(o.level)) && (o.mood === undefined || (typeof o.mood === 'number' && o.mood >= -1 && o.mood <= 1)) && (o.persona === undefined || PERSONAS.includes(o.persona));
};

/** A saved game, or null if it does not hold together. */
export function readGame(x: unknown): Game | null {
  const g = x as Game;
  if (!g || typeof g !== 'object' || !Array.isArray(g.players) || g.players.length < 1 || g.players.length > MAX_PLAYERS || !g.players.every(isPlayer)) return null;
  const n = g.players.length;
  if (!isLaws(g.deck) || !isLaws(g.discard) || !isLaws(g.hand) || !g.laws || !isInt(g.laws.L, WIN.L) || !isInt(g.laws.F, WIN.F)) return null;
  if (!PHASES.includes(g.phase) || !isIdx(g.pres, n) || !(g.chanc === null || isIdx(g.chanc, n)) || !(g.target === null || isIdx(g.target, n))) return null;
  if (!isInt(g.tracker, 2) || !isInt(g.reveal, n) || !(g.winner === null || isLaw(g.winner)) || typeof g.why !== 'string') return null;
  if (!(g.lastPres === null || isIdx(g.lastPres, n)) || !(g.lastChanc === null || isIdx(g.lastChanc, n)) || typeof g.vetoed !== 'boolean' || !(g.back === null || isIdx(g.back, n))) return null;
  if (!Array.isArray(g.seen) || !g.seen.every(i => isIdx(i, n))) return null;
  if (!Array.isArray(g.log) || !g.log.every(l => typeof l === 'string')) return null;
  if ((g.phase === 'vote' || g.phase === 'chancellor' || g.phase === 'veto') && g.chanc === null) return null;
  if (g.phase === 'investigated' && g.target === null) return null;
  if (!(g.drew === undefined || isLaws(g.drew)) || !(g.level === undefined || LEVELS.includes(g.level)) || !(g.train === undefined || ROLES.includes(g.train)) || !(g.pack === undefined || PACKS.includes(g.pack)) || !(g.region === undefined || (REGIONS.includes(g.region) && g.region !== 'mundo'))) return null;
  // the history came later: a game saved before it has none, and that is not damage
  const hist = g.hist === undefined ? [] : g.hist;
  if (!Array.isArray(hist) || !hist.every((e: Event) => !!e && typeof e === 'object' && typeof e.k === 'string')) return null;
  // the record of why the players run by the app decided (D16) is only for looking at: damaged, it is dropped, not the game
  const { trace, notes, noteDetails, ...rest } = g;
  return { ...rest, hist, ...(isTrace(trace, n) ? { trace } : {}), ...readNotes(notes), ...readNoteDetails(noteDetails) };
}
const isTrace = (x: unknown, n: number): x is Trace[] => Array.isArray(x) && x.every((t: Trace) => !!t && typeof t === 'object' && isIdx(t.seat, n) && typeof t.ask === 'string' && Number.isInteger(t.a) && Number.isInteger(t.at)
  && (t.hand === undefined || isLaws(t.hand)) && !!t.why && Array.isArray(t.why.text) && t.why.text.every(l => typeof l === 'string')
  && (t.why.rows === undefined || (Array.isArray(t.why.rows) && t.why.rows.every(r => !!r && isIdx(r.seat, n) && typeof r.f === 'number' && typeof r.h === 'number' && (r.v === undefined || typeof r.v === 'number')))));

/** How many finished games the device keeps (D23): the oldest go first. */
export const HISTORY_MAX = 30;
/** The finished games kept on the device, as they were read back: only finished games that hold together, the newest
 *  HISTORY_MAX. Anything else is dropped. */
export function readHistory(x: unknown): Saved[] {
  if (!Array.isArray(x)) return [];
  return x.flatMap((r: Saved) => {
    const game = r && typeof r === 'object' && Number.isFinite(r.at) ? readGame(r.game) : null;
    return game && game.phase === 'over' ? [{ at: r.at, game }] : [];
  }).slice(-HISTORY_MAX);
}
/** The file the games are exported as (D23): what app and version made it, when, and the games. */
export const historyFile = (games: Saved[], version: string | null, now: number): { app: string; format: 1; version: string | null; exported: number; games: Saved[] } =>
  ({ app: 'secret-cultist', format: 1, version, exported: now, games });

/** The person's notes (D12): seat → the party they marked; anything else is dropped. */
function readNotes(x: unknown): { notes?: Record<string, Law> } {
  if (!x || typeof x !== 'object') return {};
  const notes = Object.fromEntries(Object.entries(x as Record<string, unknown>).filter((e): e is [string, Law] => /^\d$/.test(e[0]) && isLaw(e[1])));
  return Object.keys(notes).length ? { notes } : {};
}
/** Read private notes independently of party marks; malformed optional fields never invalidate a game. */
function readNoteDetails(x: unknown): { noteDetails?: Record<string, NoteDetail> } {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return {};
  const entries = Object.entries(x).flatMap(([seat, value]) => {
    if (!/^\d$/.test(seat) || !value || typeof value !== 'object') return [];
    const v = value as Partial<NoteDetail>;
    return typeof v.reason === 'string' && (v.kind === 'fact' || v.kind === 'guess') ? [[seat, { reason: v.reason.slice(0, 280), kind: v.kind }]] : [];
  });
  return entries.length ? { noteDetails: Object.fromEntries(entries) } : {};
}
/** Everything saved, as it was read from the device. */
export function readState(x: unknown): AppState {
  const o = x && typeof x === 'object' ? (x as { names?: unknown; game?: unknown; theme?: unknown; look?: unknown; quiet?: unknown; stereo?: unknown; horror?: unknown; oracles?: unknown; ai?: unknown; level?: unknown; train?: unknown; assist?: unknown; pack?: unknown; notes?: unknown; noteDetails?: unknown; notesOpen?: unknown; live?: unknown; gauge?: unknown; coach?: unknown; speed?: unknown; flip?: unknown; region?: unknown; dlc?: unknown }) : {};
  const flags = Array.isArray(o.ai) ? o.ai : [];
  const seats = (Array.isArray(o.names) ? o.names : []).map((s, i) => ({ s, ai: flags[i] === true })).filter((x): x is { s: string; ai: boolean } => typeof x.s === 'string' && !!x.s.trim()).slice(0, MAX_PLAYERS);
  const names = seats.map(x => x.s.slice(0, NAME_MAX)), ai = seats.map(x => x.ai);
  return { v: 1, names, game: readGame(o.game), ...(typeof o.stereo === 'string' && STEREOTYPES[o.stereo] ? { stereo: o.stereo } : {}),   // D116
    ...(o.horror === 'pulp' || o.horror === 'purista' ? { horror: o.horror } : {}),   // D120
    ...(o.oracles === true ? { oracles: true as const } : {}),   // D144
 ...(ai.some(Boolean) ? { ai } : {}), ...(LEVELS.includes(o.level as Level) ? { level: o.level as Level } : {}), ...(ROLES.includes(o.train as Role) ? { train: o.train as Role } : {}), ...(o.assist === true ? { assist: true as const } : {}), ...(PACKS.includes(o.pack as Pack) ? { pack: o.pack as Pack } : {}), ...readNotes(o.notes), ...readNoteDetails(o.noteDetails), ...(o.notesOpen === true ? { notesOpen: true as const } : {}), ...(o.coach === true ? { coach: true as const } : {}), ...(o.gauge === true || o.live === true ? { gauge: true as const } : {}), ...((o as { rep?: unknown }).rep === true ? { rep: true as const } : {}), ...(o.flip === true ? { flip: true as const } : {}), ...(o.dlc === true ? { dlc: true as const } : {}), ...(REGIONS.includes(o.region as Region) && o.region !== 'mundo' ? { region: o.region as Region } : {}), ...(o.speed === 'lenta' || o.speed === 'rapida' ? { speed: o.speed } : {}), ...(o.theme === 'light' || o.theme === 'dark' ? { theme: o.theme } : {}), ...(o.look === 'deco' ? { look: o.look } : {}), ...(o.quiet === true ? { quiet: true as const } : {}) };
}

/** D104: one line per kept game, newest first, for the screen of past games: when, the theme, who won, and, with one
 *  person at the table, that person's role and whether that person won. */
export interface PastRow { at: number; pack: string; winner: Law | null; laws: { L: number; F: number }; role?: Role; won?: boolean; seats: number }
export function pastGames(all: Saved[]): { rows: PastRow[]; played: number; won: number } {
  const rows = [...all].reverse().map(({ at, game: g }) => {
    const people = g.players.map((p, i) => (p.ai ? -1 : i)).filter(i => i >= 0), me = people.length === 1 ? people[0] : -1;
    const role = me >= 0 ? g.players[me].role : undefined, won = role && g.winner ? (role === 'liberal') === (g.winner === 'L') : undefined;
    return { at, pack: g.pack || 'culto', winner: g.winner, laws: g.laws, seats: g.players.length, ...(role ? { role } : {}), ...(won !== undefined ? { won } : {}) };
  });
  const mine = rows.filter(r => r.won !== undefined);
  return { rows, played: mine.length, won: mine.filter(r => r.won).length };
}
