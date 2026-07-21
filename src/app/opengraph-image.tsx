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
          background: "linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 55%, #ECFDF5 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#0EA5E9",
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
          <div style={{ display: "flex", marginLeft: 20, fontSize: 44, fontWeight: 700, color: "#0F172A" }}>
            RuledOff
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>
            Close the month without
          </div>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 700, letterSpacing: "-0.03em", color: "#0EA5E9" }}>
            chasing clients.
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 26, fontSize: 29, color: "#64748B", maxWidth: 860 }}>
          RuledOff chases your client for every document and receipt blocking your month-end close. No logins, no portals.
        </div>

        <div style={{ display: "flex", marginTop: 40 }}>
          {["No-login portal", "QuickBooks sync", "Flat $29/mo"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                marginRight: 14,
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
