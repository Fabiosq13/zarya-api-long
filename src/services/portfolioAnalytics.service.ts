import type {
  NormalizedPosition,
  PortfolioSummary,
  GroupedItem,
  VencimentoItem,
  DetailedPosition,
  NormalizedPassivoPosition,
  PassivoSummary,
  DetailedPassivoPosition,
} from "../types/portfolio.types.js";
import { pct, round2, round6 } from "../utils/number.util.js";

function sum<T>(arr: T[], f: (x: T) => number): number {
  return round2(arr.reduce((acc, x) => acc + (f(x) || 0), 0));
}

/** Agrupa por uma chave, soma um valor e calcula o % sobre o total. Ordena desc. */
function groupAndRank<T>(
  arr: T[],
  key: (x: T) => string,
  val: (x: T) => number,
  total: number,
): GroupedItem[] {
  const map = new Map<string, number>();
  for (const x of arr) {
    const k = key(x);
    map.set(k, (map.get(k) ?? 0) + (val(x) || 0));
  }
  return [...map.entries()]
    .map(([nome, valor]) => ({ nome, valor: round2(valor), percentual: pct(valor, total) }))
    .sort((a, b) => b.valor - a.valor);
}

/**
 * Calcula TODAS as agregações determinísticas de uma vez (O(n)).
 * É a fonte de verdade dos números — a LLM apenas narra o que sai daqui.
 */
export function buildSummary(positions: NormalizedPosition[]): PortfolioSummary {
  const totalBruto = sum(positions, (p) => p.vlEstoque);
  const tributosTotais = sum(positions, (p) => p.vlTributos);

  const porClasse = groupAndRank(positions, (p) => p.noClasse, (p) => p.vlEstoque, totalBruto);
  const porFamilia = groupAndRank(positions, (p) => p.noFamiliaProduto, (p) => p.vlEstoque, totalBruto);
  const porAtivo = groupAndRank(positions, (p) => p.noAtivo, (p) => p.vlEstoque, totalBruto);
  const porCarteira = groupAndRank(positions, (p) => p.noResumido, (p) => p.vlEstoque, totalBruto);

  const maioresPosicoes = porAtivo.slice(0, 10);

  const vencendoEm90Dias: VencimentoItem[] = positions
    .filter((p) => p.diasParaVencimento != null && p.diasParaVencimento >= 0 && p.diasParaVencimento <= 90)
    .map((p) => ({
      ativo: p.noAtivo,
      emissor: p.noEmissor,
      dtVencimento: p.dtVencimento as string,
      diasParaVencimento: p.diasParaVencimento as number,
      valor: round2(p.vlEstoque),
    }))
    .sort((a, b) => a.diasParaVencimento - b.diasParaVencimento);

  return {
    totalBruto,
    // Líquido de tributos, determinístico (= bruto − IRRF − IOF), coerente com o rótulo.
    // Em dados bem formados equivale a Σ vl_Liquido, mas não depende do provedor preenchê-lo.
    totalLiquido: round2(totalBruto - tributosTotais),
    rendimentoLiquidoTotal: sum(positions, (p) => p.vlRendimentoLiquido),
    rendimentoDia: sum(positions, (p) => p.vlRendimentoDia),
    tributosTotais,
    irrfTotal: sum(positions, (p) => p.vlIRRF),
    iofTotal: sum(positions, (p) => p.vlIOF),
    quantidadePosicoes: positions.length,

    porClasse,
    porFamilia,
    porAtivo,
    porCarteira,
    maioresPosicoes,
    vencendoEm90Dias,
  };
}

