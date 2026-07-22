import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RuledOff: stop chasing clients, close the month faster";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Branded share card. Kept Satori-safe: every container is display:flex, text is
 * never mixed inline with elements, and no external fonts or raw SVG.
 */
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
          padding: 80,
          background: "linear-gradient(135deg, #FFFDF7 0%, #FFFFFF 55%, #F4F7FA 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 10,
              background: "#1E3A5F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            R
          </div>
          <div style={{ display: "flex", marginLeft: 20, fontSize: 44, fontWeight: 700, color: "#1E293B" }}>
            RuledOff
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 700, letterSpacing: "-0.03em", color: "#1E293B" }}>
            Close the month without
          </div>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 700, letterSpacing: "-0.03em", color: "#C49A2A" }}>
            chasing clients.
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 26, fontSize: 29, color: "#475569", maxWidth: 860 }}>
          RuledOff chases your client for every document and receipt blocking your month-end close. No logins, no portals.
        </div>

        <div style={{ display: "flex", marginTop: 40 }}>
          {["No-login portal", "QuickBooks sync", "Flat $39/mo"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                marginRight: 14,
                background: "#E8EEF5",
                color: "#1E3A5F",
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
