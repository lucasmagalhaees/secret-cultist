import { Core } from '../core';
import type { Ask, Game, Law, Level, NoteDetail, Pack, Region, Role, Theme } from '../core';
import { $, valOf } from './format';
import { buzz, later, reactions, sound } from './fx';
import { askLore, loadSheets, warmSheets } from './api';
import { tutTip, bigRoll, ballot, beat, blurField, bossWin, claimFx, freeze, swayOpen, swayReasonsShow, swayResult, swayClose, debateSheet, confetti, decree, clearFlash, flash, frozenFor, render, stamp, toast, powerEffect } from './render';
import { exportGames, keep, shareResult, wipe } from './history';
import { CLAIM_HOLD, S, dlcOn, packNow, packsOpen, SPEEDS, applyTheme, saveS, setS, ui } from './state';
import { login, logout, openKept, session } from './auth';
import { applyUpdate, checkNow } from './update';

/* ================= events =================
   One listener for every tap, by data-act; one for what is typed. Chance comes from Math.random here: the core only
   ever gets it as a function. */
// tests may fix the chance (ui.seed), so a run plays the same game every time, here and in CI (D68)
let seededFrom: number | undefined, seededRand: (() => number) | undefined;
const rand = (): number => {
  const seed = ui.seed ?? (globalThis as { __SEED?: number }).__SEED;
  if (seed === undefined) return Math.random();
  if (seededFrom !== seed) { seededFrom = seed; seededRand = Core.seeded(seed); }
  return (seededRand as () => number)();
};

/** A new game state: saved, and whatever was picked, opened or half-counted on screen is let go. The end of a game
 *  gets its confetti and its fanfare here, whatever ended it. */
/** D94: the sheets of a new game come from the API in the background; the game never waits for them (a seat without
 *  one rolls on its local sheet), and they are kept only if the same game is still on. */
let sheetsFor = '';
function fetchSheets(g: Game): void {
  const key = g.players.map(p => p.name).join('|');
  sheetsFor = key;
  loadSheets(g, rand, S.stereo).then(sh => {
    const cur = S.game;
    if (!cur || cur.sheets || cur.players.map(p => p.name).join('|') !== key) return;
    // D100: without sheets (the API down and none kept), Secret Cultist plays on without dice; it never turns into a
    // historical theme
    if (!sh) return;
    const me = cur.players.findIndex(p => !p.ai), carried = cur.campaign?.sheet && me >= 0 ? { [me]: cur.campaign.sheet } : {};   // D121: the person's sheet goes on
    setS({ ...S, game: Core.dealItems({ ...cur, sheets: { ...sh, ...carried } }, rand) }); saveS(); render();   // D115: and one item each
  }).catch(() => {});
}
function play(ended: Game, msg?: string, undo: Game | null = null): void {
  // D87: an app player has just investigated: it tells the table at once, so the envelope plays now, before the game
  // moves on to the next nomination (it used to arrive late and be cut off)
  for (let k = 0, from = S.game?.hist.length ?? 0; k < 6; k++) {
    // D88: the same for a government: the president and the chancellor run by the app say what they held at once
    const fresh = ended.hist.slice(from).some(e => e.k === 'inv' || e.k === 'gov' || e.k === 'veto' || e.k === 'peek'), bt = Core.botTurn(ended);
    if (!fresh || !bt || !ended.players[bt.seat]?.ai || !['pc', 'cc', 'inv', 'peek'].includes(bt.ask)) break;
    const n2 = Core.botStep(ended, rand); if (!n2 || n2 === ended) break; ended = n2;
  }
  // the notebook goes with the game when it ends (D28): scored at the end, and kept in the export
  ended = Core.olympusTell(Core.olympus(ended, rand, S.oracles));   // D144: the gods of Secret Leônidas
  ended = Core.chronicle(Core.aiFaith(Core.narrate(Core.tend(Core.springTrap(Core.sense(Core.giveStake(Core.setScene(ended, rand, S.horror as 'pulp' | 'classico' | 'purista' | undefined), rand)))))));   // D134: the chronicle   // D114: the person's Occult; D115: a trap at a key moment; D118: the story
  const next = ended.phase === 'over' && S.game?.phase !== 'over' ? { ...ended, ...(S.notes ? { notes: S.notes } : {}), ...(S.noteDetails ? { noteDetails: S.noteDetails } : {}) } : ended;
  const before = S.game, changed = next !== before;
  // an app player only spoke (a claim, a talk): the phase is the same, so what the person opened, picked or voted stays (D21)
  const spoke = !!before && changed && next.phase === before.phase && beat(next) === beat(before) && next.pres === before.pres && next.chanc === before.chanc;
  setS({ ...S, game: next }); saveS();
  if (next.pack === 'culto' && !next.sheets && next.phase !== 'over' && sheetsFor !== next.players.map(p => p.name).join('|')) fetchSheets(next);   // D94
  if (changed) { const q = Core.loreAsk(next); if (q) void askLore(q).then(t => { if (t && S.game) { const g2 = Core.retell(S.game, q.at, t); if (g2 !== S.game) { setS({ ...S, game: g2 }); saveS(); render(); } } }); }   // D137: the lore API, when it answers in time
  if (changed && !spoke) { ui.askOpen = false; ui.open = ''; ui.pick = null; ui.confirmEnd = false; ui.undo = undo; ui.votes = {}; }
  render();
  if (before && changed) {
    const power = next.hist.slice(before.hist.length).find(e => e.k === 'inv' || e.k === 'exec');
    // D74: at a table with app players the investigation plays once, when the investigator tells what it saw (the
    // envelope and the card together); passing the phone around, nobody tells, so the envelope plays now
    if (power && power.k === 'inv' && !Core.hasAi(next)) powerEffect(next, power.target, 'investigate');
    // D70: what an investigator told the table turns its card over on the screen
    const told = next.hist.findIndex((e, k) => e.k === 'inv' && (e.said === 'L' || e.said === 'F' || e.said === '-') && (k >= before.hist.length || (before.hist[k] as { said?: string }).said === undefined));
    const te = told >= 0 ? next.hist[told] : undefined;
    if (te && te.k === 'inv' && te.said) { const t = te, s = te.said, quick = next.hist.filter(e => e.k === 'inv' && e.said !== undefined).length > 1; freeze(frozenFor() + (quick ? 1400 : 2400)); setTimeout(() => claimFx(next, t.by, t.target, s, quick), Math.max(0, frozenFor())); }   // D85: shorter, and shorter still after the first
    // D66: an app player doubted what the person said: the debate opens, as for any accusation
    const me = next.players.findIndex(p => !p.ai), doubt = next.players.filter(p => !p.ai).length === 1 ? next.hist.findIndex((e, k) => k >= before.hist.length && e.k === 'talk' && e.say === 'acc' && e.about === me && e.by !== me) : -1;
    if (doubt >= 0 && ui.debate !== doubt) setTimeout(() => openDebate(doubt), 60);
  }
  if (msg && changed && !spoke) toast(msg);
  if (changed && next.phase === 'over' && before?.phase !== 'over' && next.winner) {
    keep(next);                                                              // kept on the device for export (D23)
    // D85: the end waits for the elimination screen: the fanfare told who it was before the card turned
    setTimeout(() => setTimeout(() => { const w = next.winner as Law; confetti(w); bossWin(next); sound(w === 'L' ? 'win' : 'lose'); buzz([60, 80, 60, 80, 200]); }, Math.max(0, frozenFor())), 0);
  }
  tick();
}

