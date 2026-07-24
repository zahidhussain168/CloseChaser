import { API_BASE_URL } from "./config";
import { ApiError } from "./http";

/**
 * The single mutator every generated call routes through.
 *
 * Orval generates the paths, the request shapes and the response types from
 * the OpenAPI spec. This supplies the three things the spec cannot know: where
 * the API lives, who is asking, and what to do when it says no.
 *
 * Auth is passed per call rather than read from a module-level singleton,
 * because the same code runs in server components (cookie session) and in the
 * browser (client session). Use authHeaders() with getServerToken() or
 * getBrowserToken() at the call site.
 */
export async function apiFetcher<T extends { data: unknown; status: number }>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      503,
      "NEXT_PUBLIC_API_URL is not set, so the standalone API cannot be reached",
      "api_not_configured",
    );
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    // Never serve a stale answer for data the bookkeeper is about to act on.
    cache: "no-store",
  });

  if (!res.ok) {
    // Nest's exception filter returns { statusCode, message, error }. Fall back
    // to the status text when the body is empty or not JSON at all.
    const body = (await res.json().catch(() => null)) as
      | { message?: string | string[]; error?: string }
      | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? res.statusText);
    throw new ApiError(res.status, message, body?.error ?? "error", body);
  }

  // Orval's fetch client types every call as { data, status, headers }, so the
  // mutator has to return that envelope rather than the bare body. Returning
  // just the parsed JSON would leave `.data` undefined at every call site while
  // still type checking.
  const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  return { data, status: res.status, headers: res.headers } as unknown as T;
}

/** Bearer header for a Supabase access token, or nothing when signed out. */
export function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
