import type { ZaryaPosition, ZaryaPassivoPosition } from "../types/zarya.types.js";
import type { NormalizedPosition, NormalizedPassivoPosition } from "../types/portfolio.types.js";
import { isSentinelDate, diasAteVencimento } from "../utils/date.util.js";
import { toNumber } from "../utils/number.util.js";

/**
 * Converte uma posição CRUA da Zarya em uma posição NORMALIZADA:
 * - datas sentinela viram null;
 * - números são forçados a valores finitos;
 * - cria campos derivados (diasParaVencimento).
 */
export function normalizePosition(raw: ZaryaPosition): NormalizedPosition {
  const dtVencimento = isSentinelDate(raw.dt_Vencimento) ? null : raw.dt_Vencimento ?? null;

  return {
    nuPortfolio: toNumber(raw.nu_Portfolio),
    noResumido: raw.no_Resumido?.trim() || `Carteira ${toNumber(raw.nu_Portfolio)}`,
    noClasse: raw.no_Classe?.trim() || "Não classificado",
    noSubClasse: raw.no_Sub_Classe?.trim() || "Não classificado",
    noFamiliaProduto: raw.no_Familia_Produto?.trim() || "Não classificado",
    noAtivo: raw.no_Ativo?.trim() || "—",
    noEmissor: raw.no_Emissor?.trim() || null,
    noIndice: raw.no_Indice?.trim() || null,

    qtTotal: toNumber(raw.qt_Total),
    puEstoque: toNumber(raw.pu_Estoque),
    prPortfolio: toNumber(raw.pr_Portfolio),

    vlEstoque: toNumber(raw.vl_Estoque),
    vlLiquido: toNumber(raw.vl_Liquido),
    vlRendimentoLiquido: toNumber(raw.vl_Rendimento_Liquido),
    vlRendimentoDia: toNumber(raw.vl_Rendimento_Dia),
    vlTributos: toNumber(raw.vl_Tributos),
    vlIRRF: toNumber(raw.vl_IRRF),
    vlIOF: toNumber(raw.vl_IOF),

    dtVencimento,
    diasParaVencimento: dtVencimento ? diasAteVencimento(dtVencimento) : null,
  };
}

export function normalizeAll(positions: ZaryaPosition[]): NormalizedPosition[] {
  return positions.map(normalizePosition);
}

/** Converte uma posicao CRUA de PASSIVO (cotista) em uma posicao normalizada. */
export function normalizePassivoPosition(raw: ZaryaPassivoPosition): NormalizedPassivoPosition {
  const dtEstoque = isSentinelDate(raw.dt_Estoque) ? null : raw.dt_Estoque ?? null;

  return {
    nuPortfolio: toNumber(raw.nu_portfolio),
    noResumido: raw.no_Resumido?.trim() || `Carteira ${toNumber(raw.nu_portfolio)}`,
    nuCotista: toNumber(raw.nu_Cotista),
    noCotista: raw.no_Cotista?.trim() || "Nao identificado",

    qtEstoque: toNumber(raw.qt_Estoque),
    vlBruto: toNumber(raw.vl_Bruto),
    vlLiquido: toNumber(raw.vl_Liquido),
    vlRendimento: toNumber(raw.vl_Rendimento),
    vlIRRF: toNumber(raw.vl_IRRF),
    vlIOF: toNumber(raw.vl_IOF),

    tpPessoa: raw.tp_Pessoa?.trim() || "Não identificado",
    noPerfilCVM: raw.no_Perfil_CVM?.trim() || "Não classificado",
    noGrupoFamiliar: raw.no_Grupo_Familiar?.trim() || "Não classificado",
    noTipoInvestidor: raw.no_Tipo_Investidor?.trim() || "Não classificado",
    vlAplicado: toNumber(raw.vl_Aplicado),
    vlResgatado: toNumber(raw.vl_Resgatado),
    vlComeCotas: toNumber(raw.vl_Come_Cotas),
    qtBloqueada: toNumber(raw.qt_Bloqueada),

    noPerfil: raw.no_Perfil?.trim() || "Não informado",
    noObjetivo: raw.no_Objetivo?.trim() || "Não informado",
    noHorizonteInvestimento: raw.no_Horizonte_Investimento?.trim() || "Não informado",
    noToleranciaRisco: raw.no_Tolerancia_Risco?.trim() || "Não informado",
    noExperienciaInvestimento: raw.no_Experiencia_Investimento?.trim() || "Não informado",
    noCidade: raw.no_Cidade?.trim() || "Não informada",
    coUF: raw.co_UF?.trim() || "Não informado",

    dtEstoque,
  };
}

export function normalizePassivoAll(positions: ZaryaPassivoPosition[]): NormalizedPassivoPosition[] {
  return positions.map(normalizePassivoPosition);
}
