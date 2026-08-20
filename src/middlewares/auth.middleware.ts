import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../services/auth.service.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: { email: string };
  }
}

/** preHandler: exige um Bearer token válido; caso contrário, responde 401. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return reply.status(401).send({
      erro: "nao_autenticado",
      mensagem: "Sessão inválida ou expirada. Faça login novamente.",
    });
  }
  req.user = { email: payload.sub };
}
