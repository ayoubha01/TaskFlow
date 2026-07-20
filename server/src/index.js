import http from "http";
import { createApp } from "./app.js";
import { initSockets } from "./sockets/index.js";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { logger } from "./utils/logger.js";

const app = createApp();
const httpServer = http.createServer(app);

initSockets(httpServer, env.clientOrigin);

httpServer.listen(env.port, () => {
  logger.info(`TaskFlow server listening on port ${env.port}`, {
    env: env.nodeEnv,
  });
});

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  // Force exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));