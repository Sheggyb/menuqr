"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (rememberMe) {
        try { localStorage.setItem("menuqr_remember_email", email); } catch { /* ignore */ }
      } else {
        try { localStorage.removeItem("menuqr_remember_email"); } catch { /* ignore */ }
      }
      router.push(searchParams.get("redirectTo") || "/app");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "Inter, system-ui, sans-serif", padding: 16 }}>
      <style>{`
        * { box-sizing: border-box; }
        .login-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; borderRadius: 10px; fontSize: 15px; outline: none; transition: border-color 0.15s; fontFamily: inherit; }
        .login-input:focus { border-color: #E85D2F; box-shadow: 0 0 0 3px rgba(232,93,47,0.12); }
      `}</style>

      {/* Background decorations */}
      <div style={{ position: "fixed", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(232,93,47,0.07)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(232,93,47,0.05)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid var(--border)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#E85D2F", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>🍽️</div>
          <div style={{ fontWeight: 900, fontSize: 26, color: "#E85D2F", letterSpacing: "-0.5px", marginBottom: 4 }}>MenuQR</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Welcome back! Log in to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Email address</label>
            <input
              className="login-input"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", color: "var(--text)" }}>Password</label>
            <input
              className="login-input"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "inherit" }}
            />
          </div>
          {error && (
            <div style={{ padding: "10px 14px", background: "var(--card-bill-bg)", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#E85D2F", cursor: "pointer" }} />
            Remember me
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#E85D2F", color: "white", border: "none", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 15, opacity: loading ? 0.75 : 1, transition: "opacity 0.15s", marginTop: 4 }}
          >
            {loading ? "Logging in…" : "Log in →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
          No account yet?{" "}
          <Link href="/signup" style={{ color: "#E85D2F", fontWeight: 700, textDecoration: "none" }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
