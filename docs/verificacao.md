# Verificação

O que foi verificado, como e quando; e o que não foi. Um item só entra em "Verificado" com o comando (ou a observação) e a data.

## Verificado

| Afirmação | Como | Quando |
|---|---|---|
| As regras do jogo (papéis, eleição, caos, limite de mandato, poderes, veto, vitórias, estado salvo) passam nos casos sem página | `node tests/core.mjs` | 12/10/2026 |
| A página gerada passa nos mesmos casos | `python3 tests/unit.py` | 12/10/2026 |
| A documentação bate com o código, inclusive os números das regras | `python3 tests/docs_check.py` | 12/10/2026 |
| Partidas inteiras pela tela (os dois lados vencendo), nos dois temas, no Chromium em tamanho de celular | `python3 tests/e2e.py dark` e `light` | 12/10/2026 |
| O app abre sem internet e troca de versão com um toque, no Chromium | `python3 tests/pwa.py` | 12/10/2026 |
| As IAs: cada visão só tem o que o lugar sabe, as respostas ficam nas opções, partidas só de IA em todo nível e toda mesa terminam e podem ser salvas, liberais não mentem | `node tests/core.mjs` (105 casos) | 26/10/2026 |
| Jogar sozinho contra a IA pela tela, do começo ao fim, recarregando no meio; duas pessoas com IA, voto por pessoa | `python3 tests/e2e.py dark` e `light` | 26/10/2026 |
| Os níveis da IA balanceados: com a mesa no mesmo nível, liberais vencem 47% a 51%; medidos em 6.400 partidas só de IA (números na D10) | `node scripts/ai_bench.mjs 400` | 26/10/2026 |
| Treino (papel escolhido), nomes históricos, ata com quem votou Ja! e o anúncio de quem aprovou cada lei, pela tela | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (109 casos) | 27/10/2026 |
| Tema tema vermelho (palavras, nomes, desenhos, nada de "cultista" na tela), anotações com o que a pessoa sabe já marcado | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (114 casos) | 27/10/2026 |
| Votos variados (temperamento) e níveis ainda balanceados: liberais 47% a 53% com a mesa no mesmo nível | `node scripts/ai_bench.mjs 400` | 27/10/2026 |
| Conversa das IAs, dicas do treinador, o que as IAs pensavam de você, velocidade, anotações na lista de jogadores | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (123 casos) | 27/10/2026 |
| Painel lateral de anotações (celular e tela larga), desconfiança ao vivo, nenhum "undefined" ou "NaN" na tela em toda a partida contra a IA | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (124 casos) | 27/10/2026 |
| Ponto crucial no fim e ao vivo, para quem é do lado escondido | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (125 casos) | 27/10/2026 |
| Balanceamento com a conversa: liberais 46% a 47% com a mesa no mesmo nível | `node scripts/ai_bench.mjs 300` | 27/10/2026 |
| Raciocínio das IAs: aviso antes de mostrar, cada decisão com motivo e opções, trilha de cada jogador, nada de "undefined" no painel; explicar não muda nenhuma decisão | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (130 casos); 120 partidas só de IA iguais antes e depois, mesmas sementes | 27/10/2026 |
| A tela da partida não esconde a jogada: fase antes das dicas, nada embaixo da barra, um painel por vez, anúncio e carimbo fora da fase, contraste dos votos de 4,5:1 ou mais nos dois temas | `python3 tests/e2e.py dark` e `light` | 27/10/2026 |
| Menos rolagem: faixa da mesa no topo, "Mais opções" e regras fechadas, botão de começar diz quantos faltam e completa com IA, ajuda com texto, fim de jogo em abas | `python3 tests/e2e.py dark` e `light` | 27/10/2026 |
| Jogadas boas e ruins no fim, só com a assistência (por pessoa, sozinho ou com várias pessoas; botão para ligar quando está desligada); jogada errada sem ter como saber não conta como ruim | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (136 casos) | 27/10/2026 |
| Mesa menor num toque (tira as últimas IAs, nunca pessoa), limpar a mesa com dois toques; o celular de tela para baixo só fecha o segredo com a opção ligada | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (137 casos) | 27/10/2026 |
| Partidas terminadas guardadas no aparelho (só as que fecham, as últimas 30), exportadas num arquivo com tudo, apagadas com dois toques | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (139 casos) | 27/10/2026 |
| Depois de uma fala de IA, a próxima espera mais e o que o governo disse fica escrito; a fase de uma IA nunca mostra o portão do segredo; fala de IA não faz a fase entrar de novo nem fecha segredo | `python3 tests/e2e.py dark` e `light` | 27/10/2026 |
| IA não ingênua: nenhuma jogada vira certeza, teste do chanceler, disfarce do Líder, espiada conferida, indicações, votos (extremo), eliminação e eleição especial; balanceamento: liberais 52% a 55% com a mesa no mesmo nível | `node tests/core.mjs` (145 casos); `node scripts/ai_bench.mjs 200` | 27/10/2026 |
| Nomes e bichos por continente: cada lista sem repetir e com nomes para uma mesa cheia; trocar o continente troca os nomes na mesa e os desenhos; a partida guarda o continente | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (152 casos) | 27/10/2026 |
| Galeria com todos os desenhos (6 continentes, 2 temas, 3 papéis, com o nome do bicho), sem passar da largura da tela | `python3 tests/e2e.py dark` e `light` | 27/10/2026 |
| Denunciar e abonar pelo caderno (um por um e tudo de uma vez, uma vez por rodada), reações das IAs, personalidades sorteadas por partida, fala pesando o dobro com a ata; balanceamento com tudo isso: liberais 51% a 54% com a mesa no mesmo nível | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (162 casos); `node scripts/ai_bench.mjs 200` | 28/10/2026 |
| DLC Brasil: só com a senha, nomes e bichos próprios (tucano, bezerro, boi, onça, polvo), galeria com o Brasil depois da senha; condor no lugar da onça liberal | `python3 tests/e2e.py dark` e `light` | 28/10/2026 |
| Painel de raciocínio removido (o motivo segue gravado); acerto das anotações no fim e nas jogadas boas; denunciar inimigos; votos na língua do continente; faixa com as cores do continente | `python3 tests/e2e.py dark` e `light`; `node tests/core.mjs` (168 casos) | 28/10/2026 |
| Depois de um veto aceito, o baralho é reabastecido | caso em `tests/unit.cases.mjs` | 26/10/2026 |
| A produção (https://secret-game-gamma.vercel.app) serve o commit da `main` | Página lida: `meta app-commit` = `6e6e539` | 13/10/2026 |

## Não verificado

| Afirmação | Por que não | Como verificar |
|---|---|---|
| O service worker no Safari do iPhone e no app instalado na Tela de Início | Os testes rodam no Chromium | Abrir a produção no iPhone, ligar o modo avião e abrir de novo |
| Uma partida de verdade, com pessoas passando o celular | Ninguém jogou ainda | Jogar uma partida e anotar o que travou |
| As animações, a fonte Didot do art déco e os desenhos no Safari do iPhone | Os testes rodam no Chromium/Linux | Abrir no iPhone e jogar uma rodada em cada estilo |
| Som, vibração e o esconder ao virar o celular num aparelho de verdade | Os testes rodam no Chromium, sem alto-falante nem sensor; o iPhone não vibra por página e pede permissão para o sensor | Jogar uma rodada num Android e num iPhone |
| A IA contra gente de verdade: se o nível parece certo, se as falas soam naturais | Só foi medida contra ela mesma | Jogar algumas partidas sozinho em cada nível |
| A mesa de 10 jogadores na tela | O e2e joga com 7; com 10 só as regras foram testadas | Montar uma mesa de 10 e jogar |


## IA: leis decisivas — 2026-10-29

- Verificado: 198/198 casos de `tests/unit.cases.mjs` executados diretamente no Node v24 com remoção nativa de tipos. Cópias temporárias dos módulos de `src/core/` tiveram apenas os imports relativos ajustados para `.ts`. Inclui 30 casos novos nos dois níveis, nos três papéis, para descarte vencedor, veto defensivo, resposta ao veto e opções válidas.
- Verificado: `python3 tests/docs_check.py`: 216/216 documentation claims hold (antes desta anotação; repetir após editar docs).
- Não verificado: build Vite, typecheck, navegador, cobertura e benchmark de vitórias. `bash scripts/verify.sh` terminou com código 3: `verify: Playwright ou o Chromium dele não estão instalados (pip install -r tests/requirements.txt && playwright install chromium)`. `npm ci --offline` falhou com ENOTCACHED para Vite; clone Git falhou por indisponibilidade do proxy. Fontes obtidas pelo conector GitHub.

## IA: revisão ampliada — 2026-10-29

Verificado com `PYTHONPATH=/tmp/secret-game-python PLAYWRIGHT_BROWSERS_PATH=/tmp/secret-game-browsers bash scripts/verify.sh`, após instalar as dependências e recuperar os metadados Git da main:

```text
ok types
ok build
ok docs 216/216 documentation claims hold
ok core 234/234 checks passed without a browser
ok unit 234/234 checks passed
ok contract 0/0 (nenhuma resposta real gravada; não há mudança de fonte)
ok prod 16/16 production-check cases behave
ok e2e-dark
ok e2e-light
ok pwa 18/18 offline and update checks passed
ok coverage 96.8% das funções, 97.4% do código
verify: tudo passou
```

O registro anterior de dependências ausentes foi superado: a instalação e o clone funcionaram com a permissão de rede sandboxed. A primeira execução completa encontrou somente a identificação `dev` da cópia sem Git; a execução acima, com metadados Git reais e sem alterar o teste, passou. Log integral no workspace: `/workspace/ai-verify.log`.

Benchmark: `node scripts/ai_compare.mjs /tmp/ai-before/index.ts 60`, baseline `58bf7c6dd29975f83ca946d717989d11bc8f8367`. 480 partidas concluídas, zero travamentos; resultados e limites da amostra em D31. Não verificado: uso em aparelho físico, superioridade estatística geral, CI remoto e deploy. Criação de branch remota pelo conector foi negada com HTTP 403; alterações e commit permanecem locais.

## Acusações e animações — 2026-10-29

Verificado: `PYTHONPATH=/tmp/secret-game-python PLAYWRIGHT_BROWSERS_PATH=/tmp/secret-game-browsers bash scripts/verify.sh` terminou com código 0, após D32:

```text
ok types
ok build
ok docs 216/216 documentation claims hold
ok core 238/238 checks passed without a browser
ok unit 238/238 checks passed
ok contract 0/0 (sem alteração de fonte)
ok prod 16/16 production-check cases behave
ok e2e-dark
ok e2e-light
ok pwa 18/18 offline and update checks passed
ok coverage 97.1% das funções, 97.6% do código
verify: tudo passou
```

Log completo: `/workspace/ai-followup-verify.log`. Os casos novos mostram aumento da suspeita sobre o acusador insistente, limite do efeito, ausência da penalidade com evidência na ata e respostas explícitas. O teste anterior de repetição foi atualizado porque D32 acrescenta justamente a consequência pedida: antes todas as probabilidades ficavam idênticas; agora muda a credibilidade do acusador, sem tratar a repetição como prova contra o alvo.

E2E cobre os avisos para os dois poderes, nomes escapados, resultado da investigação fora do DOM até abrir o portão e animações ativas em ambos os temas. Capturas revisadas a 393 px: `tests/shots/power-investigate-dark.png` e `tests/shots/power-execute-dark.png`; o fluxo principal também roda com movimento reduzido. Não houve teste em aparelho físico.

Benchmark final: `node scripts/ai_compare.mjs /tmp/secret-game-checkout/src/core/index.ts 60`, baseline main `58bf7c6dd29975f83ca946d717989d11bc8f8367`. 480 partidas, zero travamentos. Vitórias atuais L/F por nível, em 60 partidas por lado: fácil 37/25; médio 37/27; difícil 32/31; extremo 37/30. Amostra descritiva, sem demonstrar melhora universal. Dados completos em `/workspace/ai-comparison-final.jsonl`.

As novas tentativas de criar a branch remota continuaram negadas com HTTP 403. Nenhuma alteração foi publicada ou implantada.

## Rodada social e UI — em validação, 2026-10-29

Base: main `3bf90ec` (PR #36), preservada. TypeScript e 258 casos do núcleo passaram antes da inclusão das campanhas; a validação está sendo repetida após essa inclusão. A primeira execução completa desta rodada parou nos dois e2e por um erro do teste novo: `saved` era um dicionário naquele ponto, e a checagem o chamou como função. A checagem foi corrigida para ler o armazenamento diretamente. O mínimo de cobertura foi mantido. O commit desta etapa registra trabalho em andamento; não é declaração de aprovação da suíte completa.

## iPhone, resumo e Diário — 2026-10-29

Base: main `69e0397` (PR #37). Pedido confirmado: o botão de denúncia funcionava no iPhone; o defeito era visual. As mudanças usam SVGs e caixas fixas de 44 px. O Diário mostra o texto exato das falas públicas de Game.log; um teste confirma que o motivo privado não aparece na transcrição. O rodapé mantém apenas um resumo persistente com interlocutores. O resumo final usa títulos ligados aos acontecimentos, sem “Momento N”.

Comando: `PYTHONPATH=/tmp/secret-game-python PLAYWRIGHT_BROWSERS_PATH=/tmp/secret-game-browsers bash scripts/verify.sh`. Saída resumida da execução completa:

```text
ok types
ok build
ok docs 216/216 documentation claims hold
ok core 259/259 checks passed without a browser
ok unit 259/259 checks passed
ok contract 0/0 (sem mudança de fonte externa)
ok prod 16/16 production-check cases behave
ok e2e-dark
ok e2e-light
ok iphone (Chromium): touch targets, focused editor, accusation, persistent summary, exact public diary, contextual ending
ok pwa 18/18 offline and update checks passed
ok coverage 97.3% das funções, 97.8% do código
verify: tudo passou
```

Log: `/workspace/iphone-verify-final.log`. Depois de explicitar a cor dos ícones no tema selecionado, o build e o teste móvel foram repetidos. `tests/iphone.py chromium` passou. A suíte completa executa esse caso antes de medir cobertura, sem reduzir os mínimos.

Não verificado: aparelho físico e WebKit/Safari. O WebKit foi baixado, mas o ambiente não tem todas as bibliotecas nativas para iniciá-lo; bibliotecas extraídas em /tmp ainda não resolveram o lançamento. Esse impedimento é do ambiente e não foi tratado como teste aprovado. O teste aceita `python3 tests/iphone.py webkit` num ambiente preparado.

## Avisos de reputação — verificação final, 2026-10-29

A versão com os avisos de reputação passou em `PYTHONPATH=/tmp/secret-game-python PLAYWRIGHT_BROWSERS_PATH=/tmp/secret-game-browsers bash scripts/verify.sh`:

```text
ok types
ok build
ok docs 216/216 documentation claims hold
ok core 261/261 checks passed without a browser
ok unit 261/261 checks passed
ok contract 0/0 (sem mudança de fonte externa)
ok prod 16/16 production-check cases behave
ok e2e-dark
ok e2e-light
ok iphone (Chromium)
ok pwa 18/18 offline and update checks passed
ok coverage 96.9% das funções, 97.6% do código
verify: tudo passou
```

Log integral: `/workspace/reputation-verify.log`. O teste móvel também confere a presença do aviso compacto no rodapé e da explicação no Diário. Os casos novos do núcleo provam que os avisos dependem apenas de coerência e reações públicas e não mudam ao trocar papéis secretos.

Capturas móveis revisadas: `tests/shots/iphone-notes-chromium.png` e `tests/shots/iphone-diary-chromium.png`. Botões alinhados e transcrição escapada; o texto de teste com marcação HTML aparece como texto. WebKit e aparelho físico continuam não verificados: o lançamento do WebKit ainda encontra bibliotecas nativas ausentes. O PR #38 reúne as alterações e mantém explícita essa limitação.
