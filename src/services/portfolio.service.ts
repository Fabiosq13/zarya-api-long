import { env } from "../config/env.js";
import { validarDtPesquisa } from "../utils/date.util.js";
import { round2 } from "../utils/number.util.js";
import * as zarya from "./zarya.service.js";
import * as analytics from "./portfolioAnalytics.service.js";
import * as cache from "./cache.service.js";
import { normalizeAll, normalizePassivoAll } from "./normalize.js";
import type {
  NormalizedPosition,
  PortfolioSummary,
  CarteiraItem,
  CarteirasResponse,
  DetailedPosition,
  NormalizedPassivoPosition,
  PassivoSummary,
  DetailedPassivoPosition,
  CotistaItem,
  CotistasResponse,
} from "../types/portfolio.types.js";

/**
 * Carrega a composição NORMALIZADA da carteira (com cache) para uma data/carteira.
 * É o ponto único usado tanto pelos endpoints REST quanto pelo agente do chat,
 * garantindo o mesmo tratamento determinístico em todos os caminhos.
 */
export async function loadComposition(
  dtPesquisa: string,
  idCarteira = 0,
): Promise<{ positions: NormalizedPosition[]; cacheHit: boolean }> {
  const key = `comp:${dtPesquisa}:${idCarteira}`;
  const cached = await cache.get<NormalizedPosition[]>(key);
  if (cached) return { positions: cached, cacheHit: true };

  const raw = await zarya.buscaComposicao({ dtPesquisa, idCarteira });
  const positions = normalizeAll(raw.Object);
  await cache.set(key, positions, env.CACHE_TTL_SECONDS);
  return { positions, cacheHit: false };
}

/** Resumo (indicadores + dados de gráfico) de uma carteira/data. */
export async function getSummary(
  dtPesquisa: string,
  idCarteira = 0,
): Promise<{
  summary: PortfolioSummary;
  posicoes: DetailedPosition[];
  cacheHit: boolean;
}> {
  const { positions, cacheHit } = await loadComposition(dtPesquisa, idCarteira);
  return {
    summary: analytics.buildSummary(positions),
    posicoes: analytics.buildDetailedPositions(positions),
    cacheHit,
  };
}

