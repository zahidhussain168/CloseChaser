/**
 * Vercel serverless entry.
 *
 * Deliberately plain JavaScript that loads the tsc-compiled app from dist.
 * Vercel bundles functions with esbuild, which does not emit the decorator
 * metadata Nest's dependency injection relies on, so compiling this file from
 * TypeScript here would produce an app that builds and then fails to resolve
 * a single provider at runtime.
 *
 * Nest is expensive to boot, so the app is built once per warm container and
 * the in-flight promise is cached, not just the resolved app: without that,
 * concurrent cold requests each start their own bootstrap and we pay for
 * several Nest apps, and several Prisma clients, in one container.
 */
const { createApp } = require("../dist/src/bootstrap");

let appPromise;

async function getExpress() {
  if (!appPromise) {
    appPromise = createApp().then(async (app) => {
      await app.init(); // init only: never listen() in serverless
      return app;
    });
  }
  const app = await appPromise;
  return app.getHttpAdapter().getInstance();
}

module.exports = async function handler(req, res) {
  const express = await getExpress();
  return express(req, res);
};
