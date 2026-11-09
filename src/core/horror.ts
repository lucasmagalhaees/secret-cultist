/* D120: more of the horror around the rules of Secret Cultist, all of it on rolls, sanity and words, never on who dies,
   which law passes or who wins:
   - manias: whoever goes mad gets one, and it decides the vote (paranoia votes no, fanaticism yes, catatonia blind);
   - Cthulhu Mythos: each page of the Necronomicon that passes through a seat's hands teaches it (and costs sanity);
   - documents: a clipping or a letter with each act, in the god's voice;
   - backgrounds: a line of each investigator's past, by its best skill, giving one bonus die once a game;
   - a character of the scene who comes at Act II and tends the table;
   - rare finds: an extreme success in a trap may turn up a relic of the old world;
   - the horror's weight: pulp, classic or purist. */
import type { Game } from './types';
import type { GodId } from './story';

export type Mania = 'paranoia' | 'fanatismo' | 'catatonia';
export const MANIAS: Record<Mania, [string, string]> = {
  paranoia: ['Paranoia', 'Não confia em ninguém: vota sempre Não'],
  fanatismo: ['Fanatismo', 'Ouve vozes que mandam seguir: vota sempre Sim'],
  catatonia: ['Catatonia', 'Não reage: o voto sai no escuro e não fala na mesa']
};
const MANIA_IDS = Object.keys(MANIAS) as Mania[];
/** The mania of a seat that went mad (fixed for the game: by the seat and the scene). */
export const maniaOf = (g: Game, i: number): Mania => MANIA_IDS[(i * 7 + (g.scene || '').length) % MANIA_IDS.length];

/** Mythos a seat has learned: MYTHOS_PAGE for each page of the Necronomicon that passed through its hands. */
export const MYTHOS_PAGE = 3, MYTHOS_SEES = 6;
export function mythosOf(g: Game, i: number): number {
  const c = g.campaign, carried = c && !g.players[i].ai && g.players.filter(p => !p.ai).length === 1 ? c.mythos ?? 0 : 0;   // D121
  return carried + MYTHOS_PAGE * g.hist.filter(e => e.k === 'gov' && e.law === 'F' && (e.pres === i || e.chanc === i)).length;
}

