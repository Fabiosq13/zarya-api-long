export interface CarteiraItem {
  idCarteira: number;
  noResumido: string;
  valorTotal: number;
  quantidadePosicoes: number;
}

export interface CarteirasResponse {
  dtPesquisa: string;
  carteiras: CarteiraItem[];
}

export interface GroupedItem {
  nome: string;
  valor: number;
  percentual: number;
}

export interface VencimentoItem {
  ativo: string;
  emissor: string | null;
  dtVencimento: string;
  diasParaVencimento: number;
  valor: number;
}

export interface PortfolioSummary {
  totalBruto: number;
  totalLiquido: number;
  rendimentoLiquidoTotal: number;
  rendimentoDia: number;
  tributosTotais: number;
  irrfTotal: number;
  iofTotal: number;
  quantidadePosicoes: number;
  porClasse: GroupedItem[];
  porFamilia: GroupedItem[];
  porAtivo: GroupedItem[];
  porCarteira: GroupedItem[];
  maioresPosicoes: GroupedItem[];
  vencendoEm90Dias: VencimentoItem[];
}

export interface DetailedPosition {
  ativo: string;
  classe: string;
  subClasse: string;
  familia: string;
  emissor: string | null;
  indice: string | null;
  quantidade: number;
  valor: number;
  valorLiquido: number;
  rendimentoLiquido: number;
  rendimentoDia: number;
  percentual: number;
  dtVencimento: string | null;
  diasParaVencimento: number | null;
}

export interface SummaryResponse {
  dtPesquisa: string;
  idCarteira: number;
  summary: PortfolioSummary;
  posicoes: DetailedPosition[];
  meta: { cacheHit: boolean };
}

export type ChatData =
  | { modo: "ativos"; dtPesquisa: string; idCarteira: number; summary: PortfolioSummary }
  | { modo: "passivos"; dtPesquisa: string; idCarteira: number; idCotista: number; summary: PassivoSummary };

export interface UiActions {
  aba?: "geral" | "analise" | "posicoes";
  filtroClasse?: string;
  dimensaoAlocacao?: "porClasse" | "porFamilia" | "porAtivo";
}

export interface ChatResponse {
  answer: string;
  toolUsed: boolean;
  data: ChatData | null;
  ui?: UiActions | null;
  meta: {
    conversationId: string;
    cacheHit: boolean;
    processingTimeMs: number;
    model: string;
  };
}

export interface ChatContext {
  modo?: "ativos" | "passivos";
  idCarteira?: number;
  noResumido?: string;
  dtPesquisa?: string;
  idCotista?: number;
  noCotista?: string;
}

export interface PassivoSummary {
  valorBrutoTotal: number;
  valorLiquidoTotal: number;
  rendimentoTotal: number;
  irrfTotal: number;
  iofTotal: number;
  aplicadoTotal: number;
  resgatadoTotal: number;
  comeCotasTotal: number;
  quantidadeCotistas: number;
  quantidadeCotas: number;
  quantidadePosicoes: number;
  porPerfilCVM: GroupedItem[];
  porTipoPessoa: GroupedItem[];
  porGrupoFamiliar: GroupedItem[];
  porTipoInvestidor: GroupedItem[];
  porPerfil: GroupedItem[];
  porObjetivo: GroupedItem[];
  porHorizonteInvestimento: GroupedItem[];
  porToleranciaRisco: GroupedItem[];
  porExperienciaInvestimento: GroupedItem[];
  porUF: GroupedItem[];
  maioresCotistas: GroupedItem[];
}

export interface DetailedPassivoPosition {
  cotista: string;
  carteira: string;
  quantidade: number;
  valorBruto: number;
  valorLiquido: number;
  rendimento: number;
  percentual: number;
}

export interface CotistaItem {
  idCotista: number;
  nome: string;
}

export interface CotistasResponse {
  cotistas: CotistaItem[];
}

export interface PassivoSummaryResponse {
  dtPesquisa: string;
  idCarteira: number;
  idCotista: number;
  summary: PassivoSummary;
  posicoes: DetailedPassivoPosition[];
  meta: { cacheHit: boolean };
}
