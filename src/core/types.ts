import type { Roll } from './dice';
/* The shapes of the data. Everything the app keeps, and everything the source sends once it has been read. */

/** What comes from outside (the source, a saved state): not ours and not documented, so it is read field by field. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export type Theme = 'light' | 'dark';
/** How fast the players run by the app act (D13). */
export type Speed = 'lenta' | 'normal' | 'rapida';
/** The theme of the game (D12): liberals against cultists (the original), or against reds. Same rules. */
export type Pack = 'classico' | 'vermelho' | 'culto';
/** Where the names of the app players come from (D24). */
/** 'brasil' is the unlockable expansion (D27): only offered once the password was typed. */
export type Region = 'mundo' | 'americas' | 'europa' | 'asia' | 'africa' | 'oceania' | 'brasil';
/** The style of the app: the 1930s poster (the default) or art deco. */
export type Look = 'poster' | 'deco';

/** A law card, and a party: L is liberal, F is cultist. */
export type Law = 'L' | 'F';
export type Party = Law;

/** What a player secretly is. Leader is a cultist; he knows who the cultist is only at a table of 5 or 6. */
export type Role = 'liberal' | 'cultista' | 'lider';

/** How well the players run by the app play (D10): easy, medium, hard, extreme. */
export type Level = 'facil' | 'medio' | 'dificil' | 'extremo';

/** `ai`: the seat is played by the app, not by a person at the table; `level`, a level of its own for that seat (the
 *  measurements use it to put one level against another; the app gives every seat the level of the game); `mood`, the
 *  temper of a player run by the app, from -1 (wary) to 1 (trusting), drawn at the start: two of them that know the same
 *  do not always vote the same. */
export interface Player { name: string; role: Role; alive: boolean; ai?: true; level?: Level; mood?: number; persona?: Persona }
/** The personality of a player run by the app (D26), drawn at the start and known to the whole table, as you know your
 *  friends: the straight one, the wary, the sceptic, the critic (wants proof), the centred, the bluffer, the chaotic. It
 *  says nothing about the role. */
export type Persona = 'certinho' | 'desconfiado' | 'cetico' | 'critico' | 'centrado' | 'blefador' | 'caotico';

/** Where the game is. The phases that show something secret are gated by the page: the phone goes to one person first. */
export type Phase =
  | 'reveal'        // each player, in turn, sees their own role
  | 'nominate'      // the president picks a chancellor
  | 'vote'          // the table votes on that government
  | 'president'     // the president draws 3 laws and discards 1
  | 'chancellor'    // the chancellor gets 2, discards 1 and the other is enacted
  | 'veto'          // from the 5th cultist law: the chancellor asked to veto both, the president answers
  | 'investigate'   // power: the president picks someone whose party they will see
  | 'investigated'  // the president sees that party
  | 'peek'          // power: the president sees the next 3 laws
  | 'special'       // power: the president picks the next president
  | 'execute'       // power: the president eliminates a player
  | 'over';

export type Winner = Party;

/** One thing that happened, by who did it (indexes in players): what the end-of-game summary is made from. An
 *  investigation keeps the party that was really seen, so the table can compare it with what the president said. */
