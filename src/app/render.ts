import { Core } from '../core';
import type { Ask, Event, Game, Gov, Law, Level, Pack, Party, Persona, Region, Role, Talk } from '../core';
import type { ItemKey, TrapKey } from '../core/index';
import type { EndTab } from './state';
import { face, portrait, seal } from './art';
import { esc, part, themed } from './format';
import { thud } from './fx';
import { S, packNow, ui } from './state';
import { session } from './auth';
import { myPlays, myRolls, soloSeat, tellStory } from './overlay';
import { vGallery, vHistory, vLogin, vPack, vQuick, vRules, vAbout, vSettings, vTable, vTut, vYours } from './home';

/* ================= the screen =================
   Rendering is innerHTML from the state. Every text that did not come from the code goes through esc(). A field with
   the focus is left alone, so what the person is typing is never thrown away.
   Secrets (a role, the laws in a hand, a party, the next laws) are only drawn behind a gate: first the screen asks for
   the phone to go to one person, and only their tap opens it. The gate is closed again whenever the game moves on. */
/* What the last paint showed, so that only what just changed moves: the phase card slides in when the phase changes,
   a secret flips in when it is opened, and a law stamps onto the board when it is enacted. A tap that only picks a
   card repaints without moving anything. */
let seenPres = -1, seenChanc = -1, seenSeatsOf = '', seenPhase = '', seenOpen = '', seenLaws = { L: 0, F: 0 }, seenTracker = 0, seenHist = 0, seenDead = new Set<string>(), entering = false, flipping = false;

export function render(): void {
  const view = part('view'), active = document.activeElement;
  if (active && view.contains(active) && active.matches('input, textarea')) return;
  const g = S.game;
  if (!g) part('power-effect').hidden = true;
  P = (g ? g.pack || 'culto' : packNow()); R = (g ? g.region : S.region) || 'mundo'; W = Core.words(P, R);
  document.documentElement.dataset.pack = P;
  document.documentElement.dataset.region = R;              // the cards wear the continent's colours (D29)
  part('boss').textContent = P === 'culto' ? 'Cultist' : W.boss;   // D96: "Secret Cultist"
  document.title = `Secret ${P === 'culto' ? 'Cultist' : W.boss}`;   // D147: the tab and the home screen say the theme being played
  const me0 = g ? soloSeat(g) : -1, seen = g && me0 >= 0 && (g.phase !== 'reveal' || (g.reveal ?? 0) > me0);   // D131: playing alone, your role always on top
  part('score').innerHTML = g ? `${seen ? `<span class="chip me ${Core.partyOf(g.players[me0].role)}" id="myrole" title="O seu papel">Você: ${role(g.players[me0].role)}</span>` : ''}<span class="chip L">${g.laws.L}/${Core.WIN.L}</span><span class="chip F">${g.laws.F}/${Core.WIN.F}</span>` : '';
  const expanded = [...view.querySelectorAll<HTMLDetailsElement>('.note-detail[open]')].map(d => d.id);
  const diaryScroll = document.getElementById('diary')?.scrollTop ?? 0;
  const keep = document.getElementById('drawer')?.scrollTop ?? 0;   // repainting must not scroll the notebook back up
  const me = session();   // D138: nobody plays without logging in
  part('user').innerHTML = me ? `<span class="who" id="whoami" title="${esc(me.email)}">${esc(me.email.split('@')[0])}<i class="role ${me.role}">${me.role}</i></span><button class="btn ghost small" data-act="logout" id="logout">Sair</button>` : location.hash === '#painel' ? '<a class="btn ghost small" href="#" id="back">Voltar</a>' : '<a class="btn ghost small" href="#painel" id="painel">Painel</a>';
  if (!me && location.hash === '#painel') { view.innerHTML = vLogin(); afterPaint(null); return; }   // D139: the public page plays Secret Leônidas; #painel is the login
  view.innerHTML = themed(g ? vGame(g) : ui.gallery ? vGallery() : (me || ui.custom ? vQuick() + vPack() + vTable() + vRules() + vHistory() + vSettings() : vQuick() + vRules() + '<button class="btn ghost block" data-act="custom" id="custom">⚙ Personalizar: tema, mesa e opções</button>' + vAbout()), W as unknown as Record<string, string>);   // D147: the public home is short
  // D148: on a wide screen in landscape, the board, the players and the record go to a column of their own
  const wide = !!g && g.phase !== 'over' && matchMedia('(min-width: 1100px) and (orientation: landscape)').matches;
  view.classList.toggle('ingame', wide);
  if (wide) {
    const main = document.createElement('div'), side = document.createElement('div');
    main.className = 'col-main'; side.className = 'col-side';
    for (const el of [...view.children]) (['board', 'players', 'ata', 'log', 'chron', 'said', 'coach', 'oracle'].includes(el.id) ? side : main).appendChild(el);
    view.append(main, side);
  }
  for (const id of expanded) { const detail = document.getElementById(id); if (detail instanceof HTMLDetailsElement) detail.open = true; }
  const dr = document.getElementById('drawer'); if (dr) dr.scrollTop = keep;
  // the needle swings from where it was to the new reading (D32)
  const needle = view.querySelector<SVGGElement>('#gauge .needle');
  if (needle) { const to = Number(needle.dataset.to); requestAnimationFrame(() => { needle.style.transform = `rotate(${to}deg)`; }); gaugeAt = to; }
  const diary = document.getElementById('diary'); if (diary) diary.scrollTop = diaryScroll;
  if (g) myRolls(g);   // D109: the person's own rolls, big on the screen
  if (g) tellStory(g);   // D118: the narrator
  afterPaint(g);
}

/* ---------- D46: more motion, all of it about what the whole table already knows ----------
   Each effect only plays for what changed since the last paint of the same game; a page that is reloaded (or a game
   that is opened) shows how things are, without replaying anything. Overlays never take a tap (pointer-events:none)
   and nothing waits for them. With less motion asked, only what is still (the tension border) shows. */
const still = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
let fxGame: Game | null = null, fxHist = 0, landed: Law | null = null;
function afterPaint(g: Game | null): void {
  const root = document.documentElement;
  // rising tension: from the danger zone on, the border of the screen glows red, more with each cultist law
  if (g && g.phase !== 'over' && g.laws.F >= Core.LEADER_ZONE) root.dataset.tension = String(Math.min(g.laws.F, 5)); else delete root.dataset.tension;
  const same = !!g && !!fxGame && fxGame.players.length === g.players.length && fxGame.players.every((p, i) => p.name === g.players[i].name) && g.hist.length >= fxHist && fxGame.pack === g.pack;
  if (g && same) {
    for (const e of g.hist.slice(fxHist)) {
      if (e.k === 'chaos') chaosFx(e.law);
      else if (e.k === 'veto') tearFx();
      else if (e.k === 'special') ribbonFx(g, e.target);
    }
    if (landed) flyLaw(landed);
  }
  landed = null;
  fxGame = g; fxHist = g ? g.hist.length : 0;
}
/** D63: while an animation plays, taps wait (the debate and the elimination screen's own buttons excepted) and the app
 *  players wait too: nothing changes under an effect that is still on screen. */
export function freeze(ms: number): void { if (!still()) ui.frozen = Math.max(ui.frozen || 0, Date.now() + ms); }
export const frozenFor = (): number => Math.max(0, (ui.frozen || 0) - Date.now());
/** A layer over the screen for one effect; it never takes a tap and removes itself. */
function layer(cls: string, html: string, ms: number): HTMLElement {
  const el = document.createElement('div');
  el.className = `fxl ${cls}`; el.setAttribute('aria-hidden', 'true'); el.innerHTML = html;
  document.body.appendChild(el);
  freeze(ms);
  setTimeout(() => el.remove(), ms);
  return el;
}
/** A law was enacted: a card flies in from the middle of the screen, spins, and lands on its slot (or on the score at
 *  the top, when the board is off screen); the slot (and its power) lights up when it lands. */
function flyLaw(l: Law): void {
  const slot = document.querySelector<HTMLElement>(`#board .slot.${l}.new`);
  slot?.classList.add('lit');
  if (still() || !slot) return;
  const r = slot.getBoundingClientRect(), on = r.top >= 0 && r.bottom <= innerHeight;
  const to = on ? r : (document.querySelector(`#score .chip.${l}`) || slot).getBoundingClientRect();
  const el = layer('fly', `<div class="law ${l}"><span class="sym">${seal(l, P)}</span></div>`, 1000);
  const card = el.firstElementChild as HTMLElement;
  const dx = to.left + to.width / 2 - innerWidth / 2, dy = to.top + to.height / 2 - innerHeight / 2;
  card.style.setProperty('--dx', `${dx.toFixed(0)}px`); card.style.setProperty('--dy', `${dy.toFixed(0)}px`);
  setTimeout(() => { slot.classList.add('thud'); thud(); }, 800);
}
/** Three governments in a row without a law: the page shakes, the top law falls spinning, CAOS! flashes and the three
 *  rejection marks burst. */
function chaosFx(l: Law): void {
  if (still()) return;
  const v = part('view'); v.classList.remove('shake'); void v.offsetWidth; v.classList.add('shake');
  layer('chaos', `<div class="law ${l} fall"><span class="sym">${seal(l, P)}</span></div><b class="chaos-sign">Caos!</b><span class="burst-dots"><i></i><i></i><i></i></span>`, 1600);
}
/** A veto accepted: the two laws tear in half. Their faces are not shown: only the backs of the cards tear. */
function tearFx(): void {
  if (still()) return;
  const half = (k: number): string => `<div class="tear" style="--k:${k}"><i class="l"></i><i class="r"></i></div>`;
  layer('veto-fx', `${half(0)}${half(1)}<b class="chaos-sign">Veto!</b>`, 1500);
}
/** A special election: a ribbon crosses the screen with the name of the new president. */
function ribbonFx(g: Game, to: number): void {
  if (still()) return;
  layer('ribbon', `<div><b>Eleição especial</b><span>${name(g, to)}</span></div>`, 1700);
}
/** The president of the special election wears a sash in the seats strip for that round. */
function sashOf(g: Game): number {
  for (let i = g.hist.length - 1; i >= 0; i--) { const e = g.hist[i]; if (e.k === 'special') return e.target === g.pres ? e.target : -1; if (e.k === 'gov' || e.k === 'veto' || e.k === 'rej' || e.k === 'chaos') return -1; }
  return -1;
}
/** D70: an investigator told the table what it saw: the card of the side it named turns over, on the whole screen. It
 *  is only what was said (the investigator may lie), and the screen says so. */
/** D94: a d100 roll as the table sees it: the die, the skill and its value, and how it went. The die lands on its number
 *  with a short spin (rollDice), once per roll; the level then flashes: gold for a critical, green for a success, red
 *  shaking for a failure, cracked for a fumble. */
export type DiceRoll = { label: string; val: number; d: number; level: 'crit' | 'extreme' | 'hard' | 'ok' | 'fail' | 'fumble'; shaken?: boolean };
export const rolled = new Set<string>();
export function diceHtml(r: DiceRoll, key: string, mine = true): string {   // D128: only the person's own dice spin
  const good = r.level === 'crit' || r.level === 'extreme' || r.level === 'hard' || r.level === 'ok';
  return `<div class="dice ${r.level} ${good ? 'good' : 'bad'}${rolled.has(key) || !mine ? ' done' : ''}" data-key="${key}" data-d="${r.d}" aria-label="${esc(r.label)} ${r.val}: tirou ${r.d}, ${Core.ROLL_NAME[r.level]}"><b class="die" aria-hidden="true">${rolled.has(key) || !mine ? String(r.d).padStart(2, '0') : '??'}</b><span class="dice-txt"><small>🎲 d100 · ${esc(r.label)} ${r.val}${r.shaken ? ' · abalado' : ''}</small><strong>${Core.ROLL_NAME[r.level]}</strong></span></div>`;
}
export function rollDice(root: ParentNode): void {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll<HTMLElement>('.dice:not(.done)').forEach(el => {
    const key = el.dataset.key || '', d = Number(el.dataset.d), die = el.querySelector('.die') as HTMLElement;
    rolled.add(key);
    if (calm) { die.textContent = String(d).padStart(2, '0'); el.classList.add('done', 'land'); return; }
    el.classList.add('spin');
    let n = 0;
    const t = setInterval(() => { die.textContent = String(1 + ((d * 37 + n * 53) % 100)).padStart(2, '0'); if (++n >= 14) { clearInterval(t); die.textContent = String(d).padStart(2, '0'); el.classList.remove('spin'); el.classList.add('done', 'land'); } }, 55);
  });
}
export function claimFx(g: Game, by: number, target: number, said: 'L' | 'F' | '-', quick = false): void {
  // D74: one piece: the envelope with the name on it opens and the card comes out of it and turns to the side the
  // investigator named (or stays face down if it said nothing). Only what was said: it may be a lie.
  const role: Role = said === 'L' ? 'liberal' : 'cultista';
  const face = said === '-' ? '<div class="cf-front q"><span>?</span><small>Ficou calado</small></div>' : `<div class="cf-front ${said}">${portrait(role, P, R)}<span>${said === 'L' ? 'Liberal' : esc(W.F)}</span></div>`;
  layer(`claim-fx ${said === '-' ? 'q' : said}${quick ? ' quick' : ''}`, `<div class="cf-card"><small>${name(g, by)} investigou</small><div class="cf-env"><div class="cf-flip"><div class="cf-back"></div>${face}</div><div class="cf-body"><b>${name(g, target)}</b></div><div class="cf-flap"></div></div><em>${said === '-' ? 'Não disse o que viu.' : `${name(g, by)} diz que é ${said === 'L' ? 'liberal' : esc(W.f)}. Pode estar mentindo.`}</em></div>`, quick ? 1400 : 2400);
}
/** The words of the theme of what is on screen (D12): the game's, or before a game the one chosen at the table. */
export let P: Pack = 'culto', R: Region = 'mundo', W = Core.words();
export const role = (r: Role): string => (r === 'liberal' ? 'Liberal' : r === 'lider' ? W.boss : W.F);
export const party = (p: Law): string => (p === 'L' ? 'Liberal' : W.F);
const POWER_LABEL: Record<string, string> = { investigate: 'investiga', peek: 'espia', special: 'eleição', execute: 'elimina' };
/** The icon of each power on the board (D48). */
const POWER_ICON: Record<string, string> = { investigate: '🔍', peek: '👁', special: '🗳', execute: '✖', win: '★' };
/** D78: what the person playing alone knows for sure of each seat (its team by the rules, what it investigated):
 *  wherever a name shows, it shows in that side's colour with a small mark, so the person never mixes them up. */