/* ---------- the players run by the app (D10) ----------
   When it is their turn, one step is played after `ui.think` ms, so the people at the table can follow it; then the
   next. Anything that happens meanwhile (a tap, an undo, a new game) changes S.game, and the step that was waiting is
   dropped. Seeing their own role takes no time. */
let botTimer: ReturnType<typeof setTimeout> | undefined;
/** D57: a debate on the accusation at `at`, on its own pages over the game, which waits. */
function openDebate(at: number): void {
  const g = S.game;
  if (ui.debate === at) return;
  if (!g || g.players.filter(p => !p.ai).length !== 1) return;
  ui.debate = at; clearTimeout(botTimer); runDebate();
}
let debateTimer: ReturnType<typeof setTimeout> | undefined;
function runDebate(): void {
  const g = S.game, at = ui.debate;
  clearTimeout(debateTimer);
  if (!g || at === null || at === undefined) return;
  debateSheet(g, at);
  const who = Core.debateNext(g, at), t = g.hist[at];
  const step = (next: Game): void => { if (S.game !== g || ui.debate !== at) return; setS({ ...S, game: next }); saveS(); runDebate(); };
  if (who >= 0 && g.players[who].ai) debateTimer = setTimeout(() => step(Core.debateBot(g, at, rand)), Math.min(1200, Math.max(300, ui.think ?? 900)));
  else if (who < 0 && t && t.k === 'talk' && !t.verdict) debateTimer = setTimeout(() => step(Core.debateVerdict(g, at, rand)), 500);
}
export function tick(): void {
  clearTimeout(botTimer);
  const g = S.game, t = g ? Core.botTurn(g) : null;
  if (!g || !t || (ui.debate !== null && ui.debate !== undefined)) return;   // the game waits while a debate is on (D57)
  if (document.querySelector('.narrator, .big-roll')) { botTimer = setTimeout(tick, 300); return; }   // D129: the app players wait for the reader of the story and of a roll (D130)
  if (frozenFor() > 0) { botTimer = setTimeout(tick, frozenFor() + 50); return; }   // and while an animation plays (D63)
  if (tutTip(g)) return;   // D89: and while a tutorial tip waits to be read
  botTimer = setTimeout(() => {
    if (S.game !== g) return;
    const next = Core.botStep(g, rand);
    if (next) botPlayed(g, next);
  }, t.ask === 'reveal' ? 0 : ui.think ?? SPEEDS[S.speed || 'normal'] + takeHold() + askHold(g, t.seat, t.ask) + (g.tut ? 1200 : 0));   // D89: the tutorial goes slower
}
/** D67: an app player who presides waits a moment before it nominates or investigates, while the person may still ask. */
const askHold = (g: Game, seat: number, ask: string): number => {
  const me = g.players.findIndex(p => !p.ai);
  if (me < 0 || g.players.filter(p => !p.ai).length !== 1 || !g.players[me].alive || !g.players[seat]?.ai) return 0;
  const asked = (() => { for (let i = g.hist.length - 1; i >= 0; i--) { const e = g.hist[i]; if (e.k === 'gov' || e.k === 'veto' || e.k === 'chaos') return false; if (e.k === 'ask' && e.by === me) return true; } return false; })();
  const open = !asked && (ask === 'nominate' || ask === 'investigate' || ask === 'execute');
  const used = g.hist.some(e => e.k === 'ask' && e.by === me);   // D88: the full wait only for someone who asks
  return open ? (used ? ASK_HOLD[S.speed || 'normal'] : ASK_SHORT[S.speed || 'normal']) : 0;
};
const ASK_HOLD = { lenta: 6000, normal: 4000, rapida: 2500 } as const;
const ASK_SHORT = { lenta: 3000, normal: 1800, rapida: 1000 } as const;
/** A claim was just told: the next step waits for it to be read (D21). Taken once. */
let hold = false;
const takeHold = (): number => { const h = hold; hold = false; return h ? CLAIM_HOLD[S.speed || 'normal'] : 0; };
/** What everyone notices when a vote is counted: the stamp, and the vibration when it elects. */
function voted(before: Game, next: Game, then: () => void = () => {}, shown = false): void {
  const e = [...next.hist].reverse().find(x => x.k === 'vote');
  const elected = !!e && e.k === 'vote' && e.ja.length * 2 > before.players.filter(p => p.alive).length;
  const land = (): void => { stamp(elected ? 'Eleito!' : 'Rejeitado!', elected ? 'L' : 'F'); sound('stamp'); if (elected) buzz([40, 60, 40]); then(); };
  // the votes open one by one at a little table first (D44): nothing (sound, stamp, the end of the game) gives the
  // result away before the last card turns (D45); taps wait meanwhile
  const wait = e && e.k === 'vote' && !shown ? ballot(next, e, elected, Math.min(450, Math.max(180, (SPEEDS[S.speed || 'normal'] || 1200) / 3))) : 0;
  if (!wait) { land(); return; }
  ui.busy = true;
  setTimeout(() => { ui.busy = false; land(); }, wait);
}
/** An app player did something: the same sounds and marks as when a person does it, and the line it adds to the log. */
function botPlayed(before: Game, next: Game): void {
  const told = Core.botTurn(before)?.ask;
  // an app player pointed a proof at the person (D40): the same CONTRADIÇÃO! the person gets
  // D60: any accusation against the person in this step opens the debate (a step may hold two lines of talk)
  const me = next.players.findIndex(p => !p.ai), hit = next.players.filter(p => !p.ai).length === 1 ? next.hist.findIndex((e, k) => k >= before.hist.length && e.k === 'talk' && e.say === 'acc' && e.about === me) : -1;
  if (hit >= 0) { setTimeout(() => openDebate(hit), 50); sound('stamp'); }
  hold = told === 'pc' || told === 'cc' || told === 'inv' || told === 'peek';
  const rest = (): void => afterBot(before, next);
  if (next.hist.length > before.hist.length && next.hist.slice(before.hist.length).some(e => e.k === 'vote')) { voted(before, next, rest); return; }
  rest();
}
function afterBot(before: Game, next: Game): void {
  if (next.phase === 'chancellor' && before.phase === 'president') sound('paper');
  gavelIf(before, next);
  const gone = next.players.findIndex((p, i) => !p.alive && before.players[i].alive);
  if (gone >= 0) { const ex = [...next.hist].reverse().find(e => e.k === 'exec'); flash(next.players[gone].name, next.players[gone].role === 'lider', ex?.k === 'exec' ? ex.why : ''); }
  // D70: what an app player says of another is not flashed at the foot (too quick to read): it stays in the Diary
  const talked = next.hist.length > before.hist.length && next.hist[next.hist.length - 1].k === 'talk';
  const line = next.log.length > before.log.length && !talked ? next.log[next.log.length - 1] : '';
  // the votes and what a government said are already on screen, at the top: no note at the foot for them
  play(next, next.phase === 'over' ? lawMsg(before, next) || next.why : line && !line.startsWith('Votos.') && !hold ? line : undefined);
}
/** A person voted at a table with app players: once every person still in the game has, the votes are counted. */
function myVote(i: number, yes: boolean): void {
  const g = S.game as Game;
  const again = ui.votes[i] === yes;   // D147: alone, the vote goes in at the second tap on the same choice
  ui.votes = { ...ui.votes, [i]: yes };
  const people = Core.humansAlive(g);
  if (people.length === 1 && again) count(g);
  else if (people.length === 1) render();
  else render();
}
/** D73: the vote in progress while the person may still turn one: the votes, what was said, the deadline. */
let swaying: { g: Game; base: Game; cast: [number, boolean][]; said: string[]; to: number | null; done: boolean; timer?: ReturnType<typeof setTimeout> } | null = null;
const SWAY_MS = 6000;
function count(g: Game): void {
  const solo1 = Core.humansAlive(g).length === 1 && Core.hasAi(g) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = solo1 ? Core.tallyVotes(g, ui.votes, rand) : null;
  if (t) {
    const alive = g.players.filter(p => p.alive).length, e = { k: 'vote' as const, pres: g.pres, chanc: g.chanc as number, ja: t.cast.filter(c => c[1]).map(c => c[0]) };
    const wait = ballot(g, e, e.ja.length * 2 > alive, Math.min(450, Math.max(180, (SPEEDS[S.speed || 'normal'] || 1200) / 3)), true);
    ui.busy = true;
    swaying = { g: t.g, base: g, cast: t.cast, said: [], to: null, done: false };
    const close = alive - 2 < 2 * e.ja.length && 2 * e.ja.length <= alive + 2, ms = close ? SWAY_MS : 2500;   // D88: one vote can turn it, or the window is short
    setTimeout(() => { if (!swaying) return; ui.busy = false; swayOpen(g, t.cast, ms); swaying.timer = setTimeout(swayEnd, ms); }, wait);
    return;
  }
  const next = Core.castVotes(g, ui.votes, rand);
  if (next === g) return;
  voted(g, next, () => { gavelIf(g, next); choose(g, next, next.phase === 'over' ? lawMsg(g, next) || next.why : next.log[next.log.length - 1]); });
}
/** The window to turn a vote closes: the votes count as they stand. */
function swayEnd(): void {
  const s = swaying;
  if (!s) return;
  swaying = null; clearTimeout(s.timer);
  const next = Core.commitVotes(s.g, s.cast, rand, s.said);
  swayClose();
  voted(s.base, next, () => { gavelIf(s.base, next); choose(s.base, next, next.phase === 'over' ? lawMsg(s.base, next) || next.why : next.log[next.log.length - 1]); }, true);
}
/** A public choice that can be taken back with "Desfazer" until something else happens. */
const choose = (before: Game, next: Game, msg?: string): void => play(next, msg, before);
const ERR = { name: 'Escreve um nome.', dup: 'Esse nome já está na mesa.', count: `A mesa vai de ${Core.MIN_PLAYERS} a ${Core.MAX_PLAYERS} jogadores.` };

