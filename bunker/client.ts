/* D159: the bunker's page: the two historical themes, online, each on their own phone. Only what the server says this
   seat may see reaches the page (room.ts, seatView). */
import { words } from '../src/core/words';
import { POWERS, boardOf, WIN, TRACKER_MAX, canNominate, canTarget, canVeto, MIN_PLAYERS } from '../src/core/game';
import { enterBunker } from './key';
import { roomCode, isCode } from './room';
import type { ClientMsg, SeatView } from './room';

const KEY = 'bunker.v1';
interface Saved { token: string; name: string; code: string; pw: string }
const load = (): Saved => { try { return { token: '', name: '', code: '', pw: '', ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { token: '', name: '', code: '', pw: '' }; } };
const save = (): void => { try { localStorage.setItem(KEY, JSON.stringify(me)); } catch { /* storage off */ } };
const me: Saved = load();
if (!me.token) { me.token = crypto.randomUUID(); save(); }

let ws: WebSocket | null = null, view: SeatView | null = null, error = '', busy = false, showRole = false, retry = 0;
const app = document.getElementById('app') as HTMLElement;
const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const send = (m: ClientMsg): void => { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); };

function connect(): void {
  ws?.close();
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const sock = new WebSocket(`${proto}://${location.host}/salas/${me.code}`);
  ws = sock;
  sock.onopen = () => { retry = 0; send({ t: 'join', token: me.token, name: me.name, pw: me.pw }); };
  sock.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.t === 'error') { error = m.why; if (m.why === 'Senha errada.' || m.why.includes('já começou') || m.why.includes('nome') ) { if (!view) { sock.close(); ws = null; } } }
    else { view = m as SeatView; error = ''; }
    busy = false; render();
  };
  sock.onclose = () => { if (ws === sock && view) { setTimeout(connect, Math.min(8000, 500 * 2 ** retry++)); } };
}

async function enter(create: boolean): Promise<void> {
  const pw = (document.getElementById('pw') as HTMLInputElement).value, name = (document.getElementById('name') as HTMLInputElement).value.trim();
  const code = create ? roomCode(Math.random) : (document.getElementById('code') as HTMLInputElement).value.trim().toUpperCase();
  if (!name) { error = 'Escreva seu nome.'; render(); return; }
  if (!isCode(code)) { error = 'Código de sala inválido.'; render(); return; }
  busy = true; error = ''; render();
  if (!(await enterBunker(pw))) { busy = false; error = 'Senha errada.'; render(); return; }
  Object.assign(me, { pw, name, code }); save(); connect();
}

function leave(): void { const s = ws; ws = null; s?.close(); view = null; me.code = ''; save(); render(); }

const W = () => words(view?.pack);
const seatName = (i: number): string => esc(view?.game?.players[i]?.name ?? '');
const roleName = (r: string | null): string => (r === 'liberal' ? 'Liberal' : r === 'lider' ? W().boss : r === 'cultista' ? W().F : '?');

function vEntry(): string {
  return `<h1>Bunker</h1><section class="card"><label class="label" for="pw">Senha</label><input id="pw" type="password" value="${esc(me.pw)}">
    <label class="label" for="name">Seu nome</label><input id="name" maxlength="20" value="${esc(me.name)}" autocomplete="nickname">
    <button class="primary" data-a="create" style="width:100%"${busy ? ' disabled' : ''}>Criar sala</button>
    <p class="hint">Ou entre numa sala que já existe:</p>
    <input id="code" placeholder="Código da sala" maxlength="5" autocapitalize="characters" value="${esc(me.code)}">
    <button data-a="join" style="width:100%"${busy ? ' disabled' : ''}>Entrar</button>
    ${error ? `<p class="err">${esc(error)}</p>` : ''}</section>`;
}

function vLobby(v: SeatView): string {
  const pk = (k: 'classico' | 'vermelho') => `<button class="${v.pack === k ? 'on' : ''}" data-a="pack" data-v="${k}"${v.host ? '' : ' disabled'}>${esc(words(k).theme)}</button>`;
  return `<h1>Sala ${esc(v.code)}</h1><section class="card"><p class="hint">Mande o código <b>${esc(v.code)}</b> e a senha para a galera. De ${MIN_PLAYERS} a 10 pessoas.</p>
    <ul class="seats">${v.members.map((m, i) => `<li><span>${esc(m.name)}${i === 0 ? ' (quem criou)' : ''}</span><span class="hint">${m.online ? 'na sala' : 'saiu'}</span></li>`).join('')}</ul></section>
    <section class="card"><span class="label">Tema</span><div class="row">${pk('classico')}${pk('vermelho')}</div></section>
    ${v.host ? `<button class="primary" data-a="start" style="width:100%"${v.members.length < MIN_PLAYERS ? ' disabled' : ''}>${v.members.length < MIN_PLAYERS ? `Faltam ${MIN_PLAYERS - v.members.length}` : 'Começar'}</button>` : '<p class="hint">Esperando quem criou a sala começar.</p>'}
    ${error ? `<p class="err">${esc(error)}</p>` : ''}<p><button data-a="leave">Sair da sala</button></p>`;
}

