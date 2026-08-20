import type { ChatMessage } from "../types/portfolio.types.js";
import { env } from "../config/env.js";
import { getRedis } from "./redis.js";

/**
 * Histórico de conversas por conversationId.
 *
 * Backend:
 *  - Redis (quando REDIS_URL está definida) — persistente, sobrevive a deploys
 *    e funciona com múltiplas instâncias. Cada conversa tem TTL.
 *  - Memória (fallback para dev local sem Redis).
 *
 * Aplica janela deslizante (CONVERSATION_MAX_TURNS) para não estourar contexto/custo.
 *
 * IMPORTANTE: o conversationId é fornecido livremente pelo cliente (sem auth).
 * Não exponha esse endpoint publicamente com dados sensíveis sem adicionar
 * uma camada de autenticação que valide a posse da conversa.
 */

const MAX_TURNS = env.CONVERSATION_MAX_TURNS;
const TTL = env.CONVERSATION_TTL_SECONDS;

function key(conversationId: string): string {
  return `conv:${conversationId}`;
}

// Fallback em memória (usado apenas quando não há Redis).
const memory = new Map<string, ChatMessage[]>();

export async function load(conversationId: string): Promise<ChatMessage[]> {
  const redis = getRedis();
  if (!redis) {
    return memory.get(conversationId) ?? [];
  }
  try {
    const raw = await redis.get(key(conversationId));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch (err) {
    console.error("[conversation] falha ao ler do Redis:", (err as Error).message);
    return [];
  }
}

export async function save(conversationId: string, history: ChatMessage[]): Promise<void> {
  const trimmed = history.slice(-MAX_TURNS);
  const redis = getRedis();

  if (!redis) {
    memory.set(conversationId, trimmed);
    return;
  }
  try {
    // SET com expiração: renova o TTL a cada turno (sliding expiration).
    await redis.set(key(conversationId), JSON.stringify(trimmed), "EX", TTL);
  } catch (err) {
    console.error("[conversation] falha ao gravar no Redis:", (err as Error).message);
  }
}

export async function append(
  conversationId: string,
  messages: ChatMessage[],
): Promise<ChatMessage[]> {
  const next = [...(await load(conversationId)), ...messages].slice(-MAX_TURNS);
  await save(conversationId, next);
  return next;
}

/** Apaga uma conversa específica. */
export async function remove(conversationId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memory.delete(conversationId);
    return;
  }
  try {
    await redis.del(key(conversationId));
  } catch (err) {
    console.error("[conversation] falha ao apagar do Redis:", (err as Error).message);
  }
}

/** Útil em testes (apenas memória). */
export function clearMemory(): void {
  memory.clear();
}
