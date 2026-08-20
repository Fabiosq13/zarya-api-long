import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
}

export function DateSelector({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          className={cn(
            "group flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-strong bg-panel px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/40 data-[state=open]:border-primary sm:w-[12.5rem]",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span className="num">{value ? formatDateLong(value) : "Selecione"}</span>
          <CalendarDays className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <Calendar selected={selected} maxDate={new Date()} onSelect={(d) => { onChange(format(d, "yyyy-MM-dd")); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}
