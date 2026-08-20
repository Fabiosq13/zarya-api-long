import { useMemo, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarClock,
  Layers3,
  Percent,
  Receipt,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { seriesColor } from "@/lib/palette";
import { formatBRL, formatNumber, formatPct } from "@/lib/format";
import { concentration, groupSum, maturityLadder, movers } from "@/lib/clientAnalytics";
import { cn } from "@/lib/utils";
import type { DetailedPosition, GroupedItem, PortfolioSummary } from "@/types";

interface Props {
  summary: PortfolioSummary;
  posicoes: DetailedPosition[];
}

export function AnalyticsView({ summary, posicoes }: Props) {
  const conc = useMemo(() => concentration(summary, posicoes), [summary, posicoes]);
  const rendDiaPorClasse = useMemo(
    () => groupSum(posicoes, (p) => p.classe, (p) => p.rendimentoDia),
    [posicoes],
  );
  const porIndice = useMemo(
    () => groupSum(posicoes, (p) => p.indice ?? "Sem índice", (p) => p.valor),
    [posicoes],
  );
  const porEmissor = useMemo(
    () => groupSum(posicoes, (p) => p.emissor ?? "Sem emissor", (p) => p.valor),
    [posicoes],
  );
  const porSubClasse = useMemo(
    () => groupSum(posicoes, (p) => p.subClasse, (p) => p.valor),
    [posicoes],
  );
  const ladder = useMemo(() => maturityLadder(posicoes), [posicoes]);
  const { ganhos, perdas } = useMemo(() => movers(posicoes), [posicoes]);

  return (
    <div className="space-y-5">
      <ConcentrationStats conc={conc} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <BarCard title="Alocação por indexador" eyebrow="Exposição" icon={<Percent className="h-4 w-4" />} items={porIndice} />
        <BarCard title="Exposição por emissor" eyebrow="Risco de crédito" icon={<Building2 className="h-4 w-4" />} items={porEmissor} />
      </div>

      <SignedBarCard title="Resultado no dia por classe" eyebrow="Variação diária" icon={<Activity className="h-4 w-4" />} items={rendDiaPorClasse} />

      <MaturityCard items={ladder} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <BarCard title="Alocação por família" eyebrow="Distribuição" icon={<Layers3 className="h-4 w-4" />} items={summary.porFamilia} />
        <BarCard title="Alocação por subclasse" eyebrow="Distribuição" icon={<Boxes className="h-4 w-4" />} items={porSubClasse} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <TaxCard summary={summary} />
        <MoversCard ganhos={ganhos} perdas={perdas} />
      </div>
    </div>
  );
}

/* ---------- Concentração ---------- */

function ConcentrationStats({ conc }: { conc: ReturnType<typeof concentration> }) {
  const tiles = [
    { label: "Ativos", value: formatNumber(conc.nAtivos) },
    { label: "Classes", value: formatNumber(conc.nClasses) },
    { label: "Emissores", value: formatNumber(conc.nEmissores) },
    { label: "Maior posição", value: formatPct(conc.maiorPosicaoPct), sub: conc.maiorPosicaoNome },
    { label: "Top 5 ativos", value: formatPct(conc.top5Pct) },
  ];
  return (
    <Card className="fade-up overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <p className="eyebrow">Diversificação</p>
            <h3 className="text-[0.95rem] font-bold tracking-tight">Concentração da carteira</h3>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            conc.hhi >= 1500 ? "chip-loss" : conc.hhi >= 800 ? "bg-gold/10 text-gold" : "chip-gain",
          )}
        >
          HHI {formatNumber(conc.hhi)} · {conc.hhiLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            className={cn(
              "p-5",
              i !== 0 && "border-l border-border",
              i >= 2 && "border-t sm:border-t-0",
              i === 3 && "border-l-0 sm:border-l",
            )}
          >
            <p className="text-[0.72rem] font-medium text-muted-foreground">{t.label}</p>
            <p className="num mt-1.5 text-lg font-extrabold tracking-tight">{t.value}</p>
            {t.sub && <p className="truncate text-[0.66rem] text-muted-foreground" title={t.sub}>{t.sub}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Barras (distribuição) ---------- */

function BarCard({
  title,
  eyebrow,
  icon,
  items,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  items: GroupedItem[];
}) {
  const data = items.slice(0, 8);
  const max = data.length ? Math.max(...data.map((d) => d.valor)) : 1;
  return (
    <Card className="fade-up h-full">
      <div className="flex items-center gap-2.5 border-b border-border p-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="text-[0.95rem] font-bold tracking-tight">{title}</h3>
        </div>
      </div>
      <div className="space-y-3.5 p-5">
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
        {data.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Sem dados.</p>}
      </div>
    </Card>
  );
}

/* ---------- Barras com sinal (rentabilidade) ---------- */

function SignedBarCard({
  title,
  eyebrow,
  icon,
  items,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  items: GroupedItem[];
}) {
  const data = items.slice(0, 8);
  const max = data.length ? Math.max(...data.map((d) => Math.abs(d.valor))) : 1;
  return (
    <Card className="fade-up h-full">
      <div className="flex items-center gap-2.5 border-b border-border p-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="text-[0.95rem] font-bold tracking-tight">{title}</h3>
        </div>
      </div>
      <div className="space-y-3.5 p-5">
        {data.map((d) => {
          const up = d.valor >= 0;
          return (
            <div key={d.nome} className="min-w-0">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium text-ink/90" title={d.nome}>{d.nome}</span>
                <span className={cn("num shrink-0 text-xs font-bold", up ? "text-gain" : "text-loss")}>
                  {formatBRL(d.valor)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(220_18%_93%)]">
                <div
                  className={cn("h-full rounded-full", up ? "bg-gain" : "bg-loss")}
                  style={{
                    width: `${Math.max(2, (Math.abs(d.valor) / max) * 100)}%`,
                    animation: "growBar .6s cubic-bezier(.16,1,.3,1) both",
                  }}
                />
              </div>
            </div>
          );
        })}
        {data.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Sem dados.</p>}
      </div>
    </Card>
  );
}

/* ---------- Tributos ---------- */

function TaxCard({ summary }: { summary: PortfolioSummary }) {
  const total = summary.irrfTotal + summary.iofTotal;
  const parts = [
    { label: "IRRF", value: summary.irrfTotal, color: "#2979FF" },
    { label: "IOF", value: summary.iofTotal, color: "#C98A12" },
  ];
  return (
    <Card className="fade-up h-full">
      <div className="flex items-center gap-2.5 border-b border-border p-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 text-gold">
          <Receipt className="h-4 w-4" />
        </span>
        <div>
          <p className="eyebrow">Carga tributária</p>
          <h3 className="text-[0.95rem] font-bold tracking-tight">Tributos</h3>
        </div>
      </div>
      <div className="p-5">
        <p className="text-[0.72rem] font-medium text-muted-foreground">Total de tributos</p>
        <p className="num mt-1 text-2xl font-extrabold tracking-tight">{formatBRL(summary.tributosTotais)}</p>
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-[hsl(220_18%_93%)]">
          {parts.map((p) => (
            <div
              key={p.label}
              style={{ width: `${total > 0 ? (p.value / total) * 100 : 0}%`, background: p.color }}
            />
          ))}
        </div>
        <div className="mt-4 space-y-2.5">
          {parts.map((p) => (
            <div key={p.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
              <span className="num text-sm font-bold">{formatBRL(p.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ---------- Maiores ganhos e perdas ---------- */

function MoversCard({
  ganhos,
  perdas,
}: {
  ganhos: { nome: string; valor: number }[];
  perdas: { nome: string; valor: number }[];
}) {
  return (
    <Card className="fade-up overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <MoverList title="Maiores ganhos" up items={ganhos} />
        <MoverList title="Maiores perdas" up={false} items={perdas} />
      </div>
    </Card>
  );
}

function MoverList({
  title,
  up,
  items,
}: {
  title: string;
  up: boolean;
  items: { nome: string; valor: number }[];
}) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", up ? "chip-gain" : "chip-loss")}>
          {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </span>
        <h3 className="text-[0.92rem] font-bold tracking-tight">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.nome} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-ink/90" title={it.nome}>{it.nome}</span>
            <span className={cn("num shrink-0 text-sm font-bold", up ? "text-gain" : "text-loss")}>
              {formatBRL(it.valor)}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {up ? "Nenhum ganho registrado." : "Nenhuma perda registrada."}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Escada de vencimentos (colunas por ano) ---------- */

function MaturityCard({ items }: { items: { ano: string; valor: number; qtd: number }[] }) {
  const max = items.length ? Math.max(...items.map((d) => d.valor)) : 1;
  const total = items.reduce((a, b) => a + b.valor, 0);
  return (
    <Card className="fade-up overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 text-gold">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div>
            <p className="eyebrow">Liquidez futura</p>
            <h3 className="text-[0.95rem] font-bold tracking-tight">Escada de vencimentos</h3>
          </div>
        </div>
        <span className="num hidden text-xs font-medium text-muted-foreground sm:block">
          {formatBRL(total)} com vencimento
        </span>
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum ativo com vencimento definido.</p>
        ) : (
          <div className="flex h-52 items-end gap-3 sm:gap-5">
            {items.map((d, i) => (
              <div key={d.ano} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="num text-[0.7rem] font-bold text-ink">{formatBRL(d.valor)}</span>
                <div
                  className="w-full rounded-t-md bg-primary"
                  style={{
                    height: `${Math.max(4, (d.valor / max) * 100)}%`,
                    background: seriesColor(i),
                    animation: "growBarV .6s cubic-bezier(.16,1,.3,1) both",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
                <div className="text-center">
                  <p className="num text-sm font-bold">{d.ano}</p>
                  <p className="text-[0.66rem] text-muted-foreground">{d.qtd} {d.qtd === 1 ? "ativo" : "ativos"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
