import type { FastifyInstance } from "fastify";
import {
  chatHandler,
  carteirasHandler,
  summaryHandler,
  passivoCarteirasHandler,
  cotistasHandler,
  passivoSummaryHandler,
} from "../controllers/portfolio.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export async function portfolioRoutes(app: FastifyInstance) {
  // Todas as rotas de dados exigem autenticação.
  app.get("/api/v1/portfolio/carteiras", { preHandler: requireAuth }, carteirasHandler);
  app.get("/api/v1/portfolio/summary", { preHandler: requireAuth }, summaryHandler);
  app.post("/api/v1/portfolio/chat", { preHandler: requireAuth }, chatHandler);

  // Passivo (posição por cotista) — endpoints independentes dos de ativos acima.
  app.get("/api/v1/portfolio/passivo/carteiras", { preHandler: requireAuth }, passivoCarteirasHandler);
  app.get("/api/v1/portfolio/passivo/cotistas", { preHandler: requireAuth }, cotistasHandler);
  app.get("/api/v1/portfolio/passivo/summary", { preHandler: requireAuth }, passivoSummaryHandler);
}
