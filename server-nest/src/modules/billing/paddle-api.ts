/**
 * Paddle Billing REST helpers, ported from the app's src/lib/paddle/server.ts.
 * Sandbox and production use different hosts and non-interchangeable keys, all
 * env-driven so the API deploys before the keys exist and lights up when added.
 */
function apiBase(): string {
  return process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY);
}

async function paddleFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is not set");
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

/** Find or create the Paddle customer for a firm's email. */
export async function ensurePaddleCustomer(email: string, name: string): Promise<string> {
  const found = await paddleFetch(`/customers?email=${encodeURIComponent(email)}`);
  if (found.ok) {
    const json = (await found.json()) as { data?: { id: string }[] };
    if (json.data?.length) return json.data[0].id;
  }
  const created = await paddleFetch("/customers", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
  if (!created.ok) {
    throw new Error(`Could not create Paddle customer (${created.status}): ${(await created.text()).slice(0, 200)}`);
  }
  const json = (await created.json()) as { data: { id: string } };
  return json.data.id;
}

/** Short-lived, single-use portal link. Generated on demand, never cached. */
export async function createPortalSession(customerId: string, subscriptionIds: string[]): Promise<string | null> {
  const res = await paddleFetch(`/customers/${customerId}/portal-sessions`, {
    method: "POST",
    body: JSON.stringify({ subscription_ids: subscriptionIds }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { urls?: { general?: { overview?: string } } } };
  return json.data?.urls?.general?.overview ?? null;
}
