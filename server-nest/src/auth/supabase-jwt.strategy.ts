import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthUser } from "../common/current-user.decorator";

/**
 * Bookkeeper auth: verifies the Supabase access token the frontend already
 * holds. Supabase signs these HS256 with the project JWT secret, so we verify
 * locally with no network hop.
 *
 * This strategy is deliberately separate from the portal strategy and uses a
 * DIFFERENT secret, which is what makes cross-acceptance impossible: a portal
 * token cannot satisfy this strategy and a bookkeeper token cannot satisfy
 * that one.
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, "supabase") {
  constructor() {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new Error("SUPABASE_JWT_SECRET is required");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ["HS256"],
    });
  }

  validate(payload: { sub?: string; email?: string; role?: string }): AuthUser {
    if (!payload?.sub) throw new UnauthorizedException("Malformed token");
    // Supabase issues service-role tokens with the same secret. Those must
    // never authenticate a user request.
    if (payload.role === "service_role") throw new UnauthorizedException("Invalid token");
    return { userId: payload.sub, email: payload.email };
  }
}
