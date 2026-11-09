/* D134: the chronicle. The story answers each move of the game with a line or two of the narrator (📖 in the log),
   in the voice of the scene's god: a relic found, a page read, a government turned down, a death, an investigation.
   It tells only what the whole table saw (never a role, a hand or what an investigation showed), and it never holds
   the game. The person playing alone also gets a thread of their own: why they came, how it turns at Act II, and how
   it ends. */
import type { Event, Game } from './types';
import { actOf, godIdOf, godOf, sceneOf, type GodId } from './story';

/** What the god leaves behind: an omen (seen, heard or smelled) and what the cultists whisper. */
export const OMENS: Record<GodId, [string, string]> = {
  cthulhu: ['O cheiro de maresia entra por baixo da porta, longe de qualquer mar', 'Ph’nglui mglw’nafh'],
  nyarlathotep: ['Uma figura alta, de pele escura como ônix, foi vista sorrindo no fim da rua', 'o Faraó Negro está entre nós'],
  hastur: ['Um tecido amarelo, rasgado, ficou preso na maçaneta', 'você encontrou o Signo?'],
  shub: ['Algo pisou o jardim durante a noite, com cascos do tamanho de rodas', 'a Cabra de Mil Filhotes tem fome'],
  yog: ['Os relógios da casa marcam horas diferentes, todos ao mesmo tempo', 'a porta está quase aberta'],
  dagon: ['Pegadas molhadas, com membranas entre os dedos, sobem do porto', 'o Pai está acordando'],
  azathoth: ['Uma flauta fina toca de lugar nenhum, e ninguém consegue parar de ouvir', 'no centro de tudo, ele dorme e sonha'],
  tsathoggua: ['O chão está morno, como se algo enorme dormisse logo embaixo', 'ele não tem pressa'],
  ithaqua: ['O vento uiva para dentro da casa, e as janelas estão fechadas', 'olhe para cima'],
  cthugha: ['As velas da sala acendem sozinhas, com uma chama azul', 'Fomalhaut está subindo'],
  hydra: ['As redes dos pescadores voltam cheias de algo que ninguém quer olhar', 'a Mãe vem buscar'],
  glaaki: ['Um vizinho sorri demais, e há um espinho de cristal no pescoço dele', 'venha para o lago'],
  baal: ['Um trovão estoura num céu sem nuvens', 'o senhor da tempestade pede o primogênito'],
  mamon: ['Moedas antigas aparecem nos bolsos de quem não as tinha', 'todos têm um preço'],
  moloque: ['O cheiro de bronze quente vem da rua, junto com tambores', 'a fornalha tem fome'],
  tiamat: ['A água do copo fica salgada, e há algo se mexendo dentro dela', 'antes do céu, o mar'],
  pazuzu: ['Um vento quente traz febre e o zumbido de asas', 'o rei dos ventos sopra'],
  ereshkigal: ['Batidas no chão, vindas de baixo, sete de cada vez', 'mais um portão se abriu'],
  marduque: ['Os olhos de uma estátua da praça viraram na direção de vocês', 'os cinquenta nomes estão sendo ditos'],
  asmodeu: ['Uma música de festa toca do outro lado da parede, e lá não mora ninguém', 'o que você mais quer?'],
  astarote: ['Um livro que ninguém trouxe está aberto na mesa, numa página que fala de vocês', 'eu sei o seu segredo']
};