let knownFor: Game | null = null, knownMap = new Map<number, ['L' | 'F', string]>();
function known(g: Game): Map<number, ['L' | 'F', string]> {
  if (knownFor === g) return knownMap;
  knownFor = g; knownMap = new Map();
  const me = solo(g);
  if (me < 0 || g.phase === 'over') return knownMap;
  for (const k of Core.knows(g, me)) { const j = g.players.findIndex(p => p.name === k.name); if (j >= 0) knownMap.set(j, ['F', k.role === 'lider' ? W.boss : W.F]); }
  for (const e of g.hist) if (e.k === 'inv' && e.by === me && e.party && !knownMap.has(e.target)) knownMap.set(e.target, [e.party, `🔍 ${e.party === 'L' ? 'Liberal' : W.F}`]);
  return knownMap;
}
export const name = (g: Game, i: number): string => {
  const k = g.players[i] ? known(g).get(i) : undefined, n = esc(g.players[i]?.name ?? '?');
  return k ? `<span class="kn ${k[0]}" title="${esc(k[1])}">${n}<i class="kn-tag">${esc(k[1])}</i></span>` : n;
};
/** The record of a seat, like a kill/death ratio: cultist laws it passed as president and as chancellor (all the table saw). */
export const kd = (g: Game, i: number): string => {
  let pr = 0, ch = 0;
  for (const e of g.hist) if (e.k === 'gov' && e.law === 'F') { if (e.pres === i) pr++; if (e.chanc === i) ch++; }
  return pr + ch ? `<i class="kd" title="Leis ${esc(W.fs)} que aprovou: ${pr} como presidente, ${ch} como chanceler" aria-label="${pr} como presidente, ${ch} como chanceler">${pr}P·${ch}C</i>` : '';
};
/** D90: a small badge for each seat, its initials on a colour of its own (never the colour of a side): faces to tell
 *  the seats apart at a glance. */
/** D92: the face of a seat, in one of three sizes (s 24, m 32, l 48; xl 64 on the full screens), with its state on it: a
 *  gold ring for the president, a light one for the chancellor, grey when out. Never the colour of a side. */
export const av = (g: Game, i: number, size: 's' | 'm' | 'l' | 'xl' = 'm'): string => {
  const p = g.players[i];
  if (!p) return '';
  const st = !p.alive ? ' out' : g.phase !== 'over' && i === g.pres ? ' pres' : g.phase !== 'over' && i === g.chanc ? ' chanc' : '';
  return `<i class="av av-${size}${st}" aria-hidden="true">${face(p.name, g.region || 'mundo', !p.ai)}</i>`;
};
export const AI_TAG = '<small class="ai">IA</small>';
/** What each level does, in a line (D10). */
export const LEVEL: Record<Level, [string, string]> = {
  facil: ['Fácil', 'Escolhe e vota sem pensar muitas vezes, esquece o que aconteceu há mais de cinco governos e acredita em quase tudo que ouve. Os {fs} mentem pouco.'],
  medio: ['Médio', 'Joga pelo próprio lado, lembra dos últimos governos e desconfia de vez em quando. Os {fs} mentem quando a verdade entrega.'],
  dificil: ['Difícil', 'Lembra de tudo e desconfia de história que não fecha. Os {fs} pensam em como a mesa vai ver cada jogada e armam para o {boss} parecer limpo.'],
  extremo: ['Extremo', 'Conta as cartas: sabe quantas leis de cada tipo ainda podem sair e calcula a chance de cada fala ser verdade. Nunca vê o papel de ninguém.']
};
export const law = (l: Law, k?: number): string => {
  const face = `<span class="sym">${seal(l, P)}</span><span>${l === 'L' ? '{law}' : '{lawF}'}</span>`;
  return k === undefined ? `<div class="law ${l}">${face}</div>`
    : `<button class="law ${l}${ui.pick === k ? ' on' : ''}" data-act="pick" data-k="${k}" aria-pressed="${ui.pick === k}">${face}</button>`;
};
/** The chancellor's card: one tap enacts it and throws the other away (no confirm button). */
const enactable = (l: Law, k: number): string => `<button class="law ${l}" data-act="enact" data-k="${k}" aria-label="Aprovar esta lei"><span class="sym">${seal(l, P)}</span><span>${l === 'L' ? '{law}' : '{lawF}'}</span></button>`;

/* ---------- the game ---------- */
function vGame(g: Game): string {
  const key = `${g.phase}:${beat(g)}:${g.reveal}`;
  entering = key !== seenPhase; seenPhase = key;
  // talk and claims happen beside the phase, not instead of it; while one goes on, a phase an app player holds still
  // shows that player deciding, never the gate of its secret (D21)
  const bot = Core.botTurn(g), under = Core.turn(g), side = ['pc', 'cc', 'inv', 'peek', 'talk'];
  const acting = bot && !side.includes(bot.ask) ? bot : under && under.ask !== 'votes' && g.players[under.seat]?.ai ? under : null;
  const phase = acting ? vBot(g, acting.seat, acting.ask) : vPhase(g);
  // what the person has to do comes first; what helps them decide (their claim, the trainer) right after it
  // your turn stands out (D34): the phase a person must act on glows; an app player's stays calm
  const mine = !acting && g.phase !== 'over' && !!under && !g.players[under.seat]?.ai && Core.hasAi(g);
  const head = entering ? ` data-head="${HEAD[acting ? 'bot' : g.phase] || ''}"` : '';
  const card = phase.replace('<section class="card', `<section${head} class="card${entering ? ' enter' : ''}${mine ? ' mine' : ''}`);
  if (g.phase === 'over') {
    // the end, in tabs (D18): the result first; the whole game and the record one tap away
    const tabs: [EndTab, string][] = [['res', 'Resultado'], ['jogo', 'Resumo'], ['log', 'Registro']];
    const bar = `<div class="segm endtabs" role="tablist" aria-label="Fim de jogo">${tabs.map(([k, l]) => `<button role="tab" id="tab-${k}" class="${ui.endTab === k ? 'on' : ''}" data-act="endtab" data-v="${k}" aria-selected="${ui.endTab === k}">${l}</button>`).join('')}</div>`;
    const body = ui.endTab === 'jogo' ? vSummary(g) + vAta(g) : ui.endTab === 'log' ? vLog(g) : vYours(g) + vHighlights(g) + vThoughts(g) + vNotesScore(g) + vReview(g) + vPlayers(g) + vBoard(g);
    return vTut(g) + card + bar + body + vDock(g);
  }
  return vUndo() + vStatus(g) + vSeats(g) + vMeters(g) + vChron(g) + vSaid(g) + vHelp(g) + vTut(g) + card + vClaims(g) + vCoach(g) + vOracle(g) + vWatching(g) + vPlayers(g) + vBoard(g) + vAta(g) + vLog(g) + `<section class="card"><button class="btn ghost block" data-act="end">${ui.confirmEnd ? 'Toque de novo para encerrar o jogo' : 'Encerrar jogo'}</button></section>` + vDock(g);
}
/** The headline of each phase, printed on the page that turns in (D46). */
const HEAD: Record<string, string> = { reveal: 'Papéis', nominate: 'Nova rodada', vote: 'Votação', president: 'Sessão legislativa', chancellor: 'Sessão legislativa', veto: 'Veto', investigate: 'Poder', peek: 'Poder', special: 'Poder', execute: 'Poder', over: 'Fim de jogo', bot: 'Vez da IA' };
/** A player run by the app is deciding: the screen says who and what, and shows nothing secret. */
const DOING: Record<string, string> = {
  reveal: 'está vendo o próprio papel', nominate: 'está escolhendo o chanceler', votes: 'A mesa está votando', pdiscard: 'está olhando as 3 leis',
  cdiscard: 'está olhando as 2 leis', veto: 'está decidindo se aceita o veto', investigate: 'está escolhendo quem investigar',
  see: 'está olhando em segredo', special: 'está escolhendo o próximo presidente', execute: 'está escolhendo quem eliminar'
};
function vBot(g: Game, seat: number, ask: string): string {
  const who = ask === 'votes' ? '' : `${av(g, seat, 'l')}<b>${name(g, seat)}</b> ${AI_TAG} `;
  return `<section class="card" id="phase"><span class="label">Vez da IA</span><p class="big thinking" id="thinking">${who}${DOING[ask]}<span class="dots-wait" aria-hidden="true"><i></i><i></i><i></i></span></p>${vAskNow(g, seat, ask)}${ask === 'reveal' ? '' : '<button class="linkbtn" data-act="hurry" id="hurry">⏩ não esperar</button>'}</section>`;
}
/** D67: while an app player presides and is choosing, the person can ask it right there, before it decides: pick me,
 *  do not pick someone (nomination), investigate someone (investigation). The app player waits a moment for it. */
function vAskNow(g: Game, seat: number, ask: string): string {
  const me = solo(g);
  if (me < 0 || !g.players[me].alive || !g.players[seat]?.ai || (ask !== 'nominate' && ask !== 'investigate' && ask !== 'execute')) return '';
  if (ask === 'execute') {   // D73: point at who you want out, with the reason the record gives, and how strong it is
    const rows = Core.killReasons(g, me).filter(r => Core.canAsk(g, me, 'kill', r.who));
    if (!rows.length) return g.hist.slice(-6).some(e => e.k === 'ask' && e.by === me) ? '<p class="asknow-done">Sugestão feita. Pesa pela prova e pelo quanto confiam em você.</p>' : '';
    const pw = (p: number): string => p >= 0.45 ? '<i class="pw f">forte</i>' : p >= 0.2 ? '<i class="pw w">fraca</i>' : '<i class="pw w">—</i>';
    return `<div class="asknow" id="asknow"><b>Aponte quem você quer fora, e por quê</b>${rows.map(r => `<button class="krow" data-act="tkill" data-i="${r.who}"><span><b>${name(g, r.who)}</b><small>${esc(r.text)}</small></span>${pw(r.power)}</button>`).join('')}<small>${name(g, seat)} decide em alguns segundos. Pesa pela prova e pelo quanto confia em você.</small></div>`;
  }
  const others = g.players.map((_, i) => i).filter(i => i !== me && i !== seat && g.players[i].alive);
  const chip = (what: 'avoid' | 'inv', i: number): string => `<button data-act="${what === 'avoid' ? 'tavoid' : 'tinv'}" data-i="${i}">${name(g, i)}</button>`;
  const done = g.hist.slice(-6).some(e => e.k === 'ask' && e.by === me);
  if (ask === 'nominate') {
    const pick = Core.canAsk(g, me, 'pick', me), avoid = others.filter(i => Core.canAsk(g, me, 'avoid', i));
    if (!pick && !avoid.length) return done ? '<p class="asknow-done">Pedido feito. Pesa pelo quanto confiam em você.</p>' : '';
    return `<details class="asknow" id="asknow"${ui.askOpen ? ' open' : ''}><summary data-act="askfold">💬 Falar com a mesa antes que ${name(g, seat)} escolha</summary>${pick ? '<button class="tbtn" data-act="tpick" id="askpick">🙋 “Me indica para chanceler”</button>' : ''}${avoid.length ? `<small>Não indicar:</small><div class="chips">${avoid.map(i => chip('avoid', i)).join('')}</div>` : ''}</details>`;
  }
  const inv = others.filter(i => Core.canAsk(g, me, 'inv', i));
  if (!inv.length) return done ? '<p class="asknow-done">Pedido feito. Pesa pelo quanto confiam em você.</p>' : '';
  return `<details class="asknow" id="asknow"${ui.askOpen ? ' open' : ''}><summary data-act="askfold">💬 Sugerir quem ${name(g, seat)} deve investigar</summary><div class="chips">${inv.map(i => chip('inv', i)).join('')}</div></details>`;
}
/** The person at a table with app players was eliminated: the game plays on to the end, for them to watch. */
const vWatching = (g: Game): string => Core.hasAi(g) && g.phase !== 'over' && !Core.humansAlive(g).length
  ? '<section class="card" id="watching"><p class="hint">Você saiu do jogo. As IAs jogam até o fim; no fim, todos os papéis aparecem.</p></section>' : '';
