# Decisões

Tudo o que foi decidido, e por quê. O que não está aqui não foi decidido: pergunte. Cada decisão tem número, data e de onde veio.

Modelo de uma decisão:

```
## Dn. Título curto

- **Contexto (DD/MM/AAAA):** o pedido, nas palavras de quem pediu.
- **Decisão:** o que fica.
- **Interpretações que precisaram ser feitas:** o que o pedido não dizia.
- **Não sei:** o que ficou sem verificar.
```

## Linha do tempo

1. Começo a partir do modelo de arquitetura (D1).
2. O app vira o jogo Líder Vermelho Secreto (D2).
3. Os nomes passam a ser os do Secret Cultist (D3).
4. Visual no clima do jogo original (D4).
5. Baralho do jogo original (11 cultistas e 6 liberais), vitória com 6 leis para os dois lados (D5).
6. Regras iguais às do original, em tudo (D6).
7. Telas mais claras, modo escuro revisado, animações, estilo art déco e desenhos de animais (D7).
8. Endereço de produção (D8).
9. Mais animações e melhorias: carta virando, distribuição, descarte, carimbo, poderes, confete, vibração, sons, resumo, esconder sozinho, ajuda e desfazer (D9).
10. Jogar sozinho contra a IA, em quatro níveis, com um juiz que só mostra a cada IA o que o lugar dela saberia (D10).
11. Treino com papel escolhido, nomes históricos para as IAs, ata com quem aprovou cada lei e o anúncio da lei aprovada (D11).
12. Tema tema vermelho, nomes mais conhecidos, anotações da pessoa e votos variados (D12).
13. As IAs conversam, dicas do treinador, o que as IAs pensavam de você e velocidade da IA (D13).
14. Anotações num painel lateral, desconfiança ao vivo e o "undefined" na vez da IA (D14).
15. O ponto crucial para quem é do lado escondido (D15).

## D1. Página estática, núcleo puro e deploy na Vercel

- **Contexto:** o app começa do modelo de arquitetura do Oito Lados.
- **Decisão:** uma página estática em TypeScript, montada pelo Vite num arquivo só, sem backend, sem login e sem banco. A lógica fica em `src/core/`, pura e testada sozinha; a página em `src/app/`. Publicação pela integração da Vercel com o GitHub, a cada merge na `main`.
- **Por quê:** uma página estática não tem servidor para manter, abre do disco nos testes e cabe no plano gratuito de hospedagem estática.

## D2. Líder Vermelho Secreto: as regras

- **Contexto (12/10/2026):** o pedido de origem descreveu um jogo de cartas de dedução social em dois grupos, com 17 leis, um presidente que indica o chanceler, descarte de 3 para 2 e de 2 para 1, um líder escondido e poderes por lei do lado escondido (a regra original, D6).
- **Perguntado e respondido (12/10/2026):** um celular passando de mão (não placar de apoio para cartas físicas); Líder Vermelho com as regras de vitória do Secret Cultist; 3 rejeições seguidas aprovam a lei do topo.
- **Decisão:** as regras pedidas valem como foram ditas; o que o pedido não cobria segue o Secret Cultist. Os requisitos 1 a 12 do `CLAUDE.md` são a regra completa.
- **Interpretações que precisaram ser feitas:**
  - "17 cartas, 9 vermelhos e 8 liberais" é o baralho de leis, não o número de jogadores.
  - "6 leis para vencer" vale para os dois lados (no Secret Cultist os liberais vencem com 5).
  - O Líder Vermelho nunca conhece os vermelhos, em qualquer tamanho de mesa (no Secret Cultist, com 5 ou 6, o Líder conhece o cultista). Pedido explícito.
  - Os poderes são os pedidos, iguais em toda mesa (no Secret Cultist mudam com o tamanho e há eleição especial, que ficou de fora).
  - "Pedir a algum jogador que diga se é vermelho": o app mostra o partido verdadeiro só ao presidente, que conta o que quiser. O Líder Vermelho aparece como vermelho.
  - Do Secret Cultist: número de vermelhos por mesa, limite de mandato, veto a partir da 5ª lei vermelho, ninguém investigado duas vezes, caos sem poder e zerando o limite de mandato, lixo reembaralhado com menos de 3 leis.
  - A votação é em voz alta e o celular só registra o resultado (pedido em 12/10/2026: "aqui fica mais facil dizer se foi eleito ou nao em vez de apurar votacao") (no Secret Cultist os votos também são revelados juntos). O primeiro presidente é sorteado.
- **Não sei:** se a mesa vai querer voto secreto no celular, ou os poderes variando com o tamanho da mesa.

## D3. Nomenclatura do Secret Cultist

- **Contexto (12/10/2026):** "muda os nomes e toda nomenclatura pra virar o secret lider".
- **Decisão:** o app se chama Secret Cultist; vermelhos viram cultistas, Líder Vermelho vira Líder, a lei vermelho (`C`) vira cultista (`F`), os votos são Ja! e Nein!. Slug `secret-cultist`, chave `secretcultist.v1`, endereço https://secret-cultist.vercel.app. As regras da D2 não mudam.
- **Interpretações que precisaram ser feitas:** só os nomes mudaram. Os números continuam os pedidos na D2 (9 cultistas e 8 liberais no baralho, 6 leis para os dois lados, Líder sem conhecer os cultistas), que não são os do jogo original (11 e 6, liberais vencem com 5).
- **Licença:** Secret Cultist é CC BY-NC-SA 4.0. O crédito está na tela inicial e no README; o app não pode ser vendido nem ter anúncios.
- **Não sei:** se o nome "Secret Cultist" pode ser usado num endereço público sem falar com os autores; a licença cobre o conteúdo, não marca.

## D4. Visual

- **Contexto (13/10/2026):** "pode usar a identidade visual do jogo original, ou seja, estilizar da forma melhor possivel".
- **Decisão:** um visual próprio no mesmo clima de época: pôster político dos anos 30, papel creme com textura, faixa preta no topo, azul liberal e vermelho-alaranjado cultista, títulos em capitulares condensadas, bordas grossas, sombras duras, cartas de lei com selo (balança e caveira) e o papel secreto num cartaz com raios.
- **Interpretações que precisaram ser feitas:** nada do material gráfico original foi copiado (logo, ilustrações, cartas, tabuleiros). Fontes só do sistema, para o app continuar abrindo sem internet.
- **Consequência nos testes:** o `tests/e2e.py` passou a ler o texto com `textContent` em vez de `innerText`, porque o CSS agora mostra botões e títulos em maiúsculas; o teste confere as palavras, não a caixa.

## D5. Baralho do jogo original, vitória com 6

- **Contexto (13/10/2026):** "São 11 cultistas e 6 liberais". Depois, perguntado se a vitória liberal ficava em 5 como no original: "Deixe igual o jogo original". Em seguida: "É com 6 leis mesmo pra vencer".
- **Decisão:** baralho de 17 leis, 11 cultistas e 6 liberais (substitui o 9/8 da D2). A vitória fica em 6 leis para os dois lados, como na D2; o tabuleiro liberal tem 6 casas. A troca para 5 liberais chegou a ser feita e foi desfeita no mesmo PR.
- **Interpretações que precisaram ser feitas:** "6 leis mesmo" foi lido como valendo para os dois lados. O resto que difere do original continua como está na D2 (Líder sem conhecer os cultistas, poderes iguais em toda mesa, sem eleição especial).
- **Não sei:** como fica o equilíbrio. Com só 6 cartas liberais e vitória em 6, os liberais só vencem por leis se as 6 forem aprovadas (as descartadas voltam quando o baralho é reembaralhado).

## D6. Regras iguais às do original

- **Contexto (13/10/2026):** "Deixa td igual no original inclusive o visual", depois de receber a lista das diferenças.
- **Decisão:** valem as regras do Secret Cultist original. Substitui o que a D2 e a D5 tinham de diferente:
  - os liberais vencem com 5 leis e os cultistas com 6; o tabuleiro liberal tem 5 casas;
  - com 5 ou 6 jogadores o Líder sabe quem é o cultista;
  - os poderes seguem o tabuleiro da mesa: 5–6, 7–8 e 9–10 jogadores;
  - existe a eleição especial: o presidente escolhe o próximo presidente, que pode ser alguém barrado pelo limite de mandato, e depois dessa rodada a ordem segue de quem convocou.
- **Interpretações que precisaram ser feitas:**
  - O tabuleiro é escolhido pelo número de jogadores que começaram, não pelos que estão vivos.
  - A votação continua em voz alta, e o celular só registra se o governo foi eleito. No original os votos são cartas Ja!/Nein! viradas juntas; o resultado é o mesmo, só muda o meio (pedido de 12/10).
  - Visual: continua o próprio, no clima de época (D4). Reproduzir o logo, as cartas, os tabuleiros e as ilustrações do jogo original não foi feito.
- **Não sei:** as regras foram escritas a partir do que se sabe do livro de regras do original, sem conferir o texto oficial nesta data.

## D7. Visual: clareza, animações, art déco e animais

- **Contexto (13/10/2026):** pedido para deixar o visual "o mais parecido possível" com o original, recusado (copiaria logo, cartas, tabuleiros e personagens). Oferecidos telas mais claras, modo escuro melhor, animações e outra linha de estilo: "Quero todas". Depois: "Coloca uma carta diferente pro lider. Pode estilizar com animais pro liberais e pros facistas. Facistas como cobras de uniforme e liberais como pássaros". Sugerido em seguida usar lagartos como no original: recusado pelo mesmo motivo; ficaram as cobras e os pássaros pedidos.
- **Decisão:**
  - faixa sempre visível com presidente, chanceler (ou indicado) e rejeições; tela de passar o celular com o nome grande; histórico recolhível (aberto no fim do jogo);
  - modo escuro com sombra própria (preta) e contraste revisado;
  - animações: fase nova, segredo aberto e lei aprovada; nada com "reduzir movimento";
  - estilo art déco como opção, o pôster continua o padrão;
  - desenhos próprios em SVG (os cultistas trocaram de cobra para jacaré em seguida: "e se o cultista for um jacare? a arte da cobra ficou mt ruim, a do liberal ficou boa"; o jacaré segue o traço do pássaro, de perfil, de pé): pássaro de uniforme (quepe, gola e botões; pedido em seguida: "Os pássaros pode ter uniforme tbm e a cobra Líder ter um design p diferenciar"), jacaré de uniforme (quepe, cinto, botões) e uma carta do Líder com outro contorno (fundo preto, faixa vermelha; jacaré de casaco longo, quepe alto, olho vermelho, sobrancelha franzida e boca aberta, com o punho batendo no púlpito). Depois, mais acabamento a pedido ("faz entao"): sombras, escamas, dentes, expressão nos olhos e medalha no pássaro. Pedidos para se aproximar de cartas oficiais e de uma expansão da Steam foram recusados. Por fim ("tem q mudar totalmente o estilo da ilustracao, faca mais caricatura", com uma ilustração de banco de imagens como exemplo do tipo de traço): tudo redesenhado em caricatura, com contorno preto grosso, cores chapadas, cabeça grande e expressão exagerada. Perguntado e respondido: cultista jacaré, Líder naja. Nada foi copiado da imagem de exemplo. As leis e o tabuleiro voltaram para os símbolos (balança e caveira): "a ilustracao das leis nao deveria ter mudado, só a dos personagens"., também nos selos das leis e do tabuleiro.
- **Interpretações que precisaram ser feitas:** "outra linha de estilo" virou um segundo estilo escolhível, não uma troca do pôster. O partido investigado mostra o desenho do partido, nunca a carta do Líder.
- **Não sei:** como as animações e a Didot ficam no iPhone de verdade (os testes rodam no Chromium).

## D8. Endereço de produção

- **Contexto (13/10/2026):** o job "produção" falhou depois do merge do #4. O script conferia `https://secret-cultist.vercel.app`, um endereço suposto no começo que é de outro projeto ("Secwet Hitwew UwU", sem carimbo de commit). O deploy da Vercel tinha dado certo. Endereço informado pelo Lucas: https://secret-game-gamma.vercel.app/ (conferido no mesmo dia: serve o commit `6e6e539`).
- **Decisão:** esse é o padrão do script e do `CLAUDE.md`. A variável `APP_PROD_URL` do repositório, se existir, manda. O script passa a dizer quando o endereço é de outro site ou pede login da Vercel.
- **Não sei:** se o domínio vai mudar (domínio próprio). Se mudar, basta a variável `APP_PROD_URL`.

## D9. Mais animações e melhorias

- **Contexto (13/10/2026):** 12 propostas (6 animações, 6 melhorias), "faca todas animacoes e melhorias".
- **Decisão:** todas, como estão nos requisitos 13 a 17 e na seção Interface do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - Som e vibração ficam ligados por padrão e saem juntos num botão só ("Som e vibração" em Aparência).
  - Nenhum som em ação secreta (o descarte toca papel, mas o descarte não diz qual lei foi).
  - O desfazer vale só para escolhas públicas (indicação e votação) e some ao abrir um segredo, para ninguém refazer depois de ver cartas.
  - "Quem mentiu na investigação": o app não sabe o que o presidente disse; o resumo mostra o que a investigação mostrou de verdade, e a mesa compara.
  - Virado para baixo é o celular com mais de 150° de inclinação; o iPhone só informa isso depois de a pessoa permitir, pedido no primeiro toque em "mostrar".
  - Com "reduzir movimento", nada anima e nada espera (o descarte segue na hora); os testes ponta a ponta rodam assim, mais uma rodada com movimento.
- **Não sei:** como os sons soam no alto-falante de um celular, e se a permissão de movimento do iPhone aparece como esperado.

## D10. Jogar sozinho contra a IA

- **Contexto (26/10/2026):** "eu quero conseguir jogar sozinho … com e contra jogadores controlados pela IA". Depois: "pode ter níveis de dificuldade … baseado no quanto eles compram um blefe, o quanto eles vão contando as cartas", com o truco (D3 e requisito 9 do truco) de referência: "a IA, no modo extremo, ela já começa a contar as cartas. Ela não faz metajogo"; e "as IAs não podem extrapolar o comando delas … uma IA mestre e outras IAs … para garantir que nenhuma extrapole a sua função".
- **Decisão:** lugares da IA na mesa, quatro níveis como no truco (fácil, médio, difícil, extremo), e um juiz (`src/core/judge.ts`) no papel da "IA mestre": é o único código que segura a partida inteira; a cada vez, monta a visão de um lugar (o que aquela pessoa saberia sentada ali), faz uma pergunta com as respostas permitidas e joga a resposta pelas regras. O código que decide (`src/core/ai.ts`) só recebe essa visão. Requisitos 18 a 21 do `CLAUDE.md`.
- **Como a IA pensa:** pesa todas as divisões de papéis que cabem no que ela sabe pelo quanto cada uma explica o que aconteceu (leis de cada governo, o que presidente e chanceler disseram, investigações, quem foi eleito chanceler na zona do Líder sem a partida acabar, quem foi eliminado sem a partida acabar). Os níveis mudam o descuido, a memória, quanto acredita no que ouve (comprar blefe) e, no extremo, a conta do baralho (a chance de cada mão pelas leis que ainda podem sair). Como cultista, mente quando a verdade entrega, coordena a história com o aliado e, do difícil para cima, deixa o Líder limpo antes da 3ª lei cultista e elimina quem pegou um aliado mentindo; no extremo, só conta "tirei 3 cultistas" quando a conta do baralho deixa isso crível.
- **Interpretações que precisaram ser feitas:**
  - "IA" aqui é regra e conta no próprio aparelho, sem servidor nem modelo de linguagem: o app continua uma página estática, sem custo e sem internet.
  - "Jogar sozinho" e "com poucos": a IA completa qualquer mesa que tenha pelo menos uma pessoa. Com mais de uma pessoa, o celular continua passando de mão para os segredos.
  - Com IA na mesa, o voto deixa de ser em voz alta: cada pessoa toca no próprio voto e as IAs votam junto (a IA não ouve a sala). Todos os votos ficam no registro, como na mesa de verdade.
  - A IA precisa ouvir o que as pessoas dizem: depois de governar, investigar ou espiar, a pessoa escolhe o que diz (pode mentir ou ficar calada) até a próxima eleição. As IAs falam sempre; as liberais dizem a verdade.
  - O nível vale para todas as IAs da mesa, dos dois lados.
  - "Não faz metajogo": nenhuma IA muda o jeito de jogar pelo jeito que as outras jogam nem pelo histórico de partidas anteriores.
