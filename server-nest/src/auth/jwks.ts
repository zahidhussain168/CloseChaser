import { createPublicKey } from "crypto";

/**
 * A minimal JWKS client.
 *
 * Deliberately dependency free. The obvious library (jwks-rsa) pulls in jose v5,
 * which is ESM only, and this app is bundled as CommonJS: it loads fine on a
 * modern local Node and then dies with ERR_REQUIRE_ESM inside the serverless
 * bundle. Node's own crypto imports a JWK directly, so the whole job is a fetch,
 * a cache and createPublicKey.
 *
 * Keys are cached by kid. An unknown kid triggers at most one refetch per
 * cooldown window, so a stream of tokens carrying junk kids cannot turn into a
 * stream of outbound requests.
 */
type Jwk = { kid?: string; alg?: string; kty?: string; use?: string };

const REFRESH_COOLDOWN_MS = 60_000;
const MAX_AGE_MS = 10 * 60 * 1000;

export class JwksCache {
  private keys = new Map<string, string>();
  private fetchedAt = 0;
  private inFlight: Promise<void> | undefined;

  constructor(private readonly jwksUri: string) {}

  private async refresh(): Promise<void> {
    // Collapse concurrent refreshes into one request.
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      const res = await fetch(this.jwksUri);
      if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
      const body = (await res.json()) as { keys?: Jwk[] };
      const next = new Map<string, string>();
      for (const jwk of body.keys ?? []) {
        if (!jwk.kid) continue;
        try {
          // PEM rather than a KeyObject: passport-jwt only accepts string | Buffer,
          // and jsonwebtoken verifies a PEM public key just as happily.
          const pem = createPublicKey({ key: jwk as object, format: "jwk" })
            .export({ type: "spki", format: "pem" }) as string;
          next.set(jwk.kid, pem);
        } catch {
          // A key we cannot import is not a reason to drop the ones we can.
        }
      }
      if (next.size === 0) throw new Error("JWKS contained no usable keys");
      this.keys = next;
      this.fetchedAt = Date.now();
    })().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  async getKey(kid: string): Promise<string> {
    const stale = Date.now() - this.fetchedAt > MAX_AGE_MS;
    if (this.keys.size === 0 || stale) await this.refresh();

    const hit = this.keys.get(kid);
    if (hit) return hit;

    // Unknown kid: the signing key may have rotated. Refetch once, but not
    // more often than the cooldown allows.
    if (Date.now() - this.fetchedAt > REFRESH_COOLDOWN_MS) await this.refresh();

    const afterRefresh = this.keys.get(kid);
    if (!afterRefresh) throw new Error(`No signing key matches kid ${kid}`);
    return afterRefresh;
  }
}

/** Read the kid out of a JWT header without trusting or verifying anything. */
export function kidFromToken(token: string): string | null {
  try {
    const [header] = token.split(".");
    const parsed = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    return typeof parsed?.kid === "string" ? parsed.kid : null;
  } catch {
    return null;
  }
}
