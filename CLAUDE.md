# Secret Cultist

Jogo de cartas de dedução social, investigadores contra cultistas (D96, a cara pública desde o D98; os temas históricos do original, liberais contra cultistas ou contra vermelhos, D12, ficam atrás da senha da expansão), jogado em um celular só que passa de mão em mão (5 a 10 lugares na mesma sala). Dá para jogar sozinho ou com poucas pessoas: a IA ocupa os outros lugares (D10).


Idioma da interface: português do Brasil, informal. Comentários no código: inglês.

## Fluxo de trabalho (obrigatório)

1. **Nunca commitar direto na `main`.** Toda mudança começa com um branch novo a partir da `main` atualizada: `git fetch origin && git switch -c tipo/descricao origin/main` (`feat/`, `fix/`, `docs/`, `chore/`, `ci/`).
2. Rodar `scripts/verify.sh` antes de enviar e colar a saída no PR.
3. Abrir PR para a `main` usando o template. O CI (checks, cobertura e e2e no tema escuro) tem que passar.
4. O merge na `main` dispara o deploy de produção. Não existe outro caminho para produção.
5. Mensagens de commit no estilo Conventional Commits, em português.

## Escopo: MVP


- O app é uma página estática, sem backend próprio. O login (D138) é o do Supabase (projeto do lore-enhancer): ninguém joga sem entrar; a conta de visitante (pedestrian) vê só o Secret Cultist; o driver vê tudo, porque só ele recebe a chave da expansão.
- Um aparelho só, passando de mão: sem partida pela internet, sem um celular por jogador. Os jogadores da IA rodam no próprio aparelho, sem servidor e sem modelo de linguagem: são regras e contas no `src/core/` (D10).
- As regras são as do Secret Cultist original (D6). A única diferença é de meio: a votação é em voz alta e o celular só registra o resultado (com IA na mesa, cada pessoa toca no próprio voto: requisito 20).
- Chamadas de rede: o login (D138), e as opcionais das fichas (D94) e da lore (D137); sem as opcionais o jogo funciona igual, e uma sessão guardada abre o jogo sem rede.
- Sem servidor próprio, nem para guardar partidas: as partidas terminadas ficam só no aparelho, e a pessoa exporta um arquivo quando quiser (D23). Fora por enquanto: uma tela de histórico.

## Regras contra alucinação (valem para qualquer IA trabalhando aqui)

A ordem de confiança é: **código e testes rodando agora** > amostras reais gravadas > documentação > memória. Se dois deles discordam, o de cima ganha e o de baixo é corrigido.

1. **Não diga que funciona sem rodar.** Antes de afirmar que algo está certo, rode `scripts/verify.sh` e mostre a saída. Sem saída, a frase certa é "não verifiquei".
2. **Não invente campo da fonte de dados.** O app só pode ler campos que aparecem em `tests/fixtures/source/`. Precisa de um campo novo? Capture a resposta real, grave a amostra, acrescente a checagem em `tests/contract.py`, e só então escreva o código.
3. **Separe sempre o verificado do suposto.** Em resposta, commit e PR, diga o que foi testado e o que não foi. O registro oficial é [`docs/verificacao.md`](docs/verificacao.md): um item só sobe para "Verificado" com comando e data.
4. **Número mora no código.** Limites, intervalos e prazos citados aqui são conferidos contra o código em `src/` por `tests/docs_check.py`. Mudou um, mude o outro no mesmo commit.
5. **Decisão de produto não se presume.** O que já foi decidido, e por quê, está em [`docs/decisoes.md`](docs/decisoes.md). O que não está lá, pergunte. Decisão nova entra lá com data.
6. **Fato de terceiro tem data.** Limite de hospedagem, preço, comportamento de API: tudo isso envelhece. Cite a data em que foi conferido e reconfira antes de depender.
7. **Amostra real não é editada à mão.** Dado inventado para teste usa nome inventado.
8. **Não pule o harness.** O hook em `.claude/settings.json` roda `scripts/verify.sh --quick` quando a tarefa termina e segura o encerramento se falhar. Não desative, não contorne, e não edite um teste só para ele passar: se o teste está errado, explique por quê no PR.
9. **Na dúvida, pare e diga.** Uma resposta incompleta e honesta vale mais que uma completa e inventada.

