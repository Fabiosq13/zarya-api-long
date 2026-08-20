/** Converte qualquer entrada em número finito; default 0. */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** Percentual de `parte` sobre `total`, com 2 casas. Seguro contra divisão por zero. */
export function pct(parte: number, total: number): number {
  if (!total) return 0;
  return Math.round((parte / total) * 10000) / 100;
}

/** Arredonda para 2 casas decimais (valores monetários). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Arredonda para 6 casas decimais (quantidades fracionárias, ex.: cotas). */
export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
