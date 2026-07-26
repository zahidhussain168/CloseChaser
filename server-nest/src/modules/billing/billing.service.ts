import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { TenantService } from "../../common/tenant.service";
import { effectiveTier, entitlementsFor, normaliseStatus } from "./entitlements";
import { createPortalSession, ensurePaddleCustomer, isBillingConfigured } from "./paddle-api";

/** The shape we care about out of a Paddle subscription event. */
type PaddleSubscription = {
  id?: string;
  status?: string;
  customer_id?: string;
  current_billing_period?: { ends_at?: string } | null;
  custom_data?: { firm_id?: string } | null;
  items?: { price?: { id?: string } | null }[] | null;
};

export type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleSubscription;
};

export type WebhookOutcome =
  | { status: "applied"; firmId: string; plan: string; subscriptionStatus: string }
  | { status: "duplicate" | "stale" | "ignored" | "unmatched"; reason: string };

@Injectable()
export class BillingService {
  private readonly log = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  /** Which Paddle price means which tier. Unset price ids simply never match. */
  private planFromItems(items: PaddleSubscription["items"]): "pro" | "scale" {
    const scaleId = process.env.PADDLE_SCALE_PRICE_ID ?? process.env.NEXT_PUBLIC_PADDLE_SCALE_PRICE_ID;
    const ids = (items ?? []).map((i) => i.price?.id).filter(Boolean) as string[];
    return scaleId && ids.includes(scaleId) ? "scale" : "pro";
  }

  /**
   * Apply a verified webhook.
   *
   * Paddle guarantees delivery, not order, and it retries on any non-2xx. Both
   * are handled here rather than hoped away:
   *
   *  - The event id is the primary key of billing_events, so a retry collides
   *    and is reported as a duplicate instead of being applied twice.
   *  - The event's own occurred_at is compared with firms.billing_updated_at,
   *    so an event that overtook a newer one is recorded but NOT applied.
   *
   * Without the second guard a delayed 'canceled' can land after a fresh
   * 'active' and lock a paying firm out of the product they just bought.
   */
  async handleEvent(event: PaddleEvent): Promise<WebhookOutcome> {
    const eventId = event.event_id;
    const type = event.event_type ?? "";
    const occurredAt = event.occurred_at ? new Date(event.occurred_at) : null;

    if (!eventId || !occurredAt || Number.isNaN(occurredAt.getTime())) {
      return { status: "ignored", reason: "event is missing an id or a timestamp" };
    }

    // Claim the event. A unique violation means we have already seen it.
    try {
      await this.prisma.db.billing_events.create({
        data: {
          event_id: eventId,
          event_type: type,
          occurred_at: occurredAt,
          payload: event as unknown as object,
        },
      });
    } catch {
      return { status: "duplicate", reason: `already processed ${eventId}` };
    }

    if (!type.startsWith("subscription.") || !event.data) {
      await this.markSkipped(eventId, "not a subscription event");
      return { status: "ignored", reason: `nothing to do for ${type}` };
    }

    const sub = event.data;
    const firm = await this.resolveFirm(sub);
    if (!firm) {
      await this.markSkipped(eventId, "no firm matched");
      return { status: "unmatched", reason: "could not match this subscription to a firm" };
    }

    // Ordering guard, by the EVENT's clock rather than ours.
    if (firm.billing_updated_at && firm.billing_updated_at >= occurredAt) {
      await this.markSkipped(eventId, "stale event", firm.id);
      this.log.warn(`stale ${type} for firm ${firm.id}, ignoring`);
      return { status: "stale", reason: "a newer billing event has already been applied" };
    }

    const status = normaliseStatus(sub.status);
    const plan = this.planFromItems(sub.items);

    await this.prisma.db.firms.update({
      where: { id: firm.id },
      data: {
        subscription_status: status,
        plan,
        paddle_subscription_id: sub.id ?? undefined,
        paddle_customer_id: sub.customer_id ?? undefined,
        current_period_end: sub.current_billing_period?.ends_at
          ? new Date(sub.current_billing_period.ends_at)
          : null,
        billing_updated_at: occurredAt,
      },
    });

    await this.prisma.db.billing_events.update({
      where: { event_id: eventId },
      data: { applied: true, firm_id: firm.id },
    });

    return { status: "applied", firmId: firm.id, plan, subscriptionStatus: status };
  }

