import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF8", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: 90, marginBottom: 8, animation: "float 3s ease-in-out infinite", display: "block" }}>🍽️</div>
        <div style={{ fontSize: 80, fontWeight: 900, color: "#E85D2F", lineHeight: 1, marginBottom: 8, letterSpacing: "-4px" }}>404</div>
        <h1 style={{ fontWeight: 800, fontSize: 26, marginBottom: 12, color: "#111827" }}>This page doesn&apos;t exist</h1>
        <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 32, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 32px" }}>
          The QR code might be outdated, the table may no longer exist, or you took a wrong turn.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 10, background: "#E85D2F", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15, boxShadow: "0 2px 10px rgba(232,93,47,0.3)" }}>
            ← Go to MenuQR
          </Link>
          <Link href="/login" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 10, border: "1px solid #e5e7eb", color: "#374151", textDecoration: "none", fontWeight: 600, fontSize: 15, background: "white" }}>
            Log in
          </Link>
        </div>
        <p style={{ marginTop: 24, fontSize: 13, color: "#d1d5db" }}>Ask your server for a fresh QR code</p>
      </div>
    </div>
  );
}
