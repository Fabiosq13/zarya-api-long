import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, Table2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { seriesColor } from "@/lib/palette";
import { formatBRL, formatNumber, formatPct, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DetailedPosition } from "@/types";

type SortKey = "ativo" | "valor" | "percentual" | "rendimentoLiquido";

const COLS: { key: SortKey; label: string; align: "left" | "right"; hide?: string }[] = [
  { key: "ativo", label: "Ativo", align: "left" },
  { key: "valor", label: "Valor", align: "right" },
  { key: "percentual", label: "Participação", align: "right" },
  { key: "rendimentoLiquido", label: "Rend. líquido", align: "right", hide: "hidden md:table-cell" },
];

export function PositionsTable({
  posicoes,
  classe: classeProp,
  onClasse,
}: {
  posicoes: DetailedPosition[];
  classe?: string;
  onClasse?: (c: string) => void;
}) {
  const [q, setQ] = useState("");
  const [classeLocal, setClasseLocal] = useState<string>("__todas__");
  const classe = classeProp ?? classeLocal;
  const setClasse = (c: string) => { onClasse?.(c); setClasseLocal(c); };
  const [sort, setSort] = useState<SortKey>("valor");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  // classes distintas + cor estável por classe
  const { classes, colorOf } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posicoes) counts.set(p.classe, (counts.get(p.classe) ?? 0) + 1);
    const list = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const map = new Map(list.map((c, i) => [c, seriesColor(i)]));
    return { classes: list, colorOf: (c: string) => map.get(c) ?? "#94a3b8" };
  }, [posicoes]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = posicoes.filter((p) => {
      if (classe !== "__todas__" && p.classe !== classe) return false;
      if (!term) return true;
      return (
        p.ativo.toLowerCase().includes(term) ||
        p.classe.toLowerCase().includes(term) ||
        p.familia.toLowerCase().includes(term) ||
        (p.emissor ?? "").toLowerCase().includes(term)
      );
    });
    return [...filtered].sort((a, b) => {
      const va = a[sort];
      const vb = b[sort];
      if (typeof va === "string" && typeof vb === "string")
        return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return dir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [posicoes, q, classe, sort, dir]);

  const maxPct = rows.reduce((m, p) => Math.max(m, p.percentual), 0) || 1;
  const totals = rows.reduce(
    (a, p) => {
      a.valor += p.valor;
      a.pct += p.percentual;
      a.rend += p.rendimentoLiquido;
      return a;
    },
    { valor: 0, pct: 0, rend: 0 },
  );

  function toggleSort(k: SortKey) {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(k);
      setDir(k === "ativo" ? "asc" : "desc");
    }
  }

  return (
    <Card className="fade-up flex h-full min-h-0 flex-col overflow-hidden">
      {/* Cabeçalho + controles */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Table2 className="h-4 w-4" />
          </span>
          <div>
            <p className="eyebrow">Detalhamento</p>
            <h3 className="text-[0.95rem] font-bold tracking-tight">Posições ({rows.length})</h3>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select value={classe} onValueChange={setClasse}>
            <SelectTrigger className="h-9 w-full sm:w-[12.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todas__">Todas as classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: colorOf(c) }} />
                    {c}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar ativo…"
              className="h-9 w-full rounded-lg border border-border-strong bg-panel pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
      </div>

      {/* Corpo rolável */}
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
                    c.hide,
                  )}
                >
                  <span className={cn("inline-flex items-center gap-1", c.align === "right" && "flex-row-reverse")}>
                    {c.label}
                    {sort === c.key && (dir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />)}
                  </span>
                </th>
              ))}
              <th className="hidden whitespace-nowrap border-b border-border px-4 py-3 text-right text-[0.68rem] font-bold uppercase tracking-wide text-muted-foreground lg:table-cell">
                Vencimento
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={`${p.ativo}-${i}`} className="border-b border-border/50 transition-colors last:border-0 hover:bg-[hsl(220_24%_97.5%)]">
                {/* Ativo + classe (cor) */}
                <td className="max-w-[230px] px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(p.classe) }} title={p.classe} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink" title={p.ativo}>{p.ativo}</p>
                      <p className="truncate text-[0.68rem] text-muted-foreground">
                        {p.classe}{p.emissor ? ` · ${p.emissor}` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                {/* Valor */}
                <td className="num whitespace-nowrap px-4 py-2.5 text-right font-semibold">
                  {formatBRL(p.valor)}
                  <span className="ml-2 hidden text-[0.66rem] text-muted-foreground xl:inline">{formatNumber(p.quantidade)} un.</span>
                </td>
                {/* Participação com mini-barra */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[hsl(220_18%_92%)] sm:block">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (p.percentual / maxPct) * 100)}%` }} />
                    </div>
                    <span className="num w-12 text-right font-bold">{formatPct(p.percentual)}</span>
                  </div>
                </td>
                {/* Rend líquido */}
                <td className={cn("num hidden whitespace-nowrap px-4 py-2.5 text-right font-semibold md:table-cell", p.rendimentoLiquido >= 0 ? "text-gain" : "text-loss")}>
                  {p.rendimentoLiquido >= 0 ? "+" : ""}{formatBRL(p.rendimentoLiquido)}
                </td>
                {/* Vencimento */}
                <td className="num hidden whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground lg:table-cell">
                  {p.dtVencimento ? formatDateShort(p.dtVencimento) : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma posição encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé com totais */}
      {rows.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-[hsl(220_38%_98%)] px-4 py-3 text-sm">
          <span className="font-semibold text-muted-foreground">Total · {rows.length} {rows.length === 1 ? "posição" : "posições"}</span>
          <div className="flex items-center gap-5">
            <span className="num font-bold text-ink">{formatBRL(totals.valor)}</span>
            <span className="num hidden w-12 text-right font-bold text-ink sm:inline">{formatPct(totals.pct)}</span>
            <span className={cn("num hidden whitespace-nowrap font-bold md:inline", totals.rend >= 0 ? "text-gain" : "text-loss")}>
              {totals.rend >= 0 ? "+" : ""}{formatBRL(totals.rend)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
