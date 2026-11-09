/* D115: what Secret Cultist adds around the rules, from the character sheets: one item for each investigator (and
   stealing one with Sleight of Hand), traps drawn at the key moments of the game with tests of their own, and madness
   at zero sanity (the vote goes out blind). Nothing here changes who dies, which law passes or who wins: an item helps a
   roll, a trap costs sanity (D118: the god changes some), and madness takes the vote out of the player's hands. */
import { roll, sheetOf, cultDice, RANK, sanity, type Roll } from './dice';
import { seeded } from './game';
import { godIdOf, type GodId } from './story';
import { CHAPTERS, RARES, RARE_IDS, mythosOf, type Campaign, type Rare } from './horror';
import type { Event, Game } from './types';

export type ItemId = 'revolver' | 'faca' | 'bastao' | 'soco' | 'lanterna' | 'kit' | 'livro' | 'carro' | 'corda' | 'amuleto';
export interface Item { name: string; icon: string; skills: string[]; use: string; weapon?: 'gun' | 'melee'; ugly?: boolean; cost?: number }
export const ITEMS: Record<ItemId, Item> = {
  revolver: { name: 'Revólver .38', icon: '🔫', skills: ['Firearms Handgun'], use: 'Dado de bônus em Armas de fogo; ao eliminar, atira', weapon: 'gun' },
  faca: { name: 'Faca de caça', icon: '🔪', skills: ['Fighting Brawl'], use: 'Dado de bônus em Briga; ao eliminar, é rápido e limpo', weapon: 'melee' },
  bastao: { name: 'Bastão', icon: '🏏', skills: ['Fighting Brawl'], use: 'Dado de bônus em Briga; ao eliminar, é sempre feio', weapon: 'melee', ugly: true },
  soco: { name: 'Soco-inglês', icon: '🥊', skills: ['Fighting Brawl'], use: 'Dado de bônus em Briga; ao eliminar, é sempre feio', weapon: 'melee', ugly: true },
  lanterna: { name: 'Lanterna', icon: '🔦', skills: ['Spot Hidden', 'Stealth'], use: 'Dado de bônus em Encontrar e Furtividade' },
  kit: { name: 'Maleta médica', icon: '🩺', skills: ['First Aid', 'Medicine'], use: 'Dado de bônus em Primeiros socorros e Medicina' },
  livro: { name: 'Livro proibido', icon: '📕', skills: ['Occult', 'Library Use'], use: 'Dado de bônus em Ocultismo e Biblioteca; cada uso custa 2 de sanidade', cost: 2 },
  carro: { name: 'Chave do carro', icon: '🚗', skills: ['Drive Auto'], use: 'Dado de bônus em Dirigir' },
  corda: { name: 'Corda', icon: '🪢', skills: ['Swim', 'Climb'], use: 'Dado de bônus em Nadar e Escalar' },
  amuleto: { name: 'Amuleto antigo', icon: '🧿', skills: ['Power'], use: 'Dado de bônus nos testes de Poder contra o horror' }
};
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
/** The item a seat holds now (its first, or the last it got by stealing). */
export function itemOf(g: Game, i: number): ItemId | undefined {
  if (!g.items) return undefined;
  let it = g.items[i] as ItemId | undefined;
  for (const e of g.hist) if (e.k === 'steal' && e.ok) { if (e.by === i) it = e.got as ItemId; else if (e.from === i) it = e.gave as ItemId | undefined; }
  return it;
}
/** One item for each seat with a sheet, drawn with more chance for what its sheet does best. */
export function dealItems(g: Game, rand: () => number): Game {
  if (!cultDice(g) || g.items) return g;
  const items: Record<number, ItemId> = {};
  g.players.forEach((_, i) => {
    const sh = sheetOf(g, i);
    if (!sh) return;
    const w = ITEM_IDS.map(id => 10 + Math.max(...ITEMS[id].skills.map(k => sh.vals[k] ?? 0)));
    let x = rand() * w.reduce((a, b) => a + b, 0), k = 0;
    while (k < w.length - 1 && (x -= w[k]) > 0) k++;
    items[i] = ITEM_IDS[k];
  });
  // D121: in a campaign, the person keeps the item of the chapter before
  const me = g.players.findIndex(p => !p.ai);
  if (g.campaign?.item && me >= 0 && g.players.filter(p => !p.ai).length === 1) items[me] = g.campaign.item as ItemId;
  return { ...g, items };
}
/** D115: the bonus die an item gives a roll of this skill. */
export const itemHelps = (g: Game, i: number, skill: string): boolean => { const it = itemOf(g, i); return !!it && ITEMS[it].skills.includes(skill); };