O que cada peça do harness cobre:

| Peça | Protege contra |
|---|---|
| `scripts/verify.sh` | Afirmar que está certo sem ter rodado nada |
| `tests/unit.cases.mjs`, rodado por `tests/unit.py` e por `tests/core.mjs` | Mexer numa regra do núcleo e quebrar outra sem notar |
| `tests/core.mjs` (os mesmos casos, no Node, sem página) | O núcleo passar a depender de página, rede ou armazenamento sem ninguém notar |
| `tests/contract.py` + `tests/fixtures/source/` | Escrever leitor para um formato de API imaginado |
| `tests/docs_check.py` | Documentação citar número, arquivo ou chave que não existe mais |
| `tests/e2e.py` | Tudo passar isolado e o fluxo real pela interface estar quebrado |
| `tests/pwa.py` | Dizer que o app abre sem internet e avisa de versão nova sem nunca ter visto acontecer |
| `tests/cov.py` (cobertura medida pelo navegador) | Achar que está testado sem estar |
| `tests/guard.py` (no `verify.sh --quick`, D68) | Função nova do `Core` ou botão novo (`data-act`) entrar sem nenhum teste que o toque |
| `scripts/affected.py` (no `verify.sh`, só informa) | Mudar id, `data-act`, classe ou animação da tela sem mexer nos testes de tela que dependem deles |
| `window.__SEED` nos testes de tela (D68) | O e2e e a cobertura mudarem de uma rodada para outra (e entre a máquina e o CI) por causa do sorteio |
| `scripts/check_apis.py` (workflow `APIs`, depois de cada merge e todo dia, D149) | A API de fichas ou a de lore cair e ninguém saber, porque o jogo segue sem elas |
| `scripts/check_production.py` (workflow `Produção`, depois de cada merge) | CI verde e deploy feito, mas a produção servindo outra versão |
| `tsc` em modo `strict` (primeiro passo do `verify.sh`) | Chamar função com o dado errado, ou ler um campo que pode não existir |
| Hook de parada (`.claude/hooks/verify-on-stop.sh`) | Encerrar a tarefa com checagem falhando |
| `docs/verificacao.md` | Tratar suposição como fato |
| `docs/decisoes.md` | Depender da memória de uma conversa |
| `src/core/judge.ts` (o juiz) + `View` + `docs_check.py` | Uma IA ver mais do que o lugar dela veria, ou fazer mais do que a vez dela pede |
| `scripts/ai_bench.mjs` (fora do `verify.sh`) | Dizer que um nível joga melhor que outro sem ter medido |

## Requisitos do produto

Em [`docs/requisitos.md`](docs/requisitos.md), item a item (D143). Mudou um requisito, mude lá; os números e nomes são conferidos pelo `tests/docs_check.py` do mesmo jeito.

## Arquitetura

TypeScript em módulos, build pelo Vite 8.3.3 com TypeScript 7.0.2 (versões exatas no `package.json`). O build junta tudo num arquivo só, `dist/index.html`, com o script e o estilo dentro (plugin `single-file` no `vite.config.js`) e **sem minificar**: o que os testes medem, por nome de função e linha, é o arquivo que vai para o ar. A página gerada leva o commit de origem em `<meta name="app-commit">`. O único outro arquivo que o build emite é `dist/sw.js`, o service worker.

`npm run typecheck` roda o `tsc` em modo `strict`, com `noUnusedLocals`. Nenhum módulo usa `@ts-nocheck` ou `@ts-ignore` (o `docs_check.py` confere). O único `any` é o tipo `Json`, para o que vem de fora.

### `src/core/`: lógica pura

Sem DOM, sem rede e sem armazenamento (conferido pelo `docs_check.py`, e pelo `tests/core.mjs`, que roda o núcleo no Node com `window`, `document`, `localStorage` e `fetch` armados para estourar). É o que testar primeiro e o que reaproveitar se o projeto ganhar backend.

