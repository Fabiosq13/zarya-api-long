import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatBRLCompact } from "@/lib/format";
import type { CarteiraItem } from "@/types";

interface Props {
  carteiras: CarteiraItem[];
  value?: number;
  onChange: (idCarteira: number) => void;
  disabled?: boolean;
}

export function WalletSelector({ carteiras, value, onChange, disabled }: Props) {
  const atual = carteiras.find((c) => c.idCarteira === value);
  return (
    <Select value={value != null ? String(value) : undefined} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
      <SelectTrigger className="w-full text-ink sm:w-[18rem]">
        <SelectValue placeholder="Selecione a carteira">
          {atual && <span className="truncate">{atual.noResumido}</span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {carteiras.map((c) => (
          <SelectItem key={c.idCarteira} value={String(c.idCarteira)}>
            <div className="flex w-full items-center gap-3 pr-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-tight">{c.noResumido}</p>
                <p className="text-[0.66rem] text-muted-foreground">{c.quantidadePosicoes} posições</p>
              </div>
              <span className="num shrink-0 text-xs text-ink/70">{formatBRLCompact(c.valorTotal)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
