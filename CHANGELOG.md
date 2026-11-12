# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões: [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Corrigido
- Ícones e dimensões dos botões de anotação e denúncia no iPhone.
- Resumo final com títulos naturais, nomes e consequências da partida, sem números de “momento”.
- IA difícil e extrema priorizam leis decisivas sobre blefes, reputação e erros aleatórios, e usam o veto disponível para bloquear uma lei que daria vitória ao adversário.

### Adicionado
- A história do Secret Cultist vira capítulo (D159): título de cada ato, a fala do narrador surgindo frase a frase e cada documento como um papel de verdade (telegrama, recorte, diário, relatório, página de livro, carta).
- Reputômetro (as estrelas) liga e desliga também dentro da partida, ao lado do botão do desconfiômetro.
- Desconfiômetro unificado: uma chave só liga e desliga o ponteiro, a barra de cada IA e o momento que mais fez a desconfiança subir, nas opções e dentro da partida (antes eram dois controles: "desconfiança ao vivo" e "desconfiômetro").
- Avisos simples de reputação no rodapé e no Diário, baseados em coerência e reações públicas, sem pontuação única.
- Diário público com o texto completo das falas e respostas; rodapé com resumo persistente de quem falou sobre quem.
- Caderno com motivos privados, fatos e palpites; memória social da IA, campanhas por votos e resumo dos momentos decisivos.
- Mais falas por personalidade, respostas a contradições e votos e feedback público das acusações.
- Avisos animados de investigação e eliminação para pessoas e IAs, com nomes e sem revelar segredos.

### Melhorado
- Arma animada na eliminação, lupa sobre o nome na investigação e card Sim brasileiro somente verde e amarelo.
- Acusações insistentes sem novos fatos afetam a credibilidade do acusador e recebem respostas específicas da mesa.
- Dedução numérica em partidas longas, retenção de fatos conhecidos e resistência a acusações repetidas.
- Votos na zona do líder, proteção do líder conhecido e uso de aliados descobertos por investigação.
- Decisões sobre caos com uma espiada privada válida, preservação de leis vencedoras e simulações de blefe sem inventar a mão presidencial.
- Reaproveitamento de cálculos dentro de cada decisão e ferramenta para comparar versões da IA por lado, nível e semente.

## [0.23.0]

### Adicionado
- Denunciar à mesa pelo caderno: 📣 denuncia e 👍 abona um jogador, e "Denunciar inimigos" acusa todos do outro lado de uma vez.
- No fim, quantos papéis você acertou nas anotações; cada acerto conta como jogada boa. Cada IA diz se concorda, não sabe ou discorda, e o acusado nega.
- As IAs levam em conta o que se fala na mesa, e pesam o dobro quando a ata confirma.
- Personalidades das IAs, sorteadas a cada partida: certinho, desconfiado, cético, crítico, centrado, blefador e caótico.
- DLC Brasil, liberada por senha: nomes de políticos brasileiros e bichos próprios (tucano, bezerro, boi, onça e polvo).
- Votos na língua do continente (¡Sí!, Sim!, Hai!, Shì!, Ndiyo!, Yes!) e uma faixa com as cores do continente nas cartas e nas leis.
- Nomes novos na expansão.

### Mudado
- O liberal das Américas agora é o condor, no lugar da onça.

### Removido
- O painel "Raciocínio das IAs". O motivo de cada decisão continua gravado e vai no arquivo exportado.

### Corrigido
- O resumo do fim não repete mais a linha do voto quando o mesmo governo foi votado duas vezes.

## [0.22.0]

### Adicionado
- Galeria: "Ver todos os desenhos", no cartão do tema, mostra cada continente com os bichos dos dois temas.

## [0.21.0]

### Adicionado
- Continente da partida: Mundo, Américas, Europa, Ásia, África ou Oceania. Muda os nomes das IAs e os bichos dos cinco papéis.

## [0.20.0]

### Adicionado
- Suas partidas: toda partida terminada fica guardada no aparelho (as últimas 30), e dá para exportar um arquivo com elas para calibrar a IA.

## [0.19.0]

### Alterado
- A IA não é mais ingênua: nenhuma jogada sozinha vira certeza. No difícil e no extremo ela conhece o teste do chanceler (e testa), o Líder que se disfarça com lei liberal no começo, confere a espiada com a mão do presidente e lê indicações, eliminações e eleições especiais. O extremo também lê os votos. Os cultistas se adaptam a isso.

