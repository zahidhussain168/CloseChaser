import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwksCache, kidFromToken } from "./jwks";
import type { AuthUser } from "../common/current-user.decorator";

/**
 * Bookkeeper auth: verifies the Supabase access token the frontend already
 * holds.
 *
 * This project uses Supabase's current API keys (sb_publishable_ / sb_secret_),
 * which sign access tokens ASYMMETRICALLY with ES256 and publish the public key
 * at /auth/v1/.well-known/jwks.json. There is no shared HS256 secret to verify
 * against, and assuming one silently rejects every real token.
 *
 * Verification is still local: the JWKS is fetched once and cached, and the
 * signature is checked in-process, so this is not a network hop per request.
 * Rotation is handled by the kid in the token header.
 *
 * This strategy stays deliberately separate from the portal strategy and trusts
 * a completely different key, which is what makes cross-acceptance impossible:
 * a portal token cannot satisfy this strategy and a bookkeeper token cannot
 * satisfy that one.
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, "supabase") {
  constructor() {
    const url = process.env.SUPABASE_URL;
    if (!url) throw new Error("SUPABASE_URL is required to verify bookkeeper tokens");
    const issuer = `${url.replace(/\/+$/, "")}/auth/v1`;

    const jwks = new JwksCache(`${issuer}/.well-known/jwks.json`);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ["ES256", "RS256"],
      issuer,
      secretOrKeyProvider: (
        _req: unknown,
        rawToken: string,
        done: (err: Error | null, key?: string) => void,
      ) => {
        const kid = kidFromToken(rawToken);
        if (!kid) return done(new Error("Token header has no kid"));
        jwks.getKey(kid).then(
          (key) => done(null, key),
          (err: Error) => done(err),
        );
      },
    });
  }

  validate(payload: { sub?: string; email?: string; role?: string }): AuthUser {
    if (!payload?.sub) throw new UnauthorizedException("Malformed token");
    // The service role token is signed by the same issuer. It authenticates a
    // machine, never a user, so it must never satisfy a user request.
    if (payload.role === "service_role") throw new UnauthorizedException("Invalid token");
    return { userId: payload.sub, email: payload.email };
  }
}