- **Balanceamento (26/10/2026, pedido do Lucas):** "os cultistas da IA têm que melhorar também … o jogo tem que ficar o mais balanceado possível … não pode ficar um jogo tendencioso para nenhum dos lados". A primeira versão deixava os liberais vencerem 28% no fácil e 65% no extremo, e o nível dos cultistas quase não pesava. A medição também tinha um erro: a mesa inteira votava no nível do presidente; agora cada lugar decide no próprio nível (`Player.level`, só usado pelas medições). O que mudou:
  - Cultistas do difícil para cima pensam em como a mesa vai ver cada jogada (`image`): para cada jeito de jogar a mão, calculam, com o mesmo raciocínio da mesa, quanto mais desconfiariam deles e do Líder, contra o valor de uma lei cultista. O Líder que não conhece o time faz o mesmo com a própria imagem.
  - Cultistas do difícil para cima indicam o Líder sempre que podem a partir da 3ª lei cultista, e investigam o Líder para abonar ("é liberal").
  - Descuido em dois: `noise` (escolher e votar sem pensar) e `slip` (descartar a lei errada). No fácil, errar a lei 30% das vezes entregava o jogo aos cultistas, porque o baralho é quase só cultista.
  - Calibrados por medição, mantendo a ordem dos níveis: memória do fácil 2 → 4 governos; `lie` (quanto desconfia do que ouve) 0 / 0,3 / 0,35 / 0,4, antes 0 / 0,4 / 0,7 / 0,85. Acreditar que o cultista mente quase sempre deixava o liberal certeiro demais.
- **Medido (26/10/2026, `node scripts/ai_bench.mjs 400`, 6.400 partidas só de IA, mesas de 5 a 10):** vitórias liberais, liberais no nível da linha e cultistas no da coluna:

  | liberais \ cultistas | fácil | médio | difícil | extremo |
  |---|---|---|---|---|
  | fácil | 48% | 39% | 22% | 21% |
  | médio | 69% | 51% | 39% | 37% |
  | difícil | 81% | 69% | 47% | 44% |
  | extremo | 85% | 72% | 52% | 47% |

  Com a mesa toda no mesmo nível (a diagonal, que é o jogo do app), os liberais vencem entre 47% e 51%. Fora da diagonal, quem tem o nível maior vence mais, dos dois lados. Erro da medida: cerca de 2,5 pontos para cada lado. Todas as partidas terminaram.
- **Medido também (mesmo comando, 1.200 partidas por nível, uma IA média no lugar de "você"):** como liberal, você vence 51% no fácil, 53% no médio, 45% no difícil e 45% no extremo; como cultista, 57%, 48%, 43% e 38%. O nível agora é dificuldade dos dois lados.
- **Corrigido junto:** depois de um veto aceito o baralho não era reabastecido, e o presidente seguinte podia tirar menos de 3 leis (achado por uma partida só de IA que travou; agora há um caso para isso).
- **Não sei:** como a IA se sai contra gente de verdade (só foi medida contra ela mesma); se os textos das falas soam naturais; quanto tempo de "pensando" é confortável num celular.

## D11. Treino, nomes históricos, ata e anúncio da lei

- **Contexto (27/10/2026):** "quero uma opção de treino onde posso escolher meu papel quando jogo contra IAs, quero nomes reais de liberais e cultistas no jogo, quero uma opção de assistência que mostra na ata quem aprovou cada lei"; e logo depois: "precisa ter uma animação ali pra na hora da aprovação da lei, exemplo A aprovou lei B". Sobre os nomes, perguntei e o Lucas escolheu "históricos, misturados": nomes de políticos reais dos anos 30, sem ligação com o papel sorteado.
- **Decisão:** requisitos 22 a 25 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - Nomes: figuras históricas conhecidas dos dois lados, só na expansão (D100). O líder fica de fora porque é papel. O nome nunca segue o papel: se seguisse, entregaria o jogo. Como no truco (D6 de lá), das figuras reais só se usa o nome; o que elas "dizem" são as falas do jogo.
  - Treino: só vale com uma pessoa na mesa. Com mais de uma, a escolha de uma entregaria algo às outras. O papel escolhido entra por troca com o lugar que o tirou, então o resto da mesa continua sorteado. As IAs não ficam sabendo.
  - "Na ata quem aprovou cada lei": a ata é um cartão novo, com cada lei, o presidente e o chanceler, e quem votou Ja! no governo que a aprovou, mais a soma por jogador. É só informação pública, a mesma que daria para anotar num papel; não mostra mão, partido nem papel. Sem IA na mesa, o celular não guarda os votos (são em voz alta), e a ata diz isso.
  - A animação vale em toda mesa, com IA ou sem: a lei aprovada entra no alto da tela com os nomes do presidente e do chanceler ("O caos aprovou" quando entra pelo caos). Com "reduzir movimento", o aviso aparece parado pelo mesmo tempo.
- **Não sei:** se os nomes históricos incomodam alguém na mesa; se a ata deixa o jogo fácil demais (por isso ela é desligável e vem desligada).

## D12. Tema tema vermelho, nomes conhecidos, anotações e votos

- **Contexto (27/10/2026):**
  - O pedido trouxe nomes mais conhecidos e um segundo tema histórico com o mesmo jogo; perguntei quem é a maioria e quem é o time escondido, e a pessoa escolheu o tema vermelho, com lobo branco para o lado escondido e urso para o líder.
  - "avaliar se as votações estão balanceadas".
  - "quero tbm um bloco de anotações do jogador humano marcando quem é liberal e quem é cultista, se eu conheço os papéis eles já vêm marcados, senão eu vou marcando"; "Libs, Cults and Coms pode ser abreviação".
- **Decisão:** requisitos 22, 26 e 27 do `CLAUDE.md`; temperamento das IAs no 18.
- **Interpretações que precisaram ser feitas:**
  - O tema novo troca os cultistas pelos vermelhos, e o Líder pelo Líder Vermelho, como time escondido. Regras, poderes, IAs e balanceamento são os mesmos: por dentro o lado escondido continua sendo `F`. Os votos viram Da!/Niet!, e o alto da tela diz "Secret Vermelho".
  - Nomes "mais conhecidos":
    - as listas dos dois temas ficam na expansão (D100).
    - Não ficam presos aos anos 30, para serem conhecidos.
  - Anotações: só com uma pessoa na mesa (com mais gente, as outras veriam). Vem marcado o que a pessoa sabe de certeza pelas regras: o time (cultista vê cultistas e Líder; Líder na mesa de 5 ou 6 vê o cultista) e o resultado das próprias investigações.
- **Votações (medido em 27/10/2026, 800 partidas só de IA por nível):** os lados estavam equilibrados, mas a votação era monótona.
  - 82% dos governos eram eleitos, e no difícil e no extremo 55% das votações eram unânimes: as IAs liberais com a mesma informação votavam em bloco.
  - Cada IA ganhou um temperamento sorteado (`mood`, de -1 a 1, que move em até 0,2 o risco que ela aceita num governo).
  - Depois: unânimes 13% a 31% conforme o nível; eleitos cerca de 82%, porque os presidentes indicam quem parece mais limpo.
  - O sinal continua lá: um liberal vota Ja! em cerca de 80% dos governos limpos e em cerca de 53% dos que têm cultista. Os cultistas votam Ja! em cerca de 92% dos governos com aliado e 76% dos sem.
  - O fácil foi recalibrado depois disso: memória de 5 governos e `lie` 0,1.
- **Balanceamento depois disso (27/10/2026, `node scripts/ai_bench.mjs 400`):** com a mesa no mesmo nível, os liberais vencem 49% no fácil, 53% no médio, 47% no difícil e 47% no extremo (erro de cerca de 2,5 pontos). "Você" (uma IA média num lugar): como liberal, 52%, 49%, 44% e 44%; como cultista, 61%, 56%, 45% e 43%. O tema não entra na conta, porque por dentro o jogo é o mesmo.
- **Não sei:** se os nomes e o tema incomodam alguém na mesa; se o caderno deixa o jogo fácil demais (ele só anota o que a pessoa já sabe ou acha).

## D13. Conversa, treinador, o que pensavam de você, velocidade

- **Contexto (27/10/2026):** propus melhorias e o Lucas pediu "faz o 1-4":
  1. as IAs conversam (acusam e defendem);
  2. dicas do treinador com as contas;
  3. no fim, o que as IAs pensavam de você;
  4. a velocidade da IA.
- **Decisão:** requisitos 28 a 31 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - Conversa: até 2 IAs por rodada, no começo da rodada, cada uma uma frase ("Desconfio de X", "Confio em Y") ou calada. A pessoa não fala por enquanto (só diz o que viu, como já fazia).
  - As IAs não levam a conversa em conta nas contas delas. Se levassem, os cultistas aprenderiam a usá-la e o balanceamento da D10 mudaria; do jeito que está, a conversa é informação para as pessoas. O liberal fala o que acha de verdade, e isso é tão confiável quanto ele.
  - Treinador: separado do treino de papel (D11), porque serve em qualquer partida contra a IA com uma pessoa só. As contas são as do nível extremo, com só o que o lugar da pessoa sabe; nada de papel alheio.
  - O que pensavam de você: só das IAs que não sabiam o seu papel (as do seu time sabiam, e a conta delas seria 0 ou 100%). Uma linha pequena por IA, do começo ao fim, em vez de um gráfico com 9 cores.
  - Velocidade: lenta 2,4 s, normal 1,2 s (como antes), rápida 0,5 s. Ver o próprio papel continua na hora.
  - Anotações no lugar certo (27/10/2026, "as anotações têm que aparecer do lado da mesa de jogo, senão fica muito perdido … eu tenho que scrollar a tela toda hora"): o caderno passou para dentro da lista de jogadores, cada anotação na linha do jogador, e a lista subiu para logo abaixo da fase da vez, acima do tabuleiro. Depois ("não daria pra anotação ser uma tab collapsable?"): o caderno abre e fecha num botão "Anotar"; fechado, cada jogador marcado mostra só a etiqueta (Libs, Cults, Coms) e o que se sabe de certeza; o app lembra se ficou aberto.
- **Balanceamento conferido (27/10/2026, `node scripts/ai_bench.mjs 300`):** com a conversa, a mesa no mesmo nível dá vitórias liberais de 47%, 46%, 46% e 47% (erro de cerca de 3 pontos); "você" (uma IA média num lugar) vence como liberal 49%, 51%, 47% e 47%, e como cultista 57%, 51%, 46% e 42%.
- **Não sei:** se as falas soam naturais numa partida inteira; se as dicas deixam o treino fácil demais (por isso vêm desligadas).

## D14. Painel lateral de anotações, desconfiança ao vivo, "undefined"

- **Contexto (27/10/2026):** "ainda fica aparecendo uns undefined nas ações dos jogadores"; "quero também um ao vivo do desconfiança rate que possa ser ligado e desligado, e a aba de anotações não ficou lateral como eu pedi".
- **Decisão:** requisitos 27 e 32 do `CLAUDE.md`.
- **O "undefined":** reproduzido em 7 de 12 partidas jogadas pela tela. Era a tela "Vez da IA" na hora em que uma IA ia falar (conversa da D13): não havia texto para essa ação. A conversa e as falas sobre a mão agora acontecem ao lado da fase, sem trocar a tela, e o e2e confere a cada passo da partida contra a IA que nada na tela diz "undefined" ou "NaN".
- **Interpretações que precisaram ser feitas:**
  - "Lateral": uma aba vertical na borda direita da tela que abre um painel deslizante por cima do jogo, e fecha pela mesma aba. Num celular não cabe um painel fixo ao lado de uma coluna de 393 px; em tela de 1400 px ou mais, o painel fica aberto ao lado do jogo.
  - Desconfiança ao vivo: uma barra por IA na lista de jogadores, ligada e desligada por um botão na própria lista, e desligada de início. A IA que sabe o seu papel mostra a conta que faria se não soubesse. Mostrar 0% ou 100%, ou esconder a barra só das que sabem, entregaria os cultistas para um liberal.
- **Não sei:** se a barra ao vivo deixa o jogo fácil demais (ela vem desligada); como fica o painel no Safari do iPhone.

## D15. O ponto crucial

- **Contexto (27/10/2026):** "no caso de eu ser o líder ou cultista mostre o ponto crucial da decisão que fez desconfiança subir".
- **Decisão:** requisito 33 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - "Ponto crucial" é o acontecimento (lei, veto, caos, investigação, eliminação) depois do qual a desconfiança média das IAs sobre a pessoa mais subiu. As falas sobre a mão contam junto com o governo delas.
  - Aparece no fim (com as IAs que não sabiam o papel, como o gráfico) e ao vivo, junto da desconfiança ao vivo. A versão ao vivo usa a mesma conta das barras, em que quem sabe o papel conta como se não soubesse, para não entregar ninguém.
  - Às vezes o ponto crucial não é uma jogada da pessoa: um governo dos outros que sai limpo faz a desconfiança sobrar para quem não se mostrou. O cartão diz isso.
  - Só para quem é do lado escondido, como foi pedido.
- **Não sei:** se uma frase por momento basta, ou se a pessoa vai querer ver os três maiores.

## D16. O raciocínio das IAs

- **Contexto (27/10/2026):** "Preciso que detalhe mais, entendeu? Como cada IA está pensando para a gente encontrar bugs. Por que que ele estava com mais dúvida de mim? Qual ação que eu fiz que levou ele a fazer isso?"
- **Decisão:** requisito 34 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - É uma ferramenta para achar bug, não uma dica: mostra os papéis, as mãos e as mentiras. Por isso, durante a partida, só abre depois de um aviso, e a escolha fica guardada (`S.debug`) para não perguntar toda partida. No fim, abre sem aviso.
  - O motivo é escrito por quem decide, no momento da decisão (`decideWhy` em `src/core/ai.ts`), com as contas que ela de fato usou, em vez de ser adivinhado depois. Escrever não muda a decisão: 120 partidas só de IA com as mesmas sementes saíram iguais antes e depois.
  - "Qual ação levou a isso" é a trilha (`trail`): a conta da IA sobre um jogador no começo e depois de cada lei, veto, caos, investigação, espiada e eliminação, com antes e depois. As IAs não usam os votos nem a conversa nas contas, então esses não aparecem como momento.
  - O que a IA pensa de verdade, não a conta "como se não soubesse" da desconfiança ao vivo: um cultista mostra 0% e 100% para quem conhece.
  - Numa mesa com IA, com uma pessoa ou mais, a aba fica na borda esquerda (as anotações ficam na direita), e nunca fica aberta sozinha em tela larga.
- **Não sei:** se o painel em tela de celular, com textos longos, fica legível o bastante para caçar bug; e se alguém vai querer exportar isso em arquivo.

## D17. A tela da partida não esconde a jogada

- **Contexto (27/10/2026):** "dá pra melhorar a usabilidade? UI/UX?". Joguei uma partida contra a IA em 393 px e propus 9 pontos; o pedido foi "quero que priorize os de 1 a 4".
- **Decisão:** requisito 35 do `CLAUDE.md`. Os quatro: as abas laterais cobriam o texto e os botões; a fase da vez ficava abaixo das dicas; o Ja! parecia desativado (texto creme sobre azul-claro no tema escuro, contraste perto de 1,5:1); as animações caíam em cima do que se lia.
- **Interpretações que precisaram ser feitas:**
  - As duas abas viraram uma barra fixa embaixo, com espaço reservado no fim da página. Qualquer aba presa na borda cobriria alguma coisa numa tela de 393 px.
  - Só um painel aberto por vez, porque no celular um cobriria o outro. Em tela larga as anotações continuam fixas ao lado, como antes.
  - O carimbo da votação e o anúncio da lei ficaram menores e vão para a faixa de quem governa, logo abaixo do topo. É o que menos atrapalha por 1 ou 2 segundos.
  - Os avisos curtos ("Herbert indicou Lu") ficam no espaço da barra de baixo, por cima dos botões dela, e deixam o toque passar.
  - O texto sobre as cores cheias de partido (votos, papéis, tabuleiro) passou a seguir o tema: escuro no tema escuro, claro no claro.
- **Não sei:** se cobrir os botões da barra por 3,5 s com o aviso incomoda no uso real. Os itens 5 a 9 da lista (mesa no topo, tela inicial mais curta, botão de começar, "?" maior, fim de jogo em abas) ficaram para depois.

## D18. Menos rolagem