/* ---------- stealing ---------- */
/** Whether a seat may still try to steal from another: once a game, both alive, the other holds something. */
export function canSteal(g: Game, by: number, from: number): boolean {
  return cultDice(g) && g.phase !== 'over' && by !== from && !!g.players[by]?.alive && !!g.players[from]?.alive && !!itemOf(g, from) && !g.hist.some(e => e.k === 'steal' && e.by === by);
}
/** Sleight of Hand against the other's Spot Hidden: winning, the two items change hands; losing, the table sees it. */
export function steal(g: Game, by: number, from: number, rand: () => number): Game {
  if (!canSteal(g, by, from)) return g;
  const r = roll(g, by, 'Sleight of Hand', rand), v = roll(g, from, 'Spot Hidden', rand);
  if (!r || !v) return g;
  const ok = RANK[r.level] >= RANK.ok && RANK[r.level] > RANK[v.level], got = itemOf(g, from) as ItemId, gave = itemOf(g, by);
  const a = g.players[by].name, b = g.players[from].name;
  return { ...g, hist: [...g.hist, { k: 'steal', by, from, ok, got, ...(gave ? { gave } : {}), roll: r, vs: v }], log: [...g.log, ok ? `🫳 ${a} pegou ${ITEMS[got].name} de ${b}${gave ? ` e deixou ${ITEMS[gave].name} no lugar` : ''}.` : `🫳 ${b} pegou ${a} tentando roubar ${ITEMS[got].name}.`] };
}

/* ---------- traps ---------- */
export type TrapId = 'estrada' | 'porao' | 'desabamento' | 'visao' | 'biblioteca' | 'cao' | 'ferido' | 'cha'
  | 'sonho' | 'naufragio' | 'profundos' | 'rede' | 'mata' | 'esporos' | 'peca' | 'mascara' | 'escorpioes' | 'baile' | 'corredor' | 'relogio'
  | 'flauta' | 'vazio' | 'caverna' | 'oferenda' | 'nevasca' | 'altura' | 'incendio' | 'brasas' | 'mare' | 'cancao' | 'espinhos' | 'lago'
  | 'raio' | 'altar' | 'cofre' | 'contrato' | 'fornalha' | 'tambores' | 'abismo' | 'serpente' | 'febre' | 'gafanhotos' | 'portao' | 'mortos'
  | 'estatua' | 'nomes' | 'festa' | 'desejo' | 'grimorio' | 'possessao';
