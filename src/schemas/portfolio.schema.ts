import { z } from "zod";

/** Uma mensagem de chat enviada pelo cliente. */
export const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().min(1).max(4000),
});

/**
 * Corpo do POST /api/v1/portfolio/chat.
 * Duas formas de uso:
 *  - stateful: enviar `conversationId` + `message` (o backend guarda o histórico);
 *  - stateless: enviar `messages` (histórico completo a cada request).
 * Pelo menos um caminho deve ser fornecido.
 */
/** Contexto opcional do painel: carteira e data atualmente selecionadas. */
export const chatContextSchema = z.object({
  modo: z.enum(["ativos", "passivos"]).optional(),
  idCarteira: z.coerce.number().int().min(0).optional(),
  noResumido: z.string().min(1).max(200).optional(),
  dtPesquisa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  idCotista: z.coerce.number().int().min(0).optional(),
  noCotista: z.string().min(1).max(200).optional(),
});

export const chatBodySchema = z
  .object({
    conversationId: z.string().min(1).max(100).optional(),
    message: z.string().trim().min(1).max(4000).optional(),
    messages: z.array(chatMessageSchema).min(1).max(50).optional(),
    context: chatContextSchema.optional(),
  })
  .refine((b) => !!b.message || (b.messages && b.messages.length > 0), {
    message: "Informe 'message' (com conversationId) ou 'messages'.",
  });

/** Query do GET /api/v1/portfolio/carteiras. */
export const carteirasQuerySchema = z.object({
  dtPesquisa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** Query do GET /api/v1/portfolio/summary. */
export const summaryQuerySchema = z.object({
  dtPesquisa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dtPesquisa deve ser YYYY-MM-DD"),
  idCarteira: z.coerce.number().int().min(0).default(0),
});

/** Query do GET /api/v1/portfolio/passivo/summary. */
export const passivoSummaryQuerySchema = z.object({
  dtPesquisa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dtPesquisa deve ser YYYY-MM-DD"),
  idCarteira: z.coerce.number().int().min(0).default(0),
  idCotista: z.coerce.number().int().min(0).default(0),
});

/** Query do GET /api/v1/portfolio/passivo/cotistas. */
export const cotistasQuerySchema = z.object({
  dtPesquisa: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dtPesquisa deve ser YYYY-MM-DD"),
  idCarteira: z.coerce.number().int().min(0).default(0),
});

export type ChatBody = z.infer<typeof chatBodySchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CarteirasQuery = z.infer<typeof carteirasQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type PassivoSummaryQuery = z.infer<typeof passivoSummaryQuerySchema>;
export type CotistasQuery = z.infer<typeof cotistasQuerySchema>;