export type Event =
  | Gov
  | { k: 'rej'; pres: number; chanc: number }
  | { k: 'chaos'; law: Law }
  | { k: 'inv'; by: number; target: number; party: Party; said?: Party | '-' }
  | { k: 'peek'; by: number; saw?: Law[]; said?: number }
  | { k: 'special'; by: number; target: number }
  | { k: 'exec'; by: number; target: number; role: Role; why?: string; intim?: RollLevel; atk?: Roll }
  /** D96: an app player read what someone told the table (Psychology against Persuasion): only it knows the verdict. */
  | { k: 'psy'; by: number; about: number; lie?: boolean; sure?: boolean; roll?: Roll; vs?: Roll; read?: boolean }
  /** D114: the person's Occult on a chancellor in the danger zone: only theirs. */
  /** D115: someone tried to steal another's item (Sleight of Hand against Spot Hidden); a trap came out and the table rolled. */
  | { k: 'steal'; by: number; from: number; ok: boolean; got: string; gave?: string; roll: Roll; vs: Roll }
  | { k: 'trap'; id: string; healer?: number; rolls: { seat: number; roll: Roll; loss: number; state?: string; sign?: boolean }[] }
  | { k: 'tend'; by: number; to: number; state: string; ok: boolean; round: number; roll: Roll }
  | { k: 'npc'; god: string }
  | { k: 'faith'; by: number; kind: 'reza' | 'estudo' }
  | { k: 'find'; seat: number; id: string }
  | { k: 'sense'; by: number; about: number; roll: Roll; boss?: boolean }
  /** D65: someone says its own side out loud; someone asks another for its vote on this government. */
  | { k: 'self'; by: number; proof?: string; power?: number; re?: [number, number][] }
  | { k: 'plea'; by: number; about: number; ja: boolean }
  /** D66: a request to whoever presides (pick me / do not pick someone / investigate someone), a question to an app
   *  player about its last vote, a voting bloc. */
  | { k: 'ask'; by: number; what: 'pick' | 'avoid' | 'inv' | 'kill'; who: number; power?: number }
  | { k: 'why'; by: number; about: number; say: string }
  | { k: 'bloc'; by: number; with: number[]; yes: number[] }
  | { k: 'vote'; pres: number; chanc: number; ja: number[] }
  | Talk;
/** What a player run by the app says about another between rounds (D13): it suspects them ('acc'), trusts them
 *  ('trust'), or keeps quiet ('quiet', about -1). The players run by the app do not weigh it: it is for the people. */
/** `re`: how the players run by the app took it, when a person said it (D26): seat and answer (REACT). */
export type Talk = { k: 'talk'; by: number; about: number; say: 'acc' | 'trust' | 'quiet'; stage?: 'campaign'; re?: [number, number][]; tone?: 'soft' | 'firm' | 'proof'; proof?: number; hit?: boolean; def?: Defense; ok?: boolean; deb?: DebLine[]; verdict?: [number, number][]; backfire?: boolean; proofs?: number[]; sharp?: number };
/** A line of a debate (D57): who spoke, the argument it chose, what it said and how strong it was by the record. */
export type DebLine = { who: number; id: string; text: string; power: number; roll?: Roll };
/** How the one accused answered (D40): the deck came like that, it was a chancellor test, the accuser lies, or silence. */
export type Defense = 'deck' | 'test' | 'lie' | 'quiet' | 'debate';
/** An elected government: the law it made (or a veto, with no law). `drew` are the 3 laws the president drew and `got`
 *  the 2 the chancellor got: secret at the time. `pc` and `cc` are what the president and the chancellor told the table
 *  afterwards, as the number of cultist laws (-1: they kept quiet). A 'vote' event exists only where the phone took
 *  every vote, at a table with players run by the app. */
export type Gov = { k: 'gov' | 'veto'; pres: number; chanc: number; law?: Law; drew?: Law[]; got?: Law[]; pc?: number; cc?: number };

/** Private notebook context, never passed to a bot's View. */
export interface NoteDetail { reason: string; kind: 'fact' | 'guess' }
/** D94: a Call of Cthulhu character sheet: each characteristic and skill (by its English name) with its value, and the
 *  native language. */
