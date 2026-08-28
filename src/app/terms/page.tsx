import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of MenuQR.",
};

const h2: React.CSSProperties = { fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--text)", marginTop: 36, marginBottom: 10, letterSpacing: "-0.3px" };
const p: React.CSSProperties = { color: "var(--text-muted)", fontSize: "var(--fs-md)", lineHeight: 1.7, margin: "0 0 12px" };

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "var(--fs-lg)", color: "var(--accent)", textDecoration: "none", letterSpacing: "-0.5px" }}>MenuQR</Link>
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "var(--fs-sm)", fontWeight: 500 }}>← Back to home</Link>
      </nav>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.8px" }}>Terms of Service</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", marginBottom: 32 }}>Last updated: July 2026</p>

        <p style={p}>
          These terms govern your use of MenuQR, a service that provides digital menus, QR codes and live table ordering for
          restaurants and cafés. By creating an account or using the service, you agree to these terms.
        </p>

        <h2 style={h2}>1. Your account</h2>
        <p style={p}>
          You must provide accurate information when signing up and keep your login credentials confidential. You are responsible
          for all activity that happens under your account. You must be at least 18 years old, or the age of legal majority in
          your jurisdiction, to create an account.
        </p>

        <h2 style={h2}>2. The service</h2>
        <p style={p}>
          MenuQR lets you build digital menus, generate QR codes for your tables, and receive guest orders and requests in a live
          dashboard. The Free plan is provided at no charge with the limits described on our pricing page. We may change, add or
          remove features over time; if a change materially reduces the service you rely on, we will give reasonable notice.
        </p>

        <h2 style={h2}>3. Your content</h2>
        <p style={p}>
          You retain all rights to the content you add — menus, item descriptions, prices, images and restaurant details. You
          grant us a limited license to host and display that content solely to operate the service (for example, showing your
          menu to guests who scan your QR codes). You are responsible for ensuring your content is accurate, lawful, and does not
          infringe anyone else&apos;s rights, including correct allergen and pricing information for your guests.
        </p>

        <h2 style={h2}>4. Acceptable use</h2>
        <p style={p}>
          You may not use MenuQR to break the law, mislead consumers, send spam, attempt to breach or overload our systems, or
          resell the service without our written permission. We may suspend or terminate accounts that violate these terms.
        </p>

        <h2 style={h2}>5. Orders and payments between you and your guests</h2>
        <p style={p}>
          MenuQR transmits guest orders and requests to your dashboard. We are not a party to the transaction between you and
          your guests, we do not process guest payments, and we are not responsible for the fulfilment, quality or pricing of
          anything you serve.
        </p>

        <h2 style={h2}>6. Availability and disclaimer</h2>
        <p style={p}>
          We work to keep the service available and reliable, but it is provided &ldquo;as is&rdquo; without warranties of any
          kind. We do not guarantee uninterrupted or error-free operation. To the maximum extent permitted by law, our total
          liability for any claim related to the service is limited to the amount you paid us in the twelve months before the
          claim arose (which for Free plan users is zero). Nothing in these terms limits liability that cannot be limited under
          applicable law.
        </p>

        <h2 style={h2}>7. Data protection</h2>
        <p style={p}>
          Our <Link href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</Link> describes how we handle personal
          data. For guest order data collected through your menus, you act as the data controller and we act as your processor
          under the GDPR.
        </p>

        <h2 style={h2}>8. Termination</h2>
        <p style={p}>
          You may stop using the service and delete your account at any time. We may suspend or terminate your account if you
          materially breach these terms, with notice where reasonably possible. Upon termination, your data is handled as
          described in the Privacy Policy.
        </p>

        <h2 style={h2}>9. Changes to these terms</h2>
        <p style={p}>
          We may update these terms from time to time. If a change is material, we will notify account holders by email or
          through the dashboard before it takes effect. Continued use of the service after a change means you accept the updated
          terms.
        </p>

        <h2 style={h2}>10. Contact</h2>
        <p style={p}>
          Questions about these terms? Email us at <a href="mailto:hello@menuqr.app" style={{ color: "var(--accent)" }}>hello@menuqr.app</a>.
        </p>
      </article>
    </main>
  );
}
