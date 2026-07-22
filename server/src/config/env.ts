import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Centralised, validated environment. Required values throw at boot so the
 * service fails fast rather than at the first request. Integration secrets
 * (QBO, Paddle, OpenRouter) are optional so the core API can run without them;
 * the relevant routes report 503 when their config is missing.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  APP_URL: z.string().url().default("http://localhost:3000"),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("onboarding@resend.dev"),
  RESEND_TEST_RECIPIENT: z.string().optional(),

  CRON_SECRET: z.string().optional(),

  QBO_CLIENT_ID: z.string().optional(),
  QBO_CLIENT_SECRET: z.string().optional(),
  QBO_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  QBO_REDIRECT_URI: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),

  PADDLE_API_KEY: z.string().optional(),
  PADDLE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  PADDLE_PRICE_ID: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("google/gemini-2.5-flash-lite"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${missing}`);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);

export const isProd = env.NODE_ENV === "production";
