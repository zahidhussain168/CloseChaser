import type { ReminderLevel } from "@/lib/types";

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

export type EmailItem = { title: string; type: "transaction" | "document" };

/** Ledger-styled HTML email. Inline styles only (email clients strip <style>). */
export function buildEmailHtml(opts: {
  bodyText: string;
  items: EmailItem[];
  ctaUrl: string;
  firmName: string;
  accent: string;
}): string {
  const { bodyText, items, ctaUrl, firmName, accent } = opts;
  const paras = bodyText
    .split(/\n\n+/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;line-height:1.55;color:#111315;font-size:15px;">${escapeHtml(
          p,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  const itemRows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #D9D4CA;font-size:14px;color:#111315;">
          <span style="color:#B94B3D;font-family:'IBM Plex Mono',Menlo,monospace;">•</span>
          &nbsp; ${escapeHtml(it.title)}
          <span style="color:#6F6E69;font-size:12px;"> (${it.type === "document" ? "upload" : "quick answer"})</span>
        </td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#F7F5F1;padding:24px 0;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#FFFFFF;border:1px solid #D9D4CA;border-radius:6px;">
          <tr><td style="padding:24px 28px 8px;border-bottom:2px solid ${accent};">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#111315;">${escapeHtml(
              firmName,
            )}</div>
          </td></tr>
          <tr><td style="padding:22px 28px 4px;">
            ${paras}
          </td></tr>
          ${
            items.length
              ? `<tr><td style="padding:4px 28px 8px;">
                  <div style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#6F6E69;margin-bottom:4px;">Open items</div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #D9D4CA;">${itemRows}</table>
                </td></tr>`
              : ""
          }
          <tr><td style="padding:18px 28px 28px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#111315;color:#FFFFFF;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:600;font-size:15px;">Open your checklist</a>
            <div style="margin-top:12px;font-size:12px;color:#6F6E69;">No login required. This private link is just for you.</div>
          </td></tr>
        </table>
        <div style="max-width:520px;margin:14px auto 0;font-size:11px;color:#8A968B;">Sent by ${escapeHtml(
          firmName,
        )} via RuledOff</div>
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