/** What a person at a table with app players may tell the table (the app players hear it and weigh it). */
function vClaims(g: Game): string {
  if (!Core.hasAi(g)) return '';
  const cards = Core.humansAlive(g).flatMap(i => Core.claims(g, i).map(w => vClaim(g, i, w)));
  return vDefense(g) + cards.join('');
}
/** Accused by an app player (D40): answer the table. Each answer is checked against the record everyone saw. */
function vDefense(g: Game): string {
  const me = solo(g), at = me >= 0 && g.players[me].alive ? Core.pendingAccusation(g, me) : -1;
  if (at < 0 || document.getElementById('contra')) return '';
  const t = g.hist[at] as Extract<Game['hist'][number], { k: 'talk' }>;
  const plays = myPlays(g, me, t.proof !== undefined && t.proof !== null && t.proof < 100000 ? t.proof : -1);
  const opts: [string, string][] = [['deck', 'O baralho veio assim'], ['test', 'Foi teste do chanceler'], ['lie', `${g.players[t.by].name} está mentindo`], ['quiet', 'Ficar calado']];
  return `<section class="card defense" id="defense"><span class="label">Você foi acusado</span><p><b>${name(g, t.by)}</b> ${t.hit ? 'apontou uma prova contra você' : t.tone === 'proof' ? 'diz ter uma prova contra você' : 'desconfia de você'}. Como você responde?</p><button class="btn block" data-act="dopen" data-i="${at}" id="dopen">Responder no debate</button><div class="pick">${opts.map(([k, l]) => `<button class="btn ghost" data-act="defend" data-v="${k}">${esc(l)}</button>`).join('')}</div><p class="hint">A mesa confere a resposta com a ata: defesa que bate tira o peso da acusação.</p>${plays}</section>`;
}
const CLAIM: Record<string, [string, string[]]> = {
  pc: ['Você foi presidente. O que diz que tirou?', ['3 liberais', '1 {f} e 2 liberais', '2 {fs} e 1 liberal', '3 {fs}']],
  cc: ['Você foi chanceler. O que diz que recebeu?', ['2 liberais', '1 {f} e 1 liberal', '2 {fs}']],
  inv: ['Você investigou. O que diz que viu?', ['Liberal', '{F}']],
  peek: ['Você espiou. O que diz que vem?', ['3 liberais', '1 {f} e 2 liberais', '2 {fs} e 1 liberal', '3 {fs}']]
};
function vClaim(g: Game, seat: number, w: Ask): string {
  const [q, opts] = CLAIM[w], many = Core.humansAlive(g).length > 1;
  return `<section class="card claim" id="claim-${w}"><span class="label">Diga à mesa${many ? ` · ${name(g, seat)}` : ''}</span><p>${q}</p><div class="pick">${opts.map((o, v) => `<button class="btn ghost" data-act="say" data-w="${w}" data-i="${seat}" data-v="${v}">${o}</button>`).join('')}</div><button class="btn ghost block" data-act="say" data-w="${w}" data-i="${seat}" data-v="-1">Não falar nada</button><p class="hint">Pode mentir. As IAs ouvem e comparam com o que sabem.</p></section>`;
}
/** Taking back the last public choice (a nomination, a vote result), while nothing else has happened since. */
/** The undo button is gone (D34): the person found it useless. */
const vUndo = (): string => '';

/** What to do in each phase, for whoever is holding the phone. */
const HELP: Record<string, string> = {
  reveal: 'Cada um vê o próprio papel sozinho. Passe o celular para a pessoa indicada; ela toca em "mostrar", lê e esconde antes de passar adiante.',
  nominate: 'O presidente escolhe quem vai ser o chanceler. O último governo eleito não pode voltar como chanceler.',
  vote: 'Todo mundo vota ao mesmo tempo, em voz alta: {ja} (sim) ou {nein} (não). Mais {ja} que {nein} elege. Marque o resultado aqui.',
  president: 'Só o presidente olha: ele tira 3 leis, descarta 1 e passa as outras 2 para o chanceler. Pode mentir sobre o que tirou.',
  chancellor: 'Só o chanceler olha: das 2 leis, toque na que vai ser aprovada; a outra vai pro lixo. A partir da 5ª lei {f} dá para pedir veto.',
  veto: 'O chanceler quer descartar as duas leis. Se o presidente aceitar, nenhuma lei entra e conta como governo rejeitado.',
  investigate: 'O presidente escolhe alguém e vai ver, em segredo, o partido dessa pessoa. Depois conta (ou não) para a mesa.',
  investigated: 'Só o presidente olha o partido. O {boss} aparece como {f}.',
  peek: 'Só o presidente olha as 3 próximas leis do baralho, na ordem. Elas continuam lá.',
  special: 'O presidente escolhe quem é o próximo presidente. Depois dessa rodada, a ordem volta a partir de quem convocou.',
  execute: 'O presidente elimina alguém. Se for o {boss}, os liberais vencem. O papel de quem sai não é revelado.',
  over: 'Fim de jogo. Na aba Resumo, cada governo, inclusive o que cada investigação mostrou de verdade.'
};
const HELP_AI: Record<string, string> = {
  vote: 'Cada pessoa toca no próprio voto; as IAs votam junto, e todos os votos aparecem. Mais {ja} que {nein} elege; empate rejeita.',
  reveal: 'Cada pessoa vê o próprio papel sozinha. As IAs já sabem o delas, e só o delas (um {f} também sabe quem é do time).'
};
function vHelp(g: Game): string {
  const text = (Core.hasAi(g) && HELP_AI[g.phase]) || HELP[g.phase];
  return `<div class="help"><button class="helpbtn" data-act="help" aria-expanded="${ui.help}" aria-controls="helptext"><b aria-hidden="true">${ui.help ? '✕' : '?'}</b>${ui.help ? 'Fechar a explicação' : 'Como funciona esta fase'}</button>${ui.help ? `<p class="helptext" id="helptext">${text}${Core.hasAi(g) ? ` IA no nível ${LEVEL[g.level || 'medio'][0].toLowerCase()}.` : ''}</p>` : ''}</div>`;
}

/** The game, round by round, at the end: who governed, which law came out, and what was secret then. */
function vSummary(g: Game): string {
  const n = (i: number): string => `<b>${name(g, i)}</b>`, pl = (p: Party): string => `<span class="role ${p}">${p === 'L' ? 'liberal' : W.f}</span>`;
  const cards = (ls?: Law[]): string => (ls || []).map(l => `<i class="mini ${l}">${l}</i>`).join('');
  const told = (x: number | undefined): string => x === undefined ? '' : x < 0 ? 'calado' : `disse ${x}F`;
  const hands = (e: Gov): string => e.drew && e.drew.length ? `<small class="hands">tirou ${cards(e.drew)}${told(e.pc) ? ` (${told(e.pc)})` : ''} · passou ${cards(e.got)}${told(e.cc) ? ` (${told(e.cc)})` : ''}</small>` : '';
  const line = (e: Event): string => {
    switch (e.k) {
      case 'gov': return `<li class="gov ${e.law}">${n(e.pres)} + ${n(e.chanc)} aprovaram lei ${pl(e.law as Law)}${hands(e)}</li>`;
      case 'rej': return `<li class="rej">${n(e.pres)} + ${n(e.chanc)} rejeitados</li>`;
      case 'veto': return `<li class="rej">${n(e.pres)} + ${n(e.chanc)} vetaram as duas leis${hands(e)}</li>`;
      case 'vote': case 'talk': case 'self': case 'plea': case 'ask': case 'why': case 'bloc': return '';
      case 'chaos': return `<li class="gov ${e.law}">Caos: entrou lei ${pl(e.law)}</li>`;
      case 'inv': return `<li class="inv">${n(e.by)} investigou ${n(e.target)}: era ${pl(e.party)}${e.said && e.said !== '-' ? `<small class="hands">disse ${e.said === 'L' ? 'liberal' : W.f}${e.said !== e.party ? ' — mentiu' : ''}</small>` : ''}</li>`;
      case 'peek': return `<li>${n(e.by)} espiou as próximas 3 leis${e.saw ? `<small class="hands">viu ${cards(e.saw)}${e.said !== undefined && e.said >= 0 ? ` (disse ${e.said}F)` : ''}</small>` : ''}</li>`;
      case 'special': return `<li>${n(e.by)} convocou eleição especial para ${n(e.target)}</li>`;
      case 'psy': case 'sense': return '';   // D96, D114: a reading is private
      case 'steal': return `<li>${n(e.by)} ${e.ok ? `pegou ${esc(Core.ITEMS[e.got as ItemKey]?.name || e.got)} de` : 'foi pego tentando roubar'} ${n(e.from)}</li>`;
      case 'npc': return `<li>🕯️ ${esc(Core.NPCS[e.god as keyof typeof Core.NPCS]?.[0] || '')} chegou e cuidou da mesa</li>`;
      case 'find': return `<li>${esc(Core.RARES[e.id as keyof typeof Core.RARES]?.[0] || '')} ${n(e.seat)} achou ${esc(Core.RARES[e.id as keyof typeof Core.RARES]?.[1] || '')}</li>`;
      case 'tend': return `<li>🩹 ${n(e.by)} cuidou de ${n(e.to)}${e.ok ? '' : ' (sem sucesso)'}</li>`;
      case 'trap': return `<li class="trap">🕯️ ${esc(Core.TRAPS[e.id as TrapKey]?.name || e.id)}: ${e.rolls.filter(x => x.loss > 0).length} perderam sanidade</li>`;
      case 'faith': return `<li>${n(e.by)} ${e.kind === 'reza' ? 'rezou pela mesa' : 'estudou o inimigo'}</li>`;
      default: return `<li class="exec">${n(e.by)} eliminou ${n(e.target)} (${role(e.role)})</li>`;
    }
  };
  return `<section class="card" id="summary"><span class="label">Resumo da partida</span>${g.hist.length ? `<ol class="timeline">${g.hist.map(line).join('')}</ol>` : '<p class="hint">Nada aconteceu.</p>'}</section>`;
}

/** Who governs now, always in view: the president, the chancellor (or who is nominated) and the rejections in a row. */
function vStatus(g: Game): string {
  if (g.phase === 'reveal' || g.phase === 'over') return '';
  const chanc = g.chanc === null ? '—' : name(g, g.chanc);
  return `<div class="status" id="status"><span><small>Presidente</small><b>${name(g, g.pres)}</b></span><span><small>${g.phase === 'vote' ? 'Indicado' : 'Chanceler'}</small><b>${chanc}</b></span><span><small>Rejeições</small><b>${g.tracker}/${Core.TRACKER_MAX}</b></span></div>`;
}
function vBoard(g: Game): string {
  const fresh = { L: g.laws.L > seenLaws.L ? g.laws.L - 1 : -1, F: g.laws.F > seenLaws.F ? g.laws.F - 1 : -1 };
  landed = fresh.F >= 0 ? 'F' : fresh.L >= 0 ? 'L' : null;
  seenLaws = { ...g.laws };
  const slots = (p: Law): string => Array.from({ length: Core.WIN[p] }, (_, i) => {
    const pw = i + 1 === Core.WIN[p] ? 'win' : p === 'F' ? Core.powerAt(g, i + 1) || '' : '';
    const filled = g.laws[p] > i, tag = pw === 'win' ? 'vitória' : POWER_LABEL[pw] || '', next = !filled && g.laws[p] === i && g.phase !== 'over';
    // an empty slot shows the icon of what it unlocks; the next slot of each track is marked (D48)
    return `<div class="slot ${p}${filled ? ' on' : ''}${next ? ' next' : ''}${fresh[p] === i ? ' new' : ''}"${tag ? ` title="${tag}" aria-label="${tag}"` : ''}>${filled ? seal(p, P) : pw ? `<i class="pw" aria-hidden="true">${POWER_ICON[pw]}</i>` : ''}</div>`;   // D86: icons only, the word on a long press
  }).join('');
  const dots = Array.from({ length: Core.TRACKER_MAX }, (_, i) => `<i class="${g.tracker > i ? 'on' : ''}"></i>`).join('');
  const last = g.hist[g.hist.length - 1], chaosNow = g.hist.length > seenHist && last?.k === 'chaos';
  const bump = g.tracker > seenTracker || chaosNow;
  seenTracker = g.tracker; seenHist = g.hist.length;
  return `<section class="card" id="board"><span class="label">Leis liberais</span><div class="track" style="--n:${Core.WIN.L}">${slots('L')}</div>
    <span class="label">Leis {fs}</span><div class="track" style="--n:${Core.WIN.F}">${slots('F')}</div>
    ${lawLine(g)}<div class="meta"><span>Rejeições seguidas <span class="dots${bump ? ' bump' : ''}" id="tracker">${dots}</span></span><span>Baralho: ${g.deck.length} · Lixo: ${g.discard.length}</span></div></section>`;
}
function vPlayers(g: Game): string {
  const dead = new Set(g.players.filter(p => !p.alive).map(p => p.name)), fresh = [...dead].filter(x => !seenDead.has(x));
  seenDead = dead;
  const kit = noteKit(g), notes = S.notes || {}, me = solo(g);
  // at the end the roles turn over one by one, the liberals first and the hidden side last, the leader at the very end
  const rank = (r: Role): number => (r === 'liberal' ? 0 : r === 'lider' ? 2 : 1);
  const order = g.players.map((_, i) => i).sort((a, b) => rank(g.players[a].role) - rank(g.players[b].role) || a - b), unveil = g.phase === 'over' && entering;
  const live = S.gauge && me >= 0 && g.phase !== 'over' && g.phase !== 'reveal' ? new Map(liveSuspicion(g, me).map(x => [x.seat, x.f])) : null;
  const meter = (i: number): string => { const f = live?.get(i); return f === undefined ? '' : `<span class="meter" title="Quanto ${esc(g.players[i].name)} desconfia de você agora"><i style="width:${Math.round(f * 100)}%"></i><b>${pct(f)}</b></span>`; };
  return `<section class="card" id="players"><span class="label">Jogadores</span>${live ? `<p class="hint">A barra é quanto cada IA desconfia de você agora.</p>${vCrux(g, me, 'live')}` : ''}<ul class="names">${g.players.map((p, i) => {
    const tag = g.phase === 'over' ? `<span class="role ${Core.partyOf(p.role)}${unveil ? ' unveil' : ''}" style="--k:${order.indexOf(i)}">${role(p.role)}</span>` : i === g.pres ? '<span class="tag">Pres.</span>' : i === g.chanc ? '<span class="tag">Chanc.</span>' : '';
    const mark = kit && i !== kit.me ? notes[i] || '' : '';
    return `<li class="${p.alive ? '' : 'dead'}${fresh.includes(p.name) ? ' struck' : ''}${mark ? ` ${mark}` : ''}"><span class="who">${av(g, i)}<button class="name-btn" data-act="sheet" data-i="${i}" aria-label="Ficha de ${esc(p.name)}">${name(g, i)}</button>${p.ai ? AI_TAG : ''}${kit && i !== kit.me ? '' : kd(g, i)}${p.alive ? '' : ' <small>(eliminado)</small>'} ${tag}${g.phase === 'over' && p.persona ? ` <small class="persona" title="${PERSONA_W[p.persona][1]}">${PERSONA_W[p.persona][0]}</small>` : ''}</span>${meter(i)}${kit ? kit.cell(i, false) : ''}</li>`;
  }).join('')}</ul></section>`;
}
/** The live suspicion (D14), worked out once per state of the game: the same state paints many times. */
let liveCache: { key: string; rows: { seat: number; f: number }[] } | null = null;
/** The suspicion meter (D32, D37): like an oil gauge, a needle from 0 to 100 with how much the app players suspect the person
 *  now, on average (the same reckoning as the bars beside each name). Only alone at the table; the switch is here and in the settings. */
