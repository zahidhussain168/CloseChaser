import { writeFileSync, mkdirSync } from "fs";
import { buildOpenApiDocument } from "../src/bootstrap";

/**
 * Building the app instantiates the auth strategies, which insist on their
 * config being present. Emitting the spec needs no real secrets, so supply
 * throwaway placeholders when they are unset. This keeps `npm run openapi`
 * runnable without a live environment.
 */
const PLACEHOLDERS: Record<string, string> = {
  SUPABASE_URL: "https://placeholder.supabase.co",
  SUPABASE_JWT_SECRET: "placeholder",
  PORTAL_JWT_SECRET: "placeholder",
};
for (const [k, v] of Object.entries(PLACEHOLDERS)) if (!process.env[k]) process.env[k] = v;

/** Emits openapi.json for Orval to generate the typed frontend client from. */
async function main() {
  const doc = await buildOpenApiDocument();
  mkdirSync("openapi", { recursive: true });
  writeFileSync("openapi/openapi.json", JSON.stringify(doc, null, 2));
  // eslint-disable-next-line no-console
  console.log("wrote openapi/openapi.json");
  process.exit(0);
}
void main();