| Módulo | O que tem |
|---|---|
| `src/core/types.ts` | As formas dos dados: `Game`, `Player`, `Law`, `Phase`, `AppState`, `Entry`, `Json` |
| `src/core/game.ts` | As regras: `newGame` (com os lugares da IA e o nível), `revealNext`, `nominate`, `vote`, `presidentDiscard`, `chancellorDiscard`, `askVeto`, `answerVeto`, `investigate`, `endPower`, `execute`, as constantes da mesa e `seeded`/`shuffle` (o acaso entra como função) |
| `src/core/judge.ts` | O juiz entre a partida e as IAs: `viewOf` (o que cada lugar pode saber), `turn`/`botTurn` (de quem é a vez), `botStep` (a jogada da IA, pelas regras), `castVotes` (os votos um a um), `claims`/`say` (o que cada um diz à mesa), `talker`/`talk` (a conversa entre as rodadas), `coach` (as dicas do treinador), `thoughts` (o que as IAs pensavam da pessoa), `suspicion` (a desconfiança ao vivo), `crux` (o ponto crucial) e `trail` (o que uma IA pensou de cada um, momento a momento). Único código que segura a partida inteira e pergunta algo às IAs |
| `src/core/olympus.ts` | Os deuses e o oráculo do Secret Leônidas (D144), com chave própria (`S.oracles`): o deus patrono (`OLYMPIANS`, `olympus`), o narrador de cada decreto (`olympusTell`) e o oráculo de Delfos (`canConsult`, `consult`). Não muda regra nenhuma |
| `src/core/table.ts` | O que a mesa lê de relance e o desafio do dia (D148): `moodOf` (o que cada IA disse da pessoa em voz alta), `turning` (a lei em que a partida virou) e `dailySeed` |
| `src/core/review.ts` | O fim da partida e o treinador, separados do juiz (D143): `coach`, `thoughts`, `suspicion`, `crux`, `review`, `notesScore`, `achievements`, `reputation`. O `judge.ts` os reexporta |
| `src/core/debate.ts` | A conversa em volta das regras, separada do juiz (D143): o debate da acusação (`debateArgs`, `debateVerdict`), dizer o próprio lado, pedir voto, virar um voto. Não pergunta nada às IAs |
| `src/core/ai.ts` | As IAs, cegas de propósito: `decide` responde a pergunta da visão (`decideWhy` dá a mesma resposta com o motivo); `believe` pesa todas as divisões de papéis possíveis pelo que aconteceu (leis, falas, investigações; no extremo, contando o baralho com `drawOdds`); os níveis em `AI` |
| `src/core/words.ts` | As palavras de cada tema (`WORDS`, `words`, `PACKS`): o lado escondido, o líder, os votos, as abreviações |
| `src/core/dice.ts` | As rolagens de d100 do Call of Cthulhu (D94): `roll`, `levelOf` (crítico, extremo, difícil, sucesso, falha, desastre), `ROLL_BONUS`, a ficha de cada lugar (`sheetOf`, vazia quando a fonte não respondeu) e a perícia de cada argumento (`skillForArg`) |
| `src/core/items.ts` | O que o Secret Cultist põe em volta das regras (D115): os itens (`ITEMS`, `dealItems`, `itemOf`), o roubo (`canSteal`, `steal`), as armadilhas dos momentos-chave (`TRAPS`, `springTrap`, `trapsDue`) e a loucura (`mad`). Nada disso muda quem morre, que lei passa ou quem vence |
| `src/core/story.ts` | A história do Secret Cultist (D118): os cenários de cada continente (`SCENES`), os deuses e o dom de cada um ao Sumo Sacerdote (`GODS`), o sorteio (`setScene`), os atos (`actOf`) e o narrador (`narrate`) |
| `src/core/chronicle.ts` | A crônica (D134): uma ou duas frases do narrador a cada lance que a mesa viu (`chronicle`), com o presságio e o sussurro de cada deus (`OMENS`), e o enredo pessoal de quem joga sozinho (`STAKES`, `giveStake`) |
| `src/core/horror.ts` | Mais horror em volta das regras (D120, D121): as manias da loucura (`MANIAS`, `maniaOf`), o Mitos de Cthulhu (`mythosOf`), os documentos de cada ato (`DOCS`), o passado de cada investigador (`PASTS`), o personagem do cenário (`NPCS`), os achados raros (`RARES`), o peso do horror (`HORROR`, `horrorOf`) e a campanha (`CHAPTERS`) |
| `src/core/lorepool.ts` | As frases da lore guardadas no aparelho (D149): `loreKeep` (guarda com os nomes como lacunas), `lorePick` (preenche com os nomes do lance), `readLorePool`, até `LORE_POOL_MAX` por deus e momento |
| `src/core/breaker.ts` | O disjuntor da API de fichas (D95): `breakerState` (fechado, aberto, meio aberto), `breakerAllows`, `breakerFail`, `breakerOk`, `readBreaker`, com o relógio entrando como `now` |
| `src/core/save.ts` | `readGame` e `readState`: lê o que foi guardado, descartando a partida que não fecha |
| `src/core/source.ts` | Os leitores da fonte de dados (`normEntry`, `normEntries`). Único lugar que conhece o formato dela |
| `src/core/index.ts` | O objeto `Core`, que a página usa e os testes exercitam |

