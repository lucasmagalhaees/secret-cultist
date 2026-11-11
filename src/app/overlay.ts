/* What shows over the screen for a moment (D143, out of render.ts): the vote stamp, the decree, the powers, the
   confetti, the toasts, the debate sheet, turning a vote, the big rolls and the story. */
import { Core } from '../core';
import type { Event, Game, Gov, Law, Party } from '../core';
import type { Roll } from '../core/dice';
import type { ItemKey, TrapKey } from '../core/index';
import { face, portrait, seal } from './art';
import { $, esc, part, themed } from './format';
import { S, ui } from './state';
import { P, PERSONA_W, R, W, WHY_V, av, diceHtml, freeze, frozenFor, name, rollDice, solo } from './render';
import type { DiceRoll } from './render';
export let stampTimer: ReturnType<typeof setTimeout> | undefined;
export let lastDebate = '';
// import { builtFrom, canUpdate } from './update';
// import { earned, kept, past } from './history';
export function stamp(text: string, party: Party): void {
  const s = part('stamp');
  s.textContent = text; s.className = `stamp ${party}`; s.hidden = false;
  void s.offsetWidth; s.classList.add('go');            // restart the animation even when it is the same stamp again
  clearTimeout(stampTimer); stampTimer = setTimeout(() => { s.hidden = true; }, 1100);
}
/** The screen goes dark for a moment: someone was eliminated. */
/** An elimination (D38): the screen darkens, the name comes up, ELIMINADO is stamped on it, and a card turns to say
 *  what the rule lets the table know: whether it was the hidden leader. The screen shakes once (an iPhone page cannot
 *  vibrate). Without a name, only the dark. */
/** A new game closes the elimination screen of the last one: its words belong to that game. */
export function clearFlash(): void { const f = part('flash'); f.hidden = true; f.innerHTML = ''; }
export function flash(who = '', wasBoss = false, why = ''): void {
  const f = part('flash');
  // a shot (D45): the muzzle flashes, the screen cracks from where it hit, then the name and the stamp
  f.innerHTML = who ? `<svg class="gun" viewBox="0 0 220 120" aria-hidden="true"><path d="M8 30 h150 l10 -8 h22 v22 h-30 v10 h-60 l-6 18 h-20 l-8 44 h-40 l12 -50 h-30 z" fill="#1a1714" stroke="#f3e8d0" stroke-width="3" stroke-linejoin="round"/><circle cx="96" cy="52" r="9" fill="none" stroke="#f3e8d0" stroke-width="3"/><path class="bang" d="M196 33 l18 -14 -4 14 10 4 -12 6 12 10 -18 -4" fill="#ffd678" stroke="#fff" stroke-width="2"/></svg><div class="muzzle"></div><svg class="crack" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M230 300 L305 299 L378 277 L454 290 L528 275 M230 300 L326 320 L417 358 L517 362 L613 385 M230 300 L314 384 L394 472 L450 580 L494 695 M230 300 L238 390 L285 473 L261 571 L320 652 M230 300 L225 372 L202 443 L221 518 L190 588 M230 300 L171 367 L128 446 L77 519 L16 585 M230 300 L146 339 L57 368 L-26 410 L-105 459 M230 300 L120 297 L10 277 L-100 269 L-205 222 M230 300 L162 250 L78 231 L9 180 L-50 117 M230 300 L155 239 L100 157 L40 81 L-37 19 M230 300 L224 215 L215 130 L206 45 L188 -39 M230 300 L270 180 L320 64 L313 -70 L415 -171 M230 300 L322 209 L390 96 L477 0 L586 -76 M230 300 L304 241 L377 180 L448 117 L558 109 M270 304 L264 321 L252 334 L235 340 L217 338 L202 329 L192 314 L190 296 L196 279 L208 266 L225 260 L243 262 L258 271 L268 286 L270 304 M325 309 L311 350 L282 380 L242 394 L200 390 L164 368 L141 332 L135 291 L149 250 L178 220 L218 206 L260 210 L296 232 L319 268 L325 309"/><circle cx="230" cy="300" r="9"/></svg><div class="exec"><i class="av av-xl out" aria-hidden="true">${face(who, S.game?.region || 'mundo', !S.game?.players.find(p => p.name === who)?.ai)}</i><b class="exec-name">${esc(who)}</b><span class="exec-stamp">Eliminado</span>${why ? `<p class="exec-why">“${esc(why)}”</p>` : ''}</div>${wasBoss ? `<div class="tear-boss" aria-hidden="true"><div class="tb-half l">${portrait('lider', P, R)}</div><div class="tb-half r">${portrait('lider', P, R)}</div></div><div class="fate boss"><div class="rays"></div><div class="birds">${'<i></i>'.repeat(7)}</div><b class="exec-card boss">Era o ${W.boss}!</b><span>Os liberais chegam ao poder</span></div>` : `<div class="fate on"><i class="sweep"></i><b class="exec-card">Não era o ${W.boss}</b><span>O jogo continua</span></div>`}` : '';
  f.hidden = false; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  freeze(who ? (wasBoss ? 4800 : 3600) : 900);   // D88: shorter; a tap skips it
  f.classList.toggle('tap', !!who); f.onclick = who ? () => { f.hidden = true; f.innerHTML = ''; ui.frozen = 0; } : null;
  if (who) { const v = part('view'); v.classList.remove('shake'); void v.offsetWidth; v.classList.add('shake'); }   // the page under it shakes, not the body: a moved body would carry the fixed screens with it
  setTimeout(() => { f.hidden = true; f.innerHTML = ''; }, who ? (wasBoss ? 4800 : 3600) : 900);
}
/** A law has just been enacted: who made it, over the screen for a moment (D11). The text comes from the code and the
 *  names go through esc(). */
