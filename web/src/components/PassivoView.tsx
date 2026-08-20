import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatBRL, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PassivoSummaryHero } from "@/components/PassivoSummaryHero";
import { PassivoDonutAllocation } from "@/components/PassivoDonutAllocation";
import { PassivoTopCotistas } from "@/components/PassivoTopCotistas";
import { PassivoFluxoCard } from "@/components/PassivoFluxoCard";
import { PassivoTributosCard } from "@/components/PassivoTributosCard";
import { PassivoAnaliseView } from "@/components/PassivoAnaliseView";
import {
  PassivoViewTabs,
  type PassivoViewKey,
} from "@/components/PassivoViewTabs";
import type { DetailedPassivoPosition, PassivoSummary } from "@/types";

type SortKey =
  | "cotista"
  | "valorBruto"
  | "valorLiquido"
  | "rendimento"
  | "percentual";

const COLS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "cotista", label: "Cotista", align: "left" },
  { key: "valorBruto", label: "Valor bruto", align: "right" },
  { key: "valorLiquido", label: "Valor líquido", align: "right" },
  { key: "rendimento", label: "Rendimento", align: "right" },
  { key: "percentual", label: "Participação", align: "right" },
];

export function PassivoView({
  summary,
  posicoes,
  dtPesquisa,
}: {
  summary: PassivoSummary;
  posicoes: DetailedPassivoPosition[];
  dtPesquisa: string;
}) {
  const [view, setView] = useState<PassivoViewKey>("geral");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("valorBruto");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = posicoes.filter((p) => {
      if (!term) return true;
      return (
        p.cotista.toLowerCase().includes(term) ||
        p.carteira.toLowerCase().includes(term)
      );
    });
    return [...filtered].sort((a, b) => {
      const va = a[sort];
      const vb = b[sort];
      if (typeof va === "string" && typeof vb === "string")
        return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return dir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
  }, [posicoes, q, sort, dir]);

  function toggleSort(k: SortKey) {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(k);
      setDir(k === "cotista" ? "asc" : "desc");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PassivoViewTabs value={view} onChange={setView} count={rows.length} />

      <PassivoSummaryHero summary={summary} dtPesquisa={dtPesquisa} />

      {view === "geral" && (
        <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-0.5">
          <div className="grid h-96 grid-cols-1 gap-4 xl:grid-cols-2">
            <PassivoDonutAllocation summary={summary} />
            <PassivoTopCotistas summary={summary} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PassivoFluxoCard summary={summary} />
            <PassivoTributosCard summary={summary} />
          </div>
        </div>
      )}

      {view === "cotistas" && (
        <Card className="fade-up flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="eyebrow">Detalhamento</p>
                <h3 className="text-[0.95rem] font-bold tracking-tight">
                  Cotistas ({rows.length})
                </h3>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cotista ou carteira…"
                className="h-9 w-full rounded-lg border border-border-strong bg-panel pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[hsl(220_38%_98%)]">
                <tr>
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "cursor-pointer select-none whitespace-nowrap border-b border-border px-4 py-3 text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-ink",
                        c.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          c.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {c.label}
                        {sort === c.key &&
                          (dir === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                          ))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr
                    key={`${p.cotista}-${p.carteira}-${i}`}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-[hsl(220_24%_97.5%)]"
                  >
                    <td className="max-w-[230px] px-4 py-2.5">
                      <p
                        className="truncate font-semibold text-ink"
                        title={p.cotista}
                      >
                        {p.cotista}
                      </p>
                      <p className="truncate text-[0.68rem] text-muted-foreground">
                        {p.carteira}
                      </p>
                    </td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right font-semibold">
                      {formatBRL(p.valorBruto)}
                    </td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right font-semibold">
                      {formatBRL(p.valorLiquido)}
                    </td>
                    <td
                      className={cn(
                        "num whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                        p.rendimento >= 0 ? "text-gain" : "text-loss",
                      )}
                    >
                      {p.rendimento >= 0 ? "+" : ""}
                      {formatBRL(p.rendimento)}
                    </td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right font-bold">
                      {formatPct(p.percentual)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma posição encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === "analise" && <PassivoAnaliseView summary={summary} />}
    </div>
  );
}