/** Which seats of the table the app plays, one flag per name. */
const flags = (): boolean[] => S.names.map((_, i) => !!S.ai?.[i]);
function setTable(names: string[], ai: boolean[]): void {
  const next = { ...S, names };
  if (ai.some(Boolean)) next.ai = ai; else delete next.ai;
  setS(next); saveS();
}
function addName(): void {
  const r = Core.addName(S.names, valOf('#name'));
  blurField();
  if (!r.ok) { ui.msg = ERR[r.why]; render(); return; }
  setTable(r.names, [...flags(), false]); ui.msg = ''; ui.name = ''; render();
  $<HTMLInputElement>('#name')?.focus();
}
/** A table of n: seats of the app added, or the last ones taken away (D20). People are never taken away here: if
 *  there are more people than n, the message says to take someone out with ×. */
function addBots(n: number): void {
  let names = S.names, ai = flags();
  if (!ai.some(x => !x) && !valOf('#name').trim()) { ui.msg = 'Ponha o seu nome primeiro: a IA completa a mesa.'; render(); return; }
  if (valOf('#name').trim()) { const r = Core.addName(names, valOf('#name')); if (r.ok) { names = r.names; ai = [...ai, false]; ui.name = ''; } }
  blurField();
  while (names.length < n && names.length < Core.MAX_PLAYERS) { names = [...names, Core.botName(names, rand, packNow(), S.region)]; ai = [...ai, true]; }
  while (names.length > n && ai.lastIndexOf(true) >= 0) { const k = ai.lastIndexOf(true); names = names.filter((_, j) => j !== k); ai = ai.filter((_, j) => j !== k); }
  ui.msg = names.length > n ? `São ${names.length} pessoas na mesa: tire alguém pelo × para ficar com ${n}.` : '';
  setTable(names, ai); render();
}
/** Another theme (D12): the seats of the app get names of that theme; the people keep theirs. */
function setPack(pack: Pack | undefined, region: Region = S.region || 'mundo'): void {
  const ai = flags(), names: string[] = S.names.map((x, i) => (ai[i] ? '' : x));
  for (let i = 0; i < names.length; i++) if (ai[i]) names[i] = Core.botName(names.filter(Boolean), rand, pack, region);
  const next = { ...S, names };
  if (pack) next.pack = pack; else delete next.pack;
  if (region !== 'mundo') next.region = region; else delete next.region;
  setS(next); saveS(); render();
}
/** Quick game (D35): 7 seats, the person and 6 app players at the hard level, no assistance, a theme and a continent
 *  drawn at random (Brazil only once unlocked). The person keeps their name; the app players get names of the scene. */