let decreeTimer: ReturnType<typeof setTimeout> | undefined;
export function decree(g: Game, e: Gov | Extract<Event, { k: 'chaos' }>): void {
  const d = part('decree'), law = (e.law || 'F') as Law;
  const who = e.k !== 'gov' && e.k !== 'veto' ? `<span class="who">O caos</span><span>aprovou</span>` : `<span class="who">${name(g, e.pres)} e ${name(g, e.chanc)}</span><span>aprovaram</span>`;
  d.innerHTML = `<div class="decree-card ${law}">${seal(law, P)}${who}<b>lei ${law === 'L' ? 'liberal' : W.f}</b></div>`;
  d.hidden = false; d.classList.remove('go'); void d.offsetWidth; d.classList.add('go');
  clearTimeout(decreeTimer); decreeTimer = setTimeout(() => { d.hidden = true; }, 2200);
}
/** Public power announcement: names only, never a party, role or secret portrait. */
let powerTimer: ReturnType<typeof setTimeout> | undefined;
export function powerEffect(g: Game, target: number, kind: 'investigate' | 'execute'): void {
  const d = part('power-effect');
  const mark = '<g class="weapon"><path d="M5 9h29v9H19l-2 17H7l4-18H5z" fill="currentColor" stroke-width="1"/><path d="M20 19v6h-5" stroke-width="2"/></g><path class="muzzle" d="m35 8 5-3-1 7 3 3-5 1 3 5-6-3" stroke="#ffd678" stroke-width="2"/><path class="smoke" d="M35 8c-8-5 8-7 0-12" stroke-width="2"/>';
  if (kind === 'investigate') {
    // D64: the whole screen: an envelope opens, a gloved hand pulls out the slip with the name, a magnifier passes over
    // it. Only the name: the party stays secret
    d.innerHTML = `<div class="inv-scene"><div class="envelope"><div class="slip"><small>Investigação</small><b>${name(g, target)}</b><svg class="hand" viewBox="0 0 80 60" aria-hidden="true"><path d="M10 58 C8 40 12 30 22 26 L22 8 C22 2 30 2 30 8 L30 22 L34 4 C35 -1 43 0 42 6 L40 22 L46 6 C48 1 55 3 54 8 L50 24 L56 14 C59 10 65 13 63 18 L56 34 C52 46 46 54 40 58Z" fill="#f3e8d0" stroke="#15110e" stroke-width="3" stroke-linejoin="round"/></svg></div><div class="env-body"></div><div class="env-flap"></div></div><svg class="lens" viewBox="0 0 120 120" aria-hidden="true"><circle cx="48" cy="48" r="38" fill="rgba(255,255,255,.12)" stroke="#d9a520" stroke-width="8"/><path d="M76 76 L112 112" stroke="#d9a520" stroke-width="14" stroke-linecap="round"/></svg></div>`;
    d.className = 'power-effect investigate'; d.hidden = false;
    void d.offsetWidth; d.classList.add('go');
    freeze(3400); clearTimeout(powerTimer); powerTimer = setTimeout(() => { d.hidden = true; }, 3400);
    return;
  }
  d.innerHTML = `<div class="power-card"><svg class="power-mark" viewBox="0 0 42 42" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">${mark}</svg><div><small>Eliminado da mesa</small><b>${name(g, target)}</b></div></div>`;
  d.className = `power-effect ${kind}`; d.hidden = false;
  void d.offsetWidth; d.classList.add('go');
  clearTimeout(powerTimer); powerTimer = setTimeout(() => { d.hidden = true; }, 1600);
}

