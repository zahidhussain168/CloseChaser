/**
 * Copy guard: fails if an em dash (U+2014) or en dash (U+2013) appears anywhere
 * in user-facing code (src UI + email templates + seed data). Wired into the
 * build and the QA step so banned dashes can never reach rendered UI text.
 *   npm run check:copy
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src", "scripts/seed.mjs"];
const EXT = /\.(ts|tsx|mjs|js)$/;
const BAD = /[—–]/; // em dash, en dash

const files = [];
function walk(p) {
  let s;
  try {
    s = statSync(p);
  } catch {
    return;
  }
  if (s.isDirectory()) for (const e of readdirSync(p)) walk(join(p, e));
  else if (EXT.test(p)) files.push(p);
}
for (const r of ROOTS) walk(r);

const offenders = [];
for (const f of files) {
  readFileSync(f, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (BAD.test(line)) offenders.push(`${f}:${i + 1}: ${line.trim()}`);
    });
}

if (offenders.length) {
  console.error(
    `\nCopy check FAILED: em/en dash found in ${offenders.length} place(s).`,
  );
  console.error(
    "Rewrite naturally (period/comma/restructure), do not swap in a hyphen:\n",
  );
  offenders.forEach((o) => console.error("  " + o));
  process.exit(1);
}
console.log(`Copy check passed: no em/en dashes across ${files.length} files.`);
