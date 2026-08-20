import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZaryaError } from "../services/zarya.service.js";

/**
 * Handler global de erros: traduz exceções em payload padronizado,
 * sem vazar stack traces ou dados sensíveis para o cliente.
 *
 * @param serveSpa  Quando true (frontend buildado presente), rotas GET que não
 *                  são de API caem no index.html (fallback de SPA). Rotas de API
 *                  continuam retornando 404 em JSON.
 */
export function registerErrorHandler(app: FastifyInstance, serveSpa = false) {
  app.setErrorHandler((error: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZaryaError) {
      const zaryaErr: ZaryaError = error;
      req.log.error({ err: zaryaErr.message, status: zaryaErr.status }, "Erro na Zarya");
      return reply.status(502).send({
        erro: "falha_zarya",
        mensagem: "Não foi possível obter os dados da carteira no momento.",
      });
    }

    if (error.validation) {
      return reply.status(400).send({ erro: "validacao", mensagem: error.message });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        erro: "rate_limit",
        mensagem: "Muitas requisições. Tente novamente em instantes.",
      });
    }

    req.log.error({ err: error }, "Erro não tratado");
    return reply.status(500).send({
      erro: "interno",
      mensagem: "Ocorreu um erro inesperado.",
    });
  });

  app.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
    const url = req.raw.url ?? "";
    const isApi =
      url.startsWith("/api") || url.startsWith("/health") || req.method !== "GET";

    // Navegação no navegador (GET fora da API): entrega o app (SPA).
    if (serveSpa && !isApi) {
      return reply.type("text/html").sendFile("index.html");
    }

    return reply.status(404).send({ erro: "nao_encontrado", mensagem: "Rota não encontrada." });
  });
}