### Corrigido
- Um liberal que testava o chanceler virava 100% cultista para a IA.
- A IA muito desconfiada rejeitava todo governo na primeira rodada.

## [0.18.0]

### Alterado
- Depois que uma IA diz o que recebeu, a próxima espera mais. O que o último governo disse fica escrito abaixo da mesa.

### Corrigido
- Às vezes aparecia o botão para ver a carta de uma IA.
- A tela da fase tremia e entrava de novo a cada fala de IA, e um segredo aberto ou um voto se perdia.

## [0.17.0]

### Alterado
- "Lugares na mesa" também diminui a mesa: tira as últimas IAs num toque. "Limpar a mesa" tira todos, com dois toques.
- Virar o celular para baixo não fecha mais o segredo, a não ser que você ligue isso em "Aparência". Deitado, o sensor se enganava.

## [0.16.0]

### Adicionado
- No fim, com a assistência ligada: as suas jogadas boas e ruins, com o porquê. Cada jogada é julgada pelo que deu e pelo que dava para saber na hora.

## [0.15.0]

### Alterado
- A mesa toda numa faixa no alto da partida: presidente, chanceler, quem saiu e o que você sabe ou marcou de cada um.
- Tela inicial mais curta: "Mais opções" guarda papel, velocidade, treinador e ata; "Como joga" vem fechado.
- O botão de começar diz quantos faltam e oferece completar com a IA.
- O botão de ajuda diz o que é: "Como funciona esta fase".
- Fim de jogo em abas: Resultado, Resumo e Registro.
- Botão desativado fica tracejado, em vez de vermelho apagado.

## [0.14.0]

### Alterado
- Na partida, o que você tem que fazer vem primeiro; a dica do treinador vem depois.
- Anotações e Raciocínio abrem por uma barra embaixo, que não cobre mais o jogo; um painel por vez.
- Ja! e Nein! com o mesmo peso, cada um na cor do seu lado; o escolhido fica cheio e com ✓.
- O anúncio da lei e o carimbo da votação aparecem em cima da faixa de quem governa, não da jogada; os avisos curtos ficam na barra de baixo.

### Corrigido
- Texto ilegível sobre azul e vermelho no tema escuro (votos, papéis, tabuleiro).

## [0.13.0]

### Adicionado
- Raciocínio das IAs (para achar bug): o que cada IA pensa de cada jogador, o que mexeu nessa conta e o motivo de cada decisão, com as opções que ela comparou. Mostra os papéis: durante a partida, só depois de um aviso.

### Corrigido
- A cobertura contava errado os caracteres depois de um emoji no script (o navegador conta em UTF-16).

## [0.12.0]

### Adicionado
- Ponto crucial: para quem é cultista, Líder, vermelho ou Líder Vermelho, o momento que mais fez a desconfiança subir, no fim e ao vivo.

## [0.11.0]

### Adicionado
- Anotações num painel lateral, aberto por uma aba na borda da tela (fixo ao lado em tela larga).
- Desconfiança ao vivo: quanto cada IA desconfia de você agora, liga e desliga.
- As IAs conversam entre as rodadas: "Desconfio de X", "Confio em Y".
- Dicas do treinador: a chance da mão que o presidente disse, se a história fecha, quem parece mais suspeito, e como a mesa te vê.
- No fim, o que cada IA pensava de você, lei a lei.
- Velocidade da IA: lenta, normal ou rápida.

### Corrigido
- "undefined" na tela "Vez da IA" quando uma IA ia falar.

## [0.10.0]

### Adicionado
- Tema tema vermelho: vermelhos e Líder Vermelho como time escondido, votos Da!/Niet!, lobo branco e urso, estrela nas leis.
- Anotações da pessoa: marcar cada jogador como Libs, Cults (ou Coms); o que ela sabe de certeza já vem marcado.
- Cada IA com um temperamento próprio: os votos variam, menos unanimidade.

### Alterado
- Nomes das IAs mais conhecidos.
- Nível fácil recalibrado.

## [0.9.0]

