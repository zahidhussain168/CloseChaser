import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import * as Sentry from "@sentry/node";
import { AppModule } from "./app.module";

/**
 * One place that builds the app, shared by the local server and the Vercel
 * handler so the two can never drift apart.
 */
export async function createApp(): Promise<INestApplication> {
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Everything under /api so one Vercel rewrite can own the whole surface.
  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown keys
      forbidNonWhitelisted: true, // and reject if the caller sent them
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("RuledOff API")
    .setDescription("Backend for the month-end close chaser")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bookkeeper")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "portal")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  return app;
}

export async function buildOpenApiDocument() {
  const app = await createApp();
  await app.init();
  const config = new DocumentBuilder()
    .setTitle("RuledOff API")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bookkeeper")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "portal")
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  await app.close();
  return doc;
}
