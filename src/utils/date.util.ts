/**
 * Tratamento de datas:
 * - sentinela "0001-01-01..." vira null;
 * - validação determinística da data extraída pela LLM (não confiar cegamente);
 * - resolução opcional de datas relativas a partir de "hoje".
 */

const RANGE_MIN = new Date("2015-01-01T00:00:00Z");

/** Data sentinela da Zarya (não se aplica). */
export function isSentinelDate(d?: string | null): boolean {
  return !d || d.startsWith("0001-01-01");
}

/** ISO "YYYY-MM-DD" de uma data. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Converte a data interna (sempre ISO "YYYY-MM-DD") para o formato esperado por
 * cada endpoint da Zarya. Os dois endpoints usam formatos DIFERENTES:
 *   - Ativos/Carteira: "MM/DD/YYYY"  (barras)  -> ex.: 01/27/2026
 *   - Passivo/Cotista: "MM-DD-YYYY"  (hifens)  -> ex.: 02-02-2026
 * A conversão acontece só na borda (zarya.service); o resto do app fala ISO.
 */
export function toZaryaAtivosDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${m}/${d}/${y}`;
}

export function toZaryaPassivoDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${m}-${d}-${y}`;
}

/** Dias entre hoje e a data alvo (negativo = já venceu). */
export function diasAteVencimento(dtVencimento: string, base = new Date()): number {
  const alvo = new Date(`${dtVencimento.slice(0, 10)}T00:00:00Z`);
  const hoje = new Date(`${toISODate(base)}T00:00:00Z`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export type DateCheck = { ok: true; value: string } | { ok: false; motivo: string };

/**
 * Valida a dtPesquisa extraída pela LLM.
 * Aceita apenas YYYY-MM-DD real, não-futura e dentro de um range plausível.
 */
export function validarDtPesquisa(d?: string, base = new Date()): DateCheck {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return { ok: false, motivo: "formato_invalido" };
  }
  const data = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(data.getTime())) return { ok: false, motivo: "data_inexistente" };
  // Garante que a string corresponde à data real (rejeita 2025-02-30, etc.)
  if (toISODate(data) !== d) return { ok: false, motivo: "data_inexistente" };

  const hoje = new Date(`${toISODate(base)}T00:00:00Z`);
  if (data.getTime() > hoje.getTime()) return { ok: false, motivo: "data_futura" };
  if (data.getTime() < RANGE_MIN.getTime()) return { ok: false, motivo: "data_muito_antiga" };

  return { ok: true, value: d };
}
