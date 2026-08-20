import type { FastifyInstance } from "fastify";
import { loginHandler, meHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/login", loginHandler);
  app.get("/api/v1/auth/me", { preHandler: requireAuth }, meHandler);
}
