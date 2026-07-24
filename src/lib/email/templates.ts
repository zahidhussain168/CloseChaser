import type { ReminderLevel } from "@/lib/types";
import { initials, readableOn } from "@/lib/format";

/**
 * Email copy. Escalation is by COPY, not channel:
 *   initial → friendly (L1) → specific + deadline (L2) → consequence (L3) → weekly (L4)
 *
 * Bookkeepers can lightly edit the subject + body per kind (stored per-firm and
 * overriding these defaults). Body supports simple {{tokens}}. The item list,
 * the "Open your checklist" button and the firm chrome are injected by the
 * shell, so they can't be broken by an edit.
 */
export type EmailKind = "initial" | "level1" | "level2" | "level3" | "level4";

export type EmailTemplate = { subject: string; body: string };

export const EMAIL_KIND_LABELS: Record<EmailKind, string> = {
  initial: "First chase",
  level1: "Reminder 1, friendly (day 2)",
  level2: "Reminder 2, specific with a deadline (day 5)",
  level3: "Reminder 3, consequence (day 9)",
  level4: "Reminder 4, weekly",
};

export function kindForLevel(level: ReminderLevel): EmailKind {
  return (["level1", "level2", "level3", "level4"] as const)[level - 1];
}

export const DEFAULT_TEMPLATES: Record<EmailKind, EmailTemplate> = {
  initial: {
    subject: "A few things to close your {{month}} books",
    body:
      "Hi {{firstName}},\n\n" +
      "I'm getting your {{month}} books closed and there are {{openCount}} things I need from you. " +
      "No account, no login, no app to download. Just tap the button, answer what you can, and you're done. " +
      "It saves as you go, so you can stop and come back anytime.\n\n" +
      "Thanks so much,\n{{firmName}}",
  },
  level1: {
    subject: "Quick nudge on your {{month}} books",
    body:
      "Hi {{firstName}},\n\n" +
      "Just circling back. There are still {{openCount}} quick items to wrap up {{month}}. " +
      "Most folks knock these out in a couple of minutes from their phone.\n\n" +
      "Thanks,\n{{firmName}}",
  },
  level2: {
    subject: "{{month}} books: {{openCount}} still open (aiming for {{deadline}})",
    body:
      "Hi {{firstName}},\n\n" +
      "To keep {{month}} on track I'd love to have these {{openCount}} items back by {{deadline}}. " +
      "Everything you need is behind the button below. You can answer or snap a photo right from your phone.\n\n" +
      "Appreciate it,\n{{firmName}}",
  },
  level3: {
    subject: "Your {{month}} books can't close without these",
    body:
      "Hi {{firstName}},\n\n" +
      "I want to be straight with you: your {{month}} books can't be closed until these {{openCount}} items are answered, " +
      "and late books can mean late taxes and filings down the line. " +
      "This is the last big thing standing between you and a clean close, and it only takes a few minutes.\n\n" +
      "Here to help if anything's unclear,\n{{firmName}}",
  },
  level4: {
    subject: "Still open: {{openCount}} item(s) for {{month}}",
    body:
      "Hi {{firstName}},\n\n" +
      "A gentle weekly reminder that {{openCount}} items for {{month}} are still waiting on you. " +
      "Whenever you have a spare minute, the button below has everything.\n\n" +
      "Thanks,\n{{firmName}}",
  },
};

export type TemplateContext = {
  firstName: string;
  firmName: string;
  month: string;
  openCount: number;
  deadline: string;
};

