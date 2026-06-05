import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .btn-primary { display: inline-block; padding: 14px 32px; borderRadius: 10px; background: var(--accent); color: white; text-decoration: none; font-weight: 700; font-size: 17px; letter-spacing: -0.2px; transition: transform 0.1s, box-shadow 0.1s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,93,47,0.35); }
        .feature-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: box-shadow 0.2s, transform 0.2s; }
        .feature-card:hover { box-shadow: var(--shadow-float); transform: translateY(-2px); }
        .testimonial-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 800, fontSize: 22, color: "var(--accent)", letterSpacing: "-0.5px" }}>MenuQR</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>Log in</Link>
          <Link href="/signup" style={{ padding: "8px 18px", borderRadius: 8, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Get started free →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "80px 32px 60px", maxWidth: 700, margin: "0 auto" }}>
        <h1 style={{ fontSize: 52, fontWeight: 900, marginBottom: 20, lineHeight: 1.1, color: "var(--text)", letterSpacing: "-1px" }}>
          Digital menus &<br /><span style={{ color: "var(--accent)" }}>live table ordering</span><br />for your restaurant
        </h1>
        <p style={{ fontSize: 19, color: "var(--text-muted)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Guests scan a QR code at their table, browse your menu, and tap to order — no download, no login, no friction.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn-primary">Start free — it takes 2 minutes</Link>
          <Link href="#how" style={{ display: "inline-block", padding: "14px 24px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: 16 }}>See how it works</Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>Free forever • No credit card required</p>
      </section>

      {/* DEMO VISUAL */}
      <section style={{ maxWidth: 640, margin: "0 auto 60px", padding: "0 32px", textAlign: "center" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, boxShadow: "var(--shadow-card)" }}>
          {[["📱", "Guest scans QR"], ["🍽️", "Sees live menu"], ["⚡", "Staff gets alert"]].map(([icon, label]) => (
            <div key={label} style={{ background: "var(--surface-2)", borderRadius: 12, padding: "20px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 880, margin: "0 auto 60px", padding: "0 32px" }}>
        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.5px" }}>Up and running in minutes</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>No hardware. No complex setup. Just your menu, online.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            { step: "1", icon: "🏪", title: "Create your restaurant", text: "Sign up, add your restaurant name and logo. Takes 60 seconds." },
            { step: "2", icon: "🍽️", title: "Build your menu", text: "Add categories, items, descriptions, and prices. Update anytime." },
            { step: "3", icon: "📋", title: "Add tables & print QR", text: "Each table gets a unique QR code. Print and place at the table." },
            { step: "4", icon: "⚡", title: "Watch orders come in", text: "Live dashboard updates instantly. Mark done with one tap." },
          ].map((s) => (
            <div key={s.title} className="feature-card">
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#E85D2F", color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{s.step}</div>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: "var(--text)" }}>{s.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "60px 32px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 40, color: "var(--text)", letterSpacing: "-0.5px" }}>Everything you need, nothing you don&apos;t</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {[
              { icon: "📵", title: "No app needed", text: "Guests just scan — no download, no account, zero friction." },
              { icon: "⚡", title: "Real-time orders", text: "Requests appear on your dashboard the moment guests tap." },
              { icon: "🎨", title: "Branded experience", text: "Your restaurant colors and logo on every guest page." },
              { icon: "📊", title: "Analytics", text: "See daily trends, popular request types, and completion rates." },
              { icon: "🖨️", title: "Print-ready QR codes", text: "One click to print all QR codes formatted for your tables." },
              { icon: "🔄", title: "Live menu updates", text: "Change prices, add items — guests see it instantly." },
            ].map((b) => (
              <div key={b.title} className="feature-card" style={{ borderTop: "3px solid var(--accent)" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: "var(--accent)" }}>{b.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "60px 32px" }}>
        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.5px" }}>Simple pricing</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>One plan, everything included.</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { name: "Free", price: "0", period: "forever", color: "var(--text-muted)", features: ["1 restaurant", "Up to 10 tables", "Unlimited menu items", "Live orders dashboard", "QR code generation"] },
            { name: "Pro", price: "Coming soon", period: "", color: "var(--accent)", features: ["Unlimited tables", "Custom domain", "Analytics & reports", "Multi-language menus", "Priority support"] },
          ].map(plan => (
            <div key={plan.name} style={{ flex: "1 1 260px", background: "var(--surface)", border: `2px solid ${plan.color === "var(--accent)" ? "var(--accent)" : "var(--border)"}`, borderRadius: 20, padding: "28px 24px" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: plan.color, marginBottom: 4 }}>
                {plan.price === "0" ? "Free" : plan.price}
              </div>
              {plan.period && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{plan.period}</div>}
              <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 14, color: "var(--text)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {plan.name === "Free" ? (
                <Link href="/signup" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 10, background: "#E85D2F", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Get started free</Link>
              ) : (
                <div style={{ textAlign: "center", padding: "12px", borderRadius: 10, background: "var(--item-available-bg)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14 }}>Coming soon</div>
              )}
            </div>
          ))}
        </div>
      </section>



      {/* CTA */}
      <section style={{ background: "var(--accent)", padding: "60px 32px", textAlign: "center" }}>
        <h2 style={{ fontWeight: 900, fontSize: 36, color: "white", marginBottom: 12, letterSpacing: "-0.5px" }}>Ready to modernize your restaurant?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 17, marginBottom: 32 }}>Join restaurants already using MenuQR. Free to start, no credit card needed.</p>
        <Link href="/signup" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 12, background: "var(--surface)", color: "var(--accent)", textDecoration: "none", fontWeight: 800, fontSize: 18 }}>
          Create your menu now →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", padding: "32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Home</Link>
          <Link href="/login" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14 }}>Log in</Link>
          <Link href="/signup" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14 }}>Sign up</Link>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>© 2025 MenuQR — Digital menus for modern restaurants.</p>
      </footer>
    </main>
  );
}
