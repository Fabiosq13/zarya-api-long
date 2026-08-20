import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import {
  formatBRL,
  formatNumber,
  formatPct,
  formatDateLong,
  formatQty6,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PassivoSummary } from "@/types";

export function PassivoSummaryHero({
  summary,
  dtPesquisa,
}: {
  summary: PassivoSummary;
  dtPesquisa: string;
}) {
  const upRendimento = summary.rendimentoTotal >= 0;
  const rendPct =
    summary.valorBrutoTotal > 0
      ? (summary.rendimentoTotal / summary.valorBrutoTotal) * 100
      : 0;

  const stats = [
    {
      label: "Valor líquido",
      value: formatBRL(summary.valorLiquidoTotal),
      tone: "text-ink",
    },
    {
      label: "Rendimento",
      value: formatBRL(summary.rendimentoTotal),
      tone: upRendimento ? "text-gain" : "text-loss",
    },
    {
      label: "Tributos totais",
      value: formatBRL(summary.irrfTotal + summary.iofTotal),
      tone: "text-ink",
    },
    {
      label: "Cotistas",
      value: formatNumber(summary.quantidadeCotistas),
      tone: "text-ink",
    },
    {
      label: "Cotas",
      value: formatQty6(summary.quantidadeCotas),
      tone: "text-ink",
    },
  ];

  return (
    <section className="card hero-grad fade-up shrink-0 overflow-hidden rounded-[var(--radius)]">
      <div className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <p className="eyebrow">Valor bruto total</p>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-muted-foreground">R$</span>
            <AnimatedNumber
              value={summary.valorBrutoTotal}
              format={(n) =>
                new Intl.NumberFormat("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(n)
              }
              className="num text-[2.1rem] font-extrabold leading-none tracking-tight text-ink sm:text-[2.6rem]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={cn(
              "num inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold",
              upRendimento ? "chip-gain" : "chip-loss",
            )}
          >
            {upRendimento ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {formatBRL(summary.rendimentoTotal)}
            <span className="font-semibold opacity-80">
              ({formatPct(Math.abs(rendPct))})
            </span>
          </span>
          <span className="text-muted-foreground">no período</span>
          <span className="text-border-strong">·</span>
          <span className="num text-muted-foreground">
            Posição em {formatDateLong(dtPesquisa)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-border sm:grid-cols-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "p-4",
              i > 0 && "border-t border-border sm:border-t-0 sm:border-l",
            )}
          >
            <p className="text-[0.72rem] font-medium leading-tight text-muted-foreground">
              {s.label}
            </p>
            <p
              className={cn(
                "num mt-1.5 text-base font-extrabold tracking-tight sm:text-lg",
                s.tone,
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
