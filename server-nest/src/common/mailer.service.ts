import { Injectable, Logger } from "@nestjs/common";

/**
 * Outbound email.
 *
 * The provider sits behind this one method on purpose. The deployed app already
 * sends through Resend with a verified domain, so that is what this uses; the
 * Phase 3 brief named Postmark, and swapping to it means adding a branch here
 * and nothing else. Everything upstream (cadence, suppression, telemetry) is
 * provider-agnostic.
 */
export type SendResult =
  | { ok: true; providerMessageId: string | null }
  | { ok: false; error: string; hardBounce: boolean };

export type OutboundEmail = {
  to: string;
  from: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class MailerService {
  private readonly log = new Logger(MailerService.name);

  /** True when we are actually able to send, rather than silently dropping. */
  get configured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  async send(email: OutboundEmail): Promise<SendResult> {
    if (!this.configured) {
      // Loud in logs, harmless in dev. Never pretend a send succeeded.
      this.log.warn(`RESEND_API_KEY not set, not sending "${email.subject}" to ${email.to}`);
      return { ok: false, error: "Mailer is not configured", hardBounce: false };
    }

    let res: Response;
    try {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          reply_to: email.replyTo ?? undefined,
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      });
    } catch (e) {
      // Network failure. Retryable, so explicitly not a hard bounce.
      return { ok: false, error: (e as Error).message, hardBounce: false };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // 4xx that is not rate limiting means this address or payload will never
      // work; retrying it just burns sending reputation.
      const hardBounce = res.status >= 400 && res.status < 500 && res.status !== 429;
      return { ok: false, error: `${res.status} ${body.slice(0, 300)}`, hardBounce };
    }

    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, providerMessageId: json.id ?? null };
  }
}
