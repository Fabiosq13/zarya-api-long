# Deploy no Railway

## Por que aparecia `{"erro":"nao_encontrado","mensagem":"Rota não encontrada."}`

O backend (`src/`) é uma API pura: só conhece `/health` e `/api/v1/portfolio/*`.
Ao abrir a URL do Railway no navegador, o browser pede `/`, que não era uma rota
de API → o Fastify respondia 404 "Rota não encontrada". O frontend (`web/dist`)
nunca era servido, porque nada no backend entregava arquivos estáticos.

## O que foi corrigido

O backend agora **serve o frontend buildado** (`web/dist`) e tem fallback de SPA:

- `GET /`  e qualquer rota de navegação → entrega o app (`index.html`).
- `GET /assets/*`, `/favicon.svg` etc. → arquivos estáticos.
- `GET /api/...` desconhecida → continua 404 em JSON (comportamento de API).
- `GET /health` → JSON de status.

Tudo isso num **único serviço** — uma URL serve o site e a API.

## Como subir (recomendado: Dockerfile)

O projeto inclui um `Dockerfile`. No Railway:

1. **New Project → Deploy from GitHub repo** (ou suba o repositório).
   O Railway detecta o `Dockerfile` e builda frontend + backend sozinho.
2. Em **Variables**, defina:
   - `ZARYA_TOKEN`  = seu token cru da Zarya
   - `GEMINI_API_KEY` = sua chave do Gemini
   - (opcionais) `GEMINI_MODEL`, `ZARYA_BASE_URL`, `PORTFOLIO_DEFAULT_DATE`, `CORS_ORIGIN`…
   - **Não** defina `PORT` — o Railway injeta automaticamente e o app já o lê.
3. (Opcional) Adicione o plugin **Redis** do Railway: a `REDIS_URL` é injetada e o
   histórico de conversas passa a persistir. Sem isso, ele usa memória.
4. Deploy. Abra a URL pública → o painel carrega; `/health` responde JSON.

## Alternativa sem Docker (Nixpacks)

Se preferir o builder padrão do Railway, configure:

- **Build Command:** `npm run build`  (builda `web/dist` e `dist/`)
- **Start Command:** `npm start`       (`node dist/server.js`)

O script `build:web` usa `npm install --include=dev`, então funciona mesmo com
`NODE_ENV=production` setado no serviço.

## Dois serviços separados (opcional)

Se quiser front e back separados:

- **Backend:** deploy normal; anote a URL pública (ex.: `https://api-xxxx.up.railway.app`).
- **Frontend:** build estático do `web/` (ex.: serviço estático) com
  `VITE_API_URL=https://api-xxxx.up.railway.app` no build, e no backend defina
  `CORS_ORIGIN=https://seu-front.up.railway.app`.

## Variáveis de ambiente (resumo)

Obrigatórias: `ZARYA_TOKEN`, `GEMINI_API_KEY`.
Úteis: `GEMINI_MODEL` (default `gemini-2.5-flash`), `ZARYA_BASE_URL`
(default `https://api.zarya.net.br`), `CORS_ORIGIN` (default `*`),
`REDIS_URL` (opcional), `WEB_DIST_PATH` (só se o caminho do frontend for atípico).

### Base nova (maior)

- `ZARYA_TOKEN=9e4b7c21a8f35d60c2e9147b6a83fd52` (token da base nova).
- Datas de referência por modo (a base nova tem datas diferentes por visão):
  - `PORTFOLIO_DEFAULT_DATE_ATIVOS=2026-01-27` (Carteira).
  - `PORTFOLIO_DEFAULT_DATE_PASSIVOS=2026-02-02` (Cotista).
- O código converte a data automaticamente para o formato de cada endpoint:
  Carteira → `MM/DD/YYYY` (ex.: `01/27/2026`); Cotista → `MM-DD-YYYY` (ex.:
  `02-02-2026`). Internamente tudo continua em `YYYY-MM-DD`.
- Se a base nova estiver em outro host, defina também `ZARYA_BASE_URL`.
