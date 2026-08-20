import { useCallback, useEffect, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import {
  fetchCarteiras,
  fetchCotistas,
  fetchMe,
  fetchPassivoCarteiras,
  fetchPassivoSummary,
  fetchSummary,
  getToken,
  logout,
} from "@/lib/api";
import type {
  CarteiraItem,
  ChatData,
  CotistaItem,
  DetailedPassivoPosition,
  DetailedPosition,
  PassivoSummary,
  PortfolioSummary,
  UiActions,
} from "@/types";
import { Header } from "@/components/Header";
import { LoginPage } from "@/components/LoginPage";
import { WalletSelector } from "@/components/WalletSelector";
import { CotistaSelector } from "@/components/CotistaSelector";
import { DateSelector } from "@/components/DateSelector";
import { ModeToggle, type Modo } from "@/components/ModeToggle";
import { ViewTabs, type ViewKey } from "@/components/ViewTabs";
import { SummaryHero } from "@/components/SummaryHero";
import { DonutAllocation } from "@/components/DonutAllocation";
import { TopPositions } from "@/components/TopPositions";
import { VencimentosCard } from "@/components/VencimentosCard";
import { AnalyticsView } from "@/components/AnalyticsView";
import { PositionsTable } from "@/components/PositionsTable";
import { PassivoView } from "@/components/PassivoView";
import { ChatPanel } from "@/components/ChatPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateLong } from "@/lib/format";

export default function App() {
  const [carteiras, setCarteiras] = useState<CarteiraItem[]>([]);
  const [idCarteira, setIdCarteira] = useState<number | undefined>();
  const [dtPesquisa, setDtPesquisa] = useState<string>("");
  // Cada modo tem a sua data de referência na base nova (Carteira e Cotista
  // consultam datas diferentes). Guardamos a última data de cada um para que
  // alternar de aba volte à data correta em vez de reaproveitar a do outro modo.
  const [dtAtivos, setDtAtivos] = useState<string>("");
  const [dtPassivos, setDtPassivos] = useState<string>("");
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [posicoes, setPosicoes] = useState<DetailedPosition[]>([]);
  const [view, setView] = useState<ViewKey>("geral");
  const [donutDim, setDonutDim] = useState<"porClasse" | "porFamilia" | "porAtivo">("porClasse");
  const [filtroClasse, setFiltroClasse] = useState<string>("__todas__");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null); // null = verificando

  const [modo, setModo] = useState<Modo>("ativos");
  const [passivoCarteiras, setPassivoCarteiras] = useState<CarteiraItem[]>([]);
  const [idCarteiraPassivo, setIdCarteiraPassivo] = useState<number | undefined>();
  const [cotistas, setCotistas] = useState<CotistaItem[]>([]);
  const [idCotista, setIdCotista] = useState<number>(0);
  const [passivoSummary, setPassivoSummary] = useState<PassivoSummary | null>(null);
  const [passivoPosicoes, setPassivoPosicoes] = useState<DetailedPassivoPosition[]>([]);
  const [loadingPassivo, setLoadingPassivo] = useState(false);

  // Bootstrap de sessão: valida o token existente; escuta expiração.
  useEffect(() => {
    let alive = true;
    if (!getToken()) {
      setAuthed(false);
    } else {
      fetchMe()
        .then(() => alive && setAuthed(true))
        .catch(() => alive && setAuthed(false));
    }
    const onExpired = () => setAuthed(false);
    window.addEventListener("zarya:auth-expired", onExpired);
    return () => {
      alive = false;
      window.removeEventListener("zarya:auth-expired", onExpired);
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    setBootLoading(true);
    (async () => {
      try {
        const res = await fetchCarteiras();
        setCarteiras(res.carteiras);
        setDtPesquisa(res.dtPesquisa);
        setDtAtivos(res.dtPesquisa);
        if (res.carteiras.length) setIdCarteira(res.carteiras[0].idCarteira);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao carregar carteiras");
      } finally {
        setBootLoading(false);
      }
    })();
  }, [authed]);

  const loadSummary = useCallback(async (date: string, id: number) => {
    setLoadingSummary(true);
    setError(null);
    try {
      const res = await fetchSummary(date, id);
      setSummary(res.summary);
      setPosicoes(res.posicoes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar dados");
      setSummary(null);
      setPosicoes([]);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (modo === "ativos" && idCarteira != null && dtPesquisa) loadSummary(dtPesquisa, idCarteira);
  }, [modo, idCarteira, dtPesquisa, loadSummary]);

  useEffect(() => {
    if (!authed || modo !== "passivos" || passivoCarteiras.length > 0) return;
    (async () => {
      try {
        // Sem passar data: o backend resolve a data padrão do modo Cotista.
        const res = await fetchPassivoCarteiras(dtPassivos || undefined);
        setPassivoCarteiras(res.carteiras);
        setDtPassivos(res.dtPesquisa);
        setDtPesquisa(res.dtPesquisa);
        if (res.carteiras.length) setIdCarteiraPassivo(res.carteiras[0].idCarteira);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao carregar carteiras de passivo");
      }
    })();
  }, [authed, modo, passivoCarteiras.length, dtPassivos]);

  useEffect(() => {
    if (modo !== "passivos" || idCarteiraPassivo == null || !dtPesquisa) return;
    fetchCotistas(dtPesquisa, idCarteiraPassivo)
      .then((res) => setCotistas(res.cotistas))
      .catch((e) => setError(e instanceof Error ? e.message : "Falha ao carregar cotistas"));
  }, [modo, idCarteiraPassivo, dtPesquisa]);

  const loadPassivoSummary = useCallback(async (date: string, id: number, cotista: number) => {
    setLoadingPassivo(true);
    setError(null);
    try {
      const res = await fetchPassivoSummary(date, id, cotista);
      setPassivoSummary(res.summary);
      setPassivoPosicoes(res.posicoes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar dados de passivo");
      setPassivoSummary(null);
      setPassivoPosicoes([]);
    } finally {
      setLoadingPassivo(false);
    }
  }, []);

  useEffect(() => {
    if (modo === "passivos" && idCarteiraPassivo != null && dtPesquisa) {
      loadPassivoSummary(dtPesquisa, idCarteiraPassivo, idCotista);
    }
  }, [modo, idCarteiraPassivo, dtPesquisa, idCotista, loadPassivoSummary]);

  const handleChatData = useCallback(
    (data: ChatData) => {
      if (data.modo === "passivos") {
        setPassivoSummary(data.summary);
        if (data.dtPesquisa) setDtPesquisa(data.dtPesquisa);
        if (
          data.idCarteira != null &&
          passivoCarteiras.some((c) => c.idCarteira === data.idCarteira)
        ) {
          setIdCarteiraPassivo(data.idCarteira);
        }
        if (data.idCotista != null) setIdCotista(data.idCotista);
        return;
      }
      setSummary(data.summary);
      if (data.dtPesquisa) setDtPesquisa(data.dtPesquisa);
      if (data.idCarteira != null && carteiras.some((c) => c.idCarteira === data.idCarteira)) {
        setIdCarteira(data.idCarteira);
      }
    },
    [carteiras, passivoCarteiras],
  );

  const handleUi = useCallback((ui: UiActions) => {
    if (ui.aba) setView(ui.aba);
    if (ui.dimensaoAlocacao) setDonutDim(ui.dimensaoAlocacao);
    if (ui.filtroClasse) {
      const f = ui.filtroClasse.trim().toLowerCase();
      setFiltroClasse(f === "todas" || f === "todas as classes" ? "__todas__" : ui.filtroClasse.trim());
      if (!ui.aba) setView("posicoes");
    }
  }, []);

  function handleDateChange(d: string) {
    setDtPesquisa(d);
    if (modo === "passivos") {
      setDtPassivos(d);
      setIdCotista(0);
    } else {
      setDtAtivos(d);
    }
  }

  // Ao alternar Carteira/Cotista, volta à data de referência do modo escolhido.
  function handleModoChange(next: Modo) {
    setModo(next);
    const alvo = next === "ativos" ? dtAtivos : dtPassivos;
    if (alvo) setDtPesquisa(alvo);
  }

  function handleCarteiraPassivoChange(id: number) {
    setIdCarteiraPassivo(id);
    setIdCotista(0);
  }

  const carteiraAtual = carteiras.find((c) => c.idCarteira === idCarteira);
  const semDados = summary && summary.quantidadePosicoes === 0;
  const busy = loadingSummary || bootLoading;

  function handleLogout() {
    logout();
    setAuthed(false);
    setCarteiras([]);
    setSummary(null);
    setPosicoes([]);
    setIdCarteira(undefined);
    setDtPesquisa("");
    setDtAtivos("");
    setDtPassivos("");
    setView("geral");
    setModo("ativos");
    setPassivoCarteiras([]);
    setIdCarteiraPassivo(undefined);
    setCotistas([]);
    setIdCotista(0);
    setPassivoSummary(null);
    setPassivoPosicoes([]);
  }

  if (authed === null) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#0D1B2A" }}
      >
        <Loader2 className="h-7 w-7 animate-spin text-white" />
      </div>
    );
  }

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="flex min-h-screen flex-col xl:h-screen xl:overflow-hidden">
      <Header onLogout={handleLogout}>
        {bootLoading ? (
          <>
            <Skeleton className="h-10 w-full sm:w-[18rem]" />
            <Skeleton className="h-10 w-full sm:w-[12.5rem]" />
          </>
        ) : (
          <>
            <ModeToggle value={modo} onChange={handleModoChange} />
            {modo === "passivos" && (
              <CotistaSelector cotistas={cotistas} value={idCotista} onChange={setIdCotista} />
            )}
            {modo === "ativos" ? (
              <WalletSelector carteiras={carteiras} value={idCarteira} onChange={setIdCarteira} />
            ) : (
              <WalletSelector
                carteiras={passivoCarteiras}
                value={idCarteiraPassivo}
                onChange={handleCarteiraPassivoChange}
              />
            )}
            <DateSelector value={dtPesquisa} onChange={handleDateChange} />
          </>
        )}
      </Header>

      <div className="mx-auto w-full max-w-[1680px] min-h-0 flex-1 p-4 lg:p-5">
        <div className="grid grid-cols-1 gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_390px]">
          <main className="flex min-w-0 flex-col gap-4 xl:min-h-0">
            {modo === "ativos" ? (
              <>
                <ViewTabs value={view} onChange={setView} count={summary?.quantidadePosicoes} />

                {error && (
                  <div className="card flex shrink-0 items-center gap-2 rounded-[var(--radius)] px-4 py-3 text-sm text-loss">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {busy ? (
                  <DashboardSkeleton />
                ) : semDados ? (
                  <EmptyState carteira={carteiraAtual?.noResumido} data={dtPesquisa} />
                ) : summary ? (
                  <div key={`${idCarteira}-${dtPesquisa}-${view}`} className="flex min-h-0 flex-1 flex-col gap-4">
                    <SummaryHero summary={summary} dtPesquisa={dtPesquisa} />

                    {view === "geral" && (
                      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
                        <DonutAllocation summary={summary} dim={donutDim} onDim={setDonutDim} />
                        <TopPositions summary={summary} />
                      </div>
                    )}

                    {view === "analise" && (
                      <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-0.5">
                        <AnalyticsView summary={summary} posicoes={posicoes} />
                        <VencimentosCard summary={summary} />
                      </div>
                    )}

                    {view === "posicoes" && (
                      <div className="min-h-0 flex-1">
                        <PositionsTable posicoes={posicoes} classe={filtroClasse} onClasse={setFiltroClasse} />
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {error && (
                  <div className="card flex shrink-0 items-center gap-2 rounded-[var(--radius)] px-4 py-3 text-sm text-loss">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {loadingPassivo ? (
                  <DashboardSkeleton />
                ) : passivoSummary ? (
                  <PassivoView
                    key={`${idCarteiraPassivo}-${dtPesquisa}-${idCotista}`}
                    summary={passivoSummary}
                    posicoes={passivoPosicoes}
                    dtPesquisa={dtPesquisa}
                  />
                ) : null}
              </>
            )}
          </main>

          <aside className="h-[560px] min-h-0 xl:h-auto">
            <ChatPanel
              context={
                modo === "passivos"
                  ? {
                      modo: "passivos",
                      idCarteira: idCarteiraPassivo,
                      noResumido: passivoCarteiras.find((c) => c.idCarteira === idCarteiraPassivo)
                        ?.noResumido,
                      dtPesquisa,
                      idCotista,
                      noCotista: cotistas.find((c) => c.idCotista === idCotista)?.nome,
                    }
                  : { modo: "ativos", idCarteira, noResumido: carteiraAtual?.noResumido, dtPesquisa }
              }
              onData={handleChatData}
              onUi={handleUi}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ carteira, data }: { carteira?: string; data: string }) {
  return (
    <div className="card flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-[var(--radius)] py-20 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10">
        <TriangleAlert className="h-6 w-6 text-gold" />
      </div>
      <p className="text-lg font-bold">Sem posições nesta data</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Não há dados para {carteira ?? "esta carteira"} em {formatDateLong(data)}. Escolha outra data.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Skeleton className="h-36 shrink-0" />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
        <Skeleton className="min-h-[16rem]" />
        <Skeleton className="min-h-[16rem]" />
      </div>
    </div>
  );
}
