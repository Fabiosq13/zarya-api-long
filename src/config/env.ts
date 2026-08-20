import { z } from "zod";
import "dotenv/config";

const schema = z.object({
  // Zarya
  // Sem default silencioso: o host de produção é o correto. Se quiser usar
  // homologação, defina explicitamente ZARYA_BASE_URL=https://apishow.zarya.net.br
  ZARYA_BASE_URL: z.string().url().default("https://api.zarya.net.br"),
  ZARYA_TOKEN: z.string().min(1, "ZARYA_TOKEN é obrigatório"),
  ZARYA_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // Gemini
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY é obrigatório"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  // App
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  LOG_LEVEL: z.string().default("info"),

  // CORS: origens permitidas para o front (separadas por vírgula). "*" libera todas.
  CORS_ORIGIN: z.string().default("*"),

  // Caminho do frontend buildado (web/dist). Opcional: por padrão é detectado
  // automaticamente. Defina apenas se o layout de deploy for diferente.
  WEB_DIST_PATH: z.string().min(1).optional(),

  // Portfólio
  // Data padrão genérica usada como último recurso quando o modo não define a sua.
  PORTFOLIO_DEFAULT_DATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default("2026-02-02"),
  // Data padrão por modo (a base nova tem referências diferentes para cada visão):
  //   Ativos/Carteira  -> 2026-01-27
  //   Passivo/Cotista  -> 2026-02-02
  PORTFOLIO_DEFAULT_DATE_ATIVOS: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default("2026-01-27"),
  PORTFOLIO_DEFAULT_DATE_PASSIVOS: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default("2026-02-02"),
  // Quantos dias andar para trás procurando uma data com posições.
  PORTFOLIO_LOOKBACK_DAYS: z.coerce.number().int().min(0).max(31).default(7),

  // Autenticação (usuário único — sem banco de dados)
  // Defina AUTH_SECRET e AUTH_PASSWORD em produção. Os defaults servem para dev.
  AUTH_EMAIL: z.string().min(1).default("master.zarya"), // aceita usuário ou e-mail
  AUTH_PASSWORD: z.string().min(1).default("Zar$#2026*"),
  AUTH_SECRET: z.string().min(1).default("troque-este-segredo-em-producao-zarya-atlantyx"),
  AUTH_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(12),

  // Conversas (Redis)
  // Se REDIS_URL não for definida, o histórico cai para memória (útil em dev local).
  REDIS_URL: z.string().min(1).optional(),
  CONVERSATION_TTL_SECONDS: z.coerce.number().int().positive().default(604800), // 7 dias
  CONVERSATION_MAX_TURNS: z.coerce.number().int().positive().default(20),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Falha cedo: sem env válido, o processo nem sobe.
  console.error("❌ Variáveis de ambiente inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
