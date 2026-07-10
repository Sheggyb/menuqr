export default function GuestMenuLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: 560, margin: "0 auto" }}>
      <style>{`
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
      {/* Header bar */}
      <div style={{ background: "var(--surface-2)", padding: "28px 20px 22px", animation: "pulse-soft 1.4s ease-in-out infinite" }}>
        <div style={{ height: 22, width: "55%", borderRadius: 8, background: "var(--surface-3)" }} />
        <div style={{ height: 13, width: "35%", borderRadius: 6, background: "var(--surface-3)", marginTop: 10 }} />
      </div>
      {/* Category pills */}
      <div style={{ display: "flex", gap: 8, padding: "14px 16px 6px" }}>
        {[70, 90, 60, 80].map((w, i) => (
          <div key={i} style={{ height: 30, width: w, borderRadius: 99, background: "var(--surface-2)", animation: "pulse-soft 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      {/* Item rows */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, animation: "pulse-soft 1.4s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 15, width: "60%", borderRadius: 6, background: "var(--surface-2)" }} />
              <div style={{ height: 12, width: "85%", borderRadius: 6, background: "var(--surface-2)", marginTop: 8 }} />
              <div style={{ height: 14, width: 60, borderRadius: 6, background: "var(--surface-2)", marginTop: 8 }} />
            </div>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--surface-2)", flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
