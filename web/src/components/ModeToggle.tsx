import { cn } from "@/lib/utils";

export type Modo = "ativos" | "passivos";

interface Props {
  value: Modo;
  onChange: (m: Modo) => void;
  disabled?: boolean;
}

export function ModeToggle({ value, onChange, disabled }: Props) {
  const isPassivos = value === "passivos";
  return (
    <label
      className={cn(
        "inline-flex h-10 shrink-0 select-none items-center gap-2.5 rounded-lg border border-white/25 bg-white/10 px-3 text-sm font-semibold transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span className={isPassivos ? "text-white/60" : "text-white"}>Carteira</span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          isPassivos ? "bg-primary" : "bg-white/25",
        )}
      >
        <input
          type="checkbox"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          checked={isPassivos}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? "passivos" : "ativos")}
        />
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform",
            isPassivos && "translate-x-[18px]",
          )}
        />
      </span>
      <span className={isPassivos ? "text-white" : "text-white/60"}>Cotista</span>
    </label>
  );
}