/** Why the person came, how it turns at Act II, and how it ends (the investigators won, or the cult). */
export const STAKES: [string, string, string, string][] = [
  ['a sua irmã, Clara, que sumiu aqui no mês passado', 'Você acha um lenço da Clara, limpo demais para quem sumiu há um mês.', 'Clara volta para casa com você. Ela não fala do que viu, e você não pergunta.', 'Você vê a Clara de novo, entre os mascarados. Ela não te reconhece.'],
  ['o diário do professor que te ensinou tudo', 'As últimas páginas do diário estão na letra do professor, mas com data de ontem.', 'Você queima o diário no fim. Algumas coisas não devem ser lidas duas vezes.', 'O diário continua escrevendo sozinho, agora com a sua letra.'],
  ['uma dívida com um homem que mora aqui e não envelhece', 'O homem te cumprimenta na rua e diz que a dívida está quase paga.', 'O homem some, e a dívida some junto. Você não sabe quem pagou.', 'O homem cobra. Você paga com algo que não sabia que tinha.'],
  ['o seu filho, que voltou daqui sem dizer uma palavra', 'O seu filho desenha, sem parar, o mesmo símbolo que você viu na porta do culto.', 'O seu filho fala de novo, pela primeira vez em meses. Ele pergunta se acabou.', 'O seu filho sorri pela primeira vez em meses, e é o sorriso deles.'],
  ['uma carta sem remetente que dizia o seu nome e este lugar', 'Chega outra carta. Esta tem o seu endereço como remetente.', 'Você nunca descobre quem escreveu a carta, e prefere assim.', 'A última carta chega, e é você quem a escreve.'],
  ['o parceiro que entrou aqui antes de você e não saiu', 'Você encontra o chapéu do seu parceiro, pendurado onde o culto se reúne.', 'Você acha o seu parceiro vivo, magro e calado. É o bastante.', 'O seu parceiro está ao lado do Sumo Sacerdote, e acena para você.'],
  ['um sonho que se repete toda noite, com este lugar exato', 'O sonho mudou: agora você vê a sala onde está, e alguém atrás de você.', 'Nesta noite, pela primeira vez em anos, você não sonha.', 'Você não acorda mais do sonho. Acordado é que você sonha.'],
  ['um retrato antigo em que você aparece, tirado cem anos antes de você nascer', 'Você acha mais um retrato, deste ano, e nele já não está sozinho.', 'O retrato desbota até virar papel em branco.', 'No retrato, agora, você está de túnica, ao lado deles.']
];

const pick = <T>(list: T[], n: number): T => list[Math.abs(n) % list.length];
const nm = (g: Game, i: number): string => g.players[i]?.name ?? '';

/** The narrator's line for one move of the table, or nothing. */
function beat(g: Game, e: Event, k: number): string {
  const id = godIdOf(g), god = godOf(g);
  if (!id || !god) return '';
  const [omen, whisper] = OMENS[id], n = k * 7 + g.laws.L * 3 + g.laws.F;
  switch (e.k) {
    case 'gov':
      if (e.law === 'L') return pick([
        `${nm(g, e.pres)} e ${nm(g, e.chanc)} voltam com mais um pedaço da Lança. Por um momento, o ar fica mais leve.`,
        `Mais uma relíquia na mesa, trazida por ${nm(g, e.pres)} e ${nm(g, e.chanc)}. Alguém lá fora para de cantar.`,
        `${nm(g, e.chanc)} segura a relíquia com as duas mãos. ${god.name} perdeu um pouco de terreno esta noite.`
      ], n);
      if (e.law === 'F') return pick([
        `Sob ${nm(g, e.pres)} e ${nm(g, e.chanc)}, mais uma página do Necronomicon foi lida em voz alta. ${omen}.`,
        `${nm(g, e.chanc)} vira a página, e a tinta ainda está fresca. ${omen}.`,
        `Mais uma página. Lá fora, alguém sussurra: “${whisper}”.`
      ], n);
      return '';
    case 'rej': return pick([
      `A mesa não confia em ${nm(g, e.pres)} e ${nm(g, e.chanc)}. Enquanto discutem, a noite avança.`,
      `Governo recusado. Cada minuto perdido é um minuto a mais para o culto.`,
      `${nm(g, e.chanc)} não passa. Alguém na mesa respira aliviado, e alguém finge.`
    ], n);
    case 'chaos': return e.law === 'F'
      ? `Ninguém governa, e a cidade se governa sozinha: uma página do Necronomicon passa de mão em mão até ser lida. ${omen}.`
      : `Ninguém governa, mas um pedaço da Lança aparece sozinho, como se alguém lá em cima ainda estivesse do lado de vocês.`;
    case 'veto': return `${nm(g, e.pres)} e ${nm(g, e.chanc)} rasgam as duas folhas. Nem relíquia, nem página: só medo.`;
    case 'inv': return pick([
      `${nm(g, e.by)} chama ${nm(g, e.target)} para uma conversa a portas fechadas. Só um dos dois sai sabendo a verdade.`,
      `${nm(g, e.by)} revira os papéis de ${nm(g, e.target)}. O que achou, só ${nm(g, e.by)} sabe.`
    ], n);
    case 'special': return `${nm(g, e.by)} passa a presidência para ${nm(g, e.target)}, por cima da ordem da mesa. Ninguém sabe se é confiança ou plano.`;
    case 'exec': return pick([
      `${nm(g, e.by)} decide, e ${nm(g, e.target)} não volta para a mesa. A cadeira vazia fica ali, olhando para todos.`,
      `${nm(g, e.target)} cai. Ninguém sabe ainda se a mesa ficou mais segura ou se ${god.name} ficou mais perto.`
    ], n);
    default: return '';
  }
}