/** Lista de posições individuais para a visão detalhada (ordenada por valor desc). */
export function buildDetailedPositions(positions: NormalizedPosition[]): DetailedPosition[] {
  const total = sum(positions, (p) => p.vlEstoque);
  return positions
    .map((p) => ({
      ativo: p.noAtivo,
      classe: p.noClasse,
      subClasse: p.noSubClasse,
      familia: p.noFamiliaProduto,
      emissor: p.noEmissor,
      indice: p.noIndice,
      quantidade: round2(p.qtTotal),
      valor: round2(p.vlEstoque),
      valorLiquido: round2(p.vlLiquido),
      rendimentoLiquido: round2(p.vlRendimentoLiquido),
      rendimentoDia: round2(p.vlRendimentoDia),
      percentual: p.prPortfolio ? round2(p.prPortfolio) : pct(p.vlEstoque, total),
      dtVencimento: p.dtVencimento,
      diasParaVencimento: p.diasParaVencimento,
    }))
    .sort((a, b) => b.valor - a.valor);
}

/** Agregacoes deterministicas de uma composicao de PASSIVO (posicoes por cotista). */
export function buildPassivoSummary(positions: NormalizedPassivoPosition[]): PassivoSummary {
  const valorBrutoTotal = sum(positions, (p) => p.vlBruto);

  return {
    valorBrutoTotal,
    valorLiquidoTotal: sum(positions, (p) => p.vlLiquido),
    rendimentoTotal: sum(positions, (p) => p.vlRendimento),
    irrfTotal: sum(positions, (p) => p.vlIRRF),
    iofTotal: sum(positions, (p) => p.vlIOF),
    aplicadoTotal: sum(positions, (p) => p.vlAplicado),
    resgatadoTotal: sum(positions, (p) => p.vlResgatado),
    comeCotasTotal: sum(positions, (p) => p.vlComeCotas),
    quantidadeCotistas: new Set(positions.map((p) => p.nuCotista)).size,
    quantidadeCotas: round6(positions.reduce((acc, p) => acc + (p.qtEstoque || 0), 0)),
    quantidadePosicoes: positions.length,
    porPerfilCVM: groupAndRank(positions, (p) => p.noPerfilCVM, (p) => p.vlBruto, valorBrutoTotal),
    porTipoPessoa: groupAndRank(positions, (p) => p.tpPessoa, (p) => p.vlBruto, valorBrutoTotal),
    porGrupoFamiliar: groupAndRank(positions, (p) => p.noGrupoFamiliar, (p) => p.vlBruto, valorBrutoTotal),
    porTipoInvestidor: groupAndRank(positions, (p) => p.noTipoInvestidor, (p) => p.vlBruto, valorBrutoTotal),
    porPerfil: groupAndRank(positions, (p) => p.noPerfil, (p) => p.vlBruto, valorBrutoTotal),
    porObjetivo: groupAndRank(positions, (p) => p.noObjetivo, (p) => p.vlBruto, valorBrutoTotal),
    porHorizonteInvestimento: groupAndRank(positions, (p) => p.noHorizonteInvestimento, (p) => p.vlBruto, valorBrutoTotal),
    porToleranciaRisco: groupAndRank(positions, (p) => p.noToleranciaRisco, (p) => p.vlBruto, valorBrutoTotal),
    porExperienciaInvestimento: groupAndRank(positions, (p) => p.noExperienciaInvestimento, (p) => p.vlBruto, valorBrutoTotal),
    porUF: groupAndRank(positions, (p) => p.coUF, (p) => p.vlBruto, valorBrutoTotal),
    maioresCotistas: groupAndRank(positions, (p) => p.noCotista, (p) => p.vlBruto, valorBrutoTotal).slice(0, 10),
  };
}

/** Lista de posicoes por cotista para a visao detalhada (ordenada por valor bruto desc). */
export function buildDetailedPassivoPositions(
  positions: NormalizedPassivoPosition[],
  totalFundo?: number,
): DetailedPassivoPosition[] {
  const total = totalFundo ?? sum(positions, (p) => p.vlBruto);
  return positions
    .map((p) => ({
      cotista: p.noCotista,
      carteira: p.noResumido,
      quantidade: round2(p.qtEstoque),
      valorBruto: round2(p.vlBruto),
      valorLiquido: round2(p.vlLiquido),
      rendimento: round2(p.vlRendimento),
      percentual: pct(p.vlBruto, total),
    }))
    .sort((a, b) => b.valorBruto - a.valorBruto);
}
