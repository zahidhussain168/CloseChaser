import type { IncomingMessage, ServerResponse } from "http";
import type { INestApplication } from "@nestjs/common";
import { createApp } from "../src/bootstrap";

/**
 * Vercel serverless entry.
 *
 * Nest is expensive to boot, so we build it ONCE per warm container and hand
 * Vercel the underlying Express instance on every later invocation. The
 * in-flight promise is cached too, not just the resolved app: without that,
 * concurrent cold requests each start their own bootstrap and we pay for
 * several Nest apps (and several Prisma clients) in one container.
 */
let appPromise: Promise<INestApplication> | undefined;

async function getHandler() {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.init(); // init only: never app.listen() in serverless
      return app;
    });
  }
  const app = await appPromise;
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const express = await getHandler();
  return express(req, res);
}