let gaugeAt = -90;
function vMeters(g: Game): string {
  const me = solo(g);
  if (g.phase === 'reveal' || g.phase === 'over') return '';
  // one switch for the whole suspicion meter (D37) and one for the reputation stars (D43), here and in the settings
  const sw = (act: string, id: string, on: boolean, name: string): string => `<button class="live-toggle" data-act="${act}" data-v="${on ? 'off' : 'on'}" aria-pressed="${on}" id="${id}">${name}: ${on ? 'ligado' : 'desligado'}</button>`;
  const toggle = `<div class="meter-toggles">${me >= 0 ? sw('gauge', 'gaugetoggle', !!S.gauge, '👁 Desconfiança') : ''}${sw('rep', 'reptoggle', !!S.rep, '★ Reputação')}</div>`;
  if (me < 0 || !S.gauge) return toggle;
  const rows = liveSuspicion(g, me), v = rows.length ? rows.reduce((a, r) => a + r.f, 0) / rows.length : 0, deg = -90 + 180 * v;
  const word = v < 0.35 ? 'tranquilo' : v < 0.6 ? 'de olho' : 'na mira';
  return `<div class="gauge" id="gauge" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}" aria-label="Desconfiança"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M10 62 A50 50 0 0 1 43 15" stroke="#3aa05a" stroke-width="10" fill="none"/><path d="M43 15 A50 50 0 0 1 77 15" stroke="#e8b730" stroke-width="10" fill="none"/><path d="M77 15 A50 50 0 0 1 110 62" stroke="#d63c2b" stroke-width="10" fill="none"/><g class="needle" data-to="${deg.toFixed(1)}" style="transform:rotate(${gaugeAt.toFixed(1)}deg)"><path d="M60 62 L58 20 L60 14 L62 20Z" fill="currentColor"/></g><circle cx="60" cy="62" r="5" fill="currentColor"/></svg><span><small>Desconfiança</small><b>${pct(v)}</b> ${word}</span></div>${toggle}`;
}
function liveSuspicion(g: Game, me: number): { seat: number; f: number }[] {
  const key = `${g.log.length}:${g.hist.length}:${g.players.map(p => `${p.name}${p.alive ? 1 : 0}`).join()}`;
  if (!liveCache || liveCache.key !== key) liveCache = { key, rows: Core.suspicion(g, me) };
  return liveCache.rows;
}
/** One moment of the game, told from the point of view of `me` (D15): what the whole table saw happen. */
export function moment(g: Game, i: number, me: number): string {
  const e = g.hist[i], who = (j: number): string => (j === me ? 'você' : `<b>${name(g, j)}</b>`);
  const lawW = (l?: Law): string => (l === 'L' ? 'liberal' : '{f}');
  const of3 = (n: number): string => (n === 0 ? '3 liberais' : n === 3 ? '3 {fs}' : n === 1 ? '1 {f} e 2 liberais' : '2 {fs} e 1 liberal');
  const of2 = (n: number): string => (n === 0 ? '2 liberais' : n === 2 ? '2 {fs}' : '1 {f} e 1 liberal');
  if (!e) return '';
  if (e.k === 'gov' || e.k === 'veto') {
    const what = e.k === 'veto' ? 'vetaram as duas leis' : `saiu lei ${lawW(e.law)}`;
    const said = [e.pc !== undefined && e.pc >= 0 ? `${who(e.pres)} disse que tirou ${of3(e.pc)}` : '', e.cc !== undefined && e.cc >= 0 ? `${who(e.chanc)} disse que recebeu ${of2(e.cc)}` : ''].filter(Boolean).join(' e ');
    const head = e.pres === me ? `Você foi presidente com ${who(e.chanc)}` : e.chanc === me ? `Você foi chanceler de ${who(e.pres)}` : `${who(e.pres)} e ${who(e.chanc)} governaram`;
    return `${head}: ${what}${said ? `, e ${said}` : ''}.`;
  }
  if (e.k === 'chaos') return `A lei ${lawW(e.law)} que entrou pelo caos.`;
  if (e.k === 'inv') {
    const said = e.said && e.said !== '-' ? (e.said === 'L' ? 'liberal' : '{f}') : '';
    if (e.target === me) return `${who(e.by)} usou o poder de investigar e viu o seu partido (a investigação mostra o partido de verdade, não o que você fez)${said ? `, e disse que você é ${said}` : ''}.`;
    return `${who(e.by)} investigou ${who(e.target)}${said ? ` e disse que é ${said}` : ''}.`;
  }
  if (e.k === 'exec') return `${who(e.by)} eliminou ${who(e.target)}.`;
  return '';
}
/** The crucial point (D15), for a person on the hidden side: the moment that raised the suspicion on them the most. */
function vCrux(g: Game, me: number, mode: 'end' | 'live'): string {
  if (g.players[me].role === 'liberal') return '';
  const c = mode === 'live' ? liveCrux(g, me) : Core.crux(g, me, 'end');
  if (!c) return '';
  const e = g.hist[c.at], mine = !!e && ((e.k === 'gov' || e.k === 'veto') ? e.pres === me || e.chanc === me : e.k === 'inv' ? e.target === me : false);
  const why = mine ? '' : '<p class="hint">Não foi uma jogada sua: quando outros parecem limpos, sobra desconfiança para quem ainda não se mostrou.</p>';
  return `<div class="crux" id="crux-${mode}"><small>${mode === 'live' ? 'O que mais fez a desconfiança subir até agora' : 'O ponto crucial: o que mais fez a desconfiança subir'}</small><p>${moment(g, c.at, me)}</p><b>${pct(c.before)} → ${pct(c.after)}</b>${why}</div>`;
}
let cruxCache: { key: string; c: ReturnType<typeof Core.crux> } | null = null;
function liveCrux(g: Game, me: number): ReturnType<typeof Core.crux> {
  const key = `${g.log.length}:${g.hist.length}:${g.players.map(p => `${p.name}${p.alive ? 1 : 0}`).join()}`;
  if (!cruxCache || cruxCache.key !== key) cruxCache = { key, c: Core.crux(g, me, 'live') };
  return cruxCache.c;
}
/** The one person at a table with app players, or -1. */
export const solo = (g: Game): number => { const p = g.players.map((x, i) => (x.ai ? -1 : i)).filter(i => i >= 0); return Core.hasAi(g) && p.length === 1 ? p[0] : -1; };
const pct = (x: number): string => `${Math.round(x * 100)}%`;
/** The trainer's tips (D13): what a careful player could work out from the person's own seat, after each government. */
/** D144: the oracle of Delphi in Secret Leônidas with the gods on: the button while it may be asked, then the answer. */
function vOracle(g: Game): string {
  if (g.oracle) return `<section class="card oracle" id="oracle"><span class="label">Oráculo de Delfos</span><p>${esc(g.oracle.text)}</p></section>`;
  return Core.canConsult(g) ? `<section class="card oracle" id="oracle"><button class="btn block" data-act="oracle" id="oracleask">🏛 Consultar o oráculo de Delfos (uma vez)</button></section>` : '';
}
function vCoach(g: Game): string {
  const me = solo(g);
  if (!S.coach || me < 0 || !g.players[me].alive || g.phase === 'reveal' || g.phase === 'over') return '';
  const c = Core.coach(g, me), tips: string[] = [];
  if (c.odds) {
    const of = (n: number): string => (n === 0 ? '3 liberais' : n === 3 ? '3 {fs}' : n === 1 ? '1 {f} e 2 liberais' : '2 {fs} e 1 liberal');
    tips.push(`${name(g, c.odds.who)} disse que tirou ${of(c.odds.said)}. Pelas leis que ainda podem sair, a chance disso era de <b>${pct(c.odds.p)}</b>.${c.odds.p < 0.2 ? ' É pouco: desconfie.' : ''}`);
  }
  if (c.test) tips.push('O presidente passou uma {f} e uma liberal dizendo que tirou 2 liberais: <b>teste do chanceler</b>. Um liberal faz isso para ver o que o chanceler aprova, e um {f} pode se esconder atrás disso. O que o chanceler aprovou diz mais que o teste.');
  if (c.clash) tips.push('A história do último governo <b>não fecha</b>: o que o presidente disse que passou não bate com o que o chanceler disse que recebeu (ou com a lei que saiu). Alguém ali mentiu.');
  if (c.suspects.length) tips.push(`Pelas contas, com o que só você sabe: ${c.suspects.map(x => `<b>${name(g, x.seat)}</b> ${pct(x.f)}${x.boss >= 0.2 ? ` (${pct(x.boss)} de ser o {boss})` : ''}`).join(', ')} de chance de serem {fs}.`);
  if (g.players[me].role !== 'liberal') tips.push(`Como a mesa te vê, pelo que todos viram: <b>${pct(c.seen)}</b> de chance de você ser {f}.${c.seen >= 0.5 ? ' Cuidado: você está na mira.' : ''}`);
  return tips.length ? `<section class="card coach" id="coach"><span class="label">Dica do treinador</span>${tips.map(t => `<p>${t}</p>`).join('')}</section>` : '';
}
/** At the end (D13): how much each app player that did not know the person's role suspected them, law by law. A small
 *  line per player (one series each: no legend needed), the last value beside it. Tooltips on the points. */
let thoughtsCache: { key: string; html: string } | null = null;
/** At the end, with assistance on (D19): for each person at the table, the plays that were clearly good and clearly
 *  bad, the heaviest first. With assistance off, a button to turn it on. Worked out once per finished game. */
let reviewCache: { key: string; plays: Map<number, ReturnType<typeof Core.review>> } | null = null;
export const SHOW = 4;
function vReview(g: Game): string {
  const people = g.players.map((p, i) => (p.ai ? -1 : i)).filter(i => i >= 0);
  if (!people.length || !g.hist.length) return '';
  if (!S.assist) return `<section class="card" id="review"><span class="label">Suas jogadas</span><p class="hint">Com a assistência ligada, o app aponta as jogadas boas e ruins de cada pessoa na mesa.</p><button class="btn ghost block" data-act="assist" data-v="on" id="reviewon">Ver jogadas boas e ruins</button></section>`;
  const key = `${g.log.length}:${g.hist.length}:${g.players.map(p => p.name).join()}`;
  if (!reviewCache || reviewCache.key !== key) reviewCache = { key, plays: new Map(people.map(i => [i, Core.review(g, i)])) };
  const one = people.length === 1;
  return people.map(i => {
    const all = reviewCache?.plays.get(i) || [], open = ui.allPlays;
    const pick = (good: boolean): ReturnType<typeof Core.review> => all.filter(x => x.good === good).sort((a, b) => b.weight - a.weight || a.at - b.at);
    const list = (xs: ReturnType<typeof Core.review>, good: boolean): string => xs.length
      ? `<ul class="plays ${good ? 'good' : 'bad'}">${(open ? xs : xs.slice(0, SHOW)).map(x => `<li>${whyText(g, x.text)}</li>`).join('')}</ul>`
      : `<p class="hint">${good ? 'Nenhuma que se destacou.' : 'Nenhuma jogada claramente ruim.'}</p>`;
    const good = pick(true), bad = pick(false), more = good.length > SHOW || bad.length > SHOW;
    return `<section class="card review" id="review${one ? '' : `-${i}`}"><span class="label">${one ? 'Suas jogadas' : `Jogadas de ${name(g, i)}`} · ${role(g.players[i].role).toLowerCase()}</span>
      <p class="hint">Pelo que deu certo ou errado, e pelo que dava para saber na hora: uma jogada que deu errado sem ter como saber não conta como ruim.</p>
      <b class="plays-head good">Boas</b>${list(good, true)}<b class="plays-head bad">Ruins</b>${list(bad, false)}
      ${more ? `<button class="more" data-act="allplays" aria-expanded="${open}">${open ? 'Mostrar só as principais ▴' : `Ver todas (${good.length + bad.length}) ▾`}</button>` : ''}</section>`;
  }).join('');
}
/** Three recorded turning points, available to every table at the end. */
function vHighlights(g: Game): string {
  const points = Core.highlights(g);
  return points.length ? `<section class="card" id="highlights"><span class="label">O que decidiu a partida</span><div class="turning-points">${points.map(p => `<article><h3>${whyText(g, p.title)}</h3><p>${whyText(g, p.text)}</p></article>`).join('')}</div></section>` : '';
}
/** At the end (D28): how many of the roles the person deduced right in the notebook, seat by seat. */
function vNotesScore(g: Game): string {
  const me = solo(g);
  if (me < 0 || !g.notes) return '';
  const { right, wrong } = Core.notesScore(g, me), n = right.length + wrong.length;
  if (!n) return `<section class="card" id="notescore"><span class="label">Suas anotações</span><p class="hint">Nada para contar: você só marcou quem já sabia de certeza (o seu time ou quem você investigou).</p></section>`;
  const row = (i: number, ok: boolean): string => `<li class="${ok ? 'yes' : 'no'}"><b>${name(g, i)}</b> marcado ${g.notes?.[i] === 'L' ? W.libs : W.short}, era <span class="role ${Core.partyOf(g.players[i].role)}">${role(g.players[i].role)}</span></li>`;
  return `<section class="card" id="notescore"><span class="label">Suas anotações</span><p class="big-score"><b>${right.length}</b> de ${n} certas</p>
    <ul class="heard-list">${[...right.map(i => row(i, true)), ...wrong.map(i => row(i, false))].join('')}</ul><p class="hint">Só conta o que você deduziu: o time que você já conhecia e o que suas investigações mostraram ficam de fora.</p></section>`;
}
function vThoughts(g: Game): string {
  const me = solo(g);
  if (me < 0) return '';
  const key = `${g.log.length}:${g.players.map(p => p.name).join()}`;
  if (thoughtsCache && thoughtsCache.key === key) return thoughtsCache.html;
  const rows = Core.thoughts(g, me).sort((a, b) => b.series[b.series.length - 1] - a.series[a.series.length - 1]);
  const W0 = 120, H0 = 48, line = (s: number[]): string => {
    const x = (i: number): number => (s.length > 1 ? 4 + (i * (W0 - 8)) / (s.length - 1) : W0 / 2), y = (v: number): number => H0 - 4 - v * (H0 - 8);
    const pts = s.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W0} ${H0}" role="img" aria-label="Desconfiança de ${pct(s[0])} a ${pct(s[s.length - 1])}"><line x1="4" x2="${W0 - 4}" y1="${y(s[0]).toFixed(1)}" y2="${y(s[0]).toFixed(1)}" class="spark-base"/><polyline points="${pts}" class="spark-line"/>${s.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === s.length - 1 ? 3 : 2}" class="spark-dot"><title>${i ? `Depois do ${i}º acontecimento` : 'No começo'}: ${pct(v)}</title></circle>`).join('')}</svg>`;
  };
  const html = rows.length ? `<section class="card" id="thoughts"><span class="label">O que as IAs pensavam de você</span><p class="hint">A chance que cada IA dava de você ser {f}, do começo ao fim, lei a lei. A linha tracejada é o começo.</p><ul class="thoughts">${rows.map(r => `<li><span>${name(g, r.seat)} <span class="role ${Core.partyOf(g.players[r.seat].role)}">${role(g.players[r.seat].role)}</span></span>${line(r.series)}<b><small>${pct(r.series[0])} →</small> ${pct(r.series[r.series.length - 1])}</b></li>`).join('')}</ul>${vCrux(g, me, 'end')}</section>` : '';
  thoughtsCache = { key, html };
  return html;
}
/** The notebook of the one person at a table with app players (D12), right in the list of players, next to the game:
 *  for every other seat, liberal or the hidden side, as the person marks it. What the person knows for sure comes
 *  marked and cannot be changed: their team (by rule 3) and what their own investigations showed. Only when there is
 *  one person at the table, so no one else sees it; at the end the roles are on the table anyway. */
