import * as React from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isAfter,
  isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  maxDate?: Date;
}

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function Calendar({ selected, onSelect, maxDate }: CalendarProps) {
  const [view, setView] = React.useState<Date>(selected ?? new Date());
  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(view), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(view), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [view]);

  return (
    <div className="w-[18rem] select-none">
      <div className="mb-3 flex items-center justify-between px-1">
        <button type="button" onClick={() => setView((v) => subMonths(v, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(220_24%_95%)] hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold capitalize tracking-tight">
          {format(view, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <button type="button" onClick={() => setView((v) => addMonths(v, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(220_24%_95%)] hover:text-ink">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="flex h-8 items-center justify-center text-[0.66rem] font-bold uppercase text-muted-foreground/70">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const disabled = maxDate ? isAfter(day, maxDate) : false;
          const isSelected = selected ? isSameDay(day, selected) : false;
          const outside = !isSameMonth(day, view);
          const today = isToday(day);
          return (
            <button key={day.toISOString()} type="button" disabled={disabled} onClick={() => onSelect?.(day)}
              className={cn(
                "num relative flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-all",
                outside && "text-muted-foreground/40",
                !outside && "text-ink",
                !isSelected && !disabled && "hover:bg-[hsl(220_24%_95%)]",
                today && !isSelected && "text-primary font-semibold",
                isSelected && "bg-primary font-semibold text-primary-foreground shadow",
                disabled && "cursor-not-allowed opacity-30",
              )}>
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
