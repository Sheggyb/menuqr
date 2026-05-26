import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Inter, sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🍽️</div>
        <h1 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>Table not found</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 28 }}>
          This QR code might be outdated or the table no longer exists.
          Ask your server for a new QR code.
        </p>
        <Link href="/" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 10, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 16 }}>
          Go to MenuQR home
        </Link>
      </div>
    </div>
  );
}