### `src/app/`: a página

| Módulo | O que tem |
|---|---|
| `src/app/state.ts` | `S` (o que é guardado), `ui` (o que está na tela: segredo aberto, carta ou jogador escolhido), gravação no `localStorage` e o tema (`applyTheme`) |
| `src/app/format.ts` | `esc` e os acessos ao DOM (`$`, `part`, `valOf`) |
| `src/app/auth.ts` | O login (D138, Supabase Auth do projeto do lore-enhancer): `session`, `login`, `logout`, a conta de visitante (`DEMO`) e a chave da expansão, que só o driver recebe (`openKept`) |
| `src/app/api.ts` | `getJSON` (toda chamada passa por ele, com tempo máximo) e `loadEntries`. Sem fonte configurada, não chama nada |
| `src/app/render.ts` | `render` e as telas de cada fase, a faixa de quem governa, o portão dos segredos (`gateKey`), o que se mexe (só o que acabou de mudar), `toast`, `blurField` |
| `src/app/home.ts` | A tela inicial, separada do `render.ts` (D143): jogo rápido, mesa, tema, opções, regras, partidas guardadas e login |
| `src/app/overlay.ts` | O que aparece por cima por um instante, separado do `render.ts` (D143): carimbo da votação, decreto, poderes, confete, avisos, debate, virar um voto, as rolagens grandes e a história |
| `src/app/art.ts` | Os desenhos, caricaturas em SVG no próprio código: `portrait` (o papel: pássaro liberal de uniforme azul, jacaré cultista de uniforme marrom e quepe preto, o líder de cada tema com carta própria) e `seal` (o símbolo do partido nas leis e no tabuleiro: balança e feixe com machado, sem personagem) |
| `src/app/events.ts` | Um listener delegado por `data-act`; o único lugar que usa `Math.random` no jogo (o `fx.ts` só o usa para o ruído do som); o relógio das IAs (`tick`); os votos e as falas das pessoas numa mesa com IA; o descarte que espera a carta cair e o esconder sozinho (`visibilitychange`, `deviceorientation`) |
| `src/app/fx.ts` | Som (Web Audio, sintetizado), vibração e `later` (espera a animação, ou não espera quando o aparelho pede menos movimento) |
| `src/app/history.ts` | As partidas terminadas guardadas no aparelho (`keep`, `kept`, `wipe`) e o arquivo exportado (`exportGames`: compartilhar onde o celular deixa, senão baixar) |
| `src/app/update.ts` | Registro do service worker, aviso de versão nova (`initUpdates`, `applyUpdate`, `checkNow`) e `builtFrom`, o commit da página |
| `src/main.ts` | Entrada: liga os listeners, expõe `window.__APP`, pinta a tela e registra o service worker |
| `src/env.d.ts` | Declarações de tipo de `window.__APP`; os tipos do Vite vêm por referência |

`src/sw.js` é o service worker. É JavaScript puro, fora dos módulos e do `tsc`: roda em outro contexto, sem página, e o build só o copia para `dist/sw.js` trocando a versão.

