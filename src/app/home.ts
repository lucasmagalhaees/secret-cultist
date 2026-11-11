/* The home screen (D143, out of render.ts): the quick game, the table, the theme, the options, the rules, the
   history and the login. */
import { Core } from '../core';
import type { Game, Gov, Level, Pack, Region, Role } from '../core';
// import type { ItemKey, TrapKey } from '../core/index';
import { animalOf, face, portrait } from './art';
import { esc } from './format';
import { S, dlcOn, packNow, packsOpen, ui } from './state';
import { builtFrom, canUpdate } from './update';
import { earned, kept, past } from './history';
import { AI_TAG, LEVEL, role, solo } from './render';
/* ---------- before the game: the table ---------- */
/** Play again at once (D34): with a table that is ready, one big button with the last setup, before anything else. */
/** D89: the tutorial's tips, each when its moment comes, in order; the first one not read yet shows (and holds the
 *  app players until it is read). Only the rules and what the whole table sees: never a secret. */
export function tutTip(g: Game | null): { key: string; text: string } | null {
  if (!g || !g.tut) return null;
  const me = g.players.findIndex(p => !p.ai), seen = new Set(g.tut), last = [...g.hist].reverse().find(e => e.k === 'gov' || e.k === 'chaos');
  const mine = g.hist.filter((e): e is Gov => e.k === 'gov' && (e.pres === me || e.chanc === me)).pop();
  const tips: [string, boolean, string][] = [
    ['role', g.phase === 'reveal', 'Cada um vê o próprio papel em segredo. Aqui você vai ser liberal. Os liberais são maioria e ganham com 5 leis liberais, ou eliminando o {boss}. Os {fs} são poucos, se conhecem e ganham com 6 leis {fs}, ou elegendo o {boss} chanceler depois da 3ª lei {f}.'],
    ['nominate-ai', g.phase === 'nominate' && g.pres !== me, 'Cada rodada tem um presidente, e a vez passa em ordem. O presidente indica um chanceler. Repare em quem indica quem: um {f} costuma puxar um aliado.'],
    ['nominate-me', g.phase === 'nominate' && g.pres === me, 'Agora o presidente é você. Indique um chanceler. Quem já aprovou lei liberal tende a ser mais confiável; o último governo eleito não pode voltar como chanceler.'],
    ['vote', g.phase === 'vote', 'Todos votam {ja} ou {nein} no governo. Mais {ja} que {nein}: eleito. Três governos rejeitados seguidos, e o caos aprova a lei do topo do baralho.'],
    ['president-me', g.phase === 'president' && g.pres === me, 'Você tirou 3 leis do baralho. Toque numa para descartar: as outras 2 vão para o chanceler. Se tem liberal, passe a liberal adiante.'],
    ['chancellor-me', g.phase === 'chancellor' && g.chanc === me, 'Você recebeu 2 leis do presidente. A que você não descartar é aprovada.'],
    ['claim', !!mine && (mine.pres === me ? mine.pc === undefined : mine.cc === undefined), 'Agora conte à mesa o que você teve na mão. Dá para mentir, mas liberal diz a verdade: é comparando as histórias que a mesa descobre quem mente.'],
    ['lawF', !!last && (last.k === 'gov' || last.k === 'chaos') && last.law === 'F' && g.laws.F >= 1, 'Saiu uma lei {f}. Nem sempre é culpa de alguém: o baralho tem 11 {fs} e só 6 liberais. Mas compare o que o presidente e o chanceler disseram: se as histórias não batem, alguém mentiu.'],
    ['notes', g.laws.F + g.laws.L >= 2 && g.phase !== 'over', 'Abra as Anotações e marque quem você acha liberal ou {f}. O 📣 diz à mesa, e acusar com uma prova da ata pesa bem mais que só desconfiar.'],
    ['power', ['investigate', 'peek', 'special', 'execute'].includes(g.phase), 'Algumas leis {fs} dão um poder ao presidente: investigar o partido de alguém, ver as próximas leis, escolher o próximo presidente ou eliminar alguém. Quem investiga conta à mesa o que viu, e pode mentir.'],
    ['zone', g.laws.F >= 3 && g.phase !== 'over', 'Cuidado: já são 3 leis {fs}. Se o {boss} for eleito chanceler agora, os {fs} ganham na hora. Vote {nein} em chanceler de quem você desconfia.'],
    // D107: Secret Cultist's own tips: the sheet, the dice and sanity
    ['sheet', !!g.sheets && g.pack === 'culto' && g.phase === 'nominate', 'Cada um tem uma ficha de investigador do Call of Cthulhu. Toque num nome na lista de jogadores para ver a ficha: Persuasão, Lábia, Charme, Psicologia e a sanidade (SAN).'],
    ['dice', !!g.sheets && g.pack === 'culto' && g.hist.some(e => e.k === 'talk' && (e.deb || []).some(l => !!l.roll)), 'O que se diz no debate é rolado num d100 contra a perícia da ficha: quanto menor, melhor. Um sucesso deixa a fala mais forte; uma falha, mais fraca.'],
    ['san', !!g.sheets && g.pack === 'culto' && (Core.sanity(g, me) ?? 99) < Core.SAN_LOW, 'Sua sanidade caiu: cada eliminação e cada lei {f} custam SAN. Abaixo do limite você fica abalado, e as perícias rolam com dado de penalidade.'],
    ['over', g.phase === 'over', 'Fim do tutorial! Agora você sabe o básico. Em "Jogar agora" a partida é de verdade, contra a IA no difícil.']
  ];
  const t = tips.find(([k, on]) => on && !seen.has(k));
  return t ? { key: t[0], text: t[2] } : null;
}
export function vTut(g: Game): string {
  const t = tutTip(g);
  return t ? `<section class="card tut" id="tut"><span class="label">📘 Tutorial</span><p>${t.text}</p><button class="btn block" data-act="tutok" data-v="${t.key}">Entendi</button></section>` : '';
}
export function vQuick(): string {
  // "Jogar agora" is the quick game (D35): 7 seats, you and 6 app players at the hard level, no assistance, theme and
  // continent drawn at random; the table below stays for setting up a game by hand
  if (S.game) return '';
  const pk = packNow();   // D141: the quick game plays the theme picked in "Tema do jogo"
  return `<section class="card quick" id="quick">${pk === 'culto' ? cultSetup() : ''}<button class="btn block big" data-act="quickgame" id="quickgame">${ui.playMode === 'campanha' && pk === 'culto' ? '▶ Começar a campanha' : '▶ Jogar agora'}</button><p class="hint">Partida rápida: 7 lugares, você e 6 IAs no difícil (o nível em Contra a IA vale para a mesa que você monta), sem assistência, no tema escolhido em Tema do jogo.</p><button class="btn ghost block" data-act="tutorial" id="tutorial">📘 Nunca jogou? Tutorial</button></section>`;
}
/** Your game at a glance, at the top of the result (D34): won or lost, with what role, and how the notebook did. */
export function vYours(g: Game): string {
  const me = solo(g);
  if (me < 0 || !g.winner) return '';
  const p = g.players[me], won = Core.partyOf(p.role) === g.winner, sc = g.notes ? Core.notesScore(g, me) : null, n = sc ? sc.right.length + sc.wrong.length : 0;
  return `<section class="card yours ${won ? 'won' : 'lost'}" id="yours"><p class="big">${won ? '🏆 Você venceu' : '💀 Você perdeu'}</p><p>Você era <span class="role ${Core.partyOf(p.role)}">${role(p.role)}</span>${n ? ` · caderno: <b>${sc?.right.length}</b> de ${n} certas` : ''}</p>${vBadges(g, me)}<button class="btn ghost block" data-act="share" id="share">📤 Compartilhar resultado</button></section>`;
}
/** The achievements of this game (D41), and how many of all there are the person has on the device. */
function vBadges(g: Game, me: number): string {
  const got = Core.achievements(g, me), all = Object.keys(Core.ACHIEVEMENTS), have = earned();
  return `<div class="badges" id="badges"><small>Conquistas ${have.size}/${all.length}</small>${got.length ? got.map(a => `<span class="badge-a" title="${Core.ACHIEVEMENTS[a][1]}">🏅 ${Core.ACHIEVEMENTS[a][0]}</span>`).join('') : '<span class="hint">Nenhuma nesta partida.</span>'}</div>`;
}
export function vTable(): string {
  const names = S.names, n = names.length;
  let h = `<section class="card" id="table"><span class="label">Mesa (${Core.MIN_PLAYERS} a ${Core.MAX_PLAYERS} jogadores)</span>`;
  h += n ? `<ul class="names" id="names">${names.map((x, i) => `<li><span>${i + 1}. <b>${esc(x)}</b>${S.ai?.[i] ? ` ${AI_TAG}` : ''}</span><button class="x" data-act="rmname" data-i="${i}" aria-label="Tirar ${esc(x)}">×</button></li>`).join('')}</ul>`
    : '<p class="empty" id="empty">Ninguém na mesa ainda. Coloque os nomes na ordem em que vocês estão sentados.</p>';
  h += `<div class="row"><div class="field"><input id="name" maxlength="${Core.NAME_MAX}" autocomplete="off" placeholder="nome do jogador" value="${esc(ui.name)}" aria-label="Nome do jogador"></div><button class="btn" data-act="addname">Pôr</button><button class="btn ghost" data-act="addbot"${n >= Core.MAX_PLAYERS ? ' disabled' : ''}>+ IA</button></div>`;
  h += ui.msg ? `<p class="msg" id="msg">${esc(ui.msg)}</p>` : '';
  h += n ? `<button class="more" data-act="clear" id="clear">${ui.confirmClear ? 'Toque de novo para tirar todos' : 'Limpar a mesa'}</button>` : '';
  const short = Core.MIN_PLAYERS - n;
  h += short > 0
    ? `<button class="btn block" data-act="start" disabled>Faltam ${short} para começar</button>${n ? `<button class="btn ghost block" data-act="fill" data-n="${Core.MIN_PLAYERS}" id="fillmin">Completar com ${short} da IA</button>` : '<p class="hint">Ponha os nomes, ou só o seu e complete com a IA.</p>'}</section>`
    : `<button class="btn block" data-act="start">Começar com ${n} jogadores</button></section>`;
  return h + vSolo();
}
/** The choices of a game against the app that are not needed to start one (D18): the training role, the speed, the
 *  trainer and the minutes. Closed, one line says how they are set. */
