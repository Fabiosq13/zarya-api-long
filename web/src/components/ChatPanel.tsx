import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  BarChart3,
  CalendarRange,
  Layers,
  MessageSquare,
  PieChart,
  RefreshCw,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendChat } from "@/lib/api";
import type { ChatContext, ChatData, UiActions } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUsed?: boolean;
  uiUsed?: boolean;
  error?: boolean;
}
interface Props {
  context: ChatContext;
  onData: (data: ChatData) => void;
  onUi?: (ui: UiActions) => void;
}

const SUGGESTIONS_ATIVOS = [
  {
    icon: Layers,
    label: "Resumir carteira",
    text: "Resuma a carteira selecionada com os principais números.",
  },
  {
    icon: BarChart3,
    label: "Concentração",
    text: "Qual a maior concentração por classe?",
  },
  {
    icon: CalendarRange,
    label: "Vencimentos",
    text: "Tem algum vencimento próximo?",
  },
  {
    icon: RefreshCw,
    label: "Outra data",
    text: "Traga os dados de 2025-06-05 desta carteira.",
  },
];

const SUGGESTIONS_PASSIVO = [
  {
    icon: PieChart,
    label: "Tipo de pessoa",
    text: "Resuma a distribuição por tipo de pessoa (física e jurídica).",
  },
  {
    icon: Users,
    label: "Maiores cotistas",
    text: "Quem são os maiores cotistas deste fundo?",
  },
  {
    icon: UserCheck,
    label: "Investidores",
    text: "Qual o perfil dos investidores (varejo, qualificado etc.)?",
  },
  {
    icon: RefreshCw,
    label: "Outra data",
    text: "Traga os dados de 2025-06-05 deste fundo.",
  },
];
const uid = () => Math.random().toString(36).slice(2);

export function ChatPanel({ context, onData, onUi }: Props) {
  const SUGGESTIONS =
    context.modo === "passivos" ? SUGGESTIONS_PASSIVO : SUGGESTIONS_ATIVOS;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 110)}px`;
  }

  async function submit(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setMessages((m) => [...m, { id: uid(), role: "user", content }]);
    setInput("");
    requestAnimationFrame(autosize);
    setLoading(true);
    try {
      const res = await sendChat({
        conversationId: conversationId.current,
        message: content,
        context,
      });
      conversationId.current = res.meta.conversationId;
      const uiUsed = !!res.ui && Object.keys(res.ui).length > 0;
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: res.answer,
          toolUsed: res.toolUsed && !!res.data,
          uiUsed,
        },
      ]);
      if (res.data) onData(res.data);
      if (res.ui && uiUsed) onUi?.(res.ui);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content:
            e instanceof Error ? e.message : "Não consegui responder agora.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    conversationId.current = undefined;
  }

  return (
    <div className="card flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius)]">
      {/* Header limpo */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gain" />
          <p className="text-[1rem] font-bold leading-none tracking-tight text-ink">
            Assistente Zarya
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            title="Nova conversa"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[hsl(220_24%_95%)] hover:text-ink"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[hsl(225_36%_98.5%)] px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
            <div className="pop-in grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquare className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[0.95rem] font-bold">
                Converse com seus dados
              </p>
              <p className="mx-auto mt-1 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                Pergunte sobre a carteira. O copiloto troca data, carteira e
                atualiza os gráficos.
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "fade-up flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                m.role === "user"
                  ? "rounded-br-md bg-primary font-medium text-primary-foreground"
                  : m.error
                    ? "rounded-bl-md border border-loss/25 bg-loss/8 text-loss"
                    : "rounded-bl-md border border-border bg-panel text-ink",
              )}
            >
              {m.error && (
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                  <TriangleAlert className="h-3.5 w-3.5" /> Algo deu errado
                </div>
              )}
              <div className="prose-chat">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              {(m.toolUsed || m.uiUsed) && (
                <span className="mt-2 inline-flex flex-wrap items-center gap-1">
                  {m.toolUsed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gain/10 px-2 py-0.5 text-[0.68rem] font-semibold text-gain">
                      <RefreshCw className="h-3 w-3" /> Painel atualizado
                    </span>
                  )}
                  {m.uiUsed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.68rem] font-semibold text-primary">
                      <RefreshCw className="h-3 w-3" /> Tela ajustada
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="fade-up flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-panel px-4 py-3 shadow-sm">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary"
                  style={{
                    animation: `blink 1s ${i * 0.15}s infinite ease-in-out`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sugestões */}
      {messages.length === 0 && (
        <div className="grid shrink-0 grid-cols-2 gap-2 bg-[hsl(225_36%_98.5%)] px-4 pb-3">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => submit(s.text)}
                className="group flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-left text-xs font-medium text-ink/80 shadow-sm transition-all hover:border-primary/40 hover:text-ink"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="shrink-0 border-t border-border bg-panel p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-border-strong bg-panel p-1.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Pergunte sobre a carteira…"
            className="max-h-28 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-30"
          >
            <ArrowUp className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
