# API de lore

Registro da conversa de 2026-11-08. Nada disto está feito; é o plano para quando o Lucas quiser tirar a lore do código.

## Onde estamos hoje

- A lore mora no código: cenas e deuses em `src/core/story.ts`, documentos e personagens em `src/core/horror.ts`, armadilhas em `src/core/items.ts`, a crônica (presságios, sussurros e enredos pessoais) em `src/core/chronicle.ts` (D134).
- Funciona sem rede e sem servidor, como o resto do app (D10). Isso continua sendo a reserva de qualquer coisa que vier depois.

## Caminhos discutidos

1. **Arquivos em memória.** A lore em JSON, por deus e por cena, embutida no build ou servida pela API Go com `go:embed`. Rápido, não cai, roda offline. É o passo mais simples se a ideia for só editar lore sem mexer no código do jogo.
2. **Microsserviço Python de lore com Supabase + pgvector** (o preferido do Lucas). O Supabase já guarda a autenticação do app 8 lados.
   - Serve para qualquer campanha: o Secret Cultist e os temas da expansão. Cada área de conhecimento tem a sua tabela ou partição.
   - `POST /ingest`: recebe texto (um conto, um verbete), corta em trechos, classifica o tipo (lugar, presságio, objeto, fala, ritual) e grava com o embedding. Protegido com o login do Supabase. O Claude pode disparar a ingestão chamando esse endpoint.
   - `GET /lore?area=&god=&moment=`: busca os trechos vizinhos e devolve lore pronta para o momento do jogo (abertura, lei, eliminação, Ato II...).
   - Embeddings locais e grátis: `sentence-transformers` com um modelo multilíngue pequeno.
3. **Gerar texto novo** (descartado por agora, ver D136). Busca semântica sozinha não escreve, só acha o que já existe. Opções sem pagar API de modelo:
   - moldes com lacunas preenchidos com os trechos achados (coerente, é recombinação);
   - cadeia de Markov treinada nos contos (texto novo, meio estranho: bom para sussurro de cultista e grimório);
   - **um modelo pequeno rodando local com Ollama** (o Lucas achou o mais promissor): sem custo por chamada, só a máquina; o RAG passa os trechos e o modelo escreve a frase.

## Decidido em 2026-11-09 (D136)

- **Sem Ollama.** Um modelo rodando precisa de servidor ligado o tempo todo, e não vale a pena agora.
- **API Python com busca por etiquetas, sem vetor no começo.** Cada trecho entra com etiquetas (campanha, área, deus, momento, tipo) e a busca é filtro mais a busca de texto do Postgres (`tsvector`, em português). A frase sai da recombinação de trechos em moldes. Roda no Vercel, sem custo por chamada.
- **A coluna `embedding` existe desde o início, vazia.** Se a busca por etiqueta ficar pobre, liga-se o vetor depois, de preferência com o embedding feito pelo próprio Supabase (Edge Function), para a API Python não carregar modelo (conferir antes se isso ainda existe).
- O Lucas cria o repositório novo da API.

### Esboço das tabelas

- `campaign` (secret-cultist e os temas da expansão)
- `fragment`: `id`, `campaign`, `area` (cthulhu, babilonia, biblia, politica-anos-30...), `god`, `moment` (abertura, lei-L, lei-F, rejeicao, caos, veto, investigacao, eliminacao, ato2, ato3, fim), `kind` (lugar, pressagio, objeto, fala, ritual, documento), `text`, `source`, `source_date`, `search` (`tsvector`), `embedding` (vazio por enquanto)
- `template`: `id`, `campaign`, `moment`, `text` com lacunas (`{pressagio}`, `{lugar}`, `{nome}`)

### Endpoints

- `POST /ingest` (com o login do Supabase): recebe texto e etiquetas, corta em trechos e grava.
- `GET /lore?campaign=&god=&moment=&seed=`: escolhe um molde do momento e preenche com trechos das etiquetas; a mesma `seed` dá a mesma frase.

## No jogo

- A chamada é opcional, igual às fichas (D94, D95): disjuntor, tempo máximo, e a crônica do código quando a API não responde.
- A resposta real gravada em `tests/fixtures/source/`, checada em `tests/contract.py`, lida por uma função `norm*` em `src/core/source.ts` (regra 2 do CLAUDE.md).
- O jogo nunca espera pela lore para seguir.

## Material para a ingestão

Pode (domínio público; conferir a data de cada um antes de ingerir):
- H. P. Lovecraft (morreu em 1937: domínio público no Brasil desde 2008; nos EUA, a maior parte).
- Clark Ashton Smith (Tsathoggua), Robert W. Chambers (O Rei de Amarelo, 1895), Robert E. Howard, Algernon Blackwood (O Wendigo, ligado a Ithaqua), Arthur Machen.
- Textos antigos: o Enuma Elish e as tábuas babilônicas (Tiamat, Marduque), a descida de Inana (Ereshkigal), as passagens bíblicas e a demonologia clássica (Baal, Moloque, Mamon, Asmodeu, Astarote).

Não pode:
- O material da Chaosium (o RPG Call of Cthulhu), August Derleth e outros autores ainda protegidos.

## Próximos passos, quando for a hora

1. Repositório novo da API Python (FastAPI) com Supabase; o pgvector fica para quando ligar o vetor.
2. Lista das fontes com links e datas conferidas (o Claude ajuda).
3. Ingestão inicial pelos endpoints.
4. Ligação opcional no jogo, com disjuntor e contrato gravado.
