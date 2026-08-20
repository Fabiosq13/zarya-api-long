/**
 * Tipos do payload CRU retornado pela API Zarya.
 * Espelham os campos do endpoint busca_composicao_carteira_data.
 * Tudo aqui é "como vem da fonte" — o tratamento acontece em normalize.ts.
 */

export interface ZaryaPosition {
  // Identificadores
  nu_Portfolio?: number;
  no_Resumido?: string; // nome resumido da carteira (usado na seleção de carteira)
  nu_Produto?: number;

  // Classificação
  nu_Classe_Produto?: number;
  no_Classe?: string;
  nu_Sub_Classe?: number;
  no_Sub_Classe?: string;
  nu_Familia_Produto?: number;
  no_Familia_Produto?: string;

  // Ativo
  no_Ativo?: string;
  no_Emissor?: string;
  co_Serie?: string;
  no_Indice?: string;
  pr_Indice?: number;
  tx_Compra?: number;

  // Datas (podem vir com sentinela "0001-01-01T00:00:00")
  dt_Estoque?: string;
  dt_Compra?: string;
  dt_Emissao?: string;
  dt_Carencia?: string;
  dt_Vencimento?: string;

  // Quantidade
  qt_Total?: number;
  qt_Disponivel?: number;
  qt_Bloqueada?: number;

  // Preços
  pu_Custo?: number;
  pu_Medio?: number;
  pu_Estoque?: number;

  // Valores
  vl_Compra?: number;
  vl_Venda?: number;
  vl_Estoque?: number;
  vl_Liquido?: number;
  vl_Classe?: number;
  vl_Sub_Classe?: number;
  vl_Rendimento_Liquido?: number;
  vl_Rendimento_Dia?: number;

  // Tributos
  vl_IRRF?: number;
  vl_IOF?: number;
  vl_Taxa_IRRF?: number;
  vl_Tributos?: number;

  // Percentuais
  pr_Portfolio?: number;
  pr_Classe?: number;
  pr_Sub_Classe?: number;
  pr_Produto?: number;
}

export interface ZaryaResponse<T = ZaryaPosition> {
  Status: boolean;
  Message: string;
  ProcessingTime: string;
  Object: T[];
}

/**
 * Tipos do payload CRU do endpoint Passivo/PosicaoConsolidada (posicao por cotista).
 * Espelha os campos usados; tudo aqui e "como vem da fonte".
 */
export interface ZaryaPassivoPosition {
  dt_Estoque?: string;
  nu_portfolio?: number;
  no_Resumido?: string;
  nu_Cotista?: number;
  no_Cotista?: string;
  qt_Estoque?: number;
  vl_Bruto?: number;
  vl_Liquido?: number;
  vl_Rendimento?: number;
  vl_IRRF?: number;
  vl_IOF?: number;
  tp_Pessoa?: string;
  no_Perfil_CVM?: string;
  no_Grupo_Familiar?: string;
  no_Tipo_Investidor?: string;
  vl_Aplicado?: number;
  vl_Resgatado?: number;
  vl_Come_Cotas?: number;
  qt_Bloqueada?: number;
  no_Perfil?: string;
  no_Objetivo?: string;
  no_Horizonte_Investimento?: string;
  no_Tolerancia_Risco?: string;
  no_Experiencia_Investimento?: string;
  no_Cidade?: string;
  co_UF?: string;
}
