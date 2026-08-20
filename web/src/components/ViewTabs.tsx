import { BarChart3, LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewKey = "geral" | "analise" | "posicoes";

const TABS: { key: ViewKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "geral", label: "Visão geral", icon: LayoutGrid },
  { key: "analise", label: "Análise", icon: BarChart3 },
  { key: "posicoes", label: "Posições", icon: Table2 },
];

interface Props {
  value: ViewKey;
  onChange: (v: ViewKey) => void;
  count?: number;
}

export function ViewTabs({ value, onChange, count }: Props) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <div className="inline-flex gap-1 rounded-xl border border-border bg-panel p-1 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = value === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all",
                active
                  ? "bg-[#0D1B2A] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-[hsl(220_24%_96%)] hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>
      {count != null && (
        <span className="hidden text-xs font-medium text-muted-foreground sm:block">{count} posições</span>
      )}
    </div>
  );
}
