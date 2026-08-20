/** Paleta categórica alinhada à marca Zarya (cores frias: azul, roxo, ciano...). */
export const SERIES = [
  "#2979FF", // azul (marca)
  "#7A3FFF", // roxo (marca)
  "#00E5FF", // ciano (marca)
  "#C026D3", // magenta
  "#14B8A6", // teal
  "#6366F1", // índigo
  "#0EA5E9", // azul-céu
  "#667085", // neutro (marca) — "Outros"
];

export const seriesColor = (i: number) => SERIES[i % SERIES.length];