export function renderTemplateString(
  input: string,
  ctx: TemplateContext,
): string {
  return input
    .replace(/\{\{firstName\}\}/g, ctx.firstName)
    .replace(/\{\{firmName\}\}/g, ctx.firmName)
    .replace(/\{\{month\}\}/g, ctx.month)
    .replace(/\{\{openCount\}\}/g, String(ctx.openCount))
    .replace(/\{\{deadline\}\}/g, ctx.deadline);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type EmailItem = {
  title: string;
  type: "transaction" | "document" | "questionnaire";
};

function itemKindLabel(type: EmailItem["type"]): string {
  if (type === "document") return "Upload";
  if (type === "questionnaire") return "Questions";
  return "Answer";
}

/**
 * A designed, firm-branded HTML email. Table-based with inline styles only so
 * it renders in Gmail, Apple Mail, and Outlook. The firm's accent colour drives
 * the header band, the item accents, and the call-to-action button, so every
 * chase looks like it came from the firm, not from a generic tool. Text colour
 * on the accent is chosen for contrast so light accents stay readable.
 */
export function buildEmailHtml(opts: {
  bodyText: string;
  items: EmailItem[];
  ctaUrl: string;
  firmName: string;
  accent: string;
  month?: string;
}): string {
  const { bodyText, items, ctaUrl, firmName, accent, month } = opts;
  const onAccent = readableOn(accent);
  const onAccentSoft = onAccent === "#FFFFFF" ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.6)";
  const avatarBg = onAccent === "#FFFFFF" ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.12)";
  const safeFirm = escapeHtml(firmName);
  const firmInitials = initials(firmName);

  const paras = bodyText
    .split(/\n\n+/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;line-height:1.6;color:#334155;font-size:15px;">${escapeHtml(p).replace(
          /\n/g,
          "<br/>",
        )}</p>`,
    )
    .join("");

  const itemRows = items
    .map(
      (it) => `
      <tr><td style="padding:0 0 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E8EDF3;border-radius:10px;">
          <tr>
            <td width="4" style="background:${accent};border-radius:10px 0 0 10px;">&nbsp;</td>
            <td style="padding:11px 14px;font-size:14px;font-weight:600;color:#0F172A;">${escapeHtml(it.title)}</td>
            <td align="right" style="padding:11px 14px;">
              <span style="display:inline-block;background:#EEF2F6;color:#475569;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap;">${itemKindLabel(
                it.type,
              )}</span>
            </td>
          </tr>
        </table>
      </td></tr>`,
    )
    .join("");

  const preheader = `${items.length} item${items.length === 1 ? "" : "s"} to finish${
    month ? ` ${escapeHtml(month)}` : ""
  }. No login needed.`;

  const chip =
    items.length && month
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr><td style="background:#F1F5F9;border-radius:999px;padding:6px 13px;font-size:12.5px;font-weight:600;color:#334155;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:999px;background:${accent};"></span>
          &nbsp; ${items.length} item${items.length === 1 ? "" : "s"} left to close ${escapeHtml(month)}
        </td></tr></table>`
      : "";

  return `<!doctype html>
<html>
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#F1F4F8;padding:24px 0;font-family:Inter,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid #E6EBF1;border-radius:16px;overflow:hidden;">

          <!-- Branded header band -->
          <tr><td style="background:${accent};padding:22px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:12px;">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;background:${avatarBg};border-radius:12px;font-size:15px;font-weight:800;color:${onAccent};">${escapeHtml(firmInitials)}</td></tr></table>
              </td>
              <td>
                <div style="font-size:19px;font-weight:800;letter-spacing:-0.01em;color:${onAccent};">${safeFirm}</div>
                ${
                  month
                    ? `<div style="font-size:13px;color:${onAccentSoft};margin-top:1px;">${escapeHtml(month)} close</div>`
                    : ""
                }
              </td>
            </tr></table>
          </td></tr>

          <!-- Body -->
          <tr><td style="padding:26px 28px 6px;">
            ${chip}
            ${paras}
          </td></tr>

          ${
            items.length
              ? `<tr><td style="padding:6px 28px 4px;">
                  <div style="font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:#94A3B8;font-weight:700;margin:0 0 10px;">What I still need</div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
                </td></tr>`
              : ""
          }

          <!-- CTA -->
          <tr><td style="padding:18px 28px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td align="center" style="background:${accent};border-radius:12px;">
                <a href="${ctaUrl}" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:${onAccent};text-decoration:none;border-radius:12px;">Open your checklist &nbsp;&rarr;</a>
              </td>
            </tr></table>
            <div style="margin-top:12px;font-size:12.5px;color:#64748B;line-height:1.5;">No login, no app to download. It saves as you go, so you can stop and come back anytime.</div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:18px 28px 24px;">
            <div style="border-top:1px solid #EEF2F6;padding-top:14px;font-size:11.5px;color:#94A3B8;">
              Sent by ${safeFirm} &middot; delivered with <a href="https://ruledoff.vercel.app" style="color:#94A3B8;text-decoration:none;">RuledOff</a>
            </div>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Plain-text fallback. */
export function buildEmailText(opts: {
  bodyText: string;
  items: EmailItem[];
  ctaUrl: string;
  firmName: string;
}): string {
  const list = opts.items.map((i) => `  - ${i.title}`).join("\n");
  return `${opts.bodyText}\n\nOpen items:\n${list}\n\nOpen your checklist (no login): ${opts.ctaUrl}\n\nSent by ${opts.firmName} via RuledOff`;
}
