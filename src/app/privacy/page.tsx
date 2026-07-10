import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MenuQR collects, uses and protects your data.",
};

const h2: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: "var(--text)", marginTop: 36, marginBottom: 10, letterSpacing: "-0.3px" };
const p: React.CSSProperties = { color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, margin: "0 0 12px" };
const li: React.CSSProperties = { color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, marginBottom: 6 };

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "var(--accent)", textDecoration: "none", letterSpacing: "-0.5px" }}>MenuQR</Link>
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>← Back to home</Link>
      </nav>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.8px" }}>Privacy Policy</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32 }}>Last updated: July 2026</p>

        <p style={p}>
          MenuQR (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides digital menus and table ordering for restaurants. This policy explains what
          personal data we collect, why we collect it, and the choices you have. We aim to collect the minimum data needed
          to run the service.
        </p>

        <h2 style={h2}>1. Data we collect</h2>
        <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
          <li style={li}><strong style={{ color: "var(--text)" }}>Account data</strong> — your name and email address when you create an account, plus your password (stored only as a secure hash by our authentication provider).</li>
          <li style={li}><strong style={{ color: "var(--text)" }}>Restaurant content</strong> — restaurant names, menus, items, prices, table names and related settings you enter into the product.</li>
          <li style={li}><strong style={{ color: "var(--text)" }}>Guest order events</strong> — when a guest scans a QR code and places an order or request, we record the table, the items or request type, any note the guest adds, and a timestamp. Guests do not create accounts and we do not ask guests for names, emails or phone numbers.</li>
          <li style={li}><strong style={{ color: "var(--text)" }}>Technical data</strong> — basic logs (such as IP address and browser type) needed for security and to keep the service running.</li>
        </ul>

        <h2 style={h2}>2. How we use data</h2>
        <p style={p}>
          We use this data to provide the service: authenticating you, displaying your menu to guests, delivering orders to your
          dashboard, showing you analytics about your own restaurant, and communicating with you about your account. We do not
          sell personal data, and we do not use your restaurant content or guest data for advertising.
        </p>

        <h2 style={h2}>3. Where data is stored</h2>
        <p style={p}>
          MenuQR is built on Supabase, which acts as our data processor and hosts our database and authentication. Data is stored
          on Supabase infrastructure and protected with encryption in transit and at rest. We have a data processing agreement in
          place with our processors as required by the GDPR.
        </p>

        <h2 style={h2}>4. Legal basis (EU/EEA)</h2>
        <p style={p}>
          For users in the EU/EEA, we process account and restaurant data to perform our contract with you, and technical log data
          on the basis of our legitimate interest in keeping the service secure. Guest order events are processed on behalf of the
          restaurant, which acts as the data controller for its guests.
        </p>

        <h2 style={h2}>5. Retention</h2>
        <p style={p}>
          We keep your data for as long as your account is active. If you delete your account, your account data and restaurant
          content are deleted within 30 days, except where we must retain records to comply with law. Guest order events are kept
          only as long as needed to provide order history and analytics to the restaurant.
        </p>

        <h2 style={h2}>6. Your rights</h2>
        <p style={p}>
          You can access, correct, export or delete your personal data. EU/EEA users additionally have the rights to restrict or
          object to processing and to lodge a complaint with a supervisory authority. To exercise any of these rights, contact us
          at <a href="mailto:hello@menuqr.app" style={{ color: "var(--accent)" }}>hello@menuqr.app</a>.
        </p>

        <h2 style={h2}>7. Cookies</h2>
        <p style={p}>
          We use only cookies that are strictly necessary for the service to work, such as keeping you signed in. We do not use
          third-party advertising or tracking cookies.
        </p>

        <h2 style={h2}>8. Changes</h2>
        <p style={p}>
          If we make material changes to this policy, we will notify account holders by email or through the dashboard before the
          changes take effect.
        </p>

        <h2 style={h2}>9. Contact</h2>
        <p style={p}>
          Questions about privacy? Email us at <a href="mailto:hello@menuqr.app" style={{ color: "var(--accent)" }}>hello@menuqr.app</a>.
        </p>
      </article>
    </main>
  );
}
