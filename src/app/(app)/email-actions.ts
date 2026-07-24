"use server";

import { createClient } from "@/lib/supabase/server";
import { getFirm } from "@/lib/data";
import { loadTemplates, softDeadline } from "@/lib/chase";
import {
  buildEmailHtml,
  buildEmailText,
  renderTemplateString,
  type EmailKind,
  type EmailItem,
} from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";
import { formatMonth, monthKey } from "@/lib/format";
import { serverEnv } from "@/lib/env";

export type TestEmailResult = { ok: true; to: string } | { ok: false; error: string };

/** Realistic sample items so the test email looks like a real chase. */
const SAMPLE_ITEMS: EmailItem[] = [
  { title: "Bank statement", type: "document" },
  { title: "Receipt for $128.40 at Staples", type: "transaction" },
  { title: "W-9 for Bright Design Co.", type: "questionnaire" },
];

/**
 * Send the bookkeeper a preview of one chase level to their own inbox, rendered
 * with their real branding (name, accent) and current template wording, so they
 * can see exactly what a client receives. Uses sample items and a sample link.
 */
export async function sendTestEmailAction(kind: EmailKind): Promise<TestEmailResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Could not find your email address." };

  const firm = await getFirm();
  if (!firm) return { ok: false, error: "No firm found." };

  const templates = await loadTemplates(supabase, firm.id);
  const tpl = templates[kind];

  const ctx = {
    firstName: "Maria",
    firmName: firm.name,
    month: formatMonth(monthKey()),
    openCount: SAMPLE_ITEMS.length,
    deadline: softDeadline(),
  };

  const subject = `[Test] ${renderTemplateString(tpl.subject, ctx)}`;
  const bodyText = renderTemplateString(tpl.body, ctx);
  const accent = firm.accent_color || "#C49A2A";
  const ctaUrl = serverEnv.appUrl; // sample destination, no real client token

  const html = buildEmailHtml({
    bodyText,
    items: SAMPLE_ITEMS,
    ctaUrl,
    firmName: firm.name,
    accent,
    month: ctx.month,
  });
  const text = buildEmailText({ bodyText, items: SAMPLE_ITEMS, ctaUrl, firmName: firm.name });

  const res = await sendEmail({
    to: user.email,
    subject,
    html,
    text,
    replyTo: firm.reply_to ?? undefined,
  });
  if (!res.ok) return { ok: false, error: res.error || "Could not send the test email." };
  return { ok: true, to: user.email };
}
