import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info("RuledOff API listening", { port: env.PORT, env: env.NODE_ENV });
});

function shutdown(signal: string) {
  logger.info("Shutting down", { signal });
  server.close(() => process.exit(0));
  // Force-exit if connections do not drain promptly.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection", { reason: String(reason) }));
