"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div aria-hidden="true" style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 10, color: "var(--text)" }}>Something went wrong</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          An unexpected error occurred. You can try again — if the problem keeps happening, please reload the page.
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: "12px 28px", borderRadius: 10, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
