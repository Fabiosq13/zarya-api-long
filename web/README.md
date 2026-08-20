# Zarya Insights — Web

Interface do agente de carteira Zarya. Permite selecionar o **tipo de carteira**
(`no_Resumido`) e a **data**, ver **indicadores e gráficos**, e conversar com um
**assistente Gemini** que atualiza o painel quando faz novas buscas.

## Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** + componentes no estilo **shadcn/ui** (Radix UI)
- **Framer Motion** (animações)
- **Recharts** (gráficos)
- **lucide-react** (ícones)

## Rodando

```bash
cp .env.example .env   # opcional em dev (proxy do Vite já encaminha /api)
npm install
npm run dev            # http://localhost:5173
```

O Vite faz proxy de `/api` para `http://localhost:3000` (backend Fastify). Para apontar
para outro host, defina `VITE_API_TARGET` (dev) ou `VITE_API_URL` (build de produção).

## Build

```bash
npm run build          # gera ./dist (estático, pode servir em qualquer CDN/Railway)
npm run preview
```

## Estrutura

```
src/
  components/
    ui/            primitivos shadcn-style (button, card, select, popover, calendar...)
    WalletSelector, DateSelector, KpiCards, AllocationChart,
    TopAssetsChart, VencimentosCard, ChatPanel, AnimatedNumber
  lib/             api.ts (fetch), format.ts (BRL/%/datas), utils.ts (cn)
  types.ts         tipos espelhando o backend
  App.tsx          estado global do painel + integração com o chat
```

## Como o chat atualiza o painel

O `ChatPanel` envia, junto da mensagem, o **contexto** (`idCarteira`, `noResumido`,
`dtPesquisa`). Quando a resposta do backend traz `data.summary` (a IA consultou a carteira),
o `App` sincroniza data/carteira/indicadores/gráficos automaticamente.
