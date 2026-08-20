import { env } from "../config/env.js";
import { toZaryaAtivosDate, toZaryaPassivoDate } from "../utils/date.util.js";
import type { ZaryaResponse, ZaryaPassivoPosition } from "../types/zarya.types.js";

export class ZaryaError extends Error {
  constructor(message: string, readonly status?: number, readonly body?: unknown) {
    super(message);
    this.name = "ZaryaError";
  }
}

interface BuscaParams {
  dtPesquisa: string; // YYYY-MM-DD
  idCarteira?: number; // 0 = visão geral
}

/**
 * ÚNICO ponto que fala com a Zarya.
 * Faz o URL encode do token (equivalente ao HttpUtility::UrlEncode do PowerShell),
 * aplica timeout e trata erros HTTP.
 */
export async function buscaComposicao({ dtPesquisa, idCarteira = 0 }: BuscaParams): Promise<ZaryaResponse> {
  const query = new URLSearchParams({
    token: env.ZARYA_TOKEN, // URLSearchParams encoda / e + automaticamente
    dt_Pesquisa: toZaryaAtivosDate(dtPesquisa), // MM/DD/YYYY
    id_Carteira: String(idCarteira),
  });

  const url = `${env.ZARYA_BASE_URL}/api/v1/PosicaoAtivos/busca_composicao_carteira_data?${query.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ZARYA_TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ZaryaError("Timeout ao consultar a Zarya", 504);
    }
    // `fetch failed` esconde a causa real (DNS, proxy, TLS) em err.cause.
    const cause = (err as { cause?: unknown }).cause;
    const detalhe = cause instanceof Error ? cause.message : String(cause ?? (err as Error).message);
    throw new ZaryaError(`Falha de rede ao consultar a Zarya (${detalhe}) — URL: ${url}`);
  } finally {
    clearTimeout(timeout);
  }

  const text = await resp.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!resp.ok) {
    throw new ZaryaError(`Zarya respondeu ${resp.status} ${resp.statusText}`, resp.status, data);
  }

  const parsed = data as ZaryaResponse;
  if (!parsed || typeof parsed.Status === "undefined" || !Array.isArray(parsed.Object)) {
    throw new ZaryaError("Resposta da Zarya em formato inesperado", resp.status, data);
  }

  return parsed;
}

interface BuscaPassivoParams {
  dtPesquisa: string; // YYYY-MM-DD
  idCarteira?: number; // 0 = todas as carteiras
  idCotista?: number; // 0 = todos os cotistas
}

/**
 * Fala com o endpoint de PASSIVO (posicao por cotista) da Zarya.
 * Espelha buscaComposicao, mas para /api/v1/Passivo/PosicaoConsolidada.
 */
export async function buscaPassivoComposicao({
  dtPesquisa,
  idCarteira = 0,
  idCotista = 0,
}: BuscaPassivoParams): Promise<ZaryaResponse<ZaryaPassivoPosition>> {
  const query = new URLSearchParams({
    token: env.ZARYA_TOKEN,
    data: toZaryaPassivoDate(dtPesquisa), // MM-DD-YYYY
    cotista: String(idCotista),
    portfolio: String(idCarteira),
    serie: "0",
  });

  const url = `${env.ZARYA_BASE_URL}/api/v1/Passivo/PosicaoConsolidada?${query.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ZARYA_TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ZaryaError("Timeout ao consultar a Zarya", 504);
    }
    const cause = (err as { cause?: unknown }).cause;
    const detalhe = cause instanceof Error ? cause.message : String(cause ?? (err as Error).message);
    throw new ZaryaError(`Falha de rede ao consultar a Zarya (${detalhe}) — URL: ${url}`);
  } finally {
    clearTimeout(timeout);
  }

  const text = await resp.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!resp.ok) {
    throw new ZaryaError(`Zarya respondeu ${resp.status} ${resp.statusText}`, resp.status, data);
  }

  const parsed = data as ZaryaResponse<ZaryaPassivoPosition>;
  if (!parsed || typeof parsed.Status === "undefined" || !Array.isArray(parsed.Object)) {
    throw new ZaryaError("Resposta da Zarya em formato inesperado", resp.status, data);
  }

  return parsed;
}