function vBoard(v: SeatView): string {
  const g = v.game!, n = g.players.length, pw = POWERS[boardOf(n)];
  const cells = (k: 'L' | 'F') => Array.from({ length: WIN[k] }, (_, i) => `<i class="${i < g.laws[k] ? k : ''}" title="${k === 'F' && pw[i + 1] ? esc(pw[i + 1]) : ''}"></i>`).join('');
  return `<section class="card"><span class="label">Leis liberais</span><div class="track">${cells('L')}</div>
    <span class="label">Leis ${esc(W().fs)}</span><div class="track">${cells('F')}</div>
    <p class="hint">Governos sem lei: ${g.tracker} de ${TRACKER_MAX} · Baralho: ${v.deckN} · Descarte: ${v.discardN}</p></section>`;
}

function vSeats(v: SeatView, pick?: (i: number) => boolean): string {
  const g = v.game!;
  return `<section class="card"><span class="label">Mesa</span><ul class="seats">${g.players.map((p, i) => {
    const tag = [i === g.pres ? 'presidente' : '', i === g.chanc ? 'chanceler' : '', i === v.me ? 'você' : '', v.members[i]?.online ? '' : 'offline'].filter(Boolean).join(' · ');
    const r = v.roles[i], vt = g.phase === 'vote' ? (v.voted[i] ? ' ✓' : '') : '';
    const btn = pick && pick(i) ? `<button data-a="pick" data-i="${i}">Escolher</button>` : '';
    return `<li><span class="${p.alive ? '' : 'dead'}">${esc(p.name)}${vt} <small class="hint">${tag}</small>${r && i !== v.me && showRole ? ` <small class="${r === 'liberal' ? 'tagL' : 'tagF'}">${esc(roleName(r))}</small>` : ''}</span>${btn}</li>`;
  }).join('')}</ul></section>`;
}

const law = (l: string, i: number, act: string): string => `<button class="${l === 'L' ? 'lib' : 'fas'}" data-a="${act}" data-i="${i}">Descartar ${l === 'L' ? 'liberal' : esc(W().f)}</button>`;

function vPhase(v: SeatView): string {
  const g = v.game!, isP = v.me === g.pres, isC = v.me === g.chanc, alive = g.players[v.me].alive, P = seatName(g.pres), C = g.chanc !== null ? seatName(g.chanc) : '';
  if (g.phase === 'over') return `<section class="card"><p class="big">${g.winner === 'L' ? 'Liberais venceram' : `${esc(W().F)}s venceram`}</p><p>${esc(g.why)}</p>
    <ul class="seats">${g.players.map((p, i) => `<li><span>${esc(p.name)}</span><span class="${v.roles[i] === 'liberal' ? 'tagL' : 'tagF'}">${esc(roleName(v.roles[i]))}</span></li>`).join('')}</ul>
    ${v.host ? '<button class="primary" data-a="start" style="width:100%">Jogar de novo</button>' : '<p class="hint">Quem criou a sala pode começar outra.</p>'}</section>`;
  if (!alive) return `<section class="card"><p>Você foi eliminado: assista até o fim, calado.</p></section>`;
  switch (g.phase) {
    case 'nominate': return `<section class="card"><p class="big">${isP ? 'Você é presidente: indique o chanceler' : `${P} vai indicar o chanceler`}</p></section>${vSeats(v, isP ? i => canNominate(g, i) : undefined)}`;
    case 'vote': { const mine = v.voted[v.me];
      return `<section class="card"><p class="big">Governo ${P} + ${C}</p><p class="hint">Discutam em voz alta e votem. ${mine ? 'Seu voto foi. Dá para trocar até o último votar.' : ''}</p>
        <div class="row"><button class="lib" data-a="vote" data-v="1">${esc(W().ja)}</button><button class="fas" data-a="vote" data-v="0">${esc(W().nein)}</button></div></section>`; }
    case 'president': return isP ? `<section class="card"><p class="big">Você tirou 3 leis: descarte 1</p><div class="row">${g.hand.map((l, i) => law(l, i, 'pdiscard')).join('')}</div></section>` : `<section class="card"><p>${P} (presidente) está escolhendo as leis.</p></section>`;
    case 'chancellor': return isC ? `<section class="card"><p class="big">Descarte 1: a outra é aprovada</p><div class="row">${g.hand.map((l, i) => law(l, i, 'cdiscard')).join('')}</div>${canVeto(g) ? '<p><button data-a="veto" style="width:100%">Pedir veto</button></p>' : ''}</section>` : `<section class="card"><p>${C} (chanceler) está escolhendo a lei.</p></section>`;
    case 'veto': return isP ? `<section class="card"><p class="big">${C} pediu veto</p><p class="hint">Leis na mão: ${g.hand.map(l => (l === 'L' ? 'liberal' : esc(W().f))).join(' e ')}</p><div class="row"><button data-a="answer" data-v="1">Aceitar</button><button data-a="answer" data-v="0">Recusar</button></div></section>` : `<section class="card"><p>${C} pediu veto; ${P} decide.</p></section>`;
    case 'investigate': case 'special': case 'execute': {
      const what = g.phase === 'investigate' ? 'investigar o partido de alguém' : g.phase === 'special' ? 'escolher o próximo presidente' : 'eliminar alguém';
      return isP ? `<section class="card"><p class="big">Poder: ${what}</p></section>${vSeats(v, i => canTarget(g, i))}` : `<section class="card"><p>${P} vai ${what}.</p></section>`; }
    case 'investigated': return isP ? `<section class="card"><p class="big">${seatName(g.target ?? 0)} é ${v.party === 'L' ? 'liberal' : esc(W().f)}</p><p class="hint">Só você viu. Diga o que quiser à mesa.</p><button class="primary" data-a="done" style="width:100%">Seguir</button></section>` : `<section class="card"><p>${P} investigou ${seatName(g.target ?? 0)}.</p></section>`;
    case 'peek': return isP ? `<section class="card"><p class="big">As próximas 3 leis</p><p>${(v.peek || []).map(l => (l === 'L' ? 'liberal' : esc(W().f))).join(', ')}</p><button class="primary" data-a="done" style="width:100%">Seguir</button></section>` : `<section class="card"><p>${P} está olhando as próximas 3 leis.</p></section>`;
    default: return '';
  }
}