function noteKit(g: Game): { me: number; cell: (i: number, edit: boolean) => string; party: (i: number) => Law | ''; sure: (i: number) => boolean } | null {
  const me = solo(g);
  if (me < 0 || g.phase === 'over' || g.phase === 'reveal') return null;
  const sure = new Map<number, [string, Law]>();
  for (const k of Core.knows(g, me)) sure.set(g.players.findIndex(p => p.name === k.name), [role(k.role), 'F']);
  for (const e of g.hist) if (e.k === 'inv' && e.by === me && !sure.has(e.target)) sure.set(e.target, [`🔍 ${party(e.party)}`, e.party]);
  const notes = S.notes || {};
  const cell = (i: number, edit: boolean): string => {
    if (i === me) return edit ? '' : '<span class="tag you">Você</span>';
    const known = sure.get(i), mark = notes[i] || (edit ? known?.[1] : undefined);
    if (known && !edit) return `<span class="tag sure-tag ${known[1]}">${known[0]} ✓</span>`;
    if (!edit) return mark ? `<span class="tag mark ${mark}">${mark === 'L' ? W.libs : W.short}</span>` : '';
    const btn = (v: '' | Law, label: string): string => `<button class="${(mark || '') === v ? 'on' : ''} ${v}" data-act="note" data-i="${i}" data-v="${v}" aria-pressed="${(mark || '') === v}">${label}</button>`;
    return `<span class="segm notes-segm" role="group" aria-label="Anotação sobre ${esc(g.players[i].name)}">${btn('', '?')}${btn('L', W.libs)}${btn('F', W.short)}</span>`;
  };
  return { me, cell, party: (i: number): Law | '' => notes[i] || sure.get(i)?.[1] || '', sure: (i: number): boolean => sure.has(i) };
}
/** What the last government (or investigation) told the table, kept in view under the table until the next one
 *  (D21): a claim no longer flashes by in a note. */
/** D134: the narrator's last line about the table's last move, under the seats, until the next one. */
function vChron(g: Game): string {
  let k = g.log.length - 1; while (k >= 0 && !g.log[k].startsWith('📖 ')) k--;
  return k >= 0 && k >= g.log.length - 8 && g.phase !== 'over' ? `<p class="chron" id="chron">${esc(g.log[k].slice(3))}</p>` : '';
}
function vSaid(g: Game): string {
  if (g.phase === 'reveal') return '';
  const i = g.hist.map((e, j) => ((e.k === 'gov' || e.k === 'veto') && (e.pc !== undefined || e.cc !== undefined)) || (e.k === 'inv' && e.said !== undefined) ? j : -1).filter(j => j >= 0).pop();
  if (i === undefined) return '';
  return `<p class="said" id="said"><small>${g.hist[i].k === 'inv' ? 'Última investigação' : 'Último governo'}</small>${g.hist[i].k === 'inv' ? moment(g, i, solo(g)) : ledger(g, i)}</p>`;
}
/** What a government told the table, as a balance (D30): the president drew this and threw that away, the chancellor got
 *  this, threw that away and enacted the law. The throws are worked out from what each said; when the two stories do
 *  not add up, it says so. */
function ledger(g: Game, i: number): string {
  const e = g.hist[i] as Gov, me = solo(g), who = (j: number): string => (j === me ? 'você' : name(g, j));
  // the laws as little cards (D30): what each said they held, the one thrown away faded and crossed out, the law enacted
  const card = (p: Law, out = false): string => `<i class="lc ${p}${out ? ' out' : ''}" title="${p === 'L' ? 'liberal' : W.f}${out ? ', descartada' : ''}"></i>`;
  const cards = (f: number, of: number, outF: number | null): string => {
    const xs: string[] = [];
    for (let k = 0; k < of - f; k++) xs.push(card('L', outF === 0 && k === 0));
    for (let k = 0; k < f; k++) xs.push(card('F', outF === 1 && k === 0));
    return xs.join('');
  };
  const law = e.k === 'veto' ? undefined : e.law;
  const pc = e.pc !== undefined && e.pc >= 0 ? e.pc : null, cc = e.cc !== undefined && e.cc >= 0 ? e.cc : null;
  const pThrow = pc !== null && cc !== null ? pc - cc : null, cThrow = cc !== null && law ? cc - (law === 'F' ? 1 : 0) : null;
  const ok = (t: number | null): number | null => (t === 0 || t === 1 ? t : null);
  const off = (pThrow !== null && ok(pThrow) === null) || (cThrow !== null && ok(cThrow) === null);
  const row = (role: string, j: number, body: string): string => `<span class="led-row"><span class="led-who"><small>${role}</small><b>${who(j)}</b></span><span class="led-cards">${body}</span></span>`;
  return `${row('Presidente', e.pres, pc === null ? '<i class="led-quiet">não disse</i>' : cards(pc, 3, ok(pThrow)))}${row('Chanceler', e.chanc, `${cc === null ? '<i class="led-quiet">não disse</i>' : cards(cc, 2, e.k === 'veto' ? null : ok(cThrow))}${e.k === 'veto' ? '<i class="led-quiet">pediu veto</i>' : law ? `<span class="led-arrow">→</span>${card(law)}<small class="led-law">${law === 'L' ? 'liberal' : W.f}</small>` : ''}`)}${off ? '<b class="clash">A conta não fecha: alguém mentiu.</b>' : ''}`;
}
/** The whole table at a glance, at the top (D18): every seat in order, who is president and chancellor, who is out, and,
 *  playing alone, what the person knows or marked of each (the colour) and, with the live suspicion on, how much each
 *  app player suspects them. */
function vSeats(g: Game): string {
  if (g.phase === 'reveal') return '';
  const kit = noteKit(g), me = solo(g), live = S.gauge && me >= 0 ? new Map(liveSuspicion(g, me).map(x => [x.seat, x.f])) : null;
  const sash = sashOf(g);
  // D49: the president always wears a sash (gold in a special election); the chancellor, once elected, wears a medal.
  // Each pops in when it changes hands in this game, not when a page is reopened.
  const key = g.players.map(p => p.name).join('|'), same = key === seenSeatsOf;
  const chanc = g.chanc !== null && g.chanc !== undefined && g.phase !== 'nominate' && g.phase !== 'vote' ? g.chanc : -1;
  const newPres = same && g.pres !== seenPres, newChanc = same && chanc >= 0 && chanc !== seenChanc;
  seenSeatsOf = key; seenPres = g.pres; seenChanc = chanc;
  return `<ul class="seats" id="seats" aria-label="A mesa">${g.players.map((p, i) => {
    const mark = kit && i !== me ? kit.party(i) : '', f = live?.get(i);
    const mood = me >= 0 && p.alive ? Core.moodOf(g, i, me) : '';   // D148: what each app player said of you out loud
    const tags = `${mood ? `<i class="mood ${mood}" title="${mood === 'acc' ? 'Desconfiou de você em voz alta' : 'Disse que confia em você'}">${mood === 'acc' ? '😠' : '🙂'}</i>` : ''}${i === g.pres ? '<i>Pres.</i>' : ''}${i === g.chanc ? '<i>Chanc.</i>' : ''}${i === me ? '<i class="you">você</i>' : ''}${f !== undefined ? `<i class="sus">${pct(f)}</i>` : ''}${S.rep && p.alive ? (r => `<i class="rep r${r}" title="Reputação na mesa" aria-label="Reputação ${r} de 3">${'★'.repeat(r)}${'☆'.repeat(3 - r)}</i>`)(Core.reputation(g, i)) : ''}`;
    return `<li data-seat="${i}" class="seat${mark ? ` ${mark}` : ''}${kit?.sure(i) ? ' sure' : ''}${p.alive ? '' : ' dead'}${i === g.pres ? ` pres-sash${i === sash ? ' sash' : ''}${newPres ? ' in' : ''}` : ''}${i === chanc ? ` medal${newChanc ? ' in' : ''}` : ''}${i >= g.players.length / 2 ? ' rt' : ''}">${kit && i !== me ? `<button class="seat-btn" data-act="seatnote" data-i="${i}" aria-label="Anotar ${esc(p.name)}">${av(g, i, 's')}${name(g, i)}${kd(g, i)}${tags}</button>` : `${av(g, i, 's')}${name(g, i)}${kd(g, i)}${tags}`}</li>`;
  }).join('')}</ul>`;
}
/** Room kept at the end of the game screen: the bar at the bottom and the notes that pop up sit there, over nothing. */
const GAP = '<div class="dock-gap" aria-hidden="true"></div>';
/** The bar at the bottom with what opens beside the game (D17): the notebook. It
 *  has its own room at the end of the page, so it never covers what the game shows. */
/** These are the actual public lines recorded by the game, not regenerated dialogue. */
function speechRows(g: Game): { by: number; about: number | null; text: string }[] {
  const rows: { by: number; about: number | null; text: string }[] = [];
  let context: number | null = null;
  for (const line of g.log) {
    const by = g.players.findIndex(p => line.startsWith(p.name + ': "') || line.startsWith(p.name + ' (') || line.startsWith(p.name + ' disse que') || line.startsWith(p.name + ' não disse o que'));
    if (by < 0) { context = null; continue; }
    const prefix = g.players[by].name;
    const text = line.startsWith(prefix + ': "') ? line.slice(prefix.length + 3, -1) : line.slice(prefix.length).trim();
    const named = g.players.findIndex((p, i) => i !== by && text.includes(p.name));
    if (named >= 0) context = named;
    rows.push({ by, about: named >= 0 ? named : context, text });
  }
  return rows;
}

function socialNotice(g: Game): ReturnType<typeof Core.reputationNotice> {
  for (let i = g.hist.length - 1; i >= 0; i--) { const e = g.hist[i]; if (e.k === 'talk' && e.say !== 'quiet' && e.re?.length) return Core.reputationNotice(g, i); }
  return null;
}

function vDiary(g: Game, rows: ReturnType<typeof speechRows>): string {
  const notice = socialNotice(g);
  return `<aside id="diary" class="drawer diary${ui.diary ? ' open' : ''}" aria-label="Diário da conversa"><div class="diary-head"><span class="label">Diário da conversa</span><button data-act="diary" aria-label="Fechar Diário" class="diary-close">✕</button></div><p class="hint">Falas e respostas públicas, na ordem em que aconteceram.</p>${notice ? `<section class="reputation-note ${notice.tone}"><b>${esc(notice.title)}</b><p>${esc(notice.detail)}</p></section>` : ''}${rows.length ? `<div class="diary-lines">${rows.map(e => `<article><header><b>${name(g, e.by)}</b>${e.about !== null ? `<small>sobre ${name(g, e.about)}</small>` : '<small>falou à mesa</small>'}</header><p>“${esc(e.text)}”</p></article>`).join('')}</div>` : '<p class="hint">A conversa ainda não começou. As falas e respostas ficarão guardadas aqui.</p>'}</aside>`;
}