/** Confetti in the colour of the side that won. */
export function confetti(winner: Party): void {
  const c = part('confetti');
  c.innerHTML = Array.from({ length: 48 }, (_, i) => `<i class="${winner}" style="left:${(i * 37) % 100}%;animation-delay:${(i % 12) * 0.08}s;animation-duration:${1.6 + (i % 5) * 0.25}s;--r:${(i * 53) % 360}deg"></i>`).join('');
  setTimeout(() => { c.innerHTML = ''; }, 4200);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
/** A short message at the bottom of the screen. */
export function toast(text: string): void {
  const t = part('toast'); t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}
/** Lets go of the field with the focus, so the screen can be painted again. */
export function blurField(): void { const a = document.activeElement as HTMLElement | null; if (a && a.blur && $('#view')?.contains(a)) a.blur(); }

/** The answers to an accusation (D42), only those the record could back, each saying when it holds. */

/** The votes at a little table (D44): every seat in its place around a green table, each vote turning over in turn,
 *  the count adding up in the middle, then ELEITO! or REJEITADO! (the table goes red when the hidden leader was just
 *  elected chancellor in the danger zone). It closes by itself and never takes a tap. With less motion asked, only the stamp shows. */
export function ballot(g: Game, e: Extract<Event, { k: 'vote' }>, elected: boolean, step: number, hold = false): number {
  const alive = g.players.map((p, i) => (p.alive ? i : -1)).filter(i => i >= 0), n = g.players.length, me = solo(g);
  const order = [...alive.slice(alive.indexOf(e.pres)), ...alive.slice(0, alive.indexOf(e.pres))];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, gap = step;
  if (calm) return 0;   // with less motion asked, the stamp says it already
  const danger = elected && g.players[e.chanc]?.role === 'lider' && g.laws.F >= Core.LEADER_ZONE;
  const R = 112, seats = alive.map(i => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n, ja = e.ja.includes(i), k = order.indexOf(i);
    return `<div class="b-seat${i === me ? ' me' : ''}" style="left:calc(50% + ${(R * Math.cos(a)).toFixed(0)}px);top:calc(50% + ${(R * Math.sin(a)).toFixed(0)}px)"><div class="b-card ${ja ? 'ja' : 'nein'}" style="animation-delay:${450 + k * gap}ms"><span>${ja ? '✔' : '✖'}<small>${ja ? W.ja : W.nein}</small></span></div>${av(g, i, 'm')}<b title="${esc(g.players[i].name)}">${esc(g.players[i].name.slice(0, 3).toUpperCase())}</b></div>`;
  }).join('');
  const el = document.createElement('div');
  el.className = `ballot${danger && !hold ? ' danger' : ''}${hold ? ' hold' : ''}`; el.id = 'ballot'; el.style.setProperty('--danger-at', `${450 + alive.length * gap + 200}ms`);
  el.innerHTML = themed(`<p class="b-q"><b>${name(g, e.pres)}</b> presidente + <b>${name(g, e.chanc)}</b> chanceler</p><div class="b-table"><div class="b-felt"></div>${seats}<div class="b-center"><b class="b-score"><span class="g">0</span> × <span class="r">0</span></b><b class="b-stamp ${elected ? 'L' : 'F'}" style="animation-delay:${450 + alive.length * gap + 200}ms">${elected ? 'Eleito!' : 'Rejeitado!'}</b></div></div>`, W as unknown as Record<string, string>);
  document.getElementById('ballot')?.remove();
  document.body.appendChild(el);
  const g1 = el.querySelector<HTMLElement>('.b-score .g'), r1 = el.querySelector<HTMLElement>('.b-score .r');
  let y = 0, no = 0;
  order.forEach((i, k) => setTimeout(() => { if (e.ja.includes(i)) y++; else no++; if (g1) g1.textContent = String(y); if (r1) r1.textContent = String(no); }, 450 + k * gap + 250));
  // the table comes in, the cards turn, the stamp lands and stays a moment, then the table leaves (D45)
  const shown = 450 + alive.length * gap + 1100;
  if (!hold) setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, shown);
  return hold ? 450 + alive.length * gap + 300 : shown;
}

/** D55: the person's own plays, to defend with: the play the accusation points at (what it got, what it passed or
 *  enacted, what it said it got) and the plays that speak for it (liberal laws it made, investigations it told). Only
 *  the accused sees this on its own screen: the hands are its own. */