function vMore(): string {
  return `<div id="moreopts">
    <p class="hint">Seu papel (treino)</p><div class="segm roles" role="group" aria-label="Seu papel">${(['', 'liberal', 'cultista', 'lider'] as const).map(r => `<button class="${(S.train || '') === r ? 'on' : ''}" data-act="train" data-v="${r}" aria-pressed="${(S.train || '') === r}">${r ? role(r) : 'Sorteado'}</button>`).join('')}</div>
    <p class="hint" id="traintext">${S.train ? `Você vai ser ${role(S.train).toLowerCase()}, para treinar esse lado. Vale quando só você é gente na mesa; as IAs não sabem que você escolheu.` : 'O seu papel é sorteado, como numa partida normal.'}</p>
    <p class="hint">Velocidade da IA</p><div class="segm" role="group" aria-label="Velocidade da IA">${(['lenta', 'normal', 'rapida'] as const).map(v => `<button class="${(S.speed || 'normal') === v ? 'on' : ''}" data-act="speed" data-v="${v}" aria-pressed="${(S.speed || 'normal') === v}">${{ lenta: 'Lenta', normal: 'Normal', rapida: 'Rápida' }[v]}</button>`).join('')}</div>
    <p class="hint">Dicas do treinador</p><div class="segm" role="group" aria-label="Dicas do treinador"><button class="${S.coach ? '' : 'on'}" data-act="coach" data-v="off" aria-pressed="${!S.coach}">Desligadas</button><button class="${S.coach ? 'on' : ''}" data-act="coach" data-v="on" aria-pressed="${!!S.coach}">Ligadas</button></div>
    <p class="hint">Reputação</p><div class="segm" role="group" aria-label="Reputação"><button class="${S.rep ? '' : 'on'}" data-act="rep" data-v="off" aria-pressed="${!S.rep}">Desligado</button><button class="${S.rep ? 'on' : ''}" data-act="rep" data-v="on" aria-pressed="${!!S.rep}" id="repon">Ligado</button></div>
    <p class="hint">Desconfiança</p><div class="segm" role="group" aria-label="Desconfiança"><button class="${S.gauge ? '' : 'on'}" data-act="gauge" data-v="off" aria-pressed="${!S.gauge}">Desligado</button><button class="${S.gauge ? 'on' : ''}" data-act="gauge" data-v="on" aria-pressed="${!!S.gauge}" id="gaugeon">Ligado</button></div>
    <p class="hint">${S.coach ? 'Depois de cada governo, o treinador faz as contas com o que só você sabe: a chance da mão que o presidente disse, se as falas fecham, e quem parece mais {f}.' : 'Ligadas, o treinador explica o que dá para tirar de cada governo.'}</p>
    <p class="hint">Assistência</p><div class="segm" role="group" aria-label="Assistência"><button class="${S.assist ? '' : 'on'}" data-act="assist" data-v="off" aria-pressed="${!S.assist}">Desligada</button><button class="${S.assist ? 'on' : ''}" data-act="assist" data-v="on" aria-pressed="${!!S.assist}">Ata com votos</button></div>
    <p class="hint">${S.assist ? 'A ata mostra cada lei, quem governou e quem votou {ja} no governo que a aprovou, e soma por jogador. Só o que a mesa toda viu.' : 'Ligada, a partida ganha uma ata com quem aprovou cada lei.'}</p>
  </div>`;
}
const moreSum = (): string => `Seu papel: ${S.train ? role(S.train).toLowerCase() : 'sorteado'} · velocidade ${({ lenta: 'lenta', normal: 'normal', rapida: 'rápida' } as const)[S.speed || 'normal']} · treinador ${S.coach ? 'ligado' : 'desligado'} · ata ${S.assist ? 'ligada' : 'desligada'}`;
/** Playing alone, or with fewer people than a table needs: the app plays the other seats, at the level chosen. */
function vSolo(): string {
  const lv = S.level || 'medio', bots = (S.ai || []).filter(Boolean).length;
  const now = S.names.length, size = (k: number): string => `<button class="${now === k ? 'on' : ''}" data-act="fill" data-n="${k}" aria-pressed="${now === k}">${k}</button>`;
  const lvl = (l: Level): string => `<button class="${lv === l ? 'on' : ''}" data-act="level" data-v="${l}" aria-pressed="${lv === l}">${LEVEL[l][0]}</button>`;
  return `<section class="card" id="solo"><span class="label">Contra a IA</span><p class="hint">Jogue sozinho ou com poucos: ponha o seu nome e complete a mesa com jogadores da IA. Cada IA só sabe o que aquele lugar saberia na mesa.</p>
    <p class="hint">Lugares na mesa (põe ou tira IA)</p><div class="segm" role="group" aria-label="Lugares na mesa">${[5, 6, 7, 8, 9, 10].map(size).join('')}</div>
    <p class="hint">Nível da IA</p><div class="segm" role="group" aria-label="Nível da IA">${Core.LEVELS.map(lvl).join('')}</div><p class="hint" id="leveltext">${LEVEL[lv][1]}</p>
    <button class="more" data-act="more" id="moretoggle" aria-expanded="${ui.more}" aria-controls="moreopts">${ui.more ? 'Menos opções ▴' : 'Mais opções ▾'}</button>
    ${ui.more ? vMore() : `<p class="hint" id="moresum">${moreSum()}</p>`}
    ${bots ? `<p class="hint">${bots} ${bots === 1 ? 'lugar é' : 'lugares são'} da IA.</p>` : ''}</section>`;
}
/** The theme of the game (D12): the same rules, other sides, other names, other drawings. */
export function vPack(): string {
  const cur = packNow();
  const opt = (k: Pack): string => `<button class="${cur === k ? 'on' : ''}" data-act="pack" data-v="${k}" aria-pressed="${cur === k}"><span class="packart">${portrait('liberal', k, S.region)}${portrait('cultista', k, S.region)}${portrait('lider', k, S.region)}</span>${Core.WORDS[k].theme}</button>`;
  return `<section class="card" id="pack"><span class="label">Tema do jogo</span><div class="packs" role="group" aria-label="Tema do jogo" data-keep>${packsOpen().map(opt).join('')}</div>
    <p class="hint" id="packtext">${cur === 'esparta' ? 'Atenas contra os espartanos infiltrados na Assembleia, como no golpe dos Quatrocentos (411 a.C.): os espartanos são o time escondido e Leônidas é o líder deles. As regras são as do original: arcontes, estrategos, ostracismo e o Oráculo de Delfos.' : cur === 'culto' ? 'Investigadores contra um culto: os cultistas são o time escondido e o Sumo Sacerdote é o líder deles. As mesmas regras, e os dados valem mais: cada um tem uma ficha do Call of Cthulhu, e a Psicologia fareja mentiras, quem investiga rola para ser acreditado e quem elimina rola Intimidação.' : cur === 'vermelho' ? 'Os vermelhos são o time escondido e o Red Leader é o líder deles. Vota-se Da! ou Niet!. As regras são as mesmas; as IAs ganham nomes de liberais e vermelhos.' : 'O jogo original: os cultistas são o time escondido e o Leader é o líder deles.'}</p>
    ${cur === 'esparta' ? `<button class="btn ghost block${S.oracles ? ' on' : ''}" data-act="oracles" id="oracles" aria-pressed="${!!S.oracles}">🏛 Deuses e oráculos: ${S.oracles ? 'ligados' : 'desligados'}</button><p class="hint">Um deus do Olimpo olha cada partida e conta cada decreto; jogando sozinho, você pode consultar o oráculo de Delfos uma vez. Nada disso muda as regras.</p>` : ''}
    ${cur !== 'esparta' ? `<p class="hint">Nomes da IA</p><div class="segm regions" role="group" aria-label="Nomes da IA">${Core.REGIONS.filter(r => r !== 'brasil').map(r => `<button class="${(S.region || 'mundo') === r ? 'on' : ''}" data-act="region" data-v="${r}" aria-pressed="${(S.region || 'mundo') === r}">${Core.REGION_NAMES[r]}</button>`).join('')}</div>
    ${dlcOn() ? `<button class="btn ghost block dlc-region${S.region === 'brasil' ? ' on' : ''}" data-act="region" data-v="brasil" aria-pressed="${S.region === 'brasil'}">Brasil · DLC</button>` : ''}
    <p class="hint" id="regiontext">Votos: <b>${Core.words(packNow(), S.region).ja}</b> / <b>${Core.words(packNow(), S.region).nein}</b>. Figuras conhecidas ${({ mundo: 'do mundo todo', americas: 'das Américas', europa: 'da Europa', asia: 'da Ásia', africa: 'da África', oceania: 'do mundo todo (da Oceania, só os bichos)', brasil: 'do Brasil (DLC)' } as const)[S.region || 'mundo']}, dos dois lados misturados. O nome é só apelido de jogo: o papel é sorteado, e quem tem nome de liberal pode ser o {boss}.</p><button class="more" data-act="gallery" id="gallerytoggle">Ver todos os desenhos ▸</button>` : '<p class="hint" id="regiontext">Votos: <b>Naí!</b> / <b>Oú!</b>, em grego. As IAs têm nomes de gregos do século V a.C., atenienses e espartanos misturados.</p>'}   <!-- D139: the continents mean nothing to the Greeks -->
    ${dlcOn() ? '<p class="hint" id="dlcon">Expansão liberada para o seu acesso.</p>' : ''}</section>`;
}
/** Every drawing of the game (D25): each continent, each theme, the liberal, the member of the hidden side and its
 *  leader, with the animal's name. */
