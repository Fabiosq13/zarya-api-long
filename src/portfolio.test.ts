import { describe, it, expect } from "vitest";
import { buildSummary } from "./services/portfolioAnalytics.service.js";
import { normalizePosition } from "./services/normalize.js";
import { validarDtPesquisa } from "./utils/date.util.js";
import type { ZaryaPosition } from "./types/zarya.types.js";

const fixtures: ZaryaPosition[] = [
  {
    nu_Portfolio: 1,
    no_Classe: "Renda Fixa",
    no_Familia_Produto: "CDB",
    no_Ativo: "CDB Banco X",
    no_Emissor: "Banco X",
    vl_Estoque: 6000,
    vl_Liquido: 5800,
    vl_Rendimento_Liquido: 100,
    vl_Rendimento_Dia: 5,
    vl_Tributos: 50,
    vl_IRRF: 40,
    vl_IOF: 10,
    dt_Vencimento: "0001-01-01T00:00:00", // sentinela -> null
  },
  {
    nu_Portfolio: 1,
    no_Classe: "Renda Variável",
    no_Familia_Produto: "Ações",
    no_Ativo: "PETR4",
    no_Emissor: "Petrobras",
    vl_Estoque: 4000,
    vl_Liquido: 3900,
    vl_Rendimento_Liquido: 80,
    vl_Rendimento_Dia: 3,
    vl_Tributos: 20,
    vl_IRRF: 15,
    vl_IOF: 5,
    dt_Vencimento: "0001-01-01T00:00:00",
  },
];

describe("normalizePosition", () => {
  it("converte data sentinela em null", () => {
    const n = normalizePosition(fixtures[0]!);
    expect(n.dtVencimento).toBeNull();
    expect(n.diasParaVencimento).toBeNull();
  });

  it("garante números válidos com fallback", () => {
    const n = normalizePosition({ no_Ativo: "X" } as ZaryaPosition);
    expect(n.vlEstoque).toBe(0);
    expect(n.noEmissor).toBeNull();
  });
});

describe("buildSummary", () => {
  const normalized = fixtures.map(normalizePosition);
  const summary = buildSummary(normalized);

  it("calcula o total bruto corretamente", () => {
    expect(summary.totalBruto).toBe(10000);
  });

  it("calcula percentuais por classe", () => {
    const rf = summary.porClasse.find((c) => c.nome === "Renda Fixa");
    expect(rf?.valor).toBe(6000);
    expect(rf?.percentual).toBe(60);
  });

  it("ordena classes por valor desc", () => {
    expect(summary.porClasse[0]!.nome).toBe("Renda Fixa");
  });

  it("soma tributos, IRRF e IOF", () => {
    expect(summary.tributosTotais).toBe(70);
    expect(summary.irrfTotal).toBe(55);
    expect(summary.iofTotal).toBe(15);
  });
});

describe("validarDtPesquisa", () => {
  const base = new Date("2025-06-25T00:00:00Z");

  it("aceita data válida no passado", () => {
    expect(validarDtPesquisa("2025-06-05", base)).toEqual({ ok: true, value: "2025-06-05" });
  });

  it("rejeita formato inválido", () => {
    expect(validarDtPesquisa("05/06/2025", base)).toEqual({ ok: false, motivo: "formato_invalido" });
  });

  it("rejeita data inexistente", () => {
    expect(validarDtPesquisa("2025-02-30", base)).toEqual({ ok: false, motivo: "data_inexistente" });
  });

  it("rejeita data futura", () => {
    expect(validarDtPesquisa("2030-01-01", base)).toEqual({ ok: false, motivo: "data_futura" });
  });

  it("rejeita data ausente", () => {
    expect(validarDtPesquisa(undefined, base)).toEqual({ ok: false, motivo: "formato_invalido" });
  });
});
