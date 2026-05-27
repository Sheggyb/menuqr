     1|import Link from "next/link";
     2|
     3|export default function LandingPage() {
     4|  return (
     5|    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
     6|      <style>{`
     7|        * { box-sizing: border-box; }
     8|        .btn-primary { display: inline-block; padding: 14px 32px; borderRadius: 10px; background: #E85D2F; color: white; text-decoration: none; font-weight: 700; font-size: 17px; letter-spacing: -0.2px; transition: transform 0.1s, box-shadow 0.1s; }
     9|        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,93,47,0.35); }
    10|        .feature-card { background: white; border: 1px solid #f0f0ef; border-radius: 16px; padding: 24px; transition: box-shadow 0.2s, transform 0.2s; }
    11|        .feature-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }
    12|      `}</style>
    13|
    14|      {/* NAV */}
    15|      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "var(--surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
    16|        <span style={{ fontWeight: 800, fontSize: 22, color: "#E85D2F", letterSpacing: "-0.5px" }}>MenuQR</span>
    17|        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    18|          <Link href="/login" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>Log in</Link>
    19|          <Link href="/signup" style={{ padding: "8px 18px", borderRadius: 8, background: "#E85D2F", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Get started free →</Link>
    20|        </div>
    21|      </nav>
    22|
    23|      {/* HERO */}
    24|      <section style={{ textAlign: "center", padding: "80px 32px 60px", maxWidth: 700, margin: "0 auto" }}>
    25|        <div style={{ display: "inline-block", background: "#fff3ef", color: "#E85D2F", fontWeight: 700, fontSize: 13, padding: "4px 14px", borderRadius: 99, marginBottom: 20, border: "1px solid #fcd9cc" }}>
    26|          🚀 No app needed — works on any phone
    27|        </div>
    28|        <h1 style={{ fontSize: 52, fontWeight: 900, marginBottom: 20, lineHeight: 1.1, color: "var(--text)", letterSpacing: "-1px" }}>
    29|          Digital menus &<br /><span style={{ color: "#E85D2F" }}>live table ordering</span><br />for your restaurant
    30|        </h1>
    31|        <p style={{ fontSize: 19, color: "var(--text-muted)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6 }}>
    32|          Guests scan a QR code at their table, browse your menu, and tap to order — no download, no login, no friction.
    33|        </p>
    34|        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
    35|          <Link href="/signup" className="btn-primary">Start free — it takes 2 minutes</Link>
    36|          <Link href="#how" style={{ display: "inline-block", padding: "14px 24px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: 16 }}>See how it works</Link>
    37|        </div>
    38|        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>Free forever • No credit card required</p>
    39|      </section>
    40|
    41|      {/* DEMO VISUAL */}
    42|      <section style={{ maxWidth: 640, margin: "0 auto 60px", padding: "0 32px", textAlign: "center" }}>
    43|        <div style={{ background: "#E85D2F", color: "white", borderRadius: 20, padding: "28px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
    44|          {[["📱", "Guest scans QR"], ["🍽️", "Sees live menu"], ["⚡", "Staff gets alert"]].map(([icon, label]) => (
    45|            <div key={label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "16px 8px", textAlign: "center" }}>
    46|              <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
    47|              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{label}</div>
    48|            </div>
    49|          ))}
    50|        </div>
    51|      </section>
    52|
    53|      {/* HOW IT WORKS */}
    54|      <section id="how" style={{ maxWidth: 880, margin: "0 auto 60px", padding: "0 32px" }}>
    55|        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.5px" }}>Up and running in minutes</h2>
    56|        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>No hardware. No complex setup. Just your menu, online.</p>
    57|        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
    58|          {[
    59|            { step: "1", icon: "🏪", title: "Create your restaurant", text: "Sign up, add your restaurant name and logo. Takes 60 seconds." },
    60|            { step: "2", icon: "🍽️", title: "Build your menu", text: "Add categories, items, descriptions, and prices. Update anytime." },
    61|            { step: "3", icon: "📋", title: "Add tables & print QR", text: "Each table gets a unique QR code. Print and place at the table." },
    62|            { step: "4", icon: "⚡", title: "Watch orders come in", text: "Live dashboard updates instantly. Mark done with one tap." },
    63|          ].map((s) => (
    64|            <div key={s.title} className="feature-card">
    65|              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#E85D2F", color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{s.step}</div>
    66|              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
    67|              <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 16, color: "var(--text)" }}>{s.title}</h3>
    68|              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{s.text}</p>
    69|            </div>
    70|          ))}
    71|        </div>
    72|      </section>
    73|
    74|      {/* BENEFITS */}
    75|      <section style={{ background: "var(--surface)", borderTop: "1px solid #f0f0ef", borderBottom: "1px solid var(--border)", padding: "60px 32px" }}>
    76|        <div style={{ maxWidth: 880, margin: "0 auto" }}>
    77|          <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 40, color: "var(--text)", letterSpacing: "-0.5px" }}>Everything you need, nothing you don&apos;t</h2>
    78|          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
    79|            {[
    80|              { icon: "📵", title: "No app needed", text: "Guests just scan — no download, no account, zero friction." },
    81|              { icon: "⚡", title: "Real-time orders", text: "Requests appear on your dashboard the moment guests tap." },
    82|              { icon: "🎨", title: "Branded experience", text: "Your restaurant colors and logo on every guest page." },
    83|              { icon: "📊", title: "Analytics", text: "See daily trends, popular request types, and completion rates." },
    84|              { icon: "🖨️", title: "Print-ready QR codes", text: "One click to print all QR codes formatted for your tables." },
    85|              { icon: "🔄", title: "Live menu updates", text: "Change prices, add items — guests see it instantly." },
    86|            ].map((b) => (
    87|              <div key={b.title} className="feature-card" style={{ borderTop: "3px solid #E85D2F" }}>
    88|                <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
    89|                <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: "#E85D2F" }}>{b.title}</h3>
    90|                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{b.text}</p>
    91|              </div>
    92|            ))}
    93|          </div>
    94|        </div>
    95|      </section>
    96|
    97|      {/* PRICING */}
    98|      <section style={{ maxWidth: 720, margin: "0 auto", padding: "60px 32px" }}>
    99|        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.5px" }}>Simple pricing</h2>
   100|        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>One plan, everything included.</p>
   101|        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
   102|          {[
   103|            { name: "Free", price: "0", period: "forever", color: "var(--text-muted)", features: ["1 restaurant", "Up to 10 tables", "Unlimited menu items", "Live orders dashboard", "QR code generation"] },
   104|            { name: "Pro", price: "Coming soon", period: "", color: "#E85D2F", features: ["Unlimited tables", "Custom domain", "Analytics & reports", "Multi-language menus", "Priority support"] },
   105|          ].map(plan => (
   106|            <div key={plan.name} style={{ flex: "1 1 260px", background: "var(--surface)", border: `2px solid ${plan.color === "#E85D2F" ? "#E85D2F" : "#f0f0ef"}`, borderRadius: 20, padding: "28px 24px" }}>
   107|              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", marginBottom: 6 }}>{plan.name}</div>
   108|              <div style={{ fontSize: 36, fontWeight: 900, color: plan.color, marginBottom: 4 }}>
   109|                {plan.price === "0" ? "Free" : plan.price}
   110|              </div>
   111|              {plan.period && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{plan.period}</div>}
   112|              <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
   113|                {plan.features.map(f => (
   114|                  <li key={f} style={{ fontSize: 14, color: "var(--text)", display: "flex", gap: 8, alignItems: "flex-start" }}>
   115|                    <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
   116|                  </li>
   117|                ))}
   118|              </ul>
   119|              {plan.name === "Free" ? (
   120|                <Link href="/signup" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 10, background: "#E85D2F", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Get started free</Link>
   121|              ) : (
   122|                <div style={{ textAlign: "center", padding: "12px", borderRadius: 10, background: "var(--item-available-bg)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14 }}>Coming soon</div>
   123|              )}
   124|            </div>
   125|          ))}
   126|        </div>
   127|      </section>
   128|
   129|      {/* TESTIMONIALS */}
   130|      <section style={{ background: "#fff7f4", borderTop: "1px solid #fcd9cc", borderBottom: "1px solid #fcd9cc", padding: "60px 32px" }}>
   131|        <div style={{ maxWidth: 880, margin: "0 auto" }}>
   132|          <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.5px" }}>Loved by restaurant owners</h2>
   133|          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 40, fontSize: 16 }}>See what our users are saying</p>
   134|          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
   135|            {[
   136|              { quote: "We set it up in under 10 minutes. Our guests love scanning and ordering without waiting.", name: "Marco R.", role: "Café Owner, Milan" },
   137|              { quote: "The live orders board is fantastic. Staff know exactly what every table needs, instantly.", name: "Sofia K.", role: "Restaurant Manager, Stockholm" },
   138|              { quote: "No more 'excuse me!' — guests request refills and the bill right from their phone. Game changer.", name: "James T.", role: "Bar Owner, London" },
   139|            ].map((t, i) => (
   140|              <div key={i} style={{ background: "var(--surface)", borderRadius: 16, padding: "24px", border: "1px solid #fcd9cc", display: "flex", flexDirection: "column", gap: 16 }}>
   141|                <div style={{ fontSize: 24, color: "#E85D2F" }}>❝</div>
   142|                <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.6, margin: 0, flex: 1 }}>{t.quote}</p>
   143|                <div>
   144|                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{t.name}</div>
   145|                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.role}</div>
   146|                </div>
   147|              </div>
   148|            ))}
   149|          </div>
   150|        </div>
   151|      </section>
   152|
   153|      {/* CTA */}
   154|      <section style={{ background: "#E85D2F", padding: "60px 32px", textAlign: "center" }}>
   155|        <h2 style={{ fontWeight: 900, fontSize: 36, color: "white", marginBottom: 12, letterSpacing: "-0.5px" }}>Ready to modernize your restaurant?</h2>
   156|        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 17, marginBottom: 32 }}>Join restaurants already using MenuQR. Free to start, no credit card needed.</p>
   157|        <Link href="/signup" style={{ display: "inline-block", padding: "16px 40px", borderRadius: 12, background: "var(--surface)", color: "#E85D2F", textDecoration: "none", fontWeight: 800, fontSize: 18 }}>
   158|          Create your menu now →
   159|        </Link>
   160|      </section>
   161|
   162|      {/* FOOTER */}
   163|      <footer style={{ borderTop: "1px solid #f0f0ef", background: "var(--surface)", padding: "32px", textAlign: "center" }}>
   164|        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
   165|          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Home</Link>
   166|          <Link href="/login" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14 }}>Log in</Link>
   167|          <Link href="/signup" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14 }}>Sign up</Link>
   168|        </div>
   169|        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>© 2025 MenuQR — Digital menus for modern restaurants.</p>
   170|      </footer>
   171|    </main>
   172|  );
   173|}
   174|