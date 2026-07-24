/**
 * Frontend -> standalone API configuration.
 *
 * There are deliberately TWO switches, because there are two different APIs.
 *
 * NEXT_PUBLIC_API_URL is the old one. It is read by around thirty branches in
 * the server actions, and every one of them expects the Express API's routes
 * and envelopes: /api/dashboard, /api/templates, /api/firm/branding, and
 * responses shaped like { clients: [...] }. Setting it points the whole app at
 * whatever it names, so it must only ever name a service that implements all
 * of that. It is unset in production.
 *
 * NEXT_PUBLIC_NEST_API_URL is the NestJS API. It currently implements the
 * client, item, portal, reminder and entitlement routes, and returns bare
 * arrays rather than envelopes, so it is NOT a drop-in for the old switch.
 * Keeping it separate means the deployed API is reachable and testable without
 * a single live code path changing, and call sites can move across one at a
 * time instead of all at once.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export function isApiEnabled(): boolean {
  return API_BASE_URL.length > 0;
}

export const NEST_API_BASE_URL = (process.env.NEXT_PUBLIC_NEST_API_URL ?? "").replace(/\/$/, "");

export function isNestApiEnabled(): boolean {
  return NEST_API_BASE_URL.length > 0;
}
