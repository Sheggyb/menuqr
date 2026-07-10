import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MenuQR — QR code menus & live table orders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #E85D2F 0%, #C2481F 60%, #9A3412 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 32,
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.35)",
            fontSize: 64,
            marginBottom: 40,
          }}
        >
          🍽️
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, color: "white", letterSpacing: -3 }}>
          MenuQR
        </div>
        <div style={{ fontSize: 34, color: "rgba(255,255,255,0.9)", marginTop: 20 }}>
          QR code menus &amp; live table orders
        </div>
      </div>
    ),
    { ...size }
  );
}