function vDock(g: Game): string {
  const kit = noteKit(g), n = Object.keys(S.notes || {}).length, notes = !!S.notesOpen;
  const rows = speechRows(g), last = rows[rows.length - 1];
  const topic = [...g.hist].reverse().find(e => e.k === 'talk' && e.say !== 'quiet' && e.about >= 0);
  const short = last ? topic?.k === 'talk' && !last.text.includes('disse que') && !last.text.includes('disse o que')
    ? `${g.players[topic.by].name} ${topic.say === 'acc' ? 'acusou' : 'defendeu'} ${g.players[topic.about].name}`
    : `${g.players[last.by].name}${last.about !== null ? ` sobre ${g.players[last.about].name}` : ' falou à mesa'}` : '';
  const notice = socialNotice(g);
  const peek = last ? `<button class="speech-peek" id="speech-peek" data-act="diary" aria-label="Abrir Diário: ${esc(short)}"><span>${esc(short)}</span><small>${notice ? `<span class="reputation-cue ${notice.tone}">${esc(notice.title)}</span>` : ''}Diário ›</small></button>` : '';
  const btns = [
    soloSeat(g) >= 0 && Core.sheetOf(g, soloSeat(g)) ? `<button class="dock-btn mysheet" data-act="sheet" data-i="${soloSeat(g)}" id="mysheet"><span aria-hidden="true">🎲</span> Minha ficha</button>` : '',
    kit ? `<button class="dock-btn notes${notes ? ' open' : ''}" data-act="notesopen" id="notestoggle" aria-expanded="${notes}" aria-controls="drawer"><span aria-hidden="true">${notes ? '✕' : '✎'}</span> Anotações${n ? ` · ${n}` : ''}</button>` : '',

  ];
  return `${vDrawer(g)}${vProofs(g)}${vDiary(g, rows)}${vCourt(g)}${vSheet(g)}<nav class="dock" aria-label="Painéis">${peek}${vFab(g)}${btns.join('')}</nav>${GAP}`;
}
/** D65/D66: talking to the table, in one panel, grouped by what each thing is for; only what can be done now shows. */
function vTalk(g: Game): string {
  const me = solo(g);
  if (me < 0 || !g.players[me].alive || g.phase === 'over') return '';
  const others = g.players.map((_, i) => i).filter(i => i !== me && g.players[i].alive);
  const chips = (act: string, ok: (i: number) => boolean, on: (i: number) => boolean = () => false): string => `<div class="chips">${others.filter(ok).map(i => `<button class="${on(i) ? 'on' : ''}" data-act="${act}" data-i="${i}" aria-pressed="${on(i)}">${name(g, i)}</button>`).join('')}</div>`;
  const sec = (title: string, hint: string, body: string): string => body ? `<section class="tsec"><b>${title}</b><small>${hint}</small>${body}</section>` : '';
  const why = others.some(i => Core.canWhy(g, me, i)) ? chips('twhy', i => Core.canWhy(g, me, i)) : '';
  const bloc = Core.blocOf(g, me), sel = ui.blocSel || [];
  const blocBody = bloc ? `<p class="hint">No bloco: ${bloc.yes.length ? bloc.yes.map(i => name(g, i)).join(', ') : 'ninguém topou'}.</p>`
    : `${chips('tbloc', i => !!g.players[i].ai, i => sel.includes(i))}<button class="tbtn" data-act="tblocgo" id="blocgo"${sel.length ? '' : ' disabled'}>🤝 Chamar ${sel.length ? sel.length : ''} para o bloco</button>`;
  return `<div class="talk" id="talk">${sec('Por que votou assim?', 'A IA explica o voto da última votação.', why)}${sec('Bloco', `Até 3 votando com você por ${Core.BLOC_ROUNDS} rodadas. Se o bloco eleger um governo que aprove lei ${W.f}, todos perdem reputação.`, blocBody)}</div>`;
}
/** D70: "I am liberal", a button that floats over the game, out of the scroll, while the person may say it. */
function vFab(g: Game): string {
  const me = solo(g);
  if (me < 0 || !g.players[me].alive || g.phase === 'over') return '';
  const can = Core.canSelfClaim(g, me);
  return `<button class="dock-btn lib" data-act="tself" id="selfclaim"${can ? '' : ' disabled'} aria-expanded="${!!ui.proof}" aria-controls="proofs" aria-label="Dizer à mesa: eu sou liberal">📣 ${can ? 'Sou liberal' : 'Já disse'}</button>`;
}
/** D73: saying you are liberal means showing something: what the record has for you, each with its strength. */
function vProofs(g: Game): string {
  const me = solo(g);
  if (!ui.proof || me < 0 || !Core.canSelfClaim(g, me)) return '';
  const pw = (p: number): string => p >= 0.45 ? '<i class="pw f">forte</i>' : p >= 0.2 ? '<i class="pw m">média</i>' : '<i class="pw w">fraca</i>';
  return `<aside class="drawer proofs open" id="proofs" aria-label="Provar que você é liberal"><div class="diary-head"><span class="label">Provar que você é liberal</span><button data-act="tself" aria-label="Fechar" class="diary-close">✕</button></div><p class="hint">Escolha o que mostrar. Cada IA diz se acredita.</p>${Core.selfProofs(g, me).map(x => `<button class="krow" data-act="tproof" data-v="${x.id}"><span><b>${esc(x.label)}</b><small>“${esc(x.text)}”</small></span>${pw(x.power)}</button>`).join('')}</aside>`;
}
/** The personalities of the app players (D26), as the table knows them: a name and a line. */
export const PERSONA_W: Record<Persona, [string, string]> = {
  certinho: ['Certinho', 'joga limpo; como do lado escondido, mente pouco'],
  desconfiado: ['Desconfiado', 'acredita em pouca gente e acusa fácil'],
  cetico: ['Cético', 'quase não liga para o que se fala'],
  critico: ['Crítico', 'só leva a sério a acusação que a ata confirma'],
  centrado: ['Centrado', 'no meio-termo em tudo'],
  blefador: ['Blefador', 'do lado escondido, mente muito'],
  caotico: ['Caótico', 'imprevisível: às vezes fala e vota sem conta']
};
/** The notebook as a side panel (D14): the bar at the bottom opens it over the game, and closes it again; on a wide
 *  screen it stays open beside the game. */
