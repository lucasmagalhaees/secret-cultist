/* D118: the story of a Secret Cultist game, told like a tabletop RPG keeper would: a scene drawn among several of the
   continent's (a place, a year, a reason to be there), the old god the cult serves (and the gift it gives its high
   priest), and a few lines from the narrator: at the start, when the story turns (Act II at the 3rd page of the
   Necronomicon, the danger zone; Act III at the 5th, the veto) and at the end. The gifts touch only rolls and sanity,
   never who dies, which law passes or who wins. */
import type { Game, Region } from './types';
import { CHAPTERS, DOCS, NPCS, type Horror } from './horror';

export type GodId = 'cthulhu' | 'nyarlathotep' | 'hastur' | 'shub' | 'yog' | 'dagon' | 'azathoth' | 'tsathoggua' | 'ithaqua' | 'cthugha' | 'hydra' | 'glaaki' | 'baal' | 'mamon' | 'moloque' | 'tiamat' | 'pazuzu' | 'ereshkigal' | 'marduque' | 'asmodeu' | 'astarote';
export interface God { name: string; title: string; gift: string; act2: string; act3: string; winF: string }
export const GODS: Record<GodId, God> = {
  cthulhu: {
    name: 'Cthulhu', title: 'o que dorme em R’lyeh',
    gift: 'Sonhos: a cada ato, quem não é do culto perde 2 de sanidade',
    act2: 'Todos sonharam com a mesma cidade afundada. Ninguém comenta no café.',
    act3: 'O mar está alto demais para a estação. Os sonhos agora vêm acordados.',
    winF: 'R’lyeh subiu antes do amanhecer, e o mundo inteiro sonhou junto.'
  },
  nyarlathotep: {
    name: 'Nyarlathotep', title: 'o Caos Rastejante',
    gift: 'Mil máscaras: a Persuasão do Sumo Sacerdote rola com dado de bônus',
    act2: 'Um homem de pele escura e sorriso gentil apareceu em três lugares ao mesmo tempo.',
    act3: 'Os rostos da mesa parecem máscaras. Talvez sejam.',
    winF: 'O Faraó Negro agradeceu a hospitalidade e levou a cidade com ele.'
  },
  hastur: {
    name: 'Hastur', title: 'o Rei de Amarelo',
    gift: 'O Signo Amarelo: os investigadores ficam abalados com sanidade mais alta (45)',
    act2: 'Alguém deixou uma cópia de "O Rei de Amarelo" no seu quarto. Você não lembra de ter lido.',
    act3: 'As estrelas estão negras sobre Carcosa, e daqui dá para vê-las.',
    winF: 'A cortina caiu no segundo ato, e ninguém saiu do teatro.'
  },
  shub: {
    name: 'Shub-Niggurath', title: 'a Cabra Negra dos Bosques',
    gift: 'Os Mil Filhotes: cada armadilha custa 1 de sanidade a mais',
    act2: 'A mata ao redor cresceu um palmo durante a noite. Os animais sumiram.',
    act3: 'Algo enorme se move entre as árvores, com patas demais.',
    winF: 'Os bosques tomaram a estrada, a vila e depois o nome dela.'
  },
  yog: {
    name: 'Yog-Sothoth', title: 'o Portal e a Chave',
    gift: 'Tudo em um: a Psicologia do Sumo Sacerdote rola com dado de bônus',
    act2: 'Os relógios da casa discordam entre si, e todos estão certos.',
    act3: 'Há uma porta no corredor que ontem não estava lá.',
    winF: 'O portal se abriu, e por um instante todos os tempos foram um só.'
  },
  dagon: {
    name: 'Dagon', title: 'o Pai das Profundezas',
    gift: 'Os Abissais: o Sumo Sacerdote não cai em armadilha',
    act2: 'Os pescadores voltaram com as redes cheias de algo que não são peixes.',
    act3: 'Há olhos na água do porto, e eles não piscam.',
    winF: 'A maré levou a cidade, e ela agora canta lá embaixo.'
  },
  // D123: six more
  azathoth: {
    name: 'Azathoth', title: 'o Sultão Demoníaco, no centro do caos',
    gift: 'Flautas no vazio: para quem não é do culto, tirar 90 ou mais é desastre',
    act2: 'Ouve-se uma flauta fina e monótona, vinda de lugar nenhum.',
    act3: 'O céu sobre o observatório não tem mais estrelas, só um movimento.',
    winF: 'O deus cego se mexeu no sono, e o universo piscou.'
  },
  tsathoggua: {
    name: 'Tsathoggua', title: 'o Sapo Adormecido de N\u2019kai',
    gift: 'Indolência: o Sumo Sacerdote não fica ferido nem envenenado',
    act2: 'Um bocejo enorme ecoa das cavernas, e o calor sobe do chão.',
    act3: 'Algo preto e peludo se arrasta para a luz, sem pressa nenhuma.',
    winF: 'N\u2019kai abriu a boca, e a cidade desceu sem barulho.'
  },
  ithaqua: {
    name: 'Ithaqua', title: 'o que caminha no vento',
    gift: 'Frio de Wendigo: quem falha numa armadilha também fica ferido',
    act2: 'As pegadas na neve são enormes e terminam no meio do campo.',
    act3: 'O vento chama cada um pelo nome, e a temperatura despenca.',
    winF: 'O vento levou a vila inteira para cima, e ninguém desceu.'
  },
  cthugha: {
    name: 'Cthugha', title: 'a chama viva de Fomalhaut',
    gift: 'Fogo que purifica: uma eliminação feia custa o dobro de sanidade',
    act2: 'As lamparinas queimam azul e não se apagam com água.',
    act3: 'O horizonte arde, e não é o pôr do sol.',
    winF: 'Fomalhaut brilhou no céu do meio-dia, e depois só houve cinza.'
  },
  hydra: {
    name: 'Mãe Hydra', title: 'a senhora das profundezas',
    gift: 'Voz do abismo: a Intimidação do Sumo Sacerdote rola com dado de bônus',
    act2: 'As crianças do porto cantam uma canção que ninguém ensinou.',
    act3: 'A maré não desceu hoje. Nem vai descer.',
    winF: 'A Mãe subiu para buscar os filhos, e levou a costa junto.'
  },
  glaaki: {
    name: 'Glaaki', title: 'o habitante do lago',
    gift: 'Servos sorridentes: o Charme do Sumo Sacerdote rola com dado de bônus',
    act2: 'Os vizinhos do lago estão sempre sorrindo, e ninguém os viu comer.',
    act3: 'Há espinhos de cristal na margem, e algo respira sob o gelo do lago.',
    winF: 'Glaaki ganhou servos novos, e eles sorriem para sempre.'
  },
  baal: {
    name: 'Baal', title: 'o senhor da tempestade',
    gift: 'Língua de trovão: a Lábia do Sumo Sacerdote rola com dado de bônus',
    act2: 'Raios caem sempre no mesmo lugar, e alguém ergueu um altar ali.',
    act3: 'O céu ruge o nome dele, e os fiéis respondem.',
    winF: 'Baal voltou a reinar, e a chuva agora cobra o seu preço.'
  },
  mamon: {
    name: 'Mamon', title: 'o príncipe da cobiça',
    gift: 'Ouro fala: a Persuasão do culto (cultistas e Sumo Sacerdote) rola com dado de bônus',
    act2: 'Fortunas aparecem do nada, e ninguém pergunta de onde.',
    act3: 'Todo mundo tem um preço, e o culto está pagando.',
    winF: 'Mamon comprou a cidade inteira, e cada alma tem recibo.'
  },
  moloque: {
    name: 'Moloque', title: 'o devorador do fogo',
    gift: 'Sacrifício: cada página do Necronomicon custa 2 de sanidade a mais',
    act2: 'A fornalha de bronze foi acesa de novo, e há fila na frente dela.',
    act3: 'Os tambores tocam alto para ninguém ouvir os gritos.',
    winF: 'Moloque comeu bem, e a fornalha nunca mais apagou.'
  },
  tiamat: {
    name: 'Tiamat', title: 'a mãe do caos',
    gift: 'Águas primordiais: rolagem de 01 a 05 do culto é sempre crítico',
    act2: 'O rio corre ao contrário à noite, salgado como o mar.',
    act3: 'Serpentes de onze cabeças foram vistas no estuário.',
    winF: 'Tiamat desfez a ordem do mundo, e só restou o mar.'
  },
  pazuzu: {
    name: 'Pazuzu', title: 'o rei dos ventos',
    gift: 'Vento da peste: falhar numa armadilha também envenena',
    act2: 'Um vento quente vem do sudoeste, e quem o respira adoece.',
    act3: 'Gafanhotos cobrem o céu, e a febre não cede.',
    winF: 'Pazuzu soprou, e a peste levou o que o culto quis.'
  },
  ereshkigal: {
    name: 'Ereshkigal', title: 'a rainha do mundo dos mortos',
    gift: 'Sete portões: cada eliminação custa 4 de sanidade a mais',
    act2: 'Os mortos da cidade não ficam nos túmulos.',
    act3: 'Seis portões já se abriram. Falta um.',
    winF: 'Ereshkigal abriu o último portão, e ninguém mais volta.'
  },
  marduque: {
    name: 'Marduque', title: 'o senhor dos cinquenta nomes',
    gift: 'Quatro olhos: o Encontrar do culto (cultistas e Sumo Sacerdote) rola com dado de bônus',
    act2: 'Uma estátua de ouro apareceu na praça, e ela vira a cabeça para quem passa.',
    act3: 'O culto recita os cinquenta nomes, e a cidade obedece.',
    winF: 'Marduque voltou a governar, e a lei dele não tem perdão.'
  },
  asmodeu: {
    name: 'Asmodeu', title: 'o rei dos desejos',
    gift: 'Tentação: o Charme do culto (cultistas e Sumo Sacerdote) rola com dado de bônus',
    act2: 'As festas do clube não acabam, e quem entra não quer sair.',
    act3: 'Ninguém mais lembra por que veio, só do que quer.',
    winF: 'Asmodeu deu a cada um o que queria, e cobrou tudo.'
  },
  astarote: {
    name: 'Astarote', title: 'o grão-duque do saber proibido',
    gift: 'Segredos sussurrados: o Ocultismo do culto (cultistas e Sumo Sacerdote) rola com dado de bônus',
    act2: 'Livros aparecem nas estantes de quem nunca os comprou.',
    act3: 'As freiras do convento falam línguas mortas.',
    winF: 'Astarote contou todos os segredos do mundo, e ninguém aguentou ouvir.'
  }
};
export interface Scene { name: string; place: string; intro: string; god: GodId }
/** Several scenes for each continent; the world draws among all. */
export const SCENES: Record<Exclude<Region, 'mundo'>, Scene[]> = {
  americas: [
    { name: 'arkham', place: 'Arkham, Massachusetts, 1925', intro: 'A Universidade Miskatonic perdeu três professores este mês. O conselho da cidade quer abafar. Vocês não.', god: 'cthulhu' },
    { name: 'innsmouth', place: 'Innsmouth, 1927', intro: 'Uma cidade de pescadores onde ninguém olha nos olhos. O ônibus só vem uma vez por dia.', god: 'dagon' },
    { name: 'amazonia', place: 'Um seringal no Rio Negro, 1923', intro: 'A expedição sumiu perto de uma pirâmide que não estava no mapa. Vocês são a segunda expedição.', god: 'shub' },
    { name: 'novaorleans', place: 'Nova Orleans, carnaval de 1926', intro: 'Mascarados nos pântanos, tambores que não param. Um juiz da cidade preside rituais.', god: 'nyarlathotep' },
    { name: 'providence', place: 'Um observatório em Providence, 1926', intro: 'O astrônomo da cidade parou de dormir. Diz que a música vem do telescópio.', god: 'azathoth' },
    { name: 'manitoba', place: 'As florestas de Manitoba, 1924', intro: 'Um povoado inteiro foi encontrado de pé, congelado, olhando para o céu.', god: 'ithaqua' },
    { name: 'wallstreet', place: 'Wall Street, outubro de 1929', intro: 'A bolsa caiu, mas um punhado de homens nunca esteve tão rico.', god: 'mamon' },
    { name: 'salem', place: 'Salem, Massachusetts, 1927', intro: 'Na biblioteca da cidade, um livro antigo se reescreve sozinho.', god: 'astarote' }
  ],
  europa: [
    { name: 'romenia', place: 'Uma abadia nos Cárpatos, 1924', intro: 'Os monges pararam de tocar o sino. A aldeia diz que agora são outros que rezam lá.', god: 'shub' },
    { name: 'londres', place: 'Londres, sob a neblina de 1925', intro: 'Uma peça foi proibida depois da estreia. Metade da plateia não voltou para casa.', god: 'hastur' },
    { name: 'paris', place: 'Paris, 1928', intro: 'Um colecionador comprou um livro em latim num leilão. Desde então ninguém atende a porta dele.', god: 'yog' },
    { name: 'severn', place: 'Um lago no vale do Severn, Inglaterra, 1928', intro: 'Um pintor se mudou para a margem e parou de responder cartas. Os quadros continuam chegando.', god: 'glaaki' },
    { name: 'islandia', place: 'Uma fazenda na Islândia, 1925', intro: 'O inverno chegou em agosto e só cai neve num raio de um quilômetro.', god: 'ithaqua' },
    { name: 'city', place: 'A City de Londres, 1925', intro: 'Um banco centenário abriu um cofre que não constava da planta.', god: 'mamon' },
    { name: 'malta', place: 'Os templos de Malta, 1927', intro: 'Os arqueólogos acharam um altar fenício ainda quente.', god: 'baal' },
    { name: 'paris', place: 'Um clube de Montmartre, Paris, 1926', intro: 'As festas duram três dias, e quem sai não reconhece a própria casa.', god: 'asmodeu' },
    { name: 'loudun', place: 'O convento de Loudun, 1925', intro: 'As freiras voltaram a falar latim ao contrário.', god: 'astarote' }
  ],
  asia: [
    { name: 'mongolia', place: 'Uma escavação no Deserto de Gobi, 1926', intro: 'O planalto tem pedras com inscrições mais antigas que qualquer povo. Uma delas está quente.', god: 'yog' },
    { name: 'xangai', place: 'Xangai, 1927', intro: 'Um navio chegou sem tripulação, só com caixas vindas do Pacífico Sul.', god: 'cthulhu' },
    { name: 'himalaia', place: 'Um mosteiro no Himalaia, 1929', intro: 'Os monges contam de um platô onde o vento fala. Uma caravana inteira foi escutar.', god: 'hastur' },
    { name: 'leng', place: 'O Platô de Leng, 1930', intro: 'Os mapas dizem que fica na Ásia Central; os guias dizem que fica onde quiser.', god: 'tsathoggua' },
    { name: 'kyoto', place: 'Um templo em Kyoto, 1927', intro: 'As lanternas do templo acendem sozinhas, com um fogo que não esquenta.', god: 'cthugha' },
    { name: 'babilonia', place: 'As ruínas da Babilônia, 1924', intro: 'A escavação alemã encontrou uma tábua do Enuma Elish que ninguém traduziu.', god: 'tiamat' },
    { name: 'ninive', place: 'Nínive, perto de Mossul, 1926', intro: 'Uma estatueta de bronze com asas e garras saiu da terra, e a febre veio junto.', god: 'pazuzu' },
    { name: 'ur', place: 'O cemitério real de Ur, 1928', intro: 'Os túmulos estavam abertos por dentro.', god: 'ereshkigal' },
    { name: 'baalbek', place: 'Baalbek, no Líbano, 1925', intro: 'Uma tempestade sem nuvens caiu sobre o templo de Júpiter.', god: 'baal' },
    { name: 'esagila', place: 'O templo de Esagila, Babilônia, 1926', intro: 'A escavação achou uma estátua de ouro que não estava lá ontem.', god: 'marduque' }
  ],
  africa: [
    { name: 'nilo', place: 'Uma expedição no Nilo, 1925', intro: 'Abriram a tumba de um faraó que a história apagou. O nome dele estava raspado de todas as paredes.', god: 'nyarlathotep' },
    { name: 'quenia', place: 'O Monte Quênia, 1926', intro: 'Uma missão inteira desceu a montanha rindo, e ninguém lá ri mais.', god: 'nyarlathotep' },
    { name: 'zanzibar', place: 'Zanzibar, 1928', intro: 'O mar devolveu na praia algo com escamas e um anel de ouro no dedo.', god: 'dagon' },
    { name: 'saara', place: 'Uma cratera no Saara, 1927', intro: 'Caiu algo do céu que ainda está quente, e a areia em volta virou vidro.', god: 'cthugha' },
    { name: 'congo', place: 'Uma missão no Congo, 1925', intro: 'Os missionários abriram uma caverna e acharam uma cidade embaixo, quente e úmida.', god: 'tsathoggua' },
    { name: 'cartago', place: 'Cartago, na Tunísia, 1925', intro: 'O tofete foi escavado, e as urnas estão cheias de novo.', god: 'moloque' },
    { name: 'cairo', place: 'O Cairo antigo, 1927', intro: 'Um vento de areia trouxe a peste e um amuleto alado.', god: 'pazuzu' },
    { name: 'alexandria', place: 'Alexandria, 1927', intro: 'Um papiro com os cinquenta nomes foi roubado do museu, e a cidade mudou.', god: 'marduque' }
  ],
  oceania: [
    { name: 'ilha', place: 'Uma ilha fora do mapa, Pacífico Sul, 1925', intro: 'A bússola gira sozinha. Os sobreviventes do naufrágio dizem que a terra subiu do mar.', god: 'cthulhu' },
    { name: 'deserto', place: 'O deserto australiano, 1935', intro: 'Ruínas de basalto sob a areia, com corredores largos demais para gente.', god: 'yog' },
    { name: 'nova-zelandia', place: 'Uma baía na Nova Zelândia, 1927', intro: 'As baleias encalham sempre na mesma praia, viradas para o mesmo lado.', god: 'dagon' },
    { name: 'ponape', place: 'O recife de Ponape, 1926', intro: 'Mergulhadores acharam escadas no fundo do recife, e alguém subiu por elas.', god: 'hydra' },
    { name: 'tasmania', place: 'Uma estação na Tasmânia, 1929', intro: 'Os instrumentos da estação marcam um som que ninguém escuta.', god: 'azathoth' },
    { name: 'coral', place: 'O Mar de Coral, 1926', intro: 'Os recifes cresceram em espiral numa só noite.', god: 'tiamat' },
    { name: 'opala', place: 'As minas de opala de Coober Pedy, 1928', intro: 'Os mineiros cavaram fundo demais e ouviram portões se abrindo.', god: 'ereshkigal' }
  ],
  brasil: [
    { name: 'sertao', place: 'O sertão da Bahia, 1926', intro: 'Um beato reuniu mil seguidores ao redor de uma pedra caída do céu. A pedra canta.', god: 'shub' },
    { name: 'rio', place: 'O Rio de Janeiro, 1922', intro: 'Na semana da arte moderna, um quadro que ninguém pintou apareceu na exposição.', god: 'hastur' },
    { name: 'ouro-preto', place: 'Ouro Preto, 1927', intro: 'Uma mina fechada há duzentos anos voltou a ter barulho de picareta lá dentro.', god: 'yog' },
    { name: 'fornalha', place: 'Uma siderúrgica em Minas, 1928', intro: 'O alto-forno não apaga há três meses, e ninguém o alimenta.', god: 'cthugha' },
    { name: 'abrolhos', place: 'O arquipélago de Abrolhos, 1925', intro: 'Os pescadores voltaram contando de uma mulher enorme cantando no mar.', god: 'hydra' },
    { name: 'bolsa', place: 'A Bolsa do Rio, 1929', intro: 'O café caiu, e um barão comprou metade da cidade sem gastar um tostão.', god: 'mamon' },
    { name: 'engenho', place: 'Um engenho no Recôncavo, 1926', intro: 'A fornalha da moenda pede lenha, e lenha não é o que ela come.', god: 'moloque' },
    { name: 'carnaval', place: 'O carnaval do Rio, 1928', intro: 'Um bloco de mascarados não tira a máscara desde a quarta-feira de cinzas.', god: 'asmodeu' }
  ]
};
const ALL: Scene[] = Object.values(SCENES).flat();
/** The scene of a game: drawn once, among the continent's (all, for the world). */
export function sceneOf(g: Game): Scene | undefined {
  if (g.pack !== 'culto') return undefined;
  if (g.scene) return ALL.find(s => s.name === g.scene);
  return undefined;
}
export const godOf = (g: Game): God | undefined => { const s = sceneOf(g); return s ? GODS[s.god] : undefined; };
export const godIdOf = (g: Game): GodId | undefined => sceneOf(g)?.god;
/** Draw the scene of a new Secret Cultist game and tell the opening. */
export function setScene(g: Game, rand: () => number, horror?: Horror): Game {
  if (g.pack !== 'culto' || g.scene) return g;
  const list = g.region && g.region !== 'mundo' ? SCENES[g.region] : ALL, kept = g.campaign ? ALL.find(x => x.name === g.campaign?.scene) : undefined;   // D121: a campaign keeps its scene
  const s = kept || list[Math.floor(rand() * list.length)], god = GODS[s.god];
  const ch = g.campaign ? `Capítulo ${g.campaign.ch} de ${CHAPTERS}. ${g.campaign.prev === 'F' ? 'O culto venceu da última vez, e todos carregam isso. ' : g.campaign.prev === 'L' ? 'Da última vez, os investigadores seguraram o culto. Por enquanto. ' : ''}` : '';
  return { ...g, scene: s.name, ...(g.campaign && !g.campaign.scene ? { campaign: { ...g.campaign, scene: s.name } } : {}), ...(horror && horror !== 'classico' ? { horror } : {}), log: [...g.log, `📜 ${ch}${s.place}. ${s.intro} Por trás de tudo, um culto a ${god.name}, ${god.title}. ${god.gift}.`] };
}
/** The act the story is in, by the pages of the Necronomicon on the board. */
export const actOf = (g: Game): 1 | 2 | 3 => (g.laws.F >= 5 ? 3 : g.laws.F >= 3 ? 2 : 1);
/** The narrator's line when the story turns or ends, once each: added to the log. */
export function narrate(g: Game): Game {
  const s = sceneOf(g), god = godOf(g);
  if (!s || !god) return g;
  const told = (k: string): boolean => g.log.some(l => l.startsWith(`📜 ${k}`));
  if (g.phase === 'over' && !told('Fim')) {
    const boss = g.players.find(p => p.role === 'lider')?.name ?? '';
    const end = g.winner === 'F' ? god.winF
      : g.laws.L >= 5 ? `As cinco relíquias se juntaram, e a Lança selou o que ${god.name} quase abriu.`
        : `${boss}, o Sumo Sacerdote, caiu, e o culto a ${god.name} se desfez como fumaça.`;
    const c = g.campaign, wins = c ? { L: c.wins.L + (g.winner === 'L' ? 1 : 0), F: c.wins.F + (g.winner === 'F' ? 1 : 0) } : null;
    const tail = c && wins && c.ch >= CHAPTERS ? ` Fim da campanha: investigadores ${wins.L} × ${wins.F} culto. ${wins.L > wins.F ? `${god.name} volta a dormir, por enquanto.` : `${god.name} não volta a dormir.`}` : c ? ` Fim do capítulo ${c.ch}.` : '';   // D121
    return { ...g, log: [...g.log, `📜 Fim. ${end}${tail}`] };
  }
  const act = actOf(g);
  // D120: a document with each act, and at Act II a character of the scene who tends the table
  const id = s.god, npc = NPCS[id];
  if (act >= 2 && !told('Ato II')) return { ...g, hist: [...g.hist, { k: 'npc', god: id }], log: [...g.log, `📜 Ato II, a descida. ${god.act2}`, `📄 ${DOCS[id][0]}`, `📜 Chega ${npc[0]}. ${npc[1]}: os feridos são cuidados e todos recuperam um pouco de sanidade.`] };
  if (act >= 3 && !told('Ato III')) return { ...g, log: [...g.log, `📜 Ato III, o ritual. ${god.act3}`, `📄 ${DOCS[id][1]}`] };
  return g;
}