- **Contexto (27/10/2026):** "faz os itens de 5 a 9", os pontos que ficaram de fora da D17: a mesa no topo, a tela inicial mais curta, o botão de começar, o "?" maior e o fim de jogo em abas.
- **Decisão:** requisito 36 do `CLAUDE.md`, e os requisitos 15 e 16 ajustados.
- **Interpretações que precisaram ser feitas:**
  - "Mesa no topo" é uma faixa compacta, sem toque, com os nomes na ordem de assento. A lista completa (marcas, barras da desconfiança ao vivo) continua mais abaixo, porque é ali que se mexe.
  - Na faixa, a cor vem do que a pessoa sabe (com borda) ou marcou no caderno (só a barra lateral): as duas coisas que ela consultaria rolando.
  - "Mais opções" e "Como joga" abrem por botão do próprio app, e não por `<details>`: a tela é repintada a cada jogada e um `<details>` fecharia sozinho. Não ficam guardados, e o app abre sempre com os dois fechados.
  - Botão desativado (começar sem gente bastante, descartar sem escolher a carta) passou a ser tracejado e apagado, em vez do vermelho apagado que parecia erro.
  - Abas do fim: Resultado, Resumo, Registro. O raciocínio das IAs continua na barra de baixo.
- **Não sei:** se a faixa de lugares, com 9 ou 10 pessoas, ocupa linhas demais no celular; com 7 são três linhas.

## D19. Jogadas boas e ruins no fim

- **Contexto (27/10/2026):** "no final quero que me sugira quais jogadas foram boas e ruins dependendo se o modo assist tiver on".
- **Decisão:** requisito 37 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - "Dependendo se o modo assist tiver on" quer dizer que aparece só com a assistência ligada. Com ela desligada, a aba Resultado mostra um botão que a liga.
  - Vale para cada pessoa na mesa, não só quando se joga sozinho. No fim os papéis já estão abertos para todos.
  - Uma jogada é julgada de dois jeitos juntos: pelo que deu e pelo que dava para saber na hora. Para "o que dava para saber", uso as contas do nível extremo, feitas só com o que aquele lugar sabia. Uma indicação, um voto, uma eliminação ou uma eleição especial que deu errado só conta como ruim se, pelas contas, havia opção claramente melhor (10 pontos de diferença na indicação, eliminação e eleição especial; 3 pontos acima do risco de um par qualquer no voto). Assim o primeiro voto, às cegas, nunca é chamado de ruim.
  - O liberal é julgado pelas leis (jogar fora uma liberal pesa 3), pelas mentiras e por onde pôs a confiança. O lado escondido é julgado por empurrar lei do time sem a mesa perceber: se a desconfiança da mesa sobre ele subiu 15 pontos ou mais, a lei sai como jogada ruim. Também conta a história que não fechou e cobrir ou entregar aliado.
  - Peso para ordenar: eliminar o Líder ou eleger o Líder na zona vale 5, jogar fora uma liberal vale 3, e os votos certos valem 0,5 ou 1. Aparecem 4 de cada lado, e "Ver todas" mostra o resto.
- **Não sei:** se os pesos batem com o que um jogador experiente chamaria de jogada boa ou ruim. Também não sei se o lado escondido deveria ser julgado pelo voto.

## D20. Mesa menor num toque; virar o celular não fecha mais o segredo sozinho

- **Contexto (27/10/2026):** "Não tem como diminuir a quantidade de pessoas da mesa de uma forma rápida. E deveria ter como. Tirar essa regra que o celular tem que estar virado para baixo para ele mostrar a carta. Isso às vezes é muito chato quando eu estou deitado e ele não pega bem esse sensor. Ou isso pode ser simplesmente desativado."
- **Decisão:** requisitos 13 e 18 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - "Completar a mesa até" virou "Lugares na mesa". Escolher um número menor tira as últimas IAs da lista. Pessoa nunca sai por esse caminho: se houver mais pessoas que o número escolhido, a mensagem pede para tirar alguém pelo ×. O número atual aparece marcado. "Limpar a mesa" tira todo mundo, com dois toques.
  - O sensor fecha o segredo quando o celular fica de tela para baixo. Deitado, segurando o celular acima do rosto, ele fica nessa mesma posição. Das duas opções do pedido, escolhi deixar desligado de início, com um botão para ligar no cartão "Aparência". Sair do app continua fechando o segredo, porque isso não engana.
- **Não sei:** se alguém vai querer o sensor ligado. Se ninguém quiser, dá para tirar de vez.

## D21. Dá tempo de ler o que o governo disse

- **Contexto (27/10/2026):** "a animacao do claim de votacao ta mt rapida, mal dá tempo de ler o que o presidente e o chaceler disseram que receberam".
- **Decisão:** requisito 31 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:** fiz duas coisas. Depois que uma IA diz à mesa o que recebeu, investigou ou espiou, a próxima jogada espera mais (`CLAIM_HOLD`). E o que o último governo, ou a última investigação, disse fica escrito numa linha abaixo da faixa da mesa até o próximo. Assim não depende de pegar o aviso passando.
- **Dois bugs no mesmo assunto (27/10/2026):** "aparece pra ver a carta de um jogador IA, fora que a telinha de acao fica tremendo pq toda hora eh sobrescrita por eventos enquanto o presidas vota".
  - Enquanto uma IA falava da própria mão, a tela mostrava a fase pelo lado de quem joga, e quando a fase era de um segredo da IA aparecia o portão "Sou X, mostrar". Agora a fase de uma IA mostra sempre a IA decidindo.
  - A cada fala ou conversa de IA, a fase entrava de novo, deslizando, e um segredo aberto ou um voto meio contado se perdia. A tela só considera que a fase mudou quando o jogo anda de verdade (governo, rejeição, poder, eleição), não com o que se diz ao lado.
- **Não sei:** se os 2,5 s a mais no normal bastam para quem lê devagar. A velocidade "lenta" dá 4 s.

## D22. IA sem metajogo, mas não ingênua

- **Contexto (27/10/2026):** um liberal que testou o chanceler (passou 1 cultista e 1 liberal tendo tirado 2 liberais, e contou) virou 100% cultista para a IA. Depois: "da mesma forma se fosse cultista e usasse o falso descarte pra testar o chanceler [...] isso precisa ser balanceado corretamente, veja todos os casos"; "a IA n pode ter metajogo mas tbm n pode ser ingenua [...] eu sendo lider posso aprovar lei liberal no inicio para disfarçar e esse cenário uma IA deve saber que existe no nivel adequado de dificuldade"; "varra a logica da IA buscando por incongruencias desse tipo".
- **Decisão:** requisito 18 do `CLAUDE.md`. O que a IA não sabia, em todos os níveis ou só nos de baixo:
  1. **Uma jogada virava certeza.** O liberal nunca jogava fora uma liberal, nunca errava a lei e nunca errava a fala. Agora há sempre uma margem (`SLIP_GUESS`, 3%), em todos os níveis.
  2. **Teste do chanceler.** Com 1 cultista e 2 liberais, o liberal pode passar uma de cada para ver o que o chanceler aprova, e conta a verdade. A IA calcula isso em todos os níveis (`TEST_GUESS`: 15% no difícil e no extremo, metade nos de baixo). Os liberais do difícil e do extremo testam quando têm dúvida sobre o chanceler, antes da zona do Líder (`test` em `AI`). Um cultista pode se esconder atrás do "teste": os do difícil e do extremo contam a verdade, metade das vezes, quando o chanceler aprovou a liberal. O treinador chama de teste, não de "história que não fecha". A revisão do fim julga o teste pelo que custou e pelo que mostrou.
  3. **Líder se disfarçando.** Antes da 3ª lei cultista, o Líder deixa passar liberal, e o time passa liberal para ele aprovar. O difícil e o extremo sabem disso (`BOSS_CLEAN`, 60%); fácil e médio o tratam como qualquer cultista.
  4. **A espiada não era conferida.** No difícil e no extremo, o que alguém disse ter espiado vira a mão que o presidente seguinte tem de ter, nos mundos em que quem espiou é liberal.
  5. **Os votos eram ignorados.** No extremo, o cultista que sabe que há aliado no governo vota Ja! (`ALLY_JA`, 80%), contra 60% de qualquer outro (`ANY_JA`).
  6. **Indicação, eliminação e eleição especial não diziam nada.** No difícil e no extremo, o presidente cultista que conhece o time indica um aliado uma vez e meia mais que o acaso (`ALLY_PICK`); e os cultistas desses níveis, sabendo disso, indicam aliado menos (35% contra 60%). No difícil e no extremo, um cultista que conhece o time quase nunca elimina um aliado e prefere dar a presidência a um.
  7. **A IA muito desconfiada rejeitava qualquer governo.** O temperamento tirava até 15 pontos da folga e a deixava abaixo de zero, então nem um governo comum passava. A folga agora nunca é menor que zero.
- **Interpretações que precisaram ser feitas:** fácil e médio continuam mais ingênuos de propósito, porque é isso que separa os níveis. Mesmo assim, em nenhum nível uma jogada sozinha prova o papel de alguém. A conversa das IAs continua fora das contas (D13).
- **Para o balanceamento não pender:** os cultistas também se adaptam. No extremo, com a mesa já desconfiando do aliado, votam como um liberal votaria 80% das vezes, e a leitura dos votos ficou mais fraca (`ALLY_JA` 80%). No difícil e no extremo indicam aliado menos (35%). No fácil mentem mais (`act` 0,4). A IA muito desconfiada não rejeita mais todo governo, e isso tinha dado 5 pontos aos liberais no fácil.
- **Medido (27/10/2026, `node scripts/ai_bench.mjs 200`):** com a mesa no mesmo nível, os liberais vencem 54% no fácil, 52% no médio, 55% no difícil e 52% no extremo (erro de cerca de 3,5 pontos; antes eram 47%, 46%, 46% e 47%). "Você" (uma IA média num lugar) vence como liberal 48%, 54%, 46% e 49%, e como cultista 60%, 53%, 41% e 41%.
- **Não sei:** se 15% de teste e 60% de disfarce do Líder batem com mesas de pessoas de verdade. Medi só contra as próprias IAs. As partidas exportadas (quando houver) servem para conferir isso.

## D23. Partidas guardadas no aparelho, para exportar

- **Contexto (27/10/2026):** "pq n vc n coleta metricas dos meus jogos, pra ir refinando a logica conforme eu vou jogando e treinando a IA?" Escolhido entre as opções: "guardando as partidas no celular com o botão de exportar". E: "esse projeto n precisa de servidor, eh desnecessario".
- **Decisão:** requisito 38 do `CLAUDE.md`. Isso muda o escopo: antes, histórico de partidas ficava de fora. Agora as partidas terminadas são guardadas, mas só para exportar, sem tela de histórico.
- **Interpretações que precisaram ser feitas:**
  - Fica guardada a partida inteira, inclusive o raciocínio das IAs, porque é com ele que se vê onde a IA errou sobre a pessoa. A chave é separada da do app (`secretcultist.history.v1`), para uma lista longa não deixar cada jogada mais lenta de salvar.
  - O limite é de 30 partidas, umas 2 a 3 MB. Se faltar espaço, as mais antigas saem primeiro. Partida encerrada no meio não é guardada.
  - Para exportar, uso o compartilhar do celular quando ele aceita arquivo, porque é o caminho mais curto até mandar o arquivo numa conversa. Quando não aceita, o arquivo é baixado.
  - Os dados servem para calibrar as taxas que as IAs supõem (teste do chanceler, disfarce do Líder, mentiras, votos) pelo que pessoas fazem de verdade. As IAs não aprendem o estilo de uma pessoa: isso seria metajogo (D10).
- **Não sei:** como o Safari do iPhone se comporta ao compartilhar um `.json`. Não testei num iPhone.

## D24. Nomes e bichos por continente

- **Contexto (27/10/2026):** o pedido foi escolher os nomes por continente, com figuras conhecidas de cada um, e mudar a arte pelos bichos de cada lugar ("leao pra africa? onça para americas"), com bicho próprio também para o lado escondido e para o líder, e a Oceania.
- **Decisão:** requisito 22 do `CLAUDE.md` e a parte de desenhos da Interface. Os bichos foram escolhidos com a pessoa, papel a papel, com prévia aprovada.
- **Interpretações que precisaram ser feitas:**
  - O continente vale para a partida inteira (`Game.region`): nomes das IAs e desenhos. São seis opções: Mundo (o de antes), Américas, Europa, Ásia, África e Oceania. Cada uma tem 12 nomes por tema, os dois lados misturados. A exceção é a Oceania, que usa os nomes do mundo, porque de lá quase não há cultistas e vermelhos conhecidos (o resto seria gente viva de golpe em Fiji).
  - As listas de nomes de cada continente seguem os pedidos da pessoa, e ficam na expansão (D100). O cartão diz que o nome é só apelido de jogo e que o papel é sorteado.
  - Ficaram fora dos vilões a águia (símbolo do Reich) e o gorila na África (macaco representando o continente africano é imagem racista, em qualquer papel). Rato e panda entraram a pedido: o rato é o próprio Líder, e o panda de cachimbo é sátira de governo.
  - Cada bicho veste a farda do papel, para o papel continuar reconhecível pela roupa: o liberal de azul, o cultista de marrom, o Líder de casaco no púlpito, o vermelho de túnica vermelha, o Líder Vermelho de túnica cáqui com cachimbo.
- **Não sei:** se o casuar e o ornitorrinco são reconhecíveis para quem não conhece os bichos. O Líder da Ásia começou escorpião e virou aranha, escolhida entre três prévias (vespa-mandarina, tubarão, aranha).

## D25. Galeria com todos os desenhos

- **Contexto (27/10/2026):** "quero uma opcao pra ver todas aas artes dentro do site".
- **Decisão:** requisito 22 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:** a galeria abre pelo cartão "Tema do jogo", que é onde se escolhe o continente, e ocupa a tela inicial até tocar em "Voltar". Mostra, por continente e por tema, o liberal, o membro do lado escondido e o líder, cada um com o nome do bicho. O liberal aparece nos dois temas porque é o mesmo desenho. Não abre durante uma partida.
- **Não sei:** se vale mostrar também os símbolos das leis (balança, caveira, estrela).

## D26. Denunciar à mesa, e IAs com personalidade

- **Contexto (28/10/2026):** numa partida contra a IA, o liberal votou Nein! duas vezes no mesmo governo, mas dois liberais da IA votaram Ja! e elegeram o líder chanceler. Pedido: poder alertar a mesa sobre suspeitos; "na aba de anotacao bota um botao denunciar, que poderia ser unitario ou um compartilhar tudo q sei da mesa"; as falas de todos contam, "porem uma acusacao [baseada] pesa o dobro, entao a IA deve buscar na Ata do jogo como se fosse um humano lembrando do q ocorreu"; "preciso ver como cada um reage"; perfis de IA diferentes.
- **Decisão:** requisitos 18, 27 e 28 do `CLAUDE.md`. Isto muda a D13: a fala deixa de ser só para as pessoas.
- **Interpretações que precisaram ser feitas:**
  - Denunciar é a mesma fala das IAs ("Desconfio de X"). Quem está marcado liberal no caderno é abonado ("Confio em X"). "Contar tudo" fala de cada um que está marcado ou que a pessoa sabe de certeza, inclusive o próprio time, se ela for cultista: a escolha é dela. Cada pessoa fala uma vez por rodada de cada jogador, para não virar spam. A fala da pessoa não tira a vez de uma IA falar.
  - Como a fala pesa: cada divisão de papéis é pesada pela chance de quem falou, no lado dele nessa divisão, dizer aquilo. O liberal aponta para o lado errado só por engano (`SLIP_TALK`); o cultista aponta para o lado errado `TALK_LIE` das vezes. O peso fica elevado a `TALK_W`, o que dá pouco. "Baseada" virou "a ata confirma" (`backed`): o acusado esteve num governo que aprovou lei cultista ou cuja história não fechou, ou o abonado esteve num que aprovou liberal com a história fechando. Aí o expoente dobra. A ata só conta até onde aquela IA lembra (a memória do nível).
  - As reações (concorda, não sabe, discorda) são palavras, sem peso nas contas, para uma reação não puxar a outra em cascata. O liberal reage pelo que acha depois de ouvir. O cultista reage pelo time: concorda quando isso leva a mesa para o lado errado e defende o aliado, mas o blefador às vezes entrega um aliado para parecer limpo.
  - Personalidades, de "lawful good" a "chaotic evil": certinho, desconfiado, cético, crítico, centrado, blefador e caótico. São sorteadas a cada partida, todas diferentes enquanto houver. Elas aparecem para a pessoa no caderno e no raciocínio, porque numa mesa de verdade se conhece o jeito dos amigos, e o jeito não diz nada do papel. O temperamento sorteado de antes continua, mas agora mexe pouco em volta do que a personalidade dá.
  - O resumo do fim repetia a linha "Você votou Nein! em Trujillo + Alfonsín" quando o mesmo par era votado duas vezes. O voto que perdeu o jogo agora diz quem votou Ja!.
