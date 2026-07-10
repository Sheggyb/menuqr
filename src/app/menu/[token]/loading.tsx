export default function GuestMenuLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: 560, margin: "0 auto" }}>
      <style>{`
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
      {/* Header — accent-edged serif title line */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--border)", animation: "pulse-soft 1.4s ease-in-out infinite" }}>
        <div style={{ borderLeft: "2px solid var(--surface-3)", paddingLeft: 14 }}>
          <div style={{ height: 20, width: "50%", borderRadius: 6, background: "var(--surface-3)" }} />
          <div style={{ height: 10, width: "25%", borderRadius: 5, background: "var(--surface-2)", marginTop: 9 }} />
        </div>
      </div>
      {/* Category tab row */}
      <div style={{ display: "flex", gap: 22, padding: "18px 20px 10px", borderBottom: "1px solid var(--border)" }}>
        {[56, 72, 48, 64].map((w, i) => (
          <div key={i} style={{ height: 11, width: w, borderRadius: 4, background: "var(--surface-2)", animation: "pulse-soft 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      {/* Item cards */}
      <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "pulse-soft 1.4s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ height: 14, width: "55%", borderRadius: 5, background: "var(--surface-2)" }} />
                <div style={{ height: 22, width: 58, borderRadius: 99, background: "var(--surface-2)", flexShrink: 0 }} />
              </div>
              <div style={{ height: 11, width: "80%", borderRadius: 5, background: "var(--surface-2)", marginTop: 10 }} />
            </div>
            <div style={{ width: 62, height: 33, borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface-2)", flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