/** A quick game (D35); after a game, "Mais uma" (D56) plays another one avoiding the role and the continent of the last. */
/** D89: the tutorial: you, liberal, and 6 app players at the easy level, the original theme, slower; tips at each step. */
function tutorial(): void {
  const me = S.names.find((_, i) => !S.ai?.[i]) || 'Você';
  let names = [me];
  while (names.length < 7) names = [...names, Core.botName(names, rand, 'culto', 'mundo')];
  clearFlash();
  const r = Core.newGame(names, rand, { ai: names.map((_, i) => i > 0), level: 'facil', train: 'liberal', pack: packNow(), region: 'mundo' });   // D98
  if (!r.ok) return;
  const next = { ...S }; delete next.notes; delete next.noteDetails; setS(next); saveS();
  ui.msg = ''; ui.help = false; ui.diary = false; ui.endTab = 'res'; play({ ...r.game, tut: [] }, 'Tutorial: siga as dicas.');
}
function quickGame(prev?: Game | null, only?: Pack, campaign?: NonNullable<Game['campaign']>): void {
  const me = S.names.find((_, i) => !S.ai?.[i]) || 'Você';
  const regions = Core.REGIONS.filter(r => r !== 'brasil' || dlcOn()), region = Core.freshPick(regions, prev?.region || (prev ? 'mundo' : undefined), rand);
  const lastRole = prev ? prev.players.find(p => !p.ai)?.role : undefined;
  const open = packsOpen(), pack = only && open.includes(only) ? only : open.length > 1 && !only ? open[Math.floor(rand() * open.length)] : open[0];   // D98, D108, D139: the public page plays only Secret Leônidas
  let names = campaign?.names?.length ? [...campaign.names] : [me];   // D121: a campaign keeps its table
  while (names.length < 7) names = [...names, Core.botName(names, rand, pack, region)];
  // the table set up by hand stays as it was: the quick game is built apart from it
  clearFlash();
  let r = Core.newGame(names, rand, { ai: names.map((_, i) => i > 0), level: 'dificil', pack, region });
  // the same role as last game comes back only now and then (D56): draw the roles again a few times
  for (let k = 0; lastRole && r.ok && r.game.players[0].role === lastRole && k < 4 && rand() >= Core.REPEAT_KEEP; k++) r = Core.newGame(names, rand, { ai: names.map((_, i) => i > 0), level: 'dificil', pack, region });
  if (!r.ok) return;
  const next = { ...S }; delete next.notes; delete next.noteDetails; delete next.assist; setS(next); saveS();
  ui.msg = ''; ui.help = false; ui.diary = false; ui.endTab = 'res'; play(campaign ? { ...r.game, campaign, ...(prev?.region ? { region: prev.region } : {}) } : r.game, campaign ? `Capítulo ${campaign.ch} de ${Core.CHAPTERS}. Veja seu papel em segredo.` : 'Partida rápida. Veja seu papel em segredo.');
}
/** D148: the daily challenge: the table, the roles and the deck come from the date, the same for everyone that day; the
 *  app players still decide as always. Hard level, the theme picked. */
