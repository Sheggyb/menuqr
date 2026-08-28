export default function AppLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <style>{`
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
      <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ height: 44, borderRadius: "var(--radius-lg)", background: "var(--surface-2)", animation: "pulse-soft 1.4s ease-in-out infinite" }} />
        <div style={{ display: "flex", gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, height: 90, borderRadius: "var(--radius-lg)", background: "var(--surface-2)", animation: "pulse-soft 1.4s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <div style={{ height: 200, borderRadius: "var(--radius-lg)", background: "var(--surface-2)", animation: "pulse-soft 1.4s ease-in-out infinite", animationDelay: "0.3s" }} />
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", margin: 0 }}>Loading your dashboard…</p>
    </div>
  );
}
