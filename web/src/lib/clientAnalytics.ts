import type { DetailedPosition, GroupedItem, PortfolioSummary } from "@/types";

/** Agrupa posições por uma chave somando um valor; retorna ordenado desc. */
export function groupSum(
  rows: DetailedPosition[],
  keyFn: (p: DetailedPosition) => string,
  valFn: (p: DetailedPosition) => number,
): GroupedItem[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    map.set(k, (map.get(k) ?? 0) + (valFn(r) || 0));
  }
  const total = [...map.values()].reduce((a, b) => a + Math.abs(b), 0) || 1;
  return [...map.entries()]
    .map(([nome, valor]) => ({
      nome,
      valor: Math.round(valor * 100) / 100,
      percentual: Math.round((Math.abs(valor) / total) * 10000) / 100,
    }))
    .sort((a, b) => b.valor - a.valor);
}

export interface ConcentrationMetrics {
  nAtivos: number;
  nClasses: number;
  nEmissores: number;
  maiorPosicaoPct: number;
  maiorPosicaoNome: string;
  top5Pct: number;
  hhi: number; // 0..10000 (Herfindahl-Hirschman)
  hhiLabel: string;
}

export function concentration(
  summary: PortfolioSummary,
  posicoes: DetailedPosition[],
): ConcentrationMetrics {
  const ativos = summary.porAtivo ?? [];
  const top1 = ativos[0];
  const top5 = ativos.slice(0, 5).reduce((a, b) => a + b.percentual, 0);
  const hhi = ativos.reduce((a, b) => a + b.percentual * b.percentual, 0);
  const emissores = new Set(
    posicoes.map((p) => p.emissor).filter((e): e is string => !!e),
  );

  let hhiLabel = "Diversificada";
  if (hhi >= 2500) hhiLabel = "Muito concentrada";
  else if (hhi >= 1500) hhiLabel = "Concentrada";
  else if (hhi >= 800) hhiLabel = "Moderada";

  return {
    nAtivos: ativos.length,
    nClasses: (summary.porClasse ?? []).length,
    nEmissores: emissores.size,
    maiorPosicaoPct: top1?.percentual ?? 0,
    maiorPosicaoNome: top1?.nome ?? "—",
    top5Pct: Math.round(top5 * 100) / 100,
    hhi: Math.round(hhi),
    hhiLabel,
  };
}

/** Maiores ganhos e perdas por ativo (por rendimento líquido). */
export function movers(posicoes: DetailedPosition[], n = 5) {
  const byAtivo = new Map<string, number>();
  for (const p of posicoes) {
    byAtivo.set(p.ativo, (byAtivo.get(p.ativo) ?? 0) + (p.rendimentoLiquido || 0));
  }
  const arr = [...byAtivo.entries()].map(([nome, valor]) => ({ nome, valor }));
  const ganhos = arr.filter((a) => a.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, n);
  const perdas = arr.filter((a) => a.valor < 0).sort((a, b) => a.valor - b.valor).slice(0, n);
  return { ganhos, perdas };
}

export interface LadderBucket { ano: string; valor: number; qtd: number; }

/** Escada de vencimentos: agrupa o valor por ano de vencimento (asc). */
export function maturityLadder(rows: DetailedPosition[]): LadderBucket[] {
  const map = new Map<string, { valor: number; qtd: number }>();
  for (const p of rows) {
    if (!p.dtVencimento) continue;
    const y = new Date(p.dtVencimento).getFullYear();
    if (!y || y < 1990) continue; // ignora datas sentinela (0001-…)
    const k = String(y);
    const cur = map.get(k) ?? { valor: 0, qtd: 0 };
    cur.valor += p.valor || 0;
    cur.qtd += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([ano, v]) => ({ ano, valor: Math.round(v.valor * 100) / 100, qtd: v.qtd }))
    .sort((a, b) => a.ano.localeCompare(b.ano));
}