export function vGallery(): string {
  const back = '<button class="btn ghost block" data-act="gallery" id="galleryback">Voltar</button>';
  const cell = (r: Role, k: Pack, reg: Region, label: string): string => `<figure>${portrait(r, k, reg)}<figcaption><b>${label}</b>${animalOf(r, k, reg)}</figcaption></figure>`;
  const block = (reg: Region): string => `<section class="card gallery" id="gallery-${reg}"><span class="label">${Core.REGION_NAMES[reg]}</span>
    ${packsOpen().map(k => `<p class="hint">${Core.WORDS[k].theme}</p><div class="cast">${cell('liberal', k, reg, k === 'culto' ? 'Investigador' : k === 'esparta' ? 'Ateniense' : 'Liberal')}${cell('cultista', k, reg, Core.WORDS[k].F)}${cell('lider', k, reg, Core.WORDS[k].boss)}</div>`).join('')}
    <p class="hint">Rostos da mesa</p><div class="faces">${[...new Set([...Core.NAMES_BY.classico[reg], ...Core.NAMES_BY.vermelho[reg]])].map(n => `<figure>${face(n, reg)}<figcaption>${esc(n)}</figcaption></figure>`).join('')}</div></section>`;   // D92
  return `<section class="card" id="gallery"><span class="label">Todos os desenhos</span><p class="hint">Cada continente com os bichos dos dois temas. O de cima é o do jogo original.</p>${back}</section>${Core.REGIONS.filter(r => r !== 'brasil' || dlcOn()).map(block).join('')}<section class="card">${back}</section>`;
}
export function vRules(): string {
  const head = `<section class="card" id="rules"><span class="label">Como joga</span><p>Liberais contra {fs}, e o {boss} escondido entre os {fs}. Ganha quem aprovar ${Core.WIN.L} leis liberais ou ${Core.WIN.F} leis {fs} primeiro.</p><button class="more" data-act="rules" id="rulestoggle" aria-expanded="${ui.rules}" aria-controls="ruleslist">${ui.rules ? 'Esconder as regras ▴' : 'Ver as regras ▾'}</button>`;
  if (!ui.rules) return `${head}</section>`;
  return `${head}<ul class="rules" id="ruleslist">
    <li>Baralho de ${Core.DECK_F + Core.DECK_L} leis: ${Core.DECK_F} {fs} e ${Core.DECK_L} liberais. Os liberais vencem com ${Core.WIN.L} leis liberais; os {fs}, com ${Core.WIN.F} {fs}.</li>
    <li>Os {fs} se conhecem e sabem quem é o {boss}. Com 5 ou 6 jogadores o {boss} também sabe quem é o {f}; com 7 ou mais, não sabe. Os liberais não conhecem ninguém.</li>
    <li>A cada rodada o presidente indica o chanceler e a mesa vota. Eleito, o presidente tira 3 leis e descarta 1; o chanceler recebe 2, descarta 1 e a outra vira lei.</li>
    <li>O último presidente e o último chanceler eleitos não podem ser chanceler na rodada seguinte (com ${Core.SMALL_TABLE} vivos ou menos, só o último chanceler).</li>
    <li>${Core.TRACKER_MAX} governos rejeitados seguidos: a lei do topo entra sozinha, sem poder, e o limite de mandato zera.</li>
    <li>Os poderes do presidente dependem da mesa. Com 5 ou 6: na 3ª lei {f} olha as próximas 3 leis. Com 7 ou 8: na 2ª descobre o partido de alguém, na 3ª convoca eleição especial. Com 9 ou 10: na 1ª e na 2ª descobre o partido de alguém, na 3ª convoca eleição especial. Em toda mesa, na 4ª e na 5ª elimina alguém. Ninguém é investigado duas vezes.</li>
    <li>Eleição especial: o presidente escolhe quem é o próximo presidente. Depois dessa rodada a ordem volta a partir de quem convocou.</li>
    <li>A partir da ${Core.VETO_FROM}ª lei {f} o chanceler pode pedir veto das duas leis; se o presidente aceitar, conta como governo rejeitado.</li>
    <li>Com ${Core.LEADER_ZONE} ou mais leis {fs}, eleger o {boss} chanceler dá a vitória aos {fs}. Eliminar o {boss} dá a vitória aos liberais.</li>
  </ul><p class="hint" id="credit">Baseado em <a href="https://www.secrethitler.com">Secret Hitler</a>, de Goat, Wolf, &amp; Cabbage, sob a licença <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br">CC BY-NC-SA 4.0</a>. Uso não comercial.</p></section>`;
}

