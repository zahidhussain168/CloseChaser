import { env } from "../config/env";
import { logger } from "../lib/logger";

export type SendResult = { ok: true } | { ok: false; error: string };

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Send one email via Resend. In sandbox, RESEND_TEST_RECIPIENT redirects every
 * message to the account owner so unverified senders still deliver. If no key is
 * configured the send is a no-op success (lets the API run without email set up).
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  if (!env.RESEND_API_KEY) {
    logger.warn("Email skipped: RESEND_API_KEY not configured", { to: args.to });
    return { ok: true };
  }

  const to = env.RESEND_TEST_RECIPIENT || args.to;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
