import crypto from "node:crypto";
import { env } from "../config/env.js";

/**
 * Auth de usuário único, sem banco de dados.
 * Credencial vem do ambiente; o login emite um token compacto assinado (HS256),
 * verificado a cada requisição protegida. Stateless — não precisa de Postgres/Redis.
 */

export interface TokenPayload {
  sub: string; // e-mail do usuário
  iat: number; // emitido em (epoch s)
  exp: number; // expira em (epoch s)
}

function sign(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${header}.${body}`;
  const sig = crypto.createHmac("sha256", env.AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function createToken(email: string): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + env.AUTH_TOKEN_TTL_HOURS * 3600;
  return { token: sign({ sub: email, iat: now, exp: expiresAt }), expiresAt };
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const expected = crypto.createHmac("sha256", env.AUTH_SECRET).update(`${h}.${b}`).digest("base64url");
  const got = Buffer.from(s);
  const exp = Buffer.from(expected);
  if (got.length !== exp.length || !crypto.timingSafeEqual(got, exp)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b, "base64url").toString()) as TokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyCredentials(email: string, password: string): boolean {
  const emailOk = email.trim().toLowerCase() === env.AUTH_EMAIL.toLowerCase();
  const passOk = safeEqual(password, env.AUTH_PASSWORD);
  return emailOk && passOk;
}
