/** Operational error carrying an HTTP status. Thrown anywhere; caught by the
 *  central error handler and rendered as a clean JSON error. */
export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = "error", details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, "bad_request", details);
export const unauthorized = (msg = "Not authenticated") => new HttpError(401, msg, "unauthorized");
export const forbidden = (msg = "Not allowed") => new HttpError(403, msg, "forbidden");
export const notFound = (msg = "Not found") => new HttpError(404, msg, "not_found");
export const conflict = (msg: string) => new HttpError(409, msg, "conflict");
export const unprocessable = (msg: string, details?: unknown) => new HttpError(422, msg, "unprocessable", details);
export const serviceUnavailable = (msg: string) => new HttpError(503, msg, "service_unavailable");
