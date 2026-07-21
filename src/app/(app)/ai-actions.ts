"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { getFirm } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { generateChaseEmails, isAiConfigured, type GeneratedSet, type EmailKind } from "@/lib/ai/emails";
import type { FormState } from "@/lib/forms";

const KINDS: EmailKind[] = ["initial", "level1", "level2", "level3", "level4"];

export type GenerateResult =
  | { ok: true; templates: GeneratedSet }
  | { ok: false; error: string };

/** Generate the chase-email ladder from the firm's voice. Does not save. */
export async function generateChaseEmailsAction(
  voice: string,
  tone: string,
): Promise<GenerateResult> {
  await requireUserId();
  if (!isAiConfigured()) return { ok: false, error: "AI writing is not set up yet." };

  const firm = await getFirm();
  if (!firm) return { ok: false, error: "No firm found." };

  const cleanVoice = voice.trim().slice(0, 2000);
  const cleanTone = ["Warm", "Balanced", "Firm"].includes(tone) ? tone : "Warm";

  try {
    const templates = await generateChaseEmails({
      firmName: firm.name,
      voice: cleanVoice,
      tone: cleanTone,
    });
    return { ok: true, templates };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not generate the emails." };
  }
}

const setSchema = z.record(
  z.enum(["initial", "level1", "level2", "level3", "level4"]),
  z.object({
    subject: z.string().trim().min(1),
    body: z.string().trim().min(1),
  }),
);

/** Save a generated (and possibly edited) set to all five template slots. */
export async function saveChaseEmailsAction(templates: unknown): Promise<FormState> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm) return { ok: false, error: "No firm found." };

  const parsed = setSchema.safeParse(templates);
  if (!parsed.success) return { ok: false, error: "Those templates were not valid." };
  for (const k of KINDS) {
    if (!parsed.data[k]) return { ok: false, error: "The set is missing an email." };
  }

  const supabase = createClient();
  const rows = KINDS.map((kind) => ({
    firm_id: firm.id,
    kind,
    subject: parsed.data[kind]!.subject,
    body: parsed.data[kind]!.body,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("email_templates")
    .upsert(rows, { onConflict: "firm_id,kind" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings", "layout");
  return { ok: true };
}
