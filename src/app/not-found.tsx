import Link from "next/link";
import { IconDish } from "@/components/icons";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-body)", padding: 24 }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div aria-hidden="true" style={{ marginBottom: 8, color: "var(--accent)", animation: "float 3s ease-in-out infinite", display: "flex", justifyContent: "center" }}><IconDish width={72} height={72} /></div>
        <div style={{ fontSize: 80, fontWeight: 900, color: "var(--accent)", lineHeight: 1, marginBottom: 8, letterSpacing: "-4px" }}>404</div>
        <h1 style={{ fontWeight: 800, fontSize: "var(--fs-xl)", marginBottom: 12, color: "var(--text)" }}>This page doesn&apos;t exist</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", marginBottom: 32, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 32px" }}>
          The QR code might be outdated, the table may no longer exist, or you took a wrong turn.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-block", padding: "12px 28px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-md)", boxShadow: "0 2px 10px color-mix(in srgb, var(--accent) 32%, transparent)" }}>
            ← Go to MenuQR
          </Link>
          <Link href="/login" style={{ display: "inline-block", padding: "12px 24px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: "var(--fs-md)", background: "var(--surface)" }}>
            Log in
          </Link>
        </div>
        <p style={{ marginTop: 24, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>Ask your server for a fresh QR code</p>
      </div>
    </div>
  );
}