  /**
   * Match the subscription to a firm: the id we attached at checkout first,
   * then the stored subscription, then the customer. Never guess by email.
   */
  private async resolveFirm(sub: PaddleSubscription) {
    const select = { id: true, billing_updated_at: true } as const;
    const byCustomData = sub.custom_data?.firm_id;
    if (byCustomData) {
      const firm = await this.prisma.db.firms.findUnique({ where: { id: byCustomData }, select });
      if (firm) return firm;
    }
    if (sub.id) {
      const firm = await this.prisma.db.firms.findFirst({
        where: { paddle_subscription_id: sub.id },
        select,
      });
      if (firm) return firm;
    }
    if (sub.customer_id) {
      return this.prisma.db.firms.findFirst({
        where: { paddle_customer_id: sub.customer_id },
        select,
      });
    }
    return null;
  }

  private async markSkipped(eventId: string, reason: string, firmId?: string) {
    await this.prisma.db.billing_events
      .update({ where: { event_id: eventId }, data: { skip_reason: reason, firm_id: firmId } })
      .catch(() => undefined);
  }

  /**
   * Prepare a checkout: ensure the firm has a Paddle customer, storing the id.
   * The client-side Paddle.js opens the actual overlay with these values.
   */
  async prepareCheckout(userId: string, email: string) {
    if (!isBillingConfigured()) throw new BadRequestException("Billing is not set up yet.");
    const firmId = await this.tenant.firmIdForUser(userId);
    const firm = await this.prisma.db.firms.findUnique({
      where: { id: firmId },
      select: { id: true, name: true, reply_to: true, paddle_customer_id: true },
    });
    if (!firm) throw new BadRequestException("No firm found.");
    const useEmail = email || firm.reply_to || "";

    let customerId = firm.paddle_customer_id;
    if (!customerId) {
      customerId = await ensurePaddleCustomer(useEmail, firm.name);
      await this.prisma.db.firms.update({
        where: { id: firm.id },
        data: { paddle_customer_id: customerId },
      });
    }
    return { ok: true as const, customerId, firmId: firm.id, email: useEmail };
  }

  /** A short-lived Paddle portal URL, or null if there is no customer/session. */
  async portalUrl(userId: string): Promise<string | null> {
    const firmId = await this.tenant.firmIdForUser(userId);
    const firm = await this.prisma.db.firms.findUnique({
      where: { id: firmId },
      select: { paddle_customer_id: true, paddle_subscription_id: true },
    });
    if (!firm?.paddle_customer_id) return null;
    return createPortalSession(
      firm.paddle_customer_id,
      firm.paddle_subscription_id ? [firm.paddle_subscription_id] : [],
    );
  }

  /** What this bookkeeper can use right now. The frontend's source of truth. */
  async entitlements(userId: string) {
    const firmId = await this.tenant.firmIdForUser(userId);
    const firm = await this.prisma.db.firms.findUnique({
      where: { id: firmId },
      select: {
        plan: true, subscription_status: true, trial_ends_at: true, current_period_end: true,
      },
    });
    const tier = effectiveTier(firm?.plan, firm?.subscription_status, firm?.trial_ends_at);
    return {
      tier,
      status: normaliseStatus(firm?.subscription_status),
      trialEndsAt: firm?.trial_ends_at ?? null,
      currentPeriodEnd: firm?.current_period_end ?? null,
      features: entitlementsFor(tier),
    };
  }
}
