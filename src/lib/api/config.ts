/**
 * Frontend -> standalone API configuration.
 *
 * The migration is opt-in and safe: when NEXT_PUBLIC_API_URL is unset (the
 * default, including current production), the app keeps using its built-in
 * server actions. Point it at the deployed Express API to route data through
 * that service instead, one call site at a time.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export function isApiEnabled(): boolean {
  return API_BASE_URL.length > 0;
}