/* ---------- settings ---------- */
/** The finished games kept on this device (D23), and the button that exports them. */
export function vHistory(): string {
  const n = kept();
  return `<section class="card" id="history"><span class="label">Suas partidas</span><p class="hint" id="historytext">${n ? `${n} ${n === 1 ? 'partida terminada guardada' : 'partidas terminadas guardadas'} neste aparelho (as últimas ${Core.HISTORY_MAX}).` : 'Nenhuma partida terminada ainda.'} Só ficam aqui: nada sai do aparelho sozinho. Exporte o arquivo e mande para ajustar a IA ao jeito que as pessoas jogam de verdade.</p>
    ${n ? (() => { const P0 = Core.pastGames(past()), when = (t: number): string => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), rows = ui.pastAll ? P0.rows : P0.rows.slice(0, 5);
      return `${P0.played ? `<p class="past-rate" id="pastrate"><b>${Math.round(100 * P0.won / P0.played)}%</b> de vitórias suas (${P0.won} de ${P0.played})</p>` : ''}<ol class="past" id="past">${rows.map(r => `<li class="${r.won === undefined ? '' : r.won ? 'won' : 'lost'}"><small>${when(r.at)}</small><span>${esc(Core.WORDS[r.pack as Pack]?.theme || '')} · ${r.seats} lugares</span><b>${r.winner === 'L' ? 'Liberais venceram' : r.winner === 'F' ? `${esc(Core.words(r.pack as Pack).fs)} venceram` : 'Encerrada'}</b>${r.role ? `<em>você: ${r.role === 'liberal' ? 'liberal' : r.role === 'lider' ? esc(Core.words(r.pack as Pack).boss) : esc(Core.words(r.pack as Pack).f)}${r.won !== undefined ? (r.won ? ' · ganhou' : ' · perdeu') : ''}</em>` : ''}</li>`).join('')}</ol>${P0.rows.length > rows.length ? `<button class="more" data-act="pastall" id="pastall">Ver todas (${P0.rows.length})</button>` : ''}`; })() : ''}
    ${n ? `<button class="btn block" data-act="exportgames" id="exportgames">Exportar partidas</button><button class="more" data-act="wipe" id="wipe">${ui.confirmWipe ? 'Toque de novo para apagar todas' : 'Apagar as partidas guardadas'}</button>` : ''}</section>`;
}
export function vSettings(): string {
  const t = S.theme || 'auto', opt = (v: string, label: string): string => `<button class="${t === v ? 'on' : ''}" data-act="theme" data-t="${v}" aria-pressed="${t === v}">${label}</button>`;
  const l = S.look || 'poster', sty = (v: string, label: string): string => `<button class="${l === v ? 'on' : ''}" data-act="look" data-l="${v}" aria-pressed="${l === v}">${label}</button>`;
  const built = builtFrom();
  return `<section class="card" id="look"><span class="label">Aparência</span><p class="hint">Estilo</p><div class="segm" role="group" aria-label="Estilo">${sty('poster', 'Pôster')}${sty('deco', 'Art déco')}</div><p class="hint">Tema</p><div class="segm" role="group" aria-label="Tema">${opt('auto', 'Automático')}${opt('light', 'Claro')}${opt('dark', 'Escuro')}</div><p class="hint">Som e vibração</p><div class="segm" role="group" aria-label="Som e vibração"><button class="${S.quiet ? '' : 'on'}" data-act="fx" data-v="on" aria-pressed="${!S.quiet}">Ligados</button><button class="${S.quiet ? 'on' : ''}" data-act="fx" data-v="off" aria-pressed="${!!S.quiet}">Desligados</button></div>
    <p class="hint">Esconder o segredo ao virar o celular para baixo</p><div class="segm" role="group" aria-label="Esconder ao virar o celular"><button class="${S.flip ? '' : 'on'}" data-act="flip" data-v="off" aria-pressed="${!S.flip}">Desligado</button><button class="${S.flip ? 'on' : ''}" data-act="flip" data-v="on" aria-pressed="${!!S.flip}">Ligado</button></div>
    <p class="hint" id="fliptext">${S.flip ? 'Um segredo aberto se fecha quando o celular fica de tela para baixo. Deitado, o sensor pode achar que o celular foi virado.' : 'Um segredo aberto se fecha quando o app sai da tela. Ligado, também se fecha com o celular de tela para baixo.'}</p></section>
    <section class="card" id="about"><span class="label">Versão do app</span><p class="hint" id="version">${built ? `Versão ${esc(built.slice(0, 7))}.` : 'Versão de desenvolvimento.'} ${canUpdate() ? 'O app fica guardado neste aparelho: abre na hora e também sem internet.' : 'Neste endereço o app não fica guardado no aparelho.'}</p>${canUpdate() ? '<button class="btn ghost block" data-act="checkupdate">Procurar versão nova</button>' : ''}</section>`;
}
/** The vote result, stamped over the screen for a moment. */
export function vLogin(): string {
  return `<section class="card login" id="login"><h1 class="login-title">Painel</h1><p class="hint">Entre para jogar os outros temas: o Secret Cultist e a expansão.</p>
    <div class="field"><label for="loginemail">E-mail</label><input id="loginemail" type="email" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" value="${esc(ui.loginEmail || '')}"></div>
    <div class="field"><label for="loginpass">Senha</label><input id="loginpass" type="password" autocomplete="current-password"></div>
    ${ui.loginErr ? `<p class="hint err" id="loginerr" role="alert">${esc(ui.loginErr)}</p>` : ''}
    <button class="btn primary block" data-act="login" id="logingo"${ui.loginBusy ? ' disabled' : ''}>${ui.loginBusy ? 'Entrando…' : 'Entrar'}</button>
    <p class="hint">Sem login, a página pública tem o Secret Leônidas.</p></section>`;
}

