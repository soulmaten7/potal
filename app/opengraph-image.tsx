import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "POTAL - AI Shopping Comparison Agent";
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
          }}
        >
          POTAL
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            marginBottom: 40,
          }}
        >
          Global Best Price vs Local Fast Delivery
        </div>

        {/* Retailers */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {["Amazon", "Walmart", "eBay", "BestBuy", "Target", "AliExpress", "Temu"].map(
            (name) => (
              <div
                key={name}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  color: "#93c5fd",
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
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
          }}
        >
          AI-Powered Shopping Comparison Agent
        </div>
      </div>
    ),
    { ...size }
  );
}