/** Extrai a lista de carteiras (tipos) distintas de uma composição geral (id 0). */
function extrairCarteiras(positions: NormalizedPosition[]): CarteiraItem[] {
  const map = new Map<number, CarteiraItem>();
  for (const p of positions) {
    const atual = map.get(p.nuPortfolio);
    if (atual) {
      atual.valorTotal = round2(atual.valorTotal + (p.vlEstoque || 0));
      atual.quantidadePosicoes += 1;
    } else {
      map.set(p.nuPortfolio, {
        idCarteira: p.nuPortfolio,
        noResumido: p.noResumido,
        valorTotal: round2(p.vlEstoque || 0),
        quantidadePosicoes: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.valorTotal - a.valorTotal);
}

/**
 * Lista as carteiras disponíveis para a interface.
 * Procura uma data com dados a partir de `dtPesquisa` (ou da data padrão),
 * andando alguns dias para trás — útil porque nem toda data tem posição.
 */
export async function listCarteiras(dtPesquisaSolicitada?: string): Promise<CarteirasResponse> {
  const padrao = env.PORTFOLIO_DEFAULT_DATE_ATIVOS;
  const base = resolverDataBase(dtPesquisaSolicitada, padrao);

  for (let i = 0; i <= env.PORTFOLIO_LOOKBACK_DAYS; i++) {
    const dia = subtrairDias(base, i);
    const { positions } = await loadComposition(dia, 0);
    if (positions.length > 0) {
      return { dtPesquisa: dia, carteiras: extrairCarteiras(positions) };
    }
  }

  // Sem dados no intervalo procurado: cai para a data padrão conhecida do modo.
  const { positions } = await loadComposition(padrao, 0);
  return { dtPesquisa: padrao, carteiras: extrairCarteiras(positions) };
}

function resolverDataBase(dt?: string, padrao: string = env.PORTFOLIO_DEFAULT_DATE): string {
  const check = validarDtPesquisa(dt);
  if (check.ok) return check.value;
  return padrao;
}

function subtrairDias(isoDate: string, dias: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Carrega a composicao NORMALIZADA de PASSIVO (com cache) para uma data/carteira/cotista.
 * Espelha loadComposition, mas para o dominio de passivo (posicoes por cotista).
 */
export async function loadPassivoComposition(
  dtPesquisa: string,
  idCarteira = 0,
  idCotista = 0,
): Promise<{ positions: NormalizedPassivoPosition[]; cacheHit: boolean }> {
  const key = `passivo:${dtPesquisa}:${idCarteira}:${idCotista}`;
  const cached = await cache.get<NormalizedPassivoPosition[]>(key);
  if (cached) return { positions: cached, cacheHit: true };

  const raw = await zarya.buscaPassivoComposicao({ dtPesquisa, idCarteira, idCotista });
  const positions = normalizePassivoAll(raw.Object);
  await cache.set(key, positions, env.CACHE_TTL_SECONDS);
  return { positions, cacheHit: false };
}

/** Resumo (indicadores + tabela de cotistas) de uma carteira/data/cotista de passivo. */
export async function getPassivoSummary(
  dtPesquisa: string,
  idCarteira = 0,
  idCotista = 0,
): Promise<{
  summary: PassivoSummary;
  posicoes: DetailedPassivoPosition[];
  cacheHit: boolean;
}> {
  const { positions: todasPosicoes, cacheHit } = await loadPassivoComposition(dtPesquisa, idCarteira, 0);
  const totalFundoBruto = todasPosicoes.reduce((acc, p) => acc + (p.vlBruto || 0), 0);
  const positions = idCotista ? todasPosicoes.filter((p) => p.nuCotista === idCotista) : todasPosicoes;

  return {
    summary: analytics.buildPassivoSummary(positions),
    posicoes: analytics.buildDetailedPassivoPositions(positions, totalFundoBruto),
    cacheHit,
  };
}

/** Extrai a lista de carteiras (fundos com passivo) distintas de uma composicao geral (id 0). */
function extrairCarteirasPassivo(positions: NormalizedPassivoPosition[]): CarteiraItem[] {
  const map = new Map<number, CarteiraItem>();
  for (const p of positions) {
    const atual = map.get(p.nuPortfolio);
    if (atual) {
      atual.valorTotal = round2(atual.valorTotal + (p.vlBruto || 0));
      atual.quantidadePosicoes += 1;
    } else {
      map.set(p.nuPortfolio, {
        idCarteira: p.nuPortfolio,
        noResumido: p.noResumido,
        valorTotal: round2(p.vlBruto || 0),
        quantidadePosicoes: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.valorTotal - a.valorTotal);
}

/** Lista as carteiras de passivo disponiveis (apenas fundos, que tem cotistas). */
export async function listPassivoCarteiras(dtPesquisaSolicitada?: string): Promise<CarteirasResponse> {
  const padrao = env.PORTFOLIO_DEFAULT_DATE_PASSIVOS;
  const base = resolverDataBase(dtPesquisaSolicitada, padrao);

  for (let i = 0; i <= env.PORTFOLIO_LOOKBACK_DAYS; i++) {
    const dia = subtrairDias(base, i);
    const { positions } = await loadPassivoComposition(dia, 0, 0);
    if (positions.length > 0) {
      return { dtPesquisa: dia, carteiras: extrairCarteirasPassivo(positions) };
    }
  }

  const { positions } = await loadPassivoComposition(padrao, 0, 0);
  return { dtPesquisa: padrao, carteiras: extrairCarteirasPassivo(positions) };
}

/** Lista os cotistas distintos de uma carteira/data, para o filtro da tela de passivos. */
export async function listCotistas(dtPesquisa: string, idCarteira = 0): Promise<CotistasResponse> {
  const { positions } = await loadPassivoComposition(dtPesquisa, idCarteira, 0);
  const map = new Map<number, string>();
  for (const p of positions) {
    if (!map.has(p.nuCotista)) map.set(p.nuCotista, p.noCotista);
  }
  const cotistas: CotistaItem[] = [...map.entries()]
    .map(([idCotista, nome]) => ({ idCotista, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { cotistas };
}
