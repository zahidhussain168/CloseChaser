import "server-only";

/**
 * SMS channel scaffold (Twilio), dormant behind an env flag.
 *
 * The product ships email-only today (CLAUDE.md: app-sent SMS is off until A2P
 * registration is in place). This module is the clean seam for when it is: it is
 * a no-op unless TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM are all
 * set, so nothing sends by accident. The reminder system is already
 * channel-agnostic (reminders.channel), so wiring this in later is a small step.
 */

export function isSmsEnabled(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM &&
      process.env.SMS_CHANNEL_ENABLED === "true",
  );
}

export type SmsResult = { ok: true; sid: string } | { ok: false; error: string; skipped?: boolean };

/**
 * Send an SMS. Returns { ok:false, skipped:true } when the channel is not
 * configured, so callers can fall back to email without treating it as a
 * failure. When enabled, posts to the Twilio REST API with plain fetch (no SDK
 * dependency).
 */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!isSmsEnabled()) return { ok: false, error: "SMS channel not enabled", skipped: true };

  const sid = process.env.TWILIO_ACCOUNT_SID as string;
  const token = process.env.TWILIO_AUTH_TOKEN as string;
  const from = process.env.TWILIO_FROM as string;

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `Twilio error ${res.status}` };
    return { ok: true, sid: data.sid ?? "unknown" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "sms send failed" };
  }
}
