const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata em Reais: 1234567.89 -> "R$ 1.234.567,89". */
export function formatBRL(value: number): string {
  return BRL.format(value);
}

/** Formata percentual com 2 casas: 62.4 -> "62,40%". */
export function formatPct(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}