- **Medido (28/10/2026, `node scripts/ai_bench.mjs 200`):** com as falas pesando e as personalidades sorteadas, e a mesa toda no mesmo nível, os liberais vencem 54% (fácil), 53% (médio), 52% (difícil) e 51% (extremo). As partidas são só de IA, então ninguém denuncia nelas.
- **Não sei:** se as personalidades ficam reconhecíveis jogando. Também não sei se a pessoa vai querer que as reações pesem nas contas.

## D27. DLC Brasil, com senha

- **Contexto (28/10/2026):** a pessoa pediu uma expansão Brasil liberada por senha (`unlockresenha`), com nomes de políticos brasileiros que ela listou.
- **Decisão:** requisito 22 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - A senha fica escrita no código (`DLC_KEY`), como pedido. Quem olhar o código acha a senha; é piada entre amigos, não cadeado. Liberada uma vez, fica liberada no aparelho (`S.dlc`).
  - "Brasil" entra como mais uma opção de nomes, ao lado dos continentes, com bichos próprios pedidos pela pessoa (tucano, bezerro, boi, onça e polvo), no mesmo traço e com a farda de cada papel. A onça deixou de ser liberal em qualquer lugar: o liberal das Américas virou o condor.
  - Como nos outros continentes (D24), os nomes vão misturados e o papel é sorteado. O app não diz em lugar nenhum de que lado alguém está: a divisão que a pessoa mandou só decide em qual tema cada nome entra. Assim o app não rotula ninguém.
  - Os nomes ficaram curtos, como na mesa.
- **Confirmado (28/10/2026):** a grafia de um dos nomes foi conferida com a pessoa.

## D28. Sem o painel de raciocínio; acerto das anotações no fim

- **Contexto (28/10/2026):** "o racicinio das IAs pode remover, faltou um indicativo de quantos papeis eu deduzi certo baseando nas minhas anotacoes, ai pode contar como boas jogadas no fim do jogo". Antes, a pessoa tinha pedido: "queria dps ver qnts das minhas anotacoes deram match com os papeis reais". E sobre o caderno: "quebrou o layout, poderia ter só o emoji, e faltou o compartilhar tudo que sei ou denunciar todos (que vc resume em denunciar inimigos)".
- **Decisão:** requisitos 27, 34 e 37 do `CLAUDE.md`. Isto desfaz o painel da D16.
- **Interpretações que precisaram ser feitas:**
  - Saiu só o painel da tela. O motivo de cada decisão continua gravado em `Game.trace` e vai no arquivo exportado, porque serve para calibrar a IA (D23). O `S.debug` antigo é descartado ao ler.
  - O caderno vai com a partida no fim (`Game.notes`). O acerto conta só o que foi deduzido: o time que a pessoa já conhecia e o que as investigações dela mostraram ficam de fora. Cada acerto entra nas jogadas boas, com peso 1. O erro não conta como jogada ruim, porque marcar é anotar e não jogar.
  - No caderno, os botões viraram só emoji (📣 denuncia, 👍 abona quem está marcado liberal). "Contar tudo" virou "Denunciar inimigos": acusa de uma vez todos do outro lado, que são os marcados do lado oposto ao da pessoa, ou, para quem conhece o time, todos fora dele.
- **Não sei:** se vale contar erro no caderno como jogada ruim.

## D29. Votos na língua do continente e cartas com as cores dele

- **Contexto (28/10/2026):** "os idiomas de votacao tem refletir nas regioes dos lideres sabe, e se puder dar uma estilizada regional nas cartas ficaria massa".
- **Decisão:** requisito 22 do `CLAUDE.md`.
- **Interpretações que precisaram ser feitas:**
  - O voto segue a língua de cada continente. Mundo e Europa ficam com os votos do tema. As Américas votam em espanhol, o Brasil em português, a Ásia em japonês (chinês no tema vermelho), a África em suaíli e a Oceania em inglês.
  - "Estilizada regional" virou uma faixa com as cores do continente: no pé de cada cartão, mais larga no pé dos botões de voto (era o que a pessoa queria: "eu queria isso nas cartas de votacao", "e se possivel nas leis") e no alto e no pé de cada lei, com as cores do continente: verde, amarelo e azul no Brasil; o padrão andino nas Américas; azul e dourado na Europa; vermelho e dourado na Ásia; o kente na África; azul do mar e areia na Oceania. No Mundo não há faixa.
- **Não sei:** se a pessoa queria algo mais forte que a faixa, como trocar a fonte ou o fundo por continente.

## D31. Reações que brotam do fundo e o caderno de volta

- **Contexto (29/10/2026):** "as reacoes positivas ou negativas aparecam como likes ou deslikes brotando do fundo da tela"; "quero q volte ao q era antes o menu de anotacoes mas verificando se o tamanho dos botoes de anotacao e denuncia nao quebram no layout do iphone"; "esse motivo e fatos do bloco de anotacoes ficou mt ruim".
- **Decisão:** cada IA que reage a um claim solta um 👍 (concorda), 👎 (discorda) ou 🤷 (não sabe) que sobe do pé da tela; com "reduzir movimento", nada sobe. O caderno volta a ser uma linha por jogador, com o nome à esquerda e as colunas Libs e Cults com 🗒️ e 📣, em botões de 40 px para caber ao lado do nome em 393 px. O "Motivo e fatos" sai da tela; o que já estava gravado continua sendo lido.
- **Não sei:** se 40 px basta no dedo; a recomendação da Apple é 44.

## D32. Desconfiômetro

- **Contexto (29/10/2026):** "podia ter um desconfiometro tipo guitar hero tipo medido de oleo de carro"; "prefiro ponteiro de oleo".
- **Decisão:** com uma pessoa só na mesa e a opção ligada em "Mais opções" (`S.gauge`, desligada de início), um ponteiro de 0 a 100 logo abaixo da faixa da mesa mostra a média de quanto as IAs desconfiam da pessoa agora (a mesma conta da desconfiança ao vivo), com verde, amarelo e vermelho e as palavras "tranquilo", "de olho" e "na mira". O ponteiro gira do valor anterior para o novo.

## D35. Partida rápida e nomes revisados

- **Contexto (30/10/2026):** "quero uma opcao de quick game, com um jogo de 7 integrantes, e cenario aleatorio no dificil sem assistencia"; "o botao de quick game pode ficar no botao atual jogar agora"; "o botao mudar a mesa poderia ser voltar ao inicio". E a revisão dos nomes: só nomes conhecidos no Brasil, republicanos e democratas nas Américas, sem o Polvo.
- **Decisão:** "Jogar agora", no topo da tela inicial, monta uma partida de 7 lugares (a pessoa e 6 IAs no difícil), com tema e continente sorteados (o Brasil só com a DLC liberada), sem mexer na mesa montada à mão. Começa com a assistência desligada. No fim, "Mudar a mesa" virou "Voltar ao início". As listas de nomes foram revisadas com a pessoa, nome a nome; os nomes da expansão só aparecem com ela.
- **Não sei:** se a assistência deve voltar sozinha depois da partida rápida; hoje ela fica desligada até a pessoa ligar de novo.

## D38. Eliminação e investigação com mais peso

- **Contexto (30/10/2026):** "tem como melhorar a animacao de eliminacao e investigacao?" e a proposta aceita.
- **Decisão:** na eliminação, a tela escurece, o nome aparece grande, "ELIMINADO" é carimbado e uma carta diz se era o líder escondido ("Não era o Líder" ou "Era o Líder!"), que é o que a regra deixa a mesa saber; a tela treme uma vez, porque o iPhone não deixa a página vibrar. Na investigação, uma pasta "Confidencial" com o nome do investigado se abre, a lupa passa e o partido é carimbado na carta. Com "reduzir movimento", nada disso se mexe.
## D39. Tribunal: acusar com prova e "CONTRADIÇÃO!"

- **Contexto (30/10/2026):** "toda vez q acusar alguem ter uma mecanica parecida com la noire e ace atorney"; "contradicao"; prévias aprovadas (prova e tom à esquerda; tela com a prova, a fala e a rosca com os nomes, sem rostos, que entregariam o papel).
- **Decisão:** o 📣 de acusar abre o tribunal: o que a ata tem contra a pessoa (`evidence`: governo cuja conta não fecha, governo que aprovou lei do lado escondido, voto Ja! nesse governo) e o tom (Desconfio, Acuso, Tenho prova). Prova de governo segura (`hit`) vira "CONTRADIÇÃO!" na tela inteira, o acusado se enrola, e a acusação pesa o dobro para as IAs. Acusar firme, ou com prova, sem nada que segure na ata custa credibilidade a quem acusou (conta como contradição dele). O voto Ja! é só indício: não segura sozinho. Abonar (👍, "é liberal") continua direto.
- **Não sei:** se acusar com "Desconfio" deveria pesar menos que hoje; hoje pesa como antes.

## D40. As IAs usam o tribunal; defesa; o Líder de cada personalidade

- **Contexto (30/10/2026):** "Faz o 2,3,4 da IA": cultista (e qualquer IA) que usa o tribunal, defesa no tribunal, Líder com estilo próprio.
- **Decisão:** a IA que acusa alguém com uma prova que segura na ata faz isso como acusação de tribunal (pesa o dobro); o cultista sem prova forte contra um liberal pode exibir um indício fraco como prova (blefe que custa credibilidade se a mesa conferir). Quando acusam a pessoa, ela responde: "O baralho veio assim", "Foi teste do chanceler", "Está mentindo" ou fica calada; a resposta é conferida com a ata, e a que bate tira o peso da acusação. Quando a IA aponta uma prova que bate contra a pessoa, aparece o mesmo "CONTRADIÇÃO!". O Líder de cada personalidade joga diferente (`BOSS_STYLE`): o certinho se esconde mais, o blefador e o caótico arriscam cedo.
- **Não sei:** o equilíbrio com isso não foi medido com o `ai_bench`.

## D41. Conquistas e compartilhar o resultado

- **Contexto (30/10/2026):** "Do ui/ux faz a 5 e 6" (compartilhar o resultado, conquistas) e o caderno com nomes desalinhados.
- **Decisão:** no fim, "Sua partida" mostra as conquistas desta partida (`ACHIEVEMENTS`, `achievements`: primeira vitória, líder invisível, caçador, caderno perfeito, CONTRADIÇÃO!, mesa dura, sem rastro) e quantas de todas a pessoa já tem nas partidas guardadas, e um botão "Compartilhar resultado" desenha uma imagem (quem venceu, o papel, o caderno, as conquistas) e manda pelo compartilhar do celular, ou baixa. No caderno, todo nome fica na própria linha, acima das duas colunas, para nomes curtos e longos ficarem iguais.

## D42. Eliminação numa tela só; defesa na tela da acusação

- **Contexto (30/10/2026):** "A animação de eliminação tá estranha, bugada"; "A defesa da acusação precisa melhorar e poderia ser na mesma tela de acusação".
- **Decisão:** a eliminação tinha duas animações ao mesmo tempo (o cartão "Eliminado da mesa" e a tela escura); ficou só a tela escura, sólida e acima de tudo. Quando uma IA acusa a pessoa, abre a tela da acusação ("ACUSAÇÃO!", ou "CONTRADIÇÃO!" se a prova segura) com as respostas ali mesmo, só as que a ata poderia sustentar, cada uma dizendo quando cola; o resultado aparece na mesma tela.

## D43. Reputômetro

- **Contexto (30/10/2026):** "Quero um reputometro para cada integrante da mesa"; "Só a 1" (estrelas na faixa do topo).
- **Decisão:** com a opção ligada em Mais opções (`S.rep`, desligada de início), cada nome vivo da faixa da mesa ganha de 1 a 3 estrelas (`reputation`), contadas só com o que a mesa viu: história que não fechou, acusação firme que a ata não sustentou, mudar de opinião sem fato novo.

## D44. Votação na mesinha

- **Contexto (30/10/2026):** "uma animação melhor para a votação, mostrando uma mesinha e os votos de cada um abrindo"; mockup aprovado.
- **Decisão:** numa mesa com IA, depois da votação a tela mostra uma mesa verde com os lugares em ordem, cada voto virando por vez a partir do presidente, o placar somando no meio e o carimbo "ELEITO!" ou "REJEITADO!" (a mesa fica vermelha se o Líder acabou de ser eleito chanceler na zona de perigo). O ritmo segue a velocidade da IA. A tela fecha sozinha e não segura toque. Com "reduzir movimento", só aparece o carimbo de sempre.

## D45. Animações: a votação não entrega antes, o tiro trinca a tela, acusações no fim

- **Contexto (30/10/2026):** "O som entrega antes do que a animação"; "a eliminação ... deveria ter uma arma atirando, como se fosse a tela trincando"; "falta as minhas acusações repercutirem ali nas minhas jogadas boas".
- **Decisão:** com a mesinha, o carimbo, o som, o anúncio da lei e o fim de jogo só vêm depois da última carta virar; nesse tempo os toques esperam. A mesa entra e sai com transição, e só fica vermelha (Líder eleito na zona de perigo) no fim. Na eliminação, um clarão de tiro, a tela trinca a partir do impacto e depois vêm o nome, o carimbo e a carta; treme a página, não a tela inteira. No fim, as acusações da pessoa e as defesas dela entram nas jogadas boas e ruins, julgadas por quem o acusado era e pelo que a ata sustentava.
- **Já era assim, conferido no código:** as IAs votam sem ver o voto de ninguém (`castVotes` pergunta a cada uma antes de registrar qualquer voto). Uma acusação mexe nas contas das IAs e, por isso, nas votações seguintes (pesa o dobro com prova que segura), enquanto aquela IA lembrar dela.

## D46. Mais animações e efeitos

- **Contexto (30/10/2026):** pedido de uma leva de animações e efeitos para o jogo ter mais clima.
- **Decisão:** a lei aprovada voa até a casa dela no tabuleiro (ou até o placar, se o tabuleiro está fora da tela), gira, cai com um baque e acende o poder da casa; o caos treme a página, derruba a lei do topo girando, pisca "CAOS!" e estoura as três marcas de rejeição; a carta do papel treme antes de virar e os aliados do cultista aparecem um a um; o veto aceito rasga duas cartas de costas; a eleição especial cruza a tela numa faixa e o presidente escolhido usa uma faixa na mesa naquela rodada; no fim, os papéis viram um a um no Resultado, o lado escondido por último, e a vitória pelo Líder chanceler deixa a tela vermelha com o líder gritando; da 3ª lei cultista em diante a borda da tela pulsa em vermelho, mais forte a cada lei (`data-tension`); o papel do pôster ganha um grão de filme bem leve; um chiado de rádio velho bem baixo toca durante a partida, feito na hora, e some na votação (só depois de um toque, e nunca com som desligado); a fase nova entra como página de jornal virando, com a manchete da fase; botões afundam e as leis levantam sob o dedo. Nada disso mostra segredo (o veto rasga cartas de costas; o líder só aparece com o jogo acabado), nenhum efeito segura toque, e com "reduzir movimento" nada se mexe nem espera: fica só a borda (sem pulsar). Os balões de fala das IAs saíram em 2026-10-30: a pessoa achou ruim.

## Pendências

| Pendência | Quem resolve |
|---|---|
| Proteger a `main` exigindo PR e os checks do CI | Dono do repositório |
| Preencher o `CLAUDE.md`: o que é o app, o escopo e os requisitos | Dono do repositório |


## D30 — Prioridade para leis decisivas na IA (2026-10-29)

Pedido: melhorias na IA do jogo. Escopo interpretado: corrigir decisões de fim de partida nos níveis difícil e extremo, que já planejam jogadas. Quando a própria mão permite garantir a lei vencedora ou impedir a lei vencedora adversária, essa decisão vem antes de reputação, blefe e erro aleatório. O chanceler usa o veto disponível para bloquear uma mão que daria vitória ao adversário; o presidente aceita esse veto e recusa vetar duas leis que venceriam para seu lado. A regra usa somente a View, inclusive para o líder sem aliados conhecidos. O veto pode levar ao caos: bloqueia a lei da mão, sem garantir a sobrevivência ao topo do baralho. Fácil e médio mantêm seu comportamento. Não foi medida melhora da taxa de vitórias.

## D31 — Dedução estável e estratégia da IA (2026-10-29)

Pedido: ampliar as melhorias da IA antes de trabalhar em outros pontos. Mantemos os quatro níveis e as personalidades, sem rede nem modelo de linguagem no jogo. A dedução usa logaritmos para evitar perder evidências por arredondamento em históricos longos; regras públicas e investigações privadas delimitam os mundos possíveis antes das hipóteses comportamentais. A IA não esquece que um chanceler que chegou à sessão legislativa na zona do líder não pode ser o líder. Uma fala repetida da mesma pessoa sobre o mesmo alvo e lado conta uma vez na janela de memória, para não virar prova por repetição.

