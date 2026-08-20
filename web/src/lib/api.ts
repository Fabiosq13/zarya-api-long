import type {
  CarteirasResponse,
  ChatContext,
  ChatResponse,
  CotistasResponse,
  PassivoSummaryResponse,
  SummaryResponse,
} from "@/types";

// Em dev usamos o proxy do Vite (/api -> backend). Em produção, defina VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL ?? "";

// ---- Sessão (token assinado, guardado no navegador) ----
const TOKEN_KEY = "zarya_token";
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (res.status === 401) {
    // No login, um 401 significa credenciais inválidas — mostra o erro real do servidor
    // (não é "sessão expirada", pois ainda não há sessão).
    if (path.includes("/auth/login")) {
      let msg = "Usuário ou senha incorretos.";
      try {
        const body = await res.json();
        msg = body?.mensagem || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    // Demais rotas: token ausente/expirado — limpa a sessão e volta ao login.
    clearToken();
    window.dispatchEvent(new Event("zarya:auth-expired"));
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  if (!res.ok) {
    let detalhe = "";
    try {
      const body = await res.json();
      detalhe = body?.mensagem || body?.erro || "";
    } catch {
      /* ignore */
    }
    throw new Error(detalhe || `Falha na requisição (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface AuthUser {
  email: string;
}

/** Faz login; em caso de sucesso guarda o token e devolve o usuário. */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await request<{ token: string; user: AuthUser }>(`/api/v1/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(res.token);
  return res.user;
}

/** Valida o token atual e retorna o usuário; lança se inválido. */
export async function fetchMe(): Promise<AuthUser> {
  const res = await request<{ user: AuthUser }>(`/api/v1/auth/me`);
  return res.user;
}

export function logout() {
  clearToken();
}

export function fetchCarteiras(dtPesquisa?: string): Promise<CarteirasResponse> {
  const qs = dtPesquisa ? `?dtPesquisa=${dtPesquisa}` : "";
  return request<CarteirasResponse>(`/api/v1/portfolio/carteiras${qs}`);
}

export function fetchSummary(
  dtPesquisa: string,
  idCarteira: number,
): Promise<SummaryResponse> {
  return request<SummaryResponse>(
    `/api/v1/portfolio/summary?dtPesquisa=${dtPesquisa}&idCarteira=${idCarteira}`,
  );
}

export function fetchPassivoCarteiras(dtPesquisa?: string): Promise<CarteirasResponse> {
  const qs = dtPesquisa ? `?dtPesquisa=${dtPesquisa}` : "";
  return request<CarteirasResponse>(`/api/v1/portfolio/passivo/carteiras${qs}`);
}

export function fetchCotistas(dtPesquisa: string, idCarteira: number): Promise<CotistasResponse> {
  return request<CotistasResponse>(
    `/api/v1/portfolio/passivo/cotistas?dtPesquisa=${dtPesquisa}&idCarteira=${idCarteira}`,
  );
}

export function fetchPassivoSummary(
  dtPesquisa: string,
  idCarteira: number,
  idCotista: number,
): Promise<PassivoSummaryResponse> {
  return request<PassivoSummaryResponse>(
    `/api/v1/portfolio/passivo/summary?dtPesquisa=${dtPesquisa}&idCarteira=${idCarteira}&idCotista=${idCotista}`,
  );
}

export function sendChat(params: {
  conversationId?: string;
  message: string;
  context?: ChatContext;
}): Promise<ChatResponse> {
  return request<ChatResponse>(`/api/v1/portfolio/chat`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
