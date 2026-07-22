import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client, Firm, Item } from "../domain/types";
import { isOpen } from "../domain/state";
import { formatMonth, formatDate } from "./format";
import { magicLinkUrl } from "./links";
import { sendEmail, type SendResult } from "./resend";
import {
  DEFAULT_TEMPLATES,
  buildEmailHtml,
  buildEmailText,
  renderTemplateString,
  type EmailItem,
  type EmailKind,
  type EmailTemplate,
} from "./email";

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full;
}

/** A soft deadline used in the day-5 copy: ~3 days out. */
export function softDeadline(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 3);
  return formatDate(d);
}

/** Merge a firm's saved template overrides over the code defaults. */
export async function loadTemplates(db: SupabaseClient, firmId: string): Promise<Record<EmailKind, EmailTemplate>> {
  const merged: Record<EmailKind, EmailTemplate> = { ...DEFAULT_TEMPLATES };
  const { data } = await db.from("email_templates").select("kind, subject, body").eq("firm_id", firmId);
  for (const row of data ?? []) merged[row.kind as EmailKind] = { subject: row.subject, body: row.body };
  return merged;
}

export type ChaseArgs = {
  db: SupabaseClient;
  firm: Firm;
  client: Client;
  kind: EmailKind;
  items: Item[];
  token: string;
  monthISO: string;
};

/** Render and send one chase/reminder email. */
export async function sendChaseEmail(args: ChaseArgs): Promise<SendResult> {
  const { db, firm, client, kind, items, token, monthISO } = args;
  const open = items.filter((i) => isOpen(i.state));
  const templates = await loadTemplates(db, firm.id);
  const tpl = templates[kind];

  const ctx = {
    firstName: firstName(client.name),
    firmName: firm.name,
    month: formatMonth(monthISO),
    openCount: open.length,
    deadline: softDeadline(),
  };

  const subject = renderTemplateString(tpl.subject, ctx);
  const bodyText = renderTemplateString(tpl.body, ctx);
  const emailItems: EmailItem[] = open.map((i) => ({ title: i.title, type: i.type }));
  const ctaUrl = magicLinkUrl(token);
  const accent = firm.accent_color || "#C49A2A";

  const html = buildEmailHtml({ bodyText, items: emailItems, ctaUrl, firmName: firm.name, accent });
  const text = buildEmailText({ bodyText, items: emailItems, ctaUrl, firmName: firm.name });

  return sendEmail({ to: client.email, subject, html, text, replyTo: firm.reply_to ?? undefined });
}