Nos níveis que planejam, vitórias certas por eleição têm prioridade sobre erros aleatórios; cultistas não eliminam o líder conhecido se existe outro alvo. O presidente liberal reavalia o risco do chanceler mesmo quando participa do governo. O líder usa os aliados que descobriu investigando para indicar, votar, convocar e eliminar. Uma espiada privada ainda válida orienta o voto quando o caos decidiria a partida; espiadas consumidas ou declarações de terceiros não dão acesso ao topo. O presidente preserva até uma única lei vencedora para dar ao chanceler a chance de aprová-la. Simulações de reputação do chanceler deixam a compra presidencial desconhecida, em vez de inventar duas leis cultistas. Um cache dura apenas uma decisão e reaproveita crenças da mesma View sem guardar conhecimento entre jogadores.

A ferramenta `scripts/ai_compare.mjs` confronta a IA anterior e a atual no mesmo nível, alternando lados nas mesmas sementes e mesas de 5 a 10. Em 60 partidas por lado e nível, 480 no total, nenhuma travou. Vitórias da versão nova: fácil 36/60 como liberal e 25/60 como cultista; médio 37/60 e 27/60; difícil 31/60 e 30/60; extremo 35/60 e 32/60. Os intervalos de 95% por lado incluem 50%: esta amostra valida a execução e dá uma referência, sem demonstrar superioridade universal. Baseline: `58bf7c6dd29975f83ca946d717989d11bc8f8367`, antes de D30. As medições ficaram em `/workspace/ai-comparison.jsonl` no ambiente de trabalho.

## D32 — Insistência nas acusações e poderes visíveis (2026-10-29)

Pedido: acusar várias vezes a mesma pessoa não tinha consequência percebida; investigar e eliminar precisavam de animações. Repetição sem um novo governo, veto ou investigação envolvendo o alvo não é evidência independente de culpa. Uma acusação sem apoio na ata, repetida até três vezes além da primeira, pesa contra a credibilidade de quem acusa: multiplica cada hipótese por 1,3 se o acusador for do lado escondido nela, ou 0,85 se liberal, ajustado pela personalidade de quem ouve. O efeito é limitado, não uma prova. As reações cobram explicitamente um fato novo; uma acusação apoiada pela ata não recebe essa penalidade. Eventos relevantes novos reiniciam a contagem. Votos e rejeições sozinhos não limpam a insistência. Os botões mantêm o limite existente de uma fala por alvo por rodada.

Investigação e eliminação recebem um aviso público animado por 1600 ms, na faixa abaixo do cabeçalho, para pessoas e IAs. A investigação usa lupa e nome, sem partido ou retrato secreto. A eliminação usa martelo e risco no nome, sem revelar o papel de quem sai; o fim de jogo continua seguindo as regras. Os avisos não bloqueiam botões nem atrasam as regras e respeitam a preferência de movimento reduzido. A animação antiga de lupa no cartão secreto e o escurecimento da eliminação continuam; o novo aviso torna o poder perceptível antes do resultado secreto e também quando a IA atua.

## D33 — Caderno, memória social e campanhas (2026-10-29)

Pedido autorizado: tornar o caderno útil, a IA social e coerente, os governos atentos à maioria, e o resultado compreensível. Motivos privados por jogador têm até 280 caracteres e são classificados pela pessoa como fato observado ou palpite; essa classificação não confirma papéis. A ata pública aparece separada. Notas não entram na View de bots e acompanham apenas o arquivo da partida encerrada.

A memória social registra acusações, defesas, inversões sem evidência nova e versões públicas incompatíveis. Isso ajusta a credibilidade de quem fala, com efeitos moderados. A IA que planeja evita trocar de versão sem fatos novos e leva em conta o compromisso público de sua própria espiada. Estima a maioria por crenças públicas e opiniões declaradas, sem conhecer votos futuros; avalia também a presidência que virá após rejeitar e restaura a ordem da eleição especial.

Antes de votar há até duas falas de campanha de NPCs vivos, uma por NPC. Elas defendem governos ou pressionam rivais e podem mudar a leitura dos outros bots. Uma pessoa pode votar sem esperar a conversa. Os votos anteriores também viram assunto das falas, sem serem tratados isoladamente como prova de culpa. O resumo final destaca até três momentos registrados e suas consequências, sem inventar um resultado alternativo.

O feedback das acusações resume somente as reações públicas e avisa sobre insistência ou contradição. A linguagem ganhou variantes por personalidade e situação, com seleção determinística pelo histórico: não consome sorte nem altera decisões, e uma fala antiga continua igual depois. Dois testes de turnos foram atualizados porque a campanha passa a anteceder a espera do voto humano; o limite e o retorno à votação são testados.

## D34 — Poderes e acabamento no celular (2026-10-29)

A investigação usa lupa percorrendo o nome, sem mostrar o resultado. Eliminar usa arma estilizada com recuo, clarão e fumaça, sem sangue e sem revelar o papel; som respeita a opção de áudio e movimento reduzido elimina animações. O caderno agrupa ações por jogador, abre motivos sob demanda e preserva editores abertos durante atualizações. Os controles de anotação têm alvo de toque ampliado. O card Sim do Brasil usa somente fundo verde e losango amarelo: sem círculo azul nem faixa branca. A faixa regional das outras cartas permanece conforme o desenho existente.

## D35 — Botões no iPhone, Diário e resumo natural (2026-10-29)

A pessoa confirmou que a denúncia estava funcionando no iPhone: o defeito era visual. Substituímos os emojis dos botões por SVGs de traço único, com caixas fixas de 44 px, alinhamento central e rótulos acessíveis. Cliques em ações fecham o foco do editor antes do repaint, preservando o texto já salvo. A regra de uma fala por alvo na rodada não mudou.

O fim deixa de numerar “Momento 35” e usa títulos sobre os acontecimentos, nomes dos participantes e consequências específicas: o tiro que encerrou o jogo, o governo que tornou a votação perigosa, o voto perdido por um dos lados. A nota genérica sobre resultados alternativos saiu. Os papéis continuam aparecendo apenas no fim, conforme as regras existentes.

As falas completas deixam de virar avisos passageiros. O rodapé mostra um resumo persistente de quem falou sobre quem, com acesso ao Diário. Esse painel público guarda as linhas exatas já registradas em Game.log, incluindo acusações, defesas, respostas e declarações de compras; não regenera falas e não mostra motivos privados do caderno ou resultados secretos. Anotações e Diário são painéis separados, acessíveis no rodapé; abrir um fecha o outro. O Diário abre no final da conversa e preserva a posição durante novas falas, para permitir ler mensagens anteriores.

O teste móvel em tests/iphone.py verifica os dois tipos de botão, área de toque, foco do editor, registro da denúncia, resumo persistente, transcrição pública sem notas privadas e títulos finais. A suíte completa também o executa com Chromium; o mesmo teste aceita WebKit para conferir o motor do Safari.

## D36 — Avisos de reputação (2026-10-29)

A sugestão de crédito social virou reputação na mesa, sem pontuação única. Um aviso curto mostra “Credibilidade caiu” para repetição ou inversão sem fatos novos; “Sua fala ganhou apoio”, “Sua fala encontrou resistência” ou “A mesa está dividida” resumem as reações públicas. O rodapé mantém o aviso junto da última conversa, e o Diário explica a causa. Os avisos não revelam papéis, não inventam uma opinião unânime e não mudam as penalidades moderadas já existentes na IA. A reputação se refere apenas às ações dos jogadores nesta partida.

## D37 — Desconfiômetro unificado (2026-10-30)

- **Contexto (30/10/2026):** havia dois controles para a mesma coisa, a "desconfiança ao vivo" (`S.live`: uma barra por IA, ligada na lista de jogadores) e o "desconfiômetro" (`S.gauge`: o ponteiro de óleo de carro, ligado em "Mais opções"). O pedido: "eu quero isso unificado", ligável e desligável fora e dentro do jogo.
- **Decisão:** uma chave só, `S.gauge`, liga e desliga o medidor inteiro: o ponteiro, a barra de cada IA (na lista de jogadores e na faixa da mesa) e o momento que mais fez a desconfiança subir. Pode ser mudada em "Mais opções" e, com uma pessoa só na mesa, num botão logo abaixo da faixa da mesa durante a partida. Desligado de início. `S.live` deixa de existir: ao ler uma partida guardada com `live`, ele vira `gauge`.
- **Reputômetro (D43), 30/10/2026:** "quero o reputômetro ligável e desligável in game". `S.rep` ganhou o mesmo botão na partida, lado a lado com o do desconfiômetro, logo abaixo da faixa da mesa (vale também com mais de uma pessoa na mesa, porque as estrelas só usam o que a mesa viu). Continua em "Mais opções" e desligado de início. Segue sendo uma chave à parte do desconfiômetro: não foi decidido juntar os dois.

## D47. Sem e2e no tema claro (2026-10-30)

- **Pedido:** o e2e claro só dava problema (passava de 10 min e caía por tempo).
- **Decisão:** sai do CI e do `verify.sh`; fica só o e2e no tema escuro. O teste continua no código e roda à mão com `python3 tests/e2e.py light`. O contraste dos votos no tema claro deixa de ser medido a cada PR.

## D48. Tabuleiro, cartas e registro mais legíveis (2026-10-30)

- **Pedido:** melhorias de interface.
- **Decisão:** cada casa vazia do tabuleiro mostra o ícone e o nome curto do que libera (investiga, espia, eleição, elimina, vitória), e a próxima casa de cada trilha fica marcada; na mão de leis, as que ficam sobem quando uma é escolhida para o lixo, e no celular as cartas ocupam a largura; o registro vira jornal, uma seção por rodada com a indicação como manchete, a mais nova primeiro.

## D49. Faixa do presidente e medalha do chanceler (2026-10-30)

- **Pedido:** o presidente com faixa ficou legal; animação para o chanceler.
- **Decisão:** na faixa da mesa, o presidente da vez sempre usa uma faixa (dourada na eleição especial), que entra deslizando quando a presidência muda; o chanceler eleito ganha uma medalha com a balança, que cai e quica quando é eleito. Só o que a mesa toda já sabe; nada se mexe com "reduzir movimento" nem ao reabrir a partida.

## D51. O lado escondido joga limpo antes da zona do líder (2026-10-31)

- **Pedido:** numa partida, a pessoa (Líder Vermelho, presidente) passou uma vermelho e uma liberal para um aliado chanceler limpar a barra dos dois; a IA aprovou a vermelho e disse que recebeu duas, pondo a culpa no Líder Vermelho. O primeiro plano do lado escondido tem que ser eleger o líder chanceler depois da 3ª lei: antes disso, não se queimar e aproveitar toda chance de parecer liberal, deixando as leis do lado escondido para os liberais aprovarem e serem acusados.
- **Decisão:** antes da 3ª lei do lado escondido, o cultista com escolha deixa passar a liberal com chance por nível (`EARLY_CLEAN`: fácil como antes, médio 10%, difícil 25%, extremo 15%), como presidente ou chanceler, com aliado ou não; com o líder de presidente passando uma de cada, o chanceler aliado que planeja aprova a liberal. O chanceler nunca põe a culpa num presidente aliado: confirma a história dele ou, se o presidente não disse nada (esqueceu ou ficou calado), fica com a culpa, seja o presidente o líder ou outro aliado.

## D52. Critério com o começo do jogo e rigor na zona do líder (2026-10-31)

- **Pedido:** no começo o lado escondido quer parecer liberal e incriminar liberais, então acusação baseada no primeiro governo, nos primeiros governos ou na primeira lei do lado escondido tem que perder força. E depois da 3ª lei, o jeito mais fácil de o lado escondido vencer é o líder chanceler: o liberal tem que vetar quem não tem boa certeza de ser liberal.
- **Decisão:** os primeiros `EARLY_GOVS` (2) governos e o governo da primeira lei do lado escondido não apoiam acusação nem defesa (`backed`) e, no tribunal, viram prova fraca, com a marca "no começo do jogo: prova fraca". Uma história que não fecha continua valendo em qualquer momento. Da 3ª lei do lado escondido em diante, o liberal da IA vota Nein se a chance de o chanceler ser do lado escondido passa de `ZONE_SURE` (fácil sem limite, médio 70%, difícil 60%, extremo 65%).
- **Equilíbrio (2026-10-31, `BENCH_DIAG=1 node scripts/ai_bench.mjs 300`, com D51 e D52):** liberais vencem 49% no fácil, 54% no médio, 58% no difícil e 58% no extremo (a `main` antes: 53%, 54%, 55% e 53%). Os números maiores no começo (80% de jogo limpo, 25% de limite) passavam de 60% no extremo.

## D53. Por que alguém foi eliminado (2026-10-31)

- **Pedido:** mostrar a justificativa de quem eliminou.
- **Decisão:** a IA que elimina diz o porquê, com o que a mesa toda viu (`execReason`): a prova mais forte da ata, uma acusação que ela já tinha feito, ou que era de quem mais desconfiava. A frase entra no registro e aparece na tela da eliminação, embaixo do carimbo. O cultista dá o motivo do mesmo jeito: é público, não o que ela pensa de verdade.

## D54. Acusar com investigação, eliminação e a conta das leis (2026-10-31)

- **Pedido:** poder acusar com base no resultado de uma investigação, numa eliminação e em quantas leis do lado escondido os governos de alguém aprovaram. E a animação da eleição especial estava quebrada.
- **Decisão:** o tribunal ganha três provas novas. "X investigou e disse que é {f}" e "Eliminou Y" são palavras e escolhas que a mesa viu, não fatos (o investigador pode mentir), então apoiam a acusação fraco. "Esteve em N governos que aprovaram lei {f}" vale como prova quando N é 2 ou mais. A faixa da eleição especial cabe na tela (antes saía cortada) e a faixa do presidente fica atrás do nome.

## D55. Suas jogadas na hora de se defender (2026-10-31)

- **Pedido:** ao se defender, ver as próprias jogadas que servem de defesa: qual jogada está sendo acusada, se era presidente ou chanceler, que cartas recebeu, o que passou ou aprovou e o que disse que recebeu.
- **Decisão:** a tela da acusação mostra "Suas jogadas" acima das respostas: primeiro a jogada apontada pela prova (destacada), depois as que falam a favor (governos que aprovaram lei liberal, investigações e o que disse delas), até 4. As mãos são da própria pessoa e só aparecem na tela dela, jogando sozinha com a IA.

## D56. "Mais uma" no fim da partida (2026-10-31)

- **Pedido:** no fim, além de jogar de novo com a mesma mesa e voltar ao início, um botão que faz o mesmo que "Jogar agora", mas com menos chance de repetir o papel e o continente da partida anterior.
- **Decisão:** "▶ Mais uma" monta uma partida rápida (D35). O continente e o papel da pessoa da partida anterior só se repetem `REPEAT_KEEP` (15%) das vezes (`freshPick`; os papéis são sorteados de novo até 4 vezes). As IAs não sabem de nada disso.

## D57. O debate: acusação, réplica, tréplica e veredito (2026-10-31)

- **Pedido:** o menu de acusação e defesa estava travado; mais variedade nas respostas, IA que se defende melhor, réplica e tréplica como num debate, IAs com mais lábia que outras, e as IAs avaliando no fim. Em páginas de caderno folheadas, sem rolar: 3 páginas.
- **Decisão:** jogando sozinho com a IA, toda acusação que envolve a pessoa vira um debate em 3 páginas que se folheiam de lado: 1 a acusação e a primeira resposta do acusado; 2 a réplica de quem acusou e a tréplica do acusado; 3 o veredito da mesa. A cada vez quem fala escolhe entre argumentos montados da ata, cada um com a força que a ata dá (mostrar a mão, apontar a história do outro, o baralho, "foi no começo", o histórico, virar a acusação, cobrar prova, insistir, outra prova, a conta, os votos, recuar, ficar calado). A lábia (`ELOQ`) vem da personalidade, que a mesa conhece: blefador e centrado 3, caótico 1, as outras 2; quem tem mais lábia acha o melhor argumento mais vezes e pesa mais. No veredito, cada IA viva de fora diz se a acusação procede, não procede ou não sabe, pela força dos argumentos, pela lábia, pelo que já achava e pelo temperamento; o lado escondido protege os seus. Se procede, a acusação pesa como prova; se não, cai como uma defesa que colou (D40). O jogo espera enquanto o debate dura.

## D58. A arma na eliminação e o detetive na investigação (2026-10-31)

- **Pedido:** uma arma atirando na eliminação; na investigação, a silhueta de um detetive de sobretudo e chapéu, com a lupa, tirando o nome de um envelope.
- **Decisão:** na eliminação, um revólver entra pela lateral, mira, dispara (clarão), recua e então o vidro trinca e aparece o nome. Na investigação, a silhueta do detetive passa a lupa e um papel com o nome de quem é investigado sai do envelope; o partido continua em segredo. Com "reduzir movimento", nada se mexe.

