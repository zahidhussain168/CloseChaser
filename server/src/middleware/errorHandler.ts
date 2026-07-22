import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/errors";
import { logger } from "../lib/logger";
import { isProd } from "../config/env";

/** 404 for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found", code: "not_found" });
}

/** Central error handler: renders HttpError cleanly, hides internals in prod. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    if (err.status >= 500) logger.error(err.message, { path: req.path, code: err.code });
    return res.status(err.status).json({ error: err.message, code: err.code, details: err.details });
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", { path: req.path, message });
  res.status(500).json({
    error: isProd ? "Internal server error" : message,
    code: "internal_error",
  });
}
