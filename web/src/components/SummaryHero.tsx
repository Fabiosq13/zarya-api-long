import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { formatBRL, formatNumber, formatPct, formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PortfolioSummary } from "@/types";

export function SummaryHero({
  summary,
  dtPesquisa,
}: {
  summary: PortfolioSummary;
  dtPesquisa: string;
}) {
  const upDia = summary.rendimentoDia >= 0;
  const upAcum = summary.rendimentoLiquidoTotal >= 0;
  const diaPct = summary.totalBruto > 0 ? (summary.rendimentoDia / summary.totalBruto) * 100 : 0;

  const stats = [
    { label: "Patrimônio líquido", value: formatBRL(summary.totalLiquido), tone: "text-ink" },
    { label: "Rendimento acumulado", value: formatBRL(summary.rendimentoLiquidoTotal), tone: upAcum ? "text-gain" : "text-loss" },
    { label: "Tributos totais", value: formatBRL(summary.tributosTotais), tone: "text-ink" },
    { label: "Posições", value: formatNumber(summary.quantidadePosicoes), tone: "text-ink" },
  ];

  return (
    <section className="card hero-grad fade-up shrink-0 overflow-hidden rounded-[var(--radius)]">
      {/* Patrimônio em destaque */}
      <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </span>
            <p className="eyebrow">Patrimônio bruto</p>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-muted-foreground">R$</span>
            <AnimatedNumber
              value={summary.totalBruto}
              format={(n) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}
              className="num text-[2.1rem] font-extrabold leading-none tracking-tight text-ink sm:text-[2.6rem]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={cn("num inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold", upDia ? "chip-gain" : "chip-loss")}>
            {upDia ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {formatBRL(summary.rendimentoDia)}
            <span className="font-semibold opacity-80">({formatPct(Math.abs(diaPct))})</span>
          </span>
          <span className="text-muted-foreground">no dia</span>
          <span className="text-border-strong">·</span>
          <span className="num text-muted-foreground">Posição em {formatDateLong(dtPesquisa)}</span>
        </div>
      </div>

      {/* Faixa de métricas (largura total) */}
      <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "p-4",
              i % 2 === 0 && "border-r border-border",
              i >= 2 && "border-t border-border",
              "sm:border-t-0 sm:border-r-0",
              i > 0 && "sm:border-l sm:border-border",
            )}
          >
            <p className="text-[0.72rem] font-medium leading-tight text-muted-foreground">{s.label}</p>
            <p className={cn("num mt-1.5 text-base font-extrabold tracking-tight sm:text-lg", s.tone)}>{s.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
