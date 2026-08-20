import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, TriangleAlert, User } from "lucide-react";
import { login } from "@/lib/api";

const BG = "#0D1B2A";

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "h-12 w-full rounded-xl border border-[#00E5FF]/35 bg-white/[0.04] pl-11 pr-3 text-sm text-white outline-none transition-all " +
    "placeholder:text-white/40 shadow-[0_0_18px_-8px_rgba(0,229,255,0.6)] " +
    "focus:border-[#00E5FF] focus:ring-4 focus:ring-[#00E5FF]/20 focus:shadow-[0_0_24px_-6px_rgba(0,229,255,0.75)]";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10" style={{ background: BG }}>
      {/* brilhos ciano suaves nas extremidades */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#00E5FF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#00E5FF]/10 blur-3xl" />

      <div className="fade-up relative w-full max-w-[25rem] text-center">
        {/* Marca (logo oficial) */}
        <div className="mb-8 flex justify-center">
          <img src="/zarya-logo.png" alt="Zarya Tecnologia" className="h-auto w-[260px] max-w-[78%]" />
        </div>

        <h2 className="mb-7 text-xl font-semibold text-white/90">Acesse sua conta</h2>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-loss/40 bg-loss/10 px-3.5 py-3 text-left text-sm text-red-300">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4 text-left">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00E5FF]" />
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Usuário"
              className={inputCls}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00E5FF]" />
            <input
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className={inputCls + " pr-11"}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              title={showPass ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#00E5FF]/60 bg-[#00E5FF]/5 text-sm font-bold text-white shadow-[0_0_22px_-8px_rgba(0,229,255,0.7)] outline-none transition-all hover:bg-[#00E5FF]/15 hover:shadow-[0_0_28px_-6px_rgba(0,229,255,0.85)] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Entrando…
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-xs text-white/40">© {new Date().getFullYear()} Zarya · Atlantyx</p>
      </div>
    </div>
  );
}
