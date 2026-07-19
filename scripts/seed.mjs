/**
 * Seed realistic demo data for RuledOff Phase 1.
 * Run:  npm run seed   (loads .env.local via --env-file)
 *
 * Creates a demo bookkeeper you can sign in as, a handful of clients with
 * close checklists in varied states, magic links, and some sent reminders.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const db = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAIL = "demo@ruledoff.test";
const DEMO_PASSWORD = "ruledoff-demo-2026";

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}
function token() {
  return randomBytes(32).toString("base64url");
}
function expiry() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString();
}

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function ensureDemoUser() {
  const existing = await findUserByEmail(DEMO_EMAIL);
  if (existing) return existing;
  const { data, error } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { firm_name: "Sarah Chen Bookkeeping" },
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  console.log("Seeding RuledOff demo data…");
  const user = await ensureDemoUser();

  // Upsert the firm (owner_id is unique).
  const { data: firmRow, error: firmErr } = await db
    .from("firms")
    .upsert(
      {
        owner_id: user.id,
        name: "Sarah Chen Bookkeeping",
        accent_color: "#A88B4C",
        reply_to: "sarah@chenbooks.example",
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();
  if (firmErr) throw firmErr;
  const firmId = firmRow.id;

  // Reset: remove existing clients for a clean, deterministic seed (cascades).
  await db.from("clients").delete().eq("firm_id", firmId);

  const month = monthKey();

  // Upload a tiny placeholder so an "answered document" has a real file.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  );

  const clients = [
    {
      name: "Acme Coffee Roasters",
      email: "owner@acmecoffee.example",
      phone: "(555) 010-0142",
      qbo_realm_id: "9130000000001",
      status: "chasing",
      chaseDaysAgo: 6,
      items: [
        {
          type: "transaction",
          source: "qbo",
          title: "Uncategorized charge that needs a category",
          details: { amount: 128.4, date: "2026-06-14", payee: "Office Depot" },
          state: "nudged",
        },
        {
          type: "document",
          source: "manual",
          title: "June bank statement for the account ending 4821",
          details: {},
          state: "answered",
          withFile: true,
        },
        {
          type: "document",
          source: "manual",
          title: "W-9 for Bright Design Co.",
          details: { note: "Needed before we can 1099 them" },
          state: "requested",
        },
        {
          type: "transaction",
          source: "qbo",
          title: "Ask My Accountant: $2,300 transfer",
          details: { amount: 2300, date: "2026-06-02", payee: "Transfer" },
          state: "accepted",
          answer: "Owner draw. Move it to equity.",
        },
      ],
      reminders: [1, 2],
    },
    {
      name: "Harbor Yoga Studio",
      email: "hello@harboryoga.example",
      phone: "(555) 010-0199",
      qbo_realm_id: null,
      status: "open",
      items: [
        {
          type: "document",
          source: "manual",
          title: "May & June merchant statements (Square)",
          details: {},
          state: "requested",
        },
        {
          type: "document",
          source: "manual",
          title: "Receipt for the new mats, $412",
          details: { note: "The Amazon order on the 9th" },
          state: "requested",
        },
      ],
    },
    {
      name: "Nomad Web Studio",
      email: "accounts@nomadweb.example",
      phone: null,
      qbo_realm_id: "9130000000002",
      status: "chasing",
      chaseDaysAgo: 3,
      items: [
        {
          type: "transaction",
          source: "qbo",
          title: "Uncategorized recurring charge of $59.00",
          details: { amount: 59, date: "2026-06-20", payee: "SaaS vendor" },
          state: "answered",
          answer: "That's our Figma subscription. It's a software expense.",
        },
        {
          type: "document",
          source: "manual",
          title: "1099 contractor list for Q2",
          details: {},
          state: "nudged",
        },
      ],
      reminders: [1],
    },
    {
      name: "Green Thumb Landscaping",
      email: "cara@greenthumb.example",
      phone: "(555) 010-0111",
      qbo_realm_id: null,
      status: "closed",
      items: [
        {
          type: "document",
          source: "manual",
          title: "June fuel receipts",
          details: {},
          state: "accepted",
          answer: "Attached the bundle.",
        },
        {
          type: "transaction",
          source: "qbo",
          title: "Equipment purchase categorization",
          details: { amount: 1899.99, date: "2026-06-11", payee: "Home Depot" },
          state: "accepted",
          answer: "New mower. It's a fixed asset.",
        },
      ],
    },
  ];

  for (const c of clients) {
    const { data: clientRow, error: cErr } = await db
      .from("clients")
      .insert({
        firm_id: firmId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        qbo_realm_id: c.qbo_realm_id,
      })
      .select("*")
      .single();
    if (cErr) throw cErr;

    const { data: periodRow, error: pErr } = await db
      .from("close_periods")
      .insert({
        client_id: clientRow.id,
        month,
        status: c.status,
        chase_started_at: c.chaseDaysAgo ? daysAgo(c.chaseDaysAgo) : null,
      })
      .select("*")
      .single();
    if (pErr) throw pErr;

    for (const it of c.items) {
      let attachments = [];
      if (it.withFile) {
        const path = `${clientRow.id}/seed/${Date.now()}-june-statement.png`;
        await db.storage.from("attachments").upload(path, png, {
          contentType: "image/png",
          upsert: true,
        });
        attachments = [
          {
            path,
            name: "june-statement.png",
            size: png.length,
            mime: "image/png",
            uploaded_at: daysAgo(1),
          },
        ];
      }
      const answered = it.state === "answered" || it.state === "accepted";
      await db.from("items").insert({
        close_period_id: periodRow.id,
        type: it.type,
        source: it.source,
        title: it.title,
        details: it.details ?? {},
        state: it.state,
        answer_text: it.answer ?? null,
        attachments,
        answered_at: answered ? daysAgo(1) : null,
        accepted_at: it.state === "accepted" ? daysAgo(1) : null,
      });
    }

    // A magic link for every client.
    await db.from("magic_links").insert({
      client_id: clientRow.id,
      token: token(),
      expires_at: expiry(),
    });

    // Sent reminders, if any.
    for (const level of c.reminders ?? []) {
      await db.from("reminders").insert({
        client_id: clientRow.id,
        close_period_id: periodRow.id,
        level,
        channel: "email",
        scheduled_for: daysAgo(c.chaseDaysAgo - level),
        sent_at: daysAgo(c.chaseDaysAgo - level),
      });
    }
  }

  // Print the demo magic link for Acme so you can open the client view.
  const { data: acme } = await db
    .from("clients")
    .select("id")
    .eq("firm_id", firmId)
    .eq("name", "Acme Coffee Roasters")
    .single();
  const { data: link } = await db
    .from("magic_links")
    .select("token")
    .eq("client_id", acme.id)
    .single();

  console.log("\nDone.\n");
  console.log("Bookkeeper login:");
  console.log(`  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log("\nClient magic link (Acme Coffee Roasters):");
  console.log(`  ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/c/${link.token}`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
