import { createApp } from "../src/app";

/**
 * Vercel serverless entry. Vercel invokes the exported Express app as the
 * request handler; app.listen() (in src/index.ts) is only used for a standalone
 * Node process. A catch-all rewrite (vercel.json) sends every path here.
 */
export default createApp();
