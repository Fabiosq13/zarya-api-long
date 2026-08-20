import { GoogleGenAI, Type, type Content, type Tool } from "@google/genai";
import { env } from "../config/env.js";
import { validarDtPesquisa } from "../utils/date.util.js";
import { buildSystemPrompt } from "./prompt.js";
import * as portfolio from "./portfolio.service.js";
import type { ChatMessage, PassivoSummary, PortfolioSummary } from "../types/portfolio.types.js";

/** Contexto do painel: carteira e data selecionadas pelo usuário na interface. */
export interface AgentContext {
  modo?: "ativos" | "passivos";
  idCarteira?: number;
  noResumido?: string;
  dtPesquisa?: string;
  idCotista?: number;
  noCotista?: string;
}

/** Ações de interface que a IA pode disparar (aplicadas no front). */
export interface UiActions {
  aba?: "geral" | "analise" | "posicoes";
  filtroClasse?: string; // nome da classe ou "todas" para limpar
  dimensaoAlocacao?: "porClasse" | "porFamilia" | "porAtivo";
}

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const TOOL_DADOS = "consultarComposicaoCarteira";
const TOOL_UI = "controlarInterface";
const TOOL_DADOS_PASSIVO = "consultarPosicaoPassivo";
const MAX_ITERATIONS = 5; // proteção contra loop de tool calls

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: TOOL_DADOS,
        description:
          "Busca a composição da carteira do usuário em uma data específica e retorna totais, " +
          "exposição por classe, maiores ativos, rendimentos, tributos e vencimentos. " +
          "Use SOMENTE quando o usuário pedir dados reais da carteira (posições, valores, " +
          "exposição, concentração, rendimento, tributos, vencimentos), ou quando precisar trocar " +
          "a carteira/data exibida no painel. NÃO use em saudações ou perguntas conceituais. " +
          "Se o usuário pedir dados mas não informar a data e ela não puder ser inferida do " +
          "contexto, NÃO chame esta função — pergunte a data a ele.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            dtPesquisa: {
              type: Type.STRING,
              description: "Data da posição no formato YYYY-MM-DD, extraída da conversa.",
            },
            idCarteira: {
              type: Type.INTEGER,
              description: "ID da carteira. Use 0 para a visão geral (padrão).",
            },
          },
          required: ["dtPesquisa"],
        },
      },
      {
        name: TOOL_UI,
        description:
          "Controla a INTERFACE do painel a pedido do usuário: troca a aba visível, aplica " +
          "filtro por classe na tabela de posições e/ou muda a dimensão do gráfico de alocação. " +
          "Use quando o usuário pedir para 'ir para', 'abrir', 'mostrar', 'filtrar por', " +
          "'ver as posições de', 'agrupar a alocação por', etc. " +
          "Pode ser combinada com a consulta de dados no mesmo turno. " +
          "Para filtrar por classe, use EXATAMENTE um dos nomes de classe presentes nos dados " +
          "(ex.: 'LIQUIDEZ', 'CURTO PRAZO', 'Não classificado'); use 'todas' para limpar o filtro.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            aba: {
              type: Type.STRING,
              enum: ["geral", "analise", "posicoes"],
              description:
                "Aba a exibir: 'geral' (resumo + alocação), 'analise' (gráficos detalhados) " +
                "ou 'posicoes' (tabela de ativos).",
            },
            filtroClasse: {
              type: Type.STRING,
              description:
                "Nome da classe para filtrar a tabela de posições (ex.: 'CURTO PRAZO'). " +
                "Use 'todas' para remover o filtro. Ao definir, a aba 'posicoes' será aberta.",
            },
            dimensaoAlocacao: {
              type: Type.STRING,
              enum: ["porClasse", "porFamilia", "porAtivo"],
              description: "Dimensão do gráfico de alocação (rosca) na aba geral.",
            },
          },
        },
      },
    ],
  },
];

const passivoTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: TOOL_DADOS_PASSIVO,
        description:
          "Busca a posição de passivo (cotistas) de um fundo em uma data específica e retorna " +
          "totais de valor bruto, líquido, rendimento, IRRF e IOF. Use quando o usuário pedir " +
          "dados reais de cotistas (posição, valor, rendimento, tributos), ou quando precisar " +
          "trocar o fundo/cotista/data exibidos no painel. NÃO use em saudações ou perguntas " +
          "conceituais. Se o usuário pedir dados mas não informar a data e ela não puder ser " +
          "inferida do contexto, NÃO chame esta função — pergunte a data a ele.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            dtPesquisa: {
              type: Type.STRING,
              description: "Data da posição no formato YYYY-MM-DD, extraída da conversa.",
            },
            idCarteira: {
              type: Type.INTEGER,
              description: "ID do fundo (carteira de passivo). Use 0 para a visão geral (padrão).",
            },
            idCotista: {
              type: Type.INTEGER,
              description: "ID do cotista, quando já conhecido. Use 0 para todos os cotistas (padrão).",
            },
            nomeCotista: {
              type: Type.STRING,
              description:
                "Nome (ou parte do nome) do cotista, quando o usuário citar por nome em vez de ID. " +
                "Use este campo em vez de idCotista sempre que o usuário disser um nome — a busca " +
                "pelo ID correspondente é feita no backend.",
            },
          },
          required: ["dtPesquisa"],
        },
      },
    ],
  },
];

export interface AgentResult {
  answer: string;
  toolUsed: boolean;
  data:
    | { modo: "ativos"; dtPesquisa: string; idCarteira: number; summary: PortfolioSummary }
    | { modo: "passivos"; dtPesquisa: string; idCarteira: number; idCotista: number; summary: PassivoSummary }
    | null;
  ui: UiActions | null;
  cacheHit: boolean;
  history: ChatMessage[];
}

/** Converte nosso histórico de domínio para o formato Content do Gemini. */
function toContents(history: ChatMessage[]): Content[] {
  return history.map((m) => ({ role: m.role, parts: [{ text: m.content }] }));
}

/** Executa a consulta de dados: valida data -> cache -> Zarya -> analytics. */
async function executarConsulta(
  args: Record<string, unknown>,
  ctx?: AgentContext,
): Promise<{ resultParaLLM: unknown; data: AgentResult["data"]; cacheHit: boolean }> {
  const dtPesquisa = typeof args.dtPesquisa === "string" ? args.dtPesquisa : ctx?.dtPesquisa;
  const idCarteira =
    typeof args.idCarteira === "number" ? args.idCarteira : ctx?.idCarteira ?? 0;

  const check = validarDtPesquisa(dtPesquisa);
  if (!check.ok) {
    return {
      resultParaLLM: {
        erro: "data_invalida",
        motivo: check.motivo,
        instrucao:
          "A data não pôde ser usada. Peça ao usuário, de forma educada, qual data ele deseja " +
          "para a posição da carteira (ex.: 2025-06-05).",
      },
      data: null,
      cacheHit: false,
    };
  }

  const { summary, cacheHit } = await portfolio.getSummary(check.value, idCarteira);
  const semDados = summary.quantidadePosicoes === 0;

  return {
    resultParaLLM: semDados
      ? { aviso: "sem_dados", mensagem: "Não há posições para esta data/carteira." }
      : summary,
    data: { modo: "ativos", dtPesquisa: check.value, idCarteira, summary },
    cacheHit,
  };
}

/** Executa a consulta de posição de passivo: valida data -> cache -> Zarya -> analytics. */
async function executarConsultaPassivo(
  args: Record<string, unknown>,
  ctx?: AgentContext,
): Promise<{ resultParaLLM: unknown; data: AgentResult["data"]; cacheHit: boolean }> {
  const dtPesquisa = typeof args.dtPesquisa === "string" ? args.dtPesquisa : ctx?.dtPesquisa;
  const idCarteira =
    typeof args.idCarteira === "number" ? args.idCarteira : ctx?.idCarteira ?? 0;

  const check = validarDtPesquisa(dtPesquisa);
  if (!check.ok) {
    return {
      resultParaLLM: {
        erro: "data_invalida",
        motivo: check.motivo,
        instrucao:
          "A data não pôde ser usada. Peça ao usuário, de forma educada, qual data ele deseja " +
          "para a posição de passivo (ex.: 2025-06-05).",
      },
      data: null,
      cacheHit: false,
    };
  }

  let idCotista = typeof args.idCotista === "number" ? args.idCotista : ctx?.idCotista ?? 0;

  const nomeCotista = typeof args.nomeCotista === "string" ? args.nomeCotista.trim() : "";
  if (nomeCotista) {
    const { cotistas } = await portfolio.listCotistas(check.value, idCarteira);
    const termo = nomeCotista.toLowerCase();
    const encontrado = cotistas.find((c) => c.nome.toLowerCase().includes(termo));
    if (!encontrado) {
      return {
        resultParaLLM: {
          erro: "cotista_nao_encontrado",
          nomeBuscado: nomeCotista,
          cotistasDisponiveis: cotistas.map((c) => c.nome),
          instrucao:
            "Nenhum cotista com esse nome foi encontrado neste fundo/data. Informe ao usuário e, " +
            "se útil, sugira nomes da lista disponível.",
        },
        data: null,
        cacheHit: false,
      };
    }
    idCotista = encontrado.idCotista;
  }

  const { summary, cacheHit } = await portfolio.getPassivoSummary(check.value, idCarteira, idCotista);
  const semDados = summary.quantidadePosicoes === 0;

  return {
    resultParaLLM: semDados
      ? { aviso: "sem_dados", mensagem: "Não há posições de passivo para esta data/fundo/cotista." }
      : summary,
    data: { modo: "passivos", dtPesquisa: check.value, idCarteira, idCotista, summary },
    cacheHit,
  };
}