Os módulos de `src/app/` se importam em círculo (a tela chama ações, ações repintam a tela). Funciona porque nada é chamado enquanto os módulos carregam: o que roda na carga fica em `src/app/state.ts` (ler o que está salvo e aplicar o tema) e em `src/main.ts`. Código novo não deve chamar função de outro módulo no nível de cima do arquivo.

`window.__APP` expõe `{Core, ui, S}` para teste.

Renderização é `innerHTML` a partir do estado. Todo texto que não veio do próprio código passa por `esc()`. `render()` não repinta a tela se o foco estiver num campo dela, para não derrubar o que a pessoa está digitando.

### Estado no `localStorage`

`secretcultist.v1`: `{ v: 1, names: [...], ai, level, train, assist, pack, notes, game: Game | null, theme, look }`. `pack` é `'vermelho'` no tema tema vermelho (sem o campo, o original); `notes` são as anotações da pessoa na partida em curso (lugar → `'L'` ou `'F'`); `coach` é `true` com as dicas do treinador; `speed` é `'lenta'` ou `'rapida'` (sem o campo, normal); `flip` é `true` com o segredo se fechando ao virar o celular para baixo; `region` é o continente dos nomes e dos bichos (`'americas'`, `'europa'`, `'asia'`, `'africa'`, `'oceania'` ou `'brasil'`; sem o campo, o mundo todo); `dlc` é `true` depois da senha da DLC Brasil. A partida guarda em `trace` cada decisão das IAs com o motivo. As partidas terminadas ficam à parte, em `secretcultist.history.v1`: as últimas 30 (`HISTORY_MAX`), cada uma com a hora em que acabou (`Saved`); sem espaço no aparelho, as mais antigas saem primeiro. `ai` diz, nome a nome, quais lugares são da IA (sem o campo, nenhum); `level` é o nível da IA (sem o campo, médio); `train` é o papel escolhido para treinar (sem o campo, sorteado); `assist` é `true` com a ata ligada. `theme` é `'light'` ou `'dark'`; sem o campo, segue o aparelho. `look` é `'deco'`; sem o campo, o estilo é o pôster. `quiet` é `true` com som e vibração desligados; sem o campo, ligados. A partida inteira fica guardada, inclusive papéis e a ordem do baralho: quem abrir as ferramentas do navegador vê tudo. É um jogo entre amigos na mesma mesa, não um cofre. O que está aberto na tela (`ui`) não é guardado.

## Fonte de dados

O login (D138) fala com o Supabase Auth (`AUTH_URL` em `src/app/auth.ts`, endereço e chave publicável nas variáveis de build `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`): `normSession` lê o token e o papel (`app_metadata.role`), `normSecret` lê a chave da expansão da tabela `game_secrets` (RLS: só `driver`; `sql/auth.sql`). A sessão fica em `secretcultist.session.v1` e a chave do driver em `secretcultist.dlc.v1`; "Sair" apaga as duas. A amostra do token em `tests/fixtures/source/` é inventada (sem acesso ao Supabase daqui); trocar por uma real é pendência. Os testes de tela entram com `window.__AUTH` e a chave com `window.__DLC`, e o `verify.sh` pede `DLC_KEY` (secret do CI, ou o arquivo `.dlc-key`, fora do git).


