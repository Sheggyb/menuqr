"use client";
import { IconAlert } from "@/components/icons";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "36px 28px" }}>
        <div aria-hidden="true" style={{ marginBottom: 14, color: "var(--warning)" }}><IconAlert width={42} height={42} /></div>
        <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 10, color: "var(--text)" }}>Something went wrong</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          We couldn&apos;t load this part of the dashboard. Try again, or head back to the overview.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            style={{ padding: "11px 24px", borderRadius: 10, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}
          >
            Try again
          </button>
          <a
            href="/app"
            style={{ display: "inline-block", padding: "11px 20px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