export function myPlays(g: Game, me: number, at: number): string {
  const mini = (ls?: Law[]): string => (ls || []).map(l => `<i class="mini ${l}">${l === 'L' ? 'L' : W.F[0]}</i>`).join('');
  const said = (n: number | undefined, of: number): string => n === undefined ? 'não disse nada' : n < 0 ? 'ficou calado' : `disse ${n} ${n === 1 ? W.f : W.fs} de ${of}`;
  const gov = (e: Game['hist'][number], i: number): string => {
    if (e.k !== 'gov' && e.k !== 'veto') return '';
    const pres = e.pres === me, other = name(g, pres ? e.chanc : e.pres), out = e.k === 'veto' ? 'veto' : e.law === 'L' ? 'saiu liberal' : `saiu ${W.f}`;
    const got = pres ? `tirou ${mini(e.drew)} · passou ${mini(e.got)}` : `recebeu ${mini(e.got)}`;
    return `<li${i === at ? ' class="hit"' : ''}><b>${pres ? 'Presidente' : 'Chanceler'} com ${other}</b> · ${out}<small>Você ${got} · ${said(pres ? e.pc : e.cc, pres ? 3 : 2)}</small></li>`;
  };
  const target = at >= 0 ? g.hist[at] : undefined, rows: string[] = [];
  if (target && (target.k === 'gov' || target.k === 'veto') && (target.pres === me || target.chanc === me)) rows.push(gov(target, at));
  g.hist.forEach((e, i) => {
    if (i === at || rows.length >= 4) return;
    if ((e.k === 'gov' && e.law === 'L') && (e.pres === me || e.chanc === me)) rows.push(gov(e, i));
    if (e.k === 'inv' && e.by === me) rows.push(`<li><b>Investigou ${name(g, e.target)}</b><small>Viu ${e.party === 'L' ? 'liberal' : W.f} · ${e.said === undefined ? 'não disse nada' : e.said === '-' ? 'ficou calado' : `disse ${e.said === 'L' ? 'liberal' : W.f}`}</small></li>`);
  });
  return rows.length ? `<div class="myplays"><b>Suas jogadas</b><ol>${rows.join('')}</ol></div>` : '';
}
/* D57: the debate on pages of a notebook, turned sideways: 1 the accusation and the first answer, 2 the reply and the
   last word, 3 the table's verdict. The page where it is the person's turn offers its arguments. */