As fichas de investigador (D94) vêm da API do `cthulhu-char-golang` (`SHEETS` em `src/app/api.ts`): uma por lugar, pedida pela região do continente (`sheetRegion`), lida por `normSheet` de `src/core/source.ts`, com a resposta real gravada em `tests/fixtures/source/` e checada em `tests/contract.py`. O jogo nunca espera por ela, e ela é um adicional: sem resposta, a partida segue como antes das fichas, sem dado e sem ficha na tela. Um disjuntor (D95, `src/core/breaker.ts`, guardado em `secretcultist.sheets.v1`) para de chamar a API depois de falhas seguidas, testa de novo com uma chamada só depois de um tempo, e religa as fichas quando ela volta. As fichas são só do Secret Cultist (D99). Com a API no ar (`healthy`, rota `/health`), o app guarda até `POOL_MAX` fichas por região no aparelho (`secretcultist.sheets.pool.v1`, completadas por `warmSheets`); com ela fora, a partida sorteia dessas. A lore (D137) vem da API do `lore-enhancer` (`LORE` em `src/app/api.ts`, `askLore`): depois de cada lance, o app pergunta a frase daquele momento (`loreAsk`, só com o que a mesa viu), lida por `normLore`, com a resposta real gravada em `tests/fixtures/source/`; se ela chegar em até `LORE_WAIT` (4 s) e nada mais tiver acontecido, toma o lugar da linha da crônica (`retell`). Tem o próprio disjuntor (`secretcultist.lore.v1`); cada frase que chega fica guardada no aparelho (`secretcultist.lore.pool.v1`, D149) com os nomes como lacunas, e com a API fora ou lenta o narrador usa uma dessas; sem nenhuma, a crônica do código conta sozinha. `scripts/check_apis.py` (workflow `APIs`, depois de cada merge e todo dia) diz quando a de fichas ou a de lore cai. `SOURCE`, a outra fonte, continua vazio. Toda leitura passa pelas funções `norm*`.

## App guardado no aparelho (offline e versão nova)

- **O que fica guardado:** `dist/sw.js` (de `src/sw.js`) guarda a página no cache `secret-cultist-page-<versão>` e passa a responder toda abertura do app com essa cópia, sem ir à rede. Arquivos de outros endereços só são guardados se o endereço estiver em `ASSET_HOSTS` (hoje vazio).
- **A fonte de dados nunca passa pelo service worker.** O app precisa dela fresca.
- **Versão:** o build calcula um hash da página sem o carimbo de commit e grava em `sw.js`. Publicação que não muda o app (documentação, testes) gera o mesmo `sw.js` e não incomoda ninguém.
- **Aviso de versão nova:** o `sw.js` novo guarda a página nova e fica esperando. A página mostra "Saiu uma versão nova do app." com o botão "Atualizar agora". Sem o toque, o app aberto continua o mesmo. Fechar o app de vez e abrir de novo também entra na versão nova.
- **Quando procura:** ao abrir, toda vez que o app volta para a frente e a cada 30 min com ele aberto (`CHECK_EVERY`).
- **Onde não vale:** só na página publicada (`import.meta.env.PROD`, por http ou https). No `npm run dev` e na página aberta do disco (como os testes fazem) não há service worker.

## Interface

Uma coluna de até 720 px, pensada para 393 px de largura. Tema claro e escuro, tudo em variáveis CSS no `:root`; por padrão segue o aparelho (`prefers-color-scheme`), e o cartão "Aparência" fixa um dos dois (`S.theme`). A paleta escura aparece duas vezes em `src/styles.css`, uma para "o aparelho pediu" e outra para "a pessoa escolheu"; o `docs_check.py` confere que as duas são iguais.

