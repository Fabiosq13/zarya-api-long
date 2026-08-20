import { Redis } from "ioredis";
import { env } from "../config/env.js";

/**
 * Cliente Redis singleton.
 * - Se REDIS_URL estiver definida (ex.: plugin Redis do Railway), conecta.
 * - Caso contrário, retorna null e o conversation.service usa memória (dev local).
 *
 * No Railway, ao adicionar o plugin Redis e referenciá-lo no serviço,
 * a variável REDIS_URL é injetada automaticamente.
 */

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (client) return client;

  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    enableReadyCheck: true,
    // Railway: rede interna usa IPv6. family:0 habilita dual-stack (IPv4+IPv6)
    // e evita o erro ENOTFOUND redis.railway.internal.
    family: 0,
  });

  client.on("error", (err: Error) => {
    // Não derruba o app: apenas registra. O service trata indisponibilidade.
    console.error("[redis] erro de conexão:", err.message);
  });

  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
