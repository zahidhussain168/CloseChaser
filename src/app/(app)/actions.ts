"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getFirm,
  ensureCurrentPeriod,
  seedPeriodFromTemplate,
} from "@/lib/data";
import { ensureMagicToken, regenerateToken } from "@/lib/links";
import { sendChaseEmail } from "@/lib/chase";
import type { FormState } from "@/lib/forms";
import type { Client, Firm, Item } from "@/lib/types";

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

// ── Clients ──────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().optional().or(z.literal("")),
  qbo_realm_id: z.string().trim().optional().or(z.literal("")),
});

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    qbo_realm_id: formData.get("qbo_realm_id"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      firm_id: firm.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      qbo_realm_id: parsed.data.qbo_realm_id || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  redirect(`/clients/${data!.id}`);
}

export async function addItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUserId();
  const parsed = itemSchema.safeParse({
    clientId: formData.get("clientId"),
    type: formData.get("type"),
    title: formData.get("title"),
    details: formData.get("details"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const period = await ensureCurrentPeriod(parsed.data.clientId);
  if (!period) return { ok: false, error: "Could not open the close period" };

  const supabase = createClient();
  const { error } = await supabase.from("items").insert({
    close_period_id: period.id,
    type: parsed.data.type,
    source: "manual",
    title: parsed.data.title,
    details: parsed.data.details ? { note: parsed.data.details } : {},
    state: "requested",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clients/${parsed.data.clientId}`);
  return { ok: true };
}

// ── Items ────────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(["transaction", "document"]),
  title: z.string().trim().min(1, "Describe what you need"),
  details: z.string().trim().optional().or(z.literal("")),
});

export async function deleteItemAction(itemId: string, clientId: string) {
  await requireUserId();
  const supabase = createClient();
  await supabase.from("items").delete().eq("id", itemId);
  revalidatePath(`/clients/${clientId}`);
}

/** Bookkeeper accepts an answered item, which rules it off. */
export async function acceptItemAction(itemId: string, clientId: string) {
  await requireUserId();
  const supabase = createClient();
  await supabase
    .from("items")
    .update({ state: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("state", "answered");

  // If every item in the period is accepted, mark the period closed.
  const period = await ensureCurrentPeriod(clientId);
  if (period) {
    const { data: items } = await supabase
      .from("items")
      .select("state")
      .eq("close_period_id", period.id);
    const all = items ?? [];
    if (all.length > 0 && all.every((i) => i.state === "accepted")) {
      await supabase
        .from("close_periods")
        .update({ status: "closed" })
        .eq("id", period.id);
    }
  }
  revalidatePath(`/clients/${clientId}`);
}

/** Send an answered item back to the client for another pass. */
export async function sendBackItemAction(itemId: string, clientId: string) {
  await requireUserId();
  const supabase = createClient();
  await supabase
    .from("items")
    .update({ state: "requested", answered_at: null })
    .eq("id", itemId)
    .eq("state", "answered");
  revalidatePath(`/clients/${clientId}`);
}

// ── Chase ────────────────────────────────────────────────────────────────────

export async function fireChaseAction(clientId: string) {
  await requireUserId();
  const firm = (await getFirm()) as Firm | null;
  if (!firm) redirect("/login");

  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return { ok: false, error: "Client not found" };

  const period = await ensureCurrentPeriod(clientId);
  if (!period) return { ok: false, error: "Could not open the close period" };

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("close_period_id", period.id);
  const allItems = (items as Item[]) ?? [];
  const open = allItems.filter(
    (i) => i.state === "requested" || i.state === "nudged",
  );
  if (open.length === 0) {
    return { ok: false, error: "Nothing open to chase. This close is clear." };
  }

  const token = await ensureMagicToken(supabase, clientId);

  await supabase
    .from("close_periods")
    .update({
      status: "chasing",
      chase_started_at: period.chase_started_at ?? new Date().toISOString(),
    })
    .eq("id", period.id);

  const result = await sendChaseEmail({
    supabase,
    firm,
    client: client as Client,
    kind: "initial",
    items: allItems,
    token,
    monthISO: period.month,
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  if (!result.ok) return { ok: false, error: `Email failed: ${result.error}` };
  return { ok: true };
}

export async function ensureLinkAction(clientId: string) {
  await requireUserId();
  const supabase = createClient();
  await ensureMagicToken(supabase, clientId);
  revalidatePath(`/clients/${clientId}`);
}

export async function regenerateLinkAction(clientId: string) {
  await requireUserId();
  const supabase = createClient();
  await regenerateToken(supabase, clientId);
  revalidatePath(`/clients/${clientId}`);
}

// ── Settings: branding + templates ───────────────────────────────────────────

const brandingSchema = z.object({
  name: z.string().trim().min(1),
  accent_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour"),
  reply_to: z.string().trim().email().optional().or(z.literal("")),
});

export async function updateBrandingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const parsed = brandingSchema.safeParse({
    name: formData.get("name"),
    accent_color: formData.get("accent_color"),
    reply_to: formData.get("reply_to"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  await supabase
    .from("firms")
    .update({
      name: parsed.data.name,
      accent_color: parsed.data.accent_color,
      reply_to: parsed.data.reply_to || null,
    })
    .eq("id", firm.id);
  revalidatePath("/settings");
  return { ok: true };
}

// ── Request templates ────────────────────────────────────────────────────────

const templateSchema = z.object({
  name: z.string().trim().min(1, "Name the template"),
});

export async function createTemplateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm) redirect("/login");
  const parsed = templateSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("request_templates")
    .insert({ firm_id: firm.id, name: parsed.data.name });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

const templateItemSchema = z.object({
  templateId: z.string().uuid(),
  type: z.enum(["transaction", "document"]),
  title: z.string().trim().min(1, "Describe the request"),
  note: z.string().trim().optional().or(z.literal("")),
});

export async function addTemplateItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUserId();
  const parsed = templateItemSchema.safeParse({
    templateId: formData.get("templateId"),
    type: formData.get("type"),
    title: formData.get("title"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { count } = await supabase
    .from("template_items")
    .select("id", { count: "exact", head: true })
    .eq("template_id", parsed.data.templateId);
  const { error } = await supabase.from("template_items").insert({
    template_id: parsed.data.templateId,
    type: parsed.data.type,
    title: parsed.data.title,
    note: parsed.data.note || null,
    position: count ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteTemplateItemAction(id: string) {
  await requireUserId();
  const supabase = createClient();
  await supabase.from("template_items").delete().eq("id", id);
  revalidatePath("/settings");
}

export async function deleteTemplateAction(id: string) {
  await requireUserId();
  const supabase = createClient();
  await supabase.from("request_templates").delete().eq("id", id);
  revalidatePath("/settings");
}

/** Apply a template's items to a client's current close now. */
export async function applyTemplateAction(
  clientId: string,
  templateId: string,
): Promise<{ ok: boolean; error?: string; added?: number }> {
  await requireUserId();
  const period = await ensureCurrentPeriod(clientId);
  if (!period) return { ok: false, error: "Could not open the close period" };
  const supabase = createClient();
  const added = await seedPeriodFromTemplate(supabase, templateId, period.id);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true, added };
}

/** Set (or clear) the template a client auto-applies every month. */
export async function setClientDefaultTemplateAction(
  clientId: string,
  templateId: string | null,
) {
  await requireUserId();
  const supabase = createClient();
  await supabase
    .from("clients")
    .update({ default_template_id: templateId || null })
    .eq("id", clientId);
  revalidatePath(`/clients/${clientId}`);
}

export async function updateTemplateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUserId();
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const kind = String(formData.get("kind"));
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const allowed = ["initial", "level1", "level2", "level3", "level4"];
  if (!allowed.includes(kind) || !subject || !body) {
    return { ok: false, error: "Subject and body are required" };
  }

  const supabase = createClient();
  await supabase.from("email_templates").upsert(
    {
      firm_id: firm.id,
      kind: kind as "initial" | "level1" | "level2" | "level3" | "level4",
      subject,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "firm_id,kind" },
  );
  revalidatePath("/settings");
  return { ok: true };
}
