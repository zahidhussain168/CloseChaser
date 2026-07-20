/**
 * Migration runner.
 *
 * The direct Postgres host in DATABASE_URL (db.<ref>.supabase.co) does not
 * resolve from every network, so this connects through the Supabase session
 * pooler instead, reusing the password from DATABASE_URL.
 *
 *   node --env-file=.env.local scripts/migrate.mjs            # apply pending
 *   node --env-file=.env.local scripts/migrate.mjs --status   # list only
 *   node --env-file=.env.local scripts/migrate.mjs --mark 0001_init.sql
 *
 * --mark records a migration as applied without running it, for migrations that
 * were already applied by hand before this runner existed.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const DIR = path.join(process.cwd(), "supabase", "migrations");
const REF = "ljgpvixnupaijzteesvl";
const POOLER = "aws-1-ap-northeast-2.pooler.supabase.com";

function client() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const password = new URL(process.env.DATABASE_URL).password;
  return new pg.Client({
    host: POOLER,
    port: 5432, // session mode: transaction mode cannot run all DDL
    user: `postgres.${REF}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
}

const args = process.argv.slice(2);
const statusOnly = args.includes("--status");
const markIndex = args.indexOf("--mark");
const toMark = markIndex === -1 ? [] : args.slice(markIndex + 1);

const c = client();
await c.connect();
await c.query(`
  create table if not exists public.schema_migrations (
    name       text primary key,
    applied_at timestamptz not null default now()
  )
`);

const { rows } = await c.query("select name from public.schema_migrations");
const applied = new Set(rows.map((r) => r.name));
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

if (toMark.length) {
  for (const name of toMark) {
    await c.query(
      "insert into public.schema_migrations (name) values ($1) on conflict do nothing",
      [name],
    );
    console.log(`marked as applied (not run): ${name}`);
  }
  await c.end();
  process.exit(0);
}

if (statusOnly) {
  for (const f of files) console.log(`${applied.has(f) ? "applied" : "PENDING"}  ${f}`);
  await c.end();
  process.exit(0);
}

const pending = files.filter((f) => !applied.has(f));
if (!pending.length) console.log("nothing pending");

for (const name of pending) {
  const sql = fs.readFileSync(path.join(DIR, name), "utf8");
  await c.query("begin");
  try {
    await c.query(sql);
    await c.query("insert into public.schema_migrations (name) values ($1)", [name]);
    await c.query("commit");
    console.log(`applied ${name}`);
  } catch (e) {
    await c.query("rollback");
    console.error(`FAILED ${name}: ${e.message}`);
    await c.end();
    process.exit(1);
  }
}

await c.end();
