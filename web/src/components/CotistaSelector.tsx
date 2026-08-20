import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CotistaItem } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  cotistas: CotistaItem[];
  value: number;
  onChange: (idCotista: number) => void;
  disabled?: boolean;
}

const TODOS: CotistaItem = { idCotista: 0, nome: "Todos os cotistas" };
const MAX_RESULTS = 10;

/** lowercases and strips accents so "farias" matches "Farías" */
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function CotistaSelector({ cotistas, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedName =
    value === 0
      ? TODOS.nome
      : cotistas.find((c) => c.idCotista === value)?.nome ?? "Selecione o cotista";

  // Build the visible option list: "Todos" (when it matches) + up to 10 cotistas.
  const { options, totalMatches } = useMemo(() => {
    const q = normalize(query);
    const matched = q
      ? cotistas.filter((c) => normalize(c.nome).includes(q))
      : cotistas;

    const list: CotistaItem[] = [];
    if (!q || normalize(TODOS.nome).includes(q)) list.push(TODOS);
    list.push(...matched.slice(0, MAX_RESULTS));

    return { options: list, totalMatches: matched.length };
  }, [cotistas, query]);

  const hiddenCount = Math.max(0, totalMatches - MAX_RESULTS);

  // Reset search + focus input when opening; clamp active index as the list changes.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, options.length - 1)));
  }, [options.length]);

  const commit = (id: number) => {
    onChange(id);
    setOpen(false);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) commit(opt.idCotista);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // keep the highlighted row scrolled into view
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "group flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-strong bg-panel px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary data-[state=open]:border-primary sm:w-[12.5rem]",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span className="line-clamp-1 text-left">{selectedName}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[13rem] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar cotista..."
            className="h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div ref={listRef} className="max-h-[16rem] overflow-y-auto p-1.5">
          {options.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum cotista encontrado
            </div>
          ) : (
            options.map((c, idx) => {
              const isSelected = c.idCotista === value;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={c.idCotista}
                  type="button"
                  data-idx={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commit(c.idCotista)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-left text-sm outline-none transition-colors",
                    isActive && "bg-[hsl(220_24%_96%)]",
                    isSelected && "bg-primary/8",
                  )}
                >
                  <span className="line-clamp-1">{c.nome}</span>
                  {isSelected && (
                    <span className="absolute right-3 flex h-4 w-4 items-center justify-center text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })
          )}

          {hiddenCount > 0 && (
            <div className="px-3 pb-1 pt-2 text-center text-xs text-muted-foreground">
              +{hiddenCount} cotista{hiddenCount > 1 ? "s" : ""} — refine a busca
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
