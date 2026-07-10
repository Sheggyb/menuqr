import Link from "next/link";

const features = [
  { icon: "⚡", title: "Live orders", text: "Guest requests appear on your dashboard the moment they tap — no refresh, no delay." },
  { icon: "🍽️", title: "Menu builder", text: "Categories, items, descriptions and prices. Edit anything and guests see it instantly." },
  { icon: "✅", title: "Guest approval", text: "Review and confirm incoming orders before they reach the kitchen." },
  { icon: "📊", title: "Analytics", text: "Daily trends, popular items and completion rates at a glance." },
  { icon: "🌙", title: "Dark mode", text: "The dashboard and guest menu adapt to light or dark automatically." },
  { icon: "💱", title: "Multi-currency", text: "Show prices in SEK, EUR, USD or the currency your guests expect." },
];

const steps = [
  { step: "1", title: "Create your menu", text: "Sign up, add your restaurant, and build your menu with categories, items and prices." },
  { step: "2", title: "Print QR codes", text: "Every table gets its own QR code. Print them in one click and place them on the tables." },
  { step: "3", title: "Receive orders live", text: "Guests scan, browse and order from their phone. Orders land on your dashboard in real time." },
];

const faqs = [
  { q: "Do guests need to download an app?", a: "No. Guests scan the QR code with their phone camera and the menu opens in the browser. No download, no account, no login." },
  { q: "Do I need any special hardware?", a: "No. You need a printer for the QR codes and any device with a browser (phone, tablet or laptop) to watch orders come in." },
  { q: "How do orders arrive?", a: "Orders appear live on your MenuQR dashboard as guests place them. You can approve, track and mark them done with one tap." },
  { q: "Can I edit my menu anytime?", a: "Yes. Change items, prices, descriptions or availability whenever you like — guests always see the latest version instantly." },
  { q: "Is it really free?", a: "Yes. The Free plan includes your restaurant, tables, unlimited menu items, QR codes and the live orders dashboard. No credit card required." },
  { q: "Can I use it for multiple locations?", a: "The Free plan covers one restaurant today. Support for multiple locations is planned for the upcoming Pro plan." },
];

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .btn-hero { display: inline-block; padding: 14px 32px; border-radius: 10px; background: var(--accent); color: white; text-decoration: none; font-weight: 700; font-size: 17px; letter-spacing: -0.2px; transition: transform 0.1s, box-shadow 0.1s; }
        .btn-hero:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,93,47,0.35); }
        .btn-hero:focus-visible { outline: 3px solid rgba(232,93,47,0.4); outline-offset: 2px; }
        .feature-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: box-shadow 0.2s, transform 0.2s; }
        .feature-card:hover { box-shadow: var(--shadow-float); transform: translateY(-2px); }
        .faq-item { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; }
        .faq-item summary { cursor: pointer; font-weight: 600; font-size: 15px; color: var(--text); list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary::after { content: "+"; font-size: 20px; color: var(--text-muted); flex-shrink: 0; }
        .faq-item[open] summary::after { content: "−"; }
        .footer-link { color: var(--text-muted); text-decoration: none; font-size: 14px; }
        .footer-link:hover { color: var(--accent); }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 800, fontSize: 22, color: "var(--accent)", letterSpacing: "-0.5px" }}>MenuQR</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/login" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>Log in</Link>
          <Link href="/signup" style={{ padding: "8px 18px", borderRadius: 8, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "72px 32px 64px", display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ flex: "1 1 420px", maxWidth: 560 }}>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 900, marginTop: 0, marginBottom: 20, lineHeight: 1.1, color: "var(--text)", letterSpacing: "-1px" }}>
            Digital menus &amp; <span style={{ color: "var(--accent)" }}>live table ordering</span> for your restaurant
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-muted)", margin: "0 0 32px", lineHeight: 1.6, maxWidth: 480 }}>
            Guests scan a QR code at their table, browse your menu, and tap to order — no download, no login, no friction.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-hero">Start free</Link>
            <Link href="#how" style={{ display: "inline-block", padding: "14px 24px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: 16 }}>See how it works</Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>Free forever • No credit card</p>
        </div>

        {/* Phone mockup */}
        <div aria-hidden="true" style={{ flex: "0 0 auto", width: 260, borderRadius: 36, border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-float)", padding: 12 }}>
          <div style={{ borderRadius: 26, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)" }}>
            {/* Header bar */}
            <div style={{ background: "var(--accent)", padding: "18px 16px 14px" }}>
              <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>Café Solsken</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 }}>Table 4 · Menu</div>
            </div>
            {/* Category pills */}
            <div style={{ display: "flex", gap: 6, padding: "10px 12px 4px" }}>
              <span style={{ background: "var(--accent)", color: "white", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "4px 10px" }}>Mains</span>
              <span style={{ background: "var(--surface-2)", color: "var(--text-muted)", borderRadius: 99, fontSize: 10, fontWeight: 600, padding: "4px 10px" }}>Drinks</span>
              <span style={{ background: "var(--surface-2)", color: "var(--text-muted)", borderRadius: 99, fontSize: 10, fontWeight: 600, padding: "4px 10px" }}>Desserts</span>
            </div>
            {/* Item rows */}
            {[
              ["Grilled halloumi bowl", "129 kr"],
              ["Pasta al limone", "145 kr"],
              ["Smash burger & fries", "139 kr"],
            ].map(([name, price]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "8px 12px 0", padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{name}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>{price}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "white", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</div>
              </div>
            ))}
            {/* Order button */}
            <div style={{ padding: "14px 12px 16px" }}>
              <div style={{ background: "var(--accent)", color: "white", textAlign: "center", borderRadius: 99, padding: "9px 0", fontSize: 12, fontWeight: 700 }}>View Order · 2 items</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 880, margin: "0 auto", padding: "24px 32px 64px" }}>
        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.5px" }}>How it works</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>No hardware. No complex setup. Just your menu, online.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {steps.map((s) => (
            <div key={s.title} className="feature-card">
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{s.step}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: "var(--text)" }}>{s.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "64px 32px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 40, color: "var(--text)", letterSpacing: "-0.5px" }}>Everything you need, nothing you don&apos;t</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {features.map((f) => (
              <div key={f.title} className="feature-card" style={{ borderTop: "3px solid var(--accent)" }}>
                <div aria-hidden="true" style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: "var(--text)" }}>{f.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "64px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.5px" }}>Simple pricing</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>Start free. Upgrade later if you need more.</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ flex: "1 1 260px", background: "var(--bg)", border: "2px solid var(--accent)", borderRadius: 20, padding: "28px 24px" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", marginBottom: 6 }}>Free</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "var(--accent)", marginBottom: 4 }}>Free</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>forever</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {["1 restaurant", "Up to 10 tables", "Unlimited menu items", "Live orders dashboard", "QR code generation", "Analytics overview", "Dark mode & multi-currency"].map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "var(--text)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span aria-hidden="true" style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 10, background: "var(--accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Get started free</Link>
            </div>
            <div style={{ flex: "1 1 260px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 24px", opacity: 0.6 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", marginBottom: 6 }}>Pro</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-muted)", marginBottom: 4 }}>Coming soon</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Unlimited tables", "Multiple locations", "Custom domain", "Multi-language menus", "Priority support"].map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span aria-hidden="true" style={{ flexShrink: 0 }}>•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 720, margin: "0 auto", padding: "64px 32px" }}>
        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 40, color: "var(--text)", letterSpacing: "-0.5px" }}>Frequently asked questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, margin: "12px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--accent)", padding: "64px 32px", textAlign: "center" }}>
        <h2 style={{ fontWeight: 900, fontSize: "clamp(26px, 4.5vw, 36px)", color: "white", marginTop: 0, marginBottom: 12, letterSpacing: "-0.5px" }}>Ready to modernize your restaurant?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 17, marginBottom: 32 }}>Set up your menu tonight, take orders tomorrow. Free to start, no credit card needed.</p>
        <Link href="/signup" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 12, background: "white", color: "var(--accent)", textDecoration: "none", fontWeight: 800, fontSize: 18 }}>
          Create your menu now
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", padding: "48px 32px 32px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--accent)", marginBottom: 10 }}>MenuQR</div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>QR code menus and live table ordering for restaurants and cafés.</p>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Product</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/#how" className="footer-link">How it works</Link>
              <Link href="/#pricing" className="footer-link">Pricing</Link>
              <Link href="/#faq" className="footer-link">FAQ</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Account</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/login" className="footer-link">Log in</Link>
              <Link href="/signup" className="footer-link">Sign up</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Legal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-link">Terms of Service</Link>
              <a href="mailto:hello@menuqr.app" className="footer-link">hello@menuqr.app</a>
            </div>
          </div>
        </div>
        <p style={{ maxWidth: 880, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13 }}>© 2026 MenuQR. All rights reserved.</p>
      </footer>
    </main>
  );
}
