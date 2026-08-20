# Zarya Agent

Agente conversacional de carteira em **Node + TypeScript + Fastify**, com **Gemini** via SDK
oficial (`@google/genai`). O agente decide sozinho **quando** consultar a API Zarya e **qual
data** usar (extraída da conversa), via *function calling*. Em conversa normal, apenas responde.

> O Gemini **nunca** acessa a Zarya. Quem consulta é o backend. Todo cálculo financeiro é
> **determinístico** em Node — a LLM só narra os números que recebe prontos.

## Como rodar

```bash
cp .env.example .env       # preencha ZARYA_TOKEN e GEMINI_API_KEY
npm install
npm run dev                # desenvolvimento (tsx watch)
# ou
npm run build && npm start # produção
```

Scripts: `dev`, `build`, `start`, `typecheck`, `test`.

## Interface web (`web/`)

Há um frontend em **React + Vite + Tailwind + shadcn-style + Framer Motion** na pasta `web/`.
Ele permite **selecionar a carteira** (campo `no_Resumido`) e a **data**, exibe **indicadores e
gráficos** e traz um **assistente Gemini** que conversa e **atualiza o painel** quando faz novas buscas.

```bash
cd web
cp .env.example .env       # opcional; em dev o proxy do Vite já aponta /api -> :3000
npm install
npm run dev                # http://localhost:5173 (proxy /api -> http://localhost:3000)
npm run build              # gera dist/ estático
```

> Rode o backend (`npm run dev` na raiz) junto. Para o chat funcionar, preencha `GEMINI_API_KEY`.

## Endpoints

### `GET /api/v1/portfolio/carteiras`

Lista as carteiras (tipos) para o seletor — usado no **preload** da interface. Deriva os valores
distintos de `{nu_Portfolio, no_Resumido}` da composição geral (`id_Carteira=0`). Se a data não
tiver dados, procura alguns dias para trás (`PORTFOLIO_LOOKBACK_DAYS`) e, em último caso, usa
`PORTFOLIO_DEFAULT_DATE`.

Query opcional: `?dtPesquisa=YYYY-MM-DD`.

```json
{
  "dtPesquisa": "2025-06-05",
  "carteiras": [
    { "idCarteira": 39, "noResumido": "FUNDO ZARYA FIM", "valorTotal": 3283862.42, "quantidadePosicoes": 7 }
  ]
}
```

### `GET /api/v1/portfolio/summary`

Indicadores e dados de gráfico de uma carteira/data (sem passar pela LLM).

Query: `?dtPesquisa=YYYY-MM-DD&idCarteira=0`.

```json
{ "dtPesquisa": "2025-06-05", "idCarteira": 31, "summary": { }, "meta": { "cacheHit": false } }
```

### `POST /api/v1/portfolio/chat`

Modo **stateful** (recomendado) — o backend guarda o histórico por `conversationId`:

```json
{ "conversationId": "c_123", "message": "como estava a carteira em 5 de junho?" }
```

Opcionalmente envie o **contexto do painel** para a IA usar a carteira/data já selecionadas
por padrão (e atualizar os gráficos ao buscar):

```json
{
  "conversationId": "c_123",
  "message": "resuma essa carteira",
  "context": { "idCarteira": 31, "noResumido": "Carteira Administrada Zarya", "dtPesquisa": "2025-06-05" }
}
```

Modo **stateless** — o cliente envia o histórico completo:

```json
{ "messages": [{ "role": "user", "content": "qual o total da carteira em 2025-06-05?" }] }
```

Resposta:

```json
{
  "answer": "Em 05/06/2025 a carteira somava R$ ... A maior concentração é Renda Fixa (62,40%).",
  "toolUsed": true,
  "data": { "dtPesquisa": "2025-06-05", "idCarteira": 0, "summary": { } },
  "meta": { "conversationId": "c_123", "cacheHit": false, "processingTimeMs": 820, "model": "gemini-2.5-flash" }
}
```

Em conversa normal (`"oi"`, `"o que é renda fixa?"`), `toolUsed=false` e `data=null`.
Se faltar a data, o agente **pergunta** em vez de chutar.

## Arquitetura (resumo)

```
route → controller → conversation.service (histórico)
                        → agent.service (LOOP de function calling)
                            ├─ decide: conversar OU consultar
                            ├─ valida a data (date.util)
                            ├─ cache.service → zarya.service → normalize → analytics
                            └─ Gemini narra os dados calculados
```

| Camada | Papel |
|---|---|
| `agent.service` | loop de function calling; decide conversar vs. consultar |
| `zarya.service` | único ponto que fala com a Zarya (token URL-encoded, timeout) |
| `portfolioAnalytics.service` | cálculos determinísticos (totais, %, maiores, vencimentos) |
| `normalize.ts` | datas sentinela → null, números válidos, campos derivados |
| `cache.service` | cache por `dtPesquisa+idCarteira` (memória; trocar por Redis) |
| `conversation.service` | histórico por `conversationId` (janela deslizante) |
| `prompt.ts` | system prompt com data atual + regras anti-alucinação |

## Deploy no Railway

Railway usa o **Railpack** (detecta Node automaticamente). Basta ter os scripts `build` (tsc)
e `start` (node dist/server.js), já presentes. Configure as variáveis de ambiente nas
**Variables** do serviço (nunca no repositório). O Railway injeta `PORT` automaticamente.

## Notas

- Token da Zarya vai no `.env` **cru** (sem URL encode); o código encoda na hora da requisição.
- A extração de data pela LLM é sempre **validada em Node** (`validarDtPesquisa`).
- Modelo padrão `gemini-2.5-flash`; troque por `gemini-3.5-flash` via env se quiser o mais novo.