/** A document for each act, by god: a clipping, a letter, a page of a diary. */
export const DOCS: Record<GodId, [string, string]> = {
  cthulhu: ['Recorte do Arkham Advertiser: "Escultor local internado após sonhos recorrentes com uma cidade submersa. Médicos pedem calma."', 'Diário de bordo do Emma: "Latitude 47°9′ S. A terra subiu. Johansen não para de rir."'],
  nyarlathotep: ['Cartaz rasgado: "Hoje à noite, o Homem de Preto e suas maravilhas elétricas. Entrada franca."', 'Carta sem remetente: "Ele disse que já esteve aqui antes, em outra cara. Acho que eu me lembro."'],
  hastur: ['Programa de teatro: "O Rei de Amarelo, em dois atos. A direção pede que ninguém leia o segundo."', 'Bilhete na sua porta: "Você encontrou o Signo Amarelo?"'],
  shub: ['Relatório do guarda-florestal: "Rastros de casco, mas de algo do tamanho de uma casa."', 'Página de um caderno de campo: "Iä! Shub-Niggurath! Eles cantam isso toda noite, mais perto."'],
  yog: ['Telegrama: "PORTA ENCONTRADA. NÃO ABRIR. REPITO. NÃO ABRIR."', 'Folha arrancada de um livro: "Yog-Sothoth conhece o portal. Yog-Sothoth é o portal."'],
  dagon: ['Nota fiscal de uma joalheria: "Tiara de ouro, feitio estranho, peso maior que o normal. Origem: Innsmouth."', 'Recado de um pescador: "Eles saem do mar na lua nova. Tranque a porta e não olhe pela janela."'],
  azathoth: ['Diário do astrônomo: "A música não vem das estrelas. Vem de trás delas."', 'Telegrama: "PARE DE OUVIR. REPITO. PARE DE OUVIR A FLAUTA."'],
  tsathoggua: ['Mapa antigo: "N\u2019kai, sob a montanha. Leve oferendas. Não acorde."', 'Bilhete de um guia: "Ele não está com fome hoje. Amanhã, quem sabe."'],
  ithaqua: ['Recorte do jornal local: "Caçador encontrado a trinta metros de altura, numa árvore, sem botas."', 'Carta de um missionário: "Os nativos dizem para não olhar para cima quando o vento muda."'],
  cthugha: ['Relatório do corpo de bombeiros: "Incêndio sem origem. A madeira queimou de dentro para fora."', 'Página chamuscada: "Quando Fomalhaut está sobre as árvores, diga as palavras e se afaste."'],
  hydra: ['Ata da colônia de pescadores: "Mais três barcos voltaram vazios. As redes, cheias."', 'Canção anotada por uma professora: "A Mãe vem buscar, a Mãe vem buscar, quem nasceu no mar volta pro mar."'],
  glaaki: ['Carta de um pintor: "Venha morar no lago. Aqui ninguém envelhece, ninguém chora."', 'Página de "As Revelações de Glaaki", volume XII: "Os espinhos não doem. Depois de um tempo, nada dói."'],
  baal: ['Bilhete do pároco: "O raio caiu sete vezes no mesmo carvalho. Mandei cortá-lo. O lenhador sumiu."', 'Tabuleta fenícia, tradução: "Baal cavalga as nuvens. Dai-lhe o primogênito."'],
  mamon: ['Extrato bancário: "Depósito de origem desconhecida: 1.000.000. Assinatura: ilegível."', 'Contrato rasgado: "…em troca do que o cliente tem de mais caro, pagável na morte."'],
  moloque: ['Relatório do arqueólogo: "Contamos mais de vinte mil urnas. As mais recentes são de ontem."', 'Folheto anônimo: "A fornalha tem fome. Quem alimenta, prospera."'],
  tiamat: ['Tradução incompleta: "Antes do céu ter nome, Tiamat era o mar, e o mar era tudo."', 'Diário de bordo: "A bússola gira. A água ferve sem fogo."'],
  pazuzu: ['Nota do médico: "Doze casos de febre desde que o vento mudou. Todos falam de asas."', 'Inscrição da estatueta: "Eu sou Pazuzu, filho de Hanbi, rei dos maus espíritos do ar."'],
  ereshkigal: ['Relatório do coveiro: "As covas da semana passada estão vazias, e a terra foi tirada por baixo."', 'Poema sumério, linha solta: "No primeiro portão, tiram-lhe a coroa. No sétimo, a vida."'],
  marduque: ['Tábua de argila, tradução: "Marduque matou Tiamat e fez do corpo dela o céu e a terra."', 'Recado no museu: "Não leiam os cinquenta nomes em voz alta."'],
  asmodeu: ['Convite dourado: "Traga o que você mais deseja. Leve o que você mais teme."', 'Carta de uma noiva: "Ele disse que os outros seis noivos não eram dignos."'],
  astarote: ['Ata do exorcismo: "O demônio respondeu a todas as perguntas, e todas as respostas eram verdade."', 'Página de grimório: "Astarote sabe o passado e o futuro. O preço é o presente."']
};

/** A line of past for each investigator, by its best skill; the first roll of that skill gets a bonus die. */
export const PASTS: Record<string, string> = {
  Persuade: 'Foi advogado de defesa antes de tudo isso',
  'Fast Talk': 'Vendia remédio milagroso de cidade em cidade',
  Charm: 'Era a alma das festas de gala da cidade',
  Psychology: 'Foi alienista num manicômio estadual',
  Intimidate: 'Cobrou dívidas para gente perigosa',
  'Firearms Handgun': 'Serviu na Grande Guerra',
  'Fighting Brawl': 'Lutou boxe nas docas',
  'Spot Hidden': 'Foi detetive particular',
  Listen: 'Operou rádio na marinha',
  Occult: 'Cresceu entre benzedeiras e livros proibidos',
  'Sleight of Hand': 'Fazia mágica de rua',
  'Drive Auto': 'Dirigia para contrabandistas',
  Swim: 'Mergulhava atrás de pérolas',
  Climb: 'Escalou montanhas por esporte',
  Dodge: 'Foi acrobata de circo',
  'First Aid': 'Foi enfermeira na guerra',
  Medicine: 'É médico de família',
  'Library Use': 'Trabalhou na biblioteca da universidade',
  Stealth: 'Entrava onde não devia, por profissão'
};

