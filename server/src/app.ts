import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import { corsOrigins, isProd } from "./config/env";
import { apiLimiter } from "./middleware/rateLimit";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { clientsRouter } from "./routes/clients.routes";
import { clientOpsRouter } from "./routes/clientOps.routes";
import { itemsRouter } from "./routes/items.routes";
import { remindersRouter } from "./routes/reminders.routes";
import { portalRouter } from "./routes/portal.routes";
import { aiRouter } from "./routes/ai.routes";
import { qboRouter } from "./routes/qbo.routes";
import { paddleRouter } from "./routes/paddle.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { firmRouter } from "./routes/firm.routes";
import { templatesRouter } from "./routes/templates.routes";
import { billingRouter } from "./routes/billing.routes";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(compression());
  app.use(morgan(isProd ? "combined" : "dev"));
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server (no Origin) and configured origins.
        if (!origin || corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  // Health (no auth, no body parsing needed).
  app.use("/health", healthRouter);
  app.use("/api/health", healthRouter);

  // Paddle webhook needs the RAW body for signature verification, so it MUST be
  // mounted before the JSON body parser.
  app.use("/api/paddle", paddleRouter);

  // Body parsers for the rest of the API.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Public, token-scoped client portal (its own tight rate limit inside).
  app.use("/api/c", portalRouter);

  // Cron scheduler (secret-guarded inside).
  app.use("/api/cron", remindersRouter);

  // Authenticated app API (shared generous rate limit).
  app.use("/api/auth", apiLimiter, authRouter);
  app.use("/api/dashboard", apiLimiter, dashboardRouter);
  app.use("/api/clients", apiLimiter, clientsRouter, clientOpsRouter);
  app.use("/api/items", apiLimiter, itemsRouter);
  app.use("/api/firm", apiLimiter, firmRouter);
  app.use("/api/templates", apiLimiter, templatesRouter);
  app.use("/api/billing", apiLimiter, billingRouter);
  app.use("/api/ai", apiLimiter, aiRouter);
  app.use("/api/qbo", apiLimiter, qboRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