/** D122: the setup of a Secret Cultist game, right above "Jogar agora": one game or a campaign, your investigator's
 *  stereotype, and the horror's weight. */
function cultSetup(): string { const st = S.stereo ? Core.STEREOTYPES[S.stereo] : null;
      // D116: the person picks the stereotype of their own investigator (the app's players are drawn)
      // D120: how heavy the horror is
      const hz = (S.horror || 'classico') as keyof typeof Core.HORROR;
      const horror = `<div class="horror" id="horror"><span class="label">Peso do horror</span><div class="seg quick-mode">${(Object.keys(Core.HORROR) as (keyof typeof Core.HORROR)[]).map(k => `<button data-act="horror" data-v="${k}" aria-pressed="${hz === k}" class="${hz === k ? 'on' : ''}">${Core.HORROR[k].name}</button>`).join('')}</div><p class="hint">${esc(Core.HORROR[hz].text)}</p></div>`;
      const pm = ui.playMode || 'avulsa';   // D121: one game or a campaign of three chapters
      const camp = `<div class="play-mode" id="playmode"><span class="label">Modo</span><div class="seg quick-mode" role="tablist">${([['avulsa', '🎲 Partida avulsa'], ['campanha', '📖 Campanha (3 capítulos)']] as const).map(([v, l]) => `<button role="tab" data-act="playmode" data-v="${v}" aria-selected="${pm === v}" class="${pm === v ? 'on' : ''}">${l}</button>`).join('')}</div>${pm === 'campanha' ? '<p class="hint">Três capítulos no mesmo cenário e com a mesma mesa. Sua ficha, sanidade, item e Mitos seguem; se o culto vencer um capítulo, o próximo começa pior.</p>' : ''}</div>`;
      const stereo = `<div class="stereo" id="stereo"><span class="label">Seu investigador</span><button class="btn ghost block stereo-cur" data-act="stereoopen" aria-expanded="${!!ui.stereoOpen}">${st ? `🕵️ ${esc(st.name)} <small>${esc(st.good)}</small>` : '🎲 Sorteado <small>a API escolhe o estereótipo</small>'}</button>${ui.stereoOpen ? `<div class="stereo-list" role="listbox"><button data-act="stereo" data-v="" class="${!S.stereo ? 'on' : ''}"><b>🎲 Sorteado</b></button>${Object.entries(Core.STEREOTYPES).map(([k, v]) => `<button data-act="stereo" data-v="${k}" class="${S.stereo === k ? 'on' : ''}"><b>${esc(v.name)}</b><small>${esc(v.good)}</small></button>`).join('')}</div>` : ''}</div>`;
      return `<div class="cult-setup" id="cultsetup">${camp}${stereo}${horror}</div>`;
}

