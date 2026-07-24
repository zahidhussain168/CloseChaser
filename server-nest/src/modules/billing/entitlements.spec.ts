import { describe, expect, it } from "vitest";
import { can, effectiveTier, entitlementsFor, normaliseStatus } from "./entitlements";
import { verifyPaddleSignature } from "./paddle-signature";
import { createHmac } from "crypto";

const now = new Date("2026-07-24T12:00:00Z");
const future = new Date("2026-08-10T00:00:00Z");
const past = new Date("2026-07-01T00:00:00Z");

describe("effectiveTier", () => {
  it("gives a live trial the full Scale experience", () => {
    expect(effectiveTier(null, "trialing", future, now)).toBe("scale");
  });

  it("drops an expired trial to free even if the row still says trialing", () => {
    expect(effectiveTier(null, "trialing", past, now)).toBe("free");
  });

  it("honours the purchased plan while active", () => {
    expect(effectiveTier("pro", "active", null, now)).toBe("pro");
    expect(effectiveTier("scale", "active", null, now)).toBe("scale");
  });

  it("keeps access while a payment is merely past due", () => {
    // A failed card is retryable. Locking someone out mid-close turns a
    // billing hiccup into a cancellation.
    expect(effectiveTier("scale", "past_due", null, now)).toBe("scale");
  });

  it("drops to free when the subscription is paused or gone", () => {
    for (const s of ["paused", "canceled", "expired", null, undefined]) {
      expect(effectiveTier("scale", s, null, now)).toBe("free");
    }
  });

  it("never invents a tier from a plan alone", () => {
    // plan says scale but nothing is paying for it
    expect(effectiveTier("scale", "canceled", null, now)).toBe("free");
  });
});

describe("feature gates", () => {
  it("puts the intelligence behind Scale", () => {
    expect(can("pro", "forecast")).toBe(false);
    expect(can("scale", "forecast")).toBe(true);
  });

  it("puts auto-escalating reminders behind Pro", () => {
    expect(can("free", "autoEscalatingReminders")).toBe(false);
    expect(can("pro", "autoEscalatingReminders")).toBe(true);
    expect(can("scale", "autoEscalatingReminders")).toBe(true);
  });

  it("gives free nothing gated, and scale everything", () => {
    expect(Object.values(entitlementsFor("free")).some(Boolean)).toBe(false);
    expect(Object.values(entitlementsFor("scale")).every(Boolean)).toBe(true);
  });
});

describe("normaliseStatus", () => {
  it("passes through what Paddle really sends", () => {
    expect(normaliseStatus("active")).toBe("active");
    expect(normaliseStatus("past_due")).toBe("past_due");
  });

  it("treats anything unrecognised as expired rather than as access", () => {
    expect(normaliseStatus("something_new")).toBe("expired");
    expect(normaliseStatus(null)).toBe("expired");
  });
});

describe("paddle signature", () => {
  const secret = "pdl_ntfset_test";
  const body = JSON.stringify({ event_id: "evt_1" });
  const sign = (ts: number, b = body, s = secret) =>
    `ts=${ts};h1=${createHmac("sha256", s).update(`${ts}:${b}`).digest("hex")}`;
  const ts = Math.floor(now.getTime() / 1000);

  it("accepts a genuine signature", () => {
    expect(verifyPaddleSignature(body, sign(ts), secret, now)).toEqual({ ok: true });
  });

  it("refuses when the secret is unset, rather than allowing everything", () => {
    expect(verifyPaddleSignature(body, sign(ts), undefined, now).ok).toBe(false);
  });

  it("refuses a body that was altered after signing", () => {
    const tampered = JSON.stringify({ event_id: "evt_1", data: { status: "active" } });
    expect(verifyPaddleSignature(tampered, sign(ts), secret, now).ok).toBe(false);
  });

  it("refuses a signature from a different secret", () => {
    expect(verifyPaddleSignature(body, sign(ts, body, "wrong"), secret, now).ok).toBe(false);
  });

  it("refuses a replayed signature once it is stale", () => {
    const old = ts - 3600;
    const r = verifyPaddleSignature(body, sign(old), secret, now);
    expect(r).toEqual({ ok: false, reason: "signature is stale" });
  });

  it("refuses missing or malformed headers", () => {
    expect(verifyPaddleSignature(body, null, secret, now).ok).toBe(false);
    expect(verifyPaddleSignature(body, "garbage", secret, now).ok).toBe(false);
    expect(verifyPaddleSignature(body, `ts=${ts}`, secret, now).ok).toBe(false);
  });
});
