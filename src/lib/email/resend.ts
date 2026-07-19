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
    const { data, error } = await resend().emails.send({
      from: serverEnv.resendFrom,
      to: input.to,
      subject: input.subject,
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
