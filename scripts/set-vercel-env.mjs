// Upserts RuledOff env vars into the Vercel "ruledoff" project (deja-opss team).
// Values are read from process.env (via --env-file) and never printed.
const token = process.env.VERCEL_API_TOKEN;
const H = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
const api = "https://api.vercel.com";
const PROD_URL = "https://ruledoff-deja-opss.vercel.app";

const VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "CRON_SECRET",
  "QBO_CLIENT_ID",
  "QBO_CLIENT_SECRET",
  "QBO_ENVIRONMENT",
];

async function main() {
  const teamsRes = await fetch(api + "/v2/teams", { headers: H });
  const teams = (await teamsRes.json()).teams || [];
  const team = teams.find((t) => t.slug === "deja-opss") || teams[0];
  if (!team) throw new Error("deja-opss team not found");
  const teamId = team.id;

  const projRes = await fetch(`${api}/v9/projects/ruledoff?teamId=${teamId}`, { headers: H });
  if (!projRes.ok) throw new Error("project 'ruledoff' not found: " + projRes.status);
  const projectId = (await projRes.json()).id;

  const body = VARS.filter((k) => process.env[k]).map((key) => ({
    key,
    value: process.env[key],
    type: "encrypted",
    target: ["production", "preview", "development"],
  }));
  // Magic links + QBO callback must point at the deployed domain, not localhost.
  body.push({ key: "NEXT_PUBLIC_APP_URL", value: PROD_URL, type: "encrypted", target: ["production", "preview"] });
  body.push({ key: "QBO_REDIRECT_URI", value: PROD_URL + "/api/qbo/callback", type: "encrypted", target: ["production", "preview"] });

  const res = await fetch(`${api}/v10/projects/${projectId}/env?teamId=${teamId}&upsert=true`, {
    method: "POST",
    headers: H,
    body: JSON.stringify(body),
  });
  const out = await res.json();
  if (!res.ok) throw new Error("env upsert failed: " + JSON.stringify(out).slice(0, 300));

  console.log(`Set ${body.length} env vars on deja-opss/ruledoff (${projectId}).`);
  console.log("Keys:", body.map((b) => b.key).join(", "));
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
