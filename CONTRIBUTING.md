# Contribuindo

## Fluxo

1. Crie um branch a partir de `main`: `feat/...`, `fix/...`, `docs/...` ou `chore/...`.
2. Faça commits pequenos, com mensagem no estilo [Conventional Commits](https://www.conventionalcommits.org/pt-br/).
3. Rode `scripts/verify.sh` antes de abrir o PR e cole a saída nele.
4. Abra o PR para `main`. O CI confere os tipos, faz o build e roda docs, núcleo, unitários, contrato, o ponta a ponta nos temas claro e escuro, o teste do service worker e a cobertura.
5. O merge na `main` publica em produção. Nada vai direto para a `main`. Mescle um PR por vez e espere o deploy.

## Regras do código

- `src/core/` é puro: sem DOM, sem rede, sem `localStorage`. As regras do app moram ali. O `docs_check.py` e o `tests/core.mjs` reprovam se isso mudar.
- Todo acesso à fonte de dados passa pelas funções `norm*` de `src/core/source.ts`. Se o formato mudar, o conserto é ali.
- TypeScript em modo `strict`, sem `@ts-ignore` e sem `@ts-nocheck`. `any` só para o que vem de fora (o tipo `Json`).
- Em `src/app/`, não chame função de outro módulo no nível de cima do arquivo: os módulos se importam em círculo e isso só funciona porque nada roda durante a carga. O que precisa rodar na carga vai em `src/main.ts` (ou em `src/app/state.ts`, para ler o que está salvo).
- Módulo novo em `src/` entra na tabela de "Arquitetura" do `CLAUDE.md` (o `docs_check.py` cobra).
- Texto que não veio do próprio código sempre passa por `esc()` antes de entrar no HTML.
- Nenhum `<select>`: escolhas são botões do app.
- O service worker nunca responde pela fonte de dados, e uma versão nova nunca assume sem o toque da pessoa.
- Regra nova do núcleo: o caso entra em `tests/unit.cases.mjs` primeiro.
- Campo novo da fonte: grave antes uma resposta real em `tests/fixtures/source/` e cubra em `tests/contract.py`.
- Decisão nova de produto ou de arquitetura entra em `docs/decisoes.md`. O que foi verificado (e o que não foi) entra em `docs/verificacao.md`.

## Trabalhando com IA

As regras estão em `CLAUDE.md`, na seção "Regras contra alucinação". A principal: ninguém, pessoa ou IA, escreve "funciona" sem a saída do `scripts/verify.sh`.