/** D119: a trap may leave who fails in a passing state (hurt, poisoned) as well as costing sanity; some belong to a god. */
export type State = 'ferido' | 'envenenado';
export interface Trap { name: string; text: string; skills: string[]; loss: number; group?: boolean; state?: State; god?: GodId }
export const TRAPS: Record<TrapId, Trap> = {
  estrada: { name: 'Perseguição na estrada', text: 'Faróis no retrovisor e uma curva fechada.', skills: ['Drive Auto'], loss: 3 },
  porao: { name: 'Porão alagado', text: 'A água sobe, e algo se mexe no fundo.', skills: ['Swim', 'Climb'], loss: 3 },
  desabamento: { name: 'Desabamento na cripta', text: 'O teto cede sobre a mesa.', skills: ['Dodge', 'Climb'], loss: 2, state: 'ferido' },
  visao: { name: 'Visão do além', text: 'Por um instante, todos veem o que não deviam.', skills: ['Power'], loss: 5 },
  biblioteca: { name: 'Sussurros na biblioteca', text: 'Os livros sussurram nomes que ninguém devia saber.', skills: ['Library Use', 'Occult'], loss: 3 },
  cao: { name: 'Cão de Tindalos', text: 'Ele vem pelos cantos da sala. Ninguém se mexe.', skills: ['Stealth'], loss: 4 },
  cha: { name: 'Veneno no chá', text: 'O anfitrião insiste que todos provem o chá. O cheiro é de amêndoas.', skills: ['Spot Hidden', 'Medicine'], loss: 1, state: 'envenenado' },
  // D119: the god's own traps, for its scenes
  sonho: { name: 'Sonho compartilhado', text: 'Todos acordam gritando o mesmo nome.', skills: ['Power'], loss: 4, god: 'cthulhu' },
  naufragio: { name: 'Naufrágio na tempestade', text: 'O barco vira a cem metros da costa.', skills: ['Swim'], loss: 2, state: 'ferido', god: 'cthulhu' },
  profundos: { name: 'Os Profundos na janela', text: 'Rostos de peixe colados no vidro. A porta range.', skills: ['Stealth', 'Dodge'], loss: 3, state: 'ferido', god: 'dagon' },
  rede: { name: 'A rede dos pescadores', text: 'Arrastam vocês para o cais, devagar.', skills: ['Swim', 'Fighting Brawl'], loss: 2, state: 'ferido', god: 'dagon' },
  mata: { name: 'A mata se fecha', text: 'A trilha de ontem não existe mais.', skills: ['Navigate', 'Survival'], loss: 3, god: 'shub' },
  esporos: { name: 'Esporos no ar', text: 'Um pó dourado cai das árvores e gruda na garganta.', skills: ['Constitution'], loss: 1, state: 'envenenado', god: 'shub' },
  peca: { name: 'A peça proibida', text: 'Alguém começa a ler o segundo ato em voz alta.', skills: ['Power'], loss: 5, god: 'hastur' },
  mascara: { name: 'O estranho de máscara pálida', text: 'Ele diz que não usa máscara.', skills: ['Psychology'], loss: 3, god: 'hastur' },
  escorpioes: { name: 'Escorpiões na tumba', text: 'O chão da câmara se mexe.', skills: ['Dodge'], loss: 1, state: 'envenenado', god: 'nyarlathotep' },
  baile: { name: 'Baile de máscaras', text: 'Um dos convidados tem o seu rosto.', skills: ['Spot Hidden'], loss: 3, god: 'nyarlathotep' },
  corredor: { name: 'Corredor que não acaba', text: 'Vocês passaram pela mesma porta três vezes.', skills: ['Navigate', 'Intelligence'], loss: 3, god: 'yog' },
  relogio: { name: 'O relógio parado', text: 'Por um minuto, ninguém envelhece. Depois, todos de uma vez.', skills: ['Power'], loss: 4, god: 'yog' },
  // D123: the traps of the six new gods
  flauta: { name: 'A flauta no vazio', text: 'Uma melodia que não termina e que todos começam a assobiar.', skills: ['Power'], loss: 5, god: 'azathoth' },
  vazio: { name: 'O céu sem estrelas', text: 'Alguém olhou pelo telescópio e não consegue parar.', skills: ['Psychology', 'Power'], loss: 3, god: 'azathoth' },
  caverna: { name: 'A caverna quente', text: 'O túnel desce, e o ar fica espesso como sopa.', skills: ['Climb', 'Constitution'], loss: 2, state: 'ferido', god: 'tsathoggua' },
  oferenda: { name: 'A oferenda errada', text: 'Ele aceitou o presente. Agora quer mais.', skills: ['Occult', 'Fast Talk'], loss: 4, god: 'tsathoggua' },
  nevasca: { name: 'A nevasca súbita', text: 'Em dez minutos, a neve chega aos joelhos.', skills: ['Survival', 'Constitution'], loss: 2, state: 'ferido', god: 'ithaqua' },
  altura: { name: 'Levados pelo vento', text: 'O vento ergue alguém do chão e o solta lá do alto.', skills: ['Dodge', 'Climb'], loss: 3, state: 'ferido', god: 'ithaqua' },
  incendio: { name: 'O incêndio azul', text: 'O fogo sobe pelas paredes sem fumaça.', skills: ['Dodge', 'Drive Auto'], loss: 2, state: 'ferido', god: 'cthugha' },
  brasas: { name: 'As brasas que falam', text: 'Na lareira, as brasas formam letras.', skills: ['Power'], loss: 4, god: 'cthugha' },
  mare: { name: 'A maré que não desce', text: 'A água entra pela porta da frente, devagar.', skills: ['Swim', 'Climb'], loss: 3, god: 'hydra' },
  cancao: { name: 'A canção das crianças', text: 'Todos os rádios tocam a mesma canção.', skills: ['Listen', 'Power'], loss: 3, god: 'hydra' },
  espinhos: { name: 'Os espinhos de cristal', text: 'Algo espeta a pele, e a dor some rápido demais.', skills: ['Dodge', 'First Aid'], loss: 1, state: 'envenenado', god: 'glaaki' },
  lago: { name: 'O espelho do lago', text: 'O seu reflexo sorri antes de você.', skills: ['Power', 'Psychology'], loss: 4, god: 'glaaki' },
  // D124: the traps of the old gods of the Bible and Babylon
  raio: { name: 'O raio no mesmo lugar', text: 'Uma tempestade seca persegue vocês pela estrada.', skills: ['Dodge', 'Drive Auto'], loss: 2, state: 'ferido', god: 'baal' },
  altar: { name: 'O altar no alto', text: 'O culto exige uma oferenda, e todos olham para você.', skills: ['Fast Talk', 'Power'], loss: 3, god: 'baal' },
  cofre: { name: 'O cofre sem fundo', text: 'Quem pega uma moeda não consegue soltar.', skills: ['Power'], loss: 3, god: 'mamon' },
  contrato: { name: 'O contrato em letra miúda', text: 'Alguém assinou por você.', skills: ['Library Use', 'Persuade'], loss: 3, god: 'mamon' },
  fornalha: { name: 'A fornalha de bronze', text: 'O calor sobe, e a porta não abre.', skills: ['Dodge', 'Constitution'], loss: 2, state: 'ferido', god: 'moloque' },
  tambores: { name: 'Os tambores', text: 'O som abafa tudo, até os próprios pensamentos.', skills: ['Listen', 'Power'], loss: 4, god: 'moloque' },
  abismo: { name: 'As águas do abismo', text: 'O chão vira mar debaixo dos pés.', skills: ['Swim'], loss: 3, god: 'tiamat' },
  serpente: { name: 'A serpente de onze cabeças', text: 'Algo enorme se mexe na lama do estuário.', skills: ['Dodge', 'Stealth'], loss: 3, state: 'ferido', god: 'tiamat' },
  febre: { name: 'A febre do vento', text: 'O vento quente entra pela janela.', skills: ['Constitution', 'First Aid'], loss: 1, state: 'envenenado', god: 'pazuzu' },
  gafanhotos: { name: 'A nuvem de gafanhotos', text: 'O céu escurece ao meio-dia.', skills: ['Survival', 'Dodge'], loss: 2, god: 'pazuzu' },
  portao: { name: 'O sétimo portão', text: 'Cada porta que passam tira alguma coisa de vocês.', skills: ['Power', 'Occult'], loss: 4, god: 'ereshkigal' },
  mortos: { name: 'Os mortos que andam', text: 'Os vizinhos enterrados semana passada batem na porta.', skills: ['Firearms Handgun', 'Fighting Brawl'], loss: 4, god: 'ereshkigal' },
  estatua: { name: 'A estátua que olha', text: 'Os olhos de ouro acompanham vocês pela sala.', skills: ['Power', 'Stealth'], loss: 3, god: 'marduque' },
  nomes: { name: 'Os cinquenta nomes', text: 'Alguém começou a recitar, e a boca de vocês acompanha.', skills: ['Power', 'Listen'], loss: 4, god: 'marduque' },
  festa: { name: 'A festa sem fim', text: 'A música não para, e as pernas também não.', skills: ['Constitution', 'Power'], loss: 3, state: 'ferido', god: 'asmodeu' },
  desejo: { name: 'O que você mais quer', text: 'Ele oferece, e a mão já está estendida.', skills: ['Psychology', 'Power'], loss: 4, god: 'asmodeu' },
  grimorio: { name: 'O grimório aberto', text: 'As letras se mexem, e você não consegue parar de ler.', skills: ['Library Use', 'Power'], loss: 3, god: 'astarote' },
  possessao: { name: 'A voz do convento', text: 'Alguém na mesa fala com a voz de outra pessoa.', skills: ['Occult', 'Psychology'], loss: 4, god: 'astarote' },
  ferido: { name: 'Ferido no ritual', text: 'Alguém caiu sangrando no meio da mesa; quem sabe cuidar, cuida.', skills: ['First Aid', 'Medicine'], loss: 3, group: true }
};
export const TRAP_IDS = Object.keys(TRAPS) as TrapId[];
/** The key moments a trap comes out: each chaos, the 2nd and 4th page of the Necronomicon, the 3rd relic. */
export function trapsDue(g: Game): number {
  const chaos = g.hist.filter(e => e.k === 'chaos').length;
  return chaos + (g.laws.F >= 2 ? 1 : 0) + (g.laws.F >= 4 ? 1 : 0) + (g.laws.L >= 3 ? 1 : 0);
}
/** The best of some skills of a seat (a characteristic counts, like Power). */
const best = (g: Game, i: number, ks: string[]): string => ks.reduce((a, k) => ((sheetOf(g, i)?.vals[k] ?? 0) > (sheetOf(g, i)?.vals[a] ?? 0) ? k : a), ks[0]);
/** A trap is due: draw one not seen yet in this game; every living seat rolls its best skill for it (a group trap: the
 *  best one at the table rolls for all), and who fails loses sanity. */
