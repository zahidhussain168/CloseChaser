import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../common/prisma.service";
import type { PortalPrincipal } from "../common/current-user.decorator";

/**
 * Client portal auth for magic links.
 *
 * Short-lived, scoped to one client, and revocable: the jti is the id of the
 * magic_links row that minted it, and every request re-checks that row is
 * still live (not revoked, not expired). Revoking the link kills every token
 * issued from it immediately, which a stateless JWT alone cannot do.
 *
 * Signed with PORTAL_JWT_SECRET, which is not the Supabase secret, so a
 * bookkeeper access token can never authenticate here.
 */
@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, "portal") {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.PORTAL_JWT_SECRET;
    if (!secret) throw new Error("PORTAL_JWT_SECRET is required");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ["HS256"],
    });
  }

  async validate(payload: {
    sub?: string;
    jti?: string;
    scope?: string;
  }): Promise<PortalPrincipal> {
    if (payload?.scope !== "portal" || !payload.sub || !payload.jti) {
      throw new UnauthorizedException("Invalid portal token");
    }

    // Revocation check on every request. Cheap (indexed pk) and it is the
    // whole point of the jti.
    const link = await this.prisma.db.magic_links.findUnique({
      where: { id: payload.jti },
      select: { id: true, client_id: true, revoked_at: true, expires_at: true },
    });

    if (
      !link ||
      link.revoked_at !== null ||
      link.expires_at.getTime() <= Date.now() ||
      link.client_id !== payload.sub
    ) {
      throw new UnauthorizedException("Link is no longer valid");
    }

    return { clientId: link.client_id, jti: link.id, scope: "portal" };
  }
}