function vGame(v: SeatView): string {
  const g = v.game!, r = v.roles[v.me];
  const team = g.phase !== 'over' && r !== 'liberal' && v.roles.some((x, i) => x && i !== v.me);
  const role = `<section class="card"><button data-a="role" style="width:100%">${showRole ? 'Esconder meu papel' : 'Ver meu papel'}</button>
    ${showRole ? `<p class="big ${r === 'liberal' ? 'tagL' : 'tagF'}">${esc(roleName(r))}</p>${team ? `<p class="hint">${v.roles.map((x, i) => (x && i !== v.me ? `${seatName(i)}: ${esc(roleName(x))}` : '')).filter(Boolean).join(' · ')}</p>` : ''}` : ''}</section>`;
  const last = v.last ? `<p class="hint">Última votação: ${g.players.map((p, i) => (v.last![i] === null ? '' : `${esc(p.name)} ${v.last![i] ? '👍' : '👎'}`)).filter(Boolean).join(' · ')}</p>` : '';
  return `<h1>${esc(W().theme)}</h1>${vPhase(v)}${error ? `<p class="err">${esc(error)}</p>` : ''}${g.phase !== 'over' ? role : ''}${vBoard(v)}${g.phase === 'nominate' || g.phase === 'investigate' || g.phase === 'special' || g.phase === 'execute' ? '' : vSeats(v)}
    <section class="card"><span class="label">O que aconteceu</span>${last}<div class="log">${[...g.log].reverse().slice(0, 30).map(l => `<p>${esc(l)}</p>`).join('')}</div></section>
    <p class="hint">Sala ${esc(v.code)} · <button data-a="leave">Sair</button></p>`;
}

function render(): void {
  if (document.activeElement instanceof HTMLInputElement && view === null && !busy && !error) return;
  app.innerHTML = !view ? vEntry() : !view.game ? vLobby(view) : vGame(view);
}

app.addEventListener('click', e => {
  const b = (e.target as HTMLElement).closest('button[data-a]') as HTMLButtonElement | null;
  if (!b || b.disabled) return;
  const a = b.dataset.a, i = Number(b.dataset.i), g = view?.game;
  if (a === 'create') void enter(true);
  else if (a === 'join') void enter(false);
  else if (a === 'leave') leave();
  else if (a === 'role') { showRole = !showRole; render(); }
  else if (a === 'pack') send({ t: 'pack', v: b.dataset.v as 'classico' | 'vermelho' });
  else if (a === 'start') { showRole = false; send({ t: 'start' }); }
  else if (a === 'vote') send({ t: 'vote', v: b.dataset.v === '1' });
  else if (a === 'pick' && g) send({ t: 'act', a: g.phase === 'nominate' ? 'nominate' : 'target', i });
  else if (a === 'pdiscard' || a === 'cdiscard') send({ t: 'act', a, i });
  else if (a === 'veto') send({ t: 'act', a: 'veto' });
  else if (a === 'answer') send({ t: 'act', a: 'answer', v: b.dataset.v === '1' });
  else if (a === 'done') send({ t: 'act', a: 'done' });
});
document.addEventListener('visibilitychange', () => { if (document.hidden && showRole) { showRole = false; render(); } });

render();
if (me.code && me.pw && me.name) void enterBunker(me.pw).then(ok => { if (ok) connect(); });
