/**
 * Minimal CSV reader for QuickBooks transaction exports.
 *
 * Exports vary by report and locale, so headers are matched loosely rather than
 * demanding one exact shape. Anything unrecognised is ignored, not rejected.
 */
export type CsvTxn = {
  date: string | null;
  payee: string | null;
  description: string | null;
  amount: number | null;
};

/** Split one CSV line, honouring quoted fields and escaped quotes. */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

const DATE_KEYS = ["date", "txn date", "transaction date", "posting date"];
const PAYEE_KEYS = ["payee", "name", "vendor", "customer", "merchant"];
const DESC_KEYS = ["description", "memo", "memo/description", "details", "note"];
const AMOUNT_KEYS = ["amount", "total", "debit", "credit", "value"];

function indexOfHeader(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.indexOf(c);
    if (i !== -1) return i;
  }
  return headers.findIndex((h) => candidates.some((c) => h.includes(c)));
}

/** "$1,234.56", "(45.00)" and "-45" all become numbers. */
function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const negative = /^\(.*\)$/.test(raw.trim());
  const cleaned = raw.replace(/[()]/g, "").replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return negative ? -Math.abs(n) : n;
}

/**
 * ISO date, read in local terms. Going via toISOString would shift the day for
 * anyone east of UTC, turning 06/14 into 06/13.
 */
function normaliseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Report exports end with total and subtotal lines, which are not transactions. */
const SUMMARY_ROW = /^(total|subtotal|grand total|balance|beginning balance|ending balance)\b/i;

export function parseTransactionCsv(text: string): CsvTxn[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // QuickBooks reports often carry title rows before the real header, so use
  // the first row that looks like a header.
  let headerRow = 0;
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const cells = splitLine(lines[i]).map((c) => c.toLowerCase());
    if (indexOfHeader(cells, AMOUNT_KEYS) !== -1 && indexOfHeader(cells, DATE_KEYS) !== -1) {
      headerRow = i;
      break;
    }
  }

  const headers = splitLine(lines[headerRow]).map((h) => h.toLowerCase());
  const iDate = indexOfHeader(headers, DATE_KEYS);
  const iPayee = indexOfHeader(headers, PAYEE_KEYS);
  const iDesc = indexOfHeader(headers, DESC_KEYS);
  const iAmount = indexOfHeader(headers, AMOUNT_KEYS);

  if (iAmount === -1 && iDesc === -1 && iPayee === -1) {
    throw new Error("Could not find a description or amount column in that CSV.");
  }

  const out: CsvTxn[] = [];
  for (const line of lines.slice(headerRow + 1)) {
    const cells = splitLine(line);
    if (cells.every((c) => c === "")) continue;

    // Drop total and subtotal lines, which otherwise import as transactions.
    if (cells.some((c) => SUMMARY_ROW.test(c))) continue;

    const rawDate = iDate === -1 ? "" : (cells[iDate] ?? "");
    const date = normaliseDate(rawDate);
    // A non-empty date that will not parse means a section or summary line.
    if (rawDate && !date) continue;

    const row: CsvTxn = {
      date,
      payee: iPayee === -1 ? null : (cells[iPayee] || null),
      description: iDesc === -1 ? null : (cells[iDesc] || null),
      amount: iAmount === -1 ? null : parseAmount(cells[iAmount]),
    };
    // A row with nothing identifying is a spacer, not a transaction.
    if (!row.payee && !row.description && row.amount == null) continue;
    out.push(row);
  }
  return out;
}