export function debateSheet(g: Game, at: number): void {
  const t = g.hist[at];
  if (!t || t.k !== 'talk') return;
  const me = solo(g), who = Core.debateNext(g, at), lines = t.deb || [];
  const stars = (i: number): string => g.players[i]?.ai ? ` <span class="lab">${'★'.repeat(Core.eloq(g, i))}${'☆'.repeat(3 - Core.eloq(g, i))} lábia</span>` : '';
  const who_ = (i: number): string => `${av(g, i, 'm')}${name(g, i)}${i === me ? ' (você)' : g.players[i].ai ? ` · ${PERSONA_W[g.players[i].persona || 'centrado'][0].toLowerCase()}` : ''}`;
  const proof = t.proof !== undefined ? Core.evidence({ ...g, hist: g.hist.slice(0, at) }, t.about, t.by).find(x => x.at === t.proof) : undefined;
  const say = (i: number, text: string, tag: string): string => `<div class="dsay ${i === t.by ? 'acc' : 'def'}"><b>${who_(i)} · ${tag}${stars(i)}</b><p>“${esc(text)}”</p></div>`;
  const line = (k: number, tag: string): string => lines[k] ? say(lines[k].who, lines[k].text, tag).replace(/<\/div>$/, `${lines[k].roll ? diceHtml(lines[k].roll, `d${at}-${k}`, lines[k].who === me) : ''}</div>`) : '';
  const args = (): string => who === me ? `<div class="dargs"><b>${lines.length === 0 ? 'Sua defesa' : lines.length === 1 ? 'Sua réplica' : 'Sua tréplica'}</b>${(() => { const all = Core.debateArgs(g, at), dp = (ui.dpick || []).filter(x => all.some(a => a.id === x)), comb = (a: { id: string }): boolean => a.id !== 'quiet' && a.id !== 'drop';
    const pw = (p: number): string => `<i class="pw ${p >= 0.45 ? 'f' : p >= 0.25 ? 'm' : 'w'}">${p >= 0.45 ? 'forte' : p >= 0.25 ? 'média' : p > 0 ? 'fraca' : '—'}</i>`;
    const sum = Math.min(0.95, 1 - all.filter(a => dp.includes(a.id)).reduce((m, a) => m * (1 - a.power), 1));
    const SHOW = 4, shown = ui.dmore ? all : all.filter((a, k) => k < SHOW || dp.includes(a.id) || a.id === 'quiet'), hidden = all.length - shown.length;   // D103: the strongest four first
    return `<p class="hint">Toque para dizer um só, ou marque ＋ em vários para um combo.</p>${shown.map(a => `<div class="darg-row${dp.includes(a.id) ? ' on' : ''}"><button data-act="darg" data-v="${esc(a.id)}"><span>${esc(a.label)}</span>${pw(a.power)}<small>“${esc(a.text)}”</small></button>${comb(a) ? `<button class="dplus" data-act="dcombo" data-v="${esc(a.id)}" aria-pressed="${dp.includes(a.id)}" aria-label="Juntar ao combo">${dp.includes(a.id) ? '✓' : '＋'}</button>` : ''}</div>`).join('')}${hidden > 0 ? `<button class="more" data-act="dmore" id="dmore">Mais argumentos (${hidden}) · mais fracos</button>` : ''}${dp.length ? `<button class="btn block go" data-act="dall" id="dall">${dp.length > 1 ? `Responder com tudo (${dp.length})` : 'Responder com isso'} ${pw(sum)}</button>` : ''}`; })()}</div>` : who >= 0 ? `<p class="dwait">${name(g, who)} está pensando no que dizer…</p>` : '';
  const combo = t.proofs && t.proofs.length > 1 ? Core.evidence({ ...g, hist: g.hist.slice(0, at) }, t.about, t.by).filter(x => (t.proofs as number[]).includes(x.at)) : [];
  const accLine = combo.length ? `${Core.comboText({ ...g, hist: g.hist.slice(0, at) }, combo)} ${name(g, t.about)}, explica isso.` : `${proof ? proof.text + '. ' : ''}${name(g, t.about)}, explica isso.`;
  const p1 = `${say(t.by, accLine, t.hit ? 'acusação · Contradição!' : 'acusação')}${t.about === me ? myPlays(g, me, proof && proof.at < 100000 ? proof.at : -1) : ''}${line(0, t.about === me ? 'sua defesa' : 'defesa')}${lines.length === 0 ? args() : ''}${lines.length === 0 && who === me && t.about === me ? '<button class="more" data-act="dlater" id="dlater">Responder depois</button>' : ''}`;   // D88
  // D84: the strength of each side so far (its best line), and on the person's turn what it takes to turn the debate
  const best = (j: number): number => Math.max(0, ...lines.filter(l => l.who === j).map(l => l.power));
  const force = lines.length ? `<div class="dforce" id="dforce"><span class="acc" style="--w:${Math.round(best(t.by) * 100)}%"><b>${name(g, t.by)}</b><i></i></span><span class="def" style="--w:${Math.round(best(t.about) * 100)}%"><b>${name(g, t.about)}</b><i></i></span>${who === me && who >= 0 ? `<small>Para virar, precisa de uma fala acima de ${Math.round(best(who === t.by ? t.about : t.by) * 100)}.</small>` : ''}</div>` : '';
  const p2 = lines.length < 1 ? '<p class="dwait">A réplica vem depois da defesa.</p>' : `${force}${line(1, 'réplica')}${lines.length === 1 ? args() : ''}${line(2, 'tréplica')}${lines.length === 2 ? args() : ''}`;
  const v = t.verdict || [], yes = v.filter(x => x[1] === 1).length, no = v.filter(x => x[1] === 0).length;
  const mark = ['✖ não procede', '✔ procede', '? não sabe'];
  const p3 = t.verdict ? `<ul class="dvotes">${v.map(([j, a], k) => `<li class="v${a}" style="--k:${k}"><b>${name(g, j)}</b><span>${mark[a]}</span><small>${WHY_V[a]}</small></li>`).join('')}</ul><div class="dres ${yes > no ? 'acc' : 'def'}"><b>Resultado</b><p>${yes} de ${v.length} acham que a acusação procede. ${yes > no ? `A acusação contra ${name(g, t.about)} pesa.` : `${name(g, t.about)} se defendeu: a acusação perdeu o peso.`}${t.backfire ? ` <b>A acusação era fraca e virou contra ${name(g, t.by)}, que perdeu reputação na mesa.</b>` : ''}</p></div><button class="btn block" data-act="dclose">Voltar ao jogo</button>` : '<p class="dwait">O veredito sai depois da tréplica.</p>';
  const page = (n: number, title: string, body: string): string => `<section class="dpage"><div class="dcard"><header><span>${n}/3</span><b>${title}</b></header>${body}</div></section>`;
  const cur = t.verdict ? 2 : lines.length >= 1 ? 1 : 0;
  let el = document.getElementById('debate');
  const keep = el ? (el.querySelector('.dpages') as HTMLElement | null)?.scrollLeft ?? 0 : 0;
  if (!el) { el = document.createElement('div'); el.id = 'debate'; el.className = 'debate'; document.body.appendChild(el); }
  const html = themed(`<div class="dpages">${page(1, 'Acusação', p1)}${page(2, 'Réplica e tréplica', p2)}${page(3, 'Veredito da mesa', p3)}</div><div class="ddots">${[0, 1, 2].map(k => `<i class="${k === cur ? 'on' : ''}"></i>`).join('')}</div>`, W as unknown as Record<string, string>);
  // D93: a repaint that changes nothing leaves the buttons in place: replacing them under a finger (iPhone) lost the tap,
  // so a single answer seemed not to work while a combo (several taps) did
  if (el.isConnected && lastDebate === html && el.childElementCount) return;
  lastDebate = html; el.innerHTML = html; rollDice(el); if (S.game) myRolls(S.game);   // D109
  const pages = el.querySelector('.dpages') as HTMLElement, dots = [...el.querySelectorAll('.ddots i')];
  pages.scrollLeft = keep;
  const want = cur * pages.clientWidth;
  if (Math.abs(pages.scrollLeft - want) > 4) pages.scrollTo({ left: want, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  pages.onscroll = () => { const k = Math.round(pages.scrollLeft / Math.max(1, pages.clientWidth)); dots.forEach((d, j) => d.classList.toggle('on', j === k)); };
}

/* D73: turning a vote. After the votes open, a short window: the votes of the app players can be tapped, and a sheet
   offers what to say, each reason with its strength. One try per vote. */
export function swayOpen(g: Game, cast: [number, boolean][], ms: number): void {
  const el = document.getElementById('ballot');
  if (!el) return;
  const me = solo(g), alive = g.players.map((p, i) => (p.alive ? i : -1)).filter(i => i >= 0);
  el.classList.add('sway-on');
  el.querySelectorAll<HTMLElement>('.b-seat').forEach((s, k) => {
    const i = alive[k];
    if (i === undefined || i === me || !g.players[i].ai || i === g.pres || i === g.chanc) return;   // the government votes for itself
    s.dataset.act = 'swayto'; s.dataset.i = String(i); s.classList.add('tap'); s.setAttribute('role', 'button'); s.setAttribute('aria-label', `Tentar virar o voto de ${g.players[i].name}`);
  });
  el.insertAdjacentHTML('beforeend', `<div class="sway" id="sway"><div class="sway-head"><b>Virar um voto</b><button class="sway-skip" data-act="swayskip" id="swayskip">Pular ›</button></div><div class="sway-bar"><i style="animation-duration:${ms}ms"></i></div><small>Toque no voto de uma IA para tentar convencer. Um por votação.</small><div id="swayopts"></div></div>`);
  void cast;
}
export function swayReasonsShow(g: Game, to: number, reasons: { id: string; label: string; text: string; power: number }[]): void {
  const box = document.getElementById('swayopts'), el = document.getElementById('ballot');
  if (!box || !el) return;
  el.querySelectorAll('.b-seat').forEach(s => s.classList.toggle('picked', (s as HTMLElement).dataset.i === String(to)));
  el.classList.add('sway-paused');   // D93: the clock stops while the person picks a reason
  const pw = (p: number): string => p >= 0.45 ? '<i class="pw f">forte</i>' : p >= 0.25 ? '<i class="pw m">média</i>' : '<i class="pw w">fraca</i>';
  box.innerHTML = `<p class="sway-to">Convencer <b>${name(g, to)}</b>:</p>${reasons.map(r => `<button class="krow" data-act="swaysay" data-v="${r.id}"><span><b>${esc(r.label)}</b><small>“${esc(r.text)}”</small></span>${pw(r.power)}</button>`).join('')}`;
}
export function swayResult(g: Game, to: number, flipped: boolean, roll?: DiceRoll): void {
  const box = document.getElementById('swayopts'), el = document.getElementById('ballot');
  if (!box || !el) return;
  const seat = el.querySelector<HTMLElement>(`.b-seat[data-i="${to}"] .b-card`);
  if (seat && flipped) { const ja = seat.classList.contains('ja'); seat.classList.toggle('ja', !ja); seat.classList.toggle('nein', ja); const sp = seat.querySelector('span'); if (sp) sp.textContent = ja ? W.nein : W.ja; seat.classList.add('flipped'); const g1 = el.querySelector('.b-score .g'), r1 = el.querySelector('.b-score .r'); if (g1) g1.textContent = String(el.querySelectorAll('.b-card.ja').length); if (r1) r1.textContent = String(el.querySelectorAll('.b-card.nein').length); }
  el.querySelectorAll('.b-seat').forEach(s => { s.removeAttribute('data-act'); s.classList.remove('tap'); });
  box.innerHTML = `${roll ? diceHtml(roll, `s${g.hist.length}-${to}`) : ''}<p class="sway-res ${flipped ? 'ok' : 'no'}">${flipped ? `✔ ${name(g, to)} virou o voto.` : `✖ ${name(g, to)} manteve o voto.`}</p>`;
  rollDice(box);
}
export function swayClose(): void { const el = document.getElementById('ballot'); if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 450); } }

