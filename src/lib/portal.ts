import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { monthKey } from "@/lib/format";
import type {
  Attachment,
  Client,
  ClosePeriod,
  Firm,
  Item,
} from "@/lib/types";

const BUCKET = "attachments";
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

// Clients only ever send receipts, statements, and forms: images and PDFs. We
// never trust the browser-supplied file.type (trivially forged); instead we
// sniff the leading magic bytes and store a server-chosen safe content-type, so
// an uploaded .html/.svg can't later execute as script when the bookkeeper
// opens it from a signed storage URL.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf"; // %PDF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp"; // RIFF....WEBP
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = buf.slice(8, 12).toString("ascii");
    if (["heic", "heix", "hevc", "heim", "heis", "hevm", "hevs", "mif1", "msf1", "heif"].includes(brand)) return "image/heic";
  }
  return null;
}

export type PortalData = {
  firm: Pick<Firm, "name" | "accent_color">;
  client: Pick<Client, "id" | "name">;
  period: ClosePeriod;
  items: Item[];
};

export type PortalError =
  | { kind: "not_found" }
  | { kind: "expired" }
  | { kind: "revoked" };

type LinkRow = {
  id: string;
  client_id: string;
  expires_at: string;
  revoked_at: string | null;
};

/** Validate a magic token; returns the link row or a reason it's unusable. */
async function resolveLink(
  token: string,
): Promise<{ link: LinkRow } | { error: PortalError }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("magic_links")
    .select("id, client_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();
  if (!data) return { error: { kind: "not_found" } };
  if (data.revoked_at) return { error: { kind: "revoked" } };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { error: { kind: "expired" } };
  }
  return { link: data as LinkRow };
}

/** Load everything the client's page needs, and stamp last_opened_at. */
export async function loadPortal(
  token: string,
): Promise<{ data: PortalData } | { error: PortalError }> {
  const resolved = await resolveLink(token);
  if ("error" in resolved) return resolved;
  const { link } = resolved;
  const admin = createAdminClient();

  await admin
    .from("magic_links")
    .update({ last_opened_at: new Date().toISOString() })
    .eq("id", link.id);

  const { data: client } = await admin
    .from("clients")
    .select("id, name, firm_id")
    .eq("id", link.client_id)
    .maybeSingle();
  if (!client) return { error: { kind: "not_found" } };
  const { data: firm } = await admin
    .from("firms")
    .select("name, accent_color")
    .eq("id", client.firm_id)
    .maybeSingle();
  if (!firm) return { error: { kind: "not_found" } };

  // The client sees the current calendar month's close.
  const month = monthKey();
  let { data: period } = await admin
    .from("close_periods")
    .select("*")
    .eq("client_id", link.client_id)
    .eq("month", month)
    .maybeSingle();
  if (!period) {
    const { data: created } = await admin
      .from("close_periods")
      .insert({ client_id: link.client_id, month, status: "open" })
      .select("*")
      .single();
    period = created;
  }

  const { data: items } = await admin
    .from("items")
    .select("*")
    .eq("close_period_id", (period as ClosePeriod).id)
    .order("created_at", { ascending: true });

  return {
    data: {
      firm: firm as Pick<Firm, "name" | "accent_color">,
      client: { id: client.id, name: client.name },
      period: period as ClosePeriod,
      items: (items as Item[]) ?? [],
    },
  };
}

/** Confirm an item belongs to the token's client, returning it. */
async function itemForToken(
  token: string,
  itemId: string,
): Promise<{ item: Item; clientId: string } | { error: PortalError }> {
  const resolved = await resolveLink(token);
  if ("error" in resolved) return resolved;
  const admin = createAdminClient();

  const { data: item } = await admin
    .from("items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { error: { kind: "not_found" } };

  // Confirm the item's period belongs to this link's client.
  const { data: period } = await admin
    .from("close_periods")
    .select("client_id")
    .eq("id", (item as Item).close_period_id)
    .maybeSingle();
  if (!period || period.client_id !== resolved.link.client_id) {
    return { error: { kind: "not_found" } };
  }
  return { item: item as Item, clientId: resolved.link.client_id };
}

/** Save a text answer for an item and mark it answered. */
export async function saveAnswer(
  token: string,
  itemId: string,
  text: string,
): Promise<{ ok: true; item: Item } | { ok: false; error: string }> {
  const found = await itemForToken(token, itemId);
  if ("error" in found) return { ok: false, error: found.error.kind };
  if (found.item.state === "accepted") {
    return { ok: false, error: "already accepted" };
  }

  const admin = createAdminClient();
  const clean = text.trim().slice(0, 2000);
  const hasFiles = (found.item.attachments as Attachment[]).length > 0;
  const state = clean || hasFiles ? "answered" : "requested";

  const { data, error } = await admin
    .from("items")
    .update({
      answer_text: clean || null,
      state,
      answered_at: state === "answered" ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, item: data as Item };
}

/** Upload a file for an item and mark it answered. */
export async function saveUpload(
  token: string,
  itemId: string,
  file: File,
): Promise<{ ok: true; item: Item } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "empty file" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "file too large" };

  const found = await itemForToken(token, itemId);
  if ("error" in found) return { ok: false, error: found.error.kind };
  if (found.item.state === "accepted") {
    return { ok: false, error: "already accepted" };
  }

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Server-side type enforcement by content sniffing (the accept="" attribute is
  // client-only and bypassable). Only real images/PDFs are stored, and the
  // stored content-type is our sniffed value, never the client's.
  const mime = sniffMime(buffer);
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "Only images and PDF files are allowed" };
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "upload";
  const path = `${found.clientId}/${itemId}/${Date.now()}-${safeName}`;

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mime,
      upsert: false,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const attachment: Attachment = {
    path,
    name: file.name.slice(0, 120),
    size: file.size,
    mime,
    uploaded_at: new Date().toISOString(),
  };
  const next = [...(found.item.attachments as Attachment[]), attachment];

  const { data, error } = await admin
    .from("items")
    .update({
      attachments: next,
      state: "answered",
      answered_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, item: data as Item };
}
