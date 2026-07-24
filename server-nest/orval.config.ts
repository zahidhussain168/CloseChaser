import { defineConfig } from "orval";

/**
 * Generates a typed client into the Next.js app, so the frontend consumes the
 * API through types derived from the spec instead of hand-written shapes that
 * drift the moment an endpoint changes.
 *
 * Plain fetch functions rather than React Query hooks: this app renders on the
 * server and mutates through server actions, so hooks would mean converting
 * working server-rendered screens into client-fetched ones for no gain, and
 * would pull in a runtime dependency the app does not otherwise need.
 *
 *   npm run openapi && npx orval
 */
export default defineConfig({
  ruledoff: {
    input: "./openapi/openapi.json",
    output: {
      mode: "tags-split",
      target: "../src/lib/api/generated",
      client: "fetch",
      clean: true,
      prettier: false,
      override: {
        mutator: { path: "../src/lib/api/fetcher.ts", name: "apiFetcher" },
      },
    },
  },
});