/** The court (D39): accusing someone with a proof from the record and a tone, as a sheet over the game. */
/** D84: one line on each verdict, from what the table saw (never a secret). */
export const WHY_V = ['a defesa convenceu', 'a prova pesou mais', 'ficou na dúvida'];
/** D84: the answer an accused is likely to give to each kind of proof, shown before accusing. */
const COUNTER: Record<string, string> = { clash: 'que quem mente é o outro do governo', law: 'que o baralho veio assim', vote: 'que metade da mesa votou igual', inv: 'que quem investigou mente', exec: 'que errou o palpite', count: 'as leis liberais que já aprovou' };
/** D84: every law in order, with the pair that passed it; a tap opens the president's sheet. */
function lawLine(g: Game): string {
  const xs = g.hist.filter(e => (e.k === 'gov' && e.law) || e.k === 'chaos');
  if (!xs.length) return '';
  return `<ol class="lawline" id="lawline" aria-label="As leis em ordem">${xs.map((e, k) => e.k === 'chaos' ? `<li class="${e.law}"><b>${k + 1}ª</b><span>caos</span></li>` : e.k === 'gov' ? `<li class="${e.law}"><button data-act="sheet" data-i="${e.pres}"><b>${k + 1}ª</b><span>${esc(g.players[e.pres].name)} + ${esc(g.players[e.chanc].name)}</span></button></li>` : '').join('')}</ol>`;
}
/** D84: a player's sheet: everything the whole table saw of it, in one place. */
function vSheet(g: Game): string {
  const i = ui.sheet;
  if (i === null || i === undefined || !g.players[i]) return '';
  const nmj = (j: number): string => name(g, j);
  const govs = g.hist.filter((e): e is Gov => (e.k === 'gov' || e.k === 'veto') && (e.pres === i || e.chanc === i));
  const F = govs.filter(e => e.k === 'gov' && e.law === 'F'), L = govs.filter(e => e.k === 'gov' && e.law === 'L');
  const votes = g.hist.map((e, k) => (e.k === 'vote' && e.ja.includes(i) && e.pres !== i && e.chanc !== i ? k : -1)).filter(k => k >= 0);
  const jaF = votes.filter(k => { const n = g.hist[k + 1]; return n && n.k === 'gov' && n.law === 'F'; }).length;
  const invs = g.hist.filter(e => e.k === 'inv' && (e.target === i || e.by === i)) as Extract<Event, { k: 'inv' }>[];
  const accs = g.hist.filter(e => e.k === 'talk' && e.say === 'acc' && (e.about === i || e.by === i)) as Talk[];
  const verdict = (t: Talk): string => !t.verdict ? '' : t.verdict.filter(x => x[1] === 1).length > t.verdict.filter(x => x[1] === 0).length ? ' · a mesa aceitou' : ' · a mesa não comprou';
  const row = (e: Gov): string => `<li class="${e.k === 'veto' ? 'rej' : e.law}">${e.pres === i ? 'Presidente' : 'Chanceler'} com ${nmj(e.pres === i ? e.chanc : e.pres)} · ${e.k === 'veto' ? 'veto' : e.law === 'L' ? 'lei liberal' : `lei ${W.f}`}</li>`;
  return `<div class="court-back" data-act="sheetclose"></div><section class="court sheet" id="sheet" role="dialog" aria-label="Ficha de ${esc(g.players[i].name)}"><span class="label">Ficha</span><h2>${nmj(i)}${kd(g, i)}</h2>
    <div class="sheet-stats"><span><b>${L.length}</b>leis liberais</span><span><b>${F.length}</b>leis {fs}</span><span><b>${jaF}</b>{ja} em governo {f}</span></div>
    ${(() => { const san = Core.sanity(g, i), base = Core.sheetOf(g, i)?.vals.Sanity ?? 50; const st = Core.statesOf(g, i), my = Core.mythosOf(g, i), madNow = Core.mad(g, i) ? Core.MANIAS[Core.maniaOf(g, i)] : null, sh0 = Core.sheetOf(g, i), past = sh0 ? Object.keys(Core.PASTS).reduce((a, k) => ((sh0.vals[k] ?? 0) > (sh0.vals[a] ?? 0) ? k : a), Object.keys(Core.PASTS)[0]) : '', rare = g.hist.find(e => e.k === 'find' && e.seat === i);
      const extra = san === undefined ? '' : `<ul class="sheet-extra" id="sheetextra">${past ? `<li>📖 ${esc(Core.PASTS[past])} (${g.players[i].role === 'liberal' && (i === soloSeat(g) || g.phase === 'over') ? `bônus sempre em ${esc(Core.SKILLS[past] || past)}${Core.HEALERS.includes(past) ? '; ferido ou envenenado não atrapalha' : ''}` : `bônus no primeiro teste de ${esc(Core.SKILLS[past] || past)}`})</li>` : ''}${my ? `<li>🐙 Mitos de Cthulhu ${my}${my >= Core.MYTHOS_SEES ? ' (bônus em Ocultismo)' : ''}</li>` : ''}${rare && rare.k === 'find' ? `<li>${Core.RARES[rare.id as keyof typeof Core.RARES][0]} ${esc(Core.RARES[rare.id as keyof typeof Core.RARES][1])}: ${esc(Core.RARES[rare.id as keyof typeof Core.RARES][2])}</li>` : ''}${madNow ? `<li>🌀 ${esc(madNow[0])}: ${esc(madNow[1])}</li>` : ''}</ul>`;
      return san === undefined ? '' : extra + `<div class="san${san < Core.SAN_LOW ? ' low' : ''}" id="san"><b>SAN ${san}${st.length ? ` · ${st.map(x => x === 'ferido' ? '🩸 Ferido' : '🤢 Envenenado').join(' · ')}` : ''}</b><span class="san-bar"><i style="width:${Math.round(100 * san / Math.max(1, base))}%"></i></span><small>${san < Core.SAN_LOW ? 'Abalado: as perícias rolam com dado de penalidade' : 'Cada eliminação e cada lei {f} custam sanidade'}</small></div>`; })()}
    ${i === soloSeat(g) && Core.canFaith(g, i) ? `<div class="faith" id="faith"><p class="hint">Uma vez por partida: fé ou razão.</p><div class="row"><button class="btn" data-act="faith" data-k="reza" id="pray">🙏 Rezar (+${Core.FAITH_SAN} SAN para os investigadores)</button><button class="btn" data-act="faith" data-k="estudo" id="study">📚 Estudar (bônus em Ocultismo e Poder)</button></div></div>` : ''}
    ${(() => { const it = Core.itemOf(g, i), me = soloSeat(g); if (!it) return ''; const I = Core.ITEMS[it];
      // D115: the item each one carries (everyone sees it), and stealing it once a game
      return `<div class="item-card" id="item"><span class="item-icon" aria-hidden="true">${I.icon}</span><span><b>${esc(I.name)}</b><small>${esc(I.use)}</small></span></div>${me >= 0 && me !== i && Core.canSteal(g, me, i) ? `<button class="btn block" data-act="steal" data-i="${i}" id="stealbtn">🫳 Tentar roubar (Prestidigitação contra o Encontrar dele, uma vez por partida)</button>` : ''}`; })()}
    ${(() => { const sh = Core.sheetOf(g, i), me = soloSeat(g); if (!sh || i !== me) return '';
      // D109: your own sheet says what each skill is rolled for, the strongest first
      const ks = Object.keys(Core.SKILLS).filter(k => sh.vals[k] !== undefined).sort((a, b) => (sh.vals[b] ?? 0) - (sh.vals[a] ?? 0));
      const sc = Core.sceneOf(g), gd = Core.godOf(g);
      return `${sc && gd ? `<p class="hint" id="scene">📜 ${esc(sc.place)} · culto a <b>${esc(gd.name)}</b>: ${esc(gd.gift)}.</p>` : ''}${S.stereo && Core.STEREOTYPES[S.stereo] ? `<p class="hint">Estereótipo: <b>${esc(Core.STEREOTYPES[S.stereo].name)}</b></p>` : ''}<span class="label">Sua ficha: para que serve cada perícia</span><ol class="my-skills" id="myskills">${ks.map((k, n) => `<li class="${n === 0 ? 'best' : ''}"><b>${sh.vals[k]}</b><span><strong>${Core.SKILLS[k]}${n === 0 ? ' · sua mais forte' : ''}</strong><small>${Core.SKILL_USE[k]}</small></span></li>`).join('')}</ol><p class="hint">Rola d100 contra o valor da ficha mais ${Core.EASE} de mesa: tirar até esse número é sucesso; até a metade, difícil; até um quinto, extremo. Argumento forte ganha dado de bônus (duas dezenas, fica a menor); argumento fraco é teste difícil (até a metade); abalado, dado de penalidade.</p>`; })()}
    ${(() => { const sh = Core.sheetOf(g, i); if (!sh || i === soloSeat(g)) return ''; return `<span class="label">Ficha de investigador</span><div class="sheet-skills">${Object.entries(Core.SKILLS).map(([k, l]) => `<span><b>${sh.vals[k] ?? '—'}</b>${l}</span>`).join('')}</div>${sh.native ? `<p class="hint">Língua materna: ${esc(sh.native)}</p>` : ''}`; })()}
    ${govs.length ? `<span class="label">Governos</span><ul class="sheet-list">${govs.map(row).join('')}</ul>` : '<p class="hint">Ainda não governou.</p>'}
    ${invs.length ? `<span class="label">Investigações</span><ul class="sheet-list">${invs.map(e => `<li>${e.by === i ? `Investigou ${nmj(e.target)}` : `Investigado por ${nmj(e.by)}`}: ${e.said === 'L' ? 'disse liberal' : e.said === 'F' ? `disse ${W.f}` : 'não disse'}</li>`).join('')}</ul>` : ''}
    ${accs.length ? `<span class="label">Acusações</span><ul class="sheet-list">${accs.map(t => `<li>${t.by === i ? `Acusou ${nmj(t.about)}` : `Acusado por ${nmj(t.by)}`}${verdict(t)}</li>`).join('')}</ul>` : ''}
    <button class="btn block" data-act="sheetclose">Fechar</button></section>`;
}
function vCourt(g: Game): string {
  const t = ui.court, me = solo(g);
  if (t === null || t === undefined || me < 0 || !Core.canDenounce(g, me, t)) return '';
  const ev = Core.evidence(g, t, me), picks = (ui.courtProof || []).filter(x => ev.some(y => y.at === x)), pick = picks.length ? picks[0] : null, tone = ui.courtTone || (pick !== null ? 'proof' : 'firm');
  const cards = (f: number, of: number): string => Array.from({ length: of }, (_, k) => `<i class="lc ${k < of - f ? 'L' : 'F'}"></i>`).join('');
  const spent = Core.usedProofs(g, t);
  const item = (x: ReturnType<typeof Core.evidence>[number]): string => spent.has(x.at) ? `<div class="ev spent"><small>${esc(x.title)} · já usada numa acusação</small><span>${esc(x.text)}</span></div>` : `<button class="ev${picks.includes(x.at) ? ' on' : ''}" aria-pressed="${picks.includes(x.at)}" data-act="courtproof" data-i="${x.at}"><small>${esc(x.title)}</small><span>${esc(x.text)}</span><em class="ev-counter">Ele deve responder: ${COUNTER[x.kind]}</em>${x.kind === 'clash' && x.pc !== undefined && x.cc !== undefined ? `<span class="ev-cards">${cards(x.pc, 3)} → ${cards(x.cc, 2)}${x.law ? ` → <i class="lc ${x.law}"></i>` : ''}</span>` : ''}${x.hit ? `<b class="ev-hit">${x.kind === 'clash' ? 'A conta não fecha' : 'Saiu lei {f}'}</b>` : ''}</button>`;
  // D81: two or more proofs make a combo, sharper the nearer the table is to the danger zone
  const chosen = ev.filter(x => picks.includes(x.at)), sharp = Core.sharpness(g), power = chosen.length ? Core.comboPower(chosen, sharp) : 0;
  const meter = chosen.length > 1 ? `<div class="combo" id="combo"><b>Combo · ${chosen.length} provas</b><span class="combo-bar"><i style="width:${Math.round(power * 100)}%"></i></span><small>${sharp >= 1 ? `Mesa no perigo (${g.laws.F} leis {fs}): acusação no máximo` : sharp > 0 ? `${g.laws.F} ${g.laws.F === 1 ? 'lei {f}' : 'leis {fs}'} na mesa: quanto mais perto da ${Core.LEADER_ZONE}ª, mais afiada` : 'Mesa ainda calma: a acusação pesa menos'}. Se a mesa aceitar, ninguém vota nele para chanceler perto da ${Core.LEADER_ZONE}ª lei {f}.</small></div>` : '';
  const tones: ['soft' | 'firm' | 'proof', string][] = [['soft', 'Desconfio'], ['firm', 'Acuso'], ['proof', 'Tenho prova']];
  return `<div class="court-back" data-act="courtclose"></div><section class="court" id="court" role="dialog" aria-label="Acusar ${esc(g.players[t].name)}"><span class="label">📣 Acusar ${name(g, t)}</span>
    <h2>Qual é a prova?</h2><p class="hint">${ev.length ? 'Toque no que está na ata contra ele. Junte várias para um combo.' : 'A ata não tem nada contra ele ainda. Dá para acusar mesmo assim.'}</p>${ev.filter(x => x.hit).map(item).join('')}${(() => { const hints = ev.filter(x => !x.hit); const open = ui.evMore || hints.some(x => picks.includes(x.at)) || !ev.some(x => x.hit); return hints.length ? `<div class="ev-more">${open ? '' : `<button class="more" data-act="evmore">Mais indícios (${hints.length}) · pesam pouco</button>`}${open ? hints.map(item).join('') : ''}</div>` : ''; })()}${meter}
    <div class="tones">${tones.map(([k, l]) => `<button class="${tone === k ? 'on' : ''}" data-act="courttone" data-v="${k}"${k === 'proof' && pick === null ? ' disabled' : ''}>${l}</button>`).join('')}</div>
    <button class="btn block go" data-act="accuse" id="accuse">${chosen.length > 1 ? 'Acusar com tudo' : 'Acusar'}</button><button class="more" data-act="courtclose">Cancelar</button></section>`;
}
function vDrawer(g: Game): string {
  const kit = noteKit(g);
  if (!kit) return '';
  const open = !!S.notesOpen, me = kit.me;
  // a claim to the table (D30): what the notebook says of someone, true or a bluff; the app players weigh it like any talk
  const claimed = (i: number): Law | '' => kit.party(i);
  // one column per side (D30): 🗒️ marks what you think (only you see it), 📣 tells the table, true or a bluff
  const side = (i: number, p: Law): string => {
    const m = claimed(i), on = m === p, can = Core.canDenounce(g, me, i), dead = !g.players[i].alive;
    const pen = `<button class="pen${on ? ' on' : ''}" data-act="note" data-i="${i}" data-v="${on ? '' : p}" aria-pressed="${on}" title="${on ? 'Desmarcar' : `Anotar como ${p === 'L' ? 'liberal' : W.f}`}" aria-label="${on ? 'Desmarcar' : 'Anotar como ' + (p === 'L' ? 'liberal' : W.f)}">🗒️</button>`;
    const say = dead ? '' : can ? `<button class="tell ${p}${m && m !== p ? ' bluff' : ''}" data-act="${p === 'L' ? 'denounce' : 'court'}" data-i="${i}" data-v="${p === 'L' ? 'trust' : 'acc'}" title="${m && m !== p ? 'Blefe: ' : ''}dizer à mesa que é ${p === 'L' ? 'liberal' : W.f}" aria-label="Dizer à mesa que ${esc(g.players[i].name)} é ${p === 'L' ? 'liberal' : W.f}">📣</button>` : '<span class="told" title="Já falou dele nesta rodada">✓</span>';
    return `<span class="side ${p}${on ? ' on' : ''}"><b>${p === 'L' ? W.libs : W.short}</b><span>${pen}${say}</span></span>`;
  };

  const rows = g.players.map((p, i) => (i === me ? '' : `<li id="note-row-${i}" class="${claimed(i)}${p.alive ? '' : ' dead'}"><div class="note-row"><span class="who">${name(g, i)}${kd(g, i)}${p.alive ? '' : ' <small>(eliminado)</small>'}${kit.sure(i) ? ' <small>(sabe)</small>' : ''}</span><span class="sides">${side(i, 'L')}${side(i, 'F')}</span></div></li>`)).join('');
  const last = [...g.hist].reverse().find((e): e is Extract<Game['hist'][number], { k: 'talk' }> => e.k === 'talk' && e.by === me);
  const at = last ? g.hist.lastIndexOf(last) : -1, icon = ['yes', 'meh', 'no'];
  const heard = last ? `<div class="heard" id="heard"><small>Você disse: "${name(g, last.about)} é ${last.say === 'trust' ? 'liberal' : W.f}"</small><p class="claim-impact" role="status">${esc(Core.accusationFeedback(g, at))}</p><ul>${(last.re || []).map(([i, a]) => `<li class="${icon[a]}"><b>${name(g, i)}</b>: "${esc(Core.reply(g, i, a, at))}"</li>`).join('')}${g.players[last.about].ai ? `<li class="${last.say === 'acc' ? 'no' : 'yes'}"><b>${name(g, last.about)}</b>: "${esc(Core.answer(g, last.about, last.say === 'acc', at))}"</li>` : ''}</ul></div>` : '';
  return `<aside class="drawer${open ? ' open' : ''}" id="drawer" aria-label="Suas anotações"><span class="label">Suas anotações</span><p class="hint">🗒️ anota o que você acha (só você vê). 📣 diz à mesa, até blefe.</p><ul class="names noted" id="notes">${rows}</ul>
    ${heard}${vTalk(g)}</aside>`;
}
/** A reason, with the names of the seats in it. */
export const whyText = (g: Game, line: string): string => line.replace(/\{p(\d+)\}/g, (_, i: string) => (g.players[+i] ? `<b>${name(g, +i)}</b>` : '?'));

/** The minutes, with assistance on (D11): every law, the government that made it and who voted Ja! for that
 *  government, and the count for each player. Only what the whole table saw: never a hand, a party or a role. */
function vAta(g: Game): string {
  if (!S.assist) return '';
  const rows: string[] = [], tally = g.players.map(() => ({ L: 0, F: 0 }));
  let n = 0;
  g.hist.forEach((e, i) => {
    if (e.k !== 'gov' && e.k !== 'veto' && e.k !== 'chaos') return;
    const v = e.k === 'chaos' ? undefined : [...g.hist.slice(0, i)].reverse().find((x): x is Extract<Event, { k: 'vote' }> => x.k === 'vote' && x.pres === e.pres && x.chanc === e.chanc);
    const ja = v ? v.ja.map(j => name(g, j)).join(', ') : '';
    if (e.k === 'chaos') { n++; rows.push(`<li class="gov ${e.law}"><b>${n}ª</b> <span class="role ${e.law}">${e.law === 'L' ? 'liberal' : W.f}</span> pelo caos, sem governo</li>`); return; }
    if (e.k === 'gov') { n++; if (e.law) { for (const j of v ? v.ja : [e.pres, e.chanc]) tally[j][e.law]++; } }
    const head = e.k === 'gov' ? `<b>${n}ª</b> <span class="role ${e.law}">${e.law === 'L' ? 'liberal' : W.f}</span>` : '<b>Veto</b>';
    rows.push(`<li class="${e.k === 'gov' ? `gov ${e.law}` : 'rej'}">${head} ${name(g, e.pres)} (pres.) + ${name(g, e.chanc)} (chanc.)<small class="hands">${v ? `{ja}: ${ja}` : 'votos em voz alta, sem registro'}</small></li>`);
  });
  const who = g.players.map((p, i) => ({ i, t: tally[i] })).filter(x => x.t.L + x.t.F).sort((a, b) => b.t.F - a.t.F || a.t.L - b.t.L);
  return `<section class="card" id="ata"><span class="label">Ata · assistência</span>${rows.length ? `<ol class="timeline ata-list">${rows.join('')}</ol>` : '<p class="hint">Nenhuma lei ainda.</p>'}
    ${who.length ? `<p class="hint">Aprovou (governou ou votou {ja}), por jogador:</p><ul class="tally">${who.map(x => `<li><span>${name(g, x.i)}</span><span><i class="mini F">F</i> ${x.t.F} <i class="mini L">L</i> ${x.t.L}</span></li>`).join('')}</ul>` : ''}
    <button class="btn ghost block" data-act="assist" data-v="off">Esconder a ata</button></section>`;
}
/** The record can be narrowed (D34): only what was said, only governments and votes, or everything. */
const logKeep = (l: string): boolean => ui.logFilter === 'talk' ? /: "/.test(l) : ui.logFilter === 'gov' ? !/: "/.test(l) : true;
const logTabs = (): string => `<div class="segm log-tabs" role="group" aria-label="Filtrar o registro">${([['all', 'Tudo'], ['talk', 'Falas'], ['gov', 'Jogadas']] as const).map(([k, t]) => `<button class="${(ui.logFilter || 'all') === k ? 'on' : ''}" data-act="logfilter" data-v="${k}" aria-pressed="${(ui.logFilter || 'all') === k}">${t}</button>`).join('')}</div>`;
function vLog(g: Game): string {
  return `<details class="card" id="log"${g.phase === 'over' ? ' open' : ''}><summary class="label">O que aconteceu (${g.log.length})</summary>${S.assist ? '' : '<button class="btn ghost block" data-act="assist" data-v="on" id="showata">Mostrar ata com quem aprovou cada lei</button>'}${logTabs()}${logRounds(g)}</details>`;
}
/** The record as a newspaper (D48): one block per round, newest first, headed by the nomination that opened it. */
function logRounds(g: Game): string {
  const rounds: { head: string; lines: string[] }[] = [{ head: 'Antes da primeira rodada', lines: [] }];
  for (const l of g.log) {
    if (/ indicou .+ para chanceler\.$/.test(l)) rounds.push({ head: `Rodada ${rounds.length} · ${l.replace(/\.$/, '')}`, lines: [l] });
    else rounds[rounds.length - 1].lines.push(l);
  }
  return rounds.filter(r => r.lines.some(logKeep)).reverse().map(r => `<section class="round"><h4>${esc(r.head)}</h4><ol class="log">${[...r.lines].reverse().filter(logKeep).map(l => `<li><i class="li-ic" aria-hidden="true">${logIcon(l)}</i>${esc(l)}</li>`).join('')}</ol></section>`).join('');
}
/** D90: an icon for each kind of line, so the record reads at a glance. */
function logIcon(l: string): string {
  return /^Lei .* aprovada/.test(l) ? (/Lei liberal/.test(l) ? '⚖️' : '☠️') : /^Votos\./.test(l) ? '🗳️' : / eleito\.$/.test(l) ? '✅' : / rejeitado\.$/.test(l) ? '❌' : / indicou /.test(l) ? '👉' : / investigou /.test(l) ? '🔍' : / eliminou /.test(l) ? '💀' : /Veredito|A mesa (comprou|não comprou)/.test(l) ? '⚖' : /é (cultista|vermelho)\."$|explica isso|Desconfio/.test(l) ? '📣' : /: "/.test(l) ? '💬' : '•';
}

