/**
 * Cache simples em memória com TTL, chaveado por dtPesquisa+idCarteira.
 * Interface propositalmente pequena para trocar por Redis (ioredis) ao escalar,
 * sem tocar no resto do código.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export async function get<T>(key: string): Promise<T | null> {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function has(key: string): Promise<boolean> {
  return (await get(key)) !== null;
}

/** Útil em testes. */
export function clear(): void {
  store.clear();
}