## D59. O que vem depois do tiro, e o detetive que some (2026-10-31)

- **Pedido:** depois da eliminação, a cena se esvai e fica só se era o Líder ou não; se era, uma animação dos liberais chegando ao poder; se não, uma transição de que o jogo continua. Na investigação, o detetive à Sherlock Holmes (chapéu, sobretudo, cachimbo, envelope) se esvai no fim.
- **Decisão:** o nome, o carimbo e a trinca somem e entra só o veredito: "Era o {boss}!" sobre um amanhecer azul com raios e pássaros subindo, "Os liberais chegam ao poder"; ou "Não era o {boss}", com uma faixa que atravessa a tela, "O jogo continua". O detetive ganha cachimbo com fumaça e se esvai no fim. Com "reduzir movimento", nada se mexe: o veredito aparece embaixo do nome.

## D60. Acusação antes da hora (2026-10-31)

- **Pedido:** uma IA acusou a pessoa no primeiro governo por ter votado num governo que aprovou lei vermelho, outra repetiu a mesma acusação, e a pessoa não teve como responder. Na primeira rodada ninguém sabe quem é quem: dá para acusar, mas o acusado tem que poder desmoralizar quem queimou a largada, e as IAs não devem repetir a acusação dos outros.
- **Decisão:** a IA não usa como prova o que veio dos primeiros governos (`proofEarly`; uma história que não fecha continua valendo sempre). Se outro já acusou o mesmo jogador na rodada, a IA não repete a prova: só diz que concorda. Toda acusação contra a pessoa feita num passo abre o debate, mesmo com duas falas no mesmo passo. No debate, contra uma acusação do começo, o acusado tem "Desmoraliza: queimou a largada", o argumento mais forte (0,75), que derruba a acusação e conta contra a credibilidade de quem acusou.

## D61. Acusação fraca vira contra quem acusa (2026-10-31)

- **Pedido:** acusar por um voto pode, mas com moderação; acusação fraca tem que abrir para um contra-ataque forte e custar reputação, e reputação perdida pesa nas decisões da mesa sobre quem acusou (presidente, chanceler). Mais variedade e equilíbrio nas respostas, para a pessoa e para as IAs.
- **Decisão:** contra uma acusação fraca (só um voto, uma eliminação, uma investigação, ou sem prova que se sustente), o acusado tem "Contra-ataca" (0,65). Um voto só pesa pouco como argumento (0,2; dois ou mais, 0,4). Quem acusa ganhou "Chama a mesa" (quando a maioria concordou) e "Aponta quem ele escolheu" (lei do lado escondido com ele de presidente); o acusado, "Lembra quem confia em você". Se a acusação cai e o melhor argumento de quem acusou foi fraco (menos de 0,4), ela vira contra quem acusou (`backfire`): conta como duas contradições e uma virada na memória social das IAs, o que baixa a reputação (reputômetro) e faz as IAs desconfiarem mais dele nos votos e indicações.

## D62. Votos em cascata (2026-10-31)

- **Pedido:** numa mesa real, o voto de um influencia o do outro: ninguém vota ao mesmo tempo, e quem confia em alguém tende a segui-lo. A pessoa escolheu a cascata completa, com o voto dela incluído (substitui o "as IAs votam sem ver o voto de ninguém" do D45).
- **Decisão:** a mesa vota em ordem, a partir de quem senta depois do presidente. Cada IA ouve os votos de quem votou antes (`View.cast`) e pesa cada um pelo quanto confia em quem votou: Ja! de quem ela confia alarga o que ela aceita, Nein! estreita (`CASCADE_W`, 0,15, vezes a confiança 1 − chance de ser do lado escondido; o cético pesa menos, o certinho mais). O cultista vota pelo próprio plano, como antes. Equilíbrio (`BENCH_DIAG=1 node scripts/ai_bench.mjs 300`): liberais 46%, 55%, 57% e 56% (fácil→extremo; antes 49%, 54%, 58% e 58%).

## D50. Sem o chiado de rádio (2026-10-31)

- **Pedido:** tirar o som do rádio.
- **Decisão:** o chiado de rádio velho do D46 sai. Os outros sons (carimbo, papel, martelo, baque da lei, fanfarra) ficam.

## D63. Os toques esperam a animação (2026-10-31)

- **Pedido:** quando uma animação toca, os botões têm que congelar, senão tudo dá bug. E o chiado de rádio ainda tocava (o D50 não tinha chegado à `main`).
- **Decisão:** cada efeito sobre a tela (eliminação, investigação, caos, veto, eleição especial, lei voando) congela os toques e as IAs até acabar (`ui.frozen`); só os botões do debate continuam valendo. Com "reduzir movimento", nada se mexe e nada congela. O D50 entrou junto.

## D64. A investigação na tela toda (2026-10-31)

- **Pedido:** a animação do detetive ficou ruim; melhor uma mão tirando o nome do envelope, com a lupa, ocupando a tela toda como a eliminação.
- **Decisão:** sai o detetive (D58). A tela escurece, um envelope grande abre, uma mão de luva puxa o papel com o nome do investigado e uma lupa dourada passa sobre ele; tudo some em uns 3 s, com os toques congelados (D63). Só o nome aparece: o partido continua em segredo.

## D65. Dizer o próprio lado e pedir voto (2026-10-31)

- **Pedido:** poder fazer o "self claim" e tentar virar um voto na mesa de propósito.
- **Decisão:** jogando sozinho com a IA, as anotações têm "📣 Dizer à mesa: Eu sou liberal", uma vez por rodada. Custa nada e diz pouco (todo mundo diz), mas se depois uma investigação disser o contrário, conta como duas contradições para quem disse. Na votação, "Pedir voto": escolhe uma IA e pede Ja! ou Nein! (uma vez por IA em cada votação). O pedido pesa no voto dela pelo quanto ela confia em quem pediu (`PLEA_W`, 0,2 vezes 1 − chance de ser do lado escondido; o cético pesa menos). O cultista da IA vota pelo próprio plano.

## D66. Mais jeitos de falar com a mesa (2026-10-31)

- **Pedido:** todas as sugestões de interação social (pedir indicação, combinar a história, cobrar explicação, abonar, pedir investigação, jurar pela mão, bloco, reação a blefe de investigação), com boas práticas de UI e UX.
- **Decisão:** um painel só, "💬 Mesa", na barra de baixo, junto de Anotações e Diário (um painel por vez), agrupado pelo que cada coisa faz e mostrando só o que dá para fazer agora, com botões de 44 px:
  - **Sobre você:** "Eu sou liberal" (D65) e "Jurar pela minha mão" no último governo de que participou; se a história desse governo não fechar ou uma investigação disser o contrário, o juramento custa três contradições.
  - **Para quem presidir:** "me indica", "não indica X" e "investiga X", valendo até o próximo governo; a IA que preside pesa cada pedido pelo quanto confia em quem pediu (`REQ_W`, 0,25; o cético menos).
  - **Por que votou assim?:** a IA explica o voto da última votação com o que dizia acreditar do governo naquele momento (a conta pública, nunca o raciocínio privado).
  - **Bloco:** até 3 IAs por `BLOC_ROUNDS` (3) rodadas; entra quem confia em você (o lado escondido só entra com os seus). Quem está no bloco ouve o voto da pessoa como um pedido forte; se o bloco eleger um governo que aprove lei do lado escondido, cada membro que votou Ja! perde reputação.
  - **Abonar:** o 👍 das anotações agora é uma aposta: se uma investigação disser que o abonado é do lado escondido, quem abonou perde reputação.
  - **Combinar a história:** o aliado da IA já confirma a versão do presidente aliado (D51).
  - **Blefe de investigação:** se a pessoa diz que investigou e viu o lado escondido, uma IA liberal que tem quase certeza do contrário diz "Duvido", o que é uma acusação e abre o debate.
  O "Eu sou liberal" saiu das anotações e foi para este painel.

## D67. Pedir na hora certa, e só dois botões embaixo (2026-10-31)

- **Pedido:** com três botões, a barra de baixo cortou o Diário. Os pedidos a quem preside deviam aparecer na hora: quando o presidente da IA vai indicar, uma janelinha para pedir a indicação; tirar o botão do Diário; ver o que faz sentido ficar no painel Mesa.
- **Decisão:** a barra fica com Anotações e Mesa; o Diário abre pela linha da última fala, logo acima. Quando uma IA preside e está escolhendo o chanceler, o cartão dela mostra "Peça antes que X escolha": "Me indica" e "Não indicar" com os nomes; quando ela vai investigar, "Sugira quem investigar". Ela espera um pouco para dar tempo (4 s no normal, 6 s na lenta, 2,5 s na rápida) enquanto a pessoa não pediu nada desde o último governo. O pedir voto continua na própria votação. No painel Mesa ficam só as coisas que não têm hora: dizer que é liberal, jurar pela mão, perguntar por que alguém votou assim e o bloco.

## D68. Guardas para os testes (2026-10-31)

- **Pedido:** o CI do #62 quebrou na cobertura e no e2e escuro, embora tudo tivesse passado aqui. Um guardrail para que cada mudança já venha com teste, e um jeito de achar sozinho quais testes de tela uma mudança afeta.
- **Causa:** os testes de tela jogavam partidas com sorteio de verdade (`Math.random`): cada rodada seguia outro caminho, e com ele a cobertura (94,6% no CI, 95,2% aqui) e os pontos em que uma IA acusava no meio do teste.
- **Decisão:**
  - **Sorteio fixo nos testes:** o app usa `window.__SEED` (ou `ui.seed`) quando existe; o `e2e.py` e o `iphone.py` fixam a semente, e a mesma partida roda aqui e no CI. O jogo de verdade continua com `Math.random`.
  - **`tests/guard.py`**, no `verify.sh --quick` (segundos, e no hook de parada): todo nome do `Core` tem que aparecer num teste como `Core.<nome>`, e todo botão (`data-act`) tem que ser tocado por algum teste de tela. O que já não tinha teste ficou numa lista de partida (`tests/guard_baseline.json`) que só diminui; nada novo entra sem teste.
  - **`scripts/affected.py`**, no `verify.sh` (só informa): lê o diff contra a `main`, indexa as marcas que os testes de tela usam (ids, `data-act`, classes, animações) e lista cada linha de teste que usa uma marca que a mudança tirou ou mexeu, para o teste ser ajustado no mesmo commit. Um índice exato de seletores em vez de busca por semelhança: um teste de tela só quebra por uma marca.

## D69. Pedir voto e jurar, explicados (2026-10-31)

- **Pedido:** não estava claro se "pedir voto" era para votarem como a pessoa ou para vetar, nem o que "jurar pela minha mão" queria dizer.
- **Decisão:** na votação, o bloco se chama "Convencer alguém", com uma linha dizendo o que faz (a IA vota como você pede, conforme confia em você) e os botões dizendo o que pedem: "Pedir Ja! (aprovar este governo)" e "Pedir Nein! (barrar este governo)". No painel Mesa, "Jurar pela minha mão" virou "Garantir minha história": o botão mostra o que a pessoa disse ("você disse que tirou 2 vermelhos de 3 no governo com X") e explica o efeito. Garantir passou a valer algo: enquanto nada contradiz quem garantiu, as IAs acreditam um pouco mais nele; se aparecer contradição, perde muita reputação (D66).

## D70. Menos botões, o cartão que o investigador diz e sem falas piscando (2026-10-31)

- **Pedido:** "garantir minha história" não fazia sentido ao lado de dizer o que tirou; o "sou liberal" podia ser um botão flutuante, fora da rolagem, e o botão Mesa perderia o sentido; as falas de um personagem sobre o outro passavam rápido demais e poluíam; na investigação, quando o investigador diz o que viu, aparecer o desenho do lado que ele disse, com uma transição, mesmo que ele minta.
- **Decisão:** sai o "garantir minha história" (D69) de vez, inclusive das contas das IAs. "📣 Sou liberal" é um botão redondo que flutua sobre o jogo, acima da barra de baixo, enquanto a pessoa pode dizer (uma vez por rodada). Sai o botão Mesa: a barra fica só com Anotações; "Por que votou assim?" e o bloco vão para o fim do caderno de anotações. As falas das IAs não aparecem mais no aviso do pé da tela: ficam no Diário. Quando um investigador diz o que viu, a tela escurece e a carta do lado que ele disse vira, com o desenho do liberal ou do cultista e o aviso "Pode estar mentindo"; os toques esperam (D63).

## D71. Reputação e Desconfiança (2026-10-31)

- **Pedido:** renomear "reputômetro" para "reputação" e "desconfiômetro" para "desconfiança".
- **Decisão:** os botões e os textos da tela passam a dizer "Reputação" e "Desconfiança". Os nomes guardados (`S.rep`, `S.gauge`) não mudam, para não perder a escolha de quem já jogou.

## D72. Sou liberal no rodapé (2026-10-31)

- **Pedido:** o "Sou liberal" fica melhor no rodapé, à esquerda, com Anotações à direita.
- **Decisão:** sai o botão flutuante (D70); a barra de baixo tem "📣 Sou liberal" (azul) à esquerda e "Anotações" à direita. Depois de dizer, o botão fica apagado ("Já disse") até a próxima rodada, para a barra não mudar de lugar.

## D73. Virar um voto, sugerir quem eliminar e provar que é liberal (2026-10-31)

- **Pedido:** virar um voto depois que todos votaram, tocando no voto e escolhendo uma justificativa (e tirar os botões de pedir voto); sugerir a quem tem o poder quem eliminar; e o "Sou liberal" tem que provar e disparar algo. Prévias aprovadas antes (`m3`, `m4`). Sem a palavra "mesinha" no jogo.
- **Decisão:**
  - **Virar um voto:** jogando sozinho com a IA, os votos abrem como antes e, em vez do resultado, abre uma janela de 6 s ("Virar um voto"): os votos das IAs (fora presidente e chanceler) ficam tracejados; tocando num, sobem justificativas montadas da ata, cada uma com força (forte, média, fraca): o chanceler ou o presidente já governou e saiu lei do lado escondido, já há 3 leis do lado escondido, ainda dá para rejeitar; ou, ao contrário, mais uma rejeição traz o caos, o governo tem histórico limpo, vamos ver o que sai; e sempre "confia em mim". A IA vira pela força da justificativa e pelo quanto confia na pessoa (o cético menos, o certinho mais); o lado escondido só vira quando ajuda o seu lado. Uma tentativa por votação; só então o resultado aparece. Sai o "Convencer alguém" com botões no cartão da votação (D65, D69). Com "reduzir movimento" a votação conta direto, sem a janela.
  - **Sugerir quem eliminar:** quando uma IA vai eliminar, o cartão dela mostra cada candidato com o motivo mais forte da ata e a força (`killReasons`); a sugestão pesa pela prova e pela confiança. A IA espera uns segundos para dar tempo (D67).
  - **Sou liberal com prova:** o botão do rodapé abre "Provar que você é liberal", com o que a ata tem a favor (investigação que disse liberal, leis liberais aprovadas, lei do lado escondido jogada fora, gente que confia, ou só a palavra), cada um com força. Cada IA diz se acredita, não sabe ou duvida, pela prova, pelo que já achava e pelo lado dela; as reações sobem na tela e ficam no Diário.
  - Um teste novo, `tests/social.py`, joga as três coisas com movimento ligado.

## D74. Envelope e carta numa peça só, pular a virada, carta do líder rasgada (2026-10-31)

- **Pedido:** a investigação emendar direto: o envelope com o nome de quem foi investigado, e dele sai a carta, sem pausa; um botão para pular a janela de virar voto; ao eliminar o Líder (ou o Líder Vermelho), a carta dele rasgada antes da animação que já existe.
- **Decisão:** numa mesa com IA, a investigação toca uma vez só, quando o investigador conta o que viu: a tela escurece, o envelope tem o nome do investigado, a aba abre, a carta sobe e vira para o lado que ele disse (ou fica com "?" se ficou calado), com "Fulano diz que é ... Pode estar mentindo". Passando o celular, sem IA, ninguém conta e o envelope antigo continua (D64). A janela "Virar um voto" ganhou "Pular ›", que conta os votos na hora. Eliminado o líder escondido, depois do tiro a carta dele aparece e se rasga ao meio antes do amanhecer liberal.

## D75. Xeque-mate de quem não teve escolha, e nada de chanceler sujo na zona (2026-10-31)

