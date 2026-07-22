import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

let client: Resend | null = null;
function resend(): Resend {
  if (!client) client = new Resend(serverEnv.resendApiKey);
  return client;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  try {
    // Sandbox redirect: with an unverified Resend sender, deliver everything to
    // the account owner so the demo works. The real recipient is shown in the
    // subject so it's clear who each chase was meant for. NEVER redirect in
    // production, so a leftover RESEND_TEST_RECIPIENT env can't silently divert
    // every client's magic link away from them on the live site.
    const testTo =
      process.env.NODE_ENV === "production" ? null : serverEnv.resendTestRecipient;
    const redirecting = testTo && testTo !== input.to;
    const to = redirecting ? testTo : input.to;
    const subject = redirecting ? `[to ${input.to}] ${input.subject}` : input.subject;

    const { data, error } = await resend().emails.send({
      from: serverEnv.resendFrom,
      to,
      subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? "unknown" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