export function springTrap(g: Game): Game {
  if (!cultDice(g) || g.phase === 'over') return g;
  const seen = g.hist.filter(e => e.k === 'trap'), due = trapsDue(g);
  if (seen.length >= due) return g;
  // D119: the god's own traps first, then the others; none twice
  const god = godIdOf(g), extra = god === 'shub' ? 1 : 0;   // D118: Shub-Niggurath makes each one cost more
  const rand = seeded(g.hist.length * 1543 + due * 31), fit = TRAP_IDS.filter(t => !TRAPS[t].god || TRAPS[t].god === god), left = fit.filter(t => !seen.some(e => e.k === 'trap' && e.id === t));
  const mine = left.filter(t => TRAPS[t].god === god), pool = mine.length && rand() < 0.6 ? mine : left.length ? left : fit;
  const id = pool[Math.floor(rand() * pool.length)], t = TRAPS[id];
  // D118: Dagon keeps its high priest out of the traps
  const alive = g.players.map((p, i) => (p.alive && !(god === 'dagon' && p.role === 'lider') ? i : -1)).filter(i => i >= 0);
  const rolls: { seat: number; roll: Roll; loss: number; state?: State; sign?: boolean }[] = [];
  if (t.group) {
    const healer = alive.reduce((a, i) => ((sheetOf(g, i)?.vals[best(g, i, t.skills)] ?? 0) > (sheetOf(g, a)?.vals[best(g, a, t.skills)] ?? 0) ? i : a), alive[0]);
    const r = roll(g, healer, best(g, healer, t.skills), rand);
    if (!r) return g;
    const ok = RANK[r.level] >= RANK.ok;
    for (const i of alive) rolls.push({ seat: i, roll: r, loss: ok ? 0 : t.loss + extra });
    return { ...g, hist: [...g.hist, { k: 'trap', id, healer, rolls }], log: [...g.log, `🕯️ ${t.name}. ${g.players[healer].name} cuidou${ok ? ', e ninguém perdeu sanidade.' : `, sem sucesso: a mesa toda perde ${t.loss} de sanidade.`}`] };
  }
  const finds: Event[] = [];
  for (const i of alive) {
    const r = roll(g, i, best(g, i, t.skills), rand);
    if (!r) continue;
    // D120: the Elder Sign takes a trap's loss once; an extreme success may turn up a rare find
    const sign = hasSign(g, i), loss = RANK[r.level] >= RANK.ok || sign ? 0 : (r.level === 'fumble' ? t.loss * 2 : t.loss) + extra;
    rolls.push({ seat: i, roll: r, loss, ...(RANK[r.level] < RANK.ok && (t.state || god === 'ithaqua' || god === 'pazuzu') ? { state: t.state || (god === 'pazuzu' ? 'envenenado' : 'ferido') } : {}), ...(sign && RANK[r.level] < RANK.ok ? { sign: true } : {}) });
    if (RANK[r.level] >= RANK.extreme && !g.hist.some(e => e.k === 'find' && e.seat === i)) finds.push({ k: 'find', seat: i, id: RARE_IDS[Math.floor(rand() * RARE_IDS.length)] });
  }
  if (!rolls.length) return g;
  const hurt = rolls.filter(x => x.loss > 0).length;
  const struck = rolls.filter(x => x.state).length;
  const found = finds.map(f => (f.k === 'find' ? `${RARES[f.id as Rare][0]} ${g.players[f.seat].name} achou ${RARES[f.id as Rare][1]}.` : ''));
  return { ...g, hist: [...g.hist, { k: 'trap', id, rolls }, ...finds], log: [...g.log, `🕯️ ${t.name}. ${rolls.length - hurt} escaparam${hurt ? `, ${hurt} perderam sanidade` : ''}${struck ? `, ${struck} ${(t.state || (god === 'pazuzu' ? 'envenenado' : 'ferido')) === 'ferido' ? 'feridos' : 'envenenados'}` : ''}.`, ...found] };
}

