import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { qboApiBase } from "./oauth";
import { getAccessToken, qboFetch, type QboConnection } from "./connection";
import type { Attachment, Item } from "@/lib/types";

/**
 * Push a resolved item back into QuickBooks: the client's answer as a memo, and
 * any receipts they uploaded as attachments on the transaction.
 *
 * Deliberately does NOT change the account. Re-categorising is the bookkeeper's
 * judgement call, and the answer plus the receipt is what they need to make it.
 */

/** Items are tagged "Purchase:123" when imported. Exported for testing. */
export function parseTxnRef(qboTxnId: string): { entity: string; id: string } | null {
  const [entity, id] = qboTxnId.split(":");
  if (!entity || !id) return null;
  return { entity, id };
}

/** Read the whole entity. Its SyncToken is required to write anything back. */
async function readEntity(
  conn: QboConnection,
  entity: string,
  id: string,
): Promise<Record<string, unknown>> {
  const res = await qboFetch(conn, `${entity.toLowerCase()}/${id}?minorversion=70`);
  if (!res.ok) {
    throw new Error(`Could not read ${entity} ${id} (${res.status})`);
  }
  const json = (await res.json()) as Record<string, Record<string, unknown>>;
  const body = json[entity];
  if (!body?.SyncToken) throw new Error(`${entity} ${id} did not return a SyncToken`);
  return body;
}

/**
 * Append rather than overwrite: the bookkeeper's own notes must survive, and a
 * retry must not stack duplicate lines. Exported for testing.
 */
export function mergeNote(existing: string | null, answer: string): string {
  const addition = `RuledOff: ${answer}`;
  if (!existing) return addition;
  if (existing.includes(addition)) return existing;
  return `${existing}\n${addition}`.slice(0, 4000);
}

/**
 * Write the answer onto the transaction as a memo.
 *
 * A sparse update is not usable here: QBO still demands each entity's mandatory
 * fields (PaymentType on a Purchase, DepositToAccountRef on a Deposit, and so
 * on), and that list varies per entity. So the whole object is read and sent
 * back with only PrivateNote changed. The SyncToken makes this safe: if anyone
 * edited the transaction in the meantime, QBO rejects the write rather than
 * letting us overwrite their change.
 */
async function updateMemo(
  conn: QboConnection,
  entity: string,
  id: string,
  answer: string,
): Promise<void> {
  const body = await readEntity(conn, entity, id);
  const existing = typeof body.PrivateNote === "string" ? body.PrivateNote : null;

  const res = await qboFetch(conn, `${entity.toLowerCase()}?minorversion=70`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, PrivateNote: mergeNote(existing, answer) }),
  });
  if (!res.ok) {
    throw new Error(`Memo update failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
}

/**
 * Upload one file and link it to the transaction. QBO's upload endpoint takes
 * multipart with a JSON metadata part alongside the binary.
 */
async function attachFile(
  conn: QboConnection,
  entity: string,
  id: string,
  att: Attachment,
): Promise<void> {
  const admin = createAdminClient();
  const { data: blob, error } = await admin.storage.from("attachments").download(att.path);
  if (error || !blob) throw new Error(`Could not read ${att.name} from storage`);

  const form = new FormData();
  form.append(
    "file_metadata_01",
    new Blob(
      [
        JSON.stringify({
          AttachableRef: [{ EntityRef: { type: entity, value: id } }],
          FileName: att.name,
          ContentType: att.mime,
        }),
      ],
      { type: "application/json" },
    ),
    "file_metadata_01",
  );
  form.append("file_content_01", blob, att.name);

  const token = await getAccessToken(conn);
  const res = await fetch(
    `${qboApiBase()}/v3/company/${conn.realm_id}/upload?minorversion=70`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: form,
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Attachment upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
}

export type WritebackResult = { ok: true } | { ok: false; error: string };

/**
 * Best effort by design: a QuickBooks outage must not stop a bookkeeper from
 * ruling an item off. Failures are recorded on the item so they stay visible
 * and can be retried.
 */
export async function pushItemToQbo(
  item: Item,
  conn: QboConnection,
): Promise<WritebackResult> {
  if (item.source !== "qbo" || !item.qbo_txn_id) {
    return { ok: false, error: "This item did not come from QuickBooks." };
  }
  const ref = parseTxnRef(item.qbo_txn_id);
  if (!ref) return { ok: false, error: "That item has no usable QuickBooks reference." };

  try {
    if (item.answer_text?.trim()) {
      await updateMemo(conn, ref.entity, ref.id, item.answer_text.trim());
    }
    for (const att of (item.attachments ?? []) as Attachment[]) {
      await attachFile(conn, ref.entity, ref.id, att);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "QuickBooks write failed." };
  }
}

/** Run the write-back and record the outcome on the item. */
export async function syncItemToQbo(item: Item, conn: QboConnection): Promise<WritebackResult> {
  const result = await pushItemToQbo(item, conn);
  const admin = createAdminClient();
  await admin
    .from("items")
    .update(
      result.ok
        ? { qbo_synced_at: new Date().toISOString(), qbo_sync_error: null }
        : { qbo_sync_error: result.error },
    )
    .eq("id", item.id);
  return result;
}
