"use client";
import { IconAlert } from "@/components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-body)", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div aria-hidden="true" style={{ marginBottom: 16, color: "var(--warning)" }}><IconAlert width={48} height={48} /></div>
        <h1 style={{ fontWeight: 800, fontSize: "var(--fs-xl)", marginBottom: 10, color: "var(--text)" }}>Something went wrong</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)", lineHeight: 1.6, marginBottom: 28 }}>
          An unexpected error occurred. You can try again — if the problem keeps happening, please reload the page.
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: "12px 28px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "var(--fs-md)" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
