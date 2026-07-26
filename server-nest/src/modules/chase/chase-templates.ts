/**
 * Chase email templates and the branded HTML builder.
 *
 * A faithful port of the frontend's src/lib/email/templates.ts, so an initial
 * chase sent from this API is byte-for-byte the same email the app already
 * sends: the same default copy, the same {{placeholder}} rendering, the same
 * table-based inline-styled HTML that survives Gmail, Apple Mail and Outlook.
 */
export type EmailKind = "initial" | "level1" | "level2" | "level3" | "level4";
export type EmailTemplate = { subject: string; body: string };

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

export function renderTemplateString(input: string, ctx: TemplateContext): string {
  return input
    .replace(/\{\{firstName\}\}/g, ctx.firstName)
    .replace(/\{\{firmName\}\}/g, ctx.firmName)
    .replace(/\{\{month\}\}/g, ctx.month)
    .replace(/\{\{openCount\}\}/g, String(ctx.openCount))
    .replace(/\{\{deadline\}\}/g, ctx.deadline);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type EmailItem = { title: string; type: "transaction" | "document" | "questionnaire" };

function itemKindLabel(type: EmailItem["type"]): string {
  if (type === "document") return "Upload";
  if (type === "questionnaire") return "Questions";
  return "Answer";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** 'YYYY-MM-01' -> 'July 2026', matching the app's formatMonth. */
export function formatMonth(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function firstName(full: string): string {
  return (full || "").trim().split(/\s+/)[0] || "there";
}

/** A soft deadline a week out, as 'Jul 31'. */
export function softDeadline(now: Date = new Date()): string {
  const d = new Date(now.getTime() + 7 * 86_400_000);
  return `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
}

/** White or near-black, whichever reads on the accent. Ported from readableOn. */
function readableOn(hex: string): "#FFFFFF" | "#0F172A" {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#FFFFFF";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? "#0F172A" : "#FFFFFF";
}

function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function buildEmailHtml(opts: {
  bodyText: string; items: EmailItem[]; ctaUrl: string; firmName: string; accent: string; month?: string;
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
        `<p style="margin:0 0 16px;line-height:1.6;color:#334155;font-size:15px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`,
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
              <span style="display:inline-block;background:#EEF2F6;color:#475569;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap;">${itemKindLabel(it.type)}</span>
            </td>
          </tr>
        </table>
      </td></tr>`,
    )
    .join("");

  const preheader = `${items.length} item${items.length === 1 ? "" : "s"} to finish${month ? ` ${escapeHtml(month)}` : ""}. No login needed.`;

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
          <tr><td style="background:${accent};padding:22px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:12px;">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="44" height="44" align="center" valign="middle" style="width:44px;height:44px;background:${avatarBg};border-radius:12px;font-size:15px;font-weight:800;color:${onAccent};">${escapeHtml(firmInitials)}</td></tr></table>
              </td>
              <td>
                <div style="font-size:19px;font-weight:800;letter-spacing:-0.01em;color:${onAccent};">${safeFirm}</div>
                ${month ? `<div style="font-size:13px;color:${onAccentSoft};margin-top:1px;">${escapeHtml(month)} close</div>` : ""}
              </td>
            </tr></table>
          </td></tr>
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
          <tr><td style="padding:18px 28px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td align="center" style="background:${accent};border-radius:12px;">
                <a href="${ctaUrl}" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:${onAccent};text-decoration:none;border-radius:12px;">Open your checklist &nbsp;&rarr;</a>
              </td>
            </tr></table>
            <div style="margin-top:12px;font-size:12.5px;color:#64748B;line-height:1.5;">No login, no app to download. It saves as you go, so you can stop and come back anytime.</div>
          </td></tr>
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

export function buildEmailText(opts: {
  bodyText: string; items: EmailItem[]; ctaUrl: string; firmName: string;
}): string {
  const list = opts.items.map((i) => `  - ${i.title}`).join("\n");
  return `${opts.bodyText}\n\nOpen items:\n${list}\n\nOpen your checklist (no login): ${opts.ctaUrl}\n\nSent by ${opts.firmName} via RuledOff`;
}
