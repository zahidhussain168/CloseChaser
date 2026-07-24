import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "./prisma.service";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Magic links.
 *
 * The one law of this product is that the client never creates an account, so
 * this link IS their identity. We reuse a live link rather than minting a new
 * one per reminder: a client who bookmarked the first email should still be
 * able to open it, and a stack of valid tokens per client is a larger blast
 * radius for no benefit.
 */
@Injectable()
export class MagicLinkService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureFor(clientId: string, now: Date = new Date()): Promise<string> {
    const live = await this.prisma.db.magic_links.findFirst({
      where: { client_id: clientId, revoked_at: null, expires_at: { gt: now } },
      orderBy: { created_at: "desc" },
      select: { token: true },
    });
    if (live) return live.token;

    const created = await this.prisma.db.magic_links.create({
      data: {
        client_id: clientId,
        token: randomBytes(32).toString("base64url"),
        expires_at: new Date(now.getTime() + THIRTY_DAYS_MS),
      },
      select: { token: true },
    });
    return created.token;
  }

  url(token: string): string {
    const base = (process.env.APP_URL ?? "https://ruledoff.vercel.app").replace(/\/+$/, "");
    return `${base}/c/${token}`;
  }
}
