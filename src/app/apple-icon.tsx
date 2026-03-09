import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#6d28d9",
          borderRadius: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-2px",
          }}
        >
          UX
        </span>
      </div>
    ),
    { ...size }
  );
}
