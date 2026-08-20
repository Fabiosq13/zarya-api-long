import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarRange,
  GraduationCap,
  MapPin,
  ShieldAlert,
  Target,
  UserCog,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { seriesColor } from "@/lib/palette";
import { formatBRL, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GroupedItem, PassivoSummary } from "@/types";

const HORIZONTE_ORDER = ["Até 1 ano", "De 1 a 3 anos", "De 3 a 5 anos", "Acima de 5 anos"];
const RISCO_ORDER = ["Baixa", "Média", "Alta"];
const EXPERIENCIA_ORDER = ["Básica", "Intermediária", "Avançada"];

const RISCO_COLOR: Record<string, string> = {
  Baixa: "hsl(var(--gain))",
  Média: "hsl(var(--gold))",
  Alta: "hsl(var(--loss))",
};

function reorder(items: GroupedItem[], order: string[]): GroupedItem[] {
  const rank = new Map(order.map((o, i) => [o, i]));
  return [...items].sort((a, b) => {
    const ra = rank.has(a.nome) ? rank.get(a.nome)! : order.length;
    const rb = rank.has(b.nome) ? rank.get(b.nome)! : order.length;
    if (ra !== rb) return ra - rb;
    return b.valor - a.valor;
  });
}

export function PassivoAnaliseView({ summary }: { summary: PassivoSummary }) {
  const horizonte = useMemo(() => reorder(summary.porHorizonteInvestimento, HORIZONTE_ORDER), [summary]);
  const risco = useMemo(() => reorder(summary.porToleranciaRisco, RISCO_ORDER), [summary]);
  const experiencia = useMemo(() => reorder(summary.porExperienciaInvestimento, EXPERIENCIA_ORDER), [summary]);

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-0.5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DonutCard title="Perfil de investidor" eyebrow="Suitability" icon={<UserCog className="h-4 w-4" />} items={summary.porPerfil} />
        <DonutCard title="Objetivo de investimento" eyebrow="Suitability" icon={<Target className="h-4 w-4" />} items={summary.porObjetivo} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OrderedBarCard
          title="Horizonte de investimento"
          eyebrow="Suitability · curto → longo prazo"
          icon={<CalendarRange className="h-4 w-4" />}
          items={horizonte}
        />
        <OrderedBarCard
          title="Tolerância a risco"
          eyebrow="Suitability · baixa → alta"
          icon={<ShieldAlert className="h-4 w-4" />}
          items={risco}
          colorFor={(nome) => RISCO_COLOR[nome]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OrderedBarCard
          title="Experiência de investimento"
          eyebrow="Suitability · básica → avançada"
          icon={<GraduationCap className="h-4 w-4" />}
          items={experiencia}
        />
        <BarCard title="Top estados (UF)" eyebrow="Localização" icon={<MapPin className="h-4 w-4" />} items={summary.porUF} />
      </div>
    </div>
  );
}

const SIZE = 168;
const STROKE = 22;
const PAD = 3;
const R = (SIZE - STROKE) / 2 - PAD;
const C = 2 * Math.PI * R;

function DonutCard({
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
  const [active, setActive] = useState(0);

  const data = useMemo(() => {
    const top = items.slice(0, 8);
    const rest = items.slice(8);
    if (rest.length) {
      top.push({
        nome: `Outros (${rest.length})`,
        valor: rest.reduce((a, b) => a + b.valor, 0),
        percentual: rest.reduce((a, b) => a + b.percentual, 0),
      });
    }
    return top;
  }, [items]);

  const activeItem = data[Math.min(active, data.length - 1)] ?? data[0];

  let acc = 0;
  const arcs = data.map((d, i) => {
    const len = (d.percentual / 100) * C;
    const arc = { len, offset: -acc, color: seriesColor(i) };
    acc += len;
    return arc;
  });

  return (
    <Card className="fade-up h-full">
      <div className="flex items-center gap-2.5 border-b border-border p-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="text-[0.95rem] font-bold tracking-tight">{title}</h3>
        </div>
      </div>

      <div className="p-5">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="pop-in relative shrink-0" style={{ width: SIZE, height: SIZE }}>
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                  <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="hsl(220 18% 93%)" strokeWidth={STROKE} />
                  {arcs.map((a, i) => (
                    <circle
                      key={i}
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      fill="none"
                      stroke={a.color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${a.len} ${C - a.len}`}
                      strokeDashoffset={a.offset}
                      strokeLinecap="butt"
                      onMouseEnter={() => setActive(i)}
                      style={{ opacity: active === i ? 1 : 0.32, transition: "opacity .22s ease", cursor: "pointer" }}
                    />
                  ))}
                </g>
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="num text-[1.4rem] font-extrabold leading-none tracking-tight text-ink">
                  {formatPct(activeItem?.percentual ?? 0)}
                </span>
                <span className="num mt-1 text-[0.68rem] text-muted-foreground">{formatBRL(activeItem?.valor ?? 0)}</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-0.5 self-stretch">
              {data.map((item, i) => (
                <button
                  key={item.nome}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    active === i ? "bg-[hsl(220_24%_96%)]" : "hover:bg-[hsl(220_24%_97.5%)]",
                  )}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: seriesColor(i) }} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink/90" title={item.nome}>{item.nome}</span>
                  <span className="num hidden shrink-0 text-[0.72rem] text-muted-foreground md:block">{formatBRL(item.valor)}</span>
                  <span className="num w-12 shrink-0 text-right text-xs font-bold">{formatPct(item.percentual)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function OrderedBarCard({
  title,
  eyebrow,
  icon,
  items,
  colorFor,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  items: GroupedItem[];
  colorFor?: (nome: string) => string;
}) {
  const max = items.length ? Math.max(...items.map((d) => d.valor)) : 1;
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
        {items.map((d) => (
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
                  background: colorFor?.(d.nome) ?? "hsl(var(--primary))",
                  animation: "growBar .6s cubic-bezier(.16,1,.3,1) both",
                }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Sem dados.</p>}
      </div>
    </Card>
  );
}

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
