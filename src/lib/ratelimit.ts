import "server-only";

/**
 * Fixed-window rate limiter. When Upstash Redis is configured
 * (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) it uses that shared store,
 * so limits hold ACROSS serverless instances. Without it, it falls back to a
 * per-instance in-memory window (fine for a single instance / local dev). The
 * limiter fails OPEN on any store error so a Redis blip never takes the app down.
 */
export type RateResult = { ok: boolean; retryAfter: number };

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstashLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;
  try {
    // INCR the counter and, only if it is new, set the window expiry (NX).
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSec), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return { ok: true, retryAfter: 0 };
    const data = (await res.json()) as { result: number }[];
    const count = data[0]?.result ?? 0;
    if (count > limit) return { ok: false, retryAfter: windowSec };
    return { ok: true, retryAfter: 0 };
  } catch {
    return { ok: true, retryAfter: 0 }; // fail open
  }
}

export async function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): Promise<RateResult> {
  if (UPSTASH_URL && UPSTASH_TOKEN) return upstashLimit(key, limit, windowMs);
  return memoryLimit(key, limit, windowMs);
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