/* ---------- madness ---------- */
/** D115: at zero sanity a seat has gone mad: its vote goes out blind. */
export const mad = (g: Game, i: number): boolean => (sanity(g, i) ?? 1) <= 0;

/* ---------- passing states (D119) ---------- */
export const STATE_NAME: Record<State, string> = { ferido: 'Ferido', envenenado: 'Envenenado' };
/** The states a seat is in now: what traps left on it, less what someone tended. */
export function statesOf(g: Game, i: number): State[] {
  if (godIdOf(g) === 'tsathoggua' && g.players[i]?.role === 'lider') return [];   // D123: Tsathoggua shields its priest
  const on = new Set<State>();
  for (const e of g.hist) {
    if (e.k === 'trap') for (const x of e.rolls) if (x.seat === i && x.state) on.add(x.state as State);
    if (e.k === 'tend' && e.to === i && e.ok) on.delete(e.state as State);
    if (e.k === 'npc') on.clear();   // D120: the scene's character tends everyone
  }
  return [...on];
}
/** Rounds a seat has spent poisoned (each costs 1 of sanity). */
export function poisonedRounds(g: Game, i: number): number {
  let since = -1, n = 0;
  g.hist.forEach((e, k) => {
    if (e.k === 'trap' && e.rolls.some(x => x.seat === i && x.state === 'envenenado') && since < 0) since = k;
    if (e.k === 'tend' && e.to === i && e.ok && e.state === 'envenenado' && since >= 0) { n += g.hist.slice(since, k).filter(x => x.k === 'vote').length; since = -1; }
  });
  return since >= 0 ? n + g.hist.slice(since).filter(x => x.k === 'vote').length : n;
}
/** Once a round (at each vote), the best one at the table in First Aid or Medicine (the medical bag helps) tends
 *  someone hurt or poisoned: passing, the state is gone. */