/** A character of the scene, at Act II: tends the hurt and gives back some sanity to all. */
export const NPCS: Record<GodId, [string, string]> = {
  cthulhu: ['O velho marinheiro Johansen', 'Conta o que viu no mar, e saber ajuda'],
  nyarlathotep: ['A egiptóloga Nephren Ka', 'Traz amuletos e chá forte'],
  hastur: ['O dramaturgo arrependido', 'Queima as cópias da peça na lareira'],
  shub: ['A curandeira da mata', 'Prepara um unguento e reza baixinho'],
  yog: ['O professor Armitage', 'Lê a fórmula certa na hora certa'],
  dagon: ['O velho Zadok', 'Por uma garrafa, conta como trancar as portas'],
  azathoth: ['A violinista do sótão', 'Toca uma melodia que abafa a flauta'],
  tsathoggua: ['O mineiro que voltou', 'Conhece os túneis e as oferendas certas'],
  ithaqua: ['O caçador cree', 'Acende a fogueira certa e fala com o vento'],
  cthugha: ['O bombeiro veterano', 'Sabe o que a água não apaga e o que apaga'],
  hydra: ['A professora da vila', 'Desfaz a canção com outra canção'],
  glaaki: ['O ex-servo arrependido', 'Arranca os espinhos e conta onde fica o lago'],
  baal: ['O padre maronita', 'Benze a casa contra os raios'],
  mamon: ['O contador honesto', 'Mostra de onde vem o dinheiro, e o feitiço perde força'],
  moloque: ['A parteira de Cartago', 'Esconde as crianças e apaga as brasas'],
  tiamat: ['O velho marinheiro de Basra', 'Sabe navegar contra a corrente'],
  pazuzu: ['A curandeira copta', 'Prepara o chá contra a febre'],
  ereshkigal: ['O sacerdote de Ur', 'Recita a descida de Inana, e os portões emperram'],
  marduque: ['O assiriólogo', 'Lê a tábua certa e quebra o encanto da estátua'],
  asmodeu: ['A cantora do cabaré', 'Sabe o nome verdadeiro dos clientes, e diz em voz alta'],
  astarote: ['O padre exorcista', 'Fecha os livros com água benta e paciência']
};
export const NPC_SAN = 3;

/** Rare finds, turned up by an extreme success in a trap. */
export type Rare = 'sinal' | 'po' | 'faca-prata';
export const RARES: Record<Rare, [string, string, string]> = {
  sinal: ['🌟', 'Sinal Ancião', 'A próxima armadilha não custa sanidade'],
  po: ['✨', 'Pó de Ibn-Ghazi', 'Dado de bônus em Encontrar e Escutar'],
  'faca-prata': ['🗡️', 'Faca de prata', 'Dado de bônus em Briga e em Poder']
};
export const RARE_IDS = Object.keys(RARES) as Rare[];
export const RARE_SKILLS: Record<Rare, string[]> = { sinal: [], po: ['Spot Hidden', 'Listen'], 'faca-prata': ['Fighting Brawl', 'Power'] };

/** How heavy the horror is: what sanity losses are multiplied by, the table's ease, and whether Luck can be spent. */
export type Horror = 'pulp' | 'classico' | 'purista';
export const HORROR: Record<Horror, { name: string; text: string; loss: number; ease: number; luck: boolean }> = {
  pulp: { name: 'Pulp', text: 'Heróis de revista: perdem metade da sanidade e rolam mais fácil', loss: 0.5, ease: 30, luck: true },
  classico: { name: 'Clássico', text: 'O padrão', loss: 1, ease: 20, luck: true },
  purista: { name: 'Purista', text: 'Lovecraft de verdade: a sanidade cai mais rápido, os testes são mais duros e não há Sorte', loss: 1.5, ease: 10, luck: false }
};
export const horrorOf = (g: Game): (typeof HORROR)[Horror] => HORROR[(g.horror as Horror) || 'classico'] || HORROR.classico;

/* D121: a campaign: three chapters in the same scene, with the same table. The person's sheet, sanity lost, item and
   Mythos go on to the next chapter; when the cult wins a chapter, the next one starts worse for everyone. */
export interface Campaign { ch: number; scene: string; wins: { L: number; F: number }; prev?: 'L' | 'F'; sheet?: { vals: Record<string, number>; native: string }; lost?: number; mythos?: number; item?: string; names?: string[] }
export const CHAPTERS = 3, CULT_WON = 5, CULT_WON_CTHULHU = 10;
