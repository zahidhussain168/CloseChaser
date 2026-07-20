import "server-only";
import { qboQuery, type QboConnection } from "./connection";

/**
 * What blocks a close in QuickBooks: transactions parked in an uncategorized
 * account, and anything the bookkeeper pushed to "Ask My Accountant".
 *
 * QBO's query language cannot filter on nested line detail, so the accounts of
 * interest are resolved first and the month's transactions are filtered here.
 */
const BLOCKING_ACCOUNT_PATTERNS = [/uncategori[sz]ed/i, /ask my accountant/i];

type QboAccount = { Id: string; Name: string };

type QboLine = {
  Amount?: number;
  Description?: string;
  DetailType?: string;
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

function lineAccount(line: QboLine): { value?: string; name?: string } | undefined {
  return (
    line.AccountBasedExpenseLineDetail?.AccountRef ??
    line.DepositLineDetail?.AccountRef ??
    line.JournalEntryLineDetail?.AccountRef
  );
}

/** Account ids whose name marks a transaction as still needing a decision. */
async function blockingAccountIds(conn: QboConnection): Promise<Map<string, string>> {
  const accounts = await qboQuery<QboAccount>(
    conn,
    "select Id, Name from Account maxresults 1000",
    "Account",
  );
  const map = new Map<string, string>();
  for (const a of accounts) {
    if (BLOCKING_ACCOUNT_PATTERNS.some((re) => re.test(a.Name ?? ""))) {
      map.set(a.Id, a.Name);
    }
  }
  return map;
}

/** Last day of the month a 'YYYY-MM-01' string refers to. */
function monthEnd(monthStart: string): string {
  const d = new Date(`${monthStart}T00:00:00Z`);
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return end.toISOString().slice(0, 10);
}

export async function findBlockingTransactions(
  conn: QboConnection,
  monthStart: string,
): Promise<BlockingTxn[]> {
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
      continue; // an entity the company does not use should not fail the sync
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
        payee:
          txn.EntityRef?.name ?? txn.VendorRef?.name ?? txn.CustomerRef?.name ?? null,
        accountName: accId ? (accounts.get(accId) ?? null) : null,
        memo: hit.Description ?? txn.PrivateNote ?? null,
      });
    }
  }

  return found;
}

/** Plain-language checklist title for a transaction the client must explain. */
export function titleForTxn(txn: BlockingTxn): string {
  const who = txn.payee ? ` at ${txn.payee}` : "";
  const amount =
    typeof txn.amount === "number"
      ? ` of ${txn.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`
      : "";
  if (txn.accountName && /ask my accountant/i.test(txn.accountName)) {
    return `Question on the charge${amount}${who}`;
  }
  return `Uncategorized charge${amount}${who}`;
}