/** The person playing alone, or -1. */
const soloOf = (g: Game): number => { const people = g.players.map((p, i) => (p.ai ? -1 : i)).filter(i => i >= 0); return people.length === 1 ? people[0] : -1; };

/** The thread of the person who plays alone: picked once, at the start of a Secret Cultist game. */
export function giveStake(g: Game, rand: () => number): Game {
  const me = soloOf(g), s = sceneOf(g);
  if (me < 0 || !s || g.stake !== undefined) return g;
  const i = Math.floor(rand() * STAKES.length);
  return { ...g, stake: i, log: [...g.log, `📜 Você veio até aqui atrás de ${STAKES[i][0]}.`] };
}

/** Adds the narrator's line for each move not told yet, and the turns of the person's thread. */
export function chronicle(g: Game): Game {
  if (!sceneOf(g)) return g;
  const from = g.chron ?? g.hist.length;
  const lines: string[] = [];
  for (let k = from; k < g.hist.length; k++) { const l = beat(g, g.hist[k], k); if (l) lines.push(`📖 ${l}`); }
  const me = soloOf(g), st = g.stake !== undefined ? STAKES[g.stake] : undefined, told = (t: string): boolean => g.log.some(l => l === `📜 ${t}`);
  if (st && me >= 0 && actOf(g) >= 2 && !told(st[1])) lines.push(`📜 ${st[1]}`);
  if (st && me >= 0 && g.phase === 'over' && g.winner) { const end = g.winner === 'L' ? st[2] : st[3]; if (!told(end)) lines.push(`📜 ${end}`); }
  if (!lines.length && from === g.hist.length && g.chron !== undefined) return g;
  return { ...g, chron: g.hist.length, log: [...g.log, ...lines] };
}

/* D137: the lore API may tell the last move better. `loreAsk` says what to ask it about the last move (the moment, the
   god and the names, all of it what the table saw); `retell` puts its line in place of the chronicle's, but only while
   nothing else has happened since. */
const MOMENT: Partial<Record<Event['k'], string>> = { rej: 'rejeicao', chaos: 'caos', veto: 'veto', inv: 'investigacao', exec: 'eliminacao', special: 'investigacao' };
export function loreAsk(g: Game): { at: number; moment: string; god: string; names: Record<string, string> } | null {
  const id = godIdOf(g), e = g.hist[g.hist.length - 1], k = g.log.length - 1;
  if (!id || !e || !g.log[k]?.startsWith('📖 ')) return null;
  const moment = e.k === 'gov' ? (e.law === 'L' ? 'lei-L' : e.law === 'F' ? 'lei-F' : '') : MOMENT[e.k] || '';
  if (!moment) return null;
  const x = e as { pres?: number; chanc?: number; by?: number; target?: number };
  const names: Record<string, string> = {};
  if (x.pres !== undefined) names.pres = nm(g, x.pres);
  if (x.by !== undefined) names.pres = nm(g, x.by);
  if (x.chanc !== undefined) names.chanc = nm(g, x.chanc);
  if (x.target !== undefined) names.target = nm(g, x.target);
  return { at: g.hist.length, moment, god: id, names };
}
export function retell(g: Game, at: number, text: string): Game {
  const k = g.log.length - 1;
  if (g.hist.length !== at || !g.log[k]?.startsWith('📖 ') || !text) return g;
  return { ...g, log: [...g.log.slice(0, k), `📖 ${text}`] };
}