export function tend(g: Game): Game {
  if (!cultDice(g) || g.phase === 'over') return g;
  const round = g.hist.filter(e => e.k === 'vote').length;
  if (!round || g.hist.some(e => e.k === 'tend' && e.round === round)) return g;
  const alive = g.players.map((p, i) => (p.alive ? i : -1)).filter(i => i >= 0), sick = alive.filter(i => statesOf(g, i).length);
  if (!sick.length) return g;
  const to = sick[0], state = statesOf(g, to)[0], healers = alive.filter(i => i !== to);
  if (!healers.length) return g;
  const sk = (i: number): string => ((sheetOf(g, i)?.vals['Medicine'] ?? 0) > (sheetOf(g, i)?.vals['First Aid'] ?? 0) ? 'Medicine' : 'First Aid');
  const by = healers.reduce((a, i) => ((sheetOf(g, i)?.vals[sk(i)] ?? 0) > (sheetOf(g, a)?.vals[sk(a)] ?? 0) ? i : a), healers[0]);
  const r = roll(g, by, sk(by), seeded(g.hist.length * 733 + to));
  if (!r) return g;
  const ok = RANK[r.level] >= RANK.ok, a = g.players[by].name, b = g.players[to].name;
  return { ...g, hist: [...g.hist, { k: 'tend', by, to, state, ok, round, roll: r }], log: [...g.log, `🩹 ${a} cuidou de ${b} (${STATE_NAME[state].toLowerCase()})${ok ? ', e deu certo.' : ', sem sucesso por enquanto.'}`] };
}
/** D120: a seat holds an Elder Sign it has not used yet (found in a trap; it takes one trap's loss). */
function hasSign(g: Game, i: number): boolean {
  const found = g.hist.findIndex(e => e.k === 'find' && e.seat === i && e.id === 'sinal');
  return found >= 0 && !g.hist.slice(found).some(e => e.k === 'trap' && e.rolls.some(x => x.seat === i && x.sign));
}

/** D121: the next chapter of a campaign, from a finished one: what the person carries, and the score so far. */
export function chapterAfter(g: Game): Campaign | null {
  const c = g.campaign;
  if (!c || g.phase !== 'over' || !g.winner || c.ch >= CHAPTERS) return null;
  const people = g.players.map((p, i) => (p.ai ? -1 : i)).filter(i => i >= 0), me = people.length === 1 ? people[0] : -1;
  const sh = me >= 0 ? sheetOf(g, me) : undefined, san = me >= 0 ? sanity(g, me) : undefined, item = me >= 0 ? itemOf(g, me) : undefined;
  return {
    ch: c.ch + 1, scene: g.scene || c.scene, wins: { L: c.wins.L + (g.winner === 'L' ? 1 : 0), F: c.wins.F + (g.winner === 'F' ? 1 : 0) }, prev: g.winner,
    names: g.players.map(p => p.name),
    ...(sh ? { sheet: sh, lost: Math.max(0, (sh.vals.Sanity ?? 50) - (san ?? 0)), mythos: mythosOf(g, me) } : {}), ...(item ? { item } : {})
  };
}
