import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "POTAL - Total Landed Cost API for Cross-Border Commerce";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #02122c 0%, #0a2540 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: 16,
            display: "flex",
          }}
        >
          <span>P</span>
          <span style={{ color: "#F59E0B" }}>O</span>
          <span>TAL</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            marginBottom: 40,
          }}
        >
          Total Landed Cost API for Global Commerce
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {["139 Countries", "AI HS Code", "Duties & Taxes", "FTA Detection", "Shopify App"].map(
            (name) => (
              <div
                key={name}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#F59E0B",
                  fontSize: 18,
                }}
              >
                {name}
              </div>
            )
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 50,
            background: "linear-gradient(90deg, #F59E0B, #D97706)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          potal.app — Calculate duties, taxes & shipping in real-time
        </div>
      </div>
    ),
    { ...size }
  );
}