function dailyGame(): void {
  const day = new Date(), date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const seed = Core.seeded(Core.dailySeed(date)), pack = packNow(), region = pack === 'esparta' ? 'mundo' : (rs => rs[Math.floor(seed() * rs.length)])(Core.REGIONS.filter(r => r !== 'brasil'));
  let names = ['Você'];
  while (names.length < 7) names = [...names, Core.botName(names, seed, pack, region)];
  const r = Core.newGame(names, seed, { ai: names.map((_, i) => i > 0), level: 'extremo', pack, region });
  if (!r.ok) return;
  const next = { ...S }; delete next.notes; delete next.noteDetails; setS(next); saveS();
  clearFlash(); ui.msg = ''; ui.help = false; ui.endTab = 'res';
  play({ ...r.game, daily: date }, `Desafio de ${date.split('-').reverse().join('/')}: veja seu papel em segredo.`);
}
function start(): void {
  if (S.names.length && flags().every(Boolean)) { ui.msg = 'Precisa de pelo menos uma pessoa na mesa.'; render(); return; }
  clearFlash();
  const r = Core.newGame(S.names, rand, { ai: flags(), level: S.level, train: S.train, pack: packNow(), region: S.region });
  if (!r.ok) { ui.msg = ERR[r.why]; render(); return; }
  if (S.notes || S.noteDetails) { const next = { ...S }; delete next.notes; delete next.noteDetails; setS(next); }     // a new game starts a clean notebook
  ui.msg = ''; ui.help = false; ui.diary = false; ui.endTab = 'res'; play(r.game, 'Jogo novo. Cada um vê seu papel em segredo.');
}
function lawMsg(before: Game, after: Game): string {
  const w = Core.words(after.pack, after.region);
  if (after.phase === 'over') return after.winner === 'L' ? 'Os liberais venceram!' : `Os ${w.fs} venceram!`;
  if (after.laws.F > before.laws.F) return `Lei ${w.f} aprovada.`;
  if (after.laws.L > before.laws.L) return 'Lei liberal aprovada.';
  return '';
}
/** A law went on the table (from a government or from the chaos): the gavel, and who made it over the screen. */
function gavelIf(before: Game, after: Game): void {
  if (after.laws.L + after.laws.F <= before.laws.L + before.laws.F) return;
  sound('gavel');
  const e = after.hist.slice(before.hist.length).reverse().find(x => x.k === 'gov' || x.k === 'chaos');
  if (e && (e.k === 'gov' || e.k === 'chaos')) decree(after, e);
}
/** The discarded card falls off the screen first; taps wait for it. */
function discard(then: () => void): void {
  ui.busy = true;
  document.querySelector('#phase .law.on')?.classList.add('toss');
  sound('paper');
  later(() => { ui.busy = false; then(); }, 380);
}
/** Whoever holds the phone puts it face down, or leaves the app: the secret closes by itself. */
function hide(why: string): void {
  if (!ui.open) return;
  ui.open = ''; ui.pick = null; render(); toast(why);
}
/** Notebook text stays on this device and is never sent to the table or a bot. */
function saveNote(seat: number, patch: Partial<NoteDetail>): void {
  const g = S.game, me = g?.players.findIndex(p => !p.ai);
  if (!g || !g.players[seat] || seat === me || g.phase === 'over') return;
  const detail: NoteDetail = { reason: '', kind: 'guess', ...S.noteDetails?.[seat], ...patch };
  setS({ ...S, noteDetails: { ...S.noteDetails, [seat]: detail } }); saveS();
}
type Orientation = { requestPermission?: () => Promise<string> };
let askedOrientation = false;
/** iPhones only report the phone's position after the person allows it, and only from a tap. */
function askOrientation(): void {
  if (askedOrientation || !S.flip) return;
  askedOrientation = true;
  const D = (window as unknown as { DeviceOrientationEvent?: Orientation }).DeviceOrientationEvent;
  if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => { /* refused: the screen just does not hide by itself */ });
}

