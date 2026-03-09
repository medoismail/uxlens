import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "UXLens — AI-Powered UX Audit Tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
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
          background: "linear-gradient(135deg, #f0e6f6 0%, #d8c4e8 40%, #a678c8 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.92)",
            borderRadius: "28px",
            padding: "60px 80px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.12)",
            maxWidth: "900px",
          }}
        >
          {/* Logo badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#6d28d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              UX
            </div>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "#1a1a2e" }}>
              UXLens
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "#6d28d9",
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
              marginBottom: "20px",
            }}
          >
            9-Layer UX Diagnostic Engine
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: 400,
              color: "#4a4a6a",
              textAlign: "center" as const,
              lineHeight: 1.5,
              maxWidth: "700px",
            }}
          >
            Paste any URL. Get an instant AI-powered UX audit with conversion killers, trust scores, and actionable fixes.
          </div>

          {/* CTA pill */}
          <div
            style={{
              marginTop: "32px",
              background: "#6d28d9",
              color: "white",
              padding: "14px 36px",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Try Free at uxlens.pro
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
