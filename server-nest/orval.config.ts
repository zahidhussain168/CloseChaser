import { defineConfig } from "orval";

/**
 * Generates a typed client + React Query hooks into the Next.js app, so the
 * frontend consumes the API through generated types instead of hand-written
 * fetch calls.
 *   npm run openapi && npx orval
 */
export default defineConfig({
  ruledoff: {
    input: "./openapi/openapi.json",
    output: {
      mode: "tags-split",
      target: "../src/lib/api/generated",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        mutator: { path: "../src/lib/api/fetcher.ts", name: "apiFetcher" },
        query: { useQuery: true, useMutation: true },
      },
    },
  },
});
