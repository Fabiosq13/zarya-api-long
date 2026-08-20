import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import type { PassivoSummary } from "@/types";

export function PassivoTributosCard({ summary }: { summary: PassivoSummary }) {
  const total = summary.irrfTotal + summary.comeCotasTotal;
  const parts = [
    { label: "IR (IRRF)", value: summary.irrfTotal, color: "#2979FF" },
    { label: "Come-cotas", value: summary.comeCotasTotal, color: "#C98A12" },
  ];

  return (
    <Card className="fade-up h-full">
      <div className="flex items-center gap-2 border-b border-border p-3.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/10 text-gold">
          <Receipt className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="eyebrow">Carga tributária</p>
          <h3 className="text-[0.85rem] font-bold tracking-tight">
            Tributação do fundo
          </h3>
        </div>
      </div>
      <div className="p-3.5">
        <p className="text-[0.68rem] font-medium text-muted-foreground">
          Total retido
        </p>
        <p className="num mt-0.5 text-lg font-extrabold tracking-tight">
          {formatBRL(total)}
        </p>
        <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-[hsl(220_18%_93%)]">
          {parts.map((p) => (
            <div
              key={p.label}
              style={{
                width: `${total > 0 ? (p.value / total) * 100 : 0}%`,
                background: p.color,
              }}
            />
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {parts.map((p) => (
            <div key={p.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: p.color }}
                />
                {p.label}
              </span>
              <span className="num text-xs font-bold">
                {formatBRL(p.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