const RANK_OK = (r: Roll): boolean => r.level !== 'fail' && r.level !== 'fumble';
/** D109: the seat of the one person at a table with the app, or -1. */
export function soloSeat(g: Game): number {
  const people = g.players.map((p, j) => (p.ai ? -1 : j)).filter(j => j >= 0);
  return people.length === 1 ? people[0] : -1;
}

/* D109: the person's own rolls, big in the middle of the screen, like a tabletop RPG: the skill and the number to beat,
   the bonus (or penalty) die with both tens, the die tumbling, and how it went. Each roll once; what was on the record
   when the game was opened is not replayed. */
let seenRolls: Set<string> | null = null, seenGame = '';
/* D130: each roll of the person is told as a small scene: why it is rolled, what it takes, the die, and what it means;
   it stays until "Seguir", one at a time, and the game waits for it. */
type MyRoll = { key: string; r: Roll; title: string; why: string; sub: string; quiet?: boolean };
function rollsOf(g: Game, me: number): MyRoll[] {
  const out: MyRoll[] = [], nm = (i: number): string => g.players[i]?.name || '';
  g.hist.forEach((e, k) => {
    if (e.k === 'talk') (e.deb || []).forEach((l, n) => { if (l.who === me && l.roll) out.push({ key: `d${k}.${n}`, r: l.roll, title: 'Seu argumento no debate', why: `Você disse: “${l.text}”. O dado decide se isso convence a mesa.`, sub: RANK_OK(l.roll) ? 'Convenceu: o argumento pesa mais.' : 'Não convenceu: o argumento pesa menos.' }); });
    if (e.k === 'steal' && (e.by === me || e.from === me)) out.push({ key: `s${k}`, r: e.by === me ? e.roll : e.vs, title: e.by === me ? `Roubar ${nm(e.from)}` : `${nm(e.by)} tentou te roubar`, why: e.by === me ? `Você tenta pegar o item de ${nm(e.from)} sem ele ver: sua Prestidigitação contra o Encontrar dele.` : `${nm(e.by)} tentou pegar o seu item: o seu Encontrar contra a Prestidigitação dele.`, sub: e.ok ? (e.by === me ? `Deu certo. Agora é seu: ${Core.ITEMS[e.got as ItemKey].name}.` : `Ele levou: ${Core.ITEMS[e.got as ItemKey].name}.`) : (e.by === me ? 'Ele percebeu. Nada feito.' : 'Você percebeu a tempo.') });
    if (e.k === 'trap') { const x = e.rolls.find(y => y.seat === me); if (x && (e.healer === undefined || e.healer === me)) { const T = Core.TRAPS[e.id as TrapKey]; out.push({ key: `t${k}`, quiet: true, r: x.roll, title: `Armadilha: ${T.name}`, why: `${T.text} Cada um rola para escapar.`, sub: RANK_OK(x.roll) ? 'Você escapou.' : `Você não escapou${x.loss ? `: perde ${x.loss} de sanidade` : ''}${x.state ? ` e fica ${x.state}` : ''}.` }); } }
    if (e.k === 'exec' && e.by === me && e.atk) out.push({ key: `x${k}`, r: e.atk, title: `Eliminar ${nm(e.target)}`, why: `Você eliminou ${nm(e.target)}. O dado só diz se foi rápido ou feio; a eliminação acontece de qualquer jeito.`, sub: RANK_OK(e.atk) ? 'Rápido e limpo.' : 'Foi feio: a mesa toda perde mais sanidade.' });
    if (e.k === 'sense' && e.by === me && e.boss !== undefined) out.push({ key: `o${k}`, quiet: true, r: e.roll, title: `Ocultismo em ${nm(e.about)}`, why: `Seu Ocultismo procura algo de errado em ${nm(e.about)}.`, sub: e.boss ? `Algo em ${nm(e.about)} te arrepia. Cuidado.` : `Nada de estranho em ${nm(e.about)}.` });
    if (e.k === 'psy' && e.by === me && e.roll && e.read) out.push({ key: `p${k}`, quiet: true, r: e.roll, title: `Você lê ${nm(e.about)}`, why: `${nm(e.about)} disse à mesa o que viu. Sua Psicologia contra a ${e.vs?.label || 'Persuasão'} dele${e.vs ? ` (ele tirou ${e.vs.d}, precisava de ${e.vs.val})` : ''}: se você vencer, sabe se é verdade.`, sub: e.lie ? `Você percebeu: ${nm(e.about)} está mentindo.` : `Você percebeu: ${nm(e.about)} disse a verdade.` });
  });
  return out;
}
export function myRolls(g: Game): void {
  const me = soloSeat(g);
  if (me < 0 || !g.sheets) return;
  const all = rollsOf(g, me), id = String(g.players.map(p => p.name)) + g.deck.length;
  if (!seenRolls || seenGame !== (g.hist[0] ? id : '')) { seenRolls = new Set(all.map(x => x.key)); seenGame = g.hist[0] ? id : ''; return; }
  const fresh = all.filter(x => !(seenRolls as Set<string>).has(x.key));
  fresh.forEach(x => (seenRolls as Set<string>).add(x.key));
  // D112: never over what the table is watching (the envelope of an investigation, a law coming out): after it
  // D132: only what the person did, or what was done to the person, is shown big; the automatic rolls (traps, reading
  // someone, sensing something) are a short note that does not hold the game
  const big = fresh.filter(x => !x.quiet), quiet = fresh.filter(x => x.quiet);
  if (quiet.length) toast(quiet.map(x => `🎲 ${x.r.label} ${String(x.r.d).padStart(2, '0')}: ${x.sub}`).join(' '));
  if (big.length) whenClear(() => big.forEach(x => bigRoll(x.r, x.title, x.sub, x.why)));
}
/** Run once nothing the table watches is on the screen (checked a beat later, so what starts with this same move counts). */
function whenClear(run: () => void, waited = 0): void {
  setTimeout(() => (waited < 6000 && (frozenFor() > 0 || document.querySelector('.claim-fx, .fxl:not(.big-roll)')) ? whenClear(run, waited + 250) : run()), 250);
}
/* D117, D130: the rolls wait their turn, one at a time; each stays until "Seguir", and the game waits under it. */
const ROLL_SPIN = 30;
const rollQueue: [Roll, string, string, string][] = [];
export function bigRoll(r: Roll, title: string, sub = '', why = ''): void {
  rollQueue.push([r, title, sub, why]);
  if (!document.querySelector('.big-roll')) nextRoll();
}
function nextRoll(): void {
  const item = rollQueue.shift();
  if (item) showRoll(...item);
}
function showRoll(r: Roll, title: string, sub = '', why = ''): void {
  const good = RANK_OK(r), need = r.hard ? Math.floor(r.val / 2) : r.val;
  const notes = [
    r.hard ? 'Teste difícil: vale metade da perícia.' : '',
    r.base !== undefined && r.base !== r.val ? `Ficha ${r.base}, +${r.val - r.base} da mesa.` : '',
    r.mod === 1 ? 'Dado de bônus: rola duas dezenas e fica com a menor.' : r.mod === -1 ? 'Dado de penalidade: rola duas dezenas e fica com a maior.' : '',
    r.shaken ? 'Abalado: a sanidade baixa atrapalha.' : '',
    r.helped ? `${Core.CHAR_NAME[r.helped] || r.helped} alta ajuda.` : ''
  ].filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('');
  const tens = r.tens ? `<div class="br-tens">Dezenas: ${r.tens.map(t => `<i class="${t * 10 + ((r.d - 1) % 10) + 1 === r.d ? 'kept' : ''}">${String(t * 10).padStart(2, '0')}</i>`).join('')}</div>` : '';
  const el = document.createElement('div');
  el.className = `fxl big-roll ${r.level} ${good ? 'good' : 'bad'}`; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
  el.innerHTML = `<div class="br-card"><small class="br-title">${esc(title)}</small>${why ? `<p class="br-why">${esc(why)}</p>` : ''}<div class="br-test"><b class="br-skill">${esc(r.label)} <span>${r.val}</span></b><span class="br-need">Precisa tirar <b>${need}</b> ou menos no d100</span>${notes ? `<ul class="br-notes">${notes}</ul>` : ''}</div>${tens}<div class="br-die"><span class="br-num">??</span></div><div class="br-after"><b class="br-res">Tirou ${String(r.d).padStart(2, '0')}: ${Core.ROLL_NAME[r.level]}</b>${r.luck ? `<p class="br-luck">🍀 Gastou ${r.luck} de Sorte para passar.</p>` : ''}${sub ? `<p class="br-sub">${esc(sub)}</p>` : ''}<button class="btn primary block" id="rollok">Seguir ▸</button></div></div>`;
  document.body.appendChild(el);
  el.querySelector('#rollok')?.addEventListener('click', e => { e.stopPropagation(); el.remove(); nextRoll(); });
  const num = el.querySelector('.br-num') as HTMLElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { num.textContent = String(r.d).padStart(2, '0'); el.classList.add('land'); return; }
  let n = 0;
  const t = setInterval(() => { num.textContent = String(1 + ((r.d * 31 + n * 47) % 100)).padStart(2, '0'); if (++n >= ROLL_SPIN) { clearInterval(t); num.textContent = String(r.d).padStart(2, '0'); el.classList.add('land'); } }, 60);
}

