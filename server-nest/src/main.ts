import { createApp } from "./bootstrap";

/** Local dev only. Vercel uses api/index.ts and never calls listen(). */
async function main() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API on http://localhost:${port}/api (docs at /api/docs)`);
}
void main();