- **Pedido:** acusado por ter aprovado lei do lado escondido quando recebeu duas e disse a verdade (estava na ata), a defesa tem que ser um xeque-mate, ou poder incriminar o presidente e virar a banca. E as IAs liberais elegeram Saddam Hussein chanceler, o que encerrou o jogo. As 30 partidas exportadas mostraram o padrão: das 9 derrotas como liberal, 8 foram o líder eleito chanceler, quase sempre depois de ter estado em 2 ou 3 governos que aprovaram lei do lado escondido, com IAs liberais indicando ou votando Ja!.
- **Decisão:** um governo em que quem é acusado não teve escolha (chanceler que recebeu 2, presidente que tirou 3, com as histórias batendo) não é prova forte. No debate, o chanceler que recebeu 2 tem "Não tive escolha: recebi duas" (0,75); se a história do presidente não bate, "Vira a banca: o presidente mente" (0,8). Da 3ª lei do lado escondido em diante, o liberal da IA não indica nem vota Ja! num chanceler que esteve em `ZONE_DIRTY` (2) governos que aprovaram lei do lado escondido, salvo se uma investigação disse que ele é liberal e quem investigou não é, ele mesmo, sujo (nas partidas, o lado escondido acobertou aliados em 14 investigações). Equilíbrio (`BENCH_DIAG=1 node scripts/ai_bench.mjs 300`): liberais 48%, 54%, 57% e 57% (antes 46%, 55%, 57% e 56%).

## D76. A última partida: acusação que a ata não sustentava, e sem som no tiro (2026-10-31)

- **Pedido:** na última partida exportada, a pessoa (liberal) foi acusada e eliminada por "ter estado em 2 governos que aprovaram lei vermelho", e a mesa toda achou que procedia, mas ela só tinha recebido cartas vermelhos. E o som do tiro na eliminação vinha antes da tela e entregava o suspense.
- **O que a ata mostra:** num governo ela foi chanceler, recebeu 2 vermelhos e o presidente disse que tirou 3 (as histórias batiam, não havia escolha); no outro, foi presidente e tirou 3 vermelhos. A prova "na conta" (D54) contava os dois governos, sem descontar os em que não houve escolha (o D75 só tinha descontado a prova de um governo só). E no debate, como a prova era a conta e não um governo, o "não tive escolha" não aparecia.
- **Decisão:** a conta de governos não inclui aqueles em que a pessoa não teve escolha com as histórias batendo; no debate, qualquer que seja a prova, o acusado tem "Nas minhas leis, não tive escolha" (0,75), listando esses governos. Quem elimina não dá como motivo um voto que ela mesma deu (ou um governo em que estava). O som do tiro sai, e a vibração junto. Na lista de jogadores, uma marca longa ou a barra de desconfiança não espremem mais o nome (a marca da investigação virou "🔍 Vermelho"); nas anotações, o nome fica em cima e os dois lados dividem a largura, com os botões centrados.

## D77. Um motivo, uma acusação (2026-10-31)

- **Pedido:** muita acusação repetida. Um motivo só pode estar ligado a uma acusação; a segunda tem que vir de outro ponto.
- **Decisão:** uma prova usada numa acusação contra um jogador (por qualquer um) fica gasta para ele (`usedProofs`): no tribunal aparece riscada, "já usada numa acusação", e a IA não a usa de novo. Sem uma prova nova, a IA não acusa quem já foi acusado: fica calada (sai o "Fulano já disse, e eu também não confio").

## D78. O papel que você sabe, em todo nome (2026-10-31)

- **Pedido:** jogando do lado escondido, o nome dos companheiros aparecia sem o papel e confundia. Em todo lugar que aparecer o nome de um jogador cujo papel verdadeiro a pessoa sabe (é do time dela, ou ela investigou), uma cor ou legenda.
- **Decisão:** jogando sozinho com a IA, todo nome de jogador cujo lado a pessoa sabe de certeza aparece na cor do lado, com uma etiqueta pequena ("Vermelho", "Líder Vermelho", "🔍 Liberal"): nos cartões da vez, nos pedidos, no debate, na votação, nas telas de efeito e nas listas.

## D79. O "KD" de cada um, e o papel nos lugares que faltavam (2026-10-31)

- **Pedido:** ainda havia lugares sem o papel conhecido ao lado do nome; e, do lado do nome, um "KD" como no Call of Duty: quantas leis cultistas cada um aprovou como presidente e como chanceler.
- **Decisão:** a etiqueta do D78 passa também para a lista de jogadores, a faixa da mesa, o caderno, os botões de escolher jogador (chanceler, investigar, eliminar, eleição especial), o resumo e o bloco. Ao lado do nome, nesses mesmos lugares, `1P·0C` na cor do lado escondido: leis cultistas (vermelhos) aprovadas como presidente e como chanceler, contadas só do que a mesa toda viu; some enquanto for zero.

## D80. Acusar o chanceler para quem você passou as leis (2026-10-31)

- **Pedido:** na última partida exportada, a pessoa (presidente) passou 1 liberal e 1 cultista; o chanceler aprovou a cultista, disse que recebeu 2, e a acusação dela caiu e ainda virou contra ela. A réplica oferecida era "Governou com Lucas e saiu lei cultista", sem sentido na boca da própria pessoa.
- **Decisão:** quando quem acusa foi o presidente que deu as duas leis ao acusado e o que ele diz ter recebido não bate com o que recebeu, a defesa não tem o xeque-mate "não tive escolha" (é palavra contra palavra) e quem acusa tem essa prova já na hora de acusar ("Eu te passei 1 cultista e 1 liberal…", firme) e o mesmo argumento no debate, no lugar de "Insiste na prova"; essa acusação não vira contra quem acusou. Junto: uma investigação não limpa quem governou com o investigador num governo que aprovou lei cultista (o aliado limpava o Líder); "liberais" no plural; nome no meio da frase não perde a maiúscula.

## D81. Acusação em combo, afiada pela mesa (2026-11-01)

- **Pedido:** juntar todas as provas contra alguém numa acusação só ("esteve em 2 governos que aprovaram…", "como presidente saíram X…"), e quanto mais perto da 3ª lei cultista, mais dura a acusação; se pegar, ninguém mais vota nele para chanceler.
- **Decisão:** na tela de acusar, dá para tocar em várias provas; com duas ou mais aparece o medidor "Combo" e o botão vira "Acusar com tudo". A força soma o que cada prova acrescenta (a que vale 0,45, o indício 0,2) e cresce até a metade com o perigo da mesa (`sharpness`: leis cultistas / 3). Quem acusa fala tudo de uma vez, com o fecho pela mesa ("Falta uma lei cultista para o Líder poder ganhar como chanceler. Ninguém vota nele."); o acusado responde uma prova por vez (defesa a 70%) e não pode dizer que foi cedo demais se alguma prova vale. Todas as provas usadas ficam gastas (D77). Se a mesa aceitar, a partir da 2ª lei cultista nenhum liberal da IA indica ou vota Ja! nesse chanceler, a não ser que uma investigação limpa diga que é liberal (`barred`).

## D82. Combo na defesa, credibilidade de quem investigou, e o "tirei 3" pelo baralho (2026-11-01)

- **Pedido:** usar a ata também para se defender e descredibilizar quem acusa, em combo; poder dizer que quem investigou e "limpou" alguém aprovou leis cultistas; credibilidade boa de investigador pede pelo menos duas leis liberais aprovadas nos governos dele; e se o "tirei 3" do presidente pesa mais que o "recebi 2" do chanceler.
- **Decisão:** no debate, cada argumento pode ser dito sozinho ou marcado com ＋ para um combo ("Responder com tudo"), somado como o combo de ataque (D81). Novos argumentos: o acusado lembra a investigação que o disse liberal (vale pouco se o investigador não tem 2 leis liberais, se esteve em governo que aprovou lei cultista, e quase nada se governou com ele) e descredibiliza quem acusa pelas acusações dele que a mesa não comprou; quem acusa derruba essa investigação ("Quem disse que ele é liberal foi X, que esteve em N governos que aprovaram lei cultista"), também como prova na tela de acusar. Para as IAs, uma investigação só limpa um chanceler sujo (D75, D81) se o investigador tem pelo menos `INV_CRED` (2) leis liberais nos governos dele. O "não tive escolha: tirei 3" do presidente pesa pela chance de tirar 3 cultistas com o baralho contado (`threeOdds`): o "recebi 2" do chanceler continua mais forte, porque é mais comum e ninguém confere o que o presidente tirou.

## D83. Veredito pela melhor fala, e governo sem escolha não é prova (2026-11-01)

- **Pedido:** na partida exportada de 2026-11-01, uma acusação em combo de 0,89 perdeu de 0 a 5 para uma defesa de 0,52 + 0,31, e as provas oferecidas incluíam governos em que o acusado não teve escolha.
- **Decisão:** o veredito pesa cada lado pela melhor fala (vezes a lábia), não pela soma: o acusado fala duas vezes e quem acusa uma, e a soma dava a vitória a quem falava mais. Um governo em que a pessoa não teve escolha e as histórias fecham (chanceler que recebeu 2, presidente que tirou 3) não aparece mais na lista de provas.
- **Outras brechas fechadas na revisão:** o combo (de ataque e de defesa) soma a melhor fala inteira e um quarto de cada outra, até 0,9 (`stack`): antes quatro indícios fracos viravam prova "forte" e uma defesa com todos os argumentos chegava a 0,95, imbatível; repetir a própria mão ("foi o que eu disse e mantenho") cai de 0,55 para 0,4; o "nas minhas leis não tive escolha" contra a prova da conta vale 0,35 (a conta já tira esses governos); quem acusa não traz de novo no debate uma prova que já está no combo nem uma já gasta (D77).

## D84. Ficha do jogador, linha das leis e um debate que se lê (2026-11-01)

- **Pedido:** mais UI/UX ("faz todas" das seis ideias).
- **Decisão:** (1) no debate, uma barra com a força de cada lado (a melhor fala, a mesma conta do veredito, D83) e, na vez da pessoa, "para virar, precisa de uma fala acima de X"; (2) na tela de acusar, as provas que valem em cima, os indícios atrás de "Mais indícios" e, em cada prova, a resposta provável do acusado; (3) tocar no nome na lista de jogadores abre a ficha: KD, leis liberais e cultistas, Ja! em governo cultista, governos, investigações e acusações, só o que a mesa toda viu; (4) no tabuleiro, as leis em ordem com o par que as aprovou (tocar abre a ficha do presidente); (5) "O que aconteceu" fechado durante a partida; (6) no veredito, os votos caem um a um, com uma linha de motivo pelo voto (nunca pelo papel).

## D85. No celular: nada vaza, o envelope se lê, e o fim espera a eliminação (2026-11-01)

- **Pedido:** envelope da investigação com pouco contraste, a animação demorada e repetida, textos vazando dos botões no celular, e o som ainda entregando a morte do Líder.
- **Decisão:** o nome no envelope sai escuro sobre o papel (sem o clarão das telas escuras); a investigação dura 2,4 s, e 1,4 s depois da primeira da partida; nome com etiqueta quebra a linha dentro do botão em vez de vazar, e a linha das leis quebra em vez de sair da tela; a fanfarra, o confete e a tela do fim esperam a tela da eliminação terminar.

## D86. Os símbolos das leis desenhados (2026-11-01)

- **Pedido:** "a arte nas leis está feia"; trocar a caveira por outro símbolo; tirar os nomes dos poderes no tabuleiro.
- **Decisão:** os símbolos deixam de ser emoji (no iPhone, caveira brilhante e balança colorida, fora do estilo) e passam a ser desenhos SVG chapados na cor da carta, com raios de pôster atrás do selo: balança para liberal e um símbolo próprio para cada tema da expansão. Um símbolo de ódio foi pedido e ficou de fora. No tabuleiro, as casas mostram só o ícone do poder (sem "investiga", "elimina", "vitória" escritos); a palavra fica no toque longo e no leitor de tela.

## D87. Peneira: IA que não queima a largada, investigação na hora, frases e plaquinha (2026-11-01)

- **Pedido:** muita IA "queimando a largada" (acusando no começo, artificial); a animação da investigação chegava atrasada e era cortada quando o próximo presidente já indicava; a plaquinha "Sessão legislativa" descentralizada; caçar pequenas falhas da IA, do debate e do fluxo.
- **Decisão:** antes de duas leis aprovadas, uma IA sem prova que valha não acusa (fica calada). A IA que investiga diz o que viu no mesmo passo, e o envelope toca na hora, com o jogo congelado. A plaquinha centraliza o texto quando quebra em duas linhas. Numa peneira de 12 partidas só de IA no difícil: as falas de campanha se repetiam (a mesma frase 41 vezes), agora há mais variações, curtas, e uma que lembra a lei liberal aprovada; "1 governo que aprovaram" virou "1 governo que aprovou". A trucada "quem disse que ele é liberal não é confiável" já existia (D82: "Derruba a investigação de X", também como prova na tela de acusar).

## D88. Fluxo mais ágil (2026-11-01)

- **Pedido:** "faça todas" das melhorias de fluxo.
- **Decisão:** presidente e chanceler da IA dizem o que tiveram no mesmo passo em que a lei sai (como a investigação, D87); a IA presidente só espera os 4 s inteiros por um pedido da pessoa se ela já pediu algo na partida (senão 1,8 s); a janela de virar votos dura 6 s só quando um voto muda o resultado (senão 2,5 s); a tela de eliminação dura 3,6 s (4,8 s com o Líder) e um toque a pula; no debate, "Responder depois" fecha a tela e a acusação espera no cartão "Você foi acusado"; acusação de uma IA contra outra, com prova, ganha veredito na hora, numa linha só no registro; os avisos curtos sobem para cima da barra de baixo, sem cobrir os botões. Equilíbrio (`scripts/ai_bench.mjs`, 150 partidas por nível, mesmo nível dos dois lados, 2026-11-01): mentir mais piorava os cultistas (as checagens de D75 a D82 pegam a mentira), então eles mentem um pouco menos no difícil e no extremo (`lie` 0,35 → 0,32 e 0,4 → 0,34, sem quebrar a ordem dos níveis), jogam limpo no começo um pouco mais (`EARLY_CLEAN` difícil 0,25 → 0,3, extremo 0,15 → 0,25) e os liberais arriscam um pouco mais na zona (`ZONE_SURE` difícil 0,6 → 0,75, extremo 0,65 → 0,8). Resultado: fácil 46%, médio 54%, difícil 52% (antes 61%), extremo 64% (antes 65%: continua acima da meta; mentir bem menos o traria para 59%, mas quebraria a ordem dos níveis, em que quem joga melhor mente mais).

## D89. Tutorial: uma partida guiada (2026-11-01)

- **Pedido:** um modo tutorial para quem nunca jogou. Escolhido: partida guiada, básica (uns 5 min).
- **Decisão:** "📘 Nunca jogou? Tutorial", no cartão do "Jogar agora", começa uma partida de 7 lugares contra a IA no fácil, no tema original, com a pessoa sempre liberal (pelo treino, D11) e a IA um pouco mais lenta. Um cartão "Tutorial" aparece acima da fase quando chega cada momento (papéis, indicação pela IA e pela pessoa, votação, as leis do presidente e do chanceler, dizer à mesa o que teve, a primeira lei cultista, as anotações e o 📣, os poderes, a zona de perigo da 3ª lei e o fim), um de cada vez e uma vez só; a IA espera enquanto a dica não é lida ("Entendi"). As dicas falam só das regras e do que a mesa toda vê. As dicas lidas ficam na partida (`Game.tut`), então recarregar não repete.

## D90. Partida de 2026-11-02, IA e UI (2026-11-02)

- **Pedido:** analisar a partida exportada de 2026-11-02 e fazer as melhorias de IA e de UI propostas.
- **Na partida:** um chanceler que disse ter recebido 1 de cada e aprovou a cultista ainda tinha "o baralho veio assim"; e o Líder Vermelho, com uma história que não fechou e uma acusação com prova aceita pela mesa, foi limpo por uma investigação ("disse que é liberal") e eleito chanceler na zona. **Decisão:** "o baralho veio assim" só para quem, pela própria fala, não teve escolha; uma história que não fecha, ou uma acusação com prova aceita, não é limpa por investigação nenhuma.
- **IA:** o voto bate com a fala: quem acusou o chanceler nesta rodada vota {nein} nele (liberal e cultista sem aliado no governo); cada personalidade abre algumas falas do seu jeito ("Sei lá,", "Confia em mim:", "Pela ata:"…). A coordenação entre cultistas na história do governo já existia (o chanceler aliado confirma a mão que o presidente disse). Extremo: arrisca um pouco mais na zona (`ZONE_SURE` 0,8 → 0,9) e joga limpo no começo um pouco mais (`EARLY_CLEAN` 0,25 → 0,35): 150 partidas, mesmo nível, liberais fácil 45%, médio 54%, difícil 52%, extremo 63% (antes 64%; ainda acima da meta; subir o `wary` do extremo o trazia a 61%, mas o fazia aceitar um chanceler com cara de {boss}, o que os testes proíbem).
- **UI:** um selo com as iniciais de cada jogador, numa cor só dele (fora do azul e do vermelho dos lados), na lista de jogadores; ícones no registro (lei, voto, eleito, rejeitado, investigação, eliminação, fala, acusação); ("O momento decisivo" no Resultado ficou de fora: "O que decidiu a partida" já mostra isso); no celular, segurar o dedo num lugar da faixa da mesa abre a ficha, e arrastar para o lado abre ou fecha as anotações.