/* D118, D129: the narrator's lines (📜 and 📄 in the log) are told once, on a page over the whole screen, in the
   keeper's voice: the opening, each act and the end. The game waits under it until "Seguir". Lines already on the
   record when the game was opened are not told again. */
export let toldKey = '', told = 0;
export function tellStory(g: Game): void {
  const lines = g.log.filter(l => l.startsWith('📜 ') || l.startsWith('📄 ')), key = String(g.players.map(p => p.name)) + (g.scene || '');
  if (key !== toldKey) { document.querySelectorAll('.narrator').forEach(x => x.remove()); toldKey = key; told = g.hist.length || g.log.length > lines.length + 2 ? lines.length : 0; }
  if (lines.length <= told) return;
  const fresh = lines.slice(told); told = lines.length;
  document.querySelectorAll('.narrator').forEach(x => x.remove());
  const el = document.createElement('div');
  el.className = 'fxl narrator'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'A história');
  el.innerHTML = `<div class="nar-page">${fresh.map(l => l.startsWith('📄') ? `<p class="nar-doc">${esc(l.slice(3))}</p>` : `<p>${esc(l.slice(3))}</p>`).join('')}</div><button class="btn primary block" id="storyok">Seguir ▸</button>`;
  document.body.appendChild(el);
  el.querySelector('#storyok')?.addEventListener('click', e => { e.stopPropagation(); el.remove(); });
}

/** D138: the login page; the demo account (a pedestrian) is shown on purpose, for whoever looks at the portfolio. */