/** Interpreta a ação de interface e devolve as ações normalizadas. */
function executarUi(args: Record<string, unknown>): {
  resultParaLLM: unknown;
  ui: UiActions;
} {
  const ui: UiActions = {};

  const aba = typeof args.aba === "string" ? args.aba.toLowerCase() : undefined;
  if (aba === "geral" || aba === "analise" || aba === "posicoes") ui.aba = aba;

  const dim = typeof args.dimensaoAlocacao === "string" ? args.dimensaoAlocacao : undefined;
  if (dim === "porClasse" || dim === "porFamilia" || dim === "porAtivo") ui.dimensaoAlocacao = dim;

  if (typeof args.filtroClasse === "string" && args.filtroClasse.trim()) {
    ui.filtroClasse = args.filtroClasse.trim();
    if (!ui.aba) ui.aba = "posicoes"; // filtrar implica abrir a tabela
  }

  return { resultParaLLM: { ok: true, aplicado: ui }, ui };
}

/**
 * Roda um turno completo do agente.
 * Decide (via function calling) se conversa, consulta a carteira e/ou controla a
 * interface, executa as ferramentas no backend e devolve a narração + os dados.
 */
export async function runTurn(history: ChatMessage[], ctx?: AgentContext): Promise<AgentResult> {
  const systemInstruction = buildSystemPrompt(new Date(), ctx);
  const contents = toContents(history);
  const activeTools = ctx?.modo === "passivos" ? passivoTools : tools;

  let toolUsed = false;
  let cacheHit = false;
  let data: AgentResult["data"] = null;
  let ui: UiActions | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const res = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      config: { systemInstruction, temperature: 0.2, tools: activeTools },
      contents,
    });

    const calls = res.functionCalls ?? [];

    // Sem chamadas de ferramenta => resposta textual final.
    if (calls.length === 0) {
      const answer = res.text ?? "";
      const nextHistory: ChatMessage[] = [...history, { role: "model", content: answer }];
      return { answer, toolUsed, data, ui, cacheHit, history: nextHistory };
    }

    toolUsed = true;

    // Reinjeta o conteúdo ORIGINAL do modelo (preserva thoughtSignature exigida
    // pelo Gemini para tools; remontar à mão causa erro 400).
    const modelContent = res.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    // Executa TODAS as chamadas do turno e devolve as respostas correspondentes.
    const parts: Content["parts"] = [];
    for (const fc of calls) {
      if (fc.name === TOOL_DADOS) {
        const exec = await executarConsulta(fc.args ?? {}, ctx);
        if (exec.data) data = exec.data;
        cacheHit = exec.cacheHit;
        parts.push({
          functionResponse: { name: TOOL_DADOS, response: exec.resultParaLLM as Record<string, unknown> },
        });
      } else if (fc.name === TOOL_DADOS_PASSIVO) {
        const exec = await executarConsultaPassivo(fc.args ?? {}, ctx);
        if (exec.data) data = exec.data;
        cacheHit = exec.cacheHit;
        parts.push({
          functionResponse: { name: TOOL_DADOS_PASSIVO, response: exec.resultParaLLM as Record<string, unknown> },
        });
      } else if (fc.name === TOOL_UI) {
        const exec = executarUi(fc.args ?? {});
        ui = { ...(ui ?? {}), ...exec.ui };
        parts.push({
          functionResponse: { name: TOOL_UI, response: exec.resultParaLLM as Record<string, unknown> },
        });
      } else {
        parts.push({
          functionResponse: { name: fc.name ?? "desconhecida", response: { erro: "ferramenta_desconhecida" } },
        });
      }
    }

    contents.push({ role: "user", parts });
  }

  const fallback = "Não consegui concluir a ação agora. Pode reformular o pedido?";
  return {
    answer: fallback,
    toolUsed,
    data,
    ui,
    cacheHit,
    history: [...history, { role: "model", content: fallback }],
  };
}
