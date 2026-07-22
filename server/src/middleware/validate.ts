import type { Request, Response, NextFunction } from "express";
import { z, type ZodTypeAny } from "zod";
import { unprocessable } from "../lib/errors";

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

/** Validate and coerce request parts with zod. On failure, 422 with details. */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request["query"];
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(
          unprocessable(
            "Validation failed",
            err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          ),
        );
      }
      next(err);
    }
  };
}

export const uuid = z.string().uuid();
