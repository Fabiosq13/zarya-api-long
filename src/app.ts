import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { portfolioRoutes } from "./routes/portfolio.routes.js";
import { registerErrorHandler } from "./middlewares/error.middleware.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Caminho do frontend buildado (web/dist).
 * Em produção o server roda de dist/app.js, então ../web/dist aponta para a raiz/web/dist.
 * Pode ser sobrescrito com WEB_DIST_PATH se o layout de deploy for diferente.
 */
function resolveWebDist(): string | null {
  const candidates = [
    env.WEB_DIST_PATH,
    resolve(__dirname, "../web/dist"), // dist/app.js  -> ../web/dist
    resolve(process.cwd(), "web/dist"), // rodando da raiz do projeto
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (existsSync(resolve(p, "index.html"))) return p;
  }
  return null;
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
  });

  // helmet com CSP desligada: o front é uma SPA com assets próprios e fontes externas.
  await app.register(helmet, { contentSecurityPolicy: false });

  const corsOrigin =
    env.CORS_ORIGIN === "*"
      ? true
      : env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
  await app.register(cors, {
    origin: corsOrigin,
    methods: ["GET", "POST", "OPTIONS"],
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: "1 minute",
  });

  app.get("/health", async () => ({
    status: "ok",
    ts: new Date().toISOString(),
    zaryaBaseUrl: env.ZARYA_BASE_URL,
    redis: env.REDIS_URL ? "configurado" : "memoria",
  }));

  await app.register(authRoutes);
  await app.register(portfolioRoutes);

  // Servir o frontend buildado (web/dist), se existir.
  const webDist = resolveWebDist();
  if (webDist) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: "/",
      wildcard: false, // deixamos o notFoundHandler cuidar do fallback de SPA
    });
    app.log.info(`🖼️  Frontend servido de: ${webDist}`);
  } else {
    app.log.warn(
      "web/dist não encontrado — rodando em modo API apenas. " +
        "Rode `npm run build` (que builda o frontend) antes de `npm start`.",
    );
  }

  // Handler de erro e 404 (com fallback de SPA quando o frontend está presente).
  registerErrorHandler(app, Boolean(webDist));

  app.log.info(`Zarya base URL em uso: ${env.ZARYA_BASE_URL}`);

  return app;
}
