/**
 * Apply the SQL migrations in supabase/migrations/ to the Postgres database in
 * DATABASE_URL. Idempotent (the SQL uses IF NOT EXISTS / drop-and-create).
 *   npm run migrate
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in the environment (.env.local).");
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf8");
    process.stdout.write(`Applying ${f} … `);
    await client.query(sql);
    console.log("ok");
  }
  console.log("\nAll migrations applied.");
} catch (e) {
  console.error("\nMigration failed:", e.message ?? e);
  process.exitCode = 1;
} finally {
  await client.end();
}
