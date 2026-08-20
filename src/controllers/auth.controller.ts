import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createToken, verifyCredentials } from "../services/auth.service.js";
import { env } from "../config/env.js";

const loginSchema = z.object({
  email: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});

/** POST /api/v1/auth/login — valida credencial e devolve um token assinado. */
export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ erro: "validacao", detalhes: parsed.error.flatten().fieldErrors });
  }
  const { email, password } = parsed.data;
  if (!verifyCredentials(email, password)) {
    return reply.status(401).send({ erro: "credenciais_invalidas", mensagem: "Usuário ou senha incorretos." });
  }
  const { token, expiresAt } = createToken(env.AUTH_EMAIL);
  return reply.send({ token, expiresAt, user: { email: env.AUTH_EMAIL } });
}

/** GET /api/v1/auth/me — retorna o usuário autenticado (rota protegida). */
export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ user: req.user });
}
