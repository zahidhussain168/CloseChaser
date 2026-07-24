import type { OutboundEmail } from "../../common/mailer.service";
import type { ReminderLevel } from "./cadence";

/**
 * Chase copy.
 *
 * Escalation happens in the WORDS, never the channel: friendly, then specific
 * with a deadline, then consequence-framed, then a steady weekly nudge. The
 * reader is a busy small-business owner on their phone who did not ask for any
 * of this, so every level stays short and stays polite.
 *
 * House style: no em dashes or en dashes anywhere in user-facing copy.
 */
type Args = {
  level: ReminderLevel;
  clientName: string;
  firmName: string;
  accent: string;
  openCount: number;
  monthISO: string;
  closeDay: number | null;
  link: string;
  to: string;
  replyTo: string | null;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthName(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function deadlineLine(monthISO: string, closeDay: number | null): string {
  if (!closeDay) return "";
  const d = new Date(monthISO);
  const due = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, closeDay));
  return `${MONTHS[due.getUTCMonth()]} ${due.getUTCDate()}`;
}

function copyFor(a: Args): { subject: string; lead: string; body: string } {
  const month = monthName(a.monthISO);
  const thing = a.openCount === 1 ? "one thing" : `${a.openCount} things`;
  const isAre = a.openCount === 1 ? "is" : "are";
  const due = deadlineLine(a.monthISO, a.closeDay);

  switch (a.level) {
    case 1:
      return {
        subject: `Quick one on your ${month} books`,
        lead: `Hi ${a.clientName},`,
        body: `There ${isAre} still ${thing} I need from you before I can close out ${month}. It should only take a minute, and you do not need to log in anywhere.`,
      };
    case 2:
      return {
        subject: `${month} books: ${thing} still outstanding`,
        lead: `Hi ${a.clientName},`,
        body: due
          ? `I am still waiting on ${thing} for ${month}. Your books are due to close on ${due}, so if you can get to this in the next day or two I can keep everything on schedule.`
          : `I am still waiting on ${thing} for ${month}. If you can get to this in the next day or two I can keep everything on schedule.`,
      };
    case 3:
      return {
        subject: `${month} close is being held up`,
        lead: `Hi ${a.clientName},`,
        body: `I cannot close ${month} without ${thing} from you. Books that close late tend to mean filings that go in late, which is the part that gets expensive. This is the last thing standing between us and a finished month.`,
      };
    default:
      return {
        subject: `Still need ${thing} for ${month}`,
        lead: `Hi ${a.clientName},`,
        body: `A quick weekly nudge: ${thing} ${isAre} still open on your ${month} books. The link below picks up exactly where you left off.`,
      };
  }
}

export function chaseEmail(a: Args): OutboundEmail {
  const { subject, lead, body } = copyFor(a);
  const cta = a.openCount === 1 ? "Sort it out" : "Sort them out";
  const accent = /^#[0-9a-fA-F]{6}$/.test(a.accent) ? a.accent : "#5b2333";

  const text = [
    lead,
    "",
    body,
    "",
    `${cta}: ${a.link}`,
    "",
    "No login, no account, no app to install. Your answers save as you type.",
    "",
    a.firmName,
  ].join("\n");

  // Inline styles and a table shell, because email clients strip stylesheets.
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e6e4df;border-radius:14px;overflow:hidden;">
        <tr><td style="background:${accent};padding:18px 24px;">
          <span style="font:600 15px/1.3 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#ffffff;">${escapeHtml(a.firmName)}</span>
        </td></tr>
        <tr><td style="padding:26px 24px 8px;">
          <p style="margin:0 0 14px;font:400 15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1c1a;">${escapeHtml(lead)}</p>
          <p style="margin:0 0 22px;font:400 15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1c1a;">${escapeHtml(body)}</p>
          <a href="${a.link}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font:600 15px/1 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;padding:13px 22px;border-radius:9px;">${cta}</a>
          <p style="margin:22px 0 0;font:400 13px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#6b6b66;">No login, no account, no app to install. Your answers save as you type.</p>
        </td></tr>
        <tr><td style="padding:18px 24px 24px;border-top:1px solid #eeece7;">
          <p style="margin:0;font:400 12px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#8a8a84;">Sent by ${escapeHtml(a.firmName)} using RuledOff.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    to: a.to,
    from: `${a.firmName} <chase@ruledoff.com>`,
    replyTo: a.replyTo,
    subject,
    html,
    text,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
