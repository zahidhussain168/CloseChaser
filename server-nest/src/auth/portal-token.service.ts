import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../common/prisma.service";

/** Mints short-lived portal tokens from an existing, live magic link. */
@Injectable()
export class PortalTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Exchange an opaque magic-link token for a scoped, revocable portal JWT. */
  async mintFromMagicLink(rawToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const link = await this.prisma.db.magic_links.findFirst({
      where: { token: rawToken, revoked_at: null, expires_at: { gt: new Date() } },
      select: { id: true, client_id: true },
    });
    if (!link) throw new NotFoundException("This link is no longer valid");

    const expiresIn = 60 * 60; // 1 hour: long enough to finish a checklist
    const accessToken = await this.jwt.signAsync(
      { sub: link.client_id, jti: link.id, scope: "portal" },
      { secret: process.env.PORTAL_JWT_SECRET, expiresIn },
    );
    return { accessToken, expiresIn };
  }
}
