/**
 * Deadline-aware escalation.
 *
 * When a client's close has a hard deadline, the chase escalates by CHANNEL as
 * the date approaches, on top of the existing copy-level escalation:
 *   more than 3 days out ....... email
 *   within 3 days .............. email + SMS (when the SMS channel is enabled)
 *   final day / overdue ........ email + SMS, marked urgent
 *
 * With no deadline set, behaviour is unchanged: email only, copy-level
 * escalation as before. Auto-stop is unaffected: the caller still stops the
 * moment every item is answered; this only decides HOW to reach out while items
 * remain open.
 */

export type Channel = "email" | "email_sms";

export type EscalationPlan = {
  channel: Channel;
  urgent: boolean;
  daysToDeadline: number | null;
};

const DAY = 86_400_000;

export function planEscalation(deadlineISO: string | null, now: number = Date.now()): EscalationPlan {
  if (!deadlineISO) return { channel: "email", urgent: false, daysToDeadline: null };

  const days = Math.ceil((new Date(deadlineISO).getTime() - now) / DAY);
  if (days > 3) return { channel: "email", urgent: false, daysToDeadline: days };
  if (days > 0) return { channel: "email_sms", urgent: false, daysToDeadline: days };
  return { channel: "email_sms", urgent: true, daysToDeadline: days };
}

/** A short SMS body for a chase, kept under one segment where possible. */
export function smsChaseBody(opts: { firmName: string; openCount: number; url: string; urgent: boolean }): string {
  const lead = opts.urgent
    ? `Final day to close your books.`
    : `${opts.openCount} item${opts.openCount === 1 ? "" : "s"} left to close your books.`;
  return `${lead} No login, just tap: ${opts.url} (${opts.firmName})`;
}
