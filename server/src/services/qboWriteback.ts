import { admin } from "../lib/supabase";
import { qboApiBase, qboFetch, getAccessToken, type QboConnection } from "./qbo";
import { ATTACHMENTS_BUCKET } from "./portal";
import type { Attachment, Item } from "../domain/types";

/**
 * Push a resolved item back into QuickBooks: the client's answer as a memo, and
 * any receipts as attachments. Deliberately does NOT change the account, that is
 * the bookkeeper's call; the answer plus receipt is what they need to make it.
 */

export function parseTxnRef(qboTxnId: string): { entity: string; id: string } | null {
  const [entity, id] = qboTxnId.split(":");
  if (!entity || !id) return null;
  return { entity, id };
}

export function mergeNote(existing: string | null, answer: string): string {
  const addition = `RuledOff: ${answer}`;
  if (!existing) return addition;
  if (existing.includes(addition)) return existing;
  return `${existing}\n${addition}`.slice(0, 4000);
}

async function readEntity(conn: QboConnection, entity: string, id: string): Promise<Record<string, unknown>> {
  const res = await qboFetch(conn, `${entity.toLowerCase()}/${id}?minorversion=70`);
  if (!res.ok) throw new Error(`Could not read ${entity} ${id} (${res.status})`);
  const json = (await res.json()) as Record<string, Record<string, unknown>>;
  const body = json[entity];
  if (!body?.SyncToken) throw new Error(`${entity} ${id} did not return a SyncToken`);
  return body;
}

async function updateMemo(conn: QboConnection, entity: string, id: string, answer: string): Promise<void> {
  const body = await readEntity(conn, entity, id);
  const existing = typeof body.PrivateNote === "string" ? body.PrivateNote : null;
  const res = await qboFetch(conn, `${entity.toLowerCase()}?minorversion=70`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, PrivateNote: mergeNote(existing, answer) }),
  });
  if (!res.ok) throw new Error(`Memo update failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

async function attachFile(conn: QboConnection, entity: string, id: string, att: Attachment): Promise<void> {
  const { data: blob, error } = await admin.storage.from(ATTACHMENTS_BUCKET).download(att.path);
  if (error || !blob) throw new Error(`Could not read ${att.name} from storage`);

  const form = new FormData();
  form.append(
    "file_metadata_01",
    new Blob([JSON.stringify({ AttachableRef: [{ EntityRef: { type: entity, value: id } }], FileName: att.name, ContentType: att.mime })], {
      type: "application/json",
    }),
    "file_metadata_01",
  );
  form.append("file_content_01", blob, att.name);

  const token = await getAccessToken(conn);
  const res = await fetch(`${qboApiBase()}/v3/company/${conn.realm_id}/upload?minorversion=70`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: form,
  });
  if (!res.ok) throw new Error(`Attachment upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

export type WritebackResult = { ok: true } | { ok: false; error: string };

export async function pushItemToQbo(item: Item, conn: QboConnection): Promise<WritebackResult> {
  if (item.source !== "qbo" || !item.qbo_txn_id) return { ok: false, error: "This item did not come from QuickBooks." };
  const ref = parseTxnRef(item.qbo_txn_id);
  if (!ref) return { ok: false, error: "That item has no usable QuickBooks reference." };
  try {
    if (item.answer_text?.trim()) await updateMemo(conn, ref.entity, ref.id, item.answer_text.trim());
    for (const att of (item.attachments ?? []) as Attachment[]) await attachFile(conn, ref.entity, ref.id, att);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "QuickBooks write failed." };
  }
}

/** Run the write-back and record the outcome on the item. */
export async function syncItemToQbo(item: Item, conn: QboConnection): Promise<WritebackResult> {
  const result = await pushItemToQbo(item, conn);
  await admin
    .from("items")
    .update(result.ok ? { qbo_synced_at: new Date().toISOString(), qbo_sync_error: null } : { qbo_sync_error: result.error })
    .eq("id", item.id);
  return result;
}
