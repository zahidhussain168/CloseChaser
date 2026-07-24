import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * Suppression list.
 *
 * A hard bounce or a spam complaint means we must never email that address
 * again. Continuing to send is exactly what gets a sending domain blocked, and
 * because the address belongs to the bookkeeper's CLIENT, the bookkeeper cannot
 * discover the problem themselves. So we stop, record why, and surface it.
 */
@Injectable()
export class SuppressionService {
  private readonly log = new Logger(SuppressionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Addresses are stored and compared lowercased and trimmed. */
  private key(email: string): string {
    return email.trim().toLowerCase();
  }

  async isSuppressed(email: string): Promise<boolean> {
    const hit = await this.prisma.db.email_suppressions.findUnique({
      where: { email: this.key(email) },
      select: { email: true },
    });
    return Boolean(hit);
  }

  /** Which of these addresses are suppressed. One query, not N. */
  async filterSuppressed(emails: string[]): Promise<Set<string>> {
    if (emails.length === 0) return new Set();
    const rows = await this.prisma.db.email_suppressions.findMany({
      where: { email: { in: emails.map((e) => this.key(e)) } },
      select: { email: true },
    });
    return new Set(rows.map((r) => r.email));
  }

  async suppress(email: string, reason: "bounce" | "complaint" | "manual", detail?: string) {
    const key = this.key(email);
    this.log.warn(`suppressing ${key}: ${reason}`);
    await this.prisma.db.email_suppressions.upsert({
      where: { email: key },
      create: { email: key, reason, detail },
      update: { reason, detail },
    });
  }

  /** Used when a bookkeeper fixes a client's address and wants to retry. */
  async release(email: string) {
    await this.prisma.db.email_suppressions
      .delete({ where: { email: this.key(email) } })
      .catch(() => undefined);
  }
}
