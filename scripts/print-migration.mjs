/**
 * Prints the Phase 1 migration SQL so you can paste it into the Supabase
 * SQL editor (Dashboard → SQL → New query → paste → Run).
 *   node scripts/print-migration.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  process.stdout.write(readFileSync(join(dir, f), "utf8"));
  process.stdout.write("\n");
}
