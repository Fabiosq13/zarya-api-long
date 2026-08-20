import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

interface Props {
  children: ReactNode; // seletores (carteira + data)
  onLogout?: () => void;
}

export function Header({ children, onLogout }: Props) {
  return (
    <header
      className="shrink-0 border-b border-white/10 text-white"
      style={{ background: "#0D1B2A" }}
    >
      <div className="mx-auto flex max-w-[1680px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <img src="/zarya-logo.png" alt="Zarya" className="h-9 w-auto" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {children}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair"
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="sm:hidden lg:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
