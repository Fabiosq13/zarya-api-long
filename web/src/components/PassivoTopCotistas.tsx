import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { seriesColor } from "@/lib/palette";
import { formatBRL, formatPct } from "@/lib/format";
import type { PassivoSummary } from "@/types";

export function PassivoTopCotistas({ summary }: { summary: PassivoSummary }) {
  const data = summary.maioresCotistas.slice(0, 8);
  const max = data.length ? Math.max(...data.map((d) => d.valor)) : 1;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border p-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow">Concentração</p>
          <h3 className="text-[0.95rem] font-bold tracking-tight">Maiores cotistas</h3>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3.5 overflow-auto p-5">
        {data.map((d, i) => (
          <div key={d.nome} className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-ink/90" title={d.nome}>{d.nome}</span>
              <span className="num shrink-0 text-xs text-muted-foreground">
                {formatBRL(d.valor)}
                <span className="ml-2 font-bold text-ink">{formatPct(d.percentual)}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(220_18%_93%)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, (d.valor / max) * 100)}%`,
                  background: seriesColor(i),
                  animation: "growBar .6s cubic-bezier(.16,1,.3,1) both",
                  animationDelay: `${i * 0.04}s`,
                }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Sem cotistas.</p>}
      </div>
    </Card>
  );
}