export type RollLevel = 'crit' | 'extreme' | 'hard' | 'ok' | 'fail' | 'fumble';
export interface Sheet { vals: Record<string, number>; native: string }
export interface Game {
  players: Player[];
  /** The draw pile, top first, and the discarded laws. */
  deck: Law[]; discard: Law[];
  /** Enacted laws of each kind. */
  laws: { L: number; F: number };
  phase: Phase;
  /** The president of this round, and the chancellor nominated (or elected), by index in players. */
  pres: number; chanc: number | null;
  /** After a special election: the president who called it; the order goes on from them. */
  back: number | null;
  /** The last government elected: neither may be chancellor next (with 5 or fewer alive, only the chancellor). */
  lastPres: number | null; lastChanc: number | null;
  /** Governments rejected (or vetoed) in a row: at the third, the top law is enacted by itself. */
  tracker: number;
  /** The president refused a veto in this government: the chancellor cannot ask again. */
  vetoed: boolean;
  /** Who has been investigated already: no one is investigated twice. */
  seen: number[];
  /** In 'reveal': whose turn it is to see their role. */
  reveal: number;
  /** The laws in the hand of the president (3) or of the chancellor (2). */
  hand: Law[];
  /** The 3 laws the president of this government drew (kept for the history). */
  drew?: Law[];
  /** How the players run by the app play; only at a table that has them. */
  level?: Level;
  /** Training: the role the person chose before the game (D11); absent when it was dealt at random. */
  train?: Role;
  /** The theme (D12); absent, the original one. */
  pack?: Pack;
  /** The continent of the names and of the animals (D24); absent, the whole world. */
  region?: Region;
  /** Every decision of the players run by the app, with its reason (D16). */
  trace?: Trace[];
  /** D94: the Call of Cthulhu sheet of each seat, from the source (by seat); a seat without one uses a local sheet. */
  sheets?: Record<number, Sheet>;
  /** D115: the item each seat got at the start (stealing changes hands on the record). */
  items?: Record<number, string>;
  /** D118: the scene of the story (Secret Cultist): the place and the god the cult serves. */
  scene?: string;
  /** D134: how far the chronicle has told the record, and the person's own thread (an index of STAKES). */
  chron?: number;
  stake?: number;
  /** D120: how heavy the horror is ('pulp', 'classico', 'purista'). */
  horror?: string;
  /** D121: the campaign this game is a chapter of. */
  campaign?: { ch: number; scene: string; wins: { L: number; F: number }; prev?: 'L' | 'F'; sheet?: Sheet; lost?: number; mythos?: number; item?: string; names?: string[] };
  /** D89: a tutorial game: the tips the person already read (present, even empty, means tutorial). */
  tut?: string[];
  /** The notebook of the one person at the table (D12), as it was when the game ended (D28): seat → the party marked. */
  notes?: Record<string, Law>;
  noteDetails?: Record<string, NoteDetail>;
  /** In 'investigated': who was investigated. */
  target: number | null;
  winner: Winner | null; why: string;
  /** What happened, in order, as the whole table may know it. */
  log: string[];
  /** The same, as data, with what was secret at the time (the end-of-game summary shows it). */
  hist: Event[];
}

/** Everything saved on the device (`secretcultist.v1`): the names of the last table (and which of them the app plays, `ai`), the level of the app's players, the role chosen for training (`train`), whether the minutes show who approved each law (`assist`), the person's notes on the game in course (`notes`, seat → party) and whether their side panel is open (`notesOpen`), whether the live suspicion shows (`live`), whether the trainer gives tips (`coach`), how fast the app's players act (`speed`), the game in course, the theme, the style and whether sound and vibration are off. */
export interface AppState { v: 1; names: string[]; game: Game | null; theme?: Theme; look?: Look; quiet?: true; ai?: boolean[]; level?: Level; train?: Role; assist?: true; gauge?: true; rep?: true; pack?: Pack; notes?: Record<string, Party>; noteDetails?: Record<string, NoteDetail>; notesOpen?: true; coach?: true; speed?: Speed; flip?: true; region?: Region; dlc?: true; stereo?: string; horror?: string }

/** A finished game kept on the device for export (D23): when it ended (ms since 1970) and the whole game. */
export interface Saved { at: number; game: Game }

/** An entry as the source describes it, once read by `normEntry`. */
export interface Entry { id: string; name: string; value: number }

/** What the judge asks a player run by the app (judge.ts), and the answers it accepts (`View.options`):
 *  - a seat: 'nominate', 'investigate', 'special', 'execute';
 *  - 1 or 0 (yes or no): 'vote', 'veto' (the president answering a veto);
 *  - the index of the law to throw away: 'pdiscard' (0 to 2), 'cdiscard' (0 or 1; 2 asks for a veto, when allowed);
 *  - what to tell the table, as a number of cultist laws: 'pc' (president, 0 to 3), 'cc' (chancellor, 0 to 2),
 *    'peek' (0 to 3); or a party, 'inv' (0 liberal, 1 cultist);
 *  - what to say between rounds, 'talk' (D13): 2 × seat to suspect that seat, 2 × seat + 1 to trust it, QUIET to keep
 *    quiet;
 *  - how it takes what was just said (the last talk in the history), 'react' (D26): REACT.agree, REACT.unsure or
 *    REACT.disagree. */
