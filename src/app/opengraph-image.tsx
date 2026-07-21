import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RuledOff: stop chasing clients, close the month faster";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share card, matching the live teal identity.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 55%, #ECFDF5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#0EA5E9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12.5 9.5 18 20 6.5"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#0F172A" }}>RuledOff</div>
        </div>

        <div
          style={{
            marginTop: 44,
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "#0F172A",
            maxWidth: 900,
          }}
        >
          Close the month without{" "}
          <span style={{ color: "#0EA5E9" }}>chasing clients</span>.
        </div>

        <div style={{ marginTop: 28, fontSize: 30, color: "#64748B", maxWidth: 820 }}>
          RuledOff chases your client for every document, receipt, and answer
          blocking your month-end close. No logins, no portals.
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: 14 }}>
          {["No-login client portal", "QuickBooks sync", "Flat $29/mo"].map((t) => (
            <div
              key={t}
              style={{
                background: "#E0F2FE",
                color: "#0369A1",
                padding: "10px 20px",
                borderRadius: 999,
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
