import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function buildServer() {
  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" }
      }
    }
  });

  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ status: "ok" }));

  // Placeholder routes
  app.get("/api/floors", async () => {
    return prisma.floor.findMany();
  });

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || "0.0.0.0";

  try {
    await app.listen({ port, host });
    app.log.info(`API listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

