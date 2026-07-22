import { admin } from "../lib/supabase";
import { qboQuery, type QboConnection } from "./qbo";

/**
 * What blocks a close in QuickBooks: transactions parked in an uncategorized
 * account, and anything pushed to "Ask My Accountant". QBO's query language
 * cannot filter on nested line detail, so the accounts of interest are resolved
 * first and the month's transactions filtered here.
 */
const BLOCKING_ACCOUNT_PATTERNS = [/uncategori[sz]ed/i, /ask my accountant/i];

type QboAccount = { Id: string; Name: string };
type QboLine = {
  Amount?: number;
  Description?: string;
  AccountBasedExpenseLineDetail?: { AccountRef?: { value?: string; name?: string } };
  DepositLineDetail?: { AccountRef?: { value?: string; name?: string } };
  JournalEntryLineDetail?: { AccountRef?: { value?: string; name?: string } };
};
type QboTxn = {
  Id: string;
  TxnDate?: string;
  TotalAmt?: number;
  PrivateNote?: string;
  EntityRef?: { name?: string };
  VendorRef?: { name?: string };
  CustomerRef?: { name?: string };
  Line?: QboLine[];
};

export type BlockingTxn = {
  qboTxnId: string;
  entity: "Purchase" | "Deposit" | "JournalEntry";
  date: string | null;
  amount: number | null;
  payee: string | null;
  accountName: string | null;
  memo: string | null;
};

function lineAccount(line: QboLine) {
  return line.AccountBasedExpenseLineDetail?.AccountRef ?? line.DepositLineDetail?.AccountRef ?? line.JournalEntryLineDetail?.AccountRef;
}

async function blockingAccountIds(conn: QboConnection): Promise<Map<string, string>> {
  const accounts = await qboQuery<QboAccount>(conn, "select Id, Name from Account maxresults 1000", "Account");
  const map = new Map<string, string>();
  for (const a of accounts) if (BLOCKING_ACCOUNT_PATTERNS.some((re) => re.test(a.Name ?? ""))) map.set(a.Id, a.Name);
  return map;
}

function monthEnd(monthStart: string): string {
  const d = new Date(`${monthStart}T00:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

export async function findBlockingTransactions(conn: QboConnection, monthStart: string): Promise<BlockingTxn[]> {
  const accounts = await blockingAccountIds(conn);
  if (accounts.size === 0) return [];

  const from = monthStart;
  const to = monthEnd(monthStart);
  const entities: BlockingTxn["entity"][] = ["Purchase", "Deposit", "JournalEntry"];
  const found: BlockingTxn[] = [];

  for (const entity of entities) {
    let rows: QboTxn[] = [];
    try {
      rows = await qboQuery<QboTxn>(
        conn,
        `select * from ${entity} where TxnDate >= '${from}' and TxnDate <= '${to}' maxresults 500`,
        entity,
      );
    } catch {
      continue;
    }
    for (const txn of rows) {
      const hit = (txn.Line ?? []).find((l) => {
        const id = lineAccount(l)?.value;
        return id ? accounts.has(id) : false;
      });
      if (!hit) continue;
      const accId = lineAccount(hit)?.value;
      found.push({
        qboTxnId: `${entity}:${txn.Id}`,
        entity,
        date: txn.TxnDate ?? null,
        amount: hit.Amount ?? txn.TotalAmt ?? null,
        payee: txn.EntityRef?.name ?? txn.VendorRef?.name ?? txn.CustomerRef?.name ?? null,
        accountName: lineAccount(hit)?.name ?? accounts.get(accId ?? "") ?? null,
        memo: txn.PrivateNote ?? null,
      });
    }
  }
  return found;
}

/** Import blocking transactions into a close period as items, skipping any
 *  already imported (matched on qbo_txn_id). Returns how many were added. */
export async function importBlockingTransactions(conn: QboConnection, periodId: string, monthStart: string): Promise<number> {
  const blocking = await findBlockingTransactions(conn, monthStart);
  if (blocking.length === 0) return 0;

  const { data: existing } = await admin.from("items").select("qbo_txn_id").eq("close_period_id", periodId).eq("source", "qbo");
  const seen = new Set((existing ?? []).map((r) => r.qbo_txn_id));

  const rows = blocking
    .filter((t) => !seen.has(t.qboTxnId))
    .map((t) => ({
      close_period_id: periodId,
      type: "transaction" as const,
      source: "qbo" as const,
      qbo_txn_id: t.qboTxnId,
      title: t.payee ? `Uncategorized: ${t.payee}` : "Uncategorized transaction",
      details: { amount: t.amount, date: t.date, payee: t.payee, account: t.accountName, memo: t.memo },
      state: "requested" as const,
    }));

  if (rows.length === 0) return 0;
  const { error } = await admin.from("items").insert(rows);
  if (error) throw new Error(error.message);
  await admin.from("qbo_connections").update({ last_synced_at: new Date().toISOString() }).eq("firm_id", conn.firm_id);
  return rows.length;
}