export function initEvents(): void {
  warmSheets(S.region).catch(() => {});   // D99: keep sheets on the device while the API is up
  document.addEventListener('click', e => {
    // a tap outside the notebook closes it (D34), except on a wide screen, where it stays beside the game
    const tgt = e.target as HTMLElement;
    if (S.notesOpen && innerWidth < 1400 && !tgt.closest('#drawer, #notestoggle, [data-act=seatnote], #court, .court-back, #debate')) { const next = { ...S }; delete next.notesOpen; setS(next); saveS(); render(); }
    const b = tgt.closest<HTMLElement>('[data-act]'); if (!b || ui.busy || (frozenFor() > 0 && !b.closest('#debate'))) return;   // D63
    // Safari may leave a textarea focused when tapping a button. Commit its text and allow the repaint.
    blurField();
    const a = b.dataset.act, d = b.dataset, g = S.game, i = Number(d.i);
    if (a !== 'clear') ui.confirmClear = false;
    if (a !== 'wipe') ui.confirmWipe = false;                              // the second tap has to come right after the first
    if (a === 'addname') addName();
    else if (a === 'rmname') { setTable(S.names.filter((_, j) => j !== i), flags().filter((_, j) => j !== i)); ui.msg = ''; render(); }
    else if (a === 'addbot') addBots(S.names.length + (valOf('#name').trim() ? 2 : 1));
    else if (a === 'fill') addBots(Number(d.n));
    else if (a === 'level') { setS({ ...S, level: d.v as Level }); saveS(); render(); }
    else if (a === 'pack') setPack(d.v === 'classico' || d.v === 'vermelho' ? d.v : undefined);
    else if (a === 'login') {   // D138
      const email = valOf('#loginemail'), pw = valOf('#loginpass');
      ui.loginEmail = email;   // kept on the page when it repaints with an error
      if (!email.trim() || !pw) { ui.loginErr = 'Preencha o e-mail e a senha.'; render(); return; }
      ui.loginBusy = true; ui.loginErr = ''; blurField(); render();
      login(email, pw).then(() => openKept()).then(() => { ui.loginBusy = false; if (location.hash) history.replaceState(null, '', location.pathname + location.search); render(); }, (e: Error) => { ui.loginBusy = false; ui.loginErr = e.message; render(); });
    }
    else if (a === 'logout') void logout();
    else if (a === 'region') setPack(S.pack, (Core.REGIONS as string[]).includes(d.v || '') ? d.v as Region : 'mundo');   // the app seats take names of that continent (D24)
    else if (a === 'train') { const next = { ...S }; if (d.v) next.train = d.v as Role; else delete next.train; setS(next); saveS(); render(); }
    else if (a === 'rep') { const next = { ...S }; if (d.v === 'on') next.rep = true; else delete next.rep; setS(next); saveS(); render(); }
    else if (a === 'gauge') { const next = { ...S }; if (d.v === 'on') next.gauge = true; else delete next.gauge; setS(next); saveS(); render(); }
    else if (a === 'coach') { const next = { ...S }; if (d.v === 'on') next.coach = true; else delete next.coach; setS(next); saveS(); render(); }
    else if (a === 'speed') { const next = { ...S }; if (d.v === 'lenta' || d.v === 'rapida') next.speed = d.v; else delete next.speed; setS(next); saveS(); render(); }
    else if (a === 'assist') { const next = { ...S }; if (d.v === 'on') next.assist = true; else delete next.assist; setS(next); saveS(); render(); }
    else if (a === 'start') start();
    else if (a === 'quickgame' && !session()) quickGame(null, 'esparta');   // D139: the public page
    else if (a === 'quickgame') { const pk = packNow(); if (pk === 'culto' && ui.playMode === 'campanha') quickGame(null, 'culto', { ch: 1, scene: '', wins: { L: 0, F: 0 } }); else quickGame(null, pk); }   // D141: the theme from Tema do jogo
    else if (a === 'tutorial') tutorial();
    else if (a === 'tutok' && g && g.tut) { const k = d.v || ''; setS({ ...S, game: { ...g, tut: [...g.tut, k] } }); saveS(); render(); tick(); }   // D89
    else if (a === 'nextgame') quickGame(S.game, packNow());
    else if (a === 'gallery') { ui.gallery = !ui.gallery; render(); scrollTo(0, 0); }   // every drawing (D25)
    else if (a === 'exportgames') void exportGames();
    else if (a === 'faith' && S.game) { const me = S.game.players.findIndex(p => !p.ai); if (me >= 0 && Core.canFaith(S.game, me)) { ui.sheet = null; play(Core.faith(S.game, me, d.k === 'reza' ? 'reza' : 'estudo')); } }   // D126
    else if (a === 'steal' && S.game) { const g = S.game, me = g.players.findIndex(p => !p.ai), i = Number(d.i); if (Core.canSteal(g, me, i)) { ui.sheet = null; play(Core.steal(g, me, i, rand)); } }   // D115
    else if (a === 'stereo') { setS({ ...S, stereo: d.v && Core.STEREOTYPES[d.v] ? d.v : undefined }); saveS(); ui.stereoOpen = false; render(); }   // D116
    else if (a === 'oracles') { setS({ ...S, oracles: S.oracles ? undefined : true }); saveS(); render(); }   // D144
    else if (a === 'oracle' && S.game) { const g2 = Core.consult(S.game, rand); if (g2 !== S.game) { play(g2); if (g2.oracle) toast(g2.oracle.text); } }   // D144: Delphi
    else if (a === 'daily') dailyGame();   // D148
    else if (a === 'custom') { ui.custom = true; render(); }   // D147
    else if (a === 'askfold') { e.preventDefault(); ui.askOpen = !ui.askOpen; render(); }   // D147: the requests to the table, folded
    else if (a === 'hurry') { const was = ui.think; ui.think = 0; tick(); ui.think = was; }   // D145: the person does not want to wait
    else if (a === 'horror') { setS({ ...S, horror: d.v === 'pulp' || d.v === 'purista' ? d.v : undefined }); saveS(); render(); }   // D120
    else if (a === 'playmode') { ui.playMode = d.v === 'campanha' ? 'campanha' : 'avulsa'; render(); }   // D122
    else if (a === 'nextch' && g) { const c = Core.chapterAfter(g); if (c) quickGame(g, 'culto', c); }
    else if (a === 'stereoopen') { ui.stereoOpen = !ui.stereoOpen; render(); }
    else if (a === 'pastall') { ui.pastAll = true; render(); }   // D104
    else if (a === 'share' && g) { const w = Core.words(g.pack, g.region); void shareResult(g, g.players.findIndex(p => !p.ai), { boss: w.boss, f: w.f, theme: w.theme }); }
    else if (a === 'wipe') { if (ui.confirmWipe) { ui.confirmWipe = false; wipe(); } else ui.confirmWipe = true; render(); }
    else if (a === 'clear') { if (ui.confirmClear) { ui.confirmClear = false; ui.msg = ''; setTable([], []); } else ui.confirmClear = true; render(); }
    else if (a === 'flip') { const next = { ...S }; if (d.v === 'on') next.flip = true; else delete next.flip; setS(next); saveS(); render(); }
    else if (a === 'more') { ui.more = !ui.more; render(); }
    else if (a === 'rules') { ui.rules = !ui.rules; render(); }
    else if (a === 'theme') { const t = d.t as Theme | 'auto'; if (t === 'auto') delete S.theme; else S.theme = t; saveS(); applyTheme(); render(); }
    else if (a === 'look') { if (d.l === 'deco') S.look = 'deco'; else delete S.look; saveS(); applyTheme(); render(); }
    else if (a === 'fx') { if (d.v === 'off') S.quiet = true; else { delete S.quiet; buzz(30); sound('stamp'); } saveS(); render(); }
    else if (a === 'update') applyUpdate();
    else if (a === 'checkupdate') checkNow();
    else if (!g) return;
    else if (a === 'help') { ui.help = !ui.help; render(); tick(); }
    else if (a === 'allplays') { ui.allPlays = !ui.allPlays; render(); }
    else if (a === 'endtab') { ui.endTab = d.v === 'jogo' || d.v === 'log' ? d.v : 'res'; render(); scrollTo(0, 0); }
    else if (a === 'diary') { ui.diary = !ui.diary; if (ui.diary) { ui.talk = false; delete S.notesOpen; saveS(); } render(); const diary = $('#diary'); if (ui.diary && diary) diary.scrollTop = diary.scrollHeight; }
    else if (a === 'logfilter') { ui.logFilter = d.v === 'talk' || d.v === 'gov' ? d.v : 'all'; render(); }
    else if (a === 'seatnote') { ui.diary = false; const next = { ...S, notesOpen: true as const }; setS(next); saveS(); render(); document.getElementById(`note-row-${i}`)?.scrollIntoView({ block: 'center' }); }
    else if (a === 'notesopen') { ui.diary = false; ui.talk = false; ui.proof = false; const next = { ...S }; if (S.notesOpen) delete next.notesOpen; else next.notesOpen = true; setS(next); saveS(); render(); }
    else if (a === 'note') { const notes: Record<string, Law> = Object.fromEntries(Object.entries(S.notes || {}).filter(([k]) => k !== String(i))); if (d.v === 'L' || d.v === 'F') notes[i] = d.v; const next = { ...S }; if (Object.keys(notes).length) next.notes = notes; else delete next.notes; setS(next); saveS(); render(); }
    else if (a === 'notekind' && (d.v === 'fact' || d.v === 'guess')) { saveNote(i, { kind: d.v }); blurField(); render(); }
    else if (a === 'contraclose') document.getElementById('contra')?.remove();
    else if (a === 'darg' && ui.debate !== null && ui.debate !== undefined) { const next = Core.debateSay(g, ui.debate, d.v || '', rand); ui.dpick = []; ui.dmore = false; if (next !== g) { setS({ ...S, game: next }); saveS(); runDebate(); } }
    else if (a === 'dmore') { ui.dmore = true; runDebate(); }   // D103
    else if (a === 'dcombo') { const p = ui.dpick || [], v = d.v || ''; ui.dpick = p.includes(v) ? p.filter(x => x !== v) : [...p, v]; runDebate(); }   // D82
    else if (a === 'dall' && ui.debate !== null && ui.debate !== undefined) { const next = Core.debateSay(g, ui.debate, ui.dpick || [], rand); ui.dpick = []; ui.dmore = false; if (next !== g) { setS({ ...S, game: next }); saveS(); runDebate(); } }
    else if (a === 'tself') { ui.proof = !ui.proof; if (ui.proof) { ui.diary = false; delete S.notesOpen; saveS(); } render(); }
    else if (a === 'tproof') { const me = g.players.findIndex(p => !p.ai), next = Core.selfClaimProof(g, me, d.v || ''); ui.proof = false; const e = next.hist[next.hist.length - 1]; const re = e && e.k === 'self' ? e.re || [] : []; play(next, `Você disse que é liberal: ${re.filter(r => r[1] === 0).length} acreditam, ${re.filter(r => r[1] === 2).length} duvidam.`); reactions(re.map(r => r[1])); }
    else if (a === 'tpick') { const me = g.players.findIndex(p => !p.ai); ui.talk = false; play(Core.askTable(g, me, 'pick', me), 'Pedido feito a quem presidir.'); }
    else if (a === 'swayskip' && swaying) swayEnd();
    else if (a === 'swayto' && swaying && !swaying.done) { const s = swaying; s.to = i; const me = s.g.players.findIndex(p => !p.ai); swayReasonsShow(s.g, i, Core.swayReasons(s.g, me, i, s.cast)); clearTimeout(s.timer); s.timer = undefined; }   // D93: once a vote is picked the clock stops: the person chooses the reason at ease
    else if (a === 'swaysay' && swaying && !swaying.done && swaying.to !== null) { const s = swaying, me = s.g.players.findIndex(p => !p.ai), r = Core.sway(s.g, me, s.to as number, s.cast, d.v || '', rand); s.cast = r.cast; s.said = r.said; s.done = true; swayResult(s.g, s.to as number, r.flipped, r.roll); if (r.roll) bigRoll(r.roll, `Virar o voto de ${s.g.players[s.to as number].name}`, r.flipped ? 'Mudou o voto.' : 'Manteve o voto.');   /* D109 */ clearTimeout(s.timer); s.timer = setTimeout(swayEnd, r.roll ? 2800 : 1600); }
    else if (a === 'tkill') { const me = g.players.findIndex(p => !p.ai); play(Core.askTable(g, me, 'kill', i), `Você sugeriu eliminar ${g.players[i].name}.`); }
    else if (a === 'tavoid' || a === 'tinv') { const me = g.players.findIndex(p => !p.ai); ui.talk = false; play(Core.askTable(g, me, a === 'tavoid' ? 'avoid' : 'inv', i), 'Pedido feito à mesa.'); }
    else if (a === 'twhy') { const me = g.players.findIndex(p => !p.ai); ui.talk = false; play(Core.askWhy(g, me, i)); ui.diary = true; render(); }
    else if (a === 'tbloc') { const sel = ui.blocSel || []; ui.blocSel = sel.includes(i) ? sel.filter(x => x !== i) : sel.length < 3 ? [...sel, i] : sel; render(); }
    else if (a === 'tblocgo' && ui.blocSel?.length) { const me = g.players.findIndex(p => !p.ai), sel = ui.blocSel; ui.blocSel = []; ui.talk = false; const next = Core.formBloc(g, me, sel); play(next, (() => { const b = Core.blocOf(next, me); return b && b.yes.length ? `${b.yes.length} topou o bloco.` : 'Ninguém topou o bloco.'; })()); }
    else if (a === 'selfclaim') { const me = g.players.findIndex(p => !p.ai); play(Core.selfClaim(g, me), 'Você disse à mesa que é liberal.'); }
    else if (a === 'pleato') { ui.pleaTo = ui.pleaTo === i ? null : i; render(); }
    else if (a === 'plea' && ui.pleaTo !== null && ui.pleaTo !== undefined) { const me = g.players.findIndex(p => !p.ai), to = ui.pleaTo; ui.pleaTo = null; play(Core.plea(g, me, to, d.v === '1'), `Você pediu a ${g.players[to].name} para ${d.v === '1' ? 'aprovar' : 'barrar'} o governo.`); }
    else if (a === 'dopen') openDebate(i);
    else if (a === 'dlater') { ui.debate = null; document.getElementById('debate')?.remove(); render(); tick(); }   // D88: the accusation waits on its card
    else if (a === 'dclose') { ui.debate = null; document.getElementById('debate')?.remove(); render(); tick(); }
    else if (a === 'defend') { const me = g.players.findIndex(p => !p.ai), next = Core.defend(g, me, (['deck', 'test', 'lie', 'quiet'].includes(d.v || '') ? d.v : 'quiet') as 'deck' | 'test' | 'lie' | 'quiet'); const t = next.hist.find((e, k) => k < next.hist.length && e.k === 'talk' && e.def && !(g.hist[k] as { def?: string }).def); play(next, t && t.k === 'talk' && t.ok ? 'A defesa colou.' : 'A mesa não comprou a defesa.'); }
    else if (a === 'court') { ui.court = i; ui.courtProof = []; ui.evMore = false; ui.courtTone = undefined; render(); }
    else if (a === 'courtclose') { ui.court = null; render(); }
    else if (a === 'evmore') { ui.evMore = true; render(); }
    else if (a === 'sheet') { ui.sheet = i; render(); }   // D84: a player's sheet
    else if (a === 'sheetclose') { ui.sheet = null; render(); }
    else if (a === 'courtproof') { const p = ui.courtProof || []; ui.courtProof = p.includes(i) ? p.filter(x => x !== i) : [...p, i]; ui.courtTone = ui.courtProof.length ? 'proof' : 'firm'; render(); }   // D81: tap several to combo
    else if (a === 'courttone') { ui.courtTone = d.v === 'soft' || d.v === 'proof' ? d.v : 'firm'; render(); }
    else if (a === 'accuse' && ui.court !== null && ui.court !== undefined) {
      const me = g.players.findIndex(p => !p.ai), t = ui.court, picks = ui.courtProof || [], tone = ui.courtTone || (picks.length ? 'proof' : 'firm');
      const next = Core.accuse(g, me, t, tone, tone === 'proof' && picks.length ? picks : null, rand);
      ui.court = null; ui.undo = null; play(next, Core.accusationFeedback(next, next.hist.length - 1));
      const e = next.hist[next.hist.length - 1];
      if (e && e.k === 'talk' && e.re) reactions(e.re.map(r => r[1]));
      if (e && e.k === 'talk' && e.say === 'acc') { if (e.hit) { sound('stamp'); buzz([60, 40, 120]); } openDebate(next.hist.length - 1); }
    }
    else if (a === 'denounce') { ui.undo = null; const me = g.players.findIndex(p => !p.ai), next = Core.denounce(g, me, i, d.v === 'trust', rand); play(next, Core.accusationFeedback(next, next.hist.length - 1)); const t = next.hist[next.hist.length - 1]; if (t && t.k === 'talk' && t.re) reactions(t.re.map(r => r[1])); }
    else if (a === 'undo' && ui.undo) { const back = ui.undo; ui.undo = null; ui.votes = {}; setS({ ...S, game: back }); saveS(); render(); toast('Desfeito.'); tick(); }
    else if (a === 'open') { askOrientation(); ui.undo = null; ui.open = d.k || ''; ui.pick = null; buzz(25); render(); window.scrollTo(0, 0); }
    else if (a === 'hiderole') play(Core.revealNext(g));
    else if (a === 'nominate') choose(g, Core.nominate(g, i));
    else if (a === 'myvote') myVote(i, d.v === '1');
    else if (a === 'countvotes') count(g);
    else if (a === 'say') { const next = Core.say(g, i, d.w as Ask, Number(d.v)); play(next, next.log[next.log.length - 1]); }
    else if (a === 'elect') {
      const yes = d.v === '1', next = Core.vote(g, yes, rand);
      stamp(yes ? 'Eleito!' : 'Rejeitado!', yes ? 'L' : 'F'); sound('stamp'); if (yes) buzz([40, 60, 40]);
      gavelIf(g, next);
      choose(g, next, next.phase === 'over' ? lawMsg(g, next) : next.phase === 'president' ? 'Governo eleito.' : `Governo rejeitado.${lawMsg(g, next) ? ' ' + lawMsg(g, next) : ''}`);
    }
    else if (a === 'pick' || a === 'pickp') { ui.pick = Number(d.k ?? d.i); render(); }
    else if (a === 'pdiscard' && ui.pick !== null) { const k = ui.pick; discard(() => play(Core.presidentDiscard(g, k))); }
    else if (a === 'cdiscard' && ui.pick !== null) { const k = ui.pick; discard(() => { const next = Core.chancellorDiscard(g, k, rand); gavelIf(g, next); play(next, lawMsg(g, next)); }); }
    else if (a === 'askveto') play(Core.askVeto(g));
    else if (a === 'veto') { const next = Core.answerVeto(g, d.v === '1', rand); gavelIf(g, next); play(next, d.v === '1' ? `Veto aceito.${lawMsg(g, next) ? ' ' + lawMsg(g, next) : ''}` : 'Veto recusado.'); }
    else if (a === 'investigate') play(Core.investigate(g, i));
    else if (a === 'special') play(Core.specialElect(g, i), `${g.players[i].name} é o próximo presidente.`);
    else if (a === 'endpower') play(Core.endPower(g));
    else if (a === 'execute' && ui.pick !== null) {
      const t = g.players[ui.pick].name, next = Core.intimidate(Core.execute(g, ui.pick));   // D96
      flash(t, g.players[ui.pick].role === 'lider');   // D76: no shot sound: it gave the end away before the screen
      play(next, next.phase === 'over' ? lawMsg(g, next) : `${t} foi eliminado.`);
    }
    else if (a === 'again') start();
    else if (a === 'table' || (a === 'end' && ui.confirmEnd)) { ui.confirmEnd = false; ui.open = ''; ui.pick = null; ui.undo = null; setS({ ...S, game: null }); saveS(); render(); tick(); }
    else if (a === 'end') { ui.confirmEnd = true; render(); }
  });
  document.addEventListener('input', e => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'name') ui.name = t.value;
    if (t.matches('[data-note-reason]')) saveNote(Number(t.dataset.noteReason), { reason: t.value.slice(0, 280) });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.target as HTMLElement).id === 'name') addName(); });
  // a secret never stays on screen when the app goes to the background or the phone is put face down
  // D90: gestures on a phone: a long press on a seat opens its sheet; a sideways swipe opens or closes the notes
  let press: ReturnType<typeof setTimeout> | undefined, x0 = 0, y0 = 0;
  document.addEventListener('touchstart', e => {
    const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY;
    const seat = (e.target as Element).closest?.('[data-seat]') as HTMLElement | null;
    clearTimeout(press);
    if (seat && S.game) press = setTimeout(() => { ui.sheet = Number(seat.dataset.seat); render(); }, 550);
  }, { passive: true });
  document.addEventListener('touchmove', () => clearTimeout(press), { passive: true });
  document.addEventListener('touchend', e => {
    clearTimeout(press);
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0, g = S.game;
    if (!g || g.phase === 'over' || Math.abs(dx) < 90 || Math.abs(dy) > 40 || g.players.filter(p => !p.ai).length !== 1 || ui.debate != null || document.getElementById('court') || document.getElementById('sheet')) return;
    if ((dx < 0) !== !!S.notesOpen) { const next = { ...S }; if (S.notesOpen) delete next.notesOpen; else next.notesOpen = true; setS(next); saveS(); render(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide('Segredo escondido: o app saiu da tela.'); else warmSheets(S.region).catch(() => {}); });   // D105: back at the front, fresher sheets
  // face down closes a secret only when the person turned it on (D20): lying down, the phone looks face down too
  window.addEventListener('deviceorientation', e => { if (S.flip && e.beta !== null && Math.abs(e.beta) > 150) hide('Segredo escondido: o celular foi virado para baixo.'); });
}
