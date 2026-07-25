import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

/**
 * The firm owned by the signed-in bookkeeper.
 *
 * Returns the WHOLE row on purpose. getFirm is the app's source of truth for
 * both branding and entitlements, and several callers read columns the Firm
 * type does not formally list (reminder_offsets and reminder_weekly_step drive
 * the cadence display; subscription_status / plan / trial_ends_at drive every
 * feature gate). Dropping any of them here would silently break gating and
 * cadence app-wide, so this mirrors the old select("*").
 */
@Injectable()
export class FirmService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const f = await this.prisma.db.firms.findUnique({ where: { owner_id: userId } });
    if (!f) return null;
    const iso = (d: Date | null) => (d ? d.toISOString() : null);
    return {
      id: f.id,
      owner_id: f.owner_id,
      name: f.name,
      accent_color: f.accent_color,
      reply_to: f.reply_to,
      logo_url: f.logo_url,
      created_at: f.created_at.toISOString(),
      reminder_offsets: f.reminder_offsets,
      reminder_weekly_step: f.reminder_weekly_step,
      paddle_customer_id: f.paddle_customer_id,
      paddle_subscription_id: f.paddle_subscription_id,
      subscription_status: f.subscription_status,
      current_period_end: iso(f.current_period_end),
      trial_ends_at: iso(f.trial_ends_at),
      accounting_software: f.accounting_software,
      client_count: f.client_count,
      chase_method: f.chase_method,
      referral_source: f.referral_source,
      onboarded_at: iso(f.onboarded_at),
      plan: f.plan,
      billing_updated_at: iso(f.billing_updated_at),
    };
  }
}