### Adicionado
- Treino contra a IA: escolher o próprio papel (liberal, cultista ou Líder).
- As IAs com nomes de políticos dos anos 30, liberais e cultistas misturados, sorteados (o nome não diz o papel).
- Assistência: ata com cada lei, quem governou e quem votou Ja!, e a soma por jogador.
- A lei aprovada aparece no alto da tela: "A e B aprovaram lei cultista".

## [0.8.0]

### Adicionado
- Jogar sozinho ou com poucos contra a IA: "+ IA" e "Completar a mesa até" na mesa, quatro níveis (fácil, médio, difícil, extremo).
- O juiz: cada IA só recebe o que o lugar dela saberia e só responde a pergunta da vez.
- Níveis balanceados: com a mesa toda no mesmo nível, cada lado vence perto de metade das partidas (medido em 6.400 partidas só de IA). Cultistas do difícil para cima pensam em como a mesa vai ver cada jogada.
- Com IA na mesa, voto por pessoa e todos os votos no registro; quem governou, investigou ou espiou pode dizer à mesa o que viu (ou mentir, ou calar).
- No resumo do fim, as leis que cada governo tirou e passou e o que cada um disse.
- A indicação do chanceler entra no registro.

### Corrigido
- Depois de um veto aceito, o baralho não era reabastecido: o presidente seguinte podia tirar menos de 3 leis (ou nenhuma).

## [0.7.0]

### Adicionado
- Animações: carta do papel virando, leis distribuídas em leque, descarte caindo, carimbo da votação, marcador de rejeições tremendo, eliminação escurecendo a tela e riscando o nome, lupa na investigação, espiada levantando a ponta, confete e o vencedor comemorando no fim.
- Som e vibração, com um botão para desligar.
- Resumo da partida no fim, com o que cada investigação mostrou de verdade.
- Segredo que se esconde sozinho quando o app sai da tela ou o celular é virado para baixo.
- Ajuda de cada fase no botão "?".
- Desfazer o último toque na indicação e na votação.

## [0.6.1]

### Alterado
- Na carta do cultista, os aliados aparecem separados: o Líder numa linha, os outros cultistas noutra.

## [0.6.0]

### Adicionado
- Estilo art déco (claro e escuro), escolhido em "Aparência".
- Desenhos próprios em caricatura: liberais como pássaros de uniforme, cultistas como jacarés de uniforme, carta própria do Líder (naja de casaco gritando num púlpito). As leis e o tabuleiro continuam com a balança e a caveira.
- Animações: fase nova, segredo virando como carta, lei carimbando no tabuleiro. Desligadas com "reduzir movimento".
- Faixa com presidente, chanceler e rejeições sempre à vista; tela de passar o celular mais clara; histórico recolhível.

### Alterado
- Modo escuro com sombras e contraste revisados.

## [0.5.0]

### Alterado
- Baralho do jogo original: 11 leis cultistas e 6 liberais (era 9 e 8).
- Regras do jogo original: liberais vencem com 5 leis; com 5 ou 6 jogadores o Líder conhece o cultista; poderes pelo tabuleiro da mesa (5–6, 7–8, 9–10).

### Adicionado
- Eleição especial.

## [0.4.0]

### Alterado
- Visual de pôster político dos anos 30: papel creme, faixa preta, azul e vermelho, capitulares condensadas, cartas de lei com selo, papel secreto em cartaz.
- Votação: o celular registra só se o governo foi eleito ou rejeitado.

## [0.3.0]

### Alterado
- Nomenclatura do Secret Cultist: Liberal × Cultista, Líder, votos Ja!/Nein!, nome do app, endereço e chave do aparelho (`secretcultist.v1`; partidas salvas com o nome antigo não são lidas).

### Adicionado
- Crédito e licença do Secret Cultist (CC BY-NC-SA 4.0) na tela inicial e no README.

## [0.2.0]

### Adicionado
- O jogo Líder Vermelho Secreto: mesa de 5 a 10, papéis em segredo, eleição, mão do presidente e do chanceler, caos, limite de mandato, poderes (investigar, espiar, eliminar), veto, vitórias pelos dois lados, partida guardada no aparelho.

### Removido
- A lista de exemplo do modelo (itens com valor e total).

## [0.1.0]

### Adicionado
- Começo a partir do modelo de arquitetura: página estática em TypeScript com build pelo Vite, núcleo puro, testes (núcleo no Node e no navegador, contrato, documentação, ponta a ponta, service worker, cobertura), CI, deploy na Vercel e checagem de produção.