/** How far the game has gone, counting what changes a phase and not what is said beside it (a claim, a talk): the
 *  screen of a phase stays put, and a secret stays open, while the app players speak (D21). */
export const beat = (g: Game): number => g.hist.filter(e => !['talk', 'self', 'plea', 'ask', 'why', 'bloc'].includes(e.k)).length;
/** The key of the secret a phase shows, and who may see it; null for a phase with nothing secret. The game moves on
 *  every round, so the same phase in another round has another key and starts closed. */
export function gateKey(g: Game): { key: string; who: number } | null {
  const k = beat(g);
  if (g.phase === 'reveal') return { key: `reveal:${g.reveal}`, who: g.reveal };
  if (g.phase === 'president' || g.phase === 'investigated' || g.phase === 'peek') return { key: `${g.phase}:${k}`, who: g.pres };
  if (g.phase === 'chancellor') return { key: `chancellor:${k}`, who: g.chanc as number };
  return null;
}
function gated(g: Game, title: string, inner: () => string): string {
  const gk = gateKey(g) as { key: string; who: number };
  if (ui.open === gk.key) {
    const flip = seenOpen !== gk.key; seenOpen = gk.key; flipping = flip;
    return `<section class="card secret${flip ? ' flip' : ''}" id="phase"><span class="label">${title} · só ${name(g, gk.who)} olha</span>${inner()}</section>`;
  }
  seenOpen = '';
  const alone = Core.hasAi(g) && Core.humansAlive(g).length === 1;
  return `<section class="card" id="phase"><span class="label">${title}</span><div class="handoff"><span class="phone" aria-hidden="true"></span><p class="big">${alone ? 'Só para os seus olhos,' : 'Passe o celular para'}</p><b class="who">${name(g, gk.who)}</b><p class="hint">Ninguém mais olha a tela.</p></div><button class="btn block" data-act="open" data-k="${esc(gk.key)}">Sou ${name(g, gk.who)}, mostrar</button></section>`;
}
/** A secret card, face down first: when it has just been opened it turns over like a card on the table. */
export const turn = (front: string): string => `<div class="turn${flipping ? ' go' : ''}"><div class="back" aria-hidden="true"><span>?</span></div>${front}</div>`;

export const pickList = (g: Game, ok: (i: number) => boolean, act: string): string =>
  `<div class="pick">${g.players.map((p, i) => ok(i) ? `<button class="btn ghost${ui.pick === i ? ' on' : ''}" data-act="${act}" data-i="${i}" aria-pressed="${ui.pick === i}">${name(g, i)}${kd(g, i)}</button>` : '').join('')}</div>`;

function vPhase(g: Game): string {
  const pres = name(g, g.pres);
  switch (g.phase) {
    case 'reveal':
      return gated(g, `Papéis (${g.reveal + 1} de ${g.players.length})`, () => {
        const me = g.players[g.reveal], mates = Core.knows(g, g.reveal);
        const names = (r: Role): string => mates.filter(m => m.role === r).map(m => `<b>${esc(m.name)}</b>`).join(', ');
        const row = (cls: string, label: string, who: string): string => who ? `<div class="ally ${cls}"><small>${label}</small><span>${who}</span></div>` : '';
        const info = me.role === 'cultista' ? `<div class="allies${flipping ? ' go' : ''}" id="allies">${row('H', '{boss}', names('lider'))}${row('F', 'Outros {fs}', names('cultista'))}</div>`
          : me.role === 'lider' ? (mates.length ? `<div class="allies" id="allies">${row('F', 'Seu {f}', names('cultista'))}</div><p class="hint">Ele sabe quem você é.</p>` : '<p>Você não sabe quem são os {fs}. Eles sabem quem você é.</p>') : '<p>Você não sabe quem é quem. Ache o {boss}.</p>';
        const trained = g.train && !me.ai ? `<p class="hint" id="trained">Treino: você escolheu ser ${role(g.train).toLowerCase()}.</p>` : '';
        return `${turn(`<div class="role-card ${Core.partyOf(me.role)}${me.role === 'lider' ? ' H' : ''}" id="role">${portrait(me.role, P, R)}<small>Você é</small><b class="${(P === 'culto' ? Core.cultSpeak(role(me.role)) : role(me.role)).length > 9 ? 'long' : ''}">${role(me.role)}</b></div>`)}${info}${trained}<button class="btn block" data-act="hiderole">Entendi, esconder</button>`;
      });
    case 'nominate':
      return `<section class="card" id="phase"><span class="label">Nova rodada</span><p class="big"><b>${pres}</b> é o presidente. Escolha o chanceler:</p>${pickList(g, i => Core.canNominate(g, i), 'nominate')}${g.lastChanc !== null ? '<p class="hint">O último governo eleito não pode voltar como chanceler.</p>' : ''}</section>`;
    case 'vote':
      if (Core.hasAi(g)) return vVoteAi(g);
      return `<section class="card" id="phase"><span class="label">Votação</span><p class="big"><b>${pres}</b> presidente + <b>${name(g, g.chanc as number)}</b> chanceler?</p><p class="hint">Todo mundo vota junto, em voz alta: {ja} ou {nein} Mais {ja} que {nein} elege; empate rejeita.</p><div class="pick"><button class="btn vote L" data-act="elect" data-v="1">Eleito</button><button class="btn vote F" data-act="elect" data-v="0">Rejeitado</button></div>${g.tracker ? `<p class="hint">Já ${g.tracker === 1 ? 'foi 1 governo rejeitado' : `foram ${g.tracker} governos rejeitados`} seguido${g.tracker === 1 ? '' : 's'}. No ${Core.TRACKER_MAX}º, a lei do topo entra sozinha.</p>` : ''}</section>`;
    case 'president':
      return gated(g, 'Presidente', () => `<p>Toque na lei que vai pro lixo. As outras duas vão pro chanceler.</p><div class="hand">${g.hand.map((l, k) => law(l, k)).join('')}</div><button class="btn block" data-act="pdiscard"${ui.pick === null ? ' disabled' : ''}>Descartar e passar</button>`);
    case 'chancellor':
      return gated(g, 'Chanceler', () => `<p>Toque na lei que vai ser aprovada. A outra vai pro lixo.</p><div class="hand enact">${g.hand.map((l, k) => enactable(l, k)).join('')}</div>${Core.canVeto(g) ? '<button class="btn ghost block" data-act="askveto">Pedir veto das duas</button>' : g.vetoed ? '<p class="hint">O presidente recusou o veto: uma das duas tem que virar lei.</p>' : ''}`);
    case 'veto':
      return `<section class="card" id="phase"><span class="label">Veto</span><p class="big"><b>${name(g, g.chanc as number)}</b> (chanceler) quer vetar as duas leis. <b>${pres}</b>, aceita?</p><p class="hint">Se aceitar, nenhuma lei entra e conta como governo rejeitado.</p><div class="pick"><button class="btn" data-act="veto" data-v="1">Aceitar veto</button><button class="btn ghost" data-act="veto" data-v="0">Recusar</button></div></section>`;
    case 'investigate':
      return `<section class="card" id="phase"><span class="label">Poder: investigar</span><p class="big"><b>${pres}</b>, de quem você quer saber o partido?</p>${pickList(g, i => Core.canTarget(g, i), 'investigate')}</section>`;
    case 'special':
      return `<section class="card" id="phase"><span class="label">Poder: eleição especial</span><p class="big"><b>${pres}</b>, quem é o próximo presidente?</p><p class="hint">Depois dessa rodada a ordem volta a partir de ${pres}.</p>${pickList(g, i => Core.canTarget(g, i), 'special')}</section>`;
    case 'investigated':
      return gated(g, 'Investigação', () => {
        const p = Core.investigated(g) as Law;
        // a confidential file (D38, D157): the cover with the name lifts, the lens hunts over the card still face down,
        // stops, and only then the card turns and the party is stamped on it
        return `<div class="dossier${flipping ? ' go' : ''}"><div class="cover" aria-hidden="true"><small>Confidencial</small><b>${name(g, g.target as number)}</b></div>${turn(`<div class="role-card ${p}" id="party">${portrait(p === 'L' ? 'liberal' : 'cultista', P, R)}<small>${name(g, g.target as number)} é</small><b>${party(p)}</b><span class="inv-stamp ${p}" aria-hidden="true">${party(p)}</span></div>`)}<i class="inv-glow ${p}" aria-hidden="true"></i><span class="lens" aria-hidden="true"><i></i></span></div><p class="hint">Contar a verdade ou não é com você.</p><button class="btn block" data-act="endpower">Esconder e seguir</button>`;
      });
    case 'peek':
      return gated(g, 'Poder: espiar', () => `<p>As próximas 3 leis, na ordem:</p><div class="hand" id="peek">${g.deck.slice(0, 3).map(l => law(l)).join('')}</div><button class="btn block" data-act="endpower">Esconder e seguir</button>`);
    case 'execute':
      return `<section class="card" id="phase"><span class="label">Poder: eliminar</span><p class="big"><b>${pres}</b>, quem sai do jogo?</p>${pickList(g, i => Core.canTarget(g, i), 'pickp')}<button class="btn block danger" data-act="execute"${ui.pick === null ? ' disabled' : ''}>${ui.pick === null ? 'Escolha alguém' : `Eliminar ${name(g, ui.pick)}`}</button></section>`;
    default:
      return `<section class="card win ${g.winner}" id="phase"><span class="label">Fim de jogo</span><div class="cheer">${portrait(g.winner === 'L' ? 'liberal' : 'lider', P, R)}</div><p class="big"><b>${g.winner === 'L' ? 'Os liberais venceram!' : 'Os {fs} venceram!'}</b></p><p>${esc(g.why)}</p>
        ${(() => { const c = Core.chapterAfter(g); return c ? `<button class="btn block go" data-act="nextch" id="nextch">📖 Próximo capítulo (${c.ch} de ${Core.CHAPTERS}) · investigadores ${c.wins.L} × ${c.wins.F} culto</button>` : ''; })()}        <button class="btn block" data-act="nextgame" id="nextgame">▶ Mais uma</button><button class="btn block" data-act="again">Jogar de novo com a mesma mesa</button><button class="btn ghost block" data-act="table">Voltar ao início</button></section>`;
  }
}

/** The vote at a table with app players: each person taps their own vote; the app players vote when the last one is in. */
function vVoteAi(g: Game): string {
  const people = Core.humansAlive(g), one = people.length === 1;
  const row = (i: number): string => `<div class="voter"${one ? '' : ` id="voter-${i}"`}>${one ? '' : `<b>${name(g, i)}</b>`}<div class="pick"><button class="btn vote L${ui.votes[i] === true ? ' on' : ''}" data-act="myvote" data-i="${i}" data-v="1" aria-pressed="${ui.votes[i] === true}"><span class="vw">${ui.votes[i] === true ? '✓ ' : ''}{ja}</span></button><button class="btn vote F${ui.votes[i] === false ? ' on' : ''}" data-act="myvote" data-i="${i}" data-v="0" aria-pressed="${ui.votes[i] === false}">${ui.votes[i] === false ? '✓ ' : ''}{nein}</button></div></div>`;
  return `<section class="card" id="phase"><span class="label">Votação</span><p class="big"><b>${name(g, g.pres)}</b> presidente + <b>${name(g, g.chanc as number)}</b> chanceler?</p>${(() => { const me = soloSeat(g); return me >= 0 && Core.mad(g, me) ? '<p class="mad-note" id="madnote">🌀 Você enlouqueceu (sanidade zero): toque num voto, mas ele sai no escuro.</p>' : ''; })()}<p class="hint">${one ? 'Seu voto' : 'Cada pessoa toca no próprio voto'}; as IAs votam junto. Mais {ja} que {nein} elege; empate rejeita.</p>${people.map(row).join('')}${one && typeof ui.votes[people[0]] === 'boolean' ? `<p class="confirm-vote" id="confirmvote">Toque de novo em <b>${ui.votes[people[0]] ? '{ja}' : '{nein}'}</b> para confirmar, ou no outro para trocar.</p>` : ''}${one ? '' : `<button class="btn block" data-act="countvotes"${people.every(i => typeof ui.votes[i] === 'boolean') ? '' : ' disabled'}>Abrir os votos</button>`}${g.tracker ? `<p class="hint">Já ${g.tracker === 1 ? 'foi 1 governo rejeitado' : `foram ${g.tracker} governos rejeitados`} seguido${g.tracker === 1 ? '' : 's'}. No ${Core.TRACKER_MAX}º, a lei do topo entra sozinha.</p>` : ''}</section>`;
}

export * from './home';
export * from './overlay';
