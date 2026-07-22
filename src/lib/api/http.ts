import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, message: string, code = "error", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  /** Pass a FormData body directly (file uploads); skips JSON headers. */
  form?: FormData;
  signal?: AbortSignal;
};

/**
 * Call the standalone API. Attaches the Supabase access token as a Bearer, so
 * requests run under the caller's RLS on the server. Throws ApiError on non-2xx.
 */
export async function apiFetch<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    const err = json as { error?: string; code?: string; details?: unknown } | undefined;
    throw new ApiError(res.status, err?.error ?? `Request failed (${res.status})`, err?.code, err?.details);
  }
  return json as T;
}
