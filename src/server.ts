import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { closeRedis } from "./services/redis.js";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 Zarya Agent rodando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Encerramento gracioso
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, async () => {
      app.log.info(`Recebido ${sig}, encerrando...`);
      await app.close();
      await closeRedis();
      process.exit(0);
    });
  }
}

main();
