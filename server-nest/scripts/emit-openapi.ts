import { writeFileSync, mkdirSync } from "fs";
import { buildOpenApiDocument } from "../src/bootstrap";

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