- **Dois estilos** (D4, D7), escolhidos no cartão "Aparência" (`S.look`), cada um com claro e escuro. **Pôster** (padrão): pôster político dos anos 30, papel envelhecido, tinta preta, azul liberal e vermelho cultista, capitulares condensadas, bordas grossas e sombras duras. **Art déco**: marfim e azul-marinho com filetes dourados (de noite, azul-marinho e dourado), serifa de alto contraste (Didot nos Apple). A paleta escura do art déco também aparece duas vezes, e o `docs_check.py` confere. Fontes só do aparelho, nada baixado.
- **Desenhos próprios** (`src/app/art.ts`), em caricatura: contorno preto grosso, cores chapadas, cabeça grande, expressão exagerada, sobre um foco de luz que funciona em qualquer cor de carta. Liberais são pássaros de uniforme azul, cultistas são jacarés de uniforme marrom e quepe preto, o líder tem carta própria (no Secret Cultist, o Sumo Sacerdote de rosto de tentáculos e mitra dourada). No tema vermelho (D12), o vermelho é um lobo branco de túnica vermelha e budionovka com estrela, e o Líder Vermelho um urso de bigode e cachimbo, de túnica e quepe com estrela. As leis e o tabuleiro ficam com os símbolos, balança para liberal e feixe com machado para o lado escondido (foice e martelo no tema vermelho; livro no Secret Cultist, coruja e lambda no Secret Leônidas). Por continente (D24), no mesmo traço, com a farda de cada lado (liberal de azul e quepe; cultista de marrom e quepe preto; Líder de casaco cinza e púlpito; vermelho de túnica vermelha e budionovka; Líder Vermelho de túnica cáqui, bigode e cachimbo): Américas, condor, urubu, piranha, coiote e urso-de-óculos; África, elefante, hiena, crocodilo-do-Nilo, chacal e rinoceronte; Ásia, tigre, dragão-de-komodo, aranha, raposa e panda; Europa, cegonha, javali, rato, lince e morsa; Oceania, canguru, diabo-da-tasmânia, casuar, ornitorrinco e coala; Brasil (DLC, D27), tucano, bezerro, boi, onça e polvo. Nenhuma arte, logo, personagem ou ilustração de outro jogo.
- **Movimento só no que acabou de mudar** (D9): a fase nova entra deslizando; o papel e o partido investigado aparecem de costas e viram; as leis são distribuídas em leque e as espiadas levantam a ponta; a descartada cai antes de o jogo seguir (os toques esperam); a votação é carimbada na tela; o marcador de rejeições treme; a eliminação escurece a tela e risca o nome; a lupa passa sobre a investigação; no fim, confete na cor de quem venceu e o desenho dele comemorando; a lei aprovada entra no alto da tela com quem a aprovou (D11). Escolher uma carta não mexe nada. Com "reduzir movimento" ligado no aparelho, nada se mexe e nada espera.
- **Nenhum seletor do sistema** (`<select>`): a lista que ele abre é desenhada pelo aparelho, com as cores dele, e já apareceu branca no tema escuro. Escolhas são botões do app. O `docs_check.py` e o `tests/e2e.py` conferem.
- Campos com fonte de 16 px ou mais (o iPhone dá zoom abaixo disso), `viewport-fit=cover` com `env(safe-area-inset-*)`, metas `apple-mobile-web-app-*`.
- O Safari pode limpar o `localStorage` de site sem uso por semanas. Se o app guardar algo que importa, ele precisa de backup em arquivo.

## Testes

```bash
npm ci                       # Vite e TypeScript
pip install -r tests/requirements.txt && playwright install chromium
scripts/verify.sh            # tudo: tipos, build, docs, core, unit, contract, autoteste da checagem de produção, e2e no tema escuro, pwa e cobertura
scripts/verify.sh --quick    # sem o e2e (poucos segundos)
node tests/core.mjs          # os casos do núcleo, sem navegador
node scripts/ai_bench.mjs    # mede os níveis da IA, partidas só de IA (alguns minutos; fora do verify.sh)
npm run dev                  # servidor de desenvolvimento do Vite
```
O `verify.sh` começa pelo `tsc` e pelo build; se um dos dois falha, os testes nem rodam. **Todo teste usa `dist/`**, o que o build gerou: o que é testado é o que é publicado. Todos abrem `dist/index.html` do disco, menos o `pwa.py`, que serve `dist/` por um servidor local (service worker não existe em página aberta do disco). A exceção é o `core.mjs`, que constrói `src/core` sozinho e roda no Node.

Os casos do núcleo ficam em `tests/unit.cases.mjs`. Regra nova entra ali primeiro. Dois executores rodam os mesmos casos: `unit.py` no navegador, contra `window.__APP.Core` da página gerada, e `core.mjs` no Node.

**Cobertura:** com `APP_COVERAGE=1` (o `verify.sh` completo liga sozinho), cada suíte grava quais funções e trechos do script de `dist/index.html` executou. `python3 tests/cov.py` junta tudo e falha abaixo de 93% das funções e 95% do código (D143: o código é a medida que importa; as funções anônimas pequenas travavam tudo no limite). Teste que recarrega a página usa `cov.reload(pg)` em vez de `pg.reload()`.

