import { getFirm } from "@/lib/data";
import { firmIsPro, firmIsScale } from "@/lib/pro-features";

/**
 * Server-side entitlement helpers. The feature catalog and the pure `firmIsPro`
 * check live in the client-safe `@/lib/pro-features` module; this file adds the
 * helpers that read the current firm (server-only) and is re-exported for
 * convenience so existing server imports keep working.
 */
export { PRO_FEATURES, firmIsPro, firmIsScale, firmPlanTier } from "@/lib/pro-features";
export type { ProFeatureKey, PlanTier } from "@/lib/pro-features";

/** True when the current firm may use premium features. */
export async function isPro(): Promise<boolean> {
  return firmIsPro(await getFirm());
}

/** True when the current firm has Scale-tier access. */
export async function isScale(): Promise<boolean> {
  return firmIsScale(await getFirm());
}

