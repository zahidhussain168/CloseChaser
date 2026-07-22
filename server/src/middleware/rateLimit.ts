import rateLimit from "express-rate-limit";

const json = { error: "Too many requests, please slow down.", code: "rate_limited" };

/** Generous default for authenticated app traffic. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});

/** Tight limit for the public, unauthenticated magic-link portal routes. */
export const portalLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});

/** Very tight for auth (sign in / sign up) to blunt credential stuffing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});
