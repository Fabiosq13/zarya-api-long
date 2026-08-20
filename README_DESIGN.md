# Zarya — frontend (tema institucional, visão única)

Layout corporativo claro, **sem sidebar**: um **header** no topo (marca + carteira
selecionada + seletores de carteira/data) e uma **visão única** (sem abas).
Lógica e fluxo de dados intactos (preload por `no_Resumido`, seleção carteira+data,
indicadores/gráficos, e o copiloto Gemini que reconsulta e atualiza o painel).

## Destaques desta versão
- **Header** no lugar da sidebar; nada de navegação em abas — é uma visão só.
- **Cabeçalho de resumo rico** (`SummaryHero`): patrimônio em destaque + variação
  no dia + faixa de métricas (líquido, rendimento acumulado, tributos, posições).
- **Cartões mais profissionais**: cabeçalho com ícone, divisórias, mais profundidade.
- **Donut corrigido**: geometria com folga (não corta) e destaque suave por opacidade
  (sem o "pulo" de espessura no hover).
- **Chat redesenhado**: avatar circular com gradiente, status online e tipografia melhor.
- **Leve**: sem Recharts/Framer; donut em SVG, barras em CSS. Bundle JS ~430 KB (gzip ~136 KB).

## Componentes
`Header`, `SummaryHero`, `DonutAllocation` (SVG), `TopPositions` (barras CSS),
`VencimentosCard`, `ChatPanel`, `WalletSelector`, `DateSelector`, `AnimatedNumber`.

## Rodar
```bash
npm install && npm run dev        # backend :3000 (ZARYA_TOKEN, GEMINI_API_KEY no .env)
cd web && npm install && npm run dev   # :5173
```
Deploy no Railway: ver `DEPLOY.md` (backend serve o frontend buildado).

> Importante: se o seu repositório ainda tiver sobras antigas
> (`Sidebar.tsx`, `KpiRow.tsx`, `AllocationChart.tsx`, `HeroPanel.tsx`,
> `KpiCards.tsx`, `TopAssetsChart.tsx`), apague-as — o `tsc` do build falha com
> arquivos órfãos. Este pacote já vem só com os componentes atuais.