## D91. O truque do "limpo cedo" manjado (2026-11-02)

- **Pedido:** jogando do lado escondido, aprovar duas liberais no começo, ficar limpo e depois eleger o {boss} chanceler ganhava sempre.
- **Decisão:** da 3ª lei cultista em diante, no difícil e no extremo, um liberal da IA só aceita como chanceler (indicando ou votando) quem se provou depois que o jogo esquentou: uma lei liberal num governo dele a partir da 2ª lei cultista (`LATE_FROM`), ou uma investigação confiável dizendo liberal. Lei liberal só no começo é exatamente o disfarce. A exceção é com o caos a uma rejeição: rejeitar ali entrega uma lei aos cultistas. Não é metajogo: é uma estratégia conhecida do jogo, a mesma para qualquer jogador, pessoa ou IA. Equilíbrio (150 partidas, mesmo nível, 2026-11-02): fácil 45%, médio 54%, difícil 47% (antes 52%), extremo 58% (antes 63%).

## D92. Rostos chapados na mesa (2026-11-02)

- **Pedido:** um rostinho para cada jogador, sem expressão (rosto chapado numa cor), com o jeito de se vestir de cada continente, para não parecer NPC genérico; sketch feminino para os nomes de mulher.
- **Decisão:** desenhos SVG próprios (`face` em `src/app/art.ts`), de busto, sem olhos nem boca: Europa com casaco de gola de pele, cachecol, boina e chapéu-coco; os russos com o chapéu de pele de abas; os líderes de países árabes com keffiyeh e túnica branca, e o clérigo com turbante e manto de clérigo; África com tecidos estampados coloridos, colar de contas, gorro e turbante de pano; Américas com poncho listrado, faixa trançada na cabeça e chapéu de aba larga; Ásia com gola alta (mandarim) e coque com grampo; Oceania com camisa florida e chapéu de sol; Brasil com cores tropicais e boné; no Mundo, cada nome cai num continente. O tom de pele varia em cada continente. O desenho sai do nome, sempre o mesmo para o mesmo nome, e não diz nada do papel. Aparecem só onde ajudam a reconhecer alguém, em três tamanhos (24, 32 e 48 px; 64 nas telas cheias): na faixa da mesa (24, com anel dourado no presidente, claro no chanceler, cinza quem saiu), no cartão da vez da IA (48), no debate ao lado de quem fala (32), na votação (32), na lista de jogadores (32), na tela da eliminação (64, apagado) e na galeria ("Rostos da mesa"); não no registro, nas etiquetas, nos botões de escolher, na ata nem nas anotações. O rosto nunca leva a cor de um lado, o nome continua sempre ao lado, e cada desenho é feito uma vez e guardado; os nomes de mulher da lista (Thatcher, Merkel, as rainhas, Cleópatra, Nefertiti, Dilma, Manuela) ganham o desenho feminino. A pessoa ganha um rosto de roupa cinza. Os nomes conhecidos ganham o visual próprio (`LOOKS`), montado de partes e ainda sem rosto: os da Antiguidade e de outras épocas na roupa do seu tempo (Júlio César de toga e louros, Napoleão de bicorne e farda, os faraós de nemes e colar, Nefertiti com a coroa azul, Aníbal de elmo, Gengis Khan de chapéu mongol, Tiglate-Pileser de tiara e barba assíria, Confúcio de chapéu de letrado, Lincoln de cartola, Washington de tricórnio, as rainhas de coroa); os militares de farda e quepe; Fidel e Che de verde-oliva (Che de boina com estrela), Chávez de boina vermelha; Gandhi de xale branco e óculos redondos; Mao e os Kim de túnica; os políticos de hoje de terno e gravata.

## D93. Virar voto sem relógio, e resposta única no debate (2026-11-02)

- **Pedido:** ao tocar num voto para virar, o tempo parar para escolher o motivo com calma; e, no iPhone, na réplica e na tréplica só a resposta em combo funcionava, a única não.
- **Decisão:** tocar num voto para a contagem da janela (a barra fica parada e apagada); sem tocar, o tempo corre como antes, e "Pular ›" continua encerrando. No debate, uma repintura que não muda nada não troca mais os botões: trocar o botão debaixo do dedo perdia o toque no iPhone (o combo, com vários toques, acabava passando). Os botões do debate também ganham `touch-action: manipulation`, sem a espera do toque duplo. No Chromium o toque único funcionava; no Safari de verdade não deu para conferir daqui.

## D94. Fichas do Call of Cthulhu e rolagens de d100 (2026-11-03)

- **Pedido:** integrar o Secret Cultist com a API de fichas do `cthulhu-caracter-sheet` (já na Vercel): fichas geradas pelo continente, e rolagens de d100 no estilo do Call of Cthulhu para persuadir e mentir, com animações de sucesso e falha.
- **Decisão:** ao começar uma partida, o jogo pede uma ficha por lugar a `https://cthulhu-caracter-sheet.vercel.app/char-generator/random-char`, com `nativeLanguageRegion` pelo continente (Américas e Brasil `AMERICA`, Europa `WESTERN_EUROPE`, Ásia `ASIA`, África `AFRICA`; os russos `EASTERN_EUROPE`, os líderes árabes e o Khomeini `MIDDLE_EAST`; Mundo e Oceania sem região). Lida por `normSheet`, com a resposta real gravada (`tests/fixtures/source/random-char_eastern-europe_2026-11-03.json`). O jogo nunca espera e, sem resposta, segue como antes das fichas (D95). Rolam d100 (regras do Call of Cthulhu: 01 crítico, até 1/5 extremo, até 1/2 difícil, até a perícia sucesso, acima falha, 100 ou 96+ com perícia abaixo de 50 desastre): cada argumento do debate (Persuasão, Lábia ou Charme, conforme o argumento), somando de +0,3 a −0,25 à força dele; e o motivo para virar um voto (Persuasão), multiplicando a chance (o crítico vira sempre, o desastre nunca). O dado gira e cai no número; o resultado aparece em dourado (crítico, com brilho), verde (sucesso, com pulo) ou vermelho (falha, tremendo; desastre, rachado). As regras e as leis continuam sem sorte. A ficha (as quatro perícias e a língua materna) aparece na ficha do jogador. É a única chamada de rede do jogo, e o service worker não a guarda.

## D95. Disjuntor nas fichas: elas são um adicional (2026-11-03)

- **Pedido:** se a API de fichas cair, não ficar gastando chamada e tempo; um circuit breaker, com o jogo voltando a ser o de antes enquanto ela está fora, e as fichas voltando sozinhas quando ela voltar (feature toggle).
- **Decisão:** um disjuntor (`src/core/breaker.ts`), guardado no aparelho (`secretcultist.sheets.v1`). Fechado, as chamadas saem. A cada partida nova, a primeira ficha é um teste: se falhar, nenhuma outra sai e a partida é jogada sem fichas. Depois de `BREAK_AFTER` (2) falhas seguidas ele abre e não chama nada por `BREAK_WAIT` (2 min); passado o tempo, deixa uma chamada passar (meio aberto): se ela responde, ele fecha e as fichas voltam; se não, abre de novo, esperando o dobro, até `BREAK_MAX` (1 h). Sem ficha não há dado nem ficha na tela: o jogo é exatamente o de antes (a ficha feita no aparelho, do D94, saiu). Se alguma ficha da mesa falhar, a mesa toda fica sem, para ninguém rolar com vantagem. Cada chamada desiste em 6 s.

## Ideias futuras para os dados (registrado em 2026-11-03, não feito)

A regra continua sem sorte; o dado só mexe no que é dito e em como a mesa recebe.
- **Psicologia:** quando alguém diz à mesa o que recebeu, cada IA rola Psicologia; sucesso desconfia de uma mentira, extremo tem certeza.
- **Investigar:** o resultado é sempre o verdadeiro; o que rola é a credibilidade do que o investigador conta (Persuasão contra a Psicologia de quem ouve).
- **Eliminar:** o tiro nunca erra; rola Intimidação para a justificativa convencer (sem perder confiança) ou pegar mal, com o dado na animação do tiro.

## D96. Secret Cultist (2026-11-06)

- **Pedido:** um modo novo, "Secret Cultist", com as rolagens de Psicologia, de investigar e de eliminar (as ideias futuras do D94).
- **Decisão:** um tema novo (`culto`): Investigadores x Cultistas, o líder escondido é o Sumo Sacerdote (Cthulhu fica como o deus invocado, não como jogador), votos Aye!/Nay!, no alto "Secret Cultist", desenhos próprios (investigador de sobretudo e chapéu com lampião, cultista de capuz vermelho sem rosto, Sumo Sacerdote de preto com mitra dourada e tentáculos) e símbolos próprios nas leis (o Sinal Ancião para os investigadores, um olho com tentáculos para o culto); as IAs com nomes dos dois lados. As rolagens novas valem só nesse tema e só com fichas (D95): quando alguém diz à mesa o que tirou, recebeu ou investigou, cada IA viva rola Psicologia contra a Persuasão de quem falou; ganhando (com sucesso), lê certo, mentira como mentira e verdade como verdade, e com extremo tem certeza; a leitura é só dela e pesa no que ela acha (uma mentira lida aponta forte para o lado escondido). A pessoa que mentiu e foi lida vê "alguém na mesa franziu a testa". Quem elimina rola Intimidação, dita no registro: convencendo, a mesa não desconfia dele por isso; falhando, pega mal. A regra não muda: o tiro nunca erra e a investigação mostra sempre o partido verdadeiro.

## D97. Modo Cthulhu fora do ar: segunda chance no modo normal (2026-11-06)

- **Pedido:** se o Secret Cultist estiver indisponível (a API de fichas fora), não fazer a pessoa perder tempo: jogar o modo normal, que não depende de integração.
- **Decisão:** com o disjuntor aberto (D95), o tema aparece apagado no cartão "Tema do jogo", com "fora do ar · volta sozinho", e uma partida nova nele já começa no tema original, com o aviso "O modo Cthulhu está fora do ar agora. Seguimos no modo normal.". Se a API falhar na hora de buscar as fichas, a partida que acabou de começar passa para o tema original, com o mesmo aviso. Quando a API volta, o tema volta sozinho.

## D98. Portfólio: só o Secret Cultist à mostra (2026-11-06)

- **Pedido:** nada de Líder, Líder Vermelho ou cultistas visível no portfólio; isso fica atrás da senha da DLC, e só o Secret Cultist fica disponível.
- **Decisão:** sem a senha (`S.dlc`), o app é o Secret Cultist: título da página, nome na tela inicial ("Secret Cultist") e no ícone do celular, o único tema no cartão "Tema do jogo", na galeria, na partida rápida e no tutorial. tema clássico e tema vermelho só aparecem depois da senha (a mesma do Brasil). Sem a API de fichas e sem a senha, a partida segue no Secret Cultist, só que sem dados (não cai para um tema histórico). Fica um crédito obrigatório: o jogo é uma adaptação de Secret Cultist, sob CC BY-NC-SA 4.0, que exige citar a obra original pelo nome. Os testes que jogam os temas históricos ligam a senha com `window.__DLC`, como o `window.__SEED`.

## D99. Debate sem travar, fichas só no Cthulhu e guardadas no aparelho (2026-11-07)

- **Pedido:** no debate só dava para responder marcando duas opções, e às vezes a tréplica só tinha "Fica calado"; as fichas apareciam no tema histórico; health check na integração; guardar umas 10 fichas no celular para jogar com a API fora do ar.
- **Decisão:** marcar uma opção já mostra "Responder com isso"; um argumento já dito volta mais fraco ("Insiste: …", 40% da força), então sempre há o que dizer. Ficha e dado só no Secret Cultist (`sheetOf` ignora outro tema; o app nem busca). A API ganhou `/health` (`HEALTH`, `healthy`), e com ela no ar o app guarda até `POOL_MAX` fichas por região no aparelho (`secretcultist.sheets.pool.v1`), completando ao abrir (`warmSheets`) e a cada partida; com a API fora (ou o disjuntor aberto), a mesa sorteia fichas guardadas, e o modo só fica indisponível sem nenhuma.

## D100. Nada dos temas históricos à vista no repositório e no site (2026-11-07)

- **Pedido:** tirar tudo dos temas históricos da visão pública do repositório e do site; o repositório público passa a ser um novo, `secret-cultist`, e este fica privado.
- **Decisão:** o código chama os papéis e os temas por nomes neutros (`lider`, `cultista`, `classico`, `vermelho`, `LEADER_ZONE`). As palavras, os nomes e os rostos dos temas da expansão saem do código às claras e vão embaralhados com a senha em `src/core/dlc.ts` (`unlockDlc`; `scripts/dlc.mjs` decodifica e codifica). O Secret Cultist ganhou nomes próprios, personagens dos contos de horror antigos (`CULT_NAMES`). Sem tema escolhido, o jogo é o Secret Cultist (antes era o original), e ele nunca vira tema histórico quando faltam fichas: joga sem dados. O que estava guardado no aparelho com o nome antigo é lido uma vez e convertido. Fica só o crédito ao jogo original, que a licença CC BY-NC-SA exige.

## D101–D107. As melhorias pedidas depois do D100 (2026-11-07)

- **Pedido:** "faz tudo" das 10 melhorias listadas, menos a partida online (fica para depois, com backend próprio).
- **D101, sanidade:** a ficha mostra a SAN; cada eliminação custa `SAN_LOSS.exec` e cada lei do culto `SAN_LOSS.lawF`, contado pela ata (nada novo guardado). Abaixo de `SAN_LOW`, o jogador fica abalado e as perícias rolam a `SHAKEN` do valor; o dado mostra "abalado".
- **D102, a cara do Secret Cultist:** no tema, a tela diz investigadores e "lei do Sinal" no lugar de liberais e lei liberal (`cultSpeak`, aplicado num lugar só, para toda a tela); a carta de lei diz "Sinal". Por dentro, as regras continuam com `liberal`.
- **D103, debate mais curto:** a defesa mostra os 4 argumentos mais fortes (e os marcados); "Mais argumentos" abre os outros.
- **D104, partidas passadas:** o cartão "Suas partidas" lista as últimas (5, e "Ver todas"), com o tema, quem venceu, o seu papel e se você ganhou, e a sua taxa de vitórias (`pastGames`).
- **D105, fichas renovadas:** com o estoque cheio, ao abrir o app ou voltar a ele, até `ROTATE` fichas novas substituem as mais antigas, no máximo uma vez a cada `WARM_EVERY`.
- **D106, som do culto:** no Secret Cultist, sino no lugar do martelo, sussurro na eliminação e fins próprios.
- **D107, tutorial do Secret Cultist:** dicas da ficha, do d100 e da sanidade quando cada uma aparece.
- **Equilíbrio do extremo (não mudou):** com a mesa toda no extremo, os liberais vencem 57–58% (300 partidas, `node scripts/ai_bench.mjs`). Mexer em mentira, confiança, limite do líder, limpeza no começo e certeza na zona não tirou o número do lugar; os valores voltaram como estavam. Fica em aberto.
- **README:** imagens e animação de uma partida (`scripts/readme_shots.py`) e o diagrama do juiz.

## D108. Jogo rápido de Cthulhu e a API que dorme (2026-11-07)

- **Pedido:** um "Jogar agora" só do Cthulhu, 7 lugares, papéis sorteados; e a API das fichas "sempre fora".
- **Decisão:** com a expansão liberada, "Jogo rápido de Cthulhu" monta a partida rápida sempre no Secret Cultist (sem a expansão, "Jogar agora" já é só ele). Os logs da Vercel mostram a API subindo do zero a cada pedido (o container Java leva uns 10 s para acordar), e o app desistia em 4 a 6 s, abrindo o disjuntor: toda chamada às fichas agora espera `COLD` (20 s).

- **Depois (2026-11-07):** a API foi reescrita em Go (`cthulhu-char-golang`, mesmas rotas e mesmo JSON) e acorda em milissegundos; o jogo passou a chamar `https://cthulhu-char-golang.vercel.app`. O `COLD` de 20 s fica como margem.