export type Ask = 'nominate' | 'vote' | 'pdiscard' | 'cdiscard' | 'veto' | 'investigate' | 'special' | 'execute' | 'pc' | 'cc' | 'inv' | 'peek' | 'talk' | 'react';

/** The history as one seat may know it: the secret parts (laws drawn and passed, a party seen, the laws spied, the role
 *  of who was eliminated) only where that seat saw them. */
export type Seen =
  | Gov
  | { k: 'rej'; pres: number; chanc: number }
  | { k: 'chaos'; law: Law }
  | { k: 'inv'; by: number; target: number; party?: Party; said?: Party | '-' }
  | { k: 'peek'; by: number; saw?: Law[]; said?: number }
  | { k: 'special'; by: number; target: number }
  | { k: 'exec'; by: number; target: number; why?: string; intim?: RollLevel; atk?: Roll }
  | { k: 'psy'; by: number; about: number; lie?: boolean; sure?: boolean; roll?: Roll; vs?: Roll; read?: boolean }
  /** D114: the person's Occult on a chancellor in the danger zone: only theirs. */
  /** D115: someone tried to steal another's item (Sleight of Hand against Spot Hidden); a trap came out and the table rolled. */
  | { k: 'steal'; by: number; from: number; ok: boolean; got: string; gave?: string; roll: Roll; vs: Roll }
  | { k: 'trap'; id: string; healer?: number; rolls: { seat: number; roll: Roll; loss: number; state?: string; sign?: boolean }[] }
  | { k: 'tend'; by: number; to: number; state: string; ok: boolean; round: number; roll: Roll }
  | { k: 'npc'; god: string }
  | { k: 'faith'; by: number; kind: 'reza' | 'estudo' }
  | { k: 'find'; seat: number; id: string }
  | { k: 'sense'; by: number; about: number; roll: Roll; boss?: boolean }
  | { k: 'self'; by: number; proof?: string; power?: number; re?: [number, number][] }
  | { k: 'plea'; by: number; about: number; ja: boolean }
  /** D66: a request to whoever presides (pick me / do not pick someone / investigate someone), a question to an app
   *  player about its last vote, a voting bloc. */
  | { k: 'ask'; by: number; what: 'pick' | 'avoid' | 'inv' | 'kill'; who: number; power?: number }
  | { k: 'why'; by: number; about: number; say: string }
  | { k: 'bloc'; by: number; with: number[]; yes: number[] }
  | { k: 'vote'; pres: number; chanc: number; ja: number[] }
  | Talk;

/** Why a player run by the app decided what it decided (D16), as it would explain it: sentences with {pN} for the
 *  name of seat N and the theme's words ({f}, {fs}, {boss}), and, when it compared options, each option with the
 *  chance it gave of that seat being on the hidden side (f), of being its leader (h), and the score it compared (v). */
export interface Why { text: string[]; rows?: { seat: number; f: number; h: number; v?: number }[] }
/** One decision of a player run by the app, with its reason (D16): who, what was asked, the answer, the laws in its
 *  hand when it was about them, and how far the history had gone. */
export interface Trace { seat: number; ask: Ask; a: number; at: number; hand?: Law[]; why: Why }

/** Everything one player run by the app gets to decide with, built by the judge (`viewOf`): what that person could know
 *  sitting at the table, and nothing more. `known` is the role of each seat as far as this player knows it (its own;
 *  the others only for a cultist, or for Leader at a small table); `hand` the laws in its hand, when the question is
 *  about them. */
export interface View {
  me: number; role: Role; level: Level; mood: number; persona: Persona;
  n: number; alive: boolean[]; known: (Role | null)[]; cultists: number;
  laws: { L: number; F: number }; tracker: number;
  pres: number; chanc: number | null; lastPres: number | null; lastChanc: number | null;
  phase?: Phase;
  ask: Ask; options: number[]; hand: Law[];
  /** D62: in a vote, the votes already cast at the table, in order, before this seat's turn (seat, Ja). */
  cast?: [number, boolean][];
  /** D65: in a vote, who asked this seat for its vote, and which (seat, Ja). */
  pleas?: [number, boolean][];
  hist: Seen[];
}
