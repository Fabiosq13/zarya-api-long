import { useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { seriesColor } from "@/lib/palette";
import { formatBRL, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GroupedItem, PassivoSummary } from "@/types";

type Dim = "porPerfilCVM" | "porTipoPessoa" | "porGrupoFamiliar" | "porTipoInvestidor";
const DIMS: { key: Dim; label: string }[] = [
  { key: "porPerfilCVM", label: "Perfil CVM" },
  { key: "porTipoPessoa", label: "Tipo de pessoa" },
  { key: "porGrupoFamiliar", label: "Grupo familiar" },
  { key: "porTipoInvestidor", label: "Investidor" },
];

const SIZE = 184;
const STROKE = 24;
const PAD = 3;
const R = (SIZE - STROKE) / 2 - PAD;
const C = 2 * Math.PI * R;

export function PassivoDonutAllocation({ summary }: { summary: PassivoSummary }) {
  const [dim, setDim] = useState<Dim>("porPerfilCVM");
  const [active, setActive] = useState(0);

  const data = useMemo(() => {
    const raw = summary[dim] as GroupedItem[];
    const top = raw.slice(0, 8);
    const rest = raw.slice(8);
    if (rest.length) {
      top.push({
        nome: `Outros (${rest.length})`,
        valor: rest.reduce((a, b) => a + b.valor, 0),
        percentual: rest.reduce((a, b) => a + b.percentual, 0),
      });
    }
    return top;
  }, [summary, dim]);

  const activeItem = data[Math.min(active, data.length - 1)] ?? data[0];

  let acc = 0;
  const arcs = data.map((d, i) => {
    const len = (d.percentual / 100) * C;
    const arc = { len, offset: -acc, color: seriesColor(i) };
    acc += len;
    return arc;
  });

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between border-b border-border p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <PieChart className="h-4 w-4" />
          </span>
          <div>
            <p className="eyebrow">Composição</p>
            <h3 className="text-[0.95rem] font-bold tracking-tight">Distribuição de passivo</h3>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-border bg-[hsl(220_24%_96%)] p-0.5">
          {DIMS.map((d) => (
            <button
              key={d.key}
              onClick={() => { setDim(d.key); setActive(0); }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                dim === d.key ? "bg-panel text-primary shadow-sm" : "text-muted-foreground hover:text-ink",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
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
                    style={{
                      opacity: active === i ? 1 : 0.32,
                      transition: "opacity .22s ease",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </g>
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-[1.7rem] font-extrabold leading-none tracking-tight text-ink">
                {formatPct(activeItem?.percentual ?? 0)}
              </span>
              <span className="num mt-1 text-[0.72rem] text-muted-foreground">
                {formatBRL(activeItem?.valor ?? 0)}
              </span>
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
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink/90" title={item.nome}>
                  {item.nome}
                </span>
                <span className="num hidden shrink-0 text-[0.72rem] text-muted-foreground md:block">
                  {formatBRL(item.valor)}
                </span>
                <span className="num w-12 shrink-0 text-right text-xs font-bold">
                  {formatPct(item.percentual)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
