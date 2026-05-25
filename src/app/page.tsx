import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>MenuQR</span>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 500 }}>Log in</Link>
          <Link href="/signup" style={{ padding: "8px 16px", borderRadius: 8, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 600 }}>Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "80px 32px 40px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🍽️</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
          Every table gets<br />a <span style={{ color: "var(--accent)" }}>QR code</span>
        </h1>
        <p style={{ fontSize: 20, color: "var(--text-muted)", maxWidth: 540, margin: "0 auto 32px" }}>
          Guests scan → see your live menu → tap to order, ask for refills, or signal the waiter.
          You see it all on your dashboard in real time.
        </p>
        <Link href="/signup" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 10, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
          Start for free →
        </Link>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 800, margin: "40px auto", padding: "0 32px" }}>
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            { icon: "🏪", title: "Create your restaurant", text: "Add your name, menu items, categories and prices." },
            { icon: "🪑", title: "Add your tables", text: "Each table gets a unique QR code — print and laminate it." },
            { icon: "📱", title: "Guests scan & order", text: "No app needed. Just scan, browse, and tap to request." },
            { icon: "⚡", title: "You see it live", text: "Dashboard updates instantly. Mark requests done with one tap." },
          ].map((s) => (
            <div key={s.title} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "40px 32px", color: "var(--text-muted)", fontSize: 13 }}>
        MenuQR — Built for restaurants of all sizes. Free to start.
      </footer>
    </main>
  );
}