`e2e.py` abre a página num tamanho de celular, com a rede bloqueada, e joga partidas inteiras pela tela: monta a mesa (nome vazio, repetido, mesa cheia, nome com marcação aparecendo como texto), troca o tema, confere que cada papel só aparece depois do toque, empilha papéis e baralho por `window.__APP.S` para a partida ser sempre a mesma, e passa por rejeições e caos, limite de mandato, os poderes da mesa de 7 (investigar, eleição especial, eliminar), veto recusado e aceito, vitória cultista pelo Líder chanceler vitória liberal pelo Líder eliminado e uma mesa de 5 (o Líder vê o cultista, a 3ª lei cultista deixa espiar), troca de estilo, a lei nova carimbando no tabuleiro e a faixa de quem governa, a ajuda, o segredo que se esconde sozinho, o carimbo da votação, o resumo da partida, o confete; tudo com "reduzir movimento" ligado, e no fim uma rodada com movimento para ver a carta virar, as leis serem distribuídas e o descarte esperar a carta cair. Contra a IA: completa a mesa (com os nomes históricos), escolhe o nível, o papel de treino (cultista) e a ata, confere que a IA aparece pensando sem mostrar segredo, que o celular só abre para a pessoa, que o voto é por pessoa, e joga a partida inteira sozinho (recarregando no meio, e a IA continua sozinha); confere a ata (cada lei e quem votou Ja!), o anúncio de quem aprovou cada lei, as dicas do treinador, a conversa das IAs e, no fim, o que elas pensavam da pessoa; depois, duas pessoas e IAs (votos um a um, e a IA jogando até o fim quando as duas saem). Confere também que a partida volta depois de recarregar, que nada passa da largura da tela e que não há erro de script. Capturas em `tests/shots/`.

`pwa.py` publica o build e depois uma "versão seguinte" e confere: a página fica guardada, a primeira instalação não anuncia nada, o app abre com o site fora do ar, a versão nova é anunciada, o app em uso só troca depois do toque, a cópia antiga é apagada, publicar de novo sem mudar o app não avisa, e fechar e abrir de novo entra na versão que esperava. O build precisa estar num repositório git, porque a tela mostra o commit.

## Publicação

Deploy contínuo pela integração da Vercel com o GitHub: cada PR ganha uma URL de prévia e cada merge na `main` publica em produção, em https://secret-game-gamma.vercel.app. O `vercel.json` manda a Vercel fazer o mesmo que o `verify.sh` e o CI fazem: `npm ci`, `npm run build`, publicar `dist/`. Sem ele, a Vercel pode escolher sozinha outro preset e procurar arquivos que não existem. O `.vercelignore` deixa de fora o que o build não lê.

O build grava o commit em `<meta name="app-commit">`. Na Vercel ele vem da variável `VERCEL_GIT_COMMIT_SHA`; fora dela, do `git`.

A Vercel publica o que chegar na `main` sem olhar o CI. Quem garante que só entra código testado é a proteção do branch `main` exigindo os checks `checks` e `e2e (dark)`. O e2e no tema claro saiu (D47); `python3 tests/e2e.py light` ainda roda à mão.

**Merges em sequência podem deixar a produção numa versão antiga:** a Vercel faz um deploy por merge, e se o mais antigo termina por último ele fica com o endereço de produção. Por isso:

- Mesclar um PR por vez e esperar o deploy, ou mesclar só o último quando um PR já contém os anteriores.
- O workflow `Produção` roda `scripts/check_production.py` depois de cada push na `main`: espera a produção mostrar o carimbo do commit que entrou e **continua olhando por 5 min**. Falhou: na Vercel, promover o deploy do commit mais recente da `main`, ou fazer um novo merge. O endereço vem da variável `APP_PROD_URL` do repositório (Settings → Secrets and variables → Actions → Variables), com https://secret-game-gamma.vercel.app como padrão. Se o endereço servir outro site (página sem carimbo) ou pedir login da Vercel, o script diz isso com todas as letras em vez de só esperar: o padrão antigo apontava para o app de outra pessoa com nome parecido (D8).
- Em PR o mesmo script só informa qual commit a produção está servindo (`--report`) e nunca falha. `--selftest` testa o script contra um servidor local e roda no `verify.sh`.

**Publicar não troca o app de quem já abriu.** O aparelho mostra a cópia guardada até a pessoa tocar em "Atualizar agora".

No iPhone: abrir a URL no Safari → Compartilhar → Adicionar à Tela de Início.
